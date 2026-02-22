// DEBUG.js - Файл для отладки управления и состояния игры

/**
 * Включение отладки в консоли
 */
window.DEBUG_MODE = true;

// Оригинальные обработчики событий
const originalKeyDown = window.onkeydown;
const originalKeyUp = window.onkeyup;

// Перехватываем события клавиатуры для отладки
if (window.DEBUG_MODE) {
    console.log("🐛 DEBUG MODE ВКЛЮЧЕН");
    
    // Логирование нажатий клавиш
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            console.log(`⌨️ KEYDOWN: ${e.key}`);
            if (window.inputManager) {
                console.log(`📍 Keys state:`, window.inputManager.keys);
                const dir = window.inputManager.getMovementDirection();
                console.log(`🎯 Direction: dx=${dir.dx}, dy=${dir.dy}`);
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
            console.log(`⌨️ KEYUP: ${e.key}`);
        }
    });
}

/**
 * Функция для проверки состояния управления
 */
function testInputManager() {
    if (!window.inputManager) {
        console.error("❌ inputManager не инициализирован!");
        return;
    }
    
    console.log("=== ТЕСТ INPUT MANAGER ===");
    console.log("Текущие нажатые клавиши:", window.inputManager.keys);
    
    // Симуляция нажатий
    window.inputManager.keys['ArrowUp'] = true;
    let dir = window.inputManager.getMovementDirection();
    console.log("ArrowUp: dx=" + dir.dx + ", dy=" + dir.dy);
    window.inputManager.keys['ArrowUp'] = false;
    
    window.inputManager.keys['ArrowDown'] = true;
    dir = window.inputManager.getMovementDirection();
    console.log("ArrowDown: dx=" + dir.dx + ", dy=" + dir.dy);
    window.inputManager.keys['ArrowDown'] = false;
    
    window.inputManager.keys['ArrowLeft'] = true;
    dir = window.inputManager.getMovementDirection();
    console.log("ArrowLeft: dx=" + dir.dx + ", dy=" + dir.dy);
    window.inputManager.keys['ArrowLeft'] = false;
    
    window.inputManager.keys['ArrowRight'] = true;
    dir = window.inputManager.getMovementDirection();
    console.log("ArrowRight: dx=" + dir.dx + ", dy=" + dir.dy);
    window.inputManager.keys['ArrowRight'] = false;
    
    console.log("✅ Тест завершен");
}

/**
 * Функция для проверки состояния физики
 */
function testPhysics() {
    if (!window.physicsEngine) {
        console.error("❌ Компонент physicsEngine не инициализирован!");
        return;
    }

     if (!window.gameState) {
        console.error("❌ Компонент gameState не инициализирован!");
        return;
    }
    
    console.log("=== ТЕСТ PHYSICS ENGINE ===");
    console.log("Позиция игрока:", window.gameState.player);
    console.log("Уровень:", window.engine.level);
    console.log("Размер лабиринта:", window.engine.cols + "x" + window.engine.rows);
    
    // Проверка движения в каждом направлении
    const testDir = [
        { name: "Up", dx: 0, dy: -1 },
        { name: "Down", dx: 0, dy: 1 },
        { name: "Left", dx: -1, dy: 0 },
        { name: "Right", dx: 1, dy: 0 }
    ];
    
    testDir.forEach(dir => {
        const nx = window.gameState.player.x + dir.dx;
        const ny = window.gameState.player.y + dir.dy;
        const isValid = window.physicsEngine.isValidMove(nx, ny, window.engine);
        console.log(`${dir.name} (${nx}, ${ny}): ${isValid ? "✅ Valid" : "❌ Wall"}`);
    });
    
    console.log("✅ Тест завершен");
}

/**
 * Функция для ручного движения
 */
function manualMove(direction) {
    if (!window.gameState || !window.engine) {
        console.error("❌ Игра не инициализирована!");
        return;
    }
    
    let dx = 0, dy = 0;
    
    switch(direction.toLowerCase()) {
        case 'up':
        case 'w': dy = -1; break;
        case 'down':
        case 's': dy = 1; break;
        case 'left':
        case 'a': dx = -1; break;
        case 'right':
        case 'd': dx = 1; break;
    }
    
    const nx = window.gameState.player.x + dx;
    const ny = window.gameState.player.y + dy;
    
    if (window.physicsEngine.isValidMove(nx, ny, window.engine)) {
        window.gameState.player.x = nx;
        window.gameState.player.y = ny;
        console.log(`✅ Переместились на (${nx}, ${ny})`);
    } else {
        console.log(`❌ Не можем переместиться на (${nx}, ${ny}) - стена!`);
    }
}

