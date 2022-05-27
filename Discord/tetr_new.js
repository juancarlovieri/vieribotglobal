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

  const reply = ['**List of monitored people**:'].concat(monitors.map((m) => m.username));
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

const cmdMap = {
  help,
  monitor,
  list,
  remove,
};

async function cmd(bot, msg) {
  const args = msg.content.split(' ');
  if (args.length === 1) return;
  if (!(args[1] in cmdMap)) return;
  try {
    await cmdMap[args[1]](bot, msg);
  } catch (error) {
    logger.error(`${cmdName} error: ${error.message}`);
    msg.channel.send(`Unknown error occured: ${error.message}`);
  }
}

module.exports = {
  cmd,
};
