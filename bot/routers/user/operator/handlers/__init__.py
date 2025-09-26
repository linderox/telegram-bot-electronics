from loguru import logger
from aiogram import types, F
from bot.routers.user import router
from bot.services.userbot import userbot_client
from bot.settings import settings
from datetime import datetime, timezone, timedelta

@router.message(F.document)
async def document_handler(message: types.Message):
    if message.from_user.id == (await userbot_client.get_me()).id:
        logger.info("Юзербот отправил документ: прайс-лист")
        price_file = settings.get_price_file()
        price_file.file_id = message.document.file_id
        price_file.updated_at = datetime.now().isoformat()
        settings.set_price_file(price_file)

        logger.success("Прайс-лист обновлен")
        await message.reply("<b>✅ Прайс-лист обновлен</b>")
        
        