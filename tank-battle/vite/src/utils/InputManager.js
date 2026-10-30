/**
 * 输入管理器
 * 负责键盘、鼠标和触摸输入的统一处理
 */
export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Set(),
            wheel: 0
        };

        this.touch = {
            touches: [],
            startTouches: []
        };

        this.gamepad = {
            connected: false,
            axes: [],
            buttons: []
        };

        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
            event.preventDefault();
        });

        window.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
            event.preventDefault();
        });

        // 鼠标事件
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });

        window.addEventListener('mousedown', (event) => {
            this.mouse.buttons.add(event.button);
        });

        window.addEventListener('mouseup', (event) => {
            this.mouse.buttons.delete(event.button);
        });

        window.addEventListener('wheel', (event) => {
            this.mouse.wheel = event.deltaY;
        });

        // 触摸事件
        window.addEventListener('touchstart', (event) => {
            this.touch.touches = Array.from(event.touches);
            this.touch.startTouches = Array.from(event.touches);
        });

        window.addEventListener('touchmove', (event) => {
            this.touch.touches = Array.from(event.touches);
        });

        window.addEventListener('touchend', (event) => {
            this.touch.touches = Array.from(event.touches);
        });

        // 游戏手柄事件
        window.addEventListener('gamepadconnected', (event) => {
            this.gamepad.connected = true;
            console.log('Gamepad connected:', event.gamepad);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            this.gamepad.connected = false;
            console.log('Gamepad disconnected:', event.gamepad);
        });
    }

    /**
     * 更新输入状态
     */
    update() {
        // 重置鼠标滚轮
        this.mouse.wheel = 0;

        // 更新游戏手柄状态
        if (this.gamepad.connected) {
            this.updateGamepadState();
        }
    }

    /**
     * 更新游戏手柄状态
     */
    updateGamepadState() {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0]; // 使用第一个游戏手柄

        if (gamepad) {
            this.gamepad.axes = Array.from(gamepad.axes);
            this.gamepad.buttons = Array.from(gamepad.buttons).map(button => ({
                pressed: button.pressed,
                value: button.value
            }));
        }
    }

    /**
     * 检查按键是否被按下
     */
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) === true;
    }

    /**
     * 检查按键是否刚刚被按下
     */
    isKeyDown(keyCode) {
        return this.keys.get(keyCode) === true;
    }

    /**
     * 检查按键是否刚刚被释放
     */
    isKeyUp(keyCode) {
        return this.keys.get(keyCode) === false;
    }

    /**
     * 检查鼠标按钮是否被按下
     */
    isMouseButtonPressed(button) {
        return this.mouse.buttons.has(button);
    }

    /**
     * 获取鼠标位置
     */
    getMousePosition() {
        return {
            x: this.mouse.x,
            y: this.mouse.y
        };
    }

    /**
     * 获取鼠标滚轮增量
     */
    getMouseWheel() {
        return this.mouse.wheel;
    }

    /**
     * 获取标准化鼠标位置 (-1 到 1)
     */
    getNormalizedMousePosition(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((this.mouse.x - rect.left) / rect.width) * 2 - 1,
            y: -((this.mouse.y - rect.top) / rect.height) * 2 + 1
        };
    }

    /**
     * 获取触摸位置
     */
    getTouches() {
        return this.touch.touches.map(touch => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY
        }));
    }

    /**
     * 获取游戏手柄轴值
     */
    getGamepadAxis(axisIndex) {
        return this.gamepad.axes[axisIndex] || 0;
    }

    /**
     * 检查游戏手柄按钮是否被按下
     */
    isGamepadButtonPressed(buttonIndex) {
        return this.gamepad.buttons[buttonIndex]?.pressed || false;
    }

    /**
     * 获取坦克移动输入
     */
    getTankMovementInput() {
        const input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            turbo: false
        };

        // 键盘输入
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            input.forward = true;
        }
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            input.backward = true;
        }
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            input.left = true;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            input.right = true;
        }
        if (this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight')) {
            input.turbo = true;
        }

        // 游戏手柄输入
        if (this.gamepad.connected) {
            const leftStickY = -this.getGamepadAxis(1); // Y轴反转
            const leftStickX = this.getGamepadAxis(0);

            if (leftStickY > 0.1) input.forward = true;
            if (leftStickY < -0.1) input.backward = true;
            if (leftStickX < -0.1) input.left = true;
            if (leftStickX > 0.1) input.right = true;

            if (this.isGamepadButtonPressed(7)) { // R2触发器
                input.turbo = true;
            }
        }

        return input;
    }

    /**
     * 获取坦克转向输入
     */
    getTankRotationInput() {
        // 使用鼠标位置或游戏手柄右摇杆
        if (this.gamepad.connected) {
            return {
                x: this.getGamepadAxis(2), // 右摇杆X轴
                y: this.getGamepadAxis(3)  // 右摇杆Y轴
            };
        }

        return {
            x: 0,
            y: 0
        };
    }

    /**
     * 震动游戏手柄 (如果支持)
     */
    vibrateGamepad(duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.5) {
        if (this.gamepad.connected && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        // 移除所有事件监听器
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        window.removeEventListener('mousemove', this.mousemoveHandler);
        window.removeEventListener('mousedown', this.mousedownHandler);
        window.removeEventListener('mouseup', this.mouseupHandler);
        window.removeEventListener('wheel', this.wheelHandler);
        window.removeEventListener('touchstart', this.touchstartHandler);
        window.removeEventListener('touchmove', this.touchmoveHandler);
        window.removeEventListener('touchend', this.touchendHandler);
        window.removeEventListener('gamepadconnected', this.gamepadconnectedHandler);
        window.removeEventListener('gamepaddisconnected', this.gamepaddisconnectedHandler);

        // 清空状态
        this.keys.clear();
        this.mouse.buttons.clear();
        this.touch.touches = [];
        this.touch.startTouches = [];
    }
}


