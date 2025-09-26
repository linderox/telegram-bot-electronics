from bot.answers import Media
from bot.database.models.User import User
from bot.database.models.AiChat import AiChat, AiMessage
from bot.enums import AiChatRoleEnum

class AiChatRepo:
    async def get_or_create_chat(user: User) -> AiChat: 
        chat = user.ai_chat
        if not chat:
            chat = await AiChat.create(user=user)
            await user.fetch_related("ai_chat")

        return chat

    async def create_message(user: User, role: AiChatRoleEnum, text: str, media: Media | None = None, reply_to: int | None = None) -> AiMessage:
        message = await AiMessage.create(ai_chat=user.ai_chat, role=role, text=text, reply_to=reply_to, media=media.to_dict() if media else media)
        return message