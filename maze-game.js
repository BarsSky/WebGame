// maze-game.js
/**
* maze-game.js
* Управление отрисовкой, вводом, звуками и логикой предметов.
*/
// Состояние игрока и игры
let player = { x: 0, y: 0 };
let lastMoveTime = 0;
const keys = {};
let wallPattern;

const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
const winMsg = document.getElementById('win');
const levelDisplay = document.getElementById('level-val');
const visionDisplay = document.getElementById('vision-val');
const keyUI = document.getElementById('key-status');
const bookUI = document.getElementById('book-status');

const engine = new MazeEngine();

function setupGame() {
    engine.initLevel();
    resizeCanvas();
    if (!wallPattern) createWallPattern();
    player = { x: 0, y: 0 };
    engine.visitedPath = [{x: 0, y: 0}];
    levelDisplay.innerText = engine.level;
    winMsg.style.display = 'none';
    if (bookUI) bookUI.style.display = engine.level >= 10 ? 'inline' : 'none';
    updateUI();
}

function resizeCanvas() {
    const base = window.innerWidth >= 768 ? 600 : 400;
    if (engine.level <= 15) {
        engine.cellSize = base / engine.cols;
    }
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = engine.cols * engine.cellSize;
    const logicalHeight = engine.rows * engine.cellSize;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    ctx.scale(dpr, dpr);
}

/**
* Создание текстуры кирпича для стен
*/
function createWallPattern() {
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
    wallPattern = ctx.createPattern(pCanvas, 'repeat');
}

/**
* Обработка движения
*/
function updateMovement(timestamp) {
    const moveDelay = Math.max(60, 130 - engine.level * 5);
    if (timestamp - lastMoveTime > moveDelay) {
        let nx = player.x;
        let ny = player.y;
        if (keys['ArrowUp']) ny--;
        else if (keys['ArrowDown']) ny++;
        else if (keys['ArrowLeft']) nx--;
        else if (keys['ArrowRight']) nx++;
        if (nx !== player.x || ny !== player.y) {
            // Проверка границ и стен
            if (nx >= 0 && nx < engine.cols && ny >= 0 && ny < engine.rows && engine.grid[ny][nx] === 0) {
                // Проверка выхода без ключа
                if (nx === engine.cols - 1 && ny === engine.rows - 1 && !engine.hasKey) {
                    playSound('lock');
                    return;
                }
                player.x = nx;
                player.y = ny;
                lastMoveTime = timestamp;
                // Записываем путь для магической книги
                const alreadyVisited = engine.visitedPath.some(p => p.x === player.x && p.y === player.y);
                if (!alreadyVisited) engine.visitedPath.push({x: player.x, y: player.y});
                // Сбор предметов
                checkCollisions();
                // Звук шага
                if (typeof playSound === 'function') playSound('step');
                // Проверка победы
                if (player.x === engine.cols - 1 && player.y === engine.rows - 1) {
                    handleWin();
                }
            }
        }
    }
}

function checkCollisions() {
    if (!engine.hasKey && player.x === engine.keyPos.x && player.y === engine.keyPos.y) {
        engine.hasKey = true;
        if (typeof playSound === 'function') playSound('get');
    }
    if (engine.level >= 10 && !engine.hasBook && player.x === engine.bookPos.x && player.y === engine.bookPos.y) {
        engine.hasBook = true;
        if (typeof playSound === 'function') playSound('get');
    }
}

function handleWin() {
    winMsg.style.display = 'block';
    engine.level++;
    engine.saveProgress();
    if (typeof playSound === 'function') playSound('win');
    setTimeout(setupGame, 1500);
}

