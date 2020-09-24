const Discord=  require('discord.js');
var bot;

function runAtDate(date, func) {
  var diff = Math.max((date - Date.now()), 0);
  if (diff > 0x7FFFFFFF)
    setTimeout(function() {runAtDate(date, func);}, 0x7FFFFFFF);
  else
    setTimeout(func, diff);
}
function timer(time, embed, file){
  const channel = bot.channels.cache.get('758646515983712287');
  console.log(time);
  runAtDate(time, function print(){
    channel.send({files: [file], embed: embed});
  });
}

async function init(){
  var jarak = [600000, 3600000, 21600000, 86400000, 172800000, 432000000];
  var message = ["T - 10 minutes", "T - 1 hour", "T - 6 hours", "T - 1 day", "T - 2 days", "T - 5 days"]
  var request = require('sync-request');
  var list = JSON.parse(request('GET', 'https://fdo.rocketlaunch.live/json/launches/next/100').getBody()).result;
  console.log('downloaded');
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
        for(var i = 0; i < cur.tags.length; i++){
          if(!cur.tags[i].text)continue;
          payload = cur.tags[i].text;
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
        timer(time -  jarak[j], embed, vieri);
      }
    }
  }
}

module.exports = {
  new: function(bott){
    bot = bott;
    // console.log('tes');
    init();
    setInterval(init, 3600000); 

  }
}

