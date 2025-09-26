from aiogram import types, F
from aiogram.fsm.context import FSMContext
from bot.routers.admin import admin_router

from bot.routers.admin.mailing.callback_data import admin_mailing_edit_media
from bot.utils.media_type import get_media_file_id_and_type
from ...Markup import Markup
from ...State import MailingState
from ...models import Post, Media
from ...business import reply_post
from bot.markups import Markup as BotMarkup
from bot.utils.media_type import MediaType


@admin_router.callback_query(F.data == admin_mailing_edit_media)
async def edit_media_handler(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.delete()
    await cb.message.answer("🖼 Пожалуйста отправьте новый медиа файл", reply_markup=Markup.back_to_editing())
    await state.set_state(MailingState.edit_media)


@admin_router.message(MailingState.edit_media, F.content_type.in_({*[media.value for media in MediaType]}))
async def edit_media_scene(message: types.Message, state: FSMContext):
    data = await state.get_data()
    file_type, file_id = get_media_file_id_and_type(message)

    # Обновляем пост
    post: Post = Post.from_json(data["post"])
    post.media = Media(file_id=file_id, file_type=file_type)
    await state.update_data(post=post.to_json())

    await message.answer("Пост обновлен ✅", reply_markup=BotMarkup.remove())
    await reply_post(message, post, reply_markup=Markup.edit_menu())
