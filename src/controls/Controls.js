import { InputState } from '../core/constants.js';

export class Controls {
    constructor() {
        this.inputState = InputState;
        
        // Touch state
        this.touchLeftStart = { x: 0, y: 0 };
        this.touchRightStart = { x: 0, y: 0 };
        
        // Setup input handlers
        this.setupKeyboardListeners();
        this.setupTouchListeners();
        
        // Detect if touch device
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Show/hide touch zones based on device
        this.updateTouchZonesVisibility();
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => this.onOrientationChange());
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.inputState.up = true;
                break;
            case 'KeyS':
                this.inputState.down = true;
                break;
            case 'KeyA':
                this.inputState.left = true;
                break;
            case 'KeyD':
                this.inputState.right = true;
                break;
            case 'Space':
                this.inputState.stabilize = true;
                event.preventDefault();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.inputState.up = false;
                break;
            case 'KeyS':
                this.inputState.down = false;
                break;
            case 'KeyA':
                this.inputState.left = false;
                break;
            case 'KeyD':
                this.inputState.right = false;
                break;
            case 'Space':
                this.inputState.stabilize = false;
                break;
        }
    }
    
    setupTouchListeners() {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        // Prevent default touch behaviors
        canvas.style.touchAction = 'none';
        
        const touchLeftZone = document.getElementById('touch-left');
        const touchRightZone = document.getElementById('touch-right');
        
        if (touchLeftZone) {
            touchLeftZone.addEventListener('touchstart', (e) => this.onTouchLeftStart(e), { passive: false });
            touchLeftZone.addEventListener('touchmove', (e) => this.onTouchLeftMove(e), { passive: false });
            touchLeftZone.addEventListener('touchend', (e) => this.onTouchLeftEnd(e), { passive: false });
        }
        
        if (touchRightZone) {
            touchRightZone.addEventListener('touchstart', (e) => this.onTouchRightStart(e), { passive: false });
            touchRightZone.addEventListener('touchmove', (e) => this.onTouchRightMove(e), { passive: false });
            touchRightZone.addEventListener('touchend', (e) => this.onTouchRightEnd(e), { passive: false });
        }
    }
    
    onTouchLeftStart(event) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        const zone = event.currentTarget;
        const rect = zone.getBoundingClientRect();
        
        this.touchLeftStart.x = touch.clientX - rect.left;
        this.touchLeftStart.y = touch.clientY - rect.top;
        
        this.inputState.touchLeftActive = true;
        this.inputState.touchLeftX = 0;
        this.inputState.touchLeftY = 0;
        
        zone.classList.add('touch-active');
    }
    
    onTouchLeftMove(event) {
        event.preventDefault();
        if (!this.inputState.touchLeftActive) return;
        
        const touch = event.changedTouches[0];
        const zone = event.currentTarget;
        const rect = zone.getBoundingClientRect();
        
        const deltaX = touch.clientX - rect.left - this.touchLeftStart.x;
        const deltaY = touch.clientY - rect.top - this.touchLeftStart.y;
        
        // Normalize to -1 to 1 range
        const maxDistance = 75; // Half of zone size
        this.inputState.touchLeftX = Math.max(-1, Math.min(1, deltaX / maxDistance));
        this.inputState.touchLeftY = Math.max(-1, Math.min(1, deltaY / maxDistance));
    }
    
    onTouchLeftEnd(event) {
        event.preventDefault();
        this.inputState.touchLeftActive = false;
        this.inputState.touchLeftX = 0;
        this.inputState.touchLeftY = 0;
        
        event.currentTarget.classList.remove('touch-active');
    }
    
    onTouchRightStart(event) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        const zone = event.currentTarget;
        const rect = zone.getBoundingClientRect();
        
        this.touchRightStart.x = touch.clientX - rect.left;
        this.touchRightStart.y = touch.clientY - rect.top;
        
        this.inputState.touchRightActive = true;
        this.inputState.touchRightX = 0;
        this.inputState.touchRightY = 0;
        
        zone.classList.add('touch-active');
    }
    
    onTouchRightMove(event) {
        event.preventDefault();
        if (!this.inputState.touchRightActive) return;
        
        const touch = event.changedTouches[0];
        const zone = event.currentTarget;
        const rect = zone.getBoundingClientRect();
        
        const deltaX = touch.clientX - rect.left - this.touchRightStart.x;
        const deltaY = touch.clientY - rect.top - this.touchRightStart.y;
        
        // Normalize to -1 to 1 range
        const maxDistance = 75; // Half of zone size
        this.inputState.touchRightX = Math.max(-1, Math.min(1, deltaX / maxDistance));
        this.inputState.touchRightY = Math.max(-1, Math.min(1, deltaY / maxDistance));
    }
    
    onTouchRightEnd(event) {
        event.preventDefault();
        this.inputState.touchRightActive = false;
        this.inputState.touchRightX = 0;
        this.inputState.touchRightY = 0;
        
        event.currentTarget.classList.remove('touch-active');
    }
    
    updateTouchZonesVisibility() {
        const touchLeftZone = document.getElementById('touch-left');
        const touchRightZone = document.getElementById('touch-right');
        
        if (!touchLeftZone || !touchRightZone) return;
        
        if (this.isTouchDevice) {
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (isLandscape) {
                // Landscape: left and right zones
                touchLeftZone.style.display = 'block';
                touchLeftZone.style.bottom = '20px';
                touchLeftZone.style.left = '20px';
                touchLeftZone.style.top = 'auto';
                
                touchRightZone.style.display = 'block';
                touchRightZone.style.bottom = '20px';
                touchRightZone.style.right = '20px';
                touchRightZone.style.top = 'auto';
            } else {
                // Portrait: bottom and top zones
                touchLeftZone.style.display = 'block';
                touchLeftZone.style.bottom = '20px';
                touchLeftZone.style.left = '50%';
                touchLeftZone.style.transform = 'translateX(-50%)';
                touchLeftZone.style.width = '200px';
                
                touchRightZone.style.display = 'block';
                touchRightZone.style.top = '20px';
                touchRightZone.style.right = 'auto';
                touchRightZone.style.left = '50%';
                touchRightZone.style.transform = 'translateX(-50%)';
                touchRightZone.style.width = '200px';
            }
        } else {
            touchLeftZone.style.display = 'none';
            touchRightZone.style.display = 'none';
        }
    }
    
    onOrientationChange() {
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.updateTouchZonesVisibility();
    }
    
    onResize() {
        this.updateTouchZonesVisibility();
    }
    
    getInputState() {
        // Merge keyboard and touch inputs
        const state = { ...this.inputState };
        
        // Map touch to keyboard-like input for movement
        if (state.touchLeftActive) {
            state.left = state.touchLeftX < -0.3;
            state.right = state.touchLeftX > 0.3;
            state.up = state.touchLeftY < -0.3;
            state.down = state.touchLeftY > 0.3;
        }
        
        // Map right touch to thrust
        if (state.touchRightActive) {
            if (state.touchRightY < -0.3) {
                state.up = true;
            } else if (state.touchRightY > 0.3) {
                state.down = true;
            }
        }
        
        return state;
    }
    
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('orientationchange', this.onOrientationChange);
        window.removeEventListener('resize', this.onResize);
    }
}
