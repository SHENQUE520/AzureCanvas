// /**
//  * 瀑布传送门 - 完整特效（唯一文件）
//  *
//  * 本文件包含瀑布传送门的全部功能，无需其他 JS 文件配合：
//  *
//  * ✅ 瀑布外侧点击提示（"点击瀑布，进入传送门"）
//  * ✅ 全屏漩涡动画（螺旋色带 + 粒子，深蓝水色背景）
//  * ✅ 隧道滚动穿越（相机移动 + 辉光增强 + 径向模糊）
//  * ✅ 隧道内滚动提示（中文 + 英文 + 浮动倒三角）
//  * ✅ 音频特效（瀑布声 + 隧道声 + 传送爆发音）
//  * ✅ 终点变白 + 自动跳转（可配置目标页面）
//  *
//  * 其他相关文件（integrated-portal.js / waterfall.js / portal.js）
//  * 均为开发过程中的旧版本，可移入备份文件夹。
//  *
//  * 依赖：Three.js, GSAP, EffectComposer
//  *
//  * 作者：glow
//  *
//  */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ========== 点击提示 + 滚动提示 + 全屏漩涡动画 ==========
let vortexPlaying = false;
let clickHintDiv = null;
let scrollHintDiv = null;

function createClickHint() {
    if (clickHintDiv) return;
    clickHintDiv = document.createElement('div');
    clickHintDiv.style.position = 'fixed';
    clickHintDiv.style.bottom = '20%';
    clickHintDiv.style.left = '0';
    clickHintDiv.style.width = '100%';
    clickHintDiv.style.textAlign = 'center';
    clickHintDiv.style.zIndex = '9999';
    clickHintDiv.style.pointerEvents = 'none';
    clickHintDiv.style.fontFamily = 'Segoe UI, sans-serif';
    clickHintDiv.style.opacity = '0';
    clickHintDiv.style.transition = 'opacity 0.8s ease';
    clickHintDiv.innerHTML = `
        <div style="background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: inline-block; padding: 12px 28px; border-radius: 60px; color: white; font-size: 20px;">
            ⚡ Click the waterfall to enter the portal ⚡
            <div style="font-size: 24px; margin-top: 8px; animation: floatArrow 1.2s infinite;">▼</div>
        </div>
        <style>@keyframes floatArrow{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}</style>
    `;
    document.body.appendChild(clickHintDiv);
    setTimeout(() => { if (clickHintDiv) clickHintDiv.style.opacity = '1'; }, 200);
}

function hideClickHint() {
    if (clickHintDiv) {
        clickHintDiv.style.opacity = '0';
        setTimeout(() => { if (clickHintDiv) clickHintDiv.remove(); clickHintDiv = null; }, 500);
    }
}

function showScrollHint() {
    if (scrollHintDiv) return;
    scrollHintDiv = document.createElement('div');
    scrollHintDiv.style.position = 'fixed';
    scrollHintDiv.style.bottom = '15%';
    scrollHintDiv.style.left = '0';
    scrollHintDiv.style.width = '100%';
    scrollHintDiv.style.textAlign = 'center';
    scrollHintDiv.style.zIndex = '9999';
    scrollHintDiv.style.pointerEvents = 'none';
    scrollHintDiv.style.fontFamily = 'Segoe UI, sans-serif';
    scrollHintDiv.style.opacity = '0';
    scrollHintDiv.style.transition = 'opacity 1s ease';
    scrollHintDiv.innerHTML = `
        <div><div style="font-size: 28px;">Scroll down to enter the portal</div><div style="font-size: 16px;">SCROLL TO ENTER</div></div>
        <div style="font-size: 24px; animation: floatArrow 1.2s infinite;">▼</div>
    `;
    document.body.appendChild(scrollHintDiv);
    setTimeout(() => { if (scrollHintDiv) scrollHintDiv.style.opacity = '1'; }, 100);

    const hideOnScroll = () => {
        if (scrollHintDiv) {
            scrollHintDiv.style.opacity = '0';
            setTimeout(() => { if (scrollHintDiv) scrollHintDiv.remove(); scrollHintDiv = null; }, 500);
        }
        window.removeEventListener('wheel', hideOnScroll);
    };
    window.addEventListener('wheel', hideOnScroll);
}

// ========== 漩涡动画（深蓝水色背景，螺旋色带）==========

