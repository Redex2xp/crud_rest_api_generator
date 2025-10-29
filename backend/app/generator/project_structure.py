import io
import zipfile
from typing import Dict

def create_zip_archive(files: Dict[str, str]) -> bytes:
    """
    Создает zip-архив в памяти из словаря с файлами.

    Args:
        files: Словарь, где ключ - это путь к файлу, а значение - его содержимое.

    Returns:
        bytes: Содержимое zip-архива в виде байтов.
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for file_name, content in files.items():
            zip_file.writestr(file_name, content)
            
    zip_buffer.seek(0)
    
    return zip_buffer.getvalue()