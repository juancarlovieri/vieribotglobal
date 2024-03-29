const { logger } = require('../../../logger');

const { EmbedBuilder } = require('discord.js');
module.exports = async ({ client, inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.current)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    const track = queue.current;

    const methods = ['disabled', 'track', 'queue'];

    const timestamp = queue.getPlayerTimestamp();

    const trackDuration =
      timestamp.progress == 'Infinity' ? 'infinity (live)' : track.duration;

    const progress = queue.createProgressBar();

    const embed = new EmbedBuilder()
      .setAuthor({
        name: track.title,
        iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }),
      })
      .setThumbnail(track.thumbnail)
      .setDescription(
        `Volume **${
          queue.volume
        }**%\nDuration **${trackDuration}**\nProgress ${progress}\nLoop mode **${
          methods[queue.repeatMode]
        }**\nRequested by ${track.requestedBy}`
      )
      .setFooter({
        text: 'Developed by Vieri Corp.',
        iconURL: inter.member.avatarURL({ dynamic: true }),
      })
      .setColor('ff0000')
      .setTimestamp();

    inter.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error(`Now playing error.`, { error });
  }
};
