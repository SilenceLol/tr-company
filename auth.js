// auth.js - Исправленная версия для работы с window.jsQR

let videoStream = null;
let isScannerActive = false;
let lastScannedCode = '';
let scanIntervalId = null;
let videoElement = null;
let canvas = null;
let ctx = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Auth initialized');
    console.log('jsQR available on window:', typeof window.jsQR !== 'undefined');
    console.log('jsQR global:', typeof jsQR !== 'undefined');

    // Проверяем, где находится функция
    if (typeof window.jsQR !== 'undefined') {
        console.log('✅ jsQR found on window.jsQR');
        window.jsQR = window.jsQR; // Делаем глобально доступной
    } else if (typeof jsQR !== 'undefined') {
        console.log('✅ jsQR found as global jsQR');
        window.jsQR = jsQR; // Копируем на window
    } else {
        console.error('❌ jsQR NOT found anywhere!');
    }

    checkExistingSession();

    setTimeout(() => {
        const input = document.getElementById('employeeCode');
        if (input) {
            input.focus();
        }
    }, 500);
});

// ЗАПУСК QR-СКАНЕРА
async function startQRScanner() {
    if (isScannerActive) {
        console.log('Scanner already active');
        return;
    }

    // Проверяем, доступна ли библиотека jsQR
    if (typeof window.jsQR === 'undefined') {
        showAuthStatus('❌ Ошибка: библиотека сканера не загружена. Обновите страницу', 'error');
        console.error('window.jsQR is not defined!');
        return;
    }

    console.log('jsQR function available:', typeof window.jsQR);

    try {
        showAuthStatus('Запуск камеры...', 'loading');

        document.getElementById('scannerPlaceholder').style.display = 'none';
        document.getElementById('qr-reader').classList.add('active');
        document.getElementById('scannerControls').style.display = 'flex';

        const qrReader = document.getElementById('qr-reader');
        qrReader.innerHTML = `
            <div class="camera-loader">
                <div class="loader-spinner"></div>
                <div>Запуск камеры...</div>
            </div>
            <div class="scanner-frame"></div>
            <div class="scanning-indicator"></div>
        `;

        await initQRScanner();

    } catch (error) {
        console.error('Scanner initialization error:', error);
        handleScannerError(error);
        resetScannerUI();
    }
}

// ИНИЦИАЛИЗАЦИЯ QR-СКАНЕРА
async function initQRScanner() {
    try {
        console.log('Initializing QR scanner...');

        const qrReader = document.getElementById('qr-reader');

        // Удаляем лоадер
        const loader = document.querySelector('.camera-loader');
        if (loader) {
            loader.remove();
        }

        // Создаем video элемент
        videoElement = document.createElement('video');
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('muted', '');
        videoElement.setAttribute('playsinline', '');
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoElement.style.display = 'block';

        qrReader.appendChild(videoElement);

        // Создаем canvas для анализа
        canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        qrReader.appendChild(canvas);

        // Получаем доступ к камере
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };

        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera access granted');

        videoStream = stream;
        videoElement.srcObject = stream;

        // Ждем, пока видео будет готово
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Camera timeout'));
            }, 5000);

            videoElement.onloadedmetadata = () => {
                clearTimeout(timeout);
                console.log('Video metadata loaded');
                videoElement.play().then(resolve).catch(reject);
            };

            videoElement.onerror = (err) => {
                clearTimeout(timeout);
                reject(err);
            };
        });

        console.log('Video playing successfully');
        isScannerActive = true;

        showAuthStatus('Сканер активен. Наведите на QR-код', 'scanning');

        document.getElementById('scannerInstructions').innerHTML = `
            <p><strong>Сканер активен!</strong></p>
            <p>Наведите камеру на QR-код сотрудника</p>
            <p><small>Расположите QR-код внутри зеленой рамки</small></p>
        `;

        // Запускаем сканирование
        startQRScanning();

    } catch (error) {
        console.error('Failed to initialize camera:', error);
        throw error;
    }
}

