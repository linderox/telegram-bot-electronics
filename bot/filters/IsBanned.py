from aiogram import types
from loguru import logger
from aiogram.filters.base import Filter
from bot.database.models.User import User


class IsBannedFilter(Filter):
    async def __call__(self, event: types.TelegramObject, user: User):
        if user.is_banned:
            logger.warning(f"Пользователь заблокирован: {user.telegram_id}")

        return user.is_banned is False
