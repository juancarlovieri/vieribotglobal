'use strict';
const Discord = require('discord.js');
const { Permissions } = require('discord.js');
var bot;
const pathMonitor = 'datas/monitor.json';
const pathPerms = 'datas/perms.json';
var pathPlayers = 'datas/players.json';
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
var request = require('sync-request');
const prettyMilliseconds = require('pretty-ms');
var ownerId = '455184547840262144';
const MongoClient = require('mongodb').MongoClient;
const token = require('./auth.json');
const refreshTime = 300000;
const warnInterval = 600000;
const keepReq = 3600000;
const forceForceRefresh = 86400000;
const failrateLimit = 0.1;
var startupTime = parseInt(Date.now());
var reqcnt = 0,
  failedreq = 0;
const { logger } = require('./logger');
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageButton,
} = require('discord.js');
const countryCodes = require('country-codes-list');
const allCountries = new Map(
  Object.entries(
    countryCodes.customList('countryCode', '{countryCode} | {countryNameEn}')
  )
);

const client = new MongoClient(token.mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var database, col;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const emoji = new Map();
emoji.set('x', '978615861575315536');
emoji.set('u', '978615918332633098');
emoji.set('ss', '978615896417378304');
emoji.set('s+', '980356564600897586');
emoji.set('s', '978615943238385674');
emoji.set('s-', '978615963840827452');
emoji.set('a+', '978616006874394648');
emoji.set('a', '978616041993289758');
emoji.set('a-', '978616066081161246');
emoji.set('b+', '978616086700380161');
emoji.set('b', '978616110226223124');
emoji.set('b-', '978616129780088842');
emoji.set('c+', '978642028592234546');
emoji.set('c', '978642115980558338');
emoji.set('c-', '978642002990231622');
emoji.set('d+', '978642028676145244');
emoji.set('d', '978642028260888618');

async function init() {
  await client.connect();
  database = client.db(token.mongodb_db);
  col = database.collection('tetr');
  // try {
  //   // var obj = JSON.parse(fs.readFileSync(pathMonitor, "utf8"));
  //   // logger.info(await col.findOne({title: 'monitor'}).val);
  //   var temp = await col.findOne({title: "monitor"});
  //   monitor = new Map(Object.entries(JSON.parse(temp.val)));
  //   var temp = new Map();
  //   for (var cur of monitor) {
  //     temp.set(cur[0], new Map(Object.entries(cur[1])));
  //   }
  //   monitor = temp;
  // } catch(err) {
  //   console.error(err);
  // }

  // try {
  //   var temp = await col.findOne({title: "perms"});
  //   var obj = JSON.parse(temp.val);
  //   perms = new Map(Object.entries(obj));
  //     // logger.info(perms);
  // } catch(err) {
  //   console.error(err);
  // }

  // try {
  //   var obj = JSON.parse(fs.readFileSync(pathPlayers, "utf8"));
  //   players = new Map(Object.entries(obj));
  // } catch(err) {
  //   console.error(err);
  // }

  try {
    if (fs.existsSync(pathMonitor)) {
      var obj = JSON.parse(fs.readFileSync(pathMonitor, 'utf8'));
      monitor = new Map(Object.entries(obj));
      var temp = new Map();
      for (var cur of monitor) {
        temp.set(cur[0], new Map(Object.entries(cur[1])));
      }
      monitor = temp;
    }
  } catch (err) {
    // console.error(err);
    logger.error(`Reading file failed`, { err });
  }

  try {
    if (fs.existsSync(pathPerms)) {
      var obj = JSON.parse(fs.readFileSync(pathPerms, 'utf8'));
      perms = new Map(Object.entries(obj));
    }
  } catch (err) {
    logger.error(`Reading file failed`, { err });
  }

  try {
    if (fs.existsSync(pathPlayers)) {
      var obj = JSON.parse(fs.readFileSync(pathPlayers, 'utf8'));
      players = new Map(Object.entries(obj));
    }
  } catch (err) {
    logger.error(`Reading file failed`, { err });
  }
  if (
    !players.has(`lastRefresh`) ||
    players.get(`lastRefresh`) < startupTime - forceForceRefresh
  ) {
    await forceRefresh();
    players.set(`lastRefresh`, startupTime);
  }
  save();
}

init();

var monitor = new Map();
var perms = new Map();
var players = new Map();

const https = require('https');
const axios = require('axios');

var reqs = [];
var failedreqs = [];
var lastwarn = 0;

async function async_request(option) {
  reqcnt += 1;
  //  return new Promise( (resolve, reject) => {
  //    let request = https.get( option, (response) => {
  //        if (response.statusCode < 200 || response.statusCode > 299) {
  //        reject( new Error('Failed to load page'+response.statusCode) );}
  //        let data = "";
  //        response.on( 'data', (chunk) => data += chunk );
  //        response.on( 'end', () => resolve(JSON.parse(data)) );
  //    } );
  //    request.on( 'error', (err) => reject(err) );
  // })
  var temp = await axios.get(option);
  temp = temp.data;
  var curtime = parseInt(Date.now());
  reqs.push(curtime);

  while (reqs.length > 0 && reqs[0] + keepReq < curtime) reqs.shift();
  while (failedreqs.length > 0 && failedreqs[0] + keepReq < curtime)
    failedreqs.shift();

  if (!temp.success) {
    logger.error('Failed request.', { temp });
    failedreq += 1;
    failedreqs.push(curtime);
    if (
      failedreqs.length / reqs.length > failrateLimit &&
      curtime - lastwarn > warnInterval
    ) {
      lastwarn = curtime;
      try {
        var msg = `WARNING, request fail rate: ${
          (failedreqs.length / reqs.length) * 100
        }% for the past hour`;
        bot.channels.cache.get(token.opchannel).send(msg);
      } catch (err) {
        logger.error(`Unable to send warning message.`, { err });
        lastwarn = 0;
      }
    }
    throw new Error('Unable to fetch data');
  }
  return temp;
}

async function save() {
  var temp = new Map();
  for (var cur of monitor) {
    temp.set(cur[0], Object.fromEntries(cur[1]));
  }
  var jsonObj = Object.fromEntries(temp);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(pathMonitor, jsonContent, 'utf8', function (err) {
    if (err) {
      return logger.error(`An err occured while writing JSON jsonObj to file`, {
        err,
      });
    }
  });

  await col.updateOne(
    { title: 'monitor' },
    { $set: { title: 'monitor', val: jsonContent } },
    (err, res) => {
      if (err) {
        return logger.error(`An err occured while updating mongoDB`, { err });
      }
    }
  );

  jsonObj = Object.fromEntries(perms);
  jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(pathPerms, jsonContent, 'utf8', function (err) {
    if (err) {
      return logger.error(`An err occured while writing JSON jsonObj to file`, {
        err,
      });
    }
  });

  await col.updateOne(
    { title: 'perms' },
    { $set: { title: 'perms', val: jsonContent } },
    (err, res) => {
      if (err) {
        return logger.error(`An err occured while updating mongoDB`, { err });
      }
    }
  );

  jsonObj = Object.fromEntries(players);
  jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(pathPlayers, jsonContent, 'utf8', function (err) {
    if (err) {
      return logger.error(`An err occured while writing JSON jsonObj to file`, {
        err,
      });
    }
  });
}

var load_next = 1;
var last_load = 1;
var force_load = 1200000;

async function refresh(bot) {
  players.set(`lastRefresh`, parseInt(Date.now()));
  save();
  var cur = parseInt(Date.now());
  if (load_next == 0 && last_load + force_load > cur) {
    logger.info('denied refresh');
    return;
  }
  last_load = cur;
  logger.info(`Normal refreshing`);
  load_next = 0;
  for (var curm of monitor) {
    var channel = curm[0];
    checkPerms(channel);
    curm = curm[1];
    for (var temp of curm) {
      var val = temp[1],
        id = temp[0];
      var record = null,
        username = null;
      var userData;
      try {
        username = await async_request('https://ch.tetr.io/api/users/' + id);
        userData = username;
        var newGametime = username.data.user.gametime;
        if (val.lastLoad != newGametime || newGametime === -1) {
          val.lastLoad = newGametime;
        } else {
          continue;
        }
        username = username.data.user.username;
        record = await async_request(
          'https://ch.tetr.io/api/users/' + id + '/records'
        );
        record = record.data.records;
      } catch (e) {
        logger.error(`Error getting user data records`, { e });
        continue;
      }
      if (val.blitz == undefined) {
        if (record.blitz.record == null) val.blitz = null;
        else val.blitz = Math.round(record.blitz.record.endcontext.score);
        if (record['40l'].record == null) val['40l'] = null;
        else val['40l'] = Math.round(record['40l'].record.endcontext.finalTime);
        curm.set(id, val);
        continue;
      }
      if (record.blitz.record != null) {
        var newblitz = Math.round(record.blitz.record.endcontext.score);
        if (val.blitz == null || newblitz > val.blitz) {
          var cur = record.blitz.record;
          var dat = cur.endcontext;
          var rank = '>#1000';
          if (record.blitz.rank != null) {
            rank = '#' + record.blitz.rank.toFixed(0);
          }
          const embed = {
            color: '#0394fc',
            title:
              cur.user.username.toUpperCase() +
              ' just achieved a new blitz personal best!',
            url: 'https://tetr.io/#r:' + cur.replayid,
            description: '**' + cur.endcontext.score.toFixed(0) + '**',
            fields: [
              { name: 'Rank', value: rank, inline: true },
              {
                name: 'PPS',
                value: (dat.piecesplaced / 120).toFixed(2),
                inline: true,
              },
              {
                name: 'Finesse',
                value:
                  (
                    (dat.finesse.perfectpieces * 100) /
                    dat.piecesplaced
                  ).toFixed(2) + '%',
                inline: true,
              },
              {
                name: 'Finesse faults',
                value: dat.finesse.faults.toFixed(0),
                inline: true,
              },
              { name: 'Level', value: dat.level.toFixed(0), inline: true },
              { name: '\u200B', value: '**Clears**' },
              {
                name: 'Singles',
                value: dat.clears.singles.toFixed(0),
                inline: true,
              },
              {
                name: 'Doubles',
                value: dat.clears.doubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Triples',
                value: dat.clears.triples.toFixed(0),
                inline: true,
              },
              {
                name: 'Quads',
                value: dat.clears.quads.toFixed(0),
                inline: true,
              },
              { name: '\u200B', value: '**T-spins**' },
              {
                name: 'Real',
                value: dat.clears.realtspins.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini',
                value: dat.clears.minitspins.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini Singles',
                value: dat.clears.minitspinsingles.toFixed(0),
                inline: true,
              },
              {
                name: 'Singles',
                value: dat.clears.tspinsingles.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini Doubles',
                value: dat.clears.minitspindoubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Doubles',
                value: dat.clears.tspindoubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Triples',
                value: dat.clears.tspintriples.toFixed(0),
                inline: true,
              },
              { name: 'All clears', value: dat.clears.allclear.toFixed(0) },
              {
                name: '\u200B',
                value: '[replay link](https://tetr.io/#r:' + cur.replayid + ')',
              },
            ],
            timestamp: new Date(),
            footer: {
              text: 'By Vieri Corp.™ All Rights Reserved',
            },
          };

          var cfriend = userData.data.user;

          var avatar = cfriend.avatar_revision;
          avatar = avatar === undefined ? 0 : avatar;
          if (avatar) {
            embed.thumbnail = {
              url:
                'https://tetr.io/user-content/avatars/' + cfriend._id + '.jpg',
            };
          }

          if (perms.get(channel).blitz) {
            try {
              bot.channels.cache.get(val.channel).send({ embeds: [embed] });
            } catch (e) {
              logger.error(`Failed to send message`, { e });
              continue;
            }
          }
          val.blitz = newblitz;
        }
      }
      if (record['40l'].record != null) {
        var new40l = Math.round(record['40l'].record.endcontext.finalTime);
        if (val['40l'] == null || new40l < val['40l']) {
          var cur = record['40l'].record;
          var dat = cur.endcontext;
          var rank = '>#1000';
          if (record['40l'].rank != null) {
            rank = '#' + record['40l'].rank.toFixed(0);
          }
          const embed = {
            color: '#0394fc',
            title:
              cur.user.username.toUpperCase() +
              ' just achieved a new 40 lines personal best!',
            url: 'https://tetr.io/#r:' + cur.replayid,
            description:
              '**' +
              prettyMilliseconds(cur.endcontext.finalTime, {
                secondsDecimalDigits: 3,
              }) +
              '**',
            fields: [
              { name: 'Rank', value: rank, inline: true },
              {
                name: 'PPS',
                value: (dat.piecesplaced / (new40l / 1000)).toFixed(2),
                inline: true,
              },
              {
                name: 'Finesse',
                value:
                  (
                    (dat.finesse.perfectpieces * 100) /
                    dat.piecesplaced
                  ).toFixed(2) + '%',
                inline: true,
              },
              {
                name: 'Finesse faults',
                value: dat.finesse.faults.toFixed(0),
                inline: true,
              },
              { name: '\u200B', value: '**Clears**' },
              {
                name: 'Singles',
                value: dat.clears.singles.toFixed(0),
                inline: true,
              },
              {
                name: 'Doubles',
                value: dat.clears.doubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Triples',
                value: dat.clears.triples.toFixed(0),
                inline: true,
              },
              {
                name: 'Quads',
                value: dat.clears.quads.toFixed(0),
                inline: true,
              },
              { name: '\u200B', value: '**T-spins**' },
              {
                name: 'Real',
                value: dat.clears.realtspins.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini',
                value: dat.clears.minitspins.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini Singles',
                value: dat.clears.minitspinsingles.toFixed(0),
                inline: true,
              },
              {
                name: 'Singles',
                value: dat.clears.tspinsingles.toFixed(0),
                inline: true,
              },
              {
                name: 'Mini Doubles',
                value: dat.clears.minitspindoubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Doubles',
                value: dat.clears.tspindoubles.toFixed(0),
                inline: true,
              },
              {
                name: 'Triples',
                value: dat.clears.tspintriples.toFixed(0),
                inline: true,
              },
              { name: 'All clears', value: dat.clears.allclear.toFixed(0) },
              {
                name: '\u200B',
                value: '[replay link](https://tetr.io/#r:' + cur.replayid + ')',
              },
            ],
            timestamp: new Date(),
            footer: {
              text: 'By Vieri Corp.™ All Rights Reserved',
            },
          };

          var cfriend = userData.data.user;

          var avatar = cfriend.avatar_revision;
          avatar = avatar === undefined ? 0 : avatar;
          if (avatar) {
            embed.thumbnail = {
              url:
                'https://tetr.io/user-content/avatars/' + cfriend._id + '.jpg',
            };
          }

          if (perms.get(channel)['40l']) {
            try {
              bot.channels.cache.get(val.channel).send({ embeds: [embed] });
            } catch (e) {
              logger.error(`Failed to send message`, { e });
              continue;
            }
          }
          val['40l'] = new40l;
        }
      }

      if (
        val.gamesplayed != userData.data.user.league.gamesplayed ||
        val.gamesplayed === -1
      ) {
        val.gamesplayed = userData.data.user.league.gamesplayed;
        var match;
        try {
          match = await async_request(
            'https://ch.tetr.io/api/streams/league_userrecent_' + id
          );
        } catch (e) {
          logger.error(`Failed to get user league record`, { e });
          continue;
        }
        match = match.data.records;
        var last = match.length;
        for (var i = 0; i < match.length; ++i) {
          if (match[i]._id == val.last) {
            last = i;
            break;
          }
        }
        for (var i = last - 1; i >= 0; --i) {
          var cur = match[i];
          var color, state;
          if (cur.endcontext[0].user.username != cur.user.username) {
            state = 'lost';
            color = '#a83232';
            cur.endcontext[1] = [
              cur.endcontext[0],
              (cur.endcontext[0] = cur.endcontext[1]),
            ][0];
          } else {
            state = 'won';
            color = '#32a844';
          }
          await timeout(10000);
          var friend;
          try {
            friend = await async_request(
              'https://ch.tetr.io/api/users/' + cur.endcontext[0].user._id
            );
          } catch (e) {
            logger.error(`Failed to get user data`, { e });
            continue;
          }
          cur.endcontext[0].user.username =
            cur.endcontext[0].user.username.toUpperCase();
          if (friend.data.user.country != null)
            cur.endcontext[0].user.username +=
              ' :flag_' + friend.data.user.country.toLowerCase() + ':';
          var cfriend = friend;
          friend = friend.data.user.league;
          if (friend.rank == 'z') friend.rank = '?';
          if (emoji.has(friend.rank)) {
            friend.rank = '<:a:' + emoji.get(friend.rank) + '>';
          }
          var foe;
          try {
            foe = await async_request(
              'https://ch.tetr.io/api/users/' + cur.endcontext[1].user._id
            );
          } catch (e) {
            logger.error(`Failed to get user data`, { e });
            continue;
          }
          cur.endcontext[1].user.username =
            cur.endcontext[1].user.username.toUpperCase();
          if (foe.data.user.country != null)
            cur.endcontext[1].user.username +=
              ' :flag_' + foe.data.user.country.toLowerCase() + ':';
          foe = foe.data.user.league;
          // var foe = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + cur.endcontext[1].user._id).getBody()).data.user.league;
          if (foe.rank == 'z') foe.rank = '?';
          if (emoji.has(foe.rank)) {
            foe.rank = '<:a:' + emoji.get(foe.rank) + '>';
          }
          const embed = {
            color: color,
            title:
              cur.user.username.toUpperCase() + ' just ' + state + ' a game',
            url: 'https://tetr.io/#r:' + cur.replayid,
            description:
              cur.endcontext[0].wins.toFixed(0) +
              ' - ' +
              cur.endcontext[1].wins.toFixed(0),
            fields: [
              {
                name: '\u200B',
                value: '**' + cur.endcontext[0].user.username + '**',
              },
              {
                name: 'Rank',
                value: friend.rank + ' / ' + friend.rating.toFixed(2) + ' TR',
                inline: false,
              },
              {
                name: 'PPS',
                value: cur.endcontext[0].points.tertiary.toFixed(2),
                inline: true,
              },
              {
                name: 'APM',
                value: cur.endcontext[0].points.secondary.toFixed(2),
                inline: true,
              },
              {
                name: 'VS',
                value: cur.endcontext[0].points.extra.vs.toFixed(2),
                inline: true,
              },
              {
                name: '\u200B',
                value: '**' + cur.endcontext[1].user.username + '**',
              },
              {
                name: 'Rank',
                value: foe.rank + ' / ' + foe.rating.toFixed(2) + ' TR',
                inline: false,
              },
              {
                name: 'PPS',
                value: cur.endcontext[1].points.tertiary.toFixed(2),
                inline: true,
              },
              {
                name: 'APM',
                value: cur.endcontext[1].points.secondary.toFixed(2),
                inline: true,
              },
              {
                name: 'VS',
                value: cur.endcontext[1].points.extra.vs.toFixed(2),
                inline: true,
              },
              {
                name: '\u200B',
                value: '[replay link](https://tetr.io/#r:' + cur.replayid + ')',
              },
            ],
            timestamp: new Date(),
            footer: {
              text: 'By Vieri Corp.™ All Rights Reserved',
            },
          };

          cfriend = cfriend.data.user;

          var avatar = cfriend.avatar_revision;
          avatar = avatar === undefined ? 0 : avatar;
          if (avatar) {
            embed.thumbnail = {
              url:
                'https://tetr.io/user-content/avatars/' + cfriend._id + '.jpg',
            };
          }

          if (perms.get(channel).ranked) {
            try {
              bot.channels.cache.get(val.channel).send({ embeds: [embed] });
            } catch (e) {
              logger.error(`Failed to send message`, { e });
              continue;
            }
          }
        }
        if (match.length == 0) match[0] = { _id: null };
        val.last = match[0]._id;
      }
      val.username = username;
      curm.set(id, val);
    }
    monitor.set(channel, curm);
  }
  save();
  logger.info(`Normal refresh finished.`);
  load_next = 1;
}

async function forceRefresh() {
  var cur = parseInt(Date.now());
  if (load_next == 0 && last_load + force_load > cur) {
    logger.info('denied refresh');
    return;
  }
  last_load = cur;
  logger.info(`Force refreshing`);
  load_next = 0;

  for (var curm of monitor) {
    var channel = curm[0];
    checkPerms(channel);
    curm = curm[1];
    for (var temp of curm) {
      var val = temp[1],
        id = temp[0];
      var record = null;
      try {
        record = await async_request(
          'https://ch.tetr.io/api/users/' + id + '/records'
        );
        record = record.data.records;
      } catch (e) {
        logger.error(`Failed to get user records`, { e });
        continue;
      }
      if (record.blitz.record == null) val.blitz = null;
      else val.blitz = Math.round(record.blitz.record.endcontext.score);
      if (record['40l'].record == null) val['40l'] = null;
      else val['40l'] = Math.round(record['40l'].record.endcontext.finalTime);
      curm.set(id, val);
    }
    monitor.set(channel, curm);
  }
  save();

  for (var curm of monitor) {
    var channel = curm[0];
    curm = curm[1];
    for (var temp of curm) {
      var val = temp[1],
        id = temp[0];
      var match;
      try {
        match = await async_request(
          'https://ch.tetr.io/api/streams/league_userrecent_' + id
        );
        // match = JSON.parse(request('GET', 'https://ch.tetr.io/api/streams/league_userrecent_' + id).getBody());
      } catch (e) {
        logger.error(`Failed to get user league records`, { e });
        continue;
      }
      match = match.data.records;
      if (match.length == 0) match[0] = { _id: null };
      val.last = match[0]._id;
      curm.set(id, val);
    }
    monitor.set(channel, curm);
  }
  save();
  logger.info(`Force refresh finished.`);
  load_next = 1;
}

function hasAdmin(msg) {
  if (msg.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS))
    return true;
  return false;
}

