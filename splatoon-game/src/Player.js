/**
 * Класс игрока
 * Управление движением, стрельбой и состоянием игрока
 */

class Player {
    /**
     * @param {string} team - Название команды ('red', 'blue', 'green', 'yellow')
     * @param {Object} startPosition - Начальная позиция {x, y, z}
     * @param {PaintSystem} paintSystem - Система краски
     * @param {boolean} isLocal - Является ли локальным игроком (управляемым пользователем)
     */
    constructor(team, startPosition, paintSystem, isLocal = false) {
        this.team = team;
        this.color = CONFIG.teamColors[team];
        this.paintSystem = paintSystem;
        this.isLocal = isLocal;
        
        // Позиция и движение
        this.position = { ...startPosition };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = 0;
        
        // Параметры игрока
        this.radius = 0.5;
        this.height = 1.8;
        this.paintAmount = CONFIG.paintTankCapacity;
        this.lastShootTime = 0;
        this.isRefueling = false;
        this.refuelStartTime = 0;
        
        // Создание 3D модели игрока
        this.createMesh();
        
        // Индикатор краски над головой
        this.createPaintIndicator();
    }
    
    /**
     * Создание 3D модели игрока
     */
    createMesh() {
        // Группа для всех частей игрока
        this.mesh = new THREE.Group();
        
        // Тело (цилиндр)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Голова (сфера)
        const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.5,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Ноги (индикатор скорости)
        const legGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, 0.15, 0);
        this.leftLeg.castShadow = true;
        this.mesh.add(this.leftLeg);
        
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, 0.15, 0);
        this.rightLeg.castShadow = true;
        this.mesh.add(this.rightLeg);
        
        // Оружие (краскомет)
        const weaponGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
        const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.3, 1.2, 0.4);
        weapon.castShadow = true;
        this.mesh.add(weapon);
        
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.mesh.castShadow = true;
    }
    
    /**
     * Создание индикатора краски над головой
     */
    createPaintIndicator() {
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.8
        });
        
        this.paintIndicator = new THREE.Mesh(geometry, material);
        this.paintIndicator.position.y = 2.5;
        this.mesh.add(this.paintIndicator);
        
        // Фоновый цилиндр (пустой)
        const bgGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 8);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        
        this.paintIndicatorBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.paintIndicatorBg.position.y = 2.5;
        this.mesh.add(this.paintIndicatorBg);
    }
    
    /**
     * Обновление индикатора краски
     */
    updatePaintIndicator() {
        if (this.paintIndicator) {
            const scale = this.paintAmount / CONFIG.paintTankCapacity;
            this.paintIndicator.scale.y = Math.max(0.1, scale);
            this.paintIndicator.position.y = 2.5 - (1 - scale) * 0.25;
        }
    }
    
    /**
     * Обновление цвета ног в зависимости от скорости
     * @param {string} speedState - 'fast', 'normal', 'slow'
     */
    updateLegColor(speedState) {
        let color;
        switch(speedState) {
            case 'fast': color = 0x00ff00; break;   // Зелёный - быстро
            case 'normal': color = 0x888888; break; // Серый - нормально
            case 'slow': color = 0xff0000; break;   // Красный - медленно
            default: color = 0x888888;
        }
        
        const material = new THREE.MeshStandardMaterial({ color });
        this.leftLeg.material = material;
        this.rightLeg.material = material;
    }
    
    /**
     * Определение типа территории под игроком
     * @returns {string} 'own', 'enemy', 'neutral'
     */
    getTerrainType() {
        const terrainColor = this.paintSystem.getTerritoryColor(this.position.x, this.position.z);
        
        if (!terrainColor) {
            return 'neutral';
        } else if (terrainColor === this.team) {
            return 'own';
        } else {
            return 'enemy';
        }
    }
    
    /**
     * Расчёт скорости на основе территории
     * @returns {number} Множитель скорости
     */
    getSpeedMultiplier() {
        const terrainType = this.getTerrainType();
        
        switch(terrainType) {
            case 'own': return CONFIG.playerSpeedFast / CONFIG.playerSpeedNormal;
            case 'enemy': return CONFIG.playerSpeedSlow / CONFIG.playerSpeedNormal;
            default: return 1.0;
        }
    }
    
    /**
     * Движение игрока
     * @param {Object} input - Ввод {forward, backward, left, right}
     * @param {number} deltaTime - Время с последнего кадра
     */
    move(input, deltaTime) {
        const baseSpeed = CONFIG.playerSpeedNormal;
        const multiplier = this.getSpeedMultiplier();
        const speed = baseSpeed * multiplier;
        
        // Вычисление направления движения
        let moveX = 0;
        let moveZ = 0;
        
        if (input.forward) moveZ -= 1;
        if (input.backward) moveZ += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        
        // Нормализация диагонального движения
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (length > 0) {
            moveX /= length;
            moveZ /= length;
        }
        
        // Поворот игрока в направлении движения
        if (length > 0) {
            const targetRotation = Math.atan2(moveX, moveZ);
            
            // Плавный поворот
            let diff = targetRotation - this.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            this.rotation += diff * 10 * deltaTime;
        }
        
        // Применение движения
        this.position.x += moveX * speed * deltaTime;
        this.position.z += moveZ * speed * deltaTime;
        
        // Ограничение ареной
        const halfSize = CONFIG.arenaSize / 2 - this.radius;
        this.position.x = Utils.clamp(this.position.x, -halfSize, halfSize);
        this.position.z = Utils.clamp(this.position.z, -halfSize, halfSize);
        
        // Обновление позиции меша
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation;
        
        // Анимация ног
        if (length > 0) {
            const time = Date.now() * 0.01;
            this.leftLeg.rotation.x = Math.sin(time) * 0.5;
            this.rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;
        }
        
        // Обновление визуального индикатора скорости
        const terrainType = this.getTerrainType();
        this.updateLegColor(terrainType === 'own' ? 'fast' : terrainType === 'enemy' ? 'slow' : 'normal');
    }
    
    /**
     * Стрельба краской
     * @param {number} currentTime - Текущее время
     * @returns {boolean} Успешность выстрела
     */
    shoot(currentTime) {
        // Проверка перезарядки
        if (currentTime - this.lastShootTime < CONFIG.shootCooldown) {
            return false;
        }
        
        // Проверка наличия краски
        if (this.paintAmount < CONFIG.paintConsumptionPerShot) {
            return false;
        }
        
        // Расход краски
        this.paintAmount -= CONFIG.paintConsumptionPerShot;
        this.updatePaintIndicator();
        
        // Точка попадания (в направлении взгляда)
        const range = CONFIG.paintRange;
        const hitX = this.position.x + Math.sin(this.rotation) * range;
        const hitZ = this.position.z + Math.cos(this.rotation) * range;
        
        // Окрашивание области
        this.paintSystem.paintArea(hitX, hitZ, this.team);
        
        this.lastShootTime = currentTime;
        return true;
    }
    
    /**
     * Заправка у резервуара
     * @param {number} deltaTime - Время с последнего кадра
     * @returns {boolean} Идёт ли заправка
     */
    refuel(deltaTime) {
        // Проверка близости к резервуару своей команды
        const tankPos = CONFIG.tankPositions[this.team];
        const dist = Utils.distance2D(this.position, tankPos);
        
        if (dist < 3) {
            // Полная заправка
            if (this.paintAmount < CONFIG.paintTankCapacity) {
                this.paintAmount = Math.min(
                    CONFIG.paintTankCapacity,
                    this.paintAmount + CONFIG.refuelRate * deltaTime
                );
                this.updatePaintIndicator();
                this.isRefueling = true;
                return true;
            }
        }
        
        this.isRefueling = false;
        return false;
    }
    
    /**
     * Обновление игрока
     * @param {number} deltaTime - Время с последнего кадра
     */
    update(deltaTime) {
        // Автоматическая заправка если рядом с резервуаром
        this.refuel(deltaTime);
    }
    
    /**
     * Удаление игрока
     */
    dispose() {
        if (this.mesh) {
            // Рекурсивное удаление всех детей
            while(this.mesh.children.length > 0) {
                const child = this.mesh.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
                this.mesh.remove(child);
            }
        }
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
