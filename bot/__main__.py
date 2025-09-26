import os
import sys
import asyncio
from loguru import logger
from bot.config import config

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


if __name__ == "__main__":
    client = os.environ["APP_CLIENT"]
    logger.add(
        f"logs/{client}.log",
        level="DEBUG",
        format="{time} | {level} | {function}:{line} | {message}",
        rotation="1 MB",
        compression="zip",
    )
    logger.add("logs/errors.log", level="ERROR", rotation="1 MB", compression="zip")

    if client == "bot":
        from .run_bot import run_bot
        run_bot()
    elif client == "server":
        from bot.server.main import run_server
        run_server()
