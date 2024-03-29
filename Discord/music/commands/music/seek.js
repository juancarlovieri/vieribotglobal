const ms = require('ms');
const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require('discord.js');

const { logger } = require('../../../logger');

module.exports = {
  name: 'seek',
  description: 'skip back or foward in a song',
  voiceChannel: true,
  options: [
    {
      name: 'time',
      description: 'time that you want to skip to',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);

      if (!queue || !queue.current)
        return inter.editReply({
          content: `No music currently playing... try again ? ❌`,
          ephemeral: true,
        });

      const timeToMS = ms(inter.options.getString('time'));

      if (timeToMS >= queue.current.durationMS)
        return inter.editReply({
          content: `The indicated time is higher than the total time of the current song ${inter.member}... try again ? ❌\n*Try for example a valid time like **5s, 10s, 20 seconds, 1m**...*`,
          ephemeral: true,
        });

      await queue.seek(timeToMS);

      inter.editReply({
        content: `Time set on the current song **${ms(timeToMS, {
          long: true,
        })}** ✅`,
      });
    } catch (error) {
      logger.error(`Remove error.`, { error });
    }
  },
};
