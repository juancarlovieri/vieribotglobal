const axios = require('axios');

async function fetchUser(userName) {
  const user = (await axios.get(`https://ch.tetr.io/api/users/${userName}`)).data;
  if (!user.success) {
    return {};
  }
  return user.data.user;
}

async function getRecentMatch(userId) {
  const match = (await axios.get(`https://ch.tetr.io/api/streams/league_userrecent_${userId}`))
    .data;
  if (!match.success) {
    throw new Error('Unable to fetch match.');
  }
  return match.data;
}

async function getLastMatchId(userId) {
  const match = await getRecentMatch(userId);
  // eslint-disable-next-line no-underscore-dangle
  return match.records[0]._id;
}

module.exports = {
  fetchUser,
  getRecentMatch,
  getLastMatchId,
};
