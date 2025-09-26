import typing
from aiogram import types


class TelegramUserEvent(typing.Protocol):
    from_user: types.User
