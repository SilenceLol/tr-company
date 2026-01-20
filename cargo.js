// cargo.js - ПОЛНАЯ ВЕРСИЯ С ИНТЕГРАЦИЕЙ АВТОРИЗАЦИИ

let cargoList = [];
let currentCargoType = 'euro-pallet';
let currentPackagingType = 'none';
let currentPackagingCount = 0;
let currentPhotos = []; // Массив для хранения нескольких фото

// Начальные значения для параметров
let cargoParams = {
    quantity: 1,     // Кол-во мест
    weight: 10,      // ОБЩИЙ вес груза (кг) - вводится пользователем
    length: 120,
    width: 80,
    height: 30
};

// Карта для группировки одинаковых грузов
let groupedCargo = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация cargo.js...');
    
    // Загружаем сохраненные грузы из localStorage
    loadCargoList();
    
    // Устанавливаем начальные значения
    selectCargoType('euro-pallet');
    selectPackagingType('none');
    
    // Обновляем статистику
    updateCurrentStats();
    updateTotalStats();
    
    // Загружаем имя сотрудника ИЗ СИСТЕМЫ АВТОРИЗАЦИИ
    loadEmployeeName();
    
    // Настраиваем обработчики для полей ввода
    setupInputHandlers();
    
    // Инициализируем обработчик фото
    initPhotoHandler();
    
    // Добавляем обработчики для мобильных кнопок
    initMobileButtons();
    
    console.log('cargo.js инициализирован');
});

// Инициализация обработчика фото
function initPhotoHandler() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelection);
    }
}

// Настройка обработчиков для полей ввода
function setupInputHandlers() {
    // Обработчики для полей ввода чисел
    const numberInputs = document.querySelectorAll('.param-input');
    numberInputs.forEach(input => {
        // Обработчик изменения через клавиатуру
        input.addEventListener('input', function() {
            const param = this.id.replace('Input', '');
            handleInputChange(param, this.value);
        });
        
        // Обработчик потери фокуса
        input.addEventListener('blur', function() {
            const param = this.id.replace('Input', '');
            validateAndUpdateInput(param, this);
        });
    });
    
    // Обработчик для поля редактирования веса
    const weightEditInput = document.getElementById('weightEditInput');
    if (weightEditInput) {
        weightEditInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveWeight();
            }
        });
    }
}

// Обработка изменения поля ввода
function handleInputChange(param, value) {
    let numValue = parseInt(value) || 0;
    
    // Устанавливаем минимальные/максимальные значения в зависимости от параметра
    switch(param) {
        case 'quantity':
            if (numValue < 1) numValue = 1;
            if (numValue > 100) numValue = 100;
            cargoParams.quantity = numValue;
            break;
            
        case 'length':
        case 'width':
        case 'height':
            if (numValue < 10) numValue = 10;
            if (numValue > 1000) numValue = 1000;
            cargoParams[param] = numValue;
            break;
    }
    
    updateCurrentStats();
}

// Валидация и обновление поля ввода
function validateAndUpdateInput(param, inputElement) {
    let value = parseInt(inputElement.value) || 0;
    let isValid = true;
    
    // Проверяем валидность в зависимости от параметра
    switch(param) {
        case 'quantity':
            if (value < 1) {
                value = 1;
                isValid = false;
            }
            if (value > 100) {
                value = 100;
                isValid = false;
            }
            cargoParams.quantity = value;
            break;
            
        case 'length':
        case 'width':
        case 'height':
            if (value < 10) {
                value = 10;
                isValid = false;
            }
            if (value > 1000) {
                value = 1000;
                isValid = false;
            }
            cargoParams[param] = value;
            break;
    }
    
    // Обновляем значение в поле ввода
    inputElement.value = value;
    
    // Показываем уведомление, если значение было некорректным
    if (!isValid) {
        showNotification(`Значение автоматически скорректировано до ${value}`, 'warning');
    }
    
    updateCurrentStats();
}

// ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ИМЕНИ СОТРУДНИКА ИЗ СИСТЕМЫ АВТОРИЗАЦИИ
function loadEmployeeName() {
    console.log('Загрузка данных сотрудника...');
    
    const authData = localStorage.getItem('employeeAuth');
    if (authData) {
        try {
            const employee = JSON.parse(authData);
            const nameElement = document.getElementById('employeeName');
            
            if (nameElement) {
                // Отображаем полное имя сотрудника
                if (employee.fullName) {
                    nameElement.textContent = employee.fullName;
                    console.log('Сотрудник:', employee.fullName);
                } else if (employee.lastName && employee.name) {
                    nameElement.textContent = `${employee.lastName} ${employee.name}`;
                    console.log('Сотрудник:', employee.lastName, employee.name);
                } else if (employee.name) {
                    nameElement.textContent = employee.name;
                    console.log('Сотрудник:', employee.name);
                } else {
                    nameElement.textContent = 'Сотрудник';
                    console.log('Имя сотрудника не найдено в данных');
                }
            }
        } catch (e) {
            console.error('Ошибка парсинга данных сотрудника:', e);
            document.getElementById('employeeName').textContent = 'Ошибка данных';
        }
    } else {
        // Если нет данных авторизации, перенаправляем на страницу входа
        console.log('Нет данных авторизации, перенаправление...');
        document.getElementById('employeeName').textContent = 'Неавторизован';
        
        // Автоматический редирект на страницу авторизации через 2 секунды
        setTimeout(() => {
            showNotification('Требуется авторизация', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 2000);
    }
}

// Функция выхода
function logout() {
    console.log('Выход из системы...');
    
    // Показываем подтверждение
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Очищаем данные сессии
        localStorage.removeItem('employeeAuth');
        localStorage.removeItem('cargoList');
        
        showNotification('Выход выполнен', 'info');
        
        // Перенаправляем на страницу авторизации
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Выбор типа груза
function selectCargoType(type) {
    console.log('Выбор типа груза:', type);
    currentCargoType = type;
    
    // Убираем выделение со всех типов
    document.querySelectorAll('.cargo-type-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Добавляем выделение выбранному типу
    const selectedItem = document.querySelector(`.cargo-type-item[data-type="${type}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Устанавливаем стандартные значения для выбранного типа
    switch(type) {
        case 'euro-pallet':
            cargoParams.length = 120;
            cargoParams.width = 80;
            cargoParams.height = 30;
            cargoParams.weight = 10; // Стандартный общий вес для европаллета
            break;
        case 'american-pallet':
            cargoParams.length = 120;
            cargoParams.width = 100;
            cargoParams.height = 30;
            cargoParams.weight = 15; // Стандартный общий вес для американского паллета
            break;
        case 'box':
            cargoParams.length = 60;
            cargoParams.width = 40;
            cargoParams.height = 40;
            cargoParams.weight = 5; // Стандартный общий вес для коробки
            break;
        case 'non-standard':
            // Оставляем текущие значения
            break;
    }
    
    // Обновляем поля ввода
    updateAllInputs();
    updateCurrentStats();
}

// Выбор типа упаковки
function selectPackagingType(type) {
    console.log('Выбор типа упаковки:', type);
    currentPackagingType = type;
    
    // Убираем выделение со всех типов
    document.querySelectorAll('.packaging-type-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Добавляем выделение выбранному типу
    const selectedItem = document.querySelector(`.packaging-type-item[data-packaging-type="${type}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Обновляем отображение
    const packagingTypeElement = document.getElementById('currentPackagingType');
    if (packagingTypeElement) {
        packagingTypeElement.textContent = getPackagingTypeName(type);
    }
    
    // Если выбран "none", сбрасываем количество
    if (type === 'none') {
        currentPackagingCount = 0;
    }
    
    updatePackagingCount(currentPackagingCount);
}

// Получение названия типа упаковки
function getPackagingTypeName(type) {
    switch(type) {
        case 'none': return 'Нет';
        case 'obreshetka': return 'Обрешетка';
        case 'paletnyy-bort': return 'Паллетный борт';
        default: return 'Неизвестно';
    }
}

// Изменение параметра с помощью кнопок +/-
function changeParam(param, delta) {
    console.log('Изменение параметра:', param, delta);
    
    // Добавляем визуальную обратную связь для мобильных
    const button = event?.target || document.querySelector(`.param-btn.${delta > 0 ? 'plus' : 'minus'}`);
    if (button) {
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 300);
    }
    
    if (param === 'quantity') {
        // Для кол-ва мест меняем на 1
        cargoParams[param] += delta;
        
        // Проверяем минимальное значение
        if (cargoParams[param] < 1) {
            cargoParams[param] = 1;
        }
        
        // Проверяем максимальное значение
        if (cargoParams[param] > 100) {
            cargoParams[param] = 100;
        }
    } else {
        // Для размеров меняем на 10
        cargoParams[param] += delta;
        
        // Проверяем границы
        if (cargoParams[param] < 10) {
            cargoParams[param] = 10;
        } else if (cargoParams[param] > 1000) {
            cargoParams[param] = 1000;
        }
    }
    
    // Обновляем поле ввода
    const input = document.getElementById(param + 'Input');
    if (input) {
        input.value = cargoParams[param];
    }
    
    // Обновляем статистику
    updateCurrentStats();
    
    // Показываем уведомление для отладки
    showNotification(`${getParamName(param)}: ${cargoParams[param]}`, 'info');
}

// Получение названия параметра
function getParamName(param) {
    const names = {
        'quantity': 'Количество мест',
        'length': 'Длина',
        'width': 'Ширина',
        'height': 'Высота'
    };
    return names[param] || param;
}

// Обновление всех полей ввода
function updateAllInputs() {
    document.getElementById('quantityInput').value = cargoParams.quantity;
    document.getElementById('lengthInput').value = cargoParams.length;
    document.getElementById('widthInput').value = cargoParams.width;
    document.getElementById('heightInput').value = cargoParams.height;
}

// Расчет объема в м³
function calculateVolume() {
    return (cargoParams.length * cargoParams.width * cargoParams.height) / 1000000;
}

// Обновление текущей статистики - С ОТОБРАЖЕНИЕМ КОЛИЧЕСТВА МЕСТ
function updateCurrentStats() {
    console.log('Обновление текущей статистики:', cargoParams);
    
    // Объем одного места
    const volumePerItem = calculateVolume();
    // Текущий объем = объем одного места × количество мест
    const totalVolume = volumePerItem * cargoParams.quantity;
    
    // Обновляем отображение объема
    const currentVolumeElement = document.getElementById('currentVolume');
    if (currentVolumeElement) {
        currentVolumeElement.textContent = totalVolume.toFixed(3) + ' м³';
    }
    
    // Общий вес (введенный пользователем)
    const currentTotalWeightElement = document.getElementById('currentTotalWeight');
    if (currentTotalWeightElement) {
        currentTotalWeightElement.textContent = cargoParams.weight + ' кг';
    }
    
    // Показываем текущее количество мест
    const currentQuantityElement = document.getElementById('currentQuantity');
    if (currentQuantityElement) {
        currentQuantityElement.textContent = cargoParams.quantity + ' мест';
    }
    
    console.log('Статистика обновлена:', {
        volumePerItem,
        totalVolume,
        weight: cargoParams.weight,
        quantity: cargoParams.quantity
    });
}

// Обновление количества упаковки
function updatePackagingCount(count) {
    currentPackagingCount = count;
    const element = document.getElementById('currentPackagingCount');
    if (element) {
        element.textContent = count + ' шт';
    }
}

// Редактирование веса
function editWeight() {
    console.log('Редактирование веса вызвано');
    
    // Показываем модальное окно для редактирования веса
    const modal = document.getElementById('weightEditModal');
    const input = document.getElementById('weightEditInput');
    
    if (!modal || !input) {
        console.error('Не найдены элементы модального окна веса');
        return;
    }
    
    // Устанавливаем текущее значение
    input.value = cargoParams.weight;
    
    // Фокус и выделение
    input.focus();
    input.select();
    
    // Показываем окно
    modal.style.display = 'block';
    
    // Добавляем обработчик для клавиши Enter
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            saveWeight();
        }
    };
}

// Сохранение веса
function saveWeight() {
    const input = document.getElementById('weightEditInput');
    if (!input) {
        console.error('Не найден input для веса');
        return;
    }
    
    let value = parseInt(input.value) || 10;
    
    // Проверяем границы
    if (value < 1) {
        value = 1;
        showNotification('Вес не может быть меньше 1 кг', 'warning');
    }
    if (value > 10000) {
        value = 10000;
        showNotification('Вес не может быть больше 10000 кг', 'warning');
    }
    
    // Сохраняем общий вес
    cargoParams.weight = value;
    
    // Обновляем отображение в реальном времени
    updateCurrentStats();
    
    // Закрываем окно
    closeWeightEditModal();
    
    // Показываем уведомление
    showNotification(`Общий вес установлен: ${value} кг`, 'success');
}

// Закрытие окна редактирования веса
function closeWeightEditModal() {
    document.getElementById('weightEditModal').style.display = 'none';
}

// Обработчик выбора фото
function handlePhotoSelection(e) {
    console.log('Обработка выбора фото...');
    
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        const photosContainer = document.getElementById('photosContainer');
        const placeholder = document.getElementById('photoPlaceholder');
        
        // Скрываем плейсхолдер
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Создаем контейнер для фото если его нет
        if (!photosContainer) {
            const container = document.createElement('div');
            container.id = 'photosContainer';
            container.className = 'photos-container';
            document.querySelector('.photo-container-new').appendChild(container);
        } else {
            // Очищаем контейнер
            photosContainer.innerHTML = '';
        }
        
        // Очищаем текущие фото
        currentPhotos = [];
        
        // Загружаем каждое фото
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const photoData = event.target.result;
                currentPhotos.push(photoData); // Сохраняем в массив
                
                // Создаем миниатюру
                const thumbnail = document.createElement('div');
                thumbnail.className = 'photo-thumbnail';
                
                const img = document.createElement('img');
                img.src = photoData;
                img.alt = `Фото ${index + 1}`;
                
                // Кнопка удаления фото
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '×';
                deleteBtn.className = 'photo-delete-btn';
                deleteBtn.onclick = function(e) {
                    e.stopPropagation();
                    currentPhotos.splice(index, 1);
                    thumbnail.remove();
                    showNotification(`Фото удалено (осталось: ${currentPhotos.length})`, 'info');
                    
                    // Если фото не осталось, показываем плейсхолдер
                    if (currentPhotos.length === 0 && placeholder) {
                        placeholder.style.display = 'flex';
                    }
                };
                
                thumbnail.appendChild(img);
                thumbnail.appendChild(deleteBtn);
                document.getElementById('photosContainer').appendChild(thumbnail);
            };
            
            reader.onerror = function() {
                showNotification('Ошибка при загрузке фото', 'error');
            };
            
            reader.readAsDataURL(file);
        });
        
        showNotification(`Загружено ${files.length} фото`, 'success');
    }
}

