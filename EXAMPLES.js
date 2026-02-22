/**
 * ПРИМЕРЫ РАСШИРЕНИЙ И МОДИФИКАЦИЙ
 * Используйте эти примеры для добавления новых функций в игру
 */

// ============ ПРИМЕР 1: Добавить новый тип предмета ============

// В maze-engine.js добавить свойство:
/*
constructor() {
    ...
    this.coins = [];  // Новый тип предмета
}

initLevel() {
    ...
    this.coins = [];
    for (let i = 0; i < 5; i++) {
        this.coins.push(this._getRandomEmptyCell([...excludeList]));
    }
}
*/

// В maze-renderer.js добавить отрисовку:
/*
// В методе draw() перед drawPlayer
if (engine.coins.length > 0) {
    engine.coins.forEach(coinPos => {
        this.drawItem(coinPos, '#fde047', engine);  // Жёлтый
    });
}
*/

// В maze-physics.js добавить проверку:
/*
checkCollisions(player, engine, audio, story) {
    ...
    engine.coins = engine.coins.filter(coin => {
        if (player.x === coin.x && player.y === coin.y) {
            audio?.play('get');
            return false;  // Удалить монету
        }
        return true;
    });
}
*/

// ============ ПРИМЕР 2: Добавить врага/препятствие ============

// В maze-engine.js:
/*
spawnEnemies() {
    this.enemies = [];
    const enemyCount = Math.floor(this.level / 15);
    for (let i = 0; i < enemyCount; i++) {
        this.enemies.push({
            x: this._getRandomEmptyCell().x,
            y: this._getRandomEmptyCell().y,
            vx: Math.random() > 0.5 ? 1 : -1
        });
    }
}

updateEnemies() {
    this.enemies.forEach(enemy => {
        enemy.x += enemy.vx;
        // Отскок от стен
        if (this.grid[enemy.y][enemy.x] === 1) {
            enemy.vx *= -1;
        }
    });
}
*/

// В maze-renderer.js:
/*
// В методе draw() перед drawPlayer
if (engine.enemies) {
    engine.enemies.forEach(enemy => {
        const px = enemy.x * engine.cellSize + engine.cellSize / 2;
        const py = enemy.y * engine.cellSize + engine.cellSize / 2;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    });
}
*/

// ============ ПРИМЕР 3: Система очков ============

/*
// В maze-main.js:
let gameStats = {
    score: 0,
    coinsCollected: 0,
    npcsMet: 0
};

function updateScore(points) {
    gameStats.score += points;
    document.getElementById('score-display').innerText = gameStats.score;
}
*/

// В maze-physics.js:
/*
checkCollisions(player, engine, audio, story) {
    ...
    if (engine.coins.length > 0) {
        engine.coins = engine.coins.filter(coin => {
            if (player.x === coin.x && player.y === coin.y) {
                audio?.play('get');
                updateScore(10);  // +10 за монету
                gameStats.coinsCollected++;
                return false;
            }
            return true;
        });
    }
}
*/

// ============ ПРИМЕР 4: Бонусная жизнь (если будут враги) ============

/*
class GameStats {
    constructor() {
        this.lives = 3;
        this.health = 100;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.lives--;
            this.health = 100;
            return this.lives > 0;
        }
        return true;
    }
}

// Использование:
if (!gameStats.takeDamage(10)) {
    handleGameOver();
}
*/

// ============ ПРИМЕР 5: Таймер уровня ============

/*
class LevelTimer {
    constructor() {
        this.startTime = null;
        this.timeLimit = 300;  // 5 минут
    }

    start() {
        this.startTime = Date.now();
    }

    getTimeLeft() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        return Math.max(0, this.timeLimit - elapsed);
    }

    isTimeUp() {
        return this.getTimeLeft() <= 0;
    }
}

// В gameLoop:
if (levelTimer.isTimeUp()) {
    handleTimeUp();
}
*/

// ============ ПРИМЕР 6: Система карты видимой части ============

