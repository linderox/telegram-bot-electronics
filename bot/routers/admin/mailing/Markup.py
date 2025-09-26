from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from .callback_data import (
    MailingCb,
    MailingType,
    admin_mailing_edit_media,
    admin_mailing_edit_text,
    admin_mailing_send,
    admin_mailing_send_confirm_cb,
    back_to_admin_editing_menu_cb,
)
from ..callback_data import open_admin_menu_cb


class Markup:
    @staticmethod
    def choose_type() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()
        for mailing_type in MailingType:
            markup.row(
                InlineKeyboardButton(text=mailing_type.value, callback_data=MailingCb(mailing_type=mailing_type).pack())
            )
        markup.row(InlineKeyboardButton(text="Назад ⬅️", callback_data=open_admin_menu_cb))
        return markup.as_markup()

    @staticmethod
    def edit_menu() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(
            InlineKeyboardButton(text="Изменить медиа 🖼", callback_data=admin_mailing_edit_media),
            InlineKeyboardButton(text="Изменить текст 📝", callback_data=admin_mailing_edit_text),
        )
        markup.row(InlineKeyboardButton(text="Разослать пост 📬", callback_data=admin_mailing_send))
        markup.row(InlineKeyboardButton(text="Назад ⬅️", callback_data=open_admin_menu_cb))

        return markup.as_markup()

    @staticmethod
    def confirm_mailing() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(
            InlineKeyboardButton(text="Да ✅", callback_data=admin_mailing_send_confirm_cb),
            InlineKeyboardButton(text="Назад ⬅️", callback_data=back_to_admin_editing_menu_cb),
        )

        return markup.as_markup()

    @staticmethod
    def back_to_editing() -> ReplyKeyboardMarkup:
        markup = ReplyKeyboardBuilder()
        markup.row(KeyboardButton(text="Вернуться назад ⬅️"))
        return markup.as_markup(resize_keyboard=True)
