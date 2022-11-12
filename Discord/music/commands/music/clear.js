const { logger } = require('../../../logger');

module.exports = {
  name: 'clear',
  description: 'clear all the music in the queue',
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

      if (!queue.tracks[0])
        return inter.editReply({
          content: `No music in the queue after the current one ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      await queue.clear();

      inter.editReply(`The queue has just been cleared 🗑️`);
    } catch (error) {
      logger.error(`Clear error.`, { error });
    }
  },
};
