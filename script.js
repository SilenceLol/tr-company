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
let currentCargoId = null;

// Стандартные размеры паллетов
const palletSizes = {
    'euro-pallet': { length: 120, width: 80 },
    'american-pallet': { length: 120, width: 120 },
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initCargoTypeSelection();
    loadCargoList();
    updateCargoCount();
    updateTotals();
    
    // Выбираем европаллет по умолчанию
    document.querySelector('.cargo-type-column[data-type="euro-pallet"]').classList.add('selected');
    setPalletDimensions('euro-pallet');
});

// Инициализация выбора типа груза
function initCargoTypeSelection() {
    const cargoTypes = document.querySelectorAll('.cargo-type-column');
    
    cargoTypes.forEach(type => {
        type.addEventListener('click', function() {
            cargoTypes.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            
            currentCargoType = this.getAttribute('data-type');
            
            // Устанавливаем стандартные размеры
            setPalletDimensions(currentCargoType);
            
            // Сбрасываем фото при смене типа груза
            resetPhoto();
            
            // Сбрасываем текущий ID (создаем новый груз)
            currentCargoId = null;
        });
    });
}

// Установка размеров для паллетов
function setPalletDimensions(palletType) {
    const sizes = palletSizes[palletType];
    currentDimensions.length = sizes.length;
    currentDimensions.width = sizes.width;
    currentDimensions.height = sizes.height || 30;
    
    // Обновляем отображение всех размеров
    updateAllDimensionsDisplay();
}

// Обновить отображение всех размеров
function updateAllDimensionsDisplay() {
    document.getElementById('lengthValue').textContent = currentDimensions.length;
    document.getElementById('widthValue').textContent = currentDimensions.width;
    document.getElementById('heightValue').textContent = currentDimensions.height;
}

// Изменение веса (шаг 1)
function changeWeight(change) {
    const newWeight = currentWeight + change;
    if (newWeight >= 1 && newWeight <= 10000) {
        currentWeight = newWeight;
        document.getElementById('weight').textContent = currentWeight;
    }
}

// Изменение размеров (шаг 10)
function changeDimension(dimension, change) {
    let newValue = currentDimensions[dimension] + change;
    
    // Разрешаем значения от 0 до 1000
    if (newValue >= 0 && newValue <= 1000) {
        currentDimensions[dimension] = newValue;
        
        // Обновляем отображение соответствующего размера
        if (dimension === 'length') {
            document.getElementById('lengthValue').textContent = newValue;
        } else if (dimension === 'width') {
            document.getElementById('widthValue').textContent = newValue;
        } else if (dimension === 'height') {
            document.getElementById('heightValue').textContent = newValue;
        }
    }
}

// Создать новое место
function createCargo() {
    // Сбрасываем текущие настройки для нового груза
    resetCurrentCargo();
    currentCargoId = null;
    alert('Готово к созданию нового места! Настройте параметры и нажмите "Сохранить"');
}

