/**
 * maze-engine.js
 * Основной класс для генерации и логики лабиринта
 */

class MazeEngine {
  constructor() {
    const savedLevel = localStorage.getItem('skynas_maze_level');
    this.level = savedLevel ? parseInt(savedLevel) : 1;
    this.grid = [];
    this.treasures = [];  // Массив для хранения сокровищ
    this.npcPos = [];
    this.enemies = [];
    this.hasKey = false;
    this.hasBook = false;
    this.visitedPath = [];
    this.dialogState = {};
  }

  initLevel() {
    console.log(
        '🎮 engine.initLevel() вызвана. inputManager ID ДО инициализации:',
        window.inputManager?.keysId);

    const baseGridSize = 7;
    const increment = (this.level - 1) * 2;
    this.cols = Math.min(101, baseGridSize + increment);
    this.rows = Math.min(101, baseGridSize + increment);

    // Масштабирование: после 15 уровня фиксируем размер ячейки для камеры
    this.cellSize = (this.level > 15) ? 25 : (400 / this.cols);

    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
    this._generate(0, 0);

    // ФИКС: расширение проходов на уровнях > 20
    if (this.level > 20) {
      this.addRooms();    // Добавляем комнаты в тупики
      this.widenPaths();  // Расширяем проходы до 3 клеток
    }

    // --- РАСШИРЕННЫЙ ПРОХОД К ВЫХОДУ (3х3 область) ---
    // Это гарантирует, что выход не будет в тупике
    this.grid[this.rows - 1][this.cols - 1] = 0;

    if (this.rows > 1) this.grid[this.rows - 2][this.cols - 1] = 0;
    if (this.cols > 1) this.grid[this.rows - 1][this.cols - 2] = 0;
    if (this.rows > 1 && this.cols > 1)
      this.grid[this.rows - 2][this.cols - 2] = 0;

    // Дополнительный проход для 3х3 области
    if (this.rows > 2) this.grid[this.rows - 3][this.cols - 1] = 0;
    if (this.cols > 2) this.grid[this.rows - 1][this.cols - 3] = 0;
    if (this.rows > 2 && this.cols > 1)
      this.grid[this.rows - 3][this.cols - 2] = 0;
    if (this.rows > 1 && this.cols > 2)
      this.grid[this.rows - 2][this.cols - 3] = 0;
    // -----------------------------------------------

    this.hasKey = false;
    this.hasBook = false;
    this.treasures = [];  // Инициализируем массив сокровищ
    this.visitedPath = [];
    this.npcPos = [];
    this.dialogState = {};

    // Координаты выхода для исключения при спавне сокровищ
    const exitPos = {x: this.cols - 1, y: this.rows - 1};

    // Размещаем КЛЮЧ (исключая старт и выход)
    const keyPos = this._getRandomEmptyCell([exitPos]);
    this.treasures.push({type: 'key', pos: keyPos, collected: false});

    if (this.level >= 10) {
      // Размещаем КНИГУ (исключая старт, выход и ключ)
      const bookPos = this._getRandomEmptyCell([exitPos, keyPos]);
      this.treasures.push({type: 'book', pos: bookPos, collected: false});
    }

    // Спавн NPC на определенных уровнях
    if (this.level >= 25) {
      this.spawnNPCs();
    }
  }

  spawnEnemies() {
    this.enemies = [];
    // Враги появляются, например, с 15 уровня [9]
    const enemyCount = Math.floor(this.level / 15);
    const types = Object.keys(MAZE_REGISTRY.enemies);

    for (let i = 0; i < enemyCount; i++) {
      const typeId = types[Math.floor(Math.random() * types.length)];
      const config = MAZE_REGISTRY.enemies[typeId];
      const cell = this._getRandomEmptyCell();

      this.enemies.push({
        x: cell.x,
        y: cell.y,
        type: typeId,
        behavior: config.behavior,
        stats: {...config.stats},
        lastUpdate: 0
      });
    }
  }

  /**
   * Генерация лабиринта алгоритмом глубины поиска
   */
  _generate(x, y) {
    this.grid[y][x] = 0;
    const dirs =
        [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows &&
          this.grid[ny][nx] === 1) {
        this.grid[y + dy / 2][x + dx / 2] = 0;
        this._generate(nx, ny);
      }
    }
  }

  /**
   * Добавление комнат в случайные места или тупики
   */
  addRooms() {
    const roomConfigs = Object.values(MAZE_REGISTRY.roomTypes);

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        // Если это тупик или просто пустая клетка
        if (this.grid[y][x] === 0 && Math.random() < 0.05) {
          const room =
              roomConfigs.find(r => Math.random() < r.rarity) || roomConfigs[0];
          this._createRoom(x, y, room.size);
        }
      }
    }
  }

  _createRoom(centerX, centerY, size) {
    const half = Math.floor(size / 2);
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        let nx = centerX + dx;
        let ny = centerY + dy;
        if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1) {
          this.grid[ny][nx] = 0;  // Вырезаем пространство комнаты
        }
      }
    }
  }

  /**
   * Расширение проходов (фиксированная логика из [11])
   */
  widenPaths() {
    const tempGrid = JSON.parse(JSON.stringify(this.grid));
    const expandProb = 0.4 + (this.level - 20) * 0.02;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 0) {
          // Расширяем вправо и вниз для создания эффекта ширины в 3 клетки
          if (x + 1 < this.cols && Math.random() < expandProb)
            tempGrid[y][x + 1] = 0;
          if (y + 1 < this.rows && Math.random() < expandProb)
            tempGrid[y + 1][x] = 0;
          if (x + 1 < this.cols && y + 1 < this.rows)
            tempGrid[y + 1][x + 1] = 0;
        }
      }
    }
    this.grid = tempGrid;
  }
  /**
   * Получение случайной пустой клетки с исключениями
   */
  _getRandomEmptyCell(excludeList = []) {
    let found = false;
    let kx, ky;
    const maxAttempts = 1000;
    let attempts = 0;

    while (!found && attempts < maxAttempts) {
      kx = Math.floor(Math.random() * this.cols);
      ky = Math.floor(Math.random() * this.rows);

      // Проверка: клетка в исключениях?
      let isExcluded = excludeList.some(p => p.x === kx && p.y === ky);

      // Клетка должна быть проходом, не на старте и не в списке исключений
      if (this.grid[ky][kx] === 0 && (kx > 1 || ky > 1) && !isExcluded) {
        found = true;
      }
      attempts++;
    }

    return found ? {x: kx, y: ky} : {x: this.cols - 2, y: this.rows - 2};
  }

  /**
   * Спавн NPC персонажей
   */
  spawnNPCs() {
    this.npcPos = [];
    this.npcTypes = [];  // Новый массив для типов
    const npcCount = Math.min(3, Math.floor(this.level / 10));
    const types = Object.keys(MAZE_REGISTRY.npcs);

    for (let i = 0; i < npcCount; i++) {
      const npcCell = this._getRandomEmptyCell([...this.npcPos]);
      this.npcPos.push(npcCell);
      // Назначаем случайную роль из доступных в реестре
      this.npcTypes.push(types[Math.floor(Math.random() * types.length)]);
      this.dialogState[`npc_${i}`] = false;
    }
  }

  saveProgress() {
    localStorage.setItem('skynas_maze_level', this.level);
  }

  resetProgress() {
    this.level = 1;
    localStorage.setItem('skynas_maze_level', 1);
  }
}
