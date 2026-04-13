// ============================================
// 主界面交互模块
// 包括主题切换、启动页点击事件、数字时钟等功能
// 负责人：@Sun
// ============================================

const themeToggle = document.getElementById('themeToggle');

const themeIcon = document.getElementById('themeIcon');
const card = document.querySelector('.splash-logo');
// 点击启动页 (校徽) 进入主界面
card.addEventListener('click', function() {
    splashScreen.style.opacity = '0';
    // 停止漩涡动画节省资源
    if (window.stopVortex) window.stopVortex();
    
    setTimeout(() => {
        splashScreen.style.display = 'none';
        mainInterface.style.display = 'flex';  // 主界面为flex
        startMainParticles();
    }, 800);
});

themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.className = 'fas fa-sun';
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> 白天模式';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i> 夜间模式';
    }
});

// 数字时钟功能
function updateClock() {
    const clockElement = document.getElementById('digital-clock');
    if (!clockElement) return;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 1000);
updateClock();
