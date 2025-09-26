from enum import Enum


class PluralType(str, Enum):
    years = "years"
    months = "months"
    days = "days"
    weeks = "weeks"
    hours = "hours"


def get_plural_hash_map():
    return {
        PluralType.hours.name: ("час", "часа", "часов"),
        PluralType.days.name: ("день", "дня", "дней"),
        PluralType.weeks.name: ("неделя", "недели", "недель"),
        PluralType.months.name: ("месяц", "месяца", "месяцев"),
        PluralType.years.name: ("год", "года", "лет"),
    }


def plural_value(number: int, plural_type: PluralType):
    plural_hash_map = get_plural_hash_map()
    number = int(number)
    if number % 10 == 1 and number % 100 != 11:
        return str(number) + f" {plural_hash_map[plural_type.name][0]}"
    elif number % 10 in [2, 3, 4] and number % 100 not in [12, 13, 14]:
        return str(number) + f" {plural_hash_map[plural_type.name][1]}"
    else:
        return str(number) + f" {plural_hash_map[plural_type.name][2]}"
