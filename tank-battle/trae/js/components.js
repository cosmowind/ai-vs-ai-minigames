// 坦克组件系统

// 基础组件类
class Component {
    constructor(type, name, quality = QUALITY.COMMON) {
        this.id = Utils.generateId();
        this.type = type; // 'engine' 或 'armor'
        this.name = name;
        this.quality = quality;
        this.weight = 0;
        this.health = 0;
        this.maxHealth = 0;
        this.color = Utils.getQualityColor(quality);
        
        // 组件状态
        this.isDamaged = false;
        this.isDestroyed = false;
    }

    // 获取品质加成系数
    getQualityMultiplier() {
        return Utils.getQualityMultiplier(this.quality);
    }

    // 受到伤害
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.isDamaged = this.health < this.maxHealth;
        this.isDestroyed = this.health <= 0;
        
        if (this.isDestroyed) {
            Utils.eventSystem.emit('componentDestroyed', this);
        }
        
        return this.isDestroyed;
    }

    // 修复组件
    repair(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.isDamaged = this.health < this.maxHealth;
        this.isDestroyed = false;
    }

    // 获取组件信息
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            quality: this.quality,
            qualityName: Utils.getQualityName(this.quality),
            weight: this.weight,
            health: this.health,
            maxHealth: this.maxHealth,
            isDamaged: this.isDamaged,
            isDestroyed: this.isDestroyed
        };
    }
}

// 引擎组件类
class Engine extends Component {
    constructor(name, quality = QUALITY.COMMON) {
        super('engine', name, quality);
        
        // 基础属性
        this.basePower = 100;
        this.baseWeight = 50;
        
        // 计算实际属性
        const multiplier = this.getQualityMultiplier();
        this.power = this.basePower * multiplier;
        this.weight = this.baseWeight * multiplier;
        this.health = this.weight * 2;
        this.maxHealth = this.health;
    }

    // 获取引擎功率（考虑损坏状态）
    getEffectivePower() {
        if (this.isDestroyed) return 0;
        const healthRatio = this.health / this.maxHealth;
        return this.power * healthRatio;
    }

    // 获取最大速度
    getMaxSpeed() {
        return this.getEffectivePower() * 0.5;
    }
}

// 装甲组件类
class Armor extends Component {
    constructor(name, quality = QUALITY.COMMON) {
        super('armor', name, quality);
        
        // 基础属性
        this.baseDefense = 50;
        this.baseWeight = 30;
        
        // 计算实际属性
        const multiplier = this.getQualityMultiplier();
        this.defense = this.baseDefense * multiplier;
        this.weight = this.baseWeight * multiplier;
        this.health = this.defense * 4;
        this.maxHealth = this.health;
    }

    // 获取有效防御力
    getEffectiveDefense() {
        if (this.isDestroyed) return 0;
        const healthRatio = this.health / this.maxHealth;
        return this.defense * healthRatio;
    }

    // 减少伤害
    reduceDamage(damage) {
        const defense = this.getEffectiveDefense();
        return Math.max(0, damage - defense * 0.1);
    }
}

// 组件管理器
class ComponentManager {
    constructor() {
        this.components = {
            engines: [],
            armors: []
        };
        
        this.initializeComponents();
    }

    // 初始化默认组件
    initializeComponents() {
        // 引擎组件
        this.components.engines = [
            new Engine('标准引擎', QUALITY.COMMON),
            new Engine('改进引擎', QUALITY.UNCOMMON),
            new Engine('涡轮引擎', QUALITY.RARE),
            new Engine('量子引擎', QUALITY.EPIC),
            new Engine('反物质引擎', QUALITY.LEGENDARY)
        ];

        // 装甲组件
        this.components.armors = [
            new Armor('轻型装甲', QUALITY.COMMON),
            new Armor('中型装甲', QUALITY.UNCOMMON),
            new Armor('重型装甲', QUALITY.RARE),
            new Armor('复合装甲', QUALITY.EPIC),
            new Armor('纳米装甲', QUALITY.LEGENDARY)
        ];
    }

    async init() {
        console.log('Initializing ComponentManager...');
        return Promise.resolve();
    }

    // 获取所有引擎
    getEngines() {
        return this.components.engines;
    }

    // 获取所有装甲
    getArmors() {
        return this.components.armors;
    }

    // 通过ID获取组件
    getComponentById(id) {
        const allComponents = [...this.components.engines, ...this.components.armors];
        return allComponents.find(comp => comp.id === id);
    }

    // 获取组件列表（按品质排序）
    getComponentsByType(type) {
        if (type === 'engine') {
            return this.components.engines.slice().sort((a, b) => b.quality - a.quality);
        } else if (type === 'armor') {
            return this.components.armors.slice().sort((a, b) => b.quality - a.quality);
        }
        return [];
    }

