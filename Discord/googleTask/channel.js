const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  channelId: String,
});

channelSchema.index({ channelId: 1 }, { unique: true });

const Channel = mongoose.model('taskChannels', channelSchema);

module.exports = { Channel };
