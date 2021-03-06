const fs = require('fs');
const Discord = require('discord.js');
var groups = new Map();
var balance = new Map();
var locks = new Map();

if(fs.existsSync('gambles.json')){
  var obj = JSON.parse(fs.readFileSync("gambles.json", "utf8"));
  obj = new Map(Object.entries(obj));
  obj.forEach(function lol(value, key){
    var sub = new Map();
    for(var i = 0; i < value.length; ++i){
      var temp = new Map();
      for(var j = 0; j < value[i][1].length; j++){
        temp.set(value[i][1][j][0], value[i][1][j][1]);
      }
      sub.set(value[i][0], temp);
    }
    groups.set(key, sub);
  });
}

if(fs.existsSync('balance.json')){
  var obj = JSON.parse(fs.readFileSync("balance.json", "utf8"));
  balance = new Map(Object.entries(obj));
}

if(fs.existsSync('gambleLocks.json')){
  var obj = JSON.parse(fs.readFileSync("gambleLocks.json", "utf8"));
  locks = new Map(Object.entries(obj));
}

function save(){
  var temp = new Map();
  groups.forEach(function lol(value, key){
    var temp2 = [];
    value.forEach(function lol2(value2, key2){
      var temp3 = [];
      value2.forEach(function lol3(value3, key3){
        temp3[temp3.length] = [key3, value3];
      });
      temp2[temp2.length] = [key2, temp3];
    });
    temp.set(key, temp2);
  });
  var jsonObj = Object.fromEntries(temp);
  var jsonContent = JSON.stringify(jsonObj);
  console.log(jsonContent);
  fs.writeFileSync("gambles.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
  jsonObj = Object.fromEntries(balance);
  jsonContent = JSON.stringify(jsonObj);
  console.log(jsonContent);
  fs.writeFileSync("balance.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
  jsonObj = Object.fromEntries(locks);
  jsonContent = JSON.stringify(jsonObj);
  console.log(jsonContent);
  fs.writeFileSync("gambleLocks.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
  });
}

function newGroup(bot, msg, args){
  if(!admin(msg))return;
  if(args.length < 5)return;
  if(groups.has(args[2])){
    msg.channel.send('that group exists');
    return;
  }
  var temp = new Map();
  for(var i = 3; i < args.length; i++){
    if(temp.has(args[i])){
      msg.channel.send('please use unique candidate names');
      return;
    }
    temp.set(args[i], new Map());
  }
  groups.set(args[2], temp);
  locks.set(args[2], false);
  save();
}

function admin(msg){
  if(msg.author.id == "455184547840262144")return true;
  return false;
}

function finish(bot, msg, args){
  if(!admin(msg)){
    msg.channel.send('you must be admin');
    return;
  }
  args.splice(1, 1);
  console.log(args);
  if(groups.has(args[1]) == false)return;
  var cand = groups.get(args[1]);
  if(cand.has(args[2]) == false)return;
  cand.forEach(function lol(value, key){
    value.forEach(function lol(value2, key2){
      console.log(balance.get(key2));
      var newBalance = balance.get(key2).balance[balance.get(key2).balance.length - 1] + value2;
      if(key != args[2]){
        newBalance -= 2 * value2;
      }
      var temp = balance.get(key2);
      if(newBalance < 0){
        msg.channel.send('internal error, contact developer');
      }
      if(newBalance == 0){
        newBalance = 100;
        temp.bc++;
      }
      temp.tot += value2;
      temp.reserved -= value2;
      temp.balance[temp.balance.length] = newBalance;
      temp.time[temp.time.length] = Date.now();
      balance.set(key2, temp);
    });
  });
  locks.delete(args[1]);
  save();
  groups.delete(args[1]);
  save();
  msg.channel.send('balance updated!');
}

function cmp(a, b) {
  let comparison = 0;
  if (a.amnt < b.amnt) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

async function printGambles(bot, msg, args){
  if(groups.has(args[1]) ==false)return;
  var cand = groups.get(args[1]);
  var arr = [];
  cand.forEach(function lol(value, key){
    value.forEach(function lol(value2, key2){
      console.log(key);
      // let temp = await bot.users.fetch(key2);
      arr[arr.length] = {
        name: key2,
        amnt: value2,
        cand: key
      };
      // hasil += temp.username + ' ' + arr[i].point + '\n';
    });
  });  
  console.log(arr);
  arr.sort(cmp);
  var rank = 1;
  for(var i = 0; i < arr.length; ++i){
    let temp = await bot.users.fetch(arr[i].name);
    arr[i] = {
      name: rank + '. ' + temp.username + ' - $' + arr[i].amnt,
      value: arr[i].cand
    }
    ++rank;
  }
  // console.log(arr);
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  msg.channel.send({files: [vieri], embed: {
    color: 16764006,
    author: {
      name: 'Tests',
      icon_url: "attachment://viericorp.png"
    },
    title: 'list of gambles for ' + args[1],
    fields: arr,
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  });
}

function lock(bot, msg, args){
  if(!admin(msg))return;
  if(locks.get(args[1]) == false){
    locks.set(args[1], true);
    msg.channel.send('locked!');
  }
  else {
    locks.set(args[1], false);
    msg.channel.send('unlocked!');
  }
  save();
}

function check(bot, msg, args){
  if(args.length < 2)return;
  if(groups.has(args[1]) == false){
    msg.channel.send('group not found');
    return;
  }
  if(args.length == 2){
    printGambles(bot, msg, args);
    return;
  }

  switch(args[2]){
    case 'lock':
      lock(bot, msg, args);
    break;
    case 'reset':
      if(locks.get(args[1]) == true){
        msg.channel.send('that group is locked');
        return;
      }
      var cand = groups.get(args[1]);
      var ada = false;
      var newBalance = balance.get(msg.author.id);
      cand.forEach(function lol(value, key){
        if(value.has(msg.author.id)){
          newBalance.reserved -= value.get(msg.author.id);
          value.delete(msg.author.id);
          cand.set(key, value);
          ada = true;
        }
      });
      if(!ada){
        msg.channel.send('you are not gambling in this group!');
        return;
      }
      balance.set(msg.author.id, newBalance);
      groups.set(args[1], cand);
      save();
      msg.channel.send('deleted!');
    break;
    case 'cands':
      var cand = groups.get(args[1]);
      var hasil = "candidates for " + args[1] + ':\n';
      cand.forEach(function lol(value, key){
        hasil += key + '\n';
      });
      msg.channel.send(hasil);
    break;
    default:
      if(locks.get(args[1]) == true){
        msg.channel.send('that group is locked');
        return;
      }
      if(args.length != 4){
        printGambles(bot, msg, args);
        return;
      }
      if(isNaN(args[3])){
        printGambles(bot, msg, args);
        return;
      } 
      if(args[3].length > 9){
        msg.channel.send('limit is 1e9');
        return;
      }
      if(parseInt(args[3]) > balance.get(msg.author.id).balance[balance.get(msg.author.id).balance.length - 1] - balance.get(msg.author.id).reserved){
        msg.channel.send('you cannot gamble more than you balance');
        return;
      }
      var cand = groups.get(args[1]);
      if(cand.has(args[2]) == false){
        msg.channel.send('candidate not found');
        return;
      }
      var ada = false;
      cand.forEach(function lol(value, key){
        if(value.has(msg.author.id)){
          ada = true;
        }
      });
      if(ada){
        msg.channel.send('you\'ve gambled in this group, use reset to change the amount / candidate you gamble');
        return;
      }
      var tempres = balance.get(msg.author.id);
      tempres.reserved += parseInt(args[3]);  
      balance.set(msg.author.id, tempres);
      cand.set(args[2], cand.get(args[2]).set(msg.author.id, parseInt(args[3])));
      groups.set(args[1], cand);
      save();
      msg.channel.send('thank you for gambling :DDD');
  }
}

function help(bot, msg){
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  msg.channel.send({files: [vieri], embed: {
    color: 16764006,
    author: {
      name: 'Tests',
      icon_url: "attachment://viericorp.png"
    },
    title: 'help center',
    fields: [
      {
        name: 'group name',
        value: 'the category you are voting for (e.g. duel-5)'
      },
      {
        name: 'candidate name',
        value: 'the candidate you are voting for (e.g. rama)'
      },
      {
        name: 'balance',
        value: 'your balance'
      },
      {
        name: 'reserved balance',
        value: 'the amount you have gambled and the winner is not yet announced'
      },
      {
        name: '^gamble <group-name> <candidate-name> <amount>',
        value: 'gamble in <group-name> for <candidate-name> at <amount>'
      },
      {
        name: '^gamble <group-name> reset',
        value: 'reset your gambles for <group-name>'
      },
      {
        name: '^gamble bal',
        value: 'show your balance'
      },
      {
        name: '^gamble reserved',
        value: 'show your reserved amount'
      },
      {
        name: '^gamble <category-name>',
        value: 'list all the people gambling for <category-name>'
      },
      {
        name: '^gamble <category-name> cands',
        value: 'show candidates for <category-name>'
      },
      {
        name: '^gamble list',
        value: 'list all categories'
      }
    ],
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  });
}

function printList(bot, msg, args){
  var hasil = "available categories:\n";
  groups.forEach(function lol(value, key){
    hasil += key + '\n';
  });
  msg.channel.send(hasil);
}

module.exports = {
  command: function(bot, msg, args){
    if(balance.has(msg.author.id) == false){
      var temp = {
        time: [0],
        balance: [1500],
        bc: 0,
        reserved: 0,
        tot: 0
      }
      balance.set(msg.author.id, temp);
    }
    switch(args[1]){
      case 'help':
        help(bot, msg);
      break;
      case 'list':
        printList(bot, msg, args);
      break;
      case 'new':
        newGroup(bot, msg, args);
      break;
      case 'finish':
        finish(bot, msg, args);
      break;
      case 'reserved':
        msg.channel.send(balance.get(msg.author.id).reserved);
      break;
      case 'bal':
        msg.channel.send(balance.get(msg.author.id).balance[balance.get(msg.author.id).balance.length - 1]);
      break;
      default:
        check(bot, msg, args);
    }
  }
}