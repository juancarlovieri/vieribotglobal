const fs = require('fs');
const Discord = require('discord.js');
var tests = JSON.parse(fs.readFileSync("tests.json", "utf8"));

function save(){
  var jsonContent = JSON.stringify(tests);
  fs.writeFileSync("tests.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

function compare(a, b){
  var comparison = 0;
  if (a.time > b.time) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

function clear(){
  var arr = tests.a;
  var temp = arr;
  var add = 0;
  for(var i = 0; i <=  arr.length - 1; i++){
    if(arr[i].time < Date.now()){
      console.log('buang');
      temp.splice(i - add, 1);
      console.log(add);
      add++;
    }
  }
  var baru = {
    a: temp
  }
  tests = baru;
  save();
}

function runAtDate(date, func) {
  var diff = Math.max((date - Date.now()), 0);
  if (diff > 0x7FFFFFFF)
    setTimeout(function() {runAtDate(date, func);}, 0x7FFFFFFF);
  else
    setTimeout(func, diff);
}

async function timer(time, channel, message){
  const msg = message;
  runAtDate(time, function(){
    channel.send(msg);
  });
  // setTimeout(function(){
  //   var opts = {
  //     wait: 30000
  //   }
  //   channel.send(msg);
  // }, time);
}

function remind(l, r, bot){
  var arr = tests.a
  var temp = arr;
  var add = 0;
  const channel = bot.channels.cache.get('736030942748999770');
  console.log(arr);
  for(var i = l; i <= Math.min(r, arr.length - 1); i++){
    console.log(arr[i]);
    runAtDate(arr[i].time + 100, function(){
      clear();
      save();
    });
    // setTimeout(function(){
    //   clear();
    //   save();
    // }, arr[i].time - Date.now() + 100);
    // if((arr[i].time - 3600000) - Date.now() >= 0){
    //   var name = arr[i];
    //   timer((arr[i].time - 3600000), channel, name.name + ' in an hour ' + name.mention);
    // }
    if((arr[i].time - 7200000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 7200000), channel, name.name + ' in 2 hours ' + name.mention);
    }
    // if((arr[i].time - 21600000) - Date.now() >= 0){
    //   var name = arr[i];
    //   timer((arr[i].time - 21600000), channel, name.name + ' in 6 hours ' + name.mention);
    // }
    // if((arr[i].time - 43200000) - Date.now() >= 0){
    //   var name = arr[i];
    //   timer((arr[i].time - 43200000), channel, name.name + ' in 12 hours ' + name.mention);
    // } 
    if((arr[i].time - 86400000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 86400000), channel, name.name + ' tomorrow ' + name.mention);
    }
    if((arr[i].time - 172800000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 172800000), channel, name.name + ' in 2 days ' + name.mention);
    }
  }
  // console.log(temp);
  // var baru = {
  //   a: temp
  // }
  // tests = baru;
  // save();
}

module.exports = {
  run: function(bot){
    remind(0, 1000, bot);
  },
  message: function(bot, msg){
    var args = msg.content.split(' ');
    console.log(msg.content);
    switch(args[1]){
      case 'new':
        if(args.length != 5)return;
        if(isNaN(args[3]))return;
        var arr = tests.a;
        var tempTime = parseInt(args[3]);
        arr[arr.length] = {
          name: args[2],
          time: tempTime,
          mention: args[4]
        };
        var temp = {
          a: arr
        }
        tests = temp;
        save();
        remind(arr.length - 1, arr.length - 1, bot);
      break;
      case 'rm':
        if(msg.author.id != '455184547840262144'){
          return;
        }
        if(args.length != 3)return;
        if(isNaN(args[2]))return;
        var arr = tests.a;
        arr.splice(parseInt(args[2]), 1);
        var temp = {
          a: arr
        }
        tests = temp;
        save();
      break;
      case 'filter':
        clear();
        save();
        var arr = tests.a;
        var hasil =[];
        console.log(arr);
        arr.sort(compare);
        save();
        var lists = [];
        var start = false;
        var temp = "";
        for(var i = 2; i < args.length; i++){
          if(args[i][0] == '"' && !start){
            start = true;
            temp = args[i].substr(1, args[i].length - 1);
            continue;
          }
          // console.log(start);
          if(args[i][args[i].length - 1] == '"' && start){
            temp += ' ' + args[i].substr(0, args[i].length - 1);
            start = false;
          } else if(start){
            temp += ' ' + args[i];
            continue;
          } else{
            temp = args[i];
          }
          // if(msg.channel.guild.roles.find(r => r.name == args[i])){
          //     //Rest of your code
          //     console.log(msg.channel.guild.rolesfind(r => r.name == args[i]));
          // }
          var role = msg.channel.guild.roles.cache;
          var id = -1;
          role.forEach(function lol(value, key){
            if(value.name == temp){
              id = key;
              return;
            }
          });
          console.log(id);
          console.log(i);
          for(var j = 0; j < arr.length; j++){
            if(arr[j].mention == '<@&' + id + '>'){
              console.log(arr[j]);
              lists[lists.length] = arr[j];
            }
          }
        }
        lists.sort(compare);
        for(var i = 0; i < lists.length; i++){
          var utcSeconds = Math.round(lists[i].time / 1000) - 3600;
          var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
          d.setUTCSeconds(utcSeconds);
          var arrDate = d.toString().split(' ');
          var res = arrDate[0];
          res += ' ' + arrDate[1];
          res += ' ' + arrDate[2];
          res += ' ' + arrDate[3];
          res += ' ' + arrDate[4];
          // hasil += '**' + arr[i].name + '**: ' + res + '\n';
          hasil[hasil.length] = {
            name: lists[i].name,
            value: '\u200b \u200b \u200b \u200b \u200b \u200b' + res + '\n\u200b'
          }
        }
        var vieri = new Discord.MessageAttachment('../viericorp.png');
        msg.channel.send({files: [vieri], embed: {
          color: 16764006,
          author: {
            name: 'Tests',
            icon_url: "attachment://viericorp.png"
          },
          title: 'list of tests',
          fields: hasil,
          timestamp: new Date(),
          footer: {
            text: "By Vieri Corp.™ All Rights Reserved"
          }
        }
        });
      break;
      case 'list':
      console.log(msg.content);
        clear();
        save();
        var arr = tests.a;
        var hasil =[];
        console.log(arr);
        arr.sort(compare);
        save();
        for(var i = 0; i < arr.length; i++){
          console.log(arr[i]);
          var utcSeconds = Math.round(arr[i].time / 1000) - 3600;
          var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
          d.setUTCSeconds(utcSeconds);
          var arrDate = d.toString().split(' ');
          var res = arrDate[0];
          res += ' ' + arrDate[1];
          res += ' ' + arrDate[2];
          res += ' ' + arrDate[3];
          res += ' ' + arrDate[4];
          // hasil += '**' + arr[i].name + '**: ' + res + '\n';
          hasil[hasil.length] = {
            name: arr[i].name,
            value: '\u200b \u200b \u200b \u200b \u200b \u200b' + res + '\n\u200b'
          }
        }
        var vieri = new Discord.MessageAttachment('../viericorp.png');
        msg.channel.send({files: [vieri], embed: {
          color: 16764006,
          author: {
            name: 'Tests',
            icon_url: "attachment://viericorp.png"
          },
          title: 'list of tests',
          fields: hasil,
          timestamp: new Date(),
          footer: {
            text: "By Vieri Corp.™ All Rights Reserved"
          }
        }
        });
        // msg.channel.send(hasil);
      break;
    }
  }
}
