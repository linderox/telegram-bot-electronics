import openai
from loguru import logger
import tempfile
import json
import os
import numpy as np
from bot.config import config
from typing import List, Dict, Any
from bot.settings import settings
from bot.database.models import User, AsisstentInfo
from bot.services.onec import onec_service

class AIAssistant:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=config.assistent.openai_token)

    async def get_openai_embeddings(self, texts: List[str]) -> np.ndarray:
        """Получает векторные представления от OpenAI для заданных текстов"""
        try:
            response = await self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=texts,
            )
            embeddings = np.array([embedding.embedding for embedding in response.data])
            return embeddings
        except Exception as e:
            logger.error(f"Ошибка при получении OpenAI embeddings: {e}")
            raise

    async def retrieve_relevant_knowledge(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        """Извлекает релевантную информацию из базы знаний"""
        try:
            items = await AsisstentInfo.all()
            text = ""
            for num, item in enumerate(items, start=1):
                text += f"""
{num}) {item.title} - {item.content}
                """
            text = text.strip()

            return text
        except Exception as e:
            logger.error(f"Ошибка при получении информации о компании: {e}")
            return []
    
    async def generate_response(
        self,
        text: str,
        user: User,
        conversation_history: List[Dict[str, str]],
    ) -> str:
        """Генерирует ответ на основе контекста из базы знаний"""
        try:
            relevant_info = await self.retrieve_relevant_knowledge(text)
            system_prompt = settings.get_system_prompt(relevant_info=relevant_info)

            if any(word in text.lower() for word in ["менедж", "manag", "мнджер", "менджер", "жер"]):
                user_info = await onec_service.get_user(str(user.phone_number))
                if user_info and "manager" in user_info:
                    system_prompt += f"\nМенеджер пользователя: {user_info['manager']}"

            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            messages.extend(conversation_history[-20:])
            messages.append({"role": "user", "content": text})
            openai_config = settings.get_assistent_config()
            
            response = await self.openai_client.chat.completions.create(
                model=openai_config.model,
                messages=messages,
                max_tokens=openai_config.max_tokens,
                temperature=openai_config.temperature,
                user=str(user.telegram_id)
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Ошибка при генерации запроса: {e}")
            raise e

    async def sync_from_db(self):
        """Синхронизирует векторное хранилище с базой данных"""
        await self.refresh_vector_store()
            
    async def train_model(self, model: str, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as temp_file:
                for example in training_data:
                    temp_file.write(json.dumps(example) + "\n")
                
                temp_file_path = temp_file.name
            
            client = openai.Client(api_key=config.assistent.openai_token)
            
            with open(temp_file_path, "rb") as file:
                training_file = client.files.create(
                    file=file,
                    purpose="fine-tune"
                )
            
            job = client.fine_tuning.jobs.create(
                training_file=training_file.id,
                model=model,
                suffix="company_assistant"
            )
            
            os.unlink(temp_file_path)
            
            logger.info(f"Задание для обучение модели создано: {job.id}")
            return job
        except Exception as e:
            logger.error(f"Ошибка при обучении модели: {e}")
            raise

    async def get_jobs(self) -> list:
        client = openai.Client(api_key=config.assistent.openai_token)
        jobs = await self.openai_client.fine_tuning.jobs.list()
        return jobs
    
ai_assistant = AIAssistant()
