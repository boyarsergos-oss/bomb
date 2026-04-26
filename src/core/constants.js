// Core constants for the game
export const CONSTANTS = {
    // Drone forces
    DRONE_FORCE_Y: 10,
    DRONE_FORCE_X: 5,
    
    // Masses
    DRONE_MASS: 1,
    CARGO_MASS: 2,
    
    // Rope
    ROPE_LENGTH: 3,
    ROPE_STIFFNESS: 0.5,
    
    // Camera
    CAMERA_OFFSET: {
        x: 0,
        y: 3,
        z: -6
    },
    CAMERA_LERP: 0.1,
    
    // Physics
    GRAVITY: -9.82,
    
    // Stabilization
    DAMPING_LINEAR: 0.5,
    DAMPING_ANGULAR: 0.5,
    
    // Delivery zone
    DELIVERY_TOLERANCE: 1.0,
    MAX_DELIVERY_VELOCITY: 2.0,
};

// Input states
export const InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    stabilize: false,
    
    // Touch
    touchLeftActive: false,
    touchRightActive: false,
    touchLeftX: 0,
    touchLeftY: 0,
    touchRightX: 0,
    touchRightY: 0,
};