function isOwner(msg) {
  if (msg.author.id == ownerId) return true;
  return false;
}

function checkPerms(channel) {
  if (perms.has(channel)) {
    return;
  }
  var temp = {
    blitz: true,
    ranked: true,
  };
  temp['40l'] = true;
  perms.set(channel, temp);
  save();
}

const cacheTime = 86400000;
const maxScoreChar = 8;

async function updatePlayers(country) {
  var cur = parseInt(Date.now());
  if (
    players.has(country) == false ||
    players.get(country).time + cacheTime < cur
  ) {
    logger.info('updating players for ' + country);
    var temp;
    try {
      temp = await async_request(
        'https://ch.tetr.io/api/users/lists/xp?country=' +
          country +
          '&limit=100&after=0'
      );
    } catch (e) {
      logger.error(`Failed to update players`, { e });
      return;
    }
    temp = temp.data.users;
    var cnt = 1;
    var num = 0;
    var arr = [];
    while (true) {
      num += temp.length;
      if (temp.length == 0) break;
      for (var i = 0; i < temp.length; ++i) arr.push(temp[i]._id);
      try {
        temp = await async_request(
          'https://ch.tetr.io/api/users/lists/xp?country=' +
            country +
            '&limit=100&after=' +
            temp[temp.length - 1].xp
        );
      } catch (e) {
        logger.error(`Failed to update players`, { e });
        return;
      }
      temp = temp.data.users;
      ++cnt;
    }
    await players.set(country, { time: cur, arr: arr });
    save();
  }
}

