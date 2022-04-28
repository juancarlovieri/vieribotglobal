"use strict";
const Discord =  require('discord.js');
const { Permissions } = require('discord.js');
var bot;
const pathMonitor = 'monitor.json'
const pathPerms = 'perms.json'
const fs = require('fs')
const { MessageEmbed } = require('discord.js');
var request = require('sync-request');
const prettyMilliseconds = require('pretty-ms');


var monitor = new Map();
var perms = new Map();

const https = require("https");

function async_request(option) {
  return new Promise( (resolve, reject) => {                    
    let request = https.get( option, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
        reject( new Error('Failed to load page'+response.statusCode) );}
        let data = "";
        response.on( 'data', (chunk) => data += chunk );
        response.on( 'end', () => resolve(JSON.parse(data)) );
    } );
    request.on( 'error', (err) => reject(err) );
 })
}

try {
  if (fs.existsSync(pathMonitor)) {
    var obj = JSON.parse(fs.readFileSync(pathMonitor, "utf8"));
    monitor = new Map(Object.entries(obj));
    var temp = new Map();
    for (var cur of monitor) {
      temp.set(cur[0], new Map(Object.entries(cur[1])));
    }
    monitor = temp;
  }
} catch(err) {
  console.error(err);
}

try {
  if (fs.existsSync(pathPerms)) {
    var obj = JSON.parse(fs.readFileSync(pathPerms, "utf8"));
    perms = new Map(Object.entries(obj));
  }
} catch(err) {
  console.error(err);
}

function save(){
  var temp = new Map();
  for (var cur of monitor) {
    temp.set(cur[0], Object.fromEntries(cur[1]));
  }
  var jsonObj = Object.fromEntries(temp);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(pathMonitor, jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });

  jsonObj = Object.fromEntries(perms);
  jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(pathPerms, jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
}

