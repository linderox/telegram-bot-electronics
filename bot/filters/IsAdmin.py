from aiogram import types
from aiogram.filters.base import Filter
from bot.config import config
from bot.settings import settings


class IsAdminFilter(Filter):
    async def __call__(self, event: types.TelegramObject):
        admins = config.bot.admins
        is_admin = event.from_user.id in admins
        return is_admin
