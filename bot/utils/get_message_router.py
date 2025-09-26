from bot.answers import BUTTONS, answers


def get_message_router(button: BUTTONS) -> str:
    return answers.get_button(button)
