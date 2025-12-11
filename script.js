// script.js - ПОЛНЫЙ ФАЙЛ СО ВСЕМИ ФУНКЦИЯМИ - ОЧИСТКА ПОСЛЕ ОТПРАВКИ

// API конфигурация (для будущей интеграции)
const API_BASE_URL = 'http://localhost:3000/api'; // Измените на ваш сервер

// Глобальные переменные
let currentCargoType = 'euro-pallet';
let currentWeight = 1;
let currentQuantity = 1;
let currentDimensions = {
    length: 120,
    width: 80,
    height: 30
};
let cargoList = [];
let cargoListModal = null;

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL - Замер грузов загружен');
    
    // Инициализация переменных из localStorage
    cargoList = JSON.parse(localStorage.getItem('cargoList')) || [];
    
    // Инициализация фото
    initPhotoInput();
    
    // Обновляем статистику
    updateStats();
    updateEmployeeInfo();
    updateCurrentStats(); // Обновляем статистику текущего груза
    
    // Настройка полей ввода
    setupInputFields();
    
    // Настройка поля ввода веса (для обратной совместимости)
    setupWeightInput();
    
    // Обновляем отображения (для обратной совместимости)
    updateDimensionDisplays();
    updateQuantityDisplay();
    
    // Получаем ссылку на модальное окно
    cargoListModal = document.getElementById('cargoListModal');
    
    // Инициализация планшетной оптимизации
    initTabletOptimization();
    handleTabletClicks();
    
    console.log('Инициализация завершена. Грузов в списке:', cargoList.length);
});

// ИНИЦИАЛИЗАЦИЯ ФОТО
function initPhotoInput() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const photo = document.getElementById('cargoPhoto');
                    const placeholder = document.getElementById('photoPlaceholder');
                    
                    if (photo && placeholder) {
                        photo.src = event.target.result;
                        photo.style.display = 'block';
                        placeholder.style.display = 'none';
                    }
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
}

// ФОТО ФУНКЦИИ
function takePhoto() {
    document.getElementById('photoInput').click();
}

function resetPhoto() {
    const photo = document.getElementById('cargoPhoto');
    const placeholder = document.getElementById('photoPlaceholder');
    
    if (photo && placeholder) {
        photo.style.display = 'none';
        photo.src = '';
        placeholder.style.display = 'flex';
        
        // Сбрасываем input файла
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.value = '';
        }
    }
}

// НАСТРОЙКА ПОЛЕЙ ВВОДА (НОВАЯ ФУНКЦИЯ)
function setupInputFields() {
    // Вес
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.value = currentWeight || 1;
        weightInput.addEventListener('change', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const weight = parseInt(this.value) || 1;
            if (weight >= 1 && weight <= 10000) {
                currentWeight = weight;
                updateCurrentStats();
            }
        });
    }
    
    // Размеры
    ['length', 'width', 'height'].forEach(dim => {
        const input = document.getElementById(dim + 'Input');
        if (input && currentDimensions) {
            input.value = currentDimensions[dim] || 10;
            input.addEventListener('change', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                const value = parseInt(this.value) || 10;
                if (value >= 10 && value <= 1000) {
                    currentDimensions[dim] = value;
                    updateCurrentStats();
                }
            });
        }
    });
    
    // Количество
    const quantityInput = document.getElementById('quantityInput');
    if (quantityInput) {
        quantityInput.value = currentQuantity || 1;
        quantityInput.addEventListener('change', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const quantity = parseInt(this.value) || 1;
            if (quantity >= 1 && quantity <= 100) {
                currentQuantity = quantity;
                updateCurrentStats();
            }
        });
    }
}

// НАСТРОЙКА ПОЛЯ ВВОДА ВЕСА (для обратной совместимости)
function setupWeightInput() {
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.value = currentWeight || 1;
        
        weightInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const weight = parseInt(this.value) || 1;
            if (weight >= 1 && weight <= 10000) {
                currentWeight = weight;
                updateCurrentStats();
            }
        });
        
        weightInput.addEventListener('focus', function() {
            this.select();
        });
    }
}

// НОВЫЕ ФУНКЦИИ ДЛЯ ОБНОВЛЕННОГО ИНТЕРФЕЙСА

// ОБНОВЛЕНИЕ ПАРАМЕТРОВ ИЗ ПОЛЯ ВВОДА
function updateWeightFromInput() {
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        let weight = parseInt(weightInput.value) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10000) weight = 10000;
        currentWeight = weight;
        updateCurrentStats();
    }
}

function updateDimensionFromInput(dimension) {
    const input = document.getElementById(dimension + 'Input');
    if (input && currentDimensions) {
        let value = parseInt(input.value) || 10;
        if (value < 10) value = 10;
        if (value > 1000) value = 1000;
        currentDimensions[dimension] = value;
        updateCurrentStats();
    }
}

