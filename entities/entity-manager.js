/**
 * entity-manager.js
 * Управление NPC, предметами и врагами.
 */

class EntityManager {
  constructor() {
    this.treasures = [];
    this.npcPos = [];
    this.npcTypes = [];
    this.enemies = [];
    this.dialogState = {};
  }

  spawnAll(engine, mapEngine) {
    this.spawnTreasures(engine, mapEngine);
    if (engine.level >= 25) this.spawnNPCs(engine, mapEngine);
    if (engine.level >= 15) this.spawnEnemies(engine, mapEngine);
  }

  spawnTreasures(engine, mapEngine) {
    this.treasures = [];
    const exitPos = { x: engine.cols - 1, y: engine.rows - 1 };
    const startPos = { x: 0, y: 0 };

    let exclude = [startPos, exitPos];
    const keyPos = mapEngine.getRandomEmptyCell(exclude);
    this.treasures.push({ type: 'key', pos: keyPos, collected: false });

    if (engine.level >= 10) {
      exclude.push(keyPos);
      const bookPos = mapEngine.getRandomEmptyCell(exclude);
      this.treasures.push({ type: 'book', pos: bookPos, collected: false });
    }
  }

  spawnNPCs(engine, mapEngine) {
    this.npcPos = [];
    this.npcTypes = [];
    const npcCount = Math.min(3, Math.floor(engine.level / 10));
    const types = Object.keys(MAZE_REGISTRY.npcs);

    for (let i = 0; i < npcCount; i++) {
      const npcCell = mapEngine.getRandomEmptyCell([...this.npcPos]);
      this.npcPos.push(npcCell);
      this.npcTypes.push(types[Math.floor(Math.random() * types.length)]);
      this.dialogState[`npc_${i}`] = false;
    }
  }

  spawnEnemies(engine, mapEngine) {
    this.enemies = [];
    const enemyCount = Math.floor(engine.level / 15);
    const types = Object.keys(MAZE_REGISTRY.enemies);

    for (let i = 0; i < enemyCount; i++) {
      const typeId = types[Math.floor(Math.random() * types.length)];
      const config = MAZE_REGISTRY.enemies[typeId];
      const cell = mapEngine.getRandomEmptyCell();

      this.enemies.push({
        x: cell.x,
        y: cell.y,
        type: typeId,
        behavior: config.behavior,
        stats: { ...config.stats },
        lastUpdate: 0
      });
    }
  }

  drawAll(ctx, engine, isoFactor) {
    this.drawTreasures(ctx, engine);
    this.drawNPCs(ctx, engine);
    this.drawEnemies(ctx, engine);
  }

  drawTreasures(ctx, engine) {
    this.treasures.forEach(item => {
      if (item.collected) return;
      const config = MAZE_REGISTRY.items[item.type];
      const px = item.pos.x * engine.cellSize + engine.cellSize / 2;
      const py = item.pos.y * engine.cellSize + engine.cellSize / 2;

      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = config.color;

      if (window.spriteManager) {
        window.spriteManager.drawAnimatedItem(ctx, px, py, engine.cellSize * 0.75, config);
      } else {
        const size = engine.cellSize * 0.4;
        const offset = (engine.cellSize - size) / 2;
        ctx.fillStyle = config.color;
        ctx.fillRect(item.pos.x * engine.cellSize + offset, item.pos.y * engine.cellSize + offset, size, size);
      }
      ctx.restore();
    });
  }

  drawNPCs(ctx, engine) {
    this.npcPos.forEach((pos, idx) => {
      const px = pos.x * engine.cellSize + engine.cellSize / 2;
      const py = pos.y * engine.cellSize + engine.cellSize / 2;
      const size = engine.cellSize / 3;

      ctx.fillStyle = '#f97316';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.fillRect(px - size / 2 - 2, py - size / 3, 4, 4);
      ctx.fillRect(px + size / 2 - 2, py - size / 3, 4, 4);
    });
  }

