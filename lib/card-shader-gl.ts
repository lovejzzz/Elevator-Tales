// v9.10 card foil shader. One shared WebGL context renders each registered card's foil, then copies it into
// that card's own 2D canvas. No blend modes and no per-card GL contexts, so hovering never triggers the
// compositor repaint that flashed black in 9.9. If WebGL is missing or lost, cards keep the CSS foil.

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision mediump float;
varying vec2 uv;uniform vec2 res;uniform vec2 ptr;uniform float t;uniform float mode;
vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  float asp=res.x/res.y; vec2 a=vec2(uv.x*asp,uv.y); vec2 d=(uv-ptr)*vec2(asp,1.);
  float spec=exp(-dot(d,d)*5.);
  float band=dot(uv,vec2(.8,.6))*2.4+(ptr.x-ptr.y)*1.6+t*.04;
  vec3 col; float alpha;
  if(mode<1.5){
    /* rare: holographic rainbow bands with fine etched lines and a soft highlight under the pointer */
    col=hue(fract(band));
    float lines=.55+.45*sin((uv.x*asp+uv.y)*res.y*.9);
    alpha=.07*lines+.16*spec;
    col=mix(col,vec3(1.,.95,.82),spec*.55);
  } else {
    /* legendary: drifting polychrome, gold sunburst from the top-right corner, sparse twinkling stars */
    float n=sin(a.x*5.+t*.25)+sin(a.y*6.-t*.2)+sin((a.x+a.y)*3.5+t*.15);
    col=hue(fract(n*.1+band*.18+t*.015));
    vec2 c=vec2(1.)-uv; float rays=smoothstep(.55,1.,sin(atan(c.y,c.x)*44.))*smoothstep(1.4,.1,length(c*vec2(asp,1.)));
    vec2 cell=floor(a*26.); float h=hash(cell);
    float tw=step(.988,h)*pow(max(0.,sin(t*1.1+h*40.)),18.);
    col=mix(col,vec3(1.,.84,.48),rays*.6)+vec3(1.,.95,.8)*tw;
    alpha=.12+.12*rays+.55*tw+.14*spec;
  }
  gl_FragColor=vec4(col*alpha,alpha);
}`;

type Entry = { canvas: HTMLCanvasElement; host: HTMLElement; mode: number; ctx: CanvasRenderingContext2D; seed: number };
const entries = new Set<Entry>();
let gl: WebGLRenderingContext | null = null, glCanvas: HTMLCanvasElement | null = null, failed = false, raf = 0, last = 0, start = 0;
let loc: { res: WebGLUniformLocation | null; ptr: WebGLUniformLocation | null; t: WebGLUniformLocation | null; mode: WebGLUniformLocation | null } | null = null;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function init(): boolean {
  if (failed) return false;
  if (gl) return true;
  try {
    glCanvas = document.createElement('canvas');
    gl = glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('no webgl');
    const compile = (type: number, src: string) => { const sh = gl!.createShader(type)!; gl!.shaderSource(sh, src); gl!.compileShader(sh); if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(sh) ?? 'shader'); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    loc = { res: gl.getUniformLocation(prog, 'res'), ptr: gl.getUniformLocation(prog, 'ptr'), t: gl.getUniformLocation(prog, 't'), mode: gl.getUniformLocation(prog, 'mode') };
    glCanvas.addEventListener('webglcontextlost', () => { failed = true; gl = null; entries.forEach(e => e.host.classList.remove('has-shader')); entries.clear(); cancelAnimationFrame(raf); raf = 0; });
    start = performance.now();
    return true;
  } catch { failed = true; gl = null; return false; }
}

function draw(e: Entry, now: number) {
  if (!gl || !glCanvas || !loc) return;
  const w = Math.max(1, Math.round(e.canvas.clientWidth)), h = Math.max(1, Math.round(e.canvas.clientHeight));
  if (w < 4 || h < 4) return;
  if (e.canvas.width !== w || e.canvas.height !== h) { e.canvas.width = w; e.canvas.height = h; }
  if (glCanvas.width !== w || glCanvas.height !== h) { glCanvas.width = w; glCanvas.height = h; }
  const t = (now - start) / 1000 + e.seed;
  // Pointer from the card's --mx/--my (set on hover); otherwise a slow idle drift.
  const mx = parseFloat(e.host.style.getPropertyValue('--mx')), my = parseFloat(e.host.style.getPropertyValue('--my'));
  const px = Number.isFinite(mx) ? mx : .5 + .3 * Math.sin(t * .23), py = Number.isFinite(my) ? my : .4 + .2 * Math.cos(t * .19);
  gl.viewport(0, 0, w, h);
  gl.uniform2f(loc.res, w, h); gl.uniform2f(loc.ptr, px, 1 - py); gl.uniform1f(loc.t, t); gl.uniform1f(loc.mode, e.mode);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  e.ctx.clearRect(0, 0, w, h); e.ctx.drawImage(glCanvas, 0, 0);
}

function loop(now: number) {
  raf = entries.size ? requestAnimationFrame(loop) : 0;
  if (document.hidden || now - last < 40) return; // ~25 fps is plenty for a slow sheen
  last = now; entries.forEach(e => draw(e, now));
}

/** Attach the foil shader to a card canvas. Returns false when WebGL is unavailable (keep the CSS foil). */
export function registerCardShader(canvas: HTMLCanvasElement, host: HTMLElement, legendary: boolean): boolean {
  if (typeof window === 'undefined' || !init()) return false;
  const ctx = canvas.getContext('2d'); if (!ctx) return false;
  const e: Entry = { canvas, host, mode: legendary ? 2 : 1, ctx, seed: Math.random() * 100 };
  entries.add(e);
  if (reduced()) { requestAnimationFrame(now => draw(e, now)); return true; }
  if (!raf) raf = requestAnimationFrame(loop);
  return true;
}
export function unregisterCardShader(canvas: HTMLCanvasElement) {
  entries.forEach(e => { if (e.canvas === canvas) entries.delete(e); });
  if (!entries.size && raf) { cancelAnimationFrame(raf); raf = 0; }
}