function playSpiralVortex(onComplete) {
    if (vortexPlaying) return;
    vortexPlaying = true;

    // 1. 设置透明背景，以便显示 CSS 渐变
    const vortexRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); 
    vortexRenderer.setSize(window.innerWidth, window.innerHeight);
    vortexRenderer.domElement.style.position = 'fixed';
    vortexRenderer.domElement.style.top = '0';
    vortexRenderer.domElement.style.zIndex = '10001';
    
    // 注入渐变背景样式（深蓝到暗黑的径向渐变）
    vortexRenderer.domElement.style.background = 'radial-gradient(circle, #0a2a4a 0%, #00050a 80%)';
    document.body.appendChild(vortexRenderer.domElement);

    const vortexScene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const vortexCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    vortexCamera.position.z = 5;

    // --- 像素纹理生成（保持像素感） ---
    const createPixelLineTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(0, 0, 8, 8); // 产生离散的像素块
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    };
    const pixelTex = createPixelLineTexture();

    // --- 万花筒环（使用蓝色系深浅交替） ---
    const group = new THREE.Group();
    vortexScene.add(group);
    const ringCount = 12;
    const rings = [];

    for (let i = 0; i < ringCount; i++) {
        const radius = (ringCount - i) * 0.5;
        const geometry = new THREE.RingGeometry(radius, radius + 0.08, 8); // 八边形
        
        // 这里的颜色直接从你已有的 PALETTE 中取蓝色系，不再乱跳色
        const color = PALETTE[i % 4 + 4]; // 取 PALETTE 后段的深蓝色系
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            map: pixelTex,
            transparent: true,
            opacity: 0.6 + (i / ringCount) * 0.4, // 越往中心越实
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.z = -i * 0.4;
        ring.rotation.z = (i * Math.PI) / 4;
        group.add(ring);
        rings.push({
            mesh: ring,
            speed: (i % 2 === 0 ? 1 : -1) * 0.015
        });
    }

    // --- 蓝色系粒子（深浅不一） ---
    const pCount = 500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
        const r = Math.random() * 6;
        const a = Math.random() * Math.PI * 2;
        pPos[i*3] = Math.cos(a) * r;
        pPos[i*3+1] = Math.sin(a) * r;
        pPos[i*3+2] = Math.random() * -10;

        // 粒子颜色：在天蓝和深蓝之间切换
        const pColor = PALETTE[Math.floor(Math.random() * 4 + 2)]; 
        pColors[i*3] = pColor.r;
        pColors[i*3+1] = pColor.g;
        pColors[i*3+2] = pColor.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true, // 开启顶点颜色，实现深浅不一
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particles = new THREE.Points(pGeo, pMat);
    vortexScene.add(particles);

    const duration = 2000;
    const startTime = performance.now();

    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        rings.forEach(r => {
            r.mesh.rotation.z += r.speed;
            pixelTex.offset.x += 0.005; // 缓慢的像素流动感
        });

        // 粒子径向运动
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
            positions[i*3+2] += 0.12; 
            if (positions[i*3+2] > 2) positions[i*3+2] = -8;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        vortexCamera.position.z = 5 - ease * 4.6;
        vortexCamera.rotation.z = ease * (Math.PI / 2); // 整体慢速旋转

        vortexRenderer.render(vortexScene, vortexCamera);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            vortexRenderer.domElement.remove();
            vortexRenderer.dispose();
            vortexPlaying = false;
            if (onComplete) onComplete();
        }
    }
    animate();
}
// ========== 以下为原有代码（注释完整保留）==========

// --- [音频系统初始化] ---
const listener = new THREE.AudioListener();

const audioLoader = new THREE.AudioLoader();
// 隧道内音频：升级为 PositionalAudio 实现空间感
const tunnelSound = new THREE.PositionalAudio(listener);
// 瀑布外音频：普通立体声
const outsideSound = new THREE.Audio(listener);
// 穿梭爆发音效
const splashSound = new THREE.Audio(listener);

// 低通滤波器：用于传送前的“闷音”效果（仅用于隧道内音频）
const lowPassFilter = listener.context.createBiquadFilter();
lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.value = 22000; // 初始为最高频率（无滤镜）

// ========== 转场状态管理 ==========
let isInTunnel = false;      // 是否已进入隧道
let isTransitioning = false; // 是否正在转场中（防止重复触发）

