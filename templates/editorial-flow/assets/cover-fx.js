(() => {
  /* Cover FX: vanilla WebGL ports of ThreeUI Community backgrounds.
     Shaders © 2026 Meng To / @designcodeio/threeui, MIT.
     https://github.com/MengTo/threeui */
  const SPECS = [
    {
      id: 'ribbon-field',
      label: 'Ribbon Field',
      href: 'https://threeui.com/backgrounds/predictive-arc/ribbon-field',
      params: [
        { key: 'speed', label: '速度', min: 0.2, max: 2.4, step: 0.05, def: 1 },
        { key: 'pointer', label: '指针', min: 0, max: 2, step: 0.05, def: 1 },
        { key: 'smoothing', label: '平滑', min: 0.01, max: 0.12, step: 0.005, def: 0.035 },
        { key: 'hue', label: '色相', min: 0, max: 360, step: 1, def: 0 },
        { key: 'saturation', label: '饱和', min: 0, max: 2, step: 0.05, def: 1 },
        { key: 'brightness', label: '亮度', min: 0.2, max: 2, step: 0.05, def: 1 },
        { key: 'opacity', label: '不透明', min: 0.2, max: 1, step: 0.05, def: 1 },
      ],
    },
    {
      id: 'halftone-flow',
      label: 'Halftone Flow',
      href: 'https://threeui.com/backgrounds/predictive-arc/halftone-flow',
      params: [
        { key: 'speed', label: '速度', min: 0.2, max: 2.4, step: 0.05, def: 1 },
        { key: 'hue', label: '色相', min: 0, max: 360, step: 1, def: 0 },
        { key: 'saturation', label: '饱和', min: 0, max: 2, step: 0.05, def: 1 },
        { key: 'brightness', label: '亮度', min: 0.2, max: 2, step: 0.05, def: 1 },
      ],
    },
    {
      id: 'matrix-field',
      label: 'Matrix Field',
      href: 'https://threeui.com/backgrounds/matrix-field',
      params: [
        { key: 'speed', label: '速度', min: 0.2, max: 2.4, step: 0.05, def: 1 },
        { key: 'size', label: '尺寸', min: 0.4, max: 2, step: 0.05, def: 1 },
        { key: 'length', label: '长度', min: 0.4, max: 2, step: 0.05, def: 1 },
        { key: 'density', label: '密度', min: 0.4, max: 2, step: 0.05, def: 1 },
        { key: 'opacity', label: '不透明', min: 0.2, max: 1, step: 0.05, def: 1 },
        { key: 'hue', label: '色相', min: 0, max: 360, step: 1, def: 0 },
        { key: 'saturation', label: '饱和', min: 0, max: 2, step: 0.05, def: 1 },
        { key: 'brightness', label: '亮度', min: 0.2, max: 2, step: 0.05, def: 1 },
      ],
    },
    {
      id: 'stream-convergence',
      label: 'Stream Convergence',
      href: 'https://threeui.com/backgrounds/portal-field/stream-convergence',
      params: [
        { key: 'speed', label: '速度', min: 0.2, max: 2.4, step: 0.05, def: 1 },
        { key: 'fidelity', label: '细腻', min: 0.2, max: 1, step: 0.05, def: 0.5 },
        { key: 'scale', label: '尺度', min: 0.4, max: 2, step: 0.05, def: 1 },
        { key: 'hue', label: '色相', min: 0, max: 360, step: 1, def: 0 },
        { key: 'saturation', label: '饱和', min: 0, max: 2, step: 0.05, def: 1 },
        { key: 'brightness', label: '亮度', min: 0.2, max: 2, step: 0.05, def: 1 },
        { key: 'opacity', label: '不透明', min: 0.2, max: 1, step: 0.05, def: 1 },
      ],
    },
  ];

  const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const running = new WeakMap();
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const specOf = (id) => SPECS.find((s) => s.id === id) || null;

  const paramsOf = (el, spec) => {
    const out = {};
    spec.params.forEach((p) => {
      const v = parseFloat(el.getAttribute(`data-fx-${p.key}`));
      out[p.key] = Number.isFinite(v) ? v : p.def;
    });
    return out;
  };

  const SHADERS = {
    'ribbon-field': {
      attrib: 'position',
      vs: `
        attribute vec2 position;
        void main() { gl_Position = vec4(position, 0.0, 1.0); }
      `,
      fs: `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;
        uniform vec2 pointer;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float ribbon(vec2 uv, float offset, float width, float phase) {
          float y = 0.55 + 0.20 * sin((uv.x * 2.15) + phase) + 0.045 * sin((uv.x * 7.0) - phase * 0.7);
          float d = abs(uv.y - y - offset);
          return exp(-(d * d) / width);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float t = time * 0.22;
          float drift = (pointer.x - 0.5) * 0.06;
          float rightFade = smoothstep(0.28, 0.72, uv.x);
          float centerDark = 1.0 - smoothstep(0.0, 0.88, distance(uv, vec2(0.18, 0.48)));
          float r1 = ribbon(vec2(uv.x + drift, uv.y), 0.03, 0.0065, t + 0.9);
          float r2 = ribbon(vec2(uv.x - drift * 0.7, uv.y), -0.23, 0.0085, t + 3.25);
          float r3 = ribbon(vec2(uv.x + drift * 0.4, uv.y), 0.25, 0.014, t + 1.85);
          float glow = r1 * 1.14 + r2 * 1.05 + r3 * 0.48;
          vec3 teal = vec3(0.17, 0.83, 0.75);
          vec3 cyan = vec3(0.22, 0.82, 0.96);
          vec3 indigo = vec3(0.39, 0.38, 0.92);
          vec3 purple = vec3(0.66, 0.33, 0.98);
          vec3 blue = vec3(0.23, 0.51, 0.96);
          vec3 col = vec3(0.0);
          col += cyan * r1 * 0.92;
          col += teal * r1 * 0.62;
          col += indigo * r3 * 0.42;
          col += blue * r2 * 0.66;
          col += purple * (r2 + r3) * 0.30;
          float bloom = exp(-pow(distance(uv, vec2(0.76, 0.40 + 0.035 * sin(t))), 2.0) / 0.050);
          bloom += exp(-pow(distance(uv, vec2(0.71, 0.75 + 0.025 * cos(t))), 2.0) / 0.030);
          col += vec3(0.42, 0.85, 1.0) * bloom * 0.34;
          vec2 grid = fract(gl_FragCoord.xy / 7.0) - 0.5;
          float dotShape = smoothstep(0.29, 0.11, length(grid));
          float noise = hash(floor(gl_FragCoord.xy / 7.0));
          float scan = 0.72 + 0.28 * sin((uv.x + uv.y) * 38.0 + time * 1.3);
          float dots = dotShape * (0.48 + 0.52 * noise) * scan;
          float micro = hash(gl_FragCoord.xy + time) * 0.035;
          float alpha = clamp((glow * 1.55 + bloom * 0.50) * dots * rightFade, 0.0, 1.0);
          alpha *= 1.0 - centerDark * 0.56;
          vec3 base = vec3(0.005, 0.005, 0.005);
          vec3 finalColor = mix(base, col, clamp(alpha * 1.55, 0.0, 1.0));
          finalColor += micro * rightFade;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    },
    'halftone-flow': {
      attrib: 'aVertexPosition',
      vs: `
        attribute vec2 aVertexPosition;
        void main() { gl_Position = vec4(aVertexPosition, 0.0, 1.0); }
      `,
      fs: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;

        mat2 rot(float a) {
          float s = sin(a), c = cos(a);
          return mat2(c, -s, s, c);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;
          vec2 flow_uv = p;
          float time = u_time * 0.4;
          for (float i = 1.0; i < 4.0; i++) {
            flow_uv *= rot(time * 0.1);
            flow_uv.x += sin(flow_uv.y * 2.0 * i + time) * 0.5;
            flow_uv.y += cos(flow_uv.x * 1.5 * i - time * 0.8) * 0.5;
          }
          float intensity = sin(flow_uv.x * 2.0 + flow_uv.y * 3.0) * 0.5 + 0.5;
          vec3 col_dark = vec3(0.02, 0.0, 0.0);
          vec3 col_red = vec3(0.8, 0.1, 0.05);
          vec3 col_bright = vec3(1.0, 0.6, 0.2);
          vec3 fluid_color = mix(col_dark, col_red, smoothstep(0.2, 0.6, intensity));
          fluid_color = mix(fluid_color, col_bright, smoothstep(0.7, 1.0, intensity));
          float gridSize = 6.0;
          vec2 grid_uv = gl_FragCoord.xy / gridSize;
          vec2 cell_uv = fract(grid_uv) - 0.5;
          float dist = length(cell_uv);
          float radius = intensity * 0.45;
          float dot_mask = smoothstep(radius, radius - 0.1, dist);
          vec3 final_color = mix(vec3(0.0), fluid_color, dot_mask);
          final_color += fluid_color * 0.15;
          gl_FragColor = vec4(final_color, 1.0);
        }
      `,
    },
    'matrix-field': {
      attrib: 'aVertexPosition',
      vs: `
        attribute vec2 aVertexPosition;
        void main() { gl_Position = vec4(aVertexPosition, 0.0, 1.0); }
      `,
      fs: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_mouseActive;
        uniform float u_intensity;

        float hash(float n) { return fract(sin(n) * 753.5453123); }
        float noise(float x) {
          float i = floor(x);
          float f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(hash(i), hash(i + 1.0), f);
        }

        vec2 sdLine(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return vec2(length(pa - ba * h), h);
        }

        float lightning(vec2 uv, vec2 a, vec2 b, float t) {
          vec2 ab = b - a;
          float len = length(ab);
          if (len < 0.01) return 0.0;
          vec2 dir = ab / len;
          vec2 pa = uv - a;
          float h = clamp(dot(pa, dir) / len, 0.0, 1.0);
          float dist = length(pa - dir * (h * len));
          float env = sin(h * 3.1415);
          float offset = (noise(h * 25.0 - t * 35.0) - 0.5) * 0.08 * env;
          offset += (noise(h * 70.0 + t * 50.0) - 0.5) * 0.02 * env;
          float d = abs(dist + offset);
          return (0.0002 / (d + 0.0002) + 0.00001 / (d * d + 0.00001)) * env;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          uv = uv * 2.0 - 1.0;
          uv.x *= u_resolution.x / u_resolution.y;
          vec2 mouseUV = u_mouse / u_resolution.xy;
          mouseUV = mouseUV * 2.0 - 1.0;
          mouseUV.x *= u_resolution.x / u_resolution.y;
          vec2 center = vec2(-0.8, -0.2);
          center.x += sin(u_time * 0.4) * 0.03;
          center.y += cos(u_time * 0.3) * 0.03;
          vec2 dirUp = normalize(vec2(0.15, 1.0));
          vec2 dirRight = normalize(vec2(1.0, -0.25));
          vec2 dirDownLeft = normalize(vec2(-0.8, -0.6));
          vec2 l1 = sdLine(uv, center, center + dirUp * 5.0);
          vec2 l2 = sdLine(uv, center, center + dirRight * 5.0);
          vec2 l3 = sdLine(uv, center, center + dirDownLeft * 5.0);
          float intensity = u_intensity;
          float glow = intensity / (l1.x + 0.001) + intensity / (l2.x + 0.001) + (intensity * 0.4) / (l3.x + 0.001);
          glow += smoothstep(0.1, 0.0, abs(l1.y - fract(u_time * 0.4))) * 0.03 / (l1.x + 0.001);
          glow += smoothstep(0.1, 0.0, abs(l2.y - fract(u_time * 0.5 + 0.3))) * 0.03 / (l2.x + 0.001);
          glow += smoothstep(0.1, 0.0, abs(l3.y - fract(u_time * 0.3 + 0.7))) * 0.015 / (l3.x + 0.001);
          vec2 p1 = center + dirUp * clamp(dot(mouseUV - center, dirUp), 0.0, 5.0);
          vec2 p2 = center + dirRight * clamp(dot(mouseUV - center, dirRight), 0.0, 5.0);
          vec2 p3 = center + dirDownLeft * clamp(dot(mouseUV - center, dirDownLeft), 0.0, 5.0);
          float flicker = step(0.1, noise(u_time * 60.0)) * (noise(u_time * 150.0) * 0.8 + 0.2);
          glow += lightning(uv, p1, mouseUV, u_time) * smoothstep(2.0, 0.0, length(mouseUV - p1)) * u_mouseActive * flicker;
          glow += lightning(uv, p2, mouseUV, u_time + 10.0) * smoothstep(2.0, 0.0, length(mouseUV - p2)) * u_mouseActive * flicker;
          glow += lightning(uv, p3, mouseUV, u_time + 20.0) * smoothstep(2.0, 0.0, length(mouseUV - p3)) * u_mouseActive * flicker;
          float distToCenter = length(uv - center);
          glow += 0.04 / (distToCenter + 0.01);
          vec3 finalColor = vec3(0.6, 0.75, 1.0) * glow;
          finalColor *= 0.85 + 0.15 * sin(u_time * 2.0 - distToCenter * 8.0);
          finalColor *= 1.0 - smoothstep(0.4, 2.0, length(uv));
          finalColor += fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 0.02;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    },
    'stream-convergence': {
      attrib: 'position',
      vs: `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fs: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_interactive_fidelity;
        varying vec2 vUv;

        mat2 rotate2d(float _angle) {
          return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;
          p = rotate2d(0.55) * p;
          vec3 color = vec3(0.0);
          float spread = 0.06 * (0.3 + u_interactive_fidelity * 0.7);
          for (int i = 0; i < 3; i++) {
            float offset = float(1 - i) * spread;
            float y = p.y + offset + (sin(p.x * 2.5 - u_time * 1.5) * 0.12);
            float wave = smoothstep(0.85, 0.99, sin(y * 6.0 + u_time * 2.0) * 0.5 + 0.5);
            if (i == 0) color.r += wave * 1.2;
            if (i == 1) color.g += wave * 0.5;
            if (i == 2) color.b += wave * 1.8;
          }
          color *= exp(-length(vUv * 2.0 - 1.0) * 0.8);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    },
  };

  const compile = (gl, type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[cover-fx]', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const link = (gl, vsSrc, fsSrc) => {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[cover-fx]', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  };

  const grade = (canvas, p, id) => {
    const hue = p.hue || 0;
    const sat = p.saturation == null ? 1 : p.saturation;
    const bri = p.brightness == null ? 1 : p.brightness;
    const op = p.opacity == null ? 1 : p.opacity;
    canvas.style.opacity = String(op);
    canvas.style.filter = `hue-rotate(${hue}deg) saturate(${sat}) brightness(${bri})`;
    canvas.style.transform = id === 'stream-convergence' ? `scale(${p.scale == null ? 1 : p.scale})` : '';
  };

  const ensureCoverMediaSlot = (cover) => {
    let media = cover.querySelector(':scope > .chapter-cover__media');
    if (media) return media;
    media = document.createElement('div');
    media.className = 'chapter-cover__media';
    cover.prepend(media);
    return media;
  };

  const ensureHeadMediaSlot = (head) => {
    let media = head.querySelector(':scope > .slide-head__media');
    if (media) return media;
    media = document.createElement('div');
    media.className = 'slide-head__media';
    head.prepend(media);
    return media;
  };

  const stop = (cover) => {
    const rec = running.get(cover);
    if (!rec) return;
    rec.alive = false;
    cancelAnimationFrame(rec.raf);
    rec.ro?.disconnect();
    rec.io?.disconnect();
    if (rec.onMove) cover.removeEventListener('pointermove', rec.onMove);
    if (rec.onVis) document.removeEventListener('visibilitychange', rec.onVis);
    if (rec.gl && rec.program) {
      rec.gl.deleteProgram(rec.program);
      rec.gl.deleteBuffer(rec.buffer);
    }
    running.delete(cover);
  };

  const apply = (cover) => {
    if (!cover?.matches?.('.chapter-cover, .shot, .slide-head')) return;
    const spec = specOf(cover.getAttribute('data-fx'));
    const prev = running.get(cover);
    if (!spec) {
      cover.classList.remove('has-fx');
      stop(cover);
      cover.querySelector('.chapter-cover__fx')?.remove();
      return;
    }
    if (prev && prev.id === spec.id && prev.gl && !prev.gl.isContextLost()) {
      prev.params = paramsOf(cover, spec);
      grade(prev.canvas, prev.params, spec.id);
      return;
    }
    stop(cover);
    const media = cover.matches('.shot')
      ? (cover.querySelector('.shot__frame') || cover)
      : cover.matches('.slide-head')
        ? ensureHeadMediaSlot(cover)
        : ensureCoverMediaSlot(cover);
    if (!media) return;
    cover.classList.add('has-fx');
    cover.querySelectorAll('canvas.chapter-cover__fx').forEach((node) => node.remove());
    const canvas = document.createElement('canvas');
    canvas.className = 'chapter-cover__fx';
    canvas.setAttribute('aria-hidden', 'true');
    media.prepend(canvas);
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    const pack = SHADERS[spec.id];
    if (!gl || !pack) return;
    const program = link(gl, pack.vs, pack.fs);
    if (!program) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, pack.attrib);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    const names = spec.id === 'ribbon-field'
      ? ['resolution', 'time', 'pointer']
      : spec.id === 'halftone-flow'
        ? ['u_resolution', 'u_time']
        : spec.id === 'matrix-field'
          ? ['u_resolution', 'u_time', 'u_mouse', 'u_mouseActive', 'u_intensity']
          : ['u_time', 'u_resolution', 'u_interactive_fidelity'];
    names.forEach((name) => { u[name] = gl.getUniformLocation(program, name); });

    const ptr = { x: 0.72, y: 0.42, tx: 0.72, ty: 0.42 };
    const mouse = { x: -1000, y: -1000, active: 0, last: 0 };
    let dpr = 1;
    let visible = true;
    let raf = 0;
    const t0 = performance.now();
    const rec = {
      id: spec.id,
      gl,
      program,
      buffer,
      canvas,
      params: paramsOf(cover, spec),
      alive: true,
      raf: 0,
    };
    grade(canvas, rec.params, spec.id);

    const size = () => {
      const box = media.getBoundingClientRect();
      const area = box.width * box.height;
      dpr = Math.min(window.devicePixelRatio || 1, area > 1.4e6 ? 1.25 : 1.5);
      const w = Math.max(2, Math.round(box.width * dpr));
      const h = Math.max(2, Math.round(box.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      gl.viewport(0, 0, w, h);
    };

    const draw = (now) => {
      if (!rec.alive) return;
      const p = rec.params = paramsOf(cover, spec);
      grade(canvas, p, spec.id);
      const ease = Math.min(1, (p.smoothing || 0.035) * 12);
      ptr.x += (ptr.tx - ptr.x) * (spec.id === 'ribbon-field' ? p.smoothing : ease);
      ptr.y += (ptr.ty - ptr.y) * (spec.id === 'ribbon-field' ? p.smoothing : ease);
      const since = now - mouse.last;
      const target = since < 150 ? 1 : Math.max(0, 1 - (since - 150) / 350);
      mouse.active += (target - mouse.active) * 0.15;
      const t = (now - t0) * 0.001 * (p.speed || 1);
      const tw = spec.id === 'stream-convergence' ? now * 0.0003 * (p.speed || 1) : t;
      if (spec.id === 'ribbon-field') {
        gl.uniform2f(u.resolution, canvas.width, canvas.height);
        gl.uniform1f(u.time, t);
        gl.uniform2f(u.pointer, ptr.x, ptr.y);
      } else if (spec.id === 'halftone-flow') {
        gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(u.u_time, t);
      } else if (spec.id === 'matrix-field') {
        gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(u.u_time, t);
        gl.uniform2f(u.u_mouse, mouse.x, mouse.y);
        gl.uniform1f(u.u_mouseActive, mouse.active);
        gl.uniform1f(u.u_intensity, 0.006 * (p.size || 1) * (p.length || 1) * (p.density || 1));
      } else {
        gl.uniform1f(u.u_time, tw);
        gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(u.u_interactive_fidelity, p.fidelity == null ? 0.5 : p.fidelity);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const tick = (now) => {
      rec.raf = 0;
      if (!rec.alive) return;
      draw(now);
      if (!reduced() && visible && !document.hidden) rec.raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!rec.alive || rec.raf || reduced() || !visible || document.hidden) return;
      rec.raf = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      const box = cover.getBoundingClientRect();
      const mediaBox = canvas.getBoundingClientRect();
      if (!box.width || !mediaBox.width) return;
      rec.params = paramsOf(cover, spec);
      const amount = rec.params.pointer == null ? 1 : rec.params.pointer;
      const nx = (event.clientX - box.left) / box.width;
      const ny = (event.clientY - box.top) / box.height;
      ptr.tx = 0.72 + (nx - 0.72) * amount;
      ptr.ty = 0.42 + (1 - ny - 0.42) * amount;
      mouse.x = (event.clientX - mediaBox.left) * (canvas.width / Math.max(mediaBox.width, 1));
      mouse.y = (mediaBox.bottom - event.clientY) * (canvas.height / Math.max(mediaBox.height, 1));
      mouse.last = performance.now();
    };

    size();
    const ro = new ResizeObserver(() => { size(); if (reduced()) draw(performance.now()); });
    ro.observe(media);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) kick();
      else if (rec.raf) {
        cancelAnimationFrame(rec.raf);
        rec.raf = 0;
      }
    });
    io.observe(cover);
    const onVis = () => { if (!document.hidden) kick(); };
    document.addEventListener('visibilitychange', onVis);
    cover.addEventListener('pointermove', onMove, { passive: true });
    rec.ro = ro;
    rec.io = io;
    rec.onMove = onMove;
    rec.onVis = onVis;
    running.set(cover, rec);
    if (reduced()) draw(t0);
    else kick();
  };

  const mount = (root = document) => {
    root.querySelectorAll?.('.chapter-cover[data-fx], .shot[data-fx], .slide-head[data-fx]').forEach(apply);
  };

  window.SeedCoverFx = { specs: SPECS, specOf, paramsOf, apply, stop, mount };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(), { once: true });
  else mount();
})();
