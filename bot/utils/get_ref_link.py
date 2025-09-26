import typing
from aiogram import types


async def get_ref_link(event: typing.Union[types.CallbackQuery, types.Message]) -> str:
    me = await event.bot.me()
    user_id = event.from_user.id
    return f"https://t.me/{me.username}?start={user_id}"
