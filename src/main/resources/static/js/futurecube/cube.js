// ============================================
// 立方体导航栏、玻璃折射、虹彩、全反射地球盒子模型
// 负责人：@Lotiyu
// ============================================

import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial.js';
import './cube.interactions.js';
//import { initScrollEffect } from './cube.scroll.js';

import { Preloader } from '../effects/preloader.js';

let scene, camera, renderer, composer, cube, earth, glowMesh, transmissionMaterial;
let EarthSpeed = 0.007;
let isFocusing = true;
let isTransitioning = false;
export let isCubePage = false;
let currentRotation = { x: 0, y: 0 };
let clock = new THREE.Clock();

const loadingManager = new THREE.LoadingManager();
let navigatorBar;

export function onFocus(){
    if (isFocusing) return;
    EarthSpeed = 0.03;
    isFocusing = true;
}

export function resetFocus(){
    if (!isFocusing) return;
    EarthSpeed = 0.007;
    isFocusing = false;
}

// 资源加载进度
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    Preloader.update(progress, `Loading: ${url.split('/').pop()}`);
};

loadingManager.onLoad = () => {
    console.log('All assets loaded');
    Preloader.update(1, "Preparing environment...");
    
    // 延迟一点点让用户看到 100%
    setTimeout(() => {
        Preloader.complete(() => {
            // 加载完成后，如果是在 /cube/ 路径下，直接展示
            if (window.location.pathname.includes('/cube/')) {
                showCubePageStandalone();
            }
        });
    }, 200);
};

