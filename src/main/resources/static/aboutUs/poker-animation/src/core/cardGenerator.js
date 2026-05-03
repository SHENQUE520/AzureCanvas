import { CanvasTexture } from "three";
import { CARD_APPEARANCE } from "../config/cardConfig.js";

function createCardTexture(cardData, quality = 2, isBack = false) {
	const { width, height } = CARD_APPEARANCE;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const scale = 256 * quality;
	canvas.width = width * scale;
	canvas.height = height * scale;

    if (isBack) {
        // --- 绘制背面纹理 ---
        ctx.fillStyle = "#2c3e50"; // 背面底色
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 10 * quality;
        ctx.strokeRect(10 * quality, 10 * quality, canvas.width - 20 * quality, canvas.height - 20 * quality);
        // 绘制背面装饰图案
        ctx.fillStyle = "#34495e";
        ctx.font = `${40 * quality}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("♠︎ ♥︎ ♣︎ ♦︎", canvas.width / 2, canvas.height / 2);
    } else if (cardData.isCustom) {
        // --- 绘制自定义内容（翻转后的新内容） ---
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#333";
        ctx.font = `bold ${40 * quality}px "Inter"`;
        ctx.textAlign = "center";
        // 这里可以根据 cardData 里的 customText 渲染不同内容
        ctx.fillText(cardData.customText || "NEW INFO", canvas.width / 2, canvas.height / 2);
    } else {
        // --- 原有的扑克牌正面逻辑 ---
        ctx.fillStyle = cardData.isJoker ? cardData.subType === "big" ? "#2a0a0a" : "#2a1a0a" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = cardData.isJoker ? cardData.subType === "big" ? "#ef4444" : "#f59e0b" : cardData.color === "#cc0000" ? "#cc0000" : "#333333";
        ctx.lineWidth = 8 * quality;
        ctx.strokeRect(6 * quality, 6 * quality, canvas.width - 12 * quality, canvas.height - 12 * quality);
        ctx.fillStyle = cardData.isJoker ? cardData.subType === "big" ? "#ef4444" : "#f59e0b" : cardData.color;
        ctx.font = `bold ${cardData.isJoker ? 50 * quality : cardData.rank === "10" ? 55 * quality : 65 * quality}px "Inter", "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let displayText = cardData.isJoker ? cardData.displayText : cardData.text;
        ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
        if (!cardData.isJoker) {
            ctx.font = `${28 * quality}px monospace`;
            ctx.fillStyle = cardData.color;
            ctx.fillText(cardData.suit + cardData.rank, 30 * quality, 45 * quality);
        }
    }

	const texture = new CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

export { createCardTexture };