function updateQuantityFromInput() {
    const quantityInput = document.getElementById('quantityInput');
    if (quantityInput) {
        let quantity = parseInt(quantityInput.value) || 1;
        if (quantity < 1) quantity = 1;
        if (quantity > 100) quantity = 100;
        currentQuantity = quantity;
        updateCurrentStats();
    }
}

// ИЗМЕНЕНИЕ ПАРАМЕТРА С ПОМОЩЬЮ КНОПОК
function changeParam(param, delta) {
    switch(param) {
        case 'weight':
            let newWeight = (currentWeight || 1) + delta;
            if (newWeight >= 1 && newWeight <= 10000) {
                currentWeight = newWeight;
                const weightInput = document.getElementById('weightInput');
                if (weightInput) weightInput.value = currentWeight;
                updateCurrentStats();
            }
            break;
            
        case 'length':
        case 'width':
        case 'height':
            if (currentDimensions && currentDimensions[param] !== undefined) {
                let newValue = currentDimensions[param] + delta;
                if (newValue >= 10 && newValue <= 1000) {
                    currentDimensions[param] = newValue;
                    const input = document.getElementById(param + 'Input');
                    if (input) input.value = newValue;
                    updateCurrentStats();
                }
            }
            break;
            
        case 'quantity':
            let newQuantity = (currentQuantity || 1) + delta;
            if (newQuantity >= 1 && newQuantity <= 100) {
                currentQuantity = newQuantity;
                const quantityInput = document.getElementById('quantityInput');
                if (quantityInput) quantityInput.value = currentQuantity;
                updateCurrentStats();
            }
            break;
    }
}

// ОБНОВЛЕНИЕ СТАТИСТИКИ ТЕКУЩЕГО ГРУЗА В РЕЖИМЕ РЕАЛЬНОГО ВРЕМЕНИ
function updateCurrentStats() {
    // Рассчитываем объем текущего груза
    if (currentDimensions) {
        const volume = (currentDimensions.length * 
                       currentDimensions.width * 
                       currentDimensions.height) / 1000000; // в м³
        
        const currentVolumeElement = document.getElementById('currentVolume');
        if (currentVolumeElement) {
            currentVolumeElement.textContent = volume.toFixed(3) + ' м³';
        }
    }
    
    // ИСПРАВЛЕНИЕ: Общий вес = просто введенный вес, НЕ умножаем на количество
    const totalWeight = currentWeight; // Просто текущий вес, без умножения на количество
    const currentTotalWeightElement = document.getElementById('currentTotalWeight');
    if (currentTotalWeightElement) {
        currentTotalWeightElement.textContent = totalWeight + ' кг';
    }
}

// ОБНОВЛЕНИЕ ОБЩЕЙ СТАТИСТИКИ
function updateTotalStats() {
    // Обновляем статистику из общего списка
    updateStats();
    
    // Показываем уведомление
    showNotification('Статистика обновлена');
}

// ОТПРАВКА И СБРОС - ВАЖНОЕ ИСПРАВЛЕНИЕ!
function sendToOperatorAndReset() {
    if (!cargoList || cargoList.length === 0) {
        showNotification('Нет грузов для отправки', true);
        return;
    }
    
    // Вызываем стандартную функцию отправки
    sendToOperator();
    
    // Сбрасываем все параметры к начальным значениям
    resetAllParams();
    
    // Закрываем окно статистики если оно открыто
    closeCargoStatsPopup();
    
    // Показываем уведомление
    showNotification('Данные отправлены и параметры сброшены');
}

// СБРОС ВСЕХ ПАРАМЕТРОВ
function resetAllParams() {
    // Сбрасываем текущий тип
    currentCargoType = 'euro-pallet';
    selectCargoType('euro-pallet');
    
    // Сбрасываем вес
    currentWeight = 1;
    const weightInput = document.getElementById('weightInput');
    if (weightInput) weightInput.value = currentWeight;
    
    // Сбрасываем размеры по умолчанию для европаллета
    currentDimensions = { length: 120, width: 80, height: 30 };
    
    // Обновляем поля ввода размеров
    ['length', 'width', 'height'].forEach(dim => {
        const input = document.getElementById(dim + 'Input');
        if (input) input.value = currentDimensions[dim];
    });
    
    // Сбрасываем количество
    currentQuantity = 1;
    const quantityInput = document.getElementById('quantityInput');
    if (quantityInput) quantityInput.value = currentQuantity;
    
    // Сбрасываем фото
    resetPhoto();
    
    // Обновляем статистику текущего груза
    updateCurrentStats();
}

// ОЧИСТКА ВСЕХ ГРУЗОВ
function clearAllCargo() {
    if (confirm('Вы уверены, что хотите удалить все грузы?')) {
        cargoList = [];
        localStorage.removeItem('cargoList');
        updateStats();
        showNotification('Все грузы удалены');
        closeCargoStatsPopup();
    }
}

