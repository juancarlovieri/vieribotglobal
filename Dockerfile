FROM node:latest

# Create the bot's directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot/Discord

# COPY Discord/package.json /usr/src/bot/Discord
# COPY Discord/auth.json /usr/src/bot/Discord
# RUN cp ./Discord/package.json /usr/src/bot/Discord
# RUN cp ./viericorp.png /usr/src/bot/Discord
# RUN npm install
RUN ls > /usr/src/bot/lis

# COPY . /usr/src/bot/
# RUN cp -r . /usr/src/bot/

# Start the bot.
CMD ["bash", "run.sh"]