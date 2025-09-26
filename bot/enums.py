from enum import StrEnum

class ButtonTypeEnum(StrEnum):
    PHONE_NUMBER = "PHONE_NUMBER"
    REPLY = "REPLY"
    INLINE = "INLINE"


class MenuTypeEnum(StrEnum):
    AI_CHAT = "AI_CHAT"
    MENU = "MENU"

class AiChatRoleEnum(StrEnum):
    USER = 'USER'
    OPERATOR = "OPERATOR"