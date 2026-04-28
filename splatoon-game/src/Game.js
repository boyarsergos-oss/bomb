import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { PaintSystem } from './PaintSystem.js';
import { Player } from './Player.js';
import { Arena } from './Arena.js';

class Game {
    constructor() {
        // Состояние игры
        this.state = 'selection'; // 'selection', 'playing', 'gameover'
        this.selectedTeam = null;
        this.localPlayer = null;
        this.players = [];
        this.bots = [];
        
        // Время матча
        this.matchTimeRemaining = CONFIG.matchDuration;
        this.lastUpdateTime = 0;
        
        // Ввод
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        // Камера
        this.cameraOffset = { x: 0, y: 8, z: -12 };
        this.cameraLookAtOffset = { x: 0, y: 2, z: 0 };
        
        // Инициализация Three.js
        this.initThreeJS();
        
        // Обработчики событий
        this.setupEventListeners();
        
        // Запуск игрового цикла
        this.gameLoop();
    }
    
    /**
     * Инициализация Three.js
     */
    initThreeJS() {
        // Создание сцены
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Небо
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);
        
        // Настройка рендерера
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Создание камеры
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Создание системы краски и арены
        this.paintSystem = new PaintSystem(this.renderer, CONFIG.arenaSize, CONFIG.arenaSegments);
        this.scene.add(this.paintSystem.arenaMesh);
        