// ========== 瀑布前奏场景（移植自 waterfall.js）==========
let waterfallScene, waterfallCamera, waterfallCaveMaterial, waterfallWaterMaterial, waterfallSplashGroup, waterfallMistMaterial, waterfallClock;

// 颜色调色板 (8种蓝色) - 保留原像素风风格
const PALETTE = [
    new THREE.Color('#E0F7FA'), // 淡天蓝
    new THREE.Color('#B2EBF2'),
    new THREE.Color('#81D4FA'),
    new THREE.Color('#4FC3F7'),
    new THREE.Color('#29B6F6'),
    new THREE.Color('#0288D1'),
    new THREE.Color('#01579B'),
    new THREE.Color('#0D47A1')  // 深蓝
];

/**
 * 初始化瀑布前奏场景
 */
function initWaterfallPrologue() {
    waterfallScene = new THREE.Scene();
    waterfallScene.background = new THREE.Color(0x050505);

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 正交相机，适合 2D 效果
    const aspect = width / height;
    const viewSize = 10;
    waterfallCamera = new THREE.OrthographicCamera(
        -viewSize * aspect, viewSize * aspect,
        viewSize, -viewSize,
        0.1, 1000
    );
    waterfallCamera.position.z = 10;

    waterfallClock = new THREE.Clock();

    createWaterfallCave();
    createWaterfallPlane();
    createWaterfallSplashes();

        // ----- 新增：背景瀑布（稀疏、深色、慢速）-----
    const bgWaterfallGeometry = new THREE.PlaneGeometry(24, 18);
    const bgWaterfallShader = {
        uniforms: {
            uTime: { value: 0 },
            uColors: { value: PALETTE }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
            uniform float uTime; uniform vec3 uColors[8]; varying vec2 vUv;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 4358.5453); }
            void main() {
                vec2 uv = floor(vUv * vec2(80.0, 100.0)) / vec2(80.0, 100.0);
                float lineId = floor(vUv.x * 40.0);
                float speed = 0.5 + hash(vec2(lineId, 1.0)) * 1.5;
                float flow = uv.y + uTime * speed;
                float colorValue = hash(vec2(lineId, floor(flow * 5.0)));
                float mask = step(0.7, hash(vec2(lineId, 0.0)));
                int colorIndex = int(clamp(floor(colorValue * 5.0) + 3.0, 3.0, 7.0));
                vec3 color = uColors[colorIndex];
                float shape = mask * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0));
                gl_FragColor = vec4(color, shape * 0.4 * smoothstep(1.0, 0.9, vUv.y));
            }
        `,
        transparent: true
    };
    const bgWaterfallMat = new THREE.ShaderMaterial(bgWaterfallShader);
    const bgWaterfall = new THREE.Mesh(bgWaterfallGeometry, bgWaterfallMat);
    bgWaterfall.position.set(0, 0, -0.8);
    waterfallScene.add(bgWaterfall);
    waterfallScene.userData.bgWaterfallMat = bgWaterfallMat; // 供动画更新

    // ----- 新增：水潭（呼吸水平线条）-----
    const pondGeometry = new THREE.PlaneGeometry(24, 6);
    const pondShader = {
        uniforms: {
            uTime: { value: 0 },
            uColors: { value: PALETTE }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
            uniform float uTime; uniform vec3 uColors[8]; varying vec2 vUv;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 4358.5453); }
            void main() {
                vec2 uv = floor(vUv * vec2(120.0, 60.0)) / vec2(120.0, 60.0);
                float rowId = floor(vUv.y * 30.0);
                float rowOffset = hash(vec2(rowId, 0.0));
                vec3 baseColor = uColors[7];
                float lineId = floor((vUv.x + rowOffset) * 15.0);
                float lineStrength = step(0.65, hash(vec2(lineId, rowId)));
                float breathing = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 2.5 + rowOffset * 15.0));
                vec3 lineColor = uColors[int(clamp(rowOffset * 4.0 + 2.0, 0.0, 7.0))];
                vec3 finalColor = mix(baseColor, lineColor, lineStrength * 0.5);
                float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
                gl_FragColor = vec4(finalColor, alpha * 0.7 * breathing);
            }
        `,
        transparent: true
    };
    const pondMat = new THREE.ShaderMaterial(pondShader);
    const pond = new THREE.Mesh(pondGeometry, pondMat);
    pond.position.y = -8.0;
    pond.position.z = 0.2;
    waterfallScene.add(pond);
    waterfallScene.userData.pondMat = pondMat;
}

