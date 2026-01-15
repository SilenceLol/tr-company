
"""
Telegram бот для регистрации сотрудников
Работает на Render с aiogram 3.0.0b2
"""

import os
import asyncio
import logging
import json
import random
import string
from pathlib import Path
from datetime import datetime

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.enums import ParseMode
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

# ========================================
# НАСТРОЙКИ
# ========================================

# Получаем токен из переменных окружения Render
BOT_TOKEN = os.getenv('BOT_TOKEN')
if not BOT_TOKEN:
    print("❌ ОШИБКА: BOT_TOKEN не найден!")
    print("На Render: Settings → Environment → Add BOT_TOKEN")
    exit(1)

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация бота
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Пути к файлам
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
CODES_FILE = DATA_DIR / "employee_codes.json"
TXT_FILE = DATA_DIR / "employee_codes.txt"

# ========================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ========================================

def load_codes():
    """Загружает коды из JSON файла"""
    if CODES_FILE.exists():
        try:
            with open(CODES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_codes(codes):
    """Сохраняет коды в JSON и текстовый файл"""
    try:
        # Сохраняем в JSON
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            json.dump(codes, f, ensure_ascii=False, indent=2)
        
        # Сохраняем в текстовый файл
        with open(TXT_FILE, 'w', encoding='utf-8') as f:
            f.write("=" * 50 + "\n")
            f.write("СПИСОК КОДОВ ДОСТУПА СОТРУДНИКОВ\n")
            f.write(f"Обновлено: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
            f.write("=" * 50 + "\n\n")
            
            for phone, data in sorted(codes.items(), key=lambda x: x[1]['name']):
                f.write(f"{data['name']}\n")
                f.write(f"{data['code']}\n")
                f.write("-" * 30 + "\n")
        
        logger.info(f"✅ Сохранено сотрудников: {len(codes)}")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка сохранения: {e}")
        return False

def generate_code(length=8):
    """Генерация кода без похожих символов"""
    chars = string.ascii_uppercase.replace('O', '').replace('I', '') + '23456789'
    return ''.join(random.choice(chars) for _ in range(length))

def normalize_phone(phone: str) -> str:
    """Нормализует номер телефона"""
    # Убираем все нецифровые символы
    digits = ''.join(filter(str.isdigit, phone))
    
    # Если номер начинается с 8, заменяем на 7
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    
    # Если номер начинается с 7 и имеет 11 цифр
    if digits.startswith('7') and len(digits) == 11:
        return digits
    
    return None

# ========================================
# СОСТОЯНИЯ FSM
# ========================================

class Registration(StatesGroup):
    waiting_for_phone = State()
    waiting_for_name = State()

# ========================================
# ОБРАБОТЧИКИ КОМАНД
# ========================================

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Команда /start"""
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="📱 Отправить контакт", request_contact=True)],
            [types.KeyboardButton(text="📝 Ввести номер вручную")],
            [types.KeyboardButton(text="🔑 Получить мой код")]
        ],
        resize_keyboard=True
    )
    
    await message.answer(
        "👋 <b>Добро пожаловать!</b>\n\n"
        "Я бот для регистрации сотрудников и выдачи постоянных кодов доступа.\n\n"
        "<b>Как использовать:</b>\n"
        "1. Зарегистрируйтесь (кнопка ниже)\n"
        "2. Получите постоянный код\n"
        "3. Сохраните код\n\n"
        "Код выдается <b>один раз</b> и <b>никогда не меняется</b>!",
        reply_markup=keyboard
    )

@dp.message(lambda message: message.text == "📱 Отправить контакт")
async def request_contact(message: types.Message):
    """Обработка кнопки отправки контакта"""
    await message.answer(
        "Нажмите кнопку ниже, чтобы отправить контакт:",
        reply_markup=types.ReplyKeyboardMarkup(
            keyboard=[
                [types.KeyboardButton(text="📱 Поделиться номером", request_contact=True)],
                [types.KeyboardButton(text="↩️ Назад")]
            ],
            resize_keyboard=True
        )
    )

@dp.message(lambda message: message.text == "📝 Ввести номер вручную")
async def request_phone_manual(message: types.Message, state: FSMContext):
    """Обработка кнопки ручного ввода"""
    await message.answer(
        "📱 <b>Введите ваш номер телефона:</b>\n\n"
        "Формат: <code>79991234567</code> или <code>+79991234567</code>\n\n"
        "Номер будет использоваться для входа в систему.",
        reply_markup=types.ReplyKeyboardMarkup(
            keyboard=[[types.KeyboardButton(text="❌ Отменить")]],
            resize_keyboard=True
        )
    )
    await state.set_state(Registration.waiting_for_phone)

@dp.message(lambda message: message.text == "🔑 Получить мой код")
async def request_my_code(message: types.Message):
    """Обработка кнопки получения кода"""
    codes = load_codes()
    
    if not codes:
        await message.answer(
            "❌ <b>Нет зарегистрированных сотрудников.</b>\n\n"
            "Сначала зарегистрируйтесь.",
            reply_markup=types.ReplyKeyboardRemove()
        )
        return
    
    await message.answer(
        "Чтобы получить ваш код, отправьте номер телефона:",
        reply_markup=types.ReplyKeyboardMarkup(
            keyboard=[[types.KeyboardButton(text="❌ Отменить")]],
            resize_keyboard=True
        )
    )

# Обработка контакта
@dp.message(lambda message: message.contact is not None)
async def handle_contact(message: types.Message, state: FSMContext):
    """Обработка отправленного контакта"""
    phone = normalize_phone(message.contact.phone_number)
    
    if not phone:
        await message.answer(
            "❌ <b>Не удалось распознать номер.</b>\n\n"
            "Попробуйте ввести номер вручную.",
            reply_markup=types.ReplyKeyboardRemove()
        )
        return
    
    await process_phone_number(message, phone, state)

# Обработка введенного номера
@dp.message(Registration.waiting_for_phone)
async def handle_phone_input(message: types.Message, state: FSMContext):
    """Обработка введенного номера"""
    if message.text == "❌ Отменить":
        await message.answer("Действие отменено.", reply_markup=types.ReplyKeyboardRemove())
        await state.clear()
        return
    
    phone = normalize_phone(message.text)
    
    if not phone:
        await message.answer(
            "❌ <b>Неверный формат номера.</b>\n\n"
            "Пожалуйста, введите номер в формате:\n"
            "<code>79991234567</code> или <code>+79991234567</code>\n\n"
            "Попробуйте еще раз:"
        )
        return
    
    await process_phone_number(message, phone, state)

async def process_phone_number(message: types.Message, phone: str, state: FSMContext):
    """Обработка номера телефона"""
    codes = load_codes()
    
    # Проверяем, есть ли уже сотрудник с таким номером
    if phone in codes:
        # Сотрудник уже зарегистрирован
        data = codes[phone]
        await message.answer(
            f"✅ <b>Найден ваш код!</b>\n\n"
            f"👤 <b>ФИО:</b> {data['name']}\n"
            f"📱 <b>Телефон:</b> <code>{phone}</code>\n\n"
            f"🔐 <b>Ваш код доступа:</b>\n"
            f"<code>{data['code']}</code>\n\n"
            f"📅 <b>Зарегистрирован:</b> {data['date']}\n\n"
            f"⚠️ <b>Код постоянный и не меняется!</b>",
            reply_markup=types.ReplyKeyboardRemove()
        )
        await state.clear()
    else:
        # Сотрудника нет - начинаем регистрацию
        await state.update_data(phone=phone)
        await message.answer(
            "✅ <b>Номер принят!</b>\n\n"
            "📝 <b>Теперь введите ваше имя и фамилию:</b>\n\n"
            "Например: <i>Иванов Иван</i>",
            reply_markup=types.ReplyKeyboardMarkup(
                keyboard=[[types.KeyboardButton(text="❌ Отменить")]],
                resize_keyboard=True
            )
        )
        await state.set_state(Registration.waiting_for_name)

# Обработка ввода имени
@dp.message(Registration.waiting_for_name)
async def handle_name_input(message: types.Message, state: FSMContext):
    """Обработка ввода имени"""
    if message.text == "❌ Отменить":
        await message.answer("Регистрация отменена.", reply_markup=types.ReplyKeyboardRemove())
        await state.clear()
        return
    
    name = message.text.strip()
    
    # Простая валидация имени
    if len(name.split()) < 2 or len(name) < 3:
        await message.answer(
            "❌ <b>Неверный формат имени.</b>\n\n"
            "Пожалуйста, введите имя и фамилию:\n"
            "Например: <i>Иванов Иван</i>\n\n"
            "Попробуйте еще раз:"
        )
        return
    
    # Получаем телефон из состояния
    data = await state.get_data()
    phone = data.get('phone')
    
    if not phone:
        await message.answer("Ошибка. Начните заново.", reply_markup=types.ReplyKeyboardRemove())
        await state.clear()
        return
    
    # Регистрируем сотрудника
    await register_employee(message, phone, name)
    await state.clear()

async def register_employee(message: types.Message, phone: str, name: str):
    """Регистрация нового сотрудника"""
    # Генерируем код
    code = generate_code()
    
    # Загружаем существующие коды
    codes = load_codes()
    
    # Добавляем нового сотрудника
    codes[phone] = {
        'name': name,
        'code': code,
        'date': datetime.now().strftime('%d.%m.%Y %H:%M:%S')
    }
    
    # Сохраняем
    if save_codes(codes):
        await message.answer(
            "🎉 <b>Регистрация успешно завершена!</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━",
            reply_markup=types.ReplyKeyboardRemove()
        )
        
        await message.answer(
            f"✅ <b>Ваши данные сохранены:</b>\n\n"
            f"👤 <b>ФИО:</b> {name}\n"
            f"📱 <b>Телефон:</b> <code>{phone}</code>\n\n"
            f"🔐 <b>ВАШ ПОСТОЯННЫЙ КОД ДОСТУПА:</b>\n"
            f"<code>{code}</code>\n\n"
            f"📋 <b>Важная информация:</b>\n"
            f"• Этот код <b>никогда не изменится</b>\n"
            f"• Запомните или сохраните его\n"
            f"• Для входа на веб-сервис используйте этот код\n"
            f"• Для повторного получения нажмите «🔑 Получить мой код»",
            reply_markup=types.ReplyKeyboardMarkup(
                keyboard=[
                    [types.KeyboardButton(text="🔑 Получить мой код")],
                    [types.KeyboardButton(text="📝 Новый сотрудник")]
                ],
                resize_keyboard=True
            )
        )
        
        logger.info(f"Зарегистрирован: {name} ({phone}) - код: {code}")
    else:
        await message.answer(
            "❌ <b>Ошибка сохранения данных.</b>\n\n"
            "Попробуйте еще раз или обратитесь к администратору.",
            reply_markup=types.ReplyKeyboardRemove()
        )

@dp.message(lambda message: message.text == "↩️ Назад")
async def go_back(message: types.Message):
    """Возврат в главное меню"""
    await cmd_start(message)

@dp.message(lambda message: message.text == "📝 Новый сотрудник")
async def new_employee(message: types.Message):
    """Регистрация нового сотрудника"""
    await request_phone_manual(message, None)

@dp.message(Command("codes"))
async def cmd_codes(message: types.Message):
    """Команда /codes - показать все коды (для админа)"""
    codes = load_codes()
    
    if not codes:
        await message.answer("❌ Нет зарегистрированных сотрудников.")
        return
    
    text = "📋 <b>Список всех сотрудников:</b>\n\n"
    for phone, data in sorted(codes.items(), key=lambda x: x[1]['name']):
        text += f"👤 <b>{data['name']}</b>\n"
        text += f"   📱 <code>{phone}</code>\n"
        text += f"   🔐 <code>{data['code']}</code>\n"
        text += f"   📅 {data['date']}\n\n"
    
    # Если текст слишком длинный, разбиваем на части
    if len(text) > 4096:
        parts = [text[i:i+4096] for i in range(0, len(text), 4096)]
        for part in parts:
            await message.answer(part)
    else:
        await message.answer(text)

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Команда /help"""
    help_text = (
        "📋 <b>Справка по боту:</b>\n\n"
        
        "<b>Как зарегистрироваться:</b>\n"
        "1. Нажмите «📝 Ввести номер вручную»\n"
        "2. Введите номер телефона\n"
        "3. Введите имя и фамилию\n"
        "4. Получите постоянный код\n\n"
        
        "<b>Как получить код:</b>\n"
        "1. Нажмите «🔑 Получить мой код»\n"
        "2. Введите номер телефона\n"
        "3. Получите ваш код\n\n"
        
        "<b>Важная информация:</b>\n"
        "• Код выдается <b>один раз</b>\n"
        "• Код <b>никогда не меняется</b>\n"
        "• Все данные сохраняются в файл\n\n"
        
        "<b>Формат номера телефона:</b>\n"
        "<code>79991234567</code> или <code>+79991234567</code>\n\n"
        
        "<b>Другие команды:</b>\n"
        "/start - Начать работу\n"
        "/help - Эта справка"
    )
    await message.answer(help_text)

# Обработка любых других сообщений
@dp.message()
async def handle_other_messages(message: types.Message):
    """Обработка других сообщений"""
    await message.answer(
        "Используйте кнопки меню или команду /start для начала работы.",
        reply_markup=types.ReplyKeyboardRemove()
    )

# ========================================
# ЗАПУСК БОТА
# ========================================

async def main():
    """Основная функция запуска бота"""
    logger.info("🚀 Запуск Telegram бота на Render...")
    logger.info(f"📁 Директория данных: {DATA_DIR.absolute()}")
    logger.info(f"🔐 Токен: {BOT_TOKEN[:10]}...")
    
    # Загружаем существующие коды
    codes = load_codes()
    logger.info(f"📊 Загружено сотрудников: {len(codes)}")
    
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"💥 Критическая ошибка: {e}")
        raise
    finally:
        await bot.session.close()

if __name__ == '__main__':
    asyncio.run(main())
