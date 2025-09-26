from tortoise import fields
from tortoise.models import Model
from bot.answers import Media
from bot.enums import AiChatRoleEnum, ButtonTypeEnum, MenuTypeEnum
from openpyxl.styles import Alignment, Border, Side
import io
import pandas as pd

class AiChat(Model):
    id = fields.IntField(pk=True)
    
    user = fields.OneToOneField("models.User", related_name="ai_chat")

    messages: fields.ReverseRelation["AiMessage"]

    updated_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    async def get_conversation_history_for_assistent(self) -> list[dict[str, str]]:
        messages = await self.messages.all().order_by("created_at")
        
        valid_history = []
        user_messages = {}
        operator_responses = {}
        
        for message in messages:
            if message.role == AiChatRoleEnum.USER:
                user_messages[message.id] = message
            elif message.role == AiChatRoleEnum.OPERATOR:
                if message.reply_to:
                    operator_responses[message.reply_to] = message
        
        for message in messages:
            if message.role == AiChatRoleEnum.USER:
                if message.id in operator_responses:
                    valid_history.append({
                        "role": "user",
                        "content": message.text
                    })
                    
                    operator_message = operator_responses[message.id]
                    valid_history.append({
                        "role": "assistant",
                        "content": operator_message.text
                    })
            
        return valid_history

    async def generate_conversation_excel(self) -> io.BytesIO:
        await self.fetch_related("user")
        messages = await self.messages.all().order_by("created_at")
        
        conversation_data = {
            'Пользователь': [],
            'Оператор': []
        }
        
        for message in messages:
            if message.role == AiChatRoleEnum.USER:
                conversation_data['Пользователь'].append(message.text)
                conversation_data['Оператор'].append('')
            elif message.role == AiChatRoleEnum.OPERATOR:
                if conversation_data['Оператор'] and conversation_data['Оператор'][-1] == '':
                    conversation_data['Оператор'][-1] = message.text
                else:
                    conversation_data['Пользователь'].append('')
                    conversation_data['Оператор'].append(message.text)
        
        df = pd.DataFrame(conversation_data)
        excel_buffer = io.BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Переписка', index=False)
            worksheet = writer.sheets['Переписка']
            
            # Настраиваем ширину столбцов
            for column in worksheet.columns:
                max_length = 0
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
            
            
            border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            
            for row in worksheet.iter_rows(min_row=1, max_row=worksheet.max_row):
                for cell in row:
                    cell.alignment = Alignment(wrap_text=True, vertical='top')
                    cell.border = border

        excel_buffer.seek(0)
        return excel_buffer


class AiMessage(Model):
    id = fields.IntField(pk=True)

    role = fields.CharEnumField(AiChatRoleEnum)

    text = fields.TextField(null=False)
    media = fields.JSONField(null=True)

    reply_to = fields.IntField(null=True)

    updated_at = fields.DatetimeField(auto_now=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    ai_chat: fields.ForeignKeyRelation["AiChat"] = fields.ForeignKeyField(
        "models.AiChat", related_name="messages"
    )

    async def update_is_answered(self, is_answered: bool):
        self.is_answered = is_answered
        await self.save(update_fields=["is_answered"])
