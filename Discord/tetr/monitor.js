const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    channelId: String,
    userId: String,
    data: {
      username: String,
      lastMatchId: String,
    },
  },
);

const Monitor = mongoose.model('Monitor', monitorSchema);

module.exports = { Monitor };
