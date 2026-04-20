import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { MeshTransmissionMaterial } from '../futurecube/MeshTransmissionMaterial.js';
import gsap from 'gsap';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

class LaserTunnel {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        
        this.params = {
            tunnelRadius: 8,
            tunnelLength: 200,
            segments: 150,
            spiralTurns: 6,
            bloomStrength: 2.0,
            bloomRadius: 0.5,
            bloomThreshold: 0.2
        };

        this.init();
    }

    async init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        await this.loadEnvironment();
        this.setupPostProcessing();
        
        this.createTunnel();
        this.createLasers();
        this.createExit();
        
        this.addEventListeners();
        this.animate();
    }

    async loadEnvironment() {
        const loader = new RGBELoader();
        const texture = await loader.loadAsync('../cube/hdr/spruit_sunrise_1k.hdr');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
        //this.scene.background = texture; // Keep background dark as requested
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x020205, 1); // Not completely black
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera.position.z = 10;
        this.scene.add(this.camera);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const pinkLight = new THREE.PointLight(0xff00ff, 10, 20);
        pinkLight.position.set(5, 5, 5);
        this.scene.add(pinkLight);

        const blueLight = new THREE.PointLight(0x00ffff, 10, 20);
        blueLight.position.set(-5, -5, 5);
        this.scene.add(blueLight);
    }

    setupPostProcessing() {
        this.renderScene = new RenderPass(this.scene, this.camera);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.bloomPass);
    }

    createTunnel() {
        this.tunnelGroup = new THREE.Group();
        this.scene.add(this.tunnelGroup);

        const createMaterial = (color) => {
            const mat = new MeshTransmissionMaterial(6);
            mat.color = new THREE.Color(color);
            mat.emissive = new THREE.Color('#222222');
            mat.transmission = 0.95;
            mat.roughness = 0.05;
            mat.ior = 1.4;
            mat.thickness = 1.0;
            mat.specularIntensity = 1.5;
            mat.envMapIntensity = 2.0;
            mat.chromaticAberration = 0.1;
            mat.anisotrophicBlur = 0.1;
            mat.iridescence = 0.9;
            mat.iridescenceIOR = 0.8;
            // Iridescence simulation via transmission settings and environment map
            return mat;
        };

        const pinkMat = createMaterial('#ff33aa');
        const blueMat = createMaterial('#33aaff');
        const cyanMat = createMaterial('#33ffff');

        // Create a more interconnected structure
        const ringCount = this.params.segments;
        const pointsPerRing = 12;
        
        for (let layer = 0; layer < 2; layer++) {
            const layerGroup = new THREE.Group();
            const radiusBase = this.params.tunnelRadius * (1 + layer * 0.4);
            
            for (let i = 0; i < ringCount; i++) {
                const t = i / ringCount;
                const z = -t * this.params.tunnelLength;
                const spiralAngle = t * Math.PI * 2 * this.params.spiralTurns + (layer * Math.PI);
                
                // Create ring of points
                const ringPoints = [];
                for (let j = 0; j < pointsPerRing; j++) {
                    const ringAngle = (j / pointsPerRing) * Math.PI * 2 + spiralAngle;
                    //const noise = Math.sin(t * 20 + j) * 0.5;
                    const r = radiusBase;
                    const x = Math.cos(ringAngle) * r;
                    const y = Math.sin(ringAngle) * r;
                    ringPoints.push(new THREE.Vector3(x, y, z));
                }

                // Add geometry at these points
                ringPoints.forEach((p, j) => {
                    if (Math.random() > 0.4) {
                        const geometry = Math.random() > 0.5 ? 
                            new THREE.BoxGeometry(0.2, 0.2, 3) :
                            new THREE.CylinderGeometry(0.1, 0.1, 3, 4);
                        
                        const mat = (i + j + layer) % 3 === 0 ? pinkMat : ((i + j + layer) % 3 === 1 ? blueMat : cyanMat);
                        const mesh = new THREE.Mesh(geometry, mat);
                        mesh.position.copy(p);
                        
                        // Orient towards next point or center
                        mesh.lookAt(new THREE.Vector3(0, 0, p.z));
                        mesh.rotation.z += Math.random() * Math.PI;
                        
                        layerGroup.add(mesh);
                    }

                    // Add connecting struts between points in the same ring
                    if (Math.random() > 0.7) {
                        const nextP = ringPoints[(j + 1) % pointsPerRing];
                        const dist = p.distanceTo(nextP);
                        const strutGeo = new THREE.BoxGeometry(0.05, 0.05, dist);
                        const strutMat = (i + j) % 2 === 0 ? pinkMat : blueMat;
                        const strut = new THREE.Mesh(strutGeo, strutMat);
                        
                        strut.position.copy(p).add(nextP).multiplyScalar(0.5);
                        strut.lookAt(nextP);
                        layerGroup.add(strut);
                    }
                });
            }
            this.tunnelGroup.add(layerGroup);
        }
    }

    createLasers() {
        this.lasers = [];
        const laserGeo = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
        
        for (let i = 0; i < 30; i++) {
            const isPink = Math.random() > 0.5;
            const color = isPink ? 0xff00ff : 0x00ffff;
            
            // Create a group for the laser and its glow
            const laserGroup = new THREE.Group();
            
            // Core
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const core = new THREE.Mesh(laserGeo, coreMat);
            laserGroup.add(core);
            
            // Outer glow (simulated with a larger cylinder)
            const glowGeo = new THREE.CylinderGeometry(0.15, 0.15, 11, 8);
            const glowMat = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            laserGroup.add(glow);

            this.resetLaser(laserGroup);
            this.scene.add(laserGroup);
            this.lasers.push(laserGroup);
        }
    }

    resetLaser(laser) {
        const radius = Math.random() * 6 + 2;
        const angle = Math.random() * Math.PI * 2;
        laser.position.x = Math.cos(angle) * radius;
        laser.position.y = Math.sin(angle) * radius;
        // Start far away or near the exit
        laser.position.z = this.camera.position.z - 100 - Math.random() * 100;
        laser.rotation.x = Math.PI / 2;
        // Point towards camera slightly
        //laser.lookAt(this.camera.position.x, this.camera.position.y, this.camera.position.z + 50);
        laser.userData.speed = 2.0 + Math.random() * 3.0;
    }

    createExit() {
        // Glowing white exit
        const exitGroup = new THREE.Group();
        
        const exitGeo = new THREE.CircleGeometry(15, 64);
        const exitMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        this.exit = new THREE.Mesh(exitGeo, exitMat);
        exitGroup.add(this.exit);
        
        // Add layers of glow for the exit
        for (let i = 1; i <= 3; i++) {
            const glowGeo = new THREE.CircleGeometry(15 + i * 5, 64);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3 / i,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.z = 0.1 * i;
            exitGroup.add(glow);
        }

        exitGroup.position.z = -this.params.tunnelLength;
        this.scene.add(exitGroup);
        
        // Add a strong point light at the exit
        const exitLight = new THREE.PointLight(0xffffff, 50, 100);
        exitLight.position.copy(exitGroup.position);
        this.scene.add(exitLight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse move effect
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            
            gsap.to(this.camera.position, {
                x: x * 3,
                y: -y * 3,
                duration: 1,
                ease: 'power2.out'
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Smooth camera movement forward
        this.camera.position.z -= delta * 8;
        
        // Slight rotation for space feel
        this.camera.rotation.z = Math.sin(time * 0.2) * 0.1;
        
        // Loop camera position
        if (this.camera.position.z < -this.params.tunnelLength + 20) {
            this.camera.position.z = 10;
        }

        // Rotate tunnel layers independently
        this.tunnelGroup.children.forEach((layer, i) => {
            const direction = i % 2 === 0 ? 1 : -1;
            layer.rotation.z += delta * 0.1 * direction;
            
            // Individual mesh animation
            layer.children.forEach((mesh, j) => {
                mesh.rotation.x += delta * 0.2;
                mesh.rotation.y += delta * 0.15;
                
                // Breathing/Scaling effect
                const pulse = 1 + Math.sin(time * 2 + j * 0.1) * 0.05;
                mesh.scale.set(pulse, pulse, pulse);

                // Update material time if available
                if (mesh.material.uniforms && mesh.material.uniforms.time) {
                    mesh.material.uniforms.time.value = time;
                }
            });
        });

        // Update lasers
        this.lasers.forEach(laser => {
            laser.position.z += laser.userData.speed * 2;
            
            // Make lasers "pulse"
            laser.scale.x = 1 + Math.sin(time * 10) * 0.5;
            laser.scale.z = 1 + Math.sin(time * 10) * 0.5;

            if (laser.position.z > this.camera.position.z + 10) {
                this.resetLaser(laser);
            }
        });

        this.composer.render();
    }
}

new LaserTunnel();