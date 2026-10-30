// 工具函数库

// 颜色常量
const COLORS = {
    // 品质颜色
    COMMON: 0x808080,      // 灰色
    UNCOMMON: 0x00ff00,    // 绿色
    RARE: 0x0080ff,        // 蓝色
    EPIC: 0x8000ff,        // 紫色
    LEGENDARY: 0xff8000,   // 橙色
    
    // 环境颜色
    GROUND: 0x90EE90,      // 浅绿色草地
    SKY: 0x87CEEB,         // 天蓝色
    TANK_BODY: 0x2F4F4F,   // 深灰色坦克主体
    
    // UI颜色
    UI_BG: 0x333333,
    UI_TEXT: 0xffffff
};

// 品质枚举
const QUALITY = {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 4
};

// 品质名称映射
const QUALITY_NAMES = {
    [QUALITY.COMMON]: '普通',
    [QUALITY.UNCOMMON]: '优秀',
    [QUALITY.RARE]: '稀有',
    [QUALITY.EPIC]: '史诗',
    [QUALITY.LEGENDARY]: '传说'
};

// 品质系数映射
const QUALITY_MULTIPLIERS = {
    [QUALITY.COMMON]: 1.0,
    [QUALITY.UNCOMMON]: 1.2,
    [QUALITY.RARE]: 1.5,
    [QUALITY.EPIC]: 2.0,
    [QUALITY.LEGENDARY]: 3.0
};

// 工具函数
const Utils = {
    // 创建随机ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // 线性插值
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // 限制数值范围
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // 距离计算
    distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    // 向量归一化
    normalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
        if (length > 0) {
            return {
                x: vector.x / length,
                y: vector.y / length,
                z: vector.z / length
            };
        }
        return { x: 0, y: 0, z: 0 };
    },

    // 角度转弧度
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    // 弧度转角度
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    },

    // 随机颜色
    randomColor() {
        return Math.floor(Math.random() * 0xffffff);
    },

    // 深度拷贝对象
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    },

    // 格式化数字
    formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },

    // 获取品质颜色
    getQualityColor(quality) {
        switch(quality) {
            case QUALITY.COMMON: return COLORS.COMMON;
            case QUALITY.UNCOMMON: return COLORS.UNCOMMON;
            case QUALITY.RARE: return COLORS.RARE;
            case QUALITY.EPIC: return COLORS.EPIC;
            case QUALITY.LEGENDARY: return COLORS.LEGENDARY;
            default: return COLORS.COMMON;
        }
    },

    // 获取品质名称
    getQualityName(quality) {
        return QUALITY_NAMES[quality] || '未知';
    },

    // 计算品质加成
    getQualityMultiplier(quality) {
        return QUALITY_MULTIPLIERS[quality] || 1.0;
    },

    // 创建文本精灵
    createTextSprite(text, color = 0xffffff, size = 1) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // 设置画布大小
        const fontSize = 24 * size;
        context.font = `Bold ${fontSize}px Arial`;
        
        // 获取文本宽度
        const textWidth = context.measureText(text).width;
        canvas.width = textWidth + 20;
        canvas.height = fontSize + 10;
        
        // 重新设置字体（因为改变了画布大小）
        context.font = `Bold ${fontSize}px Arial`;
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建精灵材质
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // 设置精灵大小
        sprite.scale.set(canvas.width / 100 * size, canvas.height / 100 * size, 1);
        
        return sprite;
    },

    // 音效管理器
    soundManager: {
        sounds: {},
        volume: 0.5,

        // 加载音效
        load(name, url) {
            const audio = new Audio(url);
            audio.volume = this.volume;
            this.sounds[name] = audio;
        },

        // 播放音效
        play(name, volume = 1) {
            if (this.sounds[name]) {
                const audio = this.sounds[name].cloneNode();
                audio.volume = this.volume * volume;
                audio.play();
            }
        },

        // 设置音量
        setVolume(volume) {
            this.volume = Utils.clamp(volume, 0, 1);
            Object.values(this.sounds).forEach(audio => {
                audio.volume = this.volume;
            });
        }
    },

    // 性能监控器
    performanceMonitor: {
        fps: 0,
        frameTime: 0,
        lastTime: 0,
        frameCount: 0,
        updateTime: 0,

        update() {
            const now = performance.now();
            const delta = now - this.lastTime;
            
            this.frameCount++;
            this.updateTime += delta;
            
            if (this.updateTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / this.updateTime);
                this.frameCount = 0;
                this.updateTime = 0;
            }
            
            this.frameTime = delta;
            this.lastTime = now;
        },

        getFPS() {
            return this.fps;
        },

        getFrameTime() {
            return this.frameTime;
        }
    },

    // 事件系统
    eventSystem: {
        listeners: {},

        // 添加事件监听
        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },

        // 触发事件
        emit(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => callback(data));
            }
        },

        // 移除事件监听
        off(event, callback) {
            if (this.listeners[event]) {
                const index = this.listeners[event].indexOf(callback);
                if (index > -1) {
                    this.listeners[event].splice(index, 1);
                }
            }
        }
    },

    // 存储管理器
    storage: {
        // 保存数据
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('保存数据失败:', e);
                return false;
            }
        },

        // 加载数据
        load(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error('加载数据失败:', e);
                return defaultValue;
            }
        },

        // 删除数据
        remove(key) {
            localStorage.removeItem(key);
        },

        // 清空所有数据
        clear() {
            localStorage.clear();
        }
    }
};

// 全局变量
window.GAME_CONFIG = {
    // 游戏设置
    settings: {
        soundVolume: 0.5,
        graphicsQuality: 'medium',
        mouseSensitivity: 5,
        showFPS: true
    },

    // 物理设置
    physics: {
        gravity: -9.8,
        friction: 0.8,
        restitution: 0.3,
        maxSpeed: 50
    },

    // 渲染设置
    render: {
        shadows: true,
        antialias: true,
        pixelRatio: window.devicePixelRatio || 1
    }
};

// 初始化游戏设置
const savedSettings = Utils.storage.load('gameSettings');
if (savedSettings) {
    Object.assign(window.GAME_CONFIG.settings, savedSettings);
}