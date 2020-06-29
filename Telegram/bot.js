const TelegramBot = require('node-telegram-bot-api');
 
// replace the value below with the Telegram token you receive from @BotFather
const token = require('./auth.json').token;
const fs = require('fs');
 
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const cfduel = require('./cfduel.js');
const cfreminder = require('./reminder.js');
const wolfram = require('./wolfram.js');
const atcoder = require('./atcoder.js');

cfreminder.remind(bot);

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
 
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg) => {

  bot.sendMessage(msg.chat.id, "Welcome");
    
});

// bot.onText(/\/duel/, (msg) =>{
//   cfduel.duel(bot, msg);
// });

var restart = 0;
 
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  var exit = 0;
  var args = msg.text.split(" ");
  if(args[0][0] == ';'){
    switch(args[0]){
      case ';now':
        if(restart){
          console.log('restarting');
        }
      break;
      case ';atcoder':
        if(atcoder.duel(bot, msg) != 0){

        }
      break;
      case ';restart':
        console.log(msg.from.username);
        if(msg.from.username != 'juancarlovieri')return;
        process.exit(0);
      break;
      case ';paksa':
        if(msg.author.id != '455184547840262144'){
          return;
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
            return console.log(err);
          }
          console.log("saved");
        });
      break;
      case ';duel':
        if(cfduel.duel(bot, msg) != 0){
          console.log('reverting');
          var vis = new Map();
          vis.set('vis', false);
          var jsonObj = Object.fromEntries(vis);
          console.log(jsonObj);
          var jsonContent = JSON.stringify(jsonObj);
          fs.writeFileSync("../vis.json", jsonContent, "utf8", function(err) {
            if (err) {
              console.log("An errr occured while writing JSON jsonObj to File.");
              return console.log(err);
            }
            console.log("saved");
          });
        }
      break; 
      case ';ask':
        wolfram.ask(bot, msg);
      break;
    }
  }
  // const chatId = msg.chat.id;
  // console.log(msg);
  // // send a message to the chat acknowledging receipt of their message
  // switch(msg.text){
  //   case 'ela':
  //     bot.sendMessage(chatId, 'bau');
  //     break;
  // }
});

module.exports = {
  run: function(){

  }
}
