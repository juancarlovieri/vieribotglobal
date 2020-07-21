const fs = require("fs");
var obj = JSON.parse(fs.readFileSync("changeHandle.json", "utf8"));

module.exports = {
  deleted: function(msg){
    console.log(msg.author.username + msg.author.discriminator + ' ' + msg.createdTimestamp + ' ' + msg.content);
    var arr = obj.a;
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
