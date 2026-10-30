/**
 * 物理系统类
 * 负责Cannon.js物理引擎的初始化和管理
 */
class PhysicsSystem {
    constructor() {
        this.world = null;
        this.physicsBodies = new Map(); // 存储物理刚体
        this.meshBodyMap = new Map(); // 网格到刚体的映射
        
        // 物理时间步长
        this.timeStep = 1 / 60;
        this.maxSubSteps = 3;
        
        this.init();
    }
    
    /**
     * 初始化物理世界
     */
    init() {
        console.log('⚡ 初始化物理引擎...');
        
        // 创建物理世界
        this.world = new CANNON.World();
        
        // 设置重力
        this.world.gravity.set(0, -9.82, 0);
        
        // 设置物理材质
        this.setupMaterials();
        
        // 设置碰撞检测
        this.setupCollisionDetection();
        
        // 创建地面
        this.createGround();
        
        console.log('✅ 物理引擎初始化完成');
    }
    
    /**
     * 设置物理材质
     */
    setupMaterials() {
        // 地面材质
        this.groundMaterial = new CANNON.Material('ground');
        
        // 坦克材质
        this.tankMaterial = new CANNON.Material('tank');
        
        // 墙体材质
        this.wallMaterial = new CANNON.Material('wall');
        
        // 设置材质间的摩擦和弹性
        const tankGroundContact = new CANNON.ContactMaterial(
            this.tankMaterial,
            this.groundMaterial,
            {
                friction: 0.8,
                restitution: 0.1
            }
        );
        
        const tankTankContact = new CANNON.ContactMaterial(
            this.tankMaterial,
            this.tankMaterial,
            {
                friction: 0.5,
                restitution: 0.6
            }
        );
        
        const tankWallContact = new CANNON.ContactMaterial(
            this.tankMaterial,
            this.wallMaterial,
            {
                friction: 0.3,
                restitution: 0.8
            }
        );
        
        this.world.addContactMaterial(tankGroundContact);
        this.world.addContactMaterial(tankTankContact);
        this.world.addContactMaterial(tankWallContact);
        
        console.log('🔧 物理材质设置完成');
    }
    
    /**
     * 设置碰撞检测
     */
    setupCollisionDetection() {
        // 使用更精确的碰撞检测算法
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // 允许物体进入睡眠状态以提高性能
        this.world.allowSleep = true;
        
        console.log('🔍 碰撞检测设置完成');
    }
    
    /**
     * 创建地面
     */
    createGround() {
        const groundShape = new CANNON.Plane();
        this.groundBody = new CANNON.Body({ mass: 0 });
        this.groundBody.addShape(groundShape);
        this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.groundBody.material = this.groundMaterial;
        
        this.world.add(this.groundBody);
        
        console.log('🌍 物理地面创建完成');
    }
    
    /**
     * 创建坦克刚体
     */
    createTankBody(mass, dimensions = { width: 2, height: 1, depth: 4 }) {
        const shape = new CANNON.Box(new CANNON.Vec3(
            dimensions.width / 2,
            dimensions.height / 2,
            dimensions.depth / 2
        ));
        
        const body = new CANNON.Body({ mass });
        body.addShape(shape);
        body.material = this.tankMaterial;
        
        // 设置初始位置
        body.position.set(0, 2, 0);
        
        // 添加到物理世界
        this.world.add(body);
        
        // 设置线性和角阻尼
        body.linearDamping = 0.1;
        body.angularDamping = 0.3;
        
        return body;
    }
    
    /**
     * 创建墙体刚体
     */
    createWallBody(position, dimensions) {
        const shape = new CANNON.Box(new CANNON.Vec3(
            dimensions.width / 2,
            dimensions.height / 2,
            dimensions.depth / 2
        ));
        
        const body = new CANNON.Body({ mass: 0 }); // 静态物体
        body.addShape(shape);
        body.position.copy(position);
        body.material = this.wallMaterial;
        
        this.world.add(body);
        return body;
    }
    
    /**
     * 创建边界墙
     */
    createBoundaryWalls(size = 50) {
        const wallHeight = 5;
        const wallThickness = 1;
        
        const walls = [];
        
        // 四面墙
        const wallConfigs = [
            { pos: { x: 0, y: wallHeight/2, z: size/2 }, dim: { width: size, height: wallHeight, depth: wallThickness } },
            { pos: { x: 0, y: wallHeight/2, z: -size/2 }, dim: { width: size, height: wallHeight, depth: wallThickness } },
            { pos: { x: size/2, y: wallHeight/2, z: 0 }, dim: { width: wallThickness, height: wallHeight, depth: size } },
            { pos: { x: -size/2, y: wallHeight/2, z: 0 }, dim: { width: wallThickness, height: wallHeight, depth: size } }
        ];
        
        wallConfigs.forEach((config, index) => {
            const wall = this.createWallBody(
                new CANNON.Vec3(config.pos.x, config.pos.y, config.pos.z),
                config.dim
            );
            walls.push(wall);
        });
        
        console.log('🏗️ 边界墙创建完成');
        return walls;
    }
    
