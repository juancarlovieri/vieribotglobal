module.exports = {
  remind: function(bot){
    var request = require('sync-request');
    var list = JSON.parse(request('GET', 'http://codeforces.com/api/contest.list?gym=false').getBody()).result;
    var indx = -1;
    for(var i = 0; i < list.length; i++){
      if(list[i].phase != "BEFORE"){
        indx = i - 1;
        break;
      }
    }
    if(indx == -1){
      bot.sendMessage(-1001265467717, 'internal error, contact developer');
      return;
    }
    if((list[indx].startTimeSeconds - 3600) * 1000 - Date.now() >= 0){
      setTimeout(function(){
        bot.sendMessage(-1001265467717, list[indx].name + ' is about to start in 1 hour!');
      }, (list[indx].startTimeSeconds - 3600) * 1000 - Date.now());
    }
    setTimeout(function(){
      console.log('restarting to reset reminder');
      process.exit(0);
    }, (list[indx].startTimeSeconds + 1) * 1000 - Date.now());
  }
}
