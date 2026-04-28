/**
 * Конфигурация игры
 * Все настройки баланса вынесены в этот файл для удобной настройки
 */

const CONFIG = {
    // Скорости передвижения (ед./с)
    playerSpeedNormal: 5.0,      // Базовая скорость (нейтральная территория)
    playerSpeedFast: 7.5,        // Скорость по своей территории (+50%)
    playerSpeedSlow: 2.5,        // Скорость по вражеской территории (-50%)
    
    // Система краски
    paintTankCapacity: 100,      // Полный бак (ед.)
    paintConsumptionPerShot: 5,  // Расход за выстрел (ед.)
    refuelRate: 20,              // Скорость заправки (ед./с)
    refuelTime: 2,               // Время необходимое для полной заправки (с)
    
    // Параметры матча
    matchDuration: 300,          // Длительность матча (с) - 5 минут
    teamsCount: 4,               // Количество команд
    playersPerTeam: 3,           // Игроков в команде
    
    // Параметры стрельбы
    shootCooldown: 0.15,         // Задержка между выстрелами (с)
    paintSpread: 0.05,           // Разброс краски
    paintRange: 50,              // Дальность полёта краски (ед.)
    paintRadius: 0.8,            // Радиус пятна краски (ед.)
    
    // Размеры арены
    arenaSize: 100,              // Размер арены (ед.)
    arenaSegments: 100,          // Количество сегментов для текстуры
    
    // Цвета команд
    teamColors: {
        red: 0xff4444,
        blue: 0x4444ff,
        green: 0x44ff44,
        yellow: 0xffff44
    },
    
    // Стартовые позиции команд
    teamSpawnPoints: {
        red: { x: -40, z: -40 },
        blue: { x: 40, z: -40 },
        green: { x: -40, z: 40 },
        yellow: { x: 40, z: 40 }
    },
    
    // Позиции резервуаров для каждой команды
    tankPositions: {
        red: { x: -45, z: -45 },
        blue: { x: 45, z: -45 },
        green: { x: -45, z: 45 },
        yellow: { x: 45, z: 45 }
    }
};

// Экспорт конфигурации
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
