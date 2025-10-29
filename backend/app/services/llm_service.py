import httpx
import json
import os
from app.schemas.generator import GenerationRequestSchema
from dotenv import load_dotenv


load_dotenv()


API_KEY = os.getenv("LLM_API_KEY")
API_URL = os.getenv("LLM_API_URL")

async def parse_text_to_schema(text: str) -> GenerationRequestSchema:
    """
    Отправляет текст в Google Gemini API и парсит ответ в нашу Pydantic-схему.
    """
    if not API_KEY or not API_URL:
        raise Exception("LLM_API_KEY or LLM_API_URL is not set in the .env file")


    prompt = f"""
    Преобразуй следующий текстовый запрос в JSON-структуру для генерации API.
    JSON должен строго соответствовать формату: {{ "entities": [ {{ "name": "...", "fields": [ {{ "name": "...", "type": "..." }} ] }} ] }}.
    Используй только следующие типы полей: str, int, bool, float.
    Имена сущностей должны быть в единственном числе в CamelCase (например, UserStory, BlogPost).
    
    Текст запроса: "{text}"
    
    Твой ответ должен быть ТОЛЬКО JSON-объектом, без каких-либо пояснений, комментариев или markdown-обертки ```json ... ```.
    """


    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }


    headers = {
        "x-goog-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, json=payload, headers=headers, timeout=45.0)
            response.raise_for_status() 
        except httpx.HTTPStatusError as e:
            raise Exception(f"Gemini API request failed with status {e.response.status_code}: {e.response.text}")

    try:
        response_json = response.json()
        
        print(json.dumps(response_json, indent=2))
        
        llm_response_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
        
        if llm_response_text.strip().startswith("```json"):
            llm_response_text = llm_response_text.strip()[7:-3].strip()

        parsed_json = json.loads(llm_response_text)
        
        schema = GenerationRequestSchema(**parsed_json)
        return schema
    except (json.JSONDecodeError, KeyError, IndexError, TypeError) as e:
        print(f"Failed to parse or validate Gemini response: {e}")
        print(f"Raw response text: {response_json}")
        raise Exception("Could not parse or validate the schema from LLM response.")