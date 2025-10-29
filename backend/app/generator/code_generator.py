from jinja2 import Environment, FileSystemLoader
from app.schemas.generator import GenerationRequestSchema
from typing import Dict


env = Environment(loader=FileSystemLoader("app/generator/templates"))

def generate_project_files(schema: GenerationRequestSchema) -> Dict[str, str]:
    """
    Генерирует словарь с именами файлов и их содержимым.
    
    Returns:
        Dict[str, str]: {"app/main.py": "...", "app/models.py": "...", ...}
    """
    
    main_template = env.get_template("main.py.jinja2")
    models_template = env.get_template("models.py.jinja2")

    context = {"entities": schema.entities}

    main_py_code = main_template.render(context)
    models_py_code = models_template.render(context)

    requirements_txt = "fastapi\nuvicorn"
    
    init_py = ""
    
    return {
        "app/__init__.py": init_py,
        "app/main.py": main_py_code,
        "app/models.py": models_py_code,
        "requirements.txt": requirements_txt
    }