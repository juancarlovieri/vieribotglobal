const Discord = require('discord.js');
const fs = require("fs");
var crypto = require('crypto');
var obj = JSON.parse(fs.readFileSync("handles.json", "utf8"));
var map = new Map(Object.entries(obj));
// obj = JSON.parse(fs.readFileSync("points.json", "utf8"));
// var points = new Map(Object.entries(obj));
var teamChallenge = new Map();
obj = JSON.parse(fs.readFileSync("problems.json", "utf8"));
var problem = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("ongoing.json", "utf8"));
var ongoing = new Map(Object.entries(obj));
obj = JSON.parse(fs.readFileSync("ongoingTeam.json", "utf8"));
var ongoingTeam = new Map(Object.entries(obj));
// obj = JSON.parse(fs.readFileSync("rating.json", "utf8"));
// var rating = new Map(Object.entries(obj));
var rating = new Map();
var points = new Map();
var challenge = new Map();
var regisTemp = new Map();
var auth = require('./auth.json');
var plotly = require('plotly')('juancarlovieri', auth.plotly);
const lockFile = require('lockfile');

function ratingArr(){return rating;}

function download(uri, filename, callback){
  const request = require('request');
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

function init(){
  obj = JSON.parse(fs.readFileSync("../rating.json", "utf8"));
  rating = new Map(Object.entries(obj));
  obj = JSON.parse(fs.readFileSync("../points.json", "utf8"));
  points = new Map(Object.entries(obj));
  return 1;
}

function save(){
  var jsonObj = Object.fromEntries(map);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("handles.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
  jsonObj = Object.fromEntries(problem);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("problems.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(ongoing);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("ongoing.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(points);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("../points.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(rating);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("../rating.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
  jsonObj = Object.fromEntries(ongoingTeam);
  console.log(jsonObj);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("ongoingTeam.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

function win(winner, looser){
  var ratingW = [];
  if(rating.has(map.get(winner)) == false){
    ratingW = [];
  } else{
    ratingW = rating.get(map.get(winner));
  }
  var ratingL = 0;
  if(rating.has(map.get(looser)) == false){
    ratingL = [];
  } else{
    ratingL = rating.get(map.get(looser));
  }
  ratingW[ratingW.length] = (ratingW.length == 0) ? (1500 + 50) : (ratingW[ratingW.length - 1] + 50);
  ratingL[ratingL.length] = (ratingL.length == 0) ? (1500 - 50) : (ratingL[ratingL.length - 1] - 50);
  rating.set(map.get(winner), ratingW);
  rating.set(map.get(looser), ratingL);
  save();
}

function printratingHist(msg, bot){
  var args = msg.content.split(' ');
  if(args.length != 3){
    msg.channel.send('that\'s not a valid thing');
    return;
  }
  if(map.has(args[2].substr(3, args[2].length - 4)) == false){
    msg.channel.send(args[2] + ' haven\'t registered his/her handle');
    return;
  }
  if(rating.has(map.get(args[2].substr(3, args[2].length - 4))) == false){
    msg.channel.send(args[2] + ' have never participated in a duel!');
    return;
  }
  var hasil = rating.get(map.get(args[2].substr(3, args[2].length - 4)))[0].toString();
  for(var i = 1; i < rating.get(map.get(args[2].substr(3, args[2].length - 4))).length; i++){
    hasil += ' - ' + rating.get(map.get(args[2].substr(3, args[2].length - 4)))[i].toString;
  }
  msg.channel.send('rating history for ' + args[2] + ': ' + hasil);
}

function printRatingGraph(msg, bot){
  var args = msg.content.split(' ');
  var names = "rating graph for: ";
  var data = [];
  for(var i = 2; i < args.length; i++){
    names += ' ' + args[i];
    if(map.has(args[i].substr(3, args[i].length - 4)) == false){
      msg.channel.send(args[i] + ' haven\'t registered his/her handle');
      return;
    }
    if(rating.has(map.get(args[i].substr(3, args[i].length - 4))) == false){
      msg.channel.send(args[i] + ' have never participated in a duel!');
      return;
    }
    var temp = {
      x: [],
      y: [],
      name: map.get(args[i].substr(3, args[i].length - 4)),
      type: "scatter"
    };
    temp.y = rating.get(map.get(args[i].substr(3, args[i].length - 4)));
    for(var j = 0; j < temp.y.length; j++){
      temp.x[temp.x.length] = j + 1;
    }
    console.log(temp);
    data[data.length] = temp;
  }
  console.log(data);
  var graphOptions = {filename: 'umum', fileopt: "overwrite"};
  plotly.plot(data, graphOptions, function (err, mesg) {
    console.log(mesg);
    var request = require('request');
    download(mesg.url + '.jpeg', 'display.png', function(){
      msg.channel.send(names, {
          files: [
            "display.png"
          ]
        });
    });
  });
}

function takeRating(user){
  var request = require('sync-request');
  var ratings = request('GET', 'http://codeforces.com/api/user.rating?handle=' + user);
  var rating = JSON.parse(ratings.getBody());
  // console.log(rating.result[0]);
  return rating.result[rating.result.length - 1].newRating.toString();
}

function getDuelRating(user){
  if(map.has(user) == false){
    return user + ' haven\'t registered his / her handle';
  }
  else{
    if(rating.has(map.get(user)) == false){
      return user + ' have never participated in a duel';
    } else{
      return rating.get(map.get(user));
    }
  }
  console.log('error');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sort(s) {
  s[Symbol.iterator] = function*() {
    yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
  };
  return s;
}

function convertTime(time){
  var utcSeconds = time - 3600;
  var d = new Date(0);  
  d.setUTCSeconds(utcSeconds);
  d = d.toString();
  var arr = d.split(' ');
  d = arr[1].concat(' ' + arr[2]).concat(' ' + arr[3]);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var month = -1;
  for(var k = 0; k < 12; k++){
    if(arr[1] == months[k]){
      month = k + 1;
    }
  }
  if(month == -1){
    console.log('month not found');
    msg.channel.send('an error occured, contact developer');
    return;
  }
  d = arr[3] + '-' + month + '-' + arr[2];
  return d;
}

module.exports = {
  duel: function(bot, msg){
    if(init() == 0){
      msg.channel.send('I am busy, please try again');
      return 0;
    }
    var args = msg.content.split(" ");
    switch(args[1]){
      case 'help':
        if(args[2] == 'solve'){
          msg.channel.send('``^cf solved <handle> <start time in epoch(ms)> <ratings>``\nthe rating must be in format: use \"-\" to combine multiple ratings into one line. Use spaces to seperate group of ratings into multiple lines.\nFor example: `` 1700-1800-1900 1400 800-900``\n there will be 3 lines, line 1 with rating ``1700, 1800, 1900.`` Line two with ``1400``. Line three with ``800 and 900``');
        } else msg.channel.send('to register handle: ``^cf regis <your handle>``\n to verify your handle: ``^cf regisdone``\n to get a random problem: ``^cfudel problem <rating/\"myrating\">``\n after solving the problem given: ``^cf probdone``\n to view the number of solve for a specific person from a specific time: ``^cf help solve``\n rating = your rating on duels\n point = your point on solving problems given by me\n to view a person\'s rating history: ``^cf rating <person>``\n to view the rating graph for multiple people: ^cf ratinggraph <person> <person> ... <person>\n ');
      break;
      case 'regis':
        console.log('register');
        if(map.has(msg.author.id)){
          msg.channel.send('you are reregistering!');
        }
        var args = msg.content.split(" ");
        if(args.length != 3){
          msg.channel.send('that\'s not a valid thing');
          break;
        }
        regisTemp.set(msg.author.id, args[2]);
        msg.channel.send('submit ' + crypto.createHash('sha256').update(msg.author.id).digest('base64') + '  to any problem');
      break;
      case 'regisdone':
        if(regisTemp.has(msg.author.id) == false){
          msg.channel.send('you are not registering');
          break;
        }
        console.log(regisTemp.get(msg.author.id));
        var request = require('request');
        request('http://codeforces.com/api/user.status?handle=' + regisTemp.get(msg.author.id) + '&from=1&count=1', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var submission = JSON.parse(body);
            var request2 = require('request'); 
            request2('http://codeforces.com/contest/' + submission.result[0].contestId + '/submission/' + submission.result[0].id, function(error, response, body){
              var indx = body.indexOf(crypto.createHash('sha256').update(msg.author.id).digest('base64'));
              if(indx < 0 || Date.now() - 3600000 > submission.result[0].creationTimeSeconds * 1000){
                msg.channel.send('submit ' + crypto.createHash('sha256').update(msg.author.id).digest('base64') + '  to any problem');
                return 1;
              } else{
                map.set(msg.author.id, regisTemp.get(msg.author.id));
                regisTemp.delete(msg.author.id);
                save();
                msg.channel.send('registered!');
              }
            });
          }
        });
        break;
      case 'solved':
        console.log('solve graph');
        var request = require('sync-request');
        if(isNaN(args[3]))return;
        const coba = request('GET', 'http://codeforces.com/api/user.rating?handle=' + args[2]);
        if(coba.statusCode >= 300){
          console.log('handle not found');
          msg.channel.send(args[2] + ' not found');
          return;
        }
        var submissions = request('GET', 'http://codeforces.com/api/user.status?handle=' + args[2] + '&from=1&count=1000000000&handle=' + map.get(msg.author.id));
        var submission = JSON.parse(submissions.getBody()).result;
        var time = parseInt(args[3]);
        var alr = new Map();
        var data = [];
        for(var rate = 4; rate < args.length; rate++){
          var allowed = args[rate].split('-');
          var counter = 0;
          var temp = {
            x: [],
            y: [],
            submitTime: [],
            name: args[rate],
            mode: "lines",
            type: "scatter"
          };
          for(var i = submission.length - 1; i >= 0; i--){
            if(submission[i].verdict != 'OK')continue;
            var name = submission[i].problem.name;
            if(alr.has(name))continue;
            if(submission[i].creationTimeSeconds * 1000 < time)continue;
            var ada = 0;
            for(var j = 0; j < allowed.length; j++){
              if(allowed[j] == 'all')ada = 1;
              if(submission[i].problem.rating == allowed[j])ada = 1;
            }
            if(!ada)continue;
            var d = convertTime(submission[i].creationTimeSeconds);
            counter++;
            alr.set(name, 1);
            if(temp.y.length == 0 || temp.y[temp.y.length - 1] != d){
              if(temp.y.length == 0){
                temp.x[temp.x.length] = counter;
                temp.y[temp.y.length] = d;
                temp.submitTime[temp.submitTime.length] = submission[i].creationTimeSeconds;
                continue;
              }
              while(convertTime(temp.submitTime[temp.submitTime.length - 1] + 86400) != d){
                var backx = temp.x[temp.x.length - 1];
                var backy = temp.y[temp.y.length - 1];
                var backt = temp.submitTime[temp.submitTime.length - 1];
                temp.x[temp.x.length] = backx;
                temp.y[temp.y.length] = convertTime(backt + 86400);
                temp.submitTime[temp.submitTime.length] = backt + 86400;
              }
              temp.x[temp.x.length] = counter;
              temp.y[temp.y.length] = d;
              temp.submitTime[temp.submitTime.length] = submission[i].creationTimeSeconds;
            } else{
              temp.x[temp.x.length - 1] = counter;
            }
          }
          temp.y = [temp.x, temp.x = temp.y][0];
          data[data.length] = temp;
        }
        var layout = {
          title: args[2],
          xaxis: {
            autorange: true,
            tickformat: '%b %d %Y',
            type: 'date'
          },
          yaxis: {
            autorange: true,
            type: 'linear'
          }
        };
        var graphOptions = {filename: 'umum', fileopt: "overwrite", layout: layout};
        plotly.plot(data, graphOptions, function (err, mesg) {
          console.log(mesg);
          var request = require('request');
          console.log(mesg.url);
          download(mesg.url + '.jpeg', 'display.png', function(){
            msg.channel.send(names, {
              files: [
              "display.png"
            ]
          });
          });
        });
      break;
      case 'probdone':
        if(problem.has(msg.author.id) == false){
          msg.channel.send('you have no active problem!');
          return 1;
        }
        var request = require('request');
        request('http://codeforces.com/api/user.status?handle=' + map.get(msg.author.id) + '&from=1&count=1', function (error, response, body) {
          var submission = JSON.parse(body).result[0];
          console.log(submission);
          if(submission.verdict == 'OK' && submission.problem.contestId == problem.get(msg.author.id).contestId && submission.problem.index == problem.get(msg.author.id).index){
            var res = [];
            var delta = 10 + (((problem.get(msg.author.id).rating - 800) / (100))) * ((problem.get(msg.author.id).rating - 800) / (100));   
            if(points.has(map.get(msg.author.id))){
              res = points.get(map.get(msg.author.id));
              res[res.length] = res[res.length - 1] + delta;
            } else{
              res[0] = delta;
            }
            console.log(res);
            points.set(map.get(msg.author.id), res);
            problem.delete(msg.author.id);
            save();
            msg.channel.send('<@' + msg.author.id + '> gained ' + delta + ' points');
            return 1;
          } else{
            msg.channel.send('solve this problem, <@' + msg.author.id + '>: https://codeforces.com/contest/' + problem.get(msg.author.id).contestId + '/problem/' + problem.get(msg.author.id).index);
          }
        });        
      break;
      case 'rating':
        var args = msg.content.split(' ');
        if(args.length < 3){
          msg.channel.send('that\'s not a valid thing');
          break;
        }
        msg.channel.send(getDuelRating(args[2].substr(3, args[2].length - 4)).toString());
      break;
      case 'ratinggraph':
        printRatingGraph(msg, bot);
      break;
      case 'ratinghist':
        printratingHist(msg, bot);
      break;
      break;
      case 'pointgraph':
        var data = [];
        var names = 'graph for';
        for(var i = 2; i < args.length; i++){
          names += ' ' + args[i];
          if(map.has(args[i].substr(3, args[i].length - 4)) == false){
            msg.channel.send(args[i] + ' haven\'t registered his/her handle');
            return 1;
          }
          var temp = {
            x: [],
            y: [],
            name: map.get(args[i].substr(3, args[i].length - 4)),
            type: "scatter"
          };
          if(points.has(map.get(args[i].substr(3, args[i].length - 4))) == false){
            temp.y = [0];
          } else{
            temp.y = points.get(map.get(args[i].substr(3, args[i].length - 4)));
          }
          for(var j = 0; j < temp.y.length; j++){
            temp.x[temp.x.length] = j + 1;
          }
          console.log(temp);
          data[data.length] = temp;
        }
        console.log(data);
        var graphOptions = {filename: 'umum', fileopt: "overwrite"};
        plotly.plot(data, graphOptions, function (err, mesg) {
          console.log(mesg);
          var request = require('request');
          download(mesg.url + '.jpeg', 'display.png', function(){
            msg.channel.send(names, {
              files: [
              "display.png"
            ]
          });
          });
        });
      break;
      case 'pointhist':
        if(args.length == 3){
          if(map.has(args[2]) == false){
            msg.channel.send(args[2] + ' have\'nt register his/her handle');
          } else{
            if(points.has(map.get(args[2])) == false){
              msg.channel.send('0');
            } else{
              var hasil = points.get(map.get(args[2]))[0].toString();
              for(var i = 1; i < points.get(map.get(args[2])).length; i++)hasil += " - " + points.get(map.get(args[2]))[i].toString();
              msg.channel.send(hasil);
            }
          }
          break;          
        }
        if(map.has(msg.author.id) == false){
          msg.channel.send('register your handle first');
          break;
        }
        if(points.has(map.get(msg.author.id)) == false){
          msg.channel.send('0');
        } else{
          var hasil = points.get(map.get(msg.author.id))[0].toString();
          for(var i = 1; i < points.get(map.get(msg.author.id)).length; i++)hasil += " - " + points.get(map.get(msg.author.id))[i].toString();
          msg.channel.send(hasil);
        }
      break;
      case 'point':
        if(args.length == 3){
          if(map.has(args[2]) == false){
            msg.channel.send(args[2] + ' have\'nt register his/her handle');
          } else{
            if(points.has(map.get(args[2])) == false){
              msg.channel.send('0');
            } else{
              msg.channel.send(points.get(map.get(args[2]))[points.get(map.get(args[2])).length - 1].toString());
            }
          }
          break;          
        }
        if(map.has(msg.author.id) == false){
          msg.channel.send('register your handle first!');
          break;
        }
        if(points.has(map.get(msg.author.id)) == false){
          msg.channel.send('0');
        } else{
          msg.channel.send(points.get(map.get(msg.author.id))[points.get(map.get(msg.author.id)).length - 1].toString());
        }
      break;
      case 'complete':
        if(ongoing.has(msg.author.id) == false){
          msg.channel.send('you have no ongoing duel!');
          break;
        }
        var request = require('request');
        request('http://codeforces.com/api/user.status?handle=' + map.get(msg.author.id) + '&from=1&count=1', function (error, response, body) {
          var submission = JSON.parse(body).result[0];
          console.log(submission);
          if(submission.verdict == 'OK' && submission.problem.contestId == ongoing.get(msg.author.id)[1].contestId && submission.problem.index == ongoing.get(msg.author.id)[1].index){
            win(msg.author.id, ongoing.get(msg.author.id)[0]);
            msg.channel.send( '<@' + msg.author.id + '> has beaten <@' + ongoing.get(msg.author.id)[0] + '> in a ' + ongoing.get(msg.author.id)[1].rating + ' duel');
            ongoing.delete(ongoing.get(msg.author.id)[0]);
            ongoing.delete(msg.author.id);
            save();
          } else{
            msg.channel.send('solve this problem, <@' + msg.author.id + '>: https://codeforces.com/contest/' + ongoing.get(msg.author.id)[1].contestId + '/problem/' +ongoing.get(msg.author.id)[1].index);
          }
        });
      break;
      case 'accept':
        if(challenge.has(msg.author.id) == false){
          msg.channel.send('no one is challenging you');
          break;
        }
        var rating = challenge.get(msg.author.id)[1];
        var request = require('sync-request');
        var list = request('GET', 'http://codeforces.com/api/problemset.problems');
        var problems = JSON.parse(list.getBody()).result.problems;
        var indx = -1;
        var counter = 0;
        problems = shuffleArray(problems);
        for(var temp = 0; temp < problems.length; temp++){
          if(problems[temp].rating != rating){
            continue;
          }
          var request2 = require('sync-request');
          var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + problems[temp].contestId + '&from=1&count=1000000&handle=' + map.get(msg.author.id));
          var submission = JSON.parse(submissions.getBody()).result;
          var can = 1;  
          for(var i = 0; i < submission.length; i++){
            if(submission[i].problem.index == problems[temp].index){
              can = 0;
              break;
            }
          }
          submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + problems[temp].contestId + '&from=1&count=1000000&handle=' + map.get(challenge.get(msg.author.id)[0]));
          submission = JSON.parse(submissions.getBody()).result;
          for(var i = 0; i < submission.length; i++){
            if(submission[i].problem.index == problems[temp].index){
              can = 0;
              break;
            }
          }
          if(can == 1){
            indx = temp;
            break;
          }
        }
        if(indx == -1){
          msg.channel.send('internal error, contact developer');
          console.log('problem index not found');
          return 1;
        }
        var tempo = [challenge.get(msg.author.id)[0], problems[indx]];
        ongoing.set(msg.author.id, tempo);
        tempo = [msg.author.id, problems[indx]];
        ongoing.set(challenge.get(msg.author.id)[0], tempo);
        console.log(indx);
        save();
        msg.channel.send('problem for <@' + msg.author.id + '> and <@' + challenge.get(msg.author.id)[0] + '>: https://codeforces.com/contest/' + problems[indx].contestId + '/problem/' + problems[indx].index);
        challenge.delete(msg.author.id);
      break;
      case 'top':
        var counter = 1;
        var hasil = "";
        if(args[2] == 'point'){
          var arr = new Map();
          points.forEach(function print(val, key){
            arr.set(key, val[val.length - 1]);
          });
          arr = sort(arr);
          arr.forEach(function print(val, key){
            hasil += counter.toString() + ". " + key + ' - ' + val.toString() + '\n';
            counter++;
          });
        } else if(args[2] == 'rating'){
          var arr = new Map();
          ratingArr().forEach(function print(val, key){
            arr.set(key, val[val.length - 1]);
          });
          arr = sort(arr);
          arr.forEach(function print(val, key){
            hasil += counter.toString() + ". " + key + ' - ' + val.toString() + '\n';
            counter++;
          });
        }
        if(hasil != ""){
          msg.channel.send(hasil);
        }
      break;
      case 'challenge':
      console.log(msg.content);
      console.log(args.length);
        if(args.length != 4){
          msg.channel.send('that\'s not a valid thing');
          break;
        }
        var person = args[2].substr(3, args[2].length - 4);
        if(person == msg.author.id){
          msg.channel.send('you can\'t duel yourselves');
          break;
        }
        if(map.has(msg.author.id) == false){
          msg.channel.send('register your handle first!');
          break;
        }
        if(map.has(person) == false){
          msg.channel.send(person + ' haven\'t register his/her handle');
          break;
        }
        if(isNaN(args[3])){
          console.log('no rating');
          msg.channel.send('that\'s not a valid thing');
          break;
        }
        if(ongoing.has(person)){
          msg.channel.send('<@' + person + '> is on a duel');
          return 1;
        }
        if(ongoing.has(msg.author.id)){
          msg.channel.send('you are on a duel');
          return 1;
        }
        if(challenge.has(msg.author.id)){
          msg.channel.send('you are being challenged');
          return 1;
        }
        if(challenge.has(person)){
          msg.channel.send('<@' + person + '> is being challenged');
          return 1;
        }
        var temp = [msg.author.id, parseInt(args[3])];
        challenge.set(person, temp);
        msg.channel.send('<@' + person + ">, <@" + msg.author.id + "> is challenging you on a " + parseInt(args[3]) + ' duel');
      break;
      case 'forfeit':
        if(ongoing.has(msg.author.id) == false){
          msg.channel.send('you are not in a duel');
          break;
        }
        win(ongoing.get(msg.author.id)[0], msg.author.id);
        msg.channel.send('<@' + ongoing.get(msg.author.id)[0] + '> won against <@' + msg.author.id + '>');
        ongoing.delete(ongoing.get(msg.author.id)[0]);
        ongoing.delete(msg.author.id);
        save();
      break;
      case 'problem':
        if(map.has(msg.author.id) == false){
          msg.channel.send('register your handle first!');
          break;
        }
        var rating = parseInt(args[2]);
        if(args[2] == "myrating"){
          console.log(takeRating(map.get(msg.author.id)));
          rating = Math.round(takeRating(map.get(msg.author.id)) / 100) * 100;
        }
        rating = Math.round(rating / 100) * 100;
        if(args.length != 3 || isNaN(rating)){
          msg.channel.send('that\'s not a valid thing');
          break;
        }
        console.log('new prob');
        var request = require('sync-request');
        var list = request('GET', 'http://codeforces.com/api/problemset.problems');
        var problems = JSON.parse(list.getBody()).result.problems;
        var indx = -1;
        var counter = 0;
        problems = shuffleArray(problems);
        for(var temp = 0; temp < problems.length; temp++){
          if(problems[temp].rating != rating){
            continue;
          }
          var request2 = require('sync-request');
          var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + problems[temp].contestId + '&from=1&count=1000000&handle=' + map.get(msg.author.id));
          var submission = JSON.parse(submissions.getBody()).result;
          var can = 1;  
          for(var i = 0; i < submission.length; i++){
            if(submission[i].problem.index == problems[temp].index){
              can = 0;
              break;
            }
          }
          if(can == 1){
            indx = temp;
            break;
          }
        }
        if(indx == -1){
          msg.channel.send('internal error, contact developer');
          console.log('problem index not found');
          return 1;
        }
        console.log(indx);
        problem.set(msg.author.id, problems[indx]);
        save();
        msg.channel.send('problem for <@' + msg.author.id.toString() + '>: https://codeforces.com/contest/' + problems[indx].contestId + '/problem/' + problems[indx].index);
      break;
      case 'cfgraph':
        var contestants = [];
        if(args.length == 2){
          contestants = [msg.author.id];
        } else{
          for(var i = 2; i < args.length; i++){
            contestants[contestants.length] = args[i].substr(3, args[i].length - 4);
          }
        }
        var data = [];
        var names = "cf rating graph for ";
        for(var i = 0; i < contestants.length; i++){
          if(map.has(contestants[i]) == false){
            msg.channel.send(contestants[i] + ' haven\'t registered his/her handle');
            return 1;
          }
          names += map.get(contestants[i]) + ' ';
          var request = require('sync-request');
          var ratings = JSON.parse(request('GET', 'http://codeforces.com/api/user.rating?handle=' + map.get(contestants[i])).getBody()).result;
          var temp = {
            x: [],
            y: [],
            name: contestants[i],
            type: "scatter"
          };
          for(var j = 0; j < ratings.length; j++){
            temp.y[temp.y.length] = ratings[j].newRating;
          }
          for(var j = 0; j < temp.y.length; j++){
            temp.x[temp.x.length] = j + 1;
          }
          console.log(temp);
          data[data.length] = temp;
        }
        console.log(contestants);
        if(data.length == 0)return 1;
        console.log(data);
        var graphOptions = {filename: 'umum', fileopt: "overwrite"};
        plotly.plot(data, graphOptions, function (err, mesg) {
          console.log(mesg);
          var request = require('request');
          download(mesg.url + '.jpeg', 'display.png', function(){
            msg.channel.send(names, {
              files: [
                "display.png"
              ]
            });
          });
        });
      break;
      case 'teamDecline':
        if(teamChallenge.has(msg.author.id) == false){
          msg.channel.send('no one is challenging you!');
          return 1;
        }
        var temp = teamChallenge.get(msg.author.id);
        var teamA = temp.teamA;
        var teamB = temp.teamB;
        for(var i = 0; i < teamA.length; i++){
          teamChallenge.delete(teamA[i]);
        }
        for(var i = 0; i < teamB.length; i++){
          teamChallenge.delete(teamB[i]);
        }
        msg.channel.send('Duel declined!');
      break;
      case 'teamAccept':
        if(teamChallenge.has(msg.author.id) == false){
          msg.channel.send('no one is challenging you!');
          return 1;
        }
        var temp = teamChallenge.get(msg.author.id);
        var teamA = temp.teamA;
        var teamB = temp.teamB;
        var confirmed = temp.confirmed;
        var ada = 0;
        for(var i = 0; i < confirmed.length; i++)if(confirmed[i] == msg.author.id)ada = 1;
        if(ada)return 1;
        confirmed[confirmed.length] = msg.author.id;
        temp.confirmed = confirmed;
        for(var i = 0; i < teamA.length; i++){
          teamChallenge.set(teamA[i], temp);
        }
        for(var i = 0; i < teamB.length; i++){
          teamChallenge.set(teamB[i], temp);
        }
        save();
        if(confirmed.length != teamA.length * 2){
          msg.channel.send('accepted!, '  + (teamA.length * 2 - confirmed.length) + ' remaining');
          return 1;
        }
        msg.channel.send('Duel Team is starting!');
        console.log('duel team start');
        console.log('tes');
        var prob = [];
        var rating = temp.rating;
        console.log(rating);
        var request = require('sync-request');
        var list = request('GET', 'http://codeforces.com/api/problemset.problems');
        var problems = JSON.parse(list.getBody()).result.problems;
        for(var inc = 0; inc < 5; inc++){
          var indx = -1;
          var counter = 0;
          problems = shuffleArray(problems);
            console.log('next prob');
          for(var temp = 0; temp < problems.length; temp++){
            if(problems[temp].rating != rating){
              continue;
            }
            for(var i = 0; i < prob.length; i++){
              if(problems[temp] == prob[i])continue;
            }
            var can = 1;  
            for(var i = 0; i < teamA.length; i++){
              var request2 = require('sync-request');
              var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + problems[temp].contestId + '&from=1&count=1000000&handle=' + map.get(teamA[i]));
              var submission = JSON.parse(submissions.getBody()).result;
              for(var i = 0; i < submission.length; i++){
                if(submission[i].problem.index == problems[temp].index){
                  can = 0;
                  break;
                }
              }
            }
            for(var i = 0; i < teamB.length; i++){
              var request2 = require('sync-request');
              var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + problems[temp].contestId + '&from=1&count=1000000&handle=' + map.get(teamB[i]));
              var submission = JSON.parse(submissions.getBody()).result;
              for(var i = 0; i < submission.length; i++){
                if(submission[i].problem.index == problems[temp].index){
                  can = 0;
                  break;
                }
              }
            }
            if(can == 1){
              indx = temp;
              break;
            }
          }
          if(indx == -1){
            msg.channel.send('internal error, contact developer');
            console.log('problem index not found');
            return 1;
          }
          prob[prob.length] = problems[indx];
          rating += 100;
        }
        temp = {
          prob: prob,
          teamA: teamA,
          teamB: teamB,
          timeTeamA: [10000000000, 10000000000, 10000000000, 10000000000, 10000000000],
          timeTeamB: [10000000000, 10000000000, 10000000000, 10000000000, 10000000000]
        }
        var hasil = 'duel team problem for:\n**Team A:**\n';
        for(var i = 0; i < teamA.length; i++){
          ongoingTeam.set(teamA[i], temp);
          teamChallenge.delete(teamA[i]);
          hasil += '<@' + teamA[i] + '>\n';
        }
        hasil += '**Team B:**\n'
        for(var i = 0; i < teamB.length; i++){
          ongoingTeam.set(teamB[i], temp);
          teamChallenge.delete(teamB[i]);
          hasil += '<@' + teamB[i] + '>\n';
        }
        save();
        hasil += '**Problem**:\n';
        for(var i = 0; i < 5; i++){
          hasil += '**' + (i + 1) + ': **' + 'https://codeforces.com/contest/' + prob[i].contestId + '/problem/' + prob[i].index + ' - ' + ((i + 1) * 100) + ' \n';
        }
        console.log(hasil);
        msg.channel.send(hasil);
      break;
      case 'teamUpdate':
        if(ongoingTeam.has(msg.author.id) == false){
          msg.channel.send('you are not in a team duel!');
          return 1;
        }
        var cur = ongoingTeam.get(msg.author.id);
        var timeTeamA = cur.timeTeamA;
        var timeTeamB = cur.timeTeamB;
        var prob = cur.prob;
        var teamA = cur.teamA;
        var teamB = cur.teamB;
        for(var temp = 0; temp < prob.length; temp++){
          for(var i = 0; i < teamA.length; i++){
            var request2 = require('sync-request');
            var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + prob[temp].contestId + '&from=1&count=1000000&handle=' + map.get(teamA[i]));
            var submission = JSON.parse(submissions.getBody()).result;
            for(var i = 0; i < submission.length; i++){
              if(submission[i].problem.index == prob[temp].index && submission[i].verdict == 'OK'){
                timeTeamA[temp] = Math.min(timeTeamA[temp], submission[i].creationTimeSeconds);
              }
            }
          }
          for(var i = 0; i < teamB.length; i++){
            var request2 = require('sync-request');
            var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + prob[temp].contestId + '&from=1&count=1000000&handle=' + map.get(teamB[i]));
            var submission = JSON.parse(submissions.getBody()).result;
            for(var i = 0; i < submission.length; i++){
              if(submission[i].problem.index == prob[temp].index && submission[i].verdict == 'OK'){
                timeTeamB[temp] = Math.min(timeTeamB[temp], submission[i].creationTimeSeconds);
              }
            }
          }
        }
        var pointA = 0, pointB = 0;
        for(var i = 0; i < 5; i++){
          if(timeTeamA[i] < timeTeamB[i])pointA += (i + 1) * 100;
          if(timeTeamB[i] < timeTeamA[i])pointB += (i + 1) * 100;
        }
        if(pointA + pointB == 1500){
          if(pointA > pointB){
            msg.channel.send('team A win');
          } else{
            msg.channel.send('team B win');
          }
          for(var i = 0; i < teamA.length; i++){
            if(pointA > pointB)win(teamA[i], teamB[i]);
            else win(teamB[i], teamA[i]);
            ongoingTeam.delete(teamA[i]);
            ongoingTeam.delete(teamB[i]);
          }
          return 1;
        }
        var hasil = 'score for team A: **' + pointA + '**\n' + 'score for team B: **' + pointB + '**';
        msg.channel.send(hasil);
      break;
      case 'team':
        console.log('hi');
        if(args.length < 5){
          msg.channel.send('that\'s not a valid thing');
          return 1;
        }
        if(ongoingTeam.has(msg.author.id)){
          msg.channel.send('you are on a duel');
          return 1;
        }
        var teamA = [msg.author.id];
        var teamB = [];
        var indx = -1;
        for(var i = 2; i < args.length; i++){
          if(args[i] == 'challenge'){
            indx = i;
            break;
          }
          var cur = args[i].substr(3, args[i].length - 4);
          if(map.has(cur) == false){
            msg.channel.send('<@' + cur + '> haven\'t registered his/her handle');
            return 1;
          }
          if(ongoingTeam.has(cur) || teamChallenge.has(cur)){
            msg.channel.send('<@' + cur + '> is on a duel');
            return 1;
          }
          for(var j = 0; j < teamA.length; j++){
            if(cur == teamA[j]){
              msg.channel.send('no duplicate members please');
              return 1;
            }
          }
          for(var j = 0; j < teamB.length; j++){
            if(cur == teamB[j]){
              msg.channel.send('no duplicate members please');
              return 1;
            }
          }
          teamA[teamA.length] = cur;
        }
        if(indx == -1){
          msg.channel.send('that\'s not a valid thing');
          return 1;
        }
        for(var i = indx + 1; i < args.length - 1; i++){
          var cur = args[i].substr(3, args[i].length - 4);
          if(map.has(cur) == false){
            msg.channel.send('<@' + cur + '> haven\'t registered his/her handle');
            return 1;
          }
          if(ongoingTeam.has(cur) || teamChallenge.has(cur)){
            msg.channel.send('<@' + cur + '> is on a duel');
            return 1;
          }
          for(var j = 0; j < teamA.length; j++){
            if(cur == teamA[j]){
              msg.channel.send('no duplicate members please');
              return 1;
            }
          }
          for(var j = 0; j < teamB.length; j++){
            if(cur == teamB[j]){
              msg.channel.send('no duplicate members please');
              return 1;
            }
          }
          teamB[teamB.length] = cur;
        }
        if(ongoingTeam.has(cur)){
          msg.channel.send('<@' + cur + '> is on a duel');
          return 1;
        }
        if(teamA.length > 5){
          msg.channel.send('team size cannot be bigger than 5');
          return 1;
        }
        if(teamA.length != teamB.length){
          msg.channel.send('teams have to be the same amount');
          return 1;
        }
        var rating = parseInt(args[args.length - 1]);
        if(isNaN(rating)){
          msg.channel.send('that\'s not a valid thing');
          return 1;
        }
        var temp = {
          teamA: teamA,
          teamB: teamB,
          rating: rating,
          confirmed: [msg.author.id]        
        }
        for(var i = 0; i < teamA.length; i++){
          teamChallenge.set(teamA[i], temp);
        }

        for(var i = 0; i < teamB.length; i++){
          teamChallenge.set(teamB[i], temp);
        }
        save();
        var hasil = '<@' + msg.author.id + '> made a new challenge, starting rating = ' + rating + '\n**Team A**:\n';
        for(var i = 0; i < teamA.length; i++){
          hasil += '<@' + teamA[i] + '>\n';
        }
        hasil += '**Team B**:\n';
        for(var i = 0; i < teamB.length; i++){
          hasil += '<@' + teamB[i] + '>\n';
        }
        msg.channel.send(hasil);
      break;
      case 'cfgraphhandle':
        var contestants = [];
        if(args.length == 2){
          contestants = [msg.author.id];
        } else{
          for(var i = 2; i < args.length; i++){
            contestants[contestants.length] = args[i];
          }
        }
        var data = [];
        var names = "cf rating graph for ";
        for(var i = 0; i < contestants.length; i++){
          names += contestants[i] + ' ';
          var request = require('sync-request');
          const coba = request('GET', 'http://codeforces.com/api/user.rating?handle=' + contestants[i]);
          if(coba.statusCode >= 300){
            console.log('handle not found');
            msg.channel.send(contestants[i] + ' not found');
            return 1;
          }
          var ratings = JSON.parse(coba.getBody()).result;
          var temp = {
            x: [],
            y: [],
            name: contestants[i],
            type: "scatter"
          };
          for(var j = 0; j < ratings.length; j++){
            temp.y[temp.y.length] = ratings[j].newRating;
          }
          for(var j = 0; j < temp.y.length; j++){
            temp.x[temp.x.length] = j + 1;
          }
          console.log(temp);
          data[data.length] = temp;
        }
        console.log(contestants);
        if(data.length == 0)return 1;
        console.log(data);
        var graphOptions = {filename: 'umum', fileopt: "overwrite"};
        plotly.plot(data, graphOptions, function (err, mesg) {
          console.log(mesg);
          var request = require('request');
          download(mesg.url + '.jpeg', 'display.png', function(){
            msg.channel.send(names, {
              files: [
                "display.png"
              ]
            });
          });
        });
      break;
      case 'contest':
        var averageRating = 0;
        averageRating = 0;
        var contestant = [];
        if(args.length == 2){
          if(map.has(msg.author.id) == false){
            msg.channel.send('register your handle first!');
            return 1;
          }
          contestant[0] = map.get(msg.author.id);
        } else{
          for(var i = 2; i < args.length; i++){
            if(map.has(args[i].substr(3, args[i].length - 4)) == 0){
              msg.channel.send(args[i] + ' haven\'t registered his/her handle');
              return 1;
            }
            contestant[contestant.length] = map.get(args[i].substr(3, args[i].length - 4));
          }
        }
        var names = "";
        for(var i = 0; i < contestant.length; i++){
          averageRating += parseInt(takeRating(contestant[i]));
          names += ' ' + contestant[i];
        }
        averageRating = Math.round(averageRating / contestant.length);
        console.log('new contest');
        console.log(averageRating);
        var request = require('sync-request');
        var list = request('GET', 'http://codeforces.com/api/contest.list?gym=false');
        var contests = JSON.parse(list.getBody()).result;
        var indx = -1;
        contests = shuffleArray(contests);
        for(var temp = 0; temp < contests.length; temp++){
          if(contests[temp].phase != "FINISHED")continue;
          if(averageRating < 1600 && contests[temp].name.indexOf("Div. 3") < 0){
            continue;
          } else if(averageRating > 2100 && contests[temp].name.indexOf("Div. 1") < 0){
            continue;
          } else if(averageRating >= 1600 && averageRating <= 2100 && contests[temp].name.indexOf("Div. 2") < 0){
            continue;
          }
          var can = 1;
          for(var i = 0; i < contestant.length; i++){
            var request2 = require('sync-request');
            var submissions = request2('GET', 'http://codeforces.com/api/contest.status?contestId=' + contests[temp].id + '&from=1&count=1000000&handle=' + contestant[i]);
            var submission = JSON.parse(submissions.getBody()).result;
            if(submission.length != 0)can = 0;
          }
          if(can == 1){
            indx = temp;
            break;
          }
        }
        if(indx == -1){
          msg.channel.send('internal error, contact developer');
          console.log('problem index not found');
          return 1;
        }
        console.log(indx);
        msg.channel.send('recommended contest for ' + names + ': https://codeforces.com/contest/' + contests[indx].id);
        break;
    }
    return 1;
  }
}
