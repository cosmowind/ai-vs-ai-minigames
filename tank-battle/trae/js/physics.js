// 简化物理系统管理器 - 无Cannon.js依赖
class PhysicsManager {
    constructor() {
        this.world = null;
        this.tanks = [];
        this.debugMode = false;
        this.debugRenderer = null;
        this.bodies = [];
    }

    // 初始化物理世界
    async init() {
        console.log('Initializing simplified physics world...');
        
        // 创建简化的物理世界
        this.world = {
            gravity: { x: 0, y: -9.82, z: 0 },
            bodies: this.bodies,
            addBody: (body) => this.bodies.push(body),
            removeBody: (body) => {
                const index = this.bodies.indexOf(body);
                if (index > -1) this.bodies.splice(index, 1);
            },
            step: (dt) => this.updatePhysics(dt)
        };
        
        // 创建地面
        this.createGround();
        
        console.log('Simplified physics world initialized');
        return Promise.resolve();
    }

    // 简化的物理更新
    updatePhysics(dt) {
        this.bodies.forEach(body => {
            if (body.mass > 0) {
                // 简单的重力
                body.velocity.y += this.world.gravity.y * dt;
                
                // 更新位置
                body.position.x += body.velocity.x * dt;
                body.position.y += body.velocity.y * dt;
                body.position.z += body.velocity.z * dt;
                
                // 简单的地面碰撞
                if (body.position.y < 0.5) {
                    body.position.y = 0.5;
                    body.velocity.y = 0;
                }
                
                // 阻尼
                body.velocity.x *= 0.98;
                body.velocity.z *= 0.98;
            }
        });
    }

    // 创建地面（简化版）
    createGround() {
        this.groundBody = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            mass: 0
        };
        this.bodies.push(this.groundBody);
    }

    // 添加坦克到物理世界
    addTank(tank) {
        if (tank.body) {
            this.bodies.push(tank.body);
        }
    }

    // 移除坦克从物理世界
    removeTank(tank) {
        this.world.removeBody(tank.body);
    }

    // 更新物理世界
    update(deltaTime) {
        if (this.world) {
            this.world.step(deltaTime);
        }
    }

    // 重置物理世界
    reset() {
        // 移除所有动态物体
        const bodiesToRemove = this.bodies.filter(body => body.mass > 0);
        bodiesToRemove.forEach(body => {
            this.world.removeBody(body);
        });
        
        // 重置地面
        if (this.groundBody) {
            this.groundBody.position = { x: 0, y: 0, z: 0 };
            this.groundBody.velocity = { x: 0, y: 0, z: 0 };
        }
    }

    // 清理资源
    dispose() {
        this.bodies.length = 0;
        this.world = null;
    }
}

// 简化物理工具类
class PhysicsUtils {
    // 计算刚体的动能
    static calculateKineticEnergy(body) {
        const v = body.velocity;
        const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return 0.5 * body.mass * speed * speed;
    }

    // 应用冲击力
    static applyImpulse(body, impulse, relativePoint) {
        body.velocity.x += impulse[0] / body.mass;
        body.velocity.y += impulse[1] / body.mass;
        body.velocity.z += impulse[2] / body.mass;
    }

    // 检测地面接触
    static isOnGround(body, groundHeight = 0) {
        return Math.abs(body.position.y - groundHeight) < 0.1;
    }
}

// 创建全局物理管理器
window.physicsManager = new PhysicsManager();