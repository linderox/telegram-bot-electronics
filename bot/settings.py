import os
import json
import typing
from dataclasses import dataclass
from dataclasses_json import dataclass_json
from datetime import datetime, timezone
from bot.utils.to_moscow_time import to_moscow_time

@dataclass_json
@dataclass
class AiModel:
    id: str
    title: str
    created_at: str

@dataclass_json
@dataclass
class AssistentConfig:
    model: str
    models: list[AiModel]
    models_for_training: list[AiModel]
    max_tokens: int
    temperature:  float
    max_attempts: int = 3
    delay_seconds: int = 1

@dataclass_json
@dataclass
class PriceFile:
    file_path: str
    file_id: str
    file_link: str
    updated_at: str

filename = "settings.json"


default_data = {
    "admins": [],

    "assistent_config": AssistentConfig(
        model = "gpt-4o",
        max_tokens =  1024,
        temperature = 0.7,
        models=[
            AiModel(
                id="gpt-4o",
                title="gpt-4o",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-4o-mini",
                title="gpt-4o-mini",
                created_at=datetime.now().isoformat(),
            )
        ],
        models_for_training = [
            AiModel(
                id="gpt-4o-2024-08-06",
                title="gpt-4o-2024-08-06",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-4o-mini-2024-07-18",
                title="gpt-4o-mini-2024-07-18",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-4-0613",
                title="gpt-4-0613",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-3.5-turbo-0125",
                title="gpt-3.5-turbo-0125",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-3.5-turbo-1106",
                title="gpt-3.5-turbo-1106",
                created_at=datetime.now().isoformat()
            ),
            AiModel(
                id="gpt-3.5-turbo-0613",
                title="gpt-3.5-turbo-0613",
                created_at=datetime.now().isoformat()
            )
        ]
        
    ).to_dict(),

    "assistent_system_prompt": """
You are an Human support manager, working on The Company, talking with people in telegram messanger, Your purpose is to provide helpful, accurate, and friendly assistance to users who have questions about our company, products, and services with internet chat tone.

Guidelines:
- Always respond in Russian language, you can use emoji when it needed
- Your responses should be precise and to the point, without unnecessary explanations or formalities. 
- Only include necessary information, and avoid adding anything extra.
- Be concise but thorough in your responses.
- Do not add phrases like "If you have any further questions, please let me know," "I'm here to help," "Feel free to ask more questions," or anything similar in the everything message at the end of your answers
- If you don't know the answer to a question, say so instead of making up information.
- Use company-specific terminology correctly.
- Use company-information as your knowledge
- Send information only with raw text, without formatting styles

Company Information:
{relevant_info}

Current date: [{current_date}]
""",
    "assistent_data": [],
    "price_file": PriceFile(
        file_path="uploads/price.xlsm",
        file_id="BQACAgQA...w2BA",
        file_link="https://website.com/prices/pastila.xlsm",
        updated_at=datetime.now().isoformat()
    ).to_dict(),
    "operator_chat_id": 2222222222
}


class Settings:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            # if os.environ.get("APP_MODE") == "dev" and os.path.exists(filename):
            #     os.remove(filename)

            cls._instance = super().__new__(cls)
            cls._instance.filename = filename
            cls._instance._load_settings()

        return cls._instance

    def _load_settings(self):
        if not os.path.exists(self.filename):
            # Создаем новый файл с начальными значениями по умолчанию
            self.settings = default_data
            self._save_settings()
        else:
            with open(self.filename) as f:
                self.settings = json.load(f)

    def _save_settings(self):
        with open(self.filename, "w") as f:
            json.dump(self.settings, f, indent=4)

    def set_admins(self, admins: list[int]) -> None:
        self.settings["admins"] = admins
        self._save_settings()

    @property
    def admins(self) -> list[int]:
        self._load_settings()
        return self.settings["admins"]
    
    def get_system_prompt(self, relevant_info: str = "") -> str:
        self._load_settings()

        prompt = self.settings["assistent_system_prompt"].format(relevant_info=relevant_info, current_date=to_moscow_time(datetime.now(timezone.utc)))
        return prompt.strip()
    
    def set_system_prompt(self, text: str) -> None:
        self._load_settings()
        self.settings["assistent_system_prompt"] = text
        self._save_settings()

    def get_assistent_config(self) -> AssistentConfig:
        self._load_settings()
        return AssistentConfig.from_dict(self.settings["assistent_config"])

    def set_assistent_config(self, config: AssistentConfig):
        self._load_settings()
        self.settings["assistent_config"] = config.to_dict()
        self._save_settings()

    def get_assistent_data(self) -> list:
        return self.settings["assistent_data"]

    def set_assistent_data(self, data: list):
        self.settings["assistent_data"] = data
        self._save_settings()

    def get_price_link(self) -> str:
        return self.settings["price_link"]

    def set_price_link(self, link: str):
        self.settings["price_link"] = link
        self._save_settings()

    def get_price_file(self) -> PriceFile:
        return PriceFile.from_dict(self.settings["price_file"])
    
    def set_price_file(self, price_file: PriceFile) -> None:
        self.settings['price_file'] = price_file.to_dict()
        self._save_settings()

    def get_operator_chat_id(self) -> int:
        self._load_settings()
        return self.settings["operator_chat_id"]

    def set_operator_chat_id(self, chat_id: int) -> None:
        self.settings["operator_chat_id"] = chat_id
        self._save_settings()

    def add_admin(self, telegram_id: int) -> bool:
        self._load_settings()
        if telegram_id not in self.settings["admins"]:
            self.settings["admins"].append(telegram_id)
            self._save_settings()
            return True
        return False

    def remove_admin(self, telegram_id: int) -> bool:
        self._load_settings()
        if telegram_id in self.settings["admins"]:
            self.settings["admins"].remove(telegram_id)
            self._save_settings()
            return True
        return False

settings = Settings()