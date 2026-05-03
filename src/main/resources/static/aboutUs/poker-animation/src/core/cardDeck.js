import { __toESM } from "../../_virtual/_rolldown/runtime.js";
import { BoxGeometry, MathUtils, Mesh, MeshStandardMaterial, Vector3, TextureLoader } from "three";
import { require_matter } from "../../node_modules/matter-js/build/matter.js";
import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { CARD_APPEARANCE } from "../config/cardConfig.js";
import { getPerformanceConfig } from "../utils/performance.js";
import { createCardTexture } from "./cardGenerator.js";

var import_matter = /* @__PURE__ */ __toESM(require_matter(), 1);
var perf = getPerformanceConfig();

var CardDeck = class {
    constructor(scene, camera, engine, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.engine = engine;
        this.world = engine.world;
        this.options = {
            width: CARD_APPEARANCE.width,
            height: CARD_APPEARANCE.height,
            depth: CARD_APPEARANCE.depth,
            stackSpacing: CARD_APPEARANCE.stackSpacing,
            textureQuality: perf.textureQuality,
            ...options
        };
        this.cardsMesh = [];
        this.cardsBodies = [];
        
        // --- 核心参数：恢复第一版螺旋速度 ---
        this.spiralTurns = 3.5; 
        this.spiralSpacing = 1.2;
        
        this.isLocked = false; // 播放完禁止回滚的标识位
        this.stackBaseY = 0;

        // 记录四张主角牌
        this.mainCards = [];
        this.idleTime = 0;
        this.isIdleAnimationEnabled = false;
    }

    /**
     * 螺旋位置计算
     */
    getPointOnSpiral(t) {
        const angle = t * Math.PI * 2 * this.spiralTurns;
        const radius = t * (this.spiralTurns * this.spiralSpacing);
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, angle };
    }

    /**
     * 更新螺旋进度 (支持平滑展开和从外向内回收)
     */
    setShuffleSpiralProgress(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;
        
        // 所有卡牌始终可见，背面朝上
        this.cardsMesh.forEach(card => card.visible = true);
        
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            // 计算该卡牌在螺旋中的目标位置 (0.0 到 1.0)
            const targetT = (total - 1 - i) / (total - 1);
            
            // 核心逻辑：
            // 当 p 增加时，卡牌从 targetT=0 (中心) 逐渐移动到其在螺旋中的 targetT 位置
            const currentT = Math.min(targetT, p);
            
            const pos = this.getPointOnSpiral(currentT);
            
            // Y 轴堆叠感：没展开的牌叠在中心，展开的牌根据螺旋进度分布
            const y = (p < targetT) ? i * 0.05 : i * 0.001;
            
            mesh.position.set(pos.x, y, pos.z);
            mesh.rotation.set(Math.PI / 2, 0, -pos.angle);
        }
    }

    /**
     * 从外向内回收螺旋
     */
    collectSpiral(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;

        // p=0: 完整螺旋; p=1: 全部收回到中心
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const targetT = (total - 1 - i) / (total - 1);
            
            // 回收逻辑：从外向内。外圈的 targetT 接近 1.0
            // 当 p 增加时，如果 p > (1.0 - targetT)，卡牌开始向中心收回
            const collectThreshold = 1.0 - targetT;
            let currentT = targetT;
            
            if (p > collectThreshold) {
                const collectProg = (p - collectThreshold) / (1.0 - collectThreshold);
                currentT = MathUtils.lerp(targetT, 0, collectProg);
            }
            
            const pos = this.getPointOnSpiral(currentT);
            const y = (p > collectThreshold) ? i * 0.02 : i * 0.001;
            
            mesh.position.set(pos.x, y, pos.z);
            mesh.rotation.set(Math.PI / 2, 0, -pos.angle);
        }
    }

    /**
     * 初始化牌堆
     */
    initCards(cardsData) {
        this.sharedGeometry = new BoxGeometry(this.options.width, this.options.height, this.options.depth);
        const loader = new TextureLoader();
        const cardBackTex = loader.load('card.png'); // 使用 card.png 作为背面
        const cardFrontTex = createCardTexture({ isCustom: true, customText: "INFO" }, this.options.textureQuality);

        cardsData.forEach((data, index) => {
            const materials = [
                new MeshStandardMaterial({ color: 0xffffff }), 
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ map: cardFrontTex, transparent: true }), 
                new MeshStandardMaterial({ map: cardBackTex, transparent: true })  
            ];

            const mesh = new Mesh(this.sharedGeometry, materials);
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            this.scene.add(mesh);
            this.cardsMesh.push(mesh);
            
            const body = import_matter.default.Bodies.rectangle(0, 0, this.options.width, this.options.height, { isStatic: true });
            this.cardsBodies.push(body);
        });

        // 取最后四张作为主角牌（因为在螺旋动画中最后四张在最上面）
        this.mainCards = this.cardsMesh.slice(-4);
        import_matter.default.World.add(this.world, this.cardsBodies);
    }

    /**
     * 初始状态：四张牌重叠在中心
     */
    prepareMainCards() {
        this.mainCards.forEach((card, idx) => {
            card.position.set(0, idx * 0.05, 0);
            card.rotation.set(Math.PI / 2, 0, 0); // 背面朝上
            card.visible = true;
        });
        // 隐藏其他干扰牌
        this.cardsMesh.forEach(card => {
            if (!this.mainCards.includes(card)) card.visible = false;
        });
    }

    /**
     * 扇形散开动画
     */
    spreadMainCards(progress) {
        const radius = 6;
        const total = this.mainCards.length;
        const startAngle = -Math.PI * 0.15;
        const endAngle = Math.PI * 0.15;

        this.mainCards.forEach((card, i) => {
            const angle = MathUtils.lerp(0, startAngle + (i / (total - 1)) * (endAngle - startAngle), progress);
            const x = Math.sin(angle) * radius * progress;
            const z = (1.0 - Math.cos(angle)) * radius * progress;
            
            card.position.x = x;
            card.position.z = z;
            card.rotation.z = angle;
        });
    }

    /**
     * 轮流翻转动画
     */
    flipMainCards() {
        this.mainCards.forEach((card, idx) => {
            gsapWithCSS.to(card.rotation, {
                x: -Math.PI / 2, // 翻转到正面
                duration: 1.2,
                delay: idx * 0.2, // 依次延迟
                ease: "power2.inOut"
            });
        });
    }

    /**
     * 史诗级“抽出”动画：突进至相机前再归位
     */
    drawMainCards(progress) {
        this.mainCards.forEach((card, idx) => {
            // 每一个卡牌的独立进度，带延迟
            const cardProg = Math.max(0, Math.min(1, (progress - idx * 0.1) / 0.7));
            
            // 初始螺旋位置
            const spiralPos = this.getPointOnSpiral((this.cardsMesh.length - 1 - (this.mainCards.length - 1 - idx)) / (this.cardsMesh.length - 1));
            
            // 突进逻辑：在 cardProg 0.0 -> 0.5 之间冲向相机，0.5 -> 1.0 缩小归位
            let targetX, targetY, targetZ, targetScale;
            
            if (cardProg < 0.5) {
                // 第一阶段：冲向相机 (突进)
                const subProg = cardProg / 0.5;
                targetX = MathUtils.lerp(spiralPos.x, 0, subProg);
                targetY = MathUtils.lerp(0.5, 8, subProg); // 冲到高处（靠近相机）
                targetZ = MathUtils.lerp(spiralPos.z, 5, subProg); // 冲向相机 Z 轴
                targetScale = MathUtils.lerp(1, 2.5, subProg);
            } else {
                // 第二阶段：缩小归位
                const subProg = (cardProg - 0.5) / 0.5;
                targetX = 0;
                targetY = MathUtils.lerp(8, idx * 0.05, subProg);
                targetZ = MathUtils.lerp(5, 0, subProg);
                targetScale = MathUtils.lerp(2.5, 1, subProg);
            }
            
            card.position.set(targetX, targetY, targetZ);
            card.scale.set(targetScale, targetScale, targetScale);
            card.rotation.set(Math.PI / 2, 0, 0); // 始终背面朝上，直到后续的 flip 逻辑
        });

        // 螺旋堆保持存在，不消失
        this.cardsMesh.forEach(card => {
            if (!this.mainCards.includes(card)) {
                card.visible = true;
                // 让非主角牌保持在中心堆叠状态
                const fixedPos = this.getPointOnSpiral(1.0);
                card.position.set(fixedPos.x, 0, fixedPos.z);
            }
        });
    }

    /**
     * 终极放大展示背面的 card.png
     */
    finalZoomIn() {
        this.mainCards.forEach((card, idx) => {
            gsapWithCSS.to(card.scale, {
                x: 1.5, y: 1.5, z: 1.5,
                duration: 1.5,
                ease: "expo.out",
                delay: idx * 0.1
            });
            // 稍微抬高一点，展示史诗感
            gsapWithCSS.to(card.position, {
                y: card.position.y + 1,
                duration: 1.5,
                ease: "expo.out",
                delay: idx * 0.1
            });
        });
    }

    /**
     * 律动起伏动画：仅上下，幅度减小，无旋转
     */
    updateIdleAnimation(dt) {
        if (!this.isIdleAnimationEnabled) return;
        this.idleTime += dt;
        this.mainCards.forEach((card, i) => {
            // 幅度减小到 0.03，仅修改 y 坐标
            const wave = Math.sin(this.idleTime * 1.5 + i * 0.8) * 0.03;
            card.position.y = (i * 0.05) + wave; 
            // 移除旋转扰动
        });
    }

    /**
     * 移动到角落并彻底翻面
     */
    moveToCorner(progress) {
        if (this.isLocked) return;
        const cornerX = -8;
        const cornerZ = 4;
        this.cardsMesh.forEach((mesh, i) => {
            const lagAmount = i * 0.005;
            const dynamicProgress = Math.max(0, Math.min(1, progress - lagAmount));
            const targetPos = new Vector3(cornerX, i * 0.015, cornerZ);
            
            mesh.position.lerpVectors(mesh.position.clone(), targetPos, dynamicProgress);
            // 翻转：从正面(-PI/2)到背面(PI/2)[cite: 2]
            mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, Math.PI / 2, dynamicProgress);
            mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, 0, dynamicProgress);
        });
    }

    /**
     * 发牌到小堆：确保位置对齐扇形顶点
     */
    dealToSmallDeck() {
        const hearts = this.cardsMesh.slice(0, 13);
        const syncZ = 2.0; // 对应 fanSpread(0) 的坐标点
        hearts.forEach((card, idx) => {
            gsapWithCSS.to(card.position, {
                x: 0, y: idx * 0.02, z: syncZ,
                duration: 0.4, delay: idx * 0.05, ease: "power2.out"
            });
            gsapWithCSS.to(card.rotation, { x: Math.PI / 2, z: 0, duration: 0.4, delay: idx * 0.05 });
        });
    }

    /**
     * 扇形展开：公式重构
     * 圆心在前 (Z=10)，公式：Z = Center - R * cos(theta)
     */
    fanSpread(progress = 1) {
        if (this.isLocked) return;
        const totalHearts = 13;
        const hearts = this.cardsMesh.slice(0, totalHearts);
        const radius = 8;
        const arcAngle = Math.PI * 0.4;
        const startAngle = -arcAngle / 2;
        
        // 圆心设在卡牌前方（靠近相机）
        const centerZBase = 10; 

        hearts.forEach((mesh, i) => {
            const angle = (startAngle + (i / (totalHearts - 1)) * arcAngle) * progress;
            const x = Math.sin(angle) * radius;
            // 凸起计算：因为圆心在前，减去cos偏移让中间向后缩，边缘向后缩得更多，
            // 最终在背面朝上的视角下形成向玩家凸出的弧线[cite: 2]
            const z = centerZBase - (Math.cos(angle) * radius);
            
            mesh.position.set(x, i * 0.02, z);
            // 修正旋转角方向
            mesh.rotation.set(Math.PI / 2, 0, angle); 
        });
    }

    /**
     * 发出三张主角牌：锁定并禁止回滚
     */
    dealThreeCards() {
        this.isLocked = true; // 锁定状态，禁止上滑回滚[cite: 2]
        const topThree = this.cardsMesh.slice(0, 13).slice(-3).reverse();
        const customTexts = ["CONTENT 1", "CONTENT 2", "CONTENT 3"];

        topThree.forEach((card, idx) => {
            // 动态更换牌面纹理
            const newFront = createCardTexture({ isCustom: true, customText: customTexts[idx] }, this.options.textureQuality);
            card.material[4].map = newFront;
            card.material[4].needsUpdate = true;

            const tl = gsapWithCSS.timeline({ delay: idx * 0.3 });
            tl.to(card.position, {
                x: (idx - 1) * 3.5, y: 1.5, z: -1,
                duration: 1, ease: "expo.inOut"
            })
            .to(card.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 1 }, "<")
            .to(card.rotation, {
                x: -Math.PI / 2, // 翻转回正面朝上[cite: 2]
                y: 0,
                z: Math.PI * 2,
                duration: 1.2,
                ease: "back.out(1.2)"
            }, "<");
        });
        return topThree;
    }

    /**
     * 背景卡牌淡出逻辑
     */
    fadeOutDeck(excludeCards = []) {
        this.cardsMesh.forEach((mesh) => {
            if (!excludeCards.includes(mesh)) {
                mesh.material.forEach(mat => {
                    gsapWithCSS.to(mat, {
                        opacity: 0,
                        duration: 0.8,
                        onComplete: () => { mesh.visible = false; }
                    });
                });
            }
        });
    }
};

export { CardDeck };