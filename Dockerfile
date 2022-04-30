FROM node:latest

# Create the bot's directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot/Discord

COPY Discord/package.json /usr/src/bot/Discord
RUN npm install

COPY . /usr/src/bot

# Start the bot.
CMD ["node", "bot.js"]