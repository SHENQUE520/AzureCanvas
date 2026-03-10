const themeToggle = document.getElementById('themeToggle');

const themeIcon = document.getElementById('themeIcon');
const card = document.querySelector('.splash-logo');
// 点击启动页 (校徽) 进入主界面
card.addEventListener('click', function() {
    splashScreen.style.opacity = '0';
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
