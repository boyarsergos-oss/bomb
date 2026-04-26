import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONSTANTS } from '../core/constants.js';

export class Cargo {
    constructor(physicsWorld, scene, droneBody) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.droneBody = droneBody;
        
        // Dimensions
        this.size = 0.5;
        
        // Create physics body
        this.createPhysicsBody();
        
        // Create visual mesh
        this.createMesh();
        
        // Create rope constraint
        this.createRopeConstraint();
        
        // Sync visual with physics
        this.syncVisualWithPhysics();
    }
    
    createPhysicsBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(this.size / 2, this.size / 2, this.size / 2));
        
        this.body = new CANNON.Body({
            mass: CONSTANTS.CARGO_MASS,
            material: this.physicsWorld.defaultMaterial,
            linearDamping: CONSTANTS.DAMPING_LINEAR * 0.5,
            angularDamping: CONSTANTS.DAMPING_ANGULAR * 0.5,
        });
        
        this.body.addShape(shape);
        
        // Start position below drone
        this.body.position.set(
            this.droneBody.position.x,
            this.droneBody.position.y - CONSTANTS.ROPE_LENGTH,
            this.droneBody.position.z
        );
        
        // Add to physics world
        this.physicsWorld.addBody(this.body);
    }
    
    createMesh() {
        // Cargo box
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add handle/hook point on top
        const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6 });
        this.handle = new THREE.Mesh(handleGeo, handleMat);
        this.handle.position.y = this.size / 2 + 0.1;
        this.mesh.add(this.handle);
        
        this.scene.add(this.mesh);
    }
    
    createRopeConstraint() {
        // Create a point on the drone (bottom center)
        const droneAttachmentPoint = new CANNON.Vec3(0, -this.droneBody.shapes[0].halfExtents.y, 0);
        
        // Create a point on the cargo (top center)
        const cargoAttachmentPoint = new CANNON.Vec3(0, this.size / 2, 0);
        
        // Create distance constraint (rope)
        this.constraint = new CANNON.DistanceConstraint(
            this.droneBody,
            this.body,
            droneAttachmentPoint,
            cargoAttachmentPoint,
            CONSTANTS.ROPE_LENGTH,
            0.1 // Stiffness
        );
        
        // Add constraint to physics world
        this.physicsWorld.world.addConstraint(this.constraint);
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
        if (this.constraint) {
            this.physicsWorld.world.removeConstraint(this.constraint);
        }
        this.physicsWorld.removeBody(this.body);
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
