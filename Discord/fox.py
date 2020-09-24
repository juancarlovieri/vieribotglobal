import discord
from discord.ext import commands
import random
import time
import random

token = input()
bot = commands.Bot(command_prefix='{')


@bot.event
async def on_ready():
  print('Logged in as')
  print(bot.user.name)
  print(bot.user.id)
  print('----------')
  while(True):
    channel = bot.get_channel(758653619149996064)
    await channel.send('s?fox')
    time.sleep(5 + random.random())

@bot.command()
async def stop(ctx):
  exit()

print(token)
bot.run(token, bot=False)
