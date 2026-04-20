import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader,
} from "./shaders.js";

document.addEventListener("DOMContentLoaded", () => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 纹理
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fb7427";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "100px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("HELLO WORLD", w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas);

    // 材质
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            mouse: { value: mouse },
            resolution: { value: new THREE.Vector2(w, h) },
            textureB: { value: tex },
        },
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
    });

    const finalMat = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            textureB: { value: tex },
        },
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    const finalMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMat);
    scene.add(finalMesh);

    const rt = new THREE.WebGLRenderTarget(w, h);

    // 鼠标
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = window.innerHeight - e.clientY;
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        finalMat.uniforms.textureA.value = rt.texture;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
    }

    animate();
});