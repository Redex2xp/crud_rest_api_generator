from jinja2 import Environment, FileSystemLoader
from app.schemas.generator import GenerationRequestSchema
from typing import Dict

env = Environment(loader=FileSystemLoader("app/generator/templates"))

def generate_project_files(schema: GenerationRequestSchema) -> Dict[str, str]:
    """
    Генерирует словарь с именами файлов и их содержимым для полного проекта.
    """
    
    main_template = env.get_template("main.py.jinja2")
    models_template = env.get_template("models.py.jinja2")
    tests_template = env.get_template("tests.py.jinja2")
    context = {"entities": schema.entities}

    main_py_code = main_template.render(context)
    models_py_code = models_template.render(context)
    tests_py_code = tests_template.render(context)
    
    requirements_txt = "fastapi\nuvicorn\npytest\nhttpx" 

    init_py = ""
    
    return {
        "app/__init__.py": init_py,
        "app/main.py": main_py_code,
        "app/models.py": models_py_code,
        "tests/__init__.py": init_py,               
        "tests/test_main.py": tests_py_code,        
        "requirements.txt": requirements_txt
    }