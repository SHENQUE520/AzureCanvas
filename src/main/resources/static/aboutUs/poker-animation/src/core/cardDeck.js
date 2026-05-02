import { __toESM } from "../../_virtual/_rolldown/runtime.js";
import { BoxGeometry, MathUtils, Mesh, MeshStandardMaterial, Vector3 } from "../../node_modules/three/build/three.core.js";
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
    }

    /**
     * 螺旋位置计算 (第一版逻辑)
     */
    getPointOnSpiral(t) {
        const angle = t * Math.PI * 2 * this.spiralTurns;
        const radius = t * (this.spiralTurns * this.spiralSpacing);
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, angle };
    }

    /**
     * 更新螺旋进度
     */
    setShuffleSpiralProgress(p) {
        if (this.isLocked) return; // 锁定后拦截回滚
        const total = this.cardsMesh.length;
        if (total === 0) return;
        const headPos = this.getPointOnSpiral(p);
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const dropThreshold = (total - 1 - i) / (total - 1);
            if (p < dropThreshold) {
                mesh.position.set(headPos.x, i * 0.02, headPos.z);
                mesh.rotation.set(-Math.PI / 2, 0, -headPos.angle);
            } else {
                const fixedPos = this.getPointOnSpiral(dropThreshold);
                mesh.position.set(fixedPos.x, i * 0.001, fixedPos.z);
                mesh.rotation.set(-Math.PI / 2, 0, -fixedPos.angle);
            }
        }
    }

    /**
     * 初始化牌堆
     */
    initCards(cardsData) {
        this.sharedGeometry = new BoxGeometry(this.options.width, this.options.height, this.options.depth);
        const backTex = createCardTexture({}, this.options.textureQuality, true);

        cardsData.forEach((data, index) => {
            const frontTex = createCardTexture(data, this.options.textureQuality, false);
            const materials = [
                new MeshStandardMaterial({ color: 0xcccccc }), 
                new MeshStandardMaterial({ color: 0xcccccc }),
                new MeshStandardMaterial({ color: 0xcccccc }),
                new MeshStandardMaterial({ color: 0xcccccc }),
                new MeshStandardMaterial({ map: frontTex, transparent: true }), // 索引4: 正面[cite: 3]
                new MeshStandardMaterial({ map: backTex, transparent: true })   // 索引5: 背面[cite: 3]
            ];

            const mesh = new Mesh(this.sharedGeometry, materials);
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            this.scene.add(mesh);
            this.cardsMesh.push(mesh);
            
            const body = import_matter.default.Bodies.rectangle(0, 0, this.options.width, this.options.height, { isStatic: true });
            this.cardsBodies.push(body);
        });
        import_matter.default.World.add(this.world, this.cardsBodies);
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