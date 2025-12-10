// cargo.js - Логика для страницы замера грузов

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Cargo - New layout loaded');
    
    // Инициализация переменных
    window.currentCargoType = 'euro-pallet';
    window.currentWeight = 1;
    window.currentQuantity = 1;
    window.currentDimensions = {
        length: 120,
        width: 80,
        height: 30
    };
    
    window.cargoList = JSON.parse(localStorage.getItem('cargoList')) || [];
    
    // Выбираем тип груза по умолчанию
    selectCargoType('euro-pallet');
    
    // Инициализация интерфейса
    updateStats();
    updateEmployeeInfo();
    setupWeightInput();
    updateDimensionDisplays();
    updateQuantityDisplay();
    
    // Инициализация фотографии
    initPhotoInput();
});

// ВЫБОР ТИПА ГРУЗА
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
    
    window.currentCargoType = type;
    
    // Устанавливаем размеры по умолчанию для типа
    setDefaultDimensionsForType(type);
}

// УСТАНОВКА СТАНДАРТНЫХ РАЗМЕРОВ ДЛЯ ТИПА
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

// НАСТРОЙКА ПОЛЯ ВВОДА ВЕСА
function setupWeightInput() {
    const weightInput = document.getElementById('weightInput');
    if (weightInput) {
        weightInput.value = window.currentWeight;
        
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

// ИЗМЕНЕНИЕ РАЗМЕРОВ
function changeDimension(dimension, delta) {
    if (window.currentDimensions[dimension] !== undefined) {
        let newValue = window.currentDimensions[dimension] + delta;
        if (newValue >= 10) {
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

// ИЗМЕНЕНИЕ КОЛИЧЕСТВА
function changeQuantity(delta) {
    let newQuantity = window.currentQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
        window.currentQuantity = newQuantity;
        updateQuantityDisplay();
    }
}

function updateQuantityDisplay() {
    const element = document.getElementById('quantityValue');
    if (element) {
        element.textContent = window.currentQuantity;
    }
}

// ФОТОГРАФИЯ
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

function takePhoto() {
    document.getElementById('photoInput').click();
}

// ЭКСПОРТ ФУНКЦИЙ
window.selectCargoType = selectCargoType;
window.changeDimension = changeDimension;
window.changeQuantity = changeQuantity;
window.takePhoto = takePhoto;