const sigmoid = require('sigmoid');

module.exports = {
  calc: function(bot, msg, usr, contest){
    var request = require('sync-request');
    var coba = request('GET', 'https://uriel.tlx.toki.id/api/v2/contest-web/slug/' + contest + '/with-config');
    var id = JSON.parse(coba.getBody()).contest.jid;
    request = require('request');
    request({
      url: 'https://uriel.tlx.toki.id/api/v2/contests/' + id + '/scoreboard',
      method: 'GET',
      encoding: null,
     }, (error, response, body) => {
      // console.log(JSON.parse(response.body).data.scoreboard.content.entries);
      // console.log(JSON.parse(response.body).profilesMap);
      var uti = new Map(Object.entries(JSON.parse(response.body).profilesMap));
      var uid = -1;
      uti.forEach(function lol(value, key){
        if(value.username == usr){
          uid = key;
        }
      });
      var sc = JSON.parse(response.body).data.scoreboard.content.entries;
      var usats = -1
      var n = 0;
      for(var i = 0; i < sc.length; i++){
        if(sc[i].contestantJid == uid){
          ustats = sc[i];
        }
        var counter = 0;
        for(var j = 0; j < sc[i].attemptsList.length; j++){
          counter += sc[i].attemptsList[j];
        }
        if(counter == 0){
          continue;
        }
        ++n;
      }
      var delta = 0;
      for(var i = 0; i < sc.length; i++){
        var counter = 0;
        for(var j = 0; j < sc[i].attemptsList.length; j++){
          counter += sc[i].attemptsList[j];
        }
        if(counter == 0){
          continue;
        }
        if(sc[i].contestantJid == uid)continue;
        if(sc[i].rank > ustats.rank){
          var oppHid = 1800;
          var myHid = 1800;
          if(uti.get(sc[i].contestantJid).rating != null)oppHid = uti.get(sc[i].contestantJid).rating.hiddenRating;
          if(uti.get(uid).rating != null)myHid = uti.get(uid).rating.hiddenRating;
          delta += Math.max(10, (sigmoid(Math.sqrt(oppHid / myHid)) - 0.7) * Math.log2(n) * 1800);
        }
        if(sc[i].rank < ustats.rank){
          var oppHid = 1800;
          var myHid = 1800;
          if(uti.get(sc[i].contestantJid).rating != null)oppHid = uti.get(sc[i].contestantJid).rating.hiddenRating;
          if(uti.get(uid).rating != null)myHid = uti.get(uid).rating.hiddenRating;
          delta -= Math.max(10, (sigmoid(Math.sqrt(myHid / oppHid)) - 0.7) * Math.log2(n) * 1800);
        }
      }
      delta /= n;
      var debt = 0;
      if(uti.get(uid).rating != null){
        debt = uti.get(uid).rating.hiddenRating - uti.get(uid).rating.publicRating;
      }
      var newRating = 1800;
      if(uti.get(uid).rating != null)newRating = uti.get(uid).rating.publicRating;
      if(delta >= 0){
        newRating += 0.2*delta;
        debt += 0.8* delta;
        if(debt > 0){
          newRating += debt;
          debt = 0;
        }
      }
      if(delta < 0){
        debt += delta;
        newRating += 0.5 * debt;
        debt = 0.5* debt;
      }
      newRating = Math.floor(newRating);
      msg.channel.send(newRating);
     });
  }
}