/**
 * Быстрая отладка всего
 */
function fullDebug() {
    console.clear();
    console.log("╔════════════════════════════════════╗");
    console.log("║  🐛 ПОЛНАЯ ОТЛАДКА SKYNAS MAZE    ║");
    console.log("╚════════════════════════════════════╝");
    
    console.log("\n1️⃣  InputManager:");
    testInputManager();
    
    console.log("\n2️⃣  PhysicsEngine:");
    testPhysics();
    
    console.log("\n3️⃣  Глобальные объекты:");
    console.log("- engine:", !!window.engine);
    console.log("- renderer:", !!window.renderer);
    console.log("- inputManager:", !!window.inputManager);
    console.log("- physicsEngine:", !!window.physicsEngine);
    console.log("- audioManager:", !!window.audioManager);
    console.log("- storyManager:", !!window.storyManager);
    
    console.log("\n4️⃣  Команды для тестирования:");
    console.log("- manualMove('up') - переместиться вверх");
    console.log("- manualMove('down') - переместиться вниз");
    console.log("- manualMove('left') - переместиться влево");
    console.log("- manualMove('right') - переместиться вправо");
    console.log("- testInputManager() - проверить input");
    console.log("- testPhysics() - проверить физику");
    console.log("- debugGameState() - состояние игры");
}

/**
 * Состояние игры
 */
function debugGameState() {
    console.clear();
    console.log("╔════════════════════════════════════╗");
    console.log("║  📊 СОСТОЯНИЕ ИГРЫ                ║");
    console.log("╚════════════════════════════════════╝");
    
    if (!window.gameState || !window.engine) {
        console.error("❌ Игра не инициализирована!");
        return;
    }
    
    console.log("👤 ИГРОК:");
    console.log(`  Позиция: (${window.gameState.player.x}, ${window.gameState.player.y})`);
    console.log(`  На выходе: ${window.gameState.player.x === window.engine.cols - 1 && window.gameState.player.y === window.engine.rows - 1 ? "✅ ДА" : "❌ НЕТ"}`);
    
    console.log("\n🎮 УРОВЕНЬ:");
    console.log(`  Номер: ${window.engine.level}`);
    console.log(`  Размер: ${window.engine.cols}x${window.engine.rows}`);
    console.log(`  Размер ячейки: ${window.engine.cellSize}px`);
    
    console.log("\n🔑 ПРЕДМЕТЫ:");
    console.log(`  Ключ: ${window.engine.hasKey ? "✅ Собран" : "❌ Не собран"}`);
    console.log(`  Позиция ключа: (${window.engine.keyPos.x}, ${window.engine.keyPos.y})`);
    console.log(`  Книга: ${window.engine.hasBook ? "✅ Собрана" : "❌ Не собрана"}`);
    console.log(`  Позиция книги: (${window.engine.bookPos.x}, ${window.engine.bookPos.y})`);
    
    console.log("\n📍 NPC:");
    console.log(`  Количество: ${window.engine.npcPos ? window.engine.npcPos.length : 0}`);
    if (window.engine.npcPos) {
        window.engine.npcPos.forEach((npc, i) => {
            console.log(`  NPC ${i}: (${npc.x}, ${npc.y})`);
        });
    }
    
    console.log("\n🗺️  ПОСЕЩЕННЫЕ КЛЕТКИ: " + window.engine.visitedPath.length);
    
    console.log("\n⌨️  НАЖАТЫЕ КЛАВИШИ:");
    const keys = [];
    for (let k in window.inputManager.keys) {
        if (window.inputManager.keys[k]) keys.push(k);
    }
    console.log(keys.length > 0 ? keys.join(", ") : "Никакие");
}

console.log("💡 Введите 'fullDebug()' в консоль для полной отладки");
