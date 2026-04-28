/**
 * Система краски - управление окрашиванием арены
 * Отвечает за текстуру арены, подсчёт процентов покрытия и частицы
 */

class PaintSystem {
    /**
     * @param {THREE.WebGLRenderer} renderer 
     * @param {number} arenaSize - Размер арены
     * @param {number} segments - Количество сегментов
     */
    constructor(renderer, arenaSize, segments) {
        this.renderer = renderer;
        this.arenaSize = arenaSize;
        this.segments = segments;
        
        // Массив для хранения цвета каждого сегмента (нейтральный = null)
        this.paintGrid = [];
        for (let i = 0; i < segments; i++) {
            this.paintGrid[i] = new Array(segments).fill(null);
        }
        
        // Создание canvas для динамической текстуры
        this.canvas = document.createElement('canvas');
        this.canvas.width = segments;
        this.canvas.height = segments;
        this.ctx = this.canvas.getContext('2d');
        
        // Инициализация текстуры нейтральным цветом
        this.fillNeutral();
        
        // Создание THREE текстуры
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        
        // Создание меша арены
        this.createArenaMesh();
        
        // Система частиц
        this.particles = [];
        this.maxParticles = 1000;
        
        // Статистика покрытия
        this.coverageStats = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0,
            neutral: 100
        };
    }
    
    /**
     * Заполнение арены нейтральным цветом
     */
    fillNeutral() {
        const ctx = this.ctx;
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Добавляем сетку для визуального разделения
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.segments; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.segments);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.segments, i);
            ctx.stroke();
        }
        
        this.texture.needsUpdate = true;
    }
    
    /**
     * Создание меша арены
     */
    createArenaMesh() {
        const geometry = new THREE.PlaneGeometry(this.arenaSize, this.arenaSize);
        const material = new THREE.MeshStandardMaterial({
            map: this.texture,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.arenaMesh = new THREE.Mesh(geometry, material);
        this.arenaMesh.rotation.x = -Math.PI / 2;
        this.arenaMesh.receiveShadow = true;
    }
    
    /**
     * Преобразование мировых координат в координаты сетки
     * @param {number} x - Координата X
     * @param {number} z - Координата Z
     * @returns {Object} {gridX, gridZ}
     */
    worldToGrid(x, z) {
        const halfSize = this.arenaSize / 2;
        const gridX = Math.floor(((x + halfSize) / this.arenaSize) * this.segments);
        const gridZ = Math.floor(((z + halfSize) / this.arenaSize) * this.segments);
        
        return {
            gridX: Math.max(0, Math.min(this.segments - 1, gridX)),
            gridZ: Math.max(0, Math.min(this.segments - 1, gridZ))
        };
    }
    
    /**
     * Окрашивание области арены
     * @param {number} x - Координата X центра
     * @param {number} z - Координата Z центра
     * @param {string} teamColor - Цвет команды ('red', 'blue', 'green', 'yellow')
     * @param {number} radius - Радиус окрашивания
     */
    paintArea(x, z, teamColor, radius = CONFIG.paintRadius) {
        const center = this.worldToGrid(x, z);
        const gridRadius = Math.ceil(radius * this.segments / this.arenaSize);
        
        const colorHex = CONFIG.teamColors[teamColor];
        const cssColor = Utils.hexToCss(colorHex);
        
        // Окрашиваем область вокруг точки попадания
        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            for (let dz = -gridRadius; dz <= gridRadius; dz++) {
                const gx = center.gridX + dx;
                const gz = center.gridZ + dz;
                
                if (gx >= 0 && gx < this.segments && gz >= 0 && gz < this.segments) {
                    // Проверка расстояния для круглой области
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist <= gridRadius) {
                        this.paintGrid[gx][gz] = teamColor;
                        
                        // Рисуем на канвасе с некоторой прозрачностью для смешивания
                        const alpha = 1 - (dist / gridRadius) * 0.5;
                        this.ctx.fillStyle = cssColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
                        this.ctx.fillRect(gx, gz, 1, 1);
                    }
                }
            }
        }
        
        this.texture.needsUpdate = true;
        this.updateCoverageStats();
        
        // Добавляем частицы
        this.addPaintParticles(x, z, colorHex);
    }
    
    /**
     * Добавление частиц краски
     * @param {number} x - Координата X
     * @param {number} z - Координата Z
     * @param {number} color - Цвет частиц
     */
    addPaintParticles(x, z, color) {
        const particleCount = Math.min(10, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x + Utils.randomRange(-0.5, 0.5),
                y: 0.1,
                z: z + Utils.randomRange(-0.5, 0.5),
                vx: Utils.randomRange(-2, 2),
                vy: Utils.randomRange(3, 6),
                vz: Utils.randomRange(-2, 2),
                color: color,
                life: 1.0,
                size: Utils.randomRange(0.1, 0.3)
            });
        }
    }
    
    /**
     * Обновление статистики покрытия
     */
    updateCoverageStats() {
        let counts = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0,
            neutral: 0
        };
        
        const total = this.segments * this.segments;
        
        for (let x = 0; x < this.segments; x++) {
            for (let z = 0; z < this.segments; z++) {
                const color = this.paintGrid[x][z];
                if (color) {
                    counts[color]++;
                } else {
                    counts.neutral++;
                }
            }
        }
        
        // Преобразование в проценты
        this.coverageStats = {
            red: (counts.red / total * 100).toFixed(1),
            blue: (counts.blue / total * 100).toFixed(1),
            green: (counts.green / total * 100).toFixed(1),
            yellow: (counts.yellow / total * 100).toFixed(1),
            neutral: (counts.neutral / total * 100).toFixed(1)
        };
    }
    
    /**
     * Получение цвета территории в точке
     * @param {number} x - Координата X
     * @param {number} z - Координата Z
     * @returns {string|null} Цвет команды или null (нейтральный)
     */
    getTerritoryColor(x, z) {
        const grid = this.worldToGrid(x, z);
        return this.paintGrid[grid.gridX][grid.gridZ];
    }
    
    /**
     * Обновление частиц
     * @param {number} deltaTime - Время с последнего кадра
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Физика
            p.vy -= 9.8 * deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.z += p.vz * deltaTime;
            
            // Столкновение с землёй
            if (p.y <= 0) {
                p.y = 0;
                p.vy *= -0.3;
                p.vx *= 0.8;
                p.vz *= 0.8;
                
                if (Math.abs(p.vy) < 0.5) {
                    p.life -= deltaTime * 2;
                }
            }
            
            p.life -= deltaTime * 0.5;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Отрисовка частиц
     * @param {THREE.Scene} scene
     */
    renderParticles(scene) {
        // Простая реализация через Points
        if (this.particles.length === 0) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        this.particles.forEach(p => {
            positions.push(p.x, p.y, p.z);
            
            const color = new THREE.Color(p.color);
            colors.push(color.r, color.g, color.b);
        });
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        
        // Удаляем после отрисовки (в реальном проекте нужно переиспользовать)
        scene.remove(points);
        geometry.dispose();
        material.dispose();
    }
}

// Экспорт класса
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaintSystem;
}
