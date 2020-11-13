const sigmoid = require('sigmoid');

function getRating(usr, contest, uti){
  var def = {
    hiddenRating: 1800,
    publicRating: 1800
  };
      // console.log(usr);
  if(uti.get(usr).rating == null)return def;
  return uti.get(usr).rating;
  // console.log(usr);
  // var request = require('sync-request');
  // var hist = JSON.parse(request('GET', 'https://uriel.tlx.toki.id/api/v2/contest-history/public?username=' + usr).getBody()).data;
  // if(hist.length == 0)return def;
  // var indx = hist.length - 1;
  // for(var i = 0; i < hist.length; i++){
  //   if(hist[i].contestJid == contest){
  //     indx = i - 1;
  //   }
  // }
  // if(indx == -1)return def;
  // if(hist[indx].rating != null){
  //   def = hist[indx].rating;
  // }
  // console.log(def.publicRating);
  // return def;
}

function score(a, b, n){
  // console.log(Math.max(10, (sigmoid(Math.sqrt(b / a)) - 0.7) * Math.log2(n) * 1800));
  return Math.max(10, (sigmoid(Math.sqrt(b / a)) - 0.7) * Math.log2(n) * 1800);
}

module.exports = {
  calc: async function(bot, msg, usr, contest){
    var request = require('sync-request');
    var coba = request('GET', 'https://uriel.tlx.toki.id/api/v2/contest-web/slug/' + contest + '/with-config');
    if(coba.statusCode >= 300){
      msg.channel.send('contest not found');
      return;
    }
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
      if(uid == -1){
        msg.channel.send('handle not present in contest');
        return;
      }
      var sc = JSON.parse(response.body).data.scoreboard.content.entries;
      var ustats = -1
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
      if(ustats == -1){
        msg.channel.send('internal error, contact developer');
        return;
      }
      console.log(n);
      var delta = 0;
      var myHid = getRating(uid, id, uti).hiddenRating;
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
          var oppHid = getRating(sc[i].contestantJid, id, uti).hiddenRating;
          delta += score(myHid, oppHid, n);
        }
        if(sc[i].rank < ustats.rank){
          var oppHid = getRating(sc[i].contestantJid, id, uti).hiddenRating;
          delta -= score(oppHid, myHid, n);
        }
      }
      delta /= n;
      var debt = getRating(uid, id, uti).hiddenRating - getRating(uid, id, uti).publicRating;
      // var newRating = 1800;
      // if(uti.get(uid).rating != null)newRating = uti.get(uid).rating.publicRating;
      var newRating = getRating(uid, id, uti).publicRating;
      // console.log(delta);
      if(delta >= 0){
        newRating += 0.2 * delta;
        debt += 0.8 * delta;
        if(debt > 0){
          newRating += debt;
          debt = 0;
        }
      }
      if(delta < 0){
        debt += delta;
        newRating += 0.5 * debt;
        debt = 0.5 * debt;
      }
      console.log(newRating);
      newRating = Math.floor(newRating);
      msg.channel.send(newRating);
     });
  }
}