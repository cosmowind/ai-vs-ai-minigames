// 游戏管理器
class Game {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameMode = 'training'; // training, battle, survival
        this.gameTime = 0;
        this.gameTimeLimit = 300; // 5分钟
        
        // 游戏状态
        this.playerTank = null;
        this.aiTanks = [];
        this.allTanks = [];
        
        // 游戏统计
        this.score = 0;
        this.kills = 0;
        this.startTime = 0;
        
        // 输入控制
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // 相机控制
        this.cameraController = null;
        
        // 游戏循环
        this.lastTime = 0;
        this.deltaTime = 0;
    }

    // 初始化游戏
    async init() {
        console.log('Initializing game...');
        
        // 显示加载界面
        window.uiManager.showLoading(true);
        window.uiManager.updateLoadingProgress(10);
        
        // 初始化物理系统
        window.physicsManager.init();
        window.uiManager.updateLoadingProgress(30);
        
        // 初始化世界
        const canvas = document.getElementById('game-canvas');
        window.worldManager.init(canvas);
        window.uiManager.updateLoadingProgress(50);
        
        // 初始化相机控制
        this.initCameraControl();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 加载玩家配置
        await this.loadPlayerConfiguration();
        window.uiManager.updateLoadingProgress(80);
        
        console.log('Game initialized');
        window.uiManager.updateLoadingProgress(100);
        
        // 隐藏加载界面
        setTimeout(() => {
            window.uiManager.showLoading(false);
        }, 500);
    }

    // 加载玩家配置
    async loadPlayerConfiguration() {
        const config = window.componentManager.loadConfiguration();
        
        if (!config || !config.engine) {
            // 使用默认配置
            const defaultConfig = new TankConfiguration();
            defaultConfig.setEngine(window.componentManager.getEngines()[0]);
            defaultConfig.addArmor(window.componentManager.getArmors()[0]);
            this.playerConfig = defaultConfig;
        } else {
            this.playerConfig = new TankConfiguration();
            this.playerConfig.setEngine(config.engine);
            if (config.armors) {
                config.armors.forEach(armor => {
                    this.playerConfig.addArmor(armor);
                });
            }
        }
    }

    // 开始游戏
    start(mode = 'training') {
        this.gameMode = mode;
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.startTime = Date.now();
        
        // 重置物理世界
        window.physicsManager.reset();
        
        // 创建玩家坦克
        this.createPlayerTank();
        
        // 根据游戏模式创建AI坦克
        this.createAITanks(mode);
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log(`Game started in ${mode} mode`);
    }

    // 创建玩家坦克
    createPlayerTank() {
        const startPosition = { x: 0, y: 1, z: 0 };
        
        this.playerTank = new Tank(
            window.worldManager.scene,
            window.physicsManager.world,
            startPosition,
            this.playerConfig
        );
        
        this.playerTank.isPlayer = true;
        this.allTanks = [this.playerTank];
        
        // 添加到物理世界
        window.physicsManager.addTank(this.playerTank);
    }

    // 创建AI坦克
    createAITanks(mode) {
        this.aiTanks = [];
        
        const aiCount = mode === 'training' ? 1 : (mode === 'battle' ? 1 : 3);
        const difficulties = mode === 'training' ? [0.5] : [1, 1.5, 2];
        
        for (let i = 0; i < aiCount; i++) {
            const angle = (i / aiCount) * Math.PI * 2;
            const distance = 20;
            const startPosition = {
                x: Math.cos(angle) * distance,
                y: 1,
                z: Math.sin(angle) * distance
            };
            
            // 创建AI配置
            const aiConfig = new TankConfiguration();
            aiConfig.setEngine(window.componentManager.getEngines()[i % 3]);
            aiConfig.addArmor(window.componentManager.getArmors()[i % 3]);
            
            const aiTank = new AITank(
                window.worldManager.scene,
                window.physicsManager.world,
                startPosition,
                aiConfig,
                difficulties[i] || 1
            );
            
            aiTank.setTarget(this.playerTank);
            this.aiTanks.push(aiTank);
            this.allTanks.push(aiTank);
            
            // 添加到物理世界
            window.physicsManager.addTank(aiTank);
        }
    }

    // 初始化相机控制
    initCameraControl() {
        this.cameraController = new CameraController(
            window.worldManager.camera,
            window.worldManager.renderer.domElement
        );
        
        // 设置相机跟随玩家
        this.cameraController.setTarget(this.playerTank);
    }

    // 设置事件监听
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyUp(e.code);
        });
        
        // 鼠标事件
        const canvas = window.worldManager.renderer.domElement;
        canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // 窗口事件
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 监听坦克销毁事件
        Utils.eventSystem.on('tankDestroyed', (tank) => {
            this.handleTankDestroyed(tank);
        });
    }

    // 处理键盘按下
    handleKeyDown(code) {
        if (!this.playerTank || this.playerTank.isDestroyed) return;
        
        switch (code) {
            case 'KeyW':
                this.playerTank.controls.forward = true;
                break;
            case 'KeyS':
                this.playerTank.controls.backward = true;
                break;
            case 'KeyA':
                this.playerTank.controls.left = true;
                break;
            case 'KeyD':
                this.playerTank.controls.right = true;
                break;
            case 'Space':
                this.playerTank.controls.brake = true;
                break;
            case 'Escape':
                this.togglePause();
                break;
        }
    }

    // 处理键盘释放
    handleKeyUp(code) {
        if (!this.playerTank || this.playerTank.isDestroyed) return;
        
        switch (code) {
            case 'KeyW':
                this.playerTank.controls.forward = false;
                break;
            case 'KeyS':
                this.playerTank.controls.backward = false;
                break;
            case 'KeyA':
                this.playerTank.controls.left = false;
                break;
            case 'KeyD':
                this.playerTank.controls.right = false;
                break;
            case 'Space':
                this.playerTank.controls.brake = false;
                break;
        }
    }

    // 处理鼠标移动
    handleMouseMove(event) {
        if (this.cameraController) {
            this.cameraController.handleMouseMove(event);
        }
    }

    // 处理窗口大小调整
    handleResize() {
        if (window.worldManager && window.worldManager.camera) {
            const camera = window.worldManager.camera;
            const renderer = window.worldManager.renderer;
            
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    // 切换暂停
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            console.log('Game paused');
            // 显示暂停界面
        } else {
            console.log('Game resumed');
            this.lastTime = performance.now();
        }
    }

    // 游戏循环
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 限制最大帧时间
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // 更新游戏状态
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // 更新物理世界
        window.physicsManager.update(deltaTime);
        
        // 更新坦克
        this.allTanks.forEach(tank => {
            if (!tank.isDestroyed) {
                tank.update(deltaTime);
            }
        });
        
        // 更新相机
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }
        
        // 更新游戏逻辑
        this.updateGameLogic(deltaTime);
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏结束条件
        this.checkGameEnd();
    }

    // 更新游戏逻辑
    updateGameLogic(deltaTime) {
        switch (this.gameMode) {
            case 'training':
                this.updateTraining(deltaTime);
                break;
            case 'battle':
                this.updateBattle(deltaTime);
                break;
            case 'survival':
                this.updateSurvival(deltaTime);
                break;
        }
    }

    // 更新训练模式
    updateTraining(deltaTime) {
        // 无限血量训练
        if (this.playerTank) {
            this.playerTank.health = this.playerTank.maxHealth;
        }
        
        // 重置AI坦克位置
        this.aiTanks.forEach(aiTank => {
            if (aiTank.isDestroyed) {
                const distance = 20;
                const angle = Math.random() * Math.PI * 2;
                const newPos = {
                    x: Math.cos(angle) * distance,
                    y: 1,
                    z: Math.sin(angle) * distance
                };
                aiTank.reset(newPos);
            }
        });
    }

    // 更新对战模式
    updateBattle(deltaTime) {
        // 检查时间限制
        if (this.gameTime >= this.gameTimeLimit) {
            this.endGame('time_up');
            return;
        }
        
        // 检查胜利条件
        const aliveAITanks = this.aiTanks.filter(tank => !tank.isDestroyed);
        if (aliveAITanks.length === 0) {
            this.endGame('victory');
            return;
        }
        
        if (this.playerTank && this.playerTank.isDestroyed) {
            this.endGame('defeat');
            return;
        }
    }

    // 更新生存模式
    updateSurvival(deltaTime) {
        // 每30秒增加一波敌人
        const waveInterval = 30;
        const currentWave = Math.floor(this.gameTime / waveInterval);
        
        if (currentWave > this.aiTanks.length - 1) {
            this.spawnSurvivalWave(currentWave);
        }
        
        // 检查玩家是否存活
        if (this.playerTank && this.playerTank.isDestroyed) {
            this.endGame('survival_end');
        }
    }

    // 生成生存模式波次
    spawnSurvivalWave(waveNumber) {
        const tankCount = Math.min(waveNumber + 1, 5);
        const difficulty = 1 + waveNumber * 0.5;
        
        for (let i = 0; i < tankCount; i++) {
            const angle = (i / tankCount) * Math.PI * 2;
            const distance = 15 + waveNumber * 5;
            const startPosition = {
                x: Math.cos(angle) * distance,
                y: 1,
                z: Math.sin(angle) * distance
            };
            
            // 创建AI配置
            const aiConfig = new TankConfiguration();
            const engineIndex = Math.min(waveNumber, window.componentManager.getEngines().length - 1);
            const armorIndex = Math.min(waveNumber, window.componentManager.getArmors().length - 1);
            
            aiConfig.setEngine(window.componentManager.getEngines()[engineIndex]);
            aiConfig.addArmor(window.componentManager.getArmors()[armorIndex]);
            
            const aiTank = new AITank(
                window.worldManager.scene,
                window.physicsManager.world,
                startPosition,
                aiConfig,
                difficulty
            );
            
            aiTank.setTarget(this.playerTank);
            this.aiTanks.push(aiTank);
            this.allTanks.push(aiTank);
            
            // 添加到物理世界
            window.physicsManager.addTank(aiTank);
        }
    }

    // 处理坦克销毁
    handleTankDestroyed(tank) {
        if (tank === this.playerTank) {
            this.endGame('player_destroyed');
        } else {
            this.kills++;
            this.score += 100;
            
            // 检查是否所有AI坦克都被摧毁
            const aliveAITanks = this.aiTanks.filter(t => !t.isDestroyed);
            if (aliveAITanks.length === 0 && this.gameMode === 'battle') {
                this.endGame('victory');
            }
        }
    }

    // 更新UI
    updateUI() {
        const gameState = {
            tanks: this.allTanks.map(tank => ({
                position: tank.body.position,
                isPlayer: tank === this.playerTank,
                isDestroyed: tank.isDestroyed
            })),
            playerTank: this.playerTank ? {
                health: this.playerTank.health,
                maxHealth: this.playerTank.maxHealth,
                speed: Math.sqrt(
                    this.playerTank.body.velocity.x ** 2 +
                    this.playerTank.body.velocity.z ** 2
                )
            } : null,
            gameTime: this.gameTime,
            score: this.score,
            kills: this.kills
        };
        
        window.uiManager.updateGameUI(gameState);
    }

    // 检查游戏结束
    checkGameEnd() {
        // 根据不同模式检查结束条件
        switch (this.gameMode) {
            case 'battle':
                return this.checkBattleEnd();
            case 'survival':
                return this.checkSurvivalEnd();
            case 'training':
                return false; // 训练模式永不结束
        }
    }

    // 检查对战模式结束
    checkBattleEnd() {
        if (this.gameTime >= this.gameTimeLimit) {
            this.endGame('time_up');
            return true;
        }
        
        if (this.playerTank && this.playerTank.isDestroyed) {
            this.endGame('defeat');
            return true;
        }
        
        const aliveAITanks = this.aiTanks.filter(tank => !tank.isDestroyed);
        if (aliveAITanks.length === 0) {
            this.endGame('victory');
            return true;
        }
        
        return false;
    }

    // 检查生存模式结束
    checkSurvivalEnd() {
        if (this.playerTank && this.playerTank.isDestroyed) {
            this.endGame('survival_end');
            return true;
        }
        return false;
    }

    // 结束游戏
    endGame(reason) {
        this.isRunning = false;
        
        const finalScore = this.calculateFinalScore();
        const survivalTime = this.gameTime;
        
        console.log(`Game ended: ${reason}`);
        console.log(`Final score: ${finalScore}`);
        console.log(`Survival time: ${survivalTime.toFixed(1)}s`);
        
        // 显示结果
        this.showGameResult(reason, finalScore, survivalTime);
        
        // 保存高分
        this.saveHighScore(reason, finalScore, survivalTime);
    }

    // 计算最终分数
    calculateFinalScore() {
        let score = this.score;
        
        // 根据游戏模式调整分数
        switch (this.gameMode) {
            case 'battle':
                score += this.kills * 100;
                score += Math.max(0, (this.gameTimeLimit - this.gameTime) * 10);
                break;
            case 'survival':
                score += this.gameTime * 10;
                score += this.kills * 50;
                break;
        }
        
        return Math.round(score);
    }

    // 显示游戏结果
    showGameResult(reason, score, time) {
        let message = '';
        
        switch (reason) {
            case 'victory':
                message = `胜利！得分: ${score}`;
                break;
            case 'defeat':
                message = `失败！得分: ${score}`;
                break;
            case 'time_up':
                message = `时间到！得分: ${score}`;
                break;
            case 'survival_end':
                message = `生存时间: ${time.toFixed(1)}秒，得分: ${score}`;
                break;
            case 'player_destroyed':
                message = `坦克被摧毁！得分: ${score}`;
                break;
        }
        
        alert(message);
        
        // 返回主菜单
        setTimeout(() => {
            window.uiManager.showScreen('mainMenu');
        }, 1000);
    }

    // 保存高分
    saveHighScore(reason, score, time) {
        const highScores = Utils.storage.load('highScores') || {};
        
        if (!highScores[this.gameMode]) {
            highScores[this.gameMode] = [];
        }
        
        highScores[this.gameMode].push({
            score,
            time,
            date: new Date().toISOString(),
            reason
        });
        
        // 排序并保留前10名
        highScores[this.gameMode].sort((a, b) => b.score - a.score);
        highScores[this.gameMode] = highScores[this.gameMode].slice(0, 10);
        
        Utils.storage.save('highScores', highScores);
    }

    // 渲染场景
    render() {
        if (window.worldManager) {
            window.worldManager.render();
        }
    }

    // 重置游戏
    reset() {
        this.stop();
        
        // 清理所有坦克
        this.allTanks.forEach(tank => {
            if (tank.body) {
                window.physicsManager.removeTank(tank);
            }
        });
        
        this.allTanks = [];
        this.aiTanks = [];
        this.playerTank = null;
        
        // 重置统计
        this.score = 0;
        this.kills = 0;
        this.gameTime = 0;
    }

    // 停止游戏
    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }

    // 获取游戏状态
    getGameState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameMode: this.gameMode,
            gameTime: this.gameTime,
            score: this.score,
            kills: this.kills,
            playerTank: this.playerTank,
            aiTanks: this.aiTanks,
            allTanks: this.allTanks
        };
    }
}

