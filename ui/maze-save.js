// maze-save.js
const SaveManager = {
  save() {
    const data = {
      level: window.engine.level,
      hasKey: window.engine.hasKey,
      hasBook: window.engine.hasBook,
      playerHP: window.engine.playerHP || 100,
      playerStamina: window.engine.playerStamina || 100,
      unlockedStories: Array.from(window.storyManager?.unlockedStories || []),
      timestamp: Date.now()
    };
    localStorage.setItem('skynas_save', JSON.stringify(data));
  },

  load() {
    const saved = localStorage.getItem('skynas_save');
    return saved ? JSON.parse(saved) : null;
  },

  exportSave() {
    const data = localStorage.getItem('skynas_save');
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze_save_${Date.now()}.json`;
    a.click();
  },

  importSave(file) {
    const reader = new FileReader();
    reader.onload = e => {
      localStorage.setItem('skynas_save', e.target.result);
      location.reload();
    };
    reader.readAsText(file);
  }
};

window.SaveManager = SaveManager;