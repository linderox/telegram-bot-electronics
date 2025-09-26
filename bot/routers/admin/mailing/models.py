import typing
from dataclasses import dataclass
from dataclasses_json import dataclass_json


@dataclass_json
@dataclass
class Media:
    file_id: str
    file_type: str


@dataclass_json
@dataclass
class Post:
    text: typing.Union[str, None]
    media: typing.Union[Media, None] = None
