from tortoise import fields
from tortoise.models import Model
from bot.answers import Media
from bot.enums import ButtonTypeEnum, MenuTypeEnum


class Menu(Model):
    id = fields.IntField(pk=True)
    menu_key = fields.CharField(max_length=255, unique=True, null=True)
    menu_type = fields.CharEnumField(MenuTypeEnum, default=MenuTypeEnum.MENU)

    # parent: fields.ForeignKeyRelation["Menu"] = fields.ForeignKeyField(
    #     "models.Menu", related_name="childrens", null=True
    # )

    # childrens: fields.ReverseRelation["Menu"]

    text = fields.TextField(null=True)
    media = fields.JSONField(null=True)
    extra_text = fields.JSONField(null=True)  # Дополнительные тексты сообщений

    position_x = fields.IntField(default=0)
    position_y = fields.IntField(default=0)

    children_buttons: fields.ReverseRelation["Button"]
    transition_button: fields.ReverseRelation["Button"]

    is_active = fields.BooleanField(default=True)
    is_protected = fields.BooleanField(default=False)

    updated_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    @property
    def formatted_media(self) -> Media:
        return Media.from_dict(self.media) if self.media else self.media
    

class Button(Model):
    id = fields.IntField(pk=True)
    
    title = fields.CharField(max_length=255)
    type = fields.CharEnumField(ButtonTypeEnum)
    row = fields.IntField(default=1)
    column = fields.IntField(default=-1)

    is_active = fields.BooleanField(default=True)
    request_contact = fields.BooleanField(default=False)

    updated_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    parent_menu: fields.ForeignKeyRelation["Menu"] = fields.ForeignKeyField( # меню к которой кнопка клетися
        "models.Menu", related_name="children_buttons", null=True
    )

    transition_menu: fields.ForeignKeyRelation["Menu"] = fields.ForeignKeyField(
        "models.Menu", related_name="transition_button", null=True 
    )

    # class Meta:
    #     unique_together = (("title", "type"),)
