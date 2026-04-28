/**
 * Вспомогательные утилиты
 */

const Utils = {
    /**
     * Преобразование цвета команды в HEX
     * @param {string} teamName - Название команды
     * @returns {number} HEX цвет
     */
    getTeamColor: function(teamName) {
        return CONFIG.teamColors[teamName] || 0xffffff;
    },
    
    /**
     * Преобразование HEX цвета в CSS формат
     * @param {number} hex - HEX цвет
     * @returns {string} CSS цвет
     */
    hexToCss: function(hex) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    /**
     * Расчёт расстояния между двумя точками
     * @param {Object} a - Первая точка {x, y, z}
     * @param {Object} b - Вторая точка {x, y, z}
     * @returns {number} Расстояние
     */
    distance: function(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    /**
     * Расчёт расстояния на плоскости XZ
     * @param {Object} a - Первая точка {x, z}
     * @param {Object} b - Вторая точка {x, z}
     * @returns {number} Расстояние
     */
    distance2D: function(a, b) {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
    },
    
    /**
     * Проверка нахождения точки в прямоугольнике
     * @param {Object} point - Точка {x, z}
     * @param {Object} rect - Прямоугольник {x, z, width, height}
     * @returns {boolean}
     */
    pointInRect: function(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.z >= rect.z && 
               point.z <= rect.z + rect.height;
    },
    
    /**
     * Линейная интерполяция
     * @param {number} a - Начало
     * @param {number} b - Конец
     * @param {number} t - Параметр (0-1)
     * @returns {number}
     */
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * Ограничение значения диапазоном
     * @param {number} value - Значение
     * @param {number} min - Минимум
     * @param {number} max - Максимум
     * @returns {number}
     */
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * Форматирование времени (секунды -> MM:SS)
     * @param {number} seconds - Секунды
     * @returns {string}
     */
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Генерация случайного числа в диапазоне
     * @param {number} min - Минимум
     * @param {number} max - Максимум
     * @returns {number}
     */
    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * Создание текстуры краски программно
     * @param {number} color - Цвет краски (HEX)
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement}
     */
    createPaintTexture: function(color, size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Базовый цвет
        const cssColor = this.hexToCss(color);
        ctx.fillStyle = cssColor;
        ctx.fillRect(0, 0, size, size);
        
        // Добавляем шум для текстуры
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const alpha = Math.random() * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas;
    }
};

// Экспорт утилит для ES6 модулей
export { Utils };
