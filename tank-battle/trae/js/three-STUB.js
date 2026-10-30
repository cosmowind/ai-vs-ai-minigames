// 由于CDN可能无法访问，这里提供一个简化的Three.js版本
// 在实际项目中，应该使用CDN或本地文件

// 创建一个简化的Three.js兼容对象
window.THREE = {
    Scene: class Scene {
        constructor() {
            this.children = [];
            this.background = null;
        }
        add(obj) { this.children.push(obj); }
        remove(obj) {
            const index = this.children.indexOf(obj);
            if (index > -1) this.children.splice(index, 1);
        }
    },
    
    PerspectiveCamera: class PerspectiveCamera {
        constructor(fov, aspect, near, far) {
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.position = { x: 0, y: 0, z: 0 };
            this.rotation = { x: 0, y: 0, z: 0 };
        }
        lookAt(x, y, z) {}
        updateProjectionMatrix() {}
    },
    
    WebGLRenderer: class WebGLRenderer {
        constructor(options) {
            this.domElement = document.createElement('canvas');
            this.shadowMap = { enabled: false, type: 0 };
        }
        setSize(width, height) {}
        render(scene, camera) {}
        dispose() {}
    },
    
    BoxGeometry: class BoxGeometry {
        constructor(width, height, depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
        }
        dispose() {}
    },
    
    SphereGeometry: class SphereGeometry {
        constructor(radius, widthSegments, heightSegments) {
            this.radius = radius;
        }
        dispose() {}
    },
    
    MeshStandardMaterial: class MeshStandardMaterial {
        constructor(options) {
            this.color = options?.color || 0xffffff;
            this.metalness = options?.metalness || 0.5;
            this.roughness = options?.roughness || 0.5;
        }
        dispose() {}
    },
    
    Color: class Color {
        constructor(color) {
            this.setHex(color);
        }
        setHex(hex) {
            this.hex = hex;
            return this;
        }
    },
    
    AmbientLight: class AmbientLight {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
        }
    },
    
    DirectionalLight: class DirectionalLight {
        constructor(color, intensity) {
            this.color = color;
            this.intensity = intensity;
            this.position = { x: 0, y: 0, z: 0 };
            this.castShadow = false;
        }
    },
    
    PCFSoftShadowMap: 1,
    
    Mesh: class Mesh {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = { x: 0, y: 0, z: 0 };
            this.rotation = { x: 0, y: 0, z: 0 };
            this.scale = { x: 1, y: 1, z: 1 };
            this.castShadow = false;
            this.receiveShadow = false;
        }
    },
    
    Group: class Group {
        constructor() {
            this.children = [];
            this.position = { x: 0, y: 0, z: 0 };
            this.rotation = { x: 0, y: 0, z: 0 };
        }
        add(obj) { this.children.push(obj); }
        remove(obj) {
            const index = this.children.indexOf(obj);
            if (index > -1) this.children.splice(index, 1);
        }
    }
};

// 创建一个简化的Cannon.js兼容对象
window.CANNON = {
    World: class World {
        constructor() {
            this.gravity = { set: (x, y, z) => {} };
            this.broadphase = null;
            this.solver = { iterations: 10 };
            this.bodies = [];
            this.materials = [];
            this.contacts = [];
        }
        addBody(body) { this.bodies.push(body); }
        removeBody(body) {
            const index = this.bodies.indexOf(body);
            if (index > -1) this.bodies.splice(index, 1);
        }
        step(dt) {}
    },
    
    NaiveBroadphase: class NaiveBroadphase {},
    
    Material: class Material {
        constructor(name) {
            this.name = name;
            this.friction = 0.4;
            this.restitution = 0.3;
        }
    },
    
    ContactMaterial: class ContactMaterial {
        constructor(material1, material2, options) {
            this.material1 = material1;
            this.material2 = material2;
            this.friction = options?.friction || 0.4;
            this.restitution = options?.restitution || 0.3;
        }
    },
    
    Box: class Box {
        constructor(halfExtents) {
            this.halfExtents = halfExtents;
        }
    },
    
    Sphere: class Sphere {
        constructor(radius) {
            this.radius = radius;
        }
    },
    
    Body: class Body {
        constructor(options) {
            this.mass = options?.mass || 0;
            this.position = new CANNON.Vec3(0, 0, 0);
            this.velocity = new CANNON.Vec3(0, 0, 0);
            this.quaternion = new CANNON.Quaternion();
            this.angularVelocity = new CANNON.Vec3(0, 0, 0);
            this.shapes = [];
            this.material = null;
            this.linearDamping = 0.4;
            this.angularDamping = 0.4;
        }
        addShape(shape) { this.shapes.push(shape); }
    },
    
    Vec3: class Vec3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }
        length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    },
    
    Quaternion: class Quaternion {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        }
        setFromAxisAngle(axis, angle) {
            const halfAngle = angle / 2;
            const s = Math.sin(halfAngle);
            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(halfAngle);
            return this;
        }
    }
};

// 设置全局变量
window.THREE = window.THREE || {};
window.CANNON = window.CANNON || {};