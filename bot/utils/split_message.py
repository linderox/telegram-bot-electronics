import re
from typing import List, Tuple
from bot.utils.format_html import format_html


def split_message(msg: str, *, with_photo: bool) -> list[str]:
    if not msg:
        return [None]
    
    parts = []
    while msg:
        if parts:
            max_msg_length = 4096
        else:
            if with_photo:
                max_msg_length = 1024
            else:
                max_msg_length = 4096

        if len(msg) <= max_msg_length:
            parts.append(msg)
            break
        else:
            part = msg[:max_msg_length]
            first_ln = part.rfind('\n')

            if first_ln != -1:
                new_part = part[:first_ln]
                parts.append(new_part)
                msg = msg[first_ln + 1:]
            else:
                first_space = part.rfind(' ')

                if first_space != -1:
                    new_part = part[:first_space]
                    parts.append(new_part)
                    msg = msg[first_space + 1:]
                else:
                    parts.append(part)
                    msg = msg[max_msg_length:]

    return [format_html(part) for part in parts]

def close_tags(
    html: str,
    open_tags: List[str] = None
) -> Tuple[str, List[str]]:
    """
    Closes all opening tags
    Adds missing opening tags
    """
    # Pattern for finding tags considering attributes
    tag_pattern = re.compile(r'<(/?)(\w+)([^>]*)>')
    open_stack = []
    close_queue = []
    close_open_tags = []

    for tag in tag_pattern.finditer(html):
        is_closing_tag = tag.group(1) == '/'
        tag_name = tag.group(2)
        tag_atr = tag.group(3)

        if not is_closing_tag:
            # If it's an opening tag, put it in the stack
            open_stack.insert(0, tag_name)
            close_open_tags.append(f"<{tag_name}{tag_atr}>")

        elif open_stack and open_stack[0] == tag_name:
            # If it's a closing tag and the last opening tag in the stack matches the current closing tag, remove it from the stack
            open_stack.pop(0)
            
        else:
            # If the closing tag has no opening tag, add it to the queue
            close_queue.append(tag_name)

    # Close all unclosed tags
    for tag_name in open_stack:
        html += '</' + tag_name + '>'
    
    if open_tags:
        html = "".join(open_tags) + html
    else:
        # Open all unopened tags
        for tag_name in close_queue:
            html = '<' + tag_name + '>' + html

    return html, close_open_tags[-len(open_stack):]

def split_message_with_tags(
    text: str,
    with_photo: bool = False
) -> list[str]:
    """
    Splits the text into parts considering tags.
    """
    result = split_message(msg = text, with_photo=with_photo)

    result_parts = []
    open_tags = None
    for part in result:
        text, open_tags = close_tags(part, open_tags)
        result_parts.append(text)

    return result_parts