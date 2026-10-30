/**
 * 引擎组件类
 * 负责坦克的移动和动力系统
 */
class EngineComponent extends Component {
    constructor(engineType, quality = 'common') {
        const config = EngineComponent.getEngineConfig(engineType);
        super(config.name, config.weight, quality);
        
        this.engineType = engineType;
        this.baseStats = {
            maxSpeed: config.maxSpeed,
            acceleration: config.acceleration,
            healthBonus: config.healthBonus,
            torque: config.torque
        };
        
        // 引擎状态
        this.isRunning = false;
        this.currentRPM = 0;
        this.maxRPM = 6000;
        this.fuelEfficiency = config.fuelEfficiency;
        
        // 引擎音效和特效（可扩展）
        this.exhaustParticles = null;
        
        this.calculateModifiedStats();
    }
    
    /**
     * 获取引擎配置
     */
    static getEngineConfig(engineType) {
        const configs = {
            'light': {
                name: '轻型引擎',
                maxSpeed: 60,      // km/h
                acceleration: 8,   // m/s²
                weight: 100,       // kg
                healthBonus: 50,   // HP
                torque: 200,       // Nm
                fuelEfficiency: 0.8
            },
            'medium': {
                name: '中型引擎',
                maxSpeed: 45,
                acceleration: 6,
                weight: 200,
                healthBonus: 100,
                torque: 350,
                fuelEfficiency: 0.6
            },
            'heavy': {
                name: '重型引擎',
                maxSpeed: 30,
                acceleration: 4,
                weight: 400,
                healthBonus: 200,
                torque: 500,
                fuelEfficiency: 0.4
            },
            'turbo': {
                name: '涡轮引擎',
                maxSpeed: 80,
                acceleration: 10,
                weight: 150,
                healthBonus: 75,
                torque: 300,
                fuelEfficiency: 0.3
            }
        };
        
        return configs[engineType] || configs.medium;
    }
    
    /**
     * 获取所有可用引擎类型
     */
    static getAllEngineTypes() {
        return ['light', 'medium', 'heavy', 'turbo'];
    }
    
    /**
     * 创建引擎3D网格
     */
    createMesh() {
        if (this.mesh) {
            this.dispose();
        }
        
        // 根据引擎类型创建不同尺寸的网格
        const size = this.getEngineSize();
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        const material = this.createMaterial();
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 添加引擎装饰
        this.addEngineDetails();
        
        // 设置位置
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        return this.mesh;
    }
    
    /**
     * 获取引擎尺寸
     */
    getEngineSize() {
        const sizes = {
            'light': { width: 0.8, height: 0.4, depth: 1.2 },
            'medium': { width: 1.0, height: 0.5, depth: 1.4 },
            'heavy': { width: 1.2, height: 0.6, depth: 1.6 },
            'turbo': { width: 0.9, height: 0.45, depth: 1.3 }
        };
        
        return sizes[this.engineType] || sizes.medium;
    }
    
    /**
     * 添加引擎装饰细节
     */
    addEngineDetails() {
        const group = new THREE.Group();
        
        // 排气管
        const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8);
        const exhaustMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(0, 0, -0.8);
        exhaust.rotation.x = Math.PI / 2;
        group.add(exhaust);
        
