// Drone Delivery Game - Main Game Logic
// Using Matter.js for physics

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Vector = Matter.Vector,
      Events = Matter.Events;

// Game constants
const WORLD_WIDTH = 20;
const WORLD_HEIGHT = 10;
const SCALE = 50; // pixels per meter

// Physics parameters
const DRONE_MASS = 1;
const DRONE_MAX_THRUST = 15;
const DRONE_HORIZONTAL_FORCE = 8;
const DRONE_DAMPING = 0.98;
const CARGO_MASS = 2;
const ROPE_LENGTH = 3;
const ROPE_STIFFNESS = 0.9;

// Game state
let engine, world, runner;
let canvas, ctx;
let drone, cargo, rope;
let currentLevel = 1;
let levelTime = 0;
let isLevelComplete = false;
let maxSwing = 0;
let keys = {};
let touchControls = {
    left: false,
    right: false,
    thrust: false
};

// Level definitions
const levels = [
    // Level 1 - Basic lift
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 8, y: 7, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: []
    },
    // Level 2 - Move right
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 14, y: 7, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: []
    },
    // Level 3 - Height control
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 10, y: 4, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: []
    },
    // Level 4 - Descent
    {
        droneStart: { x: 2, y: 6 },
        cargoStart: { x: 2, y: 4 },
        goal: { x: 12, y: 2, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: []
    },
    // Level 5 - Narrow passage
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 16, y: 7, width: 2, height: 1 },
        platforms: [
            { x: 0, y: 0, w: 20, h: 1 },
            { x: 8, y: 0, w: 1, h: 6 },
            { x: 10, y: 0, w: 1, h: 6 }
        ],
        hazards: []
    },
    // Level 6 - First hazard
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 14, y: 7, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: [{ x: 8, y: 0.5, w: 4, h: 0.5 }]
    },
    // Level 7 - Long rope
    {
        droneStart: { x: 2, y: 8 },
        cargoStart: { x: 2, y: 3 },
        goal: { x: 14, y: 8, width: 2, height: 1 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: [],
        ropeLength: 5
    },
    // Level 8 - Gap
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 16, y: 7, width: 2, height: 1 },
        platforms: [
            { x: 0, y: 0, w: 7, h: 1 },
            { x: 11, y: 0, w: 9, h: 1 }
        ],
        hazards: []
    },
    // Level 9 - Precision landing
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 12, y: 7, width: 1, height: 0.5 },
        platforms: [{ x: 0, y: 0, w: 20, h: 1 }],
        hazards: []
    },
    // Level 10 - Combination
    {
        droneStart: { x: 2, y: 7 },
        cargoStart: { x: 2, y: 5 },
        goal: { x: 17, y: 7, width: 2, height: 1 },
        platforms: [
            { x: 0, y: 0, w: 6, h: 1 },
            { x: 12, y: 0, w: 8, h: 1 },
            { x: 7, y: 0, w: 1, h: 5 },
            { x: 11, y: 0, w: 1, h: 5 }
        ],
        hazards: [{ x: 8, y: 0.5, w: 2, h: 0.5 }]
    }
];

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create engine
    engine = Engine.create();
    world = engine.world;
    
    // Setup input handlers
    setupInputHandlers();
    
    // Load first level
    loadLevel(currentLevel);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function setupInputHandlers() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') {
            stabilize();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Mobile controls
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const thrustBtn = document.getElementById('thrustBtn');
    const stabilizeBtn = document.getElementById('stabilizeBtn');
    
    // Touch events
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); touchControls.left = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); touchControls.left = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); touchControls.right = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); touchControls.right = false; rightBtn.classList.remove('active'); });
    
    thrustBtn.addEventListener('touchstart', (e) => { e.preventDefault(); touchControls.thrust = true; thrustBtn.classList.add('active'); });
    thrustBtn.addEventListener('touchend', (e) => { e.preventDefault(); touchControls.thrust = false; thrustBtn.classList.remove('active'); });
    
    stabilizeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); stabilize(); });
    
    // Mouse events for testing mobile controls on desktop
    leftBtn.addEventListener('mousedown', () => { touchControls.left = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('mouseup', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    leftBtn.addEventListener('mouseleave', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('mousedown', () => { touchControls.right = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('mouseup', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    rightBtn.addEventListener('mouseleave', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    
    thrustBtn.addEventListener('mousedown', () => { touchControls.thrust = true; thrustBtn.classList.add('active'); });
    thrustBtn.addEventListener('mouseup', () => { touchControls.thrust = false; thrustBtn.classList.remove('active'); });
    thrustBtn.addEventListener('mouseleave', () => { touchControls.thrust = false; thrustBtn.classList.remove('active'); });
}

function loadLevel(levelNum) {
    // Clear world
    Composite.clear(world);
    Engine.clear(engine);
    
    const level = levels[levelNum - 1];
    const ropeLength = level.ropeLength || ROPE_LENGTH;
    
    // Reset game state
    levelTime = 0;
    isLevelComplete = false;
    maxSwing = 0;
    
    // Update UI
    document.getElementById('levelNum').textContent = levelNum;
    document.getElementById('stars').style.display = 'none';
    document.getElementById('message').style.display = 'none';
    
    // Create platforms
    level.platforms.forEach(platform => {
        const plat = Bodies.rectangle(
            platform.x * SCALE,
            (WORLD_HEIGHT - platform.y / 2) * SCALE,
            platform.w * SCALE,
            platform.h * SCALE,
            {
                isStatic: true,
                friction: 0.8,
                restitution: 0.2,
                render: { fillStyle: '#4a5568' }
            }
        );
        Composite.add(world, plat);
    });
    
    // Create hazards (spikes)
    level.hazards.forEach(hazard => {
        const spike = Bodies.rectangle(
            hazard.x * SCALE,
            (WORLD_HEIGHT - hazard.y / 2) * SCALE,
            hazard.w * SCALE,
            hazard.h * SCALE,
            {
                isStatic: true,
                isSensor: true,
                label: 'hazard',
                render: { fillStyle: '#e53e3e' }
            }
        );
        Composite.add(world, spike);
    });
    
    // Create goal zone
    const goal = Bodies.rectangle(
        level.goal.x * SCALE,
        (WORLD_HEIGHT - level.goal.y / 2) * SCALE,
        level.goal.width * SCALE,
        level.goal.height * SCALE,
        {
            isStatic: true,
            isSensor: true,
            label: 'goal',
            render: { fillStyle: 'rgba(74, 222, 128, 0.3)' }
        }
    );
    Composite.add(world, goal);
    
    // Create drone
    drone = Bodies.rectangle(
        level.droneStart.x * SCALE,
        (WORLD_HEIGHT - level.droneStart.y) * SCALE,
        1.2 * SCALE,
        0.4 * SCALE,
        {
            mass: DRONE_MASS,
            friction: 0.1,
            frictionAir: 0.01,
            restitution: 0.3,
            label: 'drone',
            render: { fillStyle: '#4299e1' }
        }
    );
    Composite.add(world, drone);
    
    // Create cargo
    cargo = Bodies.rectangle(
        level.cargoStart.x * SCALE,
        (WORLD_HEIGHT - level.cargoStart.y) * SCALE,
        0.8 * SCALE,
        0.8 * SCALE,
        {
            mass: CARGO_MASS,
            friction: 0.5,
            frictionAir: 0.01,
            restitution: 0.1,
            label: 'cargo',
            render: { fillStyle: '#ed8936' }
        }
    );
    Composite.add(world, cargo);
    
    // Create rope (constraint)
    rope = Constraint.create({
        bodyA: drone,
        bodyB: cargo,
        length: ropeLength * SCALE,
        stiffness: ROPE_STIFFNESS,
        damping: 0.1,
        render: {
            strokeStyle: '#cbd5e0',
            lineWidth: 3
        }
    });
    Composite.add(world, rope);
}

function stabilize() {
    if (isLevelComplete || !drone || !cargo) return;
    
    // Apply damping to reduce velocity
    Body.setVelocity(drone, {
        x: drone.velocity.x * 0.5,
        y: drone.velocity.y * 0.5
    });
    
    Body.setAngularVelocity(drone, drone.angularVelocity * 0.5);
    
    Body.setVelocity(cargo, {
        x: cargo.velocity.x * 0.5,
        y: cargo.velocity.y * 0.5
    });
    
    Body.setAngularVelocity(cargo, cargo.angularVelocity * 0.5);
}

function updatePhysics() {
    if (isLevelComplete || !drone || !cargo) return;
    
    // Apply drone controls
    let thrustY = 0;
    let forceX = 0;
    
    // Keyboard controls
    if (keys['KeyW'] || touchControls.thrust) {
        thrustY = -DRONE_MAX_THRUST;
    }
    if (keys['KeyS']) {
        thrustY = DRONE_MAX_THRUST * 0.3; // Gentle descent
    }
    if (keys['KeyA'] || touchControls.left) {
        forceX = -DRONE_HORIZONTAL_FORCE;
    }
    if (keys['KeyD'] || touchControls.right) {
        forceX = DRONE_HORIZONTAL_FORCE;
    }
    
    // Apply forces to drone
    Body.applyForce(drone, drone.position, {
        x: forceX,
        y: thrustY
    });
    
    // Apply gravity manually for more control
    Body.applyForce(drone, drone.position, {
        x: 0,
        y: DRONE_MASS * engine.gravity.y * engine.gravity.scale * 10
    });
    
    // Apply damping
    Body.setVelocity(drone, {
        x: drone.velocity.x * DRONE_DAMPING,
        y: drone.velocity.y * DRONE_DAMPING
    });
    
    // Track maximum swing
    const swingAngle = Math.abs(Math.atan2(
        cargo.position.x - drone.position.x,
        cargo.position.y - drone.position.y
    ));
    const swingPercent = Math.min(100, (swingAngle / Math.PI) * 100);
    if (swingPercent > maxSwing) {
        maxSwing = swingPercent;
    }
    
    // Check collisions
    checkCollisions();
    
    // Check level completion
    checkLevelComplete();
}

function checkCollisions() {
    const bodies = Composite.allBodies(world);
    
    bodies.forEach(body => {
        if (body.label === 'hazard') {
            // Check if cargo touches hazard
            if (Matter.Collision.collides(cargo, body)) {
                gameOver();
            }
        }
    });
}

function checkLevelComplete() {
    const level = levels[currentLevel - 1];
    
    // Check if cargo is in goal zone
    const inZone = 
        cargo.position.x >= (level.goal.x - level.goal.width / 2) * SCALE &&
        cargo.position.x <= (level.goal.x + level.goal.width / 2) * SCALE &&
        cargo.position.y >= (WORLD_HEIGHT - level.goal.y) * SCALE &&
        cargo.position.y <= (WORLD_HEIGHT - level.goal.y + level.goal.height) * SCALE;
    
    // Check velocity
    const velocity = Math.sqrt(cargo.velocity.x ** 2 + cargo.velocity.y ** 2);
    const velocityThreshold = 2; // pixels per frame
    
    if (inZone && velocity < velocityThreshold) {
        completeLevel();
    }
}

function completeLevel() {
    isLevelComplete = true;
    
    // Calculate stars
    let stars = 1;
    const timeBonus = levelTime < 15 ? 1 : 0;
    const swingBonus = maxSwing < 30 ? 1 : 0;
    
    if (timeBonus) stars++;
    if (swingBonus) stars++;
    
    // Display stars
    const starElement = document.getElementById('stars');
    starElement.textContent = '⭐'.repeat(stars);
    starElement.style.display = 'block';
    
    const messageElement = document.getElementById('message');
    messageElement.textContent = `Уровень ${currentLevel} пройден!`;
    messageElement.style.display = 'block';
    
    // Next level after delay
    setTimeout(() => {
        if (currentLevel < levels.length) {
            currentLevel++;
            loadLevel(currentLevel);
        } else {
            // Game complete
            messageElement.textContent = 'Поздравляем! Все уровни пройдены!';
        }
    }, 3000);
}

function gameOver() {
    isLevelComplete = true;
    
    const messageElement = document.getElementById('message');
    messageElement.textContent = 'Груз повреждён! Попробуйте снова.';
    messageElement.style.display = 'block';
    
    // Restart level after delay
    setTimeout(() => {
        loadLevel(currentLevel);
    }, 2000);
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all bodies
    const bodies = Composite.allBodies(world);
    
    bodies.forEach(body => {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        
        if (body.label === 'drone') {
            // Draw drone
            ctx.fillStyle = '#4299e1';
            ctx.fillRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                        body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
            
            // Draw propellers
            ctx.fillStyle = '#63b3ed';
            ctx.beginPath();
            ctx.arc(-0.4 * SCALE, -0.3 * SCALE, 0.15 * SCALE, 0, Math.PI * 2);
            ctx.arc(0.4 * SCALE, -0.3 * SCALE, 0.15 * SCALE, 0, Math.PI * 2);
            ctx.fill();
        } else if (body.label === 'cargo') {
            // Draw cargo
            ctx.fillStyle = '#ed8936';
            ctx.fillRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                        body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
            
            // Draw crate details
            ctx.strokeStyle = '#c05621';
            ctx.lineWidth = 2;
            ctx.strokeRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                          body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
        } else if (body.label === 'goal') {
            // Draw goal zone
            ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
            ctx.fillRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                        body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
            
            // Draw goal marker
            ctx.strokeStyle = '#48bb78';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                          body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
            ctx.setLineDash([]);
        } else if (body.label === 'hazard') {
            // Draw hazard (spikes)
            ctx.fillStyle = '#e53e3e';
            const spikes = 5;
            const width = body.bounds.max.x - body.bounds.min.x;
            const height = body.bounds.max.y - body.bounds.min.y;
            
            ctx.beginPath();
            for (let i = 0; i < spikes; i++) {
                const x = -width/2 + (i * width / spikes);
                ctx.moveTo(x, height/2);
                ctx.lineTo(x + width/(spikes*2), -height/2);
                ctx.lineTo(x + width/spikes, height/2);
            }
            ctx.fill();
        } else if (body.isStatic) {
            // Draw platforms
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                        body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
            
            // Add texture
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 1;
            ctx.strokeRect(-body.bounds.max.x + body.position.x, -body.bounds.max.y + body.position.y,
                          body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
        }
        
        ctx.restore();
    });
    
    // Draw rope
    if (drone && cargo) {
        ctx.beginPath();
        ctx.moveTo(drone.position.x, drone.position.y);
        ctx.lineTo(cargo.position.x, cargo.position.y);
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Update UI
    const velocity = Math.sqrt(drone ? drone.velocity.x ** 2 + drone.velocity.y ** 2 : 0);
    document.getElementById('velocity').textContent = velocity.toFixed(1);
    document.getElementById('swing').textContent = maxSwing.toFixed(0);
    
    if (!isLevelComplete) {
        levelTime += 1/60;
        document.getElementById('timer').textContent = levelTime.toFixed(1);
    }
}

function gameLoop() {
    updatePhysics();
    draw();
    
    // Step the physics engine
    Engine.update(engine, 1000 / 60);
    
    requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);
