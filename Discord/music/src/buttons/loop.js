const { logger } = require('../../../logger');

const { QueueRepeatMode } = require('olebeh-music-player');
module.exports = async ({ inter, queue }) => {
  try {
    await inter.deferReply();
    const methods = ['disabled', 'track', 'queue'];

    if (!queue || !queue.current)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const repeatMode = queue.repeatMode;

    if (repeatMode === 0) queue.loop(QueueRepeatMode.Track);

    if (repeatMode === 1) queue.loop(QueueRepeatMode.Queue);

    if (repeatMode === 2) queue.loop(QueueRepeatMode.Off);

    return inter.editReply({
      content: `loop made has been set to **${methods[queue.repeatMode]}**.✅`,
    });
  } catch (error) {
    logger.error(`Loop error.`, { error });
  }
};
