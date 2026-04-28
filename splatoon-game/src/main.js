import { Game, game } from './Game.js';

/**
 * Точка входа в игру
 * Инициализация игры после загрузки страницы
 */

// Ожидание загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('Splatoon-style Game - Starting...');
    
    // Проверка поддержки WebGL
    if (!window.WebGLRenderingContext) {
        alert('Ваш браузер не поддерживает WebGL. Пожалуйста, используйте современный браузер (Chrome, Firefox, Edge).');
        return;
    }
    
    // Создание экземпляра игры
    // Глобальная переменная game объявлена в Game.js
    game = new Game();
    
    console.log('Game initialized successfully!');
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Game error:', e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
