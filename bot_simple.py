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
from datetime import datetime
from pathlib import Path

import telebot
from telebot import types

# ========================================
# НАСТРОЙКИ
# ========================================

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
GIT_USER = "Ваше Имя"  # Ваше имя для Git
GIT_EMAIL = "ваш@email.com"  # Ваш email для Git

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
            print("✅ Git настроен")
    except Exception as e:
        print(f"⚠️  Ошибка настройки Git: {e}")

def git_commit_and_push(message="Обновление данных сотрудников"):
    """Автоматически коммитит и пушит изменения"""
    try:
        # Добавляем файлы
        subprocess.run(["git", "add", "data/"], cwd=GIT_REPO, check=True)
        
        # Коммитим
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=GIT_REPO,
            check=True
        )
        
        # Пушим
        result = subprocess.run(
            ["git", "push"],
            cwd=GIT_REPO,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Изменения загружены на GitHub")
            return True
        else:
            print(f"⚠️  Не удалось запушить: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка Git: {e}")
        return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def load_codes():
    """Загружает коды из файла"""
    if CODES_FILE.exists():
        try:
            with open(CODES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
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
        
        print(f"✅ Сохранено {len(codes)} сотрудников")
        
        # Коммитим в Git если нужно
        if commit_to_git:
            employee_names = [data['name'] for data in codes.values()][-3:]  # Последние 3
            commit_message = f"Добавлены сотрудники: {', '.join(employee_names)}"
            git_commit_and_push(commit_message)
        
        return True
    except Exception as e:
        print(f"❌ Ошибка сохранения: {e}")
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

# ========================================
# ОСНОВНОЙ КОД БОТА (такой же как раньше)
# ========================================

# [Вставьте сюда весь код обработчиков из предыдущего сообщения]
# Кнопки /start, регистрация, получение кода и т.д.
# Сохраните этот код отдельно и добавьте сюда

# Для примера - минимальные обработчики:
@bot.message_handler(commands=['start'])
def cmd_start(message):
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    keyboard.add(
        types.KeyboardButton("📱 Отправить контакт", request_contact=True),
        types.KeyboardButton("📝 Ввести номер вручную"),
        types.KeyboardButton("🔑 Получить мой код")
    )
    
    bot.send_message(
        message.chat.id,
        "👋 <b>Бот работает на локальном компьютере!</b>\n\n"
        "Данные автоматически сохраняются в Git.",
        parse_mode='HTML',
        reply_markup=keyboard
    )

# ... остальные обработчики из предыдущего кода ...

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
    
    # Проверяем Git статус
    try:
        git_status = subprocess.run(
            ["git", "status"],
            capture_output=True,
            text=True,
            cwd=GIT_REPO
        )
        if "nothing to commit" not in git_status.stdout:
            print("🔄 Есть несохраненные изменения в Git")
            git_commit_and_push("Автоматическое обновление при запуске")
    except:
        print("⚠️  Не удалось проверить Git статус")
    
    print("=" * 50)
    print("🚀 Бот запускается локально...")
    print("✅ Данные будут автоматически коммититься в Git")
    print("⏹️  Для остановки нажмите Ctrl+C")
    print("=" * 50)
    
    # Запускаем бота
    bot.infinity_polling()