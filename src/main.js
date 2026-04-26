import { Renderer } from './render/Renderer.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Drone } from './entities/Drone.js';
import { Cargo } from './entities/Cargo.js';
import { CameraController } from './camera/CameraController.js';
import { Controls } from './controls/Controls.js';
import { LevelManager } from './levels/LevelManager.js';
import { CONSTANTS, InputState } from './core/constants.js';

class Game {
    constructor() {
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        this.init();
    }
    
    init() {
        try {
            // Initialize renderer (Stage 1)
            this.renderer = new Renderer();
            
            // Initialize physics world (Stage 2)
            this.physicsWorld = new PhysicsWorld();
            
            // Initialize controls
            this.controls = new Controls();
            
            // Initialize camera controller (Stage 7)
            this.cameraController = new CameraController(
                this.renderer.camera,
                this.renderer.scene
            );
            
            // Initialize level manager
            this.levelManager = new LevelManager(
                this.physicsWorld,
                this.renderer.scene
            );
            
            // Create ground
            this.levelManager.createGround();
            
            // Load first level
            this.loadLevel(1);
            
            // Start game loop
            this.animate(0);
            
            console.log('Game initialized successfully');
            this.debugLog('Game started');
        } catch (error) {
            console.error('Fatal error during initialization:', error);
            document.getElementById('ui').innerHTML = `<div style="color: red; font-size: 18px;">ERROR: ${error.message}</div><div style="color: yellow;">Check browser console for details</div>`;
        }
    }
    
    loadLevel(levelIndex) {
        const level = this.levelManager.loadLevel(levelIndex);
        
        if (!level) return;
        
        // Clean up existing entities
        if (this.drone) {
            this.drone.dispose();
        }
        if (this.cargo) {
            this.cargo.dispose();
        }
        
        // Create drone (Stage 3)
        this.drone = new Drone(this.physicsWorld, this.renderer.scene);
        
        // Set drone position based on level
        this.drone.body.position.set(
            level.droneStart.x,
            level.droneStart.y,
            level.droneStart.z
        );
        this.drone.body.velocity.set(0, 0, 0);
        this.drone.body.angularVelocity.set(0, 0, 0);
        
        // Create cargo with rope (Stages 4 & 5)
        this.cargo = new Cargo(
            this.physicsWorld,
            this.renderer.scene,
            this.drone.body
        );
        
        // Update UI
        this.updateUI();
        
        console.log(`Level ${levelIndex} loaded`);
        this.debugLog(`Level ${levelIndex} started`);
    }
    
    handleInput() {
        const input = this.controls.getInputState();
        
        // Apply forces to drone (Stage 3)
        this.drone.applyForce(input.up, input.down, input.left, input.right);
        
        // Stabilization
        if (input.stabilize) {
            this.drone.stabilize();
        }
    }
    
    update(deltaTime) {
        // Update physics
        this.physicsWorld.step(deltaTime);
        
        // Sync visual with physics
        this.drone.syncVisualWithPhysics();
        this.cargo.syncVisualWithPhysics();
        
        // Update camera (Stage 7)
        this.cameraController.follow(this.drone.getPosition());
        
        // Check delivery
        this.checkDelivery();
        
        // Debug logging
        this.debugUpdate();
    }
    
    checkDelivery() {
        const cargoPos = this.cargo.getPosition();
        const cargoVel = this.cargo.getVelocity();
        
        if (this.levelManager.checkDelivery(cargoPos, cargoVel)) {
            console.log('Delivery successful!');
            this.debugLog('Delivery complete!');
            
            // Move to next level
            const nextLevel = this.levelManager.currentLevel + 1;
            if (nextLevel <= 10) {
                setTimeout(() => this.loadLevel(nextLevel), 1000);
            } else {
                console.log('All levels completed!');
                this.debugLog('All levels completed!');
            }
        }
    }
    
    animate(currentTime) {
        requestAnimationFrame((time) => this.animate(time));
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent physics explosions
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        // FPS calculation
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            this.updateFPSDisplay();
        }
        
        // Handle input
        this.handleInput();
        
        // Update game logic
        this.update(cappedDeltaTime);
        
        // Render
        this.renderer.render();
    }
    
    updateUI() {
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = this.levelManager.currentLevel;
        }
    }
    
    updateFPSDisplay() {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
        }
    }
    
    debugLog(message) {
        console.log(`[GAME] ${message}`);
    }
    
    debugUpdate() {
        // Log positions periodically for debugging
        if (this.drone && this.cargo) {
            const dronePos = this.drone.getPosition();
            const cargoPos = this.cargo.getPosition();
            
            // Check for NaN values
            if (isNaN(dronePos.x) || isNaN(dronePos.y) || isNaN(dronePos.z)) {
                console.error('NaN detected in drone position!');
            }
            if (isNaN(cargoPos.x) || isNaN(cargoPos.y) || isNaN(cargoPos.z)) {
                console.error('NaN detected in cargo position!');
            }
        }
    }
    
    dispose() {
        if (this.drone) this.drone.dispose();
        if (this.cargo) this.cargo.dispose();
        if (this.levelManager) this.levelManager.dispose();
        if (this.cameraController) this.cameraController.dispose();
        if (this.controls) this.controls.dispose();
        if (this.renderer) this.renderer.dispose();
        
        console.log('Game disposed');
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
