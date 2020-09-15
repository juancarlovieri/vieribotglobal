const fs = require('fs');
var obj = JSON.parse(fs.readFileSync("links.json", "utf8"));
var links = new Map(Object.entries(obj));

function save(){
  var jsonObj = Object.fromEntries(links);
  var jsonContent = JSON.stringify(jsonObj);
  fs.writeFileSync("links.json", jsonContent, "utf8", function(err) {
    if (err) {
      console.log("An errr occured while writing JSON jsonObj to File.");
      return console.log(err);
    }
    console.log("saved");
  });
}

module.exports = {
  run: function(bot, msg){
    var args = msg.content.split(' ');
    switch(args[1]){
      case 'rm':
        if(args.length != 3)return;
        if(links.has(args[2]) == false){
          msg.channel.send('not found');
          return;
        }
        links.delete(args[2]);
        msg.channel.send('deleted!');
        save();
      break;
      case 'set':
        if(msg.author.id != 576022362642841621 && msg.author.id != 455184547840262144)return;
        if(args.length != 4)return;
        links.set(args[2], args[3]);
        save();
        msg.channel.send('saved!');
      break;
      case 'get':
        if(args.length != 3)return;
        // if(links.has(args[2]) == false){
        //   msg.channel.send('not found!');
        //   return;
        // }
        var indx = -1;
        var name = -1;
        links.forEach(function lol(value, key){
          if(key.toLowerCase().indexOf(args[2].toLowerCase()) != -1){
            console.log('found');
            indx = value;
            name = key;
            return;
          }
        });
        if(indx === -1){
          msg.channel.send('not found!');
          return;
        }
        msg.channel.send('link for ' + name + ': <' + indx + '>');
      break;
      case 'list':
        var hasil = "";
        links.forEach(function print(value, key){
          hasil += key + '\n';
        });
        msg.channel.send(hasil);
      break;
    }
  }
}
