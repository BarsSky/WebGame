/**
 * maze-main.js
 * Главный файл управления игрой и основной игровой цикл
 */

// Глобальное состояние игры
let gameState = {player: {x: 0, y: 0}, paused: false};

// Сразу добавляем в window
window.gameState = gameState;

// Менеджеры компонентов
let engine;
let renderer;
let inputManager;
let audioManager;
let physicsEngine;
let storyManager;

/**
 * Инициализация игры
 */
function initGame() {
  engine = new MazeEngine();
  renderer = new MazeRenderer('maze');
  inputManager = new InputManager();
  audioManager = new AudioManager();
  physicsEngine = new PhysicsEngine();
  storyManager = new StoryManager();

  // Сделать глобально доступными для отладки
  window.engine = engine;
  window.renderer = renderer;
  window.inputManager = inputManager;
  window.audioManager = audioManager;
  window.physicsEngine = physicsEngine;
  window.storyManager = storyManager;
  window.gameState = gameState;

  renderer.initialize();
  inputManager.initialize();
  audioManager.initialize();
  physicsEngine.initialize();
  storyManager.initialize?.();

  setupGame();

  // Запуск игрового цикла
  requestAnimationFrame(gameLoop);
  spriteManager = new SpriteManager();
  spriteManager.initialize();
  window.spriteManager = spriteManager;  // Делаем доступным глобально
}

/**
 * Вызов меню выбора персонажа (можно вызвать из консоли или при достижении 22
 * уровня)
 */
function openCharacterSelect() {
  if (engine.level < 22) {
    console.log('Доступно только с 22 уровня!');
    return;
  }

  const choice = prompt('Выберите персонажа: knight, mage, rogue');
  if (choice) {
    spriteManager.setSprite(choice.toLowerCase());
  }
}
/**
 * Настройка нового уровня (ФИКС: rebind input + focus + ОЧИСТКА ВВОДА)
 */
function setupGame() {
  engine.initLevel();
  renderer.resizeCanvas(engine);

  // ФИКС: Очистка частиц при новом уровне
  if (renderer.particleSystem) {
    renderer.particleSystem = [];
  }

  gameState.player = {x: 0, y: 0};
  engine.visitedPath = [{x: 0, y: 0}];

  // КРИТИЧЕСКИЙ ФИКС: Переинициализировать input (это сбросит обработчики)
  inputManager.initialize();

  // КРИТИЧЕСКИЙ ФИКС: Сброс диалога
  storyManager.dialogActive = false;

  document.body.focus();
  updateUI();
  clearWinMessage();

  // Сброс паузы перед проверкой истории
  gameState.paused = false;

  const storyShown = storyManager.checkLevelStory(engine.level);
  if (storyShown) {
    gameState.paused = true;  // StoryManager сам снимет паузу при закрытии
  }

  console.log(
      '✅ setupGame завершена. Уровень:', engine.level,
      'Input ID:', inputManager.keysId, 'Input keys:', inputManager.keys);
  window.__setupGameTime = performance.now();
  renderer.draw(engine, gameState.player);
}

/**
 * Основной игровой цикл (ФИКС: check dialogActive)
 */
