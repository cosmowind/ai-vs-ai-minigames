/**
 * 装甲组件类
 * 负责坦克的防护和生命值系统
 */
class ArmorComponent extends Component {
    constructor(armorType, quality = 'common') {
        const config = ArmorComponent.getArmorConfig(armorType);
        super(config.name, config.weight, quality);
        
        this.armorType = armorType;
        this.baseStats = {
            health: config.health,
            defense: config.defense,
            damageReduction: config.damageReduction,
            thickness: config.thickness
        };
        
        // 装甲状态
        this.currentHealth = 0; // 将在calculateModifiedStats中设置
        this.maxHealth = 0;
        this.damageHistory = []; // 伤害历史记录
        this.isDestroyed = false;
        
        // 视觉效果
        this.damageLevel = 0; // 0-4 损坏等级
        this.smokeEffect = null;
        this.sparksEffect = null;
        
        this.calculateModifiedStats();
        this.initializeHealth();
    }
    
    /**
     * 获取装甲配置
     */
    static getArmorConfig(armorType) {
        const configs = {
            'basic': {
                name: '基础装甲',
                health: 100,
                defense: 10,
                damageReduction: 0.1,
                weight: 150,
                thickness: 10 // mm
            },
            'reinforced': {
                name: '强化装甲',
                health: 200,
                defense: 20,
                damageReduction: 0.2,
                weight: 250,
                thickness: 20
            },
            'heavy': {
                name: '重型装甲',
                health: 350,
                defense: 35,
                damageReduction: 0.35,
                weight: 400,
                thickness: 35
            },
            'reactive': {
                name: '反应式装甲',
                health: 150,
                defense: 30,
                damageReduction: 0.4,
                weight: 200,
                thickness: 15
            },
            'composite': {
                name: '复合装甲',
                health: 300,
                defense: 40,
                damageReduction: 0.45,
                weight: 350,
                thickness: 25
            }
        };
        
        return configs[armorType] || configs.basic;
    }
    
    /**
     * 获取所有可用装甲类型
     */
    static getAllArmorTypes() {
        return ['basic', 'reinforced', 'heavy', 'reactive', 'composite'];
    }
    
    /**
     * 初始化血量
     */
    initializeHealth() {
        this.maxHealth = this.modifiedStats.health;
        this.currentHealth = this.maxHealth;
    }
    
    /**
     * 创建装甲3D网格
     */
    createMesh() {
        if (this.mesh) {
            this.dispose();
        }
        
        // 根据装甲类型创建不同的几何体
        const geometry = this.createArmorGeometry();
        const material = this.createMaterial();
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 添加装甲细节
        this.addArmorDetails();
        
        // 设置位置
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        return this.mesh;
    }
    
    /**
     * 创建装甲几何体
     */
    createArmorGeometry() {
        const thickness = this.modifiedStats.thickness / 100; // 转换为米
        
        switch (this.armorType) {
            case 'basic':
                return new THREE.BoxGeometry(1.8, 0.8, thickness);
            
            case 'reinforced':
                return new THREE.BoxGeometry(1.9, 0.9, thickness * 1.2);
            
            case 'heavy':
                return new THREE.BoxGeometry(2.0, 1.0, thickness * 1.5);
            
            case 'reactive':
                // 反应装甲有特殊形状
                const group = new THREE.Group();
                const mainGeometry = new THREE.BoxGeometry(1.8, 0.8, thickness);
                const main = new THREE.Mesh(mainGeometry, this.createMaterial());
                
                // 添加反应装甲块
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 3; j++) {
                        const blockGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
                        const block = new THREE.Mesh(blockGeometry, this.createMaterial());
                        block.position.set(
                            (i - 1.5) * 0.4,
                            (j - 1) * 0.3,
                            thickness / 2 + 0.05
                        );
                        group.add(block);
                    }
                }
                
                group.add(main);
                return group;
            
            case 'composite':
                // 复合装甲的层状结构
                const compositeGroup = new THREE.Group();
                
                // 外层
                const outerGeometry = new THREE.BoxGeometry(1.9, 0.9, thickness * 0.6);
                const outer = new THREE.Mesh(outerGeometry, this.createMaterial());
                
                // 内层（不同颜色）
                const innerGeometry = new THREE.BoxGeometry(1.85, 0.85, thickness * 0.4);
                const innerMaterial = new THREE.MeshPhongMaterial({
                    color: this.getQualityColor() * 0.8,
                    emissive: this.getQualityEmissive()
                });
                const inner = new THREE.Mesh(innerGeometry, innerMaterial);
                inner.position.z = thickness * 0.1;
                
                compositeGroup.add(outer);
                compositeGroup.add(inner);
                return compositeGroup;
            
