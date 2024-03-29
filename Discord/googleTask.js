'use strict';
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
  epoch = Math.round(epoch / 1000);

  const embed = {
    color: 16711910,
    title: `${title} <t:${epoch}:R>`,
    link: `https://tasksboard.com/app`,
    description: notes,
    fields: [{ name: `\u200B`, value: `<t:${epoch}:D>` }],
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
  if (vis.includes(task.id)) return;
  if (!task.due) return;

  var epoch = new Date(task.due).getTime();

  if (Date.now() + refreshInterval * 2 < epoch - remindTime) return;
  // epoch = Date.now() + remindTime + 1000;
  runAtDate(epoch - remindTime, sendReminder, { bot, task, epoch });

  await vis.push(task.id);
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

  await refresh(bot);
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

async function sendList(bot, msg, fields, group, sender) {
  const embed = {
    color: 65288,
    title: `Task list for ${group}`,
    link: `https://tasksboard.com/app`,
    fields: fields,
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };

  await sender.reply({ embeds: [embed] });
}

async function searchGroup(keyword) {
  var taskLists = await api.getTaskLists();

  taskLists = taskLists.filter((t) => t.title.indexOf(keyword) != -1);

  return taskLists;
}

async function convertTasksToFields(results) {
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
          ? `<t:${Math.round(time / 1000)}:D>`
          : `No due`,
      value: `\`\`\`${tasks.join('\n')}\`\`\``,
    });
  });
  return fields;
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

  const fields = await convertTasksToFields(results);

  await sendList(bot, msg, fields, groupName, msg);
}

async function groups(bot, msg) {
  var taskLists = await api.getTaskLists();
  taskLists = taskLists.map((t) => t.title);

  const res = `\`\`\`${taskLists.join(`\n`)}\`\`\``;

  const embed = {
    color: 65531,
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

async function chooseTaskLists(bot, msg) {
  const taskLists = await api.getTaskLists();
  const options = taskLists.map((t) => ({ label: t.title, value: t.id }));
  const row = {
    type: 'ACTION_ROW',
    components: [
      {
        type: 'SELECT_MENU',
        customId: 'chooseTasks',
        placeholder: 'Choose a group',
        options,
        disabled: false,
      },
    ],
  };
  await msg.reply({ content: 'Choose a group', components: [row] });

  bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu() || interaction.customId !== 'chooseTasks')
      return;
    const picked = interaction.values[0];
    var taskLists = await api.getTaskLists();
    taskLists = taskLists.filter((t) => t.id === picked);

    if (taskLists.length !== 1) {
      interaction.update({
        content: `The chosen group is not found.`,
        components: [],
      });
      logger.error(`Tasks: Chosen group not found`);
      return;
    }

    const task = await api.getIncompleteTasks(taskLists[0].id);
    const fields = await convertTasksToFields(task);
    // await interaction.update({content: 'tests', components: []});
    await sendList(bot, msg, fields, taskLists[0].title, interaction);
  });
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
    if (args.length === 1) {
      chooseTaskLists(bot, msg);
      return;
    }
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
