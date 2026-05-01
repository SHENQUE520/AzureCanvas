import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader,
} from "./liquid/shaders.js";

import * as THREE from 'three';

function initLiquidEffect() {
    const container = document.createElement("div");
    container.id = "liquid-canvas-container";
    Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "1",
        pointerEvents: "none",
        overflow: "hidden"
    });

    const scene = new THREE.Scene();
    const simScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);
    document.body.appendChild(container);

    let frame = 0;

    const TRAIL_SIZE = 128;
    const trailData = new Float32Array(TRAIL_SIZE * 2);
    let trailHead = 0;
    let trailCount = 0;
    let activeTrailLength = 0;

    const mouse = new THREE.Vector2();

    const width = window.innerWidth * window.devicePixelRatio;
    const height = window.innerHeight * window.devicePixelRatio;
    const options = {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
    };

    let rtA = new THREE.WebGLRenderTarget(width, height, options);
    let rtB = new THREE.WebGLRenderTarget(width, height, options);

    const simMaterial = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            mouse: { value: mouse },
            resolution: { value: new THREE.Vector2(width, height) },
            time: { value: 0 },
            frame: { value: 0 },
        },
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
    });

    const renderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            textureB: { value: null },
        },
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
        transparent: true,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const simQuad = new THREE.Mesh(plane, simMaterial);
    const renderQuad = new THREE.Mesh(plane, renderMaterial);

    simScene.add(simQuad);
    scene.add(renderQuad);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });

    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    textTexture.format = THREE.RGBAFormat;

    window.addEventListener("resize", () => {
        const newWidth = window.innerWidth * window.devicePixelRatio;
        const newHeight = window.innerHeight * window.devicePixelRatio;

        renderer.setSize(window.innerWidth, window.innerHeight);
        rtA.setSize(newWidth, newHeight);
        rtB.setSize(newWidth, newHeight);
        simMaterial.uniforms.resolution.value.set(newWidth, newHeight);

        canvas.width = newWidth;
        canvas.height = newHeight;

        textTexture.needsUpdate = true;

        trailData.fill(0);
        trailCount = 0;
        activeTrailLength = 0;
        mouse.set(0, 0);
    });

    window.addEventListener("mousemove", (e) => {
        const x = e.clientX * window.devicePixelRatio;
        const y = (window.innerHeight - e.clientY) * window.devicePixelRatio;

        const lastX = trailData[((trailHead - 1 + TRAIL_SIZE) % TRAIL_SIZE) * 2];
        const lastY = trailData[((trailHead - 1 + TRAIL_SIZE) % TRAIL_SIZE) * 2 + 1];
        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3.0) return;

        const steps = Math.min(Math.ceil(dist / 3.0), TRAIL_SIZE);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const idx = trailHead * 2;
            trailData[idx] = lastX + dx * t;
            trailData[idx + 1] = lastY + dy * t;
            trailHead = (trailHead + 1) % TRAIL_SIZE;
            trailCount = Math.min(trailCount + 1, TRAIL_SIZE);
        }
    });

    // window.addEventListener("mouseleave", () => {
    //     trailData.fill(0);
    //     trailCount = 0;
    //     activeTrailLength = 0;
    //     mouse.set(0, 0);
    // });

    const animate = () => {
        simMaterial.uniforms.frame.value = frame++;
        simMaterial.uniforms.time.value = performance.now() / 1000;

        activeTrailLength = Math.min(trailCount, TRAIL_SIZE);
        if (activeTrailLength > 0) {
            const idx = ((trailHead - activeTrailLength + TRAIL_SIZE) % TRAIL_SIZE) * 2;
            mouse.set(trailData[idx], trailData[idx + 1]);
        } else {
            mouse.set(0, 0);
        }

        if (trailCount > 0) {
            trailCount-=2;
        }

        simMaterial.uniforms.textureA.value = rtA.texture;
        renderer.setRenderTarget(rtB);
        renderer.render(simScene, camera);

        renderMaterial.uniforms.textureA.value = rtB.texture;
        renderMaterial.uniforms.textureB.value = textTexture;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);

        const temp = rtA;
        rtA = rtB;
        rtB = temp;

        requestAnimationFrame(animate);
    };

    animate();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLiquidEffect());
} else {
    initLiquidEffect();
}

export { initLiquidEffect };