/**
 * 创建山洞背景（移植自 waterfall.js）
 */
function createWaterfallCave() {
    const caveGeometry = new THREE.PlaneGeometry(30, 20);
    
    // 山洞着色器：暗色石头纹理效果
    const caveShader = {
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                // 像素化的石头纹理
                vec2 pixelSize = vec2(128.0);
                vec2 uv = floor(vUv * pixelSize) / pixelSize;
                
                float n = noise(uv * 10.0);
                n += noise(uv * 20.0) * 0.5;
                
                // 石头颜色：深灰/暗紫/暗蓝
                vec3 darkStone = vec3(0.02, 0.02, 0.04);
                vec3 lightStone = vec3(0.08, 0.08, 0.12);
                
                vec3 color = mix(darkStone, lightStone, n);
                
                // 洞穴开口效果：中间亮（瀑布区域），四周暗
                float dist = length(vUv - 0.5);
                // 增加纵向拉伸，让洞穴看起来更深
                float distCenter = length((vUv - vec2(0.5, 0.5)) * vec2(0.6, 1.0));
                float vignette = smoothstep(0.1, 0.7, distCenter);
                
                color = mix(color, vec3(0.0), vignette);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    };

    waterfallCaveMaterial = new THREE.ShaderMaterial(caveShader);
    const cave = new THREE.Mesh(caveGeometry, waterfallCaveMaterial);
    cave.position.z = -1;
    waterfallScene.add(cave);

    // 添加一些石头装饰
    for(let i = 0; i < 12; i++) {
        const rockSize = Math.random() * 2 + 1;
        const rockGeo = new THREE.CircleGeometry(rockSize, 6);
        const rockMat = new THREE.MeshBasicMaterial({ 
            color: 0x0a0a0c,
            transparent: true,
            opacity: 0.8
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 15,
            -0.5
        );
        rock.rotation.z = Math.random() * Math.PI;
        waterfallScene.add(rock);
    }
}

/**
 * 创建瀑布平面（移植自 waterfall.js）
 */
function createWaterfallPlane() {
    // 原版主瀑布几何体：宽10，高16
    const geometry = new THREE.PlaneGeometry(10, 16);
    
    // 瀑布着色器：像素化线条，多层次颜色（来自原版）
    const waterfallShader = {
        uniforms: {
            uTime: { value: 0 },
            uColors: { value: PALETTE },
            uResolution: { value: new THREE.Vector2(10, 16) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColors[8];
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 4358.5453);
            }

            void main() {
                // 像素化处理 - 纵横比例
                vec2 uv = floor(vUv * vec2(66.0, 96.0)) / vec2(66.0, 96.0);
                
                float flow = uv.y + uTime * 3.5;
                
                // 多条正弦波叠加，产生水流交错感
                float lines = sin(uv.x * 30.0 + uTime * 2.0) * 0.1;
                lines += sin(uv.x * 60.0 - uTime * 1.5) * 0.1;
                lines += sin(uv.x * 120.0 + uTime * 3.0) * 0.06;
                
                float colorValue = (uv.x + lines + hash(vec2(uv.x, floor(flow * 12.0))) * 0.2);
                float stripe = sin(uv.x * 15.0) * 0.5 + 0.5;
                int colorIndex = int(clamp(floor(mix(colorValue, stripe, 0.4) * 8.0), 0.0, 7.0));
                vec3 color = uColors[colorIndex];
                
                // 白色高光
                if (step(0.92, hash(vec2(uv.x, floor(flow * 15.0)))) > 0.5) {
                    color = mix(color, vec3(1.0), 0.6);
                }
                
                float shape = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0);
                float portalTop = (vUv.y > 0.8) ? (1.0 - smoothstep(0.45, 0.5, length((vUv - vec2(0.5, 0.8)) * vec2(1.0, 0.5)))) : 1.0;
                
                gl_FragColor = vec4(color, shape * portalTop * smoothstep(1.0, 0.95, vUv.y));
            }
        `,
        transparent: true
    };

    waterfallWaterMaterial = new THREE.ShaderMaterial(waterfallShader);
    const waterfallPlane = new THREE.Mesh(geometry, waterfallWaterMaterial);
    waterfallPlane.position.y = 1; // 与原版一致
    waterfallScene.add(waterfallPlane);
}

/**
 * 创建底部水花和雾气（移植自 waterfall.js）
 */
function createWaterfallSplashes() {
    const splashCount = 60;
    // 使用圆形几何体作为水花颗粒
    const geometry = new THREE.CircleGeometry(0.2, 5); // 5边形，带点像素感
    
    waterfallSplashGroup = new THREE.Group();
    
    for(let i = 0; i < splashCount; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: PALETTE[Math.floor(Math.random() * 4)], // 使用较浅的前 4 种颜色
            transparent: true,
            opacity: 0.8
        });
        const splash = new THREE.Mesh(geometry, material);
        
        resetWaterfallSplash(splash);
        // 随机化初始生命值，让水花错开
        splash.userData.life = Math.random();
        
        waterfallSplashGroup.add(splash);
    }
    
    waterfallSplashGroup.position.y = -7.5; // 瀑布底部位置
    waterfallScene.add(waterfallSplashGroup);
    
    // 添加底部云雾/水汽层 (动漫风)
    const mistGeo = new THREE.PlaneGeometry(10, 3);
    const mistShader = {
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: PALETTE[1] }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                float noise = sin(vUv.x * 10.0 + uTime) * 0.1;
                float alpha = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
                alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
                gl_FragColor = vec4(uColor, alpha * 0.4);
            }
        `,
        transparent: true
    };
    waterfallMistMaterial = new THREE.ShaderMaterial(mistShader);
    const mist = new THREE.Mesh(mistGeo, waterfallMistMaterial);
    mist.position.y = -7.5;
    mist.position.z = 0.1; // 在水花前面
    waterfallScene.add(mist);
}