async function refresh(bot) {
  for (var curm of monitor) {
    var channel = curm[0];
    checkPerms(channel);
    curm = curm[1];
    for (var temp of curm) {
      var val = temp[1], id = temp[0];
      var record = null;
      try {
        record = await async_request("https://ch.tetr.io/api/users/"+ id + "/records");
        record = record.data.records;
      } catch (e) {
        console.error(e);
        continue;
      }
      if (val.blitz == undefined) {
        if (record.blitz.record == null) val.blitz = null;
        else val.blitz = record.blitz.record.endcontext.score;
        if (record["40l"].record == null) val["40l"] = null;
        else val["40l"] = record["40l"].record.endcontext.score;
        curm.set(id, val);
        continue;
      }
      if (record.blitz.record != null) {
        var newblitz = Math.round(record.blitz.record.endcontext.score);
        if (val.blitz == null || newblitz > val.blitz) {
          var cur = record.blitz.record;
          var dat = cur.endcontext;
          var rank = ">#1000";
          if (record.blitz.rank != null) {
            rank = "#" + record.blitz.rank.toFixed(0);
          }
          const embed = {
            color: "#0394fc",
            title: cur.user.username.toUpperCase() + " just achieved a new blitz personal best!",
            url: 'https://tetr.io/#r:' + cur.replayid,
            // author: {
            //    name: 'Tetris game update', 
            //   iconURL: 'https://pbs.twimg.com/profile_images/1286993509573169153/pN9ULwc6_400x400.jpg', 
            //   url: 'https://tetr.io/' 
            // },
            description: "**" + cur.endcontext.score.toFixed(0) + "**",
            // thumbnail: {
            //   url: 'https://i.imgur.com/AfFp7pu.png',
            // },
            fields: [
              { name: 'Rank', value: rank, inline: true },
              { name: 'PPS', value: (dat.piecesplaced/120).toFixed(2), inline: true },
              { name: 'Finesse', value: (dat.finesse.perfectpieces * 100/dat.piecesplaced).toFixed(2) + "%", inline: true },
              { name: 'Finesse faults', value: (dat.finesse.faults).toFixed(0), inline: true },
              { name: 'Level', value: (dat.level).toFixed(0), inline: true },
              { name: '\u200B', value: '**Clears**'},
              { name: 'Singles', value: dat.clears.singles.toFixed(0), inline: true },
              { name: 'Doubles', value: dat.clears.doubles.toFixed(0), inline: true },
              { name: 'Triples', value: dat.clears.triples.toFixed(0), inline: true },
              { name: 'Quads', value: dat.clears.quads.toFixed(0), inline: true },
              { name: '\u200B', value: '**T-spins**'},
              { name: 'Real', value: dat.clears.realtspins.toFixed(0), inline: true },
              { name: 'Mini', value: dat.clears.minitspins.toFixed(0), inline: true },
              { name: 'Mini Singles', value: dat.clears.minitspinsingles.toFixed(0), inline: true },
              { name: 'Singles', value: dat.clears.tspinsingles.toFixed(0), inline: true },
              { name: 'Mini Doubles', value: dat.clears.minitspindoubles.toFixed(0), inline: true },
              { name: 'Doubles', value: dat.clears.tspindoubles.toFixed(0), inline: true },
              { name: 'Triples', value: dat.clears.tspintriples.toFixed(0), inline: true },
              { name: 'Quads', value: dat.clears.tspinquads.toFixed(0), inline: true },
              { name: 'All clears', value: dat.clears.allclear.toFixed(0)},
            ],
            timestamp: new Date()
          };
          if (perms.get(channel).blitz) bot.channels.cache.get(val.channel).send({ embeds: [embed] });
          val.blitz = newblitz;
        }
      }
      if (record["40l"].record != null) {
        var new40l = Math.round(record["40l"].record.endcontext.finalTime);
        if (val["40l"] == null || new40l < val["40l"]) {
          var cur = record["40l"].record;
          var dat = cur.endcontext;
          var rank = ">#1000";
          if (record["40l"].rank != null) {
            rank = "#" + record["40l"].rank.toFixed(0);
          }
          const embed = {
              color: "#0394fc",
              title: cur.user.username.toUpperCase() + " just achieved a new 40 lines personal best!",
              url: 'https://tetr.io/#r:' + cur.replayid,
              // author: {
              //    name: 'Tetris game update', 
              //   iconURL: 'https://pbs.twimg.com/profile_images/1286993509573169153/pN9ULwc6_400x400.jpg', 
              //   url: 'https://tetr.io/' 
              // },
              description: "**" + prettyMilliseconds(cur.endcontext.finalTime) + "**",
              // thumbnail: {
              //   url: 'https://i.imgur.com/AfFp7pu.png',
              // },
              fields: [
                { name: 'Rank', value: rank, inline: true },
                { name: 'PPS', value: (dat.piecesplaced/(new40l/1000)).toFixed(2), inline: true },
                { name: 'Finesse', value: (dat.finesse.perfectpieces * 100/dat.piecesplaced).toFixed(2) + "%", inline: true },
                { name: 'Finesse faults', value: (dat.finesse.faults).toFixed(0), inline: true },
                { name: '\u200B', value: '**Clears**'},
                { name: 'Singles', value: dat.clears.singles.toFixed(0), inline: true },
                { name: 'Doubles', value: dat.clears.doubles.toFixed(0), inline: true },
                { name: 'Triples', value: dat.clears.triples.toFixed(0), inline: true },
                { name: 'Quads', value: dat.clears.quads.toFixed(0), inline: true },
                { name: '\u200B', value: '**T-spins**'},
                { name: 'Real', value: dat.clears.realtspins.toFixed(0), inline: true },
                { name: 'Mini', value: dat.clears.minitspins.toFixed(0), inline: true },
                { name: 'Mini Singles', value: dat.clears.minitspinsingles.toFixed(0), inline: true },
                { name: 'Singles', value: dat.clears.tspinsingles.toFixed(0), inline: true },
                { name: 'Mini Doubles', value: dat.clears.minitspindoubles.toFixed(0), inline: true },
                { name: 'Doubles', value: dat.clears.tspindoubles.toFixed(0), inline: true },
                { name: 'Triples', value: dat.clears.tspintriples.toFixed(0), inline: true },
                { name: 'Quads', value: dat.clears.tspinquads.toFixed(0), inline: true },
                { name: 'All clears', value: dat.clears.allclear.toFixed(0)},
              ],
              timestamp: new Date()
            };

         if (perms.get(channel)["40l"])  bot.channels.cache.get(val.channel).send({ embeds: [embed] });
          val["40l"] = new40l;
        }
      }
      curm.set(id, val);
    }
    monitor.set(channel, curm);
  }
  save();
  // monitor.forEach(async function (val, id) {
  // });

  for (var curm of monitor) {
    var channel = curm[0];
    curm = curm[1];
    for (var temp of curm) {
      var val = temp[1], id = temp[0];
      var match;
      try {
        match = await async_request('https://ch.tetr.io/api/streams/league_userrecent_' + id);
        // match = JSON.parse(request('GET', 'https://ch.tetr.io/api/streams/league_userrecent_' + id).getBody());
      } catch (e) {
        console.error(e);
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
        // console.log(cur.user.username);
        // console.log(cur.endcontext[0].user.username);
        if (cur.endcontext[0].user.username != cur.user.username) {
          // console.log("switch");
          cur.endcontext[1] = [cur.endcontext[0], cur.endcontext[0] = cur.endcontext[1]][0];
        }
        var friend = await async_request('https://ch.tetr.io/api/users/' + cur.endcontext[0].user._id);
        friend = friend.data.user.league;
        // var friend = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + cur.endcontext[0].user._id).getBody()).data.user.league;
        if (friend.rank == "z") friend.rank = "?";
        var foe = await async_request('https://ch.tetr.io/api/users/' + cur.endcontext[1].user._id);
        foe = foe.data.user.league;
        // var foe = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + cur.endcontext[1].user._id).getBody()).data.user.league;  
        if (foe.rank == "z") foe.rank = "?";
        var color, state;
        if (cur.endcontext[0].wins > cur.endcontext[1].wins) {
          state = "won";
          color = "#32a844";
        } else {
          state = "lost";
          color = "#a83232";
        }
        const embed = {
            color: color,
            title: cur.user.username.toUpperCase() + " just " + state + " a game",
            url: 'https://tetr.io/#r:' + cur.replayid,
            // author: {
            //    name: 'Tetris game update', 
            //   iconURL: 'https://pbs.twimg.com/profile_images/1286993509573169153/pN9ULwc6_400x400.jpg', 
            //   url: 'https://tetr.io/' 
            // },
            description: cur.endcontext[0].wins.toFixed(0) + ' - ' + cur.endcontext[1].wins.toFixed(0),
            // thumbnail: {
            //   url: 'https://i.imgur.com/AfFp7pu.png',
            // },
            fields: [
              { name: '\u200B', value: '**' + cur.endcontext[0].user.username.toUpperCase() + '**'},
              { name: 'Rank', value: friend.rank + " / " + friend.rating.toFixed(0) + "TR", inline: true },
              { name: 'PPS', value: cur.endcontext[0].points.tertiary.toFixed(2), inline: true },
              { name: 'APM', value: cur.endcontext[0].points.secondary.toFixed(2), inline: true },
              { name: 'VS', value: cur.endcontext[0].points.extra.vs.toFixed(2), inline: true },
              // { name: '\u200B', value: '\u200B' },
              { name: '\u200B', value: '**' + cur.endcontext[1].user.username.toUpperCase() + '**'},
              { name: 'Rank', value: foe.rank + " / " + foe.rating.toFixed(0) + "TR", inline: true },
              { name: 'PPS', value: cur.endcontext[1].points.tertiary.toFixed(2), inline: true },
              { name: 'APM', value: cur.endcontext[1].points.secondary.toFixed(2), inline: true },
              { name: 'VS', value: cur.endcontext[1].points.extra.vs.toFixed(2), inline: true },
            ],
            timestamp: new Date()
          };

        if (perms.get(channel).ranked) bot.channels.cache.get(val.channel).send({ embeds: [embed] });
        // console.log(match[i]._id);
        // bot.channels.cache.get(val.channel).send(match[i]._id);
      }
      if (match.length == 0) match[0] = {_id: null};
      val.last = match[0]._id
      curm.set(id, val);   
    }
    monitor.set(channel, curm);
  }
  // monitor.forEach(async function (val, id) {
  // });
  save();
}

