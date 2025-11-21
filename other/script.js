// Основной объект приложения
const TransportApp = {
    // Инициализация приложения
    init: function() {
        this.setCurrentDate();
        this.getOrderFromURL();
        this.setupEventListeners();
        this.preloadImages();
        this.generatePlaces(1); // Начальное количество мест
    },

    // Предзагрузка изображений для лучшего UX
    preloadImages: function() {
        const imageUrls = [
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=120&fit=crop',
            'https://images.unsplash.com/photo-1586528116314-48c0fb893579?w=200&h=120&fit=crop',
            'https://images.unsplash.com/photo-1611251432627-298c42083b1d?w=200&h=120&fit=crop',
            'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=200&h=120&fit=crop'
        ];

        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    },

    // Установка текущей даты
    setCurrentDate: function() {
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ru-RU');
    },

    // Получение номера заявки из URL
    getOrderFromURL: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        if (orderId) {
            document.getElementById('orderNumber').textContent = orderId;
        }
    },

    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Обработчик изменения количества мест
        document.getElementById('placesCount').addEventListener('change', (e) => {
            this.generatePlaces(parseInt(e.target.value));
        });

        this.setupPhotoUploadListener();
        this.setupFormSubmitListener();
    },

    // Генерация мест
    generatePlaces: function(count) {
        const container = document.getElementById('placesContainer');
        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            this.createPlaceElement(i + 1);
        }

        this.setupPlaceEventListeners();
    },

    // Создание элемента места
    createPlaceElement: function(placeNumber) {
        const template = document.getElementById('placeTemplate');
        const clone = template.content.cloneNode(true);
        const placeElement = clone.querySelector('.place-item');

        placeElement.setAttribute('data-place-index', placeNumber);
        placeElement.querySelector('.place-number').textContent = placeNumber;

        // Показываем кнопку удаления только если мест больше 1
        if (placeNumber > 1) {
            placeElement.querySelector('.btn-remove-place').style.display = 'block';
        }

        document.getElementById('placesContainer').appendChild(placeElement);
    },

    // Настройка обработчиков событий для мест
    setupPlaceEventListeners: function() {
        // Обработчики для выбора типа груза в каждом месте
        document.querySelectorAll('.place-item').forEach(place => {
            const cargoTypes = place.querySelectorAll('.cargo-type');
            
            cargoTypes.forEach(type => {
                type.addEventListener('click', () => {
                    this.handleCargoTypeSelection(type, place);
                });
            });

            // Обработчик удаления места
            const removeBtn = place.querySelector('.btn-remove-place');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removePlace(place);
                });
            }
        });
    },

    // Удаление места
    removePlace: function(placeElement) {
        if (confirm('Удалить это место?')) {
            placeElement.remove();
            this.updatePlacesNumbers();
            this.updatePlacesCountInput();
        }
    },

    // Обновление номеров мест после удаления
    updatePlacesNumbers: function() {
        const places = document.querySelectorAll('.place-item');
        places.forEach((place, index) => {
            const placeNumber = index + 1;
            place.setAttribute('data-place-index', placeNumber);
            place.querySelector('.place-number').textContent = placeNumber;

            // Показываем/скрываем кнопку удаления
            const removeBtn = place.querySelector('.btn-remove-place');
            if (removeBtn) {
                removeBtn.style.display = placeNumber > 1 ? 'block' : 'none';
            }
        });
    },

    // Обновление поля ввода количества мест
    updatePlacesCountInput: function() {
        const currentPlaces = document.querySelectorAll('.place-item').length;
        document.getElementById('placesCount').value = currentPlaces;
    },

    // Обработка выбора типа груза для конкретного места
    handleCargoTypeSelection: function(selectedType, placeElement) {
        // Сброс предыдущего выбора в этом месте
        placeElement.querySelectorAll('.cargo-type').forEach(t => {
            t.classList.remove('selected');
        });
        
        // Установка нового выбора
        selectedType.classList.add('selected');
        
        const cargoType = selectedType.getAttribute('data-type');
        this.togglePlaceFormSections(cargoType, placeElement);
        
        // Установка константных значений для палетов
        if (cargoType === 'standard-pallet' || cargoType === 'american-pallet') {
            this.setPlaceConstantValues(cargoType, placeElement);
        }
    },

    // Переключение видимости секций формы для места
    togglePlaceFormSections: function(cargoType, placeElement) {
        const dimensionsSection = placeElement.querySelector('.place-dimensions-section');
        const weightSection = placeElement.querySelector('.place-weight-section');
        const constantsInfo = placeElement.querySelector('.place-constants-info');

        if (cargoType === 'standard-pallet' || cargoType === 'american-pallet') {
            dimensionsSection.classList.add('hidden');
            weightSection.classList.add('hidden');
            constantsInfo.classList.remove('hidden');
        } else {
            dimensionsSection.classList.remove('hidden');
            weightSection.classList.remove('hidden');
            constantsInfo.classList.add('hidden');
        }
    },

    // Установка константных значений для места
    setPlaceConstantValues: function(cargoType, placeElement) {
        const constantsInfo = placeElement.querySelector('.place-constants-info');
        
        const constants = {
            'standard-pallet': {
                title: 'Стандартный палет',
                dimensions: '120 × 80 × 15 см',
                weight: '25 кг',
                capacity: '1000 кг',
                image: 'https://images.unsplash.com/photo-1586528116314-48c0fb893579?w=200&h=120&fit=crop'
            },
            'american-pallet': {
                title: 'Американский палет',
                dimensions: '120 × 100 × 15 см',
                weight: '30 кг',
                capacity: '1200 кг',
                image: 'https://images.unsplash.com/photo-1611251432627-298c42083b1d?w=200&h=120&fit=crop'
            }
        };

        const constant = constants[cargoType];
        if (constant) {
            constantsInfo.innerHTML = `
                <h4>${constant.title}</h4>
                <p><strong>Размеры:</strong> ${constant.dimensions}</p>
                <p><strong>Вес:</strong> ${constant.weight}</p>
                <p><strong>Грузоподъемность:</strong> ${constant.capacity}</p>
            `;
        }
    },

    // Настройка загрузки фотографии
    setupPhotoUploadListener: function() {
        const photoUpload = document.getElementById('photoUpload');
        const photoInput = document.getElementById('photoInput');

        photoUpload.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (event) => {
            this.handlePhotoUpload(event);
        });
    },

    // Обработка загрузки фотографии
    handlePhotoUpload: function(event) {
        const file = event.target.files[0];
        const photoPreview = document.getElementById('photoPreview');
        const photoUpload = document.getElementById('photoUpload');

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoUpload.querySelector('p').textContent = 'Фотография загружена';
            }
            reader.readAsDataURL(file);
        }
    },

    // Настройка отправки формы
    setupFormSubmitListener: function() {
        const form = document.getElementById('cargoForm');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleFormSubmit();
        });
    },

    // Обработка отправки формы
    handleFormSubmit: function() {
        // Сбор данных всех мест
        const placesData = this.collectPlacesData();

        // Валидация данных
        if (!this.validatePlacesData(placesData)) {
            return;
        }

        // Сбор общих данных формы
        const formData = {
            orderNumber: document.getElementById('orderNumber').textContent,
            placesCount: placesData.length,
            places: placesData,
            photo: document.getElementById('photoInput').files[0] ? 
                   document.getElementById('photoInput').files[0].name : null
        };

        // Отправка данных
        this.submitFormData(formData);
    },

    // Сбор данных всех мест
    collectPlacesData: function() {
        const places = [];
        
        document.querySelectorAll('.place-item').forEach((placeElement, index) => {
            const selectedCargoType = placeElement.querySelector('.cargo-type.selected');
            
            if (selectedCargoType) {
                const placeData = {
                    placeNumber: index + 1,
                    cargoType: selectedCargoType.getAttribute('data-type'),
                    cargoTypeName: selectedCargoType.querySelector('h5').textContent
                };

                // Добавление размеров и веса
                this.addPlaceDimensionsAndWeight(placeData, placeElement);
                places.push(placeData);
            }
        });

        return places;
    },

    // Добавление размеров и веса для места
    addPlaceDimensionsAndWeight: function(placeData, placeElement) {
        const cargoType = placeData.cargoType;

        if (cargoType === 'standard' || cargoType === 'non-standard') {
            placeData.length = placeElement.querySelector('.place-length').value;
            placeData.width = placeElement.querySelector('.place-width').value;
            placeData.height = placeElement.querySelector('.place-height').value;
            placeData.weight = placeElement.querySelector('.place-weight').value;
        } else if (cargoType === 'standard-pallet') {
            placeData.length = 120;
            placeData.width = 80;
            placeData.height = 15;
            placeData.weight = 25;
        } else if (cargoType === 'american-pallet') {
            placeData.length = 120;
            placeData.width = 100;
            placeData.height = 15;
            placeData.weight = 30;
        }
    },

    // Валидация данных мест
    validatePlacesData: function(placesData) {
        if (placesData.length === 0) {
            alert('Пожалуйста, укажите хотя бы одно место');
            return false;
        }

        for (let i = 0; i < placesData.length; i++) {
            const place = placesData[i];
            
            if (!place.cargoType) {
                alert(`Пожалуйста, выберите тип груза для места ${i + 1}`);
                return false;
            }

            // Проверка заполнения полей для ручного ввода
            if (place.cargoType === 'standard' || place.cargoType === 'non-standard') {
                if (!place.length || !place.width || !place.height || !place.weight) {
                    alert(`Пожалуйста, заполните все поля с размерами и весом для места ${i + 1}`);
                    return false;
                }

                // Проверка корректности числовых значений
                if (place.length <= 0 || place.width <= 0 || place.height <= 0 || place.weight <= 0) {
                    alert(`Размеры и вес должны быть положительными числами для места ${i + 1}`);
                    return false;
                }
            }
        }

        // Проверка загрузки фотографии
        if (!document.getElementById('photoInput').files[0]) {
            alert('Пожалуйста, загрузите фотографию груза');
            return false;
        }

        return true;
    },

    // Отправка данных формы
    submitFormData: function(formData) {
        // Показать состояние загрузки
        const submitBtn = document.querySelector('.btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.classList.add('loading');

        // Имитация отправки на сервер
        setTimeout(() => {
            // В реальном приложении здесь будет отправка данных на сервер
            console.log('Данные для отправки в 1С:', formData);
            
            // Показать сообщение об успехе
            this.showSuccessMessage(formData);
            
            // Восстановить кнопку
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('loading');
        }, 1500);
    },

    // Показать сообщение об успешной отправке
    showSuccessMessage: function(formData) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <strong>Данные успешно отправлены оператору!</strong><br>
            Номер заявки: ${formData.orderNumber}<br>
            Количество мест: ${formData.placesCount}
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(successMessage, document.getElementById('cargoForm'));
        
        // Автоматически скрыть сообщение через 5 секунд
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    TransportApp.init();
});