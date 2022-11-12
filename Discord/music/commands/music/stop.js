const { logger } = require('../../../logger');

module.exports = {
  name: 'stop',
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

      queue.destroy();

      inter.editReply({
        content: `Music stopped intero this server, see you next time ✅`,
      });
    } catch (error) {
      logger.error(`Stop error.`, { error });
    }
  },
};
