// Текущий выбранный тип груза и параметры
let currentCargoType = 'euro-pallet';
let currentDimensions = {
    length: 120,
    width: 80,
    height: 30
};
let currentWeight = 1;
let currentPhoto = null;
let cargoList = [];

// Стандартные размеры паллетов
const palletSizes = {
    'euro-pallet': { length: 120, width: 80 },
    'standard-pallet': { length: 100, width: 120 },
    'box': { length: 50, width: 40, height: 30 },
    'non-standard': { length: 100, width: 50, height: 40 }
};

// SVG иконки для типов грузов
const cargoIcons = {
    'euro-pallet': `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" stroke-width="2"/>
            <path d="M3 9H21" stroke="currentColor" stroke-width="2"/>
            <path d="M3 15H21" stroke="currentColor" stroke-width="2"/>
            <path d="M8 6V18" stroke="currentColor" stroke-width="2"/>
            <path d="M16 6V18" stroke="currentColor" stroke-width="2"/>
        </svg>
    `,
    'standard-pallet': `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" stroke-width="2"/>
            <path d="M3 9H21" stroke="currentColor" stroke-width="2"/>
            <path d="M3 15H21" stroke="currentColor" stroke-width="2"/>
            <path d="M8 6V18" stroke="currentColor" stroke-width="2"/>
            <path d="M16 6V18" stroke="currentColor" stroke-width="2"/>
        </svg>
    `,
    'box': '📦',
    'non-standard': '📏'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initCargoTypeSelection();
    loadCargoList();
    
    // Выбираем европаллет по умолчанию
    document.querySelector('.cargo-type[data-type="euro-pallet"]').classList.add('selected');
    setPalletDimensions('euro-pallet');
});

// Инициализация выбора типа груза
function initCargoTypeSelection() {
    const cargoTypes = document.querySelectorAll('.cargo-type');
    
    cargoTypes.forEach(type => {
        type.addEventListener('click', function() {
            cargoTypes.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            
            currentCargoType = this.getAttribute('data-type');
            
            // Устанавливаем стандартные размеры для паллетов
            if (currentCargoType === 'euro-pallet' || currentCargoType === 'standard-pallet') {
                setPalletDimensions(currentCargoType);
            } else {
                setDefaultDimensions(currentCargoType);
            }
            
            // Сбрасываем фото при смене типа груза
            resetPhoto();
        });
    });
}

// Установка размеров для паллетов
function setPalletDimensions(palletType) {
    const sizes = palletSizes[palletType];
    currentDimensions.length = sizes.length;
    currentDimensions.width = sizes.width;
    currentDimensions.height = currentDimensions.height || 30;
    
    // Обновляем значения в модальном окне если оно открыто
    updateDimensionsModal();
}

// Установка размеров по умолчанию
function setDefaultDimensions(cargoType) {
    const sizes = palletSizes[cargoType];
    if (sizes) {
        currentDimensions = { ...sizes };
        updateDimensionsModal();
    }
}

// Обновить модальное окно размеров
function updateDimensionsModal() {
    if (document.getElementById('dimensionsModal').style.display === 'block') {
        document.getElementById('length').value = currentDimensions.length;
        document.getElementById('width').value = currentDimensions.width;
        document.getElementById('height').value = currentDimensions.height;
    }
}

// Изменение веса
function changeWeight(change) {
    const newWeight = currentWeight + change;
    if (newWeight >= 1 && newWeight <= 10000) {
        currentWeight = newWeight;
        document.getElementById('weight').value = currentWeight;
    }
}

// Изменение размеров
function changeDimension(dimension, change) {
    const input = document.getElementById(dimension);
    let newValue = parseInt(input.value) + change;
    
    if (newValue >= 1 && newValue <= 1000) {
        input.value = newValue;
        currentDimensions[dimension] = newValue;
    }
}

// Показать модальное окно размеров
function showDimensionsModal() {
    // Обновляем значения в модальном окне
    document.getElementById('length').value = currentDimensions.length;
    document.getElementById('width').value = currentDimensions.width;
    document.getElementById('height').value = currentDimensions.height;
    
    document.getElementById('dimensionsModal').style.display = 'block';
}

// Закрыть модальное окно размеров
function closeDimensionsModal() {
    document.getElementById('dimensionsModal').style.display = 'none';
}

// Применить размеры
function applyDimensions() {
    currentDimensions.length = parseInt(document.getElementById('length').value);
    currentDimensions.width = parseInt(document.getElementById('width').value);
    currentDimensions.height = parseInt(document.getElementById('height').value);
    closeDimensionsModal();
}

