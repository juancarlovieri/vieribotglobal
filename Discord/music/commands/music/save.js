const { EmbedBuilder } = require('discord.js');
const { logger } = require('../../../logger');

module.exports = {
  name: 'save',
  description: 'save the current track!',
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

      inter.member
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle(`:arrow_forward: ${queue.current.title}`)
              .setURL(queue.current.url)
              .addFields(
                {
                  name: ':hourglass: Duration:',
                  value: `\`${queue.current.duration}\``,
                  inline: true,
                },
                {
                  name: 'Song by:',
                  value: `\`${queue.current.author}\``,
                  inline: true,
                },
                {
                  name: 'Views :eyes:',
                  value: `\`${Number(queue.current.views).toLocaleString()}\``,
                  inline: true,
                },
                { name: 'Song URL:', value: `\`${queue.current.url}\`` }
              )
              .setThumbnail(queue.current.thumbnail)
              .setFooter({
                text: `from the server ${inter.member.guild.name}`,
                iconURL: inter.member.guild.iconURL({ dynamic: false }),
              }),
          ],
        })
        .then(() => {
          return inter.editReply({
            content: `I have sent you the title of the music by private messages ✅`,
            ephemeral: true,
          });
        })
        .catch((error) => {
          console.error(error);
          // return inter.channel.send({ content: `Unable to send you a private message... try again ? ❌`, ephemeral: true });
        });
    } catch (error) {
      logger.error(`Save error.`, { error });
    }
  },
};