/*
drawMinimap(engine) {
    const minimapSize = 100;
    const cellSize = minimapSize / Math.max(engine.cols, engine.rows);
    
    // Фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, minimapSize, minimapSize);
    
    // Стены
    ctx.fillStyle = '#666';
    for (let y = 0; y < engine.rows; y++) {
        for (let x = 0; x < engine.cols; x++) {
            if (engine.grid[y][x] === 1) {
                ctx.fillRect(10 + x * cellSize, 10 + y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Игрок
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(10 + player.x * cellSize, 10 + player.y * cellSize, cellSize, cellSize);
    
    // Выход
    ctx.fillStyle = engine.hasKey ? '#10b981' : '#666';
    ctx.fillRect(10 + (engine.cols-1) * cellSize, 10 + (engine.rows-1) * cellSize, cellSize, cellSize);
}
*/

// ============ ПРИМЕР 7: Система достижений ============

/*
const ACHIEVEMENTS = {
    FIRST_LEVEL: { id: 'first', name: 'Первый уровень', unlocked: false },
    SPEEDRUN: { id: 'speedrun', name: 'Скоростная гонка', unlocked: false },
    COLLECTOR: { id: 'collector', name: 'Собиратель', unlocked: false },
    SOCIAL: { id: 'social', name: 'Общественник', unlocked: false }
};

function unlockAchievement(id) {
    if (!ACHIEVEMENTS[id].unlocked) {
        ACHIEVEMENTS[id].unlocked = true;
        showAchievementNotification(ACHIEVEMENTS[id].name);
        localStorage.setItem('skynas_achievements', JSON.stringify(ACHIEVEMENTS));
    }
}

// Проверки:
if (engine.level === 1) unlockAchievement('FIRST_LEVEL');
if (engine.level === 10) unlockAchievement('COLLECTOR');
*/

// ============ ПРИМЕР 8: Улучшенные диалоги с выбором ============

/*
showDialogWithChoices(name, text, choices) {
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-name">${name}</div>
            <div class="dialog-text">${text}</div>
            <div class="dialog-choices">
                ${choices.map((choice, idx) => `
                    <button class="choice-btn" onclick="handleChoice(${idx})">
                        ${choice.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    dialogBox.style.display = 'block';
}

function handleChoice(choiceIdx) {
    // Логика обработки выбора
    console.log(`Player chose option ${choiceIdx}`);
}
*/

// ============ ПРИМЕР 9: Динамическая сложность ============

/*
function adjustDifficulty(level) {
    return {
        moveDelay: Math.max(40, 130 - level * 6),
        wallChance: Math.min(0.5, 0.1 + level * 0.01),
        npcCount: Math.floor(level / 15),
        timeLimit: Math.max(60, 600 - level * 10)
    };
}
*/

// ============ ПРИМЕР 10: Система логирования прогресса ============

/*
class GameLogger {
    constructor() {
        this.logs = [];
    }

    log(event, data) {
        this.logs.push({
            timestamp: Date.now(),
            event,
            data,
            level: engine.level
        });
        
        if (this.logs.length > 1000) {
            this.logs.shift();  // Ограничить размер
        }
    }

    export() {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Использование:
const logger = new GameLogger();
logger.log('level_start', { level: engine.level });
logger.log('item_collected', { item: 'key' });
logger.log('npc_interaction', { npc: 'Странник' });
*/

// ============ ОБЩИЕ СОВЕТЫ ============

/*
1. МОДУЛЬНОСТЬ
   - Создавайте новые классы для новых систем
   - Используйте зависимости через конструктор
   - Избегайте глобальных переменных

2. ПРОИЗВОДИТЕЛЬНОСТЬ
   - Кэшируйте часто используемые значения
   - Используйте requestAnimationFrame для анимаций
   - Не создавайте объекты в цикле render

3. ОТЛАДКА
   - Используйте console.log с префиксами: [MODULE_NAME]
   - Сохраняйте логи в localStorage для анализа
   - Создавайте тестовые уровни для проверки

4. ОПТИМИЗАЦИЯ
   - Профилируйте с DevTools Performance tab
   - Уменьшайте количество перерисовок
   - Используйте canvas efficiently
*/
