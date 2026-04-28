/**
 * Класс арены
 * Создание и управление игровой ареной, резервуарами, освещением
 */

class Arena {
    /**
     * @param {THREE.Scene} scene - Сцена Three.js
     */
    constructor(scene) {
        this.scene = scene;
        this.arenaSize = CONFIG.arenaSize;
        
        // Создание компонентов арены
        this.createBoundary();
        this.createTanks();
        this.createLighting();
        this.createTimerDisplay();
    }
    
    /**
     * Создание границ арены
     */
    createBoundary() {
        const halfSize = this.arenaSize / 2;
        const wallHeight = 3;
        const wallThickness = 1;
        
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Четыре стены
        const walls = [
            { pos: { x: 0, z: -halfSize - wallThickness/2 }, rot: 0, size: { w: this.arenaSize + wallThickness*2, h: wallHeight, d: wallThickness } },
            { pos: { x: 0, z: halfSize + wallThickness/2 }, rot: 0, size: { w: this.arenaSize + wallThickness*2, h: wallHeight, d: wallThickness } },
            { pos: { x: -halfSize - wallThickness/2, z: 0 }, rot: Math.PI / 2, size: { w: this.arenaSize, h: wallHeight, d: wallThickness } },
            { pos: { x: halfSize + wallThickness/2, z: 0 }, rot: Math.PI / 2, size: { w: this.arenaSize, h: wallHeight, d: wallThickness } }
        ];
        
        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size.w, wall.size.h, wall.size.d);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(wall.pos.x, wallHeight / 2, wall.pos.z);
            mesh.rotation.y = wall.rot;
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            this.scene.add(mesh);
        });
        
        // Угловые колонны
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, wallHeight + 2, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        const corners = [
            { x: -halfSize, z: -halfSize },
            { x: halfSize, z: -halfSize },
            { x: -halfSize, z: halfSize },
            { x: halfSize, z: halfSize }
        ];
        
        corners.forEach(corner => {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(corner.x, (wallHeight + 2) / 2, corner.z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });
    }
    
    /**
     * Создание резервуаров с краской для каждой команды
     */
    createTanks() {
        this.tanks = {};
        
        const tankColors = {
            red: 0xff0000,
            blue: 0x0000ff,
            green: 0x00ff00,
            yellow: 0xffff00
        };
        
        Object.keys(CONFIG.tankPositions).forEach(team => {
            const pos = CONFIG.tankPositions[team];
            
            // Группа для резервуара
            const tankGroup = new THREE.Group();
            
            // Основание
            const baseGeometry = new THREE.CylinderGeometry(2, 2.5, 0.5, 16);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 0.25;
            base.castShadow = true;
            tankGroup.add(base);
            
            // Резервуар (прозрачный цилиндр)
            const tankGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16, 1, true);
            const tankMaterial = new THREE.MeshStandardMaterial({ 
                color: tankColors[team],
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const tank = new THREE.Mesh(tankGeometry, tankMaterial);
            tank.position.y = 2;
            tankGroup.add(tank);
            
            // Верхняя крышка
            const topGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16);
            const topMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = 3.65;
            tankGroup.add(top);
            
            // Светящийся индикатор
            const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const lightMaterial = new THREE.MeshBasicMaterial({ color: tankColors[team] });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.y = 4;
            tankGroup.add(light);
            
            tankGroup.position.set(pos.x, 0, pos.z);
            this.scene.add(tankGroup);
            
            this.tanks[team] = {
                mesh: tankGroup,
                position: pos
            };
        });
    }
    
    /**
     * Создание освещения
     */
    createLighting() {
        // Ambient light (общее освещение)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (солнце)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -CONFIG.arenaSize;
        directionalLight.shadow.camera.right = CONFIG.arenaSize;
        directionalLight.shadow.camera.top = CONFIG.arenaSize;
        directionalLight.shadow.camera.bottom = -CONFIG.arenaSize;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Точечные светильники по углам
        const pointLightColor = 0xffffff;
        const pointLightIntensity = 0.5;
        const halfSize = this.arenaSize / 2;
        
        const pointPositions = [
            { x: -halfSize + 10, z: -halfSize + 10 },
            { x: halfSize - 10, z: -halfSize + 10 },
            { x: -halfSize + 10, z: halfSize - 10 },
            { x: halfSize - 10, z: halfSize - 10 }
        ];
        
        pointPositions.forEach(pos => {
            const pointLight = new THREE.PointLight(pointLightColor, pointLightIntensity, 50);
            pointLight.position.set(pos.x, 15, pos.z);
            this.scene.add(pointLight);
        });
    }
    
    /**
     * Создание дисплея таймера над ареной
     */
    createTimerDisplay() {
        // Простая платформа для таймера
        const platformGeometry = new THREE.BoxGeometry(20, 1, 5);
        const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 25, 0);
        platform.castShadow = true;
        this.scene.add(platform);
        
        // Места для цифр (просто кубы разных цветов)
        this.timerDigits = [];
        for (let i = 0; i < 5; i++) {
            const digitGeometry = new THREE.BoxGeometry(2, 3, 1);
            const digitMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,
                emissive: 0x444444
            });
            const digit = new THREE.Mesh(digitGeometry, digitMaterial);
            digit.position.set(-8 + i * 4, 26, 0);
            this.scene.add(digit);
            this.timerDigits.push(digit);
        }
    }
    
    /**
     * Обновление отображения таймера
     * @param {number} timeRemaining - Оставшееся время в секундах
     */
    updateTimerDisplay(timeRemaining) {
        // Форматирование времени MM:SS
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = Math.floor(timeRemaining % 60);
        
        // Простая визуализация (в реальной игре можно использовать текстуры)
        const totalSeconds = minutes * 60 + seconds;
        
        // Изменение цвета в зависимости от времени
        if (totalSeconds < 30) {
            // Последние 30 секунд - красный
            this.timerDigits.forEach(digit => {
                digit.material.emissive.setHex(0xff0000);
            });
        } else if (totalSeconds < 60) {
            // Последняя минута - жёлтый
            this.timerDigits.forEach(digit => {
                digit.material.emissive.setHex(0xffff00);
            });
        }
    }
    
    /**
     * Проверка нахождения игрока рядом с резервуаром
     * @param {Object} position - Позиция игрока {x, z}
     * @param {string} team - Команда игрока
     * @returns {boolean}
     */
    isNearTank(position, team) {
        const tank = this.tanks[team];
        if (!tank) return false;
        
        const dist = Utils.distance2D(position, tank.position);
        return dist < 3;
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Arena;
}
