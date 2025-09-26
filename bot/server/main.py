import os
import uuid
import math
import re
import pandas as pd
from datetime import datetime, timedelta
from io import BytesIO
from tortoise.expressions import Q
from loguru import logger
from contextlib import asynccontextmanager
from fastapi import Request, Response, Depends, FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from bot.database.connection import init_connection, close_connection
from bot.database.repo.Menu import MenuRepo
from bot.database.models import User, AsisstentInfo
from bot.database.models.Dto import dto
from tortoise.exceptions import IntegrityError
from bot.server.types import (
    UpdatePositionRequest, 
    UpdateButtonsRequest, 
    UpdateButtonsPositionRequest, 
    UpdateTextRequest, 
    RemoveMediaMenu, 
    UserListResponse, 
    AddButtonRequest, 
    CreateMenuRequest, 
    CreateConnectionRequest,
    DeleteButtonRequest,
    DeleteMenuRequest,
    UpdateSettingsRequest,
    TrainModelRequest,
    FineTuningJob,
    EmbeddingItemResponse,
    EmbeddingItemCreate,
    UpdateAsisstentInfoRequest,
    EmbeddingItemBase,
    LogEntry,
    UpdateBotSettingsRequest
)
from bot.answers import Media
from bot.utils.to_moscow_time import to_moscow_time
from bot.database.models.AiChat import AiChat, AiMessage
from bot.enums import ButtonTypeEnum, MenuTypeEnum
from bot.settings import settings, AssistentConfig
from bot.services.assistent import ai_assistant
from .middlewares import get_auth_data
from fastapi.templating import Jinja2Templates

# Определяем lifespan обработчик
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_connection()
    logger.success("Подключились к базе данных")
    yield  # Переход к работе приложения
    await close_connection()
    logger.info("Отключились от базы данных")