// ФУНКЦИИ ДЛЯ РАЗМЕРОВ (для обратной совместимости)
function changeDimension(dimension, delta) {
    if (currentDimensions && currentDimensions[dimension] !== undefined) {
        let newValue = currentDimensions[dimension] + delta;
        if (newValue >= 10) {
            currentDimensions[dimension] = newValue;
            // Обновляем поле ввода
            const input = document.getElementById(dimension + 'Input');
            if (input) input.value = newValue;
            // Обновляем отображение (для обратной совместимости)
            updateDimensionDisplay(dimension);
            // Обновляем статистику
            updateCurrentStats();
        }
    }
}

function updateDimensionDisplay(dimension) {
    const element = document.getElementById(dimension + 'Value');
    if (element && currentDimensions) {
        element.textContent = currentDimensions[dimension];
    }
}

function updateDimensionDisplays() {
    updateDimensionDisplay('length');
    updateDimensionDisplay('width');
    updateDimensionDisplay('height');
}

// ФУНКЦИИ ДЛЯ КОЛИЧЕСТВА (для обратной совместимости)
function changeQuantity(delta) {
    let newQuantity = (currentQuantity || 1) + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
        currentQuantity = newQuantity;
        // Обновляем поле ввода
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) quantityInput.value = newQuantity;
        // Обновляем отображение (для обратной совместимости)
        updateQuantityDisplay();
        // Обновляем статистику
        updateCurrentStats();
    }
}

function updateQuantityDisplay() {
    const element = document.getElementById('quantityValue');
    if (element && currentQuantity !== undefined) {
        element.textContent = currentQuantity;
    }
}