function hasAdmin(msg) {
  if (msg.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return true;
  return false;
}

function checkPerms(channel) {
  if (perms.has(channel)) {
    return;
  }
  var temp = {
    blitz: true,
    ranked: true
  };
  temp["40l"] = true;
  perms.set(channel, temp);
  // console.log(perms);
  save();
}

module.exports = {
  cmd: async function(bot, msg) {
    var args = msg.content.split(" ");
    switch (args[1]) {
      case 'monitor':
        if (args.length != 3) {
          msg.channel.send("wot");
          return;
        }
        var user = await async_request("https://ch.tetr.io/api/users/" + args[2]);
        // user = user.data;
        // console.log(user);
        // var user = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + args[2]).getBody());
        if (user.success == false) {
          msg.channel.send("who is dat");
          return; 
        }
        var id = user.data.user._id;
        var channel = msg.channel.id;
        if (monitor.has(channel) == false) {
          monitor.set(channel, new Map());
        }
        var curm = monitor.get(channel);
        if (curm.has(id)) {
          msg.channel.send("bruh we have that guy");
          return;
        }
        var match = await async_request("https://ch.tetr.io/api/streams/league_userrecent_" + id);
        // console.log(match);
        // var match = JSON.parse(request('GET', 'https://ch.tetr.io/api/streams/league_userrecent_' + id).getBody());
        match = match.data.records[0];
        if (match == undefined) {
          match = {_id: null}
        }
        var dat = {
          last: match._id,
          channel: msg.channel.id,
          username: user.data.user.username
        };
        curm.set(id, dat);
        monitor.set(channel, curm);
        // console.log(monitor);
        save();
        msg.channel.send("saved!");
      break;
      case 'refresh':
        refresh(bot);
      break;
      case 'toggle':
        if (!hasAdmin(msg)) {
          msg.channel.send("no");
          return;
        }
        var channel = msg.channel.id;
        checkPerms(channel);
        var cur = perms.get(channel);
        switch (args[2]) {
          case 'blitz':
            if (cur.blitz == true) {
              cur.blitz = false;
              msg.channel.send("disabled blitz");
            } else {
              cur.blitz = true;
              msg.channel.send("enabled blitz");
            }
          break;
          case '40l':
            if (cur["40l"] == true) {
              cur["40l"] = false;
              msg.channel.send("disabled 40l");
            } else {
              cur["40l"] = true;
              msg.channel.send("enabled 40l");
            }
          break;
          case 'ranked':
            if (cur.ranked == true) {
              cur.ranked = false;
              msg.channel.send("disabled ranked");
            } else {
              cur.ranked = true;
              msg.channel.send("enabled ranked");
            }
          break;
        }
        perms.set(channel, cur);
        save();
      break;
      case 'list':
        var channel = msg.channel.id;
        if (monitor.has(channel) == false || monitor.get(channel).length == 0) {
          msg.channel.send("nope, no one");
          return;
        }
        var arr = monitor.get(channel);
        var ans = "**List of monitored people**:\n";
        for (var cur of arr) {
          ans += cur[1].username + '\n';
        }
        msg.channel.send(ans);
      break;
    }
  },
  startRefresh: function(bot) {
    setInterval(() => {
      var http = require('http');
      http.get('http://tetr.io/', function (res) {
        refresh(bot);
      }).on('error', function(e) {
        console.error(e);
      });
    }, 60000);
  }
}