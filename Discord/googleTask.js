const Discord = require(`discord.js`);
const fs = require('fs');
const path = require('path');
const process = require('process');
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
    color: '#ff00e6',
    title: `${title} in ${remindTimeStr}`,
    link: `https://tasksboard.com/app`,
    description: notes,
    fields: [{ name: `\u200B`, value: `<t:${Math.round(epoch / 1000)}>` }],
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };

  var channels = await Channel.find().exec();
  channels.map((c) => sendMsg(bot, embed, c.channelId));
}

function runAtDate(date, func, payload) {
  var diff = date - Date.now();
  if (diff < -10000) return;
  diff = Math.max(diff, 0);
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
  const res = await api.startLoadAuth();
  if (!res.success) {
    logger.error(`Google tasks init error.`);
    return;
  }

  refresh(bot);
  setInterval(() => refresh(bot), refreshInterval);
}

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

async function sendList(bot, msg, fields, group) {
  const embed = {
    color: '#00ff08',
    title: `Task list for ${group}`,
    link: `https://tasksboard.com/app`,
    fields: fields,
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };

  msg.channel.send({ embeds: [embed] });
}

async function searchGroup(keyword) {
  var taskLists = await api.getTaskLists();

  taskLists = taskLists.filter((t) => t.title.indexOf(keyword) != -1);

  return taskLists;
}

async function list(bot, msg) {
  const args = msg.content.split(/\s+/);
  var results = [];

  var groupName;
  if (args.length === 2) {
    const taskLists = await api.getTaskLists();

    const jobs = await Promise.allSettled(
      taskLists.map((t) => api.getIncompleteTasks(t.id))
    );

    results = logAndThrow(jobs, `Getting tasks list failed.`);
    groupName = `all`;
  } else {
    args.splice(0, 2);
    groupName = args.join(' ');
    const taskLists = await searchGroup(groupName);

    const jobs = await Promise.allSettled(
      taskLists.map((t) => api.getIncompleteTasks(t.id))
    );

    results = logAndThrow(jobs, `Search task list failed.`);
  }

  results = results.flat(1);

  var times = results.map((r) =>
    r.due != null ? new Date(r.due).getTime() : 100000000000000000
  );
  times = times.filter((value, index, self) => self.indexOf(value) === index);
  times.sort((a, b) => {
    return a - b;
  });

  var fields = [];
  times.forEach((time) => {
    var tasks = results.filter(
      (r) =>
        time ===
        (r.due != null ? new Date(r.due).getTime() : 100000000000000000)
    );
    tasks = tasks.map((t) => t.title);

    fields.push({
      name:
        time !== 100000000000000000
          ? `<t:${Math.round(time / 1000)}>`
          : `No due`,
      value: `\`\`\`${tasks.join('\n')}\`\`\``,
    });
  });

  sendList(bot, msg, fields, groupName);
}

async function groups(bot, msg) {
  var taskLists = await api.getTaskLists();
  taskLists = taskLists.map((t) => t.title);

  const res = `\`\`\`${taskLists.join(`\n`)}\`\`\``;

  const embed = {
    color: '#00fffb',
    title: `Group lists`,
    link: `https://tasksboard.com/app`,
    fields: { name: `\u200b`, value: res },
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };
  try {
    msg.channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error(`Error sending group lists.`, { error });
  }
}

const cmdMap = {
  remind,
  token,
  list,
  groups,
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
