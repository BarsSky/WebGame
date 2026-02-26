// maze-menu.js
function showMainMenu() {
  loadLocale(currentLocale);  // Загружаем текущий язык
  document.getElementById('main-menu').style.display = 'flex';
  document.getElementById('game-container').style.display = 'none';
  renderMenuButtons();
}

function renderMenuButtons() {
  const container = document.getElementById('menu-buttons');
  container.innerHTML = `
    <button class="menu-button" onclick="startNewGame()">${i18n('menu.newGame')}</button>
    <button class="menu-button" onclick="loadSavedGame()">${i18n('menu.continue')}</button>
    <button class="menu-button" onclick="selectLevel()">${i18n('menu.levelSelect')}</button>
    <button class="menu-button" onclick="openCharacterSelectFromMenu()">${
      i18n('menu.character')}</button>
    <button class="menu-button" onclick="showStatsWindow()">${i18n('menu.stats')}</button>
    <button class="menu-button" onclick="showQuestWindow()">${i18n('menu.quests')}</button>
    <button class="menu-button" onclick="openSettings()">${i18n('menu.settings')}</button>
    <button class="menu-button" onclick="exportSave()">${i18n('menu.exportSave')}</button>
    <button class="menu-button" onclick="importSavePrompt()">${i18n('menu.importSave')}</button>
  `;
}

function startNewGame() {
  localStorage.removeItem('skynas_maze_level');
  localStorage.removeItem('skynas_save');
  // Добавим удаление истории
  localStorage.removeItem('skynas_stories');
  // Добавим удаление флага выбора персонажа
  localStorage.removeItem('charSelectShown_22');

  if (window.engine) {
    window.engine.level = 1;  // Теперь engine точно определен
    // Опционально: сбросить состояние storyManager, если оно существует
    if (window.storyManager) {
      window.storyManager.unlockedStories.clear();
      window.storyManager.loadProgress(); // Перезагрузим, чтобы убедиться, что оно пустое
    }
    hideMainMenu();
    initGame();  // Инициализация параметров уровня и старт цикла [21]
  } else {
    console.error('❌ Ошибка: Engine не инициализирован');
  }
}

function loadSavedGame() {
  const save = SaveManager.load();
  if (save) {
    window.engine.level = save.level || 1;
    hideMainMenu();
    initGame();
  } else {
    alert(i18n('menu.noSave'));
  }
}

function hideMainMenu() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('game-container').style.display = 'flex';
}

function changeLanguage() {
  const lang = currentLocale === 'ru' ? 'en' : 'ru';
  loadLocale(lang);
  renderMenuButtons();
}

// Запуск меню при старте
window.addEventListener('load', () => {
  showMainMenu();
});

// Принудительно показывать меню при первом запуске
window.forceShowMenu = () => {
  localStorage.removeItem('skynas_maze_level');
  localStorage.removeItem('skynas_save');
  location.reload();
};