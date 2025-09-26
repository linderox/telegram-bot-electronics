import asyncio
from loguru import logger
from aiogram import types, F
from aiogram.fsm.context import FSMContext
from aiogram.filters.command import CommandStart, CommandObject
from bot.routers.user import router
from bot.answers import answers, MENU_KEY
from bot.database.models import User
from bot.utils.answer_menu import answer_menu
from bot.routers.user.start.State import RegistrationState
from bot.database.repo.User import UserRepo
from bot.services.onec import onec_service
from bot.routers.admin.callback_data import open_user_menu_cb

@router.callback_query(F.data == open_user_menu_cb)
async def back_menu(cb: types.CallbackQuery):
    await cb.message.delete()
    await answer_menu(cb.message, MENU_KEY.START.name)

@router.message(CommandStart())
async def start(
    message: types.Message,
    state: FSMContext,
    user: User
):
    await state.set_state(None)

    if user.phone_number:
        await answer_menu(message, MENU_KEY.START.name)
    else:
        await state.set_state(RegistrationState.phone_number)
        await answer_menu(message, MENU_KEY.PHONE.name)


@router.message(RegistrationState.phone_number, (F.text | F.contact))
async def new_phone(message: types.Message, state: FSMContext, user: User):
    phone_number = message.contact.phone_number if message.contact else message.text

    if len("".join(char for char in phone_number if char.isdigit())) < 7:
        await message.answer(answers.get_text(answers.phrases.INCORRECT_PHONE))
        return

    await state.set_state(None)
    user = await UserRepo.update(user, "phone_number", phone_number)
    asyncio.create_task(onec_service.add_user(user.telegram_id, user.full_name, user.username, user.phone_number))
    await answer_menu(message, MENU_KEY.START.name)
