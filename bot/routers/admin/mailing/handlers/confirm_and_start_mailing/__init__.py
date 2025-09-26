import asyncio
from aiogram import types, F
from aiogram.fsm.context import FSMContext

from bot.routers.admin import admin_router
from bot.routers.admin.mailing.callback_data import (
    admin_mailing_send,
    admin_mailing_send_confirm_cb,
    MailingCb,
    MailingType,
)

from bot.utils.is_number import is_number
from bot.database.repo.User import UserRepo
from ...Markup import Markup
from ...models import Post
from ...business import start_mailing
from ...State import MailingState

from bot.markups import Markup as BotMarkup
from bot.routers.admin.Markup import Markup as AdminMarkup


def get_confirm_message(mailing_type: MailingType, investment_type=None) -> str:
    template = f"""
Вы подтверждаете рассылку поста ?
Режим: <b>{mailing_type.value}</b>"""

    if investment_type:
        template += f"\nРод деятельности: <b>{investment_type}</b>"

    return template


@admin_router.callback_query(F.data == admin_mailing_send)
async def confirm_handler(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.edit_reply_markup(reply_markup=None)
    await cb.message.answer("Выберите тип отправки: ", reply_markup=Markup.choose_type())


@admin_router.message(MailingState.choose_users, F.text == "Вернуться назад ⬅️")
@admin_router.message(MailingState.investment_type, F.text == "Вернуться назад ⬅️")
async def back_to_confirm_handler(message: types.Message, state: FSMContext):
    await state.set_state(MailingState.add)
    await message.answer("Вернулись назад", reply_markup=BotMarkup.remove())
    await message.answer("Выберите тип отправки: ", reply_markup=Markup.choose_type())


# Выбор отдельных пользоавателей для отправки
@admin_router.callback_query(MailingCb.filter(F.mailing_type == MailingType.specific_users))
async def choose_specific_users_handler(cb: types.CallbackQuery, callback_data: MailingCb, state: FSMContext):
    await state.update_data(mailing_type=callback_data.mailing_type)
    await state.set_state(MailingState.choose_users)

    await cb.message.delete()
    await cb.message.answer(
        "Пожалуйста, укажите список пользователей, кому отправить сообщение (ID или username)",
        reply_markup=Markup.back_to_editing(),
    )


# Выбор рассылки для остальных пользователей
@admin_router.callback_query(MailingCb.filter())
async def mailing_standart_type_handler(cb: types.CallbackQuery, callback_data: MailingCb, state: FSMContext):
    response = await cb.message.edit_reply_markup(reply_markup=None)
    await cb.message.answer(get_confirm_message(callback_data.mailing_type), reply_markup=Markup.confirm_mailing())

    await state.set_state(MailingState.confirm)
    await state.update_data(admin_mailing_message_id=response.message_id, mailing_type=callback_data.mailing_type)


@admin_router.message(MailingState.choose_users, F.text)
async def choose_users_handler(message: types.Message, state: FSMContext):
    users = message.text.replace("@", "").split("\n")
    founded_users = []
    not_founded_users = []

    for user in users:
        if is_number(user):
            candidate = await UserRepo.get_by_telegram_id(int(user))
        else:
            candidate = await UserRepo.get_by_username(user)

        if candidate:
            founded_users.append((candidate.telegram_id, candidate.full_name))
        else:
            not_founded_users.append(user)

    template = """
✅ <b>Найденные пользователи:</b>
{}
❌ <b>Неизвестные пользователи:</b>
{}
""".format(
        (
            "\n".join([f"{idx + 1}. {user[0]} | {user[1]}" for idx, user in enumerate(founded_users)])
            if founded_users
            else "Отсутствуют"
        ),
        (
            "\n".join([f"{idx + 1}. {user}" for idx, user in enumerate(not_founded_users)])
            if not_founded_users
            else "Отсутствуют"
        ),
    )

    await state.update_data(users=founded_users)
    await state.set_state(MailingState.confirm)

    await message.answer(template, reply_markup=BotMarkup.remove())
    await asyncio.sleep(2)
    await message.answer(get_confirm_message(MailingType.specific_users), reply_markup=Markup.confirm_mailing())


@admin_router.callback_query(F.data == admin_mailing_send_confirm_cb)
async def mailing_post(cb: types.CallbackQuery, state: FSMContext):
    # Начало рассылки поста

    data = await state.get_data()
    post: Post = Post.from_json(data["post"])

    if data["mailing_type"] == MailingType.standart:
        users = [user.telegram_id for user in await UserRepo.get_all()]
    elif data["mailing_type"] == MailingType.specific_users:
        users = [user[0] for user in data.get("users", [])]
    elif data["mailing_type"] == MailingType.not_paid:
        users = [user.telegram_id for user in await UserRepo.get_users_without_subscribe()]

    asyncio.create_task(start_mailing(post, cb.from_user.id, users))

    await cb.message.delete()
    await cb.message.answer("Рассылка запущена ✅", reply_markup=BotMarkup.remove())
    await cb.message.answer("👮 Открыли главное меню", reply_markup=AdminMarkup.admin_menu())

    await state.set_state(None)
