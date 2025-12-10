// script.js - ПОЛНЫЙ ФАЙЛ СО ВСЕМИ ФУНКЦИЯМИ

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
    
    // Настройка поля ввода веса
    setupWeightInput();
    
    // Обновляем отображения
    updateDimensionDisplays();
    updateQuantityDisplay();
    
    // Получаем ссылку на модальное окно
    cargoListModal = document.getElementById('cargoListModal');
    
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

// НАСТРОЙКА ПОЛЯ ВВОДА ВЕСА
function setupWeightInput() {
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.value = currentWeight || 1;
        
        weightInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const weight = parseInt(this.value) || 1;
            if (weight >= 1 && weight <= 10000) {
                currentWeight = weight;
            }
        });
        
        weightInput.addEventListener('change', function() {
            let weight = parseInt(this.value) || 1;
            if (weight < 1) weight = 1;
            if (weight > 10000) weight = 10000;
            this.value = weight;
            currentWeight = weight;
        });
        
        weightInput.addEventListener('focus', function() {
            this.select();
        });
    }
}

// ФУНКЦИИ ДЛЯ РАЗМЕРОВ
function changeDimension(dimension, delta) {
    if (currentDimensions && currentDimensions[dimension] !== undefined) {
        let newValue = currentDimensions[dimension] + delta;
        if (newValue >= 10) {
            currentDimensions[dimension] = newValue;
            updateDimensionDisplay(dimension);
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

// ФУНКЦИИ ДЛЯ КОЛИЧЕСТВА
function changeQuantity(delta) {
    let newQuantity = (currentQuantity || 1) + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
        currentQuantity = newQuantity;
        updateQuantityDisplay();
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
    updateDimensionDisplays();
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
    const cargoKey = `${currentCargoType}_${weight}_${currentDimensions.length}_${currentDimensions.width}_${currentDimensions.height}`;
    
    // Проверяем, есть ли уже такой груз в списке
    let existingCargo = null;
    let existingIndex = -1;
    
    for (let i = 0; i < cargoList.length; i++) {
        const cargo = cargoList[i];
        const cargoItemKey = `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}`;
        
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
        updateQuantityDisplay();
    }
    
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
            const key = cargo.cargoKey || `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}`;
            
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
            const totalWeight = group.weight * group.quantity;
            
            cargoItem.innerHTML = `
                <div class="cargo-list-header">
                    <div class="cargo-type-badge">
                        <span class="cargo-emoji-small">${getCargoEmoji(group.type)}</span>
                        <span>${group.typeName}</span>
                        ${group.quantity > 1 ? `<span class="cargo-quantity-badge">×${group.quantity}</span>` : ''}
                    </div>
                    <span class="cargo-weight">${totalWeight} кг</span>
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
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}`;
    
    // Находим все элементы этой группы
    const groupItems = cargoList.filter(item => {
        const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}`;
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
            const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}`;
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
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}`;
    
    // Удаляем все элементы группы
    cargoList = cargoList.filter(item => {
        const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}`;
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

// ОБНОВЛЕНИЕ СТАТИСТИКИ
function updateStats() {
    const cargoCount = document.getElementById('cargoCount');
    const totalWeight = document.getElementById('totalWeight');
    const totalVolume = document.getElementById('totalVolume');
    
    if (!cargoList || cargoList.length === 0) {
        if (cargoCount) cargoCount.textContent = '0';
        if (totalWeight) totalWeight.textContent = '0 кг';
        if (totalVolume) totalVolume.textContent = '0 м³';
        return;
    }
    
    // Вычисляем общие показатели с учетом количества
    let totalItems = 0;
    let sumWeight = 0;
    let sumVolume = 0;
    
    cargoList.forEach(cargo => {
        totalItems += cargo.quantity || 1;
        sumWeight += cargo.weight * (cargo.quantity || 1);
        sumVolume += cargo.volume * (cargo.quantity || 1);
    });
    
    if (cargoCount) cargoCount.textContent = totalItems;
    if (totalWeight) totalWeight.textContent = sumWeight + ' кг';
    if (totalVolume) totalVolume.textContent = sumVolume.toFixed(2) + ' м³';
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
    
    // Вычисляем с учетом количества
    let totalItems = 0;
    let sumWeight = 0;
    let sumVolume = 0;
    
    cargoList.forEach(cargo => {
        totalItems += cargo.quantity || 1;
        sumWeight += cargo.weight * (cargo.quantity || 1);
        sumVolume += cargo.volume * (cargo.quantity || 1);
    });
    
    if (modalTotalWeight) modalTotalWeight.textContent = sumWeight + ' кг';
    if (modalTotalVolume) modalTotalVolume.textContent = sumVolume.toFixed(2) + ' м³';
    if (modalCargoCount) modalCargoCount.textContent = totalItems;
}

// ФУНКЦИЯ ОТПРАВКИ ОПЕРАТОРУ
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
            totalWeight: cargoList.reduce((sum, cargo) => sum + (cargo.weight * (cargo.quantity || 1)), 0),
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
    
    // Можно очистить список после отправки (раскомментировать если нужно)
    // cargoList = [];
    // localStorage.removeItem('cargoList');
    // updateStats();
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

// ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ПРИ КЛИКЕ ВНЕ ЕГО
window.onclick = function(event) {
    if (event.target === cargoListModal) {
        closeCargoListModal();
    }
};

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
        
        /* Стили для группировки грузов в модальном окне */
        .cargo-quantity-badge {
            background: #27ae60;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 5px;
            font-weight: bold;
        }
        
        .cargo-group-controls {
            display: flex;
            gap: 5px;
            margin-top: 8px;
        }
        
        .btn-quantity-change {
            flex: 1;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn-quantity-change:hover {
            background: #2980b9;
        }
        
        .btn-remove-group {
            flex: 1;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn-remove-group:hover {
            background: #c0392b;
        }
        
        .cargo-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .cargo-type-badge {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .cargo-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
            font-size: 11px;
            margin-bottom: 8px;
        }
        
        .detail-item {
            text-align: center;
            padding: 4px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .detail-label {
            display: block;
            font-size: 9px;
            color: #666;
            margin-bottom: 2px;
        }
        
        .detail-value {
            display: block;
            font-weight: bold;
            font-size: 11px;
            color: #2c3e50;
        }
        
        .empty-state {
            text-align: center;
            color: #999;
            font-style: italic;
            padding: 30px 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px dashed #dee2e6;
            font-size: 14px;
        }
        
        .notification.error {
            background: #e74c3c !important;
        }
    `;
    
    document.head.appendChild(additionalStyles);
}

// Вызываем добавление стилей при загрузке
addAdditionalStyles();

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

console.log('Все функции script.js загружены и готовы к использованию');
// script.js - ДОБАВЛЯЕМ ПЛАНШЕТНУЮ ОПТИМИЗАЦИЮ

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

// ИНИЦИАЛИЗАЦИЯ ПЛАНШЕТНОЙ ОПТИМИЗАЦИИ
document.addEventListener('DOMContentLoaded', function() {
    // Запускаем оптимизацию
    initTabletOptimization();
    handleTabletClicks();
    
    // Отслеживаем изменение ориентации
    window.addEventListener('resize', function() {
        initTabletOptimization();
        optimizeModalForTablet();
    });
    
    // Оптимизируем модальное окно при показе
    const originalShowModal = window.showCargoListModal;
    window.showCargoListModal = function() {
        originalShowModal();
        optimizeModalForTablet();
    };
});

// ДОБАВЛЯЕМ СТИЛИ ДЛЯ АКТИВНОГО ТАЧА
const touchStyles = document.createElement('style');
touchStyles.textContent = `
    .active-touch {
        opacity: 0.8 !important;
        transform: scale(0.98) !important;
        transition: all 0.1s ease !important;
    }
    
    /* Увеличенные тач-таргеты для планшетов */
    @media (min-width: 768px) {
        button,
        .cargo-type-item,
        .photo-container,
        .stats-header,
        .dimension-btn,
        .quantity-btn,
        .btn-save,
        .btn-send,
        .btn-quantity-change,
        .btn-remove-group {
            min-height: 44px !important;
            min-width: 44px !important;
        }
        
        .dimension-btn,
        .quantity-btn {
            width: 44px !important;
            height: 44px !important;
        }
        
        /* Улучшаем видимость фокуса */
        *:focus {
            outline: 3px solid #3498db !important;
            outline-offset: 3px !important;
        }
    }
    
    /* Исправление для вертикальных планшетов */
    @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
        .cargo-container {
            max-width: 800px !important;
            margin: 10px auto !important;
        }
        
        .cargo-content-columns {
            flex-direction: column !important;
        }
        
        .right-column {
            flex-direction: row !important;
            margin-top: 15px;
        }
        
        .action-buttons {
            flex-direction: row !important;
            gap: 15px;
        }
        
        .btn-save,
        .btn-send {
            flex: 1;
        }
        
        .stats-section {
            flex: 1;
            min-height: auto !important;
        }
        
        .photo-section {
            flex: 1;
        }
    }
`;
document.head.appendChild(touchStyles);
