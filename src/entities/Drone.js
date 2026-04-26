import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONSTANTS } from '../core/constants.js';

export class Drone {
    constructor(physicsWorld, scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        
        // Dimensions
        this.width = 1;
        this.height = 0.2;
        this.depth = 1;
        
        // Create physics body
        this.createPhysicsBody();
        
        // Create visual mesh
        this.createMesh();
        
        // Sync visual with physics
        this.syncVisualWithPhysics();
    }
    
    createPhysicsBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(this.width / 2, this.height / 2, this.depth / 2));
        
        this.body = new CANNON.Body({
            mass: CONSTANTS.DRONE_MASS,
            material: this.physicsWorld.defaultMaterial,
            linearDamping: CONSTANTS.DAMPING_LINEAR,
            angularDamping: CONSTANTS.DAMPING_ANGULAR,
        });
        
        this.body.addShape(shape);
        this.body.position.set(0, 5, 0);
        
        // Add to physics world
        this.physicsWorld.addBody(this.body);
    }
    
    createMesh() {
        // Drone body
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add propellers (visual only)
        this.propellers = [];
        const propellerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
        const propellerMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
        
        const positions = [
            { x: -this.width / 2, z: -this.depth / 2 },
            { x: this.width / 2, z: -this.depth / 2 },
            { x: -this.width / 2, z: this.depth / 2 },
            { x: this.width / 2, z: this.depth / 2 },
        ];
        
        positions.forEach(pos => {
            const propeller = new THREE.Mesh(propellerGeo, propellerMat);
            propeller.position.set(pos.x, this.height / 2, pos.z);
            this.mesh.add(propeller);
            this.propellers.push(propeller);
        });
        
        this.scene.add(this.mesh);
    }
    
    applyForce(up, down, left, right) {
        const force = new CANNON.Vec3(0, 0, 0);
        
        // Vertical force
        if (up) {
            force.y += CONSTANTS.DRONE_FORCE_Y;
        }
        if (down) {
            force.y -= CONSTANTS.DRONE_FORCE_Y * 0.5;
        }
        
        // Horizontal force
        if (left) {
            force.x -= CONSTANTS.DRONE_FORCE_X;
        }
        if (right) {
            force.x += CONSTANTS.DRONE_FORCE_X;
        }
        
        // Apply force at center of mass
        this.body.applyForce(force, this.body.position);
    }
    
    stabilize() {
        // Apply damping to reduce velocity
        this.body.velocity.x *= 0.9;
        this.body.velocity.z *= 0.9;
        this.body.angularVelocity.x *= 0.9;
        this.body.angularVelocity.z *= 0.9;
    }
    
    syncVisualWithPhysics() {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    getPosition() {
        return this.body.position;
    }
    
    getVelocity() {
        return this.body.velocity;
    }
    
    dispose() {
        this.physicsWorld.removeBody(this.body);
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
