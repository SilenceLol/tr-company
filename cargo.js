// cargo.js - ОБНОВЛЕННАЯ ВЕРСИЯ С ОБЩИМ ВЕСОМ

let cargoList = [];
let currentCargoType = 'euro-pallet';
let currentPackagingType = 'none';
let currentPackagingCount = 0;
let currentPhoto = null;

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
    // Загружаем сохраненные грузы из localStorage
    loadCargoList();
    
    // Устанавливаем начальные значения
    selectCargoType('euro-pallet');
    selectPackagingType('none');
    
    // Обновляем статистику
    updateCurrentStats();
    updateTotalStats();
    
    // Загружаем имя сотрудника
    loadEmployeeName();
    
    // Настраиваем обработчики для полей ввода
    setupInputHandlers();
});

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
            
        case 'packagingCount':
            if (numValue < 0) numValue = 0;
            if (numValue > 100) numValue = 100;
            currentPackagingCount = numValue;
            document.getElementById('currentPackagingCount').textContent = numValue + ' шт';
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
            
        case 'packagingCount':
            if (value < 0) {
                value = 0;
                isValid = false;
            }
            if (value > 100) {
                value = 100;
                isValid = false;
            }
            currentPackagingCount = value;
            document.getElementById('currentPackagingCount').textContent = value + ' шт';
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

// Функция для загрузки имени сотрудника
function loadEmployeeName() {
    const employeeName = localStorage.getItem('currentEmployee');
    if (employeeName) {
        document.getElementById('employeeName').textContent = employeeName;
    } else {
        document.getElementById('employeeName').textContent = 'Неавторизован';
    }
}

// Функция выхода
function logout() {
    localStorage.removeItem('currentEmployee');
    window.location.href = 'index.html';
}

