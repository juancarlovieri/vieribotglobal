const Discord=  require('discord.js');
var bot;
const fs = require('fs')
const { MessageEmbed } = require('discord.js');
const path = 'monitor.json'
var request = require('sync-request');
const prettyMilliseconds = require('pretty-ms');


var monitor = new Map();

try {
  if (fs.existsSync(path)) {
    var obj = JSON.parse(fs.readFileSync(path, "utf8"));
    monitor = new Map(Object.entries(obj));
  }
} catch(err) {
  console.log('new map');
}

function save(){
  var jsonObj = Object.fromEntries(monitor);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(path, jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
}

function refresh(bot) {
  monitor.forEach(function (val, id) {
    var record = JSON.parse(request('GET', "https://ch.tetr.io/api/users/"+ id + "/records").getBody()).data.records;
    if (val.blitz == undefined) {
      if (record.blitz.record == null) val.blitz = null;
      else val.blitz = record.blitz.record.endcontext.score;
      if (record["40l"].record == null) val["40l"] = null;
      else val["40l"] = record["40l"].record.endcontext.score;
      monitor.set(id, val);
      save();
      return;
    }
    if (record.blitz.record != null) {
      var newblitz = record.blitz.record.endcontext.score;
      if (newblitz > val.blitz) {
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

        bot.channels.cache.get(val.channel).send({ embeds: [embed] });
        val.blitz = newblitz;
      }
    }
    if (record["40l"].record != null) {
      var new40l = record["40l"].record.endcontext.finalTime;
      if (new40l < val["40l"]) {
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

        bot.channels.cache.get(val.channel).send({ embeds: [embed] });
        val["40l"] = new40l;
      }
    }
    if (val != monitor.get(id)) {
      monitor.set(id, val);
    }
  });

  monitor.forEach(function (val, id) {
    var request = require('sync-request');
    var match = JSON.parse(request('GET', 'https://ch.tetr.io/api/streams/league_userrecent_' + id).getBody());
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
      var friend = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + cur.endcontext[0].user._id).getBody()).data.user.league;
      var foe = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + cur.endcontext[1].user._id).getBody()).data.user.league;  
      var color;
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

      bot.channels.cache.get(val.channel).send({ embeds: [embed] });
      // console.log(match[i]._id);
      // bot.channels.cache.get(val.channel).send(match[i]._id);
    }
    val.last = match[0]._id
    monitor.set(id, val);
  });
  save();
}

module.exports = {
  cmd: function(bot, msg) {
    var args = msg.content.split(" ");
    switch (args[1]) {
      case 'monitor':
        if (args.length != 3) {
          msg.channel.send("wot");
          return;
        }
        var user = JSON.parse(request('GET', 'https://ch.tetr.io/api/users/' + args[2]).getBody());
        if (user.success == false) {
          msg.channel.send("who is dat");
          return;
        }
        var id = user.data.user._id;
        if (monitor.has(id)) {
          msg.channel.send("bruh we have that guy");
          return;
        }
        var match = JSON.parse(request('GET', 'https://ch.tetr.io/api/streams/league_userrecent_' + id).getBody());
        match = match.data.records[0];
        var dat = {
          last: match._id,
          channel: msg.channel.id,
          username: user.data.user.username
        };
        monitor.set(id, dat);
        save();
        msg.channel.send("saved!");
      break;
      case 'refresh':
        refresh(bot);
      break;
    }
  },
  startRefresh: function(bot) {
    setInterval(() => {
      refresh(bot);
    }, 60000);
  }
}