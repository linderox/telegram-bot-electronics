from aiogram.fsm.state import StatesGroup, State


class AnswerState(StatesGroup):
    edit = State()
