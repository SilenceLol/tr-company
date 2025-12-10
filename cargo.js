// cargo.js - Минимальный файл (основная логика в script.js)

document.addEventListener('DOMContentLoaded', function() {
    console.log('NORD WHEEL Cargo - New layout loaded');
    
    // Выбираем тип груза по умолчанию
    if (window.selectCargoType) {
        selectCargoType('euro-pallet');
    }
    
    // Обновляем статистику текущего груза
    if (window.updateCurrentStats) {
        setTimeout(updateCurrentStats, 100);
    }
});

// Если функции определены в script.js, не дублируем их
// Экспортируем только если они не были экспортированы из script.js
if (typeof window.changeParam === 'undefined') {
    window.changeParam = changeParam;
}
if (typeof window.updateCurrentStats === 'undefined') {
    window.updateCurrentStats = updateCurrentStats;
}