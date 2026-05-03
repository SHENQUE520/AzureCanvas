import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { ScrollTrigger } from "../../node_modules/gsap/ScrollTrigger.js";

gsapWithCSS.registerPlugin(ScrollTrigger);

export class ScrollAnimation {
    constructor(options = {}) {
        this.cardDeck = null;
        this.currentState = 0;
        this.options = {
            trigger: ".poker-section", // 触发器改为卡牌专用的 section
            start: "top top",
            end: "bottom bottom",
            ...options
        };
    }

    init(cardDeck) {
        this.cardDeck = cardDeck;

        ScrollTrigger.create({
            trigger: this.options.trigger,
            start: this.options.start,
            end: this.options.end,
            onUpdate: (self) => {
                const p = self.progress;

                // 背景渐变：从深蓝到纯蓝
                if (p > 0.1 && p < 0.9) {
                    const bgProg = (p - 0.1) / 0.8;
                    document.body.style.backgroundColor = `rgb(0, ${Math.floor(15 * (1 - bgProg))}, ${Math.floor(51 + (204 * bgProg))})`;
                }

                // 1. 展开螺旋阶段 (0% - 30%)
                if (p <= 0.3) {
                    const expandProg = p / 0.3;
                    this.cardDeck.setShuffleSpiralProgress(expandProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                } 
                // 2. 从外向内回收阶段 (30% - 50%)
                else if (p > 0.3 && p <= 0.5) {
                    const collectProg = (p - 0.3) / 0.2;
                    this.cardDeck.collectSpiral(collectProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 3. 史诗抽出主角牌阶段 (50% - 65%)
                else if (p > 0.5 && p <= 0.65) {
                    const drawProg = (p - 0.5) / 0.15;
                    this.cardDeck.drawMainCards(drawProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 4. 扇形散开阶段 (65% - 85%)
                else if (p > 0.65 && p <= 0.85) {
                    const spreadProg = (p - 0.65) / 0.2;
                    this.cardDeck.spreadMainCards(spreadProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                    
                    if (p > 0.8 && this.currentState !== 1) {
                        this.currentState = 1;
                        this.cardDeck.flipMainCards();
                    }
                }
                // 5. 完成阶段：开启呼吸律动并终极放大
                else if (p > 0.85) {
                    this.cardDeck.isIdleAnimationEnabled = true;
                    if (this.currentState !== 2) {
                        this.currentState = 2;
                        this.cardDeck.finalZoomIn();
                    }
                }

                // 重置状态
                if (p < 0.82 && this.currentState === 2) {
                    this.currentState = 1;
                }
                if (p < 0.75 && this.currentState === 1) {
                    this.currentState = 0;
                }
            }
        });
    }

    triggerFanSequence() {
        if (this.isAnimating || this.currentState === 2) return;
        
        this.isAnimating = true;
        this.currentState = 2; 

        const tl = gsapWithCSS.timeline({ 
            onComplete: () => {
                this.isAnimating = false; // 只有这里播完，上面的 scroll 锁定才会解除
            } 
        });

        const state = { move: 0, spread: 0 };

        // 1. 移动到角落[cite: 8]
        tl.to(state, {
            move: 1,
            duration: 0.8,
            onUpdate: () => this.cardDeck.moveToCorner(state.move)
        })
        // 2. 预备发牌[cite: 8]
        .add(() => {
            this.cardDeck.dealToSmallDeck();
        }, "+=0.1")
        // 3. 扇形展开[cite: 8]
        .to(state, {
            spread: 1,
            duration: 1.2,
            delay: 0.8,
            ease: "back.out(1.2)",
            onUpdate: () => this.cardDeck.fanSpread(state.spread)
        })
        // 4. 发三张并淡出[cite: 8]
        .add(() => {
            const issuedCards = this.cardDeck.dealThreeCards();
            gsapWithCSS.delayedCall(0.4, () => {
                this.cardDeck.fadeOutDeck(issuedCards);
            });
        }, "+=0.3");
    }
}