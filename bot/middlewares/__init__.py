from aiogram import Dispatcher
from bot.middlewares.LogAction import LogActionMiddleware
from bot.middlewares.Register import RegisterMiddleware


def setup(dispatcher: Dispatcher):
    # Логирование действий
    log_middleware = LogActionMiddleware()
    dispatcher.message.outer_middleware.register(log_middleware)
    dispatcher.callback_query.outer_middleware.register(log_middleware)

    # Создание пользователя в базе данных
    register_user_middleware = RegisterMiddleware()
    dispatcher.message.outer_middleware.register(register_user_middleware)
    dispatcher.callback_query.outer_middleware.register(register_user_middleware)
