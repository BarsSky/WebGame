/**
 * @class Game
 * @description Основной класс игры, управляющий всеми системами
 */
class Game {
  /**
   * Создает экземпляр игры
   */
  constructor() {
    /**
     * Состояние игры
     * @type {Object}
     * @property {Object} player - Информация об игроке
     * @property {number} player.x - X-координата игрока
     * @property {number} player.y - Y-координата игрока
     * @property {boolean} paused - Состояние паузы игры
     */
    this.state = {player: {x: 0, y: 0}, paused: false};

    /**
     * Модули игры
     * @type {Object}
     */
    this.modules = {};

    /**
     * Движок лабиринта
     * @type {MazeEngine|null}
     */
    this.engine = null;

    /**
     * Система рендеринга
     * @type {MazeRenderer|null}
     */
    this.renderer = null;

    /**
     * Система управления вводом
     * @type {InputManager|null}
     */
    this.inputManager = null;

    /**
     * Система аудио
     * @type {AudioManager|null}
     */
    this.audioManager = null;

    /**
     * Физический движок
     * @type {PhysicsEngine|null}
     */
    this.physicsEngine = null;

    /**
     * Менеджер историй
     * @type {StoryManager|null}
     */
    this.storyManager = null;

    /**
     * Менеджер спрайтов
     * @type {SpriteManager|null}
     */
    this.spriteManager = null;
    /**
     * Флаг, указывающий, что уровень только что завершен (для предотвращения повторного срабатывания)
     */
    this.levelJustCompleted = false;   
  }

  /**
   * Инициализация всех модулей игры
   * @async
   * @returns {Promise<void>} Promise, который разрешается после инициализации
   *     всех модулей
   */
  async initialize() {
    console.log('🎮 Инициализация игры...');

    // Создание экземпляров модулей
    this.engine = new MazeEngine();
    this.renderer = new MazeRenderer('maze');
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();
    this.physicsEngine = new PhysicsEngine();
    this.storyManager = new StoryManager();
    this.spriteManager = new SpriteManager();

    // Инициализация модулей
    await this._initializeModules();

    // Установка глобальных ссылок для обратной совместимости (временно)
    window.gameState = this.state;
    window.engine = this.engine;
    window.renderer = this.renderer;
    window.inputManager = this.inputManager;
    window.audioManager = this.audioManager;
    window.physicsEngine = this.physicsEngine;
    window.storyManager = this.storyManager;
    window.spriteManager = this.spriteManager;

    if (!this.storyManager?.checkNPCCollisions) {
      console.warn(
          '⚠️ StoryManager.checkNPCCollisions не найден — добавлен защитный вызов');
    }

    // Настройка начального уровня
    this.setupGame();

    console.log('✅ Игра инициализирована');
  }

  /**
   * Инициализация всех модулей
   * @private
   * @async
   * @returns {Promise<void>} Promise, который разрешается после инициализации
   *     модулей
   */
  async _initializeModules() {
    // Инициализация модулей в правильном порядке
    this.renderer.initialize();
    this.inputManager.initialize();
    this.audioManager.initialize();
    this.physicsEngine.initialize();
    this.storyManager.initialize();

    // SpriteManager должен быть инициализирован перед setupGame
    this.spriteManager.initialize();
  }

  /**
   * Настройка уровня
   */
 setupGame() {
    this.engine.initLevel();
    this.renderer.resizeCanvas(this.engine);

    if (this.engine.level === 22 && !localStorage.getItem('charSelectShown_22')) {
      setTimeout(() => {
        openCharacterSelect();
        localStorage.setItem('charSelectShown_22', 'true');
      }, 800);
    }

    this.state.player = { x: 0, y: 0 };

    if (this.engine.pathRecordingStarted && this.engine.visitedPath.length === 0) {
      this.engine.visitedPath = [{ x: 0, y: 0 }];
    }

    this.inputManager.initialize();
    
    if (this.storyManager) {
      this.storyManager.dialogActive = false;
    }

    document.body.focus();
    updateUI();
    clearWinMessage();
    createBottomPanels();

    this.state.paused = false;
    this.levelJustCompleted = false;        // ← СБРОС ЗАЩИТЫ

    if (this.storyManager) {
      const storyShown = this.storyManager.checkLevelStory(this.engine.level);
      if (storyShown) this.state.paused = true;
    }

    this.renderer.draw(this.engine, this.state.player);
  }

