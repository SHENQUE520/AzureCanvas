// ============================================
// 梦幻漩涡阶梯动画效果
// 负责人：@Lotiyu
// ============================================
const turbineWrapper = document.querySelector('.turbine-wrapper');

// 叶片配置
const bladeConfig = {
    count: 180, // 同时存在的叶片数量
    speed: 0.005, // 旋转速度
    growthRate: 0.5, // 生长速度
    colors: ['#5d0caf', '#7329c0', '#823cc4', '#9254da',
            '#a268e1', '#bb8eec', '#d6b4f1', '#ead6ff'],
    minSize: 30,
    maxSize: 100
};

// 叶片数组
let blades = [];
let animationId = null;
let time = 0;

// 生成漩涡轨迹点
function getSpiralPosition(index, total, radius) {
    const angle = (index / total) * Math.PI * 4;
    const spiralRadius = radius * (1 - index / total);
    const x = Math.cos(angle) * spiralRadius;
    const y = Math.sin(angle) * spiralRadius;
    return { x, y, angle };
}

// 创建叶片
function createBlade() {
    const blade = document.createElement('div');
    blade.className = 'turbine-blade';
    
    // 随机初始参数
    const size = bladeConfig.minSize + Math.random() * (bladeConfig.maxSize - bladeConfig.minSize);
    const color = bladeConfig.colors[Math.floor(Math.random() * bladeConfig.colors.length)];
    
    blade.style.width = size + 'px';
    blade.style.height = size + 'px';
    blade.style.background = color;
    blade.style.opacity = '0';
    
    // 初始位置（漩涡中心）
    blade.style.transform = 'translate(-50%, -50%) scale(0.01)';
    
    turbineWrapper.appendChild(blade);

    return {
        element: blade,
        size: size,
        maxSize: size * 1.5,
        currentSize: 0,
        position: 0, // 0-1之间的位置
        speed: bladeConfig.speed * (Math.random() + 0.4),
        opacity: 0
    };
}

// 动画循环
function animateVortex() {
    time += 0.01;
    
    // 定期创建新叶片
    if (blades.length < bladeConfig.count) {
        blades.push(createBlade());
    }

    // 更新叶片位置
    blades.forEach((blade, index) => {
        blade.position += blade.speed;

        // 计算漩涡轨迹位置
        const spiral = getSpiralPosition(index, bladeConfig.count, 350);
        const x = spiral.x;
        const y = spiral.y;
        const angle = spiral.angle + time * 40;
        
        // 生长动画
        blade.currentSize = Math.min(blade.maxSize, blade.currentSize + bladeConfig.growthRate);
        
        // 位置和旋转
        blade.element.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg) scale(${blade.currentSize / blade.size})`;
        
        // 透明度处理：从中心淡入，向边缘淡出
        if (blade.position < 0.2) {
            blade.opacity = blade.position * 5;
        } else {
            blade.opacity = Math.max(0, 1 - (blade.position - 0.2) / 0.8);
        }
        blade.element.style.opacity = blade.opacity * 0.6;
    });

    // 移除超出范围或完全透明的叶片
    blades = blades.filter(blade => {
        if (blade.position >= 1 || (blade.opacity <= 0)) {
            if (blade.element.parentNode) {
                blade.element.parentNode.removeChild(blade.element);
            }
            return false;
        }
        return true;
    });
    
    animationId = requestAnimationFrame(animateVortex);
}

// 启动动画
animateVortex();

// 暴露停止函数供切换界面时调用
window.stopVortex = () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
};
