const { logger } = require('../../../logger');

module.exports = {
  name: 'back',
  description: 'Go back the song before',
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

      if (!queue.previousTracks[1])
        return inter.editReply({
          content: `There was no music played before ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      await queue.back();

      inter.editReply({ content: `Playing the **previous** track ✅` });
    } catch (error) {
      logger.error(`Back error.`, { error });
    }
  },
};