    // 创建组件实例
    createInstance(type, name, quality) {
        if (type === 'engine') {
            return new Engine(name, quality);
        } else if (type === 'armor') {
            return new Armor(name, quality);
        }
        return null;
    }

    // 保存组件配置
    saveConfiguration(config) {
        const data = {
            engineId: config.engine?.id,
            armorId: config.armor?.id,
            timestamp: Date.now()
        };
        Utils.storage.save('tankConfig', data);
    }

    // 加载组件配置
    loadConfiguration() {
        const data = Utils.storage.load('tankConfig');
        if (!data) return null;

        const config = {};
        if (data.engineId) {
            config.engine = this.getComponentById(data.engineId);
        }
        if (data.armorId) {
            config.armor = this.getComponentById(data.armorId);
        }

        return config;
    }
}

// 坦克配置类
class TankConfiguration {
    constructor() {
        this.engine = null;
        this.armors = [];
        this.totalWeight = 0;
        this.totalHealth = 0;
        this.maxSpeed = 0;
        this.acceleration = 0;
    }

    // 设置引擎
    setEngine(engine) {
        this.engine = engine;
        this.calculateStats();
    }

    // 添加装甲
    addArmor(armor) {
        this.armors.push(armor);
        this.calculateStats();
    }

    // 移除装甲
    removeArmor(index) {
        if (index >= 0 && index < this.armors.length) {
            this.armors.splice(index, 1);
            this.calculateStats();
        }
    }

    // 计算总属性
    calculateStats() {
        this.totalWeight = 0;
        this.totalHealth = 0;

        // 引擎重量和血量
        if (this.engine) {
            this.totalWeight += this.engine.weight;
            this.totalHealth += this.engine.maxHealth;
        }

        // 装甲重量和血量
        this.armors.forEach(armor => {
            this.totalWeight += armor.weight;
            this.totalHealth += armor.maxHealth;
        });

        // 计算最大速度
        if (this.engine) {
            this.maxSpeed = this.engine.getMaxSpeed() / Math.max(1, this.totalWeight * 0.01);
            this.acceleration = this.engine.getEffectivePower() / Math.max(1, this.totalWeight);
        } else {
            this.maxSpeed = 0;
            this.acceleration = 0;
        }
    }

    // 获取总防御力
    getTotalDefense() {
        return this.armors.reduce((total, armor) => total + armor.getEffectiveDefense(), 0);
    }

    // 获取有效属性（考虑组件损坏）
    getEffectiveStats() {
        let effectiveWeight = 0;
        let effectiveHealth = 0;
        let effectiveDefense = 0;
        let effectivePower = 0;

        if (this.engine && !this.engine.isDestroyed) {
            effectiveWeight += this.engine.weight;
            effectiveHealth += this.engine.health;
            effectivePower += this.engine.getEffectivePower();
        }

        this.armors.forEach(armor => {
            if (!armor.isDestroyed) {
                effectiveWeight += armor.weight;
                effectiveHealth += armor.health;
                effectiveDefense += armor.getEffectiveDefense();
            }
        });

        const effectiveMaxSpeed = effectivePower * 0.5 / Math.max(1, effectiveWeight * 0.01);
        const effectiveAcceleration = effectivePower / Math.max(1, effectiveWeight);

        return {
            weight: effectiveWeight,
            health: effectiveHealth,
            defense: effectiveDefense,
            maxSpeed: effectiveMaxSpeed,
            acceleration: effectiveAcceleration
        };
    }

    // 受到伤害
    takeDamage(damage) {
        // 随机选择一个装甲承受伤害
        const activeArmors = this.armors.filter(armor => !armor.isDestroyed);
        if (activeArmors.length > 0) {
            const targetArmor = activeArmors[Math.floor(Math.random() * activeArmors.length)];
            const reducedDamage = targetArmor.reduceDamage(damage);
            return targetArmor.takeDamage(reducedDamage);
        }

        // 如果没有装甲，伤害传递给引擎
        if (this.engine && !this.engine.isDestroyed) {
            return this.engine.takeDamage(damage);
        }

        return true; // 坦克被摧毁
    }

    // 获取配置信息
    getInfo() {
        return {
            engine: this.engine?.getInfo() || null,
            armors: this.armors.map(armor => armor.getInfo()),
            totalWeight: this.totalWeight,
            totalHealth: this.totalHealth,
            maxSpeed: this.maxSpeed,
            acceleration: this.acceleration,
            effectiveStats: this.getEffectiveStats()
        };
    }
}

// 创建全局组件管理器实例
window.componentManager = new ComponentManager();