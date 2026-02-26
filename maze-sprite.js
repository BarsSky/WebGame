/**
 * maze-sprite.js — Оптимизированная версия под все атласы
 */

class SpriteManager {
  constructor() {
    this.spriteSheets = {};      // {id: {idle: {img, config}, walk: {...}}}
    this.selectedId = localStorage.getItem('skynas_char_id') || 'cat';
    this.currentState = 'idle';
    this.frame = 0;
    this.tick = 0;
    this.currentDir = 0;         // 0=down, 1=left, 2=right, 3=up
    this.mirror = false;
  }

  initialize() {
    const allChars = { ...MAZE_REGISTRY.players, ...MAZE_REGISTRY.npcs };
    for (let id in allChars) {
      const char = allChars[id];
      if (!char.spriteSheets) continue;

      this.spriteSheets[id] = {};

      for (let state in char.spriteSheets) {
        const url = char.spriteSheets[state];
        const img = new Image();
        img.src = url;

        this.spriteSheets[id][state] = {
          img: img,
          loaded: false,
          config: char.animationConfig?.states[state] || {}
        };

        img.onload = () => {
          this.spriteSheets[id][state].loaded = true;
          console.log(`✅ Sprite ${id}/${state} loaded`);
        };
      }
    }
  }

  setSprite(id) {
    if (this.spriteSheets[id]) {
      this.selectedId = id;
      localStorage.setItem('skynas_char_id', id);
      this.currentState = 'idle';
      this.frame = 0;
    }
  }

  updateState(dx, dy) {
    const wasMoving = this.currentState !== 'idle';
    const isMoving = dx !== 0 || dy !== 0;

    // Определяем направление
    if (dy > 0) this.currentDir = 0;
    else if (dx < 0) this.currentDir = 1;
    else if (dx > 0) this.currentDir = 2;
    else if (dy < 0) this.currentDir = 3;

    // Авто-переключение на accelerate при быстром движении
    let newState = isMoving ? 'walk' : 'idle';
    if (isMoving && window.physicsEngine) {
      const timeSinceLastMove = Date.now() - (window.physicsEngine.lastMoveTime || 0);
      if (timeSinceLastMove < 80) newState = 'accelerate';
    }

    if (newState !== this.currentState) {
      this.currentState = newState;
      this.frame = 0;
    }

    // Анимация
    const cfg = this.getCurrentConfig();
    if (cfg && cfg.speed > 0) {
      this.tick++;
      if (this.tick % cfg.speed === 0) {
        this.frame = (this.frame + 1) % cfg.frames;
      }
    } else {
      this.frame = 0;
    }

    // Зеркало для right (экономим место в атласе)
    this.mirror = false;
    if (cfg?.mirrorForRight && this.currentDir === 2) {
      this.mirror = true;
    }
  }

  getCurrentConfig() {
    return this.spriteSheets[this.selectedId]?.[this.currentState]?.config || {};
  }

draw(ctx, px, py, size) {
 const sheets = this.spriteSheets[this.selectedId];
 const stateData = sheets?.[this.currentState];

 if (!stateData || !stateData.loaded) {
   // this._drawFallback(ctx, px, py, size); // <-- Не рисуем fallback здесь
   return false; // <-- Сообщаем, что спрайт не отрисован
 }

 const img = stateData.img;
 const cfg = stateData.config;
 const fw = cfg.frameWidth || 256;
 const fh = cfg.frameHeight || 256;

 const frame = this.frame % cfg.frames;

 ctx.save();
 ctx.imageSmoothingEnabled = false;

 const drawX = px - size / 2;
 const drawY = py - size / 2;

 if (this.mirror) {
   ctx.translate(drawX + size, drawY);
   ctx.scale(-1, 1);
   ctx.drawImage(img, frame * fw, 0, fw, fh, 0, 0, size, size);
 } else {
   ctx.drawImage(img, frame * fw, 0, fw, fh, drawX, drawY, size, size);
 }

 ctx.restore();
 return true; // <-- Сообщаем, что спрайт отрисован
}

drawAnimatedItem(ctx, px, py, size, itemId) {
    // Получаем данные предмета из реестра
    const itemConfig = MAZE_REGISTRY.items[itemId];
    if (!itemConfig) {
        this._drawFallbackItem(ctx, px, py, size, '#fbbf24');
        return;
    }

    const data = this.sprites[itemId] || this.spriteSheets[itemId];
    if (!data || !data.loaded) {
        this._drawFallbackItem(ctx, px, py, size, itemConfig.color);
        return;
    }

    const img = data.img;
    const totalFrames = itemConfig.frames || 25; // Берем из реестра или 25 по умолчанию
    const fw = img.width / totalFrames;
    const fh = img.height;
    
    // Плавная анимация на основе времени
    const animSpeed = itemConfig.animSpeed || 1;
    const frame = Math.floor(Date.now() / (1000 / (animSpeed * 10))) % totalFrames;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 15;
    ctx.shadowColor = itemConfig.color;
    ctx.drawImage(
        img,
        frame * fw, 0, fw, fh,
        px - size / 2, py - size / 2,
        size, size
    );
    ctx.restore();
}

  _drawFallbackItem(ctx, px, py, size, color) {
    ctx.save();
    ctx.fillStyle = color || '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.shadowColor = color || '#fbbf24';
    const pulse = Math.sin(Date.now() / 150) * 3;
    ctx.beginPath();
    ctx.arc(px, py + pulse, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

 _drawFallback(ctx, px, py, size) {
  // красивый круг + частицы
  ctx.fillStyle = '#00d2ff';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00d2ff';
  ctx.beginPath();
  ctx.arc(px, py, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // мини-частицы вокруг
  for (let i = 0; i < 6; i++) {
    const a = i * 0.9 + Date.now() / 300;
    const r = size * 0.45;
    ctx.fillStyle = `hsla(195, 100%, 70%, ${0.6 + Math.sin(a)*0.4})`;
    ctx.fillRect(
      px + Math.cos(a) * r - 2,
      py + Math.sin(a) * r - 2,
      4, 4
    );
  }
  ctx.shadowBlur = 0;
}
}

window.spriteManager = null;   // будет создан в main