    /**
     * 应用力到坦克
     */
    applyForceToTank(tankBody, force, relativePoint = new CANNON.Vec3(0, 0, 0)) {
        if (!tankBody) return;
        
        // 将相对力转换为世界坐标
        const worldForce = new CANNON.Vec3();
        tankBody.quaternion.vmult(force, worldForce);
        
        // 应用力
        tankBody.applyImpulse(worldForce, relativePoint);
    }
    
    /**
     * 应用扭矩到坦克（用于转向）
     */
    applyTorqueToTank(tankBody, torque) {
        if (!tankBody) return;
        
        tankBody.applyTorqueImpulse(torque);
    }
    
    /**
     * 计算碰撞伤害
     */
    calculateCollisionDamage(collision) {
        const contact = collision.contact;
        const bodyA = collision.target;
        const bodyB = collision.body;
        
        // 计算相对速度
        const relativeVelocity = bodyA.velocity.vsub(bodyB.velocity);
        const impactSpeed = relativeVelocity.length();
        
        // 计算动能
        const massA = bodyA.mass || 1;
        const massB = bodyB.mass || 1;
        const combinedMass = massA + massB;
        
        const kineticEnergy = 0.5 * combinedMass * impactSpeed * impactSpeed;
        
        // 基础伤害计算
        let baseDamage = kineticEnergy * 0.1; // 伤害系数
        
        // 速度加成计算
        const speedKmh = impactSpeed * 3.6; // 转换为km/h
        let speedMultiplier = 1.0;
        
        if (speedKmh > 70) speedMultiplier = 2.5;
        else if (speedKmh > 50) speedMultiplier = 2.0;
        else if (speedKmh > 30) speedMultiplier = 1.5;
        else if (speedKmh > 10) speedMultiplier = 1.0;
        else speedMultiplier = 0.5;
        
        // 计算最终伤害
        const finalDamage = baseDamage * speedMultiplier;
        
        return {
            damage: Math.max(0, finalDamage),
            speed: speedKmh,
            impactSpeed: impactSpeed,
            kineticEnergy: kineticEnergy,
            speedMultiplier: speedMultiplier
        };
    }
    
    /**
     * 添加碰撞事件监听器
     */
    addCollisionListener(callback) {
        this.world.addEventListener('beginContact', (event) => {
            const { bodyA, bodyB } = event;
            
            // 检查是否涉及坦克
            if (bodyA.material === this.tankMaterial || bodyB.material === this.tankMaterial) {
                const collision = {
                    bodyA: bodyA,
                    bodyB: bodyB,
                    contact: event.contact
                };
                
                const damageInfo = this.calculateCollisionDamage({
                    target: bodyA,
                    body: bodyB,
                    contact: event.contact
                });
                
                callback(collision, damageInfo);
            }
        });
    }
    
    /**
     * 更新物理世界
     */
    update(deltaTime) {
        if (!this.world) return;
        
        // 限制时间步长以保持稳定性
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // 步进物理模拟
        this.world.step(this.timeStep, clampedDeltaTime, this.maxSubSteps);
    }
    
    /**
     * 同步Three.js网格和Cannon.js刚体的位置
     */
    syncMeshWithBody(mesh, body) {
        if (!mesh || !body) return;
        
        // 同步位置
        mesh.position.copy(body.position);
        
        // 同步旋转
        mesh.quaternion.copy(body.quaternion);
    }
    
    /**
     * 注册网格和刚体的映射关系
     */
    registerMeshBodyPair(mesh, body) {
        this.meshBodyMap.set(mesh, body);
        this.physicsBodies.set(body.id, { mesh, body });
    }
    
    /**
     * 移除物理对象
     */
    removeBody(body) {
        if (this.world && body) {
            this.world.remove(body);
            this.physicsBodies.delete(body.id);
        }
    }
    
    /**
     * 获取所有注册的物理对象
     */
    getAllBodies() {
        return Array.from(this.physicsBodies.values());
    }
    
    /**
     * 清理物理世界
     */
    dispose() {
        if (this.world) {
            // 移除所有刚体
            const bodies = [...this.world.bodies];
            bodies.forEach(body => {
                this.world.remove(body);
            });
            
            this.physicsBodies.clear();
            this.meshBodyMap.clear();
        }
        
        console.log('🧹 物理系统清理完成');
    }
}

// 全局物理系统实例
window.physicsSystem = null;