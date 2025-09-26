from aiogram import Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.redis import RedisStorage
from bot.utils.Bot import Bot
from bot.config import config

bot = Bot(token=config.bot.token, default=DefaultBotProperties(parse_mode="html", link_preview_is_disabled=True))
dispatcher = Dispatcher(storage=RedisStorage.from_url(f"redis://{config.redis.host}:{config.redis.port}"))
