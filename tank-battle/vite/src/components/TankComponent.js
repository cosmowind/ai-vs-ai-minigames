import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 坦克组件基类
 * 所有坦克组件都继承自这个类
 */
export class TankComponent {
    constructor(name, weight, type, color) {
        this.name = name;
        this.weight = weight;
        this.type = type; // 'engine', 'body', 'weapon', 'auxiliary'
        this.color = color;

        // Three.js 对象
        this.mesh = null;

        // Cannon.js 对象
        this.body = null;

        // 组件状态
        this.isAttached = false;
        this.attachPoint = null;

        // 组件特效
        this.effects = [];

        this.createMesh();
        this.createBody();
    }

    /**
     * 创建Three.js网格
     * 子类需要重写这个方法来定义组件的外形
     */
    createMesh() {
        // 默认创建简单的立方体
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 添加组件标识
        this.addComponentLabel();
    }

    /**
     * 创建Cannon.js刚体
     * 子类需要重写这个方法来定义组件的物理形状
     */
    createBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        this.body = new CANNON.Body({
            mass: this.weight,
            material: new CANNON.Material({
                friction: 0.7,
                restitution: 0.3
            })
        });
        this.body.addShape(shape);
    }

    /**
     * 添加组件标签
     */
    addComponentLabel() {
        // 创建画布纹理作为标签
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // 设置字体和样式
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 7);

        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;

        // 创建精灵
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 1.5, 0);
        sprite.scale.set(2, 0.5, 1);

        this.mesh.add(sprite);
    }

    /**
     * 应用组件效果到坦克
     * 子类需要重写这个方法来实现具体的效果
     */
    applyEffect(tank) {
        // 基础效果：增加重量
        if (tank.totalWeight !== undefined) {
            tank.totalWeight += this.weight;
        }

        console.log(`Applied ${this.name} effect to tank`);
    }

    /**
     * 移除组件效果
     * 子类需要重写这个方法来移除效果
     */
    removeEffect(tank) {
        // 基础效果：减少重量
        if (tank.totalWeight !== undefined) {
            tank.totalWeight -= this.weight;
        }

        console.log(`Removed ${this.name} effect from tank`);
    }

    /**
     * 附加到坦克
     */
    attachTo(tank, position) {
        if (this.isAttached) {
            this.detach();
        }

        this.isAttached = true;
        this.attachPoint = position.clone();

        // 设置位置
        this.mesh.position.copy(position);
        this.body.position.copy(position);

        // 应用效果
        this.applyEffect(tank);

        console.log(`Attached ${this.name} to tank at position`, position);
    }

    /**
     * 从坦克分离
     */
    detach() {
        if (!this.isAttached) {
            return;
        }

        this.isAttached = false;
        const oldAttachPoint = this.attachPoint;
        this.attachPoint = null;

        console.log(`Detached ${this.name} from tank`);
        return oldAttachPoint;
    }

    /**
     * 更新组件
     */
    update(deltaTime) {
        // 更新特效
        this.effects.forEach(effect => effect.update(deltaTime));

        // 移除完成的特效
        this.effects = this.effects.filter(effect => !effect.isFinished);
    }

    /**
     * 销毁组件
     */
    dispose() {
        // 清理Three.js对象
        if (this.mesh) {
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }

        // 清理Cannon.js对象
        if (this.body) {
            // 从世界中移除
            if (this.body.world) {
                this.body.world.removeBody(this.body);
            }
        }

        // 清理特效
        this.effects.forEach(effect => effect.dispose());
        this.effects = [];
    }

    /**
     * 获取组件信息
     */
    getInfo() {
        return {
            name: this.name,
            type: this.type,
            weight: this.weight,
            color: this.color,
            isAttached: this.isAttached
        };
    }

    /**
     * 克隆组件
     */
    clone() {
        const cloned = new this.constructor();
        cloned.name = this.name;
        cloned.weight = this.weight;
        cloned.type = this.type;
        cloned.color = this.color;
        return cloned;
    }
}


