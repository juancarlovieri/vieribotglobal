import asyncio
import discord
from discord.ext import commands
import random
import time
import random

token = input()
bot = commands.Bot(command_prefix='{')

@bot.command()
async def stop(ctx):
  exit()

# async def login():
#   await bot.wait_until_ready()
#   await bot.change_presence(status=discord.Status.do_not_disturb)
#   print('ready')
# async def test():
#     channel = bot.get_channel(370935329353367568)
#     await channel.send('hello')

# bot.loop.create_task(login())

@bot.event
async def on_ready():
  print('ready')
  await bot.change_presence(status=discord.Status.online)

bot.run(token, bot = False)

