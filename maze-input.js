/**
* maze-input.js (updated with rebind)
*/
class InputManager {
    constructor() {
        this.keys = {};
        this.keysId = Math.random(); // ID для отслеживания объекта
        this.lastMoveTime = 0;
        this.buttonListeners = new Map();  // Track listeners to avoid duplicates
        this.keydownHandler = null;
        this.keyupHandler = null;
        this.blurHandler = null;
        console.log('🆕 InputManager создан. ID:', this.keysId);
    }

    initialize() {
        console.log('📍 InputManager.initialize() called');
        // КРИТИЧНО: сохранить текущее состояние ДО удаления обработчиков
        const savedKeys = { ...this.keys };
        console.log('💾 Сохранено состояние:', savedKeys);
        
        // КРИТИЧНО: обнулить таймер и очистить старые обработчики
        this.lastMoveTime = 0;
        
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
            window.removeEventListener('keyup', this.keyupHandler);
            window.removeEventListener('blur', this.blurHandler);
            console.log('🧹 Старые обработчики удалены');
        }
        
        // НЕ ПЕРЕОПРЕДЕЛЯЕМ this.keys! Очищаем его содержимое
        Object.keys(this.keys).forEach(key => { this.keys[key] = false; });
        
        this.bindKeyboard();
        this.setupButtonControls();
        
        // ВОССТАНОВИТЬ состояние клавиш В СУЩЕСТВУЮЩИЙ объект
        // (а не переопределять этот объект)
        Object.keys(savedKeys).forEach(key => {
            if (savedKeys[key] === true) {
                this.keys[key] = true;
                console.log('🔄 Восстановлена клавиша:', key);
            }
        });
        console.log('✨ Состояние клавиш восстановлено:', this.keys);
    }

    /**
    * Сброс управления и фокус (вызывать при смене уровня)
    */
    rebindControls() {
        // Полностью удалить старые обработчики
        if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
        if (this.keyupHandler) window.removeEventListener('keyup', this.keyupHandler);
        if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
        
        // НЕ очищаем this.keys - оставляем текущее состояние!
        // Переподвязываем обработчики свежими
        this.buttonListeners = new Map();
        
        this.bindKeyboard();
        this.setupButtonControls();
        document.body.focus(); // Возврат фокуса в игру
        console.log('🔄 Controls rebound. Keys ID:', this.keysId);
    }

    bindKeyboard() {
        // Удаляем старые обработчики, если они есть
        if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
        if (this.keyupHandler) window.removeEventListener('keyup', this.keyupHandler);
        if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);

        // КРИТИЧНО: инициализировать this.keys если он пустой или не имеет всех стрелок
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
        arrowKeys.forEach(key => {
            if (!(key in this.keys)) {
                this.keys[key] = false;
            }
        });
        console.log('✅ Keys инициализированы:', Object.keys(this.keys).length, 'ключей');

        // Создаём обработчики как методы класса для сохранения ссылки
        this.keydownHandler = (e) => {
            // Игнорируем системные клавиши (Ctrl, Alt), чтобы не блокировать ввод
            if (e.ctrlKey || e.altKey || e.metaKey) {
                Object.keys(this.keys).forEach(key => { this.keys[key] = false; });
                return;
            }

            console.log('🔑 KEYDOWN:', e.key, '| Keys ID:', this.keysId, '| Before:', JSON.stringify(this.keys));
            this.keys[e.key] = true;
            console.log('🔑 AFTER SET:', e.key, '| Keys:', JSON.stringify(this.keys));
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault(); // Запрет прокрутки страницы
            }
        };

        this.keyupHandler = (e) => {
            this.keys[e.key] = false;
        };

        this.blurHandler = () => { 
            // НЕ очищаем клавиши при blur! Это блокирует движение при смене фокуса окна
            // Просто логируем для отладки
            console.log('⚠️ Window blur (не очищаем keys)');
        };

        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        window.addEventListener('blur', this.blurHandler);
        console.log('✅ Keyboard listeners bound. Keys ID:', this.keysId);
    }

    setupButtonControls() {
        const directions = [
            { id: 'btn-ArrowUp', key: 'ArrowUp' },
            { id: 'btn-ArrowDown', key: 'ArrowDown' },
            { id: 'btn-ArrowLeft', key: 'ArrowLeft' },
            { id: 'btn-ArrowRight', key: 'ArrowRight' }
        ];

        directions.forEach(({ id, key }) => {
            const el = document.getElementById(id)
            if (!el) return;

            // Удаляем старые слушатели
            ['touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(type => {
                const oldHandler = this.buttonListeners.get(`${id}_${type}`);
                if (oldHandler) {
                    el.removeEventListener(type, oldHandler);
                }
            });

            const setKey = (value, e) => {
                e?.preventDefault();
                this.keys[key] = value;
            };

            const touchstart = e => setKey(true, e);
            const touchend = e => setKey(false, e);
            const mousedown = e => setKey(true, e);
            const mouseup = e => setKey(false, e);

            // Добавляем новые, пассивные для производительности
            el.addEventListener('touchstart', touchstart, { passive: false });
            el.addEventListener('touchend', touchend, { passive: false });
            el.addEventListener('mousedown', mousedown);
            el.addEventListener('mouseup', mouseup);

            // Сохраняем ссылки для возможного удаления
            this.buttonListeners.set(`${id}_touchstart`, touchstart);
            this.buttonListeners.set(`${id}_touchend`, touchend);
            this.buttonListeners.set(`${id}_mousedown`, mousedown);
            this.buttonListeners.set(`${id}_mouseup`, mouseup);
        });
    }

    getMovementDirection() {
        // Поддержка стрелок и WASD
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) return { dx: 0, dy: -1 };
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) return { dx: 0, dy: 1 };
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) return { dx: -1, dy: 0 };
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) return { dx: 1, dy: 0 };
        
        return { dx: 0, dy: 0 };
    }
}