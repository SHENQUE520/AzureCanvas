/**
 * 瀑布传送门动画效果
 * 画风：像素风、动漫风
 * 技术：Three.js + Custom Shaders
 */

(function() {
    let scene, camera, renderer, clock;
    let waterfallMaterial, splashMaterial, caveMaterial;

    const container = document.getElementById('canvas-container');

    // 颜色调色板 (8种蓝色)
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

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 正交相机，适合 2D 效果
        const aspect = width / height;
        const viewSize = 10;
        camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 1000
        );
        camera.position.z = 10;

        renderer = new THREE.WebGLRenderer({ antialias: true }); // 像素风不需要抗锯齿
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        createCave();
        createWaterfall();
        createSplashes();

        window.addEventListener('resize', onWindowResize);
        animate();
    }

// [任务 2] 添加进入瀑布的交互
window.addEventListener('mousedown', () => {
    // 1. 视觉反馈：利用 GSAP 让相机向瀑布中心缩进

    gsap.to(camera, {
        zoom: 5, // [可调参数] 缩放倍数
        duration: 1.5,
        ease: "power2.in",
        onUpdate: () => camera.updateProjectionMatrix(),
        onComplete: () => {
            // 2. 跳转到瀑布内页面
            window.location.href = 'inner-portal.html';
        }
    });
});


    // 创建山洞背景
    function createCave() {
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

        caveMaterial = new THREE.ShaderMaterial(caveShader);
        const cave = new THREE.Mesh(caveGeometry, caveMaterial);
        cave.position.z = -1;
        scene.add(cave);

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
            scene.add(rock);
        }
    }

    // 创建瀑布
    function createWaterfall() {
        const geometry = new THREE.PlaneGeometry(6, 16);
        
        // 瀑布着色器：像素化线条，多层次颜色
        const waterfallShader = {
            uniforms: {
                uTime: { value: 0 },
                uColors: { value: PALETTE },
                uResolution: { value: new THREE.Vector2(6, 16) }
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
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    // 像素化处理 - 纵横比例
                    vec2 pixelSize = vec2(48.0, 96.0);
                    vec2 uv = floor(vUv * pixelSize) / pixelSize;
                    
                    float speed = 3.5;
                    float flow = uv.y + uTime * speed;
                    
                    // 动漫风线条：通过 x 轴的不同频率波浪叠加
                    float lines = sin(uv.x * 30.0 + uTime * 2.0) * 0.1;
                    lines += sin(uv.x * 60.0 - uTime * 1.5) * 0.05;
                    lines += sin(uv.x * 120.0 + uTime * 3.0) * 0.02;
                    
                    // 纵向流动感
                    float verticalNoise = hash(vec2(uv.x, floor(flow * 12.0)));
                    float colorValue = (uv.x + lines + verticalNoise * 0.2);
                    
                    // 确保 8 种颜色都能体现：将 colorValue 映射到 0-7
                    // 我们想要一些垂直的色带效果
                    float stripe = sin(uv.x * 15.0) * 0.5 + 0.5;
                    float combined = mix(colorValue, stripe, 0.4);
                    
                    int colorIndex = int(clamp(floor(combined * 8.0), 0.0, 7.0));
                    vec3 color = uColors[colorIndex];
                    
                    // 添加白色高光线条 (动漫风常见)
                    float highlights = step(0.92, hash(vec2(uv.x, floor(flow * 15.0))));
                    if (highlights > 0.5) {
                        color = mix(color, vec3(1.0, 1.0, 1.0), 0.6);
                    }
                    
                    // 瀑布本体的形状控制：边缘稍微弯曲
                    float shape = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0);
                    
                    // 传送门顶部圆角效果
                    float portalTop = 1.0;
                    if (vUv.y > 0.8) {
                        float distTop = length((vUv - vec2(0.5, 0.8)) * vec2(1.0, 0.5));
                        portalTop = 1.0 - smoothstep(0.45, 0.5, distTop);
                    }
                    
                    // 透明度处理
                    float alpha = shape * portalTop;
                    // 顶部淡入效果
                    alpha *= smoothstep(1.0, 0.85, vUv.y);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        };

        waterfallMaterial = new THREE.ShaderMaterial(waterfallShader);
        const waterfall = new THREE.Mesh(geometry, waterfallMaterial);
        waterfall.position.y = 1; // 稍微向上偏移，让底部有空间放水花
        scene.add(waterfall);
    }

    // 创建底部水花
    function createSplashes() {
        const splashCount = 60;
        // 使用圆形几何体作为水花颗粒
        const geometry = new THREE.CircleGeometry(0.2, 5); // 5边形，带点像素感
        
        const splashGroup = new THREE.Group();
        
        for(let i = 0; i < splashCount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: PALETTE[Math.floor(Math.random() * 4)], // 使用较浅的前 4 种颜色
                transparent: true,
                opacity: 0.8
            });
            const splash = new THREE.Mesh(geometry, material);
            
            resetSplash(splash);
            // 随机化初始生命值，让水花错开
            splash.userData.life = Math.random();
            
            splashGroup.add(splash);
        }
        
        splashGroup.position.y = -7.5; // 瀑布底部位置
        scene.add(splashGroup);
        
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
        const mistMat = new THREE.ShaderMaterial(mistShader);
        const mist = new THREE.Mesh(mistGeo, mistMat);
        mist.position.y = -7.5;
        mist.position.z = 0.1; // 在水花前面
        scene.add(mist);
        scene.userData.mistMaterial = mistMat;
        
        scene.userData.splashes = splashGroup;
    }

    function resetSplash(mesh) {
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

    function updateSplashes(delta) {
        const splashGroup = scene.userData.splashes;
        if (!splashGroup) return;

        splashGroup.children.forEach(splash => {
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
                resetSplash(splash);
            }
        });

        if (scene.userData.mistMaterial) {
            scene.userData.mistMaterial.uniforms.uTime.value += delta;
        }
    }

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const aspect = width / height;
        const viewSize = 10;
        
        camera.left = -viewSize * aspect;
        camera.right = viewSize * aspect;
        camera.top = viewSize;
        camera.bottom = -viewSize;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        if(waterfallMaterial) {
            waterfallMaterial.uniforms.uTime.value = elapsed;
        }
        
        if(caveMaterial) {
            caveMaterial.uniforms.uTime.value = elapsed;
        }

        updateSplashes(delta);

        renderer.render(scene, camera);
    }

    // 初始化
    init();
})();
