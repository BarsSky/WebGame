/**
 * maze-sprite.js
 * Система управления спрайтами и анимацией персонажей
 */
class SpriteManager {
       constructor() {
        this.sprites = {};
        this.selectedId = localStorage.getItem('skynas_char_id') || 'cat';
        this.frame = 0;
        this.tick = 0;
        this.animSpeed = 8;
        this.frameSteps = 4;
        this.currentDir = 0;
    }

    initialize() {
        // Загружаем спрайты всех игровых персонажей из реестра
        const allChars = { ...MAZE_REGISTRY.players, ...MAZE_REGISTRY.npcs };
        for (let id in allChars) {
            const data = allChars[id];
            this.sprites[id] = {
                img: new Image(),
                loaded: false
            };
            this.sprites[id].img.src = data.sprite;
            this.sprites[id].img.onload = () => { this.sprites[id].loaded = true; };
        }
    }

    setSprite(id) {
        if (this.sprites[id]) {
            this.selectedId = id;
            localStorage.setItem('skynas_char_id', id);
        }
    }

    /**
     * Определяет индекс направления для спрайт-листа
     */
    updateState(dx, dy) {
        this.isMoving = (dx !== 0 || dy !== 0);
        if (dy > 0) this.currentDir = 0; // Вниз
        else if (dx < 0) this.currentDir = 1; // Влево
        else if (dx > 0) this.currentDir = 2; // Вправо
        else if (dy < 0) this.currentDir = 3; // Вверх

        if (this.isMoving) {
            this.tick++;
            if (this.tick % this.animSpeed === 0) {
                this.frame = (this.frame + 1) % this.frameSteps;
            }
        } else {
            this.frame = 0; // Состояние покоя
        }
    }

    /**
     * Отрисовка кадра спрайта
     */
    draw(ctx, px, py, size) {
        const sprite = this.sprites[this.selectedId];
        if (!sprite || !sprite.loaded) {
            // Фолбэк на точку, если спрайт не загружен
            ctx.fillStyle = '#00d2ff';
            ctx.beginPath();
            ctx.arc(px, py, size / 3, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        const img = sprite.img;
        const sw = img.width / this.frameSteps;
        const sh = img.height / 4; // 4 направления

        ctx.drawImage(
            img,
            this.frame * sw, this.currentDir * sh, // Исходные координаты (кадр и направление)
            sw, sh,                               // Исходный размер
            px - size / 2, py - size / 2,         // Координаты на канвасе
            size, size                            // Размер отрисовки
        );
    }
}