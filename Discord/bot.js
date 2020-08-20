const Discord = require("discord.js");
var bot = new Discord.Client();
var auth = require('./auth.json');
const ytdl = require("ytdl-core");
bot.login(auth.token);
const fs = require('fs');
const isUp = require('is-up');
var obj;
const link = require('./link.js');
const test = require('./test.js');
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
const ping = require('minecraft-server-util');

// import ping from 'minecraft-server-util';
 


// console.log((1599715800000 - 3600000) - Date.now());

function save(){
}

var utcSeconds = 1595667600 - 3600;

function command(args, msg){
  console.log(args[0]);
  switch(args[0]){
    case '^bigmoji':
      var alr = 0;
      var indx = -1;
      for(var i = 0; i < args[1].length; i++){
        if(args[1][i] == ':'){
          ++alr;
          if(alr == 2){
            indx = i + 1;
            break;
          }
        }
      }
      if(indx == -1){
        msg.channel.send('internal error, contact developer');
        return;
      }
      console.log(args[1]);
      msg.channel.send('https://cdn.discordapp.com/emojis/' + args[1].substr(indx, args[1].length - indx - 1) + '.png');
    break;
    case '^mc':
      console.log(args.length);
      if(args.length != 3)return;
      ping(args[1], parseInt(args[2]), { protocolVersion: 498, connectTimeout: 1000 * 10 }).then((response) => {
        if (error){
          msg.channel.send('server not found');
          throw error;
        }
        var hasil = response.descriptionText + '\n';
        hasil += 'version: ' + response.version + '\n';
        hasil += 'online players: ' + response.onlinePlayers + '\n';
        hasil += 'max players: ' + response.maxPlayers + '\n';
        msg.channel.send(hasil);
        console.log(response);
      }).catch((error) => {
          throw error;
      });;
    break;
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
    case '^coinflip':
      if(Math.random() > 0.5){
        msg.channel.send('heads');
      } else msg.channel.send('tails');
    break;
    case '^lag':
      lagrange.message(bot, msg);
    break;
    case '^activity':
      activity.run(bot, msg);
    break;
    case '^link':
      if(msg.channel.guild.id != '733473838754693232')return;
      link.run(bot, msg);
    break;
    // case '^create':
    //   var temp = {
    //     a: [],
    //   };
    //   var jsonContent = JSON.stringify(temp);
    //   fs.createWriteStream('./links.json').write(jsonContent);
    //   console.log('created');
    // break;
    case '^test':
      if(msg.channel.guild.id != '733473838754693232')return;
      test.message(bot, msg);
    break;
    case '^set':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      status = args[1];
      bot.user.setPresence({
        status: status,
        game: {
            name: "Using !help",  //The message shown
            type: "STREAMING" //PLAYING: WATCHING: LISTENING: STREAMING:
        }
      });
    break;
    case '^freemems':
      var os = require('os-utils');
      os.cpuFree(function(v){
          console.log( 'CPU free (%): ' + Math.round(v * 10000) / 100 );
      });
      os.cpuUsage(function(v){
          msg.channel.send('**CPU usage:** ' + Math.round(v * 10000) / 100  + '%\n**Number of cores:** ' + os.cpuCount() + '\n**RAM Usage**: ' + Math.round((os.totalmem() - os.freemem()) * 100) / 100 + ' mb /' + Math.round(os.totalmem() * 100) / 100 + ' mb');
      });
      console.log(os.cpuCount());
    break;
    case '^send':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      msg.channel.send('these are the files\nglobal:', {files: ["../debug.log", "../error.log", "../rating.json", "../points.json"]});
      msg.channel.send('discord part 1:', {files: ["changeHandle.json", "./ongoing.json", "./ongoingAtcoder.json", "./ongoingTeam.json", "./teamChallenge.json", "./problems.json", "./activity.json"]});
      msg.channel.send('discord part 2: ', {files: ["./bot.js", "../lagrange_rank.json", "./links.json", "./tests.json", "./handles.json", "./atcoderHandles.json"]});
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
      // wolfram.ask(bot, msg);
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

function play3(){
  const channel = bot.channels.cache.get("737660679829323838");
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
  play3();
  // bot.user.setStatus("idle", "lagrange");
  test.run(bot);
  bot.user.setPresence({
    status: 'dnd'
  });
})

bot.on("message", msg => {
  // console.log(msg);
  if(msg.author.bot == true)return;
  activity.add(msg);
  if(msg.content == '^unlock'){
    if(msg.author.id != '455184547840262144'){
      return;
    }
    lockFile.unlockSync('../lock.lock');
  }
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
  // console.log(reaction);
  if(user.bot == true)return;
  if(user.id == '724954396147974194')return;
  lagrange.repeat(reaction.message, reaction.emoji, user);
  // console.log(reaction.emoji);
  if(reaction.message.author.bot == true)return;
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
