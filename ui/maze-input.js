/**
 * maze-input.js — Полная версия: клавиатура (ПК) + виртуальный джойстик (мобильные)
 */
class InputManager {
  constructor() {
    this.keys = {};
    this.keysId = Math.random();
    this.isMobile = 'ontouchstart' in window;
    this.keydownHandler = null;
    this.keyupHandler = null;
    this.buttonListeners = new Map();
  }

  initialize() {
    console.log('📍 InputManager.initialize() called. Mobile:', this.isMobile, 'ID:', this.keysId);

    this.clearOldListeners();

    this.bindKeyboard();

    if (this.isMobile) {
      this.createVirtualJoystick();
    }

    console.log('✅ Input готов');
  }

  clearOldListeners() {
    if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
    if (this.keyupHandler) window.removeEventListener('keyup', this.keyupHandler);
  }

  bindKeyboard() {
    this.keydownHandler = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      this.keys[e.key] = true;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };

    this.keyupHandler = (e) => {
      this.keys[e.key] = false;
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  createVirtualJoystick() {
    // Удаляем старый джойстик, если есть
    const old = document.querySelector('.joystick-wrapper');
    if (old) old.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'joystick-wrapper';
    wrapper.innerHTML = `
      <div class="joystick-base">
        <div class="joystick-knob"></div>
      </div>
    `;

    document.querySelector('.center-content').appendChild(wrapper);

    const base = wrapper.querySelector('.joystick-base');
    const knob = wrapper.querySelector('.joystick-knob');

    let active = false;
    let startX, startY;

    base.addEventListener('touchstart', e => {
      active = true;
      const rect = base.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      if (!active) return;
      const touch = e.touches[0];
      let dx = touch.clientX - startX;
      let dy = touch.clientY - startY;
      const dist = Math.min(45, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);

      dx = Math.cos(angle) * dist;
      dy = Math.sin(angle) * dist;

      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      this.keys = {};
      if (dist > 12) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
        } else {
          this.keys[dy > 0 ? 'ArrowDown' : 'ArrowUp'] = true;
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      active = false;
      knob.style.transform = 'translate(0,0)';
      this.keys = {};
    });
  }

  rebindControls() {
    this.clearOldListeners();
    this.bindKeyboard();
    document.body.focus();
    console.log('🔄 Controls rebound. ID:', this.keysId);
  }

  getMovementDirection() {
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) return { dx: 0, dy: -1 };
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) return { dx: 0, dy: 1 };
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) return { dx: -1, dy: 0 };
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) return { dx: 1, dy: 0 };
    return { dx: 0, dy: 0 };
  }
}