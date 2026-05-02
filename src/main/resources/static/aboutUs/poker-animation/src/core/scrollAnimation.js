import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { ScrollTrigger } from "../../node_modules/gsap/ScrollTrigger.js";

gsapWithCSS.registerPlugin(ScrollTrigger);

export class ScrollAnimation {
    constructor(options = {}) {
        this.cardDeck = null;
        this.isAnimating = false; // 状态锁[cite: 10]
        this.currentState = 0;    // 状态机[cite: 10]
        this.triggerScrollPos = 0; // 记录触发时的滚动位置
        this.options = {
            trigger: ".top-spacer",
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

                // --- 新增：禁止向下移动的锁定逻辑 ---
                if (this.isAnimating) {
                    // 如果正在动画且用户试图往下滚，强制弹回触发点
                    if (self.scroll() > this.triggerScrollPos) {
                        self.scroll(this.triggerScrollPos);
                        return; 
                    }
                }

                // 螺旋动画阶段 (0% - 30%)[cite: 10]
                if (this.currentState === 0 && !this.isAnimating) {
                    if (p <= 0.3) {
                        const spiralProg = p / 0.3;
                        this.cardDeck.setShuffleSpiralProgress(spiralProg);
                    } else {
                        // 记录触发序列时的瞬间滚动位置
                        this.triggerScrollPos = self.scroll();
                        this.triggerFanSequence();
                    }
                }

                // 重置逻辑：回到顶部时解锁状态[cite: 10]
                if (p < 0.05 && this.currentState === 2 && !this.isAnimating) {
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