/**
 * 3D坦克大战游戏主入口文件
 * 负责游戏的启动和初始化
 */

// 全局游戏实例
let gameLoop = null;

/**
 * 游戏初始化函数
 */
function initializeGame() {
    console.log('🎮 开始初始化3D坦克大战游戏...');
    
    try {
        // 检查浏览器兼容性
        if (!checkBrowserCompatibility()) {
            showCompatibilityError();
            return;
        }
        
        // 显示加载信息
        updateLoadingStatus('正在初始化游戏引擎...');
        
        // 延迟启动以确保DOM完全加载
        setTimeout(() => {
            startGame();
        }, 100);
        
    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
        showInitializationError(error);
    }
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility() {
    const requirements = {
        webgl: !!window.WebGLRenderingContext,
        requestAnimationFrame: !!window.requestAnimationFrame,
        three: !!window.THREE,
        cannon: !!window.CANNON
    };
    
    const missing = Object.entries(requirements)
        .filter(([key, supported]) => !supported)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('❌ 浏览器兼容性检查失败，缺少:', missing);
        return false;
    }
    
    console.log('✅ 浏览器兼容性检查通过');
    return true;
}

/**
 * 启动游戏
 */
function startGame() {
    try {
        updateLoadingStatus('正在启动游戏系统...');
        
        // 创建游戏循环实例
        gameLoop = new GameLoop();
        
        // 设置全局引用
        window.gameLoop = gameLoop;
        
        // 设置调试工具
        setupDebugTools();
        
        // 添加性能监控
        setupPerformanceMonitoring();
        
        console.log('🎉 3D坦克大战游戏启动成功！');
        
        // 显示欢迎信息
        setTimeout(() => {
            if (window.gameUI) {
                window.gameUI.showMessage('欢迎来到3D坦克大战！开始配置你的坦克吧！', 'success');
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ 游戏启动失败:', error);
        showInitializationError(error);
    }
}

/**
 * 更新加载状态
 */
function updateLoadingStatus(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        const statusText = loadingScreen.querySelector('p');
        if (statusText) {
            statusText.textContent = message;
        }
    }
    console.log('📱', message);
}

/**
 * 显示兼容性错误
 */
function showCompatibilityError() {
    const errorHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff5722;
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
        ">
            <h2>🚫 浏览器不兼容</h2>
            <p>抱歉，您的浏览器不支持运行此游戏。</p>
            <p>请使用现代浏览器如：</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>Chrome 80+</li>
                <li>Firefox 75+</li>
                <li>Safari 13+</li>
                <li>Edge 80+</li>
            </ul>
            <p>并确保启用了WebGL和JavaScript。</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff5722;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 10px;
            ">重新检查</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
}

/**
 * 显示初始化错误
 */
function showInitializationError(error) {
    const errorHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
        ">
            <h2>❌ 游戏启动失败</h2>
            <p>游戏在启动过程中遇到了错误：</p>
            <p style="
                background: rgba(0,0,0,0.3);
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                margin: 15px 0;
            ">${error.message}</p>
            <p>请尝试以下解决方案：</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>刷新页面重试</li>
                <li>清除浏览器缓存</li>
                <li>确保网络连接正常</li>
                <li>检查浏览器控制台获取更多信息</li>
            </ul>
            <div>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #f44336;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                ">刷新重试</button>
                <button onclick="console.log('Debug info:', error)" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 5px;
                ">查看详情</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
}

/**
 * 设置调试工具
 */
function setupDebugTools() {
    // 只在开发环境启用调试工具
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('🔧 启用调试工具');
        
        // 创建调试面板
        createDebugPanel();
        
        // 全局调试函数
        window.debugGame = {
            getGameStatus: () => gameLoop ? gameLoop.getGameStatus() : null,
            getTanks: () => gameLoop ? Array.from(gameLoop.tanks.values()) : [],
            getPerformance: () => gameLoop ? gameLoop.performance : null,
            restart: () => gameLoop ? gameLoop.restart() : null,
            pause: () => gameLoop ? gameLoop.pause() : null,
            resume: () => gameLoop ? gameLoop.resume() : null,
            spawnRandomTank: () => spawnRandomTank(),
            togglePhysicsDebug: () => togglePhysicsDebug()
        };
        
        console.log('🎯 调试工具已启用，使用 window.debugGame 访问');
    }
}

/**
 * 创建调试面板
 */
function createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 400px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        max-width: 300px;
        display: none;
    `;
    
    debugPanel.innerHTML = `
        <h4>🔧 调试面板</h4>
        <div id="debugInfo"></div>
        <div style="margin-top: 10px;">
            <button onclick="debugGame.restart()">重启</button>
            <button onclick="debugGame.spawnRandomTank()">生成坦克</button>
            <button onclick="this.parentElement.parentElement.style.display='none'">关闭</button>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // F12键切换调试面板
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F12') {
            event.preventDefault();
            const panel = document.getElementById('debugPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
    
    // 定期更新调试信息
    setInterval(() => {
        updateDebugInfo();
    }, 1000);
}

/**
 * 更新调试信息
 */
function updateDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo || !gameLoop) return;
    
    const status = gameLoop.getGameStatus();
    debugInfo.innerHTML = `
        <div>状态: ${status.state}</div>
        <div>FPS: ${status.fps}</div>
        <div>坦克数: ${status.tankCount}</div>
        <div>活动坦克: ${status.activeTank || 'none'}</div>
        <div>更新时间: ${status.performance.updateTime.toFixed(2)}ms</div>
        <div>渲染时间: ${status.performance.renderTime.toFixed(2)}ms</div>
        <div>物理时间: ${status.performance.physicsTime.toFixed(2)}ms</div>
    `;
}

