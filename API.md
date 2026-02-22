# 📖 API СПРАВКА

## 🎲 MazeEngine

```javascript
// Основной класс для генерации и управления лабиринтом

engine.level                    // Текущий уровень
engine.cols, engine.rows        // Размеры сетки
engine.grid[y][x]              // 0 = проход, 1 = стена
engine.cellSize                // Размер ячейки в пиксельх

engine.hasKey                  // Есть ли ключ
engine.hasBook                 // Есть ли книга
engine.keyPos, engine.bookPos   // Позиции предметов

engine.npcPos[]                // Массив позиций NPC
engine.visitedPath[]           // Пройденный путь (для книги)

// Методы
engine.initLevel()             // Инициализировать уровень
engine.widenPaths()            // Расширить пути (уровни > 20)
engine.saveProgress()          // Сохранить уровень в localStorage
engine.resetProgress()         // Вернуться на уровень 1
engine.spawnNPCs()             // Спавнить NPC персонажей
```

## 🎨 MazeRenderer

```javascript
// Класс для отрисовки всех визуальных элементов

renderer.canvas                // HTML Canvas элемент
renderer.ctx                   // 2D контекст canvas
renderer.wallPattern           // Текстура стен
renderer.particleSystem[]      // Система частиц

// Методы
renderer.initialize()          // Создать текстуру стен
renderer.resizeCanvas(engine)  // Изменить размер canvas
renderer.draw(engine, player)  // Основная отрисовка

// Приватные методы (используются внутри draw)
renderer.drawExit(engine)
renderer.drawItem(pos, color, engine)
renderer.drawNPCs(engine)
renderer.drawPlayer(px, py, engine)
renderer.applyFog(px, py, engine)
renderer.applyFogWithBook(px, py, engine, radius)
renderer.applyFogNormal(px, py, engine, radius)

renderer.addParticles(x, y, color, count)
renderer.updateParticles(engine)
```

## ⌨️ InputManager

```javascript
// Обработка ввода от клавиатуры и сенсорных кнопок

input.keys                     // Объект с состоянием клавиш
input.lastMoveTime             // Время последнего движения

// Методы
input.initialize()             // Подключить слушатели
input.setupButtonControls()    // Настроить UI кнопки
input.getMovementDirection()   // Получить { dx, dy }
```

## 🔊 AudioManager

```javascript
// Синтез и воспроизведение звуков

audio.audioContext             // Web Audio API контекст
audio.enabled                  // Разрешены ли звуки

// Методы
audio.initialize()             // Инициализировать контекст
audio.play(type)               // Воспроизвести звук
// type: 'lock' | 'step' | 'win' | 'get' | 'interact'

// Приватные методы (разные звуки)
audio.soundLock(osc, gain)
audio.soundStep(osc, gain)
audio.soundWin(osc, gain)
audio.soundGet(osc, gain)
audio.soundInteract(osc, gain)
```

## ⚙️ PhysicsEngine

```javascript
// Обработка физики, движения и коллизий

physics.lastMoveTime           // Время последнего хода

// Методы
physics.updateMovement(player, engine, input, timestamp)
// Возвращает: { moved: bool, blocked: bool }

physics.isValidMove(x, y, engine)
// Проверить, можно ли пройти в клетку

physics.recordVisitedPath(player, engine)
// Запомнить посещенную клетку

physics.checkCollisions(player, engine, audio, story)
// Проверить сбор предметов и взаимодействие с NPC
// Возвращает: [] собранных предметов

physics.checkWinCondition(player, engine)
// Проверить достижение выхода с ключом
// Возвращает: boolean
```

## 📖 StoryManager

```javascript
// Управление сюжетом, диалогами и взаимодействиями

story.unlockedStories          // Set разблокированных историй
story.dialogActive             // Идет ли диалог

// Методы
story.loadProgress()           // Загрузить истории из localStorage
story.saveProgress()           // Сохранить истории
story.checkLevelStory(level)   // Показать историю уровня если новая
story.interactWithNPC(npcIndex) // Показать диалог NPC
story.showDialogBox(name, text) // Показать диалоговое окно
story.showStoryDialog(title, text) // Показать большую историю
story.getStoryProgress()       // Получить { total, unlocked }
```

## 🚀 Главное Состояние (maze-main.js)

```javascript
// Объект состояния игры
gameState.player               // { x, y } позиция игрока
gameState.paused              // Игра на паузе?

// Глобальные менеджеры
engine                        // MazeEngine
renderer                      // MazeRenderer
inputManager                  // InputManager
audioManager                  // AudioManager
physicsEngine                 // PhysicsEngine
storyManager                  // StoryManager

// Главные функции
initGame()                    // Инициализация всей игры
setupGame()                   // Настройка нового уровня
gameLoop(timestamp)           // Основной цикл (requestAnimationFrame)
handleWin()                   // Обработка победы
updateUI()                    // Обновить UI элементы
resetGame()                   // Перезагрузить игру
```

## 🎯 Типичная Последовательность Вызовов

```javascript
// При загрузке страницы
1. initGame()
   - new MazeEngine()
   - new MazeRenderer()
   - inputManager.initialize()
   - audioManager.initialize()
   
2. setupGame()
   - engine.initLevel()
   - renderer.resizeCanvas()
   - engine.spawnNPCs()
   
3. requestAnimationFrame(gameLoop)
   - updateMovement()
   - checkCollisions()
   - checkWinCondition()
   - renderer.draw()
   - updateUI()
```

## 💾 localStorage API

```javascript
// Сохранение
localStorage.setItem('skynas_maze_level', '25')
localStorage.setItem('skynas_stories', '["level_10","npc_0"]')

// Загрузка
const level = parseInt(localStorage.getItem('skynas_maze_level'))
const stories = JSON.parse(localStorage.getItem('skynas_stories'))

// Очистка
localStorage.removeItem('skynas_maze_level')
localStorage.clear()
```

## 🎨 Canvas Координаты

```javascript
// Преобразование из сетки в пиксели
pixelX = gridX * cellSize + cellSize / 2
pixelY = gridY * cellSize + cellSize / 2

// Преобразование из пикселей в сетку
gridX = Math.floor(pixelX / cellSize)
gridY = Math.floor(pixelY / cellSize)
```

## 🐛 Отладка

```javascript
// В консоли браузера можно проверить:
console.log(engine.level)              // Текущий уровень
console.log(engine.grid)               // Лабиринт
console.log(gameState.player)          // Позиция игрока
console.log(engine.hasKey)             // Есть ли ключ
console.log(engine.npcPos)             // Позиции NPC
console.log(storyManager.unlockedStories) // Историии
```

## 📊 Размеры на Уровнях

```javascript
// Базовая формула: 7 + (уровень - 1) * 2, максимум 101x101

Уровень 1:  7x7 сетка
Уровень 5:  13x13 сетка
Уровень 10: 23x23 сетка
Уровень 15: 33x33 сетка
Уровень 20: 43x43 сетка
Уровень 30: 63x63 сетка
Уровень 50: 101x101 сетка (максимум)
```

## ⚡ Производительность

```javascript
// Основные операции и их стоимость:

engine.initLevel()           // ~5-10ms (зависит от размера)
renderer.draw()              // ~2-5ms (зависит от уровня)
physics.updateMovement()     // <1ms
physics.checkCollisions()    // <1ms
```

---

**Версия API: 2.0**  
**Последнее обновление: 2026**
