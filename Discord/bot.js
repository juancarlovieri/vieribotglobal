const {Client, Intents} = require("discord.js");
const Discord = require('discord.js');
const mongoose = require('mongoose');

var bot = new Client({intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
var auth = require('./auth.json');
const ytdl = require("ytdl-core");
bot.login(auth.token);
const fs = require('fs');
const launch = require('./launch-update.js');
const isUp = require('is-up');
var obj;
const link = require('./link.js');
const test = require('./test.js');
const bill = require('./bill.js');
const spammer = require('./spammer.js');
const lagrange = require('./lagrange.js');
const delMsg = require('./messageDelete.js');
const prettyMilliseconds = require('pretty-ms');
const cfduel = require('./cfduel.js');
const atcoder = require('./atcoder.js');
const trans = require('./translate.js');
const many = require('./many.js');
const lockFile = require('lockfile');
const wolfram = require('./wolfram.js');
// const activity = require('./activity.js');
const status = "do not disturb";
const si = require('systeminformation');
const mc = require('minecraft-server-util');
const predict = require('./tlx/predict.js');
const gamble = require('./gamble.js');
// const music = require('./music.js');
const tetr = require('./tetr.js');
const tetrNew = require('./tetr_new');

// console.log((1599715800000 - 3600000) - Date.now());

mongoose.connect(auth.mongodb);

function save(){
}




var utcSeconds = 1595667600 - 3600;

var maint = 0;

function command(args, msg){
  console.log(args[0]);
  switch(args[0]){
    case '^help':
      var vieri = new Discord.MessageAttachment('../viericorp.png');
      var str = '**^tetr help** - help page for tetris section\n';
      str    += '**^gamble help** - help page for gamble section\n';
      str    += '**^coinflip** - do a coinflip, obviously\n';
      str    += '**^uptime** - see the bot\'s uptime\n';
      str    += '**^freemems** - see the bot\'s resource usage\n';
      str    += '**^bigmoji <emoji>** - converts emoji to a big image (only works on server emoji)\n';
      str    += '**^isup <website>** - check if <website> is online\n';
      // console.log(str);
      msg.channel.send({files: [vieri], embeds: [{
          color: 16764006,
          author: {
            name: 'Vieri Bot',
            icon_url: "attachment://viericorp.png"
          },
          title: 'help center',
          description: str,
          timestamp: new Date(),
          footer: {
            text: "By Vieri Corp.™ All Rights Reserved"
          }
        }]
      });
    break;
    case '^gamble':
      gamble.command(bot, msg, args);
    break;
    // case '^spam':
    //   many.msg(bot, msg, args);
    // break;
    case '^ratings':
      var request = require('sync-request');
      var list = request('GET', 'http://codeforces.com/api/problemset.problems');
      var problems = JSON.parse(list.getBody()).result.problems;
      var rating = [];
      for(var i = problems.length - 1; i >= 0; i--){
        if(problems[i].contestId == args[1]){
          if(problems[i].rating){
            rating[rating.length] =  {
              name:'\u200b',
              value: '**' + problems[i].index + '**: ' + problems[i].rating
            }
          } else{
            msg.channel.send('ratings not yet published');
            return;
          }
        }
      }
      if(rating.length == 0){
        msg.channel.send('contest not found');
        return;
      }
      // msg.channel.send(hasil);
      var vieri = new Discord.MessageAttachment('../viericorp.png');
      msg.channel.send({files: [vieri], embeds: [{
        color: 16764006,
        author: {
          name: 'lagrange',
          icon_url: "attachment://viericorp.png"
        },
        title: 'problem rating for: ' + args[1],
        fields: rating,
        timestamp: new Date(),
        footer: {
          text: "By Vieri Corp.™ All Rights Reserved"
        }
      }]
      });
    break;
    case '^idler':
      if(args.length != 2)return;
      if(msg.author.id != '455184547840262144' && msg.author.id != '758191365065670687')return;
      var spawn = require('child_process');
      var child = spawn.spawn('python3', ['./idler.py']);
      child.stdout.on('data', function(data){
        console.log(data);
      });
      child.on('close', function(code){
        if(code != 0){
          console.log('python crashed');
          console.log(code);
        }
      });
      child.stdin.write(args[1]);
      child.stdin.end();
    break;
    case '^specs':
      si.cpu().then(data =>{
        var hasil = "";
        hasil += 'Processor: ' + data.processors + 'x ' + data.manufacturer + ' ' + data.brand + '\n';
        hasil += 'Cores: ' + data.cores + '\n';
        si.graphics().then(data =>{
          console.log(data);
          console.log(data.controllers);
            hasil += 'Graphics card: ' + '\n';
          for(var i = 0; i < data.controllers.length; i++){
            hasil += '   ' + data.controllers[i].model + '; vram: ' + data.controllers[i].vram + '\n';
          }
          // hasil += 'Graphics card: ' + data.controllers.model + '\n';
          // hasil += 'Vram: ' + data.controllers.vram + 'mb';
          msg.channel.send(hasil);
        })
      }).catch  (error => console.error(error));

    break;
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
    case '^predict':
      if(args.length != 3)return;
      predict.calc(bot, msg, args[1], args[2]);
    break;
    case '^mc':
      console.log(args.length);
      if(args.length != 3)return;
      mc.status(args[1], { port: parseInt(args[2]) })
        .then((response) => {
          var hasil = response.description.descriptionText + '\n';
          hasil += 'version: ' + response.version + '\n';
          hasil += 'online players: ' + response.onlinePlayers + '\n';
          hasil += 'max players: ' + response.maxPlayers + '\n';
          msg.channel.send(hasil);
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
          msg.channel.send('server not found');
          return;
      });
      // ping(args[1], parseInt(args[2]), (error, response) => {
      //   console.error(error);
      //   if (error){
      //     msg.channel.send('server not found');
      //     // throw error;
      //     return;
      //   }
      // });
    break;
    case '^isup':
      (async () => {
        try {
          if(await isUp('http://' + args[1])){
            msg.channel.send(args[1] + ' is up');
          } else{
            msg.channel.send(args[1] + ' is down');
          }
        } catch (e) {
          msg.channel.send("invalid url (remove the http)");
        }
      })();
    break;
    case '^fox':
      if(msg.author.id != '455184547840262144'){
        return;
      }
      many.fox(bot, msg, args);
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
      // activity.run(bot, msg);
    break;
    case '^link':
      if(msg.channel.guild.id != '733473838754693232' && msg.channel.guild.id != '758565620907245599' && msg.channel.guild.id != '626412169751166996')return;
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
      if(msg.channel.guild.id != '733473838754693232' && msg.channel.guild.id != '758565620907245599' && msg.channel.guild.id != '626412169751166996')return;
      test.message(bot, msg);
    break;
    case '^set':
      // console.log("here");
      // if(msg.author.id != '455184547840262144'){
      //   return;
      // }
      // var status = args[1];
      // console.log("here");
      // bot.user.setPresence({
      //   activities: [{
      //       name: "Using !help",  //The message shown
      //       type: "STREAMING" //PLAYING: WATCHING: LISTENING: STREAMING:
      //   }]
      // });
      setPresence();
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
      msg.channel.send('discord part 1:', {files: ["datas/changeHandle.json", "./ongoing.json", "./ongoingAtcoder.json", "./ongoingTeam.json", "./teamChallenge.json", "./problems.json", "datas/activity.json"]});
      msg.channel.send('discord part 2: ', {files: ["./bot.js", "../lagrange_rank.json", "./links.json", "./tests.json", "./handles.json", "./atcoderHandles.json", "./published.json"]});
      msg.channel.send('discord part 3: ', {files: ["./gambleLocks.json", "gambles.json", "balance.json"]});
      msg.channel.send('telegram:', {files: ["../Telegram/handles.json", "../Telegram/ongoing.json", "../Telegram/problems.json"]});
    break;
    case '^translate':
      trans.translate(msg);
    break;
    case '^uptime':
      msg.channel.send(prettyMilliseconds(bot.uptime));
    break;
    case '^launches':
      launch.upcoming(bot, msg);
    break;
    case '^launch':
      launch.view(bot, msg);
    break;
    case '^atcoder':
      if(atcoder.duel(bot, msg) != 0){

      }
    break;
    case '^cf':
      cfduel.duel(bot, msg);
    break; 
    case '^ask':
      // wolfram.ask(bot, msg);
    break;
    case '^bill':
      bill.cmd(bot, msg);
    break;
    case '^music':
      // music.req(bot, msg);
    break;
    case '^spam':
      spammer.cmd(bot, msg, args);
    break;
    case '^schedule':
      if (args.length < 3 || isNaN(args[1])) {
        msg.channel.send("wot");
        return 0;
      }
      var dst = parseInt(args[1]) * 1000;
      if (dst < 0) {
        msg.channel.send("invalid time");
        return 0;
      }
      args = args.slice(2, args.length);
      var res = args[0];
      for (var i = 1; i < args.length; ++i) {
        res = res.concat(" ", args[i]);
      }
      msg.channel.send("ok");
      msg.content = res;
      setTimeout(() => {
        command(args, msg);
      }, dst);
    break;
    case '^tetr':
      tetr.cmd(bot, msg);
    break;
    case '^tetr2':
      tetrNew.cmd(bot, msg);
      break;
    case '^ping':
      msg.channel.send(`Pong! Latency is ${Date.now() - msg.createdTimestamp}ms. API Latency is ${Math.round(bot.ws.ping)}ms`)
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
    // console.log('error');
    // console.error(e);
  });
}

function play3(){
  const channel = bot.channels.cache.get("755968911723462697");
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    console.log("Successfully connected.");
    connection.play(ytdl('https://youtu.be/hGlyFc79BUE')).on("finish", () =>{
      play();
    }).on("error", error => console.error(error));
  }).catch(e => {
    // console.log('error');
    // console.error(e);
  });
}