let lastGameLoopLog = 0;
function gameLoop(timestamp) {
  // Логируем КАЖДЫЙ раз в первые 5 секунд после setupGame для отладки
  if (timestamp - lastGameLoopLog > 500 ||
      (window.__setupGameTime && timestamp - window.__setupGameTime < 5000)) {
    console.log('🎮 gameLoop called:', {
      paused: gameState.paused,
      dialogActive: storyManager.dialogActive,
      dir: inputManager.getMovementDirection(),
      keys: inputManager.keys
    });
    lastGameLoopLog = timestamp;
  }

  if (!gameState.paused && !storyManager.dialogActive) {
    // Обновление движения
    const moveResult = physicsEngine.updateMovement(
        gameState.player, engine, inputManager, timestamp);

    if (moveResult.moved) {
      audioManager.play('step');
      renderer.addParticles(
          gameState.player.x * engine.cellSize,
          gameState.player.y * engine.cellSize, '#00d2ff');
    } else if (moveResult.blocked) {
      audioManager.play('lock');
    }

    // Проверка коллизий
    const collected = physicsEngine.checkCollisions(
        gameState.player, engine, audioManager, storyManager);
    if (collected.length > 0) {
      renderer.addParticles(
          gameState.player.x * engine.cellSize,
          gameState.player.y * engine.cellSize, '#fbbf24');
    }

    // Проверка победы
    if (physicsEngine.checkWinCondition(gameState.player, engine)) {
      handleWin();
      // КРИТИЧНО: requestAnimationFrame ДОЛЖЕН быть вызван ДО return!
      requestAnimationFrame(gameLoop);
      return;
    }

    // Отрисовка (particles отрисовываются внутри draw)
    renderer.draw(engine, gameState.player);
    updateUI();
  } else {
    // Отладка: почему игра на паузе?
    if (gameState.paused || storyManager.dialogActive) {
      // Продолжаем рисовать, но не обновляем логику
      renderer.draw(engine, gameState.player);
    }
  }

  requestAnimationFrame(gameLoop);
}

/**
 * Обработка победы (full, no truncation)
 */
function handleWin() {
  gameState.paused = true;
  showWinMessage();
  audioManager.play('win');

  engine.level++;
  engine.saveProgress();
  renderer.updateParticles(engine);

  setTimeout(() => {
    clearWinMessage();
    console.log(
        '🔴 handleWin setTimeout: inputManager ID ДО инициализации:',
        inputManager.keysId);

    // КРИТИЧЕСКИ ВАЖНО: сбросить таймеры ПЕРВЫМИ
    physicsEngine.lastMoveTime = 0;

    // ПОЛНАЯ ПЕРЕИНИЦИАЛИЗАЦИЯ ВСЕХ СИСТЕМ
    renderer.initialize();
    audioManager.initialize();
    physicsEngine.initialize();
    console.log(
        '🟠 После инициализации: inputManager ID:', inputManager.keysId);

    gameState.paused = false;
    setupGame();  // Restart level
    console.log('🟡 После setupGame: inputManager ID:', inputManager.keysId);
  }, 2000);  // 2s delay
}

/**
 * Update UI (opacity key/book)
 */
function updateUI() {
  const keyUI = document.getElementById('key-status');
  const bookUI = document.getElementById('book-status');
  const visionUI = document.getElementById('vision-val');
  const levelUI = document.getElementById('level-val');

  // Проверяем наличие сокровищ через новый формат
  const hasKey = engine.treasures.some(t => t.type === 'key' && t.collected);
  const hasBook = engine.treasures.some(t => t.type === 'book' && t.collected);

  if (keyUI) keyUI.style.opacity = hasKey ? '1' : '0.3';
  if (bookUI) bookUI.style.opacity = hasBook ? '1' : '0.2';
  if (visionUI)
    visionUI.textContent =
        engine.level < 5 ? 'Wide' : (engine.level < 10 ? 'Med' : 'Narrow');
  if (levelUI) levelUI.textContent = engine.level;
}

/**
 * Показать сообщение о победе
 */
function showWinMessage() {
  const winMsg = document.getElementById('win');
  if (winMsg) {
    winMsg.style.display = 'block';
  }
}

/**
 * Скрыть сообщение о победе
 */
function clearWinMessage() {
  const winMsg = document.getElementById('win');
  if (winMsg) {
    winMsg.style.display = 'none';
  }
}

/**
 * Смена уровня лабиринта
 */
function changeLevel(newLevel) {
  if (typeof newLevel !== 'number' || newLevel < 1) {
    console.warn('⚠️ Неверный номер уровня:', newLevel);
    return;
  }

  // Сохраняем прогресс текущего уровня перед сменой
  if (window.engine && typeof window.engine.saveProgress === 'function') {
    window.engine.saveProgress();
  }

  // Устанавливаем новый уровень
  if (window.engine) {
    window.engine.level = newLevel;

    // Обновляем прогресс в localStorage
    localStorage.setItem('skynas_maze_level', newLevel);

    console.log(`✅ Уровень изменен на: ${newLevel}`);

    // Перезагружаем игру с новым уровнем

    if (newLevel === 22 && oldLevel < 22) {
      // Задержка, чтобы уровень успел отрисоваться
      setTimeout(() => {
        openCharacterSelect();
      }, 500);
    }

    setupGame();
  } else {
    console.error('❌ Engine не инициализирован');
  }
}

