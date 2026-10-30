/**
 * 坦克实体类
 * 整合所有组件，实现完整的坦克功能
 */
class Tank {
    constructor(components, stats) {
        this.id = this.generateId();
        this.components = components || [];
        this.stats = stats || {};
        
        // 坦克状态
        this.currentHealth = stats.totalHealth || 100;
        this.maxHealth = stats.totalHealth || 100;
        this.isDestroyed = false;
        this.isActive = true;
        
        // 物理相关
        this.physicsBody = null;
        this.mesh = null;
        this.group = new THREE.Group();
        
        // 运动状态
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // 控制输入
        this.controls = {
            throttle: 0,    // 油门 (-1 到 1)
            steering: 0,    // 转向 (-1 到 1)
            brake: false    // 刹车
        };
        
        // 组件引用（快速访问）
        this.engine = null;
        this.armors = [];
        this.chassis = null;
        
        // 特效和音效
        this.exhaustParticles = null;
        this.damageEffects = [];
        
        this.initialize();
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return 'tank_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 初始化坦克
     */
    initialize() {
        console.log(`🚗 初始化坦克 ${this.id}`);
        
        // 分类组件
        this.categorizeComponents();
        
        // 创建3D表现
        this.create3DRepresentation();
        
        // 创建物理刚体
        this.createPhysicsBody();
        
        // 设置组件位置
        this.positionComponents();
        
        // 初始化特效
        this.initializeEffects();
        
        console.log(`✅ 坦克 ${this.id} 初始化完成`);
    }
    
    /**
     * 分类组件以便快速访问
     */
    categorizeComponents() {
        this.engine = null;
        this.armors = [];
        this.chassis = null;
        
        this.components.forEach(component => {
            switch (component.getType()) {
                case ComponentTypes.ENGINE:
                    this.engine = component;
                    break;
                case ComponentTypes.ARMOR:
                    this.armors.push(component);
                    break;
                case ComponentTypes.CHASSIS:
                    this.chassis = component;
                    break;
            }
            
            // 将组件附加到坦克
            component.attachToTank(this);
        });
        
        console.log(`组件分类完成: 引擎${this.engine ? 1 : 0}个, 装甲${this.armors.length}个, 底盘${this.chassis ? 1 : 0}个`);
    }
    
    /**
     * 创建3D表现
     */
    create3DRepresentation() {
        // 清空现有组
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        
        // 为每个组件创建网格
        this.components.forEach(component => {
            const mesh = component.createMesh();
            if (mesh) {
                this.group.add(mesh);
            }
        });
        
        // 设置组的属性
        this.group.castShadow = true;
        this.group.receiveShadow = true;
        
        // 添加到场景
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(this.group);
        }
        
        console.log('3D表现创建完成');
    }
    
    /**
     * 创建物理刚体
     */
    createPhysicsBody() {
        if (!window.physicsSystem) {
            console.error('物理系统未初始化');
            return;
        }
        
        // 计算坦克尺寸（基于底盘）
        const dimensions = this.calculateDimensions();
        
        // 创建刚体
        this.physicsBody = window.physicsSystem.createTankBody(
            this.stats.totalWeight,
            dimensions
        );
        
        // 注册网格和刚体的映射
        window.physicsSystem.registerMeshBodyPair(this.group, this.physicsBody);
        
        // 设置用户数据
        this.physicsBody.userData = {
            tankId: this.id,
            type: 'tank'
        };
        
        console.log('物理刚体创建完成');
    }
    
    /**
     * 计算坦克尺寸
     */
    calculateDimensions() {
        let width = 2.0;
        let height = 1.0;
        let depth = 4.0;
        
        // 根据底盘调整基础尺寸
        if (this.chassis) {
            if (this.chassis.chassisType === 'reinforced') {
                width *= 1.1;
                height *= 1.2;
                depth *= 1.1;
            } else if (this.chassis.chassisType === 'lightweight') {
                width *= 0.9;
                height *= 0.8;
                depth *= 0.9;
            }
        }
        
        // 根据装甲数量调整高度
        height += this.armors.length * 0.1;
        
        return { width, height, depth };
    }
    
    /**
     * 设置组件位置
     */
    positionComponents() {
        this.components.forEach((component, index) => {
            switch (component.getType()) {
                case ComponentTypes.ENGINE:
                    component.setPosition(0, 0.2, -1.8); // 后部
                    break;
                    
                case ComponentTypes.CHASSIS:
                    component.setPosition(0, -0.3, 0); // 底部中央
                    break;
                    
                case ComponentTypes.ARMOR:
                    // 装甲分布在不同位置
                    const armorIndex = this.armors.indexOf(component);
                    switch (armorIndex) {
                        case 0: // 前装甲
                            component.setPosition(0, 0.2, 1.5);
                            break;
                        case 1: // 侧装甲
                            component.setPosition(1.2, 0.2, 0);
                            component.setRotation(0, Math.PI / 2, 0);
                            break;
                        case 2: // 另一侧装甲
                            component.setPosition(-1.2, 0.2, 0);
                            component.setRotation(0, -Math.PI / 2, 0);
                            break;
                        case 3: // 后装甲
                            component.setPosition(0, 0.2, -1.5);
                            break;
                        default: // 额外装甲堆叠
                            component.setPosition(
                                (Math.random() - 0.5) * 2,
                                0.5 + armorIndex * 0.3,
                                (Math.random() - 0.5) * 3
                            );
                    }
                    break;
                    
                default:
                    // 其他组件随机分布
                    component.setPosition(
                        (Math.random() - 0.5) * 1.5,
                        0.3,
                        (Math.random() - 0.5) * 2
                    );
            }
        });
        
        console.log('组件位置设置完成');
    }
    