function resetWaterfallSplash(mesh) {
    // 集中在瀑布底部区域
    mesh.position.x = (Math.random() - 0.5) * 6.5;
    mesh.position.y = (Math.random() - 0.5) * 1.0;
    mesh.userData.velocity = new THREE.Vector2(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.25 + 0.15
    );
    mesh.userData.life = 1.0;
    mesh.scale.setScalar(Math.random() * 0.8 + 0.4);
}

function updateWaterfallSplashes(delta) {
    if (!waterfallSplashGroup) return;

    waterfallSplashGroup.children.forEach(splash => {
        splash.position.x += splash.userData.velocity.x;
        splash.position.y += splash.userData.velocity.y;
        
        // 简单的物理模拟
        splash.userData.velocity.y -= 0.012; // 重力
        splash.userData.velocity.x *= 0.98;  // 阻力
        
        splash.userData.life -= delta * 1.2;
        splash.material.opacity = splash.userData.life;
        
        // 旋转效果
        splash.rotation.z += delta * 5.0;
        
        if(splash.userData.life <= 0) {
            resetWaterfallSplash(splash);
        }
    });

    if (waterfallMistMaterial) {
        waterfallMistMaterial.uniforms.uTime.value += delta;
    }
}

// ========== 白光消散效果 ==========
function createWhiteFlash(callback) {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = 9999;
    flash.style.opacity = 0;
    flash.style.transition = 'opacity 0.3s ease-out';
    
    document.body.appendChild(flash);
    
    // 快速变白
    flash.style.opacity = 1;
    
    setTimeout(() => {
        // 淡出
        flash.style.opacity = 0;
        setTimeout(() => {
            flash.remove();
            if (callback) callback();
        }, 300);
    }, 200);
}

// ========== 启动隧道效果（从起点开始）==========
function startTunnelFromPortal() {
    isInTunnel = true;
    
    // 停止瀑布外音频
    if (outsideSound.isPlaying) {
        outsideSound.stop();
    }
    
    // 播放隧道内音频（带空间音频和低通滤镜）
    if (tunnelSound.buffer && !tunnelSound.isPlaying) {
        tunnelSound.play();
    }
    
    // 相机设置在起点
    camera.position.z = 50;
    
    // 重置滚动进度
    scrollProgress = 0;
    
    // 播放穿梭音效
    if (splashSound.buffer && !splashSound.isPlaying) {
        splashSound.play();
    }
}

