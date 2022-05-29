const Discord = require('discord.js');

const tetrApi = require('./tetr/api');
const { Monitor } = require('./tetr/monitor');
const { logger } = require('./logger');

const cmdName = 'tetr2';

function hasAdmin(msg) {
  return msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
}

async function help(bot, msg) {
  const vieriImg = new Discord.MessageAttachment('../viericorp.png');
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

async function monitor(bot, msg) {
  const args = msg.content.split(' ');
  if (args.length !== 3) {
    msg.channel.send('wot');
    return;
  }
  const user = await tetrApi.fetchUser(args[2]);
  // eslint-disable-next-line no-underscore-dangle
  const userId = user._id;
  const { username } = user;
  if (!userId) {
    msg.channel.send('who is dat');
    return;
  }

  const channelId = msg.channel.id;

  const existingMonitor = await Monitor.findOne({ channelId, username }).exec();

  if (existingMonitor) {
    msg.channel.send('bruh we have that guy');
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

  msg.channel.send('saved!');
}

async function list(bot, msg) {
  const args = msg.content.split(' ');
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

  const reply = ['**List of monitored people**:'].concat(
    monitors.map((m) => m.username)
  );
  msg.channel.send(reply.join('\n'));
}

async function remove(bot, msg) {
  const args = msg.content.split(' ');
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

async function sendNewPbMessage(bot, m, { record, rank, score }, gameName) {
  const rankString = rank === null ? '#>1000' : `#${rank.toFixed(0)}`;
  const ec = record.endcontext;
  const finesseValue = tetrApi.getFinesseValue(ec);

  const embed = {
    color: '#0394fc',
    title: `${m.username.toUpperCase()} just achieved a new ${gameName} personal best!`,
    description: `**${score.toFixed(0)}**`,
    fields: [
      { name: 'Rank', value: rankString, inline: true },
      { name: 'PPS', value: (ec.piecesplaced / 120).toFixed(2), inline: true },
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
  };
  bot.channels.cache.get(m.channelId).send({ embeds: [embed] });
}

async function tryUpdateBlitzPb(bot, m, { record, rank }) {
  const score = Number(record.endcontext.score);
  if (
    m.lastPersonalBest.blitz !== undefined &&
    score <= m.lastPersonalBest.blitz
  ) {
    return { updated: false };
  }
  try {
    await sendNewPbMessage(bot, m, { record, rank, score }, 'biltz');
    // eslint-disable-next-line no-param-reassign
    m.lastPersonalBest.blitz = score;
    await m.save();
    return { updated: true };
  } catch (error) {
    logger.error(
      `Failed to update blitz pb for ${m.username}: ${error.message}`,
      { error }
    );
    throw error;
  }
}

async function refreshUser(bot, m) {
  const records = await tetrApi.getRecords(m.userId);
  const refreshedMonitor = await Monitor.findById(m.id);
  const jobs = await Promise.allSettled([
    tryUpdateBlitzPb(bot, refreshedMonitor, records.blitz),
  ]);
  const updated = jobs.some((j) => j.value?.updated);
  const failed = jobs.some((j) => j.status !== 'fulfilled');
  return { updated, failed };
}

async function refreshChannel(bot, monitors) {
  const jobs = await Promise.allSettled(
    monitors.map((m) => refreshUser(bot, m))
  );
  const updated = jobs.some((j) => j.value?.updated);
  const failed = jobs.some((j) => j.status !== 'fulfilled' || j.value?.failed);
  return { updated, failed };
}

async function refresh(bot, msg) {
  const args = msg.content.split(' ');
  if (args.length !== 2) {
    msg.channel.send('wot');
    return;
  }

  const channelId = msg.channel.id;
  const monitors = await Monitor.find({ channelId }).exec();

  const result = await refreshChannel(bot, monitors);

  if (result.failed) {
    msg.channel.send('refresh failed');
  } else if (!result.updated) {
    msg.channel.send('nothing to update');
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
    await Promise.allSettled(monitors.map((m) => refreshUser(bot, m)));
  } catch (error) {
    logger.error(`refreshAll failed: ${error.message}`);
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
    const args = msg.content.split(' ');
    if (args.length === 1) return;
    if (!(args[1] in cmdMap)) return;
    await cmdMap[args[1]](bot, msg);
  } catch (error) {
    logger.error(`${cmdName} error: ${error.message}`, { error });
    msg.channel.send(`Unknown error occured: ${error.message}`);
  }
}

function startRefresh(bot) {
  setInterval(() => refreshAll(bot), 60000);
}

module.exports = {
  cmd,
  startRefresh,
};
