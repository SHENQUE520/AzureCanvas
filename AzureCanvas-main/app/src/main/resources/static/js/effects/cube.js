// ============================================
// 立方体导航栏、玻璃折射、虹彩、全反射地球盒子模型
// 负责人：@Lotiyu, WYK300
// ============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene, camera, renderer, composer, cube, earth, glowMesh;
let isCubePage = false;
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };
let mousePosition = { x: 0, y: 0 };
let clock = new THREE.Clock();

function initCube() {
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
    scene.background = new THREE.Color('#0b1021');
    
    // 注入 CSS 渐变背景 (实现梦幻淡蓝中心)
    cubeContainer.style.background = 'radial-gradient(circle at center, #ffffff 0%, #eef6ff 100%)';

    // 创建相机
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
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

    // 0. 加载环境贴图 (HDRI)
    const rgbeLoader = new RGBELoader();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    rgbeLoader.load('../textures/hdr/dancing_hall_1k.hdr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    });

    // 添加高质量光照
    const ambientLight = new THREE.AmbientLight(new THREE.Color('#78eaff'), 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    // 1. 创建玻璃立方体
    const cubeGeometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    
    // 核心参数调优：修复侧面不渲染问题 (IOR设为标准玻璃)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        metalness: 0,
        roughness: 0,           
        transmission: 1.0,      
        ior: 1.52,               // 回归标准玻璃折射率，防止侧面全反射
        thickness: 1.5,         // 减小厚度，增加折射清晰度
        specularIntensity: 1.0,
        clearcoat: 1.0,         
        clearcoatRoughness: 0.02,
        attenuationDistance: 1.5,
        attenuationColor: new THREE.Color('#e0f2ff'), 
        transparent: true,
        side: THREE.DoubleSide,
    });

    glassMaterial.renderOrder = 1;

    // 注入高级着色器逻辑
    glassMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - saturate(dot(normal, viewDir)), 3.5);
            float shift = 0.05 * fresnel;
            
            if (gl_FrontFacing) {
                // 正面：清澈、边缘色散
                gl_FragColor.r += shift;
                gl_FragColor.b -= shift * 0.3;
                // 增强边缘清澈白光
                gl_FragColor.rgb += fresnel * vec3(0.5, 0.6, 0.8) * 0.5;
            } else {
                // 内部幽灵反射 (背面)
                gl_FragColor.rgb *= vec3(0.9, 0.95, 1.1); 
                gl_FragColor.rgb += vec3(0.1, 0.15, 0.2) * fresnel;
                gl_FragColor.a *= 0.5; 
            }
            `
        );
        glassMaterial.userData.shader = shader;
    };

    cube = new THREE.Mesh(cubeGeometry, glassMaterial);
    scene.add(cube);

    // --- 地球自发光/丁达尔氛围层 ---
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
    const loader = new GLTFLoader();
    
    // 配置 Draco 解码器
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    loader.setDRACOLoader(dracoLoader);

    const isCubeSubdir = window.location.pathname.includes('/cube/');
    const modelPath = isCubeSubdir ? '../models/earth-transformed.glb' : 'models/earth-transformed.glb';
    
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
                // 使地球更加鲜艳且有自发光
                child.material.metalness = 0.2;
                child.material.roughness = 0.5;
                child.material.emissive = new THREE.Color(0x0066ff); // 梦幻蓝
                child.material.emissiveIntensity = 1.5;            // 配合Bloom产生丁达尔感
                child.material.transparent = false;
            }
        });
        
        scene.add(earth);
        glowMesh.position.copy(earth.position);
    }, undefined, (error) => {
        const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff,
            emissive: 0x0044ff,
            emissiveIntensity: 2.0
        });
        earth = new THREE.Mesh(sphereGeo, sphereMat);
        earth.renderOrder = 0;
        scene.add(earth);
        glowMesh.position.copy(earth.position);
    });

    // 响应窗口大小变化
    window.addEventListener('resize', onWindowResize);

    // 鼠标移动监听
    window.addEventListener('mousemove', (e) => {
        mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // 开始动画循环
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
        targetRotation.y = mousePosition.x * 0.4;
        targetRotation.x = -mousePosition.y * 0.4;

        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

        if (cube) {
            cube.rotation.x = currentRotation.x;
            cube.rotation.y = currentRotation.y;
            if (cube.material.userData.shader) {
                cube.material.userData.shader.uniforms.time.value = time;
            }
        }

        if (earth) {
            earth.rotation.y += 0.005;
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

// 全局旋转函数
window.rotateCube = function (x, y) {
    targetRotation.x += x * 0.01;
    targetRotation.y += y * 0.01;
};

// 导出功能到全局
window.showCubePage = function() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }
};

window.showCubePageFull = function() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.zIndex = '200';
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
        splashScreen.style.display = 'block';
    }
};

function init() {
    initCube();
    initCubePageToggle();
    
    if (window.location.pathname.includes('/cube/')) {
        showCubePageStandalone();
    }
}

function showCubePageStandalone() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.zIndex = '1';
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }
}

function initCubePageToggle() {
    const toggleBtn = document.getElementById('cubePageToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            if (isCubePage) {
                window.hideCubePage();
                toggleBtn.innerHTML = '<i class="fas fa-cube"></i> 立方体页面';
            } else {
                window.showCubePageFull();
                toggleBtn.innerHTML = '<i class="fas fa-arrow-left"></i> 返回主页面';
            }
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
