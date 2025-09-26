import os
from aiogram.utils.web_app import safe_parse_webapp_init_data
from aiohttp.web_response import json_response
from fastapi import Request, HTTPException
from bot.loader import bot
from bot.config import config
from bot.settings import settings


async def get_auth_data(request: Request) -> dict | bool:
    if os.environ["APP_MODE"] == "dev":
        return True
    
    try:
        auth_string = request.headers.get("Authorization", "")
        data = safe_parse_webapp_init_data(token=bot.token, init_data=auth_string)

        admins = config.bot.admins + settings.admins

        if data.user.id not in admins:
            raise HTTPException(401, dict(error="Unathorizied")) 

        return data
    except ValueError:
        raise HTTPException(401, dict(error="Unathorizied"))
