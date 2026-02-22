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
    }

    initialize() {
        this.createWallPattern();
    }

    /**
     * Создание текстуры кирпича для стен
     */
    createWallPattern() {
        const pCanvas = document.createElement('canvas');
        const pCtx = pCanvas.getContext('2d');
        const pSize = 20;
        pCanvas.width = pSize;
        pCanvas.height = pSize;
        pCtx.fillStyle = '#1e293b';
        pCtx.fillRect(0, 0, pSize, pSize);
        pCtx.fillStyle = '#334155';
        pCtx.fillRect(1, 1, pSize - 2, (pSize / 2) - 2);
        pCtx.fillRect(1, (pSize / 2) + 1, (pSize / 2) - 2, (pSize / 2) - 2);
        pCtx.fillRect((pSize / 2) + 1, (pSize / 2) + 1, (pSize / 2) - 2, (pSize / 2) - 2);
        this.wallPattern = this.ctx.createPattern(pCanvas, 'repeat');
    }

    /**
     * Изменение размера холста при изменении окна
     */
    resizeCanvas(engine) {
        const base = window.innerWidth >= 768 ? 600 : 400;
        if (engine.level <= 15) {
            engine.cellSize = base / engine.cols;
        }
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = engine.cols * engine.cellSize;
        const logicalHeight = engine.rows * engine.cellSize;
        this.canvas.width = logicalWidth * dpr;
        this.canvas.height = logicalHeight * dpr;
        this.canvas.style.width = logicalWidth + 'px';
        this.canvas.style.height = logicalHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    /**
     * Основная отрисовка сцены
     */
    draw(engine, player) {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
        
        // Позиция игрока в пикселях
        const px = player.x * engine.cellSize + engine.cellSize / 2;
        const py = player.y * engine.cellSize + engine.cellSize / 2;

        this.ctx.save();
        
        // Эффект камеры после 15 уровня
        if (engine.level > 15) {
            const camX = (this.canvas.width / dpr / 2) - px;
            const camY = (this.canvas.height / dpr / 2) - py;
            this.ctx.translate(camX, camY);
        }

        // 1. Пол
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, engine.cols * engine.cellSize, engine.rows * engine.cellSize);

        // 2. Стены
        this.ctx.fillStyle = this.wallPattern;
        for (let y = 0; y < engine.rows; y++) {
            for (let x = 0; x < engine.cols; x++) {
                if (engine.grid[y][x] === 1) {
                    this.ctx.fillRect(x * engine.cellSize, y * engine.cellSize, 
                        Math.ceil(engine.cellSize), Math.ceil(engine.cellSize));
                }
            }
        }

        // 3. Выход
        this.drawExit(engine);

        // 4. Предметы
        if (!engine.hasKey) this.drawItem(engine.keyPos, '#fbbf24', engine);
        if (engine.level >= 10 && !engine.hasBook) this.drawItem(engine.bookPos, '#a855f7', engine);

        // 5. NPC
        this.drawNPCs(engine);

        // 6. Игрок
        this.drawPlayer(px, py, engine);

        // 7. Стена вокруг границ (для уровней > 15 с фиксированной камерой)
        if (engine.level > 15) {
            this.drawBoundaryWall(engine);
        }

        // 8. Частицы (отрисовываются ВНУТРИ transformed контекста)
        this.updateParticles(engine, px, py);

        this.ctx.restore();

        // 9. Туман войны
        this.applyFog(px, py, engine);
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
        this.ctx.fillRect((engine.cols - 1) * engine.cellSize + offset, 
            (engine.rows - 1) * engine.cellSize + offset, exitSize, exitSize);
        this.ctx.shadowBlur = 0;
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
        this.ctx.fillRect(pos.x * engine.cellSize + offset, pos.y * engine.cellSize + offset, size, size);
        this.ctx.shadowBlur = 0;
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
        this.ctx.fillStyle = '#00d2ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00d2ff';
        this.ctx.beginPath();
        this.ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
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
        this.ctx.fillRect(-wallThickness, -wallThickness, cols * cellSize + wallThickness * 2, wallThickness);
        
        // Нижняя стена
        this.ctx.fillRect(-wallThickness, rows * cellSize, cols * cellSize + wallThickness * 2, wallThickness);
        
        // Левая стена
        this.ctx.fillRect(-wallThickness, -wallThickness, wallThickness, rows * cellSize + wallThickness * 2);
        
        // Правая стена
        this.ctx.fillRect(cols * cellSize, -wallThickness, wallThickness, rows * cellSize + wallThickness * 2);
    }

    /**
     * Система тумана войны
     */
    applyFog(px, py, engine) {
        const dpr = window.devicePixelRatio || 1;
        const radius = Math.max(engine.cellSize * 2.5, engine.cellSize * (7 - engine.level * 0.3));  

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
        if (engine.level > 15) {
            tCtx.translate((this.canvas.width / dpr / 2) - px, (this.canvas.height / dpr / 2) - py);
        }

        tCtx.fillStyle = '#020617';
        tCtx.fillRect(-this.canvas.width / dpr, -this.canvas.height / dpr, 
            (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);
        
        tCtx.globalCompositeOperation = 'destination-out';

        const grad = tCtx.createRadialGradient(px, py, engine.cellSize / 4, px, py, radius);
        grad.addColorStop(0, "white"); 
        grad.addColorStop(1, "transparent");
        tCtx.fillStyle = grad;
        tCtx.beginPath(); 
        tCtx.arc(px, py, radius, 0, Math.PI * 2); 
        tCtx.fill();

        tCtx.fillStyle = "white";
        engine.visitedPath.forEach(p => {
            tCtx.fillRect(p.x * engine.cellSize, p.y * engine.cellSize, 
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
        const gradCenterX = engine.level > 15 ? (this.canvas.width / dpr / 2) : px;
        const gradCenterY = engine.level > 15 ? (this.canvas.height / dpr / 2) : py;
        const gradient = this.ctx.createRadialGradient(gradCenterX, gradCenterY, 
            engine.cellSize / 2, gradCenterX, gradCenterY, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');  

        this.ctx.save();
        if (engine.level > 15) {
            this.ctx.translate((this.canvas.width / dpr / 2) - px, (this.canvas.height / dpr / 2) - py);
        }  

        this.ctx.beginPath();
        this.ctx.rect(-this.canvas.width / dpr, -this.canvas.height / dpr, 
            (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);
        this.ctx.arc(px, py, radius, 0, Math.PI * 2, true);
        this.ctx.clip();
        
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(-this.canvas.width / dpr, -this.canvas.height / dpr, 
            (this.canvas.width / dpr) * 3, (this.canvas.height / dpr) * 3);
        this.ctx.restore();  

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    }

    /**
     * Система частиц для эффектов
     */
    addParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particleSystem.push({
                x, y, color,
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
}
