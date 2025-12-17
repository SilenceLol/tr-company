// cargo.js - Минимальный файл с поддержкой упаковки

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Cargo - New layout with packaging loaded');
    
    // Обновляем статистику текущего груза
    if (window.updateCurrentStats) {
        setTimeout(updateCurrentStats, 100);
    }
    
    // Обновляем отображение упаковки
    if (window.updatePackagingDisplay) {
        setTimeout(updatePackagingDisplay, 100);
    }
});
