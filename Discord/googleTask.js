const Discord = require(`discord.js`);
const fs = require('fs');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { Channel } = require('./googleTask/channel');
const { logger } = require('./logger');
const cmdName = 'tasks';

const SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'datas/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'auth.json');
const api = require('./googleTask/api.js');

const refreshInterval = 3600000;
const remindTime = 86400000;
const remindTimeStr = '1 day';

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

async function sendMsg(bot, embed, channel) {
  await bot.channels.cache.get(channel).send({ embeds: [embed] });
}

async function sendReminder({ bot, task, epoch }) {
  const { title, notes } = task;
  const embed = {
    color: '#a832a4',
    title: `${title} in ${remindTimeStr}`,
    link: `https://tasksboard.com/app`,
    description: notes,
    fields: [{ name: `\u200B`, value: `<t:${epoch / 1000}>` }],
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };

  var channels = await Channel.find().exec();
  channels.map((c) => sendMsg(bot, embed, c.channelId));
}

function runAtDate(date, func, payload) {
  var diff = Math.max(date - Date.now(), 0);
  if (diff < -10000) return;
  if (diff > 0x7fffffff)
    setTimeout(() => {
      runAtDate(date, func, payload);
    }, 0x7fffffff);
  else setTimeout(func, diff, payload);
}

var vis = [];

async function refreshTask(bot, task) {
  if (!task.due) return;

  var epoch = new Date(task.due).getTime();
  runAtDate(epoch - remindTime, sendReminder, { bot, task, epoch });

  vis.push(task);
}

async function refreshTaskList(bot, taskList) {
  const tasks = await api.getIncompleteTasks(taskList.id);
  tasks.filter((t) => t.due != null);
  const jobs = await Promise.allSettled(tasks.map((m) => refreshTask(bot, m)));
  const results = logAndThrow(jobs, `Refresh task lists failed`);
}

async function refresh(bot) {
  const taskLists = await api.getTaskLists();
  const jobs = await Promise.allSettled(
    taskLists.map((m) => refreshTaskList(bot, m))
  );
  const results = logAndThrow(jobs, `Tasks refresh failed.`);
}

async function init(bot) {
  refresh(bot);
  setInterval(() => refresh(bot), refreshInterval);
}

api.startLoadAuth();

async function remind(bot, msg) {
  if (!hasAdmin(msg)) {
    msg.channel.send(`no`);
    return;
  }

  const channelId = msg.channel.id;
  const existingChannel = await Channel.findOne({ channelId }).exec();

  if (existingChannel) {
    msg.channel.send(`already bruh`);
    return;
  }

  const newChannel = new Channel({ channelId });
  await newChannel.save();
  msg.channel.send(`Saved!`);
  logger.info(`Saved new channel ${channelId}`);
}

async function token(bot, msg) {
  const args = msg.content.split(/\s+/);
  if (args.length !== 3) {
    msg.channel.send(`wot`);
    return;
  }

  const res = await api.saveRefreshToken(args[2]);
  if (res.success) msg.channel.send(`saved!`);
  else msg.channel.send(`failed!`);
}

const cmdMap = {
  remind,
  token,
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

module.exports = {
  cmd,
  init,
};