app = FastAPI(lifespan=lifespan)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/assets", StaticFiles(directory="static"), name="assets")
app.mount("/images", StaticFiles(directory="images"), name="images")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
async def open_app(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# @app.get("/{full_path:path}")
# async def serve_react(full_path: str, request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/admin/menu")
async def get_menu(request: Request, auth_data: dict = Depends(get_auth_data)):
    menus = await MenuRepo.get_all()
    return [(await dto.MenuDTO.from_tortoise_orm(menu)).model_dump(mode="json") for menu in menus]

@app.post("/api/admin/update-position-menu")
async def update_position_menu(request: UpdatePositionRequest, auth_data: dict = Depends(get_auth_data)):
    await MenuRepo.update_position(
        menu_id=request.menu_id,
        position_x=request.position_x,
        position_y=request.position_y
    )

@app.post("/api/admin/update-buttons")
async def update_buttons(request: UpdateButtonsRequest, auth_data: dict = Depends(get_auth_data)):
    buttons = await MenuRepo.get_buttons()
    for button in buttons:
        for candidate in request.buttons:
            if button.id == candidate["id"]:
                button.title = candidate["title"]
                await button.save(update_fields=["title"])

@app.post("/api/admin/update-button-positions")
async def update_button_position(request: UpdateButtonsPositionRequest, auth_data: dict = Depends(get_auth_data)):
    buttons = await MenuRepo.get_buttons()
    for button in buttons:
        for candidate in request.buttons:
            if button.id == candidate["id"]:
                if button.row != candidate["x"] or button.column != candidate["y"]:
                    button.row = candidate["x"]
                    button.column = candidate["y"]
                    await button.save(update_fields=["row", "column"])

@app.post('/api/admin/update-text')
async def update_text(request: UpdateTextRequest, auth_data: dict = Depends(get_auth_data)):
    await MenuRepo.update_text(request.menu_id, request.text, request.extra_text)
    return {"ok": True}

@app.post('/api/admin/remove-menu-media')
async def update_text(request: RemoveMediaMenu, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_id(request.menu_id)
    if menu:
        await MenuRepo.update(menu, "media", None)

    return {"ok": True}

@app.post("/api/admin/upload-menu-media")
async def upload_media(menu_id: str = Form(...), file: UploadFile = File(...), auth_data: dict = Depends(get_auth_data)):
    menu_id = int(menu_id)
    short_uuid = str(uuid.uuid4())[:8]  
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{short_uuid}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    file_path = f"/{UPLOAD_DIR}/{unique_filename}"

    menu = await MenuRepo.get_by_id(menu_id)

    content_type = file.content_type
    if content_type.startswith("image/"):
        file_type = "photo"
    elif content_type.startswith("video/"):
        file_type = "video"
    else:
        raise HTTPException(status_code=400, detail="Отправьте корректный формат медиа")

    media = Media(
        file_id=None,
        file_path=file_path,
        type=file_type
    )

    await MenuRepo.update(menu, "media", media.to_dict())

    return {"file_path": file_path}

@app.get("/api/admin/user-statistics")
async def get_user_statistics(period: str, auth_data: dict = Depends(get_auth_data)):
    today = datetime.now()
    total_count = await User.all().count()
    
    if period == "month":
        start_of_month = today.replace(day=1)
        users = await User.filter(created_at__gte=start_of_month).all()
        # Группируем по дням
        daily_counts = [0] * today.day
        for user in users:
            daily_counts[user.created_at.day - 1] += 1

        return JSONResponse(content={"month": daily_counts, "total": total_count})

    elif period == "week":
        start_of_week = today - timedelta(days=today.weekday())
        users = await User.filter(created_at__gte=start_of_week).all()
        # Группируем по дням недели
        weekly_counts = [0] * 7
        for user in users:
            day_of_week = user.created_at.weekday()  # Пн=0, Вт=1, ..., Вс=6
            weekly_counts[day_of_week] += 1

        return JSONResponse(content={"week": weekly_counts, "total": total_count})

    elif period == "day":
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999)
        users = await User.filter(created_at__gte=start_of_day, created_at__lte=end_of_day).all()
        # Группируем по часам
        hourly_counts = [0] * 24
        for user in users:
            hour = user.created_at.hour
            hourly_counts[hour] += 1

        return JSONResponse(content={"day": hourly_counts, "total": total_count})

    else:
        return JSONResponse(content={"error": "Invalid period"}, status_code=400)


@app.get("/api/admin/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | int |  None = None,
    auth_data: dict = Depends(get_auth_data),
):
    query = User.all()
    if search:
        search = str(search).strip()
        if search.isdigit():
            query = query.filter(telegram_id=int(search))
        else:
            search_term = search.replace("@", "").lower()
            query = query.filter(
                Q(username__icontains=search_term) | 
                Q(full_name__icontains=search_term)
            )
    
    total = await query.count()
    total_pages = math.ceil(total / limit)
    
    if page > total_pages and total_pages > 0:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    users = await query.offset((page - 1) * limit).limit(limit).all()
    
    user_list = []
    for user in users:
        user_list.append((await dto.UserDTO.from_tortoise_orm(user)).model_dump(mode="json"))
    
    return UserListResponse(
        users=user_list,
        total=total,
        total_pages=total_pages,
        current_page=page
    )

@app.get("/api/admin/download-users-report")
async def generate_users_report(auth_data: dict = Depends(get_auth_data)):
    """Generate an Excel report of all users"""
    
    try:
        users = await User.all().order_by('created_at')

        user_data = []
        for user in users:
            full_name = user.full_name if user.full_name else ""
            username = user.username if user.username else "Отсутствует"
            phone = user.phone_number if user.phone_number else "Не добавлен"
            
            user_data.append({
                "ID": user.telegram_id,
                "Полное имя": full_name,
                "Юзернейм": username,
                "Номер телефона": phone,
                "Статус": "Заблокирован" if user.is_banned else "Активен",
                "Дата регистрации": to_moscow_time(user.created_at)
            })
        
        df = pd.DataFrame(user_data)
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Пользователи')
            
            worksheet = writer.sheets['Пользователи']
            for i, col in enumerate(df.columns):
                col_values = df[col].fillna("").astype(str)
                max_length = max(
                    max([len(str(val)) for val in col_values], default=0), 
                    len(str(col))
                ) + 2
                worksheet.column_dimensions[chr(65 + i)].width = max_length

        output.seek(0)
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        return Response(
            output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=users_{today}.xlsx"
            }
        )
    
    except Exception as e:
        print(f"Error generating Excel report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации файла: {str(e)}")


