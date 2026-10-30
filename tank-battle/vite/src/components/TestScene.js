import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three-stdlib';
import { BasicEngine } from './EngineComponent.js';

// 将库挂载到window对象，便于调试面板显示版本信息
window.THREE = THREE;
window.CANNON = CANNON;

/**
 * 测试场景
 * 用于验证基础的3D渲染和物理功能
 */
export class TestScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.controls = null;

        this.components = [];
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    /**
     * 初始化场景
     */
    init() {
        console.log('🔧 TestScene init() called');

        try {
            this.initRenderer();
            console.log('✓ Renderer initialized');
        } catch (error) {
            console.error('✗ Renderer init failed:', error);
            throw error;
        }

        try {
            this.initCamera();
            console.log('✓ Camera initialized');
        } catch (error) {
            console.error('✗ Camera init failed:', error);
            throw error;
        }

        try {
            this.initControls();
            console.log('✓ Controls initialized');
        } catch (error) {
            console.error('✗ Controls init failed:', error);
            throw error;
        }

        try {
            this.initLights();
            console.log('✓ Lights initialized');
        } catch (error) {
            console.error('✗ Lights init failed:', error);
            throw error;
        }

        try {
            this.initPhysics();
            console.log('✓ Physics world initialized');
        } catch (error) {
            console.error('✗ Physics init failed:', error);
            throw error;
        }

        try {
            this.createGround();
            console.log('✓ Ground created');
        } catch (error) {
            console.error('✗ Ground creation failed:', error);
            throw error;
        }

        try {
            this.addTestComponents();
            console.log('✓ Test components added');
        } catch (error) {
            console.error('✗ Adding test components failed:', error);
            throw error;
        }

        try {
            this.startRenderLoop();
            console.log('✓ Render loop started');
        } catch (error) {
            console.error('✗ Render loop start failed:', error);
            throw error;
        }

        console.log('🎉 TestScene initialization completed successfully!');
    }

    /**
     * 初始化渲染器
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 添加到页面
        const app = document.querySelector('#app');
        app.innerHTML = ''; // 清空内容
        app.appendChild(this.renderer.domElement);
    }

    /**
     * 初始化相机
     */
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 初始化控制器
     */
    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;

        // 添加鼠标点击事件
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        // 添加鼠标移动事件显示悬停信息
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
    }

    /**
     * 初始化光照
     */
    initLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    /**
     * 初始化物理世界
     */
    initPhysics() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
    }

    /**
     * 创建地面
     */
    createGround() {
        const groundSize = 20;

        // Three.js 地面
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

        // Cannon.js 地面
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            material: new CANNON.Material({ friction: 0.8, restitution: 0.1 })
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
    }

    /**
     * 添加测试组件
     */
    addTestComponents() {
        console.log('🔧 addTestComponents() called');

        try {
            console.log('Testing BasicEngine...');
            const basicEngine = new BasicEngine();
            console.log('✓ BasicEngine created successfully:', basicEngine.name);

            basicEngine.mesh.position.set(0, 2, 0);
            basicEngine.body.position.set(0, 2, 0);

            // 标记为可交互
            basicEngine.mesh.userData.isInteractive = true;
            basicEngine.mesh.userData.component = basicEngine;

            this.scene.add(basicEngine.mesh);
            this.world.addBody(basicEngine.body);
            basicEngine.start();
            this.components.push(basicEngine);
            console.log(`✓ Added ${basicEngine.name} at position (0, 2, 0) - Interactive: ${basicEngine.mesh.userData.isInteractive}`);

        } catch (error) {
            console.error('✗ BasicEngine creation failed:', error);
            this.createFallbackObjects();
            return;
        }

        console.log('🎉 addTestComponents() completed');
    }

    /**
     * 创建备用对象（如果引擎类无法加载）
     */
    createFallbackObjects() {
        console.log('Creating fallback objects...');

        // 创建简单的立方体
        for (let i = 0; i < 4; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshLambertMaterial({
                color: 0x4444ff,
                transparent: true,
                opacity: 0.8
            });

            const mesh = new THREE.Mesh(geometry, material);
            const x = (i - 1.5) * 4;
            mesh.position.set(x, 2, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // 标记为可交互
            mesh.userData.isInteractive = true;
            mesh.userData.component = {
                name: `备用对象 ${i + 1}`,
                type: 'fallback',
                weight: 5,
                isAttached: false,
                getInfo() {
                    return {
                        name: `备用对象 ${i + 1}`,
                        type: 'fallback',
                        weight: 5,
                        isAttached: false
                    };
                }
            };

            // 创建物理体
            const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const body = new CANNON.Body({ mass: 5 });
            body.addShape(shape);
            body.position.set(x, 2, 0);

            // 将mesh引用添加到body中，用于同步
            body.mesh = mesh;

            this.scene.add(mesh);
            this.world.addBody(body);

            console.log(`✓ Created interactive fallback object at (${x}, 2, 0)`);
        }
    }

    /**
     * 添加测试基本几何体
     */
    addTestPrimitives() {
        const primitives = [
            { type: 'sphere', position: [-6, 3, 0], color: 0xff4444 },
            { type: 'cylinder', position: [6, 3, 0], color: 0x44ff44 },
            { type: 'torus', position: [0, 8, 0], color: 0x4444ff }
        ];

        primitives.forEach(primitive => {
            let mesh, body;

            switch (primitive.type) {
                case 'sphere':
                    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
                    const sphereMaterial = new THREE.MeshLambertMaterial({ color: primitive.color });
                    mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

                    const sphereShape = new CANNON.Sphere(1);
                    body = new CANNON.Body({ mass: 5 });
                    body.addShape(sphereShape);
                    break;

                case 'cylinder':
                    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
                    const cylinderMaterial = new THREE.MeshLambertMaterial({ color: primitive.color });
                    mesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

                    const cylinderShape = new CANNON.Cylinder(1, 1, 2, 16);
                    body = new CANNON.Body({ mass: 5 });
                    body.addShape(cylinderShape);
                    break;

                case 'torus':
                    const torusGeometry = new THREE.TorusGeometry(1, 0.4, 8, 16);
                    const torusMaterial = new THREE.MeshLambertMaterial({ color: primitive.color });
                    mesh = new THREE.Mesh(torusGeometry, torusMaterial);

                    // 环形用多个球体近似
                    body = new CANNON.Body({ mass: 3 });
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const x = Math.cos(angle) * 1;
                        const z = Math.sin(angle) * 1;
                        const sphere = new CANNON.Sphere(0.4);
                        body.addShape(sphere, new CANNON.Vec3(x, 0, z));
                    }
                    break;
            }

            mesh.position.set(...primitive.position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            body.position.set(...primitive.position);

            this.scene.add(mesh);
            this.world.addBody(body);
        });
    }

    /**
     * 开始渲染循环
     */
    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.update();
            this.render();
        };
        animate();
    }

    /**
     * 更新逻辑
     */
    update() {
        const deltaTime = 1 / 60; // 固定时间步长

        // 更新控制器
        if (this.controls) {
            this.controls.update();
        }

        // 更新物理世界
        this.world.step(deltaTime);

        // 更新组件
        this.components.forEach(component => {
            component.update(deltaTime);
        });

        // 同步物理对象到渲染对象
        this.syncPhysicsToGraphics();
    }

    /**
     * 同步物理对象到图形对象
     */
    syncPhysicsToGraphics() {
        // 同步所有刚体
        this.world.bodies.forEach(body => {
            if (body.mesh) {
                body.mesh.position.copy(body.position);
                body.mesh.quaternion.copy(body.quaternion);
            }
        });
    }

    /**
     * 渲染场景
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 处理窗口大小改变
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 处理鼠标点击事件
     */
    onMouseClick(event) {
        // 计算鼠标位置
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 发射射线
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检测与物体的交集
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.handleObjectClick(clickedObject);
        }
    }

    /**
     * 处理鼠标移动事件
     */
    onMouseMove(event) {
        // 计算鼠标位置
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 发射射线
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检测与物体的交集
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // 重置所有物体的悬停状态
        this.scene.traverse((object) => {
            if (object.material && object.userData.isInteractive) {
                object.material.emissive.setHex(object.userData.originalEmissive || 0x000000);
            }
        });

        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            if (hoveredObject.userData.isInteractive) {
                // 高亮悬停的物体
                if (!hoveredObject.userData.originalEmissive) {
                    hoveredObject.userData.originalEmissive = hoveredObject.material.emissive.getHex();
                }
                hoveredObject.material.emissive.setHex(0x444444);
                this.showObjectInfo(hoveredObject);
            }
        } else {
            this.hideObjectInfo();
        }
    }

    /**
     * 处理物体点击
     */
    handleObjectClick(clickedObject) {
        if (clickedObject.userData.component) {
            const component = clickedObject.userData.component;
            console.log(`点击了组件: ${component.name}`, component.getInfo());

            // 应用物理力来模拟点击效果
            if (component.body) {
                const force = new CANNON.Vec3(
                    (Math.random() - 0.5) * 100,
                    50 + Math.random() * 50,
                    (Math.random() - 0.5) * 100
                );
                component.body.applyImpulse(force, new CANNON.Vec3(0, 0, 0));
            }

            // 显示组件信息
            this.showComponentInfo(component);
        }
    }

    /**
     * 显示物体信息
     */
    showObjectInfo(object) {
        let infoElement = document.getElementById('object-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'object-info';
            infoElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                font-family: monospace;
                z-index: 1001;
                max-width: 200px;
            `;
            document.body.appendChild(infoElement);
        }

        if (object.userData.component) {
            const component = object.userData.component;
            const info = component.getInfo();
            infoElement.innerHTML = `
                <div><strong>${info.name}</strong></div>
                <div>类型: ${info.type}</div>
                <div>重量: ${info.weight}kg</div>
                <div>状态: ${info.isAttached ? '已装配' : '未装配'}</div>
            `;
        }
    }

    /**
     * 隐藏物体信息
     */
    hideObjectInfo() {
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            infoElement.remove();
        }
    }

    /**
     * 显示组件详细信息
     */
    showComponentInfo(component) {
        const info = component.getInfo();
        console.log('组件详细信息:', info);

        // 可以在这里添加一个模态框或详细信息面板
        // 暂时只在控制台显示
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // 清理控制器
        if (this.controls) {
            this.controls.dispose();
        }

        // 清理事件监听器
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
            this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
        }

        // 清理组件
        this.components.forEach(component => {
            component.dispose();
        });

        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
        }

        // 清理几何体和材质
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

        // 清理信息面板
        this.hideObjectInfo();
        const componentInfo = document.getElementById('component-detail-info');
        if (componentInfo) {
            componentInfo.remove();
        }
    }
}
