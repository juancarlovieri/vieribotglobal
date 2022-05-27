const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
  channelId: String,
  userId: String,
  username: String,
  lastMatchId: String,
  lastPersonalBest: {
    blitz: Number,
    '40l': Number,
  },
});

monitorSchema.index({ channelId: 1, username: 1 }, { unique: true });

const Monitor = mongoose.model('Monitor', monitorSchema);

module.exports = { Monitor };