@app.get("/api/admin/user-chats")
async def get_chat_users(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    auth_data: dict = Depends(get_auth_data)
):
    query = User.filter(ai_chat__isnull=False)

    if search:
        search = search.strip()
        if search.isdigit():
            query = query.filter(telegram_id=int(search))
        else:
            search_term = f'%{search.replace("@", "").lower()}%'
            query = query.filter(
                Q(username__icontains=search_term) | 
                Q(full_name__icontains=search_term)
            )
    
    total = await query.count()
    
    users = await query.prefetch_related(
        "ai_chat__messages"
    ).order_by("-ai_chat__updated_at").offset(offset).limit(limit)
    
    user_list = []
    for user in users:
        latest_message_time = None
        if user.ai_chat and user.ai_chat.messages:
            messages = sorted(user.ai_chat.messages, 
                             key=lambda m: m.created_at, 
                             reverse=True)
            if messages:
                latest_message_time = messages[0].created_at
        
        user_list.append({
            "telegram_id": user.telegram_id,
            "display_name": user.username or user.full_name,
            "full_name": user.full_name,
            "username": user.username,
            "latest_message_time": latest_message_time,
            "chat_id": user.ai_chat.id if user.ai_chat else None
        })
    
    return {
        "users": user_list,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/api/admin/user-chat/{chat_id}")
async def get_chat_messages(chat_id: int, auth_data: dict = Depends(get_auth_data)):
    chat = await AiChat.get_or_none(id=chat_id).prefetch_related("user", "messages")

    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    user = chat.user
    
    messages = await AiMessage.filter(ai_chat_id=chat_id).order_by("created_at")
    
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": msg.id,
            "role": msg.role.value,
            "text": msg.text,
            "media": msg.media,
            "created_at": msg.created_at
        })
    
    return {
        "chat_id": chat.id,
        "user": {
            "telegram_id": user.telegram_id,
            "full_name": user.full_name,
            "username": user.username,
            "display_name": user.username or user.full_name
        },
        "messages": formatted_messages,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at
    }


