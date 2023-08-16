'use strict';
const Discord = require('discord.js');
var bot;
const token = require('./auth.json');
const archiver = require(`archiver`);
const fs = require(`fs`);
const { logger } = require('./logger');

async function send() {
  logger.info(`Backup started.`);
  try {
    // if (fs.existsSync(`./datas/datas.zip`))
    //   await fs.unlinkSync(`./datas/datas.zip`);
    var output = fs.createWriteStream(`datas/datas.zip`);
    var archive = archiver(`zip`);

    output.on(`close`, async () => {
      logger.info(`Zipping finished.`);
      await bot.channels.cache.get(token.spamchannel).send({
        content: new Date().toISOString(),
        files: [`datas/datas.zip`],
      });
      logger.info(`Backup finished.`);
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.pipe(output);

    // archive.directory(`datas/`, `datas`);
    archive.glob(`**/*`, { cwd: `datas`, ignore: [`datas.zip`] }, {});

    logger.info(`Zipping started`);
    archive.finalize();
  } catch (error) {
    console.error(error);
    logger.error(`Backup error.`, { error });
    return;
  }
}

function start(Bot) {
  bot = Bot;
  send();
  setInterval(send, 3600000);
}

module.exports = { start };
