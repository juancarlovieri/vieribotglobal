const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
  channelId: String,
  ip: String,
});

monitorSchema.index({ channelId: 1, ip: 1 }, { unique: true });

const Server = mongoose.model('Server', monitorSchema);

module.exports = { Server };
