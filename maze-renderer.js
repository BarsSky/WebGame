/**
 * maze-renderer.js
 * Отрисовка лабиринта, UI и визуальные эффекты
 */

class MazeRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.wallPattern = null;
    this.particleSystem = [];
  this.hudHeight = 70;
  }

  initialize() {
    this.createWallPattern();
  }

  createWallPattern() {
    this.wallPatterns = {};
    // brick
    const b = document.createElement('canvas'); b.width = b.height = 32;
    const bc = b.getContext('2d');
    bc.fillStyle = '#1e293b'; bc.fillRect(0,0,32,32);
    bc.fillStyle = '#334155'; bc.fillRect(2,2,28,12); bc.fillRect(2,18,12,12); bc.fillRect(18,18,12,12);
    this.wallPatterns[1] = this.ctx.createPattern(b, 'repeat');

    // stone
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const sc = s.getContext('2d');
    sc.fillStyle = '#475569'; sc.fillRect(0,0,32,32);
    sc.fillStyle = '#334155'; sc.fillRect(4,4,24,8); sc.fillRect(4,20,12,8);
    this.wallPatterns[2] = this.ctx.createPattern(s, 'repeat');
  }

  resizeCanvas(engine) {
    const base = window.innerWidth >= 768 ? 600 : 400;
    if (engine.level <= 15) engine.cellSize = base / engine.cols;

    const dpr = window.devicePixelRatio || 1;
    const w = engine.cols * engine.cellSize;
    const h = engine.rows * engine.cellSize + this.hudHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
  }

  draw(engine, player) {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    const targetIso = Math.min(1, Math.max(0, (engine.level - 15) / 20));
    engine.isoFactor = (engine.isoFactor || 0) * 0.92 + targetIso * 0.08;

    const px = player.x * engine.cellSize + engine.cellSize / 2;
    const py = player.y * engine.cellSize + engine.cellSize / 2;

    this.ctx.save();
    this.ctx.translate(0, this.hudHeight);

    if (engine.level > 15) {
      const zoom = 1.15 + engine.isoFactor * 0.25;
      const camX = (this.canvas.width / dpr / 2) - px * zoom;
      const camY = (this.canvas.height / dpr / 2) - py * zoom + engine.isoFactor * 35;
      this.ctx.translate(camX, camY);
      this.ctx.scale(zoom, zoom);
    }

    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, engine.cols * engine.cellSize, engine.rows * engine.cellSize);

    this.drawWalls(engine);
    this.drawExit(engine);
    this.drawTreasures(engine);
    this.drawNPCs(engine);
    this.drawPlayer(px, py, engine);

    if (engine.level > 15) this.drawBoundaryWall(engine);

    this.updateParticles(engine, px, py);
    if (engine.level >= 17) this.drawCompassBeacon(engine, px, py);

    this.ctx.restore();

    this.applyFog(px, py, engine);
    this.drawHUD(engine);
  }

  drawHUD(engine) {
    this.ctx.save();
    this.ctx.resetTransform();

    // Фон HUD
    this.ctx.fillStyle = 'rgba(2,6,23,0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.hudHeight);

    const hasKey = engine.hasKey;
    const hasBook = engine.hasBook;

    // Номер уровня
    this.ctx.font = 'bold 28px system-ui';
    this.ctx.fillStyle = '#00d2ff';
    this.ctx.fillText(`LVL ${engine.level}`, 30, 48);

    // Ключ и книга
    if (hasKey) this.drawIcon(220, 42, '🔑', '#fbbf24');
    if (hasBook) this.drawIcon(290, 42, '📖', '#a855f7');

    // Нижние панели уже есть в createBottomPanels()

    this.ctx.restore();
  }

  drawIcon(x, y, emoji, color) {
    this.ctx.font = '42px system-ui';
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = color;
    this.ctx.fillText(emoji, x, y);
    this.ctx.shadowBlur = 0;
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


  drawBar(x, y, w, h, value, color, label) {
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w * (value / 100), h);
    this.ctx.font = '14px system-ui';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(label, x + 8, y + 14);
  }

  // === НОВАЯ ОТРИСОВКА СТЕН ===
  drawWalls(engine) {
    for (let y = 0; y < engine.rows; y++) {
      for (let x = 0; x < engine.cols; x++) {
        if (engine.grid[y][x] !== 1) continue;

        const typeId = engine.wallTypeMap[`${x}_${y}`] || 1;
        const cfg = MAZE_REGISTRY.wallTypes[typeId];

        let sx = x * engine.cellSize;
        let sy = y * engine.cellSize;

        // изометрический сдвиг
        sx += (cfg.isoOffset?.x || 0) * engine.isoFactor;
        sy += (cfg.isoOffset?.y || 0) * engine.isoFactor;

        if (cfg.sprite) {
          // TODO: добавить спрайт-отрисовку стен (можно потом)
          this.ctx.fillStyle = cfg.color || '#475569';
        } else {
          this.ctx.fillStyle = this.wallPatterns[typeId] || this.wallPattern;
        }

        this.ctx.fillRect(
            sx, sy, engine.cellSize + 1,
            engine.cellSize + 1);  // +1 убирает щели
      }
    }
  }

  /**
   * Отрисовка предмета
   */
  drawItem(pos, color, engine) {
    const size = engine.cellSize * 0.4;
    const offset = (engine.cellSize - size) / 2;
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.fillRect(
        pos.x * engine.cellSize + offset, pos.y * engine.cellSize + offset,
        size, size);
    this.ctx.shadowBlur = 0;
  }

  /**
   * Отрисовка сокровищ
   */
  drawTreasures(engine) {
    engine.treasures.forEach(item => {
      if (item.collected) return;

      const config = MAZE_REGISTRY.items[item.type];
      if (!config.sprite) {
        // старый цветной квадрат
        this.drawItem(item.pos, config.color, engine);
        return;
      }

      const px = item.pos.x * engine.cellSize + engine.cellSize / 2;
      const py = item.pos.y * engine.cellSize + engine.cellSize / 2;

      // Анимация предмета
      const frame = Math.floor(Date.now() / config.animSpeed) % config.frames;
      // Здесь можно использовать тот же SpriteManager или отдельный
      // drawAnimatedSprite Для простоты пока рисуем как sprite (добавь в
      // SpriteManager метод drawStatic)

      this.ctx.save();
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = config.color;

      // Пример: если у тебя есть spriteManager
      if (window.spriteManager) {
        window.spriteManager.drawAnimatedItem(
            this.ctx, px, py, engine.cellSize * 0.75, config);
      } else {
        this.drawItem(item.pos, config.color, engine);
      }

      this.ctx.restore();
    });
  }

  /**
   * Отрисовка NPC персонажей
   */
  drawNPCs(engine) {
    engine.npcPos.forEach((pos, idx) => {
      const px = pos.x * engine.cellSize + engine.cellSize / 2;
      const py = pos.y * engine.cellSize + engine.cellSize / 2;
      const size = engine.cellSize / 3;

      // Тело NPC
      this.ctx.fillStyle = '#f97316';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = '#f97316';
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Глаза
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(px - size / 2 - 2, py - size / 3, 4, 4);
      this.ctx.fillRect(px + size / 2 - 2, py - size / 3, 4, 4);
    });
  }

  /**
   * Отрисовка игрока
   */
  drawPlayer(px, py, engine) {
    // Всегда используем SpriteManager (даже на уровне 1)
    if (window.spriteManager) {
      const dir = window.inputManager.getMovementDirection();
      window.spriteManager.updateState(dir.dx, dir.dy);
      window.spriteManager.draw(this.ctx, px, py, engine.cellSize * 1.12);
    } else {
      // экстренный fallback
      this.ctx.fillStyle = '#00d2ff';
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00d2ff';
      this.ctx.beginPath();
      this.ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  drawEnemies(engine) {
    engine.enemies.forEach(enemy => {
      const px = enemy.x * engine.cellSize + engine.cellSize / 2;
      const py = enemy.y * engine.cellSize + engine.cellSize / 2;

      if (window.spriteManager) {
        window.spriteManager.draw(
            this.ctx, px, py, engine.cellSize, enemy.type);
      } else {
        // Фолбэк отрисовка [9]
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
  /**
   * Отрисовка стены вокруг границ лабиринта (уровни > 15)
   */
  drawBoundaryWall(engine) {
    const cellSize = engine.cellSize;
    const cols = engine.cols;
    const rows = engine.rows;
    const wallThickness = cellSize * 0.5;

    // Используем текстуру стены
    this.ctx.fillStyle = this.wallPattern;

    // Верхняя стена
    this.ctx.fillRect(
        -wallThickness, -wallThickness, cols * cellSize + wallThickness * 2,
        wallThickness);

    // Нижняя стена
    this.ctx.fillRect(
        -wallThickness, rows * cellSize, cols * cellSize + wallThickness * 2,
        wallThickness);

    // Левая стена
    this.ctx.fillRect(
        -wallThickness, -wallThickness, wallThickness,
        rows * cellSize + wallThickness * 2);

    // Правая стена
    this.ctx.fillRect(
        cols * cellSize, -wallThickness, wallThickness,
        rows * cellSize + wallThickness * 2);
  }

  /**
   * Система тумана войны
   */
  applyFog(px, py, engine) {
    const dpr = window.devicePixelRatio || 1;
    let radius = Math.max(
        engine.cellSize * 2.5, engine.cellSize * (7 - engine.level * 0.3));
    if (engine.level > 15) {
      radius =
          Math.max(engine.cellSize * 2.5, engine.cellSize * (7 - 15 * 0.3));
    }



    if (engine.hasBook) {
      this.applyFogWithBook(px, py, engine, radius);
    } else {
      this.applyFogNormal(px, py, engine, radius);
    }
  }

  /**
   * Туман с режимом книги (показывает пройденный путь)
   */
  applyFogWithBook(px, py, engine, radius) {
    const dpr = window.devicePixelRatio || 1;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width / dpr;
    tempCanvas.height = this.canvas.height / dpr;
    const tCtx = tempCanvas.getContext('2d');

    tCtx.save();
    tCtx.translate(0, this.hudHeight || 60);

    if (engine.level > 15) {
      tCtx.translate(
          (this.canvas.width / dpr / 2) - px,
          (this.canvas.height / dpr / 2) - py);
    }

    tCtx.fillStyle = '#020617';
    tCtx.fillRect(
        -this.canvas.width / dpr, -this.canvas.height / dpr,
        (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);

    tCtx.globalCompositeOperation = 'destination-out';

    const grad =
        tCtx.createRadialGradient(px, py, engine.cellSize / 4, px, py, radius);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'transparent');
    tCtx.fillStyle = grad;
    tCtx.beginPath();
    tCtx.arc(px, py, radius, 0, Math.PI * 2);
    tCtx.fill();

    tCtx.fillStyle = 'white';
    engine.visitedPath.forEach(p => {
      tCtx.fillRect(
          p.x * engine.cellSize, p.y * engine.cellSize,
          Math.ceil(engine.cellSize), Math.ceil(engine.cellSize));
    });

    tCtx.restore();
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  /**
   * Обычный туман войны
   */
  applyFogNormal(px, py, engine, radius) {
    const dpr = window.devicePixelRatio || 1;

    this.ctx.save();
    this.ctx.translate(0, this.hudHeight);
    if (engine.level > 15) {
      this.ctx.translate(
          (this.canvas.width / dpr / 2) - px,
          (this.canvas.height / dpr / 2) - py);
      radius = radius * engine.cameraZoom;  // увеличиваем радиус при зуме
    }

    const gradCenterX = engine.level > 15 ? (this.canvas.width / dpr / 2) : px;
    const gradCenterY = engine.level > 15 ? (this.canvas.height / dpr / 2) : py;
    const gradient = this.ctx.createRadialGradient(
        gradCenterX, gradCenterY + this.hudHeight, engine.cellSize / 2,
        gradCenterX, gradCenterY + this.hudHeight, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');


    this.ctx.beginPath();
    this.ctx.rect(
        -this.canvas.width / dpr, -this.canvas.height / dpr,
        (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);
    this.ctx.arc(px, py, radius, 0, Math.PI * 2, true);
    this.ctx.clip();

    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(
        -this.canvas.width / dpr, -this.canvas.height / dpr,
        (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);

    // this.ctx.save();
    this.ctx.restore();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
        0, this.hudHeight, this.canvas.width / dpr, (this.canvas.height) / dpr);
  }

  /**
   * Система частиц для эффектов
   */
  addParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particleSystem.push({
        x,
        y,
        color,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20
      });
    }
  }

  /**
   * Обновление и отрисовка частиц (с учетом смещения камеры)
   */
  updateParticles(engine, px, py) {
    this.particleSystem = this.particleSystem.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      this.ctx.globalAlpha = p.life / 20;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      this.ctx.globalAlpha = 1;

      return p.life > 0;
    });
  }

  /**
   * Отрисовка светлячка-компаса, указывающего направление к ближайшему
   * сокровищу или выходу с миганием в зависимости от расстояния
   */
  drawCompassBeacon(engine, playerX, playerY) {
    // Проверяем, есть ли несобранные сокровища
    const uncollectedTreasures = engine.treasures.filter(t => !t.collected);

    let targetPos;
    let beaconColor = '#10b981';  // Зеленый цвет для светлячка

    if (uncollectedTreasures.length > 0) {
      // Находим ближайшее сокровище
      let closestTreasure = uncollectedTreasures[0];
      let minDistance = this.calculateDistance(
          playerX / engine.cellSize, playerY / engine.cellSize,
          closestTreasure.pos.x, closestTreasure.pos.y);

      for (let i = 1; i < uncollectedTreasures.length; i++) {
        const dist = this.calculateDistance(
            playerX / engine.cellSize, playerY / engine.cellSize,
            uncollectedTreasures[i].pos.x, uncollectedTreasures[i].pos.y);

        if (dist < minDistance) {
          minDistance = dist;
          closestTreasure = uncollectedTreasures[i];
        }
      }

      targetPos = closestTreasure.pos;
      // Меняем цвет в зависимости от типа сокровища
      if (closestTreasure.type === 'key') {
        beaconColor = '#fbbf24';  // Желтый для ключа
      } else if (closestTreasure.type === 'book') {
        beaconColor = '#a855f7';  // Фиолетовый для книги
      }
    } else {
      // Если все сокровища собраны, показываем направление к выходу
      targetPos = {x: engine.cols - 1, y: engine.rows - 1};
      beaconColor = '#20e920';  // Зеленый для выхода
    }

    // Рассчитываем угол к цели
    const angleToTarget = Math.atan2(
        targetPos.y * engine.cellSize - playerY,
        targetPos.x * engine.cellSize - playerX);

    // Позиция маячка всегда в направлении цели (на фиксированном расстоянии от
    // игрока)
    const beaconDistance = 30;  // Фиксированное расстояние от игрока
    const beaconX = playerX + Math.cos(angleToTarget) * beaconDistance;
    const beaconY = playerY + Math.sin(angleToTarget) * beaconDistance;

    // Рассчитываем расстояние до цели для изменения частоты мигания
    const distanceToTarget = this.calculateDistance(
        playerX / engine.cellSize, playerY / engine.cellSize, targetPos.x,
        targetPos.y);

    // Частота мигания зависит от расстояния - чем ближе, тем чаще мигает
    // Нормализуем расстояние для получения частоты мигания (0.1 - 3.0)
    const maxPossibleDistance =
        Math.sqrt(engine.cols * engine.cols + engine.rows * engine.rows);
    const normalizedDistance = distanceToTarget / maxPossibleDistance;
    const blinkFrequency =
        Math.max(0.1, 3.0 * (1 - normalizedDistance));  // От 0.1 до 3.0

    // Используем текущее время для расчета мигания
    const currentTime = Date.now();
    const blinkPhase = (currentTime * blinkFrequency) % (Math.PI * 2);
    const blinkIntensity = (Math.sin(blinkPhase) + 1) / 2;  // От 0 до 1

    // Рисуем светлячок с миганием
    this.ctx.save();
    this.ctx.globalAlpha =
        0.5 + 0.5 * blinkIntensity;  // Изменяем прозрачность для мигания
    this.ctx.fillStyle = beaconColor;
    this.ctx.shadowBlur =
        20 * (0.5 + 0.5 * blinkIntensity);  // Тень также мигает
    this.ctx.shadowColor = beaconColor;

    // Рисуем маячок как небольшой кружок
    this.ctx.beginPath();
    this.ctx.arc(beaconX, beaconY, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * Вспомогательная функция для вычисления расстояния между двумя точками
   */
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}
