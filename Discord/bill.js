var bills = new Map();
const Discord = require('discord.js');

function newBill(bot, msg){
  if(bills.has(msg.author.id)){
    msg.channel.send('You have an existing bill');
    return;
  }
  var cloned = Object.assign({}, {orders: [],grandTot: 0});
  bills.set(msg.author.id, cloned);
  msg.channel.send('Successfully created a new bill');
}

async function print(embed, vieri, msg){
  // msg.channel.send({files: [vieri], embeds: [embed]});
  for(var i = 0; i < embed.length; ++i){
    await msg.channel.send({files: [vieri], embeds: [embed][i]});
  }
}

function closeBill(bot, msg, args){
  if(bills.has(msg.author.id) == false){
    msg.channel.send('you have no existing bill');
    return;
  }
  if(args.length != 3){
    msg.channel.send('please specify the grand total');
    return;
  }
  if(isNaN(args[2])){
    msg.channel.send('please specify the grand total');
    return;
  }
  var grandtot = parseFloat(args[2]);
  // console.log(bills.get(msg.author.id));
  var bill = bills.get(msg.author.id);
  var res = new Map();
  var orders = bill.orders;
  var subtot = 0;
  for(var i = 0; i < orders.length; ++i){
    if(orders[i].all)continue;
    var people = orders[i].people;
    for(var j = 0; j < people.length; ++j){
      if(res.has(people[j]))continue;
      res.set(people[j], 0);
    }
    subtot += orders[i].amnt;
    var amnt = orders[i].amnt / people.length;
    for(var j = 0; j < people.length; ++j){
      res.set(people[j], res.get(people[j]) + amnt);
    }
  }

  var participants = [];
  res.forEach((value, key) => {
    participants[participants.length] = key;
  });

  for(var i = 0; i < orders.length; ++i){
    if(!orders[i].all)continue;
    var people = participants;
    subtot += orders[i].amnt;
    var amnt = orders[i].amnt / people.length;
    for(var j = 0; j < people.length; ++j){
      res.set(people[j], res.get(people[j]) + amnt);
    }
  }
  var rate = grandtot / subtot;
  var realtot = 0;
  var taxtot = 0;
  // console.log('tax ' + taxtot);
  res.forEach((value, key) => {
    // console.log(value);
    res.set(key, {grandTot: parseFloat(value) * (rate), subTot: value, tax: parseFloat(value) * (rate - 1)});
    realtot += parseFloat(res.get(key).grandTot);
    taxtot += res.get(key).tax;
    // console.log(res.get(key));
  });
  // msg.channel.send(realtot);
  var sign = '+';
  if(realtot  < (subtot + taxtot))sign = '';
  var error = (realtot - (grandtot));
  console.log(realtot);
  var vieri = new Discord.MessageAttachment('../viericorp.png');
  var embed = [];
  embed[0] = {
    color: 16764006,
    author: {
      name: "Summary",
      icon_url: "attachment://viericorp.png"
    },
    title: 'Summary of your bill',
    fields: [
      {
        name: "Grand Total",
        value: realtot
      },
      {
        name: "Subtotal",
        value: subtot
      },
      {
        name: "Total tax",
        value: taxtot
      },
      {
        name: "Tax rate",
        value: (rate - 1) * 100
      },
      {
        name: "Margin of error",
        value: error
      }
    ],
    timestamp: new Date(),
    footer: {
      text: "By Vieri Corp.™ All Rights Reserved"
    }
  }
  // msg.channel.send({files: [vieri], embeds: [embed]});

  res.forEach((value, key) =>{
    var temp = {
      color: 1752220,
      author: {
        name: key,
        icon_url: "attachment://viericorp.png"
      },
      title: 'Summary for ' + key,
      fields: [
        {
          name: "Grand Total",
          value: value.grandTot
        },
        {
          name: "Subtotal",
          value: value.subTot
        },
        {
          name: 'Total tax',
          value: value.tax
        }
      ],
      timestamp: new Date(),
      footer: {
        text: "By Vieri Corp.™ All Rights Reserved"
      }
    };
    embed[embed.length] = temp;
  });
  print(embed, vieri, msg);
  bill = 0;
  bills.delete(msg.author.id);

}

module.exports = {
  cmd: function(bot, msg){
    var args = msg.content.split(' ');
    switch (args[1]){
      case 'create':
        newBill(bot, msg);
      break;
      case 'close':
        closeBill(bot, msg, args);
      break;
    }
  },
  isBill: function(bot, msg){
    if(bills.has(msg.author.id) == false)return;
    var line = msg.content.split('\n');
    var num = 0;
    for(var i = 0; i < line.length; ++i){
      console.log(i);
      var args = line[i].split(' ');
      var bill = bills.get(msg.author.id);
      if(args.length > 2){
        if(isNaN(args[1]))continue;
        ++num;
        var people = args.slice(2);
        for(var j = 0; j < people.length; ++j)people[j] = people[j].toLowerCase();
        bill.orders[bill.orders.length] = {
          name: args[0],
          amnt: parseFloat(args[1]),
          people: people,
          all: false
        }
      } else if(args.length == 2){
        if(isNaN(args[1]))continue;
        ++num;
        bill.orders[bill.orders.length] = {
          name: args[0],
          amnt: parseFloat(args[1]),
          people: [],
          all: true
        }
      }
    }
    msg.channel.send('Successfully added ' + num + ' items');
  }
}
