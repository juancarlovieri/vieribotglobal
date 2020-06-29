const fs = require('fs');
const auth = require('./auth.json');

function download(uri, filename, callback){
  const request = require('request');
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

module.exports = {
  ask: function(bot, msg){
    var hasil = '';
    var args = msg.text.split(' ');
    for(var i = 1; i < args.length; i++){
      hasil += args[i] + '+';
    }
    const request = require('sync-request');
    var res = JSON.parse(request('GET','http://api.wolframalpha.com/v1/conversation.jsp?appid=' + auth.wolfram + '&i=' + hasil).getBody());
    if(typeof res.error != "undefined"){
      bot.sendMessage(msg.chat.id, "I did not get that");
      return;
    }
    bot.sendMessage(msg.chat.id, res.result);
  }
}
