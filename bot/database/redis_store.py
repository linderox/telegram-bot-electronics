import json
from redis import asyncio as aioredis
from loguru import logger
from bot.config import config


class RedisStore:
    def __init__(self, host: str = "", port: str = "", db: int = 1):
        self.redis_uri = f"redis://{host}:{port}"
        self.db = db
        self.redis = None

    async def connect(self):
        try:
            self.redis = await aioredis.from_url(self.redis_uri, decode_responses=True, db=self.db)
        except Exception as e:
            logger.error(f"[REDIS_CONNECT]: {e}")

    async def disconnect(self):
        try:
            await self.redis.close()
        except Exception as e:
            logger.error(f"[REDIS_DISCONNECT]: {e}")

    async def set_value(self, key: str, value: str):
        try:
            await self.redis.set(key, value)
        except Exception as e:
            logger.error(f"[REDIS_SET_VALUE] '{key}' in Redis: {e}")

    async def set_value_ex(self, key: str, value: str, expire_sec: int):
        try:
            await self.redis.setex(key, expire_sec, json.dumps(value))
        except Exception as e:
            logger.error(f"[REDIS_SET_VALUE_EX] '{key}' in Redis: {e}")

    async def get_value(self, key: str):
        try:
            result = await self.redis.get(key)
            return json.loads(result) if result else result
        except Exception as e:
            logger.error(f"[REDIS_GET_VALUE] '{key}' from Redis: {e}")

    async def keys(self, pattern: str) -> list:
        try:
            result = await self.redis.keys(pattern)
            return result
        except Exception as e:
            logger.error(f"[REDIS_KEYS] from Redis: {e}")

    async def values(self, pattern: str) -> list:
        try:
            keys = await self.keys(pattern)
            result = await self.redis.mget(keys)
            return result
        except Exception as e:
            logger.error(f"[REDIS_VALUES] from Redis: {e}")

    async def increment(self, key: str, amount: int = 1):
        try:
            result = await self.redis.incrby(key, amount)
            return result
        except Exception as e:
            logger.error(f"[REDIS_INCR] from Redis: {e}")


redis_store = RedisStore(config.redis.host, config.redis.port)
