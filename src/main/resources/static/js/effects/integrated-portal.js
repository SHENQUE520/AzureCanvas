import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

(function() {
    let renderer, clock;
    let currentCamera, waterfallCamera, portalCamera;
    let waterfallScene, portalScene;
    let waterfallGroup, portalGroup;
    let waterfallMaterial, caveMaterial, mistMaterial;
    let composer, bloomPass, radialBlurPass;
    let isInsidePortal = false;
    let scrollProgress = 0;

    // Audio setup
    let listener, audioLoader, waterfallSound, splashSound, lowPassFilter;

    // Palette for waterfall
    const PALETTE = [
        new THREE.Color('#E0F7FA'),
        new THREE.Color('#B2EBF2'),
        new THREE.Color('#81D4FA'),
        new THREE.Color('#4FC3F7'),
        new THREE.Color('#29B6F6'),
        new THREE.Color('#0288D1'),
        new THREE.Color('#01579B'),
        new THREE.Color('#0D47A1')
    ];

    function init() {
        // --- Renderer Setup ---
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        clock = new THREE.Clock();

        // --- Audio Setup ---
        listener = new THREE.AudioListener();
        audioLoader = new THREE.AudioLoader();
        waterfallSound = new THREE.PositionalAudio(listener);
        splashSound = new THREE.Audio(listener);
        lowPassFilter = listener.context.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 22000;

        // --- Camera Setup ---
        const aspect = window.innerWidth / window.innerHeight;
        const viewSize = 10;
        waterfallCamera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 1000
        );
        waterfallCamera.position.z = 10;

        portalCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        portalCamera.position.z = 50;
        portalCamera.add(listener);

        currentCamera = waterfallCamera;

        // --- Scene Setup ---
        waterfallScene = new THREE.Scene();
        waterfallScene.background = new THREE.Color(0x050505);
        waterfallGroup = new THREE.Group();
        waterfallScene.add(waterfallGroup);

        portalScene = new THREE.Scene();
        portalScene.background = new THREE.Color(0x00050a);
        portalGroup = new THREE.Group();
        portalScene.add(portalGroup);

        // --- Build Content ---
        buildWaterfallContent();
        buildPortalContent();

        // --- Post Processing ---
        initPostProcessing();

        // --- Event Listeners ---
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('wheel', onWheel);

        animate();
    }

    function buildWaterfallContent() {
        // Cave
        const caveGeometry = new THREE.PlaneGeometry(30, 20);
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
                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                float noise(vec2 p) {
                    vec2 i = floor(p); vec2 f = fract(p);
                    float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                void main() {
                    vec2 uv = floor(vUv * 128.0) / 128.0;
                    float n = noise(uv * 10.0) + noise(uv * 20.0) * 0.5;
                    vec3 darkStone = vec3(0.02, 0.02, 0.04);
                    vec3 lightStone = vec3(0.08, 0.08, 0.12);
                    vec3 color = mix(darkStone, lightStone, n);
                    float distCenter = length((vUv - vec2(0.5, 0.5)) * vec2(0.6, 1.0));
                    float vignette = smoothstep(0.1, 0.7, distCenter);
                    gl_FragColor = vec4(mix(color, vec3(0.0), vignette), 1.0);
                }
            `
        };
        caveMaterial = new THREE.ShaderMaterial(caveShader);
        const cave = new THREE.Mesh(caveGeometry, caveMaterial);
        cave.position.z = -1;
        waterfallGroup.add(cave);

        // Rocks
        for(let i = 0; i < 12; i++) {
            const rockSize = Math.random() * 2 + 1;
            const rockGeo = new THREE.CircleGeometry(rockSize, 6);
            const rockMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c, transparent: true, opacity: 0.8 });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, -0.5);
            rock.rotation.z = Math.random() * Math.PI;
            waterfallGroup.add(rock);
        }

        // Waterfall
        const waterfallGeometry = new THREE.PlaneGeometry(6, 16);
        const waterfallShader = {
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
                float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                void main() {
                    vec2 uv = floor(vUv * vec2(48.0, 96.0)) / vec2(48.0, 96.0);
                    float flow = uv.y + uTime * 3.5;
                    float lines = sin(uv.x * 30.0 + uTime * 2.0) * 0.1 + sin(uv.x * 60.0 - uTime * 1.5) * 0.05 + sin(uv.x * 120.0 + uTime * 3.0) * 0.02;
                    float colorValue = (uv.x + lines + hash(vec2(uv.x, floor(flow * 12.0))) * 0.2);
                    float stripe = sin(uv.x * 15.0) * 0.5 + 0.5;
                    int colorIndex = int(clamp(floor(mix(colorValue, stripe, 0.4) * 8.0), 0.0, 7.0));
                    vec3 color = uColors[colorIndex];
                    if (step(0.92, hash(vec2(uv.x, floor(flow * 15.0)))) > 0.5) color = mix(color, vec3(1.0), 0.6);
                    float shape = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0);
                    float portalTop = (vUv.y > 0.8) ? (1.0 - smoothstep(0.45, 0.5, length((vUv - vec2(0.5, 0.8)) * vec2(1.0, 0.5)))) : 1.0;
                    gl_FragColor = vec4(color, shape * portalTop * smoothstep(1.0, 0.85, vUv.y));
                }
            `,
            transparent: true
        };
        waterfallMaterial = new THREE.ShaderMaterial(waterfallShader);
        const waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
        waterfall.position.y = 1;
        waterfallGroup.add(waterfall);

        // Splashes
        const splashCount = 60;
        const splashGeo = new THREE.CircleGeometry(0.2, 5);
        const splashGroup = new THREE.Group();
        for(let i = 0; i < splashCount; i++) {
            const material = new THREE.MeshBasicMaterial({ color: PALETTE[Math.floor(Math.random() * 4)], transparent: true, opacity: 0.8 });
            const splash = new THREE.Mesh(splashGeo, material);
            resetSplash(splash);
            splash.userData.life = Math.random();
            splashGroup.add(splash);
        }
        splashGroup.position.y = -7.5;
        waterfallGroup.add(splashGroup);
        waterfallGroup.userData.splashes = splashGroup;

        // Mist
        const mistGeo = new THREE.PlaneGeometry(10, 3);
        const mistShader = {
            uniforms: { uTime: { value: 0 }, uColor: { value: PALETTE[1] } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
                void main() {
                    float noise = sin(vUv.x * 10.0 + uTime) * 0.1;
                    float alpha = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
                    gl_FragColor = vec4(uColor, alpha * 0.4);
                }
            `,
            transparent: true
        };
        mistMaterial = new THREE.ShaderMaterial(mistShader);
        const mist = new THREE.Mesh(mistGeo, mistMaterial);
        mist.position.y = -7.5;
        mist.position.z = 0.1;
        waterfallGroup.add(mist);
    }

    function resetSplash(mesh) {
        mesh.position.x = (Math.random() - 0.5) * 6.5;
        mesh.position.y = (Math.random() - 0.5) * 1.0;
        mesh.userData.velocity = new THREE.Vector2((Math.random() - 0.5) * 0.15, Math.random() * 0.25 + 0.15);
        mesh.userData.life = 1.0;
        mesh.scale.setScalar(Math.random() * 0.8 + 0.4);
    }

    function buildPortalContent() {
        // Water Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0066ff'); gradient.addColorStop(0.5, '#002288'); gradient.addColorStop(1, '#0066ff');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = `rgba(150, 200, 255, ${Math.random() * 0.25})`;
            ctx.beginPath();
            ctx.ellipse(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, Math.random() * 40 + 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const waterTexture = new THREE.CanvasTexture(canvas);
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

        // Tunnel
        const tunnelGeom = new THREE.CylinderGeometry(5, 5, 300, 32, 1, true);
        const tunnelMat = new THREE.MeshBasicMaterial({ map: waterTexture, side: THREE.BackSide, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.rotation.x = Math.PI / 2;
        portalGroup.add(tunnel);
        portalGroup.userData.tunnel = tunnel;

        // End Portal
        const portalGeo = new THREE.CircleGeometry(5, 32);
        const portalMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.z = -150;
        portalGroup.add(portal);
        portalGroup.userData.portalEnd = portal;
        portal.add(waterfallSound);

        // Particles
        const particleCount = 3000;
        const pGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const colorHelper = new THREE.Color();
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 4.8;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
            colorHelper.setHSL(Math.random(), 1.0, 0.4);
            colors[i * 3] = colorHelper.r; colors[i * 3 + 1] = colorHelper.g; colors[i * 3 + 2] = colorHelper.b;
        }
        pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const pMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 0.08, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
        const particles = new THREE.Points(pGeometry, pMaterial);
        portalGroup.add(particles);

        // Audio Loads
        audioLoader.load('../waterfall/public/audio/waterfall_loop.mp3', (buffer) => {
            waterfallSound.setBuffer(buffer);
            waterfallSound.setLoop(true);
            waterfallSound.setRefDistance(10);
            waterfallSound.setMaxDistance(200);
            waterfallSound.setRolloffFactor(2);
            waterfallSound.setVolume(0.5);
            waterfallSound.setFilter(lowPassFilter);
        });
        audioLoader.load('../waterfall/public/audio/teleport_splash.mp3', (buffer) => {
            splashSound.setBuffer(buffer);
            splashSound.setVolume(0.6);
        });
    }

    function initPostProcessing() {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(waterfallScene, waterfallCamera));

        bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.9);
        composer.addPass(bloomPass);

        const RadialBlurShader = {
            uniforms: { "tDiffuse": { value: null }, "strength": { value: 0.0 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform sampler2D tDiffuse; uniform float strength; varying vec2 vUv;
                void main() {
                    vec2 dir = vUv - vec2(0.5); vec4 color = vec4(0.0);
                    for(float i = 0.0; i < 10.0; i++) color += texture2D(tDiffuse, vUv - dir * strength * i);
                    gl_FragColor = (color / 10.0) * 1.2;
                }
            `
        };
        radialBlurPass = new ShaderPass(RadialBlurShader);
        composer.addPass(radialBlurPass);
    }

    function onMouseDown() {
        if (!isInsidePortal) {
            transitionToPortal();
        }
        startAudio();
    }

    function transitionToPortal() {
        
        // 1. Zoom waterfall & fade to white
        const tl = gsap.timeline();
        
        tl.to(waterfallCamera, {
            zoom: 5,
            duration: 0.7,
            ease: "power4.in",
            onUpdate: () => waterfallCamera.updateProjectionMatrix()
        });

        tl.to("#white-fade", {
            opacity: 1,
            duration: 0.5,
            ease: "power2.in"
        }, "-=0.5");

        tl.add(() => {
            // Switch scenes
            composer.passes[0].scene = portalScene;
            composer.passes[0].camera = portalCamera;
            currentCamera = portalCamera;
            
            // Portal entry animation
            const portalEndMat = portalGroup.userData.portalEnd.material;
            portalEndMat.opacity = 1;
            portalEndMat.color.setRGB(1, 1, 1);
            
            if (splashSound.buffer) splashSound.play();
            isInsidePortal = true;
        });

        tl.to("#white-fade", {
            opacity: 0,
            duration: 1.5,
            ease: "power2.out"
        });
    }

    function onWheel(e) {
        if (!isInsidePortal) return;
        scrollProgress += e.deltaY * 0.05;
        const targetZ = THREE.MathUtils.clamp(50 - scrollProgress, -145, 100);
        gsap.to(portalCamera.position, {
            z: targetZ,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => updatePortalEffects()
        });
    }

    function updatePortalEffects() {
        const portalEnd = portalGroup.userData.portalEnd;
        const dist = Math.abs(portalCamera.position.z - portalEnd.position.z);
        const progress = THREE.MathUtils.clamp(1.0 - (dist / 200), 0, 1);
        
        if (progress > 0.6) {
            radialBlurPass.uniforms.strength.value = THREE.MathUtils.mapLinear(progress, 0.6, 0.99, 0, 0.12);
            bloomPass.strength = 1.0 + Math.pow((progress - 0.6) * 6, 2);
        } else {
            radialBlurPass.uniforms.strength.value = 0;
            bloomPass.strength = 1.0;
        }

        if (waterfallSound.isPlaying && progress < 0.99) {
            if (progress > 0.75) {
                const freq = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(progress, 0.75, 0.99, 22000, 200), 200, 22000);
                lowPassFilter.frequency.setValueAtTime(freq, listener.context.currentTime);
            } else {
                lowPassFilter.frequency.setValueAtTime(22000, listener.context.currentTime);
            }
            waterfallSound.setVolume(THREE.MathUtils.lerp(0.5, 1.5, progress));
        }
    }

    function startAudio() {
        if (listener.context.state === 'suspended') listener.context.resume();
        if (isInsidePortal && waterfallSound.buffer && !waterfallSound.isPlaying) waterfallSound.play();
    }

    function onWindowResize() {
        const width = window.innerWidth, height = window.innerHeight;
        renderer.setSize(width, height);
        composer.setSize(width, height);
        
        const aspect = width / height;
        const viewSize = 10;
        waterfallCamera.left = -viewSize * aspect;
        waterfallCamera.right = viewSize * aspect;
        waterfallCamera.updateProjectionMatrix();

        portalCamera.aspect = aspect;
        portalCamera.updateProjectionMatrix();
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        if (!isInsidePortal) {
            if (waterfallMaterial) waterfallMaterial.uniforms.uTime.value = elapsed;
            if (caveMaterial) caveMaterial.uniforms.uTime.value = elapsed;
            if (mistMaterial) mistMaterial.uniforms.uTime.value = elapsed;
            
            const splashes = waterfallGroup.userData.splashes;
            if (splashes) {
                splashes.children.forEach(splash => {
                    splash.position.x += splash.userData.velocity.x;
                    splash.position.y += splash.userData.velocity.y;
                    splash.userData.velocity.y -= 0.012;
                    splash.userData.life -= delta * 1.2;
                    splash.material.opacity = splash.userData.life;
                    splash.rotation.z += delta * 5.0;
                    if(splash.userData.life <= 0) resetSplash(splash);
                });
            }
        } else {
            const tunnel = portalGroup.userData.tunnel;
            if (tunnel) tunnel.material.map.offset.y -= 0.01;
        }

        composer.render();
    }

    init();
})();
