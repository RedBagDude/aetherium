uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ) );
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st.x *= uResolution.x / uResolution.y;

  vec2 mouseEffect = uMouse * 0.12;
  float n = snoise(st * 2.5 + vec2(uTime * 0.05) + mouseEffect);

  vec2 grid = abs(fract(st * 20.0 - 0.5) - 0.5) / fwidth(st * 20.0);
  float line = min(grid.x, grid.y);
  float gridPattern = 1.0 - min(line, 1.0);

  vec3 colorBase = vec3(0.011, 0.011, 0.019);
  vec3 colorAccent = vec3(0.0, 1.0, 0.584);
  vec3 colorIndigo = vec3(0.388, 0.4, 0.945);

  vec3 finalColor = mix(colorBase, colorIndigo, n * 0.16);
  finalColor = mix(finalColor, colorAccent, gridPattern * 0.045 * (n + 0.5));

  float distFromCenter = distance(gl_FragCoord.xy / uResolution.xy, vec2(0.5));
  finalColor *= (1.0 - distFromCenter * 0.85);

  gl_FragColor = vec4(finalColor, 1.0);
}
