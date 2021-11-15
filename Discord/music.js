const Discord=  require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');
var bot;
const fs = require('fs');
const ytdl = require('ytdl-core');
var queue = new Map();
const youtubesearchapi = require('youtube-search-api');
var quality = 25;
var pending = [];
var last = 0;

function start(guild, song) {
  const srvQ = queue.get(guild.id);
  if (!song) {
    // srvQ.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = srvQ.connection
    .play(ytdl(song.url, {filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << quality}))
    .on("finish", () => {
      srvQ.songs.shift();
      start(guild, srvQ.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(srvQ.volume / 5);
  srvQ.textChannel.send(`Start playing: **${song.title}**`);
}
async function addQueue(msg, srvQ, song, voiceChannel) {
  if (!srvQ) {
    const queueContruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(msg.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      start(msg.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(msg.guild.id);
      return;
      // return msg.channel.send(err);
    }
  } else {
    srvQ.songs.push(song);
    return msg.channel.send(`${song.title} has been added to the queue!`);
  }
}

async function play(msg, srvQ) {
  var args = msg.content.split(" ");
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel)
    return msg.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return msg.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }
  var name = "";
  for (var i = 2; i < args.length; ++i) name += args[i];
  const arr = await youtubesearchapi.GetListByKeyword(name, false, 1);
  const songInfo = await ytdl.getInfo(arr.items[0].id);
  const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
   };
  addQueue(msg, srvQ, song, voiceChannel);
}

async function search(msg, srvQ) {
  var args = msg.content.split(" ");
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel)
    return msg.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return msg.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }
  var name = "";
  for (var i = 2; i < args.length; ++i) name += args[i];
  const arr = await youtubesearchapi.GetListByKeyword(name, false, 10);
  var res = "";
  for (var i = 0; i < arr.items.length; ++i) {
    // console.log(arr.items[i]);
    res += (i + 1);
    res += ". " + arr.items[i].title + ' | **' + arr.items[i].channelTitle + "**";
    res += '\n';
  }
  var cur = {
    msg: msg,
    arr: arr,
    time: new Date().valueOf()
  };
  pending.push(cur);
  msg.channel.send(res);
}

async function cek(msg) {
  var now = new Date().valueOf();
  for (var i = 0; i < pending.length; ++i) {
    if (pending[i].time + 30000 < now) {
      // pending.splice(i, 1);
      // --i;
      // cek();
      // break;
      continue;
    }
    if (pending[i].msg.author.id != msg.author.id) continue;
    if (pending[i].msg.guild.id != msg.guild.id) continue;
    var indx = parseInt(msg.content);
    if (indx < 1 || indx > pending[i].arr.length) continue;
    console.log('picked');
    --indx;
    const arr = pending[i].arr;
    msg = pending[i].msg;
    const songInfo = await ytdl.getInfo(arr.items[indx].id);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };
    const voiceChannel = msg.member.voice.channel;
    var srvQ = queue.get(msg.guild.id);
    await addQueue(msg, srvQ, song, voiceChannel);
    await pending.splice(i, 1);
    break;
  }
}

function stop(msg, srvQ) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
    
  if (!srvQ)
    return msg.channel.send("There is no song that I could stop!");
    
  srvQ.songs = [];
  srvQ.connection.dispatcher.end();
}

function skip(msg, srvQ) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!srvQ)
    return msg.channel.send("There is no song that I could skip!");
  try {srvQ.connection.dispatcher.end();
  } catch (err) {
    console.error(err);
  }
}

function pQueue(msg, srvQ) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      "You have to be in a voice channel to see the queue"
    );
  if (!srvQ)
    return msg.channel.send("There is no queue!");
  var ans = "";
  for (var i = 0; i < srvQ.songs.length; ++i) {
    ans += srvQ.songs[i].title + '\n';
  }
  return msg.channel.send(ans);
}

function changeQuality(msg) {
  var args = msg.content.split(" ");
  if (isNaN(args[2])) {
    return msg.channel.send("Input a valid quality");
  }
  quality = parseInt(args[2]);
  msg.channel.send("Quality changed! It will only affect the next songs");
}

function remove(msg, srvQ) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      "You have to be in a voice channel to see the queue"
    );
  if (!srvQ)
    return msg.channel.send("There is no queue!");
  var args = msg.content.split(' ');
  if (isNaN(args[2])) {
    return msg.channel.send("Enter a valid number");
  }
  var indx = parseInt(args[2]);
  if (srvQ.songs.length < indx || indx < 1) {
    return msg.channel.send("Out of bounds");
  }
  if (indx == 1) {
    return msg.channel.send("Don't remove the current track");
  }
  --indx;
  srvQ.songs.splice(indx, 1);
  msg.channel.send("Song removed");
}

module.exports = {
  req: function(bot, msg) {
    if (last + 5000 > new Date().valueOf()) {
      return msg.channel.send("Chill out... Wait 5 seconds before using the music command again");
    }
    last = new Date().valueOf();
    var args = msg.content.split(" ");
    if(args.length == 0){
      return;
    }
    var srvQ = queue.get(msg.guild.id);
    switch (args[1]) {
      case 'play':
        play(msg, srvQ);
      break;
      case 'stop':
        stop(msg, srvQ);
      break;
      case 'skip':
        skip(msg, srvQ);
      break;
      case 'queue':
        pQueue(msg, srvQ);
      break;
      case 'quality':
        changeQuality(msg);
      break;
      case 'remove':
        remove(msg, srvQ);
      break;
      case 'search':
        search(msg, srvQ);
      break;
    }
  },
  check: function(bot, msg) {
    if (isNaN(msg.content)) return;
    cek(msg);
  }
}