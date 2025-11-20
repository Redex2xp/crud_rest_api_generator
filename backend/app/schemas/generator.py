from pydantic import BaseModel, Field
from typing import List, Optional

class RelationSchema(BaseModel):
    """Описывает связь поля с другой сущностью."""
    target_entity: str = Field(..., description="Имя сущности, на которую указывает связь (в CamelCase, ед.ч.)")

class FieldSchema(BaseModel):
    """Схема для описания поля (атрибута) сущности."""
    name: str = Field(..., description="Имя поля, например 'title' или 'user_id'")
    type: str = Field(..., description="Тип данных поля, например 'str' или 'int'")
    relation: Optional[RelationSchema] = None

class EntitySchema(BaseModel):
    name: str = Field(..., description="Имя сущности в единственном числе, CamelCase, например 'Post' или 'Author'")
    fields: List[FieldSchema]

class GenerationRequestSchema(BaseModel):
    entities: List[EntitySchema]