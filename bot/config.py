import time
import os
import configparser
import argparse
import logging
from loguru import logger
from dataclasses import dataclass
from typing import List


@dataclass
class DbConfig:
    name: str
    uri: str

@dataclass
class OneC:
    url: str
    token: str
    username: str
    password: str


@dataclass
class Bot:
    id: int  # noqa
    token: str
    admins: List[int]
    server_url: str

@dataclass
class Assistent:
    openai_token: str


@dataclass
class Userbot:
    api_id: int
    api_hash: str
    phone_number: str


@dataclass
class Cryptocloud:
    api_key: str
    shop_id: str


@dataclass
class Lang:
    domain: str
    locales_dir: str


@dataclass
class Redis:
    host: str
    port: int


@dataclass
class Config:
    onec: OneC
    bot: Bot
    assistent: Assistent
    userbot: Userbot
    db: DbConfig
    lang: Lang
    redis: Redis

config = configparser.ConfigParser()


def check_values():
    # Проверка наличия секции и полей
    try:
        assert "bot" in config.sections(), "Отсутствует секция [bot] в конфигурационном файле"
        assert config.get("bot", "token"), "Отсутствует значение token в конфигурационном файле"
        assert config.get("bot", "admins"), "Отсутствует значение admins в конфигурационном файле"
        assert config.get("bot", "server_url"), "Отсутствует значение server_url в конфигурационном файле"

        assert "userbot" in config.sections(), "Отсутствует секция [userbot] в конфигурационном файле"
        assert config.get("userbot", "api_id"), "Отсутствует значение api_id в конфигурационном файле"
        assert config.get("userbot", "api_hash"), "Отсутствует значение api_hash в конфигурационном файле"
        assert config.get("userbot", "phone_number"), "Отсутствует значение phone_number в конфигурационном файле"

        assert "assistent" in config.sections(), "Отсутствует секция [assistent] в конфигурационном файле"
        assert config.get("assistent", "openai_token"), "Отсутствует значение openai_token в конфигурационном файле"

        assert "1c" in config.sections(), "Отсутствует секция [1c] в конфигурационном файле"
        assert config.get("1c", "url"), "Отсутствует значение url в конфигурационном файле"
        assert config.get("1c", "token"), "Отсутствует значение token в конфигурационном файле"

        assert "redis" in config.sections(), "Отсутствует секция [redis] в конфигурационном файле"
        assert config.get("redis", "host"), "Отсутствует значение host в конфигурационном файле"
        assert config.get("redis", "port"), "Отсутствует значение port в конфигурационном файле"

        assert "database" in config.sections(), "Отсутствует секция [database] в конфигурационном файле"
        assert config.get("database", "name"), "Отсутствует значение name в конфигурационном файле"

    except AssertionError as e:
        print("Ошибка:", e)
        time.sleep(10)  # Задержка на 10 секунд
        exit()


def load_config():
    mode = os.environ.get("APP_MODE")
    path = f"./config.{mode}.ini"
    logger.info(f"Конфиг загружен: {path}")
    config.read(path, encoding="utf-8")
    check_values()

    tg_bot = config["bot"]
    assistent = config["assistent"]
    userbot = config["userbot"]
    database_name = config["database"]["name"]
    redis = config["redis"]
    onec = config["1c"]

    return Config(
        onec=OneC(
            url=onec["url"], 
            token=onec['token'],
            username=onec['login'],
            password=onec['password'],
        ),
        bot=Bot(
            token=tg_bot["token"],
            admins=[int(x) for x in tg_bot["admins"].split(",")],
            id=int(tg_bot["token"].split(":")[0]),
            server_url=tg_bot["server_url"].strip(),
        ),
        assistent=Assistent(
            openai_token=assistent["openai_token"],
        ),
        userbot=Userbot(
            api_id=userbot["api_id"],
            api_hash=userbot["api_hash"],
            phone_number=userbot["phone_number"],
        ),
        db=DbConfig(name=database_name, uri=f"sqlite://{database_name}.sqlite3.db"),
        lang=Lang(domain="bot", locales_dir="locales"),
        redis=Redis(host=redis["host"], port=int(redis["port"])),
    )


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Управление режимом работы приложения")
    parser.add_argument("--mode", choices=["dev", "prod"], required=True, help="Режим работы приложения (dev или prod)")
    parser.add_argument("--client", choices=["bot", "server"], required=True, help="Клиент для запуска")

    args = parser.parse_args()
    os.environ["APP_MODE"] = args.mode
    os.environ["APP_CLIENT"] = args.client

    if args.mode == "dev":
        logging.basicConfig(level=logging.INFO)

    return args


parse_arguments()
config = load_config()
