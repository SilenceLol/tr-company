// script.js - исправленная версия для cargo.html
document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL - Замер грузов загружен');
    
    // Инициализация переменных
    window.currentCargoType = 'euro-pallet';
    window.cargoList = JSON.parse(localStorage.getItem('cargoList')) || [];
    window.currentWeight = 1;
    window.currentDimensions = {
        length: 120,
        width: 80,
        height: 30
    };
    
    // Инициализация интерфейса
    initCargoTypes();
    updateStats();
    updateEmployeeInfo();
    setupWeightInput();
    updateDimensionDisplays();
    
    // Инициализация фотографии
    initPhotoInput();
    
    // Устанавливаем активный тип груза по умолчанию
    setActiveCargoType('euro-pallet');
});

// Инициализация типов грузов
function initCargoTypes() {
    const cargoTypes = document.querySelectorAll('.cargo-type-column');
    cargoTypes.forEach(type => {
        type.addEventListener('click', function() {
            const typeValue = this.getAttribute('data-type');
            setActiveCargoType(typeValue);
        });
    });
}

// Установить активный тип груза
function setActiveCargoType(type) {
    // Убираем активный класс у всех
    document.querySelectorAll('.cargo-type-column').forEach(t => {
        t.classList.remove('active', 'selected');
    });
    
    // Добавляем активный класс текущему
    const activeType = document.querySelector(`[data-type="${type}"]`);
    if (activeType) {
        activeType.classList.add('active', 'selected');
    }
    
    window.currentCargoType = type;
    
    // Устанавливаем размеры по умолчанию в зависимости от типа
    setDefaultDimensionsForType(type);
}

// Установить размеры по умолчанию для типа груза
function setDefaultDimensionsForType(type) {
    switch(type) {
        case 'euro-pallet':
            window.currentDimensions = { length: 120, width: 80, height: 30 };
            break;
        case 'american-pallet':
            window.currentDimensions = { length: 120, width: 100, height: 30 };
            break;
        case 'box':
            window.currentDimensions = { length: 60, width: 40, height: 40 };
            break;
        case 'non-standard':
            window.currentDimensions = { length: 100, width: 100, height: 100 };
            break;
    }
    updateDimensionDisplays();
}

// Настройка поля ввода веса
function setupWeightInput() {
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.value = window.currentWeight;
        
        weightInput.addEventListener('input', function() {
            // Ограничиваем ввод только цифрами
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Обновляем текущий вес
            const weight = parseInt(this.value) || 1;
            if (weight >= 1 && weight <= 10000) {
                window.currentWeight = weight;
            }
        });
        
        weightInput.addEventListener('change', function() {
            let weight = parseInt(this.value) || 1;
            if (weight < 1) {
                weight = 1;
                this.value = weight;
            } else if (weight > 10000) {
                weight = 10000;
                this.value = weight;
            }
            window.currentWeight = weight;
        });
        
        weightInput.addEventListener('focus', function() {
            this.select();
        });
    }
}

// Функции для изменения размеров
function changeDimension(dimension, delta) {
    if (window.currentDimensions[dimension] !== undefined) {
        let newValue = window.currentDimensions[dimension] + delta;
        if (newValue >= 10) { // Минимальный размер 10 см
            window.currentDimensions[dimension] = newValue;
            updateDimensionDisplay(dimension);
        }
    }
}

function updateDimensionDisplay(dimension) {
    const element = document.getElementById(dimension + 'Value');
    if (element) {
        element.textContent = window.currentDimensions[dimension];
    }
}

function updateDimensionDisplays() {
    updateDimensionDisplay('length');
    updateDimensionDisplay('width');
    updateDimensionDisplay('height');
}

// Функция сохранения груза (работает с кнопкой Сохранить)
function saveCargo() {
    // Получаем вес из поля ввода
    const weightInput = document.getElementById('weightInput');
    let weight = window.currentWeight;
    
    if (weightInput) {
        weight = parseInt(weightInput.value) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10000) weight = 10000;
        window.currentWeight = weight;
    }
    
    // Вычисляем объем
    const volume = (window.currentDimensions.length * 
                    window.currentDimensions.width * 
                    window.currentDimensions.height) / 1000000; // в м³
    
    // Создаем объект груза
    const cargo = {
        id: Date.now(), // Уникальный ID на основе времени
        type: window.currentCargoType,
        typeName: getCargoTypeName(window.currentCargoType),
        weight: weight,
        length: window.currentDimensions.length,
        width: window.currentDimensions.width,
        height: window.currentDimensions.height,
        volume: volume,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        photo: document.getElementById('cargoPhoto').src || null
    };
    
    // Добавляем в список
    window.cargoList.push(cargo);
    
    // Сохраняем в localStorage
    localStorage.setItem('cargoList', JSON.stringify(window.cargoList));
    
    // Обновляем статистику
    updateStats();
    
    // Показываем уведомление
    showNotification('Груз сохранен!');
    
    // Сбрасываем фото
    resetPhoto();
    
    // Сбрасываем вес к минимальному значению
    if (weightInput) {
        weightInput.value = 1;
        window.currentWeight = 1;
    }
    
    // Сбрасываем размеры к значениям по умолчанию в зависимости от типа груза
    setDefaultDimensionsForType(window.currentCargoType);
}