async function blitzLb(bot, msg, country) {
  country = country.toUpperCase();
  await updatePlayers(country);
  var arr = players.get(country).arr;
  var records;
  try {
    records = await async_request(
      'https://ch.tetr.io/api/streams/blitz_global'
    );
  } catch (e) {
    logger.error(`Failed to get leaderboard`, { e });
    return;
  }
  records = records.data.records;
  var ans = [];
  for (var i = 0; i < records.length; ++i) {
    if (ans.length >= 50) break;
    if (arr.includes(records[i].user._id)) ans.push(records[i]);
  }
  var str = '```\n';
  for (var i = 0; i < ans.length; ++i) {
    var spaces = ' ';
    if ((i + 1).toFixed().length == 1) spaces += ' ';

    var spaces2 = ' ';
    for (
      var j = 0;
      j < maxScoreChar - ans[i].endcontext.score.toFixed().length;
      ++j
    )
      spaces2 += ' ';
    str +=
      (i + 1).toFixed() +
      '.' +
      spaces +
      ans[i].endcontext.score.toFixed() +
      spaces2 +
      '| ' +
      ans[i].user.username +
      '\n';
  }
  str += '```';
  const embed = {
    color: '#ebc334',
    title:
      'Blitz Leaderboard for ' +
      country +
      ' :flag_' +
      country.toLowerCase() +
      ':',
    description: str,
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };
  msg.channel.send({ embeds: [embed] });
}

