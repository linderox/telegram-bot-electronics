import typing
from decimal import Decimal, ROUND_DOWN


def normalize_fraction(amount: typing.Union[Decimal, int], decimals=3) -> str:
    quantize_pattern = Decimal("1." + "0" * decimals)

    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))

    amount = amount.quantize(quantize_pattern, rounding=ROUND_DOWN)

    amount_str = str(amount)
    if "." in amount_str:
        amount_str = amount_str.rstrip("0").rstrip(".")

    return amount_str
