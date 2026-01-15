from aiogram.types import (
    ReplyKeyboardMarkup, 
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton
)

def get_phone_keyboard():
    """Клавиатура для отправки номера телефона"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="📱 Отправить номер телефона",
                    request_contact=True
                )
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )

def get_main_keyboard():
    """Основная клавиатура"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🔄 Получить новый код")],
            [KeyboardButton(text="ℹ️ Помощь")]
        ],
        resize_keyboard=True
    )

def get_new_code_keyboard():
    """Клавиатура после успешной генерации кода"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🔄 Получить новый код")]
        ],
        resize_keyboard=True
    )

def get_admin_keyboard():
    """Клавиатура администратора (если понадобится)"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="👥 Список сотрудников")],
            [KeyboardButton(text="📊 Статистика")],
            [KeyboardButton(text="⚙️ Настройки")]
        ],
        resize_keyboard=True
    )