function play4(){
  const channel = bot.channels.cache.get("758936967161053204");
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    console.log("Successfully connected.");
    connection.play(ytdl('https://youtu.be/hGlyFc79BUE')).on("finish", () =>{
      play();
    }).on("error", error => console.error(error));
  }).catch(e => {
    // console.log('error');
    // console.error(e);
  });
}

function play5(){
  const channel = bot.channels.cache.get('766640533664825364');
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    console.log("Successfully connected.");
    connection.play(ytdl('https://youtu.be/hGlyFc79BUE')).on("finish", () =>{
      play();
    }).on("error", error => console.error(error));
  }).catch(e => {
    // console.log('error');
    // console.error(e);
  });
}

function setPresence() {
  bot.user.setPresence({
    status: 'dnd',
    activities: [{
        name: `^help`,  //The msg shown
        type: `WATCHING` //PLAYING: WATCHING: LISTENING: STREAMING:
    }]
  });
}

bot.on("ready", msg =>{
  console.log('ready'); 
//   play();
// //   play2();
//   play3();
//   play4();
//   play5();
  // bot.user.setStatus("idle", "lagrange");
  test.run(bot);
  setPresence();
  setInterval(setPresence, 3600000);
  launch.new(bot);
  tetr.startRefresh(bot);
  tetrNew.startRefresh(bot);
})

