/**
 * 品质系统类
 * 管理组件的品质等级、颜色、特效和属性加成
 */
class QualitySystem {
    constructor() {
        this.qualityConfigs = this.initializeQualityConfigs();
        this.materialCache = new Map(); // 材质缓存
        this.particleEffects = new Map(); // 粒子效果缓存
    }
    
    /**
     * 初始化品质配置
     */
    initializeQualityConfigs() {
        return {
            common: {
                name: '普通',
                color: 0xffffff,
                emissive: 0x000000,
                multiplier: 1.0,
                rarity: 70, // 掉落概率权重
                shininess: 30,
                glowIntensity: 0,
                particleEffect: null,
                description: '标准品质组件'
            },
            rare: {
                name: '稀有',
                color: 0x00ff00,
                emissive: 0x003300,
                multiplier: 1.2,
                rarity: 20,
                shininess: 50,
                glowIntensity: 0.1,
                particleEffect: 'greenGlow',
                description: '性能提升20%的优质组件'
            },
            epic: {
                name: '史诗',
                color: 0x0066ff,
                emissive: 0x001133,
                multiplier: 1.5,
                rarity: 8,
                shininess: 70,
                glowIntensity: 0.2,
                particleEffect: 'blueAura',
                description: '性能提升50%的精良组件'
            },
            legendary: {
                name: '传说',
                color: 0xff6600,
                emissive: 0x443300,
                multiplier: 2.0,
                rarity: 2,
                shininess: 100,
                glowIntensity: 0.3,
                particleEffect: 'goldenRadiance',
                description: '性能翻倍的传奇组件'
            }
        };
    }
    
    /**
     * 获取品质配置
     */
    getQualityConfig(quality) {
        return this.qualityConfigs[quality] || this.qualityConfigs.common;
    }
    
    /**
     * 创建品质材质
     */
    createQualityMaterial(quality, baseColor = null) {
        const cacheKey = `${quality}_${baseColor || 'default'}`;
        
        if (this.materialCache.has(cacheKey)) {
            return this.materialCache.get(cacheKey).clone();
        }
        
        const config = this.getQualityConfig(quality);
        const materialColor = baseColor || config.color;
        
        const material = new THREE.MeshPhongMaterial({
            color: materialColor,
            emissive: config.emissive,
            emissiveIntensity: config.glowIntensity,
            shininess: config.shininess,
            transparent: config.glowIntensity > 0,
            opacity: 0.95
        });
        
        this.materialCache.set(cacheKey, material);
        return material.clone();
    }
    
    /**
     * 创建发光轮廓效果
     */
    createGlowEffect(mesh, quality) {
        const config = this.getQualityConfig(quality);
        
        if (config.glowIntensity === 0) return null;
        
        // 创建发光轮廓
        const glowGeometry = mesh.geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: config.glowIntensity * 0.3,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.05); // 稍微放大
        
