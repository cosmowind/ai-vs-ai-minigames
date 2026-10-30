/**
 * 坦克构建器类
 * 负责坦克组件的组装、验证和统计计算
 */
class TankBuilder {
    constructor() {
        this.components = [];
        this.maxWeight = 1000; // kg 最大重量限制
        this.minComponents = 2; // 最少需要的组件数量（引擎+底盘）
        this.maxComponents = 8; // 最大组件数量
        
        // 必需组件类型
        this.requiredTypes = [ComponentTypes.ENGINE];
        
        // 组件约束
        this.constraints = {
            [ComponentTypes.ENGINE]: { min: 1, max: 1 }, // 只能有一个引擎
            [ComponentTypes.ARMOR]: { min: 0, max: 4 },  // 最多4个装甲
            [ComponentTypes.WEAPON]: { min: 0, max: 2 }, // 最多2个武器
            [ComponentTypes.CHASSIS]: { min: 1, max: 1 }, // 必须有底盘
            [ComponentTypes.SPECIAL]: { min: 0, max: 2 }  // 最多2个特殊组件
        };
        
        // 构建状态
        this.isValid = false;
        this.validationErrors = [];
        this.stats = this.createEmptyStats();
        
        // 添加默认底盘
        this.addDefaultChassis();
    }
    
    /**
     * 创建空的统计数据
     */
    createEmptyStats() {
        return {
            totalWeight: 0,
            totalHealth: 100, // 基础血量
            maxSpeed: 0,
            acceleration: 0,
            defense: 0,
            damageReduction: 0,
            componentCount: 0,
            powerToWeight: 0,
            survivalRating: 0,
            mobilityRating: 0,
            overallRating: 0
        };
    }
    
    /**
     * 添加默认底盘组件
     */
    addDefaultChassis() {
        const defaultChassis = new ChassisComponent('standard', 'common');
        this.components.push(defaultChassis);
        this.recalculateStats();
    }
    
    /**
     * 添加组件
     */
    addComponent(component) {
        try {
            // 验证组件
            this.validateComponentAddition(component);
            
            // 添加组件
            this.components.push(component);
            
            // 重新计算统计数据
            this.recalculateStats();
            
            // 验证整体配置
            this.validateConfiguration();
            
            console.log(`添加组件: ${component.name}`);
            return true;
            
        } catch (error) {
            console.error(`添加组件失败: ${error.message}`);
            this.validationErrors.push(error.message);
            return false;
        }
    }
    
    /**
     * 移除组件
     */
    removeComponent(componentId) {
        const index = this.components.findIndex(comp => comp.id === componentId);
        
        if (index === -1) {
            throw new Error('组件不存在');
        }
        
        const component = this.components[index];
        
        // 检查是否可以移除（必需组件不能移除）
        if (this.isRequiredComponent(component)) {
            throw new Error('不能移除必需组件');
        }
        
        // 移除组件
        this.components.splice(index, 1);
        
        // 重新计算统计数据
        this.recalculateStats();
        this.validateConfiguration();
        
        console.log(`移除组件: ${component.name}`);
        return true;
    }
    
    /**
     * 验证组件添加
     */
    validateComponentAddition(component) {
        // 检查组件数量限制
        if (this.components.length >= this.maxComponents) {
            throw new Error(`已达到最大组件数量限制 (${this.maxComponents})`);
        }
        
        // 检查类型约束
        const componentType = component.getType();
        const typeCount = this.getComponentCountByType(componentType);
        const constraint = this.constraints[componentType];
        
        if (constraint && typeCount >= constraint.max) {
            throw new Error(`${componentType}类型组件已达到最大数量 (${constraint.max})`);
        }
        
        // 检查重量限制
        const newTotalWeight = this.getTotalWeight() + component.weight;
        if (newTotalWeight > this.maxWeight) {
            throw new Error(`添加组件会超过重量限制 (${this.maxWeight}kg)`);
        }
        
        // 检查组件是否已存在
        if (this.components.some(comp => comp.id === component.id)) {
            throw new Error('组件已存在');
        }
    }
    
