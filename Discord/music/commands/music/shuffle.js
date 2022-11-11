const { logger } = require('../../../logger');

module.exports = {
  name: 'shuffle',
  description: 'shuffle the track',
  voiceChannel: true,

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);

      if (!queue || !queue.playing)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      if (!queue.tracks[0])
        return inter.editReply({
          content: `No music in the queue after the current one ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      await queue.shuffle();

      return inter.editReply({
        content: `Queue shuffled **${queue.tracks.length}** song(s) ! ✅`,
      });
    } catch (error) {
      logger.error(`Shuffle error.`, { error });
    }
  },
};
