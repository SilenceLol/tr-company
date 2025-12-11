// auth.js - Логика авторизации

let html5QrCode = null;
let isScannerActive = false;
let lastScannedCode = '';

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Auth initialized');
    checkExistingSession();
    
    setTimeout(() => {
        const input = document.getElementById('employeeCode');
        if (input) {
            input.focus();
        }
    }, 500);
});

// ЗАПУСК QR-СКАНЕРА
function startQRScanner() {
    if (isScannerActive) return;
    
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
        
        setTimeout(() => {
            initQRScanner();
        }, 500);
        
    } catch (error) {
        console.error('Scanner initialization error:', error);
        handleScannerError(error);
        resetScannerUI();
    }
}

// ИНИЦИАЛИЗАЦИЯ QR-СКАНЕРА
function initQRScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        handleQRScanSuccess(decodedText);
    };
    
    const qrCodeErrorCallback = (error) => {
        // Игнорируем ошибки сканирования
    };
    
    const config = {
        fps: 10,
        qrbox: {
            width: 220,
            height: 220
        },
        aspectRatio: 1.0,
        disableFlip: false
    };
    
    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length > 0) {
            let cameraId = cameras[0].id;
            
            for (let i = 0; i < cameras.length; i++) {
                if (cameras[i].label.toLowerCase().includes('back') || 
                    cameras[i].label.toLowerCase().includes('rear') ||
                    cameras[i].label.toLowerCase().includes('environment')) {
                    cameraId = cameras[i].id;
                    break;
                }
            }
            
            html5QrCode.start(
                cameraId,
                config,
                qrCodeSuccessCallback,
                qrCodeErrorCallback
            ).then(() => {
                document.querySelector('.camera-loader')?.remove();
                isScannerActive = true;
                showAuthStatus('Сканер активен. Наведите на QR-код', 'scanning');
                
                document.getElementById('scannerInstructions').innerHTML = `
                    <p><strong>Сканер активен!</strong></p>
                    <p>Наведите камеру на QR-код сотрудника</p>
                    <p><small>Расположите QR-код внутри зеленой рамки</small></p>
                `;
            }).catch(err => {
                console.error('Failed to start rear camera:', err);
                startWithEnvironmentMode();
            });
            
        } else {
            startWithEnvironmentMode();
        }
    }).catch(err => {
        console.error('Failed to get cameras:', err);
        startWithEnvironmentMode();
    });
}

// ЗАПУСК В РЕЖИМЕ ENVIRONMENT
function startWithEnvironmentMode() {
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        handleQRScanSuccess(decodedText);
    };
    
    const qrCodeErrorCallback = (error) => {
        // Игнорируем
    };
    
    const config = {
        fps: 10,
        qrbox: {
            width: 220,
            height: 220
        },
        aspectRatio: 1.0,
        disableFlip: false
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    ).then(() => {
        document.querySelector('.camera-loader')?.remove();
        isScannerActive = true;
        showAuthStatus('Сканер активен. Наведите на QR-код', 'scanning');
    }).catch(err => {
        console.error('Failed to start with environment mode:', err);
        handleScannerError(err);
        resetScannerUI();
    });
}

// ОСТАНОВКА СКАНЕРА
async function stopQRScanner() {
    if (!isScannerActive || !html5QrCode) return;
    
    try {
        showAuthStatus('Останавливаю сканер...', 'loading');
        await html5QrCode.stop();
        html5QrCode = null;
        isScannerActive = false;
        resetScannerUI();
        
        showAuthStatus('Сканер остановлен', 'loading');
        setTimeout(() => {
            showAuthStatus('Нажмите "Запустить QR-сканер" для начала работы', '');
        }, 2000);
        
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
    console.log('QR Code scanned:', decodedText);
    
    if (decodedText === lastScannedCode) return;
    
    lastScannedCode = decodedText;
    
    const employeeCode = extractEmployeeCode(decodedText);
    
    if (employeeCode) {
        showAuthStatus(`✅ QR-код распознан: ${employeeCode}`, 'success');
        
        const scannerFrame = document.querySelector('.scanner-frame');
        scannerFrame.style.borderColor = '#00ff00';
        scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 255, 0, 0.2)';
        
        setTimeout(() => {
            scannerFrame.style.borderColor = '#00ff00';
            scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 0, 0, 0.5)';
        }, 300);
        
        setTimeout(() => {
            stopQRScanner();
            setTimeout(() => {
                authenticateEmployee(employeeCode);
            }, 1000);
        }, 1000);
        
    } else {
        showAuthStatus('❌ Неверный формат QR-кода', 'error');
        
        const scannerFrame = document.querySelector('.scanner-frame');
        scannerFrame.style.borderColor = '#ff0000';
        scannerFrame.style.boxShadow = '0 0 0 1000px rgba(255, 0, 0, 0.2)';
        
        setTimeout(() => {
            scannerFrame.style.borderColor = '#00ff00';
            scannerFrame.style.boxShadow = '0 0 0 1000px rgba(0, 0, 0, 0.5)';
        }, 500);
        
        setTimeout(() => {
            lastScannedCode = '';
        }, 3000);
    }
}

// ИЗВЛЕЧЕНИЕ КОДА СОТРУДНИКА
function extractEmployeeCode(qrData) {
    if (!qrData) return null;
    
    const cleanData = qrData.trim().toUpperCase();
    
    // Различные форматы кодов
    if (cleanData === 'EMP00') return 'EMP00';
    
    const directMatch = cleanData.match(/^EMP\d{2,3}$/);
    if (directMatch) return directMatch[0];
    
    const anywhereMatch = cleanData.match(/(EMP\d{2,3})/);
    if (anywhereMatch && anywhereMatch[1]) return anywhereMatch[1];
    
    // Проверяем, может быть это просто код без "EMP"
    const numericMatch = cleanData.match(/^\d{3,6}$/);
    if (numericMatch) return 'EMP' + numericMatch[0].padStart(3, '0');
    
    return null;
}

// ОБРАБОТКА ОШИБОК СКАНЕРА
function handleScannerError(error) {
    let errorMessage = 'Не удалось запустить сканер';
    
    if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена';
    } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Браузер не поддерживает доступ к камере';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера уже используется';
    }
    
    showAuthStatus(errorMessage, 'error');
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
    
    authenticateEmployee(code);
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
    
    setTimeout(() => {
        const employee = employees[employeeCode];
        
        if (employee) {
            employee.loginTime = new Date().toISOString();
            employee.loginTimeDisplay = new Date().toLocaleString('ru-RU');
            employee.sessionId = 'SESS_' + Date.now();
            
            localStorage.setItem('employeeAuth', JSON.stringify(employee));
            
            showAuthStatus(`✅ Успешный вход! Добро пожаловать, ${employee.name}`, 'success');
            
            setTimeout(() => {
                window.location.href = 'cargo.html';
            }, 1500);
            
        } else {
            showAuthStatus('❌ Код сотрудника не найден', 'error');
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
            }
        } catch (e) {
            localStorage.removeItem('employeeAuth');
        }
    }
}

// ОСТАНОВКА СКАНЕРА ПРИ ПЕРЕЗАГРУЗКЕ
window.addEventListener('beforeunload', function() {
    if (isScannerActive && html5QrCode) {
        html5QrCode.stop();
    }
});

// ЭКСПОРТ ФУНКЦИЙ
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
