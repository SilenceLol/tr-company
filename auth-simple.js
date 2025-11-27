// Упрощенная версия авторизации для NORD WHEEL
document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Auth - Simple version loaded');

    // Проверяем, есть ли активная сессия
    checkExistingSession();

    // Фокус на поле ввода кода
    const codeInput = document.getElementById('employeeCode');
    if (codeInput) {
        setTimeout(() => codeInput.focus(), 500);

        // Автозаполнение "EMP" при вводе
        codeInput.addEventListener('input', function(e) {
            let value = e.target.value.toUpperCase();
            // Удаляем все небуквенные и нецифровые символы
            value = value.replace(/[^A-Z0-9]/g, '');

            // Автоматически добавляем EMP если ввод начинается с цифр
            if (/^\d/.test(value) && value.length <= 3) {
                value = 'EMP' + value;
            }

            // Ограничиваем длину
            if (value.length > 6) {
                value = value.substring(0, 6);
            }

            e.target.value = value;
        });

        // Обработка Enter
        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                manualAuth();
            }
        });

        // Валидация при потере фокуса
        codeInput.addEventListener('blur', function(e) {
            validateEmployeeCode(e.target.value);
        });
    }
});

// Проверка существующей сессии
function checkExistingSession() {
    const authData = localStorage.getItem('employeeAuth');
    if (authData) {
        try {
            const employee = JSON.parse(authData);
            const loginTime = new Date(employee.loginTime);
            const currentTime = new Date();
            const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);

            // Если сессия активна менее 8 часов, показываем информацию
            if (hoursDiff < 8) {
                showAuthStatus(`Активна сессия: ${employee.name}`, 'loading');
                setTimeout(() => {
                    showAuthStatus('Нажмите "Войти" для продолжения', 'loading');
                }, 2000);
            } else {
                // Сессия истекла
                localStorage.removeItem('employeeAuth');
            }
        } catch (e) {
            localStorage.removeItem('employeeAuth');
        }
    }
}

// Валидация кода сотрудника
function validateEmployeeCode(code) {
    if (!code) return true;

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode.match(/^EMP\d{3}$/)) {
        showAuthStatus('Неверный формат. Используйте: EMP001', 'error');
        return false;
    }

    showAuthStatus('Формат кода верный', 'success');
    setTimeout(() => {
        const statusElement = document.getElementById('authStatus');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'auth-status';
        }
    }, 2000);

    return true;
}

// Открытие камеры устройства
function openCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        showAuthStatus('Запрос доступа к камере...', 'loading');

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                showAuthStatus('Камера доступна! Сфотографируйте QR-код', 'success');

                // Здесь можно добавить логику для обработки фото с QR-кодом
                // В упрощенной версии просто закрываем камеру и предлагаем ручной ввод
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    showAuthStatus('Сфотографируйте QR-код и введите код вручную', 'loading');
                }, 3000);
            })
            .catch(function(error) {
                console.error('Camera error:', error);
                let errorMessage = 'Не удалось получить доступ к камере';

                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'Камера не найдена на устройстве';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = 'Браузер не поддерживает доступ к камере';
                }

                showAuthStatus(errorMessage, 'error');
            });
    } else {
        showAuthStatus('Ваш браузер не поддерживает доступ к камере', 'error');
    }
}

// Ручная авторизация по коду
function manualAuth() {
    const codeInput = document.getElementById('employeeCode');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showAuthStatus('Введите код сотрудника', 'error');
        codeInput.focus();
        return;
    }

    if (!code.match(/^EMP\d{3}$/)) {
        showAuthStatus('Неверный формат кода. Пример: EMP001', 'error');
        codeInput.focus();
        codeInput.select();
        return;
    }

    authenticateEmployee(code);
}

// Использование демо-кода
function useDemoCode(code) {
    const codeInput = document.getElementById('employeeCode');
    codeInput.value = code;
    codeInput.focus();
    showAuthStatus(`Демо-код "${code}" установлен. Нажмите "Войти"`, 'loading');
}

