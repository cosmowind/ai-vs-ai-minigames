/**
 * 游戏主循环类
 * 集成所有系统，管理游戏状态和更新循环
 */
class GameLoop {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.frameId = null;
        
        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 1000; // 1秒更新一次FPS
        this.lastFpsUpdate = 0;
        
        // 游戏状态
        this.gameState = 'loading'; // loading, menu, playing, paused, ended
        this.tanks = new Map();
        this.activeTank = null;
        
        // 系统实例
        this.systems = {
            gameEngine: null,
            physicsSystem: null,
            inputSystem: null,
            collisionSystem: null,
            qualitySystem: null,
            gameUI: null,
            battlefield: null
        };
        
        // 性能监控
        this.performance = {
            updateTime: 0,
            renderTime: 0,
            physicsTime: 0,
            totalTime: 0
        };
        
        this.init();
    }
    
    /**
     * 初始化游戏循环
     */
    init() {
        console.log('🎮 初始化游戏循环...');
        
        this.initializeSystems();
        this.setupEventListeners();
        this.start();
        
        console.log('✅ 游戏循环初始化完成');
    }
    
    /**
     * 初始化所有系统
     */
    initializeSystems() {
        console.log('🔧 初始化游戏系统...');
        
        try {
            // 初始化核心系统
            this.systems.gameEngine = new GameEngine();
            window.gameEngine = this.systems.gameEngine;
            
            this.systems.physicsSystem = new PhysicsSystem();
            window.physicsSystem = this.systems.physicsSystem;
            
            this.systems.qualitySystem = new QualitySystem();
            window.qualitySystem = this.systems.qualitySystem;
            
            this.systems.inputSystem = new InputSystem();
            window.inputSystem = this.systems.inputSystem;
            
            this.systems.collisionSystem = new CollisionSystem();
            window.collisionSystem = this.systems.collisionSystem;
            
            this.systems.gameUI = new GameUI();
            window.gameUI = this.systems.gameUI;
            
            this.systems.battlefield = new Battlefield();
            window.battlefield = this.systems.battlefield;
            
            // 设置系统间的连接
            this.connectSystems();
            
            console.log('✅ 所有系统初始化完成');
            
        } catch (error) {
            console.error('❌ 系统初始化失败:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 连接系统间的依赖关系
     */
    connectSystems() {
        // 设置碰撞系统的坦克管理器引用
        this.systems.collisionSystem.setTankManager(this);
        
        // 设置碰撞回调
        this.systems.collisionSystem.addCollisionCallback('tank_vs_tank', (data) => {
            this.handleTankCollision(data);
        });
        
        this.systems.collisionSystem.addCollisionCallback('tank_vs_environment', (data) => {
            this.handleEnvironmentCollision(data);
        });
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 坦克构建完成事件
        document.addEventListener('tankBuilt', (event) => {
            this.handleTankBuilt(event.detail.tank);
        });
        
        // 窗口焦点事件
        window.addEventListener('blur', () => {
            this.pause();
        });
        
        window.addEventListener('focus', () => {
            if (this.gameState === 'playing') {
                this.resume();
            }
        });
        
        // 页面关闭事件
        window.addEventListener('beforeunload', () => {
            this.stop();
        });
    }
    
    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;
        
        console.log('🚀 启动游戏循环');
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameState = 'menu';
        this.lastTime = performance.now();
        
        this.gameLoop();
    }
    
    /**
     * 主游戏循环
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;
        
        // 限制deltaTime防止大幅跳跃
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // 性能监控开始
        const startTime = performance.now();
        
        if (!this.isPaused) {
            // 更新游戏状态
            this.update();
            
            // 渲染游戏
            this.render();
        }
        
        // 性能监控结束
        this.performance.totalTime = performance.now() - startTime;
        
        // 更新FPS
        this.updateFPS(currentTime);
        
        // 继续循环
        this.frameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 更新游戏状态
     */
    update() {
        const updateStart = performance.now();
        
        try {
            // 更新物理系统
            const physicsStart = performance.now();
            if (this.systems.physicsSystem) {
                this.systems.physicsSystem.update(this.deltaTime);
            }
            this.performance.physicsTime = performance.now() - physicsStart;
            
            // 更新输入系统
            if (this.systems.inputSystem) {
                this.systems.inputSystem.update(this.deltaTime);
            }
            
            // 更新所有坦克
            this.updateTanks();
            
            // 更新品质系统特效
            if (this.systems.qualitySystem) {
                this.systems.qualitySystem.updateParticleEffects(this.deltaTime);
            }
            
            // 更新UI
            if (this.systems.gameUI) {
                this.systems.gameUI.update();
            }
            
            // 检查游戏结束条件
            this.checkGameEndConditions();
            
        } catch (error) {
            console.error('更新循环出错:', error);
        }
        
        this.performance.updateTime = performance.now() - updateStart;
    }
    
    /**
     * 更新所有坦克
     */
    updateTanks() {
        this.tanks.forEach(tank => {
            if (tank.isActive) {
                tank.update(this.deltaTime);
            }
        });
    }
    
    /**
     * 渲染游戏画面
     */
    render() {
        const renderStart = performance.now();
        
        try {
            if (this.systems.gameEngine) {
                this.systems.gameEngine.render();
            }
        } catch (error) {
            console.error('渲染出错:', error);
        }
        
        this.performance.renderTime = performance.now() - renderStart;
    }
    
    /**
     * 更新FPS统计
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // 在控制台显示性能信息（调试用）
            if (this.frameCount % 60 === 0) { // 每60帧输出一次
                console.log(`FPS: ${this.fps}, Update: ${this.performance.updateTime.toFixed(2)}ms, Render: ${this.performance.renderTime.toFixed(2)}ms`);
            }
        }
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        console.log('⏸️ 游戏暂停');
        this.isPaused = true;
        this.gameState = 'paused';
        
        // 暂停物理系统
        if (this.systems.physicsSystem) {
            // 物理系统暂停逻辑
        }
        
        // 显示暂停UI
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage('游戏已暂停', 'info');
        }
    }
    
    /**
     * 恢复游戏
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        console.log('▶️ 游戏恢复');
        this.isPaused = false;
        this.gameState = 'playing';
        this.lastTime = performance.now(); // 重置时间避免大跳跃
        
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage('游戏已恢复', 'info');
        }
    }
    
    /**
     * 停止游戏循环
     */
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 停止游戏循环');
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'ended';
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        // 清理资源
        this.cleanup();
    }
    
    /**
     * 处理坦克构建完成
     */
    handleTankBuilt(tank) {
        console.log('🚗 坦克构建完成:', tank.id);
        
        // 添加坦克到管理器
        this.addTank(tank);
        
        // 设置为活动坦克
        this.setActiveTank(tank);
        
        // 在出生点生成坦克
        this.spawnTankAtRandomPoint(tank);
        
        // 切换游戏状态
        this.gameState = 'playing';
        
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage('坦克已部署到战场！', 'success');
        }
    }
    
    /**
     * 添加坦克到游戏
     */
    addTank(tank) {
        this.tanks.set(tank.id, tank);
        console.log(`坦克 ${tank.id} 已添加到游戏`);
    }
    
    /**
     * 移除坦克
     */
    removeTank(tankId) {
        const tank = this.tanks.get(tankId);
        if (tank) {
            tank.dispose();
            this.tanks.delete(tankId);
            
            if (this.activeTank && this.activeTank.id === tankId) {
                this.activeTank = null;
                
                // 清除输入控制
                if (this.systems.inputSystem) {
                    this.systems.inputSystem.setControlledTank(null);
                }
            }
            
            console.log(`坦克 ${tankId} 已移除`);
        }
    }
    
    /**
     * 设置活动坦克
     */
    setActiveTank(tank) {
        this.activeTank = tank;
        
        // 设置输入控制
        if (this.systems.inputSystem) {
            this.systems.inputSystem.setControlledTank(tank);
        }
        
        // 更新UI
        if (this.systems.gameUI) {
            this.systems.gameUI.setCurrentTank(tank);
        }
        
        console.log(`设置活动坦克: ${tank.id}`);
    }
    
    /**
     * 在随机出生点生成坦克
     */
    spawnTankAtRandomPoint(tank) {
        if (!this.systems.battlefield) return;
        
        const spawnPoint = this.systems.battlefield.getAvailableSpawnPoint();
        if (spawnPoint) {
            tank.resetPosition(spawnPoint.position);
            this.systems.battlefield.occupySpawnPoint(spawnPoint.id);
            
            console.log(`坦克 ${tank.id} 在出生点 ${spawnPoint.id} 生成`);
        }
    }
    
    /**
     * 获取坦克通过ID
     */
    getTankById(tankId) {
        return this.tanks.get(tankId);
    }
    
    /**
     * 处理坦克碰撞
     */
    handleTankCollision(data) {
        const { tankA, tankB, damageA, damageB, collisionData } = data;
        
        console.log(`坦克碰撞: ${tankA.id} vs ${tankB.id}, 速度: ${collisionData.speedKmhA.toFixed(1)}km/h vs ${collisionData.speedKmhB.toFixed(1)}km/h`);
        
        // 检查坦克是否被摧毁
        if (tankA.isDestroyed) {
            this.handleTankDestroyed(tankA);
        }
        if (tankB.isDestroyed) {
            this.handleTankDestroyed(tankB);
        }
    }
    
    /**
     * 处理环境碰撞
     */
    handleEnvironmentCollision(data) {
        const { tank, damage } = data;
        
        console.log(`环境碰撞: ${tank.id}, 伤害: ${damage.toFixed(1)}`);
        
        if (tank.isDestroyed) {
            this.handleTankDestroyed(tank);
        }
    }
    
    /**
     * 处理坦克被摧毁
     */
    handleTankDestroyed(tank) {
        console.log(`💥 坦克 ${tank.id} 被摧毁`);
        
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage(`坦克 ${tank.id} 被摧毁！`, 'error');
        }
        
        // 如果是玩家坦克，显示游戏结束
        if (tank === this.activeTank) {
            this.handleGameOver();
        }
    }
    
    /**
     * 处理游戏结束
     */
    handleGameOver() {
        console.log('🎮 游戏结束');
        
        this.gameState = 'ended';
        
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage('游戏结束！按R重新开始', 'error');
            this.systems.gameUI.toggleConfigPanel(); // 显示配置面板
        }
        
        // 清除输入控制
        if (this.systems.inputSystem) {
            this.systems.inputSystem.setControlledTank(null);
        }
    }
    
    /**
     * 检查游戏结束条件
     */
    checkGameEndConditions() {
        if (this.gameState !== 'playing') return;
        
        // 检查是否有活动坦克
        const activeTanks = Array.from(this.tanks.values()).filter(tank => tank.isActive && !tank.isDestroyed);
        
        if (activeTanks.length === 0) {
            this.handleGameOver();
        }
    }
    
    /**
     * 重启游戏
     */
    restart() {
        console.log('🔄 重启游戏');
        
        // 清理现有坦克
        this.tanks.forEach(tank => {
            tank.dispose();
        });
        this.tanks.clear();
        this.activeTank = null;
        
        // 重置系统状态
        if (this.systems.inputSystem) {
            this.systems.inputSystem.setControlledTank(null);
        }
        
        if (this.systems.gameUI) {
            this.systems.gameUI.setCurrentTank(null);
            this.systems.gameUI.handleResetConfiguration();
        }
        
        // 重置游戏状态
        this.gameState = 'menu';
        this.isPaused = false;
        
        if (this.systems.gameUI) {
            this.systems.gameUI.showMessage('游戏已重启', 'info');
        }
    }
    
    /**
     * 获取游戏状态
     */
    getGameStatus() {
        return {
            state: this.gameState,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fps: this.fps,
            tankCount: this.tanks.size,
            activeTank: this.activeTank ? this.activeTank.id : null,
            performance: { ...this.performance }
        };
    }
    
    /**
     * 处理初始化错误
     */
    handleInitializationError(error) {
        console.error('游戏初始化失败:', error);
        
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>游戏初始化失败</h3>
            <p>${error.message}</p>
            <p>请刷新页面重试</p>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        console.log('🧹 清理游戏资源...');
        
        // 清理坦克
        this.tanks.forEach(tank => {
            tank.dispose();
        });
        this.tanks.clear();
        
        // 清理系统
        Object.values(this.systems).forEach(system => {
            if (system && typeof system.dispose === 'function') {
                system.dispose();
            }
        });
        
        console.log('✅ 游戏资源清理完成');
    }
}

// 导出到全局
window.GameLoop = GameLoop;