// Quantum Disarm - Game Logic
// 50 уникальных уровней с нарастающей сложностью

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.currentLevel = 0;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.soundEnabled = true;
        this.isSliding = false;
        this.slideDirection = null;
        
        // Типы клеток
        this.TYPES = {
            EMPTY: 0,
            WALL: 1,
            PLAYER: 2,
            BOMB: 3,
            SWITCH: 4,
            ICE: 5,
            PORTAL_ENTRY: 6,
            PORTAL_EXIT: 7,
            LASER: 8,
            BUTTON_ACTIVE: 9,
            DOOR_CLOSED: 10,
            DOOR_OPEN: 11
        };
        
        this.colors = {
            [this.TYPES.EMPTY]: '#1a1a2e',
            [this.TYPES.WALL]: '#95a5a6',
            [this.TYPES.PLAYER]: '#00ff88',
            [this.TYPES.BOMB]: '#ff6b6b',
            [this.TYPES.SWITCH]: '#ffd93d',
            [this.TYPES.ICE]: '#00ffff',
            [this.TYPES.PORTAL_ENTRY]: '#4ecdc4',
            [this.TYPES.PORTAL_EXIT]: '#4ecdc4',
            [this.TYPES.LASER]: 'rgba(231, 76, 60, 0.5)',
            [this.TYPES.BUTTON_ACTIVE]: '#2ecc71',
            [this.TYPES.DOOR_CLOSED]: '#e74c3c',
            [this.TYPES.DOOR_OPEN]: 'rgba(231, 76, 60, 0.3)'
        };
        
        this.levels = this.generateLevels();
        this.grid = [];
        this.playerPos = {x: 0, y: 0};
        this.switches = [];
        this.portals = {entry: null, exit: null};
        this.doors = [];
        
        this.init();
    }
    
    generateLevels() {
        // 50 уникальных уровней с различными механиками
        return [
            // Уровень 1 - Обучение: движение
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,0,3,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Добро пожаловать в Quantum Disarm! Используйте стрелки для перемещения. Доберитесь до бомбы (красная) чтобы обезвредить её."
            },
            
            // Уровень 2 - Стены
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,1,0,0,0,3,1],
                    [1,0,0,0,1,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Серые клетки - стены. Их нельзя пройти."
            },
            
            // Уровень 3 - Лабиринт
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,3,1],
                    [1,0,0,1,0,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Найдите путь через лабиринт!"
            },
            
            // Уровень 4 - Переключатель
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,4,0,1,0,3,1],
                    [1,0,0,0,0,0,1,0,0,1],
                    [1,0,1,1,1,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Жёлтые переключатели открывают новые пути! Встаньте на них чтобы активировать."
            },
            
            // Уровень 5 - Лёд (скольжение)
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,5,5,5,0,0,3,1],
                    [1,0,0,5,5,5,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Голубой лёд! На льду вы скользите пока не врежетесь в стену."
            },
            
            // Уровень 6 - Порталы
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,6,1,7,0,3,1],
                    [1,0,0,0,0,1,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Бирюзовые порталы связаны! Войдите в один и выйдете из другого."
            },
            
            // Уровень 7 - Комбо: лёд + портал
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,6,1,7,5,3,1],
                    [1,0,5,5,5,1,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Используйте портал чтобы пересечь ледяное поле!"
            },
            
            // Уровень 8 - Лазеры
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,8,0,0,0,3,1],
                    [1,0,0,0,8,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Красные лазеры опасны! Не наступайте на них."
            },
            
            // Уровень 9 - Двери
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,4,10,0,0,0,3,1],
                    [1,0,0,0,10,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Красные двери закрыты. Активируйте переключатель чтобы открыть их!"
            },
            
            // Уровень 10 - Сложный лабиринт
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,1,0,0,1],
                    [1,0,0,1,0,1,1,0,1,1],
                    [1,0,1,0,0,0,0,0,3,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 10! Вы освоили основы. Теперь сложнее..."
            },
            
            // Уровень 11-20: Средние уровни
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,1,0,0,0,0,3,1],
                    [1,0,1,1,0,1,0,1,1,1,0,1],
                    [1,0,0,0,0,0,0,0,0,1,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 11"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,1,5,5,5,0,3,1],
                    [1,0,5,5,5,1,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 12: Длинное скольжение"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,6,0,0,7,0,0,0,3,1],
                    [1,0,1,1,1,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 13: Портальный прыжок"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,4,0,10,0,0,0,3,1],
                    [1,0,1,1,1,1,10,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 14: Ключ к двери"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,8,0,0,8,0,0,8,3,1],
                    [1,0,0,8,0,0,8,0,0,8,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 15: Лазерный коридор"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,6,5,1,7,5,5,0,3,1],
                    [1,0,5,5,5,1,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 16: Лёд и порталы"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,4,0,0,10,0,3,1],
                    [1,0,1,1,1,1,1,1,10,1,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 17: Найди переключатель"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,0,0,3,1],
                    [1,0,0,1,0,1,0,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,1,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 18: Змейка"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,0,0,5,5,5,0,3,1],
                    [1,1,1,1,0,0,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 19: Ледяной танец"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,6,0,1,7,6,0,0,3,1],
                    [1,0,0,1,0,1,0,1,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 20: Двойной портал"
            },
            
            // Уровень 21-30: Сложные уровни
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,1,0,0,0,0,0,3,1],
                    [1,0,1,1,1,0,1,0,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 21: Новый размер"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,5,1,5,5,5,5,0,3,1],
                    [1,0,5,5,5,5,1,5,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 22: Большое ледяное поле"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,4,0,4,0,10,10,0,0,0,3,1],
                    [1,0,1,1,1,1,1,10,10,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 23: Два переключателя"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,6,0,0,7,0,6,0,7,0,3,1],
                    [1,0,1,1,1,1,1,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 24: Портальная цепочка"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,8,8,8,0,0,8,8,8,0,3,1],
                    [1,0,0,8,8,8,0,0,8,8,8,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 25: Лазерный лабиринт"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,6,5,0,0,7,5,5,5,0,3,1],
                    [1,0,5,5,5,0,0,5,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 26: Скользи к порталу"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,10,0,0,10,0,0,10,0,3,1],
                    [1,0,4,0,10,0,0,10,0,0,10,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 27: Три двери"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,0,0,0,1,3,1],
                    [1,0,0,1,0,1,0,1,0,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,1,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 28: Извилистый путь"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,6,5,5,7,5,5,5,3,1],
                    [1,0,5,5,5,5,5,5,5,5,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 29: Центральный портал"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,0,0,0,0,0,3,1],
                    [1,0,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 30: Лазерная стена"
            },
            
            // Уровень 31-40: Очень сложные
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,1,0,0,0,0,0,0,3,1],
                    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 31: Ещё больше пространства"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,5,5,1,5,5,5,5,5,0,3,1],
                    [1,0,5,5,5,5,5,1,5,5,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 32: Гигантский лёд"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,6,0,0,0,7,0,6,0,0,7,0,3,1],
                    [1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 33: Четыре портала"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,4,0,4,0,4,10,10,10,0,0,0,3,1],
                    [1,0,1,1,1,1,1,1,10,10,10,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 34: Три переключателя"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,8,0,8,0,8,0,8,0,8,0,8,3,1],
                    [1,0,0,8,0,8,0,8,0,8,0,8,0,8,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 35: Лазерный дождь"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,6,5,5,0,0,7,5,5,6,5,5,3,1],
                    [1,0,5,5,5,5,0,0,5,5,5,5,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 36: Двойной лёд-портал"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,10,10,10,10,10,0,0,0,0,3,1],
                    [1,0,4,0,10,10,10,10,10,0,4,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 37: Стена дверей"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,0,0,0,1,0,0,3,1],
                    [1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 38: Длинная змейка"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,5,6,5,5,7,5,5,5,5,3,1],
                    [1,0,5,5,5,5,5,5,5,5,5,5,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 39: Портал во льдах"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
                    [1,0,8,8,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,0,8,8,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 40: Двойная лазерная стена"
            },
            
            // Уровень 41-50: Экспертные
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
                    [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 41: Максимальный размер"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,5,5,5,1,5,5,5,5,5,5,0,3,1],
                    [1,0,5,5,5,5,5,5,1,5,5,5,5,5,5,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 42: Огромное ледяное поле"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,6,0,6,0,6,7,7,7,0,0,0,0,0,3,1],
                    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 43: Множественные порталы"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,4,0,4,0,4,0,4,10,10,10,10,0,0,3,1],
                    [1,0,1,1,1,1,1,1,1,1,10,10,10,10,1,1,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 44: Четыре переключателя"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,8,0,8,0,8,0,8,0,8,0,8,0,8,3,1],
                    [1,0,0,8,0,8,0,8,0,8,0,8,0,8,0,8,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 45: Плотный лазер"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,6,5,5,5,0,0,0,7,5,5,5,6,5,3,1],
                    [1,0,5,5,5,5,5,0,0,0,5,5,5,5,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 46: Тройной портал лёд"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,10,10,10,10,10,10,10,10,0,0,3,1],
                    [1,0,4,0,10,10,10,10,10,10,10,10,0,4,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 47: Длинная стена дверей"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,1,0,0,0,1,0,0,0,1,0,0,0,1,3,1],
                    [1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
                    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 48: Супер змейка"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,5,5,5,5,5,6,5,5,7,5,5,5,5,5,3,1],
                    [1,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,0,1],
                    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 49: Финальный лёд"
            },
            {
                map: [
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
                    [1,0,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,0,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,0,8,8,8,8,8,8,8,8,8,8,8,8,8,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
                ],
                message: "Уровень 50: ФИНАЛЬНЫЙ ВЫЗОВ! Пройдите через три лазерные стены!"
            }
        ];
    }
    
    init() {
        this.loadLevel(0);
        this.setupControls();
        this.startTimer();
        this.showMessage("QUANTUM DISARM", "Судьба человечества в ваших руках! Обезвредьте 50 квантовых бомб.", "warning");
    }
    
    loadLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= this.levels.length) return;
        
        this.currentLevel = levelIndex;
        const level = this.levels[levelIndex];
        
        // Клонируем карту чтобы не модифицировать оригинал
        this.grid = level.map.map(row => [...row]);
        
        // Находим игрока и особые элементы
        this.switches = [];
        this.portals = {entry: null, exit: null};
        this.doors = [];
        
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === this.TYPES.PLAYER) {
                    this.playerPos = {x, y};
                    this.grid[y][x] = this.TYPES.EMPTY;
                } else if (this.grid[y][x] === this.TYPES.SWITCH) {
                    this.switches.push({x, y, active: false});
                } else if (this.grid[y][x] === this.TYPES.PORTAL_ENTRY) {
                    this.portals.entry = {x, y};
                } else if (this.grid[y][x] === this.TYPES.PORTAL_EXIT) {
                    this.portals.exit = {x, y};
                } else if (this.grid[y][x] === this.TYPES.DOOR_CLOSED) {
                    this.doors.push({x, y});
                }
            }
        }
        
        this.moves = 0;
        this.updateUI();
        this.render();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.isSliding) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.move(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.move(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.move(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.move(1, 0);
                    break;
                case 'r':
                case 'R':
                    this.restartLevel();
                    break;
            }
        });
    }
    
    move(dx, dy) {
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        
        if (!this.isValidMove(newX, newY)) return;
        
        this.playerPos.x = newX;
        this.playerPos.y = newY;
        this.moves++;
        
        // Проверяем тип клетки
        const cellType = this.grid[newY][newX];
        
        // Переключатель
        if (cellType === this.TYPES.SWITCH) {
            this.activateSwitch(newX, newY);
        }
        
        // Портал
        if (cellType === this.TYPES.PORTAL_ENTRY && this.portals.exit) {
            this.playerPos.x = this.portals.exit.x;
            this.playerPos.y = this.portals.exit.y;
        } else if (cellType === this.TYPES.PORTAL_EXIT && this.portals.entry) {
            this.playerPos.x = this.portals.entry.x;
            this.playerPos.y = this.portals.entry.y;
        }
        
        // Лазер
        if (cellType === this.TYPES.LASER) {
            this.gameOver();
            return;
        }
        
        // Бомба - победа
        if (cellType === this.TYPES.BOMB) {
            this.levelComplete();
            return;
        }
        
        // Лёд - скольжение
        if (cellType === this.TYPES.ICE) {
            this.slide(dx, dy);
            return;
        }
        
        this.updateUI();
        this.render();
    }
    
    slide(dx, dy) {
        this.isSliding = true;
        this.slideDirection = {dx, dy};
        
        const slideInterval = setInterval(() => {
            const newX = this.playerPos.x + dx;
            const newY = this.playerPos.y + dy;
            
            if (!this.isValidMove(newX, newY)) {
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
                this.updateUI();
                this.render();
                return;
            }
            
            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.moves++;
            
            const cellType = this.grid[newY][newX];
            
            if (cellType === this.TYPES.SWITCH) {
                this.activateSwitch(newX, newY);
            }
            
            if (cellType === this.TYPES.PORTAL_ENTRY && this.portals.exit) {
                this.playerPos.x = this.portals.exit.x;
                this.playerPos.y = this.portals.exit.y;
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
            } else if (cellType === this.TYPES.PORTAL_EXIT && this.portals.entry) {
                this.playerPos.x = this.portals.entry.x;
                this.playerPos.y = this.portals.entry.y;
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
            }
            
            if (cellType === this.TYPES.LASER) {
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
                this.gameOver();
                return;
            }
            
            if (cellType === this.TYPES.BOMB) {
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
                this.levelComplete();
                return;
            }
            
            if (cellType !== this.TYPES.ICE) {
                clearInterval(slideInterval);
                this.isSliding = false;
                this.slideDirection = null;
            }
            
            this.updateUI();
            this.render();
        }, 100);
    }
    
    isValidMove(x, y) {
        if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[0].length) {
            return false;
        }
        
        const cellType = this.grid[y][x];
        
        // Стены и закрытые двери непроходимы
        if (cellType === this.TYPES.WALL || cellType === this.TYPES.DOOR_CLOSED) {
            return false;
        }
        
        return true;
    }
    
    activateSwitch(x, y) {
        const switchObj = this.switches.find(s => s.x === x && s.y === y);
        if (switchObj && !switchObj.active) {
            switchObj.active = true;
            this.grid[y][x] = this.TYPES.BUTTON_ACTIVE;
            
            // Открываем все двери
            this.doors.forEach(door => {
                this.grid[door.y][door.x] = this.TYPES.DOOR_OPEN;
            });
        }
    }
    
    levelComplete() {
        this.stopTimer();
        
        if (this.currentLevel < this.levels.length - 1) {
            setTimeout(() => {
                this.showMessage(
                    "УРОВЕНЬ ПРОЙДЕН!",
                    `Бомба обезврежена! Переходим к уровню ${this.currentLevel + 2}`,
                    "success"
                );
                this.loadLevel(this.currentLevel + 1);
                setTimeout(() => {
                    this.showMessage(
                        this.levels[this.currentLevel].message.split(':')[0],
                        this.levels[this.currentLevel].message,
                        "warning"
                    );
                }, 500);
            }, 500);
        } else {
            this.showMessage(
                "ПОБЕДА!",
                "Вы обезвредили все 50 бомб и спасли человечество! Герой!",
                "success"
            );
        }
    }
    
    gameOver() {
        this.stopTimer();
        this.showMessage(
            "ВЗРЫВ!",
            "Вы погибли. Попробуйте снова.",
            "failure"
        );
    }
    
    restartLevel() {
        this.loadLevel(this.currentLevel);
        this.startTimer();
    }
    
    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.loadLevel(this.currentLevel + 1);
            this.startTimer();
        }
    }
    
    prevLevel() {
        if (this.currentLevel > 0) {
            this.loadLevel(this.currentLevel - 1);
            this.startTimer();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.querySelector('#footer button:last-child');
        btn.textContent = `Звук: ${this.soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
    }
    
    startTimer() {
        this.stopTimer();
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer-display').textContent = 
            `Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateUI() {
        document.getElementById('level-display').textContent = 
            `Уровень: ${this.currentLevel + 1}/${this.levels.length}`;
        document.getElementById('moves-display').textContent = `Ходы: ${this.moves}`;
    }
    
    showMessage(title, text, type) {
        const overlay = document.getElementById('message-overlay');
        const titleEl = document.getElementById('message-title');
        const textEl = document.getElementById('message-text');
        
        titleEl.textContent = title;
        titleEl.className = type;
        textEl.textContent = text;
        overlay.style.display = 'flex';
    }
    
    closeMessage() {
        document.getElementById('message-overlay').style.display = 'none';
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const rows = this.grid.length;
        const cols = this.grid[0].length;
        
        // Центрируем сетку
        const offsetX = (this.canvas.width - cols * this.cellSize) / 2;
        const offsetY = (this.canvas.height - rows * this.cellSize) / 2;
        
        // Рисуем сетку
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cellType = this.grid[y][x];
                const posX = offsetX + x * this.cellSize;
                const posY = offsetY + y * this.cellSize;
                
                // Основной цвет клетки
                this.ctx.fillStyle = this.colors[cellType] || this.colors[this.TYPES.EMPTY];
                this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
                
                // Границы
                this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);
                
                // Дополнительные эффекты
                if (cellType === this.TYPES.ICE) {
                    // Блеск льда
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(posX + 5, posY + 5);
                    this.ctx.lineTo(posX + 15, posY + 5);
                    this.ctx.lineTo(posX + 5, posY + 15);
                    this.ctx.fill();
                }
                
                if (cellType === this.TYPES.LASER) {
                    // Пульсация лазера
                    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                    this.ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
                    this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
                }
                
                if (cellType === this.TYPES.PORTAL_ENTRY || cellType === this.TYPES.PORTAL_EXIT) {
                    // Вихрь портала
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    const centerX = posX + this.cellSize / 2;
                    const centerY = posY + this.cellSize / 2;
                    const angle = Date.now() / 500;
                    for (let i = 0; i < 3; i++) {
                        this.ctx.arc(centerX, centerY, 10 + i * 3, angle + i, angle + Math.PI);
                    }
                    this.ctx.stroke();
                }
            }
        }
        
        // Рисуем игрока
        const playerX = offsetX + this.playerPos.x * this.cellSize;
        const playerY = offsetY + this.playerPos.y * this.cellSize;
        
        this.ctx.fillStyle = this.colors[this.TYPES.PLAYER];
        this.ctx.beginPath();
        this.ctx.arc(
            playerX + this.cellSize / 2,
            playerY + this.cellSize / 2,
            this.cellSize / 2 - 4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Свечение игрока
        this.ctx.shadowColor = this.colors[this.TYPES.PLAYER];
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Анимация
        requestAnimationFrame(() => this.render());
    }
}

// Запуск игры
const game = new Game();
