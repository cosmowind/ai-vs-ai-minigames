/**
 * 碰撞系统类
 * 处理坦克间的碰撞检测、伤害计算和特效
 */
class CollisionSystem {
    constructor() {
        this.collisionCallbacks = new Map();
        this.tankManager = null;
        this.recentCollisions = new Map(); // 防止重复碰撞
        this.collisionCooldown = 500; // 毫秒
        
        this.init();
    }
    
    /**
     * 初始化碰撞系统
     */
    init() {
        console.log('⚡ 初始化碰撞系统...');
        
        // 设置物理系统的碰撞监听
        if (window.physicsSystem) {
            this.setupPhysicsListeners();
        }
        
        console.log('✅ 碰撞系统初始化完成');
    }
    
    /**
     * 设置物理系统监听器
     */
    setupPhysicsListeners() {
        window.physicsSystem.addCollisionListener((collision, damageInfo) => {
            this.handleCollision(collision, damageInfo);
        });
    }
    
    /**
     * 设置坦克管理器引用
     */
    setTankManager(tankManager) {
        this.tankManager = tankManager;
    }
    
    /**
     * 处理碰撞事件
     */
    handleCollision(collision, damageInfo) {
        const { bodyA, bodyB } = collision;
        
        // 检查碰撞是否涉及坦克
        const tankA = this.getTankFromBody(bodyA);
        const tankB = this.getTankFromBody(bodyB);
        
        if (!tankA && !tankB) return; // 没有坦克参与的碰撞
        
        // 生成碰撞ID以防止重复处理
        const collisionId = this.generateCollisionId(bodyA, bodyB);
        
        if (this.isRecentCollision(collisionId)) {
            return; // 最近已处理过的碰撞
        }
        
        this.recordCollision(collisionId);
        
        // 处理不同类型的碰撞
        if (tankA && tankB) {
            this.handleTankVsTankCollision(tankA, tankB, damageInfo);
        } else if (tankA || tankB) {
            this.handleTankVsEnvironmentCollision(tankA || tankB, damageInfo);
        }
    }
    
    /**
     * 从物理刚体获取坦克实例
     */
    getTankFromBody(body) {
        if (!body.userData || body.userData.type !== 'tank') {
            return null;
        }
        
        if (this.tankManager) {
            return this.tankManager.getTankById(body.userData.tankId);
        }
        
        return null;
    }
    
    /**
     * 生成碰撞ID
     */
    generateCollisionId(bodyA, bodyB) {
        const idA = bodyA.id || bodyA.userData?.tankId || 'unknown';
        const idB = bodyB.id || bodyB.userData?.tankId || 'unknown';
        
        // 确保ID顺序一致
        return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
    }
    
    /**
     * 检查是否为最近的碰撞
     */
    isRecentCollision(collisionId) {
        const lastTime = this.recentCollisions.get(collisionId);
        const now = Date.now();
        
        return lastTime && (now - lastTime) < this.collisionCooldown;
    }
    
    /**
     * 记录碰撞
     */
    recordCollision(collisionId) {
        this.recentCollisions.set(collisionId, Date.now());
        
        // 清理过期记录
        this.cleanupOldCollisions();
    }
    
    /**
     * 清理过期的碰撞记录
     */
    cleanupOldCollisions() {
        const now = Date.now();
        const expiredIds = [];
        
        for (const [id, time] of this.recentCollisions) {
            if (now - time > this.collisionCooldown * 2) {
                expiredIds.push(id);
            }
        }
        
        expiredIds.forEach(id => this.recentCollisions.delete(id));
    }
    
    /**
     * 处理坦克vs坦克碰撞
     */
    handleTankVsTankCollision(tankA, tankB, damageInfo) {
        console.log(`🚗💥🚗 坦克碰撞: ${tankA.id} vs ${tankB.id}`);
        
        // 计算碰撞参数
        const collisionData = this.calculateCollisionParameters(tankA, tankB, damageInfo);
        
        // 应用伤害
        const damageA = this.calculateTankDamage(tankA, tankB, collisionData, false);
        const damageB = this.calculateTankDamage(tankB, tankA, collisionData, true);
        
        tankA.takeDamage(damageA, 'kinetic', tankB);
        tankB.takeDamage(damageB, 'kinetic', tankA);
        
        // 播放碰撞效果
        this.playCollisionEffect(tankA.position, tankB.position, collisionData.intensity);
        
        // 触发碰撞回调
        this.triggerCollisionCallbacks('tank_vs_tank', {
            tankA, tankB, damageA, damageB, collisionData
        });
        
        console.log(`伤害结果: ${tankA.id} 受到 ${damageA.toFixed(1)} 伤害, ${tankB.id} 受到 ${damageB.toFixed(1)} 伤害`);
    }
    
