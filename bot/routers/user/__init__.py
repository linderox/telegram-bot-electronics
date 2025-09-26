from bot.utils.router import Router
from bot.routers import root_handlers_router

router = Router()
root_handlers_router.include_router(router)