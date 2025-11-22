// Основной объект приложения
const TransportApp = {
    currentPlace: null,
    places: [],
    
    // Инициализация приложения
    init: function() {
        this.setCurrentDate();
        this.getOrderFromURL();
        this.setupEventListeners();
        this.preloadImages();
        this.updateSubmitButton();
    },

    // Предзагрузка изображений
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
        // Кнопки навигации
        document.getElementById('addPlaceBtn').addEventListener('click', () => this.showTypeSelection());
        document.getElementById('backFromTypeBtn').addEventListener('click', () => this.showMainScreen());
        document.getElementById('backFromParamsBtn').addEventListener('click', () => this.showTypeSelection());
        
        // Выбор типа груза
        document.querySelectorAll('.cargo-type').forEach(type => {
            type.addEventListener('click', (e) => this.handleCargoTypeSelection(e.currentTarget));
        });
        
        // Слайдеры размеров
        this.setupSliders();
        
        // Контроль веса
        this.setupWeightControls();
        
        // Сохранение места
        document.getElementById('savePlaceBtn').addEventListener('click', () => this.savePlace());
        
        // Загрузка фото
        this.setupPhotoUpload();
        
        // Отправка формы
        document.getElementById('submitBtn').addEventListener('click', () => this.submitForm());
    },

    // Настройка слайдеров
    setupSliders: function() {
        const sliders = ['lengthSlider', 'widthSlider', 'heightSlider'];
        
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId.replace('Slider', 'Value'));
            
            slider.addEventListener('input', () => {
                valueSpan.textContent = slider.value;
            });
        });
        
        // Кнопки управления слайдерами
        document.querySelectorAll('.slider-controls .btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = document.getElementById(e.target.dataset.target);
                const action = e.target.dataset.action;
                const step = 10;
                
                if (action === 'increase') {
                    target.value = Math.min(parseInt(target.max), parseInt(target.value) + step);
                } else {
                    target.value = Math.max(parseInt(target.min), parseInt(target.value) - step);
                }
                
                target.dispatchEvent(new Event('input'));
            });
        });
    },

    // Настройка контроля веса
    setupWeightControls: function() {
        const weightValue = document.getElementById('weightValue');
        
        // Основные кнопки +/-
        document.getElementById('increaseWeight').addEventListener('click', () => {
            weightValue.textContent = parseInt(weightValue.textContent) + 1;
        });
        
        document.getElementById('decreaseWeight').addEventListener('click', () => {
            const current = parseInt(weightValue.textContent);
            if (current > 1) {
                weightValue.textContent = current - 1;
            }
        });
        
        // Быстрые шаги
        document.querySelectorAll('.weight-steps .btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseInt(e.target.dataset.weight);
                const newValue = parseInt(weightValue.textContent) + change;
                if (newValue >= 1) {
                    weightValue.textContent = newValue;
                }
            });
        });
    },

    // Настройка загрузки фото
    setupPhotoUpload: function() {
        const photoUpload = document.getElementById('photoUpload');
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');

        photoUpload.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (event) => {
            this.handlePhotoUpload(event);
        });
    },

    // Обработка загрузки фото
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

    // Показать экран выбора типа
    showTypeSelection: function() {
        this.hideAllScreens();
        document.getElementById('typeSelectionScreen').classList.add('active');
    },

    // Показать главный экран
    showMainScreen: function() {
        this.hideAllScreens();
        document.getElementById('mainScreen').classList.add('active');
        this.updatePlacesList();
        this.updateSubmitButton();
    },

    // Показать экран параметров
    showParamsScreen: function() {
        this.hideAllScreens();
        document.getElementById('paramsScreen').classList.add('active');
    },

    // Скрыть все экраны
    hideAllScreens: function() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    },

    // Обработка выбора типа груза
    handleCargoTypeSelection: function(selectedType) {
        // Сброс предыдущего выбора
        document.querySelectorAll('.cargo-type').forEach(t => {
            t.classList.remove('selected');
        });
        
        // Установка нового выбора
        selectedType.classList.add('selected');
        
        const cargoType = selectedType.getAttribute('data-type');
        this.currentPlace = {
            type: cargoType,
            typeName: selectedType.querySelector('h3').textContent,
            image: selectedType.querySelector('img').src
        };
        
        this.showParamsScreen();
        this.setupParamsForType(cargoType);
    },

    // Настройка параметров для выбранного типа
    setupParamsForType: function(cargoType) {
        // Установка изображения и названия
        const previewImage = document.getElementById('cargoPreviewImage');
        const typeTitle = document.getElementById('cargoTypeTitle');
        
        previewImage.innerHTML = `<img src="${this.currentPlace.image}" alt="${this.currentPlace.typeName}">`;
        typeTitle.textContent = this.currentPlace.typeName;
        
        // Настройка видимости секций
        const dimensionsSection = document.getElementById('dimensionsSection');
        const constantsInfo = document.getElementById('constantsInfo');
        
        if (cargoType === 'standard-pallet' || cargoType === 'american-pallet') {
            dimensionsSection.classList.add('hidden');
            constantsInfo.classList.remove('hidden');
            this.setConstantValues(cargoType);
        } else {
            dimensionsSection.classList.remove('hidden');
            constantsInfo.classList.add('hidden');
        }
        
        // Установка значений по умолчанию
        this.setDefaultValues(cargoType);
    },

    // Установка константных значений
    setConstantValues: function(cargoType) {
        const constantsInfo = document.getElementById('constantsInfo');
        
        const constants = {
            'standard-pallet': {
                dimensions: '120 × 80 × 15 см',
                weight: '25 кг',
                capacity: '1000 кг'
            },
            'american-pallet': {
                dimensions: '120 × 100 × 15 см',
                weight: '30 кг',
                capacity: '1200 кг'
            }
        };

        const constant = constants[cargoType];
        if (constant) {
            constantsInfo.innerHTML = `
                <h4>Автоматически заполненные параметры</h4>
                <p><strong>Размеры:</strong> ${constant.dimensions}</p>
                <p><strong>Вес:</strong> ${constant.weight}</p>
                <p><strong>Грузоподъемность:</strong> ${constant.capacity}</p>
            `;
        }
    },

    // Установка значений по умолчанию
    setDefaultValues: function(cargoType) {
        const defaults = {
            'standard': { length: 100, width: 80, height: 60, weight: 25 },
            'non-standard': { length: 150, width: 100, height: 80, weight: 50 },
            'standard-pallet': { length: 120, width: 80, height: 15, weight: 25 },
            'american-pallet': { length: 120, width: 100, height: 15, weight: 30 }
        };
        
        const defaultValues = defaults[cargoType] || defaults.standard;
        
        // Установка значений слайдеров
        document.getElementById('lengthSlider').value = defaultValues.length;
        document.getElementById('widthSlider').value = defaultValues.width;
        document.getElementById('heightSlider').value = defaultValues.height;
        document.getElementById('weightValue').textContent = defaultValues.weight;
        
        // Обновление отображаемых значений
        document.getElementById('lengthValue').textContent = defaultValues.length;
        document.getElementById('widthValue').textContent = defaultValues.width;
        document.getElementById('heightValue').textContent = defaultValues.height;
    },

    // Сохранение места
    savePlace: function() {
        const placeData = {
            ...this.currentPlace,
            dimensions: {
                length: document.getElementById('lengthSlider').value,
                width: document.getElementById('widthSlider').value,
                height: document.getElementById('heightSlider').value
            },
            weight: document.getElementById('weightValue').textContent
        };
        
        this.places.push(placeData);
        this.showMainScreen();
    },

    // Обновление списка мест
    updatePlacesList: function() {
        const placesList = document.getElementById('placesList');
        
        if (this.places.length === 0) {
            placesList.innerHTML = `
                <div class="empty-state">
                    <p>Нажмите "+" чтобы добавить первое место</p>
                </div>
            `;
            return;
        }
        
        placesList.innerHTML = this.places.map((place, index) => `
            <div class="place-card">
                <div class="place-header">
                    <div class="place-title">Место ${index + 1}</div>
                    <button class="place-remove" onclick="TransportApp.removePlace(${index})">×</button>
                </div>
                <div class="place-details">
                    <div class="place-detail"><strong>Тип:</strong> ${place.typeName}</div>
                    <div class="place-detail"><strong>Вес:</strong> ${place.weight} кг</div>
                    <div class="place-detail"><strong>Размеры:</strong> ${place.dimensions.length}×${place.dimensions.width}×${place.dimensions.height} см</div>
                </div>
            </div>
        `).join('');
    },

    // Удаление места
    removePlace: function(index) {
        if (confirm('Удалить это место?')) {
            this.places.splice(index, 1);
            this.updatePlacesList();
            this.updateSubmitButton();
        }
    },

    // Обновление состояния кнопки отправки
    updateSubmitButton: function() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = this.places.length === 0;
    },

    // Отправка формы
    submitForm: function() {
        const formData = {
            orderNumber: document.getElementById('orderNumber').textContent,
            places: this.places,
            photo: document.getElementById('photoInput').files[0] ? 
                   document.getElementById('photoInput').files[0].name : null
        };
        
        // Показать состояние загрузки
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        // Имитация отправки на сервер
        setTimeout(() => {
            console.log('Данные для отправки в 1С:', formData);
            
            // Показать сообщение об успехе
            alert('Данные успешно отправлены оператору! Номер заявки: ' + formData.orderNumber);
            
            // Восстановить кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    TransportApp.init();
});