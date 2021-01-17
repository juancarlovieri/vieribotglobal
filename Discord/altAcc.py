import discord
from discord.ext import commands
import random
import time
import random

token, channelId = input().split(' ')
channelId = int(channelId)

description = '''An example bot to showcase the discord.ext.commands extension
module.
There are a number of utility commands being showcased here.'''
bot = commands.Bot(command_prefix=']', description=description)


@bot.event
async def on_ready():
  print('Logged in as')
  print(bot.user.name)
  print(bot.user.id)
  print('----------')
  while(True):
    channel = bot.get_channel(channelId)
    await channel.send('$minecraft')
    time.sleep(300 + random.random() * 10);

@bot.command()
async def stop(ctx):
  exit()

print(token)
bot.run(token, bot=False)
