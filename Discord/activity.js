const auth = require('./auth.json');
var plotly = require('plotly')('juancarlovieri', auth.plotly);
const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("activity.json", "utf8"));
var activity = new Map(Object.entries(obj));
var startDate = 1595304000;


function download(uri, filename, callback){
  const request = require('request');
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

// var temporaryChange = new Map();

// activity.forEach(function lol(value, key){
//   var temp = [value];
//   temporaryChange.set(key, temp);
// });


let schedule = require('node-schedule');


function save(){
  var jsonObj = Object.fromEntries(activity);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("activity.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

// activity = temporaryChange;

// save();

function organize(){
  console.log('organizing');
  var temp = new Map();
  var maks = -1;
  activity.forEach(function lol(value, key){
    maks = Math.max(value.length, maks);
  });
  activity.forEach(function lol(value, key){
    var cur = value.length;
    var tambah = [];
    for(var i = 0; i < maks - cur; i++){
      tambah[tambah.length] = 0;
    }
    value = tambah.concat(value);
    temp.set(key, value);
  });
  activity = temp;
  save();
}

schedule.scheduleJob('0 0 * * *', () => {
  console.log('adding new array for activity;');
  var temp = new Map();
  var maks = -1;
  activity.forEach(function lol(value, key){
    value[value.length] = value[value.length - 1];
    maks = Math.max(value.length, maks);
    temp.set(key, value);
  });
  activity = temp;
  temp = new Map();
  activity.forEach(function lol(value, key){
    var cur = value.length;
    var tambah = [];
    for(var i = 0; i < maks - cur; i++){
      tambah[tambah.length] = 0;
    }
    value = tambah.concat(value);
    temp.set(key, value);
  });
  activity = temp;
  save();
});

function compare(a, b) {
  let comparison = 0;
  if (a.point < b.point) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

async function printtop(bot, msg, arr, lo, hi){
  lo = Math.round(lo);
  hi = Math.round(hi);
  --lo;
  --hi;
  var hasil = "";
  for(var i = Math.max(lo, 0); i < Math.min(arr.length, hi + 1); i++){
    let temp = await bot.users.fetch(arr[i].name);
    hasil += temp.username + ' ' + arr[i].point + '\n';
  }
  console.log(hasil);
  msg.channel.send(hasil);
} 

async function printAll(bot, msg, args){
  var data = [];
  var names = 'graph for all';
  console.log(args.length);
  activity.forEach(function lol(value, key){
    tempName = key;
    var temp = {
      x: [],
      y: [],
      name: tempName,
      mode: "lines",
      type: "scatter"
    };
    temp.y = activity.get(key);
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


async function printGraph(bot, msg, args){
  var data = [];
  var names = 'graph for';
  console.log(args.length);
  if(args[2] == "all"){printAll(bot, msg, args);return;}
  for(var i = 2; i < args.length; i++){
    console.log(args[i]);
    if(activity.has(args[i]) == false)continue;
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
    temp.y = activity.get(args[i]);
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

module.exports = {
  add: function(msg){
    if(msg.channel.guild.id != '688018099584237610')return;
    if(msg.channel.id == '688608091855519801')return;
    if(msg.author.bot)return;
    var point = [0];
    if(activity.has(msg.author.id))point = activity.get(msg.author.id);
    point[point.length - 1]++;
    activity.set(msg.author.id, point);
    save();
  },
  run: function(bot, msg){
    var args = msg.content.split(' ');
    if(args[1] == 'top'){
      if(msg.author.id != '455184547840262144'){
        return;
      }
      if(args.length != 4 || isNaN(args[2]) || isNaN(args[3]))return;
      var temp = [];
      activity.forEach(function lol(key, value){
        temp[temp.length] = {name: value, point: key[key.length - 1]};
      });
      temp.sort(compare);
      console.log(temp);
      printtop(bot, msg, temp, parseInt(args[2]), parseInt(args[3]));
      return;
    }
    if(args[1] == 'organize'){
      organize();
      return;
    }
    if(args[1] == 'graph'){
      if(msg.author.id != '455184547840262144')return;
      if(args.length < 3)return;
      printGraph(bot, msg, args);
    }
    if(args[1] == 'fetch'){
      if(msg.author.id != '455184547840262144'){
        return;
      }
      const channel = bot.channels.cache.get(args[2].substr(2, args[2].length - 3));
      console.log(channel);
      channel.messages.fetch({limit: 100}).then(msg => {
        msg.forEach(function lol(key, value){
          if(key.author.bot)return;
          var point = 0;
          if(activity.has(key.author.id))point = activity.get(key.author.id);
          activity.set(key.author.id, point + 1);
        });
        console.log(activity);
        save();
      }).catch(err => {
        console.log(err);
      });
    }
    return;
  }
}
