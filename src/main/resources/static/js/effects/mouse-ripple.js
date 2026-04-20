/**
 * Lusion.co 风格鼠标水纹特效 - 零入侵版（不修改原有页面样式）
 * 核心：只添加画布和光标，不修改body/原有元素样式
 */
class LusionRipple {
    config = {
        cursorSize: 8,
        cursorColor: '#0066cc',// 适配你登录页的蓝色
        waveStrength: 0.012,
        waveDecay: 12.0,
        waveFrequency: 50.0,
        smoothFactor: 0.12,
        zIndex: {
            canvas: 1,           // 低于你的登录表单
            cursor: 9999
        }
    };

    constructor(customConfig = {}) {
        this.config = { ...this.config, ...customConfig };
        this.canvas = null;
        this.gl = null;
        this.cursor = null;
        this.mouse = { x: 0.5, y: 0.5 };
        this.smoothMouse = { x: 0.5, y: 0.5 };
        this.time = 0;
        this.program = null;
        this.uniforms = {};
    }

    init() {
        this.createElements(); // 只创建特效元素，不修改原有样式
        this.initWebGL();
        if (!this.gl) {
            console.warn('WebGL不支持，无法显示水纹效果');
            return;
        }
        this.compileShaders();
        this.createBuffer();
        this.getUniforms();
        this.bindEvents();
        this.render();
    }

    // 只创建特效元素，不修改body样式
    createElements() {
        // 1. 创建画布（透明、不拦截交互、最低层级）
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'lusion-ripple-canvas';
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none', // 不拦截点击/输入
            zIndex: this.config.zIndex.canvas,
            background: 'transparent', // 完全透明，不覆盖你的页面
            display: 'block'
        });
        document.body.appendChild(this.canvas);

        // 2. 创建自定义光标（只添加，不修改body的cursor）
        this.cursor = document.createElement('div');
        this.cursor.id = 'lusion-custom-cursor';
        Object.assign(this.cursor.style, {
            position: 'fixed',
            width: `${this.config.cursorSize}px`,
            height: `${this.config.cursorSize}px`,
            borderRadius: '50%',
            backgroundColor: this.config.cursorColor,
            pointerEvents: 'none',
            zIndex: this.config.zIndex.cursor,
            mixBlendMode: 'normal', // 取消反色，避免白色背景看不见
            willChange: 'transform',
            display: 'block'
        });
        document.body.appendChild(this.cursor);

        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    initWebGL() {
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: true
        }) || this.canvas.getContext('experimental-webgl');
    }

    compileShaders() {
        const gl = this.gl;
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 aPos;
      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, `
      precision highp float;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uTime;

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        uv.y = 1.0 - uv.y;

        vec2 m = uMouse;
        m.y = 1.0 - m.y;

        float d = length(uv - m);
        float wave = exp(-d * ${parseFloat(this.config.waveDecay).toFixed(2)}) * sin(d * ${parseFloat(this.config.waveFrequency).toFixed(2)} - uTime * 8.0);
        uv += wave * ${parseFloat(this.config.waveStrength).toFixed(3)};

        // 波纹改为透明，不显示颜色
        vec3 waveColor = vec3(0.0, 0.0, 0.0); // 黑色
        float alpha = 0.0; // 完全透明
        gl_FragColor = vec4(waveColor, alpha);
      }
    `);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader链接失败:', gl.getProgramInfoLog(this.program));
        }
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader编译失败:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createBuffer() {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0
        ]), gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(this.program, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    }

    getUniforms() {
        const gl = this.gl;
        this.uniforms = {
            uResolution: gl.getUniformLocation(this.program, 'uResolution'),
            uMouse: gl.getUniformLocation(this.program, 'uMouse'),
            uTime: gl.getUniformLocation(this.program, 'uTime')
        };
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX / window.innerWidth;
            this.mouse.y = e.clientY / window.innerHeight;
        });

        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('mouseleave', () => {
            this.mouse.x = 0.5;
            this.mouse.y = 0.5;
        });
    }

    render() {
        const gl = this.gl;
        this.time += 0.016;
        this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * this.config.smoothFactor;
        this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * this.config.smoothFactor;

        const cursorHalfSize = this.config.cursorSize / 2;
        this.cursor.style.transform = `translate(
      ${this.smoothMouse.x * window.innerWidth - cursorHalfSize}px,
      ${this.smoothMouse.y * window.innerHeight - cursorHalfSize}px
    )`;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uniforms.uMouse, this.smoothMouse.x, this.smoothMouse.y);
        gl.uniform1f(this.uniforms.uTime, this.time);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.render());
    }

    destroy() {
        if (this.canvas) this.canvas.remove();
        if (this.cursor) this.cursor.remove();
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
    }
}

window.LusionRipple = LusionRipple;