// Открытие камеры/галереи
function openCamera() {
    console.log('Открытие камеры...');
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        // Сбрасываем значение, чтобы можно было выбрать тот же файл снова
        photoInput.value = '';
        photoInput.click();
    }
}

// Сохранение груза
function saveCargo() {
    console.log('Сохранение груза...');
    
    // Проверяем, что все обязательные поля заполнены
    if (!validateCargoData()) {
        return;
    }
    
    // Получаем текущие параметры
    const quantity = cargoParams.quantity;
    const totalWeight = cargoParams.weight;
    const volumePerItem = calculateVolume();
    const totalVolume = volumePerItem * quantity;
    
    // Получаем данные сотрудника для привязки груза
    const authData = localStorage.getItem('employeeAuth');
    let employeeInfo = {};
    
    if (authData) {
        try {
            employeeInfo = JSON.parse(authData);
        } catch (e) {
            console.error('Ошибка парсинга данных сотрудника:', e);
        }
    }
    
    // Создаем уникальный ключ для группировки
    const cargoKey = `${currentCargoType}_${cargoParams.length}_${cargoParams.width}_${cargoParams.height}_${totalWeight}_${currentPackagingType}_${currentPackagingCount}_${quantity}_${currentPhotos.length}`;
    
    // Вес одного места
    const weightPerItem = totalWeight / quantity;
    
    // Создаем грузы в соответствии с количеством мест
    for (let i = 0; i < quantity; i++) {
        const cargo = {
            id: Date.now() + i,
            type: currentCargoType,
            typeName: getCargoTypeName(currentCargoType),
            quantity: 1,
            weight: weightPerItem,
            totalWeight: totalWeight,
            length: cargoParams.length,
            width: cargoParams.width,
            height: cargoParams.height,
            volume: volumePerItem,
            totalVolume: totalVolume,
            packagingType: currentPackagingType,
            packagingCount: currentPackagingCount,
            photos: [...currentPhotos], // Сохраняем массив фото
            photo: currentPhotos[0] || null, // Первое фото для обратной совместимости
            timestamp: new Date().toLocaleString(),
            cargoKey: cargoKey,
            // Добавляем информацию о сотруднике
            employeeId: employeeInfo.id || 'unknown',
            employeeName: employeeInfo.fullName || employeeInfo.name || 'Неизвестный сотрудник',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ru-RU')
        };
        
        cargoList.push(cargo);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
    
    // Обновляем группировку
    updateCargoGrouping();
    
    // Обновляем общую статистику
    updateTotalStats();
    
    // Сбрасываем фото
    resetPhotos();
    
    // Показываем уведомление
    showNotification(`Сохранено ${quantity} мест(а) груза "${getCargoTypeName(currentCargoType)}" с ${currentPhotos.length} фото`, 'success');
}

// Валидация данных груза
function validateCargoData() {
    if (cargoParams.quantity < 1) {
        showNotification('Укажите количество мест', 'error');
        return false;
    }
    
    if (cargoParams.weight < 1) {
        showNotification('Укажите общий вес груза', 'error');
        return false;
    }
    
    if (cargoParams.length < 10 || cargoParams.width < 10 || cargoParams.height < 10) {
        showNotification('Размеры груза слишком маленькие', 'error');
        return false;
    }
    
    return true;
}

// Получение названия типа груза
function getCargoTypeName(type) {
    switch(type) {
        case 'euro-pallet': return 'Европаллет';
        case 'american-pallet': return 'Американский паллет';
        case 'box': return 'Коробка';
        case 'non-standard': return 'Нестандарт';
        default: return 'Неизвестно';
    }
}

// Обновление группировки грузов
function updateCargoGrouping() {
    groupedCargo = {};
    
    cargoList.forEach(cargo => {
        if (!groupedCargo[cargo.cargoKey]) {
            groupedCargo[cargo.cargoKey] = {
                count: 0,
                totalWeight: 0,
                totalVolume: 0,
                cargo: cargo // Сохраняем данные первого груза для отображения
            };
        }
        
        groupedCargo[cargo.cargoKey].count++;
        groupedCargo[cargo.cargoKey].totalWeight += cargo.weight;
        groupedCargo[cargo.cargoKey].totalVolume += cargo.volume;
    });
}

// Загрузка списка грузов из localStorage
function loadCargoList() {
    const savedCargoList = localStorage.getItem('cargoList');
    if (savedCargoList) {
        cargoList = JSON.parse(savedCargoList);
        updateCargoGrouping();
    }
}

// Сброс фото
function resetPhotos() {
    currentPhotos = [];
    const photosContainer = document.getElementById('photosContainer');
    const placeholder = document.getElementById('photoPlaceholder');
    
    if (photosContainer) {
        photosContainer.innerHTML = '';
    }
    
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    
    // Сбрасываем input файла
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.value = '';
    }
}

