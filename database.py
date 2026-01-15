import asyncpg
from datetime import datetime, timedelta
from config import config
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool = None
    
    async def connect(self):
        """Создание пула соединений с БД"""
        try:
            self.pool = await asyncpg.create_pool(
                dsn=config.DATABASE_URL,
                min_size=1,
                max_size=10
            )
            logger.info("Database connected successfully")
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
    
    async def close(self):
        """Закрытие соединений"""
        if self.pool:
            await self.pool.close()
    
    async def get_employee_by_phone(self, phone: str):
        """Поиск сотрудника по номеру телефона"""
        query = """
            SELECT id, phone, full_name, is_active 
            FROM employees 
            WHERE phone = $1 AND is_active = true
        """
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, phone)
    
    async def create_access_code(self, employee_id: int, code: str, expires_at: datetime):
        """Создание нового кода доступа"""
        query = """
            INSERT INTO access_codes (employee_id, code, expires_at)
            VALUES ($1, $2, $3)
            RETURNING id, code, expires_at
        """
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, employee_id, code, expires_at)
    
    async def invalidate_old_codes(self, employee_id: int):
        """Деактивация старых неиспользованных кодов сотрудника"""
        query = """
            UPDATE access_codes 
            SET is_used = true 
            WHERE employee_id = $1 
            AND is_used = false 
            AND expires_at > NOW()
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, employee_id)
    
    async def get_active_codes(self, employee_id: int):
        """Получение активных кодов сотрудника"""
        query = """
            SELECT code, created_at, expires_at 
            FROM access_codes 
            WHERE employee_id = $1 
            AND is_used = false 
            AND expires_at > NOW()
            ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, employee_id)
    
    async def is_code_valid(self, code: str):
        """Проверка валидности кода"""
        query = """
            SELECT ac.*, e.full_name 
            FROM access_codes ac
            JOIN employees e ON e.id = ac.employee_id
            WHERE ac.code = $1 
            AND ac.is_used = false 
            AND ac.expires_at > NOW()
        """
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, code.upper())
    
    async def mark_code_used(self, code_id: int):
        """Пометка кода как использованного"""
        query = "UPDATE access_codes SET is_used = true WHERE id = $1"
        async with self.pool.acquire() as conn:
            await conn.execute(query, code_id)

db = Database()