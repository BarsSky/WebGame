/**
 * maze-main.js
 * Главный файл управления игрой и основной игровой цикл
 */

// Глобальное состояние
let gameState = { player: { x: 0, y: 0 }, paused: false };
window.gameState = gameState;

let engine, renderer, inputManager, audioManager, physicsEngine, storyManager, spriteManager;

/**
 * Запуск игры
 */
function startGame() {
  console.log('🎮 Запуск Maze Maze Daze...');
  showMainMenu();   // ВСЕГДА показываем меню при перезагрузке
}

function initGame() {
  engine = new MazeEngine();
  renderer = new MazeRenderer('maze');
  inputManager = new InputManager();
  audioManager = new AudioManager();
  physicsEngine = new PhysicsEngine();
  storyManager = new StoryManager();

  window.engine = engine;
  window.renderer = renderer;
  window.inputManager = inputManager;
  window.audioManager = audioManager;
  window.physicsEngine = physicsEngine;
  window.storyManager = storyManager;
  window.gameState = gameState;

  // SpriteManager ПЕРЕД setupGame!
  spriteManager = new SpriteManager();
  spriteManager.initialize();
  window.spriteManager = spriteManager;

  renderer.initialize();
  inputManager.initialize();
  audioManager.initialize();
  physicsEngine.initialize();

  setupGame();
  requestAnimationFrame(gameLoop);
}

/**
 * Настройка уровня
 */
function setupGame() {
  engine.initLevel();
  renderer.resizeCanvas(engine);

  // Выбор персонажа только на 22 уровне
  if (engine.level === 22 && !localStorage.getItem('charSelectShown_22')) {
    setTimeout(() => {
      openCharacterSelect();
      localStorage.setItem('charSelectShown_22', 'true');
    }, 800);
  }

  gameState.player = { x: 0, y: 0 };
  // При первом запуске игры или сбросе, путь начинается с (0,0), но запись начинается только после получения книги
  // Если запись пути уже началась (после получения книги), инициализируем путь точкой старта
  if (engine.pathRecordingStarted && engine.visitedPath.length === 0) {
    engine.visitedPath = [{ x: 0, y: 0 }];
  }
  // Если запись пути еще не началась, оставляем путь пустым

  inputManager.initialize();
  
  // Добавим проверку на существование storyManager
  if (storyManager) {
    storyManager.dialogActive = false;
  } else {
    console.error("❌ storyManager не инициализирован!");
    return;
  }

  document.body.focus();
  updateUI();
  clearWinMessage();
  createBottomPanels();

  gameState.paused = false;

  // Проверим, инициализирован ли storyManager перед вызовом
  if (storyManager) {
    const storyShown = storyManager.checkLevelStory(engine.level);
    if (storyShown) gameState.paused = true;
  }

  renderer.draw(engine, gameState.player);
}

/**
 * Игровой цикл
 */