    /**
     * 验证整体配置
     */
    validateConfiguration() {
        this.validationErrors = [];
        this.isValid = true;
        
        // 检查必需组件
        for (const requiredType of this.requiredTypes) {
            if (this.getComponentCountByType(requiredType) === 0) {
                this.validationErrors.push(`缺少必需组件: ${requiredType}`);
                this.isValid = false;
            }
        }
        
        // 检查组件数量约束
        for (const [type, constraint] of Object.entries(this.constraints)) {
            const count = this.getComponentCountByType(type);
            
            if (count < constraint.min) {
                this.validationErrors.push(`${type}组件数量不足: ${count}/${constraint.min}`);
                this.isValid = false;
            }
            
            if (count > constraint.max) {
                this.validationErrors.push(`${type}组件数量超限: ${count}/${constraint.max}`);
                this.isValid = false;
            }
        }
        
        // 检查总组件数量
        if (this.components.length < this.minComponents) {
            this.validationErrors.push(`组件数量不足: ${this.components.length}/${this.minComponents}`);
            this.isValid = false;
        }
        
        // 检查重量限制
        if (this.getTotalWeight() > this.maxWeight) {
            this.validationErrors.push(`超过重量限制: ${this.getTotalWeight()}/${this.maxWeight}kg`);
            this.isValid = false;
        }
        
        return this.isValid;
    }
    
    /**
     * 重新计算统计数据
     */
    recalculateStats() {
        this.stats = this.createEmptyStats();
        
        // 计算基础属性
        this.stats.componentCount = this.components.length;
        this.stats.totalWeight = this.getTotalWeight();
        
        // 收集各组件的属性
        const engines = this.getComponentsByType(ComponentTypes.ENGINE);
        const armors = this.getComponentsByType(ComponentTypes.ARMOR);
        const chassis = this.getComponentsByType(ComponentTypes.CHASSIS);
        
        // 计算引擎属性
        if (engines.length > 0) {
            const engine = engines[0]; // 只有一个引擎
            this.stats.maxSpeed = engine.modifiedStats.maxSpeed;
            this.stats.acceleration = engine.modifiedStats.acceleration;
            this.stats.totalHealth += engine.modifiedStats.healthBonus || 0;
        }
        
        // 计算装甲属性
        armors.forEach(armor => {
            this.stats.totalHealth += armor.modifiedStats.health;
            this.stats.defense += armor.modifiedStats.defense;
            this.stats.damageReduction = Math.min(0.8, 
                this.stats.damageReduction + armor.modifiedStats.damageReduction);
        });
        
        // 计算底盘属性
        if (chassis.length > 0) {
            const chassisComp = chassis[0];
            this.stats.totalHealth += chassisComp.modifiedStats.structuralHealth || 50;
        }
        
        // 计算衍生属性
        this.calculateDerivedStats();
    }
    
    /**
     * 计算衍生统计数据
     */
    calculateDerivedStats() {
        // 功率重量比
        this.stats.powerToWeight = this.stats.totalWeight > 0 ? 
            this.stats.acceleration / this.stats.totalWeight * 1000 : 0;
        
        // 生存能力评级 (0-100)
        this.stats.survivalRating = Math.min(100, 
            (this.stats.totalHealth / 10) + 
            (this.stats.defense * 2) + 
            (this.stats.damageReduction * 100)
        );
        
        // 机动性评级 (0-100)
        this.stats.mobilityRating = Math.min(100,
            this.stats.maxSpeed + 
            (this.stats.acceleration * 5) +
            (this.stats.powerToWeight * 10) -
            (this.stats.totalWeight / 20)
        );
        
        // 综合评级
        this.stats.overallRating = (
            this.stats.survivalRating * 0.4 +
            this.stats.mobilityRating * 0.4 +
            this.calculateQualityBonus() * 0.2
        );
    }
    
    /**
     * 计算品质加成
     */
    calculateQualityBonus() {
        let qualityScore = 0;
        const qualityWeights = { common: 1, rare: 2, epic: 3, legendary: 5 };
        
        this.components.forEach(comp => {
            qualityScore += qualityWeights[comp.quality] || 1;
        });
        
        return Math.min(100, qualityScore * 2);
    }
    
    /**
     * 获取指定类型的组件数量
     */
    getComponentCountByType(type) {
        return this.components.filter(comp => comp.getType() === type).length;
    }
    
    /**
     * 获取指定类型的组件
     */
    getComponentsByType(type) {
        return this.components.filter(comp => comp.getType() === type);
    }
    
    /**
     * 获取总重量
     */
    getTotalWeight() {
        return this.components.reduce((total, comp) => total + comp.weight, 0);
    }
    
    /**
     * 检查是否为必需组件
     */
    isRequiredComponent(component) {
        const type = component.getType();
        const constraint = this.constraints[type];
        const typeCount = this.getComponentCountByType(type);
        
        return constraint && typeCount <= constraint.min;
    }
    
    /**
     * 获取配置摘要
     */
    getConfigurationSummary() {
        return {
            isValid: this.isValid,
            errors: this.validationErrors,
            stats: this.stats,
            components: this.components.map(comp => comp.getInfo()),
            constraints: this.getConstraintStatus()
        };
    }
    
