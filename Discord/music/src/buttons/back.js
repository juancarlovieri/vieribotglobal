const { logger } = require('../../../logger');

module.exports = async ({ inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.playing)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    if (!queue.previousTracks[1])
      return inter.editReply({
        content: `There was no music played before ${inter.member}... try again ? ❌`,
        ephemeral: true,
      });

    await queue.back();

    inter.editReply({
      content: `Playing the **previous** track ✅`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Back error.`, { error });
  }
};
