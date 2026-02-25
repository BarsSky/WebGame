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
    this.cameraZoom = 2.0;      // ← новый параметр
    this.wallTypeMap = {};      // {x_y: wallTypeId}
    this.viewMode = 'topdown';  // 'topdown' | 'isometric' | 'hybrid'
    this.isoFactor = 0;         // 0..1 — плавный переход к изометрии
  }

  initLevel() {
    console.log('🎮 engine.initLevel() для уровня', this.level);

    const base = 7;
    const inc = (this.level - 1) * 2;
    this.cols = Math.min(101, base + inc);
    this.rows = Math.min(101, base + inc);

    this.cellSize = (this.level > 15) ? 25 : (400 / this.cols);

    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
    this._generate(0, 0);

    this.wallTypeMap = {};

    // Комнаты и расширения проходов
    this.activeRooms = [];

    if (this.level > 20) {
      this.addRooms();
      this.widenPaths();
    }

    this._ensureExitArea();

    // Назначаем разные типы стен
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 1) {
          let type = 1;
          if (this.level >= 26)
            type = 3;
          else if (this.level >= 16)
            type = 2;

          this.wallTypeMap[`${x}_${y}`] = type;
        }
      }
    }

    // Сброс состояний
    this.hasKey = false;
    this.hasBook = false;
    this.visitedPath = [];
    this.npcPos = [];
    this.dialogState = {};

    // === РАЗМЕЩЕНИЕ СОКРОВИЩ И NPC ===
    this.spawnTreasures();  // ← теперь метод существует
    if (this.level >= 25) this.spawnNPCs();
  }

  spawnTreasures() {
    this.treasures = [];

    const exitPos = {x: this.cols - 1, y: this.rows - 1};
    const startPos = {x: 0, y: 0};

    // Ключ (исключаем старт и выход)
    let exclude = [startPos, exitPos];
    const keyPos = this._getRandomEmptyCell(exclude);
    this.treasures.push({type: 'key', pos: keyPos, collected: false});

    // Книга с 10 уровня
    if (this.level >= 10) {
      exclude.push(keyPos);
      const bookPos = this._getRandomEmptyCell(exclude);
      this.treasures.push({type: 'book', pos: bookPos, collected: false});
    }

    console.log(`✅ Сокровища размещены (уровень ${this.level}): ${
        this.treasures.length} шт.`);
  }

  // Новый метод
  _ensureExitArea() {
    const ex = this.cols - 1, ey = this.rows - 1;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = ex + dx, y = ey + dy;
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
          this.grid[y][x] = 0;
        }
      }
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
    this.activeRooms = [];
    const roomTypes = Object.values(MAZE_REGISTRY.roomTypes);

    for (let y = 3; y < this.rows - 3; y++) {
      for (let x = 3; x < this.cols - 3; x++) {
        if (this.grid[y][x] !== 0) continue;

        // Только настоящие тупики (1–2 прохода)
        let openSides = 0;
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
          if (this.grid[y + dy][x + dx] === 0) openSides++;
        });

        if (openSides <= 2 && Math.random() < 0.18) {
          const cfg =
              roomTypes.find(r => Math.random() < r.rarity) || roomTypes[0];

          this._createRoomWithWalls(
              x, y, cfg.size);  // ← новая функция с стенами
          this.activeRooms.push(
              {x, y, type: cfg === roomTypes[0] ? 'common' : 'treasure'});
        }
      }
    }
  }

  _createRoomWithWalls(centerX, centerY, size) {
    const half = Math.floor(size / 2);
    const entranceDir =
        Math.floor(Math.random() * 4);  // случайная сторона для входа

    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (x <= 0 || x >= this.cols - 1 || y <= 0 || y >= this.rows - 1)
          continue;

        // Стены по периметру
        if (Math.abs(dx) === half || Math.abs(dy) === half) {
          this.grid[y][x] = 1;  // стена
        } else {
          this.grid[y][x] = 0;  // пол
        }
      }
    }

    // Один вход шириной 1 клетка
    const ex = centerX +
        (entranceDir === 0     ? half :
             entranceDir === 2 ? -half :
                                 0);
    const ey = centerY +
        (entranceDir === 1     ? half :
             entranceDir === 3 ? -half :
                                 0);
    if (ex > 0 && ex < this.cols - 1 && ey > 0 && ey < this.rows - 1) {
      this.grid[ey][ex] = 0;
    }
  }

  widenPaths() {
    const prob = 0.28 + (this.level - 20) * 0.012;  // мягче чем раньше

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === 0) {
          if (Math.random() < prob) this.grid[y][x + 1] = 0;
          if (Math.random() < prob) this.grid[y + 1][x] = 0;
        }
      }
    }
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
    localStorage.setItem('charSelectShown_22', 'false');
  }
}
