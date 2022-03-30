const Discord=  require('discord.js');
var cd = new Map();

module.exports = {
  cmd: function (bot, msg, args) {
    var cur = parseInt(Date.now());
    console.log(cur);
    if (cd.has(msg.author.id) && cd.get(msg.author.id) >= cur) {
      msg.channel.send("AY YO CHILL");
      return;
    }
    if (args.length < 3 || isNaN(args[args.length - 1])) {
      msg.channel.send("what");
      return;
    }
    var cnt = parseInt(args[args.length - 1]);
    if (cnt > 100) {
      msg.channel.send("too much");
      return;
    }
    var res = args[1];
    for (var i = 2; i + 1 < args.length; ++i) {
      res = res.concat(" ", args[i]);
    }
    var penalty = cur + 6000 * cnt;
    cd.set(msg.author.id, penalty);
    for (var i = 0; i < cnt; ++i) {
      msg.channel.send(res);
    }
  }
}