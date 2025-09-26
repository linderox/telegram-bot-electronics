import asyncio
from .download_link_file import download_link_file
from bot.routers.user.menu.handlers.ai_chat import check_inactive_users

def init_tasks():
    asyncio.create_task(download_link_file())
    asyncio.create_task(check_inactive_users())