// Обновление общей статистики
function updateTotalStats() {
    console.log('Обновление общей статистики...');
    
    // Пересчитываем общие показатели
    let totalPlaces = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    
    // Для группировки по типам
    let cargoTypesSummary = {};
    
    cargoList.forEach(cargo => {
        totalPlaces += cargo.quantity;
        totalWeight += cargo.weight;
        totalVolume += cargo.volume;
        
        // Группируем по типам
        if (!cargoTypesSummary[cargo.type]) {
            cargoTypesSummary[cargo.type] = {
                name: cargo.typeName,
                count: 0,
                places: 0
            };
        }
        cargoTypesSummary[cargo.type].count++;
        cargoTypesSummary[cargo.type].places += cargo.quantity;
    });
    
    console.log('Статистика:', { totalPlaces, totalWeight, totalVolume, cargoTypesSummary });
    
    // Обновляем отображение общего количества мест
    const totalCargoCountElement = document.getElementById('totalCargoCount');
    const totalWeightElement = document.getElementById('totalWeightValue');
    const totalVolumeElement = document.getElementById('totalVolumeValue');
    const totalPackagingElement = document.getElementById('totalPackagingInfo');
    
    if (totalCargoCountElement) {
        totalCargoCountElement.innerHTML = totalPlaces + ' мест <span class="total-info-arrow">›</span>';
    }
    
    if (totalWeightElement) {
        totalWeightElement.textContent = totalWeight.toFixed(1) + ' кг';
    }
    
    if (totalVolumeElement) {
        totalVolumeElement.textContent = totalVolume.toFixed(3) + ' м³';
    }
    
    // Обновляем информацию о типах грузов
    if (totalPackagingElement) {
        if (Object.keys(cargoTypesSummary).length === 0) {
            totalPackagingElement.textContent = 'Нет грузов';
        } else {
            // Формируем строку с информацией о типах грузов
            let typeInfo = [];
            for (const type in cargoTypesSummary) {
                const info = cargoTypesSummary[type];
                typeInfo.push(`${info.name}: ${info.places} мест`);
            }
            
            totalPackagingElement.textContent = typeInfo.join(', ');
        }
    }
}