// ========== 瀑布前奏的点击转场逻辑（修改版：点击 → 漩涡 → 动画中/后进隧道）==========
function setupWaterfallTransition() {
    window.addEventListener('click', (e) => {
        if (!isInTunnel && !isTransitioning && !vortexPlaying && clickHintDiv) {
            isTransitioning = true;
            
            // 隐藏点击提示
            hideClickHint();
            
            // 相机放大
            gsap.to(waterfallCamera, {
                left: waterfallCamera.left * 0.3,
                right: waterfallCamera.right * 0.3,
                top: waterfallCamera.top * 0.3,
                bottom: waterfallCamera.bottom * 0.3,
                duration: 0.4,
                ease: "power2.in",
                onUpdate: () => waterfallCamera.updateProjectionMatrix(),
                onComplete: () => {
                    // 白光
                    createWhiteFlash(() => {
                        // 白光中播放漩涡动画
                        playSpiralVortex(() => {
                            // 漩涡结束进入隧道
                            startTunnelFromPortal();
                            // 显示滚动提示
                            showScrollHint();
                            // 额外白光消散
                            createWhiteFlash(() => {});
                            isTransitioning = false;
                        });
                    });
                }
            });
        }
    });
}

// ========== 主场景初始化 ==========

/**
 * --- 1. 基础场景初始化 ---
 */
const scene = new THREE.Scene();
// [可调参数] 场景底色：建议保持极深色以突出瀑布亮度
scene.background = new THREE.Color(0x00050a); 

// [可调参数] 摄像机视场角：值越大透视感越强（更有拉伸感）
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.add(listener); // 修正：listener 必须在相机定义后添加

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 先初始化瀑布前奏场景
initWaterfallPrologue();

/**
 * --- 2. 瀑布水流纹理生成 ---
 */
function createWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    // [可调参数] 瀑布渐变色：控制水流的主色调
    gradient.addColorStop(0, '#0066ff');   
    gradient.addColorStop(0.5, '#002288'); 
    gradient.addColorStop(1, '#0066ff');   
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制水流拉丝噪点
    for (let i = 0; i < 800; i++) {
        // [可调参数] 水流噪点颜色与透明度：rgba 最后一个值控制噪点细腻程度
        ctx.fillStyle = `rgba(150, 200, 255, ${Math.random() * 0.25})`;
        ctx.beginPath();
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        // [可调参数] 水流丝线粗细与长度：ellipse 参数控制拉伸形状
        ctx.ellipse(x, y, Math.random() * 2 + 1, Math.random() * 40 + 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

const waterTexture = createWaterTexture();

/**
 * --- 3. 隧道与终点门户 ---
 */
// [可调参数] 隧道尺寸：第一个参数是半径，第二个是长度
const tunnelGeom = new THREE.CylinderGeometry(5, 5, 300, 32, 1, true);
const tunnelMat = new THREE.MeshBasicMaterial({ 
    map: waterTexture,
    side: THREE.BackSide,
    transparent: true,
    // [可调参数] 隧道透明度
    opacity: 0.9,
    blending: THREE.AdditiveBlending 
});
const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
tunnel.rotation.x = Math.PI / 2;
scene.add(tunnel);

// [可调参数] 传送门尺寸：半径应与隧道一致
const portalGeo = new THREE.CircleGeometry(5, 32);
const portalMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending 
});
const portal = new THREE.Mesh(portalGeo, portalMat);
// [可调参数] 传送门位置：放在隧道末端
portal.position.z = -150; 
scene.add(portal);

// 将空间音频挂载在传送门上
portal.add(tunnelSound);

/**
 * --- 4. 五彩粒子系统 ---
 */
// [可调参数] 粒子总数
const particleCount = 3000;
const pGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const colorHelper = new THREE.Color();

for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // [可调参数] 粒子散布半径：略小于隧道半径可避免粒子穿模
    const radius = 4.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    // [可调参数] 粒子纵向分布范围
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

    // [可调参数] 粒子随机颜色范围：HSL 参数分别控制（色相、饱和度、亮度）
    colorHelper.setHSL(Math.random(), 1.0, 0.4); 
    colors[i * 3] = colorHelper.r;
    colors[i * 3 + 1] = colorHelper.g;
    colors[i * 3 + 2] = colorHelper.b;
}
pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const pMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    // [可调参数] 粒子显示大小
    size: 0.08,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const particles = new THREE.Points(pGeometry, pMaterial);
scene.add(particles);

