const fs = require('fs');
var tests = JSON.parse(fs.readFileSync("tests.json", "utf8"));

function save(){
  var jsonContent = JSON.stringify(tests);
  fs.writeFileSync("tests.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

function compare(a, b){
  var comparison = 0;
  if (a.time > b.time) {
    comparison = 1;
  } else {
    comparison = -1;
  }
  return comparison;
}

function clear(){
  var arr = tests.a;
  var temp = arr;
  var add = 0;
  for(var i = 0; i <=  arr.length - 1; i++){
    if(arr[i].time < Date.now()){
      console.log('buang');
      temp.splice(i - add, 1);
      console.log(add);
      add++;
    }
  }
  var baru = {
    a: temp
  }
  tests = baru;
  save();
}

async function timer(time, channel, message){
  const msg = message;

  setTimeout(function(){
    var opts = {
      wait: 30000
    }
    channel.send(msg);
  }, time);
}

function remind(l, r, bot){
  var arr = tests.a
  var temp = arr;
  var add = 0;
  const channel = bot.channels.cache.get('736030942748999770');
  console.log(arr);
  for(var i = l; i <= Math.min(r, arr.length - 1); i++){
    console.log(arr[i]);
    setTimeout(function(){
      clear();
      save();
    }, arr[i].time - Date.now() + 100);
    if((arr[i].time - 3600000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 3600000) - Date.now(), channel, name.name + ' in an hour ' + name.mention);
    }
    if((arr[i].time - 7200000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 7200000) - Date.now(), channel, name.name + ' in 2 hours ' + name.mention);
    }
    if((arr[i].time - 21600000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 21600000) - Date.now(), channel, name.name + ' in 6 hours ' + name.mention);
    }
    if((arr[i].time - 43200000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 43200000) - Date.now(), channel, name.name + ' in 12 hours ' + name.mention);
    } 
    if((arr[i].time - 86400000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 86400000) - Date.now(), channel, name.name + ' tomorrow ' + name.mention);
    }
    if((arr[i].time - 172800000) - Date.now() >= 0){
      var name = arr[i];
      timer((arr[i].time - 172800000) - Date.now(), channel, name.name + ' in 2 days ' + name.mention);
    }
  }
  // console.log(temp);
  // var baru = {
  //   a: temp
  // }
  // tests = baru;
  // save();
}

module.exports = {
  run: function(bot){
    remind(0, 1000, bot);
  },
  message: function(bot, msg){
    var args = msg.content.split(' ');
    console.log(msg.content);
    switch(args[1]){
      case 'new':
        if(args.length != 5)return;
        if(isNaN(args[3]))return;
        var arr = tests.a;
        var tempTime = parseInt(args[3]);
        arr[arr.length] = {
          name: args[2],
          time: tempTime,
          mention: args[4]
        };
        var temp = {
          a: arr
        }
        tests = temp;
        save();
        remind(arr.length - 1, arr.length - 1, bot);
      break;
      case 'rm':
        if(msg.author.id != '455184547840262144'){
          return;
        }
        if(args.length != 3)return;
        if(isNaN(args[2]))return;
        var arr = tests.a;
        arr.splice(parseInt(args[2]), 1);
        var temp = {
          a: arr
        }
        tests = temp;
        save();
      break;
      case 'list':
        clear();
        save();
        var arr = tests.a;
        var hasil = "list of tests:\n";
        console.log(arr);
        arr.sort(compare);
        save();
        for(var i = 0; i < arr.length; i++){
          console.log(arr[i]);
          var utcSeconds = Math.round(arr[i].time / 1000) - 3600;
          var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
          d.setUTCSeconds(utcSeconds);
          var arrDate = d.toString().split(' ');
          var res = arrDate[0];
          res += ' ' + arrDate[1];
          res += ' ' + arrDate[2];
          res += ' ' + arrDate[3];
          res += ' ' + arrDate[4];
          hasil += '**' + arr[i].name + '**: ' + res + '\n';
        }
        msg.channel.send(hasil);
      break;
    }
  }
}
