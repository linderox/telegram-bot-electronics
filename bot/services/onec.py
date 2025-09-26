from bot.config import config
from loguru import logger
import aiohttp


class OneCService:
    def __init__(self):
        self.token = config.onec.token
        self.url = config.onec.url
        self.username = config.onec.username
        self.password = config.onec.password

        self.auth = aiohttp.BasicAuth(login=self.username, password=self.password)

        self.headers = {
            #"Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def add_user(self, telegram_id: int, full_name: str, username: str, phone_number: str):
        payload = {
            "telegram_id": telegram_id,
            "full_name": ''.join(char for char in full_name if not (0x1F300 <= ord(char) <= 0x1F9FF)) or full_name,
            "username": username,
            "phone_number": phone_number
        }

        async with aiohttp.ClientSession(auth=self.auth) as session:
            try:
                async with session.post(self.url, headers=self.headers, json=payload) as response:
                    if response.status == 200:
                        logger.success("Пользователь успешно добавлен в 1С")
                        return await response.json()
                    else:
                        error_text = await response.text()
                        logger.error(f"1С вернула ошибку: {response.status} - {error_text}")
                        return {"success": False, "error": f"1C Error: {response.status}"}
            except Exception as e:
                logger.error(f"Ошибка при отправке в 1С: {str(e)}")
                return {"success": False, "error": str(e)}

    async def get_user(self, phone_number: str):
        async with aiohttp.ClientSession(auth=self.auth) as session:
            try:
                url = f"{self.url}?phone_number={phone_number}"

                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()

                        if data["manager"] == 'ЛИДЫ СДЭК':
                            data["manager"] = 'Не найден'

                        return data
                    else:
                        error_text = await response.text()
                        logger.error(f"1С вернула ошибку: {response.status} - {error_text}")
                        return {"success": False, "error": f"1C Error: {response.status}", "manager": "Не найден"}
            
            except Exception as e:
                logger.error(f"Ошибка при отправке в 1С: {str(e)}")
                return {"success": False, "error": str(e)}

onec_service = OneCService()
