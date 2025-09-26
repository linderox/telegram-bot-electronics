from aiogram.fsm.state import StatesGroup, State


class MailingState(StatesGroup):
    add = State()
    edit_text = State()
    edit_media = State()
    confirm = State()
    investment_type = State()

    choose_users = State()
