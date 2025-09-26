from aiogram import types, exceptions
from bot.settings import settings, PriceFile

async def send_price_file(message: types.Message):
    price_file = settings.get_price_file()
    if not price_file:
        return
    
    try:
        if price_file.file_id:
            await message.answer_document(price_file.file_id)
        else:
            response = await message.answer_document(types.input_file.FSInputFile(price_file.file_path, filename="price_list.xlsm"))
            settings.set_price_file(PriceFile(file_path=price_file.file_path, file_id=response.document.file_id, file_link=price_file.file_link))
    except exceptions.TelegramEntityTooLarge as ex:
        await message.answer(
            f"Извините, файл оказался слишком большим, отправляю вам ссылку:\n{price_file.file_link}", disable_web_page_preview=False
        )