/**
 * Интерактивная смена уровня через консоль
 */
function selectLevel() {
  const levelStr = prompt('Введите номер уровня (1-50):');
  if (levelStr !== null) {
    const level = parseInt(levelStr);
    if (!isNaN(level) && level >= 1 && level <= 50) {
      changeLevel(level);
    } else {
      console.warn('⚠️ Неверный номер уровня. Введите число от 1 до 50.');
    }
  }
}

/**
 * Сброс игры в начало
 */
function resetGame() {
  if (confirm('Вы уверены? Это обнулит ваш прогресс!')) {
    engine.resetProgress();
    setupGame();
  }
}

/**
 * Управление панелями справки
 */
function togglePanel(panel) {
  const el = document.getElementById(panel + '-panel');
  if (el.classList.contains('panel-visible')) {
    el.classList.remove('panel-visible');
  } else {
    const other = panel === 'help' ? 'table' : 'help';
    const otherEl = document.getElementById(other + '-panel');
    if (otherEl) otherEl.classList.remove('panel-visible');
    el.classList.add('panel-visible');
  }
}

/**
 * Скрыть панель
 */
function hidePanel(panel) {
  const el = document.getElementById(panel + '-panel');
  if (el) el.style.display = 'none';

  const centerContent = document.querySelector('.center-content');
  if (centerContent) {
    const helpHidden = !document.getElementById('help-panel')?.style.display;
    const tableHidden = !document.getElementById('table-panel')?.style.display;
    if (helpHidden && tableHidden) {
      centerContent.classList.add('center-expanded');
    } else {
      centerContent.classList.remove('center-expanded');
    }
  }

  renderer.resizeCanvas(engine);
  renderer.draw(engine, gameState.player);
}

/**
 * Обработка изменения размера окна
 */
window.addEventListener('resize', () => {
  renderer.resizeCanvas(engine);
  renderer.draw(engine, gameState.player);
});

/**
 * Запуск игры при загрузке страницы
 */
function startGame() {
  console.log('🎮 Инициализирую игру...');
  try {
    initGame();
    console.log('✅ Игра инициализирована успешно');
    console.log('✅ Все компоненты:', {
      engine: !!window.engine,
      renderer: !!window.renderer,
      inputManager: !!window.inputManager,
      physicsEngine: !!window.physicsEngine,
      audioManager: !!window.audioManager,
      storyManager: !!window.storyManager
    });
  } catch (e) {
    console.error('❌ Ошибка при инициализации:', e);
    console.error('Stack:', e.stack);
  }
}

// Проверяем, уже ли DOM загружен
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startGame);
} else {
  // DOM уже загружен, вызываем прямо
  console.log('⚠️ DOM уже загружен, инициализирую сразу');
  startGame();
}

function openCharacterSelect() {
    if (window.engine.level < 22) return;
    window.gameState.paused = true;

    const overlay = document.createElement('div');
    overlay.className = 'char-select-overlay'; // Стили из [7]

    // Динамическая генерация карточек из реестра
    const charCards = Object.values(MAZE_REGISTRY.players).map(char => `
        <div class="char-card" onclick="selectChar('${char.id}')">
            <div class="char-preview preview-down" style="background-image: url('${char.sprite}')"></div>
            <div class="char-name">${char.name}</div>
            <div class="char-stats">Скорость: ${char.stats.speed}x</div>
        </div>
    `).join('');

    overlay.innerHTML = `
        <div class="char-select-modal">
            <h2>ВЫБЕРИТЕ ГЕРОЯ</h2>
            <div class="char-options">${charCards}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Функция selectChar связывает выбор с SpriteManager [17]

    window.selectChar = (id) => {
        if (window.spriteManager) {
            window.spriteManager.setSprite(id);
        }
        overlay.remove();
        window.gameState.paused = false; // [16]
        if (window.inputManager) window.inputManager.rebindControls(); // [12]
        delete window.selectChar;
    };
}