        return glowMesh;
    }
    
    /**
     * 创建粒子特效
     */
    createParticleEffect(position, quality) {
        const config = this.getQualityConfig(quality);
        
        if (!config.particleEffect) return null;
        
        const particleCount = this.getParticleCount(quality);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(config.color);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 随机位置（围绕组件）
            positions[i3] = position.x + (Math.random() - 0.5) * 2;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 2;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
            
            // 颜色
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // 大小
            sizes[i] = Math.random() * 0.1 + 0.05;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: config.glowIntensity,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData = {
            quality: quality,
            animationSpeed: config.glowIntensity * 2,
            lifeTime: 5000 // 5秒生命周期
        };
        
        return particles;
    }
    
    /**
     * 获取粒子数量
     */
    getParticleCount(quality) {
        const counts = {
            common: 0,
            rare: 20,
            epic: 50,
            legendary: 100
        };
        return counts[quality] || 0;
    }
    
    /**
     * 随机生成品质
     */
    generateRandomQuality() {
        const random = Math.random() * 100;
        let cumulativeRarity = 0;
        
        // 从稀有到普通检查
        const qualities = ['legendary', 'epic', 'rare', 'common'];
        
        for (const quality of qualities) {
            cumulativeRarity += this.qualityConfigs[quality].rarity;
            if (random <= cumulativeRarity) {
                return quality;
            }
        }
        
        return 'common';
    }
    
    /**
     * 基于条件生成品质（可以提高稀有度）
     */
    generateQualityWithBonus(luckBonus = 0) {
        // 幸运加成会降低高品质的掉落阈值
        const configs = { ...this.qualityConfigs };
        
        if (luckBonus > 0) {
            configs.legendary.rarity += luckBonus;
            configs.epic.rarity += luckBonus * 0.8;
            configs.rare.rarity += luckBonus * 0.6;
        }
        
        const random = Math.random() * 100;
        let cumulativeRarity = 0;
        
        const qualities = ['legendary', 'epic', 'rare', 'common'];
        
        for (const quality of qualities) {
            cumulativeRarity += configs[quality].rarity;
            if (random <= cumulativeRarity) {
                return quality;
            }
        }
        
        return 'common';
    }
    
    /**
     * 升级组件品质
     */
    upgradeQuality(currentQuality) {
        const qualityOrder = ['common', 'rare', 'epic', 'legendary'];
        const currentIndex = qualityOrder.indexOf(currentQuality);
        
        if (currentIndex < 0 || currentIndex >= qualityOrder.length - 1) {
            return currentQuality; // 已经是最高品质或无效品质
        }
        
        return qualityOrder[currentIndex + 1];
    }
    
    /**
     * 计算品质价值
     */
    calculateQualityValue(quality, baseValue = 100) {
        const config = this.getQualityConfig(quality);
        return Math.floor(baseValue * config.multiplier * (1 + config.glowIntensity));
    }
    
    /**
     * 获取品质描述文本
     */
    getQualityDescription(quality) {
        const config = this.getQualityConfig(quality);
        return `${config.name} - ${config.description}`;
    }
    
    /**
     * 创建品质UI元素
     */
    createQualityUIElement(quality, componentName) {
        const config = this.getQualityConfig(quality);
        
        const element = document.createElement('div');
        element.className = `quality-item quality-${quality}`;
        
        element.innerHTML = `
            <div class="quality-header">
                <span class="quality-name">${config.name}</span>
                <span class="component-name">${componentName}</span>
            </div>
            <div class="quality-stats">
                <span class="multiplier">+${((config.multiplier - 1) * 100).toFixed(0)}% 性能</span>
            </div>
            <div class="quality-description">${config.description}</div>
        `;
        
        // 设置边框颜色
        element.style.borderLeft = `4px solid #${config.color.toString(16).padStart(6, '0')}`;
        
        // 添加发光效果
        if (config.glowIntensity > 0) {
            element.style.boxShadow = `0 0 10px rgba(${
                (config.color >> 16) & 255
            }, ${
                (config.color >> 8) & 255
            }, ${
                config.color & 255
            }, ${config.glowIntensity})`;
        }
        
        return element;
    }
    
    /**
     * 更新粒子效果动画
     */
    updateParticleEffects(deltaTime) {
        this.particleEffects.forEach((effect, key) => {
            if (!effect || !effect.userData) return;
            
            const userData = effect.userData;
            userData.lifeTime -= deltaTime * 1000;
            
            // 粒子运动动画
            const positions = effect.geometry.attributes.position.array;
            const animSpeed = userData.animationSpeed;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * animSpeed * deltaTime;
            }
            
            effect.geometry.attributes.position.needsUpdate = true;
            
            // 移除过期效果
            if (userData.lifeTime <= 0) {
                this.removeParticleEffect(key);
            }
        });
    }
    
    /**
     * 添加粒子效果到管理器
     */
    addParticleEffect(key, effect) {
        this.particleEffects.set(key, effect);
    }
    
    /**
     * 移除粒子效果
     */
    removeParticleEffect(key) {
        const effect = this.particleEffects.get(key);
        if (effect) {
            if (effect.parent) {
                effect.parent.remove(effect);
            }
            
            // 清理几何体和材质
            if (effect.geometry) effect.geometry.dispose();
            if (effect.material) effect.material.dispose();
            
            this.particleEffects.delete(key);
        }
    }
    
    /**
     * 应用品质效果到组件
     */
    applyQualityEffects(component) {
        if (!component.mesh) return;
        
        const quality = component.quality;
        const config = this.getQualityConfig(quality);
        
        // 应用材质
        component.mesh.material = this.createQualityMaterial(quality);
        
        // 添加发光效果
        if (config.glowIntensity > 0) {
            const glowEffect = this.createGlowEffect(component.mesh, quality);
            if (glowEffect) {
                component.mesh.add(glowEffect);
            }
        }
        
        // 添加粒子效果
        const particleEffect = this.createParticleEffect(component.position, quality);
        if (particleEffect) {
            const effectKey = `${component.id}_particles`;
            this.addParticleEffect(effectKey, particleEffect);
            
            if (window.gameEngine && window.gameEngine.scene) {
                window.gameEngine.scene.add(particleEffect);
            }
        }
    }
    
    /**
     * 获取所有品质类型
     */
    getAllQualities() {
        return Object.keys(this.qualityConfigs);
    }
    
    /**
     * 清理资源
     */
    dispose() {
        // 清理材质缓存
        this.materialCache.forEach(material => {
            material.dispose();
        });
        this.materialCache.clear();
        
        // 清理粒子效果
        this.particleEffects.forEach((effect, key) => {
            this.removeParticleEffect(key);
        });
        
        console.log('🧹 品质系统资源清理完成');
    }
}

/**
 * 品质比较器
 */
class QualityComparator {
    /**
     * 比较两个品质的等级
     */
    static compare(quality1, quality2) {
        const order = ['common', 'rare', 'epic', 'legendary'];
        const index1 = order.indexOf(quality1);
        const index2 = order.indexOf(quality2);
        
        return index1 - index2;
    }
    
    /**
     * 检查是否为更高品质
     */
    static isHigher(quality1, quality2) {
        return this.compare(quality1, quality2) > 0;
    }
    
    /**
     * 获取最高品质
     */
    static getHighest(qualities) {
        return qualities.reduce((highest, current) => {
            return this.isHigher(current, highest) ? current : highest;
        }, 'common');
    }
}

// 导出到全局
window.QualitySystem = QualitySystem;
window.QualityComparator = QualityComparator;