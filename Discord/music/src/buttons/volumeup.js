const { logger } = require('../../../logger');
const maxVol = client.config.opt.maxVol;
module.exports = async ({ inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.playing)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const vol = Math.floor(queue.volume + 5);

    if (vol > maxVol)
      return inter.editReply({
        content: `I can not move the volume up any more ${inter.member}... try again ? ❌`,
        ephemeral: true,
      });

    if (queue.volume === vol)
      return inter.editReply({
        content: `The volume you want to change is already the current one ${inter.member}... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.setVolume(vol);

    return inter.editReply({
      content: success
        ? `The volume has been modified to **${vol}**/**${maxVol}**% 🔊`
        : `Something went wrong ${inter.member}... try again ? ❌`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Volume up error.`, { error });
  }
};
