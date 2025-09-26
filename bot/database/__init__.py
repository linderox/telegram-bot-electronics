from bot.config import config

TORTOISE_ORM = {
    "connections": {"default": config.db.uri},
    "apps": {
        "models": {
            "models": ["bot.database.models", "aerich.models"],
            "default_connection": "default",
        },
    },
}