// Сохранить груз
function saveCargo() {
    // Проверяем, что хотя бы один размер не равен 0
    if (currentDimensions.length === 0 && currentDimensions.width === 0 && currentDimensions.height === 0) {
        alert('Укажите хотя бы один размер груза!');
        return;
    }
    
    const cargo = {
        id: currentCargoId || Date.now(),
        type: currentCargoType,
        weight: currentWeight,
        dimensions: {...currentDimensions},
        photo: currentPhoto,
        timestamp: new Date().toLocaleString('ru-RU')
    };
    
    if (currentCargoId) {
        // Обновляем существующий груз
        const index = cargoList.findIndex(c => c.id === currentCargoId);
        if (index !== -1) {
            cargoList[index] = cargo;
        }
    } else {
        // Добавляем новый груз
        cargoList.push(cargo);
    }
    
    saveCargoList();
    updateCargoCount();
    updateTotals();
    
    alert(currentCargoId ? 'Груз обновлен!' : 'Груз сохранен!');
    currentCargoId = null;
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

// Сброс текущих настроек
function resetCurrentCargo() {
    currentWeight = 1;
    document.getElementById('weight').textContent = currentWeight;
    resetPhoto();
    
    // Возвращаем стандартные размеры для текущего типа
    setPalletDimensions(currentCargoType);
}

// Удалить груз из списка
function removeCargo(cargoId) {
    cargoList = cargoList.filter(cargo => cargo.id !== cargoId);
    saveCargoList();
    updateCargoCount();
    updateTotals();
    renderCargoListModal();
    
    if (currentCargoId === cargoId) {
        currentCargoId = null;
    }
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
}

// Обновить счетчик грузов
function updateCargoCount() {
    document.getElementById('cargoCount').textContent = cargoList.length;
    document.getElementById('modalCargoCount').textContent = cargoList.length;
}

// Обновить итоговые показатели
function updateTotals() {
    const totalWeight = cargoList.reduce((sum, cargo) => sum + cargo.weight, 0);
    const totalVolume = cargoList.reduce((sum, cargo) => {
        const volume = (cargo.dimensions.length * cargo.dimensions.width * cargo.dimensions.height) / 1000000;
        return sum + volume;
    }, 0);
    
    document.getElementById('totalWeight').textContent = `${totalWeight} кг`;
    document.getElementById('totalVolume').textContent = `${totalVolume.toFixed(3)} м³`;
    
    // Обновляем в модальном окне
    document.getElementById('modalTotalWeight').textContent = `${totalWeight} кг`;
    document.getElementById('modalTotalVolume').textContent = `${totalVolume.toFixed(3)} м³`;
}

// Показать модальное окно списка грузов
function showCargoListModal() {
    if (cargoList.length === 0) {
        alert('Нет добавленных грузов!');
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
    
    if (cargoList.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет добавленных грузов</div>';
        return;
    }
    
    container.innerHTML = cargoList.map(cargo => `
        <div class="cargo-list-item">
            <div class="cargo-list-header">
                <div class="cargo-type-badge">
                    <span class="cargo-emoji-small">${cargoIcons[cargo.type]}</span>
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
                    <span class="detail-label">Объем:</span>
                    <span class="detail-value">${((cargo.dimensions.length * cargo.dimensions.width * cargo.dimensions.height) / 1000000).toFixed(3)} м³</span>
                </div>
            </div>
            ${cargo.photo ? `<img src="${cargo.photo}" class="cargo-photo-preview" alt="Фото груза">` : ''}
            <div class="cargo-actions">
                <button class="remove-cargo" onclick="removeCargo(${cargo.id})">
                    🗑️ Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Отправить оператору
function sendToOperator() {
    if (cargoList.length === 0) {
        alert('Добавьте хотя бы один груз перед отправкой!');
        return;
    }
    
    const totalWeight = cargoList.reduce((sum, cargo) => sum + cargo.weight, 0);
    const totalVolume = cargoList.reduce((sum, cargo) => {
        return sum + (cargo.dimensions.length * cargo.dimensions.width * cargo.dimensions.height) / 1000000;
    }, 0);
    
    const shipmentData = {
        cargos: cargoList,
        totalWeight: totalWeight,
        totalVolume: parseFloat(totalVolume.toFixed(3)),
        timestamp: new Date().toLocaleString('ru-RU'),
        totalItems: cargoList.length
    };
    
    // Здесь будет логика отправки данных оператору
    console.log('Данные для отправки оператору:', shipmentData);
    
    alert(`Данные отправлены оператору!\nВсего мест: ${cargoList.length}\nОбщая масса: ${totalWeight} кг\nОбщий объем: ${totalVolume.toFixed(3)} м³`);
    
    // Очищаем список после отправки
    cargoList = [];
    saveCargoList();
    updateCargoCount();
    updateTotals();
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
document.addEventListener('dblclick', function(e) {
    e.preventDefault();
}, { passive: false });
