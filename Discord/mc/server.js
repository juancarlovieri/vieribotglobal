const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  channelId: String,
  ip: String,
});

serverSchema.index({ channelId: 1}, { unique: true });

const Server = mongoose.model('Server', serverSchema);

module.exports = { Server };
