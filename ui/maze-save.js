// maze-save.js
/**
 * @class SaveManager
 * @description Управляет сохранением и загрузкой прогресса, включая профили, слоты и экспорт
 */
const SaveManager = {
  MAX_SLOTS: 10,

  /**
   * Сохраняет текущее состояние игры в localStorage
   * @param {string|number} slot - Имя профиля или номер слота (1-10)
   */
  save(slot = 'default') {
    try {
      const engine = window.gameInstance?.engine || window.engine;
      const storyManager = window.gameInstance?.storyManager || window.storyManager;
      
      const data = {
        slot: slot,
        level: engine?.level || 1,
        hasKey: engine?.hasKey || false,
        hasBook: engine?.hasBook || false,
        playerHP: engine?.playerHP || 100,
        playerStamina: engine?.playerStamina || 100,
        unlockedStories: Array.from(storyManager?.unlockedStories || []),
        inventory: engine?.inventory || [],
        stats: engine?.stats || { enemiesKilled: 0, itemsCollected: 0 },
        timestamp: Date.now(),
        version: '1.2.0'
      };

      const key = this._getSlotKey(slot);
      localStorage.setItem(key, JSON.stringify(data));
      
      // Обновляем список профилей/слотов
      this._updateProfileList(slot);
      
      // Синхронизация с БД
      if (window.dbIntegration) {
        window.dbIntegration.syncPlayerData();
      }

      console.log(`💾 Игра сохранена в слот: ${slot}`);
      return true;
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
      return false;
    }
  },

  /**
   * Загружает состояние игры
   * @param {string|number} slot - Имя профиля или номер слота
   */
  load(slot = 'default') {
    try {
      const key = this._getSlotKey(slot);
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      
      const data = JSON.parse(saved);
      console.log(`📂 Загружен слот: ${slot}`, data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка при загрузке:', error);
      return null;
    }
  },

  _getSlotKey(slot) {
    if (slot === 'default') return 'skynas_save';
    if (slot === 'autosave') return 'skynas_save_autosave';
    return `skynas_save_slot_${slot}`;
  },

  /**
   * Экспорт сохранения в файл JSON
   */
  exportSave(profileName = 'default') {
    const key = profileName === 'default' ? 'skynas_save' : `skynas_save_${profileName}`;
    const data = localStorage.getItem(key);
    if (!data) {
      alert(i18n('menu.noSaveToExport') || 'Нет данных для экспорта');
      return;
    }

    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze_save_${profileName}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Импорт сохранения из файла
   */
  importSave(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version || !data.level) {
          throw new Error('Неверный формат файла сохранения');
        }
        
        const profileName = data.profile || 'imported';
        const key = profileName === 'default' ? 'skynas_save' : `skynas_save_${profileName}`;
        localStorage.setItem(key, e.target.result);
        this._updateProfileList(profileName);
        
        alert(i18n('menu.importSuccess') || 'Сохранение успешно импортировано!');
        location.reload();
      } catch (error) {
        alert((i18n('menu.importError') || 'Ошибка импорта: ') + error.message);
      }
    };
    reader.readAsText(file);
  },

  /**
   * Сериализация данных для реляционной БД
   * Подготавливает объект, который легко преобразовать в SQL-запросы
   */
  serializeForDB() {
    const engine = window.gameInstance?.engine || window.engine;
    const player = window.gameInstance?.state?.player || { x: 0, y: 0 };
    
    return {
      players: {
        id: engine?.playerId || 1,
        name: engine?.playerName || 'Player',
        current_level: engine?.level || 1,
        hp: engine?.playerHP || 100,
        stamina: engine?.playerStamina || 100,
        last_x: player.x,
        last_y: player.y
      },
      player_progress: {
        player_id: engine?.playerId || 1,
        unlocked_stories: Array.from(window.storyManager?.unlockedStories || []).join(','),
        items_collected: engine?.stats?.itemsCollected || 0,
        enemies_killed: engine?.stats?.enemiesKilled || 0
      },
      leaderboard: {
        player_id: engine?.playerId || 1,
        score: (engine?.level || 1) * 100 + (engine?.stats?.itemsCollected || 0) * 10,
        achieved_at: new Date().toISOString()
      }
    };
  },

  _updateProfileList(newProfile) {
    let profiles = JSON.parse(localStorage.getItem('skynas_profiles') || '[]');
    if (!profiles.includes(newProfile)) {
      profiles.push(newProfile);
      localStorage.setItem('skynas_profiles', JSON.stringify(profiles));
    }
  },

  getProfiles() {
    return JSON.parse(localStorage.getItem('skynas_profiles') || '["default"]');
  }
};

window.SaveManager = SaveManager;