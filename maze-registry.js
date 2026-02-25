/**
 * maze-registry.js
 * Реестр всех существ, их характеристик и ролей
 */
const MAZE_REGISTRY = {
  // Игровые персонажи
  players: {
    'cat': {
      id: 'cat',
      name: 'Шу',
      preview: 'sprites/cat_preview.png',
      spriteSheets:
          {idle: 'sprites/cat_sit.png', walk: 'sprites/cat_run_left.png'},
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {cols: 5, frames: 25, speed: 0},
          walk: {cols: 8, frames: 25, speed: 5, mirrorForRight: true}
        }
      },
      stats: {speed: 1.0}
    },
    'dog': {
      id: 'dog',
      name: 'Сиба',
      preview: 'sprites/dog_preview.png',
      spriteSheets: {
        idle: 'sprites/dog_sit.png',
        walk: 'sprites/dog_walk.png',
        accelerate: 'sprites/dog_acceselerate.png'
      },
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {cols: 5, frames: 25, speed: 0},
          walk: {cols: 8, frames: 25, speed: 7},
          accelerate: {cols: 8, frames: 8, speed: 4}
        }
      },
      stats: {speed: 0.8}
    },
    'bird': {
      id: 'bird',
      name: 'Стриж',
      preview: 'sprites/bird_preview.png',
      spriteSheets: {
        idle: 'sprites/bird_preview.png',
        walk: 'sprites/bird_fly.png',
        accelerate: 'sprites/bird_accesl.png'
      },
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {cols: 5, frames: 25, speed: 10},
          walk: {cols: 5, frames: 25, speed: 6},
          accelerate: {cols: 5, frames: 5, speed: 3}
        }
      },
      stats: {speed: 1.2}
    }
  },

  // Неигровые персонажи (NPC)
  npcs: {
    'wanderer': {
      name: 'Странник',
      sprite: 'sprites/npc_wanderer.png',
      role: 'guide',  // Роль: дает подсказки о пути
      dialogs: [
        'Кто ты, скиталец в лабиринте?', 'Я помню эти стены... столько лет...',
        'Если ищешь выход, будь осторожен...'
      ]
    },
    'guardian': {
      name: 'Хранитель',
      sprite: 'sprites/npc_guardian.png',
      role: 'gatekeeper',  // Роль: охраняет информацию о ключе
      dialogs: [
        'Добро пожаловать в мой дом...', 'Ключ надежно спрятан, найди его!',
        'Выход откроется только достойному.'
      ]
    }
  },
  //// Enemies (для будущих расширений)
  enemies: {
    'ghost': {
      id: 'ghost',
      name: 'Призрак',
      sprite: 'sprites/enemy_ghost.png',
      behavior: 'patrol',  // Тип поведения
      stats: {speed: 0.5, damage: 10},
      description: 'Летает по заданному маршруту.'
    },
    'hunter': {
      id: 'hunter',
      name: 'Охотник',
      sprite: 'sprites/enemy_hunter.png',
      behavior: 'chase',  // Тип поведения
      stats: {speed: 0.7, aggroRadius: 5},
      description: 'Преследует игрока, если тот подойдет слишком близко.'
    }
  },
  roomTypes: {
    'common': {
      size: 3,
      rarity: 0.7,  // Вероятность генерации в тупике
      possibleContent: ['coin', 'nothing'],
      color: 'rgba(255, 255, 255, 0.05)'
    },
    'treasure': {
      size: 3,
      rarity: 0.2,
      possibleContent: ['key', 'chest'],
      color: 'rgba(251, 191, 36, 0.1)'
    },
    'npc_dwelling': {
      size: 5,
      rarity: 0.1,
      possibleContent: ['npc'],
      color: 'rgba(168, 85, 247, 0.1)'
    }
  },
  wallTypes: {
    1: {
      // Кирпич (уровни 1-15)
      name: 'brick',
      pattern: 'brick',
      isoOffset: {x: 0, y: 0}
    },
    2: {
      // Камень (уровни 16-25)
      name: 'stone',
      pattern: 'stone',
      color: '#475569',
      isoOffset: {x: 6, y: -8}
    },
    3: {
      // Руины (уровни 26+)
      name: 'ruins',
      pattern: null,
      color: '#334155',
      isoOffset: {x: 12, y: -14},
      sprite: 'sprites/wall_ruins.png',
      animationFrames: 3
    }
  },

  items: {
    'key': {
      name: 'Ключ',
      sprite: 'sprites/item_key.png',  // анимированный спрайт
      frames: 25,
      animSpeed: 1,
      color: '#fbbf24',  // fallback
      action: 'collect_key',
      sound: 'get'
    },
    'book': {
      name: 'Книга Знаний',
      sprite: 'sprites/item_book.png',
      frames: 25,
      animSpeed: 1,
      color: '#a855f7',
      action: 'collect_book',
      sound: 'get'
    }
  }
};

window.MAZE_REGISTRY = MAZE_REGISTRY;