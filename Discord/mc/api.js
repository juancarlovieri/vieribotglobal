const axios = require('axios');
const Agent = require('agentkeepalive');

const httpAgent = new Agent({
  maxSockets: 64,
  maxFreeSockets: 32,
  timeout: 30000,
  freeSocketTimeout: 4000,
});
const httpsAgent = new Agent.HttpsAgent({
  maxSockets: 64,
  maxFreeSockets: 32,
  timeout: 30000,
  freeSocketTimeout: 4000,
});

const { logger } = require('../logger');

const mcClient = axios.create({
  baseURL: 'https://api.mcsrvstat.us/2/',
  timeout: 10000,
  httpAgent,
  httpsAgent,
});

mcClient.interceptors.response.use(
  (response) => {
    logger.info(`mcClient ${response.request.path} finished.`);
    return response.data;
  },
  (error) => {
    logger.error(`mcClient ${error.request.path} failed: ${error.message}`);
    return new Error(`mcClient ${error.request.path} failed.`);
  }
);

async function fetchServer(ip) {
  const server = await mcClient.get(`${ip}`);
  return server
}

module.exports = {
  fetchServer,
};
