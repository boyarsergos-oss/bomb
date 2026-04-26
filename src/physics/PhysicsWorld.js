import * as CANNON from 'cannon-es';
import { CONSTANTS } from '../core/constants.js';

export class PhysicsWorld {
    constructor() {
        // Create physics world
        this.world = new CANNON.World();
        
        // Set gravity (downward)
        this.world.gravity.set(0, CONSTANTS.GRAVITY, 0);
        
        // Default material
        this.defaultMaterial = new CANNON.Material('default');
        
        // Contact materials
        this.setupContactMaterials();
        
        // Broadphase for collision detection
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        
        // Enable sleeping for performance
        this.world.allowSleep = true;
        
        // Time step
        this.fixedTimeStep = 1 / 60;
        this.maxSubSteps = 3;
    }
    
    setupContactMaterials() {
        const defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.3,
                restitution: 0.1,
            }
        );
        this.world.addContactMaterial(defaultContactMaterial);
    }
    
    step(deltaTime) {
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
    }
    
    addBody(body) {
        this.world.addBody(body);
    }
    
    removeBody(body) {
        this.world.removeBody(body);
    }
    
    getWorld() {
        return this.world;
    }
}
