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
}
