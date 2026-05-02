//#region src/utils/performance.js
/**
* 性能检测与优化配置
* ===================
* 用于检测设备类型，并生成对应的渲染/物理参数建议
*/
/**
* 检测当前设备是否为移动端
* @returns {boolean}
*/
function isMobile() {
	const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const screenMobile = window.innerWidth < 768;
	const touchMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
	return uaMobile || screenMobile || touchMobile;
}
/**
* 获取当前设备的 GPU 信息（粗略估算）
* @returns {string} 'high' | 'medium' | 'low'
*/
function getGPUTier() {
	const canvas = document.createElement("canvas");
	const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	if (!gl) return "low";
	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	if (!debugInfo) return "medium";
	const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
	if (renderer.includes("nvidia") || renderer.includes("amd") || renderer.includes("radeon") || renderer.includes("intel iris")) return "high";
	if (renderer.includes("intel") || renderer.includes("mali") || renderer.includes("adreno")) return "medium";
	return "low";
}
/**
* 根据设备性能返回配置建议
* @returns {Object} 包含各项优化参数的配置对象
*/
function getPerformanceConfig() {
	const mobile = isMobile();
	const gpuTier = getGPUTier();
	const config = {
		enableParticles: true,
		particleCount: 150,
		physicsIterations: 12,
		physicsSubSteps: 2,
		shadowMapEnabled: true,
		antialias: true,
		pixelRatio: Math.min(window.devicePixelRatio, 2),
		textureQuality: 1,
		enableFog: true,
		enablePostProcessing: false
	};
	if (mobile) {
		config.enableParticles = false;
		config.particleCount = 0;
		config.physicsIterations = 6;
		config.physicsSubSteps = 1;
		config.shadowMapEnabled = false;
		config.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
		config.textureQuality = .6;
		config.enableFog = false;
	}
	if (gpuTier === "low") {
		config.physicsIterations = Math.min(config.physicsIterations, 4);
		config.pixelRatio = 1;
		config.textureQuality = .5;
		config.antialias = false;
	} else if (gpuTier === "medium") {
		config.pixelRatio = Math.min(config.pixelRatio, 1.5);
		config.textureQuality = .8;
	}
	return config;
}
/**
* ┌─────────────────────────┬──────────────────────────────┬───────────────────────────────────┐
* │ 函数名                  │ 功能                         │ 关键逻辑                          │
* ├─────────────────────────┼──────────────────────────────┼───────────────────────────────────┤
* │ isMobile                │ 检测是否为移动端             │ UA + 屏幕宽度 + 触摸点三重判断     │
* │ getGPUTier              │ 估算 GPU 性能等级            │ 通过 WebGL 获取渲染器名称分级      │
* │ getPerformanceConfig    │ 生成性能优化配置             │ 综合设备类型与 GPU 等级动态降级    │
* │ getDeviceSummary        │ 返回设备信息摘要（调试用）   │ 调用上述函数拼接可读字符串         │
* └─────────────────────────┴──────────────────────────────┴───────────────────────────────────┘
*/
//#endregion
export { getPerformanceConfig };
