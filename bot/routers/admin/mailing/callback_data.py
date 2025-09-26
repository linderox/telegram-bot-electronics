from aiogram.filters.callback_data import CallbackData
from enum import Enum

admin_mailling_menu_cb = "Рассылка 📬 "
admin_mailing_edit_media = "admin_mailing_edit_media"
admin_mailing_edit_text = "admin_mailing_edit_text"
admin_mailing_send = "admin_mailing_send"

admin_mailing_send_confirm_cb = "admin_mailing_send_confirm_cb"
back_to_admin_editing_menu_cb = "back_to_admin_editing_menu_cb"


class MailingType(str, Enum):
    standart = "Обычная рассылка"
    specific_users = "Конкретным пользователям"
    not_paid = "Не оплатившим"


class MailingCb(CallbackData, prefix="mailing"):
    mailing_type: MailingType
