from bot.database.models.Menu import Menu
from bot.database.repo.Menu import MenuRepo
from bot.answers import MENU_KEY, PHONE_NUMBER_BUTTONS, START_BUTTONS
from bot.enums import ButtonTypeEnum, MenuTypeEnum

positions = {
    'PHONE': dict(x=0, y=0),
    'START':  dict(x=0, y=250),
}

async def seed_menu():
    for menu_key in MENU_KEY:
        menu = await MenuRepo.get_by_key(menu_key.name)
        if menu:
           continue
        
        menu = await MenuRepo.create(
            menu_key=menu_key.name,
            menu_type=MenuTypeEnum.MENU,
            text=MENU_KEY[menu_key.name].value,
            is_protected=True,
            position_x=positions[menu_key.name]["x"],
            position_y=positions[menu_key.name]["y"],
        ) 

        # Если кнопок будет становиться больше, надо сделать один тип для таких кнопок
        if menu_key == MENU_KEY.START:
            for button, transition_menu_type in START_BUTTONS:
                if await MenuRepo.get_by_key(button):
                    continue

                menus = await MenuRepo.get_all()
                transition_menu = await MenuRepo.create(
                    menu_key=button, 
                    menu_type=transition_menu_type,
                    text="Текст не добавлен", 
                    position_x=700, 
                    position_y=(menus[len(menus) - 1].position_y + 200)
                )
                    
                await MenuRepo.add_button(parent_menu=menu, transition_menu=transition_menu, title=button, button_type=ButtonTypeEnum.REPLY)

        elif menu_key == MENU_KEY.PHONE:
            menu = await MenuRepo.get_by_key(MENU_KEY.START)
            for button, transition_menu_type in PHONE_NUMBER_BUTTONS:
                await MenuRepo.add_button(menu, button, ButtonTypeEnum.PHONE_NUMBER, transition_menu=menu)


async def seed_data():
    await seed_menu()