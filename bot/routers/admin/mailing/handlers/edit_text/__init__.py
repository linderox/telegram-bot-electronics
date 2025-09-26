from aiogram import types, F
from aiogram.fsm.context import FSMContext
from bot.routers.admin import admin_router

from bot.routers.admin.mailing.callback_data import admin_mailing_edit_text
from ...Markup import Markup
from ...State import MailingState
from ...models import Post
from ...business import reply_post
from bot.markups import Markup as BotMarkup


@admin_router.callback_query(F.data == admin_mailing_edit_text)
async def edit_text_handler(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.delete()
    await cb.message.answer("✏️ Пожалуйста введите новый текст для поста", reply_markup=Markup.back_to_editing())
    await state.set_state(MailingState.edit_text)


@admin_router.message(MailingState.edit_text, F.text)
async def edit_text_scene(message: types.Message, state: FSMContext):
    data = await state.get_data()
    post: Post = Post.from_json(data["post"])
    post.text = message.html_text
    await state.update_data(post=post.to_json())
    await message.answer("Пост обновлен ✅", reply_markup=BotMarkup.remove())
    await reply_post(message, post, reply_markup=Markup.edit_menu())