// ЗАПУСК ПРОЦЕССА СКАНИРОВАНИЯ
function startQRScanning() {
    if (!isScannerActive || !videoElement || !ctx) {
        console.log('Cannot start scanning, missing components');
        return;
    }

    console.log('Starting QR scanning process...');
    console.log('Using window.jsQR:', typeof window.jsQR);

    let lastScanTime = 0;
    const scanDelay = 500; // Сканируем каждые 500мс

    function scanFrame() {
        if (!isScannerActive) {
            console.log('Scanner stopped, exiting scan loop');
            return;
        }

        const now = Date.now();
        if (now - lastScanTime < scanDelay) {
            scanIntervalId = setTimeout(scanFrame, 100);
            return;
        }

        lastScanTime = now;

        try {
            // Проверяем готовность видео
            if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                scanIntervalId = setTimeout(scanFrame, 100);
                return;
            }

            // Устанавливаем размер canvas
            const width = videoElement.videoWidth || 640;
            const height = videoElement.videoHeight || 480;

            if (width === 0 || height === 0) {
                scanIntervalId = setTimeout(scanFrame, 100);
                return;
            }

            canvas.width = width;
            canvas.height = height;

            // Рисуем кадр на canvas
            ctx.drawImage(videoElement, 0, 0, width, height);

            // Получаем данные изображения
            const imageData = ctx.getImageData(0, 0, width, height);

            // Проверяем доступность jsQR
            if (typeof window.jsQR === 'undefined') {
                console.error('window.jsQR is undefined!');
                return;
            }

            // Декодируем QR-код с помощью window.jsQR
            console.log('Attempting to decode QR with window.jsQR...');
            const code = window.jsQR(imageData.data, width, height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                console.log('✅ QR Code detected:', code.data);
                handleQRScanSuccess(code.data);
                return; // Останавливаем дальнейшее сканирование
            }

        } catch (error) {
            console.warn('Error scanning frame:', error);
        }

        // Продолжаем сканирование
        scanIntervalId = setTimeout(scanFrame, 100);
    }

    scanIntervalId = setTimeout(scanFrame, 100);
}

// ОСТАНОВКА СКАНЕРА
async function stopQRScanner() {
    if (!isScannerActive) {
        console.log('Scanner already stopped');
        return;
    }

    console.log('Stopping QR scanner...');

    try {
        showAuthStatus('Останавливаю сканер...', 'loading');

        // Останавливаем интервал сканирования
        if (scanIntervalId) {
            clearTimeout(scanIntervalId);
            scanIntervalId = null;
        }

        // Останавливаем видео поток
        if (videoStream) {
            videoStream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            videoStream = null;
        }

        // Очищаем canvas
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Удаляем video элемент
        if (videoElement) {
            videoElement.pause();
            videoElement.srcObject = null;
            if (videoElement.parentNode) {
                videoElement.parentNode.removeChild(videoElement);
            }
            videoElement = null;
        }

        // Удаляем canvas
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }

        canvas = null;
        ctx = null;
        isScannerActive = false;

        resetScannerUI();

        showAuthStatus('Сканер остановлен', 'loading');
        setTimeout(() => {
            showAuthStatus('Нажмите "Запустить QR-сканер" для начала работы', '');
        }, 1500);

    } catch (error) {
        console.error('Error stopping scanner:', error);
    }
}

// СБРОС ИНТЕРФЕЙСА
function resetScannerUI() {
    document.getElementById('scannerPlaceholder').style.display = 'flex';
    document.getElementById('qr-reader').classList.remove('active');
    document.getElementById('scannerControls').style.display = 'none';

    document.getElementById('scannerInstructions').innerHTML = `
        <p>Наведите камеру на QR-код сотрудника</p>
        <p><small>Расположите QR-код внутри зеленой рамки</small></p>
    `;

    document.getElementById('qr-reader').innerHTML = `
        <div class="scanner-frame"></div>
        <div class="scanning-indicator"></div>
    `;
}

