# Стиль кодирования для проекта Maze Game

## Общие принципы
- Использовать camelCase для имен переменных, функций и методов
- Использовать PascalCase для имен классов
- Использовать UPPER_SNAKE_CASE для констант
- Использовать глаголы в начале имен функций для обозначения действия
- Использовать существительные или прилагательные с префиксом is/has для булевых значений

## Именование переменных
```javascript
// Хорошо
let playerPosition = { x: 0, y: 0 };
let hasKey = false;
let isVisible = true;
const MAX_PLAYERS = 4;

// Плохо
let player_pos = { x: 0, y: 0 };
let keyStatus = false;
var MAX_PLAYERS_COUNT = 4;
```

## Именование функций
```javascript
// Хорошо
function getPlayerPosition() { }
function updateGameState() { }
function isCollisionDetected() { }
function calculateDistance(a, b) { }

// Плохо
function get_player_pos() { }
function update_state() { }
function collision_check() { }
function dist_calc(a, b) { }
```

## Именование классов
```javascript
// Хорошо
class PlayerController { }
class GameStateManager { }
class CollisionDetector { }

// Плохо
class player_controller { }
class game_state { }
class ColDet { }
```

## Именование файлов
- Использовать kebab-case для имен файлов
- Имя файла должно отражать основной класс или функцию в нем
- Расширение .js для JavaScript файлов

Примеры:
```
// Хорошо
player-controller.js
game-state-manager.js
collision-detector.js

// Плохо
PlayerController.js
gamestate.js
col_det.js
```

## Структура проекта
```
project/
├── core/           # Основные игровые системы
├── entities/       # Игровые сущности
├── ui/             # Компоненты пользовательского интерфейса
├── utils/          # Вспомогательные утилиты
├── audio/          # Аудио системы
└── locales/        # Файлы локализации
```

## Практики написания кода
- Использовать const по умолчанию, let когда необходимо
- Избегать var
- Использовать стрелочные функции для коротких функций без своего контекста
- Использовать деструктуризацию для удобного доступа к свойствам объектов
- Добавлять JSDoc комментарии для публичных API
- Использовать осмысленные имена даже если они длинные