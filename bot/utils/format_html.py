import bleach
from bs4 import BeautifulSoup


def format_html(text: str = ''):
    text = text.replace("<br>", "\n").replace("<br/>", "\n")
    
    tags = ['b', 'strong', 'i', 'em', 'u', 's', 'del', 'strike', 'spoiler', 'a', 'code', 'pre', 'span']
    attributes = {'a': ['href'], 'span': ['class']}
    protocols =['http', 'https', 'mailto', 'tg']

    return bleach.clean(
        str(BeautifulSoup(text, 'html.parser')),
        tags=tags, 
        attributes=attributes, 
        protocols=protocols
    )