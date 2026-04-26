import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONSTANTS } from '../core/constants.js';

export class LevelManager {
    constructor(physicsWorld, scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.currentLevel = 1;
        
        // Level configurations
        this.levels = this.createLevels();
        
        // Delivery zone
        this.deliveryZone = null;
        this.deliveryZoneMesh = null;
    }
    
    createLevels() {
        return [
            // Level 1 - Basic
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 10, y: 5, z: 0, radius: 2 },
                obstacles: []
            },
            // Level 2 - Further
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 20, y: 5, z: 0, radius: 2 },
                obstacles: []
            },
            // Level 3 - Higher
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 10, y: 10, z: 0, radius: 2 },
                obstacles: []
            },
            // Level 4 - Lower
            {
                droneStart: { x: 0, y: 10, z: 0 },
                cargoStart: { x: 0, y: 7, z: 0 },
                deliveryZone: { x: 10, y: 2, z: 0, radius: 2 },
                obstacles: []
            },
            // Level 5 - Narrow passage
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 15, y: 5, z: 0, radius: 2 },
                obstacles: [
                    { type: 'wall', position: { x: 7, y: 2.5, z: 0 }, size: { x: 1, y: 5, z: 10 } }
                ]
            },
            // Level 6 - Dangers
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 15, y: 5, z: 0, radius: 2 },
                obstacles: [
                    { type: 'wall', position: { x: 5, y: 2.5, z: -3 }, size: { x: 1, y: 5, z: 6 } },
                    { type: 'wall', position: { x: 10, y: 2.5, z: 3 }, size: { x: 1, y: 5, z: 6 } }
                ]
            },
            // Level 7 - Long rope
            {
                droneStart: { x: 0, y: 8, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 15, y: 5, z: 0, radius: 2 },
                ropeLength: 5,
                obstacles: []
            },
            // Level 8 - Gap/Chasm
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 20, y: 5, z: 0, radius: 2 },
                obstacles: [
                    { type: 'gap', position: { x: 10, y: 0, z: 0 }, size: { x: 5, y: 1, z: 10 } }
                ]
            },
            // Level 9 - Precise zone
            {
                droneStart: { x: 0, y: 5, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 15, y: 5, z: 0, radius: 1 },
                obstacles: []
            },
            // Level 10 - Combination
            {
                droneStart: { x: 0, y: 8, z: 0 },
                cargoStart: { x: 0, y: 2, z: 0 },
                deliveryZone: { x: 25, y: 5, z: 0, radius: 1.5 },
                ropeLength: 4,
                obstacles: [
                    { type: 'wall', position: { x: 8, y: 3, z: 0 }, size: { x: 1, y: 6, z: 8 } },
                    { type: 'wall', position: { x: 17, y: 3, z: 0 }, size: { x: 1, y: 6, z: 8 } }
                ]
            }
        ];
    }
    
    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        const level = this.levels[levelIndex - 1];
        
        if (!level) {
            console.error(`Level ${levelIndex} not found`);
            return null;
        }
        
        // Clean up previous level
        this.cleanupLevelObjects();
        
        // Create delivery zone
        this.createDeliveryZone(level.deliveryZone);
        
        // Create obstacles
        this.createObstacles(level.obstacles);
        
        return level;
    }
    
    createDeliveryZone(zoneConfig) {
        // Visual representation
        const geometry = new THREE.CylinderGeometry(
            zoneConfig.radius,
            zoneConfig.radius,
            0.2,
            32
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0x2ecc71,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        this.deliveryZoneMesh = new THREE.Mesh(geometry, material);
        this.deliveryZoneMesh.position.set(
            zoneConfig.x,
            zoneConfig.y,
            zoneConfig.z
        );
        this.deliveryZoneMesh.rotation.x = Math.PI / 2;
        this.scene.add(this.deliveryZoneMesh);
        
        // Store zone config
        this.deliveryZone = zoneConfig;
    }
    
    createObstacles(obstacles) {
        this.obstacleMeshes = [];
        this.obstacleBodies = [];
        
        obstacles.forEach(obs => {
            if (obs.type === 'wall') {
                this.createWall(obs.position, obs.size);
            } else if (obs.type === 'gap') {
                // Gap is visual only - represented by missing ground
                this.createGapVisual(obs.position, obs.size);
            }
        });
    }
    
    createWall(position, size) {
        // Visual
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.obstacleMeshes.push(mesh);
        
        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({
            mass: 0, // Static
            material: this.physicsWorld.defaultMaterial,
        });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        this.physicsWorld.addBody(body);
        this.obstacleBodies.push(body);
    }
    
    createGapVisual(position, size) {
        // Visual indicator for gap (red zone on ground)
        const geometry = new THREE.PlaneGeometry(size.x, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, 0.01, position.z);
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.obstacleMeshes.push(mesh);
    }
    
    createGround() {
        // Visual ground
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x27ae60,
            roughness: 0.8
        });
        this.groundMesh = new THREE.Mesh(geometry, material);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
        
        // Physics ground
        const shape = new CANNON.Plane();
        this.groundBody = new CANNON.Body({
            mass: 0,
            material: this.physicsWorld.defaultMaterial,
        });
        this.groundBody.addShape(shape);
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.physicsWorld.addBody(this.groundBody);
    }
    
    checkDelivery(cargoPosition, cargoVelocity) {
        if (!this.deliveryZone) return false;
        
        const dx = cargoPosition.x - this.deliveryZone.x;
        const dy = cargoPosition.y - this.deliveryZone.y;
        const dz = cargoPosition.z - this.deliveryZone.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Check if within zone
        if (distance > this.deliveryZone.radius) {
            return false;
        }
        
        // Check velocity (must be slow enough)
        const velocity = Math.sqrt(
            cargoVelocity.x * cargoVelocity.x +
            cargoVelocity.y * cargoVelocity.y +
            cargoVelocity.z * cargoVelocity.z
        );
        
        if (velocity > CONSTANTS.MAX_DELIVERY_VELOCITY) {
            return false;
        }
        
        return true;
    }
    
    cleanup() {
        // Remove delivery zone
        if (this.deliveryZoneMesh) {
            this.scene.remove(this.deliveryZoneMesh);
            this.deliveryZoneMesh.geometry.dispose();
            this.deliveryZoneMesh.material.dispose();
            this.deliveryZoneMesh = null;
        }
        
        // Remove obstacles
        if (this.obstacleMeshes) {
            this.obstacleMeshes.forEach(mesh => {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
            this.obstacleMeshes = [];
        }
        
        if (this.obstacleBodies) {
            this.obstacleBodies.forEach(body => {
                this.physicsWorld.removeBody(body);
            });
            this.obstacleBodies = [];
        }
        
        // Remove ground
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
            this.groundMesh.material.dispose();
            this.groundMesh = null;
        }
        
        if (this.groundBody) {
            this.physicsWorld.removeBody(this.groundBody);
            this.groundBody = null;
        }
        
        this.deliveryZone = null;
    }
    
    dispose() {
        this.cleanupLevelObjects();
    }
}
