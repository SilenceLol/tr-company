// ==================== АВТОРИЗАЦИЯ И QR СКАНЕР ====================

// Глобальные переменные для сканера QR
let html5QrCode = null;
let qrScannerActive = false;
let qrScannerInitialized = false;

// Инициализация при загрузке страницы авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы на странице авторизации
    if (document.querySelector('.auth-container')) {
        // Ждем загрузки библиотеки QR сканера
        waitForQRScannerLibrary().then(() => {
            initQRScanner();
        }).catch(error => {
            console.error('Failed to load QR scanner library:', error);
            showQRScannerError('Библиотека сканера не загружена. Проверьте подключение к интернету.');
        });
    }

    // Проверяем, находимся ли мы на странице грузов
    if (document.querySelector('.app-container')) {
        initCargoPage();
    }
});

// Ожидание загрузки библиотеки QR сканера
function waitForQRScannerLibrary() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд максимум

        function checkLibrary() {
            attempts++;

            if (typeof Html5Qrcode !== 'undefined') {
                console.log('QR scanner library loaded successfully');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('QR scanner library timeout'));
            } else {
                setTimeout(checkLibrary, 100);
            }
        }

        checkLibrary();
    });
}

// Инициализация QR сканера
function initQRScanner() {
    const qrReader = document.getElementById('qr-reader');

    if (!qrReader) {
        console.log('QR reader element not found');
        return;
    }

    try {
        // Проверяем, что библиотека доступна
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error('Html5Qrcode library not available');
        }

        // Создаем сканер
        html5QrCode = new Html5Qrcode("qr-reader");
        console.log('QR scanner initialized successfully');
        qrScannerInitialized = true;

        // Обновляем интерфейс
        qrReader.innerHTML = `
            <div class="scanner-overlay">
                <div class="scanner-frame"></div>
                <div class="scanner-line"></div>
            </div>
        `;

        // Запускаем сканер
        setTimeout(startQRScanner, 500);

    } catch (error) {
        console.error('Error initializing QR scanner:', error);
        showQRScannerError('Ошибка инициализации сканера: ' + error.message);
    }
}

// Запуск сканера QR
async function startQRScanner() {
    if (!html5QrCode || !qrScannerInitialized || qrScannerActive) {
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
        console.log('QR scanner started successfully');

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

    if (error.message && error.message.includes('NotAllowedError')) {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера';
    } else if (error.message && error.message.includes('NotFoundError')) {
        errorMessage = 'Камера не найдена';
    } else if (error.message && error.message.includes('NotSupportedError')) {
        errorMessage = 'Браузер не поддерживает сканирование QR-кодов';
    } else if (error.message && error.message.includes('NotReadableError')) {
        errorMessage = 'Камера уже используется другим приложением';
    } else if (error.message) {
        errorMessage = error.message;
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

    // Перезагружаем страницу для полного сброса
    setTimeout(() => {
        location.reload();
    }, 500);
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

// Использование демо-кода
function useDemoCode(code) {
    const codeInput = document.getElementById('employeeCode');
    codeInput.value = code;

    // Останавливаем сканер при использовании демо-кода
    if (qrScannerActive) {
        stopQRScanner();
    }

    showAuthStatus(`Демо-код "${code}" установлен. Нажмите "Войти"`, 'loading');
}

// Аутентификация сотрудника
function authenticateEmployee(employeeCode) {
    showAuthStatus('Проверка кода...', 'loading');

    // Имитация проверки кода
    setTimeout(() => {
        // В реальном приложении здесь был бы запрос к серверу
        const demoEmployees = {
            'EMP001': { id: 'EMP001', name: 'Иванов Алексей' },
            'EMP002': { id: 'EMP002', name: 'Петрова Мария' },
            'EMP003': { id: 'EMP003', name: 'Сидоров Дмитрий' }
        };

        const employee = demoEmployees[employeeCode];

        if (employee) {
            // Добавляем время входа
            employee.loginTime = new Date().toISOString();

            // Сохраняем данные авторизации
            localStorage.setItem('employeeAuth', JSON.stringify(employee));

            showAuthStatus(`Успешный вход! Добро пожаловать, ${employee.name}`, 'success');

            // Перенаправляем на главную страницу через 1.5 секунды
            setTimeout(() => {
                window.location.href = 'cargo.html';
            }, 1500);

        } else {
            showAuthStatus('Код сотрудника не найден', 'error');

            // Перезапускаем сканер через 2 секунды
            setTimeout(startQRScanner, 2000);
        }
    }, 1000);
}

// Показать статус авторизации
function showAuthStatus(message, type) {
    const statusElement = document.getElementById('authStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `auth-status ${type}`;
    }
}

// Остановка сканера при уходе со страницы
window.addEventListener('beforeunload', function() {
    if (qrScannerActive) {
        stopQRScanner();
    }
});

// ==================== СТРАНИЦА ГРУЗОВ ====================

// Инициализация страницы грузов
function initCargoPage() {
    // Проверяем авторизацию
    if (!checkAuth()) {
        return;
    }

    // Продолжаем обычную инициализацию
    initCargoTypeSelection();
    loadCargoList();
    updateAllDisplays();

    // Обновляем информацию о сотруднике
    updateEmployeeInfo();
}

// Проверка авторизации
function checkAuth() {
    const authData = localStorage.getItem('employeeAuth');

    if (!authData) {
        // Перенаправляем на страницу авторизации
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
        window.location.href = 'index.html';
        return false;
    }
}

// Обновление информации о сотруднике
function updateEmployeeInfo() {
    const authData = localStorage.getItem('employeeAuth');

    if (authData) {
        const employee = JSON.parse(authData);
        document.getElementById('employeeName').textContent = employee.name;
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('employeeAuth');
        window.location.href = 'index.html';
    }
}

// Текущий выбранный тип груза и параметры
let currentCargoType = null;
let currentDimensions = {
    length: 0,
    width: 0,
    height: 0
};
let currentWeight = 0;
let currentPhoto = null;
let cargoList = [];
let currentCargoId = null;

// Стандартные размеры паллетов
const palletSizes = {
    'euro-pallet': { length: 120, width: 80, height: 30 },
    'american-pallet': { length: 120, width: 120, height: 30 },
    'box': { length: 50, width: 40, height: 30 },
    'non-standard': { length: 100, width: 50, height: 40 }
};

// Emoji для типов грузов (используются только в модальном окне)
const cargoIcons = {
    'euro-pallet': '🚛',
    'american-pallet': '🚛',
    'box': '📦',
    'non-standard': '📏'
};

// Инициализация выбора типа груза
function initCargoTypeSelection() {
    const cargoTypes = document.querySelectorAll('.cargo-type-column');

    cargoTypes.forEach(type => {
        type.addEventListener('click', function() {
            cargoTypes.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');

            currentCargoType = this.getAttribute('data-type');
            console.log('Выбран тип груза:', currentCargoType);

            // Устанавливаем стандартные размеры
            setPalletDimensions(currentCargoType);

            // Сбрасываем фото при смене типа груза
            resetPhoto();

            // Сбрасываем текущий ID (создаем новый груз)
            currentCargoId = null;

            // Активируем контролы
            updateControlsState();
            updateSaveButtonState();
        });
    });
}

// Установка размеров для паллетов
function setPalletDimensions(palletType) {
    const sizes = palletSizes[palletType];
    currentDimensions.length = sizes.length;
    currentDimensions.width = sizes.width;
    currentDimensions.height = sizes.height;
    currentWeight = 1;

    // Обновляем отображение всех размеров
    updateAllDimensionsDisplay();
    document.getElementById('weight').textContent = currentWeight;
    updateSaveButtonState();
}

// Обновить отображение всех размеров
function updateAllDimensionsDisplay() {
    document.getElementById('lengthValue').textContent = currentDimensions.length;
    document.getElementById('widthValue').textContent = currentDimensions.width;
    document.getElementById('heightValue').textContent = currentDimensions.height;
    updateSaveButtonState();
}

// Обновление состояния контролов (активны/неактивны)
function updateControlsState() {
    const controls = document.querySelectorAll('.control-buttons-mini button');
    const isActive = currentCargoType !== null;

    controls.forEach(control => {
        control.disabled = !isActive;
        control.style.opacity = isActive ? '1' : '0.5';
        control.style.cursor = isActive ? 'pointer' : 'not-allowed';
    });

    const weightElement = document.getElementById('weight');
    if (weightElement) {
        weightElement.style.opacity = isActive ? '1' : '0.5';
    }
}

// Обновление состояния кнопки сохранения
function updateSaveButtonState() {
    const saveButton = document.querySelector('.btn-save-mini');
    const isActive = currentCargoType !== null &&
        currentWeight > 0 &&
        (currentDimensions.length > 0 || currentDimensions.width > 0 || currentDimensions.height > 0);

    if (saveButton) {
        saveButton.disabled = !isActive;
        saveButton.style.opacity = isActive ? '1' : '0.5';
        saveButton.style.cursor = isActive ? 'pointer' : 'not-allowed';
    }
}

// Изменение веса (шаг 1)
function changeWeight(change) {
    if (!currentCargoType) return;

    const newWeight = currentWeight + change;
    if (newWeight >= 0 && newWeight <= 10000) {
        currentWeight = newWeight;
        document.getElementById('weight').textContent = currentWeight;
        updateSaveButtonState();
    }
}

// Изменение размеров (шаг 10)
function changeDimension(dimension, change) {
    if (!currentCargoType) return;

    let newValue = currentDimensions[dimension] + change;

    if (newValue >= 0 && newValue <= 1000) {
        currentDimensions[dimension] = newValue;

        if (dimension === 'length') {
            document.getElementById('lengthValue').textContent = newValue;
        } else if (dimension === 'width') {
            document.getElementById('widthValue').textContent = newValue;
        } else if (dimension === 'height') {
            document.getElementById('heightValue').textContent = newValue;
        }

        updateSaveButtonState();
    }
}

// Показать временное уведомление
function showTempAlert(message, duration = 2000) {
    const alertDiv = document.createElement('div');
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        min-width: 200px;
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, duration);
}

// Сохранить груз
function saveCargo() {
    console.log('Сохранение груза...', { currentCargoType, currentWeight, currentDimensions, hasPhoto: !!currentPhoto });

    if (!currentCargoType) {
        showTempAlert('Сначала выберите тип груза!', 2000);
        return;
    }

    if (currentWeight === 0) {
        showTempAlert('Укажите вес груза!', 2000);
        return;
    }

    if (currentDimensions.length === 0 && currentDimensions.width === 0 && currentDimensions.height === 0) {
        showTempAlert('Укажите хотя бы один размер груза!', 2000);
        return;
    }

    // Создаем объект груза БЕЗ фотографии (сохраняем только ссылку если есть)
    const cargo = {
        id: currentCargoId || Date.now(),
        type: currentCargoType,
        weight: currentWeight,
        dimensions: {...currentDimensions},
        photo: currentPhoto, // Сохраняем как data URL
        timestamp: new Date().toLocaleString('ru-RU')
    };

    console.log('Создан груз:', cargo);

    let isNewCargo = false;

    if (currentCargoId) {
        // Обновляем существующий груз
        const index = cargoList.findIndex(c => c.id === currentCargoId);
        if (index !== -1) {
            cargoList[index] = cargo;
            showTempAlert('Груз обновлен!', 1500);
        }
    } else {
        // Добавляем новый груз
        cargoList.push(cargo);
        console.log('Добавлен новый груз. Всего грузов:', cargoList.length);
        showTempAlert('Груз сохранен!', 1500);
        isNewCargo = true;
    }

    // Сохраняем и обновляем интерфейс
    saveCargoList();
    updateAllDisplays();

    // Сбрасываем для нового груза только если это был новый груз
    if (isNewCargo) {
        resetCurrentCargo();
        currentCargoId = null;
    }
}

// Сделать фото
function takePhoto() {
    if (!currentCargoType) {
        showTempAlert('Сначала выберите тип груза!', 2000);
        return;
    }
    document.getElementById('photoInput').click();
}

// Обработка выбора фото
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentPhoto = e.target.result;
                    const photoElement = document.getElementById('cargoPhoto');
                    const placeholder = document.getElementById('photoPlaceholder');

                    if (photoElement && placeholder) {
                        photoElement.src = currentPhoto;
                        photoElement.style.display = 'block';
                        placeholder.style.display = 'none';
                    }

                    console.log('Фото загружено, размер:', currentPhoto.length, 'символов');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Сброс фото
function resetPhoto() {
    currentPhoto = null;
    const photoElement = document.getElementById('cargoPhoto');
    const placeholder = document.getElementById('photoPlaceholder');
    if (photoElement && placeholder) {
        photoElement.style.display = 'none';
        placeholder.style.display = 'flex';
    }
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.value = '';
    }
}

// Сброс текущих настроек
function resetCurrentCargo() {
    currentWeight = 0;
    currentDimensions = { length: 0, width: 0, height: 0 };
    currentPhoto = null;

    document.getElementById('weight').textContent = currentWeight;
    updateAllDimensionsDisplay();
    resetPhoto();
    updateSaveButtonState();
}

// Удалить груз из списка
function removeCargo(cargoId) {
    cargoId = parseInt(cargoId);
    const originalLength = cargoList.length;

    cargoList = cargoList.filter(cargo => {
        const cargoIdNum = typeof cargo.id === 'string' ? parseInt(cargo.id) : cargo.id;
        return cargoIdNum !== cargoId;
    });

    if (cargoList.length < originalLength) {
        saveCargoList();
        updateAllDisplays();

        if (document.getElementById('cargoListModal').style.display === 'block') {
            renderCargoListModal();
            if (cargoList.length === 0) {
                closeCargoListModal();
            }
        }

        showTempAlert('Груз удален!', 1500);
    }

    if (currentCargoId === cargoId) {
        currentCargoId = null;
    }
}

// Сохранить список грузов (с обработкой больших фото)
function saveCargoList() {
    try {
        // Ограничиваем размер фото для мобильных устройств
        const cargoListToSave = cargoList.map(cargo => {
            const cargoCopy = {...cargo};
            // Если фото слишком большое, не сохраняем его
            if (cargoCopy.photo && cargoCopy.photo.length > 100000) { // ~100KB
                console.log('Фото слишком большое, не сохраняем');
                cargoCopy.photo = null;
            }
            return cargoCopy;
        });

        localStorage.setItem('cargoList', JSON.stringify(cargoListToSave));
        console.log('Список грузов сохранен. Всего:', cargoListToSave.length);
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        // Пробуем сохранить без фото
        try {
            const cargoListWithoutPhotos = cargoList.map(cargo => ({
                ...cargo,
                photo: null
            }));
            localStorage.setItem('cargoList', JSON.stringify(cargoListWithoutPhotos));
            console.log('Список сохранен без фото');
        } catch (e2) {
            console.error('Критическая ошибка сохранения:', e2);
        }
    }
}

// Загрузить список грузов
function loadCargoList() {
    try {
        const saved = localStorage.getItem('cargoList');
        if (saved) {
            cargoList = JSON.parse(saved);
            // Валидация и нормализация данных
            cargoList = cargoList.filter(cargo =>
                cargo &&
                cargo.id &&
                cargo.type &&
                typeof cargo.weight === 'number' &&
                cargo.dimensions &&
                typeof cargo.dimensions.length === 'number' &&
                typeof cargo.dimensions.width === 'number' &&
                typeof cargo.dimensions.height === 'number'
            ).map(cargo => ({
                ...cargo,
                id: typeof cargo.id === 'string' ? parseInt(cargo.id) : cargo.id
            }));

            console.log('Загружено грузов:', cargoList.length);
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        cargoList = [];
    }
}

// Обновить все отображения
function updateAllDisplays() {
    updateCargoCount();
    updateTotals();
    updateSaveButtonState();
}

// Обновить счетчик грузов
function updateCargoCount() {
    const count = cargoList.length;
    console.log('Обновление счетчика грузов:', count);

    const cargoCountElement = document.getElementById('cargoCount');
    const modalCargoCountElement = document.getElementById('modalCargoCount');

    if (cargoCountElement) {
        cargoCountElement.textContent = count;
        console.log('Счетчик обновлен:', count);
    }
    if (modalCargoCountElement) {
        modalCargoCountElement.textContent = count;
    }
}

// Обновить итоговые показатели
function updateTotals() {
    const totalWeight = cargoList.reduce((sum, cargo) => {
        return sum + (cargo.weight || 0);
    }, 0);

    const totalVolume = cargoList.reduce((sum, cargo) => {
        if (!cargo.dimensions) return sum;
        const length = cargo.dimensions.length || 0;
        const width = cargo.dimensions.width || 0;
        const height = cargo.dimensions.height || 0;
        const volume = (length * width * height) / 1000000;
        return sum + volume;
    }, 0);

    console.log('Обновление итогов:', { totalWeight, totalVolume, грузов: cargoList.length });

    // Основные показатели
    const totalWeightElement = document.getElementById('totalWeight');
    const totalVolumeElement = document.getElementById('totalVolume');

    if (totalWeightElement) {
        totalWeightElement.textContent = `${totalWeight} кг`;
    }
    if (totalVolumeElement) {
        totalVolumeElement.textContent = `${totalVolume.toFixed(3)} м³`;
    }

    // В модальном окне
    const modalTotalWeightElement = document.getElementById('modalTotalWeight');
    const modalTotalVolumeElement = document.getElementById('modalTotalVolume');

    if (modalTotalWeightElement) {
        modalTotalWeightElement.textContent = `${totalWeight} кг`;
    }
    if (modalTotalVolumeElement) {
        modalTotalVolumeElement.textContent = `${totalVolume.toFixed(3)} м³`;
    }
}

// Показать модальное окно списка грузов
function showCargoListModal() {
    if (cargoList.length === 0) {
        showTempAlert('Нет добавленных грузов!', 2000);
        return;
    }

    renderCargoListModal();
    document.getElementById('cargoListModal').style.display = 'block';
}

// Закрыть модальное окно списка грузов
function closeCargoListModal() {
    document.getElementById('cargoListModal').style.display = 'none';
}

// Отобразить список грузов в модальном окне
function renderCargoListModal() {
    const container = document.getElementById('cargoListContent');

    if (!container) return;

    if (cargoList.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет добавленных грузов</div>';
        return;
    }

    container.innerHTML = cargoList.map(cargo => {
        const cargoId = typeof cargo.id === 'string' ? parseInt(cargo.id) : cargo.id;
        const length = cargo.dimensions.length || 0;
        const width = cargo.dimensions.width || 0;
        const height = cargo.dimensions.height || 0;
        const volume = (length * width * height) / 1000000;

        return `
        <div class="cargo-list-item">
            <div class="cargo-list-header">
                <div class="cargo-type-badge">
                    <span class="cargo-emoji-small">${cargoIcons[cargo.type]}</span>
                    ${getCargoTypeName(cargo.type)}
                </div>
                <span class="cargo-weight">${cargo.weight || 0} кг</span>
            </div>
            <div class="cargo-details">
                <div class="detail-item">
                    <span class="detail-label">Размеры:</span>
                    <span class="detail-value">${length}×${width}×${height} см</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Объем:</span>
                    <span class="detail-value">${volume.toFixed(3)} м³</span>
                </div>
            </div>
            ${cargo.photo ? `<img src="${cargo.photo}" class="cargo-photo-preview" alt="Фото груза">` : ''}
            <div class="cargo-actions">
                <button class="remove-cargo" onclick="removeCargo(${cargoId})">
                    🗑️ Удалить
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Отправить оператору
function sendToOperator() {
    if (cargoList.length === 0) {
        showTempAlert('Добавьте хотя бы один груз перед отправкой!', 2000);
        return;
    }

    const totalWeight = cargoList.reduce((sum, cargo) => sum + (cargo.weight || 0), 0);
    const totalVolume = cargoList.reduce((sum, cargo) => {
        const length = cargo.dimensions.length || 0;
        const width = cargo.dimensions.width || 0;
        const height = cargo.dimensions.height || 0;
        return sum + (length * width * height) / 1000000;
    }, 0);

    const shipmentData = {
        cargos: cargoList.map(cargo => ({
            ...cargo,
            photo: cargo.photo ? 'Есть фото' : 'Нет фото' // Не отправляем большие фото
        })),
        totalWeight: totalWeight,
        totalVolume: parseFloat(totalVolume.toFixed(3)),
        timestamp: new Date().toLocaleString('ru-RU'),
        totalItems: cargoList.length
    };

    console.log('Отправка оператору:', shipmentData);
    showTempAlert(`Данные отправлены оператору!\nМест: ${cargoList.length}\nМасса: ${totalWeight} кг\nОбъем: ${totalVolume.toFixed(3)} м³`, 3000);

    // Очищаем список
    cargoList = [];
    saveCargoList();
    updateAllDisplays();
    resetCurrentCargo();
    currentCargoId = null;
}

// Получить название типа груза
function getCargoTypeName(type) {
    const names = {
        'euro-pallet': 'Европаллет',
        'american-pallet': 'Американский паллет',
        'box': 'Коробка',
        'non-standard': 'Нестандартный груз'
    };
    return names[type] || type;
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(e) {
    const cargoListModal = document.getElementById('cargoListModal');
    if (e.target === cargoListModal) {
        closeCargoListModal();
    }
});

// Предотвращение масштабирования при двойном тапе
// Предотвращение масштабирования при двойном тапе
document.addEventListener('dblclick', function(e) {
    e.preventDefault();
}, { passive: false });

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Функция для безопасного получения элемента
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// Функция для безопасной установки текста
function setText(id, text) {
    const element = getElement(id);
    if (element) {
        element.textContent = text;
    }
}

// Функция для безопасной установки HTML
function setHTML(id, html) {
    const element = getElement(id);
    if (element) {
        element.innerHTML = html;
    }
}

// Функция для показа/скрытия элемента
function toggleElement(id, show) {
    const element = getElement(id);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

// ==================== ОБРАБОТКА ОШИБОК ====================

// Глобальный обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);

    // Показываем пользователю понятное сообщение об ошибке
    if (document.querySelector('.auth-container')) {
        showAuthStatus('Произошла ошибка. Пожалуйста, перезагрузите страницу.', 'error');
    } else {
        showTempAlert('Произошла ошибка. Пожалуйста, перезагрузите страницу.', 5000);
    }
});

// Обработчик ошибок Promise
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// ==================== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ====================

// Функция для троттлинга (ограничение частоты вызовов)
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Функция для дебаунсинга (откладывание вызовов)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Оптимизированные обработчики для частых операций
const optimizedUpdateTotals = throttle(updateTotals, 100);
const optimizedSaveCargoList = debounce(saveCargoList, 500);

// ==================== РАБОТА С ФОТОГРАФИЯМИ ====================

// Сжатие фотографии перед сохранением
function compressPhoto(dataUrl, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Рассчитываем новые размеры
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            // Рисуем сжатое изображение
            ctx.drawImage(img, 0, 0, width, height);

            // Получаем сжатый data URL
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };

        img.onerror = function() {
            // В случае ошибки возвращаем оригинал
            resolve(dataUrl);
        };

        img.src = dataUrl;
    });
}

// Обработка выбора фото с сжатием
function handlePhotoSelect(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            reject(new Error('Please select an image file'));
            return;
        }

        // Проверяем размер файла (максимум 10MB)
        if (file.size > 10 * 1024 * 1024) {
            reject(new Error('File size too large. Maximum 10MB'));
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                // Сжимаем фото
                const compressedPhoto = await compressPhoto(e.target.result);
                resolve(compressedPhoto);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function() {
            reject(new Error('Error reading file'));
        };

        reader.readAsDataURL(file);
    });
}

// Обновленная функция для загрузки фото
async function loadPhoto(file) {
    try {
        showTempAlert('Обработка фото...', 1000);

        const compressedPhoto = await handlePhotoSelect(file);
        currentPhoto = compressedPhoto;

        const photoElement = document.getElementById('cargoPhoto');
        const placeholder = document.getElementById('photoPlaceholder');

        if (photoElement && placeholder) {
            photoElement.src = currentPhoto;
            photoElement.style.display = 'block';
            placeholder.style.display = 'none';
        }

        console.log('Фото загружено и сжато, размер:', currentPhoto.length, 'символов');
        showTempAlert('Фото успешно загружено!', 1500);

    } catch (error) {
        console.error('Error loading photo:', error);
        showTempAlert(error.message, 3000);
    }
}

// ==================== ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ====================

// Безопасное сохранение в localStorage
function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);

        // Пробуем очистить старые данные если не хватает места
        if (error.name === 'QuotaExceededError') {
            try {
                // Удаляем старые фото чтобы освободить место
                const keysToRemove = Object.keys(localStorage).filter(k =>
                    k.startsWith('cargoPhoto_') || k === 'cargoList'
                );

                keysToRemove.forEach(k => localStorage.removeItem(k));

                // Пробуем снова с данными без фото
                const dataWithoutPhotos = Array.isArray(value) ?
                    value.map(item => ({ ...item, photo: null })) :
                    value;

                localStorage.setItem(key, JSON.stringify(dataWithoutPhotos));
                showTempAlert('Недостаточно места. Фото не будут сохранены.', 3000);
                return true;
            } catch (e) {
                showTempAlert('Ошибка сохранения данных. Пожалуйста, отправьте данные оператору.', 5000);
                return false;
            }
        }
        return false;
    }
}

// Безопасное чтение из localStorage
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Обновленные функции работы с localStorage
function saveCargoList() {
    const success = safeLocalStorageSet('cargoList', cargoList);
    if (success) {
        console.log('Список грузов сохранен. Всего:', cargoList.length);
    }
    return success;
}

function loadCargoList() {
    const saved = safeLocalStorageGet('cargoList', []);

    if (saved && Array.isArray(saved)) {
        cargoList = saved.map(cargo => ({
            ...cargo,
            id: typeof cargo.id === 'string' ? parseInt(cargo.id) : cargo.id,
            // Восстанавливаем стандартные значения если они отсутствуют
            weight: cargo.weight || 0,
            dimensions: cargo.dimensions || { length: 0, width: 0, height: 0 },
            photo: cargo.photo || null
        })).filter(cargo =>
            cargo && cargo.id && cargo.type &&
            typeof cargo.weight === 'number'
        );

        console.log('Загружено грузов:', cargoList.length);
    } else {
        cargoList = [];
    }
}

// ==================== РАБОТА С КАМЕРОЙ ====================

// Проверка поддержки камеры
function checkCameraSupport() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        typeof Html5Qrcode !== 'undefined');
}

// Получение списка доступных камер
async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error getting cameras:', error);
        return [];
    }
}

// Переключение между камерами
async function switchCamera() {
    if (!html5QrCode || !qrScannerActive) return;

    try {
        const cameras = await getAvailableCameras();
        if (cameras.length < 2) {
            showTempAlert('Доступна только одна камера', 2000);
            return;
        }

        // Останавливаем текущую камеру
        await stopQRScanner();

        // Запускаем следующую камеру
        setTimeout(startQRScanner, 500);

    } catch (error) {
        console.error('Error switching camera:', error);
        showTempAlert('Ошибка переключения камеры', 2000);
    }
}

// ==================== ЭКСПОРТ ДАННЫХ ====================

// Экспорт данных в формате JSON
function exportData() {
    if (cargoList.length === 0) {
        showTempAlert('Нет данных для экспорта', 2000);
        return;
    }

    const exportData = {
        company: 'NORD WHEEL',
        timestamp: new Date().toISOString(),
        employee: safeLocalStorageGet('employeeAuth', {}),
        cargos: cargoList.map(cargo => ({
            ...cargo,
            photo: cargo.photo ? 'base64_image' : null // Заменяем большие данные
        })),
        summary: {
            totalItems: cargoList.length,
            totalWeight: cargoList.reduce((sum, cargo) => sum + (cargo.weight || 0), 0),
            totalVolume: cargoList.reduce((sum, cargo) => {
                const dim = cargo.dimensions || {};
                return sum + ((dim.length || 0) * (dim.width || 0) * (dim.height || 0)) / 1000000;
            }, 0)
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `nord_wheel_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showTempAlert('Данные экспортированы в JSON', 2000);
}

// Печать отчета
function printReport() {
    if (cargoList.length === 0) {
        showTempAlert('Нет данных для печати', 2000);
        return;
    }

    const printWindow = window.open('', '_blank');
    const employee = safeLocalStorageGet('employeeAuth', {});

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Отчет NORD WHEEL</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .employee { margin-bottom: 15px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f2f2f2; }
                .summary { margin-top: 20px; font-weight: bold; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>NORD WHEEL - Отчет по грузам</h1>
                <p>Дата: ${new Date().toLocaleString('ru-RU')}</p>
            </div>
            
            <div class="employee">
                <p><strong>Сотрудник:</strong> ${employee.name || 'Не указан'} (${employee.id || 'Не указан'})</p>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Тип груза</th>
                        <th>Вес (кг)</th>
                        <th>Размеры (см)</th>
                        <th>Объем (м³)</th>
                        <th>Фото</th>
                    </tr>
                </thead>
                <tbody>
                    ${cargoList.map(cargo => {
        const dim = cargo.dimensions || {};
        const volume = ((dim.length || 0) * (dim.width || 0) * (dim.height || 0)) / 1000000;
        return `
                            <tr>
                                <td>${getCargoTypeName(cargo.type)}</td>
                                <td>${cargo.weight || 0}</td>
                                <td>${dim.length || 0}×${dim.width || 0}×${dim.height || 0}</td>
                                <td>${volume.toFixed(3)}</td>
                                <td>${cargo.photo ? 'Есть' : 'Нет'}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <p>Итого: ${cargoList.length} мест, 
                Общий вес: ${cargoList.reduce((sum, cargo) => sum + (cargo.weight || 0), 0)} кг, 
                Общий объем: ${cargoList.reduce((sum, cargo) => {
        const dim = cargo.dimensions || {};
        return sum + ((dim.length || 0) * (dim.width || 0) * (dim.height || 0)) / 1000000;
    }, 0).toFixed(3)} м³</p>
            </div>
            
            <button class="no-print" onclick="window.print()">Печать</button>
            <button class="no-print" onclick="window.close()">Закрыть</button>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ==================== СИСТЕМНЫЕ ФУНКЦИИ ====================

// Проверка подключения к интернету
function checkOnlineStatus() {
    return navigator.onLine;
}

// Обработчик изменения онлайн-статуса
window.addEventListener('online', function() {
    showTempAlert('Подключение восстановлено', 2000);
});

window.addEventListener('offline', function() {
    showTempAlert('Отсутствует подключение к интернету', 5000);
});

// Сохранение состояния при закрытии страницы
window.addEventListener('beforeunload', function(e) {
    if (cargoList.length > 0) {
        // Сохраняем данные перед закрытием
        saveCargoList();

        // Показываем предупреждение только если есть несохраненные изменения
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные данные. Вы уверены, что хотите покинуть страницу?';
        return e.returnValue;
    }
});

// Восстановление состояния при загрузке страницы
window.addEventListener('load', function() {
    console.log('Page loaded, online status:', checkOnlineStatus());

    // Проверяем поддержку необходимых функций
    if (!checkCameraSupport() && document.querySelector('.auth-container')) {
        console.warn('Camera not supported');
    }
});

// ==================== ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ ====================

// Инициализация всех компонентов страницы грузов
function initCargoPage() {
    console.log('Initializing cargo page...');

    // Проверяем авторизацию
    if (!checkAuth()) {
        return;
    }

    try {
        // Инициализируем компоненты
        initCargoTypeSelection();
        loadCargoList();
        updateAllDisplays();
        updateEmployeeInfo();

        // Инициализируем обработчики событий
        initEventListeners();

        console.log('Cargo page initialized successfully');

    } catch (error) {
        console.error('Error initializing cargo page:', error);
        showTempAlert('Ошибка инициализации страницы', 5000);
    }
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Обработчик для поля ввода кода сотрудника
    const employeeCodeInput = document.getElementById('employeeCode');
    if (employeeCodeInput) {
        employeeCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                manualAuth();
            }
        });
    }

    // Обработчик для поля ввода веса (если есть)
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.addEventListener('input', function(e) {
            const value = parseInt(e.target.value) || 0;
            if (value >= 0 && value <= 10000) {
                currentWeight = value;
                updateSaveButtonState();
            }
        });
    }
}

// ==================== ТЕСТИРОВАНИЕ И ОТЛАДКА ====================

// Функция для тестирования (только в development)
function runTests() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Running tests...');

        // Тест localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('✅ localStorage test passed');
        } catch (e) {
            console.error('❌ localStorage test failed:', e);
        }

        // Тест функций
        console.log('✅ All tests completed');
    }
}

// Запуск тестов при загрузке в development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', runTests);
}

// ==================== ГЛОБАЛЬНЫЙ ЭКСПОРТ ФУНКЦИЙ ====================

// Экспортируем функции в глобальную область видимости
window.manualAuth = manualAuth;
window.useDemoCode = useDemoCode;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.retryQRScanner = retryQRScanner;
window.logout = logout;
window.changeWeight = changeWeight;
window.changeDimension = changeDimension;
window.takePhoto = takePhoto;
window.saveCargo = saveCargo;
window.removeCargo = removeCargo;
window.showCargoListModal = showCargoListModal;
window.closeCargoListModal = closeCargoListModal;
window.sendToOperator = sendToOperator;
window.exportData = exportData;
window.printReport = printReport;

console.log('NORD WHEEL application initialized');