#!/usr/bin/env python3
"""
Telegram бот для регистрации сотрудников
Работает локально, автоматически коммитит в Git
"""

import os
import json
import random
import string
import subprocess
import logging
from datetime import datetime
from pathlib import Path

import telebot
from telebot import types

# ========================================
# НАСТРОЙКИ
# ========================================

# Включаем логирование для отладки
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Получаем токен из файла .env или напрямую
BOT_TOKEN = "8535867471:AAFY7X12sWghRM6afK44r2bLpW9IYBSSkf0"  # Замените на ваш токен

# Инициализация бота
bot = telebot.TeleBot(BOT_TOKEN)

# Пути к файлам
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
CODES_FILE = DATA_DIR / "employee_codes.json"
TXT_FILE = DATA_DIR / "employee_codes.txt"

# Настройки Git
GIT_REPO = Path(".")  # Текущая папка
GIT_USER = "SilenceLol"  # Ваше имя для Git
GIT_EMAIL = "Silence8405@yandex.ru"  # Ваш email для Git

# Храним состояния пользователей
user_states = {}

# ========================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ + GIT
# ========================================

def setup_git():
    """Настраивает Git если не настроен"""
    try:
        # Проверяем настройки пользователя
        result = subprocess.run(
            ["git", "config", "user.name"],
            capture_output=True,
            text=True,
            cwd=GIT_REPO
        )
        
        if not result.stdout.strip():
            # Настраиваем Git
            subprocess.run(["git", "config", "user.name", GIT_USER], cwd=GIT_REPO)
            subprocess.run(["git", "config", "user.email", GIT_EMAIL], cwd=GIT_REPO)
            logger.info("✅ Git настроен")
    except Exception as e:
        logger.error(f"⚠️  Ошибка настройки Git: {e}")

def git_commit_and_push(message="Обновление данных сотрудников"):
    """Автоматически коммитит и пушит изменения"""
    try:
        # Проверяем, есть ли изменения в папке data
        status_result = subprocess.run(
            ["git", "status", "--porcelain", "data/"],
            capture_output=True,
            text=True,
            cwd=GIT_REPO
        )
        
        if not status_result.stdout.strip():
            logger.info("ℹ️  Нет изменений в папке data для коммита")
            return True
        
        # Добавляем только файлы из data
        subprocess.run(["git", "add", "data/"], cwd=GIT_REPO, check=True)
        
        # Коммитим
        commit_result = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=GIT_REPO,
            capture_output=True,
            text=True
        )
        
        if commit_result.returncode != 0:
            logger.warning(f"⚠️  Не удалось сделать коммит: {commit_result.stderr}")
            return False
        
        logger.info(f"✅ Коммит создан: {message}")
        
        # Пушим
        push_result = subprocess.run(
            ["git", "push"],
            cwd=GIT_REPO,
            capture_output=True,
            text=True
        )
        
        if push_result.returncode == 0:
            logger.info("✅ Изменения загружены на GitHub")
            return True
        else:
            logger.warning(f"⚠️  Не удалось запушить: {push_result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Ошибка Git: {e}")
        return False

