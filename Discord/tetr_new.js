const Discord = require('discord.js');
const prettyMilliseconds = require('pretty-ms');

const tetrApi = require('./tetr/api');
const { Monitor } = require('./tetr/monitor');
const { logger } = require('./logger');

const cmdName = 'tetr2';

function hasAdmin(msg) {
  return msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
}

function splitMsg(msg) {
  return msg.content.split(/\s+/);
}

function logAndThrow(jobs, message) {
  const errors = jobs
    .filter((j) => j.status !== 'fulfilled')
    .map((j) => j.reason);
  errors.forEach((error) =>
    logger.error(`${message} ${error.message}`, { error })
  );
  if (errors.length) {
    throw new Error(message);
  }
  return jobs.filter((j) => j.status === 'fulfilled').map((j) => j.value);
}

async function help(bot, msg) {
  const vieriImg = new Discord.AttachmentBuilder('../viericorp.png');
  const str = `**^${cmdName} monitor <user>** - spy on <user>, you will get notified when they play ranked or achieve new pbs
**^${cmdName} refresh** - refreshes the spied users instantly
**^${cmdName} list** - lists the users being monitored
**^${cmdName} lb <gameMode> <country>** - shows the <gameMode> leaderboard for <country>, <gameMode> can be blitz or 40l
**^${cmdName} lb <gameMode> monitored** - shows the <gameMode> leaderboard for spied users, <gameMode> can be blitz or 40l
**^${cmdName} players <country>** - shows the number of players for <country>`;
  const strAdmin = `**^${cmdName} remove <user>** - remove <user> from monitor list
**^${cmdName} toggle <gameMode>** - disables/enables notification for <gameMode>, gameMode can be blitz, 40l, or ranked`;
  msg.channel.send({
    files: [vieriImg],
    embeds: [
      {
        color: 16764006,
        author: {
          name: 'Tetris',
          icon_url: 'attachment://viericorp.png',
        },
        title: 'help center',
        description: str,
        fields: [{ name: 'For admins only', value: strAdmin }],
        timestamp: new Date(),
        footer: {
          text: 'By Vieri Corp.™ All Rights Reserved',
        },
      },
    ],
  });
}

/**
 * @param {Monitor} m
 * @returns boolean
 */
async function checkUsernameChange(bot, m, user) {
  // eslint-disable-next-line no-underscore-dangle
  const userId = user._id;
  if (m.userId !== userId) {
    throw new Error(`checkUsernameChange ids mismatch: ${m.userId}, ${userId}`);
  }
  if (m.username !== user.username) {
    bot.channels.cache
      .get(m.channelId)
      .send(`username change detected, ${m.username} => ${user.username}`);
    // eslint-disable-next-line no-param-reassign
    m.username = user.username;
    await m.save();
    return true;
  }
  return false;
}

async function checkGametimeChange(m, user) {
  if (user.gametime !== m.gametime) {
    // eslint-disable-next-line no-param-reassign
    m.gametime = user.gametime;
    await m.save();
    return false;
  }
  return true;
}

function createAvatar(userId) {
  return {
    url: `https://tetr.io/user-content/avatars/${userId}.jpg`,
  };
}

async function monitorOne(bot, msg, username) {
  const user = await tetrApi.fetchUser(username);
  // eslint-disable-next-line no-underscore-dangle
  const userId = user?._id;
  if (!userId) {
    msg.channel.send(`who is ${username}`);
    return;
  }

  const channelId = msg.channel.id;

  const existingMonitor = await Monitor.findOne({ channelId, userId }).exec();

  if (existingMonitor) {
    if (!(await checkUsernameChange(bot, existingMonitor, user))) {
      msg.channel.send(`bruh we have ${username}`);
    }
    return;
  }

  const lastMatchId = await tetrApi.getLastMatchId(userId);
  const newMonitor = new Monitor({
    channelId,
    userId,
    username,
    lastMatchId,
  });
  await newMonitor.save();
  const embed = {
    title: `Saved ${username}`,
    thumbnail: createAvatar(userId),
  };
  msg.channel.send({ embeds: [embed] });
}

