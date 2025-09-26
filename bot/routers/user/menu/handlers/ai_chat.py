import asyncio
import random
from datetime import datetime
from loguru import logger
from aiogram import types, F
from aiogram.utils.chat_action import ChatActionSender
from aiogram.fsm.context import FSMContext
from bot.database.repo.User import UserRepo
from bot.routers.user import router
from bot.routers.user.menu.State import MenuState
from bot.database.repo.AiChat import AiChatRepo
from bot.database.repo.Menu import MenuRepo
from bot.database.models.User import User
from bot.enums import AiChatRoleEnum
from bot.routers.admin.mailing.models import Media
from bot.services.recognizer import recognizer
from bot.services.assistent import ai_assistant
from bot.settings import settings
from bot.answers import answers, BUTTONS
from bot.utils.answer_menu import answer_menu
from bot.markups import Markup as BotMarkup
from bot.Manager import Manager

USER_LAST_ACTIVITY = {}

async def get_text_and_media(message: types.Message, user: User) -> tuple:
    media = None
    if message.voice:
        logger.info(f"Получили аудио-сообщение от {user.log_representation}")
        voice = await message.bot.download(message.voice.file_id)
        text = recognizer.audio_to_text(voice)
        media = Media(file_id=message.voice.file_id, file_type="voice")
    else:
        text = message.text or message.caption or ""

    return text, media

@router.message((F.text | F.voice | F.caption), MenuState.ai_chat)
async def new_message_to_ai_chat(message: types.Message, state: FSMContext, user: User):
    # Обновляем время последней активности пользователя
    USER_LAST_ACTIVITY[user.telegram_id] = asyncio.get_event_loop().time()
    ######################
    button = await MenuRepo.find_button(message.text or "")
    if button and button.transition_menu.menu_key != answers.buttons.CONSULTANT.value:
        await state.set_state(None)
        await answer_menu(message, button.transition_menu)
        return
    #####################

    text, media = await get_text_and_media(message, user)

    if not text.strip():
        logger.warning(f"Пустое содержание сообщения от {user.log_representation}")
        await message.reply("Пожалуйста, отправьте корректное сообщение")
        return

    chat = await AiChatRepo.get_or_create_chat(user)
    logger.info(f"[assistent] Вопрос от {user.log_representation}: {text[:500]}{'...' if len(text) > 500 else ''}")

    config_settings = settings.get_assistent_config()
    MAX_RETRY_ATTEMPTS = config_settings.max_attempts
    RETRY_DELAY_SECONDS = config_settings.delay_seconds

    history_messages = await chat.get_conversation_history_for_assistent()

    await asyncio.sleep(random.randrange(1, 2))
    async with ChatActionSender.typing(bot=message.bot, chat_id=message.chat.id):
        for attempt in range(1, MAX_RETRY_ATTEMPTS + 1):
            try:
                logger.info(f"[assisstent] Генерация ответа (попытка {attempt}/{MAX_RETRY_ATTEMPTS})")
                ai_message_user = await AiChatRepo.create_message(user, AiChatRoleEnum.USER, text, media=media)
                response_text = await ai_assistant.generate_response(
                    text, 
                    user,
                    history_messages
                )
                if not response_text or not response_text.strip():
                    raise ValueError("AI сервис вернул пустой ответ")
                
                await AiChatRepo.create_message(user, AiChatRoleEnum.OPERATOR, response_text, reply_to=ai_message_user.id, media=media)
                logger.success(f"[assistent] Ответили {user.log_representation} с попытки {attempt} | {response_text}")
                await message.reply(response_text, reply_markup=await BotMarkup.reply_markup(await MenuRepo.get_by_key(BUTTONS.CONSULTANT.value)))
                return
            except Exception as ex:
                error_details = f"{type(ex).__name__}: {str(ex)}"
                if attempt < MAX_RETRY_ATTEMPTS:
                    logger.warning(f"[assistent] Попытка {attempt}/{MAX_RETRY_ATTEMPTS} не удалась: {error_details}. Повторная попытка через {RETRY_DELAY_SECONDS * attempt}с...")
                    await asyncio.sleep(RETRY_DELAY_SECONDS * attempt) 
                else:
                    logger.error(f"[assistent] Все {MAX_RETRY_ATTEMPTS} попытки не удались для {user.log_representation}. Последняя ошибка: {error_details}")
                    
                    await message.reply("Что-то пошло не так, попробуйте еще раз") # Нужно куда-то вынести


async def check_inactive_users():
    while True:
        current_time = asyncio.get_event_loop().time()
        inactive_timeout = 15 * 60
   
        for user_id, last_activity in list(USER_LAST_ACTIVITY.items()):
            if current_time - last_activity > inactive_timeout:
                try:
                    user = await UserRepo.get_by_telegram_id(user_id)

                    if not user or user.is_chat_sended:
                        del USER_LAST_ACTIVITY[user_id]
                        continue

                    excel_buffer = await user.ai_chat.generate_conversation_excel()

                    await Manager.send_excel_to_operator_chat(excel_buffer, f'chat_history_{user.username_or_id}.xlsx', caption=f"""
{user.full_name}
{user.formatted_username}
{user.phone_number}
{datetime.now().strftime('%d.%m.%y')}
""")
                    
                    logger.info(f"Пользователь {user_id} неактивен более {inactive_timeout} секунд")
                    await UserRepo.update(user, "is_chat_sended", True)
                    del USER_LAST_ACTIVITY[user_id]
                except Exception as e:
                    logger.error(f"Ошибка при обработке неактивного пользователя {user_id}: {e}")
                
        await asyncio.sleep(60) 
