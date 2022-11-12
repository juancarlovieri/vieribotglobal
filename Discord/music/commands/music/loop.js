const { logger } = require('../../../logger');

const { QueueRepeatMode } = require('olebeh-music-player');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'loop',
  description: "enable or disable looping of song's or the whole queue",
  voiceChannel: true,
  options: [
    {
      name: 'action',
      description: 'what action you want to preform on the loop',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Queue', value: 'enable_loop_queue' },
        { name: 'Disable', value: 'disable_loop' },
        { name: 'Song', value: 'enable_loop_song' },
      ],
    },
  ],
  async execute({ inter }) {
    try {
      await inter.deferReply();
      const queue = player.getQueue(inter.guildId);

      if (!queue || !queue.current)
        return inter.editReply({
          content: `No music currently playing ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });
      switch (inter.options._hoistedOptions.map((x) => x.value).toString()) {
        case 'enable_loop_queue': {
          if (queue.repeatMode === 1)
            return inter.editReply({
              content: `You must first disable the current music in the loop mode (/loop Disable) ${inter.member}... try again ? ❌`,
              ephemeral: true,
            });

          const success = queue.loop(QueueRepeatMode.Queue);

          return inter.editReply({
            content: success
              ? `Repeat mode **enabled** the whole queue will be repeated endlessly 🔁`
              : `Something went wrong ${inter.member}... try again ? ❌`,
          });
          break;
        }
        case 'disable_loop': {
          const success = queue.loop(QueueRepeatMode.Off);

          return inter.editReply({
            content: success
              ? `Repeat mode **disabled**`
              : `Something went wrong ${inter.member}... try again ? ❌`,
          });
          break;
        }
        case 'enable_loop_song': {
          if (queue.repeatMode === 2)
            return inter.editReply({
              content: `You must first disable the current music in the loop mode (/loop Disable) ${inter.member}... try again ? ❌`,
              ephemeral: true,
            });

          const success = queue.loop(QueueRepeatMode.Track);

          return inter.editReply({
            content: success
              ? `Repeat mode **enabled** the current song will be repeated endlessly (you can end the loop with /loop disable)`
              : `Something went wrong ${inter.member}... try again ? ❌`,
          });
          break;
        }
      }
    } catch (error) {
      logger.error(`Loop error: ${error.message}`, { error });
    }
  },
};