/**
 * 生成随机坦克（调试用）
 */
function spawnRandomTank() {
    if (!window.EngineFactory || !window.ArmorFactory || !gameLoop) {
        console.error('工厂类或游戏循环未初始化');
        return;
    }
    
    try {
        const builder = new TankBuilder();
        
        // 添加随机引擎
        const randomEngine = EngineFactory.createRandomEngine();
        builder.addComponent(randomEngine);
        
        // 添加随机装甲
        const randomArmor = ArmorFactory.createRandomArmor();
        builder.addComponent(randomArmor);
        
        // 构建坦克
        const tank = builder.buildTank();
        gameLoop.addTank(tank);
        gameLoop.spawnTankAtRandomPoint(tank);
        
        console.log('🚗 生成随机坦克:', tank.id);
        
    } catch (error) {
        console.error('生成随机坦克失败:', error);
    }
}

/**
 * 切换物理调试显示
 */
function togglePhysicsDebug() {
    // 这里可以添加物理调试可视化
    console.log('🔍 物理调试切换（功能待实现）');
}

/**
 * 设置性能监控
 */
function setupPerformanceMonitoring() {
    // 内存使用监控
    if (performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1048576);
            const total = Math.round(memory.totalJSHeapSize / 1048576);
            
            if (used > 100) { // 内存使用超过100MB时警告
                console.warn(`⚠️ 内存使用较高: ${used}MB / ${total}MB`);
            }
        }, 10000); // 每10秒检查一次
    }
    
    // 帧率监控
    let lowFpsCount = 0;
    setInterval(() => {
        if (gameLoop) {
            const status = gameLoop.getGameStatus();
            if (status.fps < 30) {
                lowFpsCount++;
                if (lowFpsCount >= 5) {
                    console.warn(`⚠️ 帧率过低: ${status.fps} FPS`);
                    lowFpsCount = 0;
                }
            } else {
                lowFpsCount = 0;
            }
        }
    }, 1000);
}

/**
 * 游戏清理函数
 */
function cleanupGame() {
    console.log('🧹 清理游戏资源...');
    
    if (gameLoop) {
        gameLoop.stop();
        gameLoop = null;
    }
    
    // 清理全局变量
    window.gameLoop = null;
    window.gameEngine = null;
    window.physicsSystem = null;
    window.inputSystem = null;
    window.collisionSystem = null;
    window.qualitySystem = null;
    window.gameUI = null;
    window.battlefield = null;
    
    console.log('✅ 游戏资源清理完成');
}

/**
 * 页面卸载时清理
 */
window.addEventListener('beforeunload', () => {
    cleanupGame();
});

/**
 * 页面加载完成后启动游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成，准备启动游戏...');
    initializeGame();
});

/**
 * 处理页面可见性变化
 */
document.addEventListener('visibilitychange', () => {
    if (gameLoop) {
        if (document.hidden) {
            gameLoop.pause();
        } else {
            gameLoop.resume();
        }
    }
});

// 导出主要函数到全局作用域（用于HTML按钮等）
window.initializeGame = initializeGame;
window.cleanupGame = cleanupGame;

console.log('🎮 3D坦克大战游戏脚本加载完成');