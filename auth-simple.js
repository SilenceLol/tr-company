// Упрощенная версия авторизации для NORD WHEEL с камерой
let cameraStream = null;
let isCameraActive = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Auth - Camera version loaded');

    // Проверяем, есть ли активная сессия
    checkExistingSession();

    // Фокус на поле ввода кода
    const codeInput = document.getElementById('employeeCode');
    if (codeInput) {
        setTimeout(() => codeInput.focus(), 500);

        // Автозаполнение "EMP" при вводе
        codeInput.addEventListener('input', function(e) {
            let value = e.target.value.toUpperCase();
            value = value.replace(/[^A-Z0-9]/g, '');

            if (/^\d/.test(value) && value.length <= 3) {
                value = 'EMP' + value;
            }

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
    }

    // Проверяем поддержку камеры
    checkCameraSupport();
});

// Проверка поддержки камеры
function checkCameraSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const scannerHint = document.getElementById('scannerHint');
        if (scannerHint) {
            scannerHint.innerHTML = 'Камера не поддерживается вашим браузером. Используйте ручной ввод.';
        }
        return false;
    }
    return true;
}

// Открытие камеры устройства
async function openCamera() {
    if (!checkCameraSupport()) {
        showAuthStatus('Ваш браузер не поддерживает камеру', 'error');
        return;
    }

    if (isCameraActive) {
        return; // Камера уже активна
    }

    showAuthStatus('Запрос доступа к камере...', 'loading');

    try {
        // Получаем доступ к камере
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Предпочтительно задняя камера
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        // Показываем видео поток
        const video = document.getElementById('cameraVideo');
        const scannerPlaceholder = document.getElementById('scannerPlaceholder');
        const cameraView = document.getElementById('cameraView');
        const qrReader = document.getElementById('qr-reader');

        if (video && scannerPlaceholder && cameraView && qrReader) {
            video.srcObject = cameraStream;
            scannerPlaceholder.style.display = 'none';
            cameraView.style.display = 'block';
            qrReader.classList.add('camera-active');

            isCameraActive = true;

            showAuthStatus('Камера активна. Наведите на QR-код и сфотографируйте', 'success');

            // Обновляем подсказку
            const scannerHint = document.getElementById('scannerHint');
            if (scannerHint) {
                scannerHint.textContent = 'Сфотографируйте QR-код или используйте ручной ввод';
            }
        }

    } catch (error) {
        console.error('Camera error:', error);
        handleCameraError(error);
    }
}

// Закрытие камеры
function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        cameraStream = null;
    }

    const video = document.getElementById('cameraVideo');
    const scannerPlaceholder = document.getElementById('scannerPlaceholder');
    const cameraView = document.getElementById('cameraView');
    const qrReader = document.getElementById('qr-reader');

    if (video && scannerPlaceholder && cameraView && qrReader) {
        video.srcObject = null;
        scannerPlaceholder.style.display = 'block';
        cameraView.style.display = 'none';
        qrReader.classList.remove('camera-active');

        isCameraActive = false;

        showAuthStatus('Камера закрыта', 'loading');

        // Восстанавливаем подсказку
        const scannerHint = document.getElementById('scannerHint');
        if (scannerHint) {
            scannerHint.textContent = 'Или используйте ручной ввод кода ниже';
        }
    }
}

// Сделать фотографию
function takePicture() {
    if (!isCameraActive || !cameraStream) {
        showAuthStatus('Камера не активна', 'error');
        return;
    }

    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const context = canvas.getContext('2d');

    // Устанавливаем размеры canvas как у видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем текущий кадр видео на canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Получаем data URL изображения
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    showAuthStatus('Фото сделано! Анализируем QR-код...', 'loading');

    // В упрощенной версии мы не можем распознать QR-код без библиотеки,
    // поэтому предлагаем пользователю ввести код вручную
    setTimeout(() => {
        showAuthStatus('Введите код с QR-кода вручную', 'success');
        closeCamera();

        // Фокус на поле ввода
        const codeInput = document.getElementById('employeeCode');
        if (codeInput) {
            codeInput.focus();
        }
    }, 2000);

    // Здесь можно добавить логику для отправки фото на сервер для распознавания QR-кода
    // или подключить библиотеку для распознавания на клиенте
}

// Обработка ошибок камеры
function handleCameraError(error) {
    let errorMessage = 'Не удалось получить доступ к камере';

    if (error.name === 'NotAllowedError') {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена на устройстве';
    } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Браузер не поддерживает доступ к камере';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера уже используется другим приложением';
    } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Невозможно использовать запрошенные настройки камеры';
    }

    showAuthStatus(errorMessage, 'error');

    // Обновляем подсказку
    const scannerHint = document.getElementById('scannerHint');
    if (scannerHint) {
        scannerHint.textContent = 'Используйте ручной ввод кода';
    }
}

// Автоматическое закрытие камеры при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (isCameraActive) {
        closeCamera();
    }
});

// Обработка изменения видимости страницы
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isCameraActive) {
        // Страница скрыта - закрываем камеру для экономии ресурсов
        closeCamera();
        showAuthStatus('Камера закрыта из-за неактивности страницы', 'loading');
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

            if (hoursDiff < 8) {
                showAuthStatus(`Активна сессия: ${employee.name}`, 'loading');
                setTimeout(() => {
                    showAuthStatus('Нажмите "Войти" для продолжения', 'loading');
                }, 2000);
            } else {
                localStorage.removeItem('employeeAuth');
            }
        } catch (e) {
            localStorage.removeItem('employeeAuth');
        }
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
            employee.loginTime = new Date().toISOString();
            employee.loginTimeDisplay = new Date().toLocaleString('ru-RU');
            employee.sessionId = 'SESS_' + Date.now();

            localStorage.setItem('employeeAuth', JSON.stringify(employee));

            showAuthStatus(`Успешный вход! Добро пожаловать, ${employee.name}`, 'success');

            setTimeout(() => {
                showAuthStatus(`Перенаправление в систему...`, 'loading');
                setTimeout(() => {
                    window.location.href = 'cargo.html';
                }, 1500);
            }, 1000);

        } else {
            showAuthStatus('Код сотрудника не найден в системе', 'error');
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

        if (type === 'error' || type === 'success') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = '';
                    statusElement.className = 'auth-status';
                }
            }, type === 'error' ? 5000 : 3000);
        }
    }
    console.log(`Auth Status [${type}]: ${message}`);
}

// Функции для cargo.html
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
        localStorage.removeItem('cargoList');
        window.location.href = 'index.html';
    }
}

// Глобальный экспорт функций
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.openCamera = openCamera;
window.closeCamera = closeCamera;
window.takePicture = takePicture;
window.logout = logout;

console.log('NORD WHEEL Camera Auth initialized successfully');