async function fortyLinesLb(bot, msg, country) {
  country = country.toUpperCase();
  await updatePlayers(country);
  var arr = players.get(country).arr;
  var records;
  try {
    records = await async_request('https://ch.tetr.io/api/streams/40l_global');
  } catch (e) {
    logger.error(`Failed to get leaderboard`, { e });
    return;
  }
  records = records.data.records;
  var ans = [];
  for (var i = 0; i < records.length; ++i) {
    if (ans.length >= 50) break;
    if (arr.includes(records[i].user._id)) ans.push(records[i]);
  }
  var str = '```\n';
  for (var i = 0; i < ans.length; ++i) {
    var spaces = ' ';
    if ((i + 1).toFixed().length == 1) spaces += ' ';
    var spaces2 = ' ';
    for (
      var j = 0;
      j < maxScoreChar - (ans[i].endcontext.finalTime / 1000).toFixed(3).length;
      ++j
    )
      spaces2 += ' ';
    str +=
      (i + 1).toFixed() +
      '.' +
      spaces +
      (ans[i].endcontext.finalTime / 1000).toFixed(3) +
      spaces2 +
      '| ' +
      ans[i].user.username +
      '\n';
  }
  str += '```';
  const embed = {
    color: '#ebc334',
    title:
      '40l Leaderboard for ' +
      country +
      ' :flag_' +
      country.toLowerCase() +
      ':',
    description: str,
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };
  msg.channel.send({ embeds: [embed] });
}

