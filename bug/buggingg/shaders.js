export const simulationVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const simulationFragmentShader = `
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 m = mouse / resolution;
  float d = length(uv - m);

  vec2 disp = vec2(0.0);
  if (mouse.x > 0.0) {
    disp = (uv - m) * (0.04 / (d * 10.0 + 0.1));
  }

  gl_FragColor = vec4(0.0, 0.0, disp);
}
`;

export const renderVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const renderFragmentShader = `
uniform sampler2D textureA;
uniform sampler2D textureB;
varying vec2 vUv;

void main() {
  vec4 base = texture2D(textureB, vUv);
  vec2 disp = texture2D(textureA, vUv).zw;

  float r = texture2D(textureB, vUv + disp * 0.3).r;
  float g = texture2D(textureB, vUv).g;
  float b = texture2D(textureB, vUv - disp * 0.3).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
`;