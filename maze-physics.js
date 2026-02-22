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
        const dir = input.getMovementDirection(); // Вызываем ВСЕГДА, не зависит от задержки
        
        if (timestamp - this.lastMoveTime > moveDelay) {
            let nx = player.x + dir.dx;
            let ny = player.y + dir.dy;

            if (dir.dx !== 0 || dir.dy !== 0) {
                if (this.isValidMove(nx, ny, engine)) {
                    // Проверка выхода без ключа
                    if (nx === engine.cols - 1 && ny === engine.rows - 1 && !engine.hasKey) {
                        return { moved: false, blocked: true };
                    }

                    player.x = nx;
                    player.y = ny;
                    this.lastMoveTime = timestamp;

                    // Записываем путь для магической книги
                    this.recordVisitedPath(player, engine);

                    return { moved: true, blocked: false };
                }
            }
        }
        return { moved: false, blocked: false };
    }

    /**
     * Проверка валидности движения
     */
    isValidMove(x, y, engine) {
        return x >= 0 && x < engine.cols && y >= 0 && y < engine.rows && engine.grid[y][x] === 0;
    }

    /**
     * Запись посещенных клеток
     */
    recordVisitedPath(player, engine) {
        const alreadyVisited = engine.visitedPath.some(p => p.x === player.x && p.y === player.y);
        if (!alreadyVisited) {
            engine.visitedPath.push({ x: player.x, y: player.y });
        }
    }

    /**
     * Проверка коллизий с предметами
     */
    checkCollisions(player, engine, audio, story) {
        let collected = [];

        // Сбор ключа
        if (!engine.hasKey && player.x === engine.keyPos.x && player.y === engine.keyPos.y) {
            engine.hasKey = true;
            audio?.play('get');
            collected.push('key');
        }

        // Сбор книги
        if (engine.level >= 10 && !engine.hasBook && 
            player.x === engine.bookPos.x && player.y === engine.bookPos.y) {
            engine.hasBook = true;
            audio?.play('get');
            collected.push('book');
        }

        // Взаимодействие с NPC
        engine.npcPos.forEach((npcPos, idx) => {
            if (player.x === npcPos.x && player.y === npcPos.y) {
                if (!engine.dialogState[`npc_${idx}`]) {
                    story?.interactWithNPC(idx);
                    engine.dialogState[`npc_${idx}`] = true;
                    audio?.play('interact');
                    collected.push(`npc_${idx}`);
                }
            }
        });

        return collected;
    }

    /**
     * Проверка условия победы
     */
    checkWinCondition(player, engine) {
        return player.x === engine.cols - 1 && player.y === engine.rows - 1 && engine.hasKey;
    }
}
