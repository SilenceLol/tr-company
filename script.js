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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');
    initCargoTypeSelection();
    loadCargoList();
    updateAllDisplays();
});

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
    currentWeight = sizes.weight || 1;
    
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
            
            console.log('Фото загружено, размер:', currentPhoto.length, 'символов');
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
document.addEventListener('dblclick', function(e) {
    e.preventDefault();
}, { passive: false });
