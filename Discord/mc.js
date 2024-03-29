const Discord = require('discord.js');

const mcApi = require('./mc/api');
const { Server } = require('./mc/server');
const { logger } = require('./logger');

const cmdName = 'mc';
const green = 3319876;
const red = 11022898;

function hasAdmin(msg) {
  return msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
}

function splitMsg(msg) {
  return msg.content.split(/\s+/);
}

async function help(bot, msg) {
  const vieriImg = new Discord.AttachmentBuilder('../viericorp.png');
  const str = `**^${cmdName} status** - check server status`;
  const strAdmin = `**^${cmdName} set <ip>** - set server ip to <ip>`;
  msg.channel.send({
    files: [vieriImg],
    embeds: [
      {
        color: 16764006,
        author: {
          name: 'Minecraft',
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

async function set(bot, msg) {
  const args = splitMsg(msg);
  if (args.length !== 3) {
    msg.channel.send('wot');
    return;
  }

  if (!hasAdmin(msg)) {
    msg.channel.send('no');
    return;
  }

  const ip = args[2];
  const channelId = msg.channel.id;

  await Server.findOneAndUpdate(
    { channelId },
    { channelId, ip },
    { new: true, upsert: true }
  ).exec();
  msg.channel.send(`saved!`);
}

async function sendServer(msg, dat, ip) {
  const isOnline = dat.online === true;
  const color = isOnline ? green : red;
  const srvStatus = isOnline ? `Online` : `Offline`;
  const version = isOnline ? `${dat.version}` : `Unknown`;
  const players = isOnline ? dat.players : { online: 0, max: 0 };
  const embed = {
    color,
    title: `Server Status for ${ip}`,
    fields: [
      { name: 'Status', value: srvStatus, inline: false },
      {
        name: 'Player Count',
        value: `${players.online}/${players.max}`,
        inline: false,
      },
      { name: 'Version', value: `${version}`, inline: false },
    ],
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };
  msg.channel.send({ embeds: [embed] });
}

async function status(bot, msg) {
  const args = splitMsg(msg);
  if (args.length !== 2) {
    msg.channel.send('wot');
    return;
  }
  const channelId = msg.channel.id;
  const server = await Server.findOne({ channelId }).exec();
  if (!server) {
    msg.channel.send(`set a server first`);
    return;
  }
  const { ip } = server;
  const dat = await mcApi.fetchServer(ip);
  try {
    await sendServer(msg, dat, ip);
  } catch (error) {
    logger.error(`Failed to send server for ${ip}: ${error.message}`, {
      error,
    });
    throw error;
  }
}

const cmdMap = {
  help,
  set,
  status,
};

async function cmd(bot, msg) {
  try {
    const args = splitMsg(msg);
    if (args.length === 1) return;
    if (!(args[1] in cmdMap)) return;
    await cmdMap[args[1]](bot, msg);
  } catch (error) {
    logger.error(`${cmdName} error: ${error.message}`, { error });
    msg.channel.send(`Unknown error occured: ${error.message}`);
  }
}

module.exports = {
  cmd,
};
