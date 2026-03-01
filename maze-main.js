/**
 * maze-main.js
 * Главный файл управления игрой и основной игровой цикл
 * Этот файл теперь содержит только точки входа для обратной совместимости
 */

// Импортируем Game класс из core модуля
// (в браузере этот скрипт будет загружен после всех зависимостей)

/**
 * Запуск игры
 */
function startGame() {
  console.log('🎮 Запуск Maze Maze Daze...');
  
  // Создаем экземпляр игры если он еще не создан
  if (!window.gameInstance) {
    window.gameInstance = new Game();
  }
  
  // Показываем главное меню
  showMainMenu();   // ВСЕГДА показываем меню при перезагрузке
}

function initGame() {
  // Используем глобальный экземпляр игры
  if (window.gameInstance) {
    window.gameInstance.setupGame();
    window.gameInstance.start();
  }
}

/**
 * Настройка уровня
 */
function setupGame() {
  // Если используется Game класс, делегируем ему
  if (window.gameInstance) {
    window.gameInstance.setupGame();
  } else {
    // Для обратной совместимости - используем оригинальную реализацию
    if (window.engine) {
      window.engine.initLevel();
      if (window.renderer) {
        window.renderer.resizeCanvas(window.engine);
      }

      // Выбор персонажа только на 22 уровне
      if (window.engine.level === 22 && !localStorage.getItem('charSelectShown_22')) {
        setTimeout(() => {
          openCharacterSelect();
          localStorage.setItem('charSelectShown_22', 'true');
        }, 800);
      }

      window.gameState.player = { x: 0, y: 0 };
      // При первом запуске игры или сбросе, путь начинается с (0,0), но запись начинается только после получения книги
      // Если запись пути уже началась (после получения книги), инициализируем путь точкой старта
      if (window.engine.pathRecordingStarted && window.engine.visitedPath.length === 0) {
        window.engine.visitedPath = [{ x: 0, y: 0 }];
      }
      // Если запись пути еще не началась, оставляем путь пустым

      if (window.inputManager) {
        window.inputManager.initialize();
      }
      
      // Добавим проверку на существование storyManager
      if (window.storyManager) {
        window.storyManager.dialogActive = false;
      } else {
        console.error("❌ storyManager не инициализирован!");
        return;
      }

      document.body.focus();
      updateUI();
      clearWinMessage();
      createBottomPanels();

      window.gameState.paused = false;

      // Проверим, инициализирован ли storyManager перед вызовом
      if (window.storyManager) {
        const storyShown = window.storyManager.checkLevelStory(window.engine.level);
        if (storyShown) window.gameState.paused = true;
      }

      if (window.renderer) {
        window.renderer.draw(window.engine, window.gameState.player);
      }
    }
  }
}

/**
 * Игровой цикл
 */
function gameLoop(timestamp) {
  if (window.gameInstance) {
    // Если используется Game класс, используем его игровой цикл
    // (gameLoop теперь инкапсулирован в Game классе)
    return;
  }
  
  // Для обратной совместимости - оригинальная реализация
  if (document.getElementById('main-menu').style.display !== 'none') {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!window.gameState.paused && (!window.storyManager || !window.storyManager.dialogActive)) {
    const moveResult = window.physicsEngine.updateMovement(window.gameState.player, window.engine, window.inputManager, timestamp);

    if (moveResult.moved) {
      window.audioManager.play('step');
      window.renderer.addParticles(window.gameState.player.x * window.engine.cellSize, window.gameState.player.y * window.engine.cellSize, '#00d2ff');
    } else if (moveResult.blocked) {
      window.audioManager.play('lock');
    }

    const collected = window.physicsEngine.checkCollisions(window.gameState.player, window.engine, window.audioManager, window.storyManager);
    if (collected.length > 0) window.renderer.addParticles(window.gameState.player.x * window.engine.cellSize, window.gameState.player.y * window.engine.cellSize, '#fbbf24');

    if (window.physicsEngine.checkWinCondition(window.gameState.player, window.engine)) {
      handleWin();
      requestAnimationFrame(gameLoop);
      return;
    }

    window.renderer.draw(window.engine, window.gameState.player);
    updateUI();
  } else {
    window.renderer.draw(window.engine, window.gameState.player);
  }

  requestAnimationFrame(gameLoop);
}

/**
 * Обработка победы (full, no truncation)
 */
