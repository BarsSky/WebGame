/**
 * player-renderer.js
 * Отрисовка игрока.
 */

class PlayerRenderer {
  draw(ctx, px, py, cellSize) {
    if (window.spriteManager) {
      const dir = window.inputManager.getMovementDirection();
      window.spriteManager.updateState(dir.dx, dir.dy);
      // Проверить, был ли спрайт успешно отрисован
      const spriteDrawn = window.spriteManager.draw(ctx, px, py, cellSize * 1.12);
      if (!spriteDrawn) {
        // Если спрайт не отрисован, использовать фолбэк
        this.drawFallback(ctx, px, py, cellSize);
      }
    } else {
      // Если spriteManager не существует, использовать фолбэк
      this.drawFallback(ctx, px, py, cellSize);
    }
  }

  drawFallback(ctx, px, py, cellSize) {
    ctx.fillStyle = '#00d2ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00d2ff';
    ctx.beginPath();
    ctx.arc(px, py, cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
