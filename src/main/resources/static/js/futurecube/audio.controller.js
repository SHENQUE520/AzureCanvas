let audioContext, audioBuffer, audioSource;
async function preloadAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const response = await fetch('audios/splash.ogg');
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.warn('音效预加载失败:', e);
    }
}

function play(){
    if (audioBuffer) {
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
    }
}

preloadAudio();
document.addEventListener('DOMContentLoaded', () => {
    const splashLogo = document.querySelector('.splash-logo');
    if (splashLogo) splashLogo.addEventListener('click', ()=>{
        play();
    });
});