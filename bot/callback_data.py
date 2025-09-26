from aiogram.filters.callback_data import CallbackData


class ClickMenuCb(CallbackData, prefix="click-menu"):
    menu: str
