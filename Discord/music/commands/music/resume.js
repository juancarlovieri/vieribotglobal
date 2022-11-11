const { logger } = require('../../../logger');

module.exports = {
  name: 'resume',
  description: 'play the track',
  voiceChannel: true,

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);

      if (!queue)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      if (!queue.connection.paused)
        return inter.editReply({
          content: `The track is already running, ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      const success = queue.setPaused(false);

      return inter.editReply({
        content: success
          ? `Current music ${queue.current.title} resumed ✅`
          : `Something went wrong ${inter.member}... try again ? ❌`,
      });
    } catch (error) {
      logger.error(`Resume error.`, { error });
    }
  },
};
