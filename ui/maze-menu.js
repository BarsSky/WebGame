// maze-menu.js
/**
 * @class MenuManager
 * @description Управляет игровым меню и навигацией
 */
class MenuManager {
  constructor() {
    this.currentView = 'main-menu';
  }

  async showMainMenu() {
    if (typeof loadLocale === 'function') {
      await loadLocale(window.currentLocale || 'ru');
    }
    this.switchView('main-menu');
    this.renderMenuButtons();
  }

  switchView(viewId) {
    const views = ['main-menu', 'game-container', 'settings-menu', 'stats-window'];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === viewId) ? (id === 'game-container' ? 'flex' : 'flex') : 'none';
    });
    
    // Специальная обработка для game-container, если он должен быть flex
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.display = (viewId === 'game-container') ? 'flex' : 'none';
    }

    this.currentView = viewId;
  }

  renderMenuButtons() {
    const container = document.getElementById('menu-buttons');
    if (!container) return;

    const buttons = [
      { label: 'menu.newGame', action: 'window.menuManager.startNewGame()' },
      { label: 'menu.loadGame', action: 'window.menuManager.openLoadSlots()' },
      { label: 'menu.saveGame', action: 'window.menuManager.openSaveSlots()' },
      { label: 'menu.levelSelect', action: 'selectLevel()' },
      { label: 'menu.settings', action: 'openSettings()' },
      { label: 'menu.exportSave', action: 'SaveManager.exportSave()' },
      { label: 'menu.importSave', action: 'window.menuManager.importSavePrompt()' }
    ];

    container.innerHTML = buttons.map(btn => `
      <button class="menu-button" onclick="${btn.action}">${i18n(btn.label)}</button>
    `).join('');
  }

  startNewGame() {
    if (confirm(i18n('menu.confirmNewGame') || 'Начать новую игру? Весь прогресс будет потерян.')) {
      localStorage.removeItem('skynas_maze_level');
      localStorage.removeItem('skynas_save');
      localStorage.removeItem('skynas_stories');
      localStorage.removeItem('charSelectShown_22');

      if (window.gameInstance) {
        window.gameInstance.engine.level = 1;
        if (window.gameInstance.storyManager) {
          window.gameInstance.storyManager.unlockedStories.clear();
        }
        this.switchView('game-container');
        window.gameInstance.setupGame();
        window.gameInstance.start();
      }
    }
  }

  loadSavedGame() {
    const save = SaveManager.load();
    if (save && window.gameInstance) {
      window.gameInstance.engine.level = save.level || 1;
      // Восстановление других параметров состояния
      if (save.playerHP) window.gameInstance.engine.playerHP = save.playerHP;
      
      this.switchView('game-container');
      window.gameInstance.setupGame();
      window.gameInstance.start();
    } else {
      alert(i18n('menu.noSave'));
    }
  }

  importSavePrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        SaveManager.importSave(file);
      }
    };
    input.click();
  }

  openSaveSlots() {
    this.showSlotsOverlay('save');
  }

  openLoadSlots() {
    this.showSlotsOverlay('load');
  }

  showSlotsOverlay(mode = 'save') {
    if (window.gameInstance) window.gameInstance.pause();
    
    const overlay = document.createElement('div');
    overlay.className = 'slots-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: '10001',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    });

    const modal = document.createElement('div');
    modal.className = 'slots-modal';
    Object.assign(modal.style, {
      backgroundColor: '#222',
      padding: '30px',
      borderRadius: '10px',
      width: '80%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '2px solid #444'
    });

    const title = mode === 'save' ? 'СОХРАНИТЬ ИГРУ' : 'ЗАГРУЗИТЬ ИГРУ';
    modal.innerHTML = `<h2 style="text-align:center; margin-bottom:20px;">${title}</h2>`;

    const slotsContainer = document.createElement('div');
    slotsContainer.style.display = 'grid';
    slotsContainer.style.gridTemplateColumns = '1fr';
    slotsContainer.style.gap = '10px';

    // Добавляем автосохранение в список для загрузки
    const slotsToRender = mode === 'load' ? ['autosave', ...Array.from({length: 10}, (_, i) => i + 1)] : Array.from({length: 10}, (_, i) => i + 1);

    slotsToRender.forEach(slot => {
      const data = SaveManager.load(slot);
      const slotBtn = document.createElement('div');
      Object.assign(slotBtn.style, {
        padding: '15px',
        backgroundColor: '#333',
        border: '1px solid #555',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.2s'
      });
      slotBtn.onmouseover = () => slotBtn.style.backgroundColor = '#444';
      slotBtn.onmouseout = () => slotBtn.style.backgroundColor = '#333';

      const slotInfo = document.createElement('div');
      if (data) {
        const date = new Date(data.timestamp).toLocaleString();
        slotInfo.innerHTML = `
          <strong style="color:#fbbf24;">Слот ${slot === 'autosave' ? 'АВТО' : slot}</strong><br>
          <small>Уровень: ${data.level} | HP: ${data.playerHP} | ${date}</small>
        `;
      } else {
        slotInfo.innerHTML = `<strong style="color:#888;">Слот ${slot}</strong><br><small>Пусто</small>`;
      }

      slotBtn.appendChild(slotInfo);

      if (mode === 'save' || (mode === 'load' && data)) {
        slotBtn.onclick = () => {
          if (mode === 'save') {
            if (data && !confirm('Перезаписать существующее сохранение?')) return;
            SaveManager.save(slot);
            this.showNotification('Игра сохранена в слот ' + slot, 'success');
          } else {
            window.gameInstance.engine.level = data.level;
            this.switchView('game-container');
            window.gameInstance.setupGame();
            window.gameInstance.start();
            this.showNotification('Загружен слот ' + slot, 'success');
          }
          overlay.remove();
          if (window.gameInstance) window.gameInstance.resume();
        };
      } else {
        slotBtn.style.opacity = '0.5';
        slotBtn.style.cursor = 'default';
      }

      slotsContainer.appendChild(slotBtn);
    });

    modal.appendChild(slotsContainer);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'ЗАКРЫТЬ';
    Object.assign(closeBtn.style, {
      marginTop: '20px',
      width: '100%',
      padding: '10px',
      backgroundColor: '#555',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    });
    closeBtn.onclick = () => {
      overlay.remove();
      if (window.gameInstance) window.gameInstance.resume();
    };
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `menu-notification notification-${type}`;
    notification.innerText = message;
    
    // Стилизация уведомления (можно вынести в CSS)
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px 20px',
      borderRadius: '5px',
      backgroundColor: type === 'success' ? '#4caf50' : (type === 'error' ? '#f44336' : '#2196f3'),
      color: 'white',
      zIndex: '10000',
      transition: 'opacity 0.5s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
}

window.menuManager = new MenuManager();

// Оставляем глобальные функции для обратной совместимости, если они вызываются из HTML
async function showMainMenu() { await window.menuManager.showMainMenu(); }
function startNewGame() { window.menuManager.startNewGame(); }
function loadSavedGame() { window.menuManager.loadSavedGame(); }

async function changeLanguage() {
  const lang = (window.currentLocale === 'ru') ? 'en' : 'ru';
  if (typeof loadLocale === 'function') {
    await loadLocale(lang);
  }
  window.menuManager.renderMenuButtons();
}

// Удален дублирующий обработчик 'load', так как инициализация
// теперь централизованно управляется в maze-main.js через startGame()

// Принудительно показывать меню при первом запуске
window.forceShowMenu = () => {
  localStorage.removeItem('skynas_maze_level');
  localStorage.removeItem('skynas_save');
  localStorage.removeItem('skynas_profiles');
  location.reload();
};