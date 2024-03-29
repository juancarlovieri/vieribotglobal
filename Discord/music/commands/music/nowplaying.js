const { logger } = require('../../../logger');

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  description: 'view what is playing!',
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

      const saveButton = new ButtonBuilder()
        .setLabel('Save this track')
        .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
        .setStyle('Danger');

      const volumeup = new ButtonBuilder()
        .setLabel('Volume up')
        .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
        .setStyle('Primary');

      const volumedown = new ButtonBuilder()
        .setLabel('Volume Down')
        .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
        .setStyle('Primary');

      const loop = new ButtonBuilder()
        .setLabel('Loop')
        .setCustomId(JSON.stringify({ ffb: 'loop' }))
        .setStyle('Danger');

      const resumepause = new ButtonBuilder()
        .setLabel('Resume & Pause')
        .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
        .setStyle('Success');

      const row = new ActionRowBuilder().addComponents(
        volumedown,
        saveButton,
        resumepause,
        loop,
        volumeup
      );

      inter.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error(`Now playing error: ${error.message}`, { error });
    }
  },
};
