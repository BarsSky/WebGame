/**
 * constants.js
 * Константы и конфигурационные значения для игры
 */

const GAME_CONSTANTS = {
  // Игровые параметры
  PLAYER: {
    DEFAULT_SPEED: 1.0,
    MAX_SPEED: 3.0,
    MIN_SPEED: 0.5
  },
  
  // Размеры и масштабирование
  CANVAS: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    ASPECT_RATIO: 4 / 3
  },
  
  CELL: {
    DEFAULT_SIZE: 25,
    MIN_SIZE: 15,
    MAX_SIZE: 50,
    SIZE_FOR_SMALL_LEVELS: 400  // Used for dynamic sizing in smaller levels
  },
  
  LEVEL: {
    CHARACTER_SELECT_LEVEL: 22,
    NPC_SPAWN_LEVEL: 25,
    ENEMY_SPAWN_LEVEL: 15,
    BOOK_SPAWN_LEVEL: 10,
    CELL_SIZE_DYNAMIC_THRESHOLD: 15,  // Level threshold for dynamic cell sizing
    MAX_LEVEL: 50
  },
  
  VISIBILITY: {
    WIDE_LEVEL_THRESHOLD: 5,
    MEDIUM_LEVEL_THRESHOLD: 10,
    NARROW_LEVEL_THRESHOLD: 15
  },
  
  // Аудио
  AUDIO: {
    VOLUME_STEP: 0.1,
    DEFAULT_VOLUME: 0.5,
    MAX_VOLUME: 1.0
  },
  
  // Локализация
  LOCALE: {
    DEFAULT_LANGUAGE: 'ru',
    SUPPORTED_LANGUAGES: ['ru', 'en']
  },
  
  // Хранение данных
  STORAGE: {
    PREFIX: 'skynas_maze_',
    LEVEL_KEY: 'skynas_maze_level',
    STORIES_KEY: 'skynas_stories',
    CHAR_SELECT_KEY: 'charSelectShown_22',
    PROGRESS_KEYS: {
      LEVEL: 'level',
      COMPLETED_STAGES: 'stages',
      CHARACTER_CHOICE: 'character'
    }
  },
  
  // Тайминги
  TIMING: {
    WIN_DELAY_MS: 2000,
    CHARACTER_SELECT_DELAY_MS: 800,
    ANIMATION_FRAME_RATE: 60,
    PARTICLE_LIFETIME: 1000
  },
  
  // Цвета
  COLORS: {
    PARTICLE_DEFAULT: '#00d2ff',
    PARTICLE_COLLECT: '#fbbf24',
    WIN_MESSAGE_BG: 'rgba(0, 0, 0, 0.8)',
    WIN_MESSAGE_TEXT: '#ffffff'
  },
  
  // Игровые механики
  MECHANICS: {
    PATH_RECORDING_AFTER_BOOK: true,
    NPC_DIALOGUES_ENABLED: true,
    ENEMY_COLLISION_DAMAGE: 10,
    ITEM_COLLECTION_DISTANCE: 1.5
  }
};

// Экспортируем константы (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.GAME_CONSTANTS = GAME_CONSTANTS;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_CONSTANTS;
}