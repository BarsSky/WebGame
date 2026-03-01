// maze-i18n.js
let currentLocale = 'ru';
let translations = {};

async function loadLocale(lang) {
  currentLocale = lang;
  const res = await fetch(`locales/${lang}.json`);
  translations = await res.json();
}

function i18n(key) {
    if (!translations || Object.keys(translations).length === 0) return key; // Возвращаем ключ, если перевод не загружен
    const parts = key.split('.');
    let obj = translations;
    for (let p of parts) {
        obj = obj[p];
        if (!obj) return key;
    }
    return obj || key;
}

window.loadLocale = loadLocale;
window.i18n = i18n;