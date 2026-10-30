// UI管理器
class UIManager {
    constructor() {
        this.screens = {};
        this.currentScreen = 'mainMenu';
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing UIManager...');
        
        // 等待DOM完全加载
        await this.waitForDOM();
        
        this.setupScreens();
        
        // 初始化UI事件
        this.initializeEvents();
        
        // 初始化组件选择
        this.initializeComponentSelection();
        
        return Promise.resolve();
    }

    async waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    setupScreens() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            tankBuilder: document.getElementById('tank-workshop'),
            gameScreen: document.getElementById('game-screen'),
            settings: document.getElementById('settings-screen'),
            help: document.getElementById('help-screen')
        };
    }

    // 初始化事件监听
    initializeEvents() {
        // 主菜单按钮
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('tank-workshop-btn').addEventListener('click', () => {
            this.showScreen('tankWorkshop');
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showScreen('settingsScreen');
        });
        
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showScreen('helpScreen');
        });
        
        // 返回按钮
        document.querySelectorAll('[id$="-back-btn"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('mainMenu');
            });
        });
        
        // 保存坦克配置
        document.getElementById('save-tank-btn').addEventListener('click', () => {
            this.saveTankConfiguration();
        });
        
        // 设置界面
        this.initializeSettings();
        
        // 键盘事件
        this.setupKeyboardControls();
    }

    // 显示指定屏幕
    showScreen(screenName) {
        // 隐藏所有屏幕
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        // 显示目标屏幕
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
        
        // 特殊处理
        if (screenName === 'tankWorkshop') {
            this.updateTankPreview();
        }
    }

    // 开始游戏
    startGame() {
        this.showLoading(true);
        
        // 延迟开始游戏，显示加载效果
        setTimeout(() => {
            if (window.game) {
                window.game.start();
            }
            this.showLoading(false);
            this.showScreen('gameScreen');
        }, 1000);
    }

    // 显示/隐藏加载界面
    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = show ? 'flex' : 'none';
            this.isLoading = show;
        }
    }

    // 更新加载进度
    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    // 初始化组件选择
    initializeComponentSelection() {
        this.selectedEngine = null;
        this.selectedArmors = [];
        this.currentConfig = new TankConfiguration();
        
        // 加载保存的配置
        const savedConfig = window.componentManager.loadConfiguration();
        if (savedConfig) {
            this.currentConfig.setEngine(savedConfig.engine);
            if (savedConfig.armor) {
                this.currentConfig.addArmor(savedConfig.armor);
            }
        }
        
        this.updateComponentDisplay();
    }

    // 更新组件显示
    updateComponentDisplay() {
        this.updateEngineDisplay();
        this.updateArmorDisplay();
        this.updateStatsDisplay();
    }

    // 更新引擎显示
    updateEngineDisplay() {
        const engineContainer = document.getElementById('engine-components');
        if (!engineContainer) return;
        
        engineContainer.innerHTML = '';
        
        const engines = window.componentManager.getEngines();
        engines.forEach(engine => {
            const engineDiv = this.createComponentElement(engine, 'engine');
            if (engine.id === this.currentConfig.engine?.id) {
                engineDiv.classList.add('selected');
            }
            engineContainer.appendChild(engineDiv);
        });
    }

    // 更新装甲显示
    updateArmorDisplay() {
        const armorContainer = document.getElementById('armor-components');
        if (!armorContainer) return;
        
        armorContainer.innerHTML = '';
        
        const armors = window.componentManager.getArmors();
        armors.forEach(armor => {
            const armorDiv = this.createComponentElement(armor, 'armor');
            const isSelected = this.currentConfig.armors.some(a => a.id === armor.id);
            if (isSelected) {
                armorDiv.classList.add('selected');
            }
            armorContainer.appendChild(armorDiv);
        });
    }

    // 创建组件元素
    createComponentElement(component, type) {
        const div = document.createElement('div');
        div.className = `component-item ${this.getQualityClass(component.quality)}`;
        div.dataset.componentId = component.id;
        div.dataset.componentType = type;
        
        div.innerHTML = `
            <div class="component-name">${component.name}</div>
            <div class="component-quality">${Utils.getQualityName(component.quality)}</div>
            <div class="component-stats">
                ${type === 'engine' ? 
                    `速度: ${Utils.formatNumber(component.getMaxSpeed())}<br>
                     重量: ${Utils.formatNumber(component.weight)}` :
                    `防御: ${Utils.formatNumber(component.getEffectiveDefense())}<br>
                     重量: ${Utils.formatNumber(component.weight)}`
                }
            </div>
        `;
        
        div.addEventListener('click', () => {
            this.selectComponent(component, type);
        });
        
        return div;
    }

    // 选择组件
    selectComponent(component, type) {
        if (type === 'engine') {
            this.currentConfig.setEngine(component);
            this.selectedEngine = component;
        } else if (type === 'armor') {
            // 切换装甲选择状态
            const existingIndex = this.currentConfig.armors.findIndex(a => a.id === component.id);
            if (existingIndex >= 0) {
                this.currentConfig.removeArmor(existingIndex);
            } else if (this.currentConfig.armors.length < 4) {
                this.currentConfig.addArmor(component);
            }
        }
        
        this.updateComponentDisplay();
    }

    // 更新统计信息显示
    updateStatsDisplay() {
        const stats = this.currentConfig.getEffectiveStats();
        
        document.getElementById('speed-stat').textContent = Utils.formatNumber(stats.maxSpeed);
        document.getElementById('health-stat').textContent = Utils.formatNumber(stats.health);
        document.getElementById('weight-stat').textContent = Utils.formatNumber(stats.weight);
    }

    // 保存坦克配置
    saveTankConfiguration() {
        if (!this.currentConfig.engine) {
            alert('请至少选择一个引擎！');
            return;
        }
        
        const config = {
            engine: this.currentConfig.engine,
            armors: this.currentConfig.armors
        };
        
        window.componentManager.saveConfiguration(config);
        alert('坦克配置已保存！');
    }

    // 更新坦克预览
    updateTankPreview() {
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) return;
        
        // 创建预览场景
        this.createTankPreview(canvas);
    }

    // 创建坦克预览
    createTankPreview(canvas) {
        const previewScene = new THREE.Scene();
        const previewCamera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        const previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        
        previewRenderer.setSize(canvas.width, canvas.height);
        
        // 添加光照
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        previewScene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        previewScene.add(ambientLight);
        
        // 创建预览坦克
        const previewTank = this.createPreviewTank();
        previewScene.add(previewTank);
        
        previewCamera.position.set(5, 3, 5);
        previewCamera.lookAt(0, 0, 0);
        
        // 旋转动画
        const animate = () => {
            if (this.currentScreen !== 'tankWorkshop') return;
            
            previewTank.rotation.y += 0.01;
            previewRenderer.render(previewScene, previewCamera);
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 创建预览坦克
    createPreviewTank() {
        const group = new THREE.Group();
        
        // 坦克主体
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: COLORS.TANK_BODY });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        group.add(body);
        
        // 引擎
        if (this.currentConfig.engine) {
            const engine = this.currentConfig.engine;
            const engineGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
            const engineMaterial = new THREE.MeshLambertMaterial({ 
                color: engine.color,
                emissive: engine.color,
                emissiveIntensity: 0.2
            });
            const engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
            engineMesh.position.set(-1.2, 0.5, -1);
            engineMesh.rotation.x = Math.PI / 2;
            group.add(engineMesh);
        }
        
        // 装甲
        const armorPositions = [
            { x: 1.2, y: 0.5, z: 0 },
            { x: -1.2, y: 0.5, z: 0 },
            { x: 0, y: 0.5, z: 1.5 },
            { x: 0, y: 0.5, z: -1.5 }
        ];
        
        this.currentConfig.armors.forEach((armor, index) => {
            if (index < armorPositions.length) {
                const armorGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
                const armorMaterial = new THREE.MeshLambertMaterial({ color: armor.color });
                const armorMesh = new THREE.Mesh(armorGeometry, armorMaterial);
                armorMesh.position.set(
                    armorPositions[index].x,
                    armorPositions[index].y,
                    armorPositions[index].z
                );
                group.add(armorMesh);
            }
        });
        
        return group;
    }

    // 初始化设置
    initializeSettings() {
        // 加载保存的设置
        const settings = Utils.storage.load('gameSettings') || {};
        
        // 音效音量
        const soundVolume = document.getElementById('sound-volume');
        if (soundVolume) {
            soundVolume.value = settings.soundVolume * 100 || 50;
            soundVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                GAME_CONFIG.settings.soundVolume = volume;
                Utils.soundManager.setVolume(volume);
                Utils.storage.save('gameSettings', GAME_CONFIG.settings);
            });
        }
        
        // 画质设置
        const qualitySetting = document.getElementById('quality-setting');
        if (qualitySetting) {
            qualitySetting.value = settings.graphicsQuality || 'medium';
            qualitySetting.addEventListener('change', (e) => {
                GAME_CONFIG.settings.graphicsQuality = e.target.value;
                this.updateGraphicsQuality(e.target.value);
                Utils.storage.save('gameSettings', GAME_CONFIG.settings);
            });
        }
        
        // 鼠标灵敏度
        const mouseSensitivity = document.getElementById('mouse-sensitivity');
        if (mouseSensitivity) {
            mouseSensitivity.value = settings.mouseSensitivity || 5;
            mouseSensitivity.addEventListener('input', (e) => {
                GAME_CONFIG.settings.mouseSensitivity = parseInt(e.target.value);
                Utils.storage.save('gameSettings', GAME_CONFIG.settings);
            });
        }
    }

    // 更新画质设置
    updateGraphicsQuality(quality) {
        switch (quality) {
            case 'low':
                GAME_CONFIG.render.shadows = false;
                GAME_CONFIG.render.antialias = false;
                break;
            case 'medium':
                GAME_CONFIG.render.shadows = true;
                GAME_CONFIG.render.antialias = true;
                break;
            case 'high':
                GAME_CONFIG.render.shadows = true;
                GAME_CONFIG.render.antialias = true;
                break;
        }
        
        // 应用到渲染器
        if (window.worldManager && window.worldManager.renderer) {
            window.worldManager.renderer.shadowMap.enabled = GAME_CONFIG.render.shadows;
        }
    }

    // 设置键盘控制
    setupKeyboardControls() {
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            this.handleKeyDown(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            this.handleKeyUp(e.code);
        });
        
        // 将键盘状态传递给游戏
        if (window.game) {
            window.game.keys = keys;
        }
    }

    // 键盘按下处理
    handleKeyDown(code) {
        switch (code) {
            case 'Escape':
                if (this.currentScreen === 'gameScreen') {
                    this.showScreen('mainMenu');
                }
                break;
            case 'KeyP':
                if (this.currentScreen === 'gameScreen' && window.game) {
                    window.game.togglePause();
                }
                break;
        }
    }

    // 键盘释放处理
    handleKeyUp(code) {
        // 可以添加键盘释放的特殊处理
    }

    // 获取品质CSS类名
    getQualityClass(quality) {
        switch (quality) {
            case QUALITY.COMMON: return 'common';
            case QUALITY.UNCOMMON: return 'uncommon';
            case QUALITY.RARE: return 'rare';
            case QUALITY.EPIC: return 'epic';
            case QUALITY.LEGENDARY: return 'legendary';
            default: return 'common';
        }
    }

    // 更新游戏UI
    updateGameUI(gameState) {
        if (!gameState || this.currentScreen !== 'gameScreen') return;
        
        // 更新血量条
        const healthBar = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        
        if (healthBar && healthText && gameState.playerTank) {
            const health = gameState.playerTank.health;
            const maxHealth = gameState.playerTank.maxHealth;
            const percentage = (health / maxHealth) * 100;
            
            healthBar.style.width = `${percentage}%`;
            healthText.textContent = `${Math.round(health)}/${Math.round(maxHealth)}`;
        }
        
        // 更新速度显示
        const speedValue = document.getElementById('speed-value');
        if (speedValue && gameState.playerTank) {
            speedValue.textContent = Utils.formatNumber(gameState.playerTank.speed);
        }
        
        // 更新小地图
        this.updateMinimap(gameState);
    }

    // 更新小地图
    updateMinimap(gameState) {
        const minimapCanvas = document.getElementById('minimap-canvas');
        if (!minimapCanvas || !gameState.tanks) return;
        
        const ctx = minimapCanvas.getContext('2d');
        const width = minimapCanvas.width;
        const height = minimapCanvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制边界
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(0, 0, width, height);
        
        // 世界坐标到画布坐标的转换
        const worldSize = 100;
        const scale = width / worldSize;
        
        // 绘制坦克
        gameState.tanks.forEach(tank => {
            const x = (tank.position.x + worldSize/2) * scale;
            const z = (tank.position.z + worldSize/2) * scale;
            
            ctx.fillStyle = tank.isPlayer ? '#00ff00' : '#ff0000';
            ctx.beginPath();
            ctx.arc(x, z, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// 创建全局UI管理器
window.uiManager = new UIManager();