        // 散热片（重型引擎特有）
        if (this.engineType === 'heavy') {
            for (let i = 0; i < 3; i++) {
                const finGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.1);
                const finMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
                const fin = new THREE.Mesh(finGeometry, finMaterial);
                fin.position.set(0, 0.1 + i * 0.1, 0.3);
                group.add(fin);
            }
        }
        
        // 涡轮进气口（涡轮引擎特有）
        if (this.engineType === 'turbo') {
            const intakeGeometry = new THREE.ConeGeometry(0.2, 0.4);
            const intakeMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const intake = new THREE.Mesh(intakeGeometry, intakeMaterial);
            intake.position.set(0, 0.3, 0.6);
            group.add(intake);
        }
        
        this.mesh.add(group);
    }
    
    /**
     * 获取组件类型
     */
    getType() {
        return ComponentTypes.ENGINE;
    }
    
    /**
     * 启动引擎
     */
    start() {
        this.isRunning = true;
        this.currentRPM = 800; // 怠速
        console.log(`${this.name} 启动`);
    }
    
    /**
     * 停止引擎
     */
    stop() {
        this.isRunning = false;
        this.currentRPM = 0;
        console.log(`${this.name} 停止`);
    }
    
    /**
     * 应用推力到坦克
     */
    applyThrust(tank, throttleInput) {
        if (!this.isRunning || !tank || !tank.physicsBody) return;
        
        // 计算实际推力
        const maxForce = this.modifiedStats.acceleration * tank.getTotalMass();
        const appliedForce = maxForce * Math.abs(throttleInput);
        
        // 考虑引擎转速
        const rpmFactor = this.currentRPM / this.maxRPM;
        const effectiveForce = appliedForce * rpmFactor;
        
        // 创建力向量（前进/后退）
        const forceDirection = throttleInput > 0 ? 1 : -1;
        const forceVector = new CANNON.Vec3(0, 0, effectiveForce * forceDirection);
        
        // 应用力到坦克
        if (window.physicsSystem) {
            window.physicsSystem.applyForceToTank(tank.physicsBody, forceVector);
        }
        
        // 更新RPM
        this.updateRPM(throttleInput);
        
        return effectiveForce;
    }
    
    /**
     * 应用转向扭矩
     */
    applyTorque(tank, steeringInput) {
        if (!this.isRunning || !tank || !tank.physicsBody) return;
        
        // 计算转向扭矩
        const maxTorque = this.modifiedStats.torque;
        const appliedTorque = maxTorque * steeringInput;
        
        // 考虑速度影响（速度越快，转向越困难）
        const speed = tank.physicsBody.velocity.length();
        const speedFactor = Math.max(0.3, 1 - speed * 0.1);
        const effectiveTorque = appliedTorque * speedFactor;
        
        // 创建扭矩向量
        const torqueVector = new CANNON.Vec3(0, effectiveTorque, 0);
        
        // 应用扭矩
        if (window.physicsSystem) {
            window.physicsSystem.applyTorqueToTank(tank.physicsBody, torqueVector);
        }
        
        return effectiveTorque;
    }
    
    /**
     * 更新引擎转速
     */
    updateRPM(throttleInput) {
        const targetRPM = 800 + (this.maxRPM - 800) * Math.abs(throttleInput);
        
        // 平滑RPM变化
        const rpmChangeRate = 50; // RPM每帧变化量
        if (this.currentRPM < targetRPM) {
            this.currentRPM = Math.min(targetRPM, this.currentRPM + rpmChangeRate);
        } else {
            this.currentRPM = Math.max(targetRPM, this.currentRPM - rpmChangeRate);
        }
    }
    
    /**
     * 获取当前速度限制
     */
    getSpeedLimit() {
        return this.modifiedStats.maxSpeed / 3.6; // 转换为m/s
    }
    
    /**
     * 检查速度是否超限
     */
    isOverSpeedLimit(currentSpeed) {
        return currentSpeed > this.getSpeedLimit();
    }
    
    /**
     * 计算燃油消耗
     */
    calculateFuelConsumption(deltaTime, throttleInput) {
        if (!this.isRunning) return 0;
        
        const baseFuelRate = (1 - this.fuelEfficiency) * 0.1; // 基础油耗
        const throttleFuelRate = Math.abs(throttleInput) * 0.05; // 油门油耗
        const rpmFuelRate = (this.currentRPM / this.maxRPM) * 0.03; // 转速油耗
        
        return (baseFuelRate + throttleFuelRate + rpmFuelRate) * deltaTime;
    }
    
    /**
     * 获取引擎信息
     */
    getEngineInfo() {
        return {
            ...this.getInfo(),
            engineType: this.engineType,
            isRunning: this.isRunning,
            currentRPM: this.currentRPM,
            maxRPM: this.maxRPM,
            fuelEfficiency: this.fuelEfficiency,
            speedLimit: this.getSpeedLimit()
        };
    }
    
    /**
     * 更新引擎状态
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // 怠速时RPM自然下降
        if (this.isRunning && this.currentRPM > 800) {
            this.currentRPM = Math.max(800, this.currentRPM - 10);
        }
        
        // 更新视觉效果（如果有）
        this.updateVisualEffects();
    }
    
    /**
     * 更新视觉效果
     */
    updateVisualEffects() {
        if (!this.mesh) return;
        
        // 根据RPM调整发光强度
        if (this.isRunning && this.mesh.material) {
            const intensity = (this.currentRPM / this.maxRPM) * 0.2;
            this.mesh.material.emissiveIntensity = intensity;
        }
    }
    
    /**
     * 附加到坦克时的特殊处理
     */
    onAttach(tank) {
        super.onAttach(tank);
        
        // 设置引擎位置（坦克后部）
        this.setPosition(0, 0, -1.5);
        
        // 自动启动引擎
        this.start();
    }
    
    /**
     * 从坦克分离时的特殊处理
     */
    onDetach(tank) {
        super.onDetach(tank);
        
        // 停止引擎
        this.stop();
    }
    
    /**
     * 序列化引擎数据
     */
    serialize() {
        return {
            ...super.serialize(),
            engineType: this.engineType,
            isRunning: this.isRunning,
            currentRPM: this.currentRPM
        };
    }
    
    /**
     * 反序列化引擎数据
     */
    static deserialize(data) {
        const engine = new EngineComponent(data.engineType, data.quality);
        engine.isRunning = data.isRunning || false;
        engine.currentRPM = data.currentRPM || 0;
        
        if (data.position) {
            engine.setPosition(data.position.x, data.position.y, data.position.z);
        }
        if (data.rotation) {
            engine.setRotation(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        return engine;
    }
}

/**
 * 引擎组件工厂
 */
class EngineFactory {
    /**
     * 创建指定类型和品质的引擎
     */
    static createEngine(engineType, quality = 'common') {
        return new EngineComponent(engineType, quality);
    }
    
    /**
     * 创建随机引擎
     */
    static createRandomEngine() {
        const types = EngineComponent.getAllEngineTypes();
        const qualities = Object.values(QualityTypes);
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        
        return new EngineComponent(randomType, randomQuality);
    }
    
    /**
     * 获取所有预设引擎
     */
    static getAllPresetEngines() {
        const engines = [];
        const types = EngineComponent.getAllEngineTypes();
        const qualities = ['common', 'rare', 'epic'];
        
        types.forEach(type => {
            qualities.forEach(quality => {
                engines.push(new EngineComponent(type, quality));
            });
        });
        
        return engines;
    }
}

// 导出到全局
window.EngineComponent = EngineComponent;
window.EngineFactory = EngineFactory;