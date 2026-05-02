import { __toESM } from "../_virtual/_rolldown/runtime.js";
/* empty css            */
import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene } from "../node_modules/three/build/three.core.js";
import { WebGLRenderer } from "../node_modules/three/build/three.module.js";
import { require_matter } from "../node_modules/matter-js/build/matter.js";
import { gsapWithCSS } from "../node_modules/gsap/index.js";
import { generateFullDeck } from "./config/cardConfig.js";
import { getPerformanceConfig } from "./utils/performance.js";
import { CardDeck } from "./core/cardDeck.js";
import { ScrollAnimation } from "./core/scrollAnimation.js";

//#region src/main.js
var import_matter = /* @__PURE__ */ __toESM(require_matter(), 1);
async function startAnimation() {
	const perf = getPerformanceConfig();
	const deckData = generateFullDeck();
	const scene = new Scene();
	scene.background = new Color(8900331);
	const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 1e3);
	camera.position.set(0, 15, .1);
	camera.lookAt(0, 0, 0);
	const renderer = new WebGLRenderer({ antialias: perf.antialias });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	document.getElementById("canvas-container").appendChild(renderer.domElement);
	const ambientLight = new AmbientLight(16777215, 1);
	scene.add(ambientLight);
	const topLight = new DirectionalLight(16777215, .5);
	topLight.position.set(0, 20, 0);
	scene.add(topLight);
	const engine = import_matter.default.Engine.create();
	const cardDeck = new CardDeck(scene, camera, engine);
	cardDeck.initCards(deckData);
    
    // 初始化滚动动画逻辑[cite: 5]
	new ScrollAnimation().init(cardDeck);

	let animState = { progress: 0 };
	function animate() {
		requestAnimationFrame(animate);
		import_matter.default.Engine.update(engine, 16);
		renderer.render(scene, camera);
	}
	animate();
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

    // 原始测试按钮逻辑已保留但建议仅用于本地调试[cite: 6]
	const btnSpiral = document.getElementById("btnSpiral");
	const btnReset = document.getElementById("btnReset");
	if (btnSpiral) btnSpiral.onclick = () => {
		gsapWithCSS.to(animState, {
			progress: 1,
			duration: 2.5,
			ease: "power2.inOut",
			onUpdate: () => {
				cardDeck.setShuffleSpiralProgress(animState.progress);
			}
		});
	};
	if (btnReset) btnReset.onclick = () => {
		gsapWithCSS.to(animState, {
			progress: 0,
			duration: 2,
			ease: "expo.inOut",
			onUpdate: () => {
				cardDeck.setShuffleSpiralProgress(animState.progress);
			},
			onComplete: () => {
				window.scrollTo({
					top: 0,
					behavior: "auto"
				});
			}
		});
	};
	const btnFan = document.getElementById("btnFan");
	const btnDeal = document.getElementById("btnDeal");
	if (btnFan) btnFan.onclick = () => {
		const tl = gsapWithCSS.timeline();
		const state = {
			move: 0,
			spread: 0
		};
		tl.to(state, {
			move: 1,
			duration: .8,
			onUpdate: () => cardDeck.moveToCorner(state.move)
		}).add(() => {
			cardDeck.dealToSmallDeck();
		}, "+=0.1").to(state, {
			spread: 1,
			duration: 1.2,
			delay: .8,
			ease: "back.out(1.2)",
			onUpdate: () => cardDeck.fanSpread(state.spread)
		}).add(() => {
			const issuedCards = cardDeck.dealThreeCards();
			gsapWithCSS.delayedCall(.4, () => {
				cardDeck.fadeOutDeck(issuedCards);
			});
		}, "+=0.3");
	};
	if (btnDeal) btnDeal.onclick = () => cardDeck.dealThreeCards();
}
startAnimation().catch((err) => console.error("初始化失败:", err));
//#endregion