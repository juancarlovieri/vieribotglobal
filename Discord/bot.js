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
    case '^restart':
      if(msg.author.id != '455184547840262144'){
        break;;
      }
      console.log('restarting');
      process.exit(0);
    break;
    case '^atcoder':
      if(atcoder.duel(bot, msg) != 0){

      }
    break;
    case '^paksa':
      if(msg.author.id != '455184547840262144'){
        break;;
      }
      console.log('reverting');
      var vis = new Map();
      vis.set('vis', false);
      var jsonObj = Object.fromEntries(vis);
      console.log(jsonObj);
      var jsonContent = JSON.stringify(jsonObj);
      fs.writeFileSync("../vis.json", jsonContent, "utf8", function(err) {
        if (err) {
          console.log("An errr occured while writing JSON jsonObj to File.");
          return; console.log(err);
        }
        console.log("saved");
      });
    break;
    case '^duel':
      if(cfduel.duel(bot, msg) != 0){
        // console.log('reverting');
        // var vis = new Map();
        // vis.set('vis', false);
        // var jsonObj = Object.fromEntries(vis);
        // console.log(jsonObj);
        // var jsonContent = JSON.stringify(jsonObj);
        // fs.writeFileSync("../vis.json", jsonContent, "utf8", function(err) {
        //   if (err) {
        //     console.log("An errr occured while writing JSON jsonObj to File.");
        //     return console.log(err);
        //   }
        //   console.log("saved");
        // });
      }
    break; 
    case '^ask':
      wolfram.ask(bot, msg);
    break;
  }
}

bot.on("message", msg => {
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
