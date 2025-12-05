// script.js - ПОЛНЫЙ ФАЙЛ С ГРУППИРОВКОЙ ГРУЗОВ
document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL - Замер грузов с группировкой загружен');
    
    // Инициализация переменных (если не были инициализированы в HTML)
    if (!window.cargoList) {
        window.cargoList = JSON.parse(localStorage.getItem('cargoList')) || [];
    }
    
    if (!window.currentQuantity) {
        window.currentQuantity = 1;
    }
    
    // Инициализация фото
    initPhotoInput();
    
    // Обновляем статистику
    updateStats();
    updateEmployeeInfo();
    
    // Проверяем, была ли инициализация в HTML
    if (typeof window.currentCargoType === 'undefined') {
        window.currentCargoType = 'euro-pallet';
        window.currentWeight = 1;
        window.currentQuantity = 1;
        window.currentDimensions = {
            length: 120,
            width: 80,
            height: 30
        };
    }
    
    // Настройка поля ввода веса
    setupWeightInput();
    
    // Обновляем отображения
    updateDimensionDisplays();
    updateQuantityDisplay();
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
        weightInput.value = window.currentWeight || 1;
        
        weightInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            const weight = parseInt(this.value) || 1;
            if (weight >= 1 && weight <= 10000) {
                window.currentWeight = weight;
            }
        });
        
        weightInput.addEventListener('change', function() {
            let weight = parseInt(this.value) || 1;
            if (weight < 1) weight = 1;
            if (weight > 10000) weight = 10000;
            this.value = weight;
            window.currentWeight = weight;
        });
        
        weightInput.addEventListener('focus', function() {
            this.select();
        });
    }
}

// ФУНКЦИИ ДЛЯ РАЗМЕРОВ
function changeDimension(dimension, delta) {
    if (window.currentDimensions && window.currentDimensions[dimension] !== undefined) {
        let newValue = window.currentDimensions[dimension] + delta;
        if (newValue >= 10) {
            window.currentDimensions[dimension] = newValue;
            updateDimensionDisplay(dimension);
        }
    }
}

function updateDimensionDisplay(dimension) {
    const element = document.getElementById(dimension + 'Value');
    if (element && window.currentDimensions) {
        element.textContent = window.currentDimensions[dimension];
    }
}

function updateDimensionDisplays() {
    updateDimensionDisplay('length');
    updateDimensionDisplay('width');
    updateDimensionDisplay('height');
}

// ФУНКЦИИ ДЛЯ КОЛИЧЕСТВА
function changeQuantity(delta) {
    let newQuantity = (window.currentQuantity || 1) + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
        window.currentQuantity = newQuantity;
        updateQuantityDisplay();
    }
}

function updateQuantityDisplay() {
    const element = document.getElementById('quantityValue');
    if (element && window.currentQuantity !== undefined) {
        element.textContent = window.currentQuantity;
    }
}

// ОСНОВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ С УЧЕТОМ КОЛИЧЕСТВА
window.saveCargoWithQuantity = function() {
    const weightInput = document.getElementById('weightInput');
    let weight = window.currentWeight || 1;
    
    if (weightInput) {
        weight = parseInt(weightInput.value) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10000) weight = 10000;
        window.currentWeight = weight;
    }
    
    const quantity = window.currentQuantity || 1;
    
    // Проверяем, что все данные есть
    if (!window.currentCargoType || !window.currentDimensions) {
        showNotification('Ошибка: не выбран тип груза', true);
        return;
    }
    
    // Создаем ключ для группировки
    const cargoKey = `${window.currentCargoType}_${weight}_${window.currentDimensions.length}_${window.currentDimensions.width}_${window.currentDimensions.height}`;
    
    // Проверяем, есть ли уже такой груз в списке
    let existingCargo = null;
    let existingIndex = -1;
    
    for (let i = 0; i < window.cargoList.length; i++) {
        const cargo = window.cargoList[i];
        const cargoItemKey = `${cargo.type}_${cargo.weight}_${cargo.length}_${cargo.width}_${cargo.height}`;
        
        if (cargoKey === cargoItemKey) {
            existingCargo = cargo;
            existingIndex = i;
            break;
        }
    }
    
    if (existingCargo) {
        // Обновляем существующий груз - увеличиваем количество
        window.cargoList[existingIndex].quantity += quantity;
        window.cargoList[existingIndex].timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        showNotification(`Добавлено ${quantity} шт. к существующему грузу. Всего: ${window.cargoList[existingIndex].quantity} шт.`);
    } else {
        // Создаем новый груз
        const volume = (window.currentDimensions.length * 
                        window.currentDimensions.width * 
                        window.currentDimensions.height) / 1000000;
        
        const cargo = {
            id: Date.now(),
            type: window.currentCargoType,
            typeName: getCargoTypeName(window.currentCargoType),
            weight: weight,
            length: window.currentDimensions.length,
            width: window.currentDimensions.width,
            height: window.currentDimensions.height,
            volume: volume,
            quantity: quantity,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            photo: document.getElementById('cargoPhoto')?.src || null,
            cargoKey: cargoKey // Сохраняем ключ для группировки
        };
        
        window.cargoList.push(cargo);
        showNotification(`Добавлен новый груз: ${quantity} шт.`);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cargoList', JSON.stringify(window.cargoList));
    
    // Обновляем статистику
    updateStats();
    
    // Сбрасываем фото
    resetPhoto();
    
    // Сбрасываем количество к 1
    if (window.currentQuantity !== undefined) {
        window.currentQuantity = 1;
        updateQuantityDisplay();
    }
};

// ПЕРЕЗАПИСЫВАЕМ СТАРУЮ ФУНКЦИЮ СОХРАНЕНИЯ
window.saveCargo = function() {
    window.saveCargoWithQuantity();
};

// ФУНКЦИЯ ОТОБРАЖЕНИЯ СПИСКА ГРУЗОВ С ГРУППИРОВКОЙ
window.showCargoListModal = function() {
    const modal = document.getElementById('cargoListModal');
    const content = document.getElementById('cargoListContent');
    
    if (!modal || !content) {
        console.error('Не найдены элементы модального окна');
        return;
    }
    
    // Очищаем содержимое
    content.innerHTML = '';
    
    if (!window.cargoList || window.cargoList.length === 0) {
        content.innerHTML = '<div class="empty-state">Нет сохраненных грузов</div>';
    } else {
        // Группируем грузы по ключу
        const groupedCargo = {};
        
        window.cargoList.forEach(cargo => {
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
    modal.style.display = 'block';
};

// ФУНКЦИЯ ИЗМЕНЕНИЯ КОЛИЧЕСТВА В ГРУППЕ
function changeGroupQuantity(firstItemId, delta) {
    // Находим первый элемент группы
    const firstItemIndex = window.cargoList.findIndex(item => item.id === firstItemId);
    
    if (firstItemIndex === -1) return;
    
    const firstItem = window.cargoList[firstItemIndex];
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}`;
    
    // Находим все элементы этой группы
    const groupItems = window.cargoList.filter(item => {
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
    window.cargoList[firstItemIndex].quantity = newQuantity;
    
    // Удаляем остальные элементы группы (они теперь не нужны)
    for (let i = window.cargoList.length - 1; i >= 0; i--) {
        if (i !== firstItemIndex) {
            const item = window.cargoList[i];
            const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}`;
            if (itemKey === cargoKey) {
                window.cargoList.splice(i, 1);
            }
        }
    }
    
    // Сохраняем изменения
    localStorage.setItem('cargoList', JSON.stringify(window.cargoList));
    updateStats();
    showCargoListModal(); // Обновляем отображение
    showNotification(`Количество изменено: ${newQuantity} шт.`);
}

