FROM node:latest AS base

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot/Discord

COPY . /usr/src/bot

RUN npm install

FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /usr/src/bot/Discord

COPY --from=base /usr/src/bot /usr/src/bot

CMD ["bot.js"]
