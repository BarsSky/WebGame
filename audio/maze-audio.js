/**
 * maze-audio.js
 * Система звуков и аудиоэффектов
 */

class AudioManager {
   constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.lastResume = 0;
    }

    initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext создан');
        } catch (e) {
            this.enabled = false;
            console.warn('⚠️ Audio недоступен');
        }
    }

    /**
     * Обновление аудио (вызывается каждый кадр)
     * — возобновляет контекст после бездействия (важно для мобильных!)
     */
    update() {
        if (!this.enabled || !this.audioContext) return;

        const now = Date.now();
        // Авто-resume, если контекст suspended (самая частая причина "звука нет")
        if (this.audioContext.state === 'suspended' && now - this.lastResume > 1000) {
            this.audioContext.resume().then(() => {
                this.lastResume = now;
                console.log('🔊 AudioContext resumed');
            });
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            switch (type) {
                case 'lock':     this.soundLock(osc, gain); break;
                case 'step':     this.soundStep(osc, gain); break;
                case 'win':      this.soundWin(osc, gain); break;
                case 'get':      this.soundGet(osc, gain); break;
                case 'interact': this.soundInteract(osc, gain); break;
            }
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    soundLock(osc, gain) {
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    soundStep(osc, gain) {
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    soundWin(osc, gain) {
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    soundGet(osc, gain) {
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    soundInteract(osc, gain) {
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }
}
