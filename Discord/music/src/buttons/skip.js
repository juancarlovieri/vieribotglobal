const { logger } = require('../../../logger');
module.exports = async ({ inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.current)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.skip();

    return inter.editReply({
      content: success
        ? `Current music ${queue.current.title} skipped ✅`
        : `Something went wrong ${inter.member}... try again ? ❌`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Skip error.`, { error });
  }
};
