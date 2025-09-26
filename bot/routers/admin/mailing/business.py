import asyncio
import typing
from aiogram import types, exceptions
from loguru import logger
from bot.loader import bot

from .models import Post


async def reply_post(message: types.Message, post: Post, reply_markup=None) -> None:
    if post.media:
        method = getattr(message, f"answer_{post.media.file_type}")
        await method(post.media.file_id, caption=post.text, reply_markup=reply_markup)
    elif post.text:
        await message.answer(post.text, reply_markup=reply_markup)


async def send_post(chat_id: int, post: Post, reply_markup=None) -> None:
    if post.media:
        method = getattr(bot, f"send_{post.media.file_type}")
        await method(chat_id, post.media.file_id, caption=post.text, reply_markup=reply_markup)
    elif post.text:
        await bot.send_message(chat_id, post.text, reply_markup=reply_markup)


async def start_mailing(post: Post, started_telegram_id: int, users: typing.List):
    sended_count = 0
    for user in users:
        try:
            if user == started_telegram_id:
                continue

            await send_post(user, post)
            sended_count += 1
        except exceptions.TelegramForbiddenError:
            # Пользователь забанил бота
            pass
        except Exception as ex:
            logger.error(f"[MAILING_ERROR] USER_ID: {user} | {ex}")

        await asyncio.sleep(1 / 25)

    post.text = f"<b>✅ Рассылка завершена</b>\n<b>👤 Кол-во получателей:</b> <b>{sended_count}</b>\n\n" + post.text
    await send_post(started_telegram_id, post)
