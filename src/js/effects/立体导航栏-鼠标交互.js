// ============================================
// 鼠标交互模块 - 3D立方体导航栏
// 负责人：@glow
// ============================================

(function() {
    // 当前目标旋转角度
    let targetRotateX = 0;
    let targetRotateY = 0;
    
    // 当前实际旋转角度（用于平滑过渡）
    let currentRotateX = 0;
    let currentRotateY = 0;
    
    // 鼠标灵敏度系数
    const SENSITIVITY_X = 1.0;
    const SENSITIVITY_Y = 1.0;
    
    // 旋转范围限制（null表示无限制）
    const ROTATE_LIMIT_X = 45;     // 垂直方向限制±45度，防止立方体翻跟头
    const ROTATE_LIMIT_Y = null;   // 水平方向不限制，可以一直转
    
    // 平滑系数
    const SMOOTHING = 0.1;
    
    // ========== 鼠标位置 → 旋转角度 ==========
    function updateTargetRotation(clientX, clientY) {
        const mouseX = (clientX / window.innerWidth) * 2 - 1;
        const mouseY = (clientY / window.innerHeight) * 2 - 1;
        
        // 最大旋转角度：水平180度，垂直90度
        let newRotateY = mouseX * 180 * SENSITIVITY_X;
        let newRotateX = mouseY * 90 * SENSITIVITY_Y;
        
        if (ROTATE_LIMIT_X !== null) {
            newRotateX = Math.max(-ROTATE_LIMIT_X, Math.min(ROTATE_LIMIT_X, newRotateX));
        }
        if (ROTATE_LIMIT_Y !== null) {
            newRotateY = Math.max(-ROTATE_LIMIT_Y, Math.min(ROTATE_LIMIT_Y, newRotateY));
        }
        
        targetRotateX = newRotateX;
        targetRotateY = newRotateY;
    }
    
    // ========== 等待画布生成，绑定鼠标事件 ==========
    function bindToCanvas() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            setTimeout(bindToCanvas, 100);
            return;
        }
        
        // 鼠标在立方体上移动 → 旋转
        canvas.addEventListener('mousemove', function(e) {
            updateTargetRotation(e.clientX, e.clientY);
        });
        
        // 鼠标离开立方体 → 慢慢回正
        canvas.addEventListener('mouseleave', function() {
            targetRotateX = 0;
            targetRotateY = 0;
        });
        
        console.log('鼠标交互模块已绑定到立方体');
    }
    
    // ========== 动画循环（平滑过渡） ==========
    function animateSmoothRotation() {
        currentRotateX += (targetRotateX - currentRotateX) * SMOOTHING;
        currentRotateY += (targetRotateY - currentRotateY) * SMOOTHING;
        
        if (typeof window.rotateCube === 'function') {
            window.rotateCube(currentRotateX, currentRotateY);
        }
        
        requestAnimationFrame(animateSmoothRotation);
    }
    
    // ========== 启动 ==========
    bindToCanvas();
    animateSmoothRotation();
    
    // ========== 暴露配置接口 ==========
    window.cubeInteraction = {
        resetRotation: function() {
            targetRotateX = 0;
            targetRotateY = 0;
        }
    };
    
    console.log('鼠标交互模块已加载');
})();

// ========== 联调注意事项 ==========
// 1. 接口约定：本模块会调用 window.rotateCube(x, y)，x和y为角度制
// 2. 默认参数：
//    - 水平最大转角：180°（鼠标从左边缘到右边缘）
//    - 垂直最大转角：90°，限制±45°（防止翻跟头）
//    - 平滑系数：0.1
//    - 灵敏度：x:1.0, y:1.0
// 3. 联调时可调整以下位置的值（搜【可调】即可找到）：
//    - SMOOTHING：数值越大跟手越快（0.05~0.15）
//    - SENSITIVITY_X / SENSITIVITY_Y：数值越大转动越敏感（0.5~1.5）
//    - 第45行左右的 newRotateY 和 newRotateX 里的 180 和 90：最大转角
//    - ROTATE_LIMIT_X：垂直限制角度，改成 null 可取消限制
// 4. 如果转动方向反了：在 currentRotateX 或 currentRotateY 前面加负号
//    （搜【方向修正】位置，在 animateSmoothRotation 函数内）
// 5. 对方实现 window.rotateCube 后，本模块自动生效，无需改代码