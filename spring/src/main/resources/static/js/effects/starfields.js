window.splashScreen = document.querySelector('#splash-screen');
window.mainInterface = document.getElementById('main-interface');
window.splashCanvas = document.getElementById('splash-canvas');
const ctxSplash = splashCanvas.getContext('2d');
let width, height;
let splashParticles = [];

function initSplashParticles() {
    const count = 300;
    splashParticles = [];
    for (let i = 0; i < count; i++) {
        splashParticles.push({
            x: Math.random(),
            y: Math.random(),
            size: 1 + Math.random() * 3,
            speed: 0.002 + Math.random() * 0.01,
            angle: Math.random() * Math.PI * 2,
            brightness: 0.5 + Math.random() * 0.5,
            baseX: Math.random(),
            baseY: Math.random()
        });
    }
}

// TODO Keep the direction of moving stars the same
function drawSplash() {
    if (!width || !height) return;
    ctxSplash.clearRect(0, 0, width, height);
    const time = Date.now() / 500;
    splashParticles.forEach(p => {
        p.x = p.baseX + Math.sin(time * p.speed + p.angle) * 0.2;
        p.y = p.baseY + Math.cos(time * p.speed * 0.7 + p.angle) * 0.2;
        const x = p.x * width;
        const y = p.y * height;
        const gold = `rgba(37, 101, 176, ${0.5 + 0.3 * Math.sin(time*2 + p.angle)})`;
        ctxSplash.fillStyle = gold;
        ctxSplash.beginPath();
        ctxSplash.arc(x, y, p.size * (1 + 0.2 * Math.sin(time*3 + p.angle)), 0, 2*Math.PI);
        ctxSplash.fill();
        ctxSplash.shadowColor = '#5cd5fa';
        ctxSplash.shadowBlur = 150;
        ctxSplash.fill();
        ctxSplash.shadowBlur = 0;
    });
    requestAnimationFrame(drawSplash);
}

function resizeSplash() {
    width = window.innerWidth;
    height = window.innerHeight;
    splashCanvas.width = width;
    splashCanvas.height = height;
    initSplashParticles();
}
window.addEventListener('resize', resizeSplash);
resizeSplash();
drawSplash();

splashScreen.addEventListener('mousemove', (e) =>{
    splashParticles.forEach(p => {
        p.x += e.clientX * 0.02;
        p.y += e.clientY * 0.02;
    });
})

// 主界面粒子 (图书馆模型 + 鼠标跟随)
const mainCanvas = document.getElementById('particle-canvas');
const ctxMain = mainCanvas.getContext('2d');
let mainParticles = [];
let mouseX = 5, mouseY = 5;

function generateLibraryPoints() {
    let points = [];
    for (let i = 0; i < 30; i++) { // 左塔
        points.push({ x: 0.2 + Math.random()*0.2, y: 0.25 + Math.random()*0.45 });
    }
    for (let i = 0; i < 30; i++) { // 右塔
        points.push({ x: 0.6 + Math.random()*0.2, y: 0.2 + Math.random()*0.45 });
    }
    for (let i = 0; i < 20; i++) { // 连廊
        points.push({ x: 0.4 + Math.random()*0.2, y: 0.5 + Math.random()*0.15 });
    }
    for (let i = 0; i < 80; i++) { // 散星
        points.push({ x: Math.random(), y: Math.random() });
    }
    return points;
}
const libPoints = generateLibraryPoints();

function initMainParticles() {
    mainParticles = libPoints.map(p => ({
        x: p.x * width, y: p.y * height,
        baseX: p.x * width, baseY: p.y * height,
        offsetX: (Math.random()-0.5)*15, offsetY: (Math.random()-0.5)*15,
        speed: 0.02 + Math.random()*0.04,
        rad: Math.random()*Math.PI*2,
        size: 1.5 + Math.random()*2
    }));
}

function resizeMain() {
    width = window.innerWidth;
    height = window.innerHeight;
    mainCanvas.width = width;
    mainCanvas.height = height;
    initMainParticles();
}
window.addEventListener('resize', resizeMain);

mainCanvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / width;
    mouseY = e.clientY / height;
});
mainCanvas.addEventListener('mouseleave', () => {
    mouseX = 0.5; mouseY = 0.5;
});

function drawMainParticles() {
    if (!width || !height) return;
    ctxMain.clearRect(0, 0, width, height);
    let infX = (mouseX||0.5)-0.5;
    let infY = (mouseY||0.5)-0.5;

    const isDark = document.body.classList.contains('dark-mode');
    const particleColor = isDark ? 'rgba(255,215,0,0.7)' : 'rgba(37,101,176,0.5)';
    const particleColor2 = isDark ? 'rgba(255,255,240,0.5)' : 'rgba(100,150,255,0.4)';

    mainParticles.forEach(p => {
        p.rad += p.speed * 0.5;
        let waveX = Math.sin(p.rad)*3;
        let waveY = Math.cos(p.rad*1.2)*3;
        let dx = infX * 45 * (p.baseX/width-0.5)*0.6;
        let dy = infY * 45 * (p.baseY/height-0.5)*0.6;
        let targetX = p.baseX + p.offsetX + dx + waveX;
        let targetY = p.baseY + p.offsetY + dy + waveY;
        p.x += (targetX - p.x)*0.07;
        p.y += (targetY - p.y)*0.07;

        ctxMain.fillStyle = (p.size>2.2) ? particleColor : particleColor2;
        ctxMain.shadowColor = isDark ? 'gold' : '#2565b0';
        ctxMain.shadowBlur = 12;
        ctxMain.beginPath();
        ctxMain.arc(p.x, p.y, p.size*(0.9+0.2*Math.sin(p.rad)), 0, 2*Math.PI);
        ctxMain.fill();
    });
    requestAnimationFrame(drawMainParticles);
}

function startMainParticles() {
    resizeMain();
    drawMainParticles();
}

// 主题切换 (默认白天)


// 初始化宽高 (保证画布有值)
width = window.innerWidth;
height = window.innerHeight;
mainCanvas.width = width;
mainCanvas.height = height;