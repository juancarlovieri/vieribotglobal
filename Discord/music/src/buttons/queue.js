const { logger } = require('../../../logger');

const { EmbedBuilder } = require('discord.js');
module.exports = async ({ client, inter, queue }) => {
  try {
    await inter.deferReply();
    if (!queue || !queue.playing)
      return inter.editReply({
        content: `No music currently playing... try again ? ❌`,
        ephemeral: true,
      });

    if (!queue.tracks[0])
      return inter.editReply({
        content: `No music in the queue after the current one ${inter.member}... try again ? ❌`,
        ephemeral: true,
      });

    const methods = ['', '🔁', '🔂'];

    const songs = queue.tracks.length;

    const nextSongs =
      songs > 5
        ? `And **${songs - 5}** other song(s)...`
        : `In the playlist **${songs}** song(s)...`;

    const tracks = queue.tracks.map(
      (track, i) =>
        `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${
          track.requestedBy.username
        })`
    );

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setThumbnail(inter.guild.iconURL({ size: 2048, dynamic: true }))
      .setAuthor({
        name: `Server queue - ${inter.guild.name} ${methods[queue.repeatMode]}`,
        iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }),
      })
      .setDescription(
        `Current ${queue.current.title}\n\n${tracks
          .slice(0, 5)
          .join('\n')}\n\n${nextSongs}`
      )
      .setTimestamp()
      .setFooter({
        text: 'Developed by Vieri Corp.',
        iconURL: inter.member.avatarURL({ dynamic: true }),
      });

    inter.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error(`Volume down error.`, { error });
  }
};
