"use strict";
const Discord=  require('discord.js');
var bot;
const fs = require('fs')

const publishedPath = 'datas/published.json';


var published = new Map();

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


function compare(a, b){
  var comparison = 0;
  if (a.time > b.time) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

try {
  if (fs.existsSync(publishedPath)) {
    var obj = JSON.parse(fs.readFileSync(publishedPath, "utf8"));
    published = new Map(Object.entries(obj));
  }
} catch(err) {
  console.log('new map');
}

function save(){
  var jsonObj = Object.fromEntries(published);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync(publishedPath, jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
}

function runAtDate(date, func) {
  var diff = Math.max((date - Date.now()), 0);
  if (diff > 0x7FFFFFFF)
    setTimeout(function() {runAtDate(date, func);}, 0x7FFFFFFF);
  else
    setTimeout(func, diff);
}
function timer(time, embed, file){
  const channel = bot.channels.cache.get('758646515983712287');
  const channel2 = bot.channels.cache.get('576623116394954762');
  console.log(time);
  runAtDate(time, function print(){
    channel.send("<@&758716095141642282>");
    channel.send({files: [file], embeds: [embed]});
    channel2.send({files: [file], embeds: [embed]});
  });
}

async function init(){
  var jarak = [600000, 1800000, 3600000, 21600000, 86400000, 172800000, 432000000];
  var message = ["T - 10 minutes", "T - 30 minutes", "T - 1 hour", "T - 6 hours", "T - 1 day", "T - 2 days", "T - 5 days"]
  // var request = require('sync-request');
  var list;
  try {
    list = await async_request('https://fdo.rocketlaunch.live/json/launches/next/100');
    list = list.result;
    // list = JSON.parse(request('GET', 'https://fdo.rocketlaunch.live/json/launches/next/100').getBody()).result;
  } catch(e) {
    console.error(e);
    return;
  }
  console.log('downloaded launches');  
  for(var i = 0; i < list.length; i++){
    var cur = list[i];
    var time = cur.sort_date;
    time *= 1000;
    var diff = time - Date.now();
    if(diff < 0)continue;
    for(var j = 0; j < jarak.length; j++){
      if(diff < jarak[j])continue;
      if(diff - 3600000 < jarak[j]){
        console.log('new remind');
        var payload = "unknown";
        for(var k = 0; k < cur.tags.length; k++){
          if(!cur.tags[k].text)continue;
          payload = cur.tags[k].text;
        }
        var utcSeconds = Math.round(time / 1000);
        var dateStr = new Date(0);
        await dateStr.setUTCSeconds(utcSeconds);
        // console.log(dateStr.toString());
        dateStr = dateStr.toString();
        var pos = dateStr.indexOf('GMT');
        if(pos == -1){
          console.error(' \'GMT\' not found');
          return;
        }
        dateStr = dateStr.substr(0, pos);
        console.log(dateStr);
        var vieri = new Discord.MessageAttachment('../viericorp.png');
        var embed = {
          color: 16764006,
          author: {
            name: "launch update",
            icon_url: "attachment://viericorp.png"
          },
          title: message[j],
          fields: [
            {
              name: "Provider",
              value:cur.provider.name
            },
            {
              name: "Vehicle",
              value:cur.vehicle.name
            },
            {
              name:"Date",
              value:dateStr
            },
            {
              name: "Location",
              value: cur.pad.name + ", " + cur.pad.location.name + ", " + cur.pad.location.statename + ", " + cur.pad.location.country
            },
            {
              name: "Payload",
              value: payload
            }
          ],
          timestamp: new Date(),
          footer: {
            text: "By Vieri Corp.™ All Rights Reserved"
          }
        }
        console.log('new timer');
        timer(time -  jarak[j], embed, vieri);
      }
    }
  }
}

async function news(){
  // var request = require('sync-request');
  var list;
  try {
    list = await async_request('https://api.spaceflightnewsapi.net/v3/articles/');
    // list = JSON.parse(request('GET', 'https://api.spaceflightnewsapi.net/v3/articles/').getBody());
  } catch (e) {
    console.error(e);
    return;
  }
  console.log('downloaded news');
  for(var i = 0; i < list.length; i++){
    if(published.has(list[i].id))continue;
    if(published.has("all"))continue;
//     var tags = "";
//     for(var j = 0; j < list[i].tags.length; j++){
//       tags += list[i].tags[j];
//       if(j != list[i].tags.length - 1)tags += ', ';
//     }
//     if(tags == "")tags = "none";
    var vieri = new Discord.MessageAttachment('../viericorp.png');
    var summary = list[i].summary;
    if (summary == "") summary = "not available"
      if (summary.length > 1000) summary = summar.substr(0, 1000);
    var embed = {
      color: 16764006,
      author: {
        name: "Hot News",
        icon_url: "attachment://viericorp.png"
      },
      title: list[i].title,
      fields: [
        {
          name: "Summary",
          value: summary
        },
        {
          name:"\u200b",
          value:"[link](" + list[i].url + ')'
        }
      ],
      image:{
        url: list[i].imageUrl
      },  
      timestamp: new Date(),
      footer: {
        text: "By Vieri Corp.™ All Rights Reserved"
      }
    }
    const channel = bot.channels.cache.get('761766016807469057');
    channel.send("<@&758716095141642282>");
    channel.send({files: [vieri], embeds: [embed]});
    const channel2 = bot.channels.cache.get('576623116394954762');
    channel2.send({files: [vieri], embeds: [embed]});
    published.set(list[i].id, 1);
    save();
  }
}

async function printUpcoming(bot, msg){
  // var request = require('sync-request');
  var list;
  try {
    list = await async_request('https://fdo.rocketlaunch.live/json/launches/next/100');
    list = list.result;
    // list = JSON.parse(request('GET', 'https://fdo.rocketlaunch.live/json/launches/next/100').getBody()).result;
  } catch (e) {
    console.error(e);
    return;
  }
  var arr = [];
  for(var i = 0; i < list.length; i++){
    var utcSeconds = Math.round(list[i].sort_date);
    var dateStr = new Date(0);
    await dateStr.setUTCSeconds(utcSeconds);
    // console.log(dateStr.toString());
    dateStr = dateStr.toString();
    var pos = dateStr.indexOf('GMT');
    if(pos == -1){
      console.error(' \'GMT\' not found');
      return;
    }
    dateStr = dateStr.substr(0, pos);
    console.log(dateStr);
    arr[i] = {
      name: list[i].provider.name + ' ' + list[i].vehicle.name,
      value: dateStr,
      time: list[i].sort_date
    }
  }
  // console.log(arr);
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  arr.sort(compare);
  var embed = {
    color: 16764006,
    author: {
      name: "Upcoming launches",
      icon_url: "attachment://viericorp.png"
    },
    title: '\u200b',
    fields: arr,
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  msg.channel.send({files: [vieri], embeds: [embed]});
}

async function printView(bot, msg, args){
  var indx = parseInt(args[1]);
  indx--;
  // var request = require('sync-request');
  var list = await async_request('https://fdo.rocketlaunch.live/json/launches/next/100');
  list = list.result;
  // var list = JSON.parse(request('GET', 'https://fdo.rocketlaunch.live/json/launches/next/100').getBody()).result;
  if(indx < 0 || indx >= list.length)return;
  var arr = [];
  for(var i = 0; i < list.length; i++){
    arr[i] = {
      time: list[i].sort_date,
      indx: i
    }
  }
  arr.sort(compare);
  var cur = list[arr[indx].indx];
  var payload = "unknown";
  for(var k = 0; k < cur.tags.length; k++){
    if(!cur.tags[k].text)continue;
    payload = cur.tags[k].text;
  }
  var utcSeconds = Math.round(cur.sort_date);
  var dateStr = new Date(0);
  await dateStr.setUTCSeconds(utcSeconds);
  // console.log(dateStr.toString());
  dateStr = dateStr.toString();
  var pos = dateStr.indexOf('GMT');
  if(pos == -1){
    console.error(' \'GMT\' not found');
    return;
  }
  dateStr = dateStr.substr(0, pos);
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  var embed = {
    color: 16764006,
    author: {
      name: "launch view",
      icon_url: "attachment://viericorp.png"
    },
    title: "Misssion Overview",
    fields: [
      {
        name: "Provider",
        value:cur.provider.name
      },
      {
        name: "Vehicle",
        value:cur.vehicle.name
      },
      {
        name:"Date",
        value:dateStr
      },
      {
        name: "Location",
        value: cur.pad.name + ", " + cur.pad.location.name + ", " + cur.pad.location.statename + ", " + cur.pad.location.country
      },
      {
        name: "Payload",
        value: payload
      }
    ],
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  msg.channel.send({files: [vieri], embeds: [embed]});
}

module.exports = {
  upcoming: function(bot, msg){
    printUpcoming(bot, msg);
  },
  view: function(bot, msg){
    var args = msg.content.split(" ");
    if(args.length == 0){
      return;
    }
    if(isNaN(args[1]))return;
    printView(bot, msg, args);
  },
  new: function(bott){
    bot = bott;
    // console.log('tes');
    init();
    setInterval(init, 3600000); 
    news();
    setInterval(news, 3600000)
  },
}

