/**
 * render-core.js
 * Ядро отрисовки: управление canvas, камерой и основным циклом рендеринга.
 */

class RenderCore {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hudHeight = 70;
    this.isoFactor = 0;
    this.cameraZoom = 2.0;
  }

  resize(cols, rows, cellSize, level) {
    const base = window.innerWidth >= 768 ? 600 : 400;
    const actualCellSize = level <= 15 ? base / cols : cellSize;

    const dpr = window.devicePixelRatio || 1;
    const w = cols * actualCellSize;
    const h = rows * actualCellSize + this.hudHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    
    return actualCellSize;
  }

  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
  }

  setupCamera(player, engine, level) {
    const dpr = window.devicePixelRatio || 1;
    const targetIso = Math.min(1, Math.max(0, (level - 15) / 20));
    this.isoFactor = this.isoFactor * 0.92 + targetIso * 0.08;

    const px = player.x * engine.cellSize + engine.cellSize / 2;
    const py = player.y * engine.cellSize + engine.cellSize / 2;

    this.ctx.save();
    this.ctx.translate(0, this.hudHeight);

    if (level >= 15) {
      const zoom = 1.15 + this.isoFactor * 0.25;
      const camX = (this.canvas.width / dpr / 2) - px * zoom;
      const camY = (this.canvas.height / dpr / 2) - py * zoom + this.isoFactor * 35;
      
      // Псевдоизометрическая трансформация (стиль Hades)
      if (level >= 25) {
          // Наклон и поворот для 2.5D эффекта
          // this.ctx.transform(1, 0.5 * this.isoFactor, 0, 1, 0, 0); 
      }

      this.ctx.translate(camX, camY);
      this.ctx.scale(zoom, zoom);
    }

    return { px, py };
  }

  restore() {
    this.ctx.restore();
  }

  drawBackground(cols, rows, cellSize) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
  }
}
