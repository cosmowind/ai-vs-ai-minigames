// 主程序入口
class Main {
    constructor() {
        this.isInitialized = false;
        this.isReady = false;
    }

    async init() {
        console.log('Starting Block Tank Arena...');
        
        try {
            // 检查浏览器兼容性
            if (!this.checkBrowserCompatibility()) {
                alert('您的浏览器不支持WebGL或Web Audio API，请使用现代浏览器。');
                return;
            }
            
            // 显示加载界面
            this.showLoadingScreen();
            
            // 初始化各个模块
            await this.initializeModules();
            
            // 设置全局访问
            this.setupGlobalAccess();
            
            // 初始化游戏
            await window.game.init();
            
            // 显示主菜单
            window.uiManager.showScreen('mainMenu');
            
            this.isInitialized = true;
            this.isReady = true;
            
            console.log('Block Tank Arena initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError(error.message);
        }
    }

    // 检查浏览器兼容性
    checkBrowserCompatibility() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return false;
        }
        
        // 检查Web Audio API
        if (!window.AudioContext && !window.webkitAudioContext) {
            return false;
        }
        
        return true;
    }

    // 显示加载界面
    showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'initial-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: 'Arial', sans-serif;
        `;
        
        loadingDiv.innerHTML = `
            <h1 style="font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                方块坦克竞技场
            </h1>
            <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px;">
                <div id="initial-progress" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 2px; transition: width 0.3s;"></div>
            </div>
            <p id="initial-status" style="margin-top: 20px; opacity: 0.8;">正在初始化...</p>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    // 更新加载进度
    updateLoadingProgress(percent, status = '') {
        const progressBar = document.getElementById('initial-progress');
        const statusText = document.getElementById('initial-status');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (statusText) {
            statusText.textContent = status;
        }
    }

    // 隐藏加载界面
    hideLoadingScreen() {
        const loadingDiv = document.getElementById('initial-loading');
        if (loadingDiv) {
            loadingDiv.style.opacity = '0';
            setTimeout(() => {
                if (loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                }
            }, 500);
        }
    }

    // 初始化各个模块
    async initializeModules() {
        this.updateLoadingProgress(10, '正在加载组件系统...');
        
        // 初始化组件管理器
        window.componentManager = new ComponentManager();
        await window.componentManager.init();
        
        this.updateLoadingProgress(25, '正在初始化UI系统...');
        
        // 初始化UI管理器
        window.uiManager = new UIManager();
        await window.uiManager.init();
        
        this.updateLoadingProgress(40, '正在设置物理引擎...');
        
        // 初始化物理管理器
        window.physicsManager = new PhysicsManager();
        
        this.updateLoadingProgress(55, '正在创建世界...');
        
        // 初始化世界管理器
        window.worldManager = new WorldManager();
        
        this.updateLoadingProgress(70, '正在加载音效...');
        
        // 预加载音效（如果可用）
        if (Utils && Utils.audio && Utils.audio.preload) {
            await Utils.audio.preload();
        }
        
        this.updateLoadingProgress(85, '正在准备游戏...');
        
        // 其他初始化
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.updateLoadingProgress(100, '准备就绪！');
    }

    // 设置全局访问
    setupGlobalAccess() {
        // 确保所有模块都可以通过window访问
        if (!window.componentManager) {
            console.error('ComponentManager not initialized');
        }
        if (!window.uiManager) {
            console.error('UIManager not initialized');
        }
        if (!window.physicsManager) {
            console.error('PhysicsManager not initialized');
        }
        if (!window.worldManager) {
            console.error('WorldManager not initialized');
        }
        if (!window.game) {
            console.error('Game not initialized');
        }
    }

    // 显示错误
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
            z-index: 10001;
        `;
        
        errorDiv.innerHTML = `
            <h3>初始化失败</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff4444;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">重新加载</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    // 设置调试模式
    setDebugMode(enabled) {
        if (window.physicsManager) {
            window.physicsManager.debugMode = enabled;
        }
        
        if (window.worldManager) {
            window.worldManager.debugMode = enabled;
        }
        
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    // 获取游戏信息
    getGameInfo() {
        return {
            version: '1.0.0',
            modules: {
                componentManager: !!window.componentManager,
                uiManager: !!window.uiManager,
                physicsManager: !!window.physicsManager,
                worldManager: !!window.worldManager,
                game: !!window.game
            },
            isInitialized: this.isInitialized,
            isReady: this.isReady
        };
    }
}

// 当页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing game...');
    
    // 创建主程序实例
    window.main = new Main();
    
    try {
        await window.main.init();
    } catch (error) {
        console.error('Critical error during initialization:', error);
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停游戏
        if (window.game && window.game.isRunning && !window.game.isPaused) {
            window.game.togglePause();
        }
    } else {
        // 页面显示时恢复游戏
        // 可以根据需要自动恢复或等待用户操作
    }
});

// 处理窗口关闭
document.addEventListener('beforeunload', () => {
    // 清理资源
    if (window.game) {
        window.game.stop();
    }
    
    if (window.worldManager) {
        window.worldManager.dispose();
    }
    
    if (window.physicsManager) {
        window.physicsManager.dispose();
    }
});

// 添加全局调试函数
window.debug = {
    togglePhysicsDebug: () => {
        if (window.physicsManager) {
            window.physicsManager.debugMode = !window.physicsManager.debugMode;
        }
    },
    
    resetGame: () => {
        if (window.game) {
            window.game.reset();
        }
    },
    
    getGameState: () => {
        if (window.game) {
            return window.game.getGameState();
        }
    },
    
    setCameraMode: (mode) => {
        if (window.game && window.game.cameraController) {
            // 可以添加不同的相机模式
            console.log('Camera mode changed to:', mode);
        }
    }
};

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // F1: 帮助
    if (e.key === 'F1') {
        e.preventDefault();
        alert(`
方块坦克竞技场 - 快捷键：
F1: 显示帮助
F2: 切换物理调试模式
F3: 重置相机
F5: 重新加载游戏
Esc: 暂停/继续游戏
        `);
    }
    
    // F2: 切换物理调试
    if (e.key === 'F2') {
        e.preventDefault();
        window.debug.togglePhysicsDebug();
    }
    
    // F3: 重置相机
    if (e.key === 'F3') {
        e.preventDefault();
        if (window.game && window.game.cameraController) {
            window.game.cameraController.distance = 15;
            window.game.cameraController.rotationX = Math.PI / 6;
            window.game.cameraController.rotationY = 0;
        }
    }
});