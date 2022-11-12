const { logger } = require('../../../logger');

module.exports = async ({ inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.current)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.setPaused(false);

    if (!success) queue.setPaused(true);

    return inter.editReply({
      content: `${
        success
          ? `Current music ${queue.current.title} paused ✅`
          : `Current music ${queue.current.title} resumed ✅`
      }`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Resume & pause error.`, { error });
  }
};
