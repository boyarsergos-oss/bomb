import * as THREE from 'three';
import { CONSTANTS } from '../core/constants.js';

export class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Camera offset from drone
        this.offset = new THREE.Vector3(
            CONSTANTS.CAMERA_OFFSET.x,
            CONSTANTS.CAMERA_OFFSET.y,
            CONSTANTS.CAMERA_OFFSET.z
        );
        
        // Current target position
        this.targetPosition = new THREE.Vector3();
        
        // Create visual helper for camera target (debug)
        // this.createDebugHelper();
    }
    
    follow(dronePosition) {
        // Calculate target position behind and above the drone
        this.targetPosition.copy(dronePosition);
        this.targetPosition.add(this.offset);
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(this.targetPosition, CONSTANTS.CAMERA_LERP);
        
        // Make camera look at the drone
        this.camera.lookAt(dronePosition);
    }
    
    setOffset(x, y, z) {
        this.offset.set(x, y, z);
    }
    
    setPosition(position) {
        this.camera.position.copy(position);
    }
    
    setLookAt(target) {
        this.camera.lookAt(target);
    }
    
    createDebugHelper() {
        // Visual helper for debugging camera target
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        this.debugHelper = new THREE.Mesh(geometry, material);
        this.scene.add(this.debugHelper);
    }
    
    updateDebugHelper() {
        if (this.debugHelper) {
            this.debugHelper.position.copy(this.targetPosition);
        }
    }
    
    dispose() {
        if (this.debugHelper) {
            this.scene.remove(this.debugHelper);
            this.debugHelper.geometry.dispose();
            this.debugHelper.material.dispose();
        }
    }
}
