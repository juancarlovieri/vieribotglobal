const axios = require('axios');
const Agent = require('agentkeepalive');

const httpAgent = new Agent({
  maxSockets: 256,
  maxFreeSockets: 256,
  timeout: 70000,
  freeSocketTimeout: 15000,
});
const httpsAgent = new Agent.HttpsAgent({
  maxSockets: 256,
  maxFreeSockets: 256,
  timeout: 70000,
  freeSocketTimeout: 15000,
});

const { logger } = require('../logger');

const mcClient = axios.create({
  baseURL: 'https://api.mcsrvstat.us/2/',
  timeout: 15000,
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
