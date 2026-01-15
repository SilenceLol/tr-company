// auth-dynamic.js - Динамическая авторизация с загрузкой кодов из файла

let EMPLOYEE_DATABASE = {};

// Функция загрузки и парсинга файла с кодами
async function loadEmployeeCodes() {
    try {
        console.log('Загрузка кодов сотрудников...');
        
        // Пробуем разные способы загрузки файла
        let employeeData = null;
        
        // Способ 1: Загрузка через fetch (если файл доступен по URL)
        try {
            const response = await fetch('data/employee_codes.txt');
            if (response.ok) {
                employeeData = await response.text();
                console.log('Файл загружен через fetch');
            }
        } catch (fetchError) {
            console.log('Не удалось загрузить через fetch, пробуем другой способ...');
        }
        
        // Способ 2: Если файл уже есть в переменной (например, загружен через PHP)
        if (!employeeData && window.employeeCodesRaw) {
            employeeData = window.employeeCodesRaw;
            console.log('Используем данные из window.employeeCodesRaw');
        }
        
        // Способ 3: Fallback - встроенные данные
        if (!employeeData) {
            employeeData = `============================================================
СПИСОК КОДОВ ДОСТУПА СОТРУДНИКОВ
Обновлено: 15.01.2026 09:54:24
============================================================

Леонтьев Дмитрий
K9CM4CRF
------------------------------`;
            console.log('Используем fallback данные');
        }
        
        // Парсим данные
        parseEmployeeData(employeeData);
        
        console.log('База сотрудников загружена:', Object.keys(EMPLOYEE_DATABASE).length, 'сотрудников');
        
    } catch (error) {
        console.error('Ошибка загрузки кодов:', error);
        // Используем fallback базу данных
        loadFallbackDatabase();
    }
}

// Парсинг текстовых данных сотрудников
function parseEmployeeData(text) {
    EMPLOYEE_DATABASE = {};
    
    // Разделяем текст на строки
    const lines = text.split('\n');
    let currentEmployee = null;
    
    lines.forEach(line => {
        // Убираем лишние пробелы
        line = line.trim();
        
        // Пропускаем разделители и заголовки
        if (!line || line.includes('===') || line.includes('СПИСОК') || 
            line.includes('Обновлено') || line.includes('---')) {
            return;
        }
        
        // Если строка содержит ФИО (ожидаем, что ФИО идет на отдельной строке)
        if (line && !line.match(/^[A-Z0-9]{3,20}$/)) {
            // Это ФИО сотрудника
            currentEmployee = {
                fullName: line.trim(),
                name: extractFirstName(line),
                lastName: extractLastName(line)
            };
        } 
        // Если строка содержит код (только буквы и цифры)
        else if (line && line.match(/^[A-Z0-9]{3,20}$/) && currentEmployee) {
            // Это код сотрудника
            const code = line.toUpperCase();
            EMPLOYEE_DATABASE[code] = {
                id: code,
                fullName: currentEmployee.fullName,
                name: currentEmployee.name,
                lastName: currentEmployee.lastName,
                position: 'Сотрудник',
                department: 'Логистика',
                code: code
            };
            
            // Сбрасываем текущего сотрудника для следующей пары
            currentEmployee = null;
        }
    });
    
    // Если остался сотрудник без кода (например, если формат файла изменился)
    if (currentEmployee && !Object.keys(EMPLOYEE_DATABASE).length) {
        // Создаем fallback код
        const fallbackCode = 'EMP' + Date.now().toString().slice(-4);
        EMPLOYEE_DATABASE[fallbackCode] = {
            id: fallbackCode,
            fullName: currentEmployee.fullName,
            name: currentEmployee.name,
            lastName: currentEmployee.lastName,
            position: 'Сотрудник',
            department: 'Логистика',
            code: fallbackCode
        };
    }
    
    // Сохраняем в localStorage для использования на других страницах
    localStorage.setItem('employeeDatabase', JSON.stringify(EMPLOYEE_DATABASE));
    
    // Обновляем демо-коды на странице
    updateDemoCodes();
}