// Сделать фото
function takePhoto() {
    document.getElementById('photoInput').click();
}

// Обработка выбора фото
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPhoto = e.target.result;
            const photoElement = document.getElementById('cargoPhoto');
            const placeholder = document.getElementById('photoPlaceholder');
            
            photoElement.src = currentPhoto;
            photoElement.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Сброс фото
function resetPhoto() {
    currentPhoto = null;
    const photoElement = document.getElementById('cargoPhoto');
    const placeholder = document.getElementById('photoPlaceholder');
    photoElement.style.display = 'none';
    placeholder.style.display = 'flex';
    document.getElementById('photoInput').value = '';
}

// Добавить груз в список
function addCargo() {
    const cargo = {
        id: Date.now(),
        type: currentCargoType,
        weight: currentWeight,
        dimensions: {...currentDimensions},
        photo: currentPhoto,
        timestamp: new Date().toLocaleString('ru-RU')
    };
    
    cargoList.push(cargo);
    saveCargoList();
    renderCargoList();
    
    // Сбрасываем текущие настройки для нового груза
    resetCurrentCargo();
    
    alert('Груз добавлен!');
}

// Сброс текущих настроек
function resetCurrentCargo() {
    currentWeight = 1;
    document.getElementById('weight').value = currentWeight;
    resetPhoto();
    
    // Возвращаем стандартные размеры для текущего типа
    if (currentCargoType === 'euro-pallet' || currentCargoType === 'standard-pallet') {
        setPalletDimensions(currentCargoType);
    }
}

// Удалить груз из списка
function removeCargo(cargoId) {
    cargoList = cargoList.filter(cargo => cargo.id !== cargoId);
    saveCargoList();
    renderCargoList();
}

// Сохранить список грузов
function saveCargoList() {
    localStorage.setItem('cargoList', JSON.stringify(cargoList));
}

// Загрузить список грузов
function loadCargoList() {
    const saved = localStorage.getItem('cargoList');
    if (saved) {
        cargoList = JSON.parse(saved);
    }
    renderCargoList();
}

// Отобразить список грузов
function renderCargoList() {
    const container = document.getElementById('cargoList');
    
    if (cargoList.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет добавленных грузов</div>';
        return;
    }
    
    container.innerHTML = cargoList.map(cargo => `
        <div class="cargo-item">
            <button class="remove-cargo" onclick="removeCargo(${cargo.id})">×</button>
            <div class="cargo-item-header">
                <div class="cargo-type-badge">
                    ${typeof cargoIcons[cargo.type] === 'string' && cargoIcons[cargo.type].includes('svg') 
                        ? `<span class="cargo-icon-small">${cargoIcons[cargo.type]}</span>`
                        : `<span class="cargo-emoji-small">${cargoIcons[cargo.type]}</span>`
                    }
                    ${getCargoTypeName(cargo.type)}
                </div>
                <span class="cargo-weight">${cargo.weight} кг</span>
            </div>
            <div class="cargo-details">
                <div class="detail-item">
                    <span class="detail-label">Размеры:</span>
                    <span class="detail-value">${cargo.dimensions.length}×${cargo.dimensions.width}×${cargo.dimensions.height} см</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Фото:</span>
                    <span class="detail-value">${cargo.photo ? '✅' : '❌'}</span>
                </div>
            </div>
            ${cargo.photo ? `<img src="${cargo.photo}" class="cargo-photo-preview" alt="Фото груза">` : ''}
        </div>
    `).join('');
}

// Отправить оператору
function sendToOperator() {
    if (cargoList.length === 0) {
        alert('Добавьте хотя бы один груз перед отправкой!');
        return;
    }
    
    const shipmentData = {
        cargos: cargoList,
        totalWeight: cargoList.reduce((sum, cargo) => sum + cargo.weight, 0),
        timestamp: new Date().toLocaleString('ru-RU'),
        totalItems: cargoList.length
    };
    
    // Здесь будет логика отправки данных оператору
    console.log('Данные для отправки оператору:', shipmentData);
    
    alert(`Данные отправлены оператору! Всего грузов: ${cargoList.length}`);
    
    // Очищаем список после отправки
    cargoList = [];
    saveCargoList();
    renderCargoList();
}

// Получить название типа груза
function getCargoTypeName(type) {
    const names = {
        'euro-pallet': 'Европаллет',
        'standard-pallet': 'Обычный паллет',
        'box': 'Коробка',
        'non-standard': 'Нестандартный груз'
    };
    return names[type] || type;
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(e) {
    const modal = document.getElementById('dimensionsModal');
    if (e.target === modal) {
        closeDimensionsModal();
    }
});