const isCubeSubdir = window.location.pathname.includes('/cube/');
function initCube() {
    // 初始化预加载器动画
    Preloader.init();
    // 获取容器
    const cubeContainer = document.getElementById('cube-container');
    if (!cubeContainer) return;

    // 设置容器样式
    cubeContainer.style.position = 'fixed';
    cubeContainer.style.top = '0';
    cubeContainer.style.left = '0';
    cubeContainer.style.width = '100%';
    cubeContainer.style.height = '100%';
    cubeContainer.style.zIndex = '-1';
    cubeContainer.style.opacity = '0';
    cubeContainer.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    cubeContainer.style.pointerEvents = 'none';

    // 创建场景
    scene = new THREE.Scene();
    // 背景
    scene.background = new THREE.Color('rgb(159,163,196)');
    
    // 注入 CSS 渐变背景 (实现梦幻淡蓝中心)
    cubeContainer.style.background = 'radial-gradient(circle at center, #ffffff 0%, #eef6ff 100%)';

    // 创建相机
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Three.js r152+ API 变更: outputEncoding -> outputColorSpace
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    cubeContainer.appendChild(renderer.domElement);

    // --- 后处理配置 (丁达尔效应/辉光) ---
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8,    // 强度 (丁达尔感的关键)
        0.4,    // 半径
        0.85    // 阈值 (只让地球的高亮部分发光)
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // 0. 加载环境贴图
    const rgbeLoader = new RGBELoader(loadingManager);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const hdrPath = isCubeSubdir ? 'hdr/spruit_sunrise_1k.hdr' : 'cube/hdr/spruit_sunrise_1k.hdr';
    rgbeLoader.load(hdrPath, (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    });

    // 光照
    const ambientLight = new THREE.AmbientLight(new THREE.Color('#78eaff'), 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    // 1. 加载 FutureCube
    const cubeLoader = new GLTFLoader(loadingManager);
    const dracoLoaderForCube = new DRACOLoader();
    dracoLoaderForCube.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    cubeLoader.setDRACOLoader(dracoLoaderForCube);

    const cubeModelPath = isCubeSubdir ? '../models/FutureCube.glb' : 'models/FutureCube.glb';

    transmissionMaterial = Object.assign(new MeshTransmissionMaterial(1), {
        color: new THREE.Color('#ffffff'),
        clearcoat: 1,
        clearcoatRoughness: 0,
        transmission: 1,
        iridescence: 0.7,
        iridescenceIOR: 0.8,
        chromaticAberration: 0.7,
        anisotrophicBlur: 0.7,
        roughness: 0,
        thickness: 0.8,
        ior: 2.2,
        distortion: 0.1,
        distortionScale: 0.7,
        temporalDistortion: 0.6,
        backsideThickness: 3,
        anisotropicBlur: 0.6,
        side: THREE.DoubleSide
    });

    const originalOnBeforeCompile = transmissionMaterial.onBeforeCompile;

    transmissionMaterial.onBeforeCompile = (shader) => {
        if (originalOnBeforeCompile) originalOnBeforeCompile(shader);
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - saturate(dot(normal, viewDir)), 3.5);
            float shift = 0.05 * fresnel;
            if (gl_FrontFacing) {
                gl_FragColor.r += shift;
                gl_FragColor.b -= shift * 0.3;
                gl_FragColor.rgb += fresnel * vec3(0.5, 0.6, 0.8) * 0.1;
            } else {
                gl_FragColor.rgb *= vec3(0.9, 0.95, 1.1) * fresnel; 
                gl_FragColor.rgb += vec3(0.1, 0.15, 0.2) * fresnel;
                gl_FragColor.a *= 0.7; 
            }`
        );
        transmissionMaterial.userData.shader = shader;
    };

    cubeLoader.load(cubeModelPath, (gltf) => {
        cube = gltf.scene;
        cube.renderOrder = 1;
        cube.traverse((child) => {
            if (child.isMesh) child.material = transmissionMaterial;
        });
        const box = new THREE.Box3().setFromObject(cube);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim;
        cube.scale.set(scale, scale, scale);
        scene.add(cube);
    });

    // 氛围层
    const glowGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
        uniforms: {
            c: { type: "f", value: 0.2 },
            p: { type: "f", value: 3.0 },
            glowColor: { type: "c", value: new THREE.Color(0x00aaff) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize( normalMatrix * normal );
                vec3 vNormel = normalize( normalMatrix * viewVector );
                intensity = pow( 0.6 - dot(vNormal, vNormel), 4.0 );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4( glow, intensity );
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        renderOrder: 0
    });
    glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // 2. 加载地球模型
    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    loader.setDRACOLoader(dracoLoader);

    const modelPath = isCubeSubdir ? '../models/earth-flat.glb' : 'models/earth-flat.glb';

    loader.load(modelPath, (gltf) => {
        earth = gltf.scene;
        earth.renderOrder = 0;
        const box = new THREE.Box3().setFromObject(earth);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        earth.position.set(-center.x, -center.y, -center.z);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / maxDim;
        earth.scale.set(scale, scale, scale);

        earth.traverse((child) => {
            if (child.isMesh) {
                child.material.metalness = 0.2;
                child.material.roughness = 0.5;
                child.material.emissive = new THREE.Color(0x0066ff);
                child.material.emissiveIntensity = 0.5;
                child.material.transparent = false;
            }
        });

        scene.add(earth);
        glowMesh.position.copy(earth.position);
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

// 窗口大小变化处理
function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    if (composer) {
        composer.setSize(w, h);
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (isCubePage) {
        if (cube) {
            cube.rotation.x = currentRotation.x;
            cube.rotation.y = currentRotation.y;

            // 更新所有网格的着色器时间
            cube.traverse((child) => {
                if (child.isMesh && child.material.userData.shader) {
                    child.material.userData.shader.uniforms.time.value = time;
                }
            });
            // 同时更新材质自身的 time uniform (MeshTransmissionMaterial 使用)
            if (transmissionMaterial && transmissionMaterial.uniforms) {
                transmissionMaterial.uniforms.time.value = time;
            }
        }

        if (earth) {
            earth.rotation.y += EarthSpeed;
            earth.rotation.x = currentRotation.x * 0.3;
            earth.rotation.z = Math.sin(time * 0.5) * 0.1;

            // 同步氛围层位置和旋转
            if (glowMesh) {
                glowMesh.position.copy(earth.position);
                glowMesh.rotation.copy(earth.rotation);
                glowMesh.material.uniforms.viewVector.value = camera.position;
            }
        }
    }

    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

// 全局旋转接口：对接 cube.interactions.js
window.rotateCube = function (x, y) {
    // 将角度制转换为弧度制并应用
    currentRotation.x = THREE.MathUtils.degToRad(x);
    currentRotation.y = THREE.MathUtils.degToRad(y);
};

// 导出功能到全局
window.showCubePage = function() {
    isCubePage = true;
    showCubePageStandalone();
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.opacity = '1';
        cubeContainer.style.zIndex = '201'; // 确保在顶层
        cubeContainer.style.pointerEvents = 'auto';
    }
    // 显示导航卡片
    setTimeout(() => showNavCards(), 800);
};

window.showCubePageFull = function() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.zIndex = '201'; // 确保在顶层
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }

    if (mainContent) {
        mainContent.style.filter = 'blur(10px)';
        setTimeout(() => {
            mainContent.style.display = 'none';
        }, 500);
    }

    if (splashScreen) {
        splashScreen.style.display = 'none';
        splashScreen.style.pointerEvents = 'none';
    }
};

window.hideCubePage = function() {
    isCubePage = false;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.opacity = '0';
        setTimeout(() => {
            cubeContainer.style.zIndex = '-1';
            cubeContainer.style.pointerEvents = 'none';
        }, 800);
    }

    if (mainContent) {
        mainContent.style.display = 'flex';
        setTimeout(() => {
            mainContent.style.filter = 'none';
        }, 50);
    }

    if (splashScreen) {
        splashScreen.style.display = 'flex';
        splashScreen.style.pointerEvents = 'auto';
    }
};

function init() {
    initCube();
    if (window.location.pathname.includes('/cube/')) {
        showCubePageStandalone();
    }
}

function showCubePageStandalone() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.zIndex = '201'; // 提到最顶层
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }
}


function triggerEntrance() {
    if (isTransitioning) return;
    isTransitioning = true;

    navigatorBar.style.display = 'flex';

    // 1. 停止背景动画释放资源
    if (window.stopVortex) window.stopVortex();
    if (window.stopSplashParticles) window.stopSplashParticles();

    const splashScreen = document.getElementById('splash-screen');
    const splashLogo = document.querySelector('.splash-logo');
    const cubeContainer = document.getElementById('cube-container');

    // 2. CSS 3D 旋转飞入 (0-2s)
    if (splashLogo) splashLogo.classList.add('splash-exit');
    if (splashScreen) splashScreen.classList.add('splash-blur');

    // 3. 立即准备容器层级和交互 (为了性能，先隐藏 splash 后面的东西)
    if (cubeContainer) {
        cubeContainer.style.zIndex = '201'; // 提到最顶层，超过 splash-screen (200)
        cubeContainer.style.pointerEvents = 'auto'; // 提前开启交互
    }

    // 4. 让 splash-screen 不再拦截事件
    if (splashScreen) {
        splashScreen.style.pointerEvents = 'none';
    }

    // 创建时间线
    const tl = gsap.timeline();

    // 3. 背景颜色渐变 (从第3秒开始)
    tl.to('body', {
        className: '+=transitioning-bg',
        duration: 1,
        delay: 0
    }, 0);

    // 4. 立方体 Z 轴旋转飞入 (3-6s)
    tl.to(cubeContainer, {
        opacity: 1,
        duration: 1
    }, 0); // 稍微提前一点点显示

    tl.to([cube.position, earth.position, glowMesh.position], {
        z: -10,
        duration: 3,
        ease: "expo.out",
        delay: 2.5
    }, 0);

    // 绕 Z 轴丝滑旋转
    tl.to([cube.rotation, earth.rotation, glowMesh.rotation], {
        y: Math.PI * 4, // 旋转两圈
        duration: 4,
        ease: "power2.inOut",
        delay: 0.5
    }, 0);

    // 5. 动画完成后的清理
    tl.add(() => {
        // 彻底隐藏 splash screen 并禁用其交互
        if (splashScreen) {
            splashScreen.style.display = 'none';
            splashScreen.style.pointerEvents = 'none';
        }
        
        scene.background = new THREE.Color(0x9fa3c4);
        renderer.setClearAlpha(1);

        // 启用最终交互状态
        if (window.showCubePage) window.showCubePage();
        isTransitioning = false;
    }, 6);
}

// 导航卡片显示控制
function showNavCards() {
    const container = document.getElementById('nav-cards-container');
    if (container) {
        container.style.display = 'block';
        gsap.fromTo('.nav-card', 
            { opacity: 0, scale: 0.8, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' }
        );
    }
}

function hideNavCards() {
    const container = document.getElementById('nav-cards-container');
    if (container) {
        gsap.to('.nav-card', {
            opacity: 0, scale: 0.8, y: 20, duration: 0.3, stagger: 0.05,
            onComplete: () => { container.style.display = 'none'; }
        });
    }
}

// 卡片点击过渡动画 - 摄像机飞向立方体
function triggerCardTransition(targetLink, clickedCard) {
    if (isTransitioning) return;
    isTransitioning = true;

    const cubeContainer = document.getElementById('cube-container');
    const overlay = document.getElementById('cube-transition-overlay');
    const flashOverlay = document.getElementById('white-flash-overlay');

    if (flashOverlay) {
        flashOverlay.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
    }

    // 触发点击卡片垂直拉伸动画
    if (clickedCard) {
        gsap.to(clickedCard, {
            scaleY: 3,
            duration: 0.25,
            ease: 'power4.out',
            //yoyo: true,
            repeat: 1
        });
    }

    const tl = gsap.timeline();

    // 摄像机飞向立方体动画
    if (camera && cube) {
        const cubeWorldPos = new THREE.Vector3();
        cube.getWorldPosition(cubeWorldPos);

        tl.to(camera.position, {
            x: cubeWorldPos.x * 0.3,
            y: cubeWorldPos.y * 0.3,
            z: -5,
            duration: 1.5,
            ease: 'power2.inOut'
        }, 0);

        tl.to([cube.rotation, earth.rotation, glowMesh.rotation], {
            y: Math.PI * 4, // 旋转两圈
            duration: 4,
            ease: "power2.inOut",
            delay: 0.5
        }, 0);

        tl.to(camera.position, {
            z: -1,
            duration: 1,
            ease: 'power2.in'
        }, 1.5);
    }

    // 隐藏导航卡片
    hideNavCards();

    // 立方体放大效果
    if (cube) {
        tl.to(cube.scale, {
            x: 6, y: 6, z: 6,
            duration: 2,
            ease: 'power2.inOut'
        }, 0);

        tl.to(cube.rotation, {
            y: cube.rotation.y + Math.PI * 2,
            duration: 2,
            ease: 'power2.inOut'
        }, 0);
    }

    // 地球缩小消失
    if (earth) {
        tl.to(earth.scale, {
            x: 0, y: 0, z: 0,
            duration: 1.2,
            ease: 'power2.in'
        }, 0);
    }

    // 背景变化
    if (scene) {
        tl.to(scene.background, {
            r: 0.95, g: 0.95, b: 1.0,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: function() {
                scene.background.setRGB(this.targets()[0].r, this.targets()[0].g, this.targets()[0].b);
            }
        }, 0);
    }

    // 白场过渡效果
    tl.to(flashOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.in'
    }, 1.5);

    tl.to(flashOverlay, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    }, 2.5);

    // 跳转到目标页面
    tl.add(() => {
        if (targetLink) {
            window.location.href = targetLink;
        }
    }, 2.8);
}

// 立方体点击过渡动画 - 10秒艺术字过渡
function triggerCubeTransition() {
    if (isTransitioning) return;
    isTransitioning = true;

    // 播放音效
    const audio = new Audio('audios/cube_entry.ogg');
    audio.volume = 1.5;
    audio.play().catch(e => console.log('Audio play failed:', e));

    // 隐藏导航卡片
    hideNavCards();

    const overlay = document.getElementById('cube-transition-overlay');
    const text = document.getElementById('transition-text');
    const flashOverlay = document.getElementById('white-flash-overlay');
    const cubeContainer = document.getElementById('cube-container');

    if (overlay) {
        overlay.style.display = 'block';
        overlay.classList.add('active');
    }

    const tl = gsap.timeline();

    // 0-2.5秒：立方体旋转至前方，背景变深紫
    tl.to(cubeContainer, {
        duration: 1.5,
        ease: 'power2.inOut'
    }, 0);

    if (cube && camera) {
        tl.to(camera.position, {
            z: -9,
            duration: 4,
            ease: "expo.out",
        }, 0);
        tl.to(cube.scale, {
            x: 8, y: 8, z: 8,
            duration: 2.5,
            ease: 'power2.inOut'
        }, 0);
    }

    if (earth) {
        tl.to(earth.scale, {
            x: 0, y: 0, z: 0,
            duration: 1.5,
            ease: 'power2.in'
        }, 0);
    }

    // 背景渐变深紫
    tl.to('body', {
        backgroundColor: '#1a0a2e',
        duration: 1.5,
        ease: 'power2.inOut'
    }, 0);

    if (scene) {
        tl.to(scene.background, {
            r: 0.1, g: 0.04, b: 0.18,
            duration: 2.5,
            ease: 'power2.inOut',
            onUpdate: function() {
                scene.background.setRGB(this.targets()[0].r, this.targets()[0].g, this.targets()[0].b);
            }
        }, 0);
    }

    // 显示艺术字
    tl.to(text, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power2.out'
    }, 1.5);

    tl.to(text, {
        opacity: 1,
        scale: 1.4,
        duration: 7,
        ease: 'power2.out'
    }, 1.5);

    tl.fromTo('.transition-line1',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        1.5
    );

    tl.fromTo('.transition-line2',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' },
        1.8
    );

    // 白场过渡效果
    tl.to(flashOverlay, {
        opacity: 1,
        duration: 1,
        ease: 'power2.in'
    }, 8.5);

    // 2.5-10秒：持续效果
    tl.to(text, {
        opacity: 0,
        scale: 4,
        duration: 3.5,
        ease: 'power3.in'
    }, 7);

    // 10秒后跳转
    tl.add(() => {
        window.location.href = './islands/index.html';
    }, 11);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 立即初始化预加载器并开始加载
    init();
    navigatorBar = document.querySelector('.top-nav');
    const splashLogo = document.querySelector('.splash-logo');
    if (splashLogo) {
        splashLogo.addEventListener('click', () => {
            triggerEntrance();
        });
    }

    // 导航卡片点击事件 - 触发摄像机飞向立方体动画
    document.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = card.dataset.link;
            if (link) {
                triggerCardTransition(link, card);
            }
        });

        // 卡片悬停时添加拉伸动画类
        card.addEventListener('mouseenter', () => {
            if (!isTransitioning) {
                card.classList.add('stretch');
            }
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('stretch');
        });
    });

    // 立方体点击事件
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.addEventListener('click', (e) => {
            if (isCubePage && isFocusing) triggerCubeTransition();
        });
    }
});
