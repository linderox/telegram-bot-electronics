from tortoise import fields
from tortoise.models import Model
from .AiChat import AiChat

class User(Model):
    telegram_id = fields.BigIntField(pk=True)
    full_name = fields.CharField(max_length=255, null=False)
    username = fields.CharField(max_length=255, null=True)

    referrer: fields.ForeignKeyRelation["User"] = fields.ForeignKeyField(
        "models.User", related_name="referrals", null=True
    )
    referrals: fields.ReverseRelation["User"]

    ai_chat: fields.OneToOneNullableRelation["AiChat"]

    is_banned = fields.BooleanField(default=False)
    is_chat_sended = fields.BooleanField(default=False)

    phone_number = fields.CharField(max_length=255, null=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now_add=True)

    @property
    def entity_representation(self):
        return f"@{self.username}" if self.username else f"<code>{self.telegram_id}</code>"

    @property
    def username_or_id(self):
        return self.formatted_username if self.username else self.telegram_id

    @property
    def formatted_username(self):
        return f"@{self.username}" if self.username else "Отсутствует"
    
    @property
    def log_representation(self):
        return f"{self.full_name} | {self.formatted_username if self.username else self.telegram_id} {f'| {self.phone_number}' if self.phone_number else ''}"