    /**
     * 处理坦克vs环境碰撞
     */
    handleTankVsEnvironmentCollision(tank, damageInfo) {
        console.log(`🚗💥🏗️ 环境碰撞: ${tank.id}`);
        
        // 计算环境碰撞伤害
        const damage = this.calculateEnvironmentDamage(tank, damageInfo);
        
        if (damage > 0) {
            tank.takeDamage(damage, 'kinetic', 'environment');
            
            // 播放环境碰撞效果
            this.playEnvironmentCollisionEffect(tank.position, damage);
            
            // 触发碰撞回调
            this.triggerCollisionCallbacks('tank_vs_environment', {
                tank, damage, damageInfo
            });
            
            console.log(`${tank.id} 撞击环境受到 ${damage.toFixed(1)} 伤害`);
        }
    }
    
    /**
     * 计算碰撞参数
     */
    calculateCollisionParameters(tankA, tankB, damageInfo) {
        // 获取速度和质量
        const velocityA = tankA.velocity.length();
        const velocityB = tankB.velocity.length();
        const massA = tankA.getTotalMass();
        const massB = tankB.getTotalMass();
        
        // 计算相对速度
        const relativeVelocity = Math.abs(velocityA - velocityB);
        
        // 计算总动能
        const kineticEnergyA = 0.5 * massA * velocityA * velocityA;
        const kineticEnergyB = 0.5 * massB * velocityB * velocityB;
        const totalKineticEnergy = kineticEnergyA + kineticEnergyB;
        
        // 计算碰撞强度
        const intensity = Math.min(1.0, totalKineticEnergy / 50000); // 归一化到0-1
        
        return {
            velocityA,
            velocityB,
            relativeVelocity,
            massA,
            massB,
            kineticEnergyA,
            kineticEnergyB,
            totalKineticEnergy,
            intensity,
            speedKmhA: velocityA * 3.6,
            speedKmhB: velocityB * 3.6
        };
    }
    
    /**
     * 计算坦克碰撞伤害
     */
    calculateTankDamage(receivingTank, attackingTank, collisionData, isSecondary = false) {
        // 基础伤害计算
        let baseDamage = collisionData.totalKineticEnergy * 0.01;
        
        // 速度加成
        const speedMultiplier = this.getSpeedMultiplier(collisionData.relativeVelocity * 3.6);
        baseDamage *= speedMultiplier;
        
        // 质量影响（更重的坦克造成更多伤害，受到更少伤害）
        const massRatio = attackingTank.getTotalMass() / receivingTank.getTotalMass();
        baseDamage *= Math.sqrt(massRatio);
        
        // 次要碰撞者受到较少伤害
        if (isSecondary) {
            baseDamage *= 0.7;
        }
        
        // 随机因素
        baseDamage *= (0.8 + Math.random() * 0.4);
        
        return Math.max(5, baseDamage); // 最小伤害5点
    }
    
    /**
     * 计算环境碰撞伤害
     */
    calculateEnvironmentDamage(tank, damageInfo) {
        const speed = tank.velocity.length() * 3.6; // km/h
        
        if (speed < 10) {
            return 0; // 低速碰撞无伤害
        }
        
        // 基础伤害
        let damage = speed * 2;
        
        // 速度加成
        const speedMultiplier = this.getSpeedMultiplier(speed);
        damage *= speedMultiplier;
        
        // 质量影响（重型坦克撞墙更疼）
        const massEffect = Math.sqrt(tank.getTotalMass() / 500);
        damage *= massEffect;
        
        return Math.max(0, damage);
    }
    
    /**
     * 获取速度伤害倍率
     */
    getSpeedMultiplier(speedKmh) {
        if (speedKmh >= 70) return 2.5;
        if (speedKmh >= 50) return 2.0;
        if (speedKmh >= 30) return 1.5;
        if (speedKmh >= 10) return 1.0;
        return 0.5;
    }
    
    /**
     * 播放碰撞特效
     */
    playCollisionEffect(positionA, positionB, intensity) {
        // 计算碰撞中点
        const collisionPoint = new THREE.Vector3()
            .addVectors(positionA, positionB)
            .multiplyScalar(0.5);
        
        // 创建火花效果
        this.createSparkEffect(collisionPoint, intensity);
        
        // 创建冲击波效果
        this.createShockwaveEffect(collisionPoint, intensity);
        
        // 播放碰撞音效（如果有）
        this.playCollisionSound(intensity);
    }
    
