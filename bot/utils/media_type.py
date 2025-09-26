from enum import Enum
from aiogram import types
import typing


class MediaType(Enum):
    video = "video"
    photo = "photo"
    document = "document"
    audio = "audio"
    voice = "voice"


def get_media_type(message: types.Message) -> typing.Union[str, None]:
    if message.video:
        return MediaType.video.value
    elif message.photo:
        return MediaType.photo.value
    elif message.document:
        return MediaType.document.value
    elif message.audio:
        return MediaType.audio.value
    elif message.voice:
        return MediaType.voice.value

    return None


def get_media_file_id_and_type(message: types.Message) -> typing.Tuple[str, str]:
    media_type = get_media_type(message)

    if media_type == MediaType.photo.value:
        return media_type, message.photo[-1].file_id
    elif media_type is not None:
        return media_type, message[media_type].file_id

    return None
