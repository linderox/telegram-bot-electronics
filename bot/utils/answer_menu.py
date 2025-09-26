import asyncio 
import aiohttp 
from loguru import logger
from aiogram import types
from bot.answers import Media
from bot.database.models.Menu import Menu
from bot.database.repo.Menu import MenuRepo
from bot.markups import Markup
from bot.loader import bot
from bot.config import config
from bot.utils.format_html import format_html
from bot.answers import BUTTONS
from bot.utils.send_price import send_price_file
from bot.utils.split_message import split_message

async def delete(message: types.Message):
    try:
        if message.text != "/start":
            await message.delete()
    except Exception:
        pass

async def download_file(file_path: str) -> bytes:
    async with aiohttp.ClientSession() as session:
        async with session.get(config.bot.server_url + file_path) as response:
            return await response.read() 


async def answer_menu(event: types.Message | types.CallbackQuery, menu: str | Menu, is_edit: bool = False, reply_markup=None) -> types.Message:
    if isinstance(menu, str):
        menu = await MenuRepo.get_by_key(menu)

    media = menu.formatted_media
    text = format_html(menu.text) if menu.text else menu.text
    splited_texts = split_message(menu.text or '', with_photo=bool(media))

    is_upload = False

    if not media and not text:
        logger.warning(f"У меню: {menu.menu_key} отсутсвует контент для отправки")
        if menu.menu_key.lower() == BUTTONS.PRICE.value.lower():
            await send_price_file(message)
        return

    response = None

    reply_markup = await Markup.reply_markup(menu)

    if isinstance(event, types.Message):
        message = event
    else:
        await event.answer()
        message = event.message

    if not media:
        if is_edit and message.text:
            response = await message.edit_text(text=text, reply_markup=reply_markup)
        else:
            for text in splited_texts:
                response = await message.answer(text, reply_markup=reply_markup)

    elif media.type == "photo":
        if media.file_id:
            photo = media.file_id
        else:
            photo = types.FSInputFile(media.file_path.lstrip('/'), filename='photo.jpg')
            is_upload = True

        if is_edit and isinstance(event, types.CallbackQuery):
            response = await message.edit_media(types.InputMediaPhoto(media=photo, caption=text), reply_markup=reply_markup)
        else:
            await delete(message)
            response = await message.answer_photo(photo, caption=splited_texts[0], reply_markup=reply_markup)
            for text in splited_texts[1:]:
                await message.answer(text, reply_markup=reply_markup)

    elif media.type == "video":
        if media.file_id:
            video = media.file_id
        else:
            video = types.FSInputFile(media.file_path.lstrip('/'), filename='video.mp4')
            is_upload = True

        if is_edit and isinstance(event, types.CallbackQuery):
            response = await message.edit_media(types.InputMediaVideo(media=video, caption=text), reply_markup=reply_markup)
        else:
            await delete(message)
            response = await message.answer_video(video, caption=splited_texts[0], reply_markup=reply_markup)
            for text in splited_texts[1:]:
                await message.answer(text, reply_markup=reply_markup)

    if menu.extra_text:
        for text in menu.extra_text:
            for text in split_message(text, with_photo=False):
                await asyncio.sleep(0.3)
                await message.answer(text, reply_markup=reply_markup)

    if response and is_upload:
        media.file_id = response.photo[-1].file_id if media.type == "photo" else response.video.file_id
        await MenuRepo.update(menu, "media", media.to_dict())

    if menu.menu_key.lower() == BUTTONS.PRICE.value.lower():
        await send_price_file(message)

    return response


async def answer_media(message: types.Message | types.CallbackQuery, media: Media, text: str, reply_markup=None) -> types.Message:
    if media.type == "photo":
        response = await message.answer_photo(media.file_id, caption=text, reply_markup=reply_markup)
    elif media.type == "video":
        response = await message.answer_video(media.file_id, caption=text, reply_markup=reply_markup)
    elif media.type == "video_note":
        response = await message.answer_video_note(media.file_id)
        await asyncio.sleep(0.5)

    return response