// 加载音频文件
// 1. 瀑布外音频
audioLoader.load('../audios/portal/waterfall_loop(outside).mp3', (buffer) => {
    outsideSound.setBuffer(buffer);
    outsideSound.setLoop(true);
    outsideSound.setVolume(0.6);
});

// 2. 隧道内音频（带空间音频和滤镜）
audioLoader.load('../audios/portal/waterfall_loop.mp3', (buffer) => {
    tunnelSound.setBuffer(buffer);
    tunnelSound.setLoop(true);
    tunnelSound.setRefDistance(10);
    tunnelSound.setMaxDistance(200);
    tunnelSound.setRolloffFactor(2);
    tunnelSound.setVolume(0.5);
    tunnelSound.setFilter(lowPassFilter);
});

// 3. 穿梭爆发音效
audioLoader.load('../audios/portal/teleport_splash.mp3', (buffer) => {
    splashSound.setBuffer(buffer);
    splashSound.setVolume(0.6);
});

// 自动播放实现：监听首次交互激活音频上下文，播放瀑布外音频
const startAudio = () => {
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }
    // 播放瀑布外音频
    if (outsideSound.buffer && !outsideSound.isPlaying) {
        outsideSound.play();
    }
    window.removeEventListener('wheel', startAudio);
    window.removeEventListener('mousedown', startAudio);
};
window.addEventListener('wheel', startAudio);
window.addEventListener('mousedown', startAudio);

/**
 * --- 5. 后期处理 (辉光与径向模糊) ---
 */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,  // [可调参数] 初始辉光强度
    0.4,  // [可调参数] 辉光半径
    0.9   // [可调参数] 辉光阈值：值越大，只有越亮的地方才发光
);
composer.addPass(bloomPass);

