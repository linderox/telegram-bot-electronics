from pydantic import BaseModel
from typing import Optional, List

class UpdatePositionRequest(BaseModel):
    menu_id: int
    position_x: float
    position_y: float

class UpdateButtonsRequest(BaseModel):
    buttons: list[dict]

class UpdateButtonsPositionRequest(BaseModel):
    buttons: list[dict]

class UpdateTextRequest(BaseModel):
    menu_id: int
    text: str
    extra_text: Optional[List[str]] = None

class RemoveMediaMenu(BaseModel):
    menu_id: int

class UserStatistics(BaseModel):
    month: list[int]
    week: list[int]
    day: list[int]


class UserListResponse(BaseModel):
    users: list
    total: int
    total_pages: int
    current_page: int

class AddButtonRequest(BaseModel):
    parent_menu_id: int
    buttons: list

class CreateMenuRequest(BaseModel):
    title: str
    position_x: int
    position_y: int

class CreateConnectionRequest(BaseModel):
    menu_id: int
    button_id: int

class DeleteButtonRequest(BaseModel):
    menu_id: int
    button_ids: list[int]

class DeleteMenuRequest(BaseModel):
    menu_id: int

class UpdateSettingsRequest(BaseModel):
    model: str
    prompt: str
    models: list[dict]
    models_for_training: list[dict]
    max_tokens: int
    temperature:  float
    max_attempts: int = 3
    delay_seconds: int = 1
    new_models: list | None = None


class Message(BaseModel):
    role: str
    content: str

class TrainingExample(BaseModel):
    messages: list[Message]

class TrainModelRequest(BaseModel):
    model: str
    prompt: str
    training_data: list[TrainingExample]

class FineTuningJob(BaseModel):
    id: str
    model: str
    status: str
    created_at: str
    finished_at: Optional[str] = None
    fine_tuned_model: Optional[str] = None
    error: Optional[str] = None

class EmbeddingItemBase(BaseModel):
    title: str
    content: str

class EmbeddingItemCreate(EmbeddingItemBase):
    pass

class EmbeddingItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    embedding: Optional[list[float]] = None

class EmbeddingItemResponse(EmbeddingItemBase):
    id: int
    created_at: str
    embedding: Optional[list[float]] = None

    class Config:
        from_attributes = True


class UpdateAsisstentInfoRequest(BaseModel):
    id: int
    title: str
    content: str

class BatchImportResponse(BaseModel):
    message: str
    count: int

class BatchDeleteResponse(BaseModel):
    message: str

class LogEntry(BaseModel):
    content: str
    type: str  # "error", "success", или "info"

class UpdateBotSettingsRequest(BaseModel):
    price_link: str