/**
* Отрисовка
*/
function draw() {
 ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    
    // Позиция игрока в пикселях
    const px = player.x * engine.cellSize + engine.cellSize / 2;
    const py = player.y * engine.cellSize + engine.cellSize / 2;

    ctx.save();
    // Эффект камеры после 15 уровня
    if (engine.level > 15) {
        const camX = (canvas.width / (window.devicePixelRatio || 1) / 2) - px;
        const camY = (canvas.height / (window.devicePixelRatio || 1) / 2) - py;
        ctx.translate(camX, camY);
    }

    // 1. Пол
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, engine.cols * engine.cellSize, engine.rows * engine.cellSize);

    // 2. Стены
    ctx.fillStyle = wallPattern;
    for (let y = 0; y < engine.rows; y++) {
        for (let x = 0; x < engine.cols; x++) {
            if (engine.grid[y][x] === 1) {
                ctx.fillRect(x * engine.cellSize, y * engine.cellSize, Math.ceil(engine.cellSize), Math.ceil(engine.cellSize));
            }
        }
    }

    // 3. Выход
    const exitSize = engine.cellSize * 0.6;
    const offset = (engine.cellSize - exitSize) / 2;
    ctx.fillStyle = engine.hasKey ? '#10b981' : '#475569';
    ctx.shadowBlur = engine.hasKey ? 15 : 0;
    ctx.shadowColor = '#10b981';
    ctx.fillRect((engine.cols-1)*engine.cellSize + offset, (engine.rows-1)*engine.cellSize + offset, exitSize, exitSize);
    ctx.shadowBlur = 0;

    // 4. Предметы (Ключ и Книга)
    if (!engine.hasKey) drawItem(engine.keyPos, '#fbbf24');
    if (engine.level >= 10 && !engine.hasBook) drawItem(engine.bookPos, '#a855f7');

    // 5. Игрок
    ctx.fillStyle = '#00d2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00d2ff';
    ctx.beginPath();
    ctx.arc(px, py, engine.cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Возвращаем контекст в исходное состояние, чтобы UI и туман не смещались некорректно
    ctx.restore(); 

    // 6. Туман войны (вызывается после restore, координаты игрока передаются для расчета)
    applyFog(px, py);
    
    updateUI();
}

function drawItem(pos, color) {
    const size = engine.cellSize * 0.4;
    const offset = (engine.cellSize - size) / 2;
    ctx.fillStyle = color;
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.fillRect(pos.x * engine.cellSize + offset, pos.y * engine.cellSize + offset, size, size);
    ctx.shadowBlur = 0;
}