// --- 径向模糊自定义着色器 (亮度补偿版) ---
const RadialBlurShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "strength": { value: 0.0 } // [可调参数] 模糊强度
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float strength;
        varying vec2 vUv;
        void main() {
            vec2 dir = vUv - vec2(0.5); 
            vec4 color = vec4(0.0);
            float samples = 10.0; 
            for(float i = 0.0; i < 10.0; i++) {
                color += texture2D(tDiffuse, vUv - dir * strength * i);
            }
            gl_FragColor = (color / samples) * 1.2; 
        }
    `
};

const radialBlurPass = new ShaderPass(RadialBlurShader);
composer.addPass(radialBlurPass);

/**
 * --- 6. 交互逻辑 ---
 */
let scrollProgress = 0;
// [可调参数] 相机初始 Z 轴位置
camera.position.z = 50; 

window.addEventListener('wheel', (e) => {
    // 只在隧道场景中响应滚动
    if (!isInTunnel) return;
    
    // [可调参数] 滚动灵敏度
    scrollProgress += e.deltaY * 0.05;
    
    // [可调参数] 限制相机的滚动范围：(-145 为传送门前，100 为隧道外)
    const targetZ = THREE.MathUtils.clamp(50 - scrollProgress, -150, 100);

    gsap.to(camera.position, {
        z: targetZ,
        // [可调参数] 滚动平滑持续时间
        duration: 2,
        ease: "power2.out",
        onUpdate: () => {
            const dist = Math.abs(camera.position.z - portal.position.z);
            // 建立 Progress 变量
            const currentTotalRange = 200; 
            const progress = THREE.MathUtils.clamp(1.0 - (dist / currentTotalRange), 0, 1);
            
            // --- 状态驱动系统 ---
            
            // 1. 视觉：模糊与辉光 (优化区间：从 0.6 开始加速爆发)
            if (progress > 0.6) {
                const blurStrength = THREE.MathUtils.mapLinear(progress, 0.6, 0.99, 0, 0.12);
                radialBlurPass.uniforms.strength.value = THREE.MathUtils.clamp(blurStrength, 0, 0.12);
                // 辉光在接近时指数级增强
                bloomPass.strength = 1.0 + Math.pow((progress - 0.6) * 6, 2);
            } else {
                radialBlurPass.uniforms.strength.value = 0;
                bloomPass.strength = 1.0;
            }

            // 2. 音频：频率与音量控制（仅隧道内音频）
            if (tunnelSound.isPlaying && progress < 0.99) {
                // 随着靠近，降低高频
                if (progress > 0.75) {
                    const freq = THREE.MathUtils.mapLinear(progress, 0.75, 0.99, 22000, 200);
                    const safeFreq = THREE.MathUtils.clamp(freq, 200, 22000);
                    lowPassFilter.frequency.setValueAtTime(safeFreq, listener.context.currentTime);
                } else {
                    lowPassFilter.frequency.setValueAtTime(22000, listener.context.currentTime);
                }
                
                // 动态调整音量
                const dynamicVol = THREE.MathUtils.lerp(0.5, 1.5, progress);
                tunnelSound.setVolume(dynamicVol);
            }

            // 3. 传送瞬间逻辑优化 (0.9 触发 splash, 0.99 彻底关闭)
            if (progress >= 0.90 && progress < 0.99) {
                if (!splashSound.isPlaying) {
                    splashSound.play();
                }
            }

            if (progress >= 0.99) {
    // 停止所有持续性音效
    if (tunnelSound.isPlaying) tunnelSound.stop();
    if (splashSound.isPlaying) splashSound.stop();
    
    // 画面彻底变白
    portalMat.opacity = 1; 
    const whiteOut = THREE.MathUtils.mapLinear(Math.min(progress, 1.0), 0.99, 1.0, 5, 15);
    portalMat.color.setRGB(whiteOut, whiteOut, whiteOut);
}

// ========== 跳转：只在 progress >= 1.0 时触发一次 ==========
if (progress >= 1.0 && !window._hasRedirected) {
    window._hasRedirected = true;
    // 可选：再留一点白屏时间（0~500ms）
    setTimeout(() => {
        window.location.href = '../islands/index.html';   // 请根据实际部署路径调整
    }
    , 300);
            }
        }
    });

    const colorAttribute = particles.geometry.attributes.color;
    for (let i = 0; i < particleCount; i++) {
        colorHelper.fromArray(colorAttribute.array, i * 3);
        const hsl = { h: 0, s: 0, l: 0 };
        colorHelper.getHSL(hsl);
        // [可调参数] 滚动时颜色变化的速率
        hsl.h += 0.01; 
        colorHelper.setHSL(hsl.h % 1.0, hsl.s, hsl.l);
        colorHelper.toArray(colorAttribute.array, i * 3);
    }
    colorAttribute.needsUpdate = true;
});

/**
 * --- 7. 动画循环 ---
 */
function animate() {
    requestAnimationFrame(animate);

    if (!isInTunnel) {
    const delta = waterfallClock.getDelta();
    const elapsed = waterfallClock.getElapsedTime();

    // 主瀑布材质
    if (waterfallWaterMaterial) {
        waterfallWaterMaterial.uniforms.uTime.value = elapsed;
    }
    // 山洞材质
    if (waterfallCaveMaterial) {
        waterfallCaveMaterial.uniforms.uTime.value = elapsed;
    }
    // 新增：背景瀑布材质
    if (waterfallScene.userData.bgWaterfallMat) {
        waterfallScene.userData.bgWaterfallMat.uniforms.uTime.value = elapsed;
    }
    // 新增：水潭材质
    if (waterfallScene.userData.pondMat) {
        waterfallScene.userData.pondMat.uniforms.uTime.value = elapsed;
    }
    // 雾气材质（原有）
    if (waterfallMistMaterial) {
        waterfallMistMaterial.uniforms.uTime.value = elapsed;
    }

    updateWaterfallSplashes(delta);

    renderer.render(waterfallScene, waterfallCamera);
}
    
    else {
        // 渲染隧道场景（带后期效果）
        // [可调参数] 瀑布背景水流下落速度
        waterTexture.offset.y += 0.01;

        const posArr = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            // [可调参数] 粒子自动向相机飘移的速度
            posArr[i * 3 + 2] += 1.0; 
            if (posArr[i * 3 + 2] > camera.position.z + 10) {
                // [可调参数] 粒子重置回远方的距离
                posArr[i * 3 + 2] = camera.position.z - 200;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        composer.render();
    }
}

// 启动时创建点击提示
createClickHint();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // 瀑布相机的 resize
    if (waterfallCamera) {
        const aspect = window.innerWidth / window.innerHeight;
        const viewSize = 10;
        waterfallCamera.left = -viewSize * aspect;
        waterfallCamera.right = viewSize * aspect;
        waterfallCamera.top = viewSize;
        waterfallCamera.bottom = -viewSize;
        waterfallCamera.updateProjectionMatrix();
    }
});

// 设置点击转场
setupWaterfallTransition();
