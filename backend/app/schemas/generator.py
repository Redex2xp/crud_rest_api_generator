from pydantic import BaseModel, Field
from typing import List

class FieldSchema(BaseModel):
    """Схема для описания поля (атрибута) сущности."""
    name: str = Field(..., description="Имя поля, например 'title' или 'user_id'")
    type: str = Field(..., description="Тип данных поля, например 'str' или 'int'")

class EntitySchema(BaseModel):
    """Схема для описания сущности (модели данных)."""
    name: str = Field(..., description="Имя сущности в единственном числе, CamelCase, например 'Post' или 'Author'")
    fields: List[FieldSchema] = Field(..., description="Список полей этой сущности")

class GenerationRequestSchema(BaseModel):
    """
    Основная схема для запроса на генерацию кода.
    Принимает список сущностей.
    """
    entities: List[EntitySchema]