const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("activity.json", "utf8"));
var activity = new Map(Object.entries(obj));

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

function compare(a, b) {
  let comparison = 0;
  if (a.point < b.point) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

async function printtop(bot, msg, arr){
  var hasil = "";
  for(var i = 0; i < arr.length; i++){
    let temp = await bot.users.fetch(arr[i].name);
    hasil += temp.username + ' ' + arr[i].point + '\n';
  }
  console.log(hasil);
  msg.channel.send(hasil);
}

module.exports = {
  add: function(msg){
    if(msg.channel.id == '688608091855519801')return;
    if(msg.author.bot)return;
    var point = 0;
    if(activity.has(msg.author.id))point = activity.get(msg.author.id);
    activity.set(msg.author.id, point + 1);
    save();
  },
  run: function(bot, msg){
    var args = msg.content.split(' ');
    if(args[1] == 'top'){
      var temp = [];
      activity.forEach(function lol(key, value){
        temp[temp.length] = {name: value, point: key};
      });
      temp.sort(compare);
      console.log(temp);
      printtop(bot, msg, temp);
      return;
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
