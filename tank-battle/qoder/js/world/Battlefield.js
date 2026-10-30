/**
 * 战场环境类
 * 负责创建和管理游戏战场环境
 */
class Battlefield {
    constructor(size = 100) {
        this.size = size;
        this.ground = null;
        this.walls = [];
        this.spawnPoints = [];
        this.decorations = [];
        
        // 环境配置
        this.config = {
            groundTexture: 'grass',
            wallHeight: 5,
            wallThickness: 1,
            spawnPointCount: 4,
            decorationDensity: 0.1
        };
        
        this.init();
    }
    
    /**
     * 初始化战场
     */
    init() {
        console.log('🏗️ 初始化战场环境...');
        
        this.createGround();
        this.createBoundaryWalls();
        this.setupSpawnPoints();
        this.addDecorations();
        this.setupLighting();
        
        console.log('✅ 战场环境创建完成');
    }
    
    /**
     * 创建地面
     */
    createGround() {
        // 创建地面几何体
        const groundGeometry = new THREE.PlaneGeometry(this.size, this.size);
        
        // 创建草地材质
        const groundMaterial = this.createGroundMaterial();
        
        // 创建地面网格
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2; // 水平放置
        this.ground.receiveShadow = true;
        this.ground.position.y = 0;
        
        // 添加到场景
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(this.ground);
        }
        
