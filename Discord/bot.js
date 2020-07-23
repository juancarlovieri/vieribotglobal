const Discord = require("discord.js");
var bot = new Discord.Client();
var auth = require('./auth.json');
const ytdl = require("ytdl-core");
bot.login(auth.token);
const fs = require('fs');
const isUp = require('is-up');
var obj;
const lagrange = require('./lagrange.js');
const delMsg = require('./messageDelete.js');
const prettyMilliseconds = require('pretty-ms');
const cfduel = require('./cfduel.js');
const atcoder = require('./atcoder.js');
const trans = require('./translate.js');
const lockFile = require('lockfile');
const wolfram = require('./wolfram.js');
const activity = require('./activity.js');
const status = "do not disturb";

function save(){
}

function command(args, msg){
  switch(args[0]){
    case '^isup':
      (async () => {
        if(await isUp('http://' + args[1])){
          msg.channel.send(args[1] + ' is up');
        } else{0
          msg.channel.send(args[1] + ' is down');
        }
        //=> true
      })();
    break;
    case '^clear':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      delMsg.clear();
    break;
    case '^|':
      lagrange.message(bot, msg);
    break;
    case '^activity':
      activity.run(bot, msg);
    break;
    // case '^create':
    //   var temp = {
    //     a: [],
    //     b: "foo"
    //   };
    //   var jsonContent = JSON.stringify(temp);
    //   fs.createWriteStream('./changeHandle.json').write(jsonContent);
    //   console.log('created');
    // break;
    case '^set':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      status = args[1];
    break;
    case '^send':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      msg.channel.send('these are the files\nglobal:', {files: ["../debug.log", "../error.log", "../rating.json", "../points.json"]});
      msg.channel.send('discord:', {files: ["./handles.json", "./atcoderHandles.json", "changeHandle.json", "./ongoing.json", "./ongoingAtcoder.json", "./ongoingTeam.json", "./teamChallenge.json", "./problems.json", "./activity.json"]});
      msg.channel.send('telegram:', {files: ["../Telegram/handles.json", "../Telegram/ongoing.json", "../Telegram/problems.json"]});
    break;
    case '^translate':
      trans.translate(msg);
    break;
    case '^uptime':
      msg.channel.send(prettyMilliseconds(bot.uptime));
    break;
    case '^atcoder':
      if(atcoder.duel(bot, msg) != 0){

      }
    break;
    case '^duel':
      cfduel.duel(bot, msg);
    break; 
    case '^ask':
      wolfram.ask(bot, msg);
    break;
  }
}

function play(){
  const channel = bot.channels.cache.get("575972491940331550");
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    console.log("Successfully connected.");
    connection.play(ytdl('https://youtu.be/hGlyFc79BUE')).on("finish", () =>{
      play();
    }).on("error", error => console.error(error));
  }).catch(e => {
    console.log('error');
    console.error(e);
  });
  
}

var util = require('util');
var log_file = fs.createWriteStream('../debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var error_file = fs.createWriteStream('../error.log', {flags : 'w'});
var error_stdout = process.stdout;

console.error = function(d) { //
  error_file.write(util.format(d) + '\n');
  error_stdout.write(util.format(d) + '\n');
};

function play2(){
  const channel = bot.channels.cache.get("688603706039730326");
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    console.log("Successfully connected.");
    connection.play(ytdl('https://youtu.be/hGlyFc79BUE')).on("finish", () =>{
      play();
    }).on("error", error => console.error(error));
  }).catch(e => {
    console.log('error');
    console.error(e);
  });
}

bot.on("ready", msg =>{
  console.log('ready'); 
  play();
  play2();
  bot.user.setPresence({
    status: status,
    game: {
        name: "Using !help",  //The message shown
        type: "STREAMING" //PLAYING: WATCHING: LISTENING: STREAMING:
    }
});
})

bot.on("message", msg => {
  activity.add(msg);
  if(msg.content == '^restart'){
    if(msg.author.id != '455184547840262144'){
      return;
    }
    console.log('restarting');
    msg.channel.send('restarting');
    setTimeout(() => {
        process.exit(0);
    }, 5000);
    return;
  }
  var args = msg.content.split(" ");
  lagrange.isAns(bot, msg);
  if(args[0][0] == '^'){
    var opts = {
      wait: 30000
    }
    lockFile.lock('../lock.lock', opts, function(error){
      if(error != undefined){
        console.log('busy');
        console.error(error);
        return;
      }
      command(args, msg);
      lockFile.unlockSync('../lock.lock');
    });
  }
});

bot.on('messageReactionAdd', async (reaction, user) => {
  if(reaction.message.author.bot == true)return;
  if(user.bot == true)return;
  if(user.id == '724954396147974194')return;
  console.log('reacted');
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.log('Something went wrong when fetching the message: ', error);
      return;
    }
  }
  // message.react(emoji);
  reaction.message.react(reaction._emoji);
  // console.log(reaction);
});

bot.on("messageDelete", (msg) => {
  delMsg.deleted(msg);
});
