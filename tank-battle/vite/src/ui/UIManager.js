/**
 * UI管理器
 * 负责游戏界面的管理和更新
 */
export class UIManager {
    constructor() {
        this.uiElements = new Map();
        this.gameStats = {
            health: 100,
            score: 0,
            speed: 0,
            damage: 0
        };

        this.init();
    }

    /**
     * 初始化UI
     */
    init() {
        this.createUIContainer();
        this.createHUD();
        this.createMenu();
        this.createComponentSelection();
        this.createGameOverScreen();

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 创建UI容器
     */
    createUIContainer() {
        // 创建主UI容器
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'game-ui';
        this.uiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;

        document.body.appendChild(this.uiContainer);
    }

    /**
     * 创建HUD界面
     */
    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
        `;

        hud.innerHTML = `
            <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
                <div>生命值: <span id="health-value">100</span>/100</div>
                <div>分数: <span id="score-value">0</span></div>
                <div>速度: <span id="speed-value">0</span> km/h</div>
                <div>伤害倍数: <span id="damage-value">1.0</span>x</div>
            </div>
        `;

        this.uiContainer.appendChild(hud);
        this.uiElements.set('hud', hud);
    }

    /**
     * 创建主菜单
     */
    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            background: rgba(0,0,0,0.8);
            padding: 40px;
            border-radius: 10px;
            pointer-events: auto;
        `;

        menu.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px;">3D坦克大战</h1>
            <button id="start-game-btn" style="
                font-size: 24px;
                padding: 15px 30px;
                margin: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">开始游戏</button>
            <br>
            <button id="settings-btn" style="
                font-size: 18px;
                padding: 10px 20px;
                margin: 10px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">设置</button>
        `;

        this.uiContainer.appendChild(menu);
        this.uiElements.set('menu', menu);
    }

    /**
     * 创建组件选择界面
     */
    createComponentSelection() {
        const selection = document.createElement('div');
        selection.id = 'component-selection';
        selection.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            padding: 20px;
            border-radius: 10px;
            color: white;
            max-width: 800px;
            max-height: 600px;
            overflow-y: auto;
            pointer-events: auto;
            display: none;
        `;

        selection.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 20px;">选择坦克组件</h2>
            <div id="component-categories" style="display: flex; flex-direction: column; gap: 20px;">
                <!-- 组件类别将在这里动态生成 -->
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button id="confirm-selection-btn" style="
                    font-size: 18px;
                    padding: 12px 24px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">确认选择</button>
            </div>
        `;

        this.uiContainer.appendChild(selection);
        this.uiElements.set('component-selection', selection);
    }

    /**
     * 创建游戏结束界面
     */
    createGameOverScreen() {
        const gameOver = document.createElement('div');
        gameOver.id = 'game-over-screen';
        gameOver.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            background: rgba(0,0,0,0.9);
            padding: 40px;
            border-radius: 10px;
            pointer-events: auto;
            display: none;
        `;

        gameOver.innerHTML = `
            <h1 style="color: #ff4444; margin-bottom: 20px;">游戏结束</h1>
            <div style="font-size: 24px; margin-bottom: 20px;">
                最终分数: <span id="final-score">0</span>
            </div>
            <button id="restart-game-btn" style="
                font-size: 20px;
                padding: 15px 30px;
                margin: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">重新开始</button>
            <br>
            <button id="return-menu-btn" style="
                font-size: 18px;
                padding: 10px 20px;
                margin: 10px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">返回主菜单</button>
        `;

        this.uiContainer.appendChild(gameOver);
        this.uiElements.set('game-over', gameOver);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开始游戏按钮
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.hideMenu();
                this.showComponentSelection();
                this.onStartGame?.();
            });
        }

        // 确认选择按钮
        const confirmBtn = document.getElementById('confirm-selection-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.hideComponentSelection();
                this.showHUD();
                this.onConfirmSelection?.();
            });
        }

        // 重新开始按钮
        const restartBtn = document.getElementById('restart-game-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.hideGameOver();
                this.showComponentSelection();
                this.onRestartGame?.();
            });
        }

        // 返回菜单按钮
        const menuBtn = document.getElementById('return-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.hideGameOver();
                this.showMenu();
                this.onReturnToMenu?.();
            });
        }
    }

    /**
     * 更新HUD显示
     */
    updateHUD(stats) {
        Object.assign(this.gameStats, stats);

        const healthValue = document.getElementById('health-value');
        const scoreValue = document.getElementById('score-value');
        const speedValue = document.getElementById('speed-value');
        const damageValue = document.getElementById('damage-value');

        if (healthValue) healthValue.textContent = Math.max(0, Math.round(stats.health || 0));
        if (scoreValue) scoreValue.textContent = Math.round(stats.score || 0);
        if (speedValue) speedValue.textContent = Math.round(stats.speed || 0);
        if (damageValue) damageValue.textContent = (stats.damage || 1.0).toFixed(1);
    }

    /**
     * 显示/隐藏界面元素
     */
    showMenu() {
        this.uiElements.get('menu').style.display = 'block';
        this.hideHUD();
        this.hideComponentSelection();
        this.hideGameOver();
    }

    hideMenu() {
        this.uiElements.get('menu').style.display = 'none';
    }

    showHUD() {
        this.uiElements.get('hud').style.display = 'block';
    }

    hideHUD() {
        this.uiElements.get('hud').style.display = 'none';
    }

    showComponentSelection() {
        this.uiElements.get('component-selection').style.display = 'block';
    }

    hideComponentSelection() {
        this.uiElements.get('component-selection').style.display = 'none';
    }

    showGameOver(finalScore = 0) {
        const scoreElement = document.getElementById('final-score');
        if (scoreElement) {
            scoreElement.textContent = Math.round(finalScore);
        }
        this.uiElements.get('game-over').style.display = 'block';
        this.hideHUD();
    }

    hideGameOver() {
        this.uiElements.get('game-over').style.display = 'none';
    }

    /**
     * 更新方法
     */
    update() {
        // UI动画或其他更新逻辑
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.uiContainer) {
            document.body.removeChild(this.uiContainer);
        }
    }
}