    /**
     * 初始化特效
     */
    initializeEffects() {
        // 创建排气粒子效果
        this.createExhaustEffect();
        
        // 初始化损坏效果
        this.damageEffects = [];
        
        console.log('特效初始化完成');
    }
    
    /**
     * 创建排气效果
     */
    createExhaustEffect() {
        if (!this.engine) return;
        
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = -2.2; // 引擎后方
            
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = Math.random() * 0.05;
            velocities[i3 + 2] = -(Math.random() * 0.5 + 0.3);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x444444,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.exhaustParticles = new THREE.Points(geometry, material);
        this.group.add(this.exhaustParticles);
    }
    
    /**
     * 更新坦克状态
     */
    update(deltaTime) {
        if (!this.isActive || this.isDestroyed) return;
        
        // 更新物理状态
        this.updatePhysics();
        
        // 更新组件
        this.updateComponents(deltaTime);
        
        // 更新特效
        this.updateEffects(deltaTime);
        
        // 处理控制输入
        this.processControls();
        
        // 同步3D位置
        this.syncVisualPosition();
    }
    
    /**
     * 更新物理状态
     */
    updatePhysics() {
        if (!this.physicsBody) return;
        
        // 获取物理状态
        this.velocity.copy(this.physicsBody.velocity);
        this.angularVelocity.copy(this.physicsBody.angularVelocity);
        this.position.copy(this.physicsBody.position);
        
        // 限制最大速度
        if (this.engine) {
            const maxSpeed = this.engine.getSpeedLimit();
            const currentSpeed = this.velocity.length();
            
            if (currentSpeed > maxSpeed) {
                this.velocity.multiplyScalar(maxSpeed / currentSpeed);
                this.physicsBody.velocity.copy(this.velocity);
            }
        }
    }
    
    /**
     * 更新组件状态
     */
    updateComponents(deltaTime) {
        this.components.forEach(component => {
            component.update(deltaTime);
        });
    }
    
    /**
     * 更新特效
     */
    updateEffects(deltaTime) {
        // 更新排气效果
        this.updateExhaustEffect();
        
        // 更新损坏效果
        this.updateDamageEffects(deltaTime);
    }
    
    /**
     * 更新排气效果
     */
    updateExhaustEffect() {
        if (!this.exhaustParticles || !this.engine) return;
        
        const positions = this.exhaustParticles.geometry.attributes.position.array;
        const velocities = this.exhaustParticles.geometry.attributes.velocity.array;
        
        const isEngineRunning = this.engine.isRunning && Math.abs(this.controls.throttle) > 0.1;
        const intensity = isEngineRunning ? Math.abs(this.controls.throttle) : 0;
        
        for (let i = 0; i < positions.length; i += 3) {
            if (isEngineRunning) {
                // 更新粒子位置
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2] * intensity;
                
                // 重置超出范围的粒子
                if (positions[i + 2] < -5) {
                    positions[i] = (Math.random() - 0.5) * 0.3;
                    positions[i + 1] = Math.random() * 0.2;
                    positions[i + 2] = -2.2;
                }
            }
        }
        
