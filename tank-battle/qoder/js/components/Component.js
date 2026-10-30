/**
 * 抽象组件基类
 * 定义所有坦克组件的通用接口和基础功能
 */
class Component {
    constructor(name, weight, quality = 'common') {
        if (this.constructor === Component) {
            throw new Error('抽象类不能直接实例化');
        }
        
        this.id = this.generateId();
        this.name = name;
        this.weight = weight;
        this.quality = quality;
        
        // 3D相关属性
        this.mesh = null;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // 组件状态
        this.isAttached = false;
        this.parentTank = null;
        
        // 基础属性
        this.baseStats = {};
        this.modifiedStats = {};
        
        this.init();
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 初始化组件（子类可重写）
     */
    init() {
        this.calculateModifiedStats();
    }
    
    /**
     * 创建3D网格（抽象方法，子类必须实现）
     */
    createMesh() {
        throw new Error('子类必须实现createMesh方法');
    }
    
    /**
     * 获取组件类型（抽象方法，子类必须实现）
     */
    getType() {
        throw new Error('子类必须实现getType方法');
    }
    
    /**
     * 获取组件描述
     */
    getDescription() {
        return `${this.name} - ${this.quality}品质 - ${this.weight}kg`;
    }
    
    /**
     * 计算修正后的属性（基于品质）
     */
    calculateModifiedStats() {
        const qualityMultiplier = this.getQualityMultiplier();
        this.modifiedStats = {};
        
        // 应用品质加成到基础属性
        for (const [key, value] of Object.entries(this.baseStats)) {
            if (typeof value === 'number') {
                this.modifiedStats[key] = value * qualityMultiplier;
            } else {
                this.modifiedStats[key] = value;
            }
        }
    }
    
    /**
     * 获取品质倍率
     */
    getQualityMultiplier() {
        const multipliers = {
            'common': 1.0,
            'rare': 1.2,
            'epic': 1.5,
            'legendary': 2.0
        };
        
        return multipliers[this.quality] || 1.0;
    }
    
    /**
     * 获取品质颜色
     */
    getQualityColor() {
        const colors = {
            'common': 0xffffff,   // 白色
            'rare': 0x00ff00,     // 绿色
            'epic': 0x0066ff,     // 蓝色
            'legendary': 0xff6600  // 橙色
        };
        
        return colors[this.quality] || colors.common;
    }
    
    /**
     * 获取品质发光色
     */
    getQualityEmissive() {
        const emissives = {
            'common': 0x000000,
            'rare': 0x003300,
            'epic': 0x001133,
            'legendary': 0x443300
        };
        
        return emissives[this.quality] || emissives.common;
    }
    
    /**
     * 创建材质
     */
    createMaterial() {
        return new THREE.MeshPhongMaterial({
            color: this.getQualityColor(),
            emissive: this.getQualityEmissive(),
            shininess: this.quality === 'legendary' ? 100 : 30,
            transparent: false,
            opacity: 1.0
        });
    }
    
    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    /**
     * 设置旋转
     */
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.mesh) {
            this.mesh.rotation.copy(this.rotation);
        }
    }
    
    /**
     * 附加到坦克
     */
    attachToTank(tank) {
        if (this.isAttached) {
            throw new Error('组件已经被附加到坦克');
        }
        
        this.parentTank = tank;
        this.isAttached = true;
        this.onAttach(tank);
    }
    
    /**
     * 从坦克分离
     */
    detachFromTank() {
        if (!this.isAttached) return;
        
        const tank = this.parentTank;
        this.parentTank = null;
        this.isAttached = false;
        this.onDetach(tank);
    }
    
    /**
     * 附加事件回调（子类可重写）
     */
    onAttach(tank) {
        console.log(`组件 ${this.name} 附加到坦克`);
    }
    
    /**
     * 分离事件回调（子类可重写）
     */
    onDetach(tank) {
        console.log(`组件 ${this.name} 从坦克分离`);
    }
    
    /**
     * 更新组件状态（子类可重写）
     */
    update(deltaTime) {
        // 基类默认不执行任何操作
    }
    
    /**
     * 获取组件信息
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.getType(),
            weight: this.weight,
            quality: this.quality,
            isAttached: this.isAttached,
            baseStats: this.baseStats,
            modifiedStats: this.modifiedStats,
            description: this.getDescription()
        };
    }
    
    /**
     * 复制组件（创建新实例）
     */
    clone() {
        const ComponentClass = this.constructor;
        const cloned = new ComponentClass(this.name, this.weight, this.quality);
        
        // 复制基础属性
        cloned.baseStats = { ...this.baseStats };
        cloned.calculateModifiedStats();
        
        return cloned;
    }
    
    /**
     * 序列化组件数据
     */
    serialize() {
        return {
            type: this.constructor.name,
            name: this.name,
            weight: this.weight,
            quality: this.quality,
            baseStats: this.baseStats,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
            }
        };
    }
    
    /**
     * 反序列化组件数据
     */
    static deserialize(data) {
        // 这里需要根据组件类型创建相应的实例
        // 具体实现在各个子类中完成
        throw new Error('子类必须实现反序列化方法');
    }
    
    /**
     * 清理资源
     */
    dispose() {
        if (this.mesh) {
            // 清理几何体
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            
            // 清理材质
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            
            // 从场景移除
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }
        
        this.mesh = null;
        this.parentTank = null;
        this.isAttached = false;
    }
}

/**
 * 组件类型枚举
 */
const ComponentTypes = {
    ENGINE: 'engine',
    ARMOR: 'armor',
    WEAPON: 'weapon',
    CHASSIS: 'chassis',
    SPECIAL: 'special'
};

/**
 * 品质类型枚举
 */
const QualityTypes = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// 导出到全局
window.Component = Component;
window.ComponentTypes = ComponentTypes;
window.QualityTypes = QualityTypes;