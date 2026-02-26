/**
 * maze-engine.js
 * Основной класс для генерации и логики лабиринта
 */

class MazeEngine {
  constructor() {
    const savedLevel = localStorage.getItem('skynas_maze_level');
    this.level = savedLevel ? parseInt(savedLevel) : 1;
    
    this.mapEngine = new MapEngine();
    this.entityManager = new EntityManager();
    
    this.grid = [];
    this.cols = 0;
    this.rows = 0;
    this.cellSize = 25;
    this.wallTypeMap = {};
    this.activeRooms = [];
    
    this.hasKey = false;
    this.hasBook = false;
    this.visitedPath = [];
    this.cameraZoom = 2.0;
    // Флаг, указывающий, началась ли запись пути после получения книги
    this.pathRecordingStarted = false;
  }

  initLevel() {
    console.log('🎮 engine.initLevel() для уровня', this.level);

    const mapData = this.mapEngine.generateMap(this.level);
    this.grid = mapData.grid;
    this.cols = mapData.cols;
    this.rows = mapData.rows;
    this.wallTypeMap = mapData.wallTypeMap;
    this.activeRooms = mapData.activeRooms;

    this.cellSize = (this.level > 15) ? 25 : (400 / this.cols);

    // Сохраняем предыдущее состояние книги и пути
    const hadBook = this.hasBook;
    const previousPath = [...this.visitedPath]; // Сохраняем копию пути

    // Сбрасываем статусы предметов
    this.hasKey = false;
    this.hasBook = false;

    // Восстанавливаем путь только если книга была получена ранее
    if (hadBook) {
        this.visitedPath = previousPath;
        this.pathRecordingStarted = true;
    } else {
        // Если книга не была получена ранее, путь не сохраняем
        this.visitedPath = [];
        this.pathRecordingStarted = false;
    }

    this.entityManager.spawnAll(this, this.mapEngine);
    
    // Синхронизация для обратной совместимости
    this.treasures = this.entityManager.treasures;
    this.npcPos = this.entityManager.npcPos;
    this.npcTypes = this.entityManager.npcTypes;
    this.enemies = this.entityManager.enemies;
    this.dialogState = this.entityManager.dialogState;
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
