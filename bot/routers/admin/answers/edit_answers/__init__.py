from aiogram import types, F
from aiogram.fsm.context import FSMContext
from bot.routers.admin import admin_router

from bot.answers import answers
from bot.markups import Markup as BotMarkup
from bot.routers.admin.Markup import Markup as AdminMarkup

from ..callback_data import ChooseAnswerCategory, ChooseAnswerForEdit, open_answers_menu_cb
from ..Markup import Markup
from ..enums import Answer
from ..State import AnswerState


@admin_router.callback_query(F.data == open_answers_menu_cb)
async def choose_category(cb: types.CallbackQuery, state: FSMContext):
    await cb.message.edit_text("Выберите категорию: ", reply_markup=Markup.open_categories())


@admin_router.callback_query(ChooseAnswerCategory.filter())
async def show_answers(cb: types.CallbackQuery, callback_data: ChooseAnswerCategory):
    if callback_data.category == Answer.BUTTONS.value:
        await cb.message.edit_text(
            "Пожалуйста, нажмите на кнопку, которую хотите изменить ?",
            reply_markup=Markup.open_answers(callback_data.category),
        )
    else:
        await cb.message.edit_text(
            "Пожалуйста, нажмите на сообщение, которую хотите изменить ?",
            reply_markup=Markup.open_answers(callback_data.category),
        )


@admin_router.message(F.text == "⬅️ Назад в меню кнопок")
async def back_buttons_handler(message: types.Message, state: FSMContext):
    await state.set_state(None)
    await message.answer("Вернулись в меню", reply_markup=AdminMarkup.admin_menu())
    await message.answer(
        "Пожалуйста, нажмите на кнопку, которую хотите изменить ?",
        reply_markup=Markup.open_answers(Answer.BUTTONS.value),
    )


@admin_router.message(F.text == "⬅️ Назад в меню сообщений")
async def back_answers_handler(message: types.Message, state: FSMContext):
    await state.set_state(None)
    await message.answer("Вернулись в меню", reply_markup=BotMarkup.remove())
    await message.answer(
        "Пожалуйста, нажмите на кнопку, которую хотите изменить ?",
        reply_markup=Markup.open_answers(Answer.PHRASES.value),
    )


@admin_router.callback_query(ChooseAnswerForEdit.filter())
async def edit_answer_handler(cb: types.CallbackQuery, callback_data: ChooseAnswerForEdit, state: FSMContext):
    await state.update_data(category=callback_data.category, key=callback_data.key)
    await cb.message.delete()

    if callback_data.category == Answer.BUTTONS.value:
        await cb.message.answer(
            f"Введите новый текст для кнопки:\n<b>{answers.get_button(callback_data.key)}</b>",
            reply_markup=Markup.back_to_buttons_reply(),
        )
        await state.set_state(AnswerState.edit)
    elif callback_data.category == Answer.PHRASES.value:
        await cb.message.answer(answers.get_text(callback_data.key))
        await cb.message.answer(
            "Введите новое сообщение: ⬇️",
            reply_markup=Markup.back_to_phrases_reply(),
        )
        await state.set_state(AnswerState.edit)


@admin_router.message(AnswerState.edit, F.text)
async def edit_answer_scene(message: types.Message, state: FSMContext):
    await state.set_state(None)
    data = await state.get_data()

    if data["category"] == Answer.BUTTONS.value:
        answers.update_buttons(data["key"], message.text)
        await message.answer("Обновляем кнопку 🔄", reply_markup=BotMarkup.remove())
        await message.answer(
            f"Кнопка: <b>{message.text}</b> сохранена ✅", reply_markup=Markup.open_answers(Answer.BUTTONS.value)
        )
    else:
        answers.update_answer(data["key"], message.html_text)
        await message.answer("Сообщение обновлено 🔄", reply_markup=BotMarkup.remove())
        await message.answer(message.html_text, reply_markup=Markup.open_answers(Answer.PHRASES.value))
