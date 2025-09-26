from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

from bot.answers import answers
from bot.routers.admin.answers.callback_data import back_to_buttons, back_to_phrases
from bot.routers.admin.callback_data import open_admin_menu_cb
from .callback_data import ChooseAnswerCategory, ChooseAnswerForEdit, open_answers_menu_cb
from .enums import Answer


class Markup:
    @staticmethod
    def open_categories() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(
            InlineKeyboardButton(
                text="Текста ✏️", callback_data=ChooseAnswerCategory(category=Answer.PHRASES.value).pack()
            )
        )
        markup.row(
            InlineKeyboardButton(
                text="Кнопки 🕹", callback_data=ChooseAnswerCategory(category=Answer.BUTTONS.value).pack()
            )
        )
        markup.row(InlineKeyboardButton(text="⬅️ Вернуться назад", callback_data=open_admin_menu_cb))

        return markup.as_markup()

    @staticmethod
    def open_answers(category: Answer) -> InlineKeyboardBuilder:
        markup = InlineKeyboardBuilder()

        if category == Answer.BUTTONS.value:
            for key in answers.get_key_buttons():
                markup.row(
                    InlineKeyboardButton(
                        text="— " + answers.get_button(key),
                        callback_data=ChooseAnswerForEdit(category=category, key=key).pack(),
                    )
                )
        else:
            for key in answers.get_key_answers():
                markup.row(
                    InlineKeyboardButton(
                        text="— " + answers.get_text(key),
                        callback_data=ChooseAnswerForEdit(category=category, key=key).pack(),
                    )
                )

        markup.row(InlineKeyboardButton(text="⬅️ Вернуться в админ меню", callback_data=open_answers_menu_cb))
        return markup.as_markup()

    @staticmethod
    def back_to_buttons_reply() -> ReplyKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text="⬅️ Назад в меню кнопок"))
        return markup.as_markup(resize_keyboard=True)

    @staticmethod
    def back_to_buttons_inline() -> ReplyKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text="⬅️ Назад в меню кнопок", callback_data=back_to_buttons))
        return markup.as_markup(resize_keyboard=True)

    @staticmethod
    def back_to_phrases_reply() -> ReplyKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text="⬅️ Назад в меню сообщений"))
        return markup.as_markup(resize_keyboard=True)

    @staticmethod
    def back_to_phrases_inline() -> ReplyKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text="⬅️ Назад в меню сообщений", callback_data=back_to_phrases))
        return markup.as_markup(resize_keyboard=True)
