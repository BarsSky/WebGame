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
      stats: {speed: 1.0},
      spriteSheets: {
        preview: 'sprites/cat_preview.png',  // Для выбора персонажа
        idle: 'sprites/cat_sit.png',
        walk: 'sprites/cat_run_left.png'
      },
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {sheet: 'idle', cols: 5, frames: 5, speed: 0, baseRow: 0},
          walk: {
            sheet: 'walk',
            cols: 5,
            frames: 5,
            speed: 5,
            baseRow: 0,
            mirrorForRight: true
          }
        }
      }
    },
    'dog': {
      id: 'dog',
      name: 'Сиба',
      stats: {speed: 0.8},
      spriteSheets: {
        preview: 'sprites/dog_preview.png',  // Для выбора персонажа
        idle: 'sprites/dog_sit.png',         // или dog_steady.png
        walk: 'sprites/dog_walk.png',
        accelerate: 'sprites/dog_acceselerate.png'
      },
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {sheet: 'idle', cols: 5, frames: 5, speed: 1, baseRow: 0},
          walk: {sheet: 'walk', cols: 5, frames: 5, speed: 1, baseRow: 0},
          accelerate:
              {sheet: 'accelerate', cols: 5, frames: 2, speed: 1, baseRow: 0}
        }
      }
    },
    'bird': {
      id: 'bird',
      name: 'Стриж',
      stats: {speed: 1.2},
      spriteSheets: {
        preview: 'sprites/bird_preview.png',  // Для выбора персонажа
        idle: 'sprites/bird_preview.png',
        walk: 'sprites/bird_fly.png',
        accelerate: 'sprites/bird_accesl.png'
      },
      animationConfig: {
        frameWidth: 256,
        frameHeight: 256,
        states: {
          idle: {sheet: 'idle', cols: 5, frames: 4, speed: 2, baseRow: 0},
          walk: {sheet: 'walk', cols: 5, frames: 5, speed: 2, baseRow: 0},
          accelerate:
              {sheet: 'accelerate', cols: 5, frames: 5, speed: 3, baseRow: 0}
        }
      }
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
  items: {
    'key':
        {name: 'Ключ', color: '#10b981', action: 'collect_key', sound: 'get'},
    'book': {
      name: 'Книга Знаний',
      color: '#60a5fa',
      action: 'collect_book',
      sound: 'get'
    },
    'coin':
        {name: 'Монета', color: '#fde047', action: 'add_score', sound: 'get'}
  }
};

window.MAZE_REGISTRY = MAZE_REGISTRY;