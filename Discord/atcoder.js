const fs = require("fs");
var crypto = require('crypto');
var obj = JSON.parse(fs.readFileSync("atcoderHandles.json", "utf8"));
var handles = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("ongoingAtcoder.json", "utf8"));
var ongoing = new Map(Object.entries(obj));
var tempRegis = new Map();
var challenge = new Map();

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
   jsonObj = Object.fromEntries(ongoing);
  console.log(jsonObj);
   jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("ongoingAtcoder.json", jsonContent, "utf8", function(err) {
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
    var args = msg.content.split(" ");
    switch(args[1]){
      case 'regis':
        if(args.length != 3){
          msg.channel.send('that is not a valid thing');
          return 1;
        }
        if(handles.has(msg.author.id)){
          msg.channel.send('you are reregistering');
        }
        var temp = {
          time: Date.now(),
          username: args[2]
        }
        tempRegis.set(msg.author.id, temp);
        msg.channel.send('<@' + msg.author.id + '> submit ' + crypto.createHash('sha256').update(msg.author.id).digest('hex') + ' to any problem within 1 hour');
      break;
      case 'regisdone':
        if(tempRegis.has(msg.author.id) == false){
          msg.channel.send('you are not registering');
          return 1;
        }
        var temp = tempRegis.get(msg.author.id);
        var request = require('sync-request');
        console.log(temp);
        var ada = 0;
        console.log(crypto.createHash('sha256').update(msg.author.id).digest('hex'));
        var submissions = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + temp.username).getBody());
        for(var i = 0; i < submissions.length; i++){
          if(submissions[i].epoch_second * 1000 < temp.time || submissions[i].epoch_second * 1000 > temp.time + 3600000)continue;
          var body = request('GET', 'https://atcoder.jp/contests/' + submissions[i].contest_id + '/submissions/' + submissions[i].id).getBody();
          var indx = body.indexOf(crypto.createHash('sha256').update(msg.author.id).digest('hex'));
          console.log(indx);
          if(indx < 0){
          } else{
            ada = 1;
            handles.set(msg.author.id, temp.username);
            tempRegis.delete(msg.author.id);
            save();
            msg.channel.send('registered!');
            return;
          }
          if(ada)break;
        }
        if(!ada)msg.channel.send('submit ' + crypto.createHash('sha256').update(msg.author.id).digest('hex') + ' to any problem');
      break;
      case 'problem':
        if(args.length != 4){
          msg.channel.send('that\'s not a valid thing');
          return;
        }
        if(handles.has(msg.author.id) == false){
          msg.channel.send('register your handle first');
          return;
        }
        args[2] = args[2].toLowerCase();
        var request = require('sync-request');
        var problems = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/resources/contest-problem.json').getBody());
        var submission = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(msg.author.id)).getBody());
        problems = shuffleArray(problems);
        var num = (args[3][0].charCodeAt(0) - 97 + 1).toString();
        // if(args[2].toLowerCase() == 'a')num = 1;
        // else if(args[2].toLowerCase() == 'b')num = 2;
        // else if(args[2].toLowerCase() == 'c')num = 3;
        // else if(args[2].toLowerCase() == 'd')num = 4;
        // else if(args[2].toLowerCase() == 'e')num = 5;
        // else if(args[2].toLowerCase() == 'f')num = 6;
        // else if(args[2].toLowerCase() == 'g')num = 7;
        // else if(args[2].toLowerCase() == 'h')num = 8;
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
          msg.channel.send('internal error, contact developer');
          return;
        }
        msg.channel.send('problem for <@' + msg.author.id + '>: https://atcoder.jp/contests/' + problems[indx].contest_id + '/tasks/' + problems[indx].problem_id);
      break;
      case 'challenge':
        if(args.length != 4){
          msg.channel.send('that is not a valid thing');
        }
        if(handles.has(msg.author.id) == false){
          msg.channel.send('register your handle first!');
          return;
        }
        if(handles.has(args[3].substr(3, args[3].length - 4)) == false){
          console.log((args[3].substr(3, args[3].length - 4)));
          msg.channel.send(args[3] + ' havn\'t registered his/her handle');
          return;
        }
        if(ongoing.has(msg.author.id)){
          msg.channel.send('you are in a duel!');
          return;
        }
        if(ongoing.has(args[3].substr(3, args[3].length - 4))){
          msg.channel.send(args[3] + ' is on a duel');
          return;
        }
        if(challenge.has(msg.author.id)){
          msg.channel.send('someone is challenging you or you are challenging someone');
          return;
        }
        if(challenge.has(args[3].substr(3, args[3].length - 4))){
          msg.channel.send('yang lu challenge lagi di challenge ornag, males ngetik gw. paling ini message g bakal kekirim. ah ada typo lagi');
          return;
        }
        var temp = {
          opp: msg.author.id,
          confirm: true,
          type: args[2]
        }
        challenge.set(args[3].substr(3, args[3].length - 4), temp);
        temp = {
          opp: args[3].substr(3, args[3].length - 4),
          confirm: false,
          type: args[2]
        }
        challenge.set(msg.author.id, temp);
        msg.channel.send(args[3] + ', <@' + msg.author.id + '> is challenging you on a(n) ' + args[2] + ' duel');
      break;
      case 'accept':
        if(challenge.has(msg.author.id) == false){
          msg.channel.send('no one is challenging you');
          return;
        }
        if(challenge.get(msg.author.id).confirm == false){
          msg.channel.send('wait for your opponent to accept');
          return;
        }
        var temp = challenge.get(msg.author.id);
        challenge.delete(msg.author.id);
        challenge.delete(temp.opp);
        var request = require('sync-request');
        var problems = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/resources/contest-problem.json').getBody());
        var list = [];
        var need = ['a', 'b', 'c', 'd', 'e'];
        var submission1 = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(msg.author.id)).getBody());
        var submission2 = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(temp.opp)).getBody());
        var out = "problem for <@" + msg.author.id + '> and <@' + temp.opp + '> \n';
        for(var i = 0; i < 5; i++){
          problems = shuffleArray(problems);
          var done = 0;
          for(var j = 0; j < problems.length; j++){
            if(problems[j].problem_id[7] != need[i])continue;
            if(problems[j].problem_id.substr(0, temp.type.length) != temp.type)continue;
            var can = 1;
            for(var k = 0; k < submission1.length; k++){
              if(submission1[k].problem_id == problems[j].problem_id){can = 0;break;}
            }
            for(var k = 0; k < submission2.length; k++){
              if(submission2[k].problem_id == problems[j].problem_id){can = 0; break;}
            }
            if(!can)continue;
            list[i] = problems[j];
            out += need[i].toUpperCase() + ': ' + 'https://atcoder.jp/contests/' + problems[j].contest_id + '/tasks/' + problems[j].problem_id + '\n';
            done = 1;
            break;
          }
          if(!done){
            msg.channel.send('internal error, contact developer');
            return;
          }
        }
        var start = Date.now();
        var temp2 = {
          opp: temp.opp,
          prob: list,
          start: start
        }
        ongoing.set(msg.author.id, temp2);
        temp2 = {
          opp: msg.author.id,
          prob: list,
          start: start
        }
        ongoing.set(temp.opp, temp2);
        temp2 = {
          opp: temp.opp,
          prob: list,
          start: start
        }
        ongoing.set(msg.author.id, temp2);
        save();
        msg.channel.send(out);
      break;
      case 'decline':
        if(challenge.has(msg.author.id) == false){
          msg.channel.send("no one is challenging you");
          return;
        }
        var temp = challenge.get(msg.author.id);
        challenge.delete(msg.author.id);
        challenge.delete(temp.opp);
        msg.channel.send('challenge declined!');
      break;
      case 'update':
        if(ongoing.has(msg.author.id) == false){
          msg.channel.send('you are not in a duel');
          return;
        }
        console.log('updating');
        var request = require('sync-request');
        var temp = ongoing.get(msg.author.id);
        var submission1 = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(msg.author.id)).getBody());
        var submission2 = JSON.parse(request('GET', 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + handles.get(temp.opp)).getBody());
        var timeA = [3000000000, 3000000000, 3000000000, 3000000000, 3000000000];
        var timeB = [3000000000, 3000000000, 3000000000, 3000000000, 3000000000];
        for(var i = 0; i < temp.prob.length; i++){
          for(var j = 0; j < submission1.length; j++){
            if(submission1[j].result == 'AC' && temp.prob[i].problem_id == submission1[j].problem_id){
              timeA[i] = Math.min(timeA[i], submission1[j].epoch_second);
            }
          }
          for(var j = 0; j < submission2.length; j++){
            if(submission2[j].result == 'AC' && temp.prob[i].problem_id == submission2[j].problem_id){
              timeB[i] = Math.min(timeB[i], submission2[j].epoch_second);
            }
          }
        }
        console.log('tes');
        var scoreA = 0, scoreB = 0;
        for(var i = 0; i < temp.prob.length; i++){
          if(timeA[i] < timeB[i]){
            scoreA += (i + 1) * 100;
          } else if(timeB[i] < timeA[i]){
            scoreB += (i + 1) * 100;
          }
        }
        if(scoreA + scoreB == 1500 || temp.start + 3600000 < Date.now()){
          if(scoreA > scoreB){
            msg.channel.send('<@' + msg.author.id + '> won against <@' + temp.opp + '> with a final score of ' + scoreA + ' - ' + scoreB);
          } else{
            msg.channel.send('<@' +temp.opp + '> won against <@' +  msg.author.id + '> with a final score of ' + scoreA + ' - ' + scoreB);
          }
          ongoing.delete(msg.author.id);
          ongoing.delete(temp.opp);
          save();
        } else{
          var out = '<@' + msg.author.id + '>: ' + scoreA + '\n<@' + temp.opp + '>: ' + scoreB;
          msg.channel.send(out);
        }
      break;
    }
  }
}
