// 简化版游戏 - 用于测试和演示
class SimpleGame {
    constructor() {
        this.isRunning = false;
        this.gameMode = 'training';
    }

    async init() {
        console.log('Initializing simple game...');
        
        // 显示主菜单
        this.showMainMenu();
        
        // 设置按钮事件
        this.setupButtons();
        
        console.log('Simple game initialized');
    }

    showMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.display = 'block';
        }
    }

    setupButtons() {
        // 开始游戏按钮
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame('training');
            });
        }

        // 坦克工坊按钮
        const workshopBtn = document.getElementById('tank-workshop-btn');
        if (workshopBtn) {
            workshopBtn.addEventListener('click', () => {
                this.showTankWorkshop();
            });
        }

        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // 帮助按钮
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        this.isRunning = true;
        
        // 隐藏所有界面，显示游戏界面
        this.hideAllScreens();
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'block';
        }
        
        // 显示简单的游戏信息
        this.showGameInfo();
    }

    showTankWorkshop() {
        this.hideAllScreens();
        const workshop = document.getElementById('tank-workshop');
        if (workshop) {
            workshop.style.display = 'block';
        }
    }

    showSettings() {
        this.hideAllScreens();
        const settings = document.getElementById('settings-screen');
        if (settings) {
            settings.style.display = 'block';
        }
    }

    showHelp() {
        this.hideAllScreens();
        const help = document.getElementById('help-screen');
        if (help) {
            help.style.display = 'block';
        }
    }

    hideAllScreens() {
        const screens = ['main-menu', 'tank-workshop', 'game-screen', 'settings-screen', 'help-screen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.style.display = 'none';
            }
        });
    }

    showGameInfo() {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 800;
                canvas.height = 600;
                
                // 绘制简单的游戏场景
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#90EE90';
                ctx.fillRect(0, 500, canvas.width, 100);
                
                // 绘制坦克
                ctx.fillStyle = '#006400';
                ctx.fillRect(350, 450, 100, 50);
                ctx.fillRect(370, 430, 60, 20);
                
                // 绘制文字
                ctx.fillStyle = '#000';
                ctx.font = '24px Arial';
                ctx.fillText('方块坦克竞技场 - 演示模式', 250, 50);
                ctx.font = '16px Arial';
                ctx.fillText('游戏模式: ' + this.gameMode, 50, 100);
                ctx.fillText('使用 WASD 键控制坦克', 50, 130);
                
                // 绘制UI
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(10, 10, 200, 80);
                ctx.fillStyle = '#fff';
                ctx.font = '14px Arial';
                ctx.fillText('血量: 100/100', 20, 30);
                ctx.fillText('速度: 0 km/h', 20, 50);
                ctx.fillText('分数: 0', 20, 70);
            }
        }
    }

    // 返回主菜单
    backToMainMenu() {
        this.isRunning = false;
        this.hideAllScreens();
        this.showMainMenu();
    }
}

// 启动简化版游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting simple game...');
    
    // 创建简化版游戏实例
    window.simpleGame = new SimpleGame();
    window.simpleGame.init();
    
    // 设置返回按钮
    const backButtons = [
        'back-to-menu-btn',
        'settings-back-btn',
        'help-back-btn',
        'save-tank-btn'
    ];
    
    backButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                window.simpleGame.backToMainMenu();
            });
        }
    });
});