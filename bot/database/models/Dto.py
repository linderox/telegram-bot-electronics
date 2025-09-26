from tortoise.contrib.pydantic import pydantic_model_creator
from .Menu import Menu, Button
from .User import User
from .AiChat import AiChat
from .AsisstentInfo import AsisstentInfo

class Dto:
    def __init__(self):
        self.ButtonDTO = None
        self.MenuDTO = None
        self.AiChat = None
        self.UserDTO = None
        self.AsisstentInfoDTO = None

    def init_dto(self):
        self.AiChat = pydantic_model_creator(AiChat)
        self.ButtonDTO = pydantic_model_creator(Button)
        self.MenuDTO = pydantic_model_creator(Menu)
        self.UserDTO = pydantic_model_creator(User)
        self.AsisstentInfoDTO = pydantic_model_creator(AsisstentInfo)

dto = Dto()