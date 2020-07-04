const TelegramBot = require('node-telegram-bot-api');
 
// replace the value below with the Telegram token you receive from @BotFather
const token = require('./auth.json').token;
const fs = require('fs');
 
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const cfduel = require('./cfduel.js');
const cfreminder = require('./reminder.js');
const wolfram = require('./wolfram.js');
const lockFile = require('lockfile');
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

function command(args, msg){
  switch(args[0]){
    case ';atcoder':
      if(atcoder.duel(bot, msg) != 0){

      }
    break;
    case ';duel':
      cfduel.duel(bot, msg);
    break; 
    case ';ask':
      wolfram.ask(bot, msg);
    break;
  }
}

var restart = 0;
 
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {

  if(msg.text == ';restart'){
    if(msg.from.username != 'juancarlovieri')return;
    bot.sendMessage(msg.chat.id, "restarting");
    setTimeout(() => {
        process.exit(0);
    }, 5000);
    return;
  }
  var exit = 0;
  console.log(msg);
  var args = msg.text.split(" ");
  if(args[0][0] == ';'){
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
  // const chatId = msg.chat.id;
  // console.log(msg);
  // // send a message to the chat acknowledging receipt of their message
  // switch(msg.text){
  //   case 'ela':
  //     bot.sendMessage(chatId, 'bau');
  //     break;
  // }
});

bot.sendMessage(-1001265467717, 'ready');