  /**
   * Основной игровой цикл
   * @param {number} timestamp - Временная метка для анимации
   */
  gameLoop(timestamp) {
    // Если игра на паузе, не обновляем логику
    if (this.state.paused) {
      requestAnimationFrame((ts) => this.gameLoop(ts));
      return;
    }

    // Обновление логики
    this.update();

    // Рендеринг
    this.render();

    // Следующий кадр
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  /**
   * Оптимизированный игровой цикл с ограничением FPS
   * @param {number} targetFps - Целевая частота кадров
   */
  startOptimized(targetFps = 60) {
    performanceOptimizer.optimizedRAF((timestamp) => {
      // Если игра на паузе, не обновляем логику
      if (this.state.paused) {
        return;
      }

      // Обновление логики
      this.update();

      // Рендеринг
      this.render();
    }, targetFps);
  }

  /**
   * Обновление логики игры
   */
 update(timestamp = performance.now()) {
    if (this.state.paused || this.levelJustCompleted) return;   // ← ЗАЩИТА

    if (typeof this.physicsEngine?.update === 'function') {
      this.physicsEngine.update(this.engine, this.state.player, this.inputManager, timestamp);
    }

    if (typeof this.engine?.entityManager?.updateEnemies === 'function') {
      this.engine.entityManager.updateEnemies(this.engine, this.state.player);
    }

    this.handleCollisions();

    this.audioManager?.update?.();
  }
  /**
   * Рендеринг кадра
   */
  render() {
    this.renderer.draw(this.engine, this.state.player);
  }

  /**
   * Обработка всех коллизий
   */
 handleCollisions() {
    if (!this.state?.player || !this.engine || this.levelJustCompleted) return;

    if (typeof this.engine.entityManager?.checkItemCollection === 'function') {
      this.engine.entityManager.checkItemCollection(
        this.state.player, this.engine, this.audioManager
      );
    }

    if (typeof this.storyManager?.checkNPCCollisions === 'function') {
      this.storyManager.checkNPCCollisions(this.state.player, this.engine);
    }

    if (this.isAtExit()) {
      this.handleLevelComplete();
    }
  }

  /**
   * Проверка достижения выхода
   * @returns {boolean} true, если игрок достиг выхода, иначе false
   */
  isAtExit() {
    const exitX = this.engine.cols - 1;
    const exitY = this.engine.rows - 1;
    const px = Math.floor(this.state.player.x);
    const py = Math.floor(this.state.player.y);
    return px === exitX && py === exitY;
  }

  /**
   * Обработка завершения уровня
   */
handleLevelComplete() {
    if (this.levelJustCompleted) return;   // ← ГЛАВНАЯ ЗАЩИТА

    this.levelJustCompleted = true;
    this.state.paused = true;

    this.engine.level++;
    this.engine.saveProgress();

    console.log(`🎉 Уровень завершён! Новый уровень: ${this.engine.level}`);

    showWinMessage();
    this.audioManager?.play?.('win');

    setTimeout(() => {
      clearWinMessage();
      this.levelJustCompleted = false;
      this.setupGame();           // перезапускаем уровень
    }, 2000);
  }

  gameLoop(timestamp) {
    this.update(timestamp);
    this.render();
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  /**
   * Запуск игрового цикла
   * @param {number} targetFps - Целевая частота кадров (по умолчанию 60)
   */
  start(targetFps = 60) {
    if (targetFps < 60) {
      // Используем оптимизированный цикл с ограничением FPS
      this.startOptimized(targetFps);
    } else {
      // Используем стандартный цикл
      requestAnimationFrame((ts) => this.gameLoop(ts));
    }
  }

  /**
   * Пауза игры
   */
  pause() {
    this.state.paused = true;
  }

  /**
   * Возобновление игры
   */
  resume() {
    this.state.paused = false;
  }

  /**
   * Перезапуск игры
   */
  restart() {
    this.engine.resetProgress();
    this.setupGame();
  }
}

// Глобальная переменная для совместимости (временно)
window.gameInstance = null;

/**
 * Запуск игры
 */
async function startGame() {
  console.log('🎮 Запуск Maze Maze Daze...');

  if (!window.gameInstance) {
    window.gameInstance = new Game();
    await window.gameInstance.initialize();
  }

  showMainMenu();  // ВСЕГДА показываем меню при перезагрузке
}

/**
 * Инициализация игры
 */
async function initGame() {
  if (window.gameInstance) {
    window.gameInstance.setupGame();
    window.gameInstance.start();
  }
}