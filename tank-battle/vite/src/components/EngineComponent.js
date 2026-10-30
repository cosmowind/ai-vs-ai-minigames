import { TankComponent } from './TankComponent.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 引擎组件
 * 提供坦克的移动动力和承载能力
 */
export class EngineComponent extends TankComponent {
    constructor(name, weight, speedMultiplier, maxLoadWeight) {
        super(name, weight, 'engine', 0x4444ff); // 蓝色

        this.speedMultiplier = speedMultiplier;
        this.maxLoadWeight = maxLoadWeight;

        // 引擎特有属性
        this.isRunning = false;
        this.currentRPM = 0;
        this.maxRPM = 8000;
        this.acceleration = 10 * speedMultiplier;
    }

    /**
     * 创建引擎的外形
     */
    createMesh() {
        // 创建引擎主体（长方体）
        const bodyGeometry = new THREE.BoxGeometry(2.4, 1.2, 3.0);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.9
        });

        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 添加引擎细节
        this.addEngineDetails();

        // 添加标签
        this.addComponentLabel();
    }

    /**
     * 添加引擎细节
     */
    addEngineDetails() {
        // 添加散热片
        const radiatorGeometry = new THREE.BoxGeometry(0.2, 1.0, 2.8);
        const radiatorMaterial = new THREE.MeshLambertMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.7
        });

        const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
        radiator.position.set(-1.1, 0, 0);
        this.mesh.add(radiator);

        // 添加排气管
        const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8);
        const exhaustMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333
        });

        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(1.1, 0.3, -1.0);
        exhaust.rotation.z = Math.PI / 2;
        this.mesh.add(exhaust);

        // 添加引擎盖装饰
        const coverGeometry = new THREE.BoxGeometry(2.2, 0.1, 2.8);
        const coverMaterial = new THREE.MeshLambertMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        });

        const cover = new THREE.Mesh(coverGeometry, coverMaterial);
        cover.position.set(0, 0.6, 0);
        this.mesh.add(cover);
    }

    /**
     * 创建物理形状
     */
    createBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(1.2, 0.6, 1.5));
        this.body = new CANNON.Body({
            mass: this.weight,
            material: new CANNON.Material({
                friction: 0.8,
                restitution: 0.2
            })
        });
        this.body.addShape(shape);
    }

    /**
     * 应用引擎效果
     */
    applyEffect(tank) {
        super.applyEffect(tank);

        // 增加坦克的最大速度
        if (tank.maxSpeed !== undefined) {
            tank.maxSpeed *= this.speedMultiplier;
        }

        // 设置最大承载重量
        if (tank.maxLoad !== undefined) {
            tank.maxLoad = Math.min(tank.maxLoad || Infinity, this.maxLoadWeight);
        }

        // 增加加速度
        if (tank.acceleration !== undefined) {
            tank.acceleration *= this.speedMultiplier;
        }

        console.log(`${this.name} applied: Speed +${((this.speedMultiplier - 1) * 100).toFixed(0)}%, Max Load: ${this.maxLoadWeight}kg`);
    }

    /**
     * 移除引擎效果
     */
    removeEffect(tank) {
        super.removeEffect(tank);

        // 恢复坦克的速度
        if (tank.maxSpeed !== undefined) {
            tank.maxSpeed /= this.speedMultiplier;
        }

        // 重置最大承载重量
        if (tank.maxLoad !== undefined) {
            tank.maxLoad = Infinity; // 或者重新计算
        }

        // 恢复加速度
        if (tank.acceleration !== undefined) {
            tank.acceleration /= this.speedMultiplier;
        }

        console.log(`${this.name} removed: Speed and acceleration restored`);
    }

    /**
     * 启动引擎
     */
    start() {
        this.isRunning = true;
        this.currentRPM = 1000;
        console.log(`${this.name} started`);
    }

    /**
     * 停止引擎
     */
    stop() {
        this.isRunning = false;
        this.currentRPM = 0;
        console.log(`${this.name} stopped`);
    }

    /**
     * 更新引擎状态
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.isRunning) {
            // 模拟引擎转速变化
            const targetRPM = this.isAttached ? 2000 + Math.random() * 3000 : 800;
            this.currentRPM += (targetRPM - this.currentRPM) * deltaTime * 2;
            this.currentRPM = Math.max(800, Math.min(this.maxRPM, this.currentRPM));

            // 根据转速调整视觉效果
            if (this.mesh && this.mesh.material) {
                const intensity = Math.min(1.0, this.currentRPM / 4000);
                this.mesh.material.emissive = new THREE.Color(0x000044).multiplyScalar(intensity * 0.3);
            }
        }
    }

    /**
     * 获取引擎信息
     */
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            speedMultiplier: this.speedMultiplier,
            maxLoadWeight: this.maxLoadWeight,
            isRunning: this.isRunning,
            currentRPM: Math.round(this.currentRPM),
            acceleration: this.acceleration
        };
    }
}

/**
 * 基础引擎
 */
export class BasicEngine extends EngineComponent {
    constructor() {
        super('基础引擎', 10, 1.5, 100);
    }
}

/**
 * 高级引擎
 */
export class AdvancedEngine extends EngineComponent {
    constructor() {
        super('高级引擎', 25, 2.0, 150);
    }
}

/**
 * 超级引擎
 */
export class SuperEngine extends EngineComponent {
    constructor() {
        super('超级引擎', 50, 2.5, 200);
    }
}

/**
 * 终极引擎
 */
export class UltimateEngine extends EngineComponent {
    constructor() {
        super('终极引擎', 100, 3.0, 300);
    }
}


