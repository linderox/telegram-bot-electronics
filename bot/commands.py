from aiogram import types
from bot.loader import bot


async def set_my_commands() -> None:
    commands = [
        ("/start", "🔄 Перезагрузить бота"),
    ]
    await bot.set_my_commands([types.BotCommand(command=command[0], description=command[1]) for command in commands])
