const { logger } = require('../../../logger');

module.exports = {
  name: 'skip',
  description: 'stop the track',
  voiceChannel: true,

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);
      if (!queue || !queue.current)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      const success = queue.skip();

      return inter.editReply({
        content: success
          ? `Current music ${queue.current.title} skipped ✅`
          : `Something went wrong ${inter.member}... try again ? ❌`,
      });
    } catch (error) {
      logger.error(`Skip error: ${error.message}`, { error });
    }
  },
};
