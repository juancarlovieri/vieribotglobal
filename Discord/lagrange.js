const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("ongoingLagrange.json", "utf8"));
var cancelList = new Map();
var startTime = 0;
const lockFile = require('lockfile');
var ongoing = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("challengeLagrange.json", "utf8"));
var Discord = require("discord.js");
var auth = require('./auth.json');
var plotly = require('plotly')('juancarlovieri', auth.plotly);
var challenge = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("../lagrange_rank.json", "utf8"));
var rank = new Map(Object.entries(obj));
var glob = "-1";
var startDate = 1599710400;
var ranked = false;
var canceler = 0;
var prevSolver = 0;
var prevL = -1, prevR = -1;
var lastId = -1;
var chal = {
  id: -1
};
let schedule = require('node-schedule');

function download(uri, filename, callback){
  const request = require('request');
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

schedule.scheduleJob('0 0 * * *', () => {
  console.log('adding new array for lagrange;');
  var newRank = new Map();
  rank.forEach(function lol(value, key){
    value[value.length] = value[value.length - 1];
    newRank.set(key, value);
  });
  rank = newRank;
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
});

async function printRank(msg, bot){
  var list = [];
  rank.forEach(function lol(value, key){
    list[list.length] = {
      name: key,
      value: value[value.length - 1]
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

function rng(l, r, msg, cust){
  var spawn = require('child_process').spawn;
  var child = spawn('python3', ['lagrange_py/rng.py']);
  child.stdout.on('data', async function(data){
    console.log(data);
    glob = JSON.parse(data.toString());
    chal = await msg.channel.send(cust + glob + '**');
    chal.react('🤷‍♀️');
  });
  child.on('close', function(code){
    if(code != 0){
      msg.channel.send('internal error, contact developer');
      console.log('python crashed');
    }
  });
  child.stdin.write(l + ' ' + r);
  console.log(l + ' ' + r);
  child.stdin.end();
}

async function newRanked(msg){
  var l = '1000', r = '9999';
  prevL = l, prevR = r;
  ranked = true;
  startTime = Date.now();
  rng(l, r, msg, 'global ranked duel is starting!\n integer is: **');
  // glob = Math.floor(Math.random() * (r - l + 1)) + l;
  // chal = await msg.channel.send('global ranked duel is starting!\n integer is: **' + glob + '**');
  // chal.react('🤷‍♀️');
}

async function newGlobal(args, msg){
  if(isNaN(args[1]) || isNaN(args[2]))return;
  if(parseInt(args[1]) > parseInt(args[2]))return;
  if(glob != -1){
    msg.channel.send('there is an ongoing global duel, integer is: **' + glob + '**');
    return;
  }
  var l = args[1], r = args[2];
  prevL = l, prevR = r;
  if(l[0] == '-')return;
  if(r[0] == '-')return;
  rng(l, r, msg, 'global duel is starting!\ninteger is: **');
  // glob = Math.floor(Math.random()*(r-l+1))+l;
  // chal = await msg.channel.send('global duel is starting!\ninteger is: **' + glob + '**');
  // console.log(chal);
  // chal.react('🤷‍♀️');
  ranked = false;
}

async function newGlobalRepeat(msg){
  if(ranked) msg.channel.send('repeating, previous range was: ranked');
  else msg.channel.send('repeating, previous range was: ' + prevL + ' and ' + prevR);
  var l = prevL, r = prevR;
  startTime = Date.now();
  rng(l, r, msg, 'global duel is starting!\ninteger is: **');
  // glob = Math.floor(Math.random()*(r-l+1))+l;
  // chal = await msg.channel.send('global duel is starting!\ninteger is: **' + glob + '**');
  // chal.react('🤷‍♀️');
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
  child.stdin.write(glob);
  glob = "-1";
  child.stdin.end();
}


function compare(a, b) {
  let comparison = 0;
  if (a.point < b.point) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

async function printGraphAll(bot, msg, args){
  var data = [];
  var names = 'graph for all';
  console.log(args.length);
  rank.forEach(function lol(value, key){
    tempName = key;
    var temp = {
      x: [],
      y: [],
      name: tempName,
      mode: "lines",
      type: "scatter"
    };
    temp.y = rank.get(key);
    for(var j = 0; j < temp.y.length; j++){
      var utcSeconds = startDate + j * 86400;
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(utcSeconds);
      d = d.toString();
      var arr = d.split(' ');
      d = arr[1].concat(' ' + arr[2]).concat(' ' + arr[3]);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var month = -1;
      for(var k = 0; k < 12; k++){
        if(arr[1] == months[k]){
          month = k + 1;
        }
      }
      if(month == -1){
        console.log('month not found');
        msg.channel.send('an error occured, contact developer');
        return;
      }
      d = arr[3] + '-' + month + '-' + arr[2];
      temp.x[j] = d;
    }
    // console.log(temp);
    data[data.length] = temp;
    // console.log(i);
  });
  console.log(data);
  for(var i = 0; i < data.length; i++){
    var tempName = await bot.users.fetch(data[i].name);
    data[i].name = tempName.username;
  }
  var layout = {
    title: names,
    xaxis: {
      autorange: true,
      tickformat: '%b %d %Y',
      type: 'date'
    },
    yaxis: {
      autorange: true,
      type: 'linear'
    }
  };
  console.log(layout);
  var graphOptions = {filename: 'umum', fileopt: "overwrite", layout: layout};
  plotly.plot(data, graphOptions, function (err, mesg) {
    console.log(mesg);
    var request = require('request');
    download(mesg.url + '.jpeg', 'display.png', function(){
      msg.channel.send(names, {
        files: [
        "display.png"
      ]
    });
    });
  });
}

async function printGraphTop(bot, msg, args){
    if(args.length < 5)return;
  if(isNaN(args[3]))return;
  if(isNaN(args[4]))return;
  var arrTemp = [];
  rank.forEach(function lol(key, value){
    arrTemp[arrTemp.length] = {name: value, point: key[key.length - 1]};
  });
  arrTemp.sort(compare);
  var l = parseInt(args[3]), r = parseInt(args[4]);
  var data = [];
  var names = 'graph for';
  console.log(args.length);
  l = Math.round(l), r = Math.round(r);
  l--;r--;
  for(var i = Math.max(l, 0); i < Math.min(r, arrTemp.length); i++){
    console.log(arrTemp[i]);
    var tempName = await bot.users.fetch(arrTemp[i].name)
    tempName = tempName.username;
    names += ' ' + tempName;
    var temp = {
      x: [],
      y: [],
      name: tempName,
      mode: "lines",
      type: "scatter"
    };
    temp.y = rank.get(arrTemp[i].name);
    for(var j = 0; j < temp.y.length; j++){
      var utcSeconds = startDate + j * 86400;
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(utcSeconds);
      console.log(d);
      d = d.toString();
      var arr = d.split(' ');
      d = arr[1].concat(' ' + arr[2]).concat(' ' + arr[3]);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var month = -1;
      for(var k = 0; k < 12; k++){
        if(arr[1] == months[k]){
          month = k + 1;
        }
      }
      if(month == -1){
        console.log('month not found');
        msg.channel.send('an error occured, contact developer');
        return;
      }
      d = arr[3] + '-' + month + '-' + arr[2];
      temp.x[j] = d;
    }
    console.log(temp);
    data[data.length] = temp;
    console.log(i);
  }
  console.log(data);
  var layout = {
    title: names,
    xaxis: {
      autorange: true,
      tickformat: '%b %d %Y',
      type: 'date'
    },
    yaxis: {
      autorange: true,
      type: 'linear'
    }
  };
  console.log(layout);
  var graphOptions = {filename: 'umum', fileopt: "overwrite", layout: layout};
  plotly.plot(data, graphOptions, function (err, mesg) {
    console.log(mesg);
    var request = require('request');
    download(mesg.url + '.jpeg', 'display.png', function(){
      msg.channel.send(names, {
        files: [
        "display.png"
      ]
    });
    });
  });
}

async function printGraph(bot, msg, args){
  var data = [];
  var names = 'graph for';
  console.log(args.length);
  for(var i = 2; i < args.length; i++){
    console.log(args[i]);
    if(rank.has(args[i]) == false)return;
    var tempName = await bot.users.fetch(args[i])
    tempName = tempName.username;
    names += ' ' + tempName;
    var temp = {
      x: [],
      y: [],
      name: tempName,
      mode: "lines",
      type: "scatter"
    };
    temp.y = rank.get(args[i]);
    for(var j = 0; j < temp.y.length; j++){
      var utcSeconds = startDate + j * 86400;
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(utcSeconds);
      console.log(d);
      d = d.toString();
      var arr = d.split(' ');
      d = arr[1].concat(' ' + arr[2]).concat(' ' + arr[3]);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var month = -1;
      for(var k = 0; k < 12; k++){
        if(arr[1] == months[k]){
          month = k + 1;
        }
      }
      if(month == -1){
        console.log('month not found');
        msg.channel.send('an error occured, contact developer');
        return;
      }
      d = arr[3] + '-' + month + '-' + arr[2];
      temp.x[j] = d;
    }
    console.log(temp);
    data[data.length] = temp;
    console.log(i);
  }
  console.log(data);
  var layout = {
    title: names,
    xaxis: {
      autorange: true,
      tickformat: '%b %d %Y',
      type: 'date'
    },
    yaxis: {
      autorange: true,
      type: 'linear'
    }
  };
  console.log(layout);
  var graphOptions = {filename: 'umum', fileopt: "overwrite", layout: layout};
  plotly.plot(data, graphOptions, function (err, mesg) {
    console.log(mesg);
    var request = require('request');
    download(mesg.url + '.jpeg', 'display.png', function(){
      msg.channel.send(names, {
        files: [
        "display.png"
      ]
    });
    });
  });
}

async function newGlobalOneInt(bot, msg, args){
  if(glob != -1){
    msg.channel.send('there is an ongoing global duel, integer is: **' + glob + '**');
    return;
  }
  if(isNaN(args[1]))return;
  if(args[1][0] == '-')return;
  // var l = 0, r = parseInt(args[1]);
  var l = '0', r = args[1];
  prevL = l, prevR = r;
  ranked = false;
  rng(l, r, msg, 'global duel is starting!\ninteger is: **');
  // glob = Math.floor(Math.random()*(r-l+1))+l;
}

async function getSum(a, b, c, d, msg){
  var spawn = require('child_process').spawn;
  var child = spawn('python3', ['lagrange_py/getSum.py']);
  child.stdout.on('data', function(data){
    console.log(data);
    
  });
  child.on('close', function(code){
    if(code != 0){
      msg.channel.send('internal error, contact developer');
      console.log('python crashed');
    }
  });
  child.stdin.write(a + ' ' + b + ' ' + c + ' ' + d);
  child.stdin.end();
  var res;
  for await (const data of child.stdout) {
    res = JSON.parse(data.toString());
  }
  return res;
}

module.exports = {
  message: function(bot, msg){
    var args = msg.content.split(' ');
    if(args.length == 2 && !isNaN(args[1])){
      newGlobalOneInt(bot, msg, args);
    }
    if(args.length == 3 && !isNaN(args[1]) && !isNaN(args[2])){
      newGlobal(args, msg);
      return; 
    }
    console.log(args[1]);
    switch (args[1]){
      case 'graph':
        // printGraph(bot, msg, args);
        if(args[2] == 'top')printGraphTop(bot, msg, args);
        else if(args[2] == 'all')printGraphAll(bot, msg, args);
        else printGraph(bot, msg, args);
      break;
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
      case 'fs':
        if(msg.author.id != '455184547840262144'){
          return;
        }
        glob = "-1";
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
      // case 'change':
      //   var newRank = new Map();
      //   rank.forEach(function lol(value, key){
      //     newRank.set(key, [value]);
      //   });
      //   rank = newRank;
      //   var opts = {
      //     wait: 30000
      //   }
      //   lockFile.lock('../lock.lock', opts, function(error){
      //     if(error != undefined){
      //       console.log('busy');
      //       console.error(error);
      //       return;
      //     }
      //     save();
      //     lockFile.unlockSync('../lock.lock');
      //   });
      // break;

    }
  },
  isAns: async  function(bot, msg){
    var args = msg.content.split(' ');
    if(args.length != 4)return;
    var res = 0;
    for(var i = 0; i < 4; i++){
      if(isNaN(args[i]))return;
      // res += parseInt(args[i]) * parseInt(args[i]);
    }
    res = await getSum(args[0], args[1], args[2], args[3], msg);
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
      glob = "-1";
      prevSolver = msg.author.id;
      const emoji = msg.guild.emojis.cache.find(emoji => emoji.name === 'AC');
      msg.react(emoji);
      msg.react('🔁');
      lastId = msg.id;
      if(ranked){
        var prevRank = [10];
        if(rank.has(msg.author.id)){
          prevRank = rank.get(msg.author.id);
          prevRank[prevRank.length - 1] += 10;
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
    if(glob != -1){msg.channel.send('there is an ongoing');return;}
    newGlobalRepeat(msg);
  }
}