// Показать окно статистики грузов
function showCargoStatsPopup() {
    updateCargoGrouping();
    
    const itemsContainer = document.getElementById('cargoStatsItems');
    const totalsContainer = document.getElementById('cargoStatsTotals');
    
    // Очищаем контейнеры
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (totalsContainer) totalsContainer.innerHTML = '';
    
    // Если грузов нет
    if (cargoList.length === 0) {
        itemsContainer.innerHTML = '<div class="cargo-stats-empty">Нет сохраненных грузов</div>';
        return;
    }
    
    // Рассчитываем общие итоги
    let totalPlaces = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    let totalCargoTypes = Object.keys(groupedCargo).length;
    
    // Для группировки по типам в окне
    let cargoTypesInPopup = {};
    
    // Создаем элементы для сгруппированных грузов
    Object.keys(groupedCargo).forEach(key => {
        const group = groupedCargo[key];
        const cargo = group.cargo;
        
        totalPlaces += group.count;
        totalWeight += group.totalWeight;
        totalVolume += group.totalVolume;
        
        // Группируем для итогов
        if (!cargoTypesInPopup[cargo.type]) {
            cargoTypesInPopup[cargo.type] = {
                name: cargo.typeName,
                count: 0,
                places: 0
            };
        }
        cargoTypesInPopup[cargo.type].count++;
        cargoTypesInPopup[cargo.type].places += group.count;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cargo-stats-item';
        itemElement.innerHTML = `
            <div class="cargo-stats-item-header">
                <div class="cargo-stats-item-title">
                    <span class="cargo-stats-item-icon">${getCargoTypeIcon(cargo.type)}</span>
                    ${cargo.typeName}
                </div>
                <div class="cargo-stats-item-count">${group.count} мест</div>
            </div>
            <div class="cargo-stats-item-details">
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Количество мест:</span>
                    <span class="detail-value">${group.count} шт</span>
                </div>
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Размеры 1 места:</span>
                    <span class="detail-value">${cargo.length}×${cargo.width}×${cargo.height} см</span>
                </div>
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Общий вес груза:</span>
                    <span class="detail-value">${cargo.totalWeight ? cargo.totalWeight + ' кг' : (cargo.weight * group.count).toFixed(1) + ' кг'}</span>
                </div>
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Объем 1 места:</span>
                    <span class="detail-value">${cargo.volume.toFixed(3)} м³</span>
                </div>
                ${cargo.packagingType !== 'none' && cargo.packagingCount > 0 ? `
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Упаковка:</span>
                    <span class="detail-value">${getPackagingTypeName(cargo.packagingType)} (${cargo.packagingCount} шт)</span>
                </div>
                ` : ''}
                ${cargo.photos && cargo.photos.length > 0 ? `
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Фото:</span>
                    <span class="detail-value">${cargo.photos.length} шт</span>
                </div>
                ` : ''}
            </div>
            <div class="cargo-stats-item-total">
                <span class="total-label">Всего в группе:</span>
                <span class="total-value">Вес: ${group.totalWeight.toFixed(1)} кг, Объем: ${group.totalVolume.toFixed(3)} м³</span>
            </div>
            <button class="cargo-stats-item-remove" onclick="removeCargoGroup('${key}')">
                🗑️ Удалить группу
            </button>
        `;
        
        itemsContainer.appendChild(itemElement);
    });
    
    // Создаем элемент с итогами с группировкой по типам
    let typesSummaryHTML = '';
    for (const type in cargoTypesInPopup) {
        const info = cargoTypesInPopup[type];
        typesSummaryHTML += `
            <div class="cargo-stats-total-item">
                <span class="total-label">${info.name}:</span>
                <span class="total-value">${info.places} мест (${info.count} групп)</span>
            </div>
        `;
    }
    
    totalsContainer.innerHTML = `
        <div class="cargo-stats-total-item">
            <span class="total-label">Всего мест:</span>
            <span class="total-value">${totalPlaces}</span>
        </div>
        <div class="cargo-stats-total-item">
            <span class="total-label">Общая масса:</span>
            <span class="total-value">${totalWeight.toFixed(1)} кг</span>
        </div>
        <div class="cargo-stats-total-item">
            <span class="total-label">Общий объем:</span>
            <span class="total-value">${totalVolume.toFixed(3)} м³</span>
        </div>
        ${typesSummaryHTML}
    `;
    
    // Показываем окно
    document.getElementById('cargoStatsPopup').style.display = 'block';
    document.getElementById('cargoStatsOverlay').style.display = 'block';
}

