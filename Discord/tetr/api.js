const axios = require('axios');

const { logger } = require('../logger');

const tetrClient = axios.create({
  baseURL: 'https://ch.tetr.io/api/',
  timeout: 10000,
});

tetrClient.interceptors.response.use(
  (response) => {
    logger.info(`tetrClient ${response.request.path} finished.`);
    return response.data;
  },
  (error) => {
    logger.error(`tetrClient ${error.request.path} failed: ${error.message}`);
    return Promise.reject(error);
  },
);

async function fetchUser(userName) {
  const user = await tetrClient.get(`/users/${userName}`);
  if (!user.success) {
    return {};
  }
  return user.data.user;
}

async function getRecentMatch(userId) {
  const match = await tetrClient.get(`streams/league_userrecent_${userId}`);
  if (!match.success) {
    throw new Error('Unable to fetch match.');
  }
  return match.data;
}

async function getLastMatchId(userId) {
  const match = await getRecentMatch(userId);
  if (!match.records.length) {
    return undefined;
  }
  // eslint-disable-next-line no-underscore-dangle
  return match.records[0]._id;
}

async function getRecords(userId) {
  const records = await tetrClient.get(`users/${userId}/records`);
  if (!records.success) {
    throw new Error(`Unable to fetch records for ${userId}`);
  }
  return records.data.records;
}

module.exports = {
  fetchUser,
  getRecentMatch,
  getLastMatchId,
  getRecords,
};
