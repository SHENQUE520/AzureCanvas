import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

(function() {
    let scene, camera, renderer, clock;
    let islands = [];
    let currentIndex = 0;
    let isTransitioning = false;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let craneGroup = new THREE.Group();
    let cloudGroup = new THREE.Group();
    let scrollTimeout;
    let targetCamPos = new THREE.Vector3(30, 20, 30);

    // 配置
    const CONFIG = {
        islands: [
            { 
                name: 'IsleA', 
                path: '../models/Islands/IsleA.glb', 
                link: '../treehole/treehole.html',
                scale: 2 // 微调缩放
            },
            { 
                name: 'IsleB', 
                path: '../models/Islands/Isle B.glb', 
                link: '../azure_trade/trade.html',
                scale: 1.0
            }
        ],
        spiral: {
            radius: 15,
            heightStep: 5,
            angleStep: Math.PI / 3 // 螺旋角度
        }
    };

    function init() {
        // 场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa5d8ff);
        // 雾气增加层次感
        scene.fog = new THREE.FogExp2(0xeef6ff, 0.012);

        // 相机
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(30, 20, 30);

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
        const craneCount = 40; // 增加数量以覆盖全空间
        
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
        const speed = Math.random() * 0.05 + 0.05;
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
        const cloudCount = 25;
        
        for(let i = 0; i < cloudCount; i++) {
            const group = new THREE.Group();
            const segments = 3 + Math.floor(Math.random() * 3);
            const cloudColor = 0xffffff;
            
            let currentX = 0;
            for(let j = 0; j < segments; j++) {
                const w = 4 + Math.random() * 4;
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
                plane.position.y = (Math.random() - 0.5) * 0.5;
                plane.rotation.z = (Math.random() - 0.5) * 0.1; // 极小弧度，避免大幅弯折
                
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
                
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center); // 内部对中

                // const size = box.getSize(new THREE.Vector3());
                // const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 0.5*config.scale;
                model.scale.set(scale, scale, scale);

                // 螺旋布局
                const angle = index * CONFIG.spiral.angleStep;
                const radius = CONFIG.spiral.radius;
                const finalPos = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    -index * CONFIG.spiral.heightStep,
                    Math.sin(angle) * radius
                );
                
                const wrapper = new THREE.Group();
                wrapper.add(model);
                wrapper.position.copy(finalPos);
                wrapper.userData = { 
                    index: index, 
                    link: config.link,
                    originalPos: finalPos.clone(),
                    angle: angle
                };

                // 材质优化：增加饱和度，减少金属感
                model.traverse(child => {
                    if(child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if(child.material) {
                            child.material.roughness = 0.7;
                            child.material.metalness = 0.1;
                            // 确保颜色明亮
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
                }
            });
        });
    }

    function focusIsland(index, animated = true) {
        if(!islands[index]) return;
        currentIndex = index;
        const target = islands[index];
        const angle = target.userData.angle;
        
        // 核心：计算一致的相机位置（基于岛屿当前的螺旋角度）
        const camDist = 25;
        const camHeight = 10;
        targetCamPos.set(
            target.position.x + Math.cos(angle) * camDist,
            target.position.y + camHeight,
            target.position.z + Math.sin(angle) * camDist
        );

        if(animated) {
            isTransitioning = true;
            
            // 计算中转点，实现“环绕”感
            const midAngle = angle + 0.5; // 稍微偏转
            const midPos = new THREE.Vector3(
                target.position.x + Math.cos(midAngle) * (camDist + 5),
                target.position.y + camHeight + 5, // 向上拉升
                target.position.z + Math.sin(midAngle) * (camDist + 5)
            );

            const tl = gsap.timeline({
                onComplete: () => { isTransitioning = false; }
            });

            // 优雅的曲线路径：先升后降，平滑加速
            tl.to(camera.position, {
                x: midPos.x,
                y: midPos.y,
                z: midPos.z,
                duration: 0.8,
                ease: "power2.in",
                onUpdate: () => camera.lookAt(target.position)
            })
            .to(camera.position, {
                x: targetCamPos.x,
                y: targetCamPos.y,
                z: targetCamPos.z,
                duration: 1.0,
                ease: "power2.out",
                onUpdate: () => camera.lookAt(target.position)
            });
            
        } else {
            camera.position.copy(targetCamPos);
            camera.lookAt(target.position);
        }
    }

    function onWheel(e) {
        e.preventDefault();
        if(isTransitioning) return;

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
        }, 50);
    }

    function onMouseMove(e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    function onMouseDown(e) {
        if(isTransitioning) return;

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
                island.position.y = island.userData.originalPos.y + Math.sin(elapsed * 0.8 + i) * 0.15;
            }
        });

        // 相机轻微跟随鼠标 (缓动)
        if(!isTransitioning && islands[currentIndex]) {
            const targetX = targetCamPos.x + mouse.x * 2;
            const targetY = targetCamPos.y - mouse.y * 2;
            const targetZ = targetCamPos.z;
            
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (targetY - camera.position.y) * 0.05;
            camera.position.z += (targetZ - camera.position.z) * 0.05;
            //camera.lookAt(islands[currentIndex].position);
        }

        renderer.render(scene, camera);
    }

    init();
})();
