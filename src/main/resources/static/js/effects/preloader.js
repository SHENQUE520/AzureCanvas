import * as THREE from 'three';

/**
 * 预加载器动画逻辑
 * 负责三角形翻滚动画、进度条更新及场景切换
 */
export const Preloader = (function() {
    let scene, camera, renderer, triangle, shadow;
    let rafId = null;
    let container = document.getElementById('preloader-canvas-container');
    let percentageText = document.getElementById('loading-percentage');
    let progressFill = document.getElementById('progress-bar-fill');
    let statusText = document.getElementById('loading-status');
    let preloaderElement = document.getElementById('preloader');
    let splashScreen = document.getElementById('splash-screen');
    
    let isInitialized = false;

    function init() {
        if (!container) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(200, 200);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // 灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(5, 10, 5);
        scene.add(spotLight);

        // 创建浅蓝纯色三角形 (等边三角形)
        const geometry = new THREE.ConeGeometry(1, 0.2, 3);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x78eaff, 
            flatShading: true,
            shininess: 100
        });
        triangle = new THREE.Mesh(geometry, material);
        triangle.rotation.x = Math.PI / 2;
        scene.add(triangle);

        // 简单的阴影面
        const shadowGeo = new THREE.CircleGeometry(0.8, 32);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.2 
        });
        shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -1.2;
        scene.add(shadow);

        isInitialized = true;
        animate();
    }

    function animate() {
        if (!isInitialized) return;
        rafId = requestAnimationFrame(animate);

        const time = Date.now() * 0.002;
        
        // 三角形翻滚动画
        if (triangle) {
            triangle.rotation.y += 0.05;
            triangle.rotation.z += 0.02;
            triangle.position.y = Math.sin(time) * 0.2;
            
            // 阴影随高度缩放
            if (shadow) {
                const s = 1 - Math.abs(triangle.position.y) * 0.5;
                shadow.scale.set(s, s, s);
                shadow.material.opacity = 0.2 * s;
            }
        }

        renderer.render(scene, camera);
    }

    /**
     * 更新加载进度
     * @param {number} progress 0-1
     * @param {string} status 当前加载的状态文本
     */
    function update(progress, status) {
        const percent = Math.floor(progress * 100);
        if (percentageText) percentageText.innerText = `${percent}%`;
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (statusText && status) statusText.innerText = status;
    }

    /**
     * 加载完成，执行丝滑切换
     * @param {Function} callback 切换完成后的回调
     */
    function complete(callback) {
        if (preloaderElement) {
            preloaderElement.classList.add('fade-out');
            isInitialized = false;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            
            // 延迟显示 splash screen 并触发其自身的入场效果
            setTimeout(() => {
                if (splashScreen) {
                    // 触发一些 CSS 动画或透明度渐变
                    splashScreen.style.opacity = '0';
                    setTimeout(() => {
                        splashScreen.style.transition = 'opacity 1s ease';
                        splashScreen.style.opacity = '1';
                    }, 50);
                }
                if (callback) callback();
                if (renderer) {
                    renderer.dispose();
                }
            }, 1000);
        }
    }

    return {
        init,
        update,
        complete
    };
})();
