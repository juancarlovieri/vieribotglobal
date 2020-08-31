const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("ongoingLagrange.json", "utf8"));
var cancelList = new Map();
var startTime = 0;
const lockFile = require('lockfile');
var ongoing = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("challengeLagrange.json", "utf8"));
var Discord = require("discord.js");
var challenge = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("../lagrange_rank.json", "utf8"));
var rank = new Map(Object.entries(obj));
var glob = -1;
var ranked = false;
var canceler = 0;
var prevSolver = 0;
var prevL = -1, prevR = -1;
var lastId = -1;
var chal = {
  id: -1
};

async function printRank(msg, bot){
  var list = [];
  rank.forEach(function lol(value, key){
    list[list.length] = {
      name: key,
      value: value
    }
  });
  // [
  //   {
  //     name: "tim A: " + nama[0],
  //     value: arr[0]
  //   },
  //   {
  //     name: "tim B: " + nama[1],
  //     value: arr[1]
  //   }
  // ]
  list.sort(cmp);
  for(var i = 0; i < list.length; i++){
    let temp = await bot.users.fetch(list[i].name);
    list[i].name =  (i + 1) + '. ' + temp.username;
  }
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  msg.channel.send({files: [vieri], embed: {
    color: 16764006,
    author: {
      name: 'lagrange',
      icon_url: "attachment://viericorp.png"
    },
    title: 'top of the leaderboard',
    fields: list,
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  });
}

function cmp(a, b){
  let comparison = 0;
  if (a.value < b.value) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

function save(){
  var jsonObj = Object.fromEntries(ongoing);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("ongoingLagrange.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(challenge);
  console.log(jsonObj);
  jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("challengeLagrange.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(rank);
  console.log(jsonObj);
  jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("../lagrange_rank.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

async function newRanked(msg){
  var l = 1000, r = 9999;
  prevL = l, prevR = r;
  ranked = true;
  startTime = Date.now();
  glob = Math.floor(Math.random() * (r - l + 1)) + l;
  chal = await msg.channel.send('global ranked duel is starting!\n integer is: **' + glob + '**');
  chal.react('🤷‍♀️');
}

async function newGlobal(args, msg){
  if(isNaN(args[1]) || isNaN(args[2]))return;
  if(parseInt(args[1]) > parseInt(args[2]))return;
  if(glob != -1){
    msg.channel.send('there is an ongoing global duel, integer is: **' + glob + '**');
    return;
  }
  var l = parseInt(args[1]), r = parseInt(args[2]);
  prevL = l, prevR = r;
  if(l < 0)return;
  glob = Math.floor(Math.random()*(r-l+1))+l;
  chal = await msg.channel.send('global duel is starting!\ninteger is: **' + glob + '**');
  // console.log(chal);
  ranked = false;
  chal.react('🤷‍♀️');
}

async function newGlobalRepeat(msg){
  if(ranked) msg.channel.send('repeating, previous range was: ranked');
  else msg.channel.send('repeating, previous range was: ' + prevL + ' and ' + prevR);
  var l = prevL, r = prevR;
  startTime = Date.now();
  glob = Math.floor(Math.random()*(r-l+1))+l;
  chal = await msg.channel.send('global duel is starting!\ninteger is: **' + glob + '**');
  chal.react('🤷‍♀️');
}

function reveal(msg, id){
  console.log(id);
  if(glob == -1){msg.channel.send('no ongoing');return;}
  if(cancelList.has(id) == false)canceler++;
  cancelList.set(id, 1);
  console.log(cancelList);
  console.log(canceler);
  console.log(prevSolver);
  if(canceler < 3  && id != prevSolver){msg.channel.send('not enough people to cancel');return;}
  cancelList.clear();
  console.log(cancelList);
  canceler = 0;
  console.log(glob);
  glob = -1;
  var spawn = require('child_process').spawn;
  var child = spawn('python3', ['lagrange reveal fast.py']);
  child.stdout.on('data', function(data){
    console.log(data);
    var res = JSON.parse(data.toString());
      msg.channel.send(res);
    msg.react('🔁');
    lastId = msg.id;
  });
  child.on('close', function(code){
    if(code != 0){
      msg.channel.send('internal error, contact developer');
      console.log('python crashed');
    }
  });
  child.stdin.write(glob.toString());
  child.stdin.end();
}

module.exports = {
  message: function(bot, msg){
    var args = msg.content.split(' ');
    if(args.length == 2 && !isNaN(args[1])){
      if(glob != -1){
        msg.channel.send('there is an ongoing global duel, integer is: **' + glob + '**');
        return;
      }
      if(parseInt(args[1]) < 0)return;
      var l = 0, r = parseInt(args[1]);
      prevL = l, prevR = r;
      ranked = false;
      glob = Math.floor(Math.random()*(r-l+1))+l;
      msg.channel.send('global duel is starting!\ninteger is: **' + glob + '**');
    }
    if(args.length == 3){
      newGlobal(args, msg);
      return; 
    }
    switch (args[1]){
      case 'resend':
        if(ongoing.has(msg.author.id) == false)return;
        msg.channel.send(ongoing.get(msg.author.id).problem);
      break;
      case 'ranked':
        if(glob != -1){
          msg.channel.send('there is an ongoing global duel, integer is: **' + glob + '**');
          return;
        }
        newRanked(msg);
      break;
      case 'rank':
        printRank(msg, bot);        
      break;
      case 'ch':
        if(args.length != 5)return;
        if(ongoing.has(msg.author.id)){
          msg.channel.send('you are in a duel');
          return;
        }
        if(challenge.has(msg.author.id)){
          msg.channel.send('someone is challenging you');
          return;
        }
        var opp = args[2].substr(3, args[2].length - 4);
        if(challenge.has(opp)){
          msg.channel.send('someone is challenging the one you are challenging');
          return;
        }
        if(ongoing.has(opp)){
          msg.channel.send('Shhh, the person you are challenging is in a duel');
          return;
        }
        if(isNaN(args[3]) || isNaN(args[4]))return;
        if(parseInt(args[3]) > parseInt(args[4]))return;
        if(parseInt(args[3]) < 0)return;
        var temp = {
          challenger: msg.author.id,
          challenged: opp,
          l: parseInt(args[3]),
          r: parseInt(args[4])
        }
        challenge.set(msg.author.id, temp);
        challenge.set(opp, temp);
        save();
        console.log(args[2]);
        msg.channel.send('<@' + opp + '>, <@' + msg.author.id + '> is challenging you on a lagrange duel!');
      break;
      case 'reveal':
        reveal(msg, msg.author.id);
      break;
      case 'dec':
        if(challenge.has(msg.author.id) == false)return;
        var temp = challenge.get(msg.author.id);
        challenge.delete(temp.challenger);
        challenge.delete(temp.challenged);
        save();
        msg.channel.send('duel between <@' + temp.challenged + '> and <@' + temp.challenger + '> is cancelled');
      break;
      case 'acc':
        console.log('accept');
        if(challenge.has(msg.author.id) == false)return;
        if(challenge.get(msg.author.id).challenger == msg.author.id)return;
        var ch = challenge.get(msg.author.id);
        var temp = {
          problem: Math.floor(Math.random()*(ch.r-ch.l+1))+ch.l,
          opp: ch.challenger
        }
        challenge.delete(msg.author.id);
        challenge.delete(ch.challenger);
        ongoing.set(msg.author.id, temp);
        var temp2 = {
          problem: temp.problem,
          opp: msg.author.id
        }
        ongoing.set(ch.challenger, temp2);
        save();
        msg.channel.send('duel between <@' + msg.author.id + '> and <@' + ch.challenger + '> is starting!\n The integer is: **' + temp.problem + '**');
      break;
      case 'ans':
        if(ongoing.has(msg.author.id) == false)return;
        if(args.length != 6)return;
        var res = 0;
        for(var i = 2; i < 6; i++){
          if(isNaN(args[i]))return;
          res += parseInt(args[i]) * parseInt(args[i]);
        }
        var temp = ongoing.get(msg.author.id);
        if(res != temp.problem){
          const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'WA');
          msg.react(emoji);
          return;
        }
        ongoing.delete(msg.author.id);
        ongoing.delete(temp.opp);
        save();
        const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'AC');
        msg.react(emoji);
        // msg.channel.send('<@' + msg.author.id + '> has beaten <@' + temp.opp + '> on a lagrange duel');
      break;
      case 'help':
        msg.channel.send('lagrange is a game where you are given a number and you should find four integers where the sum of their square equals to the number you are given\n^| ch x l r to challenge user x with the range of l to r\n^| acc to accept a challenge\n^| dec to decline or cancel a challenge\n^| ans a b c d to answer a problem\n^| resend to resend the problem');
      break;
    }
  },
  isAns: function(bot, msg){
    var args = msg.content.split(' ');
    if(args.length != 4)return;
    var res = 0;
    for(var i = 0; i < 4; i++){
      if(isNaN(args[i]))return;
      res += parseInt(args[i]) * parseInt(args[i]);
    }
    var temp = ongoing.get(msg.author.id);
    if(ongoing.has(msg.author.id)){
      if(res != temp.problem){
        const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'WA');
        msg.react(emoji);
        return;
      }
      ongoing.delete(msg.author.id);
      ongoing.delete(temp.opp);
      var opts = {
        wait: 30000
      }
      lockFile.lock('../lock.lock', opts, function(error){
        if(error != undefined){
          console.log('busy');
          console.error(error);
          return;
        }
        save();
        lockFile.unlockSync('../lock.lock');
        const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'AC');
        msg.react(emoji);
      });
    }
    if(glob == -1){
      return;
    }
    if(res == glob){
      glob = -1;
      prevSolver = msg.author.id;
      const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'AC');
      msg.react(emoji);
      msg.react('🔁');
      lastId = msg.id;
      if(ranked){
        var prevRank = 10;
        if(rank.has(msg.author.id)){
          prevRank = rank.get(msg.author.id) + 10;
        }
        rank.set(msg.author.id, prevRank);
        save();
      }
    } else{
       const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'WA');
      msg.react(emoji);
    }
  },
  repeat: function(msg, emoji, user){
    if(chal.id == msg.id && emoji.name == '🤷‍♀️' && glob != -1){
      reveal(msg, user.id);
    }
    if(lastId != msg.id || emoji.name != '🔁'){
      return;
    }
    lastId = -1;
    if(glob != -1){msg.channel.send('thre is an ongoing');return;}
    newGlobalRepeat(msg);
  }
}
