// script.js - ОБЩАЯ ЛОГИКА

// ОБНОВЛЕНИЕ ИНФОРМАЦИИ О СОТРУДНИКЕ
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
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

// ФУНКЦИЯ ВЫХОДА
function logout() {
    localStorage.removeItem('employeeAuth');
    localStorage.removeItem('cargoList');
    window.location.href = 'index.html';
}

// ПОКАЗ УВЕДОМЛЕНИЙ
function showNotification(message, isError = false) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    if (isError) {
        notification.classList.add('error');
    }
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ПРИ КЛИКЕ ВНЕ ЕГО
window.onclick = function(event) {
    const modal = document.getElementById('cargoListModal');
    if (event.target === modal) {
        closeCargoListModal();
    }
};

// ЭКСПОРТ ФУНКЦИЙ
window.showNotification = showNotification;
window.updateEmployeeInfo = updateEmployeeInfo;
window.logout = logout;