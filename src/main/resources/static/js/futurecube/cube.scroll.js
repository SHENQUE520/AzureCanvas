// ============================================
// 立方体导航栏的鼠标滚动事件执行器
// 负责人：@Lotiyu
// ============================================

import {isCubePage} from './cube.js';
export function initScrollEffect(){
    document.addEventListener('wheel', (e) => {
        if (e.deltaY > 100 && !isCubePage && window.scrollY === 0){
            console.log("dw");
        }
    }, { passive: true });
}