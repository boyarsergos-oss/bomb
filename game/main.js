import * as THREE from 'three';

class EnergyFlowGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.blocks = [];
        this.currentLevel = 0;
        this.moves = 0;
        this.totalLevels = 60;
        this.gridSize = 5;
        this.blockSize = 1;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isLevelComplete = false;
        
        this.init();
        this.loadLevel(0);
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        
        // Camera - isometric view
        const aspect = window.innerWidth / window.innerHeight;
        const d = 10;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(this.scene.position);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Grid base
        this.createGridBase();
    }

    createGridBase() {
        const geometry = new THREE.PlaneGeometry(this.gridSize * this.blockSize + 2, this.gridSize * this.blockSize + 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a3a,
            transparent: true,
            opacity: 0.8
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.5;
        plane.receiveShadow = true;
        this.scene.add(plane);
        
        // Grid lines
        const gridHelper = new THREE.GridHelper(this.gridSize * this.blockSize + 2, this.gridSize + 2, 0x00ffff, 0x004444);
        gridHelper.position.y = -0.49;
        this.scene.add(gridHelper);
    }

    generateLevel(levelNum) {
        // Procedural level generation for 60 levels
        const difficulty = Math.min(levelNum, 50);
        let size = Math.min(3 + Math.floor(levelNum / 10), 8);
        let numBlocks = Math.min(4 + Math.floor(levelNum / 3), 20);
        let numSources = Math.max(1, Math.floor(levelNum / 15) + 1);
        let numTargets = numSources;
        
        // Special level patterns
        if (levelNum % 10 === 0 && levelNum > 0) {
            // Boss levels - larger grids
            size = Math.min(size + 2, 10);
            numBlocks *= 1.5;
        }
        
        if (levelNum % 5 === 0 && levelNum > 0) {
            // Obstacle levels
            numBlocks += 5;
        }
        
        const positions = [];
        const occupied = new Set();
        
        // Helper to check if position is valid
        const isValidPosition = (x, y) => {
            const key = `${x},${y}`;
            return !occupied.has(key) && x >= 0 && x < size && y >= 0 && y < size;
        };
        
        const occupy = (x, y) => {
            occupied.add(`${x},${y}`);
        };
        
        // Place sources
        const sources = [];
        for (let i = 0; i < numSources; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            } while (!isValidPosition(x, y));
            
            occupy(x, y);
            positions.push({ type: 'source', x, y, rotation: Math.floor(Math.random() * 4) });
            sources.push({ x, y });
        }
        
        // Place targets
        const targets = [];
        for (let i = 0; i < numTargets; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            } while (!isValidPosition(x, y));
            
            occupy(x, y);
            positions.push({ type: 'target', x, y, rotation: Math.floor(Math.random() * 4) });
            targets.push({ x, y });
        }
        
        // Place blocks
        for (let i = 0; i < numBlocks; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            } while (!isValidPosition(x, y));
            
            occupy(x, y);
            positions.push({ 
                type: 'block', 
                x, 
                y, 
                rotation: Math.floor(Math.random() * 4),
                connections: [true, true, false, false] // Will be randomized
            });
        }
        
        // Add obstacles for higher levels
        if (levelNum >= 10) {
            const numObstacles = Math.min(Math.floor(levelNum / 10), 8);
            for (let i = 0; i < numObstacles; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * size);
                    y = Math.floor(Math.random() * size);
                } while (!isValidPosition(x, y));
                
                occupy(x, y);
                positions.push({ type: 'obstacle', x, y });
            }
        }
        
        return {
            size,
            positions,
            sources,
            targets
        };
    }

    loadLevel(levelNum) {
        // Clear existing blocks
        this.blocks.forEach(block => this.scene.remove(block.mesh));
        this.blocks = [];
        this.isLevelComplete = false;
        this.moves = 0;
        this.currentLevel = levelNum;
        
        // Generate level data
        const levelData = this.generateLevel(levelNum);
        this.gridSize = levelData.size;
        
        // Recreate grid base with new size
        this.scene.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'PlaneGeometry') {
                this.scene.remove(child);
            }
            if (child.type === 'GridHelper') {
                this.scene.remove(child);
            }
        });
        this.createGridBase();
        
        // Create blocks
        levelData.positions.forEach(pos => {
            this.createBlock(pos);
        });
        
        // Update UI
        this.updateUI();
        document.getElementById('message').style.display = 'none';
        
        // Check initial state
        setTimeout(() => this.checkConnections(), 100);
    }

    createBlock(position) {
        let geometry, material, mesh;
        const offset = (this.gridSize - 1) * this.blockSize / 2;
        const x = position.x * this.blockSize - offset;
        const z = position.y * this.blockSize - offset;
        
        if (position.type === 'source') {
            // Energy source - blue sphere
            geometry = new THREE.SphereGeometry(this.blockSize * 0.4, 32, 32);
            material = new THREE.MeshStandardMaterial({ 
                color: 0x0088ff,
                emissive: 0x0044ff,
                emissiveIntensity: 0.5
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { type: 'source', ...position };
        } else if (position.type === 'target') {
            // Energy target - red ring
            geometry = new THREE.TorusGeometry(this.blockSize * 0.35, 0.1, 16, 32);
            material = new THREE.MeshStandardMaterial({ 
                color: 0xff0044,
                emissive: 0xff0022,
                emissiveIntensity: 0.3
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { type: 'target', ...position };
        } else if (position.type === 'obstacle') {
            // Obstacle - dark cube
            geometry = new THREE.BoxGeometry(this.blockSize * 0.8, this.blockSize * 0.8, this.blockSize * 0.8);
            material = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                emissive: 0x111111
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { type: 'obstacle', ...position };
        } else {
            // Regular block - cube with connection indicators
            geometry = new THREE.BoxGeometry(this.blockSize * 0.9, this.blockSize * 0.9, this.blockSize * 0.9);
            material = new THREE.MeshStandardMaterial({ 
                color: 0x4444aa,
                transparent: true,
                opacity: 0.9
            });
            mesh = new THREE.Mesh(geometry, material);
            
            // Add connection indicators
            this.addConnectionIndicators(mesh, position);
            mesh.userData = { type: 'block', ...position };
        }
        
        mesh.position.set(x, 0, z);
        mesh.rotation.y = position.rotation * Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        this.blocks.push({ mesh, ...position });
    }

    addConnectionIndicators(mesh, position) {
        // Create small spheres to show connection points
        const indicatorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const indicatorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.5
        });
        
        // Randomize connections for variety
        const connections = [
            Math.random() > 0.3,
            Math.random() > 0.3,
            Math.random() > 0.3,
            Math.random() > 0.3
        ];
        
        // Ensure at least 2 connections
        const connectionCount = connections.filter(c => c).length;
        if (connectionCount < 2) {
            for (let i = 0; i < 4 && connectionCount < 2; i++) {
                if (!connections[i]) {
                    connections[i] = true;
                }
            }
        }
        
        position.connections = connections;
        
        // Add indicators based on connections
        const directions = [
            { x: 0.5, z: 0 },   // Right
            { x: 0, z: 0.5 },   // Front
            { x: -0.5, z: 0 },  // Left
            { x: 0, z: -0.5 }   // Back
        ];
        
        connections.forEach((hasConnection, index) => {
            if (hasConnection) {
                const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
                const dir = directions[index];
                indicator.position.set(dir.x * 0.5, 0, dir.z * 0.5);
                mesh.add(indicator);
            }
        });
    }

    rotateBlock(block) {
        if (block.userData.type !== 'block' || this.isLevelComplete) return;
        
        block.rotation.y += Math.PI / 2;
        block.userData.rotation = (block.userData.rotation + 1) % 4;
        this.moves++;
        this.updateUI();
        
        // Check connections after a short delay
        setTimeout(() => this.checkConnections(), 100);
    }

    checkConnections() {
        if (this.isLevelComplete) return;
        
        // Find all sources and targets
        const sources = this.blocks.filter(b => b.type === 'source');
        const targets = this.blocks.filter(b => b.type === 'target');
        
        if (sources.length === 0 || targets.length === 0) return;
        
        // Simple connection check - in a full implementation, this would trace paths
        let allConnected = true;
        
        sources.forEach(source => {
            const connectedTargets = this.findConnectedTargets(source, targets);
            if (connectedTargets.length === 0) {
                allConnected = false;
            }
        });
        
        if (allConnected && targets.every(t => {
            return sources.some(s => this.findConnectedTargets(s, [t]).length > 0);
        })) {
            this.levelComplete();
        }
    }

    findConnectedTargets(source, targets) {
        const connected = [];
        const visited = new Set();
        const queue = [source];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Check if current is a target
            if (current.type === 'target') {
                connected.push(current);
                continue;
            }
            
            // Get adjacent blocks based on rotation and connections
            const adjacentBlocks = this.getAdjacentBlocks(current);
            adjacentBlocks.forEach(adj => {
                if (!visited.has(`${adj.x},${adj.y}`)) {
                    queue.push(adj);
                }
            });
        }
        
        return connected;
    }

    getAdjacentBlocks(block) {
        const adjacent = [];
        const rotation = block.mesh ? block.mesh.rotation.y / (Math.PI / 2) : block.rotation;
        const normalizedRotation = ((rotation % 4) + 4) % 4;
        
        const directions = [
            { dx: 1, dz: 0 },   // Right
            { dx: 0, dz: 1 },   // Front  
            { dx: -1, dz: 0 },  // Left
            { dx: 0, dz: -1 }   // Back
        ];
        
        // Check which connections are active based on rotation
        const connections = block.connections || [true, true, true, true];
        
        for (let i = 0; i < 4; i++) {
            if (connections[i]) {
                const dirIndex = (i + normalizedRotation) % 4;
                const dir = directions[dirIndex];
                const newX = block.x + dir.dx;
                const newZ = block.z + dir.dz;
                
                // Find block at new position
                const neighbor = this.blocks.find(b => 
                    Math.abs(b.x * this.blockSize - (newX * this.blockSize + (this.gridSize - 1) * this.blockSize / 2)) < 0.1 &&
                    Math.abs(b.z * this.blockSize - (newZ * this.blockSize + (this.gridSize - 1) * this.blockSize / 2)) < 0.1
                );
                
                if (neighbor && neighbor.type !== 'obstacle') {
                    adjacent.push(neighbor);
                }
            }
        }
        
        return adjacent;
    }

    levelComplete() {
        this.isLevelComplete = true;
        const message = document.getElementById('message');
        message.style.display = 'block';
        message.textContent = `LEVEL ${this.currentLevel + 1} COMPLETE!`;
        
        // Visual feedback - make blocks glow
        this.blocks.forEach(block => {
            if (block.mesh.material.emissive) {
                block.mesh.material.emissiveIntensity = 1;
            }
        });
        
        // Update progress
        const progress = ((this.currentLevel + 1) / this.totalLevels) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    updateUI() {
        document.getElementById('level-indicator').textContent = `Level: ${this.currentLevel + 1} / ${this.totalLevels}`;
        document.getElementById('moves-counter').textContent = `Moves: ${this.moves}`;
    }

    nextLevel() {
        if (this.currentLevel < this.totalLevels - 1) {
            this.loadLevel(this.currentLevel + 1);
        } else {
            alert('Congratulations! You\'ve completed all levels! 🎉');
        }
    }

    prevLevel() {
        if (this.currentLevel > 0) {
            this.loadLevel(this.currentLevel - 1);
        }
    }

    resetLevel() {
        this.loadLevel(this.currentLevel);
    }

    setupEventListeners() {
        // Mouse click for rotating blocks
        window.addEventListener('click', (event) => {
            if (event.target.closest('#controls') || event.target.closest('#instructions')) return;
            
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.blocks.map(b => b.mesh));
            
            if (intersects.length > 0) {
                this.rotateBlock(intersects[0].object);
            }
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            switch(event.key.toLowerCase()) {
                case 'r':
                    this.resetLevel();
                    break;
                case 'n':
                    this.nextLevel();
                    break;
                case 'p':
                    this.prevLevel();
                    break;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            const d = 10;
            this.camera.left = -d * aspect;
            this.camera.right = d * aspect;
            this.camera.top = d;
            this.camera.bottom = -d;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Subtle animation for blocks
        this.blocks.forEach((block, index) => {
            if (block.type === 'source' || block.type === 'target') {
                block.mesh.position.y = Math.sin(Date.now() * 0.001 + index) * 0.1;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new EnergyFlowGame();
});

// Expose game functions to HTML
window.game = {
    nextLevel: () => game.nextLevel(),
    prevLevel: () => game.prevLevel(),
    resetLevel: () => game.resetLevel()
};
