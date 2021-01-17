const fs = require('fs');
var arr = [];


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
        arr[arr.length - 1].child = spawn.spawn('python3', ['./yuiBot.py']);
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
      case 'alt':
        console.log(args[2]);
        arr[arr.length] = {
          auth: args[2],
          channelId: args[3]
        }
        // save();
        console.log(arr);
        var spawn = require('child_process');
        arr[arr.length - 1].child = spawn.spawn('python3', ['./altAcc.py']);
        arr[arr.length - 1].child.stdout.on('data', function(data){
          console.log(JSON.parse(data));
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
  },
  fox:function(bot, msg, args){
    var spawn = require('child_process');
    child = spawn.spawn('python3', ['./fox.py']);
    child.stdout.on('data', function(data){
      console.log(data);
    });
    child.on('close', function(code){
      if(code != 0){
        console.log('python crashed');
        console.log(code);
      }
    });
    child.stdin.write(args[1]);
    child.stdin.end();
  }
}
