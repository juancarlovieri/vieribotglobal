const fs = require("fs");
var obj = JSON.parse(fs.readFileSync("changeHandle.json", "utf8"));

module.exports = {
  edited: function(msg, bot){
    if(msg.channel.guild.id == '758565620907245599'){
      if(msg.author.id == '724954396147974194'){
        msg.channel.send("***EDITED*** " + msg.content);
        return;
      }
      if(msg.author.bot)return;
      const channel = bot.channels.cache.get('758941261703938058');
      channel.send("***DELETED*** " + msg.channel.name + ' ' + msg.author.username + msg.author.discriminator + ' ' + msg.content);
    }
  },
  deleted: function(msg, bot){
    console.log(msg.author.username + msg.author.discriminator + ' ' + msg.createdTimestamp + ' ' + msg.content);
    var arr = obj.a;
    if(msg.channel.guild.id == '758565620907245599'){
      if(msg.author.id == '724954396147974194'){
        msg.channel.send("***DELETED***" + msg.content);
        return;
      }
      if(msg.author.bot)return;
      const channel = bot.channels.cache.get('758941261703938058');
      channel.send("***DELETED***" + msg.channel.name + ' ' + msg.author.username + msg.author.discriminator + ' ' + msg.content);
    }
    arr[arr.length] = msg.channel.name + ' ' + msg.author.username + msg.author.discriminator + ' ' + msg.createdTimestamp + ' ' + msg.content;
    var temp = {
      a: arr,
      b: "foo"
    };
    obj = temp;
    // console.log(msg.channel.name);
    var jsonContent = JSON.stringify(obj);
    fs.writeFileSync("changeHandle.json", jsonContent, "utf8", function(err) {
      if (err) {
        console.log("An errr occured while writing JSON jsonObj to File.");
        return console.log(err);
      }
      console.log("saved");
    });
  },
  clear: function(){
    obj = {
      a: [],
      b: "foo"
    };
    var jsonContent = JSON.stringify(obj);
    fs.writeFileSync("changeHandle.json", jsonContent, "utf8", function(err) {
      if (err) {
        console.log("An errr occured while writing JSON jsonObj to File.");
        return console.log(err);
      }
      console.log("saved");
    });
  }
}
