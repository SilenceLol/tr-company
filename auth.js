// ==================== АВТОРИЗАЦИЯ И QR СКАНЕР ====================

// Глобальные переменные для сканера QR
let html5QrCode = null;
let qrScannerActive = false;

// Инициализация при загрузке страницы авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы на странице авторизации
    if (document.querySelector('.auth-container')) {
        initQRScanner();

        // Автоматически запускаем сканер при загрузке страницы
        setTimeout(startQRScanner, 1000);
    }

    // Проверяем, находимся ли мы на странице грузов
    if (document.querySelector('.app-container')) {
        initCargoPage();
    }
});

// Инициализация QR сканера
function initQRScanner() {
    const qrReader = document.getElementById('qr-reader');

    if (!qrReader) {
        console.log('QR reader element not found');
        return;
    }

    try {
        // Создаем сканер
        html5QrCode = new Html5Qrcode("qr-reader");
        console.log('QR scanner initialized');

        // Добавляем инструкции
        qrReader.innerHTML = `
            <div class="scanner-overlay">
                <div class="scanner-frame"></div>
                <div class="scanner-line"></div>
            </div>
            <div class="scanner-instructions">
                <p>Наведите камеру на QR-код</p>
                <p class="scanner-hint">Камера запустится автоматически</p>
            </div>
        `;

    } catch (error) {
        console.error('Error initializing QR scanner:', error);
        showQRScannerError('Ошибка инициализации сканера');
    }
}

// Запуск сканера QR
async function startQRScanner() {
    if (!html5QrCode || qrScannerActive) {
        return;
    }

    const qrReader = document.getElementById('qr-reader');
    const statusElement = document.getElementById('authStatus');

    try {
        // Очищаем предыдущий статус
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'auth-status';
        }

        // Конфигурация сканера
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0
        };

        // Запускаем сканирование
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onQRScanSuccess,
            onQRScanFailure
        );

        qrScannerActive = true;
        console.log('QR scanner started');

        // Обновляем интерфейс
        updateScannerUI(true);

    } catch (error) {
        console.error('Error starting QR scanner:', error);
        handleScannerError(error);
    }
}

// Остановка сканера QR
async function stopQRScanner() {
    if (!html5QrCode || !qrScannerActive) {
        return;
    }

    try {
        await html5QrCode.stop();
        qrScannerActive = false;
        console.log('QR scanner stopped');

        // Обновляем интерфейс
        updateScannerUI(false);

    } catch (error) {
        console.error('Error stopping QR scanner:', error);
    }
}

// Успешное сканирование QR
function onQRScanSuccess(decodedText, decodedResult) {
    console.log('QR scan success:', decodedText);

    // Показываем статус сканирования
    const statusElement = document.getElementById('authStatus');
    if (statusElement) {
        statusElement.textContent = 'QR-код распознан! Обработка...';
        statusElement.className = 'auth-status loading';
    }

    // Останавливаем сканер после успешного сканирования
    stopQRScanner();

    // Обрабатываем отсканированный код
    processScannedCode(decodedText);
}

// Неудачное сканирование QR
function onQRScanFailure(error) {
    // Это нормально - функция вызывается постоянно при отсутствии QR-кода
}

// Обработка отсканированного кода
function processScannedCode(code) {
    console.log('Processing scanned code:', code);

    // Очищаем код от возможных пробелов
    const cleanCode = code.trim();

    // Проверяем формат кода (должен быть EMP001 и т.д.)
    if (!cleanCode.match(/^EMP\d{3,}$/i)) {
        showAuthStatus('Ошибка: Неверный формат QR-кода', 'error');

        // Перезапускаем сканер через 2 секунды
        setTimeout(startQRScanner, 2000);
        return;
    }

    // Используем тот же механизм авторизации что и для ручного ввода
    authenticateEmployee(cleanCode.toUpperCase());
}

// Обработка ошибок сканера
function handleScannerError(error) {
    console.error('Scanner error:', error);

    let errorMessage = 'Ошибка доступа к камере';

    if (error.includes('NotAllowedError')) {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.includes('NotFoundError')) {
        errorMessage = 'Камера не найдена';
    } else if (error.includes('NotSupportedError')) {
        errorMessage = 'Браузер не поддерживает сканирование QR-кодов';
    } else if (error.includes('NotReadableError')) {
        errorMessage = 'Камера уже используется другим приложением';
    }

    showQRScannerError(errorMessage);
}

// Показать ошибку сканера
function showQRScannerError(message) {
    const qrReader = document.getElementById('qr-reader');
    if (qrReader) {
        qrReader.innerHTML = `
            <div class="scanner-error">
                <div class="error-icon">📷</div>
                <p>${message}</p>
                <button class="btn-retry" onclick="retryQRScanner()">Повторить</button>
            </div>
        `;
    }
}

// Повторная попытка запуска сканера
function retryQRScanner() {
    const qrReader = document.getElementById('qr-reader');
    if (qrReader) {
        qrReader.innerHTML = '<div class="scanner-loading">Запуск камеры...</div>';
    }

    setTimeout(startQRScanner, 500);
}

// Обновление интерфейса сканера
function updateScannerUI(isActive) {
    const qrReader = document.getElementById('qr-reader');
    const instructions = document.querySelector('.scanner-instructions');

    if (!qrReader) return;

    if (isActive) {
        qrReader.classList.add('active');
        if (instructions) {
            const hint = instructions.querySelector('.scanner-hint');
            if (hint) {
                hint.textContent = 'Сканирование...';
            }
        }
    } else {
        qrReader.classList.remove('active');
    }
}

// Ручная авторизация по коду
function manualAuth() {
    const codeInput = document.getElementById('employeeCode');
    const code = codeInput.value.trim();

    if (!code) {
        showAuthStatus('Введите код сотрудника', 'error');
        return;
    }

    if (!code.match(/^EMP\d{3,}$/i)) {
        showAuthStatus('Неверный формат кода. Пример: EMP001', 'error');
        return;
    }

    // Останавливаем сканер при ручном вводе
    if (qrScannerActive) {
        stopQRScanner();
    }

    authenticateEmployee(code.toUpperCase());
}

// Использование демо-к