from aiogram import types
from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardRemove,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from bot.answers import answers, MENU_KEY
from bot.database.repo.Menu import MenuRepo
from bot.database.models.Menu import Menu
from bot.enums import ButtonTypeEnum

class Markup:
    @staticmethod
    def phone_number() -> InlineKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text=answers.get_button(answers.buttons.PHONE_NUMBER), request_contact=True))
        return markup.as_markup(resize_keyboard=True)
    
    @staticmethod
    async def reply_markup(menu: Menu | MENU_KEY) -> InlineKeyboardMarkup:
        if not isinstance(menu, Menu):
            menu = await MenuRepo.get_by_key(menu)
            
        buttons = sorted(menu.children_buttons, key=lambda b: (b.row, b.column))

        rows = {}
        keyboard = []
    
        for button in buttons:
            if button.row not in rows:
                rows[button.row] = []

            rows[button.row].append(KeyboardButton(text=button.title, request_contact=True if button.type == ButtonTypeEnum.PHONE_NUMBER else False))

        for row in sorted(rows.keys()):
            keyboard.append(rows[row])

        keyboard = ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
        
        return keyboard
    
    @staticmethod
    def remove() -> ReplyKeyboardRemove:
        return ReplyKeyboardRemove()
