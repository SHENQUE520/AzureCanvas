export const simulationVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const simulationFragmentShader = `
uniform sampler2D textureA;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;
uniform int frame;
varying vec2 vUv;

const float delta = 1.0;
const float viscosity = 0.92;
const float spread = 0.28;
const float decay = 0.96; // 自动回弹衰减（关键修复）

void main() {
    vec2 uv = vUv;
    if(frame == 0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec2 texel = 1.0 / resolution;
    vec4 data = texture2D(textureA, uv);
    vec2 vel = data.xy;
    vec2 disp = data.zw;

    vec2 d_up    = texture2D(textureA, uv + vec2(0.0, texel.y)).zw;
    vec2 d_down  = texture2D(textureA, uv - vec2(0.0, texel.y)).zw;
    vec2 d_left  = texture2D(textureA, uv - vec2(texel.x, 0.0)).zw;
    vec2 d_right = texture2D(textureA, uv + vec2(texel.x, 0.0)).zw;

    // 扩散
    vel += spread * ((d_right + d_left + d_up + d_down) * 0.25 - disp);
    vel *= viscosity;

    // 核心修复：形变自动缓慢归零
    disp *= decay;
    vel *= decay;

    disp += delta * vel;

    // 边界衰减
    disp *= smoothstep(0.0, 0.06, uv) * smoothstep(1.0, 0.94, uv);

    // 鼠标牵引
    vec2 muv = mouse / resolution;
    if(mouse.x > 0.0) {
        float dist = length(uv - muv);
        float falloff = smoothstep(0.15, 0.0, dist);
        disp += (muv - uv) * falloff * 0.025;
    }

    gl_FragColor = vec4(vel, disp);
}
`;

export const renderVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const renderFragmentShader = `
uniform sampler2D textureA;
uniform sampler2D textureB;
varying vec2 vUv;

void main() {
    vec4 data = texture2D(textureA, vUv);
    vec2 offset = data.zw * 0.48;

    vec4 col = texture2D(textureB, vUv + offset);

    vec3 normal = normalize(vec3(-data.z * 1.2, 0.6, -data.w * 1.2));
    vec3 light = normalize(vec3(-2.0, 8.0, 2.0));
    float spec = pow(max(0.0, dot(normal, light)), 40.0) * 0.5;

    gl_FragColor = col + vec4(spec);
}
`;