function handleWin() {
  if (window.gameInstance) {
    window.gameInstance.handleLevelComplete();
    return;
  }
  
  // Для обратной совместимости - оригинальная реализация
  window.gameState.paused = true;
  showWinMessage();
  window.audioManager.play('win');

  window.engine.level++;
  window.engine.saveProgress();
  window.renderer.updateParticles(window.engine);

  setTimeout(() => {
    clearWinMessage();
    console.log(
        '🔴 handleWin setTimeout: inputManager ID ДО инициализации:',
        window.inputManager.keysId);

    // КРИТИЧЕСКИ ВАЖНО: сбросить таймеры ПЕРВЫМИ
    window.physicsEngine.lastMoveTime = 0;

    // ПОЛНАЯ ПЕРЕИНИЦИАЛИЗАЦИЯ ВСЕХ СИСТЕМ
    window.renderer.initialize();
    window.audioManager.initialize();
    window.physicsEngine.initialize();
    console.log(
        '🟠 После инициализации: inputManager ID:', window.inputManager.keysId);

    window.gameState.paused = false;
    setupGame();  // Restart level
    console.log('🟡 После setupGame: inputManager ID:', window.inputManager.keysId);
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
  const hasKey = window.engine && window.engine.treasures ? 
    window.engine.treasures.some(t => t.type === 'key' && t.collected) : false;
  const hasBook = window.engine && window.engine.treasures ? 
    window.engine.treasures.some(t => t.type === 'book' && t.collected) : false;

  if (keyUI) keyUI.style.opacity = hasKey ? '1' : '0.3';
  if (bookUI) bookUI.style.opacity = hasBook ? '1' : '0.2';
  if (visionUI)
    visionUI.textContent =
        window.engine && window.engine.level < 5 ? 'Wide' : (window.engine && window.engine.level < 10 ? 'Med' : 'Narrow');
  if (levelUI && window.engine) levelUI.textContent = window.engine.level;
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
    if (window.engine) {
      window.engine.resetProgress();
    }
    // Добавим сброс истории
    localStorage.removeItem('skynas_stories');
    // Добавим сброс диалога выбора персонажа
    localStorage.removeItem('charSelectShown_22');

    if (window.storyManager) {
        window.storyManager.unlockedStories.clear();
        window.storyManager.loadProgress(); // Перезагрузим состояние после очистки
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

  if (window.renderer && window.engine) {
    window.renderer.resizeCanvas(window.engine);
    window.renderer.draw(window.engine, window.gameState.player);
  }
}

/**
 * Обработка изменения размера окна
 */
window.addEventListener('resize', () => {
  if (window.renderer && window.engine) {
    window.renderer.resizeCanvas(window.engine);
    window.renderer.draw(window.engine, window.gameState.player);
  }
});

/**
 * Запуск игры при загрузке страницы
 */

function startGame() {
  console.log('🎮 Запуск Maze Maze Daze...');

  // Если Game класс еще не инициализирован, создаем его
  if (!window.gameInstance) {
    window.gameInstance = new Game();
    // Инициализируем асинхронно
    window.gameInstance.initialize().catch(err => {
      console.error('Ошибка инициализации игры:', err);
    });
  }

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
  if (window.engine && window.engine.level < 22) return;
  if (window.gameState) window.gameState.paused = true;

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
      <button class="close-char-select" onclick="this.closest('.char-select-overlay').remove(); if(window.gameState) window.gameState.paused=false;">✕</button>
    </div>
  `;

  document.body.appendChild(overlay);

  window.selectChar = (id) => {
    if (window.spriteManager) window.spriteManager.setSprite(id);
    overlay.remove();
    if (window.gameState) window.gameState.paused = false;
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
    if (window.gameState) window.gameState.paused = true;
    if (confirm("Вернуться в главное меню? Прогресс уровня будет потерян.")) {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        renderMenuButtons(); // Перерисовываем кнопки меню [21]
    } else {
        if (window.gameState) window.gameState.paused = false;
    }
}

function toggleDebugPanel() {
    const panel = document.getElementById('debug-panel');
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    // Блокируем ввод игрока, если открыта панель [12]
    if (window.gameState) {
      window.gameState.paused = !isVisible;
    }
    if (isVisible && window.inputManager) {
        window.inputManager.rebindControls();
    }
}

// ====================== DEBUG ФУНКЦИИ ======================
window.debugNoFog = false;

function toggleFogDebug() {
    window.debugNoFog = !window.debugNoFog;
    const statusEl = document.getElementById('fog-status');
    if (statusEl) statusEl.textContent = window.debugNoFog ? 'ВЫКЛ' : 'ВКЛ';
    console.log(`🌫️ Туман войны ${window.debugNoFog ? 'ОТКЛЮЧЁН' : 'ВКЛЮЧЁН'}`);
    
    // Перерисовываем сразу
    if (window.renderer && window.engine && window.gameState?.player) {
        window.renderer.draw(window.engine, window.gameState.player);
    }
}

function checkPathToExit() {
    if (!window.engine) return alert('Engine не инициализирован');
    
    const hasPath = window.engine.mapEngine.hasValidPathToExit();
    if (hasPath) {
        alert(`✅ Путь до выхода ЕСТЬ! (уровень ${window.engine.level})`);
        console.log('✅ Путь существует');
    } else {
        alert(`❌ ПУТИ ДО ВЫХОДА НЕТ! Уровень ${window.engine.level} непроходим!`);
        console.error('❌ Лабиринт непроходим!');
    }
}