function applyFog(px, py) {
        // Расчет динамического радиуса обзора в зависимости от уровня
    const radius = Math.max(engine.cellSize * 2.5, engine.cellSize * (7 - engine.level * 0.3));  

    if (engine.hasBook) {
        // Режим с книгой: создание временного холста для вырезания пройденного пути
        const tempCanvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        tempCanvas.width = canvas.width / dpr;
        tempCanvas.height = canvas.height / dpr;
        const tCtx = tempCanvas.getContext('2d');  

        tCtx.save();
        // Применяем смещение камеры для временного холста, если уровень > 15
        if (engine.level > 15) {
            tCtx.translate((canvas.width / dpr / 2) - px, (canvas.height / dpr / 2) - py);
        }

        // Заполняем слой полной темнотой
        tCtx.fillStyle = '#020617';
        tCtx.fillRect(-canvas.width / dpr, -canvas.height / dpr, (canvas.width / dpr) * 3, (canvas.height / dpr) * 3);
        
        // Переключаем режим на вырезание (удаление пикселей)
        tCtx.globalCompositeOperation = 'destination-out';

        // 1. Отрисовка "фонарика" вокруг игрока
        const grad = tCtx.createRadialGradient(px, py, engine.cellSize / 4, px, py, radius);
        grad.addColorStop(0, "white"); 
        grad.addColorStop(1, "transparent");
        tCtx.fillStyle = grad;
        tCtx.beginPath(); 
        tCtx.arc(px, py, radius, 0, Math.PI * 2); 
        tCtx.fill();

        // 2. Отрисовка всех посещенных клеток (пройденный путь)
        tCtx.fillStyle = "white";
        engine.visitedPath.forEach(p => {
            tCtx.fillRect(p.x * engine.cellSize, p.y * engine.cellSize, Math.ceil(engine.cellSize), Math.ceil(engine.cellSize));
        });

        tCtx.restore();
        // Накладываем полученную маску на основной холст
        ctx.drawImage(tempCanvas, 0, 0);

    } else {
        // Обычный режим тумана без книги
        const gradCenterX = engine.level > 15 ? (canvas.width / (window.devicePixelRatio || 1) / 2) : px;
        const gradCenterY = engine.level > 15 ? (canvas.height / (window.devicePixelRatio || 1) / 2) : py;
        const gradient = ctx.createRadialGradient(gradCenterX, gradCenterY, engine.cellSize / 2, gradCenterX, gradCenterY, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(2, 6, 23, 1)');  

        ctx.save();
        // Применяем камеру к обрезке тумана, если уровень > 15
        if (engine.level > 15) {
            ctx.translate((canvas.width / (window.devicePixelRatio || 1) / 2) - px, (canvas.height / (window.devicePixelRatio || 1) / 2) - py);
        }  

        ctx.beginPath();
        // Рисуем прямоугольник, перекрывающий все поле с запасом для камеры
        ctx.rect(-canvas.width / (window.devicePixelRatio || 1), -canvas.height / (window.devicePixelRatio || 1), (canvas.width / (window.devicePixelRatio || 1)) * 3, (canvas.height / (window.devicePixelRatio || 1)) * 3);
        // Вырезаем круг в месте нахождения игрока
        ctx.arc(px, py, radius, 0, Math.PI * 2, true);
        ctx.clip();
        
        ctx.fillStyle = '#020617';
        ctx.fillRect(-canvas.width / (window.devicePixelRatio || 1), -canvas.height / (window.devicePixelRatio || 1), (canvas.width / (window.devicePixelRatio || 1)) * 3, (canvas.height / (window.devicePixelRatio || 1)) * 3);
        ctx.restore();  

        // Отрисовка мягкого градиента по краям обзора
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    }
}

function updateUI() {
    if (keyUI) keyUI.style.opacity = engine.hasKey ? "1" : "0.2";
    if (bookUI) bookUI.style.opacity = engine.hasBook ? "1" : "0.2";
    visionDisplay.innerText = engine.level < 5 ? "Wide" : (engine.level < 10 ? "Med" : "Narrow");
}

function initControls() {
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    const setupBtn = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        const set = (v, e) => { e.preventDefault(); keys[key] = v; };
        el.addEventListener('touchstart', e => set(true, e), {passive: false});
        el.addEventListener('touchend', e => set(false, e), {passive: false});
        el.addEventListener('mousedown', e => set(true, e));
        el.addEventListener('mouseup', e => set(false, e));
    };
    setupBtn('btn-ArrowUp', 'ArrowUp'); setupBtn('btn-ArrowDown', 'ArrowDown');
    setupBtn('btn-ArrowLeft', 'ArrowLeft'); setupBtn('btn-ArrowRight', 'ArrowRight');
}

function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); 
        gain.connect(audioCtx.destination);
        
        if (type === 'lock') {
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
            osc.start(); 
            osc.stop(audioCtx.currentTime + 0.1);
        }
        if (type === 'step') {
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        }
        if(type === 'win') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        }
        if(type === 'get') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) {}
}

function gameLoop(t) {
    updateMovement(t);
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle window resize (orientation change on mobile)
window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});

// Функции для панелей
function togglePanel(panel) {
    const el = document.getElementById(panel + '-panel');
    if (el.classList.contains('panel-visible')) {
        el.classList.remove('panel-visible');
    } else {
        // Закрываем другую панель, если открыта
        const other = panel === 'help' ? 'table' : 'help';
        document.getElementById(other + '-panel').classList.remove('panel-visible');
        el.classList.add('panel-visible');
    }
}

function hidePanel(panel) {
    const el = document.getElementById(panel + '-panel');
    el.style.display = 'none';
    // Расширяем центр, если обе панели скрыты
    if (!document.getElementById('help-panel').style.display && !document.getElementById('table-panel').style.display) {
        document.querySelector('.center-content').classList.add('center-expanded');
    } else {
        document.querySelector('.center-content').classList.remove('center-expanded');
    }
    resizeCanvas();
    draw();
}

initControls();
setupGame();
requestAnimationFrame(gameLoop);