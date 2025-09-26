import typing
from bot.database.models import User


class UserRepo:
    @staticmethod
    async def update_or_create(
        telegram_id: int,
        full_name: str,
        username: str = None,
    ) -> typing.Tuple[User, bool]:
        user = await UserRepo.get_by_telegram_id(telegram_id)
        is_first = False

        if not user:
            user = await User.create(
                telegram_id=telegram_id,
                full_name=full_name,
                username=username,
            )

            is_first = True
        else:
            user.username = username
            user.full_name = full_name
            await user.save(update_fields=["username", "full_name"])

        return user, is_first

    @staticmethod
    async def get_all() -> list[User]:
        users = await User.all()
        return users

    @staticmethod
    async def get_by_telegram_id(telegram_id: int) -> User:
        user = await User.filter(telegram_id=telegram_id).first().prefetch_related("ai_chat")
        return user

    @staticmethod
    async def get_by_username(username: str) -> typing.Union[User, None]:
        user = await User.filter(username=username).first()
        return user

    @staticmethod
    async def update(user: typing.Union[User, int], field: str, value: typing.Any) -> User:
        if isinstance(user, int):
            user = await UserRepo.get_by_telegram_id(user)

        setattr(user, field, value)
        await user.save(update_fields=[field])
        return user
