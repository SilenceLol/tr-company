// База данных сотрудников (временная, позже заменится на реальную)
const employees = {
    'EMP001': { name: 'Иванов Алексей' },
    'EMP002': { name: 'Петров Дмитрий' },
    'EMP003': { name: 'Сидоров Михаил' },
    'EMP004': { name: 'Кузнецова Анна' },
    'EMP005': { name: 'Смирнов Владимир' }
};

let html5QrcodeScanner = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initQRScanner();
    
    // Проверяем, не авторизован ли уже пользователь
    checkExistingAuth();
});

// Инициализация QR-сканера
function initQRScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_QR_CODE]
        },
        false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// Успешное сканирование QR-кода
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Отсканирован код: ${decodedText}`);
    
    // Останавливаем сканер после успешного сканирования
    html5QrcodeScanner.clear();
    
    // Проверяем сотрудника
    checkEmployeeAuth(decodedText.trim());
}

// Ошибка сканирования
function onScanFailure(error) {
    // Ошибки сканирования игнорируем - это нормально
}

// Проверка авторизации сотрудника
function checkEmployeeAuth(employeeCode) {
    showAuthStatus('Проверка сотрудника...', 'loading');
    
    // Имитация задержки проверки
    setTimeout(() => {
        const employee = employees[employeeCode];
        
        if (employee) {
            // Сотрудник найден
            showAuthStatus(`Добро пожаловать, ${employee.name}!`, 'success');
            
            // Сохраняем данные авторизации
            saveAuthData(employeeCode, employee);
            
            // Переходим на страницу грузов через 1.5 секунды
            setTimeout(() => {
                window.location.href = 'cargo.html';
            }, 1500);
            
        } else {
            // Сотрудник не найден
            showAuthStatus('Сотрудник не найден! Проверьте QR-код.', 'error');
            
            // Перезапускаем сканер через 2 секунды
            setTimeout(() => {
                initQRScanner();
                showAuthStatus('Наведите камеру на QR-код', '');
            }, 2000);
        }
    }, 1000);
}

// Ручная авторизация по коду
function manualAuth() {
    const employeeCode = document.getElementById('employeeCode').value.trim().toUpperCase();
    
    if (!employeeCode) {
        showAuthStatus('Введите код сотрудника', 'error');
        return;
    }
    
    checkEmployeeAuth(employeeCode);
}

// Использование демо-кода
function useDemoCode(code) {
    document.getElementById('employeeCode').value = code;
    manualAuth();
}

// Показать статус авторизации
function showAuthStatus(message, type) {
    const statusElement = document.getElementById('authStatus');
    statusElement.textContent = message;
    statusElement.className = 'auth-status';
    
    if (type) {
        statusElement.classList.add(type);
    }
}

// Сохранить данные авторизации
function saveAuthData(employeeCode, employeeData) {
    const authData = {
        code: employeeCode,
        name: employeeData.name,
        loginTime: new Date().toLocaleString('ru-RU')
    };
    
    localStorage.setItem('employeeAuth', JSON.stringify(authData));
}

// Проверить существующую авторизацию
function checkExistingAuth() {
    const authData = localStorage.getItem('employeeAuth');
    
    if (authData) {
        const employee = JSON.parse(authData);
        const loginTime = new Date(employee.loginTime);
        const currentTime = new Date();
        const hoursDiff = (currentTime - loginTime) / (1000 * 60 * 60);
        
        // Авторизация действительна 12 часов
        if (hoursDiff < 12) {
            showAuthStatus(`Авторизован: ${employee.name}`, 'success');
            
            // Добавляем кнопку перехода
            const statusElement = document.getElementById('authStatus');
            const continueButton = document.createElement('button');
            continueButton.textContent = 'Продолжить работу';
            continueButton.className = 'btn-auth';
            continueButton.style.marginTop = '10px';
            continueButton.onclick = function() {
                window.location.href = 'cargo.html';
            };
            statusElement.appendChild(continueButton);
        } else {
            // Авторизация истекла
            localStorage.removeItem('employeeAuth');
        }
    }
}

// Выход из системы (будет вызываться со страницы грузов)
function logout() {
    localStorage.removeItem('employeeAuth');
    localStorage.removeItem('cargoList'); // Очищаем данные грузов при выходе
    window.location.href = 'index.html';
}