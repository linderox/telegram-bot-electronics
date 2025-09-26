import os
import json
import typing
from enum import Enum, StrEnum
from dataclasses_json import dataclass_json
from dataclasses import dataclass
from bot.enums import MenuTypeEnum

filename = "answers.json"

@dataclass_json
@dataclass
class Media:
    file_id: str | None
    file_path: str | None
    type: str


class ANSWERS(Enum):
    INCORRECT_PHONE = "⚠️ Введите корректный номер телефона"
    MENU_NOT_FOUND = "⚠️ Меню не найдено, пожалуйста, попробуйте еще раз..."


class BUTTONS(Enum):
    CONSULTANT = "консультант"  
    PRICE = "прайс"              
    FAQ = "частые вопросы"       
    DELIVERY = "доставка"
    PAYMENT = "оплата"
    WARRANTY = "гарантии"

    PHONE_NUMBER = "📞 прикрепить телефон"
    BACK = "« назад"

START_BUTTONS = [
    (BUTTONS.CONSULTANT.value, MenuTypeEnum.AI_CHAT), # название кнопки, тип меню, на которое оно введет
    (BUTTONS.PRICE.value, MenuTypeEnum.MENU),      
    (BUTTONS.FAQ.value, MenuTypeEnum.MENU),
    (BUTTONS.DELIVERY.value, MenuTypeEnum.MENU),
    (BUTTONS.PAYMENT.value, MenuTypeEnum.MENU),
    (BUTTONS.WARRANTY.value, MenuTypeEnum.MENU),
]

PHONE_NUMBER_BUTTONS = {
    (BUTTONS.PHONE_NUMBER.value, MenuTypeEnum.MENU),
}


class MENU_KEY(StrEnum):
    PHONE = """
Чтобы начать работу с ботом, пожалуйста, поделитесь своим номером телефона. Это нужно для вашей идентификации и удобного взаимодействия.

Нажимая "Поделиться номером", вы подтверждаете ваше согласие с <a href="https://disk.yandex.ru/d/ndYXG8lwDHqO6g">Политикой обработки персональных данных</a> 
И даете свое <a href="https://disk.yandex.ru/d/mJEClkcTr47jLQ">Согласие на обработку персональных данных</a>
"""
    START = "Стартовое меню"

MENU_KEYS = [
    MENU_KEY.START,
    MENU_KEY.PHONE,
]

class Answers:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            if os.environ["APP_MODE"] == "dev" and os.path.exists(filename):
                os.remove(filename)

            cls._instance = super().__new__(cls)
            cls._instance.filename = filename
            cls._instance._load_answers()

        return cls._instance

    def __init__(self):
        self.phrases = ANSWERS
        self.buttons = BUTTONS

    def _load_answers(self):
        # В режиме разработки чистим файл ответов и кнопок при запуске
        if os.environ["APP_MODE"] == "dev" and os.path.exists(self.filename):
            os.remove(self.filename)

        self.ANSWERS = {}
        self.BUTTONS = {}

        if not os.path.exists(self.filename):
            # Создаем новый файл с начальными значениями по умолчанию
            for answer in ANSWERS:
                self.ANSWERS[answer.name] = {"text": answer.value, "entities": []}

            for button in BUTTONS:
                self.BUTTONS[button.name] = button.value

            self._save(dict(answers=self.ANSWERS, buttons=self.BUTTONS))
        else:
            with open(self.filename) as f:
                data: dict = json.load(f)

                exists_answers = data["answers"]
                exists_buttons = data["buttons"]

                for answer in ANSWERS:
                    if not exists_answers.get(answer.name):
                        exists_answers[answer.name] = {"text": answer.value, "entities": []}

                for button in BUTTONS:
                    if not exists_buttons.get(button.name):
                        exists_buttons[button.name] = button.value

                for exists_key in exists_answers:
                    self.ANSWERS[exists_key] = exists_answers[exists_key]

                for exists_key in exists_buttons:
                    self.BUTTONS[exists_key] = exists_buttons[exists_key]

                self._save(dict(answers=self.ANSWERS, buttons=self.BUTTONS))

    def _save(self, data):
        self.ANSWERS = data["answers"]
        self.BUTTONS = data["buttons"]

        with open(self.filename, "w") as f:
            json.dump(data, f, indent=4)

    def _save_answers(self, answers):
        self.ANSWERS = answers

        with open(self.filename) as f:
            data: dict = json.load(f)

        data["answers"] = answers

        with open(self.filename, "w") as f:
            json.dump(data, f, indent=4)

    def _save_buttons(self, buttons):
        self.BUTTONS = buttons

        with open(self.filename) as f:
            data: dict = json.load(f)

        data["buttons"] = buttons

        with open(self.filename, "w") as f:
            json.dump(data, f, indent=4)

    def get_key_answers(self):
        return [key for key in self.ANSWERS]

    def get_key_buttons(self):
        return [key for key in self.BUTTONS]

    def get_text(self, answer: ANSWERS, **kwargs) -> str:
        answer = self.ANSWERS[answer.name if isinstance(answer, ANSWERS) else answer]["text"]
        if kwargs:
            answer = answer.format(**kwargs)

        return answer

    def get_button(self, button: BUTTONS) -> str:
        return self.BUTTONS[button.name if isinstance(button, BUTTONS) else button]

    def get_entities(self, answer: ANSWERS) -> typing.Union[list, None]:
        return self.ANSWERS[answer.name if isinstance(answer, ANSWERS) else answer]["entities"]

    def update_answer(self, key: str, text: str) -> None:
        self.ANSWERS[key] = {"text": text, "entities": []}
        self._save_answers(self.ANSWERS)

    def update_buttons(self, key: str, text: str) -> None:
        self.BUTTONS[key] = text
        self._save_buttons(self.BUTTONS)


answers = Answers()
