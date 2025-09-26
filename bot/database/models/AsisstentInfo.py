from tortoise import fields
from tortoise.models import Model

class AsisstentInfo(Model):
    id = fields.IntField(pk=True)
    
    title = fields.TextField(max_length=255)
    content = fields.TextField(max_length=255)

    updated_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        unique_together = (('title', "content", ))