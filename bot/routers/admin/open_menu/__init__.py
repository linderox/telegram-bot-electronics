from aiogram import types, F
from bot.routers.admin import admin_router
from bot.routers.admin.callback_data import open_admin_menu_cb
from ..Markup import Markup


@admin_router.message(F.text == "/admin")
async def open_menu(message: types.Message):
    await message.answer("👮‍♂️ Перешли в админ меню", reply_markup=Markup.open_admin_menu(message.from_user.id))


@admin_router.callback_query(F.data == open_admin_menu_cb)
async def open_admin(cb: types.CallbackQuery):
    await cb.message.edit_text("👮‍♂️ Перешли в админ меню", reply_markup=Markup.open_admin_menu(cb.from_user.id))
