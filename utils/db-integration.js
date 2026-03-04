/**
 * @class DatabaseIntegration
 * @description Слой интеграции с базой данных для сериализации и синхронизации данных
 */
class DatabaseIntegration {
  constructor(apiEndpoint = '/api/game') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Синхронизация данных игрока с сервером
   * @async
   */
  async syncPlayerData() {
    const data = SaveManager.serializeForDB();
    try {
      const response = await fetch(`${this.apiEndpoint}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();
      console.log('✅ Данные успешно синхронизированы с БД:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка синхронизации с БД:', error);
      // В случае ошибки сохраняем локально для последующей попытки
      this._queueForSync(data);
      return null;
    }
  }

  /**
   * Получение таблицы лидеров
   * @async
   */
  async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${this.apiEndpoint}/leaderboard?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка получения таблицы лидеров:', error);
      return [];
    }
  }

  /**
   * Генерация SQL-скрипта для создания таблиц (для документации/бэкенда)
   */
  generateSchemaSQL() {
    return `
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        current_level INTEGER DEFAULT 1,
        hp INTEGER DEFAULT 100,
        stamina INTEGER DEFAULT 100,
        last_x FLOAT,
        last_y FLOAT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE player_progress (
        player_id INTEGER REFERENCES players(id),
        unlocked_stories TEXT,
        items_collected INTEGER DEFAULT 0,
        enemies_killed INTEGER DEFAULT 0,
        PRIMARY KEY (player_id)
      );

      CREATE TABLE leaderboard (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id),
        score INTEGER NOT NULL,
        achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
    `;
  }

  _queueForSync(data) {
    const queue = JSON.parse(localStorage.getItem('skynas_sync_queue') || '[]');
    queue.push({ data, timestamp: Date.now() });
    localStorage.setItem('skynas_sync_queue', JSON.stringify(queue));
  }
}

window.dbIntegration = new DatabaseIntegration();
