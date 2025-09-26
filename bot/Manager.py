from aiogram import types
from loguru import logger
from bot.settings import settings
from bot.loader import bot
import io

class Manager:
    @staticmethod
    async def send_excel_to_operator_chat(excel_buffer: io.BytesIO, filename: str, caption: str | None = None):
        try:
            await bot.send_document(chat_id=settings.get_operator_chat_id(), document=types.BufferedInputFile(excel_buffer.getvalue(), filename=filename), caption=caption)
        except Exception as e:
            logger.error(f"Ошибка при отправке Excel-файла в чат: {e}")