// Получение иконки для типа груза
function getCargoTypeIcon(type) {
    switch(type) {
        case 'euro-pallet': return '🇪🇺';
        case 'american-pallet': return '🇺🇸';
        case 'box': return '📦';
        case 'non-standard': return '📏';
        default: return '📦';
    }
}

// Удаление группы грузов
function removeCargoGroup(cargoKey) {
    if (confirm('Удалить всю группу одинаковых грузов?')) {
        // Фильтруем список грузов, оставляем только те, у которых другой ключ
        const groupSize = groupedCargo[cargoKey] ? groupedCargo[cargoKey].count : 0;
        cargoList = cargoList.filter(cargo => cargo.cargoKey !== cargoKey);
        
        // Сохраняем изменения
        localStorage.setItem('cargoList', JSON.stringify(cargoList));
        
        // Обновляем группировка и статистику
        updateCargoGrouping();
        updateTotalStats();
        
        // Обновляем отображение в окне
        showCargoStatsPopup();
        
        // Показываем уведомление
        showNotification(`Удалено ${groupSize} мест(а) груза`, 'info');
    }
}

// Закрытие окна статистики
function closeCargoStatsPopup() {
    document.getElementById('cargoStatsPopup').style.display = 'none';
    document.getElementById('cargoStatsOverlay').style.display = 'none';
}

