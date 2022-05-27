const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
  channelId: { type: String, index: true },
  userId: String,
  data: {
    username: String,
    lastMatchId: String,
  },
});

monitorSchema.index({ channelId: 1, 'data.username': 1 });

const Monitor = mongoose.model('Monitor', monitorSchema);

module.exports = { Monitor };