        this.exhaustParticles.geometry.attributes.position.needsUpdate = true;
        this.exhaustParticles.material.opacity = intensity * 0.6;
    }
    
    /**
     * 更新损坏效果
     */
    updateDamageEffects(deltaTime) {
        // 根据血量显示损坏效果
        const healthRatio = this.currentHealth / this.maxHealth;
        
        if (healthRatio < 0.5 && !this.hasEffect('smoke')) {
            this.addSmokeEffect();
        }
        
        if (healthRatio < 0.2 && !this.hasEffect('fire')) {
            this.addFireEffect();
        }
    }
    
    /**
     * 检查是否有特定效果
     */
    hasEffect(effectType) {
        return this.damageEffects.some(effect => effect.type === effectType);
    }
    
    /**
     * 添加烟雾效果
     */
    addSmokeEffect() {
        // 简单的烟雾效果实现
        const smokeGeometry = new THREE.SphereGeometry(0.5);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(0, 1, 0);
        this.group.add(smoke);
        
        this.damageEffects.push({
            type: 'smoke',
            mesh: smoke,
            intensity: 0.3
        });
    }
    
    /**
     * 添加火焰效果
     */
    addFireEffect() {
        // 简单的火焰效果实现
        const fireGeometry = new THREE.SphereGeometry(0.3);
        const fireMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.7
        });
        
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.set(0, 0.8, 0);
        this.group.add(fire);
        
        this.damageEffects.push({
            type: 'fire',
            mesh: fire,
            intensity: 0.7
        });
    }
    
    /**
     * 处理控制输入
     */
    processControls() {
        if (!this.engine || !this.physicsBody) return;
        
        // 处理油门
        if (Math.abs(this.controls.throttle) > 0.01) {
            this.engine.applyThrust(this, this.controls.throttle);
        }
        
        // 处理转向
        if (Math.abs(this.controls.steering) > 0.01) {
            this.engine.applyTorque(this, this.controls.steering);
        }
        
        // 处理刹车
        if (this.controls.brake) {
            this.applyBrake();
        }
    }
    
    /**
     * 应用刹车
     */
    applyBrake() {
        if (!this.physicsBody) return;
        
        const brakeForce = 0.9; // 刹车强度
        this.physicsBody.velocity.scale(1 - brakeForce);
        this.physicsBody.angularVelocity.scale(1 - brakeForce);
    }
    
    /**
     * 同步视觉位置
     */
    syncVisualPosition() {
        if (!this.physicsBody) return;
        
        window.physicsSystem.syncMeshWithBody(this.group, this.physicsBody);
    }
    
    /**
     * 设置控制输入
     */
    setControls(throttle, steering, brake = false) {
        this.controls.throttle = Math.max(-1, Math.min(1, throttle));
        this.controls.steering = Math.max(-1, Math.min(1, steering));
        this.controls.brake = brake;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage, damageType = 'kinetic', source = null) {
        if (this.isDestroyed) return 0;
        
        let totalDamage = 0;
        
        // 装甲吸收伤害
        if (this.armors.length > 0) {
            // 随机选择一个装甲来承受伤害
            const armor = this.armors[Math.floor(Math.random() * this.armors.length)];
            const armorDamage = Math.min(damage * 0.8, armor.currentHealth);
            armor.takeDamage(armorDamage, damageType, source);
            totalDamage += armorDamage;
            damage -= armorDamage;
        }
        
        // 剩余伤害作用于坦克本体
        if (damage > 0) {
            this.currentHealth -= damage;
            totalDamage += damage;
        }
        
        // 检查是否被摧毁
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.destroy();
        }
        
        console.log(`坦克受到 ${totalDamage.toFixed(1)} 点伤害，剩余血量：${this.currentHealth.toFixed(1)}/${this.maxHealth}`);
        
        return totalDamage;
    }
    
    /**
     * 摧毁坦克
     */
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        this.isActive = false;
        
        console.log(`💥 坦克 ${this.id} 被摧毁`);
        
        // 停止引擎
        if (this.engine) {
            this.engine.stop();
        }
        
        // 播放摧毁效果
        this.playDestroyEffect();
        
        // 触发摧毁事件
        this.onDestroy();
    }
    
    /**
     * 播放摧毁效果
     */
    playDestroyEffect() {
        // 创建爆炸效果
        const explosionGeometry = new THREE.SphereGeometry(2);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(explosion);
            
            // 爆炸动画
            let scale = 0.1;
            const animate = () => {
                scale += 0.1;
                explosion.scale.setScalar(scale);
                explosion.material.opacity = Math.max(0, 1 - scale / 3);
                
                if (scale < 3) {
                    requestAnimationFrame(animate);
                } else {
                    window.gameEngine.scene.remove(explosion);
                    explosion.geometry.dispose();
                    explosion.material.dispose();
                }
            };
            animate();
        }
    }
    
    /**
     * 摧毁事件回调
     */
    onDestroy() {
        // 子类可以重写此方法
        console.log('坦克摧毁事件触发');
    }
    
    /**
     * 获取坦克状态
     */
    getStatus() {
        return {
            id: this.id,
            health: {
                current: this.currentHealth,
                max: this.maxHealth,
                ratio: this.currentHealth / this.maxHealth
            },
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            isDestroyed: this.isDestroyed,
            isActive: this.isActive,
            stats: this.stats,
            controls: { ...this.controls }
        };
    }
    
    /**
     * 获取总质量
     */
    getTotalMass() {
        return this.stats.totalWeight || 500;
    }
    
    /**
     * 重置位置
     */
    resetPosition(position = new THREE.Vector3(0, 2, 0)) {
        if (this.physicsBody) {
            this.physicsBody.position.copy(position);
            this.physicsBody.velocity.set(0, 0, 0);
            this.physicsBody.angularVelocity.set(0, 0, 0);
            this.physicsBody.quaternion.set(0, 0, 0, 1);
        }
    }
    
    /**
     * 清理资源
     */
    dispose() {
        // 清理组件
        this.components.forEach(component => {
            component.dispose();
        });
        
        // 清理物理刚体
        if (this.physicsBody && window.physicsSystem) {
            window.physicsSystem.removeBody(this.physicsBody);
        }
        
        // 清理3D对象
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
        
        // 清理特效
        this.damageEffects.forEach(effect => {
            if (effect.mesh && effect.mesh.parent) {
                effect.mesh.parent.remove(effect.mesh);
            }
        });
        
        console.log(`🧹 坦克 ${this.id} 资源清理完成`);
    }
}

// 导出到全局
window.Tank = Tank;