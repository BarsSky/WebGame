// maze-core.js
class MazeEngine {
    constructor() {
        const savedLevel = localStorage.getItem('skynas_maze_level');
        this.level = savedLevel ? parseInt(savedLevel) : 1;
        this.grid = [];
        this.keyPos = { x: 0, y: 0 };
        this.bookPos = { x: 0, y: 0 };
        this.hasKey = false;
        this.hasBook = false;
        this.visitedPath = [];
    }

    initLevel() {
        const baseGridSize = 7;
        const increment = (this.level - 1) * 2;
        this.cols = Math.min(101, baseGridSize + increment);
        this.rows = Math.min(101, baseGridSize + increment);
        
        // Масштабирование: после 15 уровня фиксируем размер ячейки для камеры
        this.cellSize = (this.level > 15) ? 25 : (400 / this.cols);

        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
        this._generate(0, 0);

        if (this.level > 20) {
            this.widenPaths();
        }

        // --- ИСПРАВЛЕНИЕ ВЫХОДА ---
        this.grid[this.rows - 1][this.cols - 1] = 0;
        if (this.rows > 2) this.grid[this.rows - 2][this.cols - 1] = 0;
        if (this.cols > 2) this.grid[this.rows - 1][this.cols - 2] = 0;
        // --------------------------

        this.hasKey = false;
        this.hasBook = false;
        this.visitedPath = [];

        // Координаты выхода для исключения при спавне ключа
        const exitPos = { x: this.cols - 1, y: this.rows - 1 };
        
        // Размещаем КЛЮЧ (исключая старт и выход)
        this.keyPos = this._getRandomEmptyCell([exitPos]);

        if (this.level >= 10) {
            // Размещаем КНИГУ (исключая старт, выход и ключ)
            this.bookPos = this._getRandomEmptyCell([exitPos, this.keyPos]);
        } else {
            this.bookPos = { x: -1, y: -1 };
        }
    }

    _getRandomEmptyCell(excludeList = []) {
        let found = false;
        let kx, ky;
        while (!found) {
            kx = Math.floor(Math.random() * this.cols);
            ky = Math.floor(Math.random() * this.rows);
            
            // Проверка: клетка в исключениях?
            let isExcluded = excludeList.some(p => p.x === kx && p.y === ky);
            
            // Клетка должна быть проходом, не на старте и не в списке исключений
            if (this.grid[ky][kx] === 0 && (kx > 1 || ky > 1) && !isExcluded) {
                found = true;
            }
        }
        return { x: kx, y: ky };
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

    saveProgress() {
        localStorage.setItem('skynas_maze_level', this.level);
    }

    resetProgress() {
        this.level = 1;
        localStorage.setItem('skynas_maze_level', 1);
    }
}