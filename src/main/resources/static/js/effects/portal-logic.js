import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// 已有引用

// --- [音频系统初始化] ---
const listener = new THREE.AudioListener();

const audioLoader = new THREE.AudioLoader();
// 升级为 PositionalAudio 实现空间感
const waterfallSound = new THREE.PositionalAudio(listener); 
const splashSound = new THREE.Audio(listener);

// 低通滤波器：用于传送前的“闷音”效果
const lowPassFilter = listener.context.createBiquadFilter();
lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.value = 22000; // 初始为最高频率（无滤镜）

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
portal.add(waterfallSound);

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

// 1. 加载瀑布循环音
audioLoader.load('/audio/waterfall_loop.mp3', (buffer) => {
    waterfallSound.setBuffer(buffer);
    waterfallSound.setLoop(true);
    waterfallSound.setRefDistance(10); // [可调参数] 空间音频参考距离
    waterfallSound.setMaxDistance(200); // [可调参数] 声音消失的距离
    waterfallSound.setRolloffFactor(2); // [可调参数] 衰减速度
    waterfallSound.setVolume(0.5); 
    // 连接滤镜
    waterfallSound.setFilter(lowPassFilter);
});

// 2. 加载穿梭爆发音
audioLoader.load('/audio/teleport_splash.mp3', (buffer) => {
    splashSound.setBuffer(buffer);
    splashSound.setVolume(0.6); // [可调参数] 爆发音量
});

// 自动播放实现：监听首次滚动激活上下文
const startAudio = () => {
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }
    if (waterfallSound.buffer && !waterfallSound.isPlaying) {
        waterfallSound.play();
    }
    window.removeEventListener('wheel', startAudio);
    window.removeEventListener('mousedown', startAudio);
};
window.addEventListener('wheel', startAudio);
window.addEventListener('mousedown', startAudio);

scene.add(particles);

/**
 * --- 5. 后期处理 (辉光与径心模糊) ---
 */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,  // [可调参数] 初始辉光强度
    0.5,  // [可调参数] 辉光半径
    0.8   // [可调参数] 辉光阈值：值越大，只有越亮的地方才发光
);
composer.addPass(bloomPass);

// --- 8. 径向模糊自定义着色器 (亮度补偿版) ---
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
 * --- 任务 2: 入场衔接动画 ---
 */
// 初始让 portal 材质全白且不透明
portalMat.opacity = 1;
portalMat.color.setRGB(10, 10, 10); // 极亮

// 页面加载完成后，从白屏淡出到深邃的隧道
window.addEventListener('load', () => {
    gsap.to(portalMat.color, {
        r: 1, g: 1, b: 1,
        duration: 2,
        ease: "power2.out"
    });
    // 如果你希望刚进来时有一声水花，也可以在这里触发
    // splashSound.play(); 
});


/**
 * --- 6. 交互逻辑 ---
 */
let scrollProgress = 0;
// [可调参数] 相机初始 Z 轴位置
camera.position.z = 50; 

window.addEventListener('wheel', (e) => {
    // [可调参数] 滚动灵敏度
    scrollProgress += e.deltaY * 0.05;
    
    // [可调参数] 限制相机的滚动范围：(-145 为传送门前，100 为隧道外)
    const targetZ = THREE.MathUtils.clamp(50 - scrollProgress, -145, 100);

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

            // 2. 音频：频率与音量控制
            if (waterfallSound.isPlaying && progress < 0.99) {
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
                waterfallSound.setVolume(dynamicVol);
            }

            // 3. 传送瞬间逻辑优化 (0.9 触发 splash, 0.99 彻底关闭)
            if (progress >= 0.90 && progress < 0.99) {
                if (!splashSound.isPlaying) {
                    splashSound.play();
                }
            }

            if (progress >= 0.99) {
                // 停止所有持续性音效
                if (waterfallSound.isPlaying) waterfallSound.stop();
                if (splashSound.isPlaying) splashSound.stop();
                
                // 画面彻底变白
                portalMat.opacity = 1; 
                const whiteOut = THREE.MathUtils.mapLinear(progress, 0.99, 1.0, 5, 15);
                portalMat.color.setRGB(whiteOut, whiteOut, whiteOut);
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
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});