async function playerCount(bot, msg, country) {
  country = country.toUpperCase();
  await updatePlayers(country);
  var arr = players.get(country).arr;
  msg.channel.send(arr.length.toFixed());
}

async function printGlobal(bot, msg, args) {
  if (args[2] == 'blitz') {
    var records;
    try {
      records = await async_request(
        'https://ch.tetr.io/api/streams/blitz_global'
      );
    } catch (e) {
      logger.error(`Failed to get leaderboard`, { e });
      return;
    }
    records = records.data.records;
    var ans = records;
    if (ans.length > 50) {
      ans = ans.slice(0, 50);
    }
    var str = '```\n';
    for (var i = 0; i < ans.length; ++i) {
      var spaces = ' ';
      if ((i + 1).toFixed().length == 1) spaces += ' ';

      var spaces2 = ' ';
      for (
        var j = 0;
        j < maxScoreChar - ans[i].endcontext.score.toFixed().length;
        ++j
      )
        spaces2 += ' ';
      str +=
        (i + 1).toFixed() +
        '.' +
        spaces +
        ans[i].endcontext.score.toFixed() +
        spaces2 +
        '| ' +
        ans[i].user.username +
        '\n';
    }
    str += '```';
    const embed = {
      color: '#ebc334',
      title: 'Blitz Leaderboard for global',
      description: str,
      timestamp: new Date(),
      footer: {
        text: 'By Vieri Corp.™ All Rights Reserved',
      },
    };
    msg.channel.send({ embeds: [embed] });
  } else if (args[2] == '40l') {
    var records;
    try {
      records = await async_request(
        'https://ch.tetr.io/api/streams/40l_global'
      );
    } catch (e) {
      logger.error(`Failed to get leaderboard`, { e });
      return;
    }
    records = records.data.records;
    var ans = records;
    if (ans.length > 50) {
      ans = ans.slice(0, 50);
    }
    var str = '```\n';
    for (var i = 0; i < ans.length; ++i) {
      var spaces = ' ';
      if ((i + 1).toFixed().length == 1) spaces += ' ';

      var spaces2 = ' ';
      for (
        var j = 0;
        j <
        maxScoreChar - (ans[i].endcontext.finalTime / 1000).toFixed(3).length;
        ++j
      )
        spaces2 += ' ';
      str +=
        (i + 1).toFixed() +
        '.' +
        spaces +
        (ans[i].endcontext.finalTime / 1000).toFixed(3) +
        spaces2 +
        '| ' +
        ans[i].user.username +
        '\n';
    }
    str += '```';
    const embed = {
      color: '#ebc334',
      title: '40l Leaderboard for global',
      description: str,
      timestamp: new Date(),
      footer: {
        text: 'By Vieri Corp.™ All Rights Reserved',
      },
    };
    msg.channel.send({ embeds: [embed] });
  }
}