function gameLoop(timestamp) {
  if (document.getElementById('main-menu').style.display !== 'none') {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!gameState.paused && !storyManager.dialogActive) {
    const moveResult = physicsEngine.updateMovement(gameState.player, engine, inputManager, timestamp);

    if (moveResult.moved) {
      audioManager.play('step');
      renderer.addParticles(gameState.player.x * engine.cellSize, gameState.player.y * engine.cellSize, '#00d2ff');
    } else if (moveResult.blocked) {
      audioManager.play('lock');
    }

    const collected = physicsEngine.checkCollisions(gameState.player, engine, audioManager, storyManager);
    if (collected.length > 0) renderer.addParticles(gameState.player.x * engine.cellSize, gameState.player.y * engine.cellSize, '#fbbf24');

    if (physicsEngine.checkWinCondition(gameState.player, engine)) {
      handleWin();
      requestAnimationFrame(gameLoop);
      return;
    }

    renderer.draw(engine, gameState.player);
    updateUI();
  } else {
    renderer.draw(engine, gameState.player);
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
  if (typeof newLevel !== 'number' || newLevel < 1 || newLevel > 50) {
    console.warn('⚠️ Неверный номер уровня:', newLevel);
    return;
  }

  // Сохраняем прогресс текущего уровня
  if (window.engine && typeof window.engine.saveProgress === 'function') {
    window.engine.saveProgress();
  }

  const oldLevel = window.engine ? window.engine.level : 1;

  // Устанавливаем новый уровень
  if (window.engine) {
    window.engine.level = newLevel;
    localStorage.setItem('skynas_maze_level', newLevel);

    console.log(`✅ Уровень изменен на: ${newLevel} (был ${oldLevel})`);

    // Показываем выбор персонажа ТОЛЬКО при переходе на 22 уровень
    if (newLevel === 22 && oldLevel < 22) {
      console.log('🎉 Запускаем выбор персонажа на уровне 22');
      setTimeout(
          openCharacterSelect,
          800);  // небольшая задержка, чтобы уровень успел отрисоваться
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
    // Добавим сброс истории
    localStorage.removeItem('skynas_stories');
    if (storyManager) {
        storyManager.unlockedStories.clear();
        storyManager.loadProgress(); // Перезагрузим состояние после очистки
    }
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
  console.log('🎮 Запуск Maze Maze Daze...');


   // Сначала создаем все менеджеры [12]
    engine = new MazeEngine();
    renderer = new MazeRenderer('maze');
    inputManager = new InputManager();
    audioManager = new AudioManager();
    physicsEngine = new PhysicsEngine();
    storyManager = new StoryManager();

    // Делаем их глобальными [12]
    window.engine = engine;
    window.renderer = renderer;
    window.inputManager = inputManager;
    window.audioManager = audioManager;
    window.physicsEngine = physicsEngine;
    window.storyManager = storyManager;
    window.gameState = gameState;

  // ВСЕГДА показываем главное меню при перезагрузке страницы
  // Это самое надёжное решение для разработки
  showMainMenu();
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
  overlay.className = 'char-select-overlay';

  const charCards =
      Object.values(MAZE_REGISTRY.players)
          .map(char => {
            const previewUrl =
                char.preview || char.spriteSheets?.preview || char.sprite;

            // Автоматический расчёт под спрайт-лист (5 кадров × 64px)
            const frameSize = 256;             // размер одного кадра
            const totalWidth = frameSize * 5;  // 320px для 5 кадров

            return `
      <div class="char-card" onclick="selectChar('${char.id}')">
        <div class="char-preview" 
             style="background-image: url('${previewUrl}');
                    background-size: ${totalWidth}px ${frameSize}px;">
        </div>
        <div class="char-name">${char.name}</div>
        <div class="char-stats">Скорость: ${char.stats.speed}x</div>
      </div>
    `;
          })
          .join('');

  overlay.innerHTML = `
    <div class="char-select-modal">
      <h2>ВЫБЕРИТЕ ГЕРОЯ</h2>
      <div class="char-options">${charCards}</div>
      <button class="close-char-select" onclick="this.closest('.char-select-overlay').remove(); window.gameState.paused=false;">✕</button>
    </div>
  `;

  document.body.appendChild(overlay);

  window.selectChar = (id) => {
    if (window.spriteManager) window.spriteManager.setSprite(id);
    overlay.remove();
    window.gameState.paused = false;
    if (window.inputManager) window.inputManager.rebindControls();
    delete window.selectChar;
  };
}

function createBottomPanels() {
  let panels = document.getElementById('bottom-panels');
  if (!panels) {
    panels = document.createElement('div');
    panels.id = 'bottom-panels';
    panels.className = 'bottom-panels';
    document.body.appendChild(panels);
  }

  const char = MAZE_REGISTRY.players[window.spriteManager?.selectedId || 'cat'];
  panels.innerHTML = `
    <div class="panel">
      <strong>Герой:</strong> ${char.name}<br>
      Скорость: ${char.stats.speed}x
    </div>
    <div class="panel" id="quest-panel">
      <strong>Задание:</strong><br>
      <span id="current-quest">Найди ключ и выход из лабиринта</span>
    </div>
  `;
}
/**
 * maze-main.js
 */
function backToMenu() {
    gameState.paused = true;
    if (confirm("Вернуться в главное меню? Прогресс уровня будет потерян.")) {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        renderMenuButtons(); // Перерисовываем кнопки меню [21]
    } else {
        gameState.paused = false;
    }
}

function toggleDebugPanel() {
    const panel = document.getElementById('debug-panel');
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    // Блокируем ввод игрока, если открыта панель [12]
    gameState.paused = !isVisible;
    if (isVisible && window.inputManager) {
        window.inputManager.rebindControls();
    }
}