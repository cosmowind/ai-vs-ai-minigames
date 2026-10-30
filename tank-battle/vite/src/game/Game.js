import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameState } from './GameState.js';
import { SceneManager } from './SceneManager.js';
import { PhysicsManager } from '../physics/PhysicsManager.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../ui/UIManager.js';

/**
 * 游戏主控制器
 * 负责游戏的初始化、更新循环和状态管理
 */
export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;

        this.gameState = GameState.MENU;
        this.clock = new THREE.Clock();
        this.deltaTime = 0;

        this.managers = {
            scene: null,
            physics: null,
            input: null,
            ui: null
        };

        // 游戏对象
        this.tanks = [];
        this.components = [];
        this.effects = [];

        // 性能监控
        this.stats = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0
        };
    }

    /**
     * 初始化游戏
     */
    init() {
        console.log('Initializing Tank Battle Game...');

        // 初始化基础的Three.js场景
        this.initThreeJS();

        // 初始化物理世界
        this.initPhysics();

        // 初始化管理器
        this.initManagers();

        // 设置调试界面
        this.initDebugGUI();

        console.log('Game initialized successfully');
    }

    /**
     * 初始化Three.js
     */
    initThreeJS() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // 天蓝色

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 添加到DOM
        const app = document.querySelector('#app');
        app.innerHTML = ''; // 清空默认内容
        app.appendChild(this.renderer.domElement);

        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    /**
     * 初始化物理世界
     */
    initPhysics() {
        // 创建物理世界
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // 设置物理材料
        const groundMaterial = new CANNON.Material({ friction: 0.8, restitution: 0.1 });
        const tankMaterial = new CANNON.Material({ friction: 0.7, restitution: 0.3 });

        // 设置碰撞检测
        this.world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, tankMaterial, {
            friction: 0.8,
            restitution: 0.1
        }));

        // 创建地面
        this.createGround();
    }

    /**
     * 创建地面
     */
    createGround() {
        const groundSize = 100;

        // Three.js地面
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x90EE90,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Cannon.js地面
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, material: new CANNON.Material({ friction: 0.8, restitution: 0.1 }) });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
    }

    /**
     * 初始化管理器
     */
    initManagers() {
        // 场景管理器
        this.managers.scene = new SceneManager(this.scene, this.camera);

        // 物理管理器
        this.managers.physics = new PhysicsManager(this.world);

        // 输入管理器
        this.managers.input = new InputManager();

        // UI管理器
        this.managers.ui = new UIManager();
    }

    /**
     * 初始化调试界面
     */
    initDebugGUI() {
        if (typeof dat !== 'undefined') {
            const gui = new dat.GUI();

            const gameFolder = gui.addFolder('Game Stats');
            gameFolder.add(this.stats, 'fps').listen();
            gameFolder.add(this.stats, 'frameTime').listen();
            gameFolder.add(this.stats, 'updateTime').listen();
            gameFolder.add(this.stats, 'renderTime').listen();

            const physicsFolder = gui.addFolder('Physics');
            physicsFolder.add(this.world.gravity, 'y', -20, 0, 0.1).name('Gravity');

            gameFolder.open();
        }
    }

    /**
     * 开始游戏循环
     */
    start() {
        this.gameState = GameState.PLAYING;
        this.animate();
    }

    /**
     * 游戏主循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const startTime = performance.now();

        // 更新游戏逻辑
        this.update();

        // 渲染场景
        const renderStartTime = performance.now();
        this.renderer.render(this.scene, this.camera);
        this.stats.renderTime = performance.now() - renderStartTime;

        // 计算FPS
        this.stats.frameTime = performance.now() - startTime;
        this.stats.fps = Math.round(1000 / this.stats.frameTime);
    }

    /**
     * 更新游戏逻辑
     */
    update() {
        const updateStartTime = performance.now();

        this.deltaTime = this.clock.getDelta();

        // 更新管理器
        this.managers.input.update();
        this.managers.physics.update(this.deltaTime);

        // 更新游戏对象
        this.updateTanks();
        this.updateEffects();

        // 更新UI
        this.managers.ui.update();

        this.stats.updateTime = performance.now() - updateStartTime;
    }

    /**
     * 更新坦克
     */
    updateTanks() {
        this.tanks.forEach(tank => {
            tank.update(this.deltaTime);
        });
    }

    /**
     * 更新特效
     */
    updateEffects() {
        // 移除完成的特效
        this.effects = this.effects.filter(effect => {
            effect.update(this.deltaTime);
            return !effect.isFinished();
        });
    }

    /**
     * 窗口大小改变处理
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清理Three.js资源
        this.renderer.dispose();
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // 清理管理器
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.dispose === 'function') {
                manager.dispose();
            }
        });

        // 清理游戏对象
        this.tanks.forEach(tank => tank.dispose());
        this.effects.forEach(effect => effect.dispose());
    }
}


