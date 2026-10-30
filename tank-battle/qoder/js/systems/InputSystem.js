/**
 * 输入控制系统类
 * 处理键盘输入、手柄输入和坦克控制
 */
class InputSystem {
    constructor() {
        this.keyStates = new Map(); // 当前按键状态
        this.controlledTank = null; // 当前控制的坦克
        this.isEnabled = true;
        
        // 控制配置
        this.keyBindings = {
            // 移动控制
            forward: ['KeyW', 'ArrowUp'],
            backward: ['KeyS', 'ArrowDown'], 
            turnLeft: ['KeyA', 'ArrowLeft'],
            turnRight: ['KeyD', 'ArrowRight'],
            
            // 功能键
            brake: ['Space'],
            reset: ['KeyR'],
            changeCamera: ['KeyC'],
            
            // UI控制
            openMenu: ['Escape'],
            confirm: ['Enter'],
            cancel: ['Backspace']
        };
        
        // 输入敏感度设置
        this.sensitivity = {
            throttle: 1.0,
            steering: 1.0,
            camera: 1.0
        };
        
        // 相机控制
        this.cameraMode = 'follow'; // follow, free, top
        this.cameraOffset = new THREE.Vector3(0, 15, 20);
        this.cameraTarget = new THREE.Vector3();
        
        this.init();
    }
    