async function printMonitored(bot, msg, args) {
  var channel = msg.channel.id;
  if (monitor.has(channel) == false) return;
  var arr = await monitor.get(channel);
  var all = [];
  for (var cur of arr) {
    cur = cur[1];
    if (args[2] == '40l') {
      if (cur['40l'] == null) continue;
      all[all.length] = {
        username: cur.username,
        score: cur['40l'],
        gm: '40l',
      };
    } else if (args[2] == 'blitz') {
      if (cur.blitz == null) continue;
      all[all.length] = {
        username: cur.username,
        score: cur.blitz,
        gm: 'blitz',
      };
    }
  }
  all.sort((a, b) => {
    if (a.gm == 'blitz') {
      return a.score < b.score ? 1 : -1;
    } else {
      return a.score > b.score ? 1 : -1;
    }
  });
  if (all.length > 50) {
    all = all.slice(0, 50);
  }
  var str = '```\n';
  for (var i = 0; i < all.length; ++i) {
    var spaces = ' ';
    if ((i + 1).toFixed().length == 1) spaces += ' ';
    if (args[2] == 'blitz') {
      var spaces2 = ' ';
      for (var j = 0; j < maxScoreChar - all[i].score.toFixed().length; ++j)
        spaces2 += ' ';
      str +=
        (i + 1).toFixed() +
        '.' +
        spaces +
        all[i].score.toFixed() +
        spaces2 +
        '| ' +
        all[i].username +
        '\n';
    } else if (args[2] == '40l') {
      var spaces2 = ' ';
      for (
        var j = 0;
        j < maxScoreChar - (all[i].score / 1000).toFixed(3).length;
        ++j
      )
        spaces2 += ' ';
      str +=
        (i + 1).toFixed() +
        '.' +
        spaces +
        (all[i].score / 1000).toFixed(3) +
        spaces2 +
        '| ' +
        all[i].username +
        '\n';
    }
  }
  str += '```';
  if (args[2] == 'blitz') args[2] = 'Blitz';
  const embed = {
    color: '#ebc334',
    title: args[2] + ' Leaderboard for monitored users',
    description: str,
    timestamp: new Date(),
    footer: {
      text: 'By Vieri Corp.™ All Rights Reserved',
    },
  };
  msg.channel.send({ embeds: [embed] });
}