// Извлечение имени из ФИО
function extractFirstName(fullName) {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
        return parts[1]; // Имя обычно второе
    }
    return fullName;
}

// Извлечение фамилии из ФИО
function extractLastName(fullName) {
    const parts = fullName.split(' ');
    if (parts.length >= 1) {
        return parts[0]; // Фамилия обычно первая
    }
    return fullName;
}

// Fallback база данных
function loadFallbackDatabase() {
    EMPLOYEE_DATABASE = {
        'K9CM4CRF': {
            id: 'K9CM4CRF',
            fullName: 'Леонтьев Дмитрий',
            name: 'Дмитрий',
            lastName: 'Леонтьев',
            position: 'Сотрудник',
            department: 'Логистика',
            code: 'K9CM4CRF'
        }
    };
    console.log('Используем fallback базу данных');
}

// Обновление демо-кодов на странице
function updateDemoCodes() {
    const demoContainer = document.querySelector('.demo-codes');
    if (!demoContainer) return;
    
    // Очищаем контейнер
    demoContainer.innerHTML = '';
    
    // Берем первые 3 кода для демонстрации
    const codes = Object.keys(EMPLOYEE_DATABASE).slice(0, 3);
    
    codes.forEach(code => {
        const employee = EMPLOYEE_DATABASE[code];
        const demoCodeElement = document.createElement('div');
        demoCodeElement.className = 'demo-code';
        demoCodeElement.innerHTML = `
            <div class="demo-code-value">${code}</div>
            <div class="demo-code-name">${employee.name}</div>
        `;
        demoCodeElement.onclick = () => useDemoCode(code);
        demoContainer.appendChild(demoCodeElement);
    });
    
    // Если нет кодов, показываем fallback
    if (codes.length === 0) {
        demoContainer.innerHTML = `
            <div class="demo-code" onclick="useDemoCode('K9CM4CRF')">
                <div class="demo-code-value">K9CM4CRF</div>
                <div class="demo-code-name">Дмитрий</div>
            </div>
        `;
    }
}

// Основная инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('NORD WHEEL - Динамическая авторизация загружена');
    
    // Загружаем коды сотрудников
    await loadEmployeeCodes();
    
    // Проверяем существующую сессию
    checkExistingSession();
    
    // Автофокус на поле ввода
    const input = document.getElementById('employeeCode');
    if (input) {
        input.focus();
        input.select();
        
        // Обработка нажатия Enter
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                manualAuth();
            }
        });
        
        // Автозаполнение в верхнем регистре
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
});

// РУЧНАЯ АВТОРИЗАЦИЯ
function manualAuth() {
    const codeInput = document.getElementById('employeeCode');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showAuthStatus('Введите код сотрудника', 'error');
        codeInput.focus();
        return;
    }

    authenticateEmployee(code);
}

// ИСПОЛЬЗОВАНИЕ ДЕМО-КОДА
function useDemoCode(code) {
    const codeInput = document.getElementById('employeeCode');
    codeInput.value = code;
    codeInput.focus();
    codeInput.select();
    
    const employee = EMPLOYEE_DATABASE[code];
    if (employee) {
        showAuthStatus(`Код "${code}" (${employee.name}) установлен. Нажмите "Войти"`, 'loading');
    } else {
        showAuthStatus(`Код "${code}" установлен. Нажмите "Войти"`, 'loading');
    }
}