// ФУНКЦИИ ДЛЯ ТИПОВ ГРУЗОВ
function selectCargoType(type) {
    // Убираем выделение у всех
    document.querySelectorAll('.cargo-type-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Выделяем выбранный
    const selectedItem = document.querySelector(`[data-type="${type}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    currentCargoType = type;
    
    // Устанавливаем размеры по умолчанию для типа
    setDefaultDimensionsForType(type);
}

function setDefaultDimensionsForType(type) {
    switch(type) {
        case 'euro-pallet':
            currentDimensions = { length: 120, width: 80, height: 30 };
            break;
        case 'american-pallet':
            currentDimensions = { length: 120, width: 100, height: 30 };
            break;
        case 'box':
            currentDimensions = { length: 60, width: 40, height: 40 };
            break;
        case 'non-standard':
            currentDimensions = { length: 100, width: 100, height: 100 };
            break;
    }
    // Обновляем поля ввода
    ['length', 'width', 'height'].forEach(dim => {
        const input = document.getElementById(dim + 'Input');
        if (input && currentDimensions[dim]) {
            input.value = currentDimensions[dim];
        }
    });
    // Обновляем отображения (для обратной совместимости)
    updateDimensionDisplays();
    // Обновляем статистику
    updateCurrentStats();
}

// ОСНОВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ С УЧЕТОМ КОЛИЧЕСТВА
function saveCargo() {
    console.log('Сохранение груза...');
    
    const weightInput = document.getElementById('weightInput');
    let weight = currentWeight || 1;
    
    if (weightInput) {
        weight = parseInt(weightInput.value) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10000) weight = 10000;
        currentWeight = weight;
    }
    
    const quantity = currentQuantity || 1;
    
    // Проверяем, что все данные есть
    if (!currentCargoType || !currentDimensions) {
        showNotification('Ошибка: не выбран тип груза', true);
        return;
    }
    
    // Создаем ключ для группировки
    const cargoKey = `${currentCargoType}_${weight}_${currentDimensions.length}_${currentDimensions.width}_${currentDimensions.height}_${quantity}`;
    
    // Проверяем, есть ли уже такой груз в списке
    let existingCargo = null;
    let existingIndex = -1;
    
    for (let i = 0; i < cargoList.length; i++) {
        const cargo = cargoList[i];
        const cargoItemKey = `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}_${cargo.quantity}`;
        
        if (cargoKey === cargoItemKey) {
            existingCargo = cargo;
            existingIndex = i;
            break;
        }
    }
    
    const photo = document.getElementById('cargoPhoto')?.src || null;
    
    if (existingCargo) {
        // Обновляем существующий груз - увеличиваем количество
        cargoList[existingIndex].quantity += quantity;
        cargoList[existingIndex].timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        cargoList[existingIndex].photo = photo || cargoList[existingIndex].photo;
        
        showNotification(`Добавлено ${quantity} шт. к существующему грузу. Всего: ${cargoList[existingIndex].quantity} шт.`);
    } else {
        // Создаем новый груз
        const volume = (currentDimensions.length * 
                        currentDimensions.width * 
                        currentDimensions.height) / 1000000;
        
        const cargo = {
            id: Date.now(),
            type: currentCargoType,
            typeName: getCargoTypeName(currentCargoType),
            weight: weight,
            length: currentDimensions.length,
            width: currentDimensions.width,
            height: currentDimensions.height,
            volume: volume,
            quantity: quantity,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            photo: photo,
            cargoKey: cargoKey,
            // Дополнительные поля для SQL
            employeeId: getCurrentEmployeeId(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ru-RU', {hour12: false})
        };
        
        cargoList.push(cargo);
        showNotification(`Добавлен новый груз: ${quantity} шт.`);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
    
    // Обновляем статистику
    updateStats();
    
    // Сбрасываем фото
    resetPhoto();
    
    // Сбрасываем количество к 1
    if (currentQuantity !== undefined) {
        currentQuantity = 1;
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) quantityInput.value = 1;
        updateQuantityDisplay();
    }
    
    // Обновляем статистику текущего груза
    updateCurrentStats();
    
    console.log('Груз сохранен. Всего грузов:', cargoList.length);
}

// ФУНКЦИЯ ОТОБРАЖЕНИЯ СПИСКА ГРУЗОВ С ГРУППИРОВКОЙ
function showCargoListModal() {
    console.log('Показываем модальное окно списка грузов...');
    
    const content = document.getElementById('cargoListContent');
    
    if (!cargoListModal || !content) {
        console.error('Не найдены элементы модального окна');
        return;
    }
    
    // Очищаем содержимое
    content.innerHTML = '';
    
    if (!cargoList || cargoList.length === 0) {
        content.innerHTML = '<div class="empty-state">Нет сохраненных грузов</div>';
    } else {
        // Группируем грузы по ключу
        const groupedCargo = {};
        
        cargoList.forEach(cargo => {
            const key = cargo.cargoKey || `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}_${cargo.quantity}`;
            
            if (!groupedCargo[key]) {
                groupedCargo[key] = {
                    type: cargo.type,
                    typeName: cargo.typeName,
                    weight: cargo.weight,
                    length: cargo.length,
                    width: cargo.width,
                    height: cargo.height,
                    volume: cargo.volume,
                    quantity: cargo.quantity,
                    photo: cargo.photo,
                    items: [cargo],
                    firstItemId: cargo.id
                };
            } else {
                groupedCargo[key].quantity += cargo.quantity;
                groupedCargo[key].items.push(cargo);
            }
        });
        
        // Создаем элементы для сгруппированных грузов
        Object.values(groupedCargo).forEach((group, index) => {
            const cargoItem = document.createElement('div');
            cargoItem.className = 'cargo-list-item';
            
            const totalVolume = group.volume * group.quantity;
            // ВНИМАНИЕ: Для отображения показываем просто вес, без умножения на количество
            const displayWeight = group.weight;
            
            cargoItem.innerHTML = `
                <div class="cargo-list-header">
                    <div class="cargo-type-badge">
                        <span class="cargo-emoji-small">${getCargoEmoji(group.type)}</span>
                        <span>${group.typeName}</span>
                        ${group.quantity > 1 ? `<span class="cargo-quantity-badge">×${group.quantity}</span>` : ''}
                    </div>
                    <span class="cargo-weight">${displayWeight} кг</span>
                </div>
                <div class="cargo-details">
                    <div class="detail-item">
                        <span class="detail-label">Вес (шт.)</span>
                        <span class="detail-value">${group.weight} кг</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Размеры</span>
                        <span class="detail-value">${group.length}×${group.width}×${group.height}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Объем (шт.)</span>
                        <span class="detail-value">${group.volume.toFixed(2)} м³</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Общий объем</span>
                        <span class="detail-value">${totalVolume.toFixed(2)} м³</span>
                    </div>
                </div>
                ${group.photo ? `<img src="${group.photo}" class="cargo-photo-preview" alt="Фото груза">` : ''}
                <div class="cargo-group-controls">
                    <button class="btn-quantity-change" onclick="changeGroupQuantity(${group.firstItemId}, -1)">-1</button>
                    <button class="btn-quantity-change" onclick="changeGroupQuantity(${group.firstItemId}, 1)">+1</button>
                    <button class="btn-remove-group" onclick="removeCargoGroup(${group.firstItemId})">Удалить все</button>
                </div>
            `;
            
            content.appendChild(cargoItem);
        });
    }
    
    // Обновляем итоги в модальном окне
    updateModalTotals();
    
    // Показываем модальное окно
    cargoListModal.style.display = 'block';
    
    console.log('Модальное окно показано');
}

// ФУНКЦИЯ ИЗМЕНЕНИЯ КОЛИЧЕСТВА В ГРУППЕ
function changeGroupQuantity(firstItemId, delta) {
    // Находим первый элемент группы
    const firstItemIndex = cargoList.findIndex(item => item.id === firstItemId);
    
    if (firstItemIndex === -1) return;
    
    const firstItem = cargoList[firstItemIndex];
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}_${firstItem.quantity}`;
    
    // Находим все элементы этой группы
    const groupItems = cargoList.filter(item => {
        const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}_${item.quantity}`;
        return itemKey === cargoKey;
    });
    
    if (groupItems.length === 0) return;
    
    // Если уменьшаем количество и оно станет 0, удаляем всю группу
    if (delta === -1 && groupItems.length === 1 && groupItems[0].quantity === 1) {
        removeCargoGroup(firstItemId);
        return;
    }
    
    // Изменяем количество в первом элементе группы
    const newQuantity = groupItems[0].quantity + delta;
    
    if (newQuantity < 1) {
        // Если количество стало 0, удаляем группу
        removeCargoGroup(firstItemId);
        return;
    }
    
    // Обновляем количество в первом элементе
    cargoList[firstItemIndex].quantity = newQuantity;
    
    // Удаляем остальные элементы группы (они теперь не нужны)
    for (let i = cargoList.length - 1; i >= 0; i--) {
        if (i !== firstItemIndex) {
            const item = cargoList[i];
            const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}_${item.quantity}`;
            if (itemKey === cargoKey) {
                cargoList.splice(i, 1);
            }
        }
    }
    
    // Сохраняем изменения
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
    updateStats();
    showCargoListModal(); // Обновляем отображение
    showNotification(`Количество изменено: ${newQuantity} шт.`);
}