async function printCountries(bot, msg, args) {
  var ans = [];
  for (const all of allCountries) {
    ans.push(all[1]);
  }
  // ans += "```";
  var embeds = [];
  var pg = 0;
  while (ans.length > 0) {
    var cur = ans.slice(0, 50);
    ans = ans.slice(50);
    var str = '```';
    for (var i of cur) {
      str += i + '\n';
    }
    str += '```';
    ++pg;
    const embed = {
      color: '#ebc334',
      title: 'List of available countries pg. ' + pg,
      description: str,
      timestamp: new Date(),
      footer: {
        text: 'By Vieri Corp.™ All Rights Reserved',
      },
    };
    embeds.push(embed);
  }
  // const embed = {
  //   color: "#ebc334",
  //   title: "List of available countries",
  //   description: ans,
  //   timestamp: new Date(),
  //   footer: {
  //     text: "By Vieri Corp.™ All Rights Reserved"
  //   }
  // };
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('prev')
        .setLabel('prev')
        .setStyle('PRIMARY')
        .setDisabled(true)
    )
    .addComponents(
      new MessageButton()
        .setCustomId('next')
        .setLabel('next')
        .setStyle('PRIMARY')
    );
  msg.channel.send({ embeds: [embeds[0]], components: [row] });
  bot.on('interactionCreate', (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.message.embeds.length == 0) return;
    // logger.info(interaction);
    // interaction.update({embeds: [embeds[0]], components: [row]});
    var idx = -1;
    for (var i = 0; i < embeds.length; ++i) {
      if (embeds[i].title == interaction.message.embeds[0].title) idx = i;
    }
    if (idx == -1) return;
    if (interaction.customId == 'next') ++idx;
    else --idx;
    idx = Math.max(idx, 0);
    idx = Math.min(idx, embeds.length - 1);
    var prev = idx == 0,
      next = idx == embeds.length - 1;
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('prev')
          .setLabel('prev')
          .setStyle('PRIMARY')
          .setDisabled(prev)
      )
      .addComponents(
        new MessageButton()
          .setCustomId('next')
          .setLabel('next')
          .setStyle('PRIMARY')
          .setDisabled(next)
      );
    interaction.update({ embeds: [embeds[idx]], components: [row] });
  });
}

async function addMonitor(args, msg, channelId) {
  var user;
  try {
    user = await async_request('https://ch.tetr.io/api/users/' + args[2]);
  } catch (e) {
    logger.error(`Failed to get user records`, { e });
    return;
  }
  if (user.success == false) {
    msg.channel.send('who is dat');
    return;
  }
  var id = user.data.user._id;
  var channel = channelId;
  if (monitor.has(channel) == false) {
    monitor.set(channel, new Map());
  }
  var curm = monitor.get(channel);
  if (curm.has(id)) {
    msg.channel.send('bruh we have that guy');
    return;
  }

  var match;
  try {
    match = await async_request(
      'https://ch.tetr.io/api/streams/league_userrecent_' + id
    );
  } catch (e) {
    logger.error(`Failed to get user league records`, { e });
    return;
  }
  // logger.info(match);
  match = match.data.records[0];
  if (match == undefined) {
    match = { _id: null };
  }
  var dat = {
    last: match._id,
    channel: channelId,
    username: user.data.user.username,
  };
  curm.set(id, dat);
  monitor.set(channel, curm);
  save();
  msg.channel.send('saved!');
}

async function removeMonitor(args, msg, channelId) {
  var user;
  try {
    user = await async_request('https://ch.tetr.io/api/users/' + args[2]);
  } catch (e) {
    logger.error(`Failed to get user data`, { e });
    return;
  }
  if (user.success == false) {
    msg.channel.send('who is dat');
    return;
  }
  var channel = channelId;
  var id = user.data.user._id;
  if (monitor.has(channel) == false || monitor.get(channel).has(id) == false) {
    msg.channel.send("nope, I wasn't monitoring him");
    return;
  }
  var temp = monitor.get(channel);
  temp.delete(id);
  monitor.set(channel, temp);
  msg.channel.send('removed');
  save();
}

