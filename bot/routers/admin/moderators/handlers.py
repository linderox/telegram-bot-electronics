from aiogram import types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.routers.admin import admin_router
from bot.settings import settings
from bot.database.repo.User import UserRepo
from .callback_data import open_edit_admin_menus, add_admin, remove_admin
from bot.routers.admin.Markup import Markup

class AdminStates(StatesGroup):
    add = State()
    remove = State()

@admin_router.callback_query(F.data == open_edit_admin_menus)
async def open_edit_admin_menus(cb: types.CallbackQuery, state: FSMContext):
    await state.set_state(None)
    moderators = [await UserRepo.get_by_telegram_id(admin_id) for admin_id in settings.admins]

    if moderators:
        moderators_template = "\n".join([f"{num}. {moderator.entity_representation} - {moderator.full_name} | <code>{moderator.telegram_id}</code>" for num, moderator in enumerate(moderators, start=1)])
    else:
        moderators_template = "<i>👁 Модераторы еще не добавлены</i>"

    await cb.message.edit_text(f"Список текущих модераторов:\n{moderators_template}", reply_markup=Markup.moderators_manager())

@admin_router.callback_query(F.data == add_admin)
async def start_add_admin(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.edit_text(
        "Введите Telegram ID пользователя, которого хотите добавить в модераторы:",
        reply_markup=Markup.back_to_moderators_manager()
    )
    await state.set_state(AdminStates.add)

@admin_router.message(AdminStates.add)
async def process_add_admin(message: types.Message, state: FSMContext):
    try:
        telegram_id = int(message.text)
        user = await UserRepo.get_by_telegram_id(telegram_id)
        
        if not user:
            await message.answer("❌ Пользователь не найден в базе данных", reply_markup=Markup.back_to_moderators_manager())
            return
            
        if settings.add_admin(telegram_id):
            await message.answer(f"✅ Пользователь {user.full_name} успешно добавлен в модераторы", reply_markup=Markup.back_to_moderators_manager())
        else:
            await message.answer("❌ Этот пользователь уже является модератором", reply_markup=Markup.back_to_moderators_manager())
            
    except ValueError:
        await message.answer("❌ Неверный формат Telegram ID. Введите числовое значение", reply_markup=Markup.back_to_moderators_manager())

@admin_router.callback_query(F.data == remove_admin)
async def start_remove_admin(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.edit_text(
        "Введите Telegram ID модератора, которого хотите удалить:",
        reply_markup=Markup.back_to_moderators_manager()
    )
    await state.set_state(AdminStates.remove)

@admin_router.message(AdminStates.remove)
async def process_remove_admin(message: types.Message, state: FSMContext):
    try:
        telegram_id = int(message.text)
        user = await UserRepo.get_by_telegram_id(telegram_id)
        
        if not user:
            await message.answer("❌ Пользователь не найден в базе данных", reply_markup=Markup.back_to_moderators_manager())
            return
            
        if settings.remove_admin(telegram_id):
            await message.answer(f"✅ Пользователь {user.full_name} успешно удален из модераторов", reply_markup=Markup.back_to_moderators_manager())
        else:
            await message.answer("❌ Этот пользователь не является модератором", reply_markup=Markup.back_to_moderators_manager())
            
    except ValueError:
        await message.answer("❌ Неверный формат Telegram ID. Введите числовое значение", reply_markup=Markup.back_to_moderators_manager())