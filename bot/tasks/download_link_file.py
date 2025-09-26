import asyncio
import aiohttp
import aiofiles
from loguru import logger
from bot.settings import settings
from datetime import datetime, timedelta, time
from bot.services.userbot import userbot_client
from bot.loader import bot

async def download_file():
    price_file = settings.get_price_file()
    link = price_file.file_link
    file_path = price_file.file_path

    logger.info(f"Грузим файл по ссылке: {link}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(link) as response:
                if response.status == 200:
                    async with aiofiles.open(file_path, 'wb') as f:
                        while True:
                            chunk = await response.content.read(1024)
                            if not chunk:
                                break

                            await f.write(chunk)

                    # Обновляем timestamp загрузки в настройках
                    updated_price_file = price_file
                    updated_price_file.updated_at = datetime.now().isoformat()
                    settings.set_price_file(updated_price_file)

                    logger.success(f"[{datetime.now()}] Файл успешно загружен: {file_path}")

                    await userbot_client.send_file((await bot.get_me()).username, file_path)
                else:
                    logger.error(f"[{datetime.now()}] Ошибка загрузки файла. Код статуса: {response.status}")

    except Exception as e:
        logger.error(f"[{datetime.now()}] Произошла ошибка: {str(e)}")


async def download_link_file():
    download_time = time(12, 5)  # Время загрузки 12:05
    logger.info(f"Планировщик запущен. Файл будет загружаться каждый день в {download_time}")

    # Проверяем, загружен ли файл сегодня
    price_file = settings.get_price_file()
    now = datetime.now()
    
    # Из строки ISO формата восстанавливаем дату последнего обновления
    try:
        file_updated_at = datetime.fromisoformat(price_file.updated_at)
        logger.info(f"Последняя загрузка файла: {file_updated_at}")
        
        # Загружаем файл только если:
        # 1. Файл не был загружен сегодня
        # 2. Файл был загружен сегодня, но до запланированного времени, и сейчас уже после этого времени
        if now.date() > file_updated_at.date() or (now.date() == file_updated_at.date() and file_updated_at.time() < download_time and now.time() >= download_time):
            logger.info("Загружаем прайс-лист при старте...")
            await download_file()
    except (ValueError, TypeError) as e:
        # Если дата обновления некорректна, загружаем файл
        logger.error(f"Ошибка при чтении даты обновления: {str(e)}")
        await download_file()

    while True:
        now = datetime.now()  # Обновляем текущее время в каждой итерации
        next_run = datetime.combine(now.date(), download_time)
        
        # Если текущее время больше времени загрузки, переходим на следующий день
        if now.time() >= download_time:
            next_run += timedelta(days=1)
        
        sleep_seconds = (next_run - now).total_seconds()
        logger.info(f"Следующая загрузка прайс-листа через {sleep_seconds // 3600} часов {sleep_seconds % 3600 // 60} минут")
        
        # Ожидаем до следующего запланированного времени загрузки
        await asyncio.sleep(sleep_seconds)
        
        logger.info("Загружаем прайс-лист по расписанию...")
        await download_file()

        
        