// ОБРАБОТКА УСПЕШНОГО СКАНИРОВАНИЯ
function handleQRScanSuccess(decodedText) {
    console.log('=== QR SCAN SUCCESS ===');
    console.log('Raw decoded text:', decodedText);

    if (decodedText === lastScannedCode) {
        console.log('Duplicate scan, ignoring');
        return;
    }

    lastScannedCode = decodedText;

    const employeeCode = extractEmployeeCode(decodedText);
    console.log('Extracted employee code:', employeeCode);

    if (employeeCode) {
        showAuthStatus(`✅ QR-код распознан: ${employeeCode}`, 'success');

        // Визуальная обратная связь
        const scannerFrame = document.querySelector('.scanner-frame');
        if (scannerFrame) {
            scannerFrame.style.borderColor = '#00ff00';
            scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 255, 0, 0.2)';

            setTimeout(() => {
                scannerFrame.style.borderColor = '#00ff00';
                scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 0, 0, 0.5)';
            }, 300);
        }

        // Авторизуемся
        setTimeout(() => {
            stopQRScanner();
            setTimeout(() => {
                authenticateEmployee(employeeCode);
            }, 300);
        }, 800);

    } else {
        console.log('Invalid QR format:', decodedText);
        showAuthStatus(`❌ Неверный формат: "${decodedText}"`, 'error');

        const scannerFrame = document.querySelector('.scanner-frame');
        if (scannerFrame) {
            scannerFrame.style.borderColor = '#ff0000';
            scannerFrame.style.boxShadow = '0 0 0 1000px rgba(255, 0, 0, 0.2)';

            setTimeout(() => {
                scannerFrame.style.borderColor = '#00ff00';
                scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 0, 0, 0.5)';
            }, 500);
        }

        setTimeout(() => {
            lastScannedCode = '';
        }, 3000);
    }
}

// ИЗВЛЕЧЕНИЕ КОДА СОТРУДНИКА
function extractEmployeeCode(qrData) {
    if (!qrData) return null;

    const cleanData = qrData.trim().toUpperCase();
    console.log('Processing QR data:', cleanData);

    // Убираем все лишние символы, оставляем только буквы и цифры
    const cleanString = cleanData.replace(/[^A-Z0-9]/g, '');

    // Ищем EMP и цифры
    const match = cleanString.match(/(EMP\d+)/);
    if (match) {
        let code = match[1];
        // Форматируем код
        const numMatch = code.match(/\d+/);
        if (numMatch) {
            const numbers = numMatch[0];
            // Добавляем нули если нужно
            if (numbers.length === 1) {
                code = 'EMP00' + numbers;
            } else if (numbers.length === 2) {
                code = 'EMP0' + numbers;
            }
        }
        console.log('Matched code:', code);
        return code;
    }

    // Если только цифры
    const numOnly = cleanString.match(/^(\d+)$/);
    if (numOnly) {
        const numbers = numOnly[1];
        let code = 'EMP';
        if (numbers.length === 1) {
            code += '00' + numbers;
        } else if (numbers.length === 2) {
            code += '0' + numbers;
        } else {
            code += numbers;
        }
        console.log('Number only code:', code);
        return code;
    }

    console.log('No valid code found');
    return null;
}

// ОБРАБОТКА ОШИБОК СКАНЕРА
function handleScannerError(error) {
    console.error('Scanner error:', error);

    let errorMessage = 'Не удалось запустить сканер';

    if (error.name === 'NotAllowedError') {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена';
    } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Браузер не поддерживает доступ к камере';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера уже используется другим приложением';
    } else if (error.message && error.message.includes('timeout')) {
        errorMessage = 'Таймаут при запуске камеры. Попробуйте еще раз';
    }

    showAuthStatus(errorMessage, 'error');

    // Показываем кнопку для ручного ввода
    setTimeout(() => {
        const statusElement = document.getElementById('authStatus');
        if (statusElement) {
            const manualBtn = document.createElement('button');
            manualBtn.className = 'btn-auth';
            manualBtn.style.marginTop = '10px';
            manualBtn.style.width = '100%';
            manualBtn.textContent = 'Ввести код вручную';
            manualBtn.onclick = function() {
                document.getElementById('employeeCode').focus();
            };
            statusElement.appendChild(document.createElement('br'));
            statusElement.appendChild(manualBtn);
        }
    }, 1000);
}

