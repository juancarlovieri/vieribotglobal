const maxVol = client.config.opt.maxVol;
const { ApplicationCommandOptionType } = require('discord.js');
const { logger } = require('../../../logger');

module.exports = {
  name: 'volume',
  description: 'adjust',
  voiceChannel: true,
  options: [
    {
      name: 'volume',
      description: 'the amount volume',
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: maxVol,
    },
  ],

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);

      if (!queue)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });
      const vol = inter.options.getNumber('volume');

      if (queue.volume === vol)
        return inter.editReply({
          content: `The volume you want to change is already the current one ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      const success = queue.setVolume(vol);

      return inter.editReply({
        content: success
          ? `The volume has been modified to **${vol}**/**${maxVol}**% 🔊`
          : `Something went wrong ${inter.member}... try again ? ❌`,
      });
    } catch (error) {
      logger.error(`Remove error.`, { error });
    }
  },
};
