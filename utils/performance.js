/**
 * performance.js
 * Утилиты для оптимизации производительности игры
 */

class PerformanceOptimizer {
  constructor() {
    this.frameRate = 60;
    this.targetFrameTime = 1000 / this.frameRate;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    
    // Кэши для оптимизации
    this.cachedCalculations = new Map();
    this.objectPools = new Map();
  }

  /**
   * Измерение производительности функции
   * @param {Function} fn - Функция для измерения
   * @param {string} name - Название функции для логирования
   * @returns {any} - Результат выполнения функции
   */
  measurePerformance(fn, name = 'anonymous') {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16.67) { // Больше чем 1 кадр при 60 FPS
      console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (${Math.ceil(duration/16.67)} frames)`);
    }
    
    return result;
  }

  /**
   * Оптимизированный requestAnimationFrame с ограничением частоты кадров
   * @param {Function} callback - Функция обратного вызова
   * @param {number} targetFps - Целевая частота кадров
   */
  optimizedRAF(callback, targetFps = 60) {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    
    if (delta >= (1000 / targetFps)) {
      this.lastFrameTime = now - (delta % (1000 / targetFps));
      callback(now);
    }
    
    requestAnimationFrame(() => this.optimizedRAF(callback, targetFps));
  }

  /**
   * Кэширование вычислений
   * @param {string} key - Ключ для кэша
   * @param {Function} calculation - Функция для вычисления
   * @param {number} ttl - Время жизни кэша в миллисекундах
   * @returns {any} - Результат вычисления
   */
  cachedCalculation(key, calculation, ttl = 1000) {
    const cached = this.cachedCalculations.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < ttl)) {
      return cached.value;
    }
    
    const result = calculation();
    this.cachedCalculations.set(key, {
      value: result,
      timestamp: now
    });
    
    return result;
  }

  /**
   * Получение объекта из пула
   * @param {string} poolName - Название пула
   * @param {Function} createFn - Функция создания объекта
   * @returns {any} - Объект из пула
   */
  getObjectFromPool(poolName, createFn) {
    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }
    
    const pool = this.objectPools.get(poolName);
    return pool.length > 0 ? pool.pop() : createFn();
  }

  /**
   * Возврат объекта в пул
   * @param {string} poolName - Название пула
   * @param {any} obj - Объект для возврата
   * @param {Function} resetFn - Функция сброса состояния объекта
   */
  returnObjectToPool(poolName, obj, resetFn) {
    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }
    
    if (resetFn) {
      resetFn(obj);
    }
    
    const pool = this.objectPools.get(poolName);
    if (pool.length < 100) { // Ограничение размера пула
      pool.push(obj);
    }
  }

  /**
   * Оптимизированная отрисовка только измененных областей
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {Function} drawFn - Функция отрисовки
   * @param {Object} bounds - Границы для отрисовки
   */
  partialRedraw(ctx, drawFn, bounds = null) {
    if (bounds) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.clip();
      drawFn(ctx);
      ctx.restore();
    } else {
      drawFn(ctx);
    }
  }

  /**
   * Дебаунс функции
   * @param {Function} func - Функция для дебаунса
   * @param {number} wait - Время ожидания в миллисекундах
   * @param {boolean} immediate - Выполнить сразу при первом вызове
   * @returns {Function} - Дебаунсированная функция
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Троттлинг функции
   * @param {Function} func - Функция для троттлинга
   * @param {number} limit - Лимит в миллисекундах
   * @returns {Function} - Троттлинговая функция
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Оптимизация обработки событий
   * @param {EventTarget} element - Элемент для прослушивания
   * @param {string} event - Тип события
   * @param {Function} handler - Обработчик события
   * @param {Object} options - Опции для addEventListener
   */
  optimizedEventHandler(element, event, handler, options = {}) {
    // Используем capture и passive для лучшей производительности
    const defaultOptions = {
      passive: true,
      capture: false,
      ...options
    };
    
    element.addEventListener(event, this.throttle(handler, 100), defaultOptions);
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    this.cachedCalculations.clear();
  }

  /**
   * Очистка пулов объектов
   */
  clearObjectPools() {
    this.objectPools.clear();
  }

  /**
   * Получение статистики производительности
   * @returns {Object} - Статистика производительности
   */
  getPerformanceStats() {
    return {
      fps: this.currentFps,
      cachedCalculationsSize: this.cachedCalculations.size,
      pooledObjects: Array.from(this.objectPools.entries()).reduce((acc, [name, pool]) => {
        acc[name] = pool.length;
        return acc;
      }, {})
    };
  }
}

// Глобальный экземпляр оптимизатора производительности
const performanceOptimizer = new PerformanceOptimizer();

// Экспортируем класс и экземпляр (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.PerformanceOptimizer = PerformanceOptimizer;
  window.performanceOptimizer = performanceOptimizer;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceOptimizer, performanceOptimizer };
}