  drawEnemies(ctx, engine) {
    this.enemies.forEach(enemy => {
      const px = enemy.x * engine.cellSize + engine.cellSize / 2;
      const py = enemy.y * engine.cellSize + engine.cellSize / 2;

      if (window.spriteManager) {
        window.spriteManager.draw(ctx, px, py, engine.cellSize, enemy.type);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  /**
   * Обновление врагов
   * @param {Object} engine - Движок игры
   * @param {Object} player - Информация об игроке
   */
  updateEnemies(engine, player) {
    // Проверяем, есть ли враги на уровне
    if (!this.enemies || this.enemies.length === 0) {
      return;
    }

    // Обновляем позиции врагов в зависимости от их поведения
    const currentTime = Date.now();
    this.enemies.forEach(enemy => {
      // Пропускаем обновление, если прошло мало времени
      if (currentTime - enemy.lastUpdate < 500) { // 500ms между обновлениями
        return;
      }
      
      enemy.lastUpdate = currentTime;
      
      // Простое поведение: враг движется в сторону игрока
      const playerCellX = Math.floor(player.x);
      const playerCellY = Math.floor(player.y);
      
      const dx = playerCellX - enemy.x;
      const dy = playerCellY - enemy.y;
      
      // Нормализуем вектор направления
      const distance = Math.max(1, Math.abs(dx) + Math.abs(dy)); // Манхэттенское расстояние
      
      // Двигаем врага в направлении игрока с учетом скорости
      const moveX = Math.sign(dx);
      const moveY = Math.sign(dy);
      
      // Проверяем, можно ли двигаться в этом направлении
      if (this._canMoveTo(engine, enemy.x + moveX, enemy.y + moveY, player)) {
        enemy.x += moveX;
        enemy.y += moveY;
      } else {
        // Если нельзя двигаться в направлении игрока, пробуем случайное направление
        const directions = [
          {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        const shuffled = directions.sort(() => Math.random() - 0.5);
        
        for (const dir of shuffled) {
          if (this._canMoveTo(engine, enemy.x + dir.x, enemy.y + dir.y, player)) {
            enemy.x += dir.x;
            enemy.y += dir.y;
            break;
          }
        }
      }
    });
  }

  /**
   * Проверка возможности перемещения в клетку
   * @private
   * @param {Object} engine - Движок игры
   * @param {number} x - X-координата
   * @param {number} y - Y-координата
   * @param {Object} player - Информация об игроке (для проверки столкновений)
   * @returns {boolean} - Можно ли переместиться в клетку
   */
  _canMoveTo(engine, x, y, player = null) {
    // Проверяем границы
    if (x < 0 || x >= engine.cols || y < 0 || y >= engine.rows) {
      return false;
    }
    
    // Проверяем, является ли клетка стеной
    if (engine.grid[y] && engine.grid[y][x] === 1) {
      return false;
    }
    
    // Проверяем, нет ли там другого врага
    for (const enemy of this.enemies) {
      if (enemy.x === x && enemy.y === y) {
        return false;
      }
    }
    
    // Проверяем, нет ли там игрока
    if (player && Math.floor(player.x) === x &&
        Math.floor(player.y) === y) {
      return false;
    }
    
    return true;
  }

  /**
   * Проверка сбора предметов игроком
   * @param {Object} player - Информация об игроке
   * @param {Object} engine - Движок игры
   * @param {Object} audioManager - Аудио менеджер
   * @returns {Array} - Массив собранных предметов
   */
  checkItemCollection(player, engine, audioManager) {
    const collectedItems = [];
    
    // Проверяем, находится ли игрок на клетке с предметом
    const playerCellX = Math.floor(player.x);
    const playerCellY = Math.floor(player.y);
    
    for (const item of this.treasures) {
      if (!item.collected &&
          Math.floor(item.pos.x) === playerCellX &&
          Math.floor(item.pos.y) === playerCellY) {
        
        // Отмечаем предмет как собранный
        item.collected = true;
        collectedItems.push(item);
        
        // Обновляем состояние игры в соответствии с типом предмета
        if (item.type === 'key') {
          engine.hasKey = true;
        } else if (item.type === 'book') {
          engine.hasBook = true;
          // Начинаем запись пути после получения книги
          engine.pathRecordingStarted = true;
          // Если это первый раз, когда получили книгу, добавляем начальную точку пути
          if (engine.visitedPath.length === 0) {
            engine.visitedPath = [{ x: playerCellX, y: playerCellY }];
          }
        }
        
        // Воспроизводим звук сбора
        if (audioManager && typeof audioManager.play === 'function') {
          audioManager.play('collect');
        }
      }
    }
    
    return collectedItems;
  }
}
