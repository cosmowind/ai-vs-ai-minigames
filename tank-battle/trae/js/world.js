// 世界管理器
class WorldManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // 光照
        this.ambientLight = null;
        this.directionalLight = null;
        
        // 特效
        this.particleSystem = null;
        
        // 天空盒
        this.skybox = null;
        
        this.debugMode = false;
    }

    // 初始化世界
    async init(canvas) {
        console.log('Initializing world...');
        
        // 确保canvas存在
        this.canvas = canvas || document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
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
        this.camera.position.set(0, 10, 15);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 设置光照
        this.setupLighting();
        
        // 创建地面
        this.createGround();
        
        // 创建天空盒
        this.createSkybox();
        
        // 初始化粒子系统
        this.particleSystem = new ParticleSystem(this.scene);
        
        console.log('World initialized');
        return Promise.resolve();
    }

    // 创建环境
    createEnvironment() {
        // 创建地面
        this.createGround();
        
        // 创建天空盒
        this.createSkybox();
        
        // 创建光照
        this.createLighting();
        
        // 创建粒子系统
        this.createParticleSystem();
    }

    // 创建地面
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: COLORS.GROUND,
            transparent: true,
            opacity: 0.8
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // 添加地面网格
        const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x888888);
        this.scene.add(gridHelper);
        
        // 添加草地细节
        this.createGrassDetails();
    }

    // 创建草地细节
    createGrassDetails() {
        const grassCount = 1000;
        const grassGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const grassMaterial = new THREE.MeshBasicMaterial({
            color: 0x228B22,
            transparent: true,
            opacity: 0.6
        });
        
        const grassGroup = new THREE.Group();
        
        for (let i = 0; i < grassCount; i++) {
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.position.set(
                (Math.random() - 0.5) * 100,
                0.01,
                (Math.random() - 0.5) * 100
            );
            grass.rotation.x = -Math.PI / 2;
            grass.rotation.z = Math.random() * Math.PI;
            grassGroup.add(grass);
        }
        
        this.scene.add(grassGroup);
    }

    // 创建天空盒
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.SKY,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
        });
        
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skybox);
        
        // 添加云朵
        this.createClouds();
    }

    // 创建云朵
    createClouds() {
        const cloudCount = 20;
        const cloudGroup = new THREE.Group();
        
        for (let i = 0; i < cloudCount; i++) {
            const cloudGeometry = new THREE.SphereGeometry(
                2 + Math.random() * 3,
                8,
                6
            );
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 200,
                30 + Math.random() * 20,
                (Math.random() - 0.5) * 200
            );
            
            cloudGroup.add(cloud);
        }
        
        this.scene.add(cloudGroup);
        
        // 添加云朵动画
        this.animateClouds(cloudGroup);
    }

    // 云朵动画
    animateClouds(cloudGroup) {
        const animate = () => {
            cloudGroup.children.forEach(cloud => {
                cloud.position.x += 0.01;
                if (cloud.position.x > 100) {
                    cloud.position.x = -100;
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 创建光照
    createLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光（太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // 设置阴影参数
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // 添加点光源
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 20, 0);
        this.scene.add(pointLight);
        this.lights.push(pointLight);
    }

    // 创建粒子系统
    createParticleSystem() {
        this.particleSystem = new ParticleSystem(this.scene);
    }

    // 创建特效
    createEffect(type, position, options = {}) {
        switch (type) {
            case 'explosion':
                return this.createExplosionEffect(position, options);
            case 'sparks':
                return this.createSparksEffect(position, options);
            case 'smoke':
                return this.createSmokeEffect(position, options);
            default:
                console.warn('Unknown effect type:', type);
                return null;
        }
    }

    // 创建爆炸特效
    createExplosionEffect(position, options = {}) {
        const particleCount = options.count || 30;
        const color = options.color || 0xff6600;
        const size = options.size || 0.2;
        
        const explosion = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(size),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 5,
                (Math.random() - 0.5) * 10
            );
            
            explosion.add(particle);
        }
        
        this.scene.add(explosion);
        
        // 动画
        const animate = () => {
            explosion.children.forEach(particle => {
                particle.position.add(particle.velocity);
                particle.velocity.multiplyScalar(0.95);
                particle.velocity.y -= 0.2;
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(1.02);
            });
            
            if (explosion.children[0].material.opacity <= 0) {
                this.scene.remove(explosion);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        return explosion;
    }

    // 创建火花特效
    createSparksEffect(position, options = {}) {
        const particleCount = options.count || 15;
        const color = options.color || 0xffff00;
        
        const sparks = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.05),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            spark.position.copy(position);
            spark.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            );
            
            sparks.add(spark);
        }
        
        this.scene.add(sparks);
        
        // 动画
        const animate = () => {
            sparks.children.forEach(spark => {
                spark.position.add(spark.velocity);
                spark.velocity.multiplyScalar(0.9);
                spark.material.opacity -= 0.05;
            });
            
            if (sparks.children[0].material.opacity <= 0) {
                this.scene.remove(sparks);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        return sparks;
    }

    // 创建烟雾特效
    createSmokeEffect(position, options = {}) {
        const particleCount = options.count || 10;
        const color = options.color || 0x666666;
        
        const smoke = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.3),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ));
            
            smoke.add(particle);
        }
        
        this.scene.add(smoke);
        
        // 动画
        const animate = () => {
            smoke.children.forEach(particle => {
                particle.position.y += 0.1;
                particle.material.opacity -= 0.01;
                particle.scale.multiplyScalar(1.01);
            });
            
            if (smoke.children[0].material.opacity <= 0) {
                this.scene.remove(smoke);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        return smoke;
    }

    // 设置事件监听器
    setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 监听坦克碰撞事件
        Utils.eventSystem.on('tankCollision', (data) => {
            this.handleTankCollision(data);
        });
    }

    // 处理坦克碰撞
    handleTankCollision(data) {
        const { tankA, tankB, impactVelocity, position } = data;
        
        // 在碰撞位置创建特效
        const collisionPos = new THREE.Vector3(position.x, position.y, position.z);
        
        this.createSparksEffect(collisionPos, {
            count: Math.min(20, impactVelocity * 2),
            color: 0xff4400
        });
    }

    // 处理窗口大小调整
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    // 更新世界
    update(deltaTime) {
        // 更新粒子系统
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // 更新特效
        this.updateEffects(deltaTime);
        
        // 更新性能监控
        this.updatePerformance(deltaTime);
    }

    // 更新特效
    updateEffects(deltaTime) {
        // 更新云朵动画
        // 已经在animateClouds中处理
    }

    // 更新性能监控
    updatePerformance(deltaTime) {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
            
            // 更新FPS显示
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${fps}`;
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    // 渲染场景
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // 清理资源
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            // 清理场景中的所有对象
            while(this.scene.children.length > 0) {
                const object = this.scene.children[0];
                this.scene.remove(object);
                
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        }
    }
}

// 粒子系统类
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 1000;
    }

    addParticle(position, velocity, color, lifetime) {
        if (this.particles.length >= this.maxParticles) {
            // 移除最老的粒子
            const oldParticle = this.particles.shift();
            this.scene.remove(oldParticle.mesh);
        }
        
        const particle = new Particle(position, velocity, color, lifetime);
        this.scene.add(particle.mesh);
        this.particles.push(particle);
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.isDead()) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    dispose() {
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
    }
}

// 粒子类
class Particle {
    constructor(position, velocity, color, lifetime) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.color = color;
        this.lifetime = lifetime;
        this.age = 0;
        
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            })
        );
        
        this.mesh.position.copy(position);
    }

    update(deltaTime) {
        this.age += deltaTime;
        
        // 更新位置
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        
        // 更新透明度
        const alpha = 1 - (this.age / this.lifetime);
        this.mesh.material.opacity = Math.max(0, alpha);
        
        // 更新大小
        const scale = 1 + (this.age / this.lifetime) * 0.5;
        this.mesh.scale.setScalar(scale);
    }

    isDead() {
        return this.age >= this.lifetime;
    }
}

// 创建全局世界管理器
window.worldManager = new WorldManager();