    /**
     * 获取约束状态
     */
    getConstraintStatus() {
        const status = {};
        
        for (const [type, constraint] of Object.entries(this.constraints)) {
            const count = this.getComponentCountByType(type);
            status[type] = {
                current: count,
                min: constraint.min,
                max: constraint.max,
                canAdd: count < constraint.max,
                canRemove: count > constraint.min
            };
        }
        
        return status;
    }
    
    /**
     * 重置构建器
     */
    reset() {
        // 保留默认底盘，移除其他组件
        this.components = this.components.filter(comp => 
            comp.getType() === ComponentTypes.CHASSIS
        );
        
        this.recalculateStats();
        this.validateConfiguration();
        
        console.log('坦克构建器已重置');
    }
    
    /**
     * 克隆当前配置
     */
    clone() {
        const newBuilder = new TankBuilder();
        newBuilder.components = [];
        
        // 克隆所有组件
        this.components.forEach(comp => {
            const clonedComp = comp.clone();
            newBuilder.components.push(clonedComp);
        });
        
        newBuilder.recalculateStats();
        newBuilder.validateConfiguration();
        
        return newBuilder;
    }
    
    /**
     * 构建坦克实例
     */
    buildTank() {
        if (!this.isValid) {
            throw new Error(`坦克配置无效: ${this.validationErrors.join(', ')}`);
        }
        
        // 创建坦克实例（将在Tank类中实现）
        const tank = new Tank(this.components, this.stats);
        
        console.log('✅ 坦克构建完成', this.stats);
        return tank;
    }
    
    /**
     * 序列化配置
     */
    serialize() {
        return {
            components: this.components.map(comp => comp.serialize()),
            stats: this.stats,
            constraints: this.constraints,
            maxWeight: this.maxWeight,
            isValid: this.isValid,
            validationErrors: this.validationErrors
        };
    }
    
    /**
     * 反序列化配置
     */
    static deserialize(data) {
        const builder = new TankBuilder();
        builder.components = [];
        
        // 反序列化组件
        data.components.forEach(compData => {
            let component;
            
            switch (compData.type) {
                case 'EngineComponent':
                    component = EngineComponent.deserialize(compData);
                    break;
                case 'ArmorComponent':
                    component = ArmorComponent.deserialize(compData);
                    break;
                case 'ChassisComponent':
                    component = ChassisComponent.deserialize(compData);
                    break;
                default:
                    console.warn(`未知组件类型: ${compData.type}`);
                    return;
            }
            
            if (component) {
                builder.components.push(component);
            }
        });
        
        builder.recalculateStats();
        builder.validateConfiguration();
        
        return builder;
    }
    
    /**
     * 导出配置为JSON
     */
    exportConfiguration() {
        return JSON.stringify(this.serialize(), null, 2);
    }
    
    /**
     * 从JSON导入配置
     */
    static importConfiguration(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return TankBuilder.deserialize(data);
        } catch (error) {
            throw new Error(`配置导入失败: ${error.message}`);
        }
    }
}

/**
 * 底盘组件类（基础组件）
 */
class ChassisComponent extends Component {
    constructor(chassisType, quality = 'common') {
        const config = ChassisComponent.getChassisConfig(chassisType);
        super(config.name, config.weight, quality);
        
        this.chassisType = chassisType;
        this.baseStats = {
            structuralHealth: config.structuralHealth,
            carryCapacity: config.carryCapacity,
            stability: config.stability
        };
        
        this.calculateModifiedStats();
    }
    
    static getChassisConfig(chassisType) {
        const configs = {
            'standard': {
                name: '标准底盘',
                weight: 200,
                structuralHealth: 50,
                carryCapacity: 800,
                stability: 0.8
            },
            'reinforced': {
                name: '强化底盘',
                weight: 300,
                structuralHealth: 100,
                carryCapacity: 1200,
                stability: 0.9
            },
            'lightweight': {
                name: '轻量底盘',
                weight: 150,
                structuralHealth: 30,
                carryCapacity: 600,
                stability: 0.7
            }
        };
        
        return configs[chassisType] || configs.standard;
    }
    
    createMesh() {
        const geometry = new THREE.BoxGeometry(2.2, 0.3, 4.5);
        const material = this.createMaterial();
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        return this.mesh;
    }
    
    getType() {
        return ComponentTypes.CHASSIS;
    }
    
    static deserialize(data) {
        const chassis = new ChassisComponent(data.chassisType || 'standard', data.quality);
        if (data.position) {
            chassis.setPosition(data.position.x, data.position.y, data.position.z);
        }
        return chassis;
    }
}

// 导出到全局
window.TankBuilder = TankBuilder;
window.ChassisComponent = ChassisComponent;