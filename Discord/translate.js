const translate = require('translate');

async function out(msg, text, target) {
  const translation = await translate(text, target);
  console.log(target);
  msg.channel.send(translation);
}

module.exports = {
  translate: function (msg) {
    var args = msg.content.split(' ');
    if (args.length < 3) return;
    const target = args[1];
    var text = '';
    for (var i = 2; i < args.length; i++) {
      text += args[i] + ' ';
    }
    out(msg, text, target);
  },
};
