// db-config.js - КОНФИГУРАЦИЯ ДЛЯ БУДУЩЕЙ SQL БАЗЫ

const DB_CONFIG = {
    // Настройки для подключения к SQL базе
    connection: {
        host: 'localhost', // Измените на ваш сервер
        port: 3306,
        user: 'your_username',
        password: 'your_password',
        database: 'nord_wheel_db'
    },
    
    // Структура таблиц
    tables: {
        employees: {
            name: 'employees',
            columns: {
                id: 'VARCHAR(20) PRIMARY KEY',
                name: 'VARCHAR(100) NOT NULL',
                position: 'VARCHAR(50)',
                department: 'VARCHAR(50)',
                created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
            }
        },
        
        shipments: {
            name: 'shipments',
            columns: {
                id: 'INT AUTO_INCREMENT PRIMARY KEY',
                employee_id: 'VARCHAR(20)',
                shipment_date: 'DATE',
                shipment_time: 'TIME',
                total_items: 'INT',
                total_weight: 'DECIMAL(10,2)',
                total_volume: 'DECIMAL(10,2)',
                status: 'VARCHAR(20) DEFAULT "pending"',
                created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                FOREIGN_KEY: 'FOREIGN KEY (employee_id) REFERENCES employees(id)'
            }
        },
        
        cargo_items: {
            name: 'cargo_items',
            columns: {
                id: 'INT AUTO_INCREMENT PRIMARY KEY',
                shipment_id: 'INT',
                cargo_type: 'VARCHAR(50)',
                weight: 'DECIMAL(10,2)',
                length: 'INT',
                width: 'INT',
                height: 'INT',
                volume: 'DECIMAL(10,2)',
                quantity: 'INT',
                photo_url: 'TEXT',
                created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                FOREIGN_KEY: 'FOREIGN KEY (shipment_id) REFERENCES shipments(id)'
            }
        }
    },
    
    // API endpoints (пример)
    api: {
        baseUrl: 'http://your-server.com/api',
        endpoints: {
            auth: '/auth/verify',
            shipments: '/shipments',
            employees: '/employees'
        }
    }
};

// Функция для проверки авторизации через API
async function verifyEmployee(code) {
    try {
        // Пример запроса к API
        const response = await fetch(`${DB_CONFIG.api.baseUrl}${DB_CONFIG.api.endpoints.auth}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employeeCode: code })
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Ошибка проверки сотрудника:', error);
        return null;
    }
}

// Функция для отправки данных о грузах
async function sendShipmentData(shipmentData) {
    try {
        const response = await fetch(`${DB_CONFIG.api.baseUrl}${DB_CONFIG.api.endpoints.shipments}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
        return false;
    }
}

// Экспорт
window.DB_CONFIG = DB_CONFIG;
window.verifyEmployee = verifyEmployee;
window.sendShipmentData = sendShipmentData;