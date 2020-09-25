const Discord=  require('discord.js');
var bot;
const fs = require('fs')

const path = 'published.json'

var published = new Map();

try {
  if (fs.existsSync(path)) {
    var obj = JSON.parse(fs.readFileSync("published.json", "utf8"));
    published = new Map(Object.entries(obj));
  }
} catch(err) {
  console.log('new map');
}

function save(){
  var jsonObj = Object.fromEntries(published);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("published.json", jsonContent, "utf8", function(err) {
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
    channel.send({files: [file], embed: embed});
    channel2.send({files: [file], embed: embed});
  });
}

async function init(){
  var jarak = [600000, 1800000, 3600000, 21600000, 86400000, 172800000, 432000000];
  var message = ["T - 10 minutes", "T - 30 minutes", "T - 1 hour", "T - 6 hours", "T - 1 day", "T - 2 days", "T - 5 days"]
  var request = require('sync-request');
  var list = JSON.parse(request('GET', 'https://fdo.rocketlaunch.live/json/launches/next/100').getBody()).result;
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
        await dateStr.setUTCSeconds(utcSeconds - 3600);
        // console.log(dateStr.toString());
        dateStr = dateStr.toString();
        var pos = dateStr.indexOf('GMT');
        if(pos == -1){
          console.error(' \'GMT\' not found');
          return;
        }
        dateStr = dateStr.substr(0, pos);
        dateStr += 'Western Indonesia Time';
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
              value:cur.pad.location.name + ", " + cur.pad.location.statename + ", " + cur.pad.location.country
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

function news(){
  var request = require('sync-request');
  var list = JSON.parse(request('GET', 'https://spaceflightnewsapi.net/api/v1/articles/').getBody()).docs;
  console.log('downloaded news');
  for(var i = 0; i < list.length; i++){
    if(published.has(list[i]._id))continue;
    var tags = "";
    for(var j = 0; j < list[i].tags.length; j++){
      tags += list[i].tags[j];
      if(j != list[i].tags.length - 1)tags += ', ';
    }
    var vieri = new Discord.MessageAttachment('../viericorp.png');
    var embed = {
      color: 16764006,
      author: {
        name: "Hot News",
        icon_url: "attachment://viericorp.png"
      },
      title: list[i].title,
      fields: [
        {
          name: "tags ",
          value: tags
        },
        {
          name:"\u200b",
          value:"[link](" + list[i].url + ')'
        }
      ],
      image:{
        url: list[i].featured_image
      },  
      timestamp: new Date(),
      footer: {
        text: "By Vieri Corp.™ All Rights Reserved"
      }
    }
    const channel = bot.channels.cache.get('758646515983712287');
    channel.send("<@&758716095141642282>");
    channel.send({files: [vieri], embed: embed});
    const channel2 = bot.channels.cache.get('576623116394954762');
    channel2.send({files: [vieri], embed: embed});
    published.set(list[i]._id, 1);
    save();
  }
}

module.exports = {
  new: function(bott){
    bot = bott;
    // console.log('tes');
    init();
    setInterval(init, 3600000); 
    news();
    setInterval(news, 3600000)
  },
}

