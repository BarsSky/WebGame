/**
 * maze-engine.js
 * Основной класс для генерации и логики лабиринта
 */

class MazeEngine {
    constructor() {
        const savedLevel = localStorage.getItem('skynas_maze_level');
        this.level = savedLevel ? parseInt(savedLevel) : 1;
        this.grid = [];
        this.treasures = []; // Массив для хранения сокровищ
        this.npcPos = [];
        this.hasKey = false;
        this.hasBook = false;
        this.visitedPath = [];
        this.dialogState = {};
    }

    initLevel() {
        console.log('🎮 engine.initLevel() вызвана. inputManager ID ДО инициализации:', window.inputManager?.keysId);
        
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
            this.widenPaths();
        }

        // --- РАСШИРЕННЫЙ ПРОХОД К ВЫХОДУ (3х3 область) ---
        // Это гарантирует, что выход не будет в тупике
        this.grid[this.rows - 1][this.cols - 1] = 0;
        
        if (this.rows > 1) this.grid[this.rows - 2][this.cols - 1] = 0;
        if (this.cols > 1) this.grid[this.rows - 1][this.cols - 2] = 0;
        if (this.rows > 1 && this.cols > 1) this.grid[this.rows - 2][this.cols - 2] = 0;
        
        // Дополнительный проход для 3х3 области
        if (this.rows > 2) this.grid[this.rows - 3][this.cols - 1] = 0;
        if (this.cols > 2) this.grid[this.rows - 1][this.cols - 3] = 0;
        if (this.rows > 2 && this.cols > 1) this.grid[this.rows - 3][this.cols - 2] = 0;
        if (this.rows > 1 && this.cols > 2) this.grid[this.rows - 2][this.cols - 3] = 0;
        // -----------------------------------------------

        this.hasKey = false;
        this.hasBook = false;
        this.treasures = []; // Инициализируем массив сокровищ
        this.visitedPath = [];
        this.npcPos = [];
        this.dialogState = {};

        // Координаты выхода для исключения при спавне сокровищ
        const exitPos = { x: this.cols - 1, y: this.rows - 1 };

        // Размещаем КЛЮЧ (исключая старт и выход)
        const keyPos = this._getRandomEmptyCell([exitPos]);
        this.treasures.push({ type: 'key', pos: keyPos, collected: false });

        if (this.level >= 10) {
            // Размещаем КНИГУ (исключая старт, выход и ключ)
            const bookPos = this._getRandomEmptyCell([exitPos, keyPos]);
            this.treasures.push({ type: 'book', pos: bookPos, collected: false });
        }

        // Спавн NPC на определенных уровнях
        if (this.level >= 25) {
            this.spawnNPCs();
        }
    }

    /**
     * Генерация лабиринта алгоритмом глубины поиска
     */
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

    /**
     * Расширение проходов до ширины 3 клеток (уровни > 20)
     */
    // ... existing code ...

    widenPaths() {
        const newGrid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
        const prob = 0.4 + (this.level - 20) * 0.02;  // 40-60% random expand

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0) {
                    newGrid[y][x] = 0;

                    // Random expand right
                    if (x + 1 < this.cols && Math.random() < prob) newGrid[y][x + 1] = 0;

                    // Random expand down
                    if (y + 1 < this.rows && Math.random() < prob) newGrid[y + 1][x] = 0;

                    // Diagonal for smoothness (lower prob)
                    if (x + 1 < this.cols && y + 1 < this.rows && Math.random() < prob * 0.5) {
                        newGrid[y + 1][x + 1] = 0;
                    }
                }
            }
        }

        // Force preserve exit/key/book
        newGrid[this.rows - 1][this.cols - 1] = 0;
        if (this.keyPos.x >= 0) newGrid[this.keyPos.y][this.keyPos.x] = 0;
        if (this.bookPos.x >= 0) newGrid[this.bookPos.y][this.bookPos.x] = 0;

        this.grid = newGrid;
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

        return found ? { x: kx, y: ky } : { x: this.cols - 2, y: this.rows - 2 };
    }

    /**
     * Спавн NPC персонажей
     */
    spawnNPCs() {
        this.npcPos = [];
        const npcCount = Math.min(3, Math.floor(this.level / 10));

        for (let i = 0; i < npcCount; i++) {
            const npcCell = this._getRandomEmptyCell([
                { x: 0, y: 0 },
                this.keyPos,
                this.bookPos,
                { x: this.cols - 1, y: this.rows - 1 },
                ...this.npcPos
            ]);
            this.npcPos.push(npcCell);
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
