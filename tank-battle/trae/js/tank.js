// 坦克类
class Tank {
    constructor(scene, world, position, config) {
        this.scene = scene;
        this.world = world;
        this.config = config;
        this.id = Utils.generateId();
        
        // 物理属性
        this.body = null;
        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { x: 0, y: 0, z: 0 };
        
        // 游戏属性
        this.health = config.totalHealth;
        this.maxHealth = config.totalHealth;
        this.isDestroyed = false;
        
        // 控制属性
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false
        };
        
        // 创建3D模型
        this.createModel(position);
        this.createPhysicsBody();
        
        // 特效
        this.trail = null;
        this.damageParticles = null;
        
        // 统计
        this.damageDealt = 0;
        this.distanceTraveled = 0;
        this.lastPosition = { ...position };
    }

    // 创建3D模型
    createModel(position) {
        this.group = new THREE.Group();
        
        // 坦克主体
        this.bodyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 3),
            new THREE.MeshLambertMaterial({ color: COLORS.TANK_BODY })
        );
        this.bodyMesh.position.y = 0.5;
        this.group.add(this.bodyMesh);
        
        // 炮塔
        this.turret = new THREE.Group();
        this.turret.position.y = 1;
        this.group.add(this.turret);
        
        // 炮管
        this.barrel = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 2),
            new THREE.MeshLambertMaterial({ color: COLORS.TANK_BODY })
        );
        this.barrel.position.z = 1.5;
        this.turret.add(this.barrel);
        
        // 引擎组件可视化
        if (this.config.engine) {
            this.createEngineModel();
        }
        
        // 装甲组件可视化
        this.createArmorModels();
        
        // 设置位置
        this.group.position.set(position.x, position.y, position.z);
        this.scene.add(this.group);
        
        // 创建血量条
        this.createHealthBar();
    }

    // 创建引擎模型
    createEngineModel() {
        const engine = this.config.engine;
        const engineMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8),
            new THREE.MeshLambertMaterial({ color: engine.color, emissive: engine.color, emissiveIntensity: 0.2 })
        );
        engineMesh.position.set(-1.2, 0.5, -1);
        engineMesh.rotation.x = Math.PI / 2;
        this.group.add(engineMesh);
        
        // 发光效果
        const glow = new THREE.PointLight(engine.color, 0.5, 3);
        glow.position.copy(engineMesh.position);
        this.group.add(glow);
    }

    // 创建装甲模型
    createArmorModels() {
        const armorPositions = [
            { x: 1.2, y: 0.5, z: 0 },      // 右侧
            { x: -1.2, y: 0.5, z: 0 },     // 左侧
            { x: 0, y: 0.5, z: 1.5 },      // 前部
            { x: 0, y: 0.5, z: -1.5 }      // 后部
        ];
        
        this.armorMeshes = [];
        this.config.armors.forEach((armor, index) => {
            if (index < armorPositions.length) {
                const armorMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.8, 0.2),
                    new THREE.MeshLambertMaterial({ color: armor.color })
                );
                armorMesh.position.set(
                    armorPositions[index].x,
                    armorPositions[index].y,
                    armorPositions[index].z
                );
                this.group.add(armorMesh);
                this.armorMeshes.push(armorMesh);
            }
        });
    }

    // 创建物理刚体
    createPhysicsBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1.5));
        this.body = new CANNON.Body({
            mass: this.config.totalWeight,
            shape: shape,
            material: new CANNON.Material({ friction: 0.8, restitution: 0.3 })
        });
        
        this.body.position.set(
            this.group.position.x,
            this.group.position.y + 0.5,
            this.group.position.z
        );
        
        this.body.userData = { tank: this };
        this.world.add(this.body);
    }

    // 创建血量条
    createHealthBar() {
        this.healthBar = new THREE.Group();
        
        // 背景
        const bgGeometry = new THREE.PlaneGeometry(2, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBar.add(bgMesh);
        
        // 血量条
        const healthGeometry = new THREE.PlaneGeometry(2, 0.2);
        this.healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthMesh = new THREE.Mesh(healthGeometry, this.healthMaterial);
        this.healthBar.add(this.healthMesh);
        
        this.healthBar.position.y = 2.5;
        this.group.add(this.healthBar);
    }

    // 更新血量条
    updateHealthBar() {
        if (this.healthBar) {
            const healthRatio = this.health / this.maxHealth;
            this.healthMesh.scale.x = healthRatio;
            
            // 根据血量改变颜色
            if (healthRatio > 0.6) {
                this.healthMaterial.color.setHex(0x00ff00); // 绿色
            } else if (healthRatio > 0.3) {
                this.healthMaterial.color.setHex(0xffff00); // 黄色
            } else {
                this.healthMaterial.color.setHex(0xff0000); // 红色
            }
        }
    }

    // 更新坦克
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // 更新物理位置到3D模型
        this.group.position.copy(this.body.position);
        this.group.quaternion.copy(this.body.quaternion);
        
        // 更新控制
        this.updateControls();
        
        // 更新血量条朝向相机
        if (this.healthBar) {
            this.healthBar.lookAt(camera.position);
        }
        
        // 更新距离统计
        const currentPos = this.body.position;
        const distance = Utils.distance(
            { x: currentPos.x, y: 0, z: currentPos.z },
            { x: this.lastPosition.x, y: 0, z: this.lastPosition.z }
        );
        this.distanceTraveled += distance;
        this.lastPosition = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
        
        // 更新特效
        this.updateEffects();
    }

    // 更新控制
    updateControls() {
        if (!this.config.engine || this.config.engine.isDestroyed) return;
        
        const power = this.config.engine.getEffectivePower();
        const maxSpeed = this.config.maxSpeed;
        const acceleration = this.config.acceleration;
        
        // 获取坦克朝向
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.group.quaternion);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.group.quaternion);
        
        // 计算力
        let force = new CANNON.Vec3(0, 0, 0);
        
        if (this.controls.forward) {
            force.x += forward.x * power * acceleration;
            force.z += forward.z * power * acceleration;
        }
        if (this.controls.backward) {
            force.x -= forward.x * power * acceleration * 0.7;
            force.z -= forward.z * power * acceleration * 0.7;
        }
        if (this.controls.left) {
            this.body.angularVelocity.y = 2;
        }
        if (this.controls.right) {
            this.body.angularVelocity.y = -2;
        }
        if (this.controls.brake) {
            this.body.velocity.x *= 0.9;
            this.body.velocity.z *= 0.9;
            this.body.angularVelocity.y *= 0.9;
        }
        
        // 应用力
        this.body.applyForce(force, this.body.position);
        
        // 限制最大速度
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            velocity.x *= ratio;
            velocity.z *= ratio;
        }
    }

    // 处理碰撞
    handleCollision(otherTank, impactVelocity) {
        if (this.isDestroyed || otherTank.isDestroyed) return;
        
        // 计算碰撞伤害
        const relativeSpeed = Math.abs(impactVelocity);
        const baseDamage = 50;
        const speedMultiplier = Math.min(relativeSpeed / GAME_CONFIG.physics.maxSpeed, 2);
        const weightRatio = this.config.totalWeight / Math.max(1, otherTank.config.totalWeight);
        
        const damage = baseDamage * speedMultiplier * weightRatio;
        
        // 应用伤害
        const actualDamage = this.takeDamage(damage);
        
        // 创建碰撞特效
        this.createCollisionEffect(impactVelocity);
        
        // 统计伤害
        if (otherTank !== this) {
            otherTank.damageDealt += actualDamage;
        }
    }

    // 承受伤害
    takeDamage(damage) {
        if (this.isDestroyed) return 0;
        
        // 通过配置系统计算实际伤害
        const actualDamage = this.config.takeDamage ? 
            this.config.takeDamage(damage) : damage;
        
        this.health = Math.max(0, this.health - actualDamage);
        this.updateHealthBar();
        
        // 创建受伤特效
        this.createDamageEffect();
        
        if (this.health <= 0 && !this.isDestroyed) {
            this.destroy();
        }
        
        return actualDamage;
    }

    // 创建碰撞特效
    createCollisionEffect(velocity) {
        const position = this.body.position;
        
        // 火花粒子效果
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05),
                new THREE.MeshBasicMaterial({ color: 0xff6600 })
            );
            
            particle.position.set(
                position.x + (Math.random() - 0.5) * 2,
                position.y + Math.random() * 2,
                position.z + (Math.random() - 0.5) * 2
            );
            
            // 设置粒子速度
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * velocity * 0.5,
                Math.random() * 2,
                (Math.random() - 0.5) * velocity * 0.5
            );
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // 动画和清理
        const animate = () => {
            particles.children.forEach(particle => {
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.1; // 重力
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(0.95);
            });
            
            if (particles.children[0].material.opacity <= 0) {
                this.scene.remove(particles);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 创建受伤特效
    createDamageEffect() {
        // 坦克闪烁效果
        const originalColor = this.bodyMesh.material.color.getHex();
        this.bodyMesh.material.color.setHex(0xff0000);
        
        setTimeout(() => {
            if (!this.isDestroyed) {
                this.bodyMesh.material.color.setHex(originalColor);
            }
        }, 200);
    }

    // 更新特效
    updateEffects() {
        // 速度轨迹效果
        const speed = Math.sqrt(
            this.body.velocity.x ** 2 + this.body.velocity.z ** 2
        );
        
        if (speed > 5) {
            if (!this.trail) {
                // 创建轨迹效果
                this.trail = new THREE.Group();
                this.scene.add(this.trail);
            }
            
            // 添加轨迹粒子
            const trailParticle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff, 
                    transparent: true, 
                    opacity: 0.6 
                })
            );
            
            trailParticle.position.copy(this.body.position);
            trailParticle.position.y -= 0.5;
            this.trail.add(trailParticle);
            
            // 淡出效果
            setTimeout(() => {
                if (this.trail) {
                    this.trail.remove(trailParticle);
                }
            }, 1000);
        }
    }

    // 销毁坦克
    destroy() {
        this.isDestroyed = true;
        
        // 创建爆炸效果
        this.createExplosionEffect();
        
        // 移除物理体
        if (this.body) {
            this.world.remove(this.body);
        }
        
        // 移除3D模型
        if (this.group) {
            this.scene.remove(this.group);
        }
        
        // 移除特效
        if (this.trail) {
            this.scene.remove(this.trail);
        }
        
        Utils.eventSystem.emit('tankDestroyed', this);
    }

    // 创建爆炸效果
    createExplosionEffect() {
        const position = this.body.position;
        
        // 爆炸粒子
        const particleCount = 50;
        const explosion = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.2),
                new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5),
                    transparent: true
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
        
        // 爆炸动画
        const animate = () => {
            explosion.children.forEach(particle => {
                particle.position.add(particle.velocity);
                particle.velocity.multiplyScalar(0.95);
                particle.velocity.y -= 0.2;
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(1.05);
            });
            
            if (explosion.children[0].material.opacity <= 0) {
                this.scene.remove(explosion);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 获取坦克信息
    getInfo() {
        return {
            id: this.id,
            health: this.health,
            maxHealth: this.maxHealth,
            position: {
                x: this.body.position.x,
                y: this.body.position.y,
                z: this.body.position.z
            },
            velocity: {
                x: this.body.velocity.x,
                y: this.body.velocity.y,
                z: this.body.velocity.z
            },
            speed: Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.z ** 2),
            isDestroyed: this.isDestroyed,
            stats: {
                damageDealt: this.damageDealt,
                distanceTraveled: this.distanceTraveled
            }
        };
    }

    // 重置坦克
    reset(position) {
        this.isDestroyed = false;
        this.health = this.maxHealth;
        this.damageDealt = 0;
        this.distanceTraveled = 0;
        
        // 重置物理体
        this.body.position.set(position.x, position.y, position.z);
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // 重置组件
        if (this.config.engine) {
            this.config.engine.repair(this.config.engine.maxHealth);
        }
        this.config.armors.forEach(armor => {
            armor.repair(armor.maxHealth);
        });
        
        // 更新血量条
        this.updateHealthBar();
        
        // 重新添加到场景
        this.scene.add(this.group);
        this.world.add(this.body);
    }
}