async function monitor(bot, msg) {
  const args = msg.content.split(/\s+/);
  if (args.length < 3) {
    msg.channel.send('wot');
    return;
  }

  const usernames = args.slice(2);
  const jobs = await Promise.allSettled(
    usernames.map((u) => monitorOne(bot, msg, u))
  );
  jobs
    .filter((j) => j.status !== 'fulfilled')
    .forEach((j) => logger.error('Failed to monitor.', { error: j.reason }));
  msg.channel.send('monitor done');
}

async function list(bot, msg) {
  const args = splitMsg(msg);
  if (args.length !== 2) {
    msg.channel.send('wot');
    return;
  }

  const channelId = msg.channel.id;
  const monitors = await Monitor.find({ channelId })
    .sort({ username: 1 })
    .select({ username: 1 })
    .exec();

  if (!monitors.length) {
    msg.channel.send('nope, no one');
    return;
  }

  const reply = [`**List of monitored people (${monitors.length})**:`].concat(
    monitors.map((m) => m.username)
  );
  msg.channel.send(reply.join('\n'));
}

async function remove(bot, msg) {
  const args = splitMsg(msg);
  if (args.length !== 3) {
    msg.channel.send('wot');
    return;
  }

  if (!hasAdmin(msg)) {
    msg.channel.send('no');
    return;
  }

  const channelId = msg.channel.id;
  const username = args[2];
  const result = await Monitor.deleteOne({ channelId, username }).exec();

  if (!result.deletedCount) {
    msg.channel.send("nope, I wasn't monitoring him");
    return;
  }
  msg.channel.send(`removed ${username}`);
}

async function sendNewPbMessage(bot, m, { record, rank, scoreStr }, gameName) {
  const rankString = rank === null ? '#>1000' : `#${rank.toFixed(0)}`;
  const ec = record.endcontext;
  const finesseValue = tetrApi.getFinesseValue(ec);
  const ppsValue = tetrApi.getPpsValue(ec, gameName);

  const embed = {
    color: 234748,
    title: `${m.username.toUpperCase()} just achieved a new ${gameName} personal best!`,
    url: `https://tetr.io/#r:${record.replayid}`,
    description: `**${scoreStr}**`,
    fields: [
      { name: 'Rank', value: rankString, inline: true },
      { name: 'PPS', value: ppsValue, inline: true },
      {
        name: 'Finesse',
        value: `${finesseValue.percentage}%`,
        inline: true,
      },
      {
        name: 'Finesse faults',
        value: finesseValue.faults,
        inline: true,
      },
      { name: 'Level', value: ec.level.toFixed(0), inline: true },
      { name: '\u200B', value: '**Clears**' },
      { name: 'Singles', value: ec.clears.singles.toFixed(0), inline: true },
      { name: 'Doubles', value: ec.clears.doubles.toFixed(0), inline: true },
      { name: 'Triples', value: ec.clears.triples.toFixed(0), inline: true },
      { name: 'Quads', value: ec.clears.quads.toFixed(0), inline: true },
      { name: '\u200B', value: '**T-spins**' },
      { name: 'Real', value: ec.clears.realtspins.toFixed(0), inline: true },
      { name: 'Mini', value: ec.clears.minitspins.toFixed(0), inline: true },
      {
        name: 'Mini Singles',
        value: ec.clears.minitspinsingles.toFixed(0),
        inline: true,
      },
      {
        name: 'Singles',
        value: ec.clears.tspinsingles.toFixed(0),
        inline: true,
      },
      {
        name: 'Mini Doubles',
        value: ec.clears.minitspindoubles.toFixed(0),
        inline: true,
      },
      {
        name: 'Doubles',
        value: ec.clears.tspindoubles.toFixed(0),
        inline: true,
      },
      {
        name: 'Triples',
        value: ec.clears.tspintriples.toFixed(0),
        inline: true,
      },
      { name: 'All clears', value: ec.clears.allclear.toFixed(0) },
      {
        name: '\u200B',
        value: `[replay link](https://tetr.io/#r:${record.replayid})`,
      },
    ],
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
    thumbnail: createAvatar(m.userId),
  };
  bot.channels.cache.get(m.channelId).send({ embeds: [embed] });
}

