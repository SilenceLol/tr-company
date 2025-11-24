// Основной объект приложения
const TransportApp = {
    currentPlace: null,
    places: [],
    stream: null,
    currentFacingMode: 'environment',
    
    // Инициализация приложения
    init: function() {
        this.setCurrentDate();
        this.getOrderFromURL();
        this.setupEventListeners();
        this.updatePlacesCount();
        this.updateSubmitButton();
        this.checkCameraSupport();
    },

    // Получение номера заявки из QR-кода (URL параметров)
    getOrderFromURL: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');
        
        if (orderId) {
            // Форматирование номера заявки в стиле NordW
            const formattedOrderId = this.formatOrderNumber(orderId);
            document.getElementById('orderNumber').textContent = formattedOrderId;
        } else {
            // Демо-номер для тестирования
            document.getElementById('orderNumber').textContent = 'NW-2024-001';
        }
    },

    // Форматирование номера заявки
    formatOrderNumber: function(orderId) {
        // Если номер уже в правильном формате, возвращаем как есть
        if (orderId.match(/^NW-\d{4}-\d{3,}$/)) {
            return orderId;
        }
        
        // Преобразование различных форматов в NW-ГГГГ-XXX
        const cleanId = orderId.replace(/[^a-zA-Z0-9-]/g, '');
        
        if (cleanId.match(/^\d+$/)) {
            // Если только цифры: NW-2024-XXX
            return `NW-2024-${cleanId.padStart(3, '0')}`;
        } else if (cleanId.match(/^[A-Z]-\d+/)) {
            // Если формат A-1234
            const parts = cleanId.split('-');
            return `NW-2024-${parts[1]}`;
        } else {
            // Любой другой формат
            return `NW-${new Date().getFullYear()}-${cleanId}`;
        }
    },

    // Установка текущей даты
    setCurrentDate: function() {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        document.getElementById('currentDate').textContent = formattedDate;
    },

    // Проверка поддержки камеры
    checkCameraSupport: function() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Камера не поддерживается в этом браузере');
            document.getElementById('takePhotoBtn').style.display = 'none';
            return false;
        }
        
        // Проверка конкретных возможностей
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Доступные видео устройства:', videoDevices);
                
                if (videoDevices.length === 0) {
                    console.warn('Камеры не найдены на устройстве');
                    document.getElementById('takePhotoBtn').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке устройств:', error);
            });
        
        return true;
    },

    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Кнопки навигации
        document.getElementById('addPlaceBtn').addEventListener('click', () => this.showTypeSelection());
        document.getElementById('backFromTypeBtn').addEventListener('click', () => this.showMainScreen());
        document.getElementById('backFromParamsBtn').addEventListener('click', () => this.showTypeSelection());
        document.getElementById('backFromCameraBtn').addEventListener('click', () => this.stopCamera());
        
        // Выбор типа груза
        document.querySelectorAll('.cargo-type-card').forEach(type => {
            type.addEventListener('click', (e) => this.handleCargoTypeSelection(e.currentTarget));
        });
        
        // Управление фотографиями
        document.getElementById('takePhotoBtn').addEventListener('click', () => this.startCamera());
        document.getElementById('chooseFileBtn').addEventListener('click', () => this.openFilePicker());
        document.getElementById('photoUpload').addEventListener('click', () => this.openFilePicker());
        document.getElementById('captureBtn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('switchCameraBtn').addEventListener('click', () => this.switchCamera());
        document.getElementById('retakePhotoBtn').addEventListener('click', () => this.retakePhoto());
        document.getElementById('usePhotoBtn').addEventListener('click', () => this.useCapturedPhoto());
        
        // Слайдеры размеров
        this.setupSliders();
        
        // Контроль веса
        this.setupWeightControls();
        
        // Сохранение места
        document.getElementById('savePlaceBtn').addEventListener('click', () => this.savePlace());
        
        // Загрузка фото через файл
        this.setupFileUpload();
        
        // Отправка формы
        document.getElementById('submitBtn').addEventListener('click', () => this.submitForm());
    },

    // Настройка слайдеров размеров
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
        document.querySelectorAll('.slider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const change = parseInt(e.target.dataset.change);
                const target = document.getElementById(targetId);
                
                const newValue = parseInt(target.value) + change;
                if (newValue >= parseInt(target.min) && newValue <= parseInt(target.max)) {
                    target.value = newValue;
                    target.dispatchEvent(new Event('input'));
                }
            });
        });
    },

    // Настройка контроля веса
    setupWeightControls: function() {
        const weightValue = document.getElementById('weightValue');
        
        // Основные кнопки +/-
        document.getElementById('increaseWeight').addEventListener('click', () => {
            const current = parseFloat(weightValue.textContent);
            weightValue.textContent = (current + 0.1).toFixed(1);
        });
        
        document.getElementById('decreaseWeight').addEventListener('click', () => {
            const current = parseFloat(weightValue.textContent);
            if (current > 0.1) {
                weightValue.textContent = (current - 0.1).toFixed(1);
            }
        });
        
        // Быстрые пресеты веса
        document.querySelectorAll('.weight-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const weight = parseFloat(e.target.dataset.weight);
                weightValue.textContent = weight.toFixed(1);
            });
        });
    },

    // Настройка загрузки файла
    setupFileUpload: function() {
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        const photoUpload = document.getElementById('photoUpload');

        photoInput.addEventListener('change', (event) => {
            this.handleFileUpload(event);
        });
    },

    // Обработка загрузки файла
    handleFileUpload: function(event) {
        const file = event.target.files[0];
        const photoPreview = document.getElementById('photoPreview');
        const photoUpload = document.getElementById('photoUpload');

        if (file) {
            // Проверка типа файла
            if (!file.type.match('image.*')) {
                this.showError('Пожалуйста, выберите файл изображения');
                return;
            }

            // Проверка размера файла (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('Размер файла не должен превышать 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoUpload.querySelector('h4').textContent = 'Фотография загружена';
                photoUpload.querySelector('p').textContent = 'Файл успешно загружен';
                this.showSuccess('Фотография успешно загружена');
                this.updateSubmitButton();
            };
            reader.onerror = () => {
                this.showError('Ошибка при загрузке файла');
            };
            reader.readAsDataURL(file);
        }
    },

    // Открыть выбор файла
    openFilePicker: function() {
        document.getElementById('photoInput').click();
    },

    // ЗАПУСК КАМЕРЫ - ИСПРАВЛЕННАЯ ВЕРСИЯ
    startCamera: function() {
        console.log('Запуск камеры...');
        this.showCameraScreen();
        
        // Сначала остановим предыдущий поток, если он есть
        if (this.stream) {
            this.stopCamera();
        }

        // Упрощенные constraints для лучшей совместимости
        const constraints = {
            video: {
                facingMode: this.currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        console.log('Constraints:', constraints);

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                console.log('Камера успешно запущена, получен поток');
                this.stream = stream;
                const video = document.getElementById('cameraVideo');
                
                // Устанавливаем srcObject ДО попытки воспроизведения
                video.srcObject = stream;
                
                // Ждем когда видео будет готово к воспроизведению
                video.onloadedmetadata = () => {
                    console.log('Метаданные видео загружены, запускаем воспроизведение...');
                    video.play()
                        .then(() => {
                            console.log('Видео успешно воспроизводится');
                        })
                        .catch(e => {
                            console.error('Ошибка воспроизведения видео:', e);
                            this.showCameraError(e);
                        });
                };
                
                // Обработка ошибок видео
                video.onerror = (e) => {
                    console.error('Ошибка видео элемента:', e);
                    this.showCameraError(e);
                };
                
                // Дополнительная проверка через секунду
                setTimeout(() => {
                    if (video.readyState === 0) {
                        console.warn('Видео все еще не загружено, пробуем принудительный play');
                        video.play().catch(e => console.error('Принудительный play failed:', e));
                    }
                }, 1000);
                
                // Показать кнопку переключения камеры, если доступно несколько камер
                this.checkMultipleCameras();
            })
            .catch(error => {
                console.error('Ошибка доступа к камере:', error);
                this.showCameraError(error);
            });
    },

    // Проверка наличия нескольких камер
    checkMultipleCameras: function() {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Найдено видео устройств:', videoDevices.length);
                if (videoDevices.length > 1) {
                    document.getElementById('switchCameraBtn').style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Ошибка при перечислении устройств:', error);
            });
    },

    // Остановка камеры
    stopCamera: function() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
        }
    },

    // Переключение камеры
    switchCamera: function() {
        this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        console.log('Переключение камеры на:', this.currentFacingMode);
        this.stopCamera();
        this.startCamera();
    },

    // Сделать фото
    capturePhoto: function() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const context = canvas.getContext('2d');
        
        // Установить размеры canvas как у видео
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Нарисовать текущий кадр видео на canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Показать превью фото
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        document.getElementById('capturedPhoto').src = dataUrl;
        document.getElementById('photoPreviewContainer').style.display = 'block';
        
        // Скрыть элементы управления камерой
        document.getElementById('captureBtn').style.display = 'none';
        document.getElementById('switchCameraBtn').style.display = 'none';
    },

    // Переснять фото
    retakePhoto: function() {
        document.getElementById('photoPreviewContainer').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'block';
        if (document.querySelectorAll('[kind="videoinput"]').length > 1) {
            document.getElementById('switchCameraBtn').style.display = 'block';
        }
    },

    // Использовать сделанное фото
    useCapturedPhoto: function() {
        const dataUrl = document.getElementById('capturedPhoto').src;
        
        // Обновить превью на главном экране
        const photoPreview = document.getElementById('photoPreview');
        const photoUpload = document.getElementById('photoUpload');
        
        photoPreview.src = dataUrl;
        photoPreview.style.display = 'block';
        photoUpload.querySelector('h4').textContent = 'Фотография загружена';
        photoUpload.querySelector('p').textContent = 'Фото сделано с камеры';
        
        this.showSuccess('Фотография успешно сохранена');
        this.updateSubmitButton();
        this.stopCamera();
        this.showMainScreen();
    },

    // Обработка выбора типа груза
    handleCargoTypeSelection: function(selectedType) {
        // Сброс предыдущего выбора
        document.querySelectorAll('.cargo-type-card').forEach(t => {
            t.classList.remove('selected');
        });
        
        // Установка нового выбора
        selectedType.classList.add('selected');
        
        const cargoType = selectedType.getAttribute('data-type');
        const typeName = selectedType.querySelector('h3').textContent;
        const typeDescription = selectedType.querySelector('p').textContent;
        const typeIcon = selectedType.querySelector('.cargo-icon').textContent;
        
        this.currentPlace = {
            type: cargoType,
            typeName: typeName,
            typeDescription: typeDescription,
            icon: typeIcon
        };
        
        this.showParamsScreen();
        this.setupParamsForType(cargoType);
    },

    // Настройка параметров для выбранного типа
    setupParamsForType: function(cargoType) {
        // Установка иконки и названия
        const typeIcon = document.getElementById('cargoTypeIcon');
        const typeTitle = document.getElementById('cargoTypeTitle');
        const typeDescription = document.getElementById('cargoTypeDescription');
        
        typeIcon.textContent = this.currentPlace.icon;
        typeTitle.textContent = this.currentPlace.typeName;
        typeDescription.textContent = this.currentPlace.typeDescription;
        
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
                title: 'Стандартный палет (Евро)',
                dimensions: '120 × 80 × 15 см',
                weight: '25.0 кг',
                capacity: '1000 кг',
                description: 'Стандартный европейский палет с фиксированными параметрами'
            },
            'american-pallet': {
                title: 'Американский палет',
                dimensions: '120 × 100 × 15 см',
                weight: '30.0 кг',
                capacity: '1200 кг',
                description: 'Американский стандарт палета с увеличенной грузоподъемностью'
            }
        };

        const constant = constants[cargoType];
        if (constant) {
            constantsInfo.innerHTML = `
                <h4>${constant.title}</h4>
                <p><strong>Размеры:</strong> ${constant.dimensions}</p>
                <p><strong>Вес:</strong> ${constant.weight}</p>
                <p><strong>Грузоподъемность:</strong> ${constant.capacity}</p>
                <p><strong>Описание:</strong> ${constant.description}</p>
            `;
        }
    },

    // Установка значений по умолчанию
    setDefaultValues: function(cargoType) {
        const defaults = {
            'standard': { 
                length: 100, 
                width: 80, 
                height: 60, 
                weight: 25.0,
                description: 'Стандартные коробки и упаковки'
            },
            'non-standard': { 
                length: 150, 
                width: 100, 
                height: 80, 
                weight: 50.0,
                description: 'Грузы нестандартной формы и размеров'
            },
            'standard-pallet': { 
                length: 120, 
                width: 80, 
                height: 15, 
                weight: 25.0,
                description: 'Евро палет'
            },
            'american-pallet': { 
                length: 120, 
                width: 100, 
                height: 15, 
                weight: 30.0,
                description: 'Американский палет'
            }
        };
        
        const defaultValues = defaults[cargoType] || defaults.standard;
        
        // Установка значений слайдеров
        document.getElementById('lengthSlider').value = defaultValues.length;
        document.getElementById('widthSlider').value = defaultValues.width;
        document.getElementById('heightSlider').value = defaultValues.height;
        document.getElementById('weightValue').textContent = defaultValues.weight.toFixed(1);
        
        // Обновление отображаемых значений
        document.getElementById('lengthValue').textContent = defaultValues.length;
        document.getElementById('widthValue').textContent = defaultValues.width;
        document.getElementById('heightValue').textContent = defaultValues.height;
        
        // Обновление описания
        document.getElementById('cargoTypeDescription').textContent = defaultValues.description;
    },

    // Сохранение места
    savePlace: function() {
        if (!this.currentPlace) {
            this.showError('Не выбран тип груза');
            return;
        }

        const placeData = {
            ...this.currentPlace,
            dimensions: {
                length: document.getElementById('lengthSlider').value,
                width: document.getElementById('widthSlider').value,
                height: document.getElementById('heightSlider').value
            },
            weight: document.getElementById('weightValue').textContent,
            timestamp: new Date().toISOString(),
            id: Date.now() // Уникальный ID для места
        };
        
        this.places.push(placeData);
        this.showSuccess(`Место "${placeData.typeName}" успешно добавлено`);
        this.showMainScreen();
    },

    // Обновление списка мест
    updatePlacesList: function() {
        const placesList = document.getElementById('placesList');
        
        if (this.places.length === 0) {
            placesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h4>Нет добавленных мест</h4>
                    <p>Добавьте места груза для оформления заявки</p>
                </div>
            `;
            return;
        }
        
        placesList.innerHTML = this.places.map((place, index) => `
            <div class="place-card" data-place-id="${place.id}">
                <div class="place-header">
                    <div class="place-title">Место ${index + 1} - ${place.typeName}</div>
                    <button class="place-remove" onclick="TransportApp.removePlace(${index})" title="Удалить место">×</button>
                </div>
                <div class="place-details">
                    <div class="place-detail"><strong>Тип:</strong> ${place.typeName}</div>
                    <div class="place-detail"><strong>Вес:</strong> ${place.weight} кг</div>
                    <div class="place-detail"><strong>Размеры:</strong> ${place.dimensions.length}×${place.dimensions.width}×${place.dimensions.height} см</div>
                    <div class="place-detail"><strong>Описание:</strong> ${place.typeDescription}</div>
                </div>
            </div>
        `).join('');
    },

    // Удаление места
    removePlace: function(index) {
        if (confirm('Удалить это место?')) {
            const removedPlace = this.places[index];
            this.places.splice(index, 1);
            this.updatePlacesList();
            this.updatePlacesCount();
            this.updateSubmitButton();
            this.showSuccess(`Место "${removedPlace.typeName}" удалено`);
        }
    },

    // Обновление счетчика мест
    updatePlacesCount: function() {
        const count = this.places.length;
        document.getElementById('placesCount').textContent = `${count} ${this.getPlacesWord(count)}`;
    },

    // Склонение слова "место"
    getPlacesWord: function(count) {
        if (count % 10 === 1 && count % 100 !== 11) return 'место';
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'места';
        return 'мест';
    },

    // Обновление состояния кнопки отправки
    updateSubmitButton: function() {
        const submitBtn = document.getElementById('submitBtn');
        const hasPlaces = this.places.length > 0;
        const hasPhoto = document.getElementById('photoPreview').style.display !== 'none';
        
        submitBtn.disabled = !hasPlaces || !hasPhoto;
        
        if (!hasPlaces) {
            submitBtn.title = 'Добавьте хотя бы одно место груза';
        } else if (!hasPhoto) {
            submitBtn.title = 'Загрузите фотографию груза';
        } else {
            submitBtn.title = 'Отправить данные оператору';
        }
    },

    // Отправка формы
    submitForm: function() {
        // Проверка наличия мест
        if (this.places.length === 0) {
            this.showError('Добавьте хотя бы одно место груза');
            return;
        }

        // Проверка наличия фото
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview.style.display === 'none') {
            this.showError('Загрузите фотографию груза');
            return;
        }

        // Сбор данных формы
        const formData = {
            orderNumber: document.getElementById('orderNumber').textContent,
            orderDate: document.getElementById('currentDate').textContent,
            places: this.places,
            photo: photoPreview.src,
            submittedAt: new Date().toISOString(),
            totalWeight: this.calculateTotalWeight(),
            totalVolume: this.calculateTotalVolume()
        };
        
        // Показать состояние загрузки
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Отправка данных...';
        submitBtn.disabled = true;
        
        // Имитация отправки на сервер
        setTimeout(() => {
            // В реальном приложении здесь будет отправка данных на сервер
            console.log('Данные для отправки в 1С:', formData);
            
            // Показать сообщение об успехе
            this.showSuccessMessage(formData);
            
            // Восстановить кнопку
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    },

    // Расчет общего веса
    calculateTotalWeight: function() {
        return this.places.reduce((total, place) => {
            return total + parseFloat(place.weight);
        }, 0).toFixed(1);
    },

    // Расчет общего объема
    calculateTotalVolume: function() {
        return this.places.reduce((total, place) => {
            const volume = (place.dimensions.length * place.dimensions.width * place.dimensions.height) / 1000000; // в м³
            return total + volume;
        }, 0).toFixed(3);
    },

    // Показать сообщение об успешной отправке
    showSuccessMessage: function(formData) {
        const message = `
            ✅ <strong>Данные успешно отправлены!</strong><br><br>
            <strong>Номер заявки:</strong> ${formData.orderNumber}<br>
            <strong>Количество мест:</strong> ${formData.places.length}<br>
            <strong>Общий вес:</strong> ${formData.totalWeight} кг<br>
            <strong>Общий объем:</strong> ${formData.totalVolume} м³<br><br>
            Данные переданы оператору для обработки.
        `;
        
        this.showModal('Отправка завершена', message, 'success');
        
        // Очистка формы после успешной отправки
        setTimeout(() => {
            this.resetForm();
        }, 3000);
    },

    // Сброс формы
    resetForm: function() {
        this.places = [];
        this.currentPlace = null;
        
        // Сброс фото
        const photoPreview = document.getElementById('photoPreview');
        const photoUpload = document.getElementById('photoUpload');
        photoPreview.style.display = 'none';
        photoPreview.src = '';
        photoUpload.querySelector('h4').textContent = 'Добавить фотографию';
        photoUpload.querySelector('p').textContent = 'Загрузите фото груза для документации';
        
        // Сброс счетчика
        this.updatePlacesList();
        this.updatePlacesCount();
        this.updateSubmitButton();
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
        this.updatePlacesCount();
        this.updateSubmitButton();
    },

    // Показать экран параметров
    showParamsScreen: function() {
        this.hideAllScreens();
        document.getElementById('paramsScreen').classList.add('active');
    },

    // Показать экран камеры
    showCameraScreen: function() {
        this.hideAllScreens();
        document.getElementById('cameraScreen').classList.add('active');
        // Запускаем камеру сразу после показа экрана
        setTimeout(() => this.startCamera(), 100);
    },

    // Скрыть все экраны
    hideAllScreens: function() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    },

    // Показать ошибку камеры - ИСПРАВЛЕННАЯ ВЕРСИЯ
    showCameraError: function(error) {
        let errorMessage = 'Не удалось получить доступ к камере. ';
        
        console.error('Camera error details:', error);
        
        switch(error.name) {
            case 'NotAllowedError':
                errorMessage += 'Разрешение на использование камеры было отклонено. Пожалуйста, разрешите доступ к камере в настройках браузера.';
                break;
            case 'NotFoundError':
                errorMessage += 'Камера не найдена на устройстве.';
                break;
            case 'NotSupportedError':
                errorMessage += 'Браузер не поддерживает доступ к камере. Попробуйте использовать современный браузер.';
                break;
            case 'NotReadableError':
                errorMessage += 'Камера уже используется другим приложением. Закройте другие приложения, использующие камеру.';
                break;
            case 'OverconstrainedError':
                errorMessage += 'Запрошенные параметры камеры не поддерживаются.';
                break;
            case 'TypeError':
                errorMessage += 'Ошибка инициализации камеры. Убедитесь, что используется HTTPS соединение.';
                break;
            default:
                errorMessage += `Техническая информация: ${error.message || 'неизвестная ошибка'}. Пожалуйста, используйте загрузку файла.`;
        }
        
        this.showError(errorMessage);
        // Не возвращаемся на главный экран сразу, даем пользователю прочитать ошибку
    },

    // Показать сообщение об ошибке
    showError: function(message) {
        this.showNotification(message, 'error');
    },

    // Показать сообщение об успехе
    showSuccess: function(message) {
        this.showNotification(message, 'success');
    },

    // Показать уведомление
    showNotification: function(message, type = 'info') {
        // Создание элемента уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 4 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    },

    // Показать модальное окно
    showModal: function(title, message, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="modal-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
                    <div class="modal-content">${message}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    TransportApp.init();
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Предотвращение закрытия страницы при несохраненных данных
window.addEventListener('beforeunload', function(e) {
    if (TransportApp.places.length > 0) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные данные. Вы уверены, что хотите покинуть страницу?';
    }
});
