import * as CANNON from 'cannon-es';

/**
 * 物理管理器
 * 负责Cannon.js物理世界的管理和优化
 */
export class PhysicsManager {
    constructor(world) {
        this.world = world;
        this.fixedTimeStep = 1.0 / 60.0; // 60 FPS
        this.maxSubSteps = 10;

        // 物理对象映射
        this.bodyToObject = new Map();
        this.objectToBody = new Map();

        // 性能统计
        this.stats = {
            bodies: 0,
            contacts: 0,
            updateTime: 0
        };
    }

    /**
     * 更新物理世界
     */
    update(deltaTime) {
        const startTime = performance.now();

        // 更新物理模拟
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);

        // 同步物理对象
        this.syncPhysicsObjects();

        // 更新统计信息
        this.stats.bodies = this.world.bodies.length;
        this.stats.contacts = this.world.contacts.length;
        this.stats.updateTime = performance.now() - startTime;
    }

    /**
     * 添加物理对象
     */
    addBody(body, gameObject = null) {
        this.world.addBody(body);

        if (gameObject) {
            this.bodyToObject.set(body, gameObject);
            this.objectToBody.set(gameObject, body);
        }
    }

    /**
     * 移除物理对象
     */
    removeBody(body) {
        this.world.removeBody(body);

        const gameObject = this.bodyToObject.get(body);
        if (gameObject) {
            this.bodyToObject.delete(body);
            this.objectToBody.delete(gameObject);
        }
    }

    /**
     * 同步物理对象位置和旋转
     */
    syncPhysicsObjects() {
        this.world.bodies.forEach(body => {
            const gameObject = this.bodyToObject.get(body);
            if (gameObject && gameObject.mesh) {
                // 同步位置
                gameObject.mesh.position.copy(body.position);

                // 同步旋转
                gameObject.mesh.quaternion.copy(body.quaternion);
            }
        });
    }

    /**
     * 应用力到对象
     */
    applyForce(body, force, worldPoint = null) {
        if (worldPoint) {
            body.applyForce(force, worldPoint);
        } else {
            body.applyForce(force);
        }
    }

    /**
     * 应用冲量到对象
     */
    applyImpulse(body, impulse, worldPoint = null) {
        if (worldPoint) {
            body.applyImpulse(impulse, worldPoint);
        } else {
            body.applyImpulse(impulse);
        }
    }

    /**
     * 设置对象位置
     */
    setPosition(body, position) {
        body.position.copy(position);
    }

    /**
     * 设置对象旋转
     */
    setQuaternion(body, quaternion) {
        body.quaternion.copy(quaternion);
    }

    /**
     * 射线检测
     */
    raycast(from, to, options = {}) {
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(from, to, options, result);
        return result;
    }

    /**
     * 范围检测
     */
    queryAABB(aabb, bodies = []) {
        this.world.broadphase.aabbQuery(this.world, aabb, bodies);
        return bodies;
    }

    /**
     * 创建物理材质
     */
    createMaterial(options = {}) {
        return new CANNON.Material(options);
    }

    /**
     * 创建接触材质
     */
    createContactMaterial(material1, material2, options = {}) {
        const contactMaterial = new CANNON.ContactMaterial(material1, material2, options);
        this.world.addContactMaterial(contactMaterial);
        return contactMaterial;
    }

    /**
     * 设置重力
     */
    setGravity(gravity) {
        this.world.gravity.copy(gravity);
    }

    /**
     * 暂停/恢复物理模拟
     */
    pause(paused = true) {
        this.world.pause = paused;
    }

    /**
     * 获取物理统计信息
     */
    getStats() {
        return {
            ...this.stats,
            constraints: this.world.constraints.length,
            contactMaterials: this.world.contactmaterials.length
        };
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清空物理世界
        while (this.world.bodies.length > 0) {
            this.world.removeBody(this.world.bodies[0]);
        }

        while (this.world.constraints.length > 0) {
            this.world.removeConstraint(this.world.constraints[0]);
        }

        // 清空映射
        this.bodyToObject.clear();
        this.objectToBody.clear();
    }
}


