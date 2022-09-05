const fs = require('fs');
const path = require('path');
const process = require('process');
const { google } = require('googleapis');
const { logger } = require('../logger');

const SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'datas/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'auth.json');
const auth = require('../auth.json');
var service;

async function getRefreshToken() {
  try {
    var content = await fs.readFileSync(TOKEN_PATH);
    var credentials = JSON.parse(content);
    if (credentials.refresh_token) return credentials.refresh_token;
    return null;
  } catch (err) {
    logger.error(`Failed to load token_path`, { err });
    return;
  }
}

async function saveRefreshToken(refresh_token) {
  try {
    await fs.writeFileSync(TOKEN_PATH, JSON.stringify({ refresh_token }));
    logger.info(`Saved new refresh_token.`);
    return { success: true };
  } catch (err) {
    logger.error(`Failed to load token_path`, { err });
    return { success: false };
  }
}

async function startLoadAuth() {
  const { client_secret, client_id, redirect_uris } = auth.googleApi;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const refresh_token = await getRefreshToken();

  if (!refresh_token) return { success: false };

  var newToken = await oAuth2Client.refreshToken(refresh_token);
  newToken = newToken.tokens;
  oAuth2Client.setCredentials(newToken);
  service = google.tasks({ version: 'v1', auth: oAuth2Client });
  return { success: true };
}

async function getTaskLists() {
  const res = await service.tasklists.list({ maxResults: 100 });
  return res.data.items;
}

async function getIncompleteTasks(taskId) {
  const res = await service.tasks.list({
    tasklist: taskId,
    showCompleted: false,
  });
  return res.data.items;
}

module.exports = {
  startLoadAuth,
  getTaskLists,
  getIncompleteTasks,
  saveRefreshToken,
};
