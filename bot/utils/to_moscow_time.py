from datetime import datetime
import pytz


def to_moscow_time(dt: datetime, format: str = "%d-%m-%Y %H:%M") -> datetime:
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)

    msk_tz = pytz.timezone("Europe/Moscow")
    msk_time = dt.astimezone(msk_tz)

    return msk_time.strftime(format)
