import './style.css'
import { TestScene } from './components/TestScene.js'

// 3D坦克大战 - 开发测试版本
class TankBattleTest {
    constructor() {
        this.testScene = null;
        this.init();
    }

    init() {
        // 检查浏览器兼容性
        if (!this.checkBrowserSupport()) {
            this.showBrowserWarning();
            return;
        }

        // 检查是否是第一次访问
        if (!localStorage.getItem('tank-battle-tutorial-shown')) {
            this.showTutorial();
        } else {
            // 显示加载提示
            this.showLoadingScreen();

            // 延迟初始化3D场景，确保DOM准备完毕
            setTimeout(() => {
                this.initTestScene();
            }, 100);
        }

        // 添加窗口大小改变监听
        window.addEventListener('resize', () => {
            if (this.testScene) {
                this.testScene.onWindowResize();
            }
        });

        // 添加页面卸载监听
        window.addEventListener('beforeunload', () => {
            if (this.testScene) {
                this.testScene.dispose();
            }
        });
    }

    checkBrowserSupport() {
        // 检查WebGL支持
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch (e) {
            return false;
        }
    }

    showBrowserWarning() {
        document.querySelector('#app').innerHTML = `
            <div style="text-align: center; padding: 50px; color: white;">
                <h1 style="color: #ff4444;">浏览器不支持</h1>
                <p>此游戏需要支持WebGL的现代浏览器。</p>
                <p>请使用Chrome、Firefox或Safari的最新版本。</p>
                <br>
                <button onclick="location.reload()" style="
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">刷新页面</button>
            </div>
        `;
    }

