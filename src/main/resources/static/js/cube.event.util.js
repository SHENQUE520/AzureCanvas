export function fetchWindowCenter() {
    try {
        // 窗口宽度和高度（包含滚动条可视区域）
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        // 计算中心点
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);

        return { x: centerX, y: centerY };
    } catch (error) {
        console.error("获取窗口中心坐标失败：", error);
    }
}

export function isCloseToCube(mouseX, mouseY){
    const pos = fetchWindowCenter();
    return !(Math.abs(mouseX - pos.x) > 600 || Math.abs(mouseY - pos.y) > 600);
}