module.exports = {
  cmd: async function (bot, msg) {
    var args = msg.content.split(' ');
    if (args.length == 1) return;
    switch (args[1]) {
      case 'countries':
        printCountries(bot, msg, args);
        break;
      case 'help':
        var vieri = new Discord.MessageAttachment('../viericorp.png');
        var str =
          '**^tetr monitor <user>** - spy on <user>, you will get notified when they play ranked or achieve new pbs\n';
        str += '**^tetr refresh** - refreshes the spied users instantly\n';
        str += '**^tetr list** - lists the users being monitored\n';
        str +=
          '**^tetr lb <gameMode> <country>** - shows the <gameMode> leaderboard for <country>, <gameMode> can be blitz or 40l\n';
        str +=
          '**^tetr lb <gameMode> monitored** - shows the <gameMode> leaderboard for spied users, <gameMode> can be blitz or 40l\n';
        str +=
          '**^tetr players <country>** - shows the number of players for <country>\n';
        str +=
          '**^tetr countries** - lists all available countries, along with their codes[\n';
        // logger.info(str);
        var strAdmin =
          '**^tetr remove <user>** - remove <user> from monitor list\n';
        strAdmin +=
          '**^tetr toggle <gameMode>** - disables/enables notification for <gameMode>, gameMode can be blitz, 40l, or ranked\n';
        msg.channel.send({
          files: [vieri],
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
        break;
      case 'monitor':
        if (args.length == 4) {
          if (args[3].length < 4) {
            msg.channel.send(`Invalid channel.`);
            return;
          }

          var channelId = args[3].substr(2, args[3].length - 3);
          try {
            if (bot.channels.cache.get(channelId) === undefined) {
              msg.channel.send(`Invalid channel.`);
              return;
            }
            addMonitor(args, msg, channelId);
          } catch (error) {
            logger.error(`Error checking channel.`, { error });
          }
          return;
        }

        if (args.length != 3) {
          msg.channel.send('wot');
          return;
        }

        addMonitor(args, msg, msg.channel.id);

        break;
      case 'refresh':
        refresh(bot);
        break;
      case 'toggle':
        if (!hasAdmin(msg)) {
          msg.channel.send('no, you have to be admin');
          return;
        }
        var channel = msg.channel.id;
        checkPerms(channel);
        var cur = perms.get(channel);
        switch (args[2]) {
          case 'blitz':
            if (cur.blitz == true) {
              cur.blitz = false;
              msg.channel.send('disabled blitz');
            } else {
              cur.blitz = true;
              msg.channel.send('enabled blitz');
            }
            break;
          case '40l':
            if (cur['40l'] == true) {
              cur['40l'] = false;
              msg.channel.send('disabled 40l');
            } else {
              cur['40l'] = true;
              msg.channel.send('enabled 40l');
            }
            break;
          case 'ranked':
            if (cur.ranked == true) {
              cur.ranked = false;
              msg.channel.send('disabled ranked');
            } else {
              cur.ranked = true;
              msg.channel.send('enabled ranked');
            }
            break;
        }
        perms.set(channel, cur);
        save();
        break;
      case 'list':
        var channel = msg.channel.id;
        if (monitor.has(channel) == false || monitor.get(channel).length == 0) {
          msg.channel.send('nope, no one');
          return;
        }
        var arr = monitor.get(channel);
        var ans = '**List of monitored people**:\n';
        for (var cur of arr) {
          ans += cur[1].username + '\n';
        }
        msg.channel.send(ans);
        break;
      case 'remove':
        if (!hasAdmin(msg)) {
          msg.channel.send('no');
          return;
        }

        if (args.length == 4) {
          if (args[3].length < 4) {
            msg.channel.send(`Invalid channel.`);
            return;
          }

          var channelId = args[3].substr(2, args[3].length - 3);
          try {
            if (bot.channels.cache.get(channelId) === undefined) {
              msg.channel.send(`Invalid channel.`);
              return;
            }
            removeMonitor(args, msg, channelId);
          } catch (error) {
            logger.error(`Error checking channel.`, { error });
          }
          return;
        }

        if (args.length != 3) {
          msg.channel.send('wot');
          return;
        }
        removeMonitor(args, msg, msg.channel.id);
        break;
      case 'forceRefresh':
        if (!isOwner(msg)) {
          msg.channel.send('no');
          return;
        }
        forceRefresh();
        break;
      case 'lb':
        if (args.length == 3) {
          printGlobal(bot, msg, args);
          return;
        }
        if (args.length < 4) return;
        var country = args[3];
        if (country == 'monitored') {
          printMonitored(bot, msg, args);
          return;
        }
        if (country.length != 2) {
          msg.channel.send(
            'invalid country, list of available coutnries on ^tetr countries'
          );
          return;
        }
        if (allCountries.has(country.toUpperCase()) == false) {
          msg.channel.send(
            'invalid country, list of available coutnries on ^tetr countries'
          );
          return;
        }
        if (args[2] == 'blitz') {
          blitzLb(bot, msg, country);
        } else if (args[2] == '40l') {
          fortyLinesLb(bot, msg, country);
        }
        break;
      case 'players':
        if (args.length != 3) {
          msg.channel.send('wot');
          return;
        }
        var country = args[2];
        if (country.length != 2) {
          msg.channel.send('invalid country');
          return;
        }
        playerCount(bot, msg, country);
        break;
      case 'rpm':
        var minutes = (parseInt(Date.now()) - startupTime) / 60000;
        var rpm = reqcnt / minutes;
        msg.channel.send(
          `RPM: ${rpm}\nRPM for last hour: ${
            reqs.length / 60
          }\nRequests: ${reqcnt}\nFailed requests: ${failedreq}\nFail rate: ${
            (failedreq / reqcnt) * 100
          }%\nFail rate for last hour: ${
            (failedreqs.length / reqs.length) * 100
          }%\nUptime: ${(parseInt(Date.now()) - startupTime) / 1000} s`
        );
    }
  },
  startRefresh: function (Bot) {
    bot = Bot;
    setInterval(() => {
      var http = require('http');
      http
        .get('http://tetr.io/', function (res) {
          refresh(bot);
        })
        .on('error', function (e) {
          logger.error(`Failed refreshing`, { e });
        });
    }, refreshTime);
  },
};
