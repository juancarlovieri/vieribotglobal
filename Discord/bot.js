const Discord = require("discord.js");
var bot = new Discord.Client();
var auth = require('./auth.json');
bot.login(auth.token);
const fs = require('fs');
var obj;
const cfduel = require('./cfduel.js');
const atcoder = require('./atcoder.js');
const lockFile = require('lockfile');
const wolfram = require('./wolfram.js');

function save(){
}

function command(args, msg){
  switch(args[0]){
    case '^atcoder':
      if(atcoder.duel(bot, msg) != 0){

      }
    break;
    case '^duel':
      cfduel.duel(bot, msg);
    break; 
    case '^ask':
      wolfram.ask(bot, msg);
    break;
  }
}

bot.on("message", msg => {
  if(msg.content == '^restart'){
    if(msg.author.id != '455184547840262144'){
      return;
    }
    console.log('restarting');
    process.exit(0);
  }
  var args = msg.content.split(" ");
  if(args[0][0] == '^'){
    var opts = {
      wait: 30000
    }
    lockFile.lock('../lock.lock', opts, function(error){
      if(error != undefined){
        console.log('busy');
        console.log(error);
        return;
      }
      command(args, msg);
      lockFile.unlockSync('../lock.lock');
    });

  }
});