// 相机控制器
class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = null;
        
        // 相机参数
        this.distance = 15;
        this.height = 8;
        this.rotationX = Math.PI / 6;
        this.rotationY = 0;
        
        // 鼠标控制
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        
        // 平滑参数
        this.smoothing = 0.1;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.domElement.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        this.domElement.addEventListener('mousemove', (e) => {
            if (this.isMouseDown) {
                const deltaX = e.clientX - this.mouseX;
                const deltaY = e.clientY - this.mouseY;
                
                this.rotationY += deltaX * 0.01;
                this.rotationX += deltaY * 0.01;
                
                this.rotationX = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.rotationX));
                
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            }
        });
        
        this.domElement.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        this.domElement.addEventListener('wheel', (e) => {
            this.distance += e.deltaY * 0.01;
            this.distance = Math.max(5, Math.min(50, this.distance));
        });
    }

    setTarget(target) {
        this.target = target;
    }

    update(deltaTime) {
        if (!this.target) return;
        
        const targetPos = this.target.body.position;
        
        // 计算相机位置
        const x = targetPos.x + Math.sin(this.rotationY) * this.distance * Math.cos(this.rotationX);
        const y = targetPos.y + this.height + Math.sin(this.rotationX) * this.distance;
        const z = targetPos.z + Math.cos(this.rotationY) * this.distance * Math.cos(this.rotationX);
        
        // 平滑移动相机
        this.camera.position.x += (x - this.camera.position.x) * this.smoothing;
        this.camera.position.y += (y - this.camera.position.y) * this.smoothing;
        this.camera.position.z += (z - this.camera.position.z) * this.smoothing;
        
        // 相机看向目标
        this.camera.lookAt(targetPos.x, targetPos.y + 2, targetPos.z);
    }

    handleMouseMove(event) {
        // 可以添加更多的鼠标控制逻辑
    }
}

// 创建全局游戏实例
window.game = new Game();