async function tryUpdateBlitzPb(bot, m, { record, rank }) {
  if (!record) return { updated: false };
  const score = Number(record.endcontext.score);
  if (
    m.lastPersonalBest.blitz !== undefined &&
    score <= m.lastPersonalBest.blitz
  ) {
    return { updated: false };
  }
  try {
    const scoreStr = score.toFixed(0);
    await sendNewPbMessage(bot, m, { record, rank, scoreStr }, 'blitz');
    await Monitor.findByIdAndUpdate(m.id, {
      'lastPersonalBest.blitz': score,
    }).exec();
    return { updated: true };
  } catch (error) {
    logger.error(
      `Failed to update blitz pb for ${m.username}: ${error.message}`,
      { error }
    );
    throw error;
  }
}

async function tryUpdate40lPb(bot, m, { record, rank }) {
  if (!record) return { updated: false };
  const score = Number(record.endcontext.finalTime);
  if (
    m.lastPersonalBest['40l'] !== undefined &&
    score >= m.lastPersonalBest['40l']
  ) {
    return { updated: false };
  }
  try {
    const scoreStr = prettyMilliseconds(score);
    await sendNewPbMessage(bot, m, { record, rank, scoreStr }, '40l');
    await Monitor.findByIdAndUpdate(m.id, {
      'lastPersonalBest.40l': score,
    }).exec();
    return { updated: true };
  } catch (error) {
    logger.error(
      `Failed to update 40l pb for ${m.username}: ${error.message}`,
      { error }
    );
    throw error;
  }
}

async function refreshUser(bot, m) {
  const user = await tetrApi.fetchUser(m.userId);
  const refreshedMonitor = await Monitor.findById(m.id);
  if (await checkGametimeChange(refreshedMonitor, user)) {
    return { updated: false };
  }
  if (!user) {
    throw new Error(`Empty fetch user for ${m.username}`);
  }
  const records = await tetrApi.getRecords(m.userId);
  // m can be stale since getRecords may be slow
  await checkUsernameChange(bot, refreshedMonitor, user);
  const jobs = await Promise.allSettled([
    tryUpdateBlitzPb(bot, refreshedMonitor, records.blitz),
    tryUpdate40lPb(bot, refreshedMonitor, records['40l']),
  ]);
  const results = logAndThrow(jobs, `refreshUser ${m.username} failed.`);
  const updated = results.some((r) => r.updated);
  return { updated };
}

async function refreshChannel(bot, monitors) {
  const jobs = await Promise.allSettled(
    monitors.map((m) => refreshUser(bot, m))
  );
  const results = logAndThrow(jobs, `refreshChannel failed.`);
  const updated = results.some((r) => r.updated);
  return { updated };
}

const refreshLock = {};

async function refresh(bot, msg) {
  const args = splitMsg(msg);
  if (args.length !== 2) {
    msg.channel.send('wot');
    return;
  }

  const channelId = msg.channel.id;
  if (refreshLock.channelId) {
    msg.channel.send('fast hand');
    return;
  }
  try {
    refreshLock.channelId = 1;

    const monitors = await Monitor.find({ channelId }).exec();

    const result = await refreshChannel(bot, monitors);

    if (!result.updated) {
      msg.channel.send('nothing to update');
    } else {
      msg.channel.send('refresh done');
    }
  } catch (error) {
    logger.error(`refresh failed: ${error.message}`, { error });
    msg.channel.send('refresh failed');
  } finally {
    refreshLock.channelId = 0;
  }
}

const refreshAllStatus = { running: false };

async function refreshAll(bot) {
  if (refreshAllStatus.running) {
    return;
  }
  try {
    refreshAllStatus.running = true;
    logger.info('refreshAll started.');
    const monitors = await Monitor.find().exec();
    const jobs = await Promise.allSettled(
      monitors.map((m) => refreshUser(bot, m))
    );
    logAndThrow(jobs);
  } catch (error) {
    logger.error(`refreshAll failed: ${error.message}`, { error });
  } finally {
    logger.info('refreshAll finished.');
    refreshAllStatus.running = false;
  }
}

const cmdMap = {
  help,
  monitor,
  list,
  remove,
  refresh,
};

async function cmd(bot, msg) {
  try {
    const args = msg.content.split(/\s+/);
    if (args.length === 1) return;
    if (!(args[1] in cmdMap)) return;
    await cmdMap[args[1]](bot, msg);
  } catch (error) {
    logger.error(`${cmdName} error: ${error.message}`, { error });
    msg.channel.send(`Unknown error occured: ${error.message}`);
  }
}

function startRefresh(bot) {
  setInterval(() => refreshAll(bot), 600000);
}

module.exports = {
  cmd,
  startRefresh,
};