        this.arena = new Arena(this.scene);
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Заправка по клавише E
            if (e.code === 'KeyE' && this.state === 'playing' && this.localPlayer) {
                this.localPlayer.isRefueling = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'KeyE' && this.localPlayer) {
                this.localPlayer.isRefueling = false;
            }
        });
        
        // Мышь
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.movementX || 0;
            this.mouseY = e.movementY || 0;
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // ЛКМ
                this.mouseDown = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        // Захват курсора
        this.canvas.addEventListener('click', () => {
            if (this.state === 'playing') {
                this.canvas.requestPointerLock();
            }
        });
        
        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    /**
     * Выбор команды игроком
     * @param {string} team - Название команды
     */
    selectTeam(team) {
        this.selectedTeam = team;
        
        // Скрытие экрана выбора команды
        document.getElementById('team-selection').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        
        // Создание игроков
        this.createPlayers();
        
        // Установка локального игрока
        this.localPlayer = this.players[0];
        
        // Начало матча
        this.state = 'playing';
        this.lastUpdateTime = performance.now();
        
        // Захват курсора
        this.canvas.requestPointerLock();
    }
    
    /**
     * Создание всех игроков на арене
     */
    createPlayers() {
        const teams = ['red', 'blue', 'green', 'yellow'];
        
        teams.forEach((team, teamIndex) => {
            for (let i = 0; i < CONFIG.playersPerTeam; i++) {
                const spawnPoint = CONFIG.teamSpawnPoints[team];
                
                // Смещение позиций для игроков одной команды
                const offset = (i - 1) * 3;
                const position = {
                    x: spawnPoint.x + (teamIndex % 2 === 0 ? offset : 0),
                    y: 0,
                    z: spawnPoint.z + (teamIndex % 2 === 1 ? offset : 0)
                };
                
                const isLocal = (team === this.selectedTeam && i === 0);
                const player = new Player(team, position, this.paintSystem, isLocal);
                
                this.scene.add(player.mesh);
                this.players.push(player);
                
                if (!isLocal) {
                    this.bots.push(player);
                }
            }
        });
    }
    
    /**
     * Получение ввода от игрока
     * @returns {Object} Ввод {forward, backward, left, right}
     */
    getInput() {
        return {
            forward: this.keys['KeyW'] || this.keys['ArrowUp'],
            backward: this.keys['KeyS'] || this.keys['ArrowDown'],
            left: this.keys['KeyA'] || this.keys['ArrowLeft'],
            right: this.keys['KeyD'] || this.keys['ArrowRight']
        };
    }
    
    /**
     * Обновление камеры (вид от третьего лица)
     * @param {number} deltaTime - Время с последнего кадра
     */
    updateCamera(deltaTime) {
        if (!this.localPlayer) return;
        
        // Поворот камеры мышью
        const rotationSpeed = 0.002;
        this.cameraAngle = (this.cameraAngle || 0) + this.mouseX * rotationSpeed;
        this.cameraPitch = Math.max(-0.5, Math.min(0.5, (this.cameraPitch || 0) + this.mouseY * rotationSpeed));
        
        // Позиция камеры относительно игрока
        const playerPos = this.localPlayer.position;
        const distance = 15;
        const height = 10;
        
        const cameraX = playerPos.x + Math.sin(this.cameraAngle) * distance;
        const cameraZ = playerPos.z + Math.cos(this.cameraAngle) * distance;
        const cameraY = playerPos.y + height + Math.abs(this.cameraPitch) * 5;
        
        // Плавное движение камеры
        this.camera.position.x = Utils.lerp(this.camera.position.x, cameraX, deltaTime * 5);
        this.camera.position.y = Utils.lerp(this.camera.position.y, cameraY, deltaTime * 5);
        this.camera.position.z = Utils.lerp(this.camera.position.z, cameraZ, deltaTime * 5);
        
        // Камера смотрит на игрока
        this.camera.lookAt(playerPos.x, playerPos.y + 2, playerPos.z);
    }
    
    /**
     * Обновление ботов (простой ИИ)
     * @param {number} deltaTime - Время с последнего кадра
     */
    updateBots(deltaTime) {
        this.bots.forEach(bot => {
            // Простое поведение: движение в случайном направлении и стрельба
            const time = Date.now() * 0.001;
            
            // Движение
            const input = {
                forward: Math.sin(time + bot.team.length) > 0,
                backward: Math.sin(time + bot.team.length) < -0.5,
                left: Math.cos(time + bot.team.length) > 0,
                right: Math.cos(time + bot.team.length) < -0.5
            };
            
            bot.move(input, deltaTime);
            
            // Стрельба если есть краска
            if (bot.paintAmount > CONFIG.paintConsumptionPerShot) {
                bot.shoot(performance.now() / 1000);
            }
            
            // Возврат к резервуару если мало краски
            if (bot.paintAmount < 30) {
                const tankPos = CONFIG.tankPositions[bot.team];
                const dirX = tankPos.x - bot.position.x;
                const dirZ = tankPos.z - bot.position.z;
                const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
                
                if (dist > 5) {
                    bot.rotation = Math.atan2(dirX, dirZ);
                    bot.position.x += Math.sin(bot.rotation) * CONFIG.playerSpeedNormal * deltaTime;
                    bot.position.z += Math.cos(bot.rotation) * CONFIG.playerSpeedNormal * deltaTime;
                    bot.mesh.position.x = bot.position.x;
                    bot.mesh.position.z = bot.position.z;
                    bot.mesh.rotation.y = bot.rotation;
                }
            }
        });
    }
    
    /**
     * Обновление UI
     */
    updateUI() {
        if (!this.localPlayer) return;
        
        // Индикатор краски
        const paintPercent = (this.localPlayer.paintAmount / CONFIG.paintTankCapacity) * 100;
        document.getElementById('paint-fill').style.width = `${paintPercent}%`;
        
        // Цвет индикатора краски в цвет команды
        const teamColor = Utils.hexToCss(this.localPlayer.color);
        document.getElementById('paint-fill').style.background = `linear-gradient(90deg, ${teamColor}, #ffffff)`;
        
        // Таймер
        document.getElementById('timer').textContent = Utils.formatTime(this.matchTimeRemaining);
        
        // Статистика покрытия
        const stats = this.paintSystem.coverageStats;
        document.getElementById('score-red').textContent = stats.red;
        document.getElementById('score-blue').textContent = stats.blue;
        document.getElementById('score-green').textContent = stats.green;
        document.getElementById('score-yellow').textContent = stats.yellow;
        
        // Индикатор заправки
        const refuelIndicator = document.getElementById('refuel-indicator');
        if (this.localPlayer.isRefueling && this.localPlayer.paintAmount < CONFIG.paintTankCapacity) {
            refuelIndicator.style.display = 'block';
        } else {
            refuelIndicator.style.display = 'none';
        }
    }
    
    /**
     * Проверка окончания матча
     */
    checkGameOver() {
        if (this.matchTimeRemaining <= 0 && this.state === 'playing') {
            this.endGame();
        }
    }
    
    /**
     * Завершение матча
     */
    endGame() {
        this.state = 'gameover';
        document.exitPointerLock();
        
        // Определение победителя
        const stats = this.paintSystem.coverageStats;
        const teams = ['red', 'blue', 'green', 'yellow'];
        let winner = 'red';
        let maxCoverage = 0;
        
        teams.forEach(team => {
            const coverage = parseFloat(stats[team]);
            if (coverage > maxCoverage) {
                maxCoverage = coverage;
                winner = team;
            }
        });
        
        // Показ экрана победы
        const winnerColors = {
            red: '🔴 Красные',
            blue: '🔵 Синие',
            green: '🟢 Зелёные',
            yellow: '🟡 Жёлтые'
        };
        
        document.getElementById('winner-text').textContent = 
            `Победила команда ${winnerColors[winner]} с ${maxCoverage}% территории!`;
        document.getElementById('game-over').style.display = 'block';
    }
    
    /**
     * Основной игровой цикл
     */
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.1);
        this.lastUpdateTime = currentTime;
        
        if (this.state === 'playing') {
            // Обновление времени матча
            this.matchTimeRemaining -= deltaTime;
            
            // Обновление локального игрока
            if (this.localPlayer) {
                const input = this.getInput();
                this.localPlayer.move(input, deltaTime);
                this.localPlayer.update(deltaTime);
                
                // Стрельба
                if (this.mouseDown) {
                    this.localPlayer.shoot(currentTime / 1000);
                }
            }
            
            // Обновление ботов
            this.updateBots(deltaTime);
            
            // Обновление частиц краски
            this.paintSystem.updateParticles(deltaTime);
            
            // Обновление камеры
            this.updateCamera(deltaTime);
            
            // Обновление UI
            this.updateUI();
            
            // Обновление таймера на арене
            this.arena.updateTimerDisplay(this.matchTimeRemaining);
            
            // Проверка окончания игры
            this.checkGameOver();
        }
        
        // Отрисовка
        this.render();
    }
    
    /**
     * Отрисовка сцены
     */
    render() {
        // Отрисовка частиц
        this.paintSystem.renderParticles(this.scene);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Глобальный экземпляр игры
let game;

export { Game };
export { game };
