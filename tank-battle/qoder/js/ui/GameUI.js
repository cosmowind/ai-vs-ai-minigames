/**
 * 游戏UI系统类
 * 管理所有用户界面元素和交互
 */
class GameUI {
    constructor() {
        this.elements = new Map();
        this.isVisible = true;
        this.currentTank = null;
        this.tankBuilder = null;
        this.availableComponents = [];
        
        // UI状态
        this.panels = {
            tankConfig: true,
            gameHUD: true,
            controls: true,
            loading: true
        };
        
        this.init();
    }
    
    /**
     * 初始化UI系统
     */
    init() {
        console.log('🎨 初始化UI系统...');
        
        this.setupElements();
        this.setupEventListeners();
        this.initializeComponents();
        this.hideLoading();
        
        console.log('✅ UI系统初始化完成');
    }
    
    /**
     * 设置UI元素引用
     */
    setupElements() {
        this.elements.set('tankConfigPanel', document.getElementById('tankConfigPanel'));
        this.elements.set('availableComponents', document.getElementById('availableComponents'));
        this.elements.set('currentComponents', document.getElementById('currentComponents'));
        this.elements.set('tankStats', document.getElementById('tankStats'));
        this.elements.set('gameHUD', document.getElementById('gameHUD'));
        this.elements.set('controls', document.getElementById('controls'));
        this.elements.set('loadingScreen', document.getElementById('loadingScreen'));
        
        // 统计显示元素
        this.elements.set('totalWeight', document.getElementById('totalWeight'));
        this.elements.set('maxSpeed', document.getElementById('maxSpeed'));
        this.elements.set('totalHealth', document.getElementById('totalHealth'));
        this.elements.set('playerHealth', document.getElementById('playerHealth'));
        this.elements.set('playerSpeed', document.getElementById('playerSpeed'));
        this.elements.set('playerWeight', document.getElementById('playerWeight'));
        this.elements.set('gameStatus', document.getElementById('gameStatus'));
        
        // 按钮元素
        this.elements.set('buildTankBtn', document.getElementById('buildTankBtn'));
        this.elements.set('resetTankBtn', document.getElementById('resetTankBtn'));
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 构建坦克按钮
        const buildBtn = this.elements.get('buildTankBtn');
        if (buildBtn) {
            buildBtn.addEventListener('click', () => {
                this.handleBuildTank();
            });
        }
        
        // 重置配置按钮
        const resetBtn = this.elements.get('resetTankBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.handleResetConfiguration();
            });
        }
        
        // 菜单切换事件
        document.addEventListener('toggleGameMenu', () => {
            this.toggleConfigPanel();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }
    
    /**
     * 初始化可用组件
     */
    initializeComponents() {
        // 创建示例组件库
        this.availableComponents = [];
        
        // 添加引擎组件
        const engineTypes = EngineComponent.getAllEngineTypes();
        const qualities = ['common', 'rare', 'epic'];
        
        engineTypes.forEach(type => {
            qualities.forEach(quality => {
                const engine = new EngineComponent(type, quality);
                this.availableComponents.push(engine);
            });
        });
        
        // 添加装甲组件
        const armorTypes = ArmorComponent.getAllArmorTypes();
        armorTypes.forEach(type => {
            qualities.forEach(quality => {
                const armor = new ArmorComponent(type, quality);
                this.availableComponents.push(armor);
            });
        });
        
        // 创建坦克构建器
        this.tankBuilder = new TankBuilder();
        
        // 更新UI显示
        this.updateAvailableComponentsList();
        this.updateTankConfiguration();
    }
    
    /**
     * 更新可用组件列表
     */
    updateAvailableComponentsList() {
        const container = this.elements.get('availableComponents');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 按类型分组显示组件
        const componentsByType = this.groupComponentsByType();
        
        Object.entries(componentsByType).forEach(([type, components]) => {
            // 创建类型标题
            const typeHeader = document.createElement('div');
            typeHeader.className = 'component-type-header';
            typeHeader.innerHTML = `<h5>${this.getTypeDisplayName(type)}</h5>`;
            container.appendChild(typeHeader);
            
            // 显示该类型的组件
            components.forEach(component => {
                const componentElement = this.createComponentElement(component, false);
                container.appendChild(componentElement);
            });
        });
    }
    
    /**
     * 按类型分组组件
     */
    groupComponentsByType() {
        const groups = {};
        
        this.availableComponents.forEach(component => {
            const type = component.getType();
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(component);
        });
        
        return groups;
    }
    
    /**
     * 获取类型显示名称
     */
    getTypeDisplayName(type) {
        const displayNames = {
            [ComponentTypes.ENGINE]: '🚀 引擎',
            [ComponentTypes.ARMOR]: '🛡️ 装甲',
            [ComponentTypes.CHASSIS]: '⚙️ 底盘',
            [ComponentTypes.WEAPON]: '🔫 武器',
            [ComponentTypes.SPECIAL]: '✨ 特殊'
        };
        
        return displayNames[type] || type;
    }
    
    /**
     * 创建组件UI元素
     */
    createComponentElement(component, isSelected = false) {
        const element = document.createElement('div');
        element.className = `component-item quality-${component.quality}`;
        
        if (isSelected) {
            element.classList.add('selected');
        }
        
        element.innerHTML = `
            <div class="component-info">
                <div class="component-name">${component.name}</div>
                <div class="component-quality">${component.quality}</div>
                <div class="component-weight">${component.weight}kg</div>
            </div>
            <div class="component-stats">
                ${this.formatComponentStats(component)}
            </div>
            <div class="component-actions">
                ${isSelected ? 
                    `<button class="remove-btn" onclick="gameUI.removeComponent('${component.id}')">移除</button>` :
                    `<button class="add-btn" onclick="gameUI.addComponent('${component.id}')">添加</button>`
                }
            </div>
        `;
        
        return element;
    }
    
    /**
     * 格式化组件属性显示
     */
    formatComponentStats(component) {
        const stats = component.modifiedStats;
        let statsHTML = '';
        
        if (component.getType() === ComponentTypes.ENGINE) {
            statsHTML = `
                <div>最大速度: ${stats.maxSpeed}km/h</div>
                <div>加速度: ${stats.acceleration}m/s²</div>
                <div>血量加成: +${stats.healthBonus}HP</div>
            `;
        } else if (component.getType() === ComponentTypes.ARMOR) {
            statsHTML = `
                <div>血量: ${stats.health}HP</div>
                <div>防御: ${stats.defense}</div>
                <div>减免: ${(stats.damageReduction * 100).toFixed(0)}%</div>
            `;
        }
        
        return statsHTML;
    }
    
    /**
     * 添加组件到坦克
     */
    addComponent(componentId) {
        const component = this.availableComponents.find(comp => comp.id === componentId);
        if (!component || !this.tankBuilder) return;
        
        const success = this.tankBuilder.addComponent(component.clone());
        
        if (success) {
            this.updateTankConfiguration();
            this.showMessage(`已添加 ${component.name}`, 'success');
        } else {
            const errors = this.tankBuilder.validationErrors.join(', ');
            this.showMessage(`添加失败: ${errors}`, 'error');
        }
    }
    
    /**
     * 从坦克移除组件
     */
    removeComponent(componentId) {
        if (!this.tankBuilder) return;
        
        try {
            this.tankBuilder.removeComponent(componentId);
            this.updateTankConfiguration();
            this.showMessage('组件已移除', 'success');
        } catch (error) {
            this.showMessage(`移除失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 更新坦克配置显示
     */
    updateTankConfiguration() {
        if (!this.tankBuilder) return;
        
        // 更新已选组件列表
        this.updateSelectedComponentsList();
        
        // 更新坦克统计
        this.updateTankStats();
        
        // 更新构建按钮状态
        this.updateBuildButton();
    }
    
    /**
     * 更新已选组件列表
     */
    updateSelectedComponentsList() {
        const container = this.elements.get('currentComponents');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.tankBuilder.components.length === 0) {
            container.innerHTML = '<div class="no-components">暂无组件</div>';
            return;
        }
        
        this.tankBuilder.components.forEach(component => {
            const componentElement = this.createComponentElement(component, true);
            container.appendChild(componentElement);
        });
    }
    
    /**
     * 更新坦克统计显示
     */
    updateTankStats() {
        const stats = this.tankBuilder.stats;
        
        this.updateElement('totalWeight', `${stats.totalWeight}`);
        this.updateElement('maxSpeed', `${stats.maxSpeed}`);
        this.updateElement('totalHealth', `${stats.totalHealth}`);
        
        // 显示评级
        const statsContainer = this.elements.get('tankStats');
        if (statsContainer) {
            const ratingHTML = `
                <div class="tank-ratings">
                    <div>生存评级: ${stats.survivalRating.toFixed(0)}/100</div>
                    <div>机动评级: ${stats.mobilityRating.toFixed(0)}/100</div>
                    <div>综合评级: ${stats.overallRating.toFixed(0)}/100</div>
                </div>
            `;
            
            // 查找或创建评级显示区域
            let ratingsDiv = statsContainer.querySelector('.tank-ratings');
            if (!ratingsDiv) {
                statsContainer.insertAdjacentHTML('beforeend', ratingHTML);
            } else {
                ratingsDiv.outerHTML = ratingHTML;
            }
        }
    }
    
    /**
     * 更新构建按钮状态
     */
    updateBuildButton() {
        const buildBtn = this.elements.get('buildTankBtn');
        if (!buildBtn) return;
        
        const isValid = this.tankBuilder.isValid;
        buildBtn.disabled = !isValid;
        buildBtn.textContent = isValid ? '🚀 构建坦克' : '❌ 配置无效';
        
        if (!isValid && this.tankBuilder.validationErrors.length > 0) {
            buildBtn.title = this.tankBuilder.validationErrors.join(', ');
        } else {
            buildBtn.title = '';
        }
    }
    
    /**
     * 处理构建坦克
     */
    handleBuildTank() {
        if (!this.tankBuilder || !this.tankBuilder.isValid) {
            this.showMessage('坦克配置无效，无法构建', 'error');
            return;
        }
        
        try {
            const tank = this.tankBuilder.buildTank();
            this.currentTank = tank;
            
            // 设置输入控制
            if (window.inputSystem) {
                window.inputSystem.setControlledTank(tank);
            }
            
            // 隐藏配置面板，显示游戏HUD
            this.toggleConfigPanel();
            this.updateGameHUD();
            
            this.showMessage('坦克构建成功！', 'success');
            
            // 触发游戏开始事件
            const event = new CustomEvent('tankBuilt', { detail: { tank } });
            document.dispatchEvent(event);
            
        } catch (error) {
            this.showMessage(`构建失败: ${error.message}`, 'error');
        }
    }
    
    /**
     * 处理重置配置
     */
    handleResetConfiguration() {
        if (!this.tankBuilder) return;
        
        this.tankBuilder.reset();
        this.updateTankConfiguration();
        this.showMessage('配置已重置', 'info');
    }
    
    /**
     * 更新游戏HUD
     */
    updateGameHUD() {
        if (!this.currentTank) return;
        
        const status = this.currentTank.getStatus();
        
        this.updateElement('playerHealth', `${status.health.current.toFixed(0)}`);
        this.updateElement('playerSpeed', `${(this.currentTank.velocity.length() * 3.6).toFixed(1)}`);
        this.updateElement('playerWeight', `${status.stats.totalWeight}`);
        
        // 更新游戏状态
        let gameStatusText = '战斗中';
        if (status.isDestroyed) {
            gameStatusText = '坦克被摧毁';
        } else if (!status.isActive) {
            gameStatusText = '等待中';
        }
        
        this.updateElement('gameStatus', gameStatusText);
    }
    
    /**
     * 切换配置面板显示
     */
    toggleConfigPanel() {
        const panel = this.elements.get('tankConfigPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            this.panels.tankConfig = panel.style.display !== 'none';
        }
    }
    
    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(event) {
        switch (event.code) {
            case 'F1':
                event.preventDefault();
                this.togglePanel('controls');
                break;
            case 'F2':
                event.preventDefault();
                this.togglePanel('gameHUD');
                break;
            case 'Tab':
                event.preventDefault();
                this.toggleConfigPanel();
                break;
        }
    }
    
    /**
     * 切换面板显示
     */
    togglePanel(panelName) {
        const panelMap = {
            'controls': 'controls',
            'gameHUD': 'gameHUD',
            'tankConfig': 'tankConfigPanel'
        };
        
        const elementName = panelMap[panelName];
        const element = this.elements.get(elementName);
        
        if (element) {
            const isVisible = element.style.display !== 'none';
            element.style.display = isVisible ? 'none' : 'block';
            this.panels[panelName] = !isVisible;
        }
    }
    
    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        // 添加样式
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(messageElement);
        
        // 自动移除
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * 获取消息颜色
     */
    getMessageColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }
    
    /**
     * 更新元素内容
     */
    updateElement(elementName, content) {
        const element = this.elements.get(elementName);
        if (element) {
            element.textContent = content;
        }
    }
    
    /**
     * 隐藏加载界面
     */
    hideLoading() {
        const loadingScreen = this.elements.get('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 2000); // 2秒后隐藏
        }
    }
    
    /**
     * 显示加载界面
     */
    showLoading(text = '加载中...') {
        const loadingScreen = this.elements.get('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
            
            const textElement = loadingScreen.querySelector('p');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }
    
    /**
     * 设置当前坦克
     */
    setCurrentTank(tank) {
        this.currentTank = tank;
    }
    
    /**
     * 更新循环（每帧调用）
     */
    update() {
        if (this.currentTank && this.panels.gameHUD) {
            this.updateGameHUD();
        }
    }
    
    /**
     * 获取UI状态
     */
    getUIState() {
        return {
            panels: { ...this.panels },
            isVisible: this.isVisible,
            hasTank: !!this.currentTank,
            builderValid: this.tankBuilder ? this.tankBuilder.isValid : false
        };
    }
    
    /**
     * 清理UI资源
     */
    dispose() {
        // 移除事件监听器
        const buildBtn = this.elements.get('buildTankBtn');
        if (buildBtn) {
            buildBtn.removeEventListener('click', this.handleBuildTank);
        }
        
        const resetBtn = this.elements.get('resetTankBtn');
        if (resetBtn) {
            resetBtn.removeEventListener('click', this.handleResetConfiguration);
        }
        
        this.elements.clear();
        this.availableComponents = [];
        this.tankBuilder = null;
        this.currentTank = null;
        
        console.log('🧹 UI系统资源清理完成');
    }
}

// 导出到全局
window.GameUI = GameUI;
window.gameUI = null; // 全局实例将在游戏初始化时创建