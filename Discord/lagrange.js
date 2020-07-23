const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("ongoingLagrange.json", "utf8"));
const lockFile = require('lockfile');
var ongoing = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("challengeLagrange.json", "utf8"));
var challenge = new Map(Object.entries(obj));

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
}

module.exports = {
  message: function(bot, msg){
    var args = msg.content.split(' ');
    switch (args[1]){
      case 'resend':
        if(ongoing.has(msg.author.id) == false)return;
        msg.channel.send(ongoing.get(msg.author.id).problem);
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
    if(ongoing.has(msg.author.id) == false)return;
    if(args.length != 4)return;
    var res = 0;
    for(var i = 0; i < 4; i++){
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
}
