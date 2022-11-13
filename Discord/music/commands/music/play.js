const { logger } = require('../../../logger');

// const { QueryType } = require('discord-player');
const { ApplicationCommandOptionType } = require('discord.js');
module.exports = {
  name: 'play',
  description: 'play a song!',
  voiceChannel: true,
  options: [
    {
      name: 'song',
      description: 'the song you want to play',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async execute({ inter }) {
    try {
      await inter.deferReply();
      const song = inter.options.getString('song');
      const res = await player.search(song, {
        requestedBy: inter.member,
        // searchEngine: QueryType.AUTO ,
      });
      if (!res || !res.tracks.length)
        return inter.editReply({
          content: `No results found ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });

      const queue = await player.createQueue(inter.guild, {
        channel: inter.channel,
        metadata: inter.channel,
        leaveOnEmptyTimeout: 86400000,
        spotifyBridge: client.config.opt.spotifyBridge,
        initialVolume: client.config.opt.defaultvolume,
        leaveOnEnd: client.config.opt.leaveOnEnd,
      });
      try {
        if (!queue.connection) await queue.connect(inter.member.voice.channel);
      } catch {
        await player.deleteQueue(inter.guildId);
        return inter.editReply({
          content: `I can't join the voice channel ${inter.member}... try again ? ❌`,
          ephemeral: true,
        });
      }
      await inter.editReply({
        content: `Loading your ${
          res.playlist ? `playlist of ${res.tracks.length} songs` : 'track'
        }... 🎧`,
      });

      res.playlist
        ? queue.addTracks(res.tracks)
        : queue.addTracks(res.tracks[0]);

      if (!queue.playing) await queue.play();
    } catch (error) {
      logger.error(`Play error: ${error.message}`, { error });
    }
  },
};
