from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.generator import GenerationRequestSchema
from app.generator.code_generator import generate_project_files
from app.generator.project_structure import create_zip_archive
import io
from typing import Dict
from app.services import llm_service
from pydantic import BaseModel

router = APIRouter()

@router.post("/generate", response_class=StreamingResponse)
def handle_project_generation(request_schema: GenerationRequestSchema):
    """
    Принимает схему данных, генерирует полный проект FastAPI 
    и возвращает его в виде zip-архива.
    """
    try:
        generated_files = generate_project_files(request_schema)
        
        zip_bytes = create_zip_archive(generated_files)

        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=fastapi_project.zip"}
        )
        
    except Exception as e:
        print(f"Error during generation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate project.")
    
@router.post("/generate-preview", response_model=Dict[str, str])
def handle_code_preview(request_schema: GenerationRequestSchema):
    """
    Принимает схему и генерирует код для предпросмотра в виде JSON.
    Возвращает словарь, где ключ - имя файла, значение - код.
    """
    try:
        generated_files = generate_project_files(request_schema)
        
        preview_files = {
            "models.py": generated_files.get("app/models.py", ""),
            "main.py": generated_files.get("app/main.py", "")
        }
        return preview_files

    except Exception as e:
        print(f"Error during preview generation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate code preview.")
    
class LLMRequest(BaseModel):
    text: str

@router.post("/parse-text-to-schema", response_model=GenerationRequestSchema)
async def handle_parsing_from_text(request: LLMRequest):
    """
    Принимает текст, преобразует его в схему через LLM и возвращает
    эту схему в виде JSON.
    """
    try:
        schema = await llm_service.parse_text_to_schema(request.text)
        return schema
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))