    /**
     * 初始化输入系统
     */
    init() {
        console.log('🎮 初始化输入控制系统...');
        
        this.setupEventListeners();
        this.initializeKeyStates();
        
        console.log('✅ 输入控制系统初始化完成');
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // 鼠标事件（用于相机控制）
        document.addEventListener('mousedown', (event) => {
            this.handleMouseDown(event);
        });
        
        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
        
        document.addEventListener('mouseup', (event) => {
            this.handleMouseUp(event);
        });
        
        // 窗口焦点事件
        window.addEventListener('blur', () => {
            this.clearAllKeyStates();
        });
        
        // 阻止某些默认行为
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * 初始化按键状态
     */
    initializeKeyStates() {
        // 为所有绑定的按键初始化状态
        Object.values(this.keyBindings).flat().forEach(key => {
            this.keyStates.set(key, false);
        });
    }
    
    /**
     * 处理按键按下
     */
    handleKeyDown(event) {
        if (!this.isEnabled) return;
        
        const keyCode = event.code;
        
        // 防止重复触发
        if (this.keyStates.get(keyCode)) return;
        
        this.keyStates.set(keyCode, true);
        
        // 处理特殊按键
        this.handleSpecialKeys(keyCode, true);
        
        // 阻止某些按键的默认行为
        if (this.shouldPreventDefault(keyCode)) {
            event.preventDefault();
        }
    }
    
    /**
     * 处理按键释放
     */
    handleKeyUp(event) {
        if (!this.isEnabled) return;
        
        const keyCode = event.code;
        this.keyStates.set(keyCode, false);
        
        // 处理特殊按键
        this.handleSpecialKeys(keyCode, false);
    }
    
    /**
     * 处理特殊功能按键
     */
    handleSpecialKeys(keyCode, isPressed) {
        if (!isPressed) return; // 只处理按下事件
        
        // 重置坦克位置
        if (this.isKeyBound('reset', keyCode)) {
            this.resetTankPosition();
        }
        
        // 切换相机视角
        else if (this.isKeyBound('changeCamera', keyCode)) {
            this.switchCameraMode();
        }
        
        // 打开菜单
        else if (this.isKeyBound('openMenu', keyCode)) {
            this.toggleGameMenu();
        }
    }
    
    /**
     * 检查按键是否绑定到指定功能
     */
    isKeyBound(action, keyCode) {
        return this.keyBindings[action] && this.keyBindings[action].includes(keyCode);
    }
    
    /**
     * 检查是否应该阻止默认行为
     */
    shouldPreventDefault(keyCode) {
        const preventKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        return preventKeys.includes(keyCode);
    }
    
    /**
     * 设置控制的坦克
     */
    setControlledTank(tank) {
        this.controlledTank = tank;
        console.log(`🎮 现在控制坦克: ${tank ? tank.id : 'none'}`);
    }
    
    /**
     * 更新输入处理（每帧调用）
     */
    update(deltaTime) {
        if (!this.isEnabled || !this.controlledTank) return;
        
        // 计算控制输入
        const controls = this.calculateControls();
        
        // 应用到坦克
        this.applyControlsToTank(controls);
        
        // 更新相机
        this.updateCamera();
    }
    
    /**
     * 计算控制输入
     */
    calculateControls() {
        let throttle = 0;
        let steering = 0;
        let brake = false;
        
        // 计算油门
        if (this.isActionPressed('forward')) {
            throttle += 1;
        }
        if (this.isActionPressed('backward')) {
            throttle -= 1;
        }
        
        // 计算转向
        if (this.isActionPressed('turnLeft')) {
            steering -= 1;
        }
        if (this.isActionPressed('turnRight')) {
            steering += 1;
        }
        
        // 刹车
        brake = this.isActionPressed('brake');
        
        // 应用敏感度
        throttle *= this.sensitivity.throttle;
        steering *= this.sensitivity.steering;
        
        // 限制范围
        throttle = Math.max(-1, Math.min(1, throttle));
        steering = Math.max(-1, Math.min(1, steering));
        
        return { throttle, steering, brake };
    }
    
    /**
     * 检查动作是否被按下
     */
    isActionPressed(action) {
        const keys = this.keyBindings[action] || [];
        return keys.some(key => this.keyStates.get(key));
    }
    
    /**
     * 应用控制到坦克
     */
    applyControlsToTank(controls) {
        if (!this.controlledTank) return;
        
        this.controlledTank.setControls(
            controls.throttle,
            controls.steering,
            controls.brake
        );
    }
    
    /**
     * 更新相机
     */
    updateCamera() {
        if (!window.gameEngine || !this.controlledTank) return;
        
        switch (this.cameraMode) {
            case 'follow':
                this.updateFollowCamera();
                break;
            case 'free':
                this.updateFreeCamera();
                break;
            case 'top':
                this.updateTopCamera();
                break;
        }
    }
    
    /**
     * 更新跟随相机
     */
    updateFollowCamera() {
        const tankPosition = this.controlledTank.position;
        const tankRotation = this.controlledTank.rotation;
        
        // 计算相机位置（坦克后方上方）
        const offset = this.cameraOffset.clone();
        offset.applyEuler(tankRotation);
        
        const targetPosition = tankPosition.clone().add(offset);
        
        // 平滑相机移动
        if (window.gameEngine.camera) {
            window.gameEngine.updateCamera(tankPosition, {
                x: offset.x,
                y: offset.y,
                z: offset.z
            });
        }
    }
    
    /**
     * 更新自由相机
     */
    updateFreeCamera() {
        // 自由相机模式下可以用鼠标控制
        // 这里简化处理，保持当前位置
    }
    
    /**
     * 更新俯视相机
     */
    updateTopCamera() {
        if (!window.gameEngine.camera) return;
        
        const tankPosition = this.controlledTank.position;
        
        // 俯视角度
        window.gameEngine.camera.position.set(
            tankPosition.x,
            tankPosition.y + 30,
            tankPosition.z
        );
        window.gameEngine.camera.lookAt(tankPosition);
    }
    
    /**
     * 切换相机模式
     */
    switchCameraMode() {
        const modes = ['follow', 'free', 'top'];
        const currentIndex = modes.indexOf(this.cameraMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.cameraMode = modes[nextIndex];
        console.log(`📷 切换到 ${this.cameraMode} 相机模式`);
    }
    
    /**
     * 重置坦克位置
     */
    resetTankPosition() {
        if (!this.controlledTank) return;
        
        this.controlledTank.resetPosition();
        console.log('🔄 坦克位置已重置');
    }
    
    /**
     * 切换游戏菜单
     */
    toggleGameMenu() {
        // 触发菜单切换事件
        const event = new CustomEvent('toggleGameMenu');
        document.dispatchEvent(event);
    }
    
    /**
     * 处理鼠标按下
     */
    handleMouseDown(event) {
        if (this.cameraMode === 'free') {
            // 自由相机模式下启用鼠标控制
            this.isMouseControlActive = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
        if (!this.isMouseControlActive || this.cameraMode !== 'free') return;
        
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        // 更新相机旋转（简化实现）
        if (window.gameEngine && window.gameEngine.camera) {
            const camera = window.gameEngine.camera;
            camera.rotation.y -= deltaX * 0.01 * this.sensitivity.camera;
            camera.rotation.x -= deltaY * 0.01 * this.sensitivity.camera;
            
            // 限制垂直旋转
            camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        }
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    
    /**
     * 处理鼠标释放
     */
    handleMouseUp(event) {
        this.isMouseControlActive = false;
    }
    
    /**
     * 清空所有按键状态
     */
    clearAllKeyStates() {
        this.keyStates.forEach((value, key) => {
            this.keyStates.set(key, false);
        });
    }
    
    /**
     * 设置按键绑定
     */
    setKeyBinding(action, keys) {
        if (Array.isArray(keys)) {
            this.keyBindings[action] = keys;
        } else {
            this.keyBindings[action] = [keys];
        }
        
        // 初始化新按键状态
        this.keyBindings[action].forEach(key => {
            this.keyStates.set(key, false);
        });
    }
    
    /**
     * 获取当前控制状态
     */
    getControlStatus() {
        if (!this.controlledTank) {
            return {
                hasControl: false,
                tank: null,
                controls: null
            };
        }
        
        return {
            hasControl: true,
            tank: this.controlledTank.id,
            controls: this.calculateControls(),
            cameraMode: this.cameraMode,
            isEnabled: this.isEnabled
        };
    }
    
    /**
     * 启用/禁用输入系统
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            this.clearAllKeyStates();
            
            // 停止坦克控制
            if (this.controlledTank) {
                this.controlledTank.setControls(0, 0, false);
            }
        }
        
        console.log(`🎮 输入系统 ${enabled ? '启用' : '禁用'}`);
    }
    
    /**
     * 设置敏感度
     */
    setSensitivity(type, value) {
        if (this.sensitivity.hasOwnProperty(type)) {
            this.sensitivity[type] = Math.max(0.1, Math.min(3.0, value));
            console.log(`🎮 ${type} 敏感度设置为 ${this.sensitivity[type]}`);
        }
    }
    
    /**
     * 获取帮助信息
     */
    getControlsHelp() {
        return {
            movement: {
                'W/↑': '前进',
                'S/↓': '后退',
                'A/←': '左转',
                'D/→': '右转',
                'Space': '刹车'
            },
            functions: {
                'R': '重置位置',
                'C': '切换视角',
                'Esc': '菜单'
            },
            camera: {
                'Follow': '跟随坦克',
                'Free': '自由视角（鼠标控制）',
                'Top': '俯视角度'
            }
        };
    }
    
    /**
     * 清理资源
     */
    dispose() {
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        this.keyStates.clear();
        this.controlledTank = null;
        
        console.log('🧹 输入控制系统资源清理完成');
    }
}

// 导出到全局
window.InputSystem = InputSystem;