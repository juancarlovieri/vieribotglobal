const fs = require("fs");
var crypto = require('crypto');
var obj = JSON.parse(fs.readFileSync("atcoderHandles.json", "utf8"));
var handles = new Map(Object.entries(obj));
var tempRegis = new Map();

function save(){
  var jsonObj = Object.fromEntries(handles);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("atcoderHandles.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = {
  duel: function(bot, msg){
    var args = msg.text.split(" ");
    switch(args[1]){
      case 'regis':
        if(args.length != 3){
          bot.sendMessage(msg.chat.id, 'that is not a valid thing');
          return 1;
        }
        if(handles.has(msg.from.username)){
          bot.sendMessage(msg.chat.id, 'you are reregistering');
        }
        var temp = {
          time: Date.now(),
          username: args[2]
        }
        tempRegis.set(msg.from.username, temp);
        bot.sendMessage(msg.chat.id, '@' + msg.from.username + ' submit ' + crypto.createHash('sha256').update(msg.from.username).digest('hex') + ' to any problem within 1 hour');
      break;
      case 'regisdone':
        if(tempRegis.has(msg.from.username) == false){
          bot.sendMessage(msg.chat.id, 'you are not registering');
          return 1;
        }
        var temp = tempRegis.get(msg.from.username);
        var request = require('sync-request');
        console.log(temp);
        var ada = 0;
        console.log(crypto.createHash('sha256').update(msg.from.username).digest('hex'));
        var submissions = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + temp.username).getBody());
        for(var i = 0; i < submissions.length; i++){
          if(submissions[i].epoch_second * 1000 < temp.time || submissions[i].epoch_second * 1000 > temp.time + 3600000)continue;
          var body = request('GET', 'https://atcoder.jp/contests/' + submissions[i].contest_id + '/submissions/' + submissions[i].id).getBody();
          var indx = body.indexOf(crypto.createHash('sha256').update(msg.from.username).digest('hex'));
          console.log(indx);
          if(indx < 0){
          } else{
            ada = 1;
            handles.set(msg.from.username, temp.username);
            tempRegis.delete(msg.from.username);
            save();
            bot.sendMessage(msg.chat.id, 'registered!');
            return;
          }
          if(ada)break;
        }
        if(!ada)bot.sendMessage(msg.chat.id, 'submit ' + crypto.createHash('sha256').update(msg.from.username).digest('hex') + ' to any problem');
      break;
      case 'problem':
        if(args.length != 4){
          bot.sendMessage(msg.chat.id, 'that\'s not a valid thing');
          return;
        }
        if(handles.has(msg.from.username) == false){
          bot.sendMessage(msg.chat.id, 'register your handle first');
          return;
        }
        args[2] = args[2].toLowerCase();
        var request = require('sync-request');
        var problems = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/resources/contest-problem.json').getBody());
        var submission = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(msg.from.username)).getBody());
        problems = shuffleArray(problems);
        var num = (args[3][0].charCodeAt(0) - 97).toString();
        var indx = -1;
        for(var i = 0; i < problems.length; i++){
          if(problems[i].contest_id.substr(0, args[2].length) != args[2])continue;
          if(args[3].toLowerCase() == problems[i].problem_id[7] || num.toString() == problems[i].problem_id[7]){
            var can = 1;
            for(var j = 0; j < submission.length; j++){
              if(submission[j].problem_id == problems[i].problem_id)can = 0;
            }
            if(can == 1){
              indx = i;
              break;
            }
          }
        }
        if(indx == -1){
          bot.sendMessage(msg.chat.id, 'internal error, contact developer');
          return;
        }
        bot.sendMessage(msg.chat.id, 'problem for @' + msg.from.username + ': https://atcoder.jp/contests/' + problems[indx].contest_id + '/tasks/' + problems[indx].problem_id);
      break;
    }
  }
}
