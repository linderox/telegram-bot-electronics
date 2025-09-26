from aiogram import types, F
from aiogram.fsm.context import FSMContext
from bot.routers.user import router
from bot.database.repo.Menu import MenuRepo
from bot.answers import answers, BUTTONS, MENU_KEY
from bot.markups import Markup
from bot.utils.answer_menu import answer_menu
from bot.enums import MenuTypeEnum
from ..State import MenuState

@router.message(F.text)
async def message_handler(message: types.Message, state: FSMContext):
    await state.set_state(None)
    button = await MenuRepo.find_button(message.text or "")

    if not button:
        menu = await MenuRepo.get_by_key(MENU_KEY.START.name)
        await message.answer(answers.get_text(answers.phrases.MENU_NOT_FOUND), reply_markup=await Markup.reply_markup(menu))    
        return
    
    if button.transition_menu.menu_type == MenuTypeEnum.AI_CHAT:
        await state.set_state(MenuState.ai_chat)

    await answer_menu(message, button.transition_menu)