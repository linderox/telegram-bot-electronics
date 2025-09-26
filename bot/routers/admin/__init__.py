from bot.utils.router import Router
from bot.routers import root_handlers_router
from bot.filters import IsAdminFilter

admin_router = Router()

# Регистрация всех фильтров для администратора
is_admin_filter = IsAdminFilter()
admin_router.message.filter(is_admin_filter)
admin_router.callback_query.filter(is_admin_filter)

root_handlers_router.include_router(admin_router)
