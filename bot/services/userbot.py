from telethon import TelegramClient, events, types
from telethon.tl.functions.contacts import ResolveUsernameRequest
from loguru import logger
from bot.config import config

class Userbot:
    def __init__(self, api_id, api_hash, phone_number):
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone_number = phone_number
        self.client = TelegramClient(session="userbot", api_id=self.api_id, api_hash=self.api_hash)

    async def start(self):
        await self.client.start(phone=self.phone_number)
        logger.success("Юзербот запущен")

    async def get_me(self) -> types.InputPeerUser:
        me = await self.client.get_me()
        return me

    async def stop(self):
        await self.client.disconnect()
        logger.success("Юзербот отключен")

    async def send_file(self, chat_id: int, document: str):
        resolved_peer = await self.client(ResolveUsernameRequest(chat_id))
        await self.client.send_file(resolved_peer, file=document)


userbot_client = Userbot(
    api_id=config.userbot.api_id,
    api_hash=config.userbot.api_hash,
    phone_number=config.userbot.phone_number 
)