// AI坦克类
class AITank extends Tank {
    constructor(scene, world, position, config, difficulty = 1) {
        super(scene, world, position, config);
        
        this.difficulty = difficulty;
        this.target = null;
        this.lastDecisionTime = 0;
        this.decisionInterval = 1000 / difficulty; // 决策间隔
        this.state = 'patrol'; // patrol, chase, attack, evade
        
        // AI属性
        this.aggroRange = 10 + difficulty * 5;
        this.attackRange = 5;
        this.evadeHealth = 30;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isDestroyed) return;
        
        // AI决策
        this.makeDecision(deltaTime);
        
        // 执行AI行为
        this.executeBehavior();
    }

    makeDecision(deltaTime) {
        this.lastDecisionTime += deltaTime;
        
        if (this.lastDecisionTime < this.decisionInterval) return;
        
        this.lastDecisionTime = 0;
        
        if (!this.target) {
            this.state = 'patrol';
            return;
        }
        
        const distanceToTarget = Utils.distance(
            { x: this.body.position.x, y: 0, z: this.body.position.z },
            { x: this.target.body.position.x, y: 0, z: this.target.body.position.z }
        );
        
        // 根据距离和血量决定状态
        if (this.health < this.evadeHealth) {
            this.state = 'evade';
        } else if (distanceToTarget < this.attackRange) {
            this.state = 'attack';
        } else if (distanceToTarget < this.aggroRange) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }
    }

    executeBehavior() {
        const position = this.body.position;
        const targetPos = this.target ? this.target.body.position : null;
        
        switch (this.state) {
            case 'patrol':
                this.patrol();
                break;
            case 'chase':
                if (targetPos) this.chase(targetPos);
                break;
            case 'attack':
                if (targetPos) this.attack(targetPos);
                break;
            case 'evade':
                if (targetPos) this.evade(targetPos);
                break;
        }
    }

    patrol() {
        // 简单的巡逻行为
        const time = Date.now() * 0.001;
        const patrolRadius = 5;
        const centerX = 0;
        const centerZ = 0;
        
        const targetX = centerX + Math.cos(time * 0.5) * patrolRadius;
        const targetZ = centerZ + Math.sin(time * 0.5) * patrolRadius;
        
        this.moveTowards(targetX, targetZ);
    }

    chase(targetPos) {
        this.moveTowards(targetPos.x, targetPos.z);
    }

    attack(targetPos) {
        // 冲向目标
        this.moveTowards(targetPos.x, targetPos.z);
        
        // 增加速度
        this.controls.forward = true;
    }

    evade(targetPos) {
        // 远离目标
        const dx = this.body.position.x - targetPos.x;
        const dz = this.body.position.z - targetPos.z;
        
        const targetX = this.body.position.x + dx * 2;
        const targetZ = this.body.position.z + dz * 2;
        
        this.moveTowards(targetX, targetZ);
    }

    moveTowards(targetX, targetZ) {
        const dx = targetX - this.body.position.x;
        const dz = targetZ - this.body.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 0.1) {
            // 计算角度
            const angle = Math.atan2(dx, dz);
            const currentAngle = this.body.quaternion.y;
            
            // 转向目标
            if (Math.abs(angle - currentAngle) > 0.1) {
                this.controls.left = angle > currentAngle;
                this.controls.right = angle < currentAngle;
            } else {
                this.controls.left = false;
                this.controls.right = false;
            }
            
            // 前进
            this.controls.forward = true;
            this.controls.backward = false;
        } else {
            // 停止
            this.controls.forward = false;
            this.controls.backward = false;
            this.controls.left = false;
            this.controls.right = false;
        }
    }

    setTarget(target) {
        this.target = target;
    }
}