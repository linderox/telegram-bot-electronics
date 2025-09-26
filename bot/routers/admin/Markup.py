from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from bot.routers.admin.callback_data import open_user_menu_cb
from bot.config import config
from .answers.callback_data import open_answers_menu_cb
from .mailing.callback_data import admin_mailling_menu_cb
from .moderators.callback_data import open_edit_admin_menus, add_admin, remove_admin
from .callback_data import open_admin_menu_cb
class Markup:
    @staticmethod
    def open_admin_menu(user_id: int) -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(InlineKeyboardButton(text="👑 Открыть панель", web_app=WebAppInfo(url=config.bot.server_url)))

        if user_id in config.bot.admins:
            markup.row(InlineKeyboardButton(text="👮‍♂️ Настроить модераторов", callback_data=open_edit_admin_menus))

        # markup.row(
        #     InlineKeyboardButton(text=open_answers_menu_cb, callback_data=open_answers_menu_cb),
        # )
        # markup.row(
        #     InlineKeyboardButton(text=admin_mailling_menu_cb, callback_data=admin_mailling_menu_cb),
        # )

        markup.row(InlineKeyboardButton(text="« Назад", callback_data=open_user_menu_cb))

        return markup.as_markup()

    @staticmethod
    def moderators_manager() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(InlineKeyboardButton(text="➕ Добавить", callback_data=add_admin))
        markup.row(InlineKeyboardButton(text="➖ Удалить", callback_data=remove_admin))

        markup.row(InlineKeyboardButton(text="« Назад", callback_data=open_admin_menu_cb))

        return markup.as_markup()

    @staticmethod
    def back_to_moderators_manager() -> InlineKeyboardMarkup:
        markup = InlineKeyboardBuilder()

        markup.row(InlineKeyboardButton(text="« Назад", callback_data=open_edit_admin_menus))

        return markup.as_markup()