def load_codes():
    """Загружает коды из файла"""
    if CODES_FILE.exists():
        try:
            with open(CODES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки файла {CODES_FILE}: {e}")
            return {}
    return {}

def save_codes(codes, commit_to_git=True):
    """Сохраняет коды и коммитит в Git"""
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
        
        logger.info(f"✅ Сохранено {len(codes)} сотрудников")
        
        # Коммитим в Git если нужно
        if commit_to_git and len(codes) > 0:
            employee_names = [data['name'] for data in codes.values()][-3:]  # Последние 3
            commit_message = f"Добавлены сотрудники: {', '.join(employee_names)}" if employee_names else "Обновление данных сотрудников"
            git_commit_and_push(commit_message)
        
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка сохранения: {e}")
        return False

def generate_code(length=8):
    """Генерирует код"""
    chars = string.ascii_uppercase.replace('O', '').replace('I', '') + '23456789'
    return ''.join(random.choice(chars) for _ in range(length))

def normalize_phone(phone: str) -> str:
    """Нормализует номер телефона"""
    digits = ''.join(filter(str.isdigit, phone))
    
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    
    if digits.startswith('7') and len(digits) == 11:
        return digits
    
    return None

def check_phone_format(phone: str) -> bool:
    """Проверяет формат телефона"""
    normalized = normalize_phone(phone)
    return normalized is not None

# ========================================
# ОСНОВНОЙ КОД БОТА
# ========================================

@bot.message_handler(commands=['start'])
def cmd_start(message):
    logger.info(f"👤 /start от пользователя {message.chat.id} ({message.chat.first_name})")
    
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    keyboard.add(
        types.KeyboardButton("📱 Отправить контакт", request_contact=True),
        types.KeyboardButton("📝 Ввести номер вручную"),
        types.KeyboardButton("🔑 Получить мой код")
    )
    
    bot.send_message(
        message.chat.id,
        "👋 <b>Добро пожаловать в бот регистрации сотрудников!</b>\n\n"
        "Выберите действие:\n"
        "• 📱 <b>Отправить контакт</b> - автоматическая регистрация\n"
        "• 📝 <b>Ввести номер вручную</b> - для регистрации другого сотрудника\n"
        "• 🔑 <b>Получить мой код</b> - если уже зарегистрирован\n\n"
        "Бот работает локально, данные автоматически сохраняются в Git.",
        parse_mode='HTML',
        reply_markup=keyboard
    )

@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    """Обработка отправленного контакта"""
    logger.info(f"📱 Получен контакт от {message.chat.id}")
    
    try:
        contact = message.contact
        user_id = str(message.chat.id)
        
        if contact.phone_number:
            # Нормализуем номер телефона
            phone = normalize_phone(contact.phone_number)
            
            if not phone:
                bot.send_message(
                    message.chat.id,
                    "❌ <b>Неверный формат номера телефона!</b>\n"
                    "Пожалуйста, введите номер вручную.",
                    parse_mode='HTML'
                )
                return
            
            # Проверяем, есть ли уже такой номер
            codes = load_codes()
            
            if phone in codes:
                # Пользователь уже зарегистрирован
                data = codes[phone]
                bot.send_message(
                    message.chat.id,
                    f"✅ <b>Вы уже зарегистрированы!</b>\n\n"
                    f"👤 Имя: <b>{data['name']}</b>\n"
                    f"📱 Телефон: <b>+{phone}</b>\n"
                    f"🔑 Код доступа: <b>{data['code']}</b>\n\n"
                    f"Сохраните этот код в надежном месте!",
                    parse_mode='HTML'
                )
            else:
                # Регистрируем нового пользователя
                user_states[user_id] = {'phone': phone, 'step': 'waiting_for_name'}
                bot.send_message(
                    message.chat.id,
                    "✅ <b>Контакт получен!</b>\n\n"
                    "Теперь введите <b>имя и фамилию</b> сотрудника:",
                    parse_mode='HTML'
                )
        else:
            bot.send_message(
                message.chat.id,
                "❌ <b>Не удалось получить номер телефона из контакта.</b>\n"
                "Пожалуйста, разрешите доступ к номеру или введите вручную.",
                parse_mode='HTML'
            )
            
    except Exception as e:
        logger.error(f"❌ Ошибка обработки контакта: {e}")
        bot.send_message(
            message.chat.id,
            "❌ <b>Произошла ошибка при обработке контакта.</b>\n"
            "Пожалуйста, попробуйте еще раз.",
            parse_mode='HTML'
        )

@bot.message_handler(func=lambda message: message.text == "📱 Отправить контакт")
def handle_send_contact_button(message):
    """Обработка кнопки 'Отправить контакт'"""
    logger.info(f"📱 Нажата кнопка 'Отправить контакт' от {message.chat.id}")
    
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(types.KeyboardButton("📱 Поделиться контактом", request_contact=True))
    keyboard.add(types.KeyboardButton("↩️ Назад"))
    
    bot.send_message(
        message.chat.id,
        "Нажмите на кнопку 👇 чтобы поделиться контактом\n\n"
        "Или нажмите 'Назад' для возврата в меню",
        reply_markup=keyboard
    )

@bot.message_handler(func=lambda message: message.text == "📝 Ввести номер вручную")
def handle_manual_phone_button(message):
    """Обработка кнопки 'Ввести номер вручную'"""
    logger.info(f"📝 Нажата кнопка 'Ввести номер вручную' от {message.chat.id}")
    
    user_id = str(message.chat.id)
    user_states[user_id] = {'step': 'waiting_for_phone_manual'}
    
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(types.KeyboardButton("↩️ Назад"))
    
    bot.send_message(
        message.chat.id,
        "📱 <b>Введите номер телефона:</b>\n\n"
        "Формат: <b>+7XXXYYYZZZZ</b> или <b>8XXXYYYZZZZ</b>\n"
        "Например: +79161234567 или 89161234567\n\n"
        "Или нажмите 'Назад' для возврата в меню",
        parse_mode='HTML',
        reply_markup=keyboard
    )

@bot.message_handler(func=lambda message: message.text == "🔑 Получить мой код")
def handle_get_code_button(message):
    """Обработка кнопки 'Получить мой код'"""
    logger.info(f"🔑 Нажата кнопка 'Получить мой код' от {message.chat.id}")
    
    user_id = str(message.chat.id)
    user_states[user_id] = {'step': 'waiting_for_phone_for_code'}
    
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(types.KeyboardButton("↩️ Назад"))
    
    bot.send_message(
        message.chat.id,
        "📱 <b>Введите номер телефона для получения кода:</b>\n\n"
        "Формат: <b>+7XXXYYYZZZZ</b> или <b>8XXXYYYZZZZ</b>\n"
        "Например: +79161234567 или 89161234567\n\n"
        "Или нажмите 'Назад' для возврата в меню",
        parse_mode='HTML',
        reply_markup=keyboard
    )

@bot.message_handler(func=lambda message: message.text == "↩️ Назад")
def handle_back_button(message):
    """Обработка кнопки 'Назад'"""
    logger.info(f"↩️ Нажата кнопка 'Назад' от {message.chat.id}")
    user_id = str(message.chat.id)
    if user_id in user_states:
        del user_states[user_id]
    show_main_menu(message.chat.id)

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    """Обработка всех текстовых сообщений"""
    logger.info(f"💬 Сообщение от {message.chat.id}: {message.text}")
    
    user_id = str(message.chat.id)
    text = message.text.strip()
    
    # Проверяем состояние пользователя
    if user_id in user_states:
        state = user_states[user_id]
        
        if state['step'] == 'waiting_for_phone_manual':
            # Обработка номера телефона, введенного вручную
            if check_phone_format(text):
                phone = normalize_phone(text)
                codes = load_codes()
                
                if phone in codes:
                    # Номер уже зарегистрирован
                    data = codes[phone]
                    bot.send_message(
                        message.chat.id,
                        f"❌ <b>Этот номер уже зарегистрирован!</b>\n\n"
                        f"👤 Имя: <b>{data['name']}</b>\n"
                        f"🔑 Код: <b>{data['code']}</b>\n\n"
                        "Если это ваша учетная запись, нажмите '🔑 Получить мой код'",
                        parse_mode='HTML'
                    )
                    del user_states[user_id]
                    show_main_menu(message.chat.id)
                else:
                    # Запрашиваем имя
                    state['phone'] = phone
                    state['step'] = 'waiting_for_name'
                    bot.send_message(
                        message.chat.id,
                        "✅ <b>Номер телефона принят!</b>\n\n"
                        "Теперь введите <b>имя и фамилию</b> сотрудника:",
                        parse_mode='HTML'
                    )
            else:
                bot.send_message(
                    message.chat.id,
                    "❌ <b>Неверный формат номера!</b>\n\n"
                    "Пожалуйста, введите номер в формате:\n"
                    "<b>+7XXXYYYZZZZ</b> или <b>8XXXYYYZZZZ</b>\n"
                    "Например: +79161234567 или 89161234567",
                    parse_mode='HTML'
                )
        
        elif state['step'] == 'waiting_for_name':
            # Обработка имени сотрудника
            if len(text) < 2:
                bot.send_message(
                    message.chat.id,
                    "❌ <b>Имя слишком короткое!</b>\n"
                    "Пожалуйста, введите полное имя и фамилию:",
                    parse_mode='HTML'
                )
                return
            
            # Генерируем код
            code = generate_code()
            phone = state['phone']
            
            # Сохраняем в базу
            codes = load_codes()
            codes[phone] = {
                'name': text,
                'code': code,
                'date': datetime.now().strftime('%d.%m.%Y %H:%M:%S'),
                'registered_by': user_id
            }
            
            save_codes(codes)
            
            # Отправляем результат
            bot.send_message(
                message.chat.id,
                f"🎉 <b>Регистрация завершена успешно!</b>\n\n"
                f"👤 <b>Сотрудник:</b> {text}\n"
                f"📱 <b>Телефон:</b> +{phone}\n"
                f"🔑 <b>Код доступа:</b> <code>{code}</code>\n\n"
                f"⚠️ <b>Сохраните этот код!</b> Он больше не будет показан.",
                parse_mode='HTML'
            )
            
            # Показываем основное меню
            show_main_menu(message.chat.id)
            del user_states[user_id]
        
        elif state['step'] == 'waiting_for_phone_for_code':
            # Поиск кода по номеру телефона
            if check_phone_format(text):
                phone = normalize_phone(text)
                codes = load_codes()
                
                if phone in codes:
                    data = codes[phone]
                    bot.send_message(
                        message.chat.id,
                        f"✅ <b>Код найден!</b>\n\n"
                        f"👤 <b>Сотрудник:</b> {data['name']}\n"
                        f"📱 <b>Телефон:</b> +{phone}\n"
                        f"🔑 <b>Код доступа:</b> <code>{data['code']}</code>\n\n"
                        f"⚠️ <b>Сохраните этот код!</b>",
                        parse_mode='HTML'
                    )
                else:
                    bot.send_message(
                        message.chat.id,
                        f"❌ <b>Номер не найден!</b>\n\n"
                        f"Телефон +{phone} не зарегистрирован.\n"
                        f"Пожалуйста, зарегистрируйтесь через меню.",
                        parse_mode='HTML'
                    )
                
                show_main_menu(message.chat.id)
                del user_states[user_id]
            else:
                bot.send_message(
                    message.chat.id,
                    "❌ <b>Неверный формат номера!</b>\n\n"
                    "Пожалуйста, введите номер в формате:\n"
                    "<b>+7XXXYYYZZZZ</b> или <b>8XXXYYYZZZZ</b>\n"
                    "Например: +79161234567 или 89161234567",
                    parse_mode='HTML'
                )
    else:
        # Если нет состояния, показываем главное меню
        show_main_menu(message.chat.id)

def show_main_menu(chat_id):
    """Показывает главное меню"""
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    keyboard.add(
        types.KeyboardButton("📱 Отправить контакт", request_contact=True),
        types.KeyboardButton("📝 Ввести номер вручную"),
        types.KeyboardButton("🔑 Получить мой код")
    )
    
    bot.send_message(
        chat_id,
        "Выберите действие:",
        reply_markup=keyboard
    )

# ========================================
# ЗАПУСК БОТА С GIT СИНХРОНИЗАЦИЕЙ
# ========================================

if __name__ == '__main__':
    print("=" * 50)
    print("🤖 Telegram Employee Bot (Локальная версия)")
    print("=" * 50)
    print("📁 Данные сохраняются локально и в Git")
    print(f"📄 Файл: {TXT_FILE}")
    
    # Настраиваем Git
    setup_git()
    
    # Загружаем существующие коды
    codes = load_codes()
    print(f"📊 Загружено сотрудников: {len(codes)}")
    
    # Проверяем Git статус только для папки data
    try:
        git_status = subprocess.run(
            ["git", "status", "--porcelain", "data/"],
            capture_output=True,
            text=True,
            cwd=GIT_REPO
        )
        
        if git_status.stdout.strip():
            print("🔄 Есть несохраненные изменения в папке data")
            git_commit_and_push("Автоматическое обновление при запуске")
        else:
            print("✅ В папке data нет несохраненных изменений")
    except Exception as e:
        print(f"⚠️  Не удалось проверить Git статус: {e}")
    
    print("=" * 50)
    print("🚀 Бот запускается локально...")
    print("✅ Данные будут автоматически коммититься в Git")
    print("⏹️  Для остановки нажмите Ctrl+C")
    print("=" * 50)
    
    try:
        # Запускаем бота с логированием
        print("\n🔄 Бот запущен. Ожидание сообщений...")
        bot.infinity_polling()
    except KeyboardInterrupt:
        print("\n\n⏹️  Бот остановлен пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка запуска бота: {e}")
