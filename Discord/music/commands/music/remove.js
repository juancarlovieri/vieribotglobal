const { logger } = require('../../../logger');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'remove',
  description: 'remove a song from the queue',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the name/url of the track you want to remove',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'number',
      description: 'the place in the queue the song is in',
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const number = inter.options.getNumber('number');
      const track = inter.options.getString('song');

      const queue = player.getQueue(inter.guildId);

      if (!queue || !queue.current)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });
      if (!track && !number)
        inter.editReply({
          content: `You have to use one of the options to remove a song ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      if (track) {
        for (let song of queue.tracks) {
          if (song.title === track || song.url === track) {
            queue.remove(song);
            return inter.editReply({
              content: `removed ${track} from the queue ✅`,
            });
          }
        }

        return inter.editReply({
          content: `could not find ${track} ${inter.member}... try using the url or the full name of the song ? ❌`,
          ephemeral: true,
        });
      }

      if (number) {
        const index = number - 1;
        const trackname = queue.tracks[index].title;

        if (!trackname)
          return inter.editReply({
            content: `This track dose not seem to exist ${inter.member}...  try again ?❌`,
            ephemeral: true,
          });

        queue.remove(index);

        return inter.editReply({
          content: `removed ${trackname} from the queue ✅`,
        });
      }
    } catch (error) {
      logger.error(`Remove error: ${error.message}`, { error });
    }
  },
};
