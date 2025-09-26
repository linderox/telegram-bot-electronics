import os
from aiogram import F
from loguru import logger
from bot.loader import bot, dispatcher
from bot.filters import ChatTypeFilter
from bot.database.connection import init_connection, close_connection
from bot.database.redis_store import redis_store
from bot.filters.IsBanned import IsBannedFilter
from bot.seed_data import seed_data
from bot.services.userbot import userbot_client
from bot.tasks import init_tasks
from .commands import set_my_commands
from . import routers, middlewares


@dispatcher.startup()
async def on_startup():
    await init_connection()
    me = await bot.get_me()
    await redis_store.connect()
    await set_my_commands()
    await seed_data()
    await userbot_client.start()
    init_tasks()
    logger.success(f"Бот @{me.username} запущен в режиме {os.environ.get('APP_MODE')}")


@dispatcher.shutdown()
async def on_shutdown():
    await userbot_client.stop()
    await redis_store.disconnect()
    await close_connection()


def import_routers():
    import bot.routers.user.start.handlers
    import bot.routers.user.menu.handlers
    import bot.routers.user.operator.handlers

    import bot.routers.admin.open_menu
    import bot.routers.admin.moderators.handlers
    import bot.routers.admin.answers.edit_answers
    import bot.routers.admin.mailing.handlers

    from bot.routers.user.start.handlers import start

    dispatcher.message.register(start, F.text == '/start')


def run_bot():
    # Инициализация middlewares
    middlewares.setup(dispatcher)

    # Инициализация глобалных filters
    dispatcher.message.filter(ChatTypeFilter("private"))
    dispatcher.callback_query.filter(IsBannedFilter())
    dispatcher.message.filter(IsBannedFilter())

    # Подключение маршрутов
    import_routers()
    dispatcher.include_router(routers.root_handlers_router)

    used_update_types = dispatcher.resolve_used_update_types()
    dispatcher.run_polling(bot, allowed_updates=used_update_types, skip_updates=False)