bot.on("messageCreate", msg => {
  // console.log(msg);
  if(msg.author.bot == true)return;
  // activity.add(msg);
  if(msg.content == '^maint?'){
    if(maint == 0){
      msg.channel.send('bot is not in maintenance');
    } else msg.channel.send('bot is in maintenance');
    return;
  }
  if(msg.content == '^unlock'){
    if(msg.author.id != '455184547840262144'){
      return;
    }
    lockFile.unlockSync('../lock.lock');
  }
  if(msg.content ==  '^maintenance'){
    if(msg.author.id != '455184547840262144'){
      return;
    }
    maint = (maint + 1) % 2;
    msg.channel.send('set maint to ' + maint);
    return;
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
  if(!maint){
    lagrange.isAns(bot, msg);
    // music.check(bot, msg);
    bill.isBill(bot, msg);
  }
  if(args[0][0] == '^'){
    if(maint){
      msg.channel.send('bot in maintenance, please wait');
      return;
    }
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
  if(reaction.message.guild.id == '688018099584237610')return;
  // message.react(emoji);
  reaction.message.react(reaction._emoji);
  // console.log(reaction);
});

bot.on("messageDelete", (msg) => {
  // console.log(msg);
  delMsg.deleted(msg, bot);
});

bot.on('messageUpdate', (oldMessage, newMessage) => {
  if(oldMessage.content == newMessage.content)return;
  // console.log(oldMessage._edits);
  delMsg.edited(oldMessage, bot);
});
