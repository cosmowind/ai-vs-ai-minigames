/**
 * 游戏引擎核心类
 * 负责Three.js场景、相机、渲染器和光照系统的初始化
 */
class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // 光照系统
        this.ambientLight = null;
        this.directionalLight = null;
        
        // 渲染参数
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * 初始化Three.js引擎
     */
    init() {
        console.log('🎮 初始化3D游戏引擎...');
        
        this.setupCanvas();
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ 3D游戏引擎初始化完成');
    }
    
    /**
     * 设置画布
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('找不到游戏画布元素');
        }
    }
    
    /**
     * 设置3D场景
     */
    setupScene() {
        this.scene = new THREE.Scene();
        
        // 设置背景颜色（白天天空色）
        this.scene.background = new THREE.Color(0x87CEEB); // 天蓝色
        
        // 添加雾效果增强距离感
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        console.log('🌍 3D场景创建完成');
    }
    
    /**
     * 设置相机
     */
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        
        // 设置初始相机位置（第三人称视角）
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        
        console.log('📷 相机设置完成');
    }
    
    /**
     * 设置渲染器
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // 启用阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 设置渲染参数
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        
        console.log('🎨 渲染器设置完成');
    }
    
    /**
     * 设置光照系统
     */
    setupLighting() {
        // 环境光（提供基础照明）
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // 方向光（模拟太阳光）
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 50, 30);
        this.directionalLight.castShadow = true;
        
        // 设置阴影属性
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -50;
        this.directionalLight.shadow.camera.right = 50;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(this.directionalLight);
        
        // 添加辅助光源以减少阴影过暗
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-30, 30, -30);
        this.scene.add(fillLight);
        
        console.log('💡 光照系统设置完成');
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 窗口大小变化处理
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        console.log('🎯 事件监听器设置完成');
    }
    
    /**
     * 窗口大小变化处理
     */
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * 更新相机位置（跟随坦克）
     */
    updateCamera(targetPosition, cameraOffset = { x: 0, y: 15, z: 20 }) {
        if (!this.camera) return;
        
        const targetPos = new THREE.Vector3(
            targetPosition.x + cameraOffset.x,
            targetPosition.y + cameraOffset.y,
            targetPosition.z + cameraOffset.z
        );
        
        // 平滑相机移动
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(targetPosition);
    }
    
    /**
     * 渲染场景
     */
    render() {
        if (!this.isInitialized) return;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 添加对象到场景
     */
    addToScene(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }
    
    /**
     * 从场景移除对象
     */
    removeFromScene(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }
    
    /**
     * 获取场景尺寸信息
     */
    getCanvasSize() {
        return {
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight
        };
    }
    
    /**
     * 清理资源
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 清理场景中的所有对象
        if (this.scene) {
            while(this.scene.children.length > 0) {
                const child = this.scene.children[0];
                this.scene.remove(child);
                
                // 清理几何体和材质
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        }
        
        console.log('🧹 游戏引擎资源清理完成');
    }
}

// 全局游戏引擎实例
window.gameEngine = null;