    /**
     * 创建火花效果
     */
    createSparkEffect(position, intensity) {
        const sparkCount = Math.floor(intensity * 20 + 10);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const velocities = new Float32Array(sparkCount * 3);
        const colors = new Float32Array(sparkCount * 3);
        
        for (let i = 0; i < sparkCount; i++) {
            const i3 = i * 3;
            
            // 初始位置
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // 随机速度
            velocities[i3] = (Math.random() - 0.5) * 10 * intensity;
            velocities[i3 + 1] = Math.random() * 5 * intensity;
            velocities[i3 + 2] = (Math.random() - 0.5) * 10 * intensity;
            
            // 火花颜色（黄-橙-红）
            const heat = Math.random();
            colors[i3] = 1; // R
            colors[i3 + 1] = 0.8 + heat * 0.2; // G
            colors[i3 + 2] = heat * 0.3; // B
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const sparks = new THREE.Points(geometry, material);
        
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(sparks);
            
            // 动画火花
            this.animateSparks(sparks, 2000); // 2秒生命周期
        }
    }
    
    /**
     * 动画火花效果
     */
    animateSparks(sparks, lifetime) {
        const startTime = Date.now();
        const positions = sparks.geometry.attributes.position.array;
        const velocities = sparks.geometry.attributes.velocity.array;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / lifetime;
            
            if (progress >= 1) {
                // 移除火花
                if (sparks.parent) {
                    sparks.parent.remove(sparks);
                }
                sparks.geometry.dispose();
                sparks.material.dispose();
                return;
            }
            
            // 更新位置
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * 0.016; // 假设60fps
                positions[i + 1] += velocities[i + 1] * 0.016 - 0.1; // 重力
                positions[i + 2] += velocities[i + 2] * 0.016;
                
                // 减少速度（阻力）
                velocities[i] *= 0.98;
                velocities[i + 1] *= 0.98;
                velocities[i + 2] *= 0.98;
            }
            
            sparks.geometry.attributes.position.needsUpdate = true;
            sparks.material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    /**
     * 创建冲击波效果
     */
    createShockwaveEffect(position, intensity) {
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 16);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: intensity * 0.5,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(position);
        shockwave.rotation.x = -Math.PI / 2; // 水平放置
        
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(shockwave);
            
            // 动画冲击波
            this.animateShockwave(shockwave, intensity);
        }
    }
    
    /**
     * 动画冲击波效果
     */
    animateShockwave(shockwave, intensity) {
        let scale = 0.1;
        const maxScale = intensity * 5;
        
        const animate = () => {
            scale += 0.2;
            shockwave.scale.setScalar(scale);
            shockwave.material.opacity = Math.max(0, intensity * 0.5 * (1 - scale / maxScale));
            
            if (scale < maxScale) {
                requestAnimationFrame(animate);
            } else {
                // 移除冲击波
                if (shockwave.parent) {
                    shockwave.parent.remove(shockwave);
                }
                shockwave.geometry.dispose();
                shockwave.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * 播放环境碰撞效果
     */
    playEnvironmentCollisionEffect(position, damage) {
        // 简化的环境碰撞效果
        const intensity = Math.min(1.0, damage / 50);
        this.createSparkEffect(position, intensity * 0.5);
    }
    
    /**
     * 播放碰撞音效
     */
    playCollisionSound(intensity) {
        // 音效播放逻辑（可扩展）
        console.log(`🔊 播放碰撞音效，强度: ${intensity.toFixed(2)}`);
    }
    
    /**
     * 添加碰撞回调
     */
    addCollisionCallback(type, callback) {
        if (!this.collisionCallbacks.has(type)) {
            this.collisionCallbacks.set(type, []);
        }
        this.collisionCallbacks.get(type).push(callback);
    }
    
    /**
     * 移除碰撞回调
     */
    removeCollisionCallback(type, callback) {
        if (this.collisionCallbacks.has(type)) {
            const callbacks = this.collisionCallbacks.get(type);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发碰撞回调
     */
    triggerCollisionCallbacks(type, data) {
        if (this.collisionCallbacks.has(type)) {
            this.collisionCallbacks.get(type).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`碰撞回调执行失败:`, error);
                }
            });
        }
    }
    
    /**
     * 获取碰撞统计
     */
    getCollisionStats() {
        return {
            recentCollisions: this.recentCollisions.size,
            totalCallbacks: Array.from(this.collisionCallbacks.values())
                .reduce((total, callbacks) => total + callbacks.length, 0)
        };
    }
    
    /**
     * 清理资源
     */
    dispose() {
        this.collisionCallbacks.clear();
        this.recentCollisions.clear();
        this.tankManager = null;
        
        console.log('🧹 碰撞系统资源清理完成');
    }
}

// 导出到全局
window.CollisionSystem = CollisionSystem;