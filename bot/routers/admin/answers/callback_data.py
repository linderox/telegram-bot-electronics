from aiogram.filters.callback_data import CallbackData

open_answers_menu_cb = "Изменить ответы ✏️"


class ChooseAnswerCategory(CallbackData, prefix="admin-choose-answer-category"):
    category: str


class ChooseAnswerForEdit(CallbackData, prefix="admin-edit-answer"):
    category: str
    key: str


back_to_buttons = "admin-back-buttons"
back_to_phrases = "admin-back-phrases"
