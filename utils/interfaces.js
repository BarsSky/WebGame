/**
 * interfaces.js
 * Определение интерфейсов для модулей игры
 */

/**
 * Интерфейс для игрового движка
 * @interface EngineInterface
 */
class EngineInterface {
  /**
   * Инициализация уровня
   * @param {number} level - Номер уровня
   */
  initLevel(level) {
    throw new Error('Method initLevel must be implemented');
  }

  /**
   * Сохранение прогресса
   */
  saveProgress() {
    throw new Error('Method saveProgress must be implemented');
  }

  /**
   * Сброс прогресса
   */
  resetProgress() {
    throw new Error('Method resetProgress must be implemented');
  }

  /**
   * Получение информации об уровне
   */
  getLevelInfo() {
    throw new Error('Method getLevelInfo must be implemented');
  }
}

/**
 * Интерфейс для рендера
 * @interface RendererInterface
 */
class RendererInterface {
  /**
   * Инициализация рендера
   */
  initialize() {
    throw new Error('Method initialize must be implemented');
  }

  /**
   * Отрисовка кадра
   * @param {Object} engine - Движок игры
   * @param {Object} player - Информация об игроке
   */
  draw(engine, player) {
    throw new Error('Method draw must be implemented');
  }

  /**
   * Изменение размера холста
   * @param {Object} engine - Движок игры
   */
  resizeCanvas(engine) {
    throw new Error('Method resizeCanvas must be implemented');
  }

  /**
   * Добавление частиц
   * @param {number} x - Координата X
   * @param {number} y - Координата Y
   * @param {string} color - Цвет частиц
   */
  addParticles(x, y, color) {
    throw new Error('Method addParticles must be implemented');
  }
}

/**
 * Интерфейс для управления вводом
 * @interface InputManagerInterface
 */
class InputManagerInterface {
  /**
   * Инициализация управления
   */
  initialize() {
    throw new Error('Method initialize must be implemented');
  }

  /**
   * Получение состояния клавиш
   */
  getKeys() {
    throw new Error('Method getKeys must be implemented');
  }

  /**
   * Перепривязка управления
   */
  rebindControls() {
    throw new Error('Method rebindControls must be implemented');
  }
}

/**
 * Интерфейс для аудио системы
 * @interface AudioManagerInterface
 */
class AudioManagerInterface {
  /**
   * Инициализация аудио
   */
  initialize() {
    throw new Error('Method initialize must be implemented');
  }

  /**
   * Воспроизведение звука
   * @param {string} soundName - Название звука
   */
  play(soundName) {
    throw new Error('Method play must be implemented');
  }

  /**
   * Обновление аудио системы
   */
  update() {
    throw new Error('Method update must be implemented');
  }
}

/**
 * Интерфейс для физического движка
 * @interface PhysicsEngineInterface
 */
class PhysicsEngineInterface {
  /**
   * Инициализация физики
   */
  initialize() {
    throw new Error('Method initialize must be implemented');
  }

  /**
   * Обновление движения игрока
   * @param {Object} player - Информация об игроке
   * @param {Object} engine - Движок игры
   * @param {InputManagerInterface} inputManager - Менеджер ввода
   * @param {number} timestamp - Временная метка
   */
  updateMovement(player, engine, inputManager, timestamp) {
    throw new Error('Method updateMovement must be implemented');
  }

  /**
   * Проверка коллизий
   * @param {Object} player - Информация об игроке
   * @param {Object} engine - Движок игры
   * @param {AudioManagerInterface} audioManager - Аудио менеджер
   * @param {Object} storyManager - Менеджер историй
   */
  checkCollisions(player, engine, audioManager, storyManager) {
    throw new Error('Method checkCollisions must be implemented');
  }

  /**
   * Проверка условия победы
   * @param {Object} player - Информация об игроке
   * @param {Object} engine - Движок игры
   */
  checkWinCondition(player, engine) {
    throw new Error('Method checkWinCondition must be implemented');
  }
}

/**
 * Интерфейс для менеджера сущностей
 * @interface EntityManagerInterface
 */
class EntityManagerInterface {
  /**
   * Создание всех сущностей для уровня
   * @param {Object} engine - Движок игры
   * @param {Object} mapEngine - Движок карты
   */
  spawnAll(engine, mapEngine) {
    throw new Error('Method spawnAll must be implemented');
  }

  /**
   * Отрисовка всех сущностей
   * @param {CanvasRenderingContext2D} ctx - Контекст рисования
   * @param {Object} engine - Движок игры
   * @param {number} isoFactor - Изометрический фактор
   */
  drawAll(ctx, engine, isoFactor) {
    throw new Error('Method drawAll must be implemented');
  }

  /**
   * Обновление врагов
   * @param {Object} engine - Движок игры
   * @param {Object} player - Информация об игроке
   */
  updateEnemies(engine, player) {
    throw new Error('Method updateEnemies must be implemented');
  }

  /**
   * Проверка сбора предметов
   * @param {Object} player - Информация об игроке
   * @param {Object} engine - Движок игры
   * @param {AudioManagerInterface} audioManager - Аудио менеджер
   */
  checkItemCollection(player, engine, audioManager) {
    const collected = window.physicsEngine.checkCollisions(player, engine, audioManager, window.storyManager);
    if (collected.length > 0) window.renderer.addParticles(player.x * engine.cellSize, player.y * engine.cellSize, '#fbbf24');

    if (window.physicsEngine.checkWinCondition(player, engine)) {
      handleWin();
      requestAnimationFrame(gameLoop);
      return;
    }
    // throw new Error('Method checkItemCollection must be implemented');
  }
}

// Экспортируем интерфейсы (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.EngineInterface = EngineInterface;
  window.RendererInterface = RendererInterface;
  window.InputManagerInterface = InputManagerInterface;
  window.AudioManagerInterface = AudioManagerInterface;
  window.PhysicsEngineInterface = PhysicsEngineInterface;
  window.EntityManagerInterface = EntityManagerInterface;
}

// Экспортируем интерфейсы (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.EngineInterface = EngineInterface;
  window.RendererInterface = RendererInterface;
  window.InputManagerInterface = InputManagerInterface;
  window.AudioManagerInterface = AudioManagerInterface;
  window.PhysicsEngineInterface = PhysicsEngineInterface;
  window.EntityManagerInterface = EntityManagerInterface;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EngineInterface,
    RendererInterface,
    InputManagerInterface,
    AudioManagerInterface,
    PhysicsEngineInterface,
    EntityManagerInterface
  };
}