// ФУНКЦИЯ УДАЛЕНИЯ ВСЕЙ ГРУППЫ
function removeCargoGroup(firstItemId) {
    // Находим первый элемент группы
    const firstItemIndex = window.cargoList.findIndex(item => item.id === firstItemId);
    
    if (firstItemIndex === -1) return;
    
    const firstItem = window.cargoList[firstItemIndex];
    const cargoKey = firstItem.cargoKey || `${firstItem.type}_${firstItem.weight}_${firstItem.length}_${firstItem.width}_${firstItem.height}`;
    
    // Удаляем все элементы группы
    window.cargoList = window.cargoList.filter(item => {
        const itemKey = item.cargoKey || `${item.type}_${item.weight}_${item.length}_${item.width}_${item.height}`;
        return itemKey !== cargoKey;
    });
    
    // Сохраняем изменения
    localStorage.setItem('cargoList', JSON.stringify(window.cargoList));
    updateStats();
    
    // Закрываем модальное окно если список пуст
    if (window.cargoList.length === 0) {
        closeCargoListModal();
    } else {
        showCargoListModal(); // Обновляем отображение
    }
    
    showNotification('Группа грузов удалена');
}

// ФУНКЦИЯ ЗАКРЫТИЯ МОДАЛЬНОГО ОКНА
function closeCargoListModal() {
    const modal = document.getElementById('cargoListModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ОБНОВЛЕНИЕ СТАТИСТИКИ
function updateStats() {
    const cargoCount = document.getElementById('cargoCount');
    const totalWeight = document.getElementById('totalWeight');
    const totalVolume = document.getElementById('totalVolume');
    
    if (!window.cargoList || window.cargoList.length === 0) {
        if (cargoCount) cargoCount.textContent = '0';
        if (totalWeight) totalWeight.textContent = '0 кг';
        if (totalVolume) totalVolume.textContent = '0 м³';
        return;
    }
    
    // Вычисляем общие показатели с учетом количества
    let totalItems = 0;
    let sumWeight = 0;
    let sumVolume = 0;
    
    window.cargoList.forEach(cargo => {
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
    
    if (!window.cargoList || window.cargoList.length === 0) {
        if (modalTotalWeight) modalTotalWeight.textContent = '0 кг';
        if (modalTotalVolume) modalTotalVolume.textContent = '0 м³';
        if (modalCargoCount) modalCargoCount.textContent = '0';
        return;
    }
    
    // Вычисляем с учетом количества
    let totalItems = 0;
    let sumWeight = 0;
    let sumVolume = 0;
    
    window.cargoList.forEach(cargo => {
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
    if (!window.cargoList || window.cargoList.length === 0) {
        showNotification('Нет грузов для отправки', true);
        return;
    }
    
    // Создаем данные для отправки
    const dataToSend = {
        employee: JSON.parse(localStorage.getItem('employeeAuth')) || {name: 'Неизвестный сотрудник'},
        cargoList: window.cargoList,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
            totalItems: window.cargoList.reduce((sum, cargo) => sum + (cargo.quantity || 1), 0),
            totalWeight: window.cargoList.reduce((sum, cargo) => sum + (cargo.weight * (cargo.quantity || 1)), 0),
            totalVolume: window.cargoList.reduce((sum, cargo) => sum + (cargo.volume * (cargo.quantity || 1)), 0)
        }
    };
    
    console.log('Отправка данных оператору:', dataToSend);
    
    // Здесь будет реальная отправка данных
    // Пока просто показываем уведомление
    showNotification('Данные отправлены оператору!');
    
    // Можно очистить список после отправки (раскомментировать если нужно)
    // window.cargoList = [];
    // localStorage.removeItem('cargoList');
    // updateStats();
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
    const modal = document.getElementById('cargoListModal');
    if (event.target === modal) {
        closeCargoListModal();
    }
};

// ДОБАВЛЯЕМ СТИЛИ ДЛЯ АНИМАЦИЙ И ГРУППИРОВКИ
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

// ЭКСПОРТ ФУНКЦИЙ ДЛЯ HTML
window.changeDimension = changeDimension;
window.changeQuantity = changeQuantity;
window.takePhoto = takePhoto;
window.saveCargo = window.saveCargo || window.saveCargoWithQuantity;
window.showCargoListModal = window.showCargoListModal || showCargoListModal;
window.closeCargoListModal = closeCargoListModal;
window.sendToOperator = sendToOperator;
window.logout = logout;