// Аутентификация сотрудника
function authenticateEmployee(employeeCode) {
    showAuthStatus('Проверка кода...', 'loading');

    // Имитация проверки кода (в реальном приложении здесь был бы запрос к серверу)
    setTimeout(() => {
        const demoEmployees = {
            'EMP001': {
                id: 'EMP001',
                name: 'Иванов Алексей',
                position: 'Старший кладовщик',
                department: 'Склад №1'
            },
            'EMP002': {
                id: 'EMP002',
                name: 'Петрова Мария',
                position: 'Оператор погрузчика',
                department: 'Склад №2'
            },
            'EMP003': {
                id: 'EMP003',
                name: 'Сидоров Дмитрий',
                position: 'Грузчик',
                department: 'Отгрузка'
            }
        };

        const employee = demoEmployees[employeeCode];

        if (employee) {
            // Добавляем информацию о сессии
            employee.loginTime = new Date().toISOString();
            employee.loginTimeDisplay = new Date().toLocaleString('ru-RU');
            employee.sessionId = 'SESS_' + Date.now();

            // Сохраняем данные авторизации
            localStorage.setItem('employeeAuth', JSON.stringify(employee));

            showAuthStatus(`Успешный вход! Добро пожаловать, ${employee.name}`, 'success');

            // Показываем детали перед перенаправлением
            setTimeout(() => {
                showAuthStatus(`Перенаправление в систему...`, 'loading');

                // Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = 'cargo.html';
                }, 1500);
            }, 1000);

        } else {
            showAuthStatus('Код сотрудника не найден в системе', 'error');

            // Сбрасываем поле ввода
            const codeInput = document.getElementById('employeeCode');
            codeInput.focus();
            codeInput.select();
        }
    }, 1500);
}

// Показать статус авторизации
function showAuthStatus(message, type) {
    const statusElement = document.getElementById('authStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `auth-status ${type}`;

        // Автоскрытие сообщений об ошибках и успехах
        if (type === 'error' || type === 'success') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = '';
                    statusElement.className = 'auth-status';
                }
            }, type === 'error' ? 5000 : 3000);
        }
    }

    // Логируем в консоль
    console.log(`Auth Status [${type}]: ${message}`);
}

// ==================== ФУНКЦИИ ДЛЯ CARGO.HTML ====================

// Проверка авторизации для cargo.html
function checkAuth() {
    const authData = localStorage.getItem('employeeAuth');

    if (!authData) {
        window.location.href = 'index.html';
        return false;
    }

    try {
        const employee = JSON.parse(authData);
        const loginTime = new Date(employee.loginTime);
        const currentTime = new Date();
        const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);

        // Авторизация действительна 8 часов
        if (hoursDiff >= 8) {
            localStorage.removeItem('employeeAuth');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    } catch (e) {
        localStorage.removeItem('employeeAuth');
        window.location.href = 'index.html';
        return false;
    }
}

// Обновление информации о сотруднике
function updateEmployeeInfo() {
    const authData = localStorage.getItem('employeeAuth');

    if (authData) {
        try {
            const employee = JSON.parse(authData);
            const employeeNameElement = document.getElementById('employeeName');
            if (employeeNameElement) {
                employeeNameElement.textContent = employee.name;
            }
        } catch (e) {
            console.error('Error updating employee info:', e);
        }
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        const authData = localStorage.getItem('employeeAuth');
        if (authData) {
            try {
                const employee = JSON.parse(authData);
                console.log(`User ${employee.name} logged out`);
            } catch (e) {
                console.error('Error during logout:', e);
            }
        }

        localStorage.removeItem('employeeAuth');
        localStorage.removeItem('cargoList'); // Очищаем данные грузов при выходе
        window.location.href = 'index.html';
    }
}

// Глобальный экспорт функций
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.openCamera = openCamera;
window.logout = logout;

console.log('NORD WHEEL Simple Auth initialized successfully');