@app.post("/api/admin/menu/add-buttons")
async def add_button(request: AddButtonRequest, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_id(request.parent_menu_id)

    for button in request.buttons:
        await MenuRepo.add_button(
            parent_menu=menu, 
            transition_menu=None, 
            title=button["title"], 
            button_type=ButtonTypeEnum.REPLY
        )

    return { "ok": True }


@app.get("/api/admin/menu/get-button-by-title")
async def get_button_by_title(title: str):
    button = await MenuRepo.find_button(title)
    return dict(button=(await dto.ButtonDTO.from_tortoise_orm(button)).model_dump(mode="json") if button else button)


@app.post('/api/admin/menu/create-menu')
async def create_menu(request: CreateMenuRequest, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_key(request.title)
    if menu:
        raise HTTPException(status_code=403, detail="Такое меню уже существует")
    
    menu = await MenuRepo.create(request.title, MenuTypeEnum.MENU, text="Текст еще не добавлен", position_x=request.position_x, position_y=request.position_y)
    return { "ok": True }

@app.post("/api/admin/menu/create-connection")
async def create_connection(request: CreateConnectionRequest, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_id(request.menu_id)
    button = await MenuRepo.get_button_by_id(request.button_id)

    button.transition_menu = menu
    await button.save()

    return {"ok": True}

@app.post('/api/admin/menu/delete-buttons')
async def delete_buttons(request: DeleteButtonRequest, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_id(request.menu_id)
    if not menu:
        raise HTTPException(status_code=403, detail="Такого меню не существует")
    
    for button_id in request.button_ids:
        button = await MenuRepo.get_button_by_id(button_id) 
        if button:
            await button.delete()
        
    return {"ok": True}

@app.post("/api/admin/menu/delete")
async def delete_menu(request: DeleteMenuRequest, auth_data: dict = Depends(get_auth_data)):
    menu = await MenuRepo.get_by_id(request.menu_id)

    if menu:
        await menu.delete()

    return {"ok": True }
    

@app.get("/api/admin/assistent/settings")
async def get_assistent_settings(request: Request, auth_data: dict = Depends(get_auth_data)):
    data = settings.get_assistent_config().to_dict()
    data["prompt"] = settings.settings["assistent_system_prompt"].strip()

    return data


@app.post('/api/admin/assistent/settings')
async def update_assistent_settings(request: UpdateSettingsRequest, auth_data: dict = Depends(get_auth_data)):
    new_config = AssistentConfig.from_dict(request.model_dump(mode="json"))

    if request.new_models:
        for new_model in request.new_models:
            if new_model not in request.models:
                new_config.models.append({
                    "id": new_model,
                    "title": new_model,
                    "created_at": datetime.now().isoformat()
                })

    settings.set_assistent_config(new_config)
    settings.set_system_prompt(request.prompt)
    return {"ok": True, "status": "success", "message": "Настройки успешко обновлены"}

@app.post("/api/admin/assistent/train-model")
async def train_model(request: TrainModelRequest, auth_data: dict = Depends(get_auth_data)):
    try:
        # formatted_data = [
        #     {"messages": [msg.dict() for msg in example.messages]}
        #     for example in request.training_data
        # ]

        formatted_data = []
        for example in request.training_data:
            messages = []
            
            # Добавляем системный промпт в начало каждого набора сообщений

            if request.prompt:
                system_message = {
                    "role": "system",
                    "content": request.prompt
                }
                messages.append(system_message)
            
           
            # Добавляем остальные сообщения
            messages.extend([msg.dict() for msg in example.messages])
            
            formatted_data.append({"messages": messages})

        # Вызываем метод обучения
        job = await ai_assistant.train_model(request.model, formatted_data)
        
        # Обновляем настройки
        # Здесь должен быть код для обновления настроек в зависимости от вашей реализации
        
        return {"status": "success", "job_id": job.id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обучении модели: {str(e)}")


@app.get("/api/admin/assistent/fine-tuning-jobs", response_model=list[FineTuningJob])
async def get_fine_tuning_jobs(auth_data: dict = Depends(get_auth_data)):
    try:
        jobs = await ai_assistant.get_jobs()
        
        formatted_jobs = []
        for job in jobs.data:
            created_at_str = datetime.fromtimestamp(job.created_at).isoformat() if job.created_at else None
            
            finished_at_str = None
            if hasattr(job, "finished_at") and job.finished_at:
                finished_at_str = datetime.fromtimestamp(job.finished_at).isoformat()
            
            job_data = {
                "id": job.id,
                "model": job.model,
                "status": job.status,
                "created_at": created_at_str,
                "finished_at": finished_at_str,
                "fine_tuned_model": job.fine_tuned_model if hasattr(job, "fine_tuned_model") and job.fine_tuned_model else None
            }
            
            if hasattr(job, "error") and job.error:
                job_data["error"] = job.error.message
                
            formatted_jobs.append(job_data)
            
        return formatted_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении списка задач: {str(e)}")

@app.get("/api/admin/assistent/embeddings", response_model=list)
async def get_all_embedding_items(auth_data: dict = Depends(get_auth_data)):
    """Получить все элементы"""
    items = await AsisstentInfo.all()
    return [(await dto.AsisstentInfoDTO.from_tortoise_orm(item)).model_dump(mode="json") for item in items]

@app.post("/api/admin/assistent/embeddings")
async def create_embedding_item(
    item_data: EmbeddingItemCreate,
    auth_data: dict = Depends(get_auth_data)
):
    """Создать новый элемент"""
    try:
        item = await AsisstentInfo.create(title=item_data.title, content=item_data.content)
        return (await dto.AsisstentInfoDTO.from_tortoise_orm(item)).model_dump(mode="json")
    except IntegrityError:
        item = await AsisstentInfo.filter(title=item_data.title, content=item_data.content).first()
        return (await dto.AsisstentInfoDTO.from_tortoise_orm(item)).model_dump(mode="json")
    

@app.post('/api/admin/assistent/embeddings/import')
async def import_embeddings_item(
    items: list[EmbeddingItemBase],
    auth_data: dict = Depends(get_auth_data),
):
    for item in items:
        try:
            if await AsisstentInfo.filter(title=item.title).first():
                continue

            await AsisstentInfo.create(title=item.title, content=item.content)
        except Exception as ex:
            logger.warning(ex)

    items = await AsisstentInfo.all()
    return [(await dto.AsisstentInfoDTO.from_tortoise_orm(item)).model_dump(mode="json") for item in items]
   
@app.post("/api/admin/assistent/embeddings/delete/{item_id}")
async def delete_item(
    item_id: int, auth_data: dict = Depends(get_auth_data)
):
    """Удалить элемент по ID"""

    await AsisstentInfo.filter(id=item_id).delete()
    
    return {"status": "ok"}

@app.post("/api/admin/assistent/embeddings/edit/")
async def update_item(
    new_data: UpdateAsisstentInfoRequest,
    auth_data: dict = Depends(get_auth_data)
):
    """Обновить существующий элемент"""
    # Создаем резервную копию в фоновом режиме
    
    item = await AsisstentInfo.filter(id=new_data.id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail=f"Элемент с id: {new_data.id} - не найден")

    item.title = new_data.title
    item.content = new_data.content
    await item.save(update_fields=['title', "content"])
    
    return (await dto.AsisstentInfoDTO.from_tortoise_orm(item)).model_dump(mode="json")

@app.get("/api/admin/logs", response_model=dict)
def get_logs(limit: int | None = 500, auth_data: dict = Depends(get_auth_data)):
    bot_log_path = "logs/bot.log"
    
    if not os.path.exists(bot_log_path):
        raise HTTPException(status_code=404, detail="Файл с логами не найден")
    
    try:
        with open(bot_log_path, "r", encoding="utf-8") as file:
            lines = file.readlines()

        recent_lines = lines[-limit:] if len(lines) > limit else lines
        
        assistant_logs = []
        bot_logs = []
        
        for line in recent_lines:
            timestamp = line.split(' | ')[0].split('.')[0].replace("T", " ")

            log_type = "error" if "error" in line.lower() else "success" if "success" in line.lower() else "info"
            
            if "[assistent]" in line:
                content_match = re.search(r'\[assistent\](.*?)$', line)
                if content_match:
                    content = content_match.group(1).strip()
                else:
                    parts = line.split('[assistent]')
                    if len(parts) > 1:
                        content = parts[1].strip()
                    else:
                        content = line.strip()

                content = timestamp + " | " + content

                assistant_logs.append({
                    "content": content,
                    "type": log_type,
                })
            else:
                content = timestamp + " | " + " | ".join(line.split(' | ')[1:])
                bot_logs.append({
                    "content": content,
                    "type": log_type,
                })
        
        return {
            "assistant": assistant_logs,
            "bot": bot_logs
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при чтении логов: {str(e)}")
    
@app.get("/api/admin/settings")
async def get_settings(auth_data: dict = Depends(get_auth_data)):
    try:
        return {
            "price_link": settings.get_price_file().file_link,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Произошла ошибка: {str(e)}")

@app.post('/api/admin/settings')
async def update_settings(request: UpdateBotSettingsRequest, auth_data: dict = Depends(get_auth_data)):
    price_file = settings.get_price_file()
    price_file.file_link = request.price_link
    settings.set_price_file(price_file)

    return {
        "ok": True
    }

def run_server():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)