            default:
                return new THREE.BoxGeometry(1.8, 0.8, thickness);
        }
    }
    
    /**
     * 添加装甲装饰细节
     */
    addArmorDetails() {
        const group = new THREE.Group();
        
        // 添加螺栓
        this.addBolts(group);
        
        // 添加焊接痕迹
        this.addWeldMarks(group);
        
        // 根据损坏等级添加损坏效果
        this.updateDamageEffects(group);
        
        this.mesh.add(group);
    }
    
    /**
     * 添加螺栓装饰
     */
    addBolts(group) {
        const boltGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1);
        const boltMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
                bolt.position.set(
                    (i - 2.5) * 0.3,
                    (j - 1.5) * 0.2,
                    0.05
                );
                bolt.rotation.x = Math.PI / 2;
                group.add(bolt);
            }
        }
    }
    
    /**
     * 添加焊接痕迹
     */
    addWeldMarks(group) {
        const weldGeometry = new THREE.BoxGeometry(1.8, 0.02, 0.01);
        const weldMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        for (let i = 0; i < 3; i++) {
            const weld = new THREE.Mesh(weldGeometry, weldMaterial);
            weld.position.set(0, (i - 1) * 0.3, 0.05);
            group.add(weld);
        }
    }
    
    /**
     * 获取组件类型
     */
    getType() {
        return ComponentTypes.ARMOR;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage, damageType = 'kinetic', source = null) {
        if (this.isDestroyed) return 0;
        
        // 计算实际伤害
        const actualDamage = this.calculateActualDamage(damage, damageType);
        
        // 记录伤害
        this.damageHistory.push({
            timestamp: Date.now(),
            damage: actualDamage,
            type: damageType,
            source: source
        });
        
        // 应用伤害
        this.currentHealth -= actualDamage;
        
        // 更新损坏等级
        this.updateDamageLevel();
        
        // 检查是否被摧毁
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.destroy();
        }
        
        // 更新视觉效果
        this.updateVisualEffects();
        
        console.log(`装甲受到 ${actualDamage.toFixed(1)} 点伤害，剩余血量：${this.currentHealth.toFixed(1)}/${this.maxHealth}`);
        
        return actualDamage;
    }
    
    /**
     * 计算实际伤害
     */
    calculateActualDamage(damage, damageType) {
        let actualDamage = damage;
        
        // 应用防御值
        actualDamage = Math.max(0, actualDamage - this.modifiedStats.defense);
        
        // 应用伤害减免
        actualDamage *= (1 - this.modifiedStats.damageReduction);
        
        // 根据伤害类型调整
        switch (damageType) {
            case 'kinetic':
                // 动能伤害（碰撞）
                break;
            case 'explosive':
                // 爆炸伤害
                actualDamage *= 1.2;
                break;
            case 'thermal':
                // 热能伤害
                if (this.armorType === 'composite') {
                    actualDamage *= 0.8; // 复合装甲抗热
                }
                break;
        }
        
        // 反应装甲特殊处理
        if (this.armorType === 'reactive' && damageType === 'kinetic') {
            actualDamage *= 0.7; // 反应装甲对动能弹有额外防护
        }
        
        return Math.max(0, actualDamage);
    }
    
    /**
     * 更新损坏等级
     */
    updateDamageLevel() {
        const healthRatio = this.currentHealth / this.maxHealth;
        
        if (healthRatio > 0.8) {
            this.damageLevel = 0; // 完好
        } else if (healthRatio > 0.6) {
            this.damageLevel = 1; // 轻微损坏
        } else if (healthRatio > 0.4) {
            this.damageLevel = 2; // 中度损坏
        } else if (healthRatio > 0.2) {
            this.damageLevel = 3; // 重度损坏
        } else {
            this.damageLevel = 4; // 严重损坏
        }
    }
    
    /**
     * 更新损坏视觉效果
     */
    updateDamageEffects(group) {
        if (this.damageLevel === 0) return;
        
        // 添加弹孔
        this.addBulletHoles(group);
        
        // 添加裂痕
        if (this.damageLevel >= 2) {
            this.addCracks(group);
        }
        
        // 添加烧焦痕迹
        if (this.damageLevel >= 3) {
            this.addBurnMarks(group);
        }
    }
    
    /**
     * 添加弹孔
     */
    addBulletHoles(group) {
        const holeCount = this.damageLevel * 2;
        
        for (let i = 0; i < holeCount; i++) {
            const holeGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2);
            const holeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            
            hole.position.set(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.6,
                0
            );
            hole.rotation.x = Math.PI / 2;
            
            group.add(hole);
        }
    }
    
    /**
     * 添加裂痕
     */
    addCracks(group) {
        const crackCount = this.damageLevel - 1;
        
        for (let i = 0; i < crackCount; i++) {
            const crackGeometry = new THREE.BoxGeometry(0.8, 0.01, 0.01);
            const crackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            crack.position.set(
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 0.5,
                0.01
            );
            crack.rotation.z = Math.random() * Math.PI;
            
            group.add(crack);
        }
    }
    
    /**
     * 添加烧焦痕迹
     */
    addBurnMarks(group) {
        const burnGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const burnMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 3; i++) {
            const burn = new THREE.Mesh(burnGeometry, burnMaterial);
            burn.position.set(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.6,
                0.02
            );
            group.add(burn);
        }
    }
    
    /**
     * 摧毁装甲
     */
    destroy() {
        this.isDestroyed = true;
        console.log(`${this.name} 被摧毁`);
        
        // 触发摧毁效果
        this.playDestroyEffect();
    }
    
    /**
     * 播放摧毁效果
     */
    playDestroyEffect() {
        // 这里可以添加爆炸效果、烟雾等
        console.log('装甲摧毁效果播放');
    }
    
    /**
     * 修复装甲
     */
    repair(amount) {
        if (this.isDestroyed) return 0;
        
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        const actualRepair = this.currentHealth - oldHealth;
        
        // 更新损坏等级
        this.updateDamageLevel();
        
        // 更新视觉效果
        this.updateVisualEffects();
        
        console.log(`装甲修复 ${actualRepair.toFixed(1)} 点，当前血量：${this.currentHealth.toFixed(1)}/${this.maxHealth}`);
        
        return actualRepair;
    }
    
    /**
     * 获取健康状态
     */
    getHealthStatus() {
        return {
            current: this.currentHealth,
            max: this.maxHealth,
            ratio: this.currentHealth / this.maxHealth,
            damageLevel: this.damageLevel,
            isDestroyed: this.isDestroyed
        };
    }
    
    /**
     * 更新视觉效果
     */
    updateVisualEffects() {
        if (!this.mesh || !this.mesh.material) return;
        
        // 根据损坏等级调整材质
        const healthRatio = this.currentHealth / this.maxHealth;
        const originalColor = this.getQualityColor();
        
        // 损坏时颜色变暗
        const darkenFactor = 0.3 + (healthRatio * 0.7);
        this.mesh.material.color.setHex(originalColor).multiplyScalar(darkenFactor);
        
        // 严重损坏时添加红光
        if (this.damageLevel >= 3) {
            this.mesh.material.emissive.setHex(0x330000);
        }
    }
    
    /**
     * 获取装甲信息
     */
    getArmorInfo() {
        return {
            ...this.getInfo(),
            armorType: this.armorType,
            healthStatus: this.getHealthStatus(),
            damageHistory: this.damageHistory.slice(-10), // 最近10次伤害
            thickness: this.modifiedStats.thickness
        };
    }
    
    /**
     * 更新装甲状态
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // 清理过期的伤害记录
        const now = Date.now();
        this.damageHistory = this.damageHistory.filter(
            record => now - record.timestamp < 60000 // 保留1分钟内的记录
        );
    }
    
    /**
     * 序列化装甲数据
     */
    serialize() {
        return {
            ...super.serialize(),
            armorType: this.armorType,
            currentHealth: this.currentHealth,
            maxHealth: this.maxHealth,
            damageLevel: this.damageLevel,
            isDestroyed: this.isDestroyed
        };
    }
    
    /**
     * 反序列化装甲数据
     */
    static deserialize(data) {
        const armor = new ArmorComponent(data.armorType, data.quality);
        armor.currentHealth = data.currentHealth || armor.maxHealth;
        armor.maxHealth = data.maxHealth || armor.maxHealth;
        armor.damageLevel = data.damageLevel || 0;
        armor.isDestroyed = data.isDestroyed || false;
        
        if (data.position) {
            armor.setPosition(data.position.x, data.position.y, data.position.z);
        }
        if (data.rotation) {
            armor.setRotation(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        return armor;
    }
}

/**
 * 装甲组件工厂
 */
class ArmorFactory {
    /**
     * 创建指定类型和品质的装甲
     */
    static createArmor(armorType, quality = 'common') {
        return new ArmorComponent(armorType, quality);
    }
    
    /**
     * 创建随机装甲
     */
    static createRandomArmor() {
        const types = ArmorComponent.getAllArmorTypes();
        const qualities = Object.values(QualityTypes);
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
        
        return new ArmorComponent(randomType, randomQuality);
    }
    
    /**
     * 获取所有预设装甲
     */
    static getAllPresetArmors() {
        const armors = [];
        const types = ArmorComponent.getAllArmorTypes();
        const qualities = ['common', 'rare', 'epic'];
        
        types.forEach(type => {
            qualities.forEach(quality => {
                armors.push(new ArmorComponent(type, quality));
            });
        });
        
        return armors;
    }
}

// 导出到全局
window.ArmorComponent = ArmorComponent;
window.ArmorFactory = ArmorFactory;