/**
 * maze-physics.js
 * Физика, коллизии и логика движения
 */

class PhysicsEngine {
  constructor() {
    this.lastMoveTime = 0;
  }

  /**
   * Инициализация физического движка (на случай, если потребуется)
   */
  initialize() {
    console.log('🏃 PhysicsEngine инициализирован');
    this.lastMoveTime = 0;
  }

  /**
   * Обновить движение игрока
   */
  updateMovement(player, engine, input, timestamp) {
    const moveDelay = Math.max(60, 130 - engine.level * 5);
    const dir =
        input
            .getMovementDirection();  // Вызываем ВСЕГДА, не зависит от задержки

    if (timestamp - this.lastMoveTime > moveDelay) {
      let nx = player.x + dir.dx;
      let ny = player.y + dir.dy;

      if (dir.dx !== 0 || dir.dy !== 0) {
        if (this.isValidMove(nx, ny, engine)) {
          // Проверка выхода без ключа
          if (nx === engine.cols - 1 && ny === engine.rows - 1 &&
              !engine.hasKey) {
            return {moved: false, blocked: true};
          }

          player.x = nx;
          player.y = ny;
          this.lastMoveTime = timestamp;

          // Записываем путь для магической книги
          this.recordVisitedPath(player, engine);

          return {moved: true, blocked: false};
        }
      }
    }
    return {moved: false, blocked: false};
  }

  /**
   * Проверка валидности движения
   */
  isValidMove(x, y, engine) {
    return x >= 0 && x < engine.cols && y >= 0 && y < engine.rows &&
        engine.grid[y][x] === 0;
  }

  /**
   * Запись посещенных клеток
   */
  recordVisitedPath(player, engine) {
    const alreadyVisited =
        engine.visitedPath.some(p => p.x === player.x && p.y === player.y);
    if (!alreadyVisited) {
      engine.visitedPath.push({x: player.x, y: player.y});
    }
  }

  /**
   * Проверка коллизий с предметами
   */
  checkCollisions(player, engine, audio, story) {
    let collected = [];

    // 1. Обработка предметов (Сокровища)
    engine.treasures = engine.treasures.filter(item => {
      if (!item.collected && player.x === item.pos.x &&
          player.y === item.pos.y) {
        const config = MAZE_REGISTRY.items[item.type];

        // Выполнение действия на основе типа из реестра
        if (config.action === 'collect_key') engine.hasKey = true;
        if (config.action === 'collect_book') engine.hasBook = true;

        audio?.play(config.sound || 'get');
        item.collected = true;
        collected.push(item.type);
        return false;  // Удаляем из активных, если нужно
      }
      return true;
    });

    // 2. Взаимодействие с NPC
    engine.npcPos.forEach((npcPos, idx) => {
      if (player.x === npcPos.x && player.y === npcPos.y) {
        if (!engine.dialogState[`npc_${idx}`]) {
          const npcType = engine.npcTypes[idx];
          const npcConfig = MAZE_REGISTRY.npcs[npcType];

          story?.interactWithNPC(
              idx, npcType);  // Передаем тип для выбора диалога
          engine.dialogState[`npc_${idx}`] = true;
          audio?.play('interact');
          collected.push(`npc_${npcType}`);
        }
      }
    });

    // 3. Бой с врагами
    engine.enemies = engine.enemies.filter(enemy => {
      if (player.x === enemy.x && player.y === enemy.y) {
        const enemyConfig = MAZE_REGISTRY.enemies[enemy.type];

        // Логика боя (например, уменьшение здоровья)
        console.log(
            `Бой с ${enemyConfig.name}! Урон: ${enemyConfig.stats.damage}`);
        audio?.play('lock');  // Звук удара

        return false;  // Враг исчезает после столкновения (или ваша логика)
      }
      return true;
    });

    return collected;
  }

  /**
   * Проверка условия победы
   */
  checkWinCondition(player, engine) {
    return player.x === engine.cols - 1 && player.y === engine.rows - 1 &&
        engine.hasKey;
  }
}
