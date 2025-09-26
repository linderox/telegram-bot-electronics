from aiogram import types, F
from aiogram.fsm.context import FSMContext
from bot.loader import bot
from bot.routers.admin import admin_router
from bot.routers.admin.Markup import Markup as AdminMarkup
from bot.utils.media_type import get_media_file_id_and_type
from ..callback_data import admin_mailling_menu_cb, back_to_admin_editing_menu_cb
from ..Markup import Markup
from ..State import MailingState
from ..models import Post, Media
from ..business import reply_post
from bot.markups import Markup as BotMarkup


@admin_router.callback_query(F.data == admin_mailling_menu_cb)
async def open_mailing_menu(callback_query: types.CallbackQuery, state: FSMContext):
    await state.set_state(MailingState.add)

    await callback_query.message.delete()

    await callback_query.message.answer(
        "📝 Пожалуйста, отправьте пост, который нужно разослать",
        reply_markup=AdminMarkup.get_back_admin_menu_reply(),
    )


@admin_router.callback_query(MailingState.confirm, F.data == back_to_admin_editing_menu_cb)
async def back_to_editing_cb(cb: types.CallbackQuery, state: FSMContext):
    await state.set_state(MailingState.add)

    await cb.message.delete()
    data = await state.get_data()
    if data.get("admin_mailing_message_id"):
        try:
            await bot.delete_message(cb.from_user.id, data.get("admin_mailing_message_id"))
        except Exception:
            pass

    post: Post = Post.from_json(data["post"])
    await reply_post(cb.message, post, reply_markup=Markup.edit_menu())


@admin_router.message(MailingState.add)
async def add_post_handler(message: types.Message, state: FSMContext):
    if message.text:
        await state.update_data(post=Post(text=message.html_text).to_json())
    else:
        type, file_id = get_media_file_id_and_type(message)
        await state.update_data(
            post=Post(text=message.html_text, media=Media(file_type=type, file_id=file_id)).to_json()
        )

    await message.answer("Пост сохранен, выберите действие: ⬇️", reply_markup=BotMarkup.remove())
    response = await message.copy_to(message.chat.id, reply_markup=Markup.edit_menu())
    await message.delete()
    await state.update_data(post_id=response.message_id)
