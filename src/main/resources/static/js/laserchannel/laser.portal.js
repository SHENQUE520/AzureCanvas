import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { MeshTransmissionMaterial } from '../futurecube/MeshTransmissionMaterial.js';

// 场景全局变量
let scene, camera, renderer, composer;
let channelInner, channelOuter;
let laserCannons = [];
let cameraTargetPosition; // 用于相机平滑移动的目标位置

// 场景参数
const sceneWidth = window.innerWidth;
const sceneHeight = window.innerHeight;
const channelRadiusInner = 5;
const channelRadiusOuter = 6;
const channelHeight = 50; // 通道长度
const numberOfLaserCannons = 30;
const laserCannonSpacing = channelHeight / numberOfLaserCannons;

// 颜色
const pinkColor = new THREE.Color(0xff77ff); // 洋红色
const magentaColor = new THREE.Color(0xff00ff); // 也可以是更深的洋红色
const laserPink = new THREE.Color(0xff69b4); // 热粉色
const laserBlue = new THREE.Color(0x00ffff); // 青色/亮蓝色

// 初始化函数
function init() {
    // 1. 场景设置
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, sceneWidth / sceneHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sceneWidth, sceneHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // 提高清晰度
    document.body.appendChild(renderer.domElement);

    // 设置摄像机初始位置和朝向
    camera.position.set(0, 0, 0); // 在通道一端中央
    cameraTargetPosition = new THREE.Vector3(0, 0, channelHeight); // 朝向另一端
    camera.lookAt(cameraTargetPosition);

    // 2. 通道几何体 - 内层
    const innerMaterial = Object.assign(new MeshTransmissionMaterial(10), {
        color: 0xff0099, // 基础洋红色
        transmission: 1, // 完全透明
        opacity: 0.8,
        thickness: 0.5, // 玻璃厚度，影响折射
        roughness: 0.1, // 稍微光滑，保留一点漫反射
        clearcoat: 0.5, // 增加一些光泽
        clearcoatRoughness: 0.05,
        iridescence: 1.0, // 虹彩强度
        iridescenceIOR: 1.5, // 虹彩的折射率
        iridescenceThickness: 0.8, // 虹彩的厚度
        side: THREE.DoubleSide // 双面渲染，防止内部看不到
    });

    const innerGeometry = new THREE.CylinderGeometry(channelRadiusInner, channelRadiusInner, channelHeight, 64, 1, true); // true表示盖子
    innerGeometry.translate(0, 0, 0);
    channelInner = new THREE.Mesh(innerGeometry, innerMaterial);
    channelInner.position.set(0, 0, channelHeight / 2); // 调整通道位置
    scene.add(channelInner);

    // 3. 通道几何体 - 外层
    const outerMaterial = new THREE.MeshStandardMaterial({
        color: magentaColor,
        metalness: 0.5,
        roughness: 0.5,
        side: THREE.DoubleSide
    });
    const outerGeometry = new THREE.CylinderGeometry(channelRadiusOuter, channelRadiusOuter, channelHeight, 64, 1, true);
    outerGeometry.translate(0, channelHeight / 2, 0);
    channelOuter = new THREE.Mesh(outerGeometry, outerMaterial);
    channelOuter.position.set(0, 0, channelHeight / 2);
    scene.add(channelOuter);

    // 4. 通道符号 (整齐的点组成)
    const symbolMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const symbolRadius = 0.05;
    const symbolGeometry = new THREE.SphereGeometry(symbolRadius, 16, 16);

    // 简单的符号示例：一个十字星
    function createStarSymbol(position) {
        const star = new THREE.Group();

        // 主体
        const main = new THREE.Mesh(symbolGeometry, symbolMaterial);
        main.position.set(0, 0, 0);
        star.add(main);

        // 四个射线
        for (let i = 0; i < 4; i++) {
            const ray = new THREE.Mesh(symbolGeometry, symbolMaterial);
            const angle = Math.PI / 2 * i;
            ray.position.set(Math.cos(angle) * (symbolRadius * 3), Math.sin(angle) * (symbolRadius * 3), 0);
            star.add(ray);
        }

        star.position.copy(position);
        return star;
    }

    // 在内层通道表面生成符号
    const numberOfSymbols = 100;
    for (let i = 0; i < numberOfSymbols; i++) {
        const angle = (i / numberOfSymbols) * Math.PI * 2;
        const y = (Math.random() - 0.5) * channelHeight; // 随机高度
        const x = channelRadiusInner * Math.cos(angle);
        const z = channelRadiusInner * Math.sin(angle);

        const symbolPosition = new THREE.Vector3(x, y, z);
        // 需要将符号法线与通道表面法线对齐，这里简化处理，直接添加到通道的局部坐标系中，并尝试使其朝外
        const symbol = createStarSymbol(symbolPosition);
        // 寻找一种方法将符号旋转使其法线朝向圆柱体外侧。
        // 对于圆柱体，表面法线在XY平面上，方向由角度决定。
        // 我们可以根据符号的x, z坐标来计算角度，然后进行旋转。
        const symbolAngle = Math.atan2(z, x);
        symbol.rotation.y = symbolAngle + Math.PI / 2; // 旋转到朝外
        symbol.rotation.x = Math.PI / 2; // 修正z轴向上

        channelInner.add(symbol); // 添加到内层通道组中，使其一起移动
    }


    // 5. 激光炮
    const laserCannonMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
    const laserCannonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8, 1);
    laserCannonGeometry.translate(0, 0.5, 0); // 将圆柱体中心移到底部

    for (let i = 0; i < numberOfLaserCannons; i++) {
        const cannon = new THREE.Mesh(laserCannonGeometry, laserCannonMaterial);
        const angle = Math.random() * Math.PI * 2; // 随机角度
        const distance = channelRadiusOuter * 1.1; // 稍微超出外层通道
        const x = distance * Math.cos(angle);
        const z = distance * Math.sin(angle);
        const y = i * laserCannonSpacing - channelHeight / 2 + 0.5; // 沿通道长度分布

        cannon.position.set(x, y, z);
        cannon.lookAt(0, y, 0); // 朝向通道中心轴
        cannon.userData.initialPosition = cannon.position.clone(); // 保存初始位置
        cannon.userData.initialRotation = cannon.rotation.clone(); // 保存初始旋转

        // 激光炮的颜色
        const laserColor = Math.random() < 0.5 ? laserPink : laserBlue;
        cannon.userData.laserColor = laserColor;

        // 添加一个发光的激光发生器
        const emitter = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshPhysicalMaterial({ color: laserColor, emissive: laserColor, emissiveIntensity: 2 })
        );
        emitter.position.set(0, 0.5, 0);
        cannon.add(emitter);

        laserCannons.push(cannon);
        scene.add(cannon);
    }

    // 6. 通道出口
    const exitGeometry = new THREE.PlaneGeometry(channelRadiusInner * 2.5, channelRadiusInner * 2.5);
    const exitMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        emissive: 0xffffff,
        emissiveIntensity: 5 // 强烈的发光
    });
    const exitPlane = new THREE.Mesh(exitGeometry, exitMaterial);
    exitPlane.position.set(0, 0, channelHeight); // 在通道的另一端
    exitPlane.rotation.y = Math.PI / 2; // 旋转到正面朝向摄像机
    scene.add(exitPlane);

    // 7. 环境光 (通道外的场景)
    const ambientLight = new THREE.AmbientLight(0xffffff, 10); // 柔和的环境光
    scene.add(ambientLight);

    // 8. 后期处理 - Unreal Bloom
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(sceneWidth, sceneHeight),
        1.5,
        0.4,
        0.1
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 2;
    bloomPass.radius = 0.5;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 9. 窗口大小改变处理
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height); // 更新 EffectComposer 的大小
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 10. 动画 - 激光炮朝向摄像机移动
    const time = performance.now() * 0.001; // 时间，用于平滑动画
    const cameraSpeed = 0.001; // 相机移动速度

    // 激光炮的简单摆动和朝向摄像机的效果
    laserCannons.forEach(cannon => {
        // 简单的周期性摆动
        const oscillation = Math.sin(time * 2 + cannon.position.x * 0.1) * 0.2; // 摆动幅度
        const swingAngle = Math.PI / 4; // 最大摆动角度

        // 计算激光炮应该朝向的方向
        // 目标是通道的出口方向，或者更动态一点，朝向摄像机的当前位置
        const targetDirection = new THREE.Vector3().subVectors(camera.position, cannon.position).normalize();
        cannon.lookAt(camera.position); // 直接看向摄像机

        // 也可以让激光炮有轻微的径向移动
        const radialOffset = Math.cos(time * 1.5 + cannon.position.y * 0.2) * 0.5;
        const currentAngle = Math.atan2(cannon.position.z, cannon.position.x);
        const newX = (channelRadiusOuter * 1.1 + radialOffset) * Math.cos(currentAngle);
        const newZ = (channelRadiusOuter * 1.1 + radialOffset) * Math.sin(currentAngle);
        cannon.position.set(newX, cannon.userData.initialPosition.y + oscillation, newZ);

        // 确保激光炮始终朝向摄像机
        cannon.lookAt(camera.position);
    });


    // 11. 动画 - 相机丝滑移动
    const delta = cameraSpeed * 0.1; // 每次迭代的移动距离 (0.1 是一个微小的比例因子)
    camera.position.lerp(cameraTargetPosition, delta); // 使用 lerp 进行平滑插值
    camera.lookAt(cameraTargetPosition); // 确保相机始终看向目标

    // 渲染场景
    composer.render();
}

// 启动
init();
animate();