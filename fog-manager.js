/**
 * fog-manager.js
 * Управление туманом войны.
 */

class FogOfWarManager {
  constructor(hudHeight) {
    this.hudHeight = hudHeight;
  }

  apply(ctx, canvas, px, py, engine, level) {
    const dpr = window.devicePixelRatio || 1;
    let radius = Math.max(engine.cellSize * 2.5, engine.cellSize * (7 - level * 0.3));
    if (level >= 15) {
      radius = Math.max(engine.cellSize * 2.5, engine.cellSize * (7 - 15 * 0.3));
    }

    if (engine.hasBook) {
      this._applyWithBook(ctx, canvas, px, py, engine, level, radius);
    } else {
      this._applyNormal(ctx, canvas, px, py, engine, level, radius);
    }
  }

  _applyWithBook(ctx, canvas, px, py, engine, level, radius) {
    const dpr = window.devicePixelRatio || 1;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width / dpr;
    tempCanvas.height = canvas.height / dpr;
    const tCtx = tempCanvas.getContext('2d');

    tCtx.save();
    tCtx.translate(0, this.hudHeight);

    if (level >= 15) {
      tCtx.translate((canvas.width / dpr / 2) - px, (canvas.height / dpr / 2) - py);
    }

    tCtx.fillStyle = '#020617';
    tCtx.fillRect(-canvas.width / dpr, -canvas.height / dpr, (canvas.width / dpr) * 3, (canvas.height / dpr) * 3);

    tCtx.globalCompositeOperation = 'destination-out';
    const grad = tCtx.createRadialGradient(px, py, engine.cellSize / 4, px, py, radius);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'transparent');
    tCtx.fillStyle = grad;
    tCtx.beginPath();
    tCtx.arc(px, py, radius, 0, Math.PI * 2);
    tCtx.fill();

    tCtx.fillStyle = 'white';
    engine.visitedPath.forEach(p => {
      tCtx.fillRect(p.x * engine.cellSize, p.y * engine.cellSize, Math.ceil(engine.cellSize), Math.ceil(engine.cellSize));
    });

    tCtx.restore();
    ctx.drawImage(tempCanvas, 0, 0);
  }

  _applyNormal(ctx, canvas, px, py, engine, level, radius) {
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.translate(0, this.hudHeight);
    
    if (level >= 15) {
      ctx.translate((canvas.width / dpr / 2) - px, (canvas.height / dpr / 2) - py);
      radius = radius * (engine.cameraZoom || 2.0);
    }

    const gradCenterX = level >= 15 ? (canvas.width / dpr / 2) : px;
    const gradCenterY = level >= 15 ? (canvas.height / dpr / 2) : py;
    const gradient = ctx.createRadialGradient(
      gradCenterX, gradCenterY + this.hudHeight, engine.cellSize / 2,
      gradCenterX, gradCenterY + this.hudHeight, radius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');

    ctx.beginPath();
    ctx.rect(-canvas.width / dpr, -canvas.height / dpr, (canvas.width / dpr) * 3, (canvas.height / dpr) * 3);
    ctx.arc(px, py, radius, 0, Math.PI * 2, true);
    ctx.clip();

    ctx.fillStyle = '#020617';
    ctx.fillRect(-canvas.width / dpr, -canvas.height / dpr, (canvas.width / dpr) * 3, (canvas.height / dpr) * 3);

    ctx.restore();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.hudHeight, canvas.width / dpr, canvas.height / dpr);
  }
}
