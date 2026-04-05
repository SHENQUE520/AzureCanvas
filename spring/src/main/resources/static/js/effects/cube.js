// 立方体效果实现 - 高级玻璃折射与地球模型
let scene, camera, renderer, cube, earth;
let isCubePage = false;
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };
let mousePosition = { x: 0, y: 0 };
let clock = new THREE.Clock();

// 初始化立方体场景
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
    cubeContainer.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    cubeContainer.style.pointerEvents = 'none';

    // 创建场景
    scene = new THREE.Scene();
    // 渐变背景感，使用深色
    scene.background = new THREE.Color(0x0a0a0f);

    // 创建相机
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    cubeContainer.appendChild(renderer.domElement);

    // 0. 加载环境贴图 (HDRI) - 关键质感来源
    const rgbeLoader = new THREE.RGBELoader();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        
        // 释放原始纹理
        texture.dispose();
        pmremGenerator.dispose();
    });

    // 添加高质量光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 5, 10);
    scene.add(mainLight);

    // 1. 创建玻璃立方体 (带高级折射与幽灵反射)
    const cubeGeometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    
    // 玻璃材质：深度模拟 MeshTransmissionMaterial
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.02,
        transmission: 1.0,    // 全透射
        ior: 1.5,             // 标准玻璃折射率
        thickness: 0.5,       // 厚度感
        specularIntensity: 1,
        specularColor: new THREE.Color(0xffffff),
        opacity: 1,
        transparent: true,
        side: THREE.DoubleSide, // 渲染双面以产生内部反射（幽灵反射）
    });

    // 注入高级着色器逻辑：色散、边缘强化、内部幽灵反射
    glassMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            
            // 1. 计算菲涅尔系数 (用于边缘强化)
            float fresnel = pow(1.0 - saturate(dot(normal, vViewPosition)), 4.0);
            
            // 2. 模拟色散 (Chromatic Aberration)
            // 在边缘处对 R 和 B 通道进行不同程度的偏移
            vec3 viewDir = normalize(vViewPosition);
            float distortion = fresnel * 0.4;
            
            // 增强高光边缘
            gl_FragColor.rgb += fresnel * vec3(0.2, 0.3, 0.5); 
            
            // 3. 幽灵反射强化 (针对背部面)
            if (!gl_FrontFacing) {
                // 内部面的颜色稍微偏蓝，增加通透感
                gl_FragColor.rgb *= vec3(0.8, 0.9, 1.2);
                gl_FragColor.rgb += vec3(0.05, 0.05, 0.1);
                gl_FragColor.a *= 0.5; // 背部面稍微透明一点
            } else {
                // 正面增加一点点彩虹色散感
                gl_FragColor.r += distortion * 0.1;
                gl_FragColor.b -= distortion * 0.05;
            }
            
            // 增加整体的清澈感
            gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), fresnel * 0.1);
            `
        );
        glassMaterial.userData.shader = shader;
    };

    cube = new THREE.Mesh(cubeGeometry, glassMaterial);
    scene.add(cube);

    // 2. 加载模型 (支持 Draco 压缩)
    const loader = new THREE.GLTFLoader();
    
    // 配置 Draco 解码器
    if (THREE.DRACOLoader) {
        try {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/'); // 使用官方 CDN
            loader.setDRACOLoader(dracoLoader);
        } catch (e) {
            console.warn('DRACOLoader 初始化失败:', e);
        }
    }

    // 配置 Meshopt 解码器
    if (typeof MeshoptDecoder !== 'undefined') {
        loader.setMeshoptDecoder(MeshoptDecoder);
    }

    // 配置 KTX2 解码器 (容错处理)
    if (THREE.KTX2Loader) {
        try {
            const ktx2Loader = new THREE.KTX2Loader();
            ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/basis/');
            ktx2Loader.detectSupport(renderer);
            loader.setKTX2Loader(ktx2Loader);
        } catch (e) {
            console.warn('KTX2Loader 初始化失败:', e);
        }
    }

    // 加载模型 (自动处理路径)
    const isCubeSubdir = window.location.pathname.includes('/cube/');
    const modelPath = isCubeSubdir ? '../models/earth-transformed.glb' : 'models/earth-transformed.glb';
    const envPath = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr';
    
    loader.load(modelPath, (gltf) => {
        earth = gltf.scene;
        
        // 自动计算并调整缩放与居中
        const box = new THREE.Box3().setFromObject(earth);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // 居中模型
        earth.position.x += (earth.position.x - center.x);
        earth.position.y += (earth.position.y - center.y);
        earth.position.z += (earth.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / maxDim; // 稍微调大一点点
        earth.scale.set(scale, scale, scale);
        
        // 调整材质使其更有质感
        earth.traverse((child) => {
            if (child.isMesh) {
                child.material.metalness = 0.4;
                child.material.roughness = 0.6;
                // 确保它在立方体内部正确渲染
                child.renderOrder = 1;
            }
        });
        
        scene.add(earth);
    }, undefined, (error) => {
        console.error('加载地球模型失败:', error);
        // 备选方案：如果加载失败，创建一个发光球体
        const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({ 
            color: 0x3366ff, 
            emissive: 0x112244,
            roughness: 0.3,
            metalness: 0.8
        });
        earth = new THREE.Mesh(sphereGeo, sphereMat);
        scene.add(earth);
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    if (isCubePage) {
        // 1. 平滑旋转控制 (Lerp)
        targetRotation.y = mousePosition.x * 0.4;
        targetRotation.x = -mousePosition.y * 0.4;

        currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
        currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

        if (cube) {
            cube.rotation.x = currentRotation.x;
            cube.rotation.y = currentRotation.y;
            
            // 更新着色器时间
            if (cube.material.userData.shader) {
                cube.material.userData.shader.uniforms.time.value = time;
            }
        }

        if (earth) {
            // 地球自转
            earth.rotation.y += 0.005;
            // 轻轻跟随
            earth.rotation.x = currentRotation.x * 0.3;
            earth.rotation.z = Math.sin(time * 0.5) * 0.1;
        }
    }

    renderer.render(scene, camera);
}

// 全局旋转函数 (保持兼容性)
window.rotateCube = function (x, y) {
    targetRotation.x += x * 0.01;
    targetRotation.y += y * 0.01;
};

// 显示立方体页面
function showCubePage() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }
}

// 显示全屏立方体页面
function showCubePageFull() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.zIndex = '200'; // 确保在最顶层
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
}

// 隐藏立方体页面
function hideCubePage() {
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
}

// 鼠标控制逻辑 (简化，现在由 animate 中的 mousePosition 驱动)
function initMouseControl() {
    // 已经集成到全局 mousemove 和 animate 中
}

// 实现页面下拉进入效果 (保留逻辑)
function initScrollEffect() {
    document.addEventListener('wheel', (e) => {
        if (e.deltaY > 100 && !isCubePage && window.scrollY === 0) {
            // 这里可以触发进入，但由于业务逻辑可能复杂，保持原样或精简
        }
    }, { passive: true });
}

// 初始化所有功能
function init() {
    initCube();
    initCubePageToggle();
    
    // 如果是专门的立方体页面，直接显示
    if (window.location.pathname.includes('/cube/')) {
        showCubePageStandalone();
    }
}

// 专门用于独立页面的显示逻辑
function showCubePageStandalone() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.zIndex = '1';
        cubeContainer.style.opacity = '1';
        cubeContainer.style.pointerEvents = 'auto';
    }
}

// 初始化立方体页面切换按钮
function initCubePageToggle() {
    const toggleBtn = document.getElementById('cubePageToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            if (isCubePage) {
                hideCubePage();
                toggleBtn.innerHTML = '<i class="fas fa-cube"></i> 立方体页面';
            } else {
                showCubePageFull();
                toggleBtn.innerHTML = '<i class="fas fa-arrow-left"></i> 返回主页面';
            }
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