// Выбор типа груза
function selectCargoType(type) {
    currentCargoType = type;
    
    // Убираем выделение со всех типов
    document.querySelectorAll('.cargo-type-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Добавляем выделение выбранному типу
    document.querySelector(`.cargo-type-item[data-type="${type}"]`).classList.add('selected');
    
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
    document.getElementById('currentPackagingType').textContent = getPackagingTypeName(type);
    updatePackagingCount(0);
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
    document.getElementById(param + 'Input').value = cargoParams[param];
    
    // Обновляем статистику
    updateCurrentStats();
}

// Обновление всех полей ввода
function updateAllInputs() {
    document.getElementById('quantityInput').value = cargoParams.quantity;
    document.getElementById('lengthInput').value = cargoParams.length;
    document.getElementById('widthInput').value = cargoParams.width;
    document.getElementById('heightInput').value = cargoParams.height;
    document.getElementById('packagingCountInput').value = currentPackagingCount;
}

// Расчет объема в м³
function calculateVolume() {
    return (cargoParams.length * cargoParams.width * cargoParams.height) / 1000000;
}

// Обновление текущей статистики
function updateCurrentStats() {
    // Объем одного места
    const volumePerItem = calculateVolume();
    // Текущий объем = объем одного места × количество мест
    const totalVolume = volumePerItem * cargoParams.quantity;
    document.getElementById('currentVolume').textContent = totalVolume.toFixed(3) + ' м³';
    
    // Общий вес (введенный пользователем)
    document.getElementById('currentTotalWeight').textContent = cargoParams.weight + ' кг';
}

// Изменение количества упаковки с помощью кнопок +/-
function changePackagingCount(delta) {
    currentPackagingCount += delta;
    
    // Проверяем границы
    if (currentPackagingCount < 0) {
        currentPackagingCount = 0;
    } else if (currentPackagingCount > 100) {
        currentPackagingCount = 100;
    }
    
    // Обновляем поле ввода
    document.getElementById('packagingCountInput').value = currentPackagingCount;
    document.getElementById('currentPackagingCount').textContent = currentPackagingCount + ' шт';
}

// Редактирование веса
function editWeight() {
    // Показываем модальное окно для редактирования веса
    const modal = document.getElementById('weightEditModal');
    const input = document.getElementById('weightEditInput');
    
    // Устанавливаем текущее значение
    input.value = cargoParams.weight;
    input.focus();
    input.select();
    
    // Показываем окно
    modal.style.display = 'block';
}

// Сохранение веса
function saveWeight() {
    const input = document.getElementById('weightEditInput');
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
    
    // Обновляем отображение
    updateCurrentStats();
    
    // Закрываем окно
    closeWeightEditModal();
    
    showNotification(`Общий вес установлен: ${value} кг`, 'success');
}

// Закрытие окна редактирования веса
function closeWeightEditModal() {
    document.getElementById('weightEditModal').style.display = 'none';
}

// Закрытие окна при клике вне его
window.addEventListener('click', function(event) {
    const modal = document.getElementById('weightEditModal');
    if (event.target === modal) {
        closeWeightEditModal();
    }
});

// Функция для снятия фото
function takePhoto() {
    document.getElementById('photoInput').click();
}

// Обработка выбора фото
document.getElementById('photoInput').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            currentPhoto = event.target.result;
            
            // Показываем фото
            const photoElement = document.getElementById('cargoPhoto');
            const placeholder = document.getElementById('photoPlaceholder');
            
            photoElement.src = currentPhoto;
            photoElement.style.display = 'block';
            placeholder.style.display = 'none';
            
            showNotification('Фото успешно загружено', 'success');
        };
        
        reader.onerror = function() {
            showNotification('Ошибка при загрузке фото', 'error');
        };
        
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Сохранение груза
function saveCargo() {
    // Проверяем, что все обязательные поля заполнены
    if (!validateCargoData()) {
        return;
    }
    
    // Получаем текущие параметры
    const quantity = cargoParams.quantity;
    const totalWeight = cargoParams.weight; // ОБЩИЙ вес, введенный пользователем
    const volumePerItem = calculateVolume();
    const totalVolume = volumePerItem * quantity; // Общий объем = объем одного места × количество мест
    
    // Создаем уникальный ключ для группировки одинаковых грузов
    const cargoKey = `${currentCargoType}_${cargoParams.length}_${cargoParams.width}_${cargoParams.height}_${totalWeight}_${currentPackagingType}_${currentPackagingCount}_${quantity}`;
    
    // ВАЖНО: При создании нескольких мест, общий вес делится между ними
    const weightPerItem = totalWeight / quantity;
    
    // Создаем грузы в соответствии с количеством мест
    for (let i = 0; i < quantity; i++) {
        const cargo = {
            id: Date.now() + i,
            type: currentCargoType,
            typeName: getCargoTypeName(currentCargoType),
            quantity: 1, // Каждое место - это отдельный груз
            weight: weightPerItem, // Вес одного места = общий вес / количество мест
            totalWeight: totalWeight, // Сохраняем также общий вес для отображения
            length: cargoParams.length,
            width: cargoParams.width,
            height: cargoParams.height,
            volume: volumePerItem,
            totalVolume: totalVolume, // Сохраняем также общий объем для отображения
            packagingType: currentPackagingType,
            packagingCount: currentPackagingCount,
            photo: currentPhoto,
            timestamp: new Date().toLocaleString(),
            cargoKey: cargoKey // Добавляем ключ для группировки
        };
        
        cargoList.push(cargo);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
    
    // Обновляем группировку
    updateCargoGrouping();
    
    // Обновляем общую статистику
    updateTotalStats();
    
    // Сбрасываем фото (но сохраняем параметры)
    resetPhoto();
    
    // Показываем уведомление
    showNotification(`Сохранено ${quantity} мест(а) груза "${getCargoTypeName(currentCargoType)}"`, 'success');
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
function resetPhoto() {
    currentPhoto = null;
    document.getElementById('cargoPhoto').style.display = 'none';
    document.getElementById('photoPlaceholder').style.display = 'flex';
    document.getElementById('photoInput').value = '';
}

// Обновление общей статистики
function updateTotalStats() {
    // Пересчитываем общие показатели
    let totalPlaces = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    
    cargoList.forEach(cargo => {
        totalPlaces += cargo.quantity;
        totalWeight += cargo.weight;
        totalVolume += cargo.volume;
    });
    
    // Обновляем отображение
    document.getElementById('totalCargoCount').innerHTML = totalPlaces + ' <span class="total-info-arrow">›</span>';
    document.getElementById('totalWeightValue').textContent = totalWeight.toFixed(1) + ' кг';
    document.getElementById('totalVolumeValue').textContent = totalVolume.toFixed(3) + ' м³';
    
    // Обновляем информацию об упаковке
    updatePackagingInfo();
}

// Обновление информации об упаковке
function updatePackagingInfo() {
    let hasPackaging = false;
    let packagingInfo = '';
    
    cargoList.forEach(cargo => {
        if (cargo.packagingType !== 'none' && cargo.packagingCount > 0) {
            hasPackaging = true;
            packagingInfo = getPackagingTypeName(cargo.packagingType) + ' ' + cargo.packagingCount + ' шт';
        }
    });
    
    document.getElementById('totalPackagingInfo').textContent = hasPackaging ? packagingInfo : 'Нет';
}

// Показать окно статистики грузов
function showCargoStatsPopup() {
    updateCargoGrouping();
    
    const itemsContainer = document.getElementById('cargoStatsItems');
    const totalsContainer = document.getElementById('cargoStatsTotals');
    
    // Очищаем контейнеры
    itemsContainer.innerHTML = '';
    totalsContainer.innerHTML = '';
    
    // Если грузов нет
    if (cargoList.length === 0) {
        itemsContainer.innerHTML = '<div class="cargo-stats-empty">Нет сохраненных грузов</div>';
        totalsContainer.innerHTML = '';
        return;
    }
    
    // Рассчитываем общие итоги
    let totalPlaces = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    let totalCargoTypes = Object.keys(groupedCargo).length;
    
    // Создаем элементы для сгруппированных грузов
    Object.keys(groupedCargo).forEach(key => {
        const group = groupedCargo[key];
        const cargo = group.cargo;
        
        totalPlaces += group.count;
        totalWeight += group.totalWeight;
        totalVolume += group.totalVolume;
        
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
                ${cargo.photo ? `
                <div class="cargo-stats-item-detail">
                    <span class="detail-label">Фото:</span>
                    <span class="detail-value">Есть</span>
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
    
    // Создаем элемент с итогами
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
        <div class="cargo-stats-total-item">
            <span class="total-label">Типов груза:</span>
            <span class="total-value">${totalCargoTypes}</span>
        </div>
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
        
        // Обновляем группировку и статистику
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
    
    // Собираем данные для отправки
    const shipmentData = {
        employee: localStorage.getItem('currentEmployee') || 'Неизвестный сотрудник',
        timestamp: new Date().toISOString(),
        totalPlaces: cargoList.length,
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
    
    // Можно добавить редирект на страницу подтверждения
    // window.location.href = 'shipment-confirmation.html';
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

// Обновление кол-ва мест из поля ввода (для обратной совместимости)
function updateQuantityFromInput() {
    const input = document.getElementById('quantityInput');
    let value = parseInt(input.value) || 1;
    
    // Проверяем границы
    if (value < 1) value = 1;
    if (value > 100) value = 100;
    
    cargoParams.quantity = value;
    input.value = value;
    updateCurrentStats();
}

// Обновление размеров из поля ввода (для обратной совместимости)
function updateDimensionFromInput(dimension) {
    const input = document.getElementById(dimension + 'Input');
    let value = parseInt(input.value) || 10;
    
    // Проверяем границы
    if (value < 10) value = 10;
    if (value > 1000) value = 1000;
    
    cargoParams[dimension] = value;
    input.value = value;
    updateCurrentStats();
}

// Обновление количества упаковки из поля ввода (для обратной совместимости)
function updatePackagingCountFromInput() {
    const input = document.getElementById('packagingCountInput');
    let value = parseInt(input.value) || 0;
    
    // Проверяем границы
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    
    currentPackagingCount = value;
    input.value = value;
    document.getElementById('currentPackagingCount').textContent = value + ' шт';
}
