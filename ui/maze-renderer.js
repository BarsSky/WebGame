/**
 * maze-renderer.js
 * Основной класс рендеринга лабиринта, который использует новую систему рендеринга
 */

class MazeRenderer {
  constructor(canvasId) {
    // Используем новую систему рендеринга
    this.renderSystem = new RenderSystem(canvasId);
  }

  /**
   * Инициализация рендерера
   */
  initialize() {
    this.renderSystem.initialize();
  }

  /**
   * Изменение размера холста
   */
  resizeCanvas(engine) {
    this.renderSystem.resizeCanvas(engine);
  }

  /**
   * Основной метод отрисовки
   */
  draw(engine, player) {
    this.renderSystem.render(engine, player);
  }

  /**
   * Добавление частиц
   */
  addParticles(x, y, color) {
    this.renderSystem.addParticles(x, y, color);
  }

  /**
   * Обновление частиц
   */
  updateParticles(engine) {
    this.renderSystem.updateParticles(engine);
  }
}

// Экспортируем класс (для браузера делаем глобальным)
if (typeof window !== 'undefined') {
  window.MazeRenderer = MazeRenderer;
}

// Для совместимости с ES6 модулями (опционально, если используется сборщик)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MazeRenderer;
}