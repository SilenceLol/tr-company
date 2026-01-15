# bot_registration.py - Бот с регистрацией сотрудников
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    ReplyKeyboardMarkup, 
    KeyboardButton, 
    ReplyKeyboardRemove
)
import secrets
import string
import re
import os
import json
from pathlib import Path
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация бота
BOT_TOKEN = os.getenv('BOT_TOKEN', 'ВАШ_ТОКЕН_ЗДЕСЬ')
bot = Bot(token='8535867471:AAFY7X12sWghRM6afK44r2bLpW9IYBSSkf0')
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# ========================================
# НАСТРОЙКИ ФАЙЛОВ
# ========================================

DATA_DIR = Path("data")
CODES_FILE = DATA_DIR / "employee_codes.txt"
CODES_JSON = DATA_DIR / "employee_codes.json"

# Создаем директорию если ее нет
DATA_DIR.mkdir(exist_ok=True)

# ========================================
# РАБОТА С ФАЙЛАМИ
# ========================================

def load_codes():
    """Загружает коды из JSON файла"""
    if CODES_JSON.exists():
        try:
            with open(CODES_JSON, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Ошибка загрузки JSON: {e}")
    
    return {}

def save_codes(codes_dict):
    """Сохраняет коды в JSON и текстовый файл"""
    try:
        # Сохраняем в JSON
        with open(CODES_JSON, 'w', encoding='utf-8') as f:
            json.dump(codes_dict, f, ensure_ascii=False, indent=2)
        
        # Сохраняем в текстовый файл в нужном формате
        with open(CODES_FILE, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("СПИСОК КОДОВ ДОСТУПА СОТРУДНИКОВ\n")
            f.write(f"Обновлено: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
            f.write("=" * 60 + "\n\n")
            
            # Сортируем по фамилии
            sorted_items = sorted(codes_dict.items(), key=lambda x: x[1]['name'])
            
            for phone, data in sorted_items:
                # Записываем в формате "Имя Фамилия" и "Код"
                f.write(f"{data['name']}\n")
                f.write(f"{data['code']}\n")
                f.write("-" * 30 + "\n")
        
        logger.info(f"Коды сохранены. Сотрудников: {len(codes_dict)}")
        return True
        
    except Exception as e:
        logger.error(f"Ошибка сохранения кодов: {e}")
        return False

def get_employee_by_phone(phone):
    """Получает данные сотрудника по номеру телефона"""
    codes = load_codes()
    return codes.get(phone)

def save_employee(phone, name, code):
    """Сохраняет нового сотрудника"""
    codes = load_codes()
    
    codes[phone] = {
        'name': name,
        'code': code,
        'created': datetime.now().strftime('%d.%m.%Y %H:%M:%S'),
        'last_access': datetime.now().strftime('%d.%m.%Y %H:%M:%S')
    }
    
    return save_codes(codes)

def update_last_access(phone):
    """Обновляет время последнего доступа"""
    codes = load_codes()
    if phone in codes:
        codes[phone]['last_access'] = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        save_codes(codes)

# ========================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ========================================

def generate_static_code(length=8):
    """Генерация постоянного кода"""
    alphabet = string.ascii_uppercase + string.digits
    # Исключаем похожие символы
    for char in ['0', 'O', '1', 'I', 'L', '2', 'Z', '5', 'S', '8', 'B']:
        alphabet = alphabet.replace(char, '')
    
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def validate_phone(phone: str) -> str:
    """Очищает и валидирует номер телефона"""
    cleaned = re.sub(r'\D', '', phone)
    
    if cleaned.startswith('8'):
        cleaned = '7' + cleaned[1:]
    
    if cleaned.startswith('7') and len(cleaned) == 11:
        return cleaned
    
    return None

def validate_name(name: str) -> bool:
    """Проверяет корректность имени (должно быть минимум 2 слова)"""
    words = name.strip().split()
    return len(words) >= 2 and all(len(word) >= 2 for word in words)

def format_name(name: str) -> str:
    """Форматирует имя (делает первую букву заглавной)"""
    return ' '.join(word.capitalize() for word in name.split())

# ========================================
# СОСТОЯНИЯ FSM
# ========================================

class RegistrationStates(StatesGroup):
    waiting_phone_input = State()
    waiting_name_input = State()
    phone_verified = State()

# ========================================
# КЛАВИАТУРЫ
# ========================================

def get_main_keyboard():
    """Основная клавиатура"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Отправить контакт", request_contact=True)],
            [KeyboardButton(text="📝 Ввести номер вручную")],
            [KeyboardButton(text="🔑 Мой код доступа")]
        ],
        resize_keyboard=True
    )

def get_cancel_keyboard():
    """Клавиатура с отменой"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="❌ Отменить")]
        ],
        resize_keyboard=True
    )

def get_registration_complete_keyboard():
    """Клавиатура после регистрации"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🔑 Мой код доступа")],
            [KeyboardButton(text="📱 Изменить номер"), KeyboardButton(text="ℹ️ Помощь")]
        ],
        resize_keyboard=True
    )

# ========================================
# ОБРАБОТЧИКИ КОМАНД
# ========================================

@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    """Команда /start - начало работы"""
    await state.clear()
    
    await message.answer(
        "👋 *Добро пожаловать в систему кодов доступа!*\n\n"
        "Я помогу вам:\n"
        "• 📝 Зарегистрироваться и получить постоянный код\n"
        "• 🔑 Напомнить ваш код доступа в любое время\n"
        "• 📱 Сохранить код для доступа к веб-сервису\n\n"
        "Выберите действие:",
        parse_mode="Markdown",
        reply_markup=get_main_keyboard()
    )

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Команда /help - справка"""
    help_text = (
        "📋 *Справка по системе кодов доступа*\n\n"
        
        "*Как зарегистрироваться:*\n"
        "1. Нажмите /start\n"
        "2. Выберите способ ввода номера:\n"
        "   • 📱 Отправить контакт\n"
        "   • 📝 Ввести номер вручную\n"
        "3. Введите имя и фамилию\n"
        "4. Получите постоянный код\n\n"
        
        "*Как получить свой код:*\n"
        "1. Нажмите кнопку «🔑 Мой код доступа»\n"
        "2. Введите номер телефона\n"
        "3. Получите ваш постоянный код\n\n"
        
        "*Важная информация:*\n"
        "• Код выдается **один раз** и **никогда не меняется**\n"
        "• Все данные сохраняются в текстовый файл\n"
        "• Для доступа к веб-сервису используйте этот код\n\n"
        
        "*Формат номера телефона:*\n"
        "• `79991234567`\n"
        "• `+79991234567`\n"
        "• `89991234567`\n\n"
        
        "*Другие команды:*\n"
        "/admin - Административные функции\n"
        "/help - Эта справка"
    )
    await message.answer(help_text, parse_mode="Markdown")

@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    """Команда /admin - административные функции"""
    codes = load_codes()
    
    text = (
        f"👨‍💼 *Административная панель*\n\n"
        f"📊 Статистика:\n"
        f"• Зарегистрировано сотрудников: {len(codes)}\n"
        f"• Последнее обновление: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n\n"
    )
    
    if codes:
        # Последние 5 регистраций
        text += "📝 Последние регистрации:\n"
        sorted_codes = sorted(codes.items(), key=lambda x: x[1]['created'], reverse=True)[:5]
        
        for phone, data in sorted_codes:
            text += f"• {data['name']} ({phone})\n"
            text += f"  Код: `{data['code']}`\n"
            text += f"  Дата: {data['created']}\n\n"
    
    await message.answer(text, parse_mode="Markdown")

# ========================================
# ОСНОВНЫЕ ОБРАБОТЧИКИ
# ========================================

@dp.message(lambda message: message.text == "📱 Отправить контакт")
async def request_contact(message: types.Message, state: FSMContext):
    """Обработка кнопки отправки контакта"""
    await message.answer(
        "Нажмите кнопку ниже, чтобы отправить контакт:",
        reply_markup=ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📱 Поделиться номером", request_contact=True)],
                [KeyboardButton(text="❌ Отменить")]
            ],
            resize_keyboard=True
        )
    )

