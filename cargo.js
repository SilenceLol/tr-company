// cargo.js - Минимальный файл (основная логика в script.js)

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Cargo - New layout loaded');
    
    // Обновляем статистику текущего груза
    if (window.updateCurrentStats) {
        setTimeout(updateCurrentStats, 100);
    }
});