// Функция обновления статистики
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
    
    // Вычисляем общий вес и объем
    const sumWeight = window.cargoList.reduce((sum, cargo) => sum + cargo.weight, 0);
    const sumVolume = window.cargoList.reduce((sum, cargo) => sum + cargo.volume, 0);
    
    if (cargoCount) cargoCount.textContent = window.cargoList.length;
    if (totalWeight) totalWeight.textContent = sumWeight + ' кг';
    if (totalVolume) totalVolume.textContent = sumVolume.toFixed(2) + ' м³';
}

// Функции для работы с фото
function initPhotoInput() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const photo = document.getElementById('cargoPhoto');
                    const placeholder = document.getElementById('photoPlaceholder');
                    
                    photo.src = event.target.result;
                    photo.style.display = 'block';
                    placeholder.style.display = 'none';
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
}

function takePhoto() {
    document.getElementById('photoInput').click();
}

function resetPhoto() {
    const photo = document.getElementById('cargoPhoto');
    const placeholder = document.getElementById('photoPlaceholder');
    
    photo.style.display = 'none';
    photo.src = '';
    placeholder.style.display = 'flex';
    
    // Сбрасываем input файла
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.value = '';
    }
}

// Функции для работы с модальным окном списка грузов
function showCargoListModal() {
    console.log('Показ модального окна со списком грузов');
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
        // Создаем список грузов
        window.cargoList.forEach((cargo, index) => {
            const cargoItem = document.createElement('div');
            cargoItem.className = 'cargo-list-item';
            
            cargoItem.innerHTML = `
                <div class="cargo-list-header">
                    <div class="cargo-type-badge">
                        <span class="cargo-emoji-small">${getCargoEmoji(cargo.type)}</span>
                        <span>${cargo.typeName}</span>
                    </div>
                    <span class="cargo-weight">${cargo.weight} кг</span>
                </div>
                <div class="cargo-details">
                    <div class="detail-item">
                        <span class="detail-label">Длина</span>
                        <span class="detail-value">${cargo.length} см</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ширина</span>
                        <span class="detail-value">${cargo.width} см</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Высота</span>
                        <span class="detail-value">${cargo.height} см</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Объем</span>
                        <span class="detail-value">${cargo.volume.toFixed(2)} м³</span>
                    </div>
                </div>
                <div class="cargo-time">${cargo.timestamp}</div>
                ${cargo.photo ? '<img src="' + cargo.photo + '" class="cargo-photo-preview" alt="Фото груза">' : ''}
                <button class="remove-cargo" onclick="deleteCargo(${cargo.id})">Удалить</button>
            `;
            
            content.appendChild(cargoItem);
        });
    }
    
    // Обновляем итоги в модальном окне
    updateModalTotals();
    
    // Показываем модальное окно
    modal.style.display = 'block';
}

function closeCargoListModal() {
    const modal = document.getElementById('cargoListModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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
    
    const totalWeight = window.cargoList.reduce((sum, cargo) => sum + cargo.weight, 0);
    const totalVolume = window.cargoList.reduce((sum, cargo) => sum + cargo.volume, 0);
    
    if (modalTotalWeight) modalTotalWeight.textContent = totalWeight + ' кг';
    if (modalTotalVolume) modalTotalVolume.textContent = totalVolume.toFixed(2) + ' м³';
    if (modalCargoCount) modalCargoCount.textContent = window.cargoList.length;
}

function deleteCargo(id) {
    window.cargoList = window.cargoList.filter(cargo => cargo.id !== id);
    localStorage.setItem('cargoList', JSON.stringify(window.cargoList));
    updateStats();
    showCargoListModal(); // Обновляем список
    showNotification('Груз удален');
}

// Функция отправки оператору
function sendToOperator() {
    if (!window.cargoList || window.cargoList.length === 0) {
        showNotification('Нет грузов для отправки');
        return;
    }
    
    // Создаем данные для отправки
    const dataToSend = {
        employee: JSON.parse(localStorage.getItem('employeeAuth')),
        cargoList: window.cargoList,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
            totalItems: window.cargoList.length,
            totalWeight: window.cargoList.reduce((sum, cargo) => sum + cargo.weight, 0),
            totalVolume: window.cargoList.reduce((sum, cargo) => sum + cargo.volume, 0)
        }
    };
    
    console.log('Отправка данных оператору:', dataToSend);
    
    // Здесь будет реальная отправка данных
    // Пока просто показываем уведомление
    showNotification('Данные отправлены оператору!');
    
    // Очищаем список после отправки (опционально)
    // window.cargoList = [];
    // localStorage.removeItem('cargoList');
    // updateStats();
}

// Вспомогательные функции
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

// Функция для показа уведомлений
function showNotification(message) {
    // Проверяем, есть ли уже уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 10px;
        background: #4CAF50;
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

// Добавляем стили для анимации уведомлений
const style = document.createElement('style');
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

// Функции для работы с авторизацией
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

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('cargoListModal');
    if (event.target === modal) {
        closeCargoListModal();
    }
};

// Обработчик для функции updateWeightFromInput (если она вызывается из HTML)
function updateWeightFromInput() {
    // Эта функция может быть вызвана из onchange атрибута
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        let weight = parseInt(weightInput.value) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10000) weight = 10000;
        weightInput.value = weight;
        window.currentWeight = weight;
    }
}
