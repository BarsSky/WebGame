/**
 * maze-story.js
 * Система сюжета, диалогов и взаимодействий
 */

const STORY_DATA = {
    level: {
        10: {
            title: "ГЛАВА I: КНИГА ЗНАНИЙ",
            text: "Вы нашли древнюю книгу, которая освещает путь сквозь тьму..."
        },
        15: {
            title: "ГЛАВА II: СЛЕДЯЩАЯ КАМЕРА",
            text: "Ваше зрение обостряется... камера теперь следует за вами."
        },
        25: {
            title: "ГЛАВА III: ВСТРЕЧА",
            text: "В лабиринте не только вы... жители затерянного мира готовы помочь."
        },
        50: {
            title: "ФИНАЛ: ВЫХОД",
            text: "Вы близки к разгадке лабиринта... финальный уровень ждет."
        }
    },
    npcs: {
        0: {
            name: "Странник",
            dialogs: [
                "Кто ты, скиталец в лабиринте?",
                "Я помню эти стены... столько лет...",
                "Если ищешь выход, будь осторожен..."
            ]
        },
        1: {
            name: "Хранитель",
            dialogs: [
                "Добро пожаловать в мой дом...",
                "Ключ открывает не только двери.",
                "Найди все части истории, и узнаешь правду."
            ]
        },
        2: {
            name: "Тень",
            dialogs: [
                "Ты видишь меня? Это хороший знак.",
                "Лабиринт живет... растет... изменяется.",
                "На каждом уровне новая истина."
            ]
        }
    }
};

class StoryManager {
    constructor() {
        this.currentDialog = null;
        this.dialogActive = false;
        this.unlockedStories = new Set();
        this.loadProgress();
    }

    /**
     * Загрузить прогресс историй
     */
    loadProgress() {
        const saved = localStorage.getItem('skynas_stories');
        if (saved) {
            this.unlockedStories = new Set(JSON.parse(saved));
        }
    }

    /**
     * Сохранить прогресс историй
     */
    saveProgress() {
        localStorage.setItem('skynas_stories', JSON.stringify([...this.unlockedStories]));
    }

    /**
     * Проверить и показать историю уровня
     */
    checkLevelStory(level) {
        if (STORY_DATA.level[level] && !this.unlockedStories.has(`level_${level}`)) {
            this.showStoryDialog(STORY_DATA.level[level].title, STORY_DATA.level[level].text);
            this.unlockedStories.add(`level_${level}`);
            this.saveProgress();
            return true;
        }
        return false;
    }

    /**
     * Взаимодействие с NPC
     */
    interactWithNPC(npcIndex) {
        const npc = STORY_DATA.npcs[npcIndex];
        if (!npc) return;

        const dialogIndex = Math.floor(Math.random() * npc.dialogs.length);
        const dialog = npc.dialogs[dialogIndex];
        
        this.showDialogBox(npc.name, dialog);
        this.unlockedStories.add(`npc_${npcIndex}`);
        this.saveProgress();
    }

    /**
     * Показать диалоговое окно
     */
    showDialogBox(name, text) {
        let dialogBox = document.getElementById('dialog-box');
        if (!dialogBox) {
            dialogBox = document.createElement('div');
            dialogBox.id = 'dialog-box';
            dialogBox.className = 'dialog-box';
            document.body.appendChild(dialogBox);
        }

        dialogBox.innerHTML = `
<div class="dialog-content">
<div class="dialog-name">${name}</div>
<div class="dialog-text">${text}</div>
<div class="dialog-close">[Пробел или кликните для закрытия]</div>
</div>
`;
        dialogBox.style.display = 'block';
        this.dialogActive = true;
        
        // Ставим игру на паузу при диалоге
        if (window.gameState) window.gameState.paused = true;

        const closeDialog = (e) => {
            // Закрытие по пробелу, клику или тапу
            const shouldClose = (e.type === 'keydown' && e.key === ' ') || 
                               (e.type === 'click' || e.type === 'touchend');
            
            if (shouldClose) {
                e.preventDefault?.();
                dialogBox.style.display = 'none';
                this.dialogActive = false;
                
                // Снимаем игру с паузы
                if (window.gameState) window.gameState.paused = false;
                
                // Восстанавливаем фокус и управление
                if (window.inputManager) window.inputManager.rebindControls();
                
                window.removeEventListener('keydown', closeDialog);
                dialogBox.removeEventListener('click', closeDialog);
                dialogBox.removeEventListener('touchend', closeDialog);
            }
        };

        window.addEventListener('keydown', closeDialog);
        dialogBox.addEventListener('click', closeDialog);
        dialogBox.addEventListener('touchend', closeDialog, { passive: false });
    }
    

    /**
    * Показать историю (при переходе уровня)
    */
    showStoryDialog(title, text) {
        const storyBox = document.createElement('div');
        storyBox.className = 'story-dialog';
        storyBox.innerHTML = `
<div class="story-content">
<h2>${title}</h2>
<p>${text}</p>
<div class="story-close">[Нажмите пробел или кликните для продолжения]</div>
</div>
`;
        document.body.appendChild(storyBox);
        
        this.dialogActive = true;
        // Пауза уже должна быть выставлена в setupGame, но для надежности:
        if (window.gameState) window.gameState.paused = true;

        const closeStory = (e) => {
            // Закрытие по пробелу или клику/тапу
            const shouldClose = (e.type === 'keydown' && e.key === ' ') || 
                               (e.type === 'click' || e.type === 'touchend');
            
            if (shouldClose) {
                e.preventDefault?.();
                storyBox.remove();
                this.dialogActive = false;
                
                // ВАЖНО: Снимаем паузу, чтобы игра продолжилась
                if (window.gameState) window.gameState.paused = false;
                
                // Восстанавливаем управление
                if (window.inputManager) window.inputManager.rebindControls();

                window.removeEventListener('keydown', closeStory);
                storyBox.removeEventListener('click', closeStory);
                storyBox.removeEventListener('touchend', closeStory);
            }
        };

        window.addEventListener('keydown', closeStory);
        storyBox.addEventListener('click', closeStory);
        storyBox.addEventListener('touchend', closeStory, { passive: false });
    }

    /**
     * Получить статус истории
     */
    getStoryProgress() {
        return {
            total: Object.keys(STORY_DATA.level).length + Object.keys(STORY_DATA.npcs).length,
            unlocked: this.unlockedStories.size
        };
    }
}