    showTutorial() {
        document.querySelector('#app').innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex; flex-direction: column; align-items: center;
                        justify-content: center; color: white; font-family: Arial;
                        text-align: center; padding: 20px; overflow-y: auto;">
                <div style="max-width: 800px; background: rgba(0,0,0,0.3); padding: 40px;
                           border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🚀</div>
                    <h1 style="font-size: 48px; margin-bottom: 10px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                               -webkit-background-clip: text; -webkit-text-fill-color: transparent;">3D坦克大战</h1>
                    <p style="font-size: 20px; opacity: 0.9; margin-bottom: 40px;">欢迎来到物理驱动的坦克战斗世界！</p>

                    <div style="text-align: left; line-height: 1.8;">
                        <h2 style="color: #4ecdc4; border-bottom: 2px solid #4ecdc4; padding-bottom: 10px;">🎮 游戏介绍</h2>
                        <p style="font-size: 16px; margin: 20px 0;">
                            这是一个基于真实物理规律的3D坦克战斗游戏。你可以通过组装不同的组件来创造独特的坦克，
                            在完全遵循物理规律的环境中进行激烈的碰撞战斗。
                        </p>

                        <h2 style="color: #ffeaa7; border-bottom: 2px solid #ffeaa7; padding-bottom: 10px;">🎯 当前测试版本功能</h2>
                        <ul style="font-size: 16px; margin: 20px 0; padding-left: 20px;">
                            <li><strong>3D场景浏览:</strong> 鼠标拖拽旋转视角，滚轮缩放</li>
                            <li><strong>组件交互:</strong> 点击场景中的组件观察物理效果</li>
                            <li><strong>实时信息:</strong> 悬停查看组件详细信息</li>
                            <li><strong>物理模拟:</strong> 观察真实的物理碰撞和运动</li>
                        </ul>

                        <h2 style="color: #fd79a8; border-bottom: 2px solid #fd79a8; padding-bottom: 10px;">📦 场景说明</h2>
                        <ul style="font-size: 16px; margin: 20px 0; padding-left: 20px;">
                            <li><strong>蓝色立方体:</strong> 基础引擎组件，可以点击触发物理效果</li>
                            <li><strong>绿色地面:</strong> 物理碰撞平台，所有对象都会在这里碰撞</li>
                            <li><strong>右上角面板:</strong> 显示当前悬停组件的信息</li>
                            <li><strong>左下角面板:</strong> 系统信息和操作说明</li>
                        </ul>

                        <h2 style="color: #00b894; border-bottom: 2px solid #00b894; padding-bottom: 10px;">🎮 操作指南</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                                <strong>🖱️ 鼠标操作</strong><br>
                                • 拖拽: 旋转视角<br>
                                • 滚轮: 缩放视角<br>
                                • 悬停: 查看信息<br>
                                • 点击: 触发效果
                            </div>
                            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                                <strong>🎯 交互目标</strong><br>
                                • 熟悉3D操作<br>
                                • 观察物理效果<br>
                                • 了解组件系统<br>
                                • 体验交互反馈
                            </div>
                        </div>

                        <h2 style="color: #e17055; border-bottom: 2px solid #e17055; padding-bottom: 10px;">🚀 即将推出</h2>
                        <ul style="font-size: 16px; margin: 20px 0; padding-left: 20px;">
                            <li>多种坦克组件（车身、武器、辅助系统）</li>
                            <li>组件装配系统</li>
                            <li>完整的战斗机制</li>
                            <li>多人对战模式</li>
                            <li>自定义坦克设计</li>
                        </ul>
                    </div>

                    <div style="margin-top: 40px; text-align: center;">
                        <button onclick="this.startGame()" style="
                            padding: 15px 40px;
                            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                            color: white;
                            border: none;
                            border-radius: 25px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(255,107,107,0.3);
                        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255,107,107,0.4)';"
                          onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255,107,107,0.3)';">
                            🚀 开始体验
                        </button>
                        <p style="font-size: 14px; opacity: 0.7; margin-top: 20px;">
                            提示：下次访问将不再显示此教程
                        </p>
                    </div>
                </div>
            </div>
        `;

        // 绑定开始游戏方法
        const button = document.querySelector('button[onclick="this.startGame()"]');
        if (button) {
            button.onclick = () => this.startGame();
        }
    }

    startGame() {
        // 标记教程已显示
        localStorage.setItem('tank-battle-tutorial-shown', 'true');

        // 显示加载屏幕
        this.showLoadingScreen();

        // 延迟初始化3D场景
        setTimeout(() => {
            this.initTestScene();
        }, 500);
    }

    showLoadingScreen() {
        document.querySelector('#app').innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex; flex-direction: column; align-items: center;
                        justify-content: center; color: white; font-family: Arial;">
                <div style="font-size: 48px; margin-bottom: 20px;">🚀</div>
                <h1 style="font-size: 32px; margin-bottom: 10px;">3D坦克大战</h1>
                <p style="font-size: 18px; opacity: 0.8;">正在加载游戏引擎...</p>
                <div style="margin-top: 30px;">
                    <div style="display: inline-block; width: 20px; height: 20px;
                                background: #4CAF50; border-radius: 50%; margin: 0 5px;
                                animation: bounce 1.4s infinite ease-in-out both;"></div>
                    <div style="display: inline-block; width: 20px; height: 20px;
                                background: #4CAF50; border-radius: 50%; margin: 0 5px;
                                animation: bounce 1.4s infinite ease-in-out both 0.2s;"></div>
                    <div style="display: inline-block; width: 20px; height: 20px;
                                background: #4CAF50; border-radius: 50%; margin: 0 5px;
                                animation: bounce 1.4s infinite ease-in-out both 0.4s;"></div>
                </div>
            </div>
            <style>
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            </style>
        `;
    }

    initTestScene() {
        try {
            console.log('🚀 Initializing 3D test scene...');

            // 导入TestScene模块
            import('./components/TestScene.js').then(module => {
                console.log('✓ TestScene module loaded successfully');

                // 创建TestScene实例
                this.testScene = new module.TestScene();
                console.log('✓ 3D test scene initialized successfully!');

                // 添加调试信息
                this.addDebugInfo();
            }).catch(error => {
                console.error('✗ Failed to load TestScene module:', error);
                this.showErrorScreen(error);
            });

        } catch (error) {
            console.error('✗ Failed to initialize 3D scene:', error);
            this.showErrorScreen(error);
        }
    }

    addDebugInfo() {
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugInfo.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: monospace;
            z-index: 1000;
        `;

        debugInfo.innerHTML = `
            <div><strong>3D坦克大战 - 测试版本</strong></div>
            <div>Three.js: ${this.getLibraryVersion('THREE')}</div>
            <div>Cannon.js: ${this.getLibraryVersion('CANNON')}</div>
            <div>WebGL: ${this.getWebGLInfo()}</div>
            <div>FPS: <span id="fps-counter">0</span></div>
            <br>
            <div><strong>🎮 操作说明:</strong></div>
            <div>• <strong>鼠标拖拽:</strong> 旋转视角</div>
            <div>• <strong>滚轮:</strong> 缩放视角</div>
            <div>• <strong>鼠标悬停:</strong> 查看组件信息</div>
            <div>• <strong>点击组件:</strong> 触发物理效果</div>
            <br>
            <div><strong>📦 场景说明:</strong></div>
            <div>• 蓝色立方体: 基础引擎组件</div>
            <div>• 绿色地面: 物理碰撞平台</div>
            <div>• 右上角: 悬停时显示组件信息</div>
            <br>
            <div><strong>🎯 目标:</strong></div>
            <div>• 熟悉3D交互操作</div>
            <div>• 观察物理效果</div>
            <div>• 了解组件系统</div>
        `;

        document.body.appendChild(debugInfo);

        // 开始FPS计数
        this.startFPSCounter();
    }

    getLibraryVersion(libraryName) {
        try {
            switch (libraryName) {
                case 'THREE':
                    return window.THREE ? window.THREE.REVISION : '未加载';
                case 'CANNON':
                    return window.CANNON ? window.CANNON.version : '未加载';
                default:
                    return '未知';
            }
        } catch (e) {
            return '版本获取失败';
        }
    }

    getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return '不支持';

            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);

            // 清理WebGL信息，去掉重复的厂商名称
            let cleanRenderer = renderer;
            let cleanVendor = vendor;

            if (renderer && renderer.includes('WebKit')) {
                cleanRenderer = renderer.replace(/WebKit\s+/g, '');
            }
            if (vendor && vendor.includes('WebKit')) {
                cleanVendor = vendor.replace(/WebKit\s+/g, '');
            }

            return cleanVendor && cleanRenderer ? `${cleanVendor} - ${cleanRenderer}` : 'WebGL可用';
        } catch (e) {
            return '未知';
        }
    }

    startFPSCounter() {
        let frameCount = 0;
        let lastTime = performance.now();

        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                const fpsElement = document.getElementById('fps-counter');
                if (fpsElement) {
                    fpsElement.textContent = fps;
                }
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(updateFPS);
        };

        updateFPS();
    }

    showErrorScreen(error) {
        document.querySelector('#app').innerHTML = `
            <div style="text-align: center; padding: 50px; color: white;">
                <h1 style="color: #ff4444;">加载失败</h1>
                <p>3D场景初始化时出现错误：</p>
                <p style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; margin: 20px 0;">
                    ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">重新加载</button>
            </div>
        `;
    }
}

// 页面加载完成后启动测试
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting Tank Battle Test...');
    new TankBattleTest();
});
