import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Preloader } from "./preloader.js";

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    Preloader.update(progress, `Loading: ${url.split('/').pop()}`);
};

loadingManager.onLoad = () => {
    console.log('All assets loaded');
    Preloader.update(1, "Preparing environment...");
    setTimeout(() => {
        Preloader.complete(() => {});
    }, 200);
};

(function() {
    let scene, camera, renderer, clock;
    let islands = [];
    let currentIndex = 0;
    let isTransitioning = true;
    let introPlaying = true;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let craneGroup = new THREE.Group();
    let cloudGroup = new THREE.Group();
    let scrollTimeout;
    let targetCamPos = new THREE.Vector3(-60, 20, -60);
    let currentLookAt = new THREE.Vector3(0, 0, 0); // 新增：当前相机注视点
    let targetLookAt = new THREE.Vector3(0, 0, 0);  // 新增：目标相机注视点

    // 开场动画状态
    let introCameraState = { theta: 0, phi: Math.PI * 0.15, radius: 80, height: 60 };
    const INTRO_FIRST_ISLAND_POS = { x: 30, y: 5, z: 30 };

    // 配置
    const CONFIG = {
        islands: [
            {
                name: 'IsleA',
                path: '../models/Islands/IsleA.glb',
                link: '../treehole/index.html',
                pos: [30, 0, 30],
                scale: 1.3
            },
            {
                name: 'IsleC',
                path: '../models/Islands/IsleC.glb',
                link: '../storymap/index.html',
                pos: [35, -10, -35],

                scale: 0.75
            },
            {
                name: 'IsleB',
                path: '../models/Islands/Isle B.glb',
                link: '../azure_trade/trade.html',
                pos: [-35, -10, -35],
                offset_y: 180,
                scale: 0.7
            }
        ]
    };

    function init() {
        // 场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa5d8ff);
        // 雾气增加层次感
        scene.fog = new THREE.FogExp2(0xeef6ff, 0.012);

        // 相机 - 初始朝向天空
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        // 初始位置：从远处仰望天空
        const initTheta = Math.PI * 0.25;
        const initPhi = Math.PI * 0.1;
        camera.position.set(
            Math.sin(initPhi) * Math.cos(initTheta) * 80,
            60 + Math.cos(initPhi) * 30,
            Math.sin(initPhi) * Math.sin(initTheta) * 80
        );
        introCameraState.theta = initTheta;
        introCameraState.phi = initPhi;

        // 渲染器 - 高清设置
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 关键：提升画质和色彩
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;

        document.getElementById('canvas-container').appendChild(renderer.domElement);

        clock = new THREE.Clock();

        // 灯光 - 游戏画风强调明暗对比
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(20, 40, 20);
        sunLight.castShadow = true;
        // 阴影质量
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);

        // 辅助光，防止背面太黑
        const fillLight = new THREE.PointLight(0xbde0ff, 1.0);
        fillLight.position.set(-20, 10, -20);
        scene.add(fillLight);

        // 初始化环境
        createSky();
        createCranes();
        createCloudLines();

        // 加载模型
        loadModels();

        // 事件监听
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);

        animate();
    }

    // 创建梦幻渐变背景
    function createSky() {
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;
        const uniforms = {
            topColor: { value: new THREE.Color(0x7ec2ff) }, // 稍深一点的蓝
            bottomColor: { value: new THREE.Color(0xeef6ff) }, // 蓝白色
            offset: { value: 400 },
            exponent: { value: 0.6 }
        };
        const skyGeo = new THREE.SphereGeometry(500, 32, 15);
        const skyMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.BackSide });
        scene.add(new THREE.Mesh(skyGeo, skyMat));
    }

    function createCranes() {
        scene.add(craneGroup);
        const craneCount = 240; // 增加数量以覆盖全空间

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0.6,   0.4, 0, 0,   0, 0, -0.6,
            0, 0, 0.6,   -0.4, 0, 0,   0, 0, -0.6,
            0, 0, 0.4,   0.8, 0.4, 0,   0, 0, -0.4,
            0, 0, 0.4,   -0.8, 0.4, 0,   0, 0, -0.4
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            flatShading: true,
            emissive: 0x222222
        });

        for(let i = 0; i < craneCount; i++) {
            const crane = new THREE.Mesh(geometry.clone(), material.clone());
            resetCrane(crane);
            craneGroup.add(crane);
        }
    }

    function resetCrane(crane) {
        // 范围覆盖全空间
        const range = 150;
        crane.position.set(
            (Math.random() - 0.5) * range * 2,
            Math.random() * 60 - 10,
            (Math.random() - 0.5) * range * 2
        );

        // 固定直线方向
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.05 + 0.15;
        crane.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.cos(angle) * speed, // 极轻微的上下漂移
            Math.sin(angle) * speed
        );
        crane.rotation.y = -angle + Math.PI / 2;
    }

    // 创建带面的云朵
    function createCloudLines() {
        scene.add(cloudGroup);
        const cloudCount = 50;

        for(let i = 0; i < cloudCount; i++) {
            const group = new THREE.Group();
            const segments = 3 + Math.floor(Math.random() * 4);
            const cloudColor = 0xffffff;

            let currentX = 0;
            for(let j = 0; j < segments; j++) {
                const w = 0.5 + Math.random() * 4;
                const h = 0.5 + Math.random() * 0.5;
                const geo = new THREE.PlaneGeometry(w, h);
                const mat = new THREE.MeshBasicMaterial({
                    color: cloudColor,
                    transparent: true,
                    opacity: 0.3 + Math.random() * 0.2,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(geo, mat);
                plane.position.x = currentX + w/2;
                plane.position.y = (Math.sin(j) - 0.5) * 0.5;
                plane.rotation.z = (Math.sin(j) - 0.5) * 0.1; // 极小弧度，避免大幅弯折

                group.add(plane);
                currentX += w * 0.8; // 稍微重叠
            }

            group.position.set(
                (Math.random() - 0.5) * 200,
                Math.random() * 40 + 10,
                (Math.random() - 0.5) * 200
            );
            group.rotation.y = Math.random() * Math.PI * 2;
            group.userData.speed = 0.02 + Math.random() * 0.03;
            cloudGroup.add(group);
        }
    }

    function loadModels() {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
        loader.setDRACOLoader(dracoLoader);

        CONFIG.islands.forEach((config, index) => {
            loader.load(config.path, (gltf) => {
                const model = gltf.scene;

                // 设置缩放
                const scale = 0.5 * config.scale;
                model.scale.set(scale, scale, scale);

                // 岛屿位置直接使用配置中的 pos
                const finalPos = new THREE.Vector3(config.pos[0], config.pos[1], config.pos[2]);

                const wrapper = new THREE.Group();
                wrapper.add(model);
                wrapper.position.copy(finalPos);

                // 计算该岛屿相对于中心的方向向量和初始角度
                const dir = finalPos.clone().setY(0).normalize();
                const angle = Math.atan2(dir.x, dir.z);

                wrapper.userData = {
                    index: index,
                    link: config.link,
                    originalPos: finalPos.clone(),
                    angle: angle
                };

                // 材质优化
                model.traverse(child => {
                    if(child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if(child.material) {
                            child.material.roughness = 0.7;
                            child.material.metalness = 0.1;
                            if(child.material.color) {
                                child.material.color.multiplyScalar(1.2);
                            }
                        }
                    }
                });

                scene.add(wrapper);
                islands[index] = wrapper;

                // 第一个岛屿初始聚焦
                if(index === 0) {
                    focusIsland(0, false);
                    // 延迟启动开场动画，等待场景稳定
                    setTimeout(() => playIntroAnimation(), 300);
                }
            });
        });
    }

    function shift_lookAt_position(index){
        let lookAt_Y = 0;
        if (index === 0){
            lookAt_Y = 5;
        }
        else if(index === 1){
            lookAt_Y = 10;
        }
        else if(index === 2){
            lookAt_Y = 7;
        }
        return lookAt_Y;
    }

    function focusIsland(index, animated = true, duration = 1.8) {
        if(!islands[index]) return;
        currentIndex = index;
        const target = islands[index];
        const pos = CONFIG.islands[index].pos;

        // 核心：摄像机在正方形中心区域进行“内侧”旋转
        const innerRadius = 15;
        const camHeight = 12;

        const targetDir = new THREE.Vector3(pos[0], 0, pos[2]).normalize();
        targetCamPos.copy(targetDir).multiplyScalar(innerRadius);
        targetCamPos.y = camHeight;

        // 更新目标注视点
        targetLookAt.copy(target.position);
        let angle_pitch_offset = 0;
        try {
            angle_pitch_offset = shift_lookAt_position(index);
        } catch (err) {

        }
        if(animated) {
            isTransitioning = true;

            const tl = gsap.timeline({
                onComplete: () => { isTransitioning = false; }
            });

            targetLookAt.y += angle_pitch_offset;

            // 同时动画相机位置和注视点，实现“无死角”平滑过渡
            tl.to(camera.position, {
                x: targetCamPos.x,
                y: targetCamPos.y,
                z: targetCamPos.z,
                duration: duration,
                ease: "power3.inOut"
            });

            tl.to(currentLookAt, {
                x: targetLookAt.x,
                y: targetLookAt.y,
                z: targetLookAt.z,
                duration: duration,
                ease: "power2.inOut",
                onUpdate: () => {
                    camera.lookAt(currentLookAt);
                }
            }, "<"); // "<" 表示与上一个动画同时开始

        } else {
            camera.position.copy(targetCamPos);
            currentLookAt.copy(targetLookAt);
            camera.lookAt(currentLookAt);
        }
    }

    function onWheel(e) {
        e.preventDefault();
        if(isTransitioning || introPlaying) return;

        // 简单的防抖/限频
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if(e.deltaY > 0) {
                if(currentIndex < CONFIG.islands.length - 1) {
                    focusIsland(currentIndex + 1);
                }
            } else {
                if(currentIndex > 0) {
                    focusIsland(currentIndex - 1);
                }
            }
        }, 30);
    }


    // 千万不要改
    function onMouseMove(e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    function onMouseDown(e) {
        if(isTransitioning || introPlaying) return;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if(intersects.length > 0) {
            let selected = intersects[0].object;
            // 向上查找包含 userData 的 Group
            while(selected.parent && !selected.userData.link) {
                selected = selected.parent;
            }

            if(selected.userData.link) {
                triggerJumpTransition(selected);
            }
        }
    }

    function triggerJumpTransition(island) {
        isTransitioning = true;
        const link = island.userData.link;

        const tl = gsap.timeline();

        // 1. 弹跳动画
        tl.to(island.position, {
            y: island.position.y + 1.5,
            duration: 0.4,
            ease: "back.out(2)"
        });

        // 2. 飞入动画 (相机冲向岛屿中心)
        tl.to(camera.position, {
            x: island.position.x,
            y: island.position.y+1,
            z: island.position.z,
            duration: 1.2,
            ease: "power4.in",
            onUpdate: () => {
                camera.lookAt(island.position);
            }
        }, "-=0.2");

        // 3. 黑场过度
        tl.to('#overlay', {
            opacity: 1,
            duration: 0.8,
            onComplete: () => {
                window.location.href = link;
            }
        }, "-=0.4");
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // 千纸鹤直线运动
        craneGroup.children.forEach((crane, i) => {
            crane.position.addScaledVector(crane.userData.velocity, 1);
            // crane.position.y += Math.sin(elapsed * 2 + i) * 0.01; // 不需上下呼吸感

            // 翅膀拍动 (操作折纸翅膀顶点)
            const pos = crane.geometry.attributes.position;
            const wingY = 0.4 + Math.sin(elapsed * 8 + i) * 0.4;
            pos.setY(7, wingY);
            pos.setY(10, wingY);
            pos.needsUpdate = true;

            // 超出范围重置
            if(crane.position.length() > 200) resetCrane(crane);
        });

        // 云朵实体缓慢平移
        cloudGroup.children.forEach(cloud => {
            cloud.position.x += cloud.userData.speed;
            if(cloud.position.x > 150) cloud.position.x = -150;
        });

        // 岛屿微动浮动
        islands.forEach((island, i) => {
            if(island && !isTransitioning) {
                island.position.y = island.userData.originalPos.y + Math.sin(elapsed * 0.8 + i) * 0.55;
            }
        });

        // 相机轻微跟随鼠标 (缓动) - 开场动画期间跳过
        if(!isTransitioning && !introPlaying && islands[currentIndex]) {
            const targetX = targetCamPos.x + mouse.x * 2;
            const targetY = targetCamPos.y - mouse.y * 2;
            const targetZ = targetCamPos.z;

            camera.position.x += (targetX - camera.position.x) * 0.15;
            camera.position.y += (targetY - camera.position.y) * 0.35;
            camera.position.z += (targetZ - camera.position.z) * 0.15;

            // 确保在闲置状态下也平滑注视目标
            currentLookAt.lerp(targetLookAt, 0.05);
            camera.lookAt(currentLookAt);
        }

        renderer.render(scene, camera);
    }

    // ==================== 开场动画 ====================
    function playIntroAnimation() {
        const welcomeEl = document.querySelector('.intro-line-welcome');
        const titleEl = document.querySelector('.intro-line-title');
        const introOverlay = document.getElementById('intro-overlay');

        // 播放音效
        try {
            const introAudio = new Audio('../audios/skyland/intro.ogg');
            introAudio.volume = 1;
            introAudio.play().catch(() => {});

            setTimeout(() => {
                try {
                    const splashAudio = new Audio('../audios/skyland/island_splash.ogg');
                    splashAudio.volume = 1;
                    splashAudio.play().catch(() => {});
                } catch(e) {}
            }, 0);
        } catch(e) {}

        // 初始相机朝向天空中心上方
        camera.position.set(
            Math.sin(introCameraState.phi) * Math.cos(introCameraState.theta) * introCameraState.radius,
            introCameraState.height,
            Math.sin(introCameraState.phi) * Math.sin(introCameraState.theta) * introCameraState.radius
        );
        currentLookAt.set(0, 80, 0);
        targetLookAt.set(0, 80, 0);
        camera.lookAt(currentLookAt);

        const tl = gsap.timeline({
            onComplete: () => {
                introPlaying = false;
                isTransitioning = false;
                // 清理DOM
                if (introOverlay) {
                    introOverlay.style.display = 'none';
                }
            }
        });

        // === 阶段1: "Welcome To..." 淡入上浮 (0s - 1.2s) ===
        tl.to(welcomeEl, {
            opacity: 1,
            y: -20,
            duration: 1.2,
            ease: 'power3.out'
        }, 0);

        // === 阶段2: "Azure Skyland" 出现并推挤 (0.8s - 2.2s) ===
        tl.to(titleEl, {
            opacity: 1,
            y: -10,
            duration: 1,
            ease: 'power3.out'
        }, 0.8);

        // 同步将 Welcome To 向上推挤
        // tl.to(welcomeEl, {
        //     y: -55,
        //     duration: 1.0,
        //     ease: 'power2.inOut'
        // }, 0.8);

        // === 阶段3: 文字消散 + 摄像机螺旋旋转 (3s - 5s) ===
        tl.to([welcomeEl, titleEl], {
            opacity: 0,
            y: -80,
            duration: 1.5,
            ease: 'power3.in',
            stagger: 0.15
        }, 2.0);

        // 摄像机螺旋参数动画
        const camTargetPos = {
            theta: introCameraState.theta,
            phi: introCameraState.phi,
            radius: introCameraState.radius,
            height: introCameraState.height
        };

        // 目标：第一个岛屿的观察位置
        const firstIslandDir = new THREE.Vector3(30, 0, 30).normalize();
        const finalTheta = Math.atan2(firstIslandDir.z, firstIslandDir.x);
        const finalRadius = 18;
        const finalHeight = 12;

        tl.to(camTargetPos, {
            theta: finalTheta + Math.PI * 1.5, // 螺旋旋转约270度
            phi: Math.PI * 0.45,
            radius: finalRadius,
            height: finalHeight,
            duration: 4.0,
            ease: 'power3.inOut',
            onUpdate: () => {
                //camera.lookAt(targetLookAt);
                // currentLookAt.copy(targetLookAt);
                // camera.lookAt(currentLookAt);
                focusIsland(1, true, 2.8);
            }
        }, 0);
    }

    init();
})();
