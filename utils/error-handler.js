/**
 * error-handler.js
 * Универсальная система обработки ошибок для игры
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.enableLogging = true;
    this.throwOnCritical = true;
  }

  /**
   * Логирование ошибки
   * @param {string} message - Сообщение об ошибке
   * @param {string} level - Уровень ошибки (info, warn, error, critical)
   * @param {any} context - Контекст ошибки
   */
  log(message, level = 'error', context = null) {
    const error = {
      timestamp: new Date(),
      message,
      level,
      context,
      stack: new Error().stack
    };

    this.errors.push(error);
    
    // Ограничиваем количество хранимых ошибок
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    if (this.enableLogging) {
      this._outputToConsole(error);
    }

    // Выбрасываем исключение для критических ошибок
    if (level === 'critical' && this.throwOnCritical) {
      throw new Error(`Critical error: ${message}`);
    }
  }

  /**
   * Вывод ошибки в консоль
   * @private
   */
  _outputToConsole(error) {
    switch (error.level) {
      case 'info':
        console.info(`[INFO] ${error.message}`, error.context);
        break;
      case 'warn':
        console.warn(`[WARN] ${error.message}`, error.context);
        break;
      case 'error':
        console.error(`[ERROR] ${error.message}`, error.context);
        break;
      case 'critical':
        console.error(`[CRITICAL] ${error.message}`, error.context);
        break;
      default:
        console.log(`[${error.level.toUpperCase()}] ${error.message}`, error.context);
    }
  }

  /**
   * Проверка валидности числового значения
   * @param {*} value - Значение для проверки
   * @param {number} min - Минимальное значение
   * @param {number} max - Максимальное значение
   * @param {string} paramName - Название параметра
   * @returns {boolean} - Валидно ли значение
   */
  validateNumber(value, min = -Infinity, max = Infinity, paramName = 'value') {
    if (typeof value !== 'number' || isNaN(value)) {
      this.log(`${paramName} must be a valid number, got ${typeof value}`, 'error', { value, min, max });
      return false;
    }

    if (value < min || value > max) {
      this.log(`${paramName} must be between ${min} and ${max}, got ${value}`, 'error', { value, min, max });
      return false;
    }

    return true;
  }

  /**
   * Проверка валидности объекта
   * @param {*} obj - Объект для проверки
   * @param {Array<string>} requiredProps - Обязательные свойства
   * @param {string} objName - Название объекта
   * @returns {boolean} - Валиден ли объект
   */
  validateObject(obj, requiredProps = [], objName = 'object') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      this.log(`${objName} must be a valid object, got ${typeof obj}`, 'error', { obj });
      return false;
    }

    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        this.log(`${objName} must have property '${prop}'`, 'error', { obj, missingProperty: prop });
        return false;
      }
    }

    return true;
  }

  /**
   * Проверка валидности строки
   * @param {*} str - Строка для проверки
   * @param {number} minLength - Минимальная длина
   * @param {number} maxLength - Максимальная длина
   * @param {string} paramName - Название параметра
   * @returns {boolean} - Валидна ли строка
   */
  validateString(str, minLength = 0, maxLength = Infinity, paramName = 'string') {
    if (typeof str !== 'string') {
      this.log(`${paramName} must be a string, got ${typeof str}`, 'error', { str });
      return false;
    }

    if (str.length < minLength || str.length > maxLength) {
      this.log(`${paramName} length must be between ${minLength} and ${maxLength}, got ${str.length}`, 'error', { 
        str, 
        length: str.length, 
        minLength, 
        maxLength 
      });
      return false;
    }

    return true;
  }

  /**
   * Проверка валидности координат
   * @param {Object} coords - Объект с координатами {x, y}
   * @param {number} minX - Минимальное значение X
   * @param {number} minY - Минимальное значение Y
   * @param {number} maxX - Максимальное значение X
   * @param {number} maxY - Максимальное значение Y
   * @returns {boolean} - Валидны ли координаты
   */
  validateCoordinates(coords, minX = 0, minY = 0, maxX = Infinity, maxY = Infinity) {
    if (!this.validateObject(coords, ['x', 'y'], 'coordinates')) {
      return false;
    }

    return this.validateNumber(coords.x, minX, maxX, 'coordinate.x') &&
           this.validateNumber(coords.y, minY, maxY, 'coordinate.y');
  }

  /**
   * Безопасное выполнение функции с обработкой ошибок
   * @param {Function} fn - Функция для выполнения
   * @param {string} context - Контекст выполнения
   * @returns {any} - Результат выполнения функции или null в случае ошибки
   */
  safeExecute(fn, context = 'function') {
    try {
      return fn();
    } catch (error) {
      this.log(`Error executing ${context}: ${error.message}`, 'error', { 
        error: error.message, 
        stack: error.stack 
      });
      return null;
    }
  }

  /**
   * Получение списка ошибок
   * @returns {Array} - Массив ошибок
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Очистка списка ошибок
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Проверка наличия ошибок
   * @returns {boolean} - Есть ли ошибки
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Получение последней ошибки
   * @returns {Object|null} - Последняя ошибка или null
   */
  getLastError() {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }
}

// Глобальный экземпляр обработчика ошибок
const errorHandler = new ErrorHandler();

// Экспортируем класс и экземпляр (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
  window.errorHandler = errorHandler;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, errorHandler };
}