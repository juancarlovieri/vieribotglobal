const fs = require('fs');
// var arr = JSON.parse(fs.readFileSync("ongoingSpam.json", "utf8")).arr;
var arr = [];

function save(){
  console.log(arr);

  jsonObj = {
    arr: arr
  }
  console.log(jsonObj);
  jsonContent = JSON.stringify(arr);
  fs.writeFileSync("ongoingSpam.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

for(var i = 0; i < arr.length; i++){
  var spawn = require('child_process');
  arr[i].child = spawn.spawnSync('python3', ['spammer.py']);
  arr[i].child.stdout.on('data', function(data){
    console.log(data);
  });
  arr[i].child.on('close', function(code){
    if(code != 0){
      console.log('python crashed');
    }
  });
  arr[i].child.stdin.write(arr[i].auth + ' ' + arr[i].channelId);
  console.log(arr[i].auth + ' ' + arr[i].channelId);
  arr[i].child.stdin.end();
}

module.exports = {
  msg: function(bot, msg, args){
    switch(args[1]){
      case 'new':
        console.log(args[2]);
        arr[arr.length] = {
          auth: args[2],
          channelId: args[3]
        }
        // save();
        console.log(arr);
        var spawn = require('child_process');
        arr[arr.length - 1].child = spawn.spawn('python3', ['./spammer.py']);
        arr[arr.length - 1].child.stdout.on('data', function(data){
          console.log(data);
        });
        arr[arr.length - 1].child.on('close', function(code){
          if(code != 0){
            console.log('python crashed');
            console.log(code);
          }
        });
        arr[arr.length - 1].child.stdin.write(arr[arr.length - 1].auth + ' ' + arr[arr.length - 1].channelId);
        console.log(arr[arr.length - 1].auth + ' ' + arr[arr.length - 1].channelId);
        arr[arr.length - 1].child.stdin.end();
      break;
    }
  }
}
