from aiogram.filters.callback_data import CallbackData

class ModeratorCallback(CallbackData, prefix="moderator"):
    action: str
    telegram_id: int

open_edit_admin_menus = "open_edit_admin_menus"
add_admin = "add_admin"
remove_admin = "remove_admin"