@dp.message(lambda message: message.text == "📝 Ввести номер вручную")
async def request_phone_manual(message: types.Message, state: FSMContext):
    """Обработка кнопки ручного ввода номера"""
    await message.answer(
        "📱 *Введите ваш номер телефона для регистрации:*\n\n"
        "*Формат:*\n"
        "• `79991234567`\n"
        "• `+79991234567`\n"
        "• `89991234567`\n\n"
        "Номер будет использоваться для входа в систему.",
        parse_mode="Markdown",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(RegistrationStates.waiting_phone_input)

@dp.message(lambda message: message.text == "🔑 Мой код доступа")
async def request_my_code(message: types.Message, state: FSMContext):
    """Обработка кнопки получения своего кода"""
    await message.answer(
        "📱 *Введите ваш номер телефона:*\n\n"
        "Я найду ваш код доступа в системе.",
        parse_mode="Markdown",
        reply_markup=get_cancel_keyboard()
    )
    await state.set_state(RegistrationStates.phone_verified)

@dp.message(lambda message: message.text == "❌ Отменить")
async def cancel_action(message: types.Message, state: FSMContext):
    """Отмена действий"""
    await state.clear()
    await message.answer(
        "Действие отменено.",
        reply_markup=get_main_keyboard()
    )

# Обработка отправленного контакта
@dp.message(lambda message: message.contact is not None)
async def handle_contact(message: types.Message, state: FSMContext):
    """Обработка отправленного контакта"""
    phone = message.contact.phone_number
    normalized_phone = validate_phone(phone)
    
    if not normalized_phone:
        await message.answer(
            "❌ Не удалось распознать номер телефона.\n"
            "Попробуйте ввести номер вручную.",
            reply_markup=get_main_keyboard()
        )
        await state.clear()
        return
    
    await check_employee_and_proceed(message, normalized_phone, state)

# Обработка введенного вручную номера (для регистрации)
@dp.message(RegistrationStates.waiting_phone_input)
async def handle_manual_phone_for_registration(message: types.Message, state: FSMContext):
    """Обработка номера для регистрации"""
    normalized_phone = validate_phone(message.text)
    
    if not normalized_phone:
        await message.answer(
            "❌ *Неверный формат номера*\n\n"
            "Пожалуйста, введите номер в формате:\n"
            "• `79991234567`\n"
            "• `+79991234567`\n\n"
            "Попробуйте еще раз:",
            parse_mode="Markdown",
            reply_markup=get_cancel_keyboard()
        )
        return
    
    await check_employee_and_proceed(message, normalized_phone, state)

# Обработка номера для получения кода
@dp.message(RegistrationStates.phone_verified)
async def handle_phone_for_code(message: types.Message, state: FSMContext):
    """Обработка номера для получения кода"""
    normalized_phone = validate_phone(message.text)
    
    if not normalized_phone:
        await message.answer(
            "❌ *Неверный формат номера*\n\n"
            "Попробуйте еще раз:",
            parse_mode="Markdown",
            reply_markup=get_cancel_keyboard()
        )
        return
    
    await check_employee_and_proceed(message, normalized_phone, state)

async def check_employee_and_proceed(message: types.Message, phone: str, state: FSMContext):
    """Проверяет сотрудника и продолжает процесс"""
    # Проверяем, есть ли сотрудник в системе
    employee = get_employee_by_phone(phone)
    
    if employee:
        # Сотрудник уже зарегистрирован - показываем код
        await show_employee_code(message, phone, employee)
        await state.clear()
    else:
        # Сотрудника нет - начинаем регистрацию
        await state.update_data(phone=phone)
        await message.answer(
            "✅ *Номер принят!*\n\n"
            "📝 Теперь введите ваше *имя и фамилию*:\n\n"
            "*Формат:* Иванов Иван\n"
            "Минимум 2 слова, каждое от 2 букв",
            parse_mode="Markdown",
            reply_markup=get_cancel_keyboard()
        )
        await state.set_state(RegistrationStates.waiting_name_input)

# Обработка ввода имени при регистрации
@dp.message(RegistrationStates.waiting_name_input)
async def handle_name_input(message: types.Message, state: FSMContext):
    """Обработка ввода имени при регистрации"""
    name = message.text.strip()
    
    if not validate_name(name):
        await message.answer(
            "❌ *Неверный формат имени*\n\n"
            "Пожалуйста, введите *имя и фамилию*:\n"
            "• Минимум 2 слова\n"
            "• Каждое слово от 2 букв\n"
            "• Например: *Иванов Иван*\n\n"
            "Попробуйте еще раз:",
            parse_mode="Markdown",
            reply_markup=get_cancel_keyboard()
        )
        return
    
    # Получаем телефон из состояния
    data = await state.get_data()
    phone = data.get('phone')
    
    if not phone:
        await message.answer(
            "❌ Ошибка: номер телефона не найден.\n"
            "Начните регистрацию заново.",
            reply_markup=get_main_keyboard()
        )
        await state.clear()
        return
    
    # Форматируем имя
    formatted_name = format_name(name)
    
    # Регистрируем сотрудника
    await register_employee(message, phone, formatted_name)
    await state.clear()

async def register_employee(message: types.Message, phone: str, name: str):
    """Регистрирует нового сотрудника"""
    # Генерируем код
    code = generate_static_code()
    
    # Сохраняем сотрудника
    if save_employee(phone, name, code):
        await message.answer(
            "🎉 *Регистрация успешно завершена!*\n"
            "━━━━━━━━━━━━━━━━━━━━━",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardRemove()
        )
        
        await message.answer(
            f"✅ *Ваши данные сохранены:*\n\n"
            f"👤 *ФИО:* {name}\n"
            f"📱 *Телефон:* `{phone}`\n\n"
            f"🔐 *ВАШ ПОСТОЯННЫЙ КОД ДОСТУПА:*\n"
            f"```\n{code}\n```\n\n"
            f"📋 *Важная информация:*\n"
            f"• Этот код **никогда не изменится**\n"
            f"• Запомните или сохраните его\n"
            f"• Для входа на веб-сервис используйте этот код\n"
            f"• Для повторного получения нажмите «🔑 Мой код доступа»",
            parse_mode="Markdown"
        )
        
        # Отправляем файл с кодами
        if CODES_FILE.exists():
            with open(CODES_FILE, 'rb') as f:
                await message.answer_document(
                    types.BufferedInputFile(f.read(), filename="codes.txt"),
                    caption="📁 Общий файл со всеми кодами"
                )
        
        await message.answer(
            "Теперь вы можете получить ваш код в любое время!",
            reply_markup=get_registration_complete_keyboard()
        )
        
        logger.info(f"Зарегистрирован новый сотрудник: {name} ({phone}) - код: {code}")
    else:
        await message.answer(
            "❌ *Ошибка сохранения данных*\n\n"
            "Попробуйте еще раз или обратитесь к администратору.",
            parse_mode="Markdown",
            reply_markup=get_main_keyboard()
        )

async def show_employee_code(message: types.Message, phone: str, employee_data: dict):
    """Показывает код существующего сотрудника"""
    # Обновляем время последнего доступа
    update_last_access(phone)
    
    await message.answer(
        "✅ *Найден ваш код доступа!*\n"
        "━━━━━━━━━━━━━━━━━━━━━",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove()
    )
    
    await message.answer(
        f"👤 *ФИО:* {employee_data['name']}\n"
        f"📱 *Телефон:* `{phone}`\n\n"
        f"🔐 *ВАШ КОД ДОСТУПА:*\n"
        f"```\n{employee_data['code']}\n```\n\n"
        f"📅 *Зарегистрирован:* {employee_data['created']}\n"
        f"🕐 *Последний доступ:* {employee_data.get('last_access', 'нет данных')}\n\n"
        f"⚡ *Код постоянный и никогда не изменится!*",
        parse_mode="Markdown"
    )
    
    await message.answer(
        "Для получения кода в будущем используйте кнопку «🔑 Мой код доступа»",
        reply_markup=get_registration_complete_keyboard()
    )
    
    logger.info(f"Показан код для {employee_data['name']} ({phone})")

# ========================================
# ЗАПУСК БОТА
# ========================================

async def main():
    """Основная функция запуска бота"""
    logger.info("=" * 50)
    logger.info("Бот с регистрацией сотрудников запускается")
    logger.info(f"Файл кодов: {CODES_FILE}")
    logger.info("=" * 50)
    
    # Загружаем существующие коды
    codes = load_codes()
    logger.info(f"Загружено сотрудников: {len(codes)}")
    
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Ошибка: {e}")
    finally:
        await bot.session.close()

if __name__ == '__main__':
    # Простой запуск
    if not os.getenv('BOT_TOKEN'):
        print("=" * 60)
        print("БОТ РЕГИСТРАЦИИ СОТРУДНИКОВ")
        print("=" * 60)
        print("📁 Данные сохраняются в папке: data/")
        print("📄 Файл с кодами: employee_codes.txt")
        print("\nФормат файла:")
        print("  Иванов Иван")
        print("  ABCDEF12")
        print("  ------------------------------")
        print()
        
        token = input("Введите токен бота от @BotFather: ").strip()
        if token:
            BOT_TOKEN = token
            bot = Bot(token=BOT_TOKEN)
        else:
            print("❌ Токен не введен.")
            exit(1)
    
    print("\n✅ Бот запускается...")
    print("📝 Система регистрации сотрудников")
    print("🔐 Постоянные коды доступа")
    print("\nДля остановки нажмите Ctrl+C")
    print("=" * 60)
    
    asyncio.run(main())