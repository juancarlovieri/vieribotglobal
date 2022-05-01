FROM node:latest

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot/Discord

COPY . /usr/src/bot

CMD ["bash", "run.sh"]