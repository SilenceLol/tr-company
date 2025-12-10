// cargo.js - Минимальный файл (основная логика в script.js)

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Cargo - New layout loaded');
    
    // Инициализация переменных (синхронизируем с глобальными)
    window.currentCargoType = 'euro-pallet';
    window.currentWeight = 1;
    window.currentQuantity = 1;
    window.currentDimensions = {
        length: 120,
        width: 80,
        height: 30
    };
    
    // Выбираем тип груза по умолчанию
    if (window.selectCargoType) {
        selectCargoType('euro-pallet');
    }
    
    // Обновляем отображения
    if (window.updateDimensionDisplays) {
        updateDimensionDisplays();
    }
    if (window.updateQuantityDisplay) {
        updateQuantityDisplay();
    }
    
    // Инициализация фотографии
    if (window.initPhotoInput) {
        initPhotoInput();
    }
});

// Если функции определены в script.js, не дублируем их
// Экспортируем только если они не были экспортированы из script.js
if (typeof window.selectCargoType === 'undefined') {
    window.selectCargoType = selectCargoType;
}
if (typeof window.changeDimension === 'undefined') {
    window.changeDimension = changeDimension;
}
if (typeof window.changeQuantity === 'undefined') {
    window.changeQuantity = changeQuantity;
}
if (typeof window.takePhoto === 'undefined') {
    window.takePhoto = takePhoto;
}