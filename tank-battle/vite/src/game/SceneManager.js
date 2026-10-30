import * as THREE from 'three';

/**
 * 场景管理器
 * 负责Three.js场景的管理和优化
 */
export class SceneManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // 场景对象分组
        this.groups = {
            tanks: new THREE.Group(),
            components: new THREE.Group(),
            effects: new THREE.Group(),
            ui: new THREE.Group(),
            environment: new THREE.Group()
        };

        // 添加分组到场景
        Object.values(this.groups).forEach(group => {
            this.scene.add(group);
        });

        // 性能优化
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
    }

    /**
     * 添加坦克到场景
     */
    addTank(tank) {
        this.groups.tanks.add(tank.mesh);
    }

    /**
     * 移除坦克从场景
     */
    removeTank(tank) {
        this.groups.tanks.remove(tank.mesh);
    }

    /**
     * 添加组件到场景
     */
    addComponent(component) {
        this.groups.components.add(component.mesh);
    }

    /**
     * 移除组件从场景
     */
    removeComponent(component) {
        this.groups.components.remove(component.mesh);
    }

    /**
     * 添加特效到场景
     */
    addEffect(effect) {
        this.groups.effects.add(effect.mesh);
    }

    /**
     * 移除特效从场景
     */
    removeEffect(effect) {
        this.groups.effects.remove(effect.mesh);
    }

    /**
     * 添加环境对象到场景
     */
    addEnvironmentObject(object) {
        this.groups.environment.add(object);
    }

    /**
     * 清空场景
     */
    clear() {
        Object.values(this.groups).forEach(group => {
            while (group.children.length > 0) {
                const child = group.children[0];
                group.remove(child);

                // 清理几何体和材质
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }

    /**
     * 更新视锥剔除
     * 优化渲染性能
     */
    updateFrustumCulling() {
        this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);

        // 对所有对象进行视锥剔除
        this.scene.traverse((object) => {
            if (object.isMesh) {
                object.visible = this.frustum.intersectsObject(object);
            }
        });
    }

    /**
     * 获取场景统计信息
     */
    getStats() {
        const stats = {
            totalObjects: 0,
            visibleObjects: 0,
            tanks: this.groups.tanks.children.length,
            components: this.groups.components.children.length,
            effects: this.groups.effects.children.length,
            environment: this.groups.environment.children.length
        };

        // 统计可见对象
        this.scene.traverse((object) => {
            stats.totalObjects++;
            if (object.visible) {
                stats.visibleObjects++;
            }
        });

        return stats;
    }

    /**
     * 设置场景环境
     */
    setEnvironment(settings) {
        // 设置背景色
        if (settings.backgroundColor) {
            this.scene.background = new THREE.Color(settings.backgroundColor);
        }

        // 设置雾效果
        if (settings.fog) {
            this.scene.fog = new THREE.Fog(
                settings.fog.color,
                settings.fog.near,
                settings.fog.far
            );
        } else {
            this.scene.fog = null;
        }
    }

    /**
     * 创建天空盒
     */
    createSkybox(textureUrls) {
        const loader = new THREE.TextureLoader();
        const textures = textureUrls.map(url => loader.load(url));

        const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
        const skyboxMaterial = textures.map(texture => {
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            return new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            });
        });

        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.addEnvironmentObject(skybox);

        return skybox;
    }

    /**
     * 清理资源
     */
    dispose() {
        this.clear();

        // 清理分组
        Object.values(this.groups).forEach(group => {
            this.scene.remove(group);
        });
    }
}


