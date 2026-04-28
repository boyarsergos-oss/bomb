import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Game constants
const ARENA_SIZE = 100;
const TILE_SIZE = 2;
const PLAYER_SPEED_FAST = 0.3;
const PLAYER_SPEED_NORMAL = 0.2;
const PLAYER_SPEED_SLOW = 0.1;
const TANK_CAPACITY = 100;
const SHOOT_COOLDOWN = 200;
const REFILL_RATE = 0.5;
const PAINT_BALL_RADIUS = 0.5;
const PAINT_BALL_SPEED = 0.8;

// Team colors
const TEAM_COLORS = [
    0x00ff00, // Green
    0xff0000, // Red
    0x0000ff, // Blue
    0xffff00  // Yellow
];

const TEAM_NAMES = ['Green', 'Red', 'Blue', 'Yellow'];

class PaintBattle {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        this.clock = new THREE.Clock();
        this.teams = [];
        this.players = [];
        this.paintBalls = [];
        this.arenaGrid = [];
        this.reservoirs = [];
        this.playerTeamIndex = 0; // Player is in team 0 (Green)
        
        this.initLights();
        this.initArena();
        this.initTeams();
        this.initReservoirs();
        this.initPlayers();
        this.setupControls();
        this.setupUI();
        
        this.animate();
    }
    
    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }
    
    initArena() {
        // Create arena floor
        const geometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.arena = new THREE.Mesh(geometry, material);
        this.arena.rotation.x = -Math.PI / 2;
        this.arena.receiveShadow = true;
        this.scene.add(this.arena);
        
        // Initialize grid for paint tracking
        const tilesX = Math.floor(ARENA_SIZE / TILE_SIZE);
        const tilesZ = Math.floor(ARENA_SIZE / TILE_SIZE);
        
        for (let x = 0; x < tilesX; x++) {
            this.arenaGrid[x] = [];
            for (let z = 0; z < tilesZ; z++) {
                this.arenaGrid[x][z] = {
                    team: -1, // -1 = neutral
                    coverage: 0
                };
                
                // Create tile mesh
                const tileGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
                const tileMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x808080,
                    transparent: true,
                    opacity: 0.8
                });
                const tile = new THREE.Mesh(tileGeometry, tileMaterial);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(
                    (x - tilesX / 2) * TILE_SIZE + TILE_SIZE / 2,
                    0.01,
                    (z - tilesZ / 2) * TILE_SIZE + TILE_SIZE / 2
                );
                tile.userData = { gridX: x, gridZ: z };
                this.scene.add(tile);
            }
        }
        
        // Add arena boundaries
        const boundaryHeight = 2;
        const boundaryThickness = 1;
        
        // North wall
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(ARENA_SIZE + boundaryThickness * 2, boundaryHeight, boundaryThickness),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        northWall.position.set(0, boundaryHeight / 2, -ARENA_SIZE / 2 - boundaryThickness / 2);
        this.scene.add(northWall);
        
        // South wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(ARENA_SIZE + boundaryThickness * 2, boundaryHeight, boundaryThickness),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        southWall.position.set(0, boundaryHeight / 2, ARENA_SIZE / 2 + boundaryThickness / 2);
        this.scene.add(southWall);
        
        // East wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(boundaryThickness, boundaryHeight, ARENA_SIZE),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        eastWall.position.set(ARENA_SIZE / 2 + boundaryThickness / 2, boundaryHeight / 2, 0);
        this.scene.add(eastWall);
        
        // West wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(boundaryThickness, boundaryHeight, ARENA_SIZE),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        westWall.position.set(-ARENA_SIZE / 2 - boundaryThickness / 2, boundaryHeight / 2, 0);
        this.scene.add(westWall);
    }
    
    initTeams() {
        for (let i = 0; i < 4; i++) {
            this.teams.push({
                id: i,
                name: TEAM_NAMES[i],
                color: TEAM_COLORS[i],
                score: 0,
                players: []
            });
        }
    }
    
    initPlayers() {
        // Create player character (controlled by user)
        const playerGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const playerMaterial = new THREE.MeshStandardMaterial({ color: TEAM_COLORS[this.playerTeamIndex] });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, 1, 0);
        this.player.castShadow = true;
        this.player.userData = {
            isPlayer: true,
            team: this.playerTeamIndex,
            tank: TANK_CAPACITY,
            speed: PLAYER_SPEED_NORMAL,
            lastShootTime: 0
        };
        this.scene.add(this.player);
        this.players.push(this.player);
        this.teams[this.playerTeamIndex].players.push(this.player);
        
        // Create AI players for each team
        for (let teamIndex = 0; teamIndex < 4; teamIndex++) {
            const playersPerTeam = teamIndex === this.playerTeamIndex ? 2 : 3; // Player's team has 2 AI + 1 player
            
            for (let i = 0; i < playersPerTeam; i++) {
                const aiGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
                const aiMaterial = new THREE.MeshStandardMaterial({ color: TEAM_COLORS[teamIndex] });
                const aiPlayer = new THREE.Mesh(aiGeometry, aiMaterial);
                
                // Position AI players near their reservoir
                const reservoir = this.reservoirs[teamIndex];
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetZ = (Math.random() - 0.5) * 10;
                aiPlayer.position.set(
                    reservoir.position.x + offsetX,
                    1,
                    reservoir.position.z + offsetZ
                );
                
                aiPlayer.castShadow = true;
                aiPlayer.userData = {
                    isPlayer: false,
                    team: teamIndex,
                    tank: TANK_CAPACITY,
                    speed: PLAYER_SPEED_NORMAL,
                    lastShootTime: 0,
                    target: null,
                    state: 'patrol'
                };
                
                this.scene.add(aiPlayer);
                this.players.push(aiPlayer);
                this.teams[teamIndex].players.push(aiPlayer);
            }
        }
    }
    
    initReservoirs() {
        // Create reservoirs for each team at corners of the arena
        const positions = [
            { x: -ARENA_SIZE / 4, z: -ARENA_SIZE / 4 },
            { x: ARENA_SIZE / 4, z: -ARENA_SIZE / 4 },
            { x: -ARENA_SIZE / 4, z: ARENA_SIZE / 4 },
            { x: ARENA_SIZE / 4, z: ARENA_SIZE / 4 }
        ];
        
        for (let i = 0; i < 4; i++) {
            const reservoirGeometry = new THREE.CylinderGeometry(2, 2, 3, 16);
            const reservoirMaterial = new THREE.MeshStandardMaterial({ 
                color: TEAM_COLORS[i],
                emissive: TEAM_COLORS[i],
                emissiveIntensity: 0.3
            });
            const reservoir = new THREE.Mesh(reservoirGeometry, reservoirMaterial);
            reservoir.position.set(positions[i].x, 1.5, positions[i].z);
            reservoir.castShadow = true;
            reservoir.userData = { team: i };
            
            this.scene.add(reservoir);
            this.reservoirs.push(reservoir);
        }
    }
    
    setupControls() {
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse click to shoot
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.player.userData.tank > 0) {
                this.shoot(this.player);
            }
        });
        
        // Camera controls
        this.cameraOffset = new THREE.Vector3(0, 10, 15);
        this.cameraLookAt = new THREE.Vector3(0, 0, 0);
    }
    
    setupUI() {
        // Create UI container in 3D space
        this.uiGroup = new THREE.Group();
        this.scene.add(this.uiGroup);
        
        // Tank indicator (3D bar above player)
        const tankBarGeometry = new THREE.BoxGeometry(2, 0.3, 0.1);
        const tankBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.tankBar = new THREE.Mesh(tankBarGeometry, tankBarMaterial);
        this.tankBar.position.set(0, 2.5, 0);
        this.player.add(this.tankBar);
        
        // Score display (floating text planes)
        this.scoreDisplays = [];
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#' + TEAM_COLORS[i].toString(16).padStart(6, '0');
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${TEAM_NAMES[i]}: 0%`, 128, 42);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture, 
                transparent: true,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), material);
            plane.position.set(-30 + i * 20, 40, -40);
            plane.lookAt(0, 40, 0);
            
            this.scene.add(plane);
            this.scoreDisplays.push({ mesh: plane, canvas, ctx, team: i });
        }
        
        // Crosshair
        const crosshairCanvas = document.createElement('canvas');
        crosshairCanvas.width = 64;
        crosshairCanvas.height = 64;
        const crosshairCtx = crosshairCanvas.getContext('2d');
        crosshairCtx.strokeStyle = '#ffffff';
        crosshairCtx.lineWidth = 2;
        crosshairCtx.beginPath();
        crosshairCtx.moveTo(32, 16);
        crosshairCtx.lineTo(32, 48);
        crosshairCtx.moveTo(16, 32);
        crosshairCtx.lineTo(48, 32);
        crosshairCtx.stroke();
        
        const crosshairTexture = new THREE.CanvasTexture(crosshairCanvas);
        const crosshairMaterial = new THREE.MeshBasicMaterial({ 
            map: crosshairTexture, 
            transparent: true,
            depthTest: false
        });
        this.crosshair = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), crosshairMaterial);
        this.crosshair.position.set(0, 0, -5);
        this.crosshair.renderOrder = 999;
        this.scene.add(this.crosshair);
    }
    
    shoot(shooter) {
        const now = Date.now();
        if (now - shooter.userData.lastShootTime < SHOOT_COOLDOWN) return;
        
        shooter.userData.lastShootTime = now;
        shooter.userData.tank -= 5;
        
        const paintBallGeometry = new THREE.SphereGeometry(PAINT_BALL_RADIUS, 8, 8);
        const paintBallMaterial = new THREE.MeshStandardMaterial({ 
            color: TEAM_COLORS[shooter.userData.team],
            emissive: TEAM_COLORS[shooter.userData.team],
            emissiveIntensity: 0.5
        });
        const paintBall = new THREE.Mesh(paintBallGeometry, paintBallMaterial);
        
        paintBall.position.copy(shooter.position);
        paintBall.position.y += 0.5;
        
        // Get shooting direction
        const direction = new THREE.Vector3();
        if (shooter.userData.isPlayer) {
            // Player shoots towards camera look direction
            direction.setFromMatrixColumn(this.camera.matrix, 0); // This needs improvement
            direction.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
            direction.y = 0;
            direction.normalize();
        } else {
            // AI shoots towards target
            if (shooter.userData.target) {
                direction.subVectors(shooter.userData.target.position, shooter.position).normalize();
            } else {
                direction.set(0, 0, 1).applyQuaternion(shooter.quaternion);
            }
        }
        
        paintBall.userData = {
            velocity: direction.multiplyScalar(PAINT_BALL_SPEED),
            team: shooter.userData.team,
            lifetime: 100
        };
        
        this.scene.add(paintBall);
        this.paintBalls.push(paintBall);
    }
    
    updatePaintBall(paintBall, delta) {
        paintBall.position.add(paintBall.userData.velocity);
        paintBall.userData.lifetime--;
        
        // Check if paintball hits ground
        if (paintBall.position.y <= 0.5) {
            this.applyPaint(paintBall.position, paintBall.userData.team);
            this.removePaintBall(paintBall);
            return;
        }
        
        // Check if paintball hits a player
        for (const player of this.players) {
            if (player !== paintBall.userData.shooter) {
                const distance = paintBall.position.distanceTo(player.position);
                if (distance < 1) {
                    this.applyPaint(player.position, paintBall.userData.team);
                    this.removePaintBall(paintBall);
                    return;
                }
            }
        }
        
        // Remove if lifetime expired
        if (paintBall.userData.lifetime <= 0) {
            this.removePaintBall(paintBall);
        }
    }
    
    removePaintBall(paintBall) {
        this.scene.remove(paintBall);
        const index = this.paintBalls.indexOf(paintBall);
        if (index > -1) {
            this.paintBalls.splice(index, 1);
        }
    }
    
    applyPaint(position, team) {
        const tilesX = Math.floor(ARENA_SIZE / TILE_SIZE);
        const gridX = Math.floor((position.x + ARENA_SIZE / 2) / TILE_SIZE);
        const gridZ = Math.floor((position.z + ARENA_SIZE / 2) / TILE_SIZE);
        
        if (gridX >= 0 && gridX < tilesX && gridZ >= 0 && gridZ < tilesX) {
            const tile = this.arenaGrid[gridX][gridZ];
            tile.team = team;
            tile.coverage = Math.min(tile.coverage + 10, 100);
            
            // Update tile color
            const tileMesh = this.getTileMesh(gridX, gridZ);
            if (tileMesh) {
                tileMesh.material.color.setHex(TEAM_COLORS[team]);
                tileMesh.material.opacity = 0.6 + (tile.coverage / 100) * 0.4;
            }
        }
    }
    
    getTileMesh(gridX, gridZ) {
        // Find the tile mesh by userData
        for (const object of this.scene.children) {
            if (object.userData.gridX === gridX && object.userData.gridZ === gridZ) {
                return object;
            }
        }
        return null;
    }
    
    updatePlayerMovement(player, delta) {
        const pos = player.position;
        const tilesX = Math.floor(ARENA_SIZE / TILE_SIZE);
        const gridX = Math.floor((pos.x + ARENA_SIZE / 2) / TILE_SIZE);
        const gridZ = Math.floor((pos.z + ARENA_SIZE / 2) / TILE_SIZE);
        
        let speed = PLAYER_SPEED_NORMAL;
        
        if (gridX >= 0 && gridX < tilesX && gridZ >= 0 && gridZ < tilesX) {
            const tile = this.arenaGrid[gridX][gridZ];
            if (tile.team === player.userData.team) {
                speed = PLAYER_SPEED_FAST;
            } else if (tile.team !== -1) {
                speed = PLAYER_SPEED_SLOW;
            }
        }
        
        player.userData.speed = speed;
        
        if (player.userData.isPlayer) {
            // Player control
            const moveSpeed = speed;
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();
            
            if (this.keys['KeyW']) {
                player.position.add(forward.clone().multiplyScalar(moveSpeed));
            }
            if (this.keys['KeyS']) {
                player.position.add(forward.clone().multiplyScalar(-moveSpeed));
            }
            if (this.keys['KeyA']) {
                player.position.add(right.clone().multiplyScalar(-moveSpeed));
            }
            if (this.keys['KeyD']) {
                player.position.add(right.clone().multiplyScalar(moveSpeed));
            }
            
            // Keep player in bounds
            player.position.x = Math.max(-ARENA_SIZE / 2, Math.min(ARENA_SIZE / 2, player.position.x));
            player.position.z = Math.max(-ARENA_SIZE / 2, Math.min(ARENA_SIZE / 2, player.position.z));
        } else {
            // AI behavior
            this.updateAI(player);
        }
    }
    
    updateAI(player) {
        const ai = player.userData;
        const now = Date.now();
        
        // Simple AI: patrol, seek reservoir if low on paint, shoot enemies
        if (ai.tank < 30) {
            // Go to reservoir
            const reservoir = this.reservoirs[ai.team];
            const distToReservoir = player.position.distanceTo(reservoir.position);
            
            if (distToReservoir > 3) {
                const direction = new THREE.Vector3().subVectors(reservoir.position, player.position).normalize();
                player.position.add(direction.multiplyScalar(ai.speed * 0.5));
                player.lookAt(reservoir.position);
            } else {
                // Refill
                ai.tank = Math.min(ai.tank + REFILL_RATE, TANK_CAPACITY);
            }
        } else {
            // Look for enemies or paint territory
            if (!ai.target || ai.target.userData.team === ai.team) {
                // Find nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                
                for (const other of this.players) {
                    if (other !== player && other.userData.team !== ai.team) {
                        const dist = player.position.distanceTo(other.position);
                        if (dist < nearestDist && dist < 30) {
                            nearestDist = dist;
                            nearestEnemy = other;
                        }
                    }
                }
                
                ai.target = nearestEnemy;
            }
            
            if (ai.target) {
                // Move towards enemy and shoot
                const distToTarget = player.position.distanceTo(ai.target.position);
                
                if (distToTarget > 15) {
                    const direction = new THREE.Vector3().subVectors(ai.target.position, player.position).normalize();
                    player.position.add(direction.multiplyScalar(ai.speed * 0.3));
                    player.lookAt(ai.target.position);
                } else if (distToTarget < 20) {
                    // Shoot
                    if (now - ai.lastShootTime > SHOOT_COOLDOWN * 2) {
                        this.shoot(player);
                    }
                    player.lookAt(ai.target.position);
                }
            } else {
                // Patrol and paint
                const randomDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                player.position.add(randomDir.multiplyScalar(ai.speed * 0.2));
                player.lookAt(player.position.clone().add(randomDir));
                
                // Shoot randomly to paint ground
                if (Math.random() < 0.02 && now - ai.lastShootTime > SHOOT_COOLDOWN * 3) {
                    this.shoot(player);
                }
            }
            
            // Keep AI in bounds
            player.position.x = Math.max(-ARENA_SIZE / 2 + 2, Math.min(ARENA_SIZE / 2 - 2, player.position.x));
            player.position.z = Math.max(-ARENA_SIZE / 2 + 2, Math.min(ARENA_SIZE / 2 - 2, player.position.z));
        }
    }
    
    checkRefill() {
        const player = this.player;
        const ai = player.userData;
        
        for (const reservoir of this.reservoirs) {
            if (reservoir.userData.team === ai.team) {
                const dist = player.position.distanceTo(reservoir.position);
                if (dist < 4) {
                    ai.tank = Math.min(ai.tank + REFILL_RATE, TANK_CAPACITY);
                    break;
                }
            }
        }
    }
    
    updateCamera() {
        // Third-person camera following player
        const cameraOffset = new THREE.Vector3(0, 8, 12);
        cameraOffset.applyQuaternion(this.camera.quaternion);
        
        const targetPosition = this.player.position.clone().add(cameraOffset);
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.player.position);
        
        // Update crosshair position
        this.crosshair.position.copy(this.camera.position);
        this.crosshair.position.add(new THREE.Vector3(0, 0, -5).applyQuaternion(this.camera.quaternion));
        this.crosshair.lookAt(this.camera.position.clone().add(new THREE.Vector3(0, 0, -10).applyQuaternion(this.camera.quaternion)));
    }
    
    updateUI() {
        // Update tank bar
        const tankRatio = this.player.userData.tank / TANK_CAPACITY;
        this.tankBar.scale.x = tankRatio;
        this.tankBar.material.color.setHSL(tankRatio * 0.3, 1, 0.5);
        
        // Update score displays
        const tilesX = Math.floor(ARENA_SIZE / TILE_SIZE);
        const totalTiles = tilesX * tilesX;
        const teamScores = [0, 0, 0, 0];
        
        for (let x = 0; x < tilesX; x++) {
            for (let z = 0; z < tilesX; z++) {
                const tile = this.arenaGrid[x][z];
                if (tile.team !== -1) {
                    teamScores[tile.team]++;
                }
            }
        }
        
        for (let i = 0; i < 4; i++) {
            const percentage = ((teamScores[i] / totalTiles) * 100).toFixed(1);
            this.scoreDisplays[i].ctx.clearRect(0, 0, 256, 64);
            this.scoreDisplays[i].ctx.fillStyle = '#' + TEAM_COLORS[i].toString(16).padStart(6, '0');
            this.scoreDisplays[i].ctx.fillRect(0, 0, 256, 64);
            this.scoreDisplays[i].ctx.fillStyle = '#ffffff';
            this.scoreDisplays[i].ctx.font = 'bold 32px Arial';
            this.scoreDisplays[i].ctx.textAlign = 'center';
            this.scoreDisplays[i].ctx.fillText(`${TEAM_NAMES[i]}: ${percentage}%`, 128, 42);
            this.scoreDisplays[i].mesh.material.map.needsUpdate = true;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update player movement
        for (const player of this.players) {
            this.updatePlayerMovement(player, delta);
        }
        
        // Check refill for player
        this.checkRefill();
        
        // Update paint balls
        for (let i = this.paintBalls.length - 1; i >= 0; i--) {
            this.updatePaintBall(this.paintBalls[i], delta);
        }
        
        // Update camera
        this.updateCamera();
        
        // Update UI
        this.updateUI();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new PaintBattle();
});