        console.log('🌱 地面创建完成');
    }
    
    /**
     * 创建地面材质
     */
    createGroundMaterial() {
        // 创建程序化草地纹理
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // 基础草地颜色
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, 0, 512, 512);
        
        // 添加草地纹理细节
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 3 + 1;
            const darkness = Math.random() * 0.3;
            
            ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
            ctx.fillRect(x, y, size, size);
        }
        
        // 添加一些亮斑
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 2 + 1;
            const brightness = Math.random() * 0.2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fillRect(x, y, size, size);
        }
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8); // 重复纹理
        
        return new THREE.MeshLambertMaterial({
            map: texture,
            color: 0x88bb88
        });
    }
    
    /**
     * 创建边界围墙
     */
    createBoundaryWalls() {
        const halfSize = this.size / 2;
        const wallHeight = this.config.wallHeight;
        const wallThickness = this.config.wallThickness;
        
        // 墙体配置
        const wallConfigs = [
            // 北墙
            {
                position: { x: 0, y: wallHeight/2, z: halfSize },
                dimensions: { width: this.size, height: wallHeight, depth: wallThickness }
            },
            // 南墙
            {
                position: { x: 0, y: wallHeight/2, z: -halfSize },
                dimensions: { width: this.size, height: wallHeight, depth: wallThickness }
            },
            // 东墙
            {
                position: { x: halfSize, y: wallHeight/2, z: 0 },
                dimensions: { width: wallThickness, height: wallHeight, depth: this.size }
            },
            // 西墙
            {
                position: { x: -halfSize, y: wallHeight/2, z: 0 },
                dimensions: { width: wallThickness, height: wallHeight, depth: this.size }
            }
        ];
        
        wallConfigs.forEach((config, index) => {
            const wall = this.createWall(config, index);
            this.walls.push(wall);
        });
        
        // 创建物理墙体
        if (window.physicsSystem) {
            window.physicsSystem.createBoundaryWalls(this.size);
        }
        
        console.log('🧱 边界围墙创建完成');
    }
    
    /**
     * 创建单面墙
     */
    createWall(config, index) {
        const { position, dimensions } = config;
        
        // 创建墙体几何体
        const wallGeometry = new THREE.BoxGeometry(
            dimensions.width,
            dimensions.height,
            dimensions.depth
        );
        
        // 创建墙体材质
        const wallMaterial = this.createWallMaterial();
        
        // 创建墙体网格
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(position.x, position.y, position.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        // 添加装饰细节
        this.addWallDecorations(wall, index);
        
        // 添加到场景
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(wall);
        }
        
        return wall;
    }
    
    /**
     * 创建墙体材质
     */
    createWallMaterial() {
        // 创建程序化砖墙纹理
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 基础墙体颜色
        ctx.fillStyle = '#8B7D6B';
        ctx.fillRect(0, 0, 256, 256);
        
        // 绘制砖块图案
        const brickWidth = 32;
        const brickHeight = 16;
        
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1;
        
        for (let y = 0; y < 256; y += brickHeight) {
            for (let x = 0; x < 256; x += brickWidth) {
                const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                const brickX = (x + offset) % 256;
                
                ctx.strokeRect(brickX, y, brickWidth, brickHeight);
                
                // 添加砖块变化
                const variation = Math.random() * 0.1 - 0.05;
                ctx.fillStyle = `rgba(139, 125, 107, ${0.1 + variation})`;
                ctx.fillRect(brickX + 1, y + 1, brickWidth - 2, brickHeight - 2);
            }
        }
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xaaaaaa
        });
    }
    
    /**
     * 添加墙体装饰
     */
    addWallDecorations(wall, wallIndex) {
        // 添加一些简单的装饰元素
        
        // 墙顶装饰
        const capGeometry = new THREE.BoxGeometry(
            wall.geometry.parameters.width * 1.05,
            0.2,
            wall.geometry.parameters.depth * 1.05
        );
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = wall.geometry.parameters.height / 2 + 0.1;
        wall.add(cap);
        
        // 随机添加一些损坏效果
        if (Math.random() < 0.3) {
            const damageGeometry = new THREE.BoxGeometry(
                Math.random() * 2 + 0.5,
                Math.random() * 1 + 0.5,
                0.1
            );
            const damageMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const damage = new THREE.Mesh(damageGeometry, damageMaterial);
            
            damage.position.set(
                (Math.random() - 0.5) * wall.geometry.parameters.width * 0.8,
                (Math.random() - 0.5) * wall.geometry.parameters.height * 0.8,
                wall.geometry.parameters.depth / 2 + 0.05
            );
            
            wall.add(damage);
        }
    }
    
    /**
     * 设置出生点
     */
    setupSpawnPoints() {
        const spawnDistance = this.size * 0.3;
        const spawnHeight = 2;
        
        // 四个角落的出生点
        const spawnConfigs = [
            { x: spawnDistance, z: spawnDistance },     // 东北
            { x: -spawnDistance, z: spawnDistance },    // 西北
            { x: -spawnDistance, z: -spawnDistance },   // 西南
            { x: spawnDistance, z: -spawnDistance }     // 东南
        ];
        
        spawnConfigs.forEach((config, index) => {
            const spawnPoint = {
                id: `spawn_${index}`,
                position: new THREE.Vector3(config.x, spawnHeight, config.z),
                rotation: new THREE.Euler(0, index * Math.PI / 2, 0),
                isOccupied: false
            };
            
            this.spawnPoints.push(spawnPoint);
            
            // 创建出生点视觉标记
            this.createSpawnPointMarker(spawnPoint);
        });
        
        console.log(`📍 创建了 ${this.spawnPoints.length} 个出生点`);
    }
    
    /**
     * 创建出生点标记
     */
    createSpawnPointMarker(spawnPoint) {
        const markerGeometry = new THREE.CylinderGeometry(1, 1.5, 0.5, 8);
        const markerMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(spawnPoint.position);
        marker.position.y = 0.25;
        
        // 添加发光效果
        const glowGeometry = new THREE.CylinderGeometry(1.2, 1.8, 0.6, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        marker.add(glow);
        
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(marker);
        }
        
        spawnPoint.marker = marker;
    }
    
    /**
     * 添加装饰元素
     */
    addDecorations() {
        const decorationCount = Math.floor(this.size * this.size * this.config.decorationDensity / 100);
        
        for (let i = 0; i < decorationCount; i++) {
            const decoration = this.createRandomDecoration();
            if (decoration) {
                this.decorations.push(decoration);
            }
        }
        
        console.log(`🎨 添加了 ${this.decorations.length} 个装饰元素`);
    }
    
    /**
     * 创建随机装饰
     */
    createRandomDecoration() {
        const decorationTypes = ['rock', 'bush', 'debris'];
        const type = decorationTypes[Math.floor(Math.random() * decorationTypes.length)];
        
        // 随机位置（避开出生点）
        let position;
        let attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * this.size * 0.8,
                0,
                (Math.random() - 0.5) * this.size * 0.8
            );
            attempts++;
        } while (this.isNearSpawnPoint(position) && attempts < 10);
        
        if (attempts >= 10) return null; // 无法找到合适位置
        
        return this.createDecoration(type, position);
    }
    
    /**
     * 检查是否靠近出生点
     */
    isNearSpawnPoint(position, minDistance = 15) {
        return this.spawnPoints.some(spawn => {
            return spawn.position.distanceTo(position) < minDistance;
        });
    }
    
    /**
     * 创建装饰元素
     */
    createDecoration(type, position) {
        let geometry, material, decoration;
        
        switch (type) {
            case 'rock':
                // 创建岩石
                geometry = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.5);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                decoration = new THREE.Mesh(geometry, material);
                decoration.position.copy(position);
                decoration.position.y = geometry.parameters.radius / 2;
                
                // 随机旋转
                decoration.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                break;
                
            case 'bush':
                // 创建灌木
                geometry = new THREE.SphereGeometry(Math.random() * 1 + 0.5);
                material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                decoration = new THREE.Mesh(geometry, material);
                decoration.position.copy(position);
                decoration.position.y = geometry.parameters.radius;
                
                // 稍微压扁
                decoration.scale.y = 0.7;
                break;
                
            case 'debris':
                // 创建废墟
                const pieces = new THREE.Group();
                
                for (let i = 0; i < Math.random() * 3 + 2; i++) {
                    const pieceGeometry = new THREE.BoxGeometry(
                        Math.random() * 1 + 0.3,
                        Math.random() * 0.5 + 0.2,
                        Math.random() * 1 + 0.3
                    );
                    const pieceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                    const piece = new THREE.Mesh(pieceGeometry, pieceMaterial);
                    
                    piece.position.set(
                        (Math.random() - 0.5) * 2,
                        pieceGeometry.parameters.height / 2,
                        (Math.random() - 0.5) * 2
                    );
                    
                    piece.rotation.set(
                        (Math.random() - 0.5) * 0.5,
                        Math.random() * Math.PI,
                        (Math.random() - 0.5) * 0.5
                    );
                    
                    pieces.add(piece);
                }
                
                decoration = pieces;
                decoration.position.copy(position);
                break;
                
            default:
                return null;
        }
        
        decoration.castShadow = true;
        decoration.receiveShadow = true;
        
        if (window.gameEngine && window.gameEngine.scene) {
            window.gameEngine.scene.add(decoration);
        }
        
        return {
            type: type,
            mesh: decoration,
            position: position.clone()
        };
    }
    
    /**
     * 设置环境光照
     */
    setupLighting() {
        // 添加一些额外的环境光源以增强氛围
        
        // 天空盒光照（如果需要）
        // 这里可以添加更复杂的光照设置
        
        console.log('💡 环境光照设置完成');
    }
    
    /**
     * 获取可用的出生点
     */
    getAvailableSpawnPoint() {
        const availableSpawns = this.spawnPoints.filter(spawn => !spawn.isOccupied);
        
        if (availableSpawns.length === 0) {
            // 如果没有可用出生点，随机选择一个
            return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        }
        
        return availableSpawns[Math.floor(Math.random() * availableSpawns.length)];
    }
    
    /**
     * 占用出生点
     */
    occupySpawnPoint(spawnPointId) {
        const spawnPoint = this.spawnPoints.find(spawn => spawn.id === spawnPointId);
        if (spawnPoint) {
            spawnPoint.isOccupied = true;
            
            // 更新标记颜色
            if (spawnPoint.marker) {
                spawnPoint.marker.material.color.setHex(0xff0000);
            }
        }
    }
    
    /**
     * 释放出生点
     */
    releaseSpawnPoint(spawnPointId) {
        const spawnPoint = this.spawnPoints.find(spawn => spawn.id === spawnPointId);
        if (spawnPoint) {
            spawnPoint.isOccupied = false;
            
            // 恢复标记颜色
            if (spawnPoint.marker) {
                spawnPoint.marker.material.color.setHex(0x00ff00);
            }
        }
    }
    
    /**
     * 获取战场信息
     */
    getBattlefieldInfo() {
        return {
            size: this.size,
            spawnPointCount: this.spawnPoints.length,
            decorationCount: this.decorations.length,
            wallCount: this.walls.length,
            availableSpawns: this.spawnPoints.filter(spawn => !spawn.isOccupied).length
        };
    }
    
    /**
     * 清理战场资源
     */
    dispose() {
        // 清理地面
        if (this.ground) {
            if (this.ground.parent) {
                this.ground.parent.remove(this.ground);
            }
            this.ground.geometry.dispose();
            this.ground.material.dispose();
        }
        
        // 清理墙体
        this.walls.forEach(wall => {
            if (wall.parent) {
                wall.parent.remove(wall);
            }
            wall.geometry.dispose();
            wall.material.dispose();
        });
        
        // 清理装饰
        this.decorations.forEach(decoration => {
            if (decoration.mesh.parent) {
                decoration.mesh.parent.remove(decoration.mesh);
            }
            
            if (decoration.mesh.geometry) {
                decoration.mesh.geometry.dispose();
            }
            if (decoration.mesh.material) {
                decoration.mesh.material.dispose();
            }
        });
        
        // 清理出生点标记
        this.spawnPoints.forEach(spawn => {
            if (spawn.marker && spawn.marker.parent) {
                spawn.marker.parent.remove(spawn.marker);
                spawn.marker.geometry.dispose();
                spawn.marker.material.dispose();
            }
        });
        
        console.log('🧹 战场环境资源清理完成');
    }
}

// 导出到全局
window.Battlefield = Battlefield;