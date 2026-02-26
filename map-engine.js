/**
 * map-engine.js
 * Модуль генерации лабиринта, комнат и управления структурой карты.
 */

class MapEngine {
  constructor() {
    this.grid = [];
    this.cols = 0;
    this.rows = 0;
    this.wallTypeMap = {};
    this.activeRooms = [];
  }

  generateMap(level) {
    const base = 7;
    const inc = (level - 1) * 2;
    this.cols = Math.min(101, base + inc);
    this.rows = Math.min(101, base + inc);

    this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
    this._generate(0, 0);

    this.wallTypeMap = {};
    this.activeRooms = [];

    if (level >= 20) {
      this.addRooms(level);
      this.widenPaths(level);
    }

    this._ensureExitArea();
    this._assignWallTypes(level);

    return {
      grid: this.grid,
      cols: this.cols,
      rows: this.rows,
      wallTypeMap: this.wallTypeMap,
      activeRooms: this.activeRooms
    };
  }

  _generate(x, y) {
    this.grid[y][x] = 0;
    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === 1) {
        this.grid[y + dy / 2][x + dx / 2] = 0;
        this._generate(nx, ny);
      }
    }
  }

  addRooms(level) {
    const roomTypes = Object.values(MAZE_REGISTRY.roomTypes);
    const roomChance = level >= 20 ? 0.25 : 0.18;

    for (let y = 3; y < this.rows - 3; y++) {
      for (let x = 3; x < this.cols - 3; x++) {
        if (this.grid[y][x] !== 0) continue;

        let openSides = 0;
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
          if (this.grid[y + dy][x + dx] === 0) openSides++;
        });

        if (openSides <= 2 && Math.random() < roomChance) {
          const cfg = roomTypes.find(r => Math.random() < r.rarity) || roomTypes[0];
          const size = level >= 20 ? cfg.size + 2 : cfg.size;
          this._createRoomWithWalls(x, y, size);
          this.activeRooms.push({ x, y, type: cfg === roomTypes[0] ? 'common' : 'treasure' });
        }
      }
    }
  }

  _createRoomWithWalls(centerX, centerY, size) {
    const half = Math.floor(size / 2);
    const entranceDir = Math.floor(Math.random() * 4);

    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (x <= 0 || x >= this.cols - 1 || y <= 0 || y >= this.rows - 1) continue;

        if (Math.abs(dx) === half || Math.abs(dy) === half) {
          this.grid[y][x] = 1;
        } else {
          this.grid[y][x] = 0;
        }
      }
    }

    const ex = centerX + (entranceDir === 0 ? half : entranceDir === 2 ? -half : 0);
    const ey = centerY + (entranceDir === 1 ? half : entranceDir === 3 ? -half : 0);
    if (ex > 0 && ex < this.cols - 1 && ey > 0 && ey < this.rows - 1) {
      this.grid[ey][ex] = 0;
    }
  }

  widenPaths(level) {
    const baseProb = 0.28 + (level - 20) * 0.012;
    const prob = level >= 20 ? baseProb * 1.5 : baseProb;

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === 0) {
          if (Math.random() < prob) {
            this.grid[y][x + 1] = 0;
            if (level >= 20 && x + 2 < this.cols) this.grid[y][x + 2] = 0;
          }
          if (Math.random() < prob) {
            this.grid[y + 1][x] = 0;
            if (level >= 20 && y + 2 < this.rows) this.grid[y + 2][x] = 0;
          }
        }
      }
    }
  }

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

  _assignWallTypes(level) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 1) {
          let type = 1;
          if (level >= 26) type = 3;
          else if (level >= 16) type = 2;
          this.wallTypeMap[`${x}_${y}`] = type;
        }
      }
    }
  }

  getRandomEmptyCell(excludeList = []) {
    let found = false;
    let kx, ky;
    const maxAttempts = 1000;
    let attempts = 0;

    while (!found && attempts < maxAttempts) {
      kx = Math.floor(Math.random() * this.cols);
      ky = Math.floor(Math.random() * this.rows);

      let isExcluded = excludeList.some(p => p.x === kx && p.y === ky);

      if (this.grid[ky][kx] === 0 && (kx > 1 || ky > 1) && !isExcluded) {
        found = true;
      }
      attempts++;
    }

    return found ? { x: kx, y: ky } : { x: this.cols - 2, y: this.rows - 2 };
  }
}
