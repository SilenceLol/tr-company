// Версия с улучшенным QR-сканером
let cameraStream = null;
let isScannerActive = false;
let scanInterval = null;
let lastScannedCode = ''; // Защита от повторного сканирования

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Auth - Improved QR Scanner version loaded');

    checkExistingSession();

    const codeInput = document.getElementById('employeeCode');
    if (codeInput) {
        setTimeout(() => codeInput.focus(), 500);

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

        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                manualAuth();
            }
        });
    }

    checkScannerSupport();
});

// Проверка поддержки сканера
function checkScannerSupport() {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasCanvas = !!window.CanvasRenderingContext2D;
    const hasJSQR = typeof jsQR !== 'undefined';

    if (!hasGetUserMedia) {
        updateScannerHint('Ваш браузер не поддерживает доступ к камере');
    }

    if (!hasJSQR) {
        updateScannerHint('Библиотека QR-сканера не загружена');
    }

    return hasGetUserMedia && hasCanvas && hasJSQR;
}

// Запуск QR-сканера
async function startQRScanner() {
    if (!checkScannerSupport()) {
        showAuthStatus('QR-сканер недоступен в вашем браузере', 'error');
        return;
    }

    if (isScannerActive) {
        return;
    }

    showAuthStatus('Запуск QR-сканера...', 'loading');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        const video = document.getElementById('cameraVideo');
        const scannerPlaceholder = document.getElementById('scannerPlaceholder');
        const cameraView = document.getElementById('cameraView');
        const qrReader = document.getElementById('qr-reader');

        if (video && scannerPlaceholder && cameraView && qrReader) {
            video.srcObject = cameraStream;
            scannerPlaceholder.style.display = 'none';
            cameraView.style.display = 'block';
            qrReader.classList.add('camera-active');

            isScannerActive = true;
            lastScannedCode = ''; // Сбрасываем при запуске

            showAuthStatus('Сканер активен. Наведите на QR-код', 'success');
            updateScannerHint('Наведите камеру на QR-код сотрудника');

            // Ждем готовности видео и запускаем сканирование
            video.addEventListener('loadeddata', function() {
                startScanning(video);
            });
        }

    } catch (error) {
        console.error('Scanner error:', error);
        handleScannerError(error);
    }
}

// Остановка сканера
function stopQRScanner() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

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
    const scannerResult = document.getElementById('scannerResult');

    if (video && scannerPlaceholder && cameraView && qrReader && scannerResult) {
        video.srcObject = null;
        scannerPlaceholder.style.display = 'block';
        cameraView.style.display = 'none';
        qrReader.classList.remove('camera-active');
        scannerResult.innerHTML = '';
        scannerResult.className = 'scanner-result';

        isScannerActive = false;

        showAuthStatus('Сканер остановлен', 'loading');
        updateScannerHint('Или используйте ручной ввод кода ниже');
    }
}

// Запуск процесса сканирования
function startScanning(video) {
    const canvas = document.getElementById('qrCanvas');
    const context = canvas.getContext('2d');
    const scannerResult = document.getElementById('scannerResult');

    function scanFrame() {
        if (!isScannerActive || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                handleQRCodeDetected(code.data, code.location);
                drawQRCodeFrame(context, code.location);
            } else {
                scannerResult.innerHTML = '<div class="scanning">🔍 Сканирование...</div>';
                scannerResult.className = 'scanner-result scanning';
            }
        } catch (error) {
            console.error('QR scanning error:', error);
        }
    }

    scanInterval = setInterval(scanFrame, 300); // 3 раза в секунду
}

// Обработка распознанного QR-кода
function handleQRCodeDetected(qrData, location) {
    console.log('QR Code detected:', qrData);

    // Защита от повторного сканирования того же кода
    if (qrData === lastScannedCode) {
        return;
    }
    lastScannedCode = qrData;

    const scannerResult = document.getElementById('scannerResult');
    const employeeCode = extractEmployeeCode(qrData);

    if (employeeCode) {
        // Правильный код найден
        scannerResult.innerHTML = `
            <div class="success">
                <div class="result-icon">✅</div>
                <div class="result-text">
                    <strong>Сотрудник найден!</strong><br>
                    Код: ${employeeCode}
                </div>
            </div>
        `;
        scannerResult.className = 'scanner-result success';

        showAuthStatus(`Авторизация: ${employeeCode}`, 'success');

        // Автоматическая авторизация через 2 секунды
        setTimeout(() => {
            authenticateEmployee(employeeCode);
        }, 2000);

    } else {
        // Неправильный формат
        scannerResult.innerHTML = `
            <div class="error">
                <div class="result-icon">❌</div>
                <div class="result-text">
                    <strong>Неверный QR-код</strong><br>
                    ${getQRCodeType(qrData)}<br>
                    <small>Нужен код формата: EMP001</small>
                </div>
            </div>
        `;
        scannerResult.className = 'scanner-result error';

        showAuthStatus('Неверный формат QR-кода', 'error');

        // Сбрасываем защиту через 3 секунды
        setTimeout(() => {
            lastScannedCode = '';
        }, 3000);
    }
}

// Извлечение кода сотрудника из разных форматов QR-кодов
function extractEmployeeCode(qrData) {
    if (!qrData) return null;

    const cleanData = qrData.trim().toUpperCase();
    console.log('Analyzing QR data:', cleanData);

    // 1. Прямой код EMP001
    const directMatch = cleanData.match(/^EMP\d{3}$/);
    if (directMatch) {
        console.log('Direct code found:', directMatch[0]);
        return directMatch[0];
    }

    // 2. Код в URL параметре: https://example.com?emp=EMP001
    const urlParamMatch = cleanData.match(/(?:CODE|ID|EMP|EMPLOYEE|USER)[=:]?(\s*)(EMP\d{3})/i);
    if (urlParamMatch && urlParamMatch[2]) {
        console.log('URL parameter code found:', urlParamMatch[2]);
        return urlParamMatch[2];
    }

    // 3. Код в пути URL: https://example.com/EMP001
    const urlPathMatch = cleanData.match(/\/(EMP\d{3})(?:\/|$|\?|#)/i);
    if (urlPathMatch && urlPathMatch[1]) {
        console.log('URL path code found:', urlPathMatch[1]);
        return urlPathMatch[1];
    }

    // 4. Код в тексте: "EMP001" в любом месте
    const anywhereMatch = cleanData.match(/(EMP\d{3})/);
    if (anywhereMatch && anywhereMatch[1]) {
        console.log('Code found anywhere in text:', anywhereMatch[1]);
        return anywhereMatch[1];
    }

    // 5. JSON данные: {"emp_code": "EMP001"}
    try {
        const jsonData = JSON.parse(qrData);
        const code = jsonData.employee_code || jsonData.code || jsonData.emp_code ||
            jsonData.emp || jsonData.id || jsonData.user_code;
        if (code && typeof code === 'string') {
            const jsonMatch = code.toUpperCase().match(/(EMP\d{3})/);
            if (jsonMatch && jsonMatch[1]) {
                console.log('JSON code found:', jsonMatch[1]);
                return jsonMatch[1];
            }
        }
    } catch (e) {
        // Не JSON, продолжаем
    }

    console.log('No employee code found in QR data');
    return null;
}

// Определение типа QR-кода для отображения
function getQRCodeType(qrData) {
    if (!qrData) return 'Пустой код';

    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
        return 'URL: ' + qrData.substring(0, 30) + (qrData.length > 30 ? '...' : '');
    }

    if (qrData.startsWith('{"') && qrData.endsWith('}')) {
        return 'JSON данные';
    }

    if (qrData.match(/[а-яА-Я]/)) {
        return 'Текст: ' + qrData.substring(0, 20) + (qrData.length > 20 ? '...' : '');
    }

    return 'Текст: ' + qrData;
}

// Рисование рамки вокруг QR-кода
function drawQRCodeFrame(context, location) {
    if (!location) return;

    context.beginPath();
    context.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    context.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    context.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    context.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    context.closePath();

    context.lineWidth = 4;
    context.strokeStyle = '#00ff00';
    context.stroke();

    // Рисуем угловые маркеры
    drawCornerMarker(context, location.topLeftCorner);
    drawCornerMarker(context, location.topRightCorner);
    drawCornerMarker(context, location.bottomRightCorner);
    drawCornerMarker(context, location.bottomLeftCorner);
}

// Рисование угловых маркеров
function drawCornerMarker(context, corner) {
    context.beginPath();
    context.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
    context.fillStyle = '#00ff00';
    context.fill();
}

// Обработка ошибок сканера
function handleScannerError(error) {
    let errorMessage = 'Не удалось запустить сканер';

    if (error.name === 'NotAllowedError') {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена на устройстве';
    } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Браузер не поддерживает доступ к камере';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера уже используется другим приложением';
    }

    showAuthStatus(errorMessage, 'error');
    updateScannerHint('Используйте ручной ввод кода');
}

// Обновление подсказки сканера
function updateScannerHint(message) {
    const scannerHint = document.getElementById('scannerHint');
    if (scannerHint) {
        scannerHint.textContent = message;
    }
}

// Автоматическое закрытие сканера при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (isScannerActive) {
        stopQRScanner();
    }
});

// Обработка изменения видимости страницы
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isScannerActive) {
        stopQRScanner();
        showAuthStatus('Сканер остановлен из-за неактивности страницы', 'loading');
    }
});

// ==================== ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ ====================

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
            } else {
                localStorage.removeItem('employeeAuth');
            }
        } catch (e) {
            localStorage.removeItem('employeeAuth');
        }
    }
}

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

function useDemoCode(code) {
    const codeInput = document.getElementById('employeeCode');
    codeInput.value = code;
    codeInput.focus();
    showAuthStatus(`Демо-код "${code}" установлен. Нажмите "Войти"`, 'loading');
}

function authenticateEmployee(employeeCode) {
    if (isScannerActive) {
        stopQRScanner();
    }

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
                window.location.href = 'cargo.html';
            }, 1500);

        } else {
            showAuthStatus('Код сотрудника не найден в системе', 'error');
            const codeInput = document.getElementById('employeeCode');
            if (codeInput) {
                codeInput.focus();
                codeInput.select();
            }
        }
    }, 1000);
}

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

// Глобальный экспорт функций
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;

console.log('NORD WHEEL Improved QR Scanner initialized');