// ПРОВЕРКА КОДА СОТРУДНИКА
function authenticateEmployee(employeeCode) {
    console.log('Проверка кода:', employeeCode);
    
    showAuthStatus('Проверка кода...', 'loading');
    
    // Ищем сотрудника в базе данных
    const employee = EMPLOYEE_DATABASE[employeeCode];
    
    // Небольшая задержка для имитации проверки
    setTimeout(() => {
        if (employee) {
            // Сохраняем данные сотрудника
            employee.loginTime = new Date().toISOString();
            employee.loginTimeDisplay = new Date().toLocaleString('ru-RU');
            employee.sessionId = 'SESS_' + Date.now();
            
            // Сохраняем в localStorage
            localStorage.setItem('employeeAuth', JSON.stringify(employee));
            
            // Также сохраняем полную базу данных для использования на других страницах
            localStorage.setItem('employeeDatabase', JSON.stringify(EMPLOYEE_DATABASE));
            
            showAuthStatus(`✅ Успешный вход! Добро пожаловать, ${employee.fullName}`, 'success');
            
            // Перенаправляем на страницу с грузами через 1.5 секунды
            setTimeout(() => {
                console.log('Перенаправление на cargo.html...');
                window.location.href = 'cargo.html';
            }, 1500);
            
        } else {
            showAuthStatus(`❌ Код "${employeeCode}" не найден. Проверьте правильность кода`, 'error');
            
            // Показываем доступные коды для справки
            const availableCodes = Object.keys(EMPLOYEE_DATABASE);
            if (availableCodes.length > 0) {
                setTimeout(() => {
                    const statusElement = document.getElementById('authStatus');
                    if (statusElement) {
                        const hint = document.createElement('div');
                        hint.style.marginTop = '10px';
                        hint.style.fontSize = '12px';
                        hint.style.color = '#666';
                        hint.innerHTML = `<strong>Доступные коды:</strong> ${availableCodes.slice(0, 5).join(', ')}${availableCodes.length > 5 ? '...' : ''}`;
                        statusElement.appendChild(hint);
                    }
                }, 500);
            }
            
            const codeInput = document.getElementById('employeeCode');
            if (codeInput) {
                codeInput.focus();
                codeInput.select();
            }
        }
    }, 800);
}

// ПОКАЗ СТАТУСА АВТОРИЗАЦИИ
function showAuthStatus(message, type) {
    const statusElement = document.getElementById('authStatus');
    if (statusElement) {
        statusElement.innerHTML = message;
        statusElement.className = `auth-status ${type || ''}`;
    }
    console.log('Auth Status:', type, message);
}

// ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СЕССИИ
function checkExistingSession() {
    const authData = localStorage.getItem('employeeAuth');
    if (authData) {
        try {
            const employee = JSON.parse(authData);
            const loginTime = new Date(employee.loginTime);
            const currentTime = new Date();
            const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);

            if (hoursDiff < 8) {
                showAuthStatus(`Активна сессия: ${employee.fullName}`, 'loading');

                setTimeout(() => {
                    const continueBtn = document.createElement('button');
                    continueBtn.className = 'btn-auth';
                    continueBtn.style.marginTop = '10px';
                    continueBtn.style.width = '100%';
                    continueBtn.textContent = 'Продолжить работу';
                    continueBtn.onclick = function() {
                        window.location.href = 'cargo.html';
                    };

                    const statusElement = document.getElementById('authStatus');
                    statusElement.appendChild(document.createElement('br'));
                    statusElement.appendChild(continueBtn);
                }, 500);
            } else {
                localStorage.removeItem('employeeAuth');
                showAuthStatus('Сессия истекла. Требуется повторная авторизация', 'loading');
            }
        } catch (e) {
            localStorage.removeItem('employeeAuth');
            console.error('Error parsing auth data:', e);
        }
    }
}

// ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ
async function refreshEmployeeDatabase() {
    showAuthStatus('Обновление базы данных сотрудников...', 'loading');
    await loadEmployeeCodes();
    showAuthStatus('База данных обновлена', 'success');
}

// ЭКСПОРТ ФУНКЦИЙ
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.refreshEmployeeDatabase = refreshEmployeeDatabase;