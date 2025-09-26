from tortoise import Tortoise
from . import TORTOISE_ORM
from bot.database.models.Dto import dto

async def init_connection():
    await Tortoise.init(TORTOISE_ORM)
    await Tortoise.generate_schemas()
    dto.init_dto()

async def close_connection():
    await Tortoise.close_connections()