// ФУНКЦИЯ УДАЛЕНИЯ ВСЕЙ ГРУППЫ
function removeCargoGroup(firstItemId) {
    // Находим первый элемент группы
    const firstItemIndex = cargoList.findIndex(item => item.id === firstItemId);
    
    if (firstItemIndex === -1) return;
    
    const firstItem = cargoList[firstItemIndex];
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}_${firstItem.quantity}`;
    
    // Удаляем все элементы группы
    cargoList = cargoList.filter(item => {
        const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}_${item.quantity}`;
        return itemKey !== cargoKey;
    });
    
    // Сохраняем изменения
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
    updateStats();
    
    // Закрываем модальное окно если список пуст
    if (cargoList.length === 0) {
        closeCargoListModal();
    } else {
        showCargoListModal(); // Обновляем отображение
    }
    
    showNotification('Группа грузов удалена');
}

// ФУНКЦИЯ ЗАКРЫТИЯ МОДАЛЬНОГО ОКНА
function closeCargoListModal() {
    if (cargoListModal) {
        cargoListModal.style.display = 'none';
    }
}

// ПОКАЗ МАЛЕНЬКОГО ОКОШКА СТАТИСТИКИ
function showCargoStatsPopup() {
    console.log('Показываем маленькое окно статистики...');
    
    const popup = document.getElementById('cargoStatsPopup');
    const overlay = document.getElementById('cargoStatsOverlay');
    const itemsContainer = document.getElementById('cargoStatsItems');
    const totalsContainer = document.getElementById('cargoStatsTotals');
    
    if (!popup || !overlay || !itemsContainer) {
        console.error('Не найдены элементы окна статистики');
        showCargoListModal(); // Показываем старое окно как запасной вариант
        return;
    }
    
    // Очищаем содержимое
    itemsContainer.innerHTML = '';
    
    if (!cargoList || cargoList.length === 0) {
        itemsContainer.innerHTML = '<div class="cargo-stats-empty">Нет сохраненных грузов</div>';
    } else {
        // Группируем грузы по ключу (как в старой функции)
        const groupedCargo = {};
        
        cargoList.forEach(cargo => {
            const key = cargo.cargoKey || `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}_${cargo.quantity}`;
            
            if (!groupedCargo[key]) {
                groupedCargo[key] = {
                    type: cargo.type,
                    typeName: cargo.typeName,
                    weight: cargo.weight,
                    length: cargo.length,
                    width: cargo.width,
                    height: cargo.height,
                    volume: cargo.volume,
                    quantity: cargo.quantity,
                    items: [cargo],
                    firstItemId: cargo.id
                };
            } else {
                groupedCargo[key].quantity += cargo.quantity;
                groupedCargo[key].items.push(cargo);
            }
        });
        
        // Создаем элементы для сгруппированных грузов (упрощенный вид)
        Object.values(groupedCargo).forEach((group, index) => {
            const cargoItem = document.createElement('div');
            cargoItem.className = 'cargo-stats-item';
            
            const totalVolume = group.volume * group.quantity;
            // ВНИМАНИЕ: Для отображения показываем просто вес, без умножения на количество
            const displayWeight = group.weight;
            
            cargoItem.innerHTML = `
                <div class="cargo-stats-item-header">
                    <div class="cargo-stats-item-type">
                        <span>${getCargoEmoji(group.type)}</span>
                        <span>${group.typeName}</span>
                        ${group.quantity > 1 ? `<span class="cargo-stats-item-quantity">×${group.quantity}</span>` : ''}
                    </div>
                    <span style="font-size: 12px; color: #666;">${displayWeight} кг</span>
                </div>
                <div class="cargo-stats-item-details">
                    <div class="cargo-stats-detail">
                        <span class="cargo-stats-detail-label">Размеры</span>
                        <span class="cargo-stats-detail-value">${group.length}×${group.width}×${group.height}</span>
                    </div>
                    <div class="cargo-stats-detail">
                        <span class="cargo-stats-detail-label">Объем</span>
                        <span class="cargo-stats-detail-value">${totalVolume.toFixed(2)} м³</span>
                    </div>
                    <div class="cargo-stats-detail">
                        <span class="cargo-stats-detail-label">Вес (шт.)</span>
                        <span class="cargo-stats-detail-value">${group.weight} кг</span>
                    </div>
                    <div class="cargo-stats-detail">
                        <span class="cargo-stats-detail-label">Время</span>
                        <span class="cargo-stats-detail-value">${group.items[0].timestamp || ''}</span>
                    </div>
                </div>
            `;
            
            itemsContainer.appendChild(cargoItem);
        });
    }
    
    // Обновляем итоги
    if (totalsContainer) {
        if (!cargoList || cargoList.length === 0) {
            totalsContainer.innerHTML = '';
        } else {
            // Вычисляем общие показатели
            let totalItems = 0;
            let sumWeight = 0;
            let sumVolume = 0;
            
            // ИСПРАВЛЕНИЕ: Теперь считаем общую массу как сумму весов каждого сохраненного груза
            // Каждый сохраненный груз имеет свой вес, который НЕ умножается на количество
            cargoList.forEach(cargo => {
                totalItems += cargo.quantity || 1;
                // ВАЖНО: Общая масса = просто сумма весов каждого груза (без умножения на количество)
                sumWeight += cargo.weight;
                sumVolume += cargo.volume * (cargo.quantity || 1);
            });
            
            totalsContainer.innerHTML = `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Всего мест:</span>
                        <span style="font-weight: bold;">${totalItems}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Общая масса:</span>
                        <span style="font-weight: bold;">${sumWeight} кг</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Общий объем:</span>
                        <span style="font-weight: bold;">${sumVolume.toFixed(2)} м³</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Показываем окошко
    popup.classList.add('active');
    overlay.classList.add('active');
    
    console.log('Маленькое окно статистики показано');
}

// ЗАКРЫТИЕ МАЛЕНЬКОГО ОКОШКА СТАТИСТИКИ
function closeCargoStatsPopup() {
    const popup = document.getElementById('cargoStatsPopup');
    const overlay = document.getElementById('cargoStatsOverlay');
    
    if (popup) popup.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// ОБНОВЛЕНИЕ СТАТИСТИКИ - ВАЖНОЕ ИСПРАВЛЕНИЕ!
function updateStats() {
    const cargoCount = document.getElementById('cargoCount');
    const totalWeight = document.getElementById('totalWeight');
    const totalVolume = document.getElementById('totalVolume');
    
    // Также обновляем новые элементы
    const totalCargoCount = document.getElementById('totalCargoCount');
    const totalWeightValue = document.getElementById('totalWeightValue');
    const totalVolumeValue = document.getElementById('totalVolumeValue');
    
    if (!cargoList || cargoList.length === 0) {
        if (cargoCount) cargoCount.textContent = '0';
        if (totalWeight) totalWeight.textContent = '0 кг';
        if (totalVolume) totalVolume.textContent = '0 м³';
        if (totalCargoCount) totalCargoCount.textContent = '0';
        if (totalWeightValue) totalWeightValue.textContent = '0 кг';
        if (totalVolumeValue) totalVolumeValue.textContent = '0 м³';
        return;
    }
    
    // Вычисляем общие показатели
    let totalItems = 0;
    let sumWeight = 0;  // Общая масса = сумма весов всех сохраненных грузов
    let sumVolume = 0;  // Общий объем = сумма (объем * количество)
    
    // ИСПРАВЛЕНИЕ: Теперь общая масса - это просто сумма весов всех сохраненных грузов
    // Каждый сохраненный груз имеет свой собственный вес, который НЕ умножается на количество
    cargoList.forEach(cargo => {
        totalItems += cargo.quantity || 1;
        // ВАЖНО: Общая масса = просто сумма весов каждого груза
        sumWeight += cargo.weight;
        sumVolume += cargo.volume * (cargo.quantity || 1);
    });
    
    // Обновляем старые элементы (для обратной совместимости)
    if (cargoCount) cargoCount.textContent = totalItems;
    if (totalWeight) totalWeight.textContent = sumWeight + ' кг';
    if (totalVolume) totalVolume.textContent = sumVolume.toFixed(2) + ' м³';
    
    // Обновляем новые элементы
    if (totalCargoCount) totalCargoCount.textContent = totalItems;
    if (totalWeightValue) totalWeightValue.textContent = sumWeight + ' кг';
    if (totalVolumeValue) totalVolumeValue.textContent = sumVolume.toFixed(2) + ' м³';
}

// ОБНОВЛЕНИЕ ИТОГОВ В МОДАЛЬНОМ ОКНЕ
function updateModalTotals() {
    const modalTotalWeight = document.getElementById('modalTotalWeight');
    const modalTotalVolume = document.getElementById('modalTotalVolume');
    const modalCargoCount = document.getElementById('modalCargoCount');
    
    if (!cargoList || cargoList.length === 0) {
        if (modalTotalWeight) modalTotalWeight.textContent = '0 кг';
        if (modalTotalVolume) modalTotalVolume.textContent = '0 м³';
        if (modalCargoCount) modalCargoCount.textContent = '0';
        return;
    }
    
    // Вычисляем с учетом исправленной логики
    let totalItems = 0;
    let sumWeight = 0;  // Общая масса = сумма весов всех сохраненных грузов
    let sumVolume = 0;  // Общий объем = сумма (объем * количество)
    
    cargoList.forEach(cargo => {
        totalItems += cargo.quantity || 1;
        // ВАЖНО: Общая масса = просто сумма весов каждого груза
        sumWeight += cargo.weight;
        sumVolume += cargo.volume * (cargo.quantity || 1);
    });
    
    if (modalTotalWeight) modalTotalWeight.textContent = sumWeight + ' кг';
    if (modalTotalVolume) modalTotalVolume.textContent = sumVolume.toFixed(2) + ' м³';
    if (modalCargoCount) modalCargoCount.textContent = totalItems;
}

// ФУНКЦИЯ ОТПРАВКИ ОПЕРАТОРУ - ВАЖНОЕ ИСПРАВЛЕНИЕ!
function sendToOperator() {
    if (!cargoList || cargoList.length === 0) {
        showNotification('Нет грузов для отправки', true);
        return;
    }
    
    // Создаем данные для отправки
    const dataToSend = {
        employee: JSON.parse(localStorage.getItem('employeeAuth')) || {name: 'Неизвестный сотрудник'},
        cargoList: cargoList,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
            totalItems: cargoList.reduce((sum, cargo) => sum + (cargo.quantity || 1), 0),
            // ИСПРАВЛЕНИЕ: Общая масса = сумма весов каждого груза (без умножения на количество)
            totalWeight: cargoList.reduce((sum, cargo) => sum + cargo.weight, 0),
            totalVolume: cargoList.reduce((sum, cargo) => sum + (cargo.volume * (cargo.quantity || 1)), 0)
        }
    };
    
    console.log('Отправка данных оператору:', dataToSend);
    
    // Здесь будет реальная отправка данных
    // Пока просто показываем уведомление
    showNotification('Данные отправлены оператору!');
    
    // Сохраняем в localStorage для истории
    const shipments = JSON.parse(localStorage.getItem('shipments')) || [];
    shipments.push(dataToSend);
    localStorage.setItem('shipments', JSON.stringify(shipments));
    
    // ВАЖНОЕ ИСПРАВЛЕНИЕ: Очищаем список после отправки!
    cargoList = [];
    localStorage.removeItem('cargoList');
    updateStats();
    
    // Закрываем окно статистики если оно открыто
    closeCargoStatsPopup();
}

// ПОЛУЧЕНИЕ ID ТЕКУЩЕГО СОТРУДНИКА
function getCurrentEmployeeId() {
    const authData = localStorage.getItem('employeeAuth');
    if (authData) {
        try {
            const employee = JSON.parse(authData);
            return employee.id || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }
    return 'unknown';
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function getCargoTypeName(type) {
    const names = {
        'euro-pallet': 'Европаллет',
        'american-pallet': 'Американский паллет',
        'box': 'Коробка',
        'non-standard': 'Нестандарт'
    };
    return names[type] || type;
}

function getCargoEmoji(type) {
    const emojis = {
        'euro-pallet': '🇪🇺',
        'american-pallet': '🇺🇸',
        'box': '📦',
        'non-standard': '📏'
    };
    return emojis[type] || '📦';
}

// ФУНКЦИЯ ДЛЯ ПОКАЗА УВЕДОМЛЕНИЙ
function showNotification(message, isError = false) {
    // Проверяем, есть ли уже уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    if (isError) {
        notification.classList.add('error');
    }
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 10px;
        background: ${isError ? '#e74c3c' : '#4CAF50'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ФУНКЦИИ ДЛЯ РАБОТЫ С АВТОРИЗАЦИЕЙ
function updateEmployeeInfo() {
    const nameElement = document.getElementById('employeeName');
    if (nameElement) {
        const authData = localStorage.getItem('employeeAuth');
        if (authData) {
            try {
                const employee = JSON.parse(authData);
                nameElement.textContent = employee.name || 'Сотрудник';
            } catch (e) {
                nameElement.textContent = 'Сотрудник';
            }
        } else {
            nameElement.textContent = 'Не авторизован';
            // Автоматический редирект на страницу авторизации через 1 секунду
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

function logout() {
    localStorage.removeItem('employeeAuth');
    localStorage.removeItem('cargoList'); // Очищаем данные грузов при выходе
    window.location.href = 'index.html'; // Перенаправление на страницу входа
}

// ОПТИМИЗАЦИЯ ДЛЯ ПЛАНШЕТОВ
function initTabletOptimization() {
    // Увеличиваем область клика для планшетов
    if (window.innerWidth >= 768) {
        // Добавляем класс для планшетов
        document.body.classList.add('tablet-device');
        
        // Увеличиваем тач-таргеты для всех кликабельных элементов
        const clickableElements = document.querySelectorAll(
            'button, .cargo-type-item, .photo-container, .stats-header, ' +
            '.dimension-btn, .quantity-btn, .btn-save, .btn-send, ' +
            '.btn-quantity-change, .btn-remove-group'
        );
        
        clickableElements.forEach(el => {
            el.style.minHeight = '44px';
            el.style.minWidth = '44px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
        });
        
        console.log('Планшетная оптимизация применена');
    }
}

// ФИКС ДЛЯ КЛИКОВ НА ПЛАНШЕТАХ
function handleTabletClicks() {
    // Некоторые планшеты требуют особой обработки touch событий
    document.addEventListener('touchstart', function(e) {
        // Предотвращаем зум на быстрые тапы
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Улучшаем feedback для тапов
    document.addEventListener('touchstart', function(e) {
        const target = e.target;
        if (target.matches('button, .cargo-type-item, .photo-container, .stats-header')) {
            target.classList.add('active-touch');
        }
    });
    
    document.addEventListener('touchend', function(e) {
        const target = e.target;
        if (target.matches('button, .cargo-type-item, .photo-container, .stats-header')) {
            target.classList.remove('active-touch');
        }
    });
}

// ОПТИМИЗАЦИЯ МОДАЛЬНОГО ОКНА ДЛЯ ПЛАНШЕТОВ
function optimizeModalForTablet() {
    const modal = document.getElementById('cargoListModal');
    if (modal && window.innerWidth >= 768) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = '600px';
            modalContent.style.padding = '25px';
            
            // Увеличиваем кнопки в модальном окне
            const modalButtons = modalContent.querySelectorAll('button');
            modalButtons.forEach(btn => {
                btn.style.minHeight = '50px';
                btn.style.fontSize = '16px';
                btn.style.padding = '12px 20px';
            });
        }
    }
}

// ЗАКРЫТИЕ ПРИ КЛИКЕ ВНЕ ОКОШКА
window.onclick = function(event) {
    if (event.target === cargoListModal) {
        closeCargoListModal();
    }
    
    const popup = document.getElementById('cargoStatsPopup');
    const overlay = document.getElementById('cargoStatsOverlay');
    
    if (popup && overlay && 
        event.target === overlay && 
        popup.classList.contains('active')) {
        closeCargoStatsPopup();
    }
};

// ЗАКРЫТИЕ ПРИ НАЖАТИИ ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCargoStatsPopup();
        closeCargoListModal(); // Закрываем и старое окно тоже
    }
});

// ДОБАВЛЯЕМ СТИЛИ ДЛЯ АНИМАЦИЙ И ГРУППИРОВКИ
function addAdditionalStyles() {
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        /* Анимации для уведомлений */
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
        
        .notification.error {
            background: #e74c3c !important;
        }
        
        .active-touch {
            opacity: 0.8 !important;
            transform: scale(0.98) !important;
            transition: all 0.1s ease !important;
        }
    `;
    
    document.head.appendChild(additionalStyles);
}

// Вызываем добавление стилей при загрузке
addAdditionalStyles();

// ИНИЦИАЛИЗАЦИЯ ПЛАНШЕТНОЙ ОПТИМИЗАЦИИ
document.addEventListener('DOMContentLoaded', function() {
    // Оптимизируем модальное окно при показе
    const originalShowModal = window.showCargoListModal;
    window.showCargoListModal = function() {
        originalShowModal();
        optimizeModalForTablet();
    };
});

// ЭКСПОРТ ФУНКЦИЙ ДЛЯ HTML
window.changeDimension = changeDimension;
window.changeQuantity = changeQuantity;
window.takePhoto = takePhoto;
window.selectCargoType = selectCargoType;
window.saveCargo = saveCargo;
window.sendToOperator = sendToOperator;
window.showCargoListModal = showCargoListModal;
window.closeCargoListModal = closeCargoListModal;
window.changeGroupQuantity = changeGroupQuantity;
window.removeCargoGroup = removeCargoGroup;
window.updateEmployeeInfo = updateEmployeeInfo;
window.logout = logout;
window.showNotification = showNotification;
window.showCargoStatsPopup = showCargoStatsPopup;
window.closeCargoStatsPopup = closeCargoStatsPopup;

// Экспорт новых функций
window.changeParam = changeParam;
window.updateWeightFromInput = updateWeightFromInput;
window.updateDimensionFromInput = updateDimensionFromInput;
window.updateQuantityFromInput = updateQuantityFromInput;
window.updateCurrentStats = updateCurrentStats;
window.updateTotalStats = updateTotalStats;
window.sendToOperatorAndReset = sendToOperatorAndReset;
window.clearAllCargo = clearAllCargo;

console.log('Все функции script.js загружены и готовы к использованию');
