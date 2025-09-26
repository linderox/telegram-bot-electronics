import typing
from loguru import logger
from bot.database.models.Menu import Menu
from bot.routers.admin.mailing.models import Media
from bot.database.models import Button
from bot.enums import ButtonTypeEnum, MenuTypeEnum

class MenuRepo:
    async def create(menu_key: str, menu_type: MenuTypeEnum, text: str, media: Media | None = None, is_protected: bool = False, position_x: int = 0, position_y: int = 0):
        menu = await Menu.create(menu_key=menu_key, menu_type=menu_type, text=text, media=media, is_protected=is_protected, position_x=position_x, position_y=position_y)
        logger.success(f"[+] Создали меню: {menu_key}")
        return menu
    
    async def get_by_key(menu_key: str) -> Menu:
        return await Menu.filter(menu_key__iexact=menu_key).prefetch_related("children_buttons", "transition_button", "children_buttons__parent_menu", "children_buttons__transition_menu").first()
    
    async def get_by_id(menu_id: int) -> Menu:
        return await Menu.filter(id=menu_id).prefetch_related("children_buttons", "transition_button", "children_buttons__parent_menu", "children_buttons__transition_menu").first()
    
    async def get_all(is_active: bool = True) -> list[Menu]:
        return await Menu.filter(is_active=is_active).prefetch_related("children_buttons", "transition_button", "children_buttons__parent_menu", "children_buttons__transition_menu").all()
    
    async def get_buttons(is_active: bool = True) -> list[Menu]:
        return await Button.filter(is_active=is_active).all()
    
    async def add_button(parent_menu: Menu, title: str, button_type: ButtonTypeEnum, transition_menu: Menu | None) -> Button:
        return await Button.create(parent_menu=parent_menu, transition_menu=transition_menu, title=title.lower(), type=button_type)
    
    async def find_button(title: str) -> Button | None:
        return await Button.filter(title__iexact=title).prefetch_related("parent_menu", "transition_menu", "transition_menu__children_buttons", "transition_menu__transition_button").first()
    
    async def get_button_by_id(id: int) -> Button | None:
        return await Button.filter(id=id).prefetch_related("parent_menu", "transition_menu", "transition_menu__children_buttons", "transition_menu__transition_button").first()

    async def update_position(menu_id: int, position_x: int, position_y: int):
        await Menu.filter(id=menu_id).update(position_x=position_x, position_y=position_y)

    async def update_text(menu_id: int, text: str, extra_text: list[str] = None) -> Menu:
        if extra_text is not None:
            return await Menu.filter(id=menu_id).update(text=text, extra_text=extra_text)
        return await Menu.filter(id=menu_id).update(text=text)
    
    @staticmethod
    async def update(menu: Menu | int, field: str, value: typing.Any) -> Menu:
        if isinstance(menu, int):
            menu = await MenuRepo.get_by_id(menu)

        setattr(menu, field, value)
        await menu.save(update_fields=[field])
        return menu