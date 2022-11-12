const { logger } = require('../../../logger');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'All the commands this bot has!',
  showHelp: false,

  async execute({ client, inter }) {
    try {
      await inter.deferReply();
      const commands = client.commands.filter((x) => x.showHelp !== false);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setAuthor({
          name: client.user.username,
          iconURL: client.user.displayAvatarURL({ size: 1024, dynamic: true }),
        })
        .setDescription('Developed by Vieri Corp.')
        .addFields([
          {
            name: `Enabled - ${commands.size}`,
            value: commands.map((x) => `\`${x.name}\``).join(' | '),
          },
        ])
        .setTimestamp()
        .setFooter({
          text: 'Developed by Vieri Corp.',
          iconURL: inter.member.avatarURL({ dynamic: true }),
        });

      inter.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Help error.`, { error });
    }
  },
};
