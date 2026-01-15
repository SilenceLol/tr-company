import secrets
import string
from datetime import datetime

def generate_code(length: int = 6) -> str:
    """Генерация случайного кода"""
    alphabet = string.ascii_uppercase + string.digits
    # Исключаем похожие символы (0/O, 1/I)
    alphabet = alphabet.replace('0', '').replace('O', '')
    alphabet = alphabet.replace('1', '').replace('I', '')
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def format_time_remaining(expires_at: datetime) -> str:
    """Форматирование оставшегося времени"""
    now = datetime.now()
    if expires_at < now:
        return "истек"
    
    delta = expires_at - now
    minutes = delta.seconds // 60
    seconds = delta.seconds % 60
    
    if minutes > 0:
        return f"{minutes} мин {seconds} сек"
    return f"{seconds} сек"

def validate_phone(phone: str) -> str:
    """Нормализация номера телефона"""
    # Удаляем все нецифровые символы, кроме плюса
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    # Если номер начинается с 8, заменяем на +7
    if cleaned.startswith('8'):
        cleaned = '+7' + cleaned[1:]
    
    # Если нет кода страны, добавляем +7 для России
    if cleaned.startswith('7') and not cleaned.startswith('+7'):
        cleaned = '+' + cleaned
    
    return cleaned