// РУЧНАЯ АВТОРИЗАЦИЯ
function manualAuth() {
    const codeInput = document.getElementById('employeeCode');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showAuthStatus('Введите код сотрудника', 'error');
        codeInput.focus();
        return;
    }

    // Форматируем код если нужно
    const formattedCode = extractEmployeeCode(code) || code;
    authenticateEmployee(formattedCode);
}

// ИСПОЛЬЗОВАНИЕ ДЕМО-КОДА
function useDemoCode(code) {
    const codeInput = document.getElementById('employeeCode');
    codeInput.value = code;
    codeInput.focus();
    showAuthStatus(`Демо-код "${code}" установлен. Нажмите "Войти"`, 'loading');
}

// АВТОРИЗАЦИЯ СОТРУДНИКА
function authenticateEmployee(employeeCode) {
    console.log('Authenticating employee:', employeeCode);

    if (isScannerActive) {
        stopQRScanner();
    }

    showAuthStatus('Проверка кода...', 'loading');

    // ВРЕМЕННАЯ БАЗА ДАННЫХ
    const employees = {
        'EMP001': {
            id: 'EMP001',
            name: 'Тест Тестович',
            position: 'Грузчик'
        },
        'EMP002': {
            id: 'EMP002',
            name: 'Тест Тестович2',
            position: 'Водитель'
        },
        'EMP00': {
            id: 'EMP00',
            name: 'Тестовый Сотрудник',
            position: 'Тестировщик'
        }
    };

    // Добавляем вариации кодов
    employees['EMP00001'] = employees['EMP001'];
    employees['EMP0001'] = employees['EMP001'];
    employees['EMP01'] = employees['EMP001'];
    employees['EMP1'] = employees['EMP001'];

    employees['EMP00002'] = employees['EMP002'];
    employees['EMP0002'] = employees['EMP002'];
    employees['EMP02'] = employees['EMP002'];
    employees['EMP2'] = employees['EMP002'];

    setTimeout(() => {
        const employee = employees[employeeCode];

        if (employee) {
            employee.loginTime = new Date().toISOString();
            employee.loginTimeDisplay = new Date().toLocaleString('ru-RU');
            employee.sessionId = 'SESS_' + Date.now();

            localStorage.setItem('employeeAuth', JSON.stringify(employee));

            showAuthStatus(`✅ Успешный вход! Добро пожаловать, ${employee.name}`, 'success');

            setTimeout(() => {
                console.log('Redirecting to cargo.html...');
                window.location.href = 'cargo.html';
            }, 1500);

        } else {
            showAuthStatus(`❌ Код "${employeeCode}" не найден. Используйте EMP001, EMP002 или EMP00`, 'error');
            const codeInput = document.getElementById('employeeCode');
            if (codeInput) {
                codeInput.focus();
                codeInput.select();
            }
        }
    }, 1000);
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
                showAuthStatus(`Активна сессия: ${employee.name}`, 'loading');

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

// ДЛЯ ОТЛАДКИ - создаем глобальную переменную
window.testQRScanner = function() {
    console.log('Testing QR scanner...');
    console.log('window.jsQR:', typeof window.jsQR);

    // Создаем тестовый canvas
    const testCanvas = document.createElement('canvas');
    const testCtx = testCanvas.getContext('2d');
    testCanvas.width = 100;
    testCanvas.height = 100;

    // Заполняем тестовыми данными
    testCtx.fillStyle = 'white';
    testCtx.fillRect(0, 0, 100, 100);
    testCtx.fillStyle = 'black';
    testCtx.fillRect(20, 20, 60, 60);

    const testImageData = testCtx.getImageData(0, 0, 100, 100);

    if (typeof window.jsQR === 'function') {
        console.log('Calling window.jsQR...');
        const result = window.jsQR(testImageData.data, 100, 100, {
            inversionAttempts: 'dontInvert'
        });
        console.log('Test result:', result);
        return result;
    } else {
        console.error('window.jsQR is not a function!');
        return null;
    }
};

// ОСТАНОВКА СКАНЕРА ПРИ ПЕРЕЗАГРУЗКЕ
window.addEventListener('beforeunload', function() {
    if (isScannerActive) {
        stopQRScanner();
    }
});

// ЭКСПОРТ ФУНКЦИЙ
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;