// Очистка всех грузов
function clearAllCargo() {
    if (cargoList.length === 0) {
        showNotification('Нет грузов для очистки', 'info');
        return;
    }
    
    if (confirm(`Удалить все ${cargoList.length} грузов? Это действие нельзя отменить.`)) {
        const totalCount = cargoList.length;
        cargoList = [];
        groupedCargo = {};
        
        localStorage.removeItem('cargoList');
        
        updateTotalStats();
        closeCargoStatsPopup();
        
        showNotification(`Удалено ${totalCount} грузов`, 'info');
    }
}

// Отправка данных оператору
function sendToOperatorAndReset() {
    if (cargoList.length === 0) {
        showNotification('Нет грузов для отправки', 'warning');
        return;
    }
    
    // Получаем данные сотрудника
    const authData = localStorage.getItem('employeeAuth');
    let employeeInfo = {};
    
    if (authData) {
        try {
            employeeInfo = JSON.parse(authData);
        } catch (e) {
            console.error('Ошибка парсинга данных сотрудника:', e);
        }
    }
    
    // Собираем данные для отправки
    const shipmentData = {
        employee: employeeInfo.fullName || employeeInfo.name || 'Неизвестный сотрудник',
        employeeId: employeeInfo.id || 'unknown',
        employeeCode: employeeInfo.code || 'unknown',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU'),
        totalPlaces: cargoList.reduce((sum, cargo) => sum + cargo.quantity, 0),
        totalWeight: cargoList.reduce((sum, cargo) => sum + cargo.weight, 0),
        totalVolume: cargoList.reduce((sum, cargo) => sum + cargo.volume, 0),
        cargos: cargoList,
        groupedCargos: groupedCargo
    };
    
    // В реальном приложении здесь был бы AJAX-запрос к серверу
    // Для демонстрации просто сохраняем в localStorage
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    shipments.push(shipmentData);
    localStorage.setItem('shipments', JSON.stringify(shipments));
    
    // Сохраняем данные для отправки в отдельное поле
    localStorage.setItem('lastShipment', JSON.stringify(shipmentData));
    
    // После отправки очищаем все
    const totalCount = cargoList.length;
    cargoList = [];
    groupedCargo = {};
    localStorage.removeItem('cargoList');
    
    updateTotalStats();
    
    showNotification(`Отправлено ${totalCount} грузов оператору`, 'success');
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Стили для уведомлений
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 250px;
        max-width: 350px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Цвета в зависимости от типа
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Стиль для кнопки закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Стиль для содержимого
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        flex: 1;
        font-size: 14px;
    `;
    
    // Добавляем в body
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Добавляем стили для анимаций
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Очистка уведомления при клике
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('notification-close')) {
        e.target.parentElement.remove();
    }
});

// Обновление кол-ва мест из поля ввода
function updateQuantityFromInput() {
    const input = document.getElementById('quantityInput');
    if (input) {
        let value = parseInt(input.value) || 1;
        
        if (value < 1) value = 1;
        if (value > 100) value = 100;
        
        cargoParams.quantity = value;
        input.value = value;
        
        console.log('Количество мест обновлено:', value);
        
        updateCurrentStats();
    }
}

// Обновление размеров из поля ввода
function updateDimensionFromInput(dimension) {
    const input = document.getElementById(dimension + 'Input');
    if (input) {
        let value = parseInt(input.value) || 10;
        
        if (value < 10) value = 10;
        if (value > 1000) value = 1000;
        
        cargoParams[dimension] = value;
        input.value = value;
        
        updateCurrentStats();
    }
}

// Инициализация кнопок для мобильных устройств
function initMobileButtons() {
    console.log('Инициализация мобильных кнопок...');
    
    // Добавляем обработчики touch для кнопок +/-
    const paramButtons = document.querySelectorAll('.param-btn');
    paramButtons.forEach(button => {
        // Убираем стандартное поведение touch
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Добавляем визуальную обратную связь
            this.classList.add('active');
            
            // Определяем параметр и направление изменения
            const isMinus = this.classList.contains('minus');
            const isPlus = this.classList.contains('plus');
            const paramGroup = this.closest('.param-group');
            
            if (paramGroup) {
                const input = paramGroup.querySelector('.param-input');
                if (input) {
                    const param = input.id.replace('Input', '');
                    const delta = isMinus ? -1 : (isPlus ? 1 : 0);
                    
                    if (param === 'length' || param === 'width' || param === 'height') {
                        changeParam(param, delta * 10);
                    } else {
                        changeParam(param, delta);
                    }
                }
            }
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
        });
        
        button.addEventListener('touchcancel', function(e) {
            this.classList.remove('active');
        });
    });
    
    // Добавляем обработчики для кнопок выбора типа груза
    const cargoTypeButtons = document.querySelectorAll('.cargo-type-item');
    cargoTypeButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('active');
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
            
            const type = this.getAttribute('data-type');
            if (type) {
                selectCargoType(type);
            }
        });
        
        button.addEventListener('touchcancel', function(e) {
            this.classList.remove('active');
        });
    });
    
    // Добавляем обработчики для кнопок упаковки
    const packagingButtons = document.querySelectorAll('.packaging-type-item');
    packagingButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('active');
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
            
            const type = this.getAttribute('data-packaging-type');
            if (type) {
                selectPackagingType(type);
            }
        });
        
        button.addEventListener('touchcancel', function(e) {
            this.classList.remove('active');
        });
    });
}

// Обработчик клика вне модального окна веса
window.addEventListener('click', function(event) {
    const modal = document.getElementById('weightEditModal');
    if (event.target === modal) {
        closeWeightEditModal();
    }
});

// Экспорт функций для использования в HTML
window.selectCargoType = selectCargoType;
window.selectPackagingType = selectPackagingType;
window.changeParam = changeParam;
window.editWeight = editWeight;
window.saveWeight = saveWeight;
window.closeWeightEditModal = closeWeightEditModal;
window.openCamera = openCamera;
window.saveCargo = saveCargo;
window.sendToOperatorAndReset = sendToOperatorAndReset;
window.showCargoStatsPopup = showCargoStatsPopup;
window.closeCargoStatsPopup = closeCargoStatsPopup;
window.removeCargoGroup = removeCargoGroup;
window.clearAllCargo = clearAllCargo;
window.logout = logout;
window.updateQuantityFromInput = updateQuantityFromInput;
window.updateDimensionFromInput = updateDimensionFromInput;

console.log('Все функции cargo.js загружены и готовы к использованию');