/**
 * render-system.js
 * Единая система рендеринга для игры
 */

class RenderSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hudHeight = 70;
    this.isoFactor = 0;
    this.cameraZoom = 2.0;

    // Подсистемы рендеринга
    this.fogManager = new FogOfWarManager(this.hudHeight);
    this.wallRenderer = new WallRenderer();
    this.playerRenderer = new PlayerRenderer();
    this.entityRenderer = new EntityRenderer();
    this.particleSystem = new ParticleSystem();
    this.uiRenderer = new UIRenderer();
  }

  /**
   * Инициализация рендер системы
   */
  initialize() {
    this.wallRenderer.initialize(this.ctx);
    this.particleSystem.initialize();
  }

  /**
   * Изменение размера холста
   */
  resizeCanvas(engine) {
    const base = window.innerWidth >= 768 ? 600 : 400;
    const actualCellSize =
        engine.level <= 15 ? base / engine.cols : engine.cellSize;

    const dpr = window.devicePixelRatio || 1;
    const w = engine.cols * actualCellSize;
    const h = engine.rows * actualCellSize + this.hudHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);

    engine.cellSize = actualCellSize;
  }

  /**
   * Основной метод рендеринга
   */
  render(engine, player) {
    this.clear();
    const cameraInfo = this.setupCamera(player, engine);

    // Отрисовка основных элементов
    this.drawBackground(engine);
    this.wallRenderer.drawWalls(this.ctx, engine, this.isoFactor);
    this.drawExit(engine);

    // Отрисовка сущностей
    this.entityRenderer.drawAll(this.ctx, engine, this.isoFactor);
    this.playerRenderer.draw(
        this.ctx, cameraInfo.px, cameraInfo.py, engine.cellSize, engine.level);

    // Дополнительные элементы
    if (engine.level >= 15) {
      this.drawBoundaryWall(engine);
    }

    this.particleSystem.updateAndRender(
        this.ctx, engine, cameraInfo.px, cameraInfo.py);

    if (engine.level >= 17) {
      this.drawCompassBeacon(engine, cameraInfo.px, cameraInfo.py);
    }

    this.restore();

    // Применение тумана войны
    if (!window.debugNoFog) {
      this.fogManager.apply(
          this.ctx, this.canvas, cameraInfo.px, cameraInfo.py, engine,
          engine.level);
    } else {
      // Для отладки просто очищаем старый туман (чтобы не оставались артефакты)
      this.ctx.save();
      this.ctx.resetTransform();
      this.ctx.fillStyle =
          'rgba(2,6,23,0.05)';  // лёгкий оттенок, чтобы видно было
      this.ctx.fillRect(
          0, this.hudHeight, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    // Отрисовка UI
    this.uiRenderer.drawHUD(this.ctx, this.canvas, engine);
  }

  /**
   * Очистка холста
   */
  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
  }

  /**
   * Настройка камеры
   */
  setupCamera(player, engine) {
    const dpr = window.devicePixelRatio || 1;
    const targetIso = Math.min(1, Math.max(0, (engine.level - 15) / 20));
    this.isoFactor = this.isoFactor * 0.92 + targetIso * 0.08;

    const px = player.x * engine.cellSize + engine.cellSize / 2;
    const py = player.y * engine.cellSize + engine.cellSize / 2;

    this.ctx.save();
    this.ctx.translate(0, this.hudHeight);

    if (engine.level >= 15) {
      const zoom = 1.15 + this.isoFactor * 0.25;
      const camX = (this.canvas.width / dpr / 2) - px * zoom;
      // Исправленный расчет camY: вычитаем половину HUD высоты
      const camY = (this.canvas.height / dpr / 2 - this.hudHeight / 2) -
          py * zoom + this.isoFactor * 35;

      // Псевдоизометрическая трансформация (стиль Hades)
      if (engine.level >= 25) {
        // Наклон и поворот для 2.5D эффекта
        this.ctx.transform(1, 0.5 * this.isoFactor, 0, 1, 0, 0);
      }

      this.ctx.translate(camX, camY);
      this.ctx.scale(zoom, zoom);
    }

    return {px, py};
  }

  /**
   * Восстановление контекста
   */
  restore() {
    this.ctx.restore();
  }

  /**
   * Отрисовка фона
   */
  drawBackground(engine) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(
        0, 0, engine.cols * engine.cellSize, engine.rows * engine.cellSize);
  }

  /**
   * Отрисовка выхода
   */
  drawExit(engine) {
    const exitSize = engine.cellSize * 0.6;
    const offset = (engine.cellSize - exitSize) / 2;
    this.ctx.fillStyle = engine.hasKey ? '#10b981' : '#475569';
    this.ctx.shadowBlur = engine.hasKey ? 15 : 0;
    this.ctx.shadowColor = '#10b981';
    this.ctx.fillRect(
        (engine.cols - 1) * engine.cellSize + offset,
        (engine.rows - 1) * engine.cellSize + offset, exitSize, exitSize);
    this.ctx.shadowBlur = 0;
  }

  /**
   * Умный маячок: сначала к ближайшему несобранному предмету, потом к выходу
   */
  drawCompassBeacon(engine, playerX, playerY) {
    if (engine.level < 17) return;

    let targetX, targetY, color = '#10b981';

    // 1. Ищем ближайший несобранный предмет
    let nearestItem = null;
    let minDist = Infinity;

    engine.treasures.forEach(item => {
      if (item.collected) return;
      const dx = item.pos.x * engine.cellSize + engine.cellSize / 2 - playerX;
      const dy = item.pos.y * engine.cellSize + engine.cellSize / 2 - playerY;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nearestItem = item;
        targetX = item.pos.x * engine.cellSize + engine.cellSize / 2;
        targetY = item.pos.y * engine.cellSize + engine.cellSize / 2;

        // Цвет по типу предмета
        color = item.type === 'key' ? '#fbbf24' : '#a855f7';
      }
    });

    // 2. Если предметов нет — ведём к выходу
    if (!nearestItem) {
      targetX = (engine.cols - 1) * engine.cellSize + engine.cellSize / 2;
      targetY = (engine.rows - 1) * engine.cellSize + engine.cellSize / 2;
      color = '#10b981';  // зелёный выход
    }

    // Рисуем маячок
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const centerX = this.canvas.width / 2;
    const centerY = (this.canvas.height - this.hudHeight) / 2 + this.hudHeight;

    this.ctx.save();
    this.ctx.resetTransform();

    const beaconSize = Math.max(6, 14 * (1 - distance / 800));
    const alpha = Math.max(0.4, 1 - distance / 1200);

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 25;
    this.ctx.shadowColor = color;

    this.ctx.beginPath();
    this.ctx.arc(
        centerX + dx * 0.12, centerY + dy * 0.12, beaconSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Маленькая стрелка направления
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX + dx * 0.08, centerY + dy * 0.08);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Отрисовка границы лабиринта
   */
  drawBoundaryWall(engine) {
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
        -engine.cellSize / 2, -engine.cellSize / 2,
        (engine.cols + 1) * engine.cellSize,
        (engine.rows + 1) * engine.cellSize);
  }

  /**
   * Добавление частиц
   */
  addParticles(x, y, color) {
    this.particleSystem.addParticle(x, y, color);
  }

  /**
   * Обновление частиц
   */
  updateParticles(engine) {
    this.particleSystem.update(engine);
  }
}

/**
 * Подсистема рендеринга стен
 */
class WallRenderer {
  constructor() {
    this.wallPatterns = {};
  }

  /**
   * Инициализация рендерера стен
   */
  initialize(ctx) {
    this.createWallPatterns(ctx);
  }

  /**
   * Создание паттернов для стен
   */
  createWallPatterns(ctx) {
    // Паттерн 1
    const b = document.createElement('canvas');
    b.width = b.height = 32;
    const bc = b.getContext('2d');
    bc.fillStyle = '#1e293b';
    bc.fillRect(0, 0, 32, 32);
    bc.fillStyle = '#334155';
    bc.fillRect(2, 2, 28, 12);
    bc.fillRect(2, 18, 12, 12);
    bc.fillRect(18, 18, 12, 12);
    this.wallPatterns[1] = ctx.createPattern(b, 'repeat');

    // Паттерн 2
    const s = document.createElement('canvas');
    s.width = s.height = 32;
    const sc = s.getContext('2d');
    sc.fillStyle = '#475569';
    sc.fillRect(0, 0, 32, 32);
    sc.fillStyle = '#334155';
    sc.fillRect(4, 4, 24, 8);
    sc.fillRect(4, 20, 12, 8);
    this.wallPatterns[2] = ctx.createPattern(s, 'repeat');
  }

  /**
   * Отрисовка стен
   */
  drawWalls(ctx, engine, isoFactor) {
    // 1. Сначала рисуем лицевые грани и тени для всех стен (Z-order)
    if (engine.level >= 25) {
      for (let y = 0; y < engine.rows; y++) {
        for (let x = 0; x < engine.cols; x++) {
          if (engine.grid[y][x] !== 1) continue;

          const typeId = engine.wallTypeMap[`${x}_${y}`] || 1;
          const cfg = MAZE_REGISTRY.wallTypes[typeId];

          let sx = x * engine.cellSize + (cfg.isoOffset?.x || 0) * isoFactor;
          let sy = y * engine.cellSize + (cfg.isoOffset?.y || 0) * isoFactor;

          // Тень под стеной
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(
              sx, sy + engine.cellSize, engine.cellSize,
              engine.cellSize * 0.4 * isoFactor);

          // Лицевая грань (объем)
          ctx.fillStyle = cfg.color || '#334155';
          ctx.fillRect(
              sx, sy + engine.cellSize * 0.1, engine.cellSize,
              engine.cellSize * 0.9);
        }
      }
    }

    // 2. Затем рисуем "крыши" стен поверх граней
    for (let y = 0; y < engine.rows; y++) {
      for (let x = 0; x < engine.cols; x++) {
        if (engine.grid[y][x] !== 1) continue;

        const typeId = engine.wallTypeMap[`${x}_${y}`] || 1;
        const cfg = MAZE_REGISTRY.wallTypes[typeId];

        let sx = x * engine.cellSize + (cfg.isoOffset?.x || 0) * isoFactor;
        let sy = y * engine.cellSize + (cfg.isoOffset?.y || 0) * isoFactor;

        if (cfg.sprite) {
          ctx.fillStyle = cfg.color || '#475569';
        } else {
          ctx.fillStyle = this.wallPatterns[typeId] || this.wallPatterns[1];
        }

        ctx.fillRect(sx, sy, engine.cellSize + 1, engine.cellSize + 1);
      }
    }
  }
}

/**
 * Подсистема рендеринга сущностей
 */
class EntityRenderer {
  /**
   * Отрисовка всех сущностей
   */
  drawAll(ctx, engine, isoFactor) {
    // Используем существующий EntityManager для отрисовки
    engine.entityManager.drawAll(ctx, engine, isoFactor);
  }
}

/**
 * Подсистема рендеринга частиц
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Инициализация системы частиц
   */
  initialize() {
    // Ничего не нужно для этой системы
  }

  /**
   * Добавление частицы
   */
  addParticle(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      color: color,
      life: 1.0,
      decay: 0.02,
      size: Math.random() * 3 + 2,
      velocity: {x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2}
    });
  }

  /**
   * Обновление системы частиц
   */
  update(engine) {
    // Удаление устаревших частиц
    this.particles = this.particles.filter(particle => particle.life > 0);
  }

  /**
   * Обновление и отрисовка частиц
   */
  updateAndRender(ctx, engine, playerX, playerY) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Обновление свойств частицы
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.life -= p.decay;

      // Отрисовка частицы
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Удаление, если жизнь закончилась
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

/**
 * Подсистема рендеринга UI
 */
class UIRenderer {
  /**
   * Отрисовка HUD
   */
  drawHUD(ctx, canvas, engine) {
    ctx.save();
    ctx.resetTransform();

    // Фон HUD
    ctx.fillStyle = 'rgba(2,6,23,0.95)';
    ctx.fillRect(0, 0, canvas.width, 70);

    const hasKey = engine.hasKey;
    const hasBook = engine.hasBook;

    // Номер уровня
    ctx.font = 'bold 28px system-ui';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText(`LVL ${engine.level}`, 30, 48);

    // Ключ и книга
    if (hasKey) this.drawIcon(ctx, 220, 42, '🔑', '#fbbf24');
    if (hasBook) this.drawIcon(ctx, 290, 42, '📖', '#a855f7');

    // Нижние панели уже есть в createBottomPanels()

    ctx.restore();
  }

  /**
   * Отрисовка иконки
   */
  drawIcon(ctx, x, y, emoji, color) {
    ctx.font = '42px system-ui';
    ctx.fillStyle = color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillText(emoji, x, y);
    ctx.shadowBlur = 0;
  }
}

// Экспортируем классы (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.RenderSystem = RenderSystem;
  window.WallRenderer = WallRenderer;
  window.EntityRenderer = EntityRenderer;
  window.ParticleSystem = ParticleSystem;
  window.UIRenderer = UIRenderer;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports =
      {RenderSystem, WallRenderer, EntityRenderer, ParticleSystem, UIRenderer};
}