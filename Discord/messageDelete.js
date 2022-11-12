const fs = require('fs');
const changeHandlePath = 'datas/changeHandle.json';
var obj = JSON.parse(fs.readFileSync(changeHandlePath, 'utf8'));

module.exports = {
  edited: function (msg, bot) {
    // if(msg.embeds.length != 0)return;
    if (
      msg.channel.id == '804347785804906496' ||
      msg.channel.guild.id == '758565620907245599' ||
      msg.channel.guild.id == '733473838754693232' ||
      msg.channel.guild.id == '626412169751166996'
    ) {
      // if(msg.content == "")return;
      // var channel = bot.channels.cache.get('804347785804906496');
      var channel = bot.channels.cache.get('758941261703938058');
      if (msg.author.id == '724954396147974194' && msg.content != '') {
        channel.send(msg.content);
        return;
      }
      if (msg.author.bot) return;
      var files = [];
      msg.attachments.forEach((val, key) => {
        files[files.length] = val;
      });
      channel.send({
        content:
          '***EDITED*** #' +
          msg.channel.name +
          ' ' +
          msg.author.username +
          msg.author.discriminator +
          ' ' +
          msg.content +
          ' ' +
          msg.createdTimestamp,
        files: files,
      });
    }
  },
  deleted: function (msg, bot) {
    // msg.channel.send(msg.attachments);
    // if(msg.embeds.length != 0)return;
    var arr = obj.a;
    if (
      msg.channel.id == '804347785804906496' ||
      msg.channel.guild.id == '758565620907245599' ||
      msg.channel.guild.id == '733473838754693232' ||
      msg.channel.guild.id == '626412169751166996'
    ) {
      // if(msg.content == "")return;
      // var channel = bot.channels.cache.get('804347785804906496');
      var channel = bot.channels.cache.get('758941261703938058');
      if (msg.author.id == '724954396147974194') {
        channel.send(msg.content);
        return;
      }
      if (msg.author.bot) return;
      var files = [];
      msg.attachments.forEach((val, key) => {
        files[files.length] = val;
      });
      channel.send({
        content:
          '***DELETED*** #' +
          msg.channel.name +
          ' ' +
          msg.author.username +
          msg.author.discriminator +
          ' ' +
          msg.content +
          ' ' +
          msg.createdTimestamp,
        files: files,
      });
    }
    arr[arr.length] =
      msg.channel.name +
      ' ' +
      msg.author.username +
      msg.author.discriminator +
      ' ' +
      msg.createdTimestamp +
      ' ' +
      msg.content;
    var temp = {
      a: arr,
      b: 'foo',
    };
    obj = temp;
    // console.log(msg.channel.name);
    var jsonContent = JSON.stringify(obj);
    fs.writeFileSync(changeHandlePath, jsonContent, 'utf8', function (err) {
      if (err) {
        console.log('An errr occured while writing JSON jsonObj to File.');
        return console.log(err);
      }
      console.log('saved');
    });
  },
  clear: function () {
    obj = {
      a: [],
      b: 'foo',
    };
    var jsonContent = JSON.stringify(obj);
    fs.writeFileSync(changeHandlePath, jsonContent, 'utf8', function (err) {
      if (err) {
        console.log('An errr occured while writing JSON jsonObj to File.');
        return console.log(err);
      }
      console.log('saved');
    });
  },
};
