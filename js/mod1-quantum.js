/* ============================================================================
   affePhysics — MODÜL 1 EKİ: Quantum-Atom (nazat02) + Astra Lab "Build an Atom"
   • Çoklu kabuk GLSL |ψ|² bulutu · Ultra · Küre-lob · Diffuse · Kesit · Izgara
   • Uyarılmış durum & foton emisyonu · Renk körlüğü paleti · Antimadde
   • 3B Moleküller (VSEPR, σ/π bulutları, ortaklanmamış çiftler) · İnşa Et
   • Reaksiyon animasyonları · Madde+Antimadde yok olma · Bohr vs Kuantum
   • Element karşılaştırma · Bağ analizi · Rehberli dersler · Geçmiş · Rastgele
   • Nucleus Explorer: Gauss dalga paketi nükleonlar, Yukawa π ağı, uud/udd kuark & gluon
   ============================================================================ */
(function () {
  'use strict';

  const { ELEMENTS, CATS, ORDER, CAP, L_OF, calcNuclearProperties } = window.PhysData;
  const { clamp, realSphericalHarmonic, radialProbDensity, evalPsi3D, wavelengthToColor, makeSpriteLabel } = window.PhysCore;
  const $ = (id) => document.getElementById(id);
  const D2R = Math.PI / 180;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const API = () => window.Mod1Atom;

  /* ------------------------------------------------------------------------
     DURUM
     ------------------------------------------------------------------------ */
  const Q = {
    leftMode: 'elements',   // 'elements' | 'molecules' | 'build'
    sceneKind: 'atom',      // 'atom' | 'molecule'
    multiShell: true,
    hiddenSub: new Set(),
    colorblind: false,
    grid: true,
    excited: false,
    emitting: false,
    emitT: 0,
    excitedInfo: null,
    electrons: null,        // iyon için elektron sayısı (null = nötr)
    mol: null,
    molKey: 'h2o',
    compare: null,          // {z1, z2}
    special: null,          // 'annihilation' | 'reaction' | null
    reactionKey: 'water',
    zoomV: 0,
    showPions: true,
    showGluons: true,
    recents: [],
    lesson: null,
    lessonIdx: 0,
    banner: null,
    mats: [],
    baaInternal: false,
    challengeIdx: 0,
    nucUpdate: null,
    nucActive: false,
    annT: 0, annPaused: false,
    rxT: 0, rxPaused: false
  };

  const ELZ = {};
  ELEMENTS.forEach((e) => { ELZ[e.symbol] = e.Z; });

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  let toastTimer = null;
  function toast(msg) {
    const el = $('qaToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ------------------------------------------------------------------------
     RENK PALETLERİ (19 alt kabuk: 1s … 7p)
     ------------------------------------------------------------------------ */
  const PAL_DEFAULT = [
    '#ff4d6d', '#ff8a3d', '#ffc83d', '#c6ff3d', '#5cff6e', '#2effb5', '#2ee6ff', '#3da5ff', '#4d6dff',
    '#7a4dff', '#b04dff', '#e04dff', '#ff4dd2', '#ff7a9c', '#ffa066', '#ffd966', '#a8ff80', '#66ffd0', '#80c8ff'
  ];
  const PAL_CB = [
    '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#FFFFFF', '#B8860B',
    '#9AD7F2', '#66C2A5', '#FFF28A', '#5A9BD5', '#FF9F66', '#E6A6C8', '#D9D9D9', '#C9A227', '#7FD1E8', '#8FD3B6'
  ];
  function subColor(idx, anti) {
    const i = ((idx % 19) + 19) % 19;
    if (anti) {
      const c = new THREE.Color();
      c.setHSL(0.76 + (i / 19) * 0.2, 0.95, 0.62);
      return '#' + c.getHexString();
    }
    return (Q.colorblind ? PAL_CB : PAL_DEFAULT)[i];
  }

  /* ------------------------------------------------------------------------
     DALGA FONKSİYONU ÖRNEKLEYİCİLERİ
     ------------------------------------------------------------------------ */
  const cdfCache = {};
  function radialCDF(n, l) {
    const key = n + '_' + l;
    if (cdfCache[key]) return cdfCache[key];
    const N = 360, Rm = n * n * 3.2 + 10;
    const cum = new Float32Array(N + 1);
    let s = 0;
    for (let i = 1; i <= N; i++) { s += radialProbDensity(n, l, (i / N) * Rm); cum[i] = s; }
    if (s <= 0) s = 1;
    for (let i = 0; i <= N; i++) cum[i] /= s;
    return (cdfCache[key] = { cum, Rm, N });
  }
  function sampleR(c, u) {
    let lo = 0, hi = c.N;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (c.cum[mid] < u) lo = mid + 1; else hi = mid; }
    return (lo / c.N) * c.Rm;
  }
  const maxYCache = {};
  function maxY2(l, m) {
    const key = l + '_' + m;
    if (maxYCache[key] != null) return maxYCache[key];
    let mx = 1e-6;
    for (let i = 0; i <= 40; i++) {
      for (let j = 0; j < 80; j++) {
        const y = realSphericalHarmonic(l, m, (i / 40) * Math.PI, (j / 80) * Math.PI * 2);
        if (y * y > mx) mx = y * y;
      }
    }
    return (maxYCache[key] = mx * 1.05);
  }
  function sampleDir(l, m, rand) {
    const mx = maxY2(l, m);
    let x = 0, y = 0, z = 1;
    for (let k = 0; k < 70; k++) {
      const u = rand() * 2 - 1, ph = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(ph); y = s * Math.sin(ph); z = u;
      if (l === 0) break;
      const Y = realSphericalHarmonic(l, m, Math.acos(u), ph);
      if (rand() * mx < Y * Y) break;
    }
    return [x, y, z];
  }
  function mWeights(l, count) {
    const w = new Array(2 * l + 1).fill(0);
    for (let i = 0; i < count; i++) w[i % (2 * l + 1)] += 1;
    return w;
  }
  function pickM(ws, l, rand) {
    let tot = 0; ws.forEach((x) => { tot += x; });
    let u = rand() * tot;
    for (let i = 0; i < ws.length; i++) { u -= ws[i]; if (u <= 0) return i - l; }
    return 0;
  }
  const visTarget = (n) => 1.15 + (Math.min(n, 8) - 1) * 1.12;

  /* ------------------------------------------------------------------------
     ALT KABUK LİSTESİ (Aufbau / iyon / uyarılmış durum)
     ------------------------------------------------------------------------ */
  function configFor(Z, electrons) {
    if (electrons == null || electrons === Z) return Object.assign({}, ELEMENTS[Z - 1].config);
    const conf = {};
    let left = Math.max(0, electrons);
    for (const sub of ORDER) {
      if (left <= 0) break;
      const take = Math.min(CAP[sub[1]], left);
      conf[sub] = take; left -= take;
    }
    return conf;
  }
  function subshellList(Z, allowExcited, electrons) {
    const conf = configFor(Z, electrons);
    const list = [];
    ORDER.forEach((name, idx) => {
      const c = conf[name] || 0;
      if (c > 0) list.push({ name, n: +name[0], l: L_OF[name[1]], count: c, idx });
    });
    Q.excitedInfo = null;
    if (allowExcited && Q.excited && list.length) {
      const h = list.slice().sort((a, b) => a.n - b.n || a.l - b.l).pop();
      h.count -= 1;
      const tl = h.l === 0 ? 1 : 0, tn = h.n + 1;
      const to = { name: `${tn}${'spdf'[tl]}`, n: tn, l: tl, count: 1, idx: ORDER.length + 2, excited: true, from: h.name };
      Q.excitedInfo = { from: h.name, to: to.name, ni: h.n, nf: tn };
      const out = list.filter((s) => s.count > 0);
      out.push(to);
      return out;
    }
    return list;
  }

  /* ------------------------------------------------------------------------
     GLSL NOKTA BULUTU (Real Image — additive blending + flicker)
     ------------------------------------------------------------------------ */
  const PT_VERT = `attribute vec3 aColor;attribute float aSize;attribute float aPhase;uniform float uTime;uniform float uPx;uniform float uMode;varying vec3 vC;varying float vA;
void main(){vC=aColor;float fl=uMode<0.5?(0.62+0.38*sin(uTime*2.6+aPhase*6.2831)):1.0;vA=fl;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=max(1.0,aSize*uPx/(-mv.z));gl_Position=projectionMatrix*mv;}`;
  const PT_FRAG = `precision mediump float;varying vec3 vC;varying float vA;uniform float uAlpha;uniform float uMode;
void main(){float d=length(gl_PointCoord-vec2(0.5))*2.0;if(d>1.0)discard;float a;if(uMode>0.5&&uMode<1.5){a=smoothstep(1.0,0.72,d)*uAlpha;}else{a=pow(1.0-d,1.7)*vA*uAlpha;}gl_FragColor=vec4(vC*1.25,a);}`;

  function makePoints(pos, col, size, phase, o = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPx: { value: (o.px || 520) * Math.min(window.devicePixelRatio || 1, 2) },
        uMode: { value: o.mode || 0 },
        uAlpha: { value: o.alpha != null ? o.alpha : 1 }
      },
      vertexShader: PT_VERT, fragmentShader: PT_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    Q.mats.push(m);
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return p;
  }

  function genCloud(list, o) {
    const rand = o.rand;
    const pos = [], col = [], size = [], ph = [];
    const posCol = new THREE.Color(o.anti ? '#ff3366' : '#00f2fe');
    const negCol = new THREE.Color(o.anti ? '#fbbf24' : '#a855f7');
    list.forEach((s) => {
      const cdf = radialCDF(s.n, s.l);
      const vis = (s.vis != null ? s.vis : visTarget(s.n) / (1.5 * s.n * s.n)) * (o.scale || 1);
      const color = new THREE.Color(s.excited ? '#ffcc33' : subColor(s.idx, o.anti));
      const ws = o.single != null ? null : mWeights(s.l, s.count);
      const cnt = Math.max(30, Math.round(o.perElec * s.count));
      for (let i = 0; i < cnt; i++) {
        const r = sampleR(cdf, rand());
        const m = o.single != null ? o.single : pickM(ws, s.l, rand);
        const d = sampleDir(s.l, m, rand);
        const sx = d[0] * r * vis, sy = d[2] * r * vis, sz = -d[1] * r * vis;
        if (o.slice && sz > 0) continue;
        pos.push(sx, sy, sz);
        let c = color;
        if (o.single != null) c = evalPsi3D(s.n, s.l, m, d[0] * r, d[1] * r, d[2] * r) >= 0 ? posCol : negCol;
        col.push(c.r, c.g, c.b);
        size.push((0.085 + rand() * 0.085) * (o.sizeMul || 1));
        ph.push(rand());
      }
    });
    return {
      pos: new Float32Array(pos), col: new Float32Array(col),
      size: new Float32Array(size), phase: new Float32Array(ph)
    };
  }

  function nucleusPoints(Z, N, anti, radius) {
    const A = Math.max(1, Z + N), cnt = Math.min(A, 60);
    const pos = new Float32Array(cnt * 3 + 3), col = new Float32Array(cnt * 3 + 3);
    const size = new Float32Array(cnt + 1), ph = new Float32Array(cnt + 1);
    const rand = mulberry(Z * 31 + N);
    const pc = new THREE.Color(anti ? '#36e0ff' : '#ff3322');
    const nc = new THREE.Color(anti ? '#ff7ad9' : '#3366ff');
    for (let i = 0; i < cnt; i++) {
      const y = 1 - (2 * (i + 0.5)) / cnt, rr = radius * Math.cbrt((i + 0.5) / cnt), th = i * 2.399963;
      const s = Math.sqrt(Math.max(0, 1 - y * y));
      pos[i * 3] = Math.cos(th) * s * rr; pos[i * 3 + 1] = y * rr; pos[i * 3 + 2] = Math.sin(th) * s * rr;
      const c = rand() < Z / A ? pc : nc;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = 0.24; ph[i] = rand();
    }
    const k = cnt;
    pos[k * 3] = 0; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = 0;
    col[k * 3] = 1; col[k * 3 + 1] = 0.6; col[k * 3 + 2] = 0.5; size[k] = 0.55; ph[k] = 0;
    return makePoints(pos, col, size, ph, { mode: 0, alpha: 0.9 });
  }

  /* ------------------------------------------------------------------------
     ULTRA (Fresnel) LOB AĞLARI & KÜRE-LOB MODU
     ------------------------------------------------------------------------ */
  const GL_VERT = `attribute float aSign;varying vec3 vN;varying vec3 vV;varying float vS;
void main(){vS=aSign;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
  const GL_FRAG = `uniform vec3 uColor;uniform float uOp;varying vec3 vN;varying vec3 vV;varying float vS;
void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.2);vec3 c=mix(uColor,uColor*0.5+vec3(0.18,0.0,0.32),vS);gl_FragColor=vec4(c*(0.45+1.0*f),uOp*(0.30+0.7*f));}`;

  function buildLobeMesh(l, m, radius, color, seg, opacity) {
    const pos = [], sgn = [], idx = [];
    let mx = 1e-6;
    const vals = [];
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= seg; j++) {
        const v = realSphericalHarmonic(l, m, (i / seg) * Math.PI, (j / seg) * Math.PI * 2);
        vals.push(v); if (Math.abs(v) > mx) mx = Math.abs(v);
      }
    }
    let k = 0;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI;
      for (let j = 0; j <= seg; j++) {
        const ph = (j / seg) * Math.PI * 2, v = vals[k++];
        const r = l === 0 ? radius : (Math.abs(v) / mx) * radius;
        const x = Math.sin(th) * Math.cos(ph) * r, y = Math.sin(th) * Math.sin(ph) * r, z = Math.cos(th) * r;
        pos.push(x, z, -y);
        sgn.push(v < 0 ? 1 : 0);
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j, b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aSign', new THREE.BufferAttribute(new Float32Array(sgn), 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    const c = new THREE.Color(color);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Vector3(c.r, c.g, c.b) }, uOp: { value: opacity } },
      vertexShader: GL_VERT, fragmentShader: GL_FRAG,
      transparent: true, side: THREE.DoubleSide, depthWrite: false
    });
    return new THREE.Mesh(g, mat);
  }

  function atomItems(st) {
    if (Q.multiShell) {
      const items = [];
      subshellList(st.Z, true, Q.electrons).filter((s) => s.excited || !Q.hiddenSub.has(s.name)).forEach((s) => {
        const ws = mWeights(s.l, s.count);
        ws.forEach((w, k) => { if (w > 0) items.push({ s, m: k - s.l, w, R: visTarget(s.n) }); });
      });
      return items;
    }
    const idx = Math.max(0, ORDER.indexOf(`${st.n}${'spdf'[st.l]}`));
    return [{ s: { n: st.n, l: st.l, idx, count: 1 }, m: st.ml, w: 1, R: 2.2 + st.n * 0.9 }];
  }

  function buildGlassGroup(st) {
    const g = new THREE.Group();
    atomItems(st).forEach((it) => {
      const color = it.s.excited ? '#ffcc33' : subColor(it.s.idx, st.antimatter);
      g.add(buildLobeMesh(it.s.l, it.m, it.R * 0.96, color, it.s.l === 0 ? 26 : 30, it.s.l === 0 ? 0.55 : 0.8));
    });
    return g;
  }

  function buildSphericalGroup(st) {
    const g = new THREE.Group();
    const seen = new Set();
    atomItems(st).forEach((it) => {
      const color = new THREE.Color(it.s.excited ? '#ffcc33' : subColor(it.s.idx, st.antimatter));
      const mat = () => new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.34, shininess: 90, depthWrite: false });
      const R = it.R;
      if (it.s.l === 0) {
        if (seen.has(it.s.idx)) return; seen.add(it.s.idx);
        g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.95, 28, 20), mat()));
      } else if (it.s.l === 1) {
        const ax = it.m === 0 ? V(0, 1, 0) : (it.m === 1 ? V(1, 0, 0) : V(0, 0, 1));
        [1, -1].forEach((sg) => {
          const sp = new THREE.Mesh(new THREE.SphereGeometry(R * 0.36, 20, 14), mat());
          sp.position.copy(ax).multiplyScalar(sg * R * 0.6);
          g.add(sp);
        });
      } else {
        const lobes = 2 * it.s.l;
        for (let q = 0; q < lobes; q++) {
          const a = (q / lobes) * Math.PI * 2 + it.m * 0.5;
          const sp = new THREE.Mesh(new THREE.SphereGeometry(R * 0.24, 16, 12), mat());
          const tilt = (it.m + it.s.l) / (2 * it.s.l + 1);
          sp.position.set(Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66 * tilt, Math.sin(a) * R * 0.5 * (1 - tilt));
          g.add(sp);
        }
      }
    });
    return g;
  }

  function addGrid(root, extent) {
    const size = Math.max(8, Math.ceil((extent * 2.4) / 2) * 2);
    const grid = new THREE.GridHelper(size, size, 0x2dd4ff, 0x1e3a5f);
    grid.material.transparent = true; grid.material.opacity = 0.2;
    grid.position.y = -(extent + 0.6);
    root.add(grid);
    const L = extent + 1.5;
    [[[L, 0, 0], 0xff3366, 'X'], [[0, L, 0], 0x00f2fe, 'Z'], [[0, 0, -L], 0x10b981, 'Y']].forEach(([p, c, name]) => {
      const gg = new THREE.BufferGeometry().setFromPoints([V(-p[0], -p[1], -p[2]), V(p[0], p[1], p[2])]);
      root.add(new THREE.Line(gg, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.28 })));
      const lb = makeSpriteLabel(name, '#94a3b8', 0.55);
      lb.position.set(p[0] * 1.07, p[1] * 1.07, p[2] * 1.07);
      root.add(lb);
    });
  }

  /* ------------------------------------------------------------------------
     SAHNE ÇİZİCİLERİ: ATOM
     ------------------------------------------------------------------------ */
  function covR(Z) {
    const T = {
      1: 0.31, 2: 0.28, 3: 1.28, 4: 0.96, 5: 0.84, 6: 0.76, 7: 0.71, 8: 0.66, 9: 0.57, 10: 0.58, 11: 1.66, 12: 1.41,
      13: 1.21, 14: 1.11, 15: 1.07, 16: 1.05, 17: 1.02, 18: 1.06, 19: 2.03, 20: 1.76, 26: 1.32, 29: 1.32, 30: 1.22,
      32: 1.20, 33: 1.19, 34: 1.20, 35: 1.20, 36: 1.16, 50: 1.39, 53: 1.39, 54: 1.40, 79: 1.36, 82: 1.46
    };
    if (T[Z]) return T[Z];
    const e = ELEMENTS[Z - 1];
    return 0.6 + 0.25 * (e ? e.row : 4);
  }

  function renderLegend(st) {
    const box = $('qaSubshellLegend');
    if (!box) return;
    if (!Q.multiShell) {
      box.innerHTML = '<span style="font-size:10.5px;color:var(--muted);">Tekil orbital modunda (n, l, m) seçilidir.</span>';
      return;
    }
    const list = subshellList(st.Z, false, Q.electrons);
    box.innerHTML = list.map((s) => {
      const off = Q.hiddenSub.has(s.name) ? ' off' : '';
      return `<span class="qa-orb-chip${off}" data-sub="${s.name}"><i class="sw" style="background:${subColor(s.idx, st.antimatter)};box-shadow:0 0 6px ${subColor(s.idx, st.antimatter)}"></i>${s.name}<sup>${s.count}</sup></span>`;
    }).join('');
  }

  function recordRecent(item) {
    const key = item.kind + ':' + item.id;
    Q.recents = Q.recents.filter((r) => r.kind + ':' + r.id !== key);
    Q.recents.unshift(item);
    Q.recents = Q.recents.slice(0, 14);
    try { localStorage.setItem('affephysics_recents', JSON.stringify(Q.recents)); } catch (_) { /* yoksay */ }
  }

  function setAtomHud(st) {
    const el = ELEMENTS[st.Z - 1];
    const e = Q.electrons != null ? Q.electrons : st.Z;
    if ($('hudE')) $('hudE').textContent = `${e} (${st.antimatter ? 'e⁺' : 'e⁻'})`;
    if ($('hudOrbital')) {
      $('hudOrbital').textContent = Q.multiShell
        ? (Q.excited && Q.excitedInfo ? `${Q.excitedInfo.from}→${Q.excitedInfo.to} (uyarılmış)` : (el.configStr.length > 26 ? '[Çoklu Kabuk]' : el.configStr))
        : $('hudOrbital').textContent;
    }
    if ($('telAtomEN')) $('telAtomEN').textContent = el.en ? `${el.en.toFixed(2)} (Pauling)` : 'Tanımsız';
    if ($('telAtomRadius')) $('telAtomRadius').textContent = `${Math.round(covR(st.Z) * 100)} pm`;
    if (Q.electrons != null && Q.electrons !== st.Z && $('atomElSub')) {
      const q = st.Z - Q.electrons;
      $('atomElSub').textContent = `${q > 0 ? 'Katyon' : 'Anyon'} (${q > 0 ? '+' : '−'}${Math.abs(q)}) · ${CATS[el.cat].name}`;
    }
    renderLegend(st);
    recordRecent({ kind: 'atom', id: st.Z, label: `${el.symbol} · ${el.name}` });
  }

  function buildAtomScene(v3, st, view) {
    const root = v3.root, anti = st.antimatter;
    const items = atomItems(st);
    const maxR = Q.multiShell ? Math.max(...items.map((i) => i.R), 3) : 2.2 + st.n * 0.9;

    root.add(nucleusPoints(st.Z, st.N, anti, 0.32));

    let obj;
    if (view === 'glass') obj = buildGlassGroup(st);
    else if (view === 'spherical') obj = buildSphericalGroup(st);
    else {
      const el = Q.electrons != null ? Q.electrons : st.Z;
      const list = Q.multiShell
        ? subshellList(st.Z, true, Q.electrons).filter((s) => s.excited || !Q.hiddenSub.has(s.name))
        : [{ name: 'tek', n: st.n, l: st.l, count: 1, idx: Math.max(0, ORDER.indexOf(`${st.n}${'spdf'[st.l]}`)), vis: (2.2 + st.n * 0.9) / (1.5 * st.n * st.n) }];
      const perElec = Q.multiShell ? Math.max(40, Math.min(520, Math.round(15000 / Math.max(1, el)))) : st.cloudDensity || 5500;
      const mode = view === 'diffuse' ? 2 : (view === 'cloud' || view === 'slice' ? 1 : 0);
      const cl = genCloud(list, {
        rand: mulberry(st.Z * 7919 + st.n * 131 + st.l * 17 + (st.ml + 9) * 5 + 3),
        perElec, anti, single: Q.multiShell ? null : st.ml,
        slice: view === 'slice', sizeMul: view === 'diffuse' ? 3.4 : 1
      });
      obj = makePoints(cl.pos, cl.col, cl.size, cl.phase, { mode, alpha: view === 'diffuse' ? 0.14 : (mode === 1 ? 0.92 : 1) });
    }
    root.add(obj);
    if (Q.grid) addGrid(root, maxR);

    // Excited-state foton dalgası
    let photon = null;
    if (Q.excited || Q.emitting) {
      photon = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 14, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
      );
      photon.visible = false;
      root.add(photon);
    }
    const dirP = V(0.7, 0.5, 0.45).normalize();
    v3.onFrame((dt) => {
      obj.rotation.y += dt * 0.1;
      if (photon && Q.emitting) {
        Q.emitT += dt;
        photon.visible = true;
        photon.position.copy(dirP).multiplyScalar(Q.emitT * 7);
        photon.scale.setScalar(0.8 + 0.4 * Math.sin(Q.emitT * 30));
        photon.material.color.set(Q.photonColor || '#ffffff');
        if (Q.emitT > (maxR * 2.2) / 7) {
          Q.emitting = false; Q.excited = false; Q.emitT = 0;
          syncExcitedUI();
          API().refresh();
        }
      }
    });
    v3.setDistance(Math.max(13, maxR * 2.6));
    setAtomHud(st);
    syncExcitedUI();
  }

  /* ------------------------------------------------------------------------
     BOHR vs KUANTUM & ELEMENT KARŞILAŞTIRMA
     ------------------------------------------------------------------------ */
  function bohrGroup(Z, N, anti, f) {
    const g = new THREE.Group();
    g.add(nucleusPoints(Z, N, anti, 0.3));
    const shells = ELEMENTS[Z - 1].shells;
    const eCol = anti ? 0xff3366 : 0x00f2fe;
    const electrons = [];
    shells.forEach((cnt, idx) => {
      const radius = 1.2 + idx * 0.95;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.016, 6, 96), new THREE.MeshBasicMaterial({ color: anti ? 0xf43f5e : 0x38bdf8, transparent: true, opacity: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      for (let k = 0; k < cnt; k++) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: eCol }));
        g.add(e);
        electrons.push({ e, radius, ang: (k / cnt) * Math.PI * 2, speed: 1.4 / Math.sqrt(idx + 1) });
      }
    });
    g.userData.electrons = electrons;
    g.scale.setScalar(f);
    return g;
  }

  function atomCloudScaled(Z, N, anti, scale, seedSalt) {
    const list = subshellList(Z, false, null);
    const cl = genCloud(list, { rand: mulberry(Z * 811 + seedSalt), perElec: Math.max(30, Math.min(300, Math.round(7000 / Z))), anti, scale });
    return makePoints(cl.pos, cl.col, cl.size, cl.phase, { mode: 0 });
  }
  const maxTargetOf = (Z) => Math.max(...subshellList(Z, false, null).map((s) => visTarget(s.n)), 2);

  function buildBohrVsQM(v3, st) {
    const root = v3.root, Z = st.Z, anti = st.antimatter;
    const shells = ELEMENTS[Z - 1].shells;
    const bohrExtent = 1.2 + (shells.length - 1) * 0.95 + 0.4;
    const f = Math.min(1, 4.6 / bohrExtent), f2 = Math.min(1, 4.6 / maxTargetOf(Z));
    const bg = bohrGroup(Z, st.N, anti, f);
    bg.position.x = -6.4;
    const qg = new THREE.Group();
    qg.add(nucleusPoints(Z, st.N, anti, 0.28));
    qg.add(atomCloudScaled(Z, st.N, anti, f2, 5));
    qg.position.x = 6.4;
    root.add(bg, qg);
    const l1 = makeSpriteLabel('Bohr 1913 · Gezegen Modeli', '#38bdf8', 1.5); l1.position.set(-6.4, -5.9, 0);
    const l2 = makeSpriteLabel('Schrödinger 1926 · |ψ|² Bulutu', '#00f2fe', 1.5); l2.position.set(6.4, -5.9, 0);
    root.add(l1, l2);
    v3.onFrame((dt) => {
      bg.userData.electrons.forEach((o) => {
        o.ang += dt * o.speed;
        o.e.position.set(Math.cos(o.ang) * o.radius * f, 0, Math.sin(o.ang) * o.radius * f);
      });
      qg.rotation.y += dt * 0.1;
    });
    v3.setDistance(23);
    setAtomHud(st);
    toast('⚖️ Bohr vs Kuantum: Soldaki kesin yörünge, sağdaki gerçek olasılık bulutu');
  }

  function buildCompare(v3, st) {
    const root = v3.root, { z1, z2 } = Q.compare;
    [[z1, -5.4], [z2, 5.4]].forEach(([Z, x], i) => {
      const el = ELEMENTS[Z - 1], f = Math.min(1, 4.4 / maxTargetOf(Z));
      const g = new THREE.Group();
      g.add(nucleusPoints(Z, el.neutrons, st.antimatter, 0.28));
      g.add(atomCloudScaled(Z, el.neutrons, st.antimatter, f, 11 + i));
      g.position.x = x;
      root.add(g);
      const lb = makeSpriteLabel(`${el.symbol} · ${el.name} (Z=${Z})`, '#e2e8f0', 1.5);
      lb.position.set(x, -6, 0);
      root.add(lb);
      v3.onFrame((dt) => { g.rotation.y += dt * (i ? -0.12 : 0.12); });
    });
    v3.setDistance(23);
    showBanner('🆚 ELEMENT KARŞILAŞTIRMA', `${ELEMENTS[z1 - 1].name} (Z=${z1}) ↔ ${ELEMENTS[z2 - 1].name} (Z=${z2}) — orbital ölçekleri aynı oranda küçültülmüştür.`, {
      prevLabel: '📋 Tabloyu Aç', nextLabel: '↻ Elementleri Değiştir',
      onPrev: () => openCompareModal(), onNext: () => openCompareModal(), onClose: () => { Q.compare = null; hideBanner(); API().refresh(); }
    });
  }

  /* ------------------------------------------------------------------------
     NUCLEUS EXPLORER: Gauss nükleonlar · Yukawa π ağı · kuark & gluon
     ------------------------------------------------------------------------ */
  function nucBand(v) { return v < 330 ? 1 : (v < 660 ? 2 : 3); }
  const BAND_NAMES = {
    0: 'ATOM (10⁻¹⁰ m)',
    1: 'MAKRO · ÇEKİRDEK (10⁻¹⁵ m)',
    2: 'REZİDÜEL KUVVET · π DEĞİŞİMİ',
    3: 'KUARK · GLUON (10⁻¹⁸ m)'
  };

  function buildNucleusExplorer(v3, st) {
    const root = v3.root, Z = st.Z, N = st.N, A = Math.max(1, Z + N), anti = st.antimatter;
    const rand = mulberry(Z * 97 + N * 13 + 5);
    const SP = 1.25, SIG = 0.46;
    const R = SP * 0.62 * Math.cbrt(A) + 0.2;
    const cen = [];
    for (let i = 0; i < A; i++) {
      const y = A === 1 ? 0 : 1 - (2 * (i + 0.5)) / A;
      const rr = A === 1 ? 0 : R * Math.cbrt((i + 0.5) / A);
      const th = i * 2.399963, s = Math.sqrt(Math.max(0, 1 - y * y));
      cen.push(V(Math.cos(th) * s * rr, y * rr, Math.sin(th) * s * rr));
    }
    const isP = new Array(A).fill(false);
    for (let i = 0; i < Z && i < A; i++) isP[i] = true;
    for (let i = A - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = isP[i]; isP[i] = isP[j]; isP[j] = t; }

    // Nükleon Gauss dalga paketi taneleri
    const G = 30;
    const gpos = new Float32Array(A * G * 3), gcol = new Float32Array(A * G * 3);
    const gsize = new Float32Array(A * G), gph = new Float32Array(A * G);
    const pc = new THREE.Color(anti ? '#36e0ff' : '#ff3322'), nc = new THREE.Color(anti ? '#ff7ad9' : '#3366ff');
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (let i = 0; i < A; i++) {
      const c = isP[i] ? pc : nc;
      for (let k = 0; k < G; k++) {
        const q = (i * G + k);
        gpos[q * 3] = cen[i].x + gauss() * SIG; gpos[q * 3 + 1] = cen[i].y + gauss() * SIG; gpos[q * 3 + 2] = cen[i].z + gauss() * SIG;
        gcol[q * 3] = c.r; gcol[q * 3 + 1] = c.g; gcol[q * 3 + 2] = c.b;
        gsize[q] = 0.16 + rand() * 0.16; gph[q] = rand();
      }
    }
    const grains = makePoints(gpos, gcol, gsize, gph, { mode: 0, alpha: 1 });
    root.add(grains);

    // Komşu çiftler (rezidüel kuvvet bağları)
    const bonds = [];
    const nb = new Array(A).fill(0);
    for (let i = 0; i < A && bonds.length < 420; i++) {
      for (let j = i + 1; j < A && bonds.length < 420; j++) {
        if (nb[i] >= 3 || nb[j] >= 3) continue;
        if (cen[i].distanceTo(cen[j]) < SP * 1.32) { bonds.push([i, j]); nb[i]++; nb[j]++; }
      }
    }
    // Yukawa pionları
    const NP = Math.max(1, bonds.length) * 2;
    const ppos = new Float32Array(NP * 3), pcol = new Float32Array(NP * 3), psize = new Float32Array(NP), pph = new Float32Array(NP);
    const pionC = new THREE.Color('#39ff8f');
    for (let i = 0; i < NP; i++) { pcol[i * 3] = pionC.r; pcol[i * 3 + 1] = pionC.g; pcol[i * 3 + 2] = pionC.b; psize[i] = 0.2; pph[i] = rand(); }
    const pions = makePoints(ppos, pcol, psize, pph, { mode: 0, alpha: 1 });
    root.add(pions);

    // Kuark katmanı (en çok 90 nükleon)
    const QN = Math.min(A, 90);
    const qIdx = [];
    for (let i = 0; i < QN; i++) qIdx.push(Math.floor((i * A) / QN));
    const qMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 }), QN * 3);
    const uC = new THREE.Color('#ffd23f'), dC = new THREE.Color('#ff3fb0');
    qIdx.forEach((ni, qi) => {
      const proton = isP[ni];
      const cols = proton ? [uC, uC, dC] : [uC, dC, dC];
      cols.forEach((c, k) => qMesh.setColorAt(qi * 3 + k, c));
    });
    root.add(qMesh);
    const SEG = 10;
    const gl = new Float32Array(QN * 3 * SEG * 2 * 3);
    const glGeo = new THREE.BufferGeometry();
    glGeo.setAttribute('position', new THREE.BufferAttribute(gl, 3));
    const glMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.9 });
    const glLines = new THREE.LineSegments(glGeo, glMat);
    glLines.frustumCulled = false;
    root.add(glLines);

    // Kahraman çift (Band 2)
    let hero = 0, heroN = 1;
    let best = 1e9;
    cen.forEach((c, i) => { const d = c.length(); if (d < best) { best = d; hero = i; } });
    best = 1e9;
    cen.forEach((c, i) => { if (i === hero) return; const d = c.distanceTo(cen[hero]); if (d < best) { best = d; heroN = i; } });
    const heroGrp = new THREE.Group();
    const piBall = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0x39ff8f }));
    heroGrp.add(piBall);
    const lbA = makeSpriteLabel(isP[hero] ? 'p⁺' : 'n⁰', '#ffffff', 1.1);
    const lbB = A > 1 ? makeSpriteLabel(isP[heroN] ? 'p⁺' : 'n⁰', '#ffffff', 1.1) : null;
    const lbPi = makeSpriteLabel('π', '#39ff8f', 1.0);
    heroGrp.add(lbA); if (lbB) heroGrp.add(lbB); heroGrp.add(lbPi);
    root.add(heroGrp);

    const dFar = R * 3.4 + 5.5, dPair = 4.8, dQuark = A <= 12 ? 4.4 : Math.max(5.8, R * 1.55 + 3.5);
    const distFor = (v) => {
      if (v <= 400) return dFar + (dPair - dFar) * smooth(v / 400);
      if (v <= 800) return dPair + (dQuark - dPair) * smooth((v - 400) / 400);
      return dQuark * (1 - 0.1 * ((v - 800) / 200));
    };
    Q.nucActive = true;
    const tmpM = new THREE.Matrix4(), tmpP = V(0, 0, 0);
    let time = 0;

    const apply = (v) => {
      const band = nucBand(v);
      if ($('qaZoomBandBadge')) $('qaZoomBandBadge').textContent = BAND_NAMES[band];
      if ($('qaDeepZoomVal')) $('qaDeepZoomVal').textContent = `%${Math.round(v / 10)}`;
      v3.setDistance(distFor(v));
    };
    Q.nucUpdate = apply;
    apply(Q.zoomV || 0);

    v3.onFrame((dt) => {
      time += dt;
      const v = Q.zoomV;
      const quarkA = smooth((v - 540) / 220);
      const heroA = smooth((v - 250) / 120) * (1 - smooth((v - 700) / 120));
      grains.material.uniforms.uAlpha.value = 1 - 0.8 * quarkA;
      // π ağı
      pions.visible = Q.showPions && v < 780;
      pions.material.uniforms.uAlpha.value = 1 - smooth((v - 600) / 160);
      if (pions.visible && bonds.length) {
        const pa = pions.geometry.attributes.position.array;
        for (let b = 0; b < bonds.length; b++) {
          for (let s = 0; s < 2; s++) {
            const idx = b * 2 + s;
            const ph = (time * (0.8 + 0.2 * s) + pph[idx]) % 1;
            const tt = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
            const a = cen[bonds[b][0]], c = cen[bonds[b][1]];
            const lat = Math.sin(tt * Math.PI) * 0.13;
            pa[idx * 3] = a.x + (c.x - a.x) * tt + Math.sin(time * 7 + idx) * lat;
            pa[idx * 3 + 1] = a.y + (c.y - a.y) * tt + Math.cos(time * 6 + idx) * lat;
            pa[idx * 3 + 2] = a.z + (c.z - a.z) * tt;
          }
        }
        pions.geometry.attributes.position.needsUpdate = true;
      }
      // Kahraman çift π değişimi (quadratic Bezier)
      heroGrp.visible = Q.showPions && heroA > 0.02 && A > 1;
      if (heroGrp.visible) {
        const a = cen[hero], c = cen[heroN];
        lbA.position.set(a.x, a.y + 0.95, a.z); lbB.position.set(c.x, c.y + 0.95, c.z);
        const t2 = (time * 0.55) % 1, tt = t2 < 0.5 ? t2 * 2 : (1 - t2) * 2;
        const mid = V((a.x + c.x) / 2, (a.y + c.y) / 2 + 0.9, (a.z + c.z) / 2);
        const bx = (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * mid.x + tt * tt * c.x;
        const by = (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * mid.y + tt * tt * c.y;
        const bz = (1 - tt) * (1 - tt) * a.z + 2 * (1 - tt) * tt * mid.z + tt * tt * c.z;
        piBall.position.set(bx, by, bz);
        lbPi.position.set(bx, by + 0.5, bz);
        piBall.material.opacity = 1; piBall.scale.setScalar(0.9 + 0.2 * Math.sin(time * 10));
      }
      // Kuark & gluon
      const showQ = quarkA > 0.02;
      qMesh.visible = showQ && Q.showGluons;
      glLines.visible = showQ && Q.showGluons;
      qMesh.material.opacity = quarkA; glMat.opacity = 0.9 * quarkA;
      if (showQ && Q.showGluons) {
        const rho = 0.34;
        let ptr = 0;
        for (let qi = 0; qi < QN; qi++) {
          const c = cen[qIdx[qi]];
          const ph0 = qi * 1.37;
          const qp = [];
          for (let k = 0; k < 3; k++) {
            const ang = time * 1.8 + ph0 + (k * 2 * Math.PI) / 3;
            const p = V(c.x + Math.cos(ang) * rho, c.y + Math.sin(ang) * rho * 0.8, c.z + Math.sin(ang + ph0) * rho * 0.5);
            qp.push(p);
            tmpM.makeTranslation(p.x, p.y, p.z);
            qMesh.setMatrixAt(qi * 3 + k, tmpM);
          }
          for (let e = 0; e < 3; e++) {
            const a = qp[e], b = qp[(e + 1) % 3];
            for (let s = 0; s < SEG; s++) {
              for (let end = 0; end < 2; end++) {
                const u = (s + end) / SEG;
                const rip = Math.sin(u * 14 - time * 6) * 0.045 * Math.sin(u * Math.PI);
                gl[ptr++] = a.x + (b.x - a.x) * u + rip;
                gl[ptr++] = a.y + (b.y - a.y) * u + rip;
                gl[ptr++] = a.z + (b.z - a.z) * u - rip;
              }
            }
          }
        }
        qMesh.instanceMatrix.needsUpdate = true;
        glGeo.attributes.position.needsUpdate = true;
      }
      tmpP.set(0, 0, 0);
    });
    setNucHud(st);
    toast('🔬 Nucleus Explorer: kaydırıcıyı sağa çekerek kuark-gluon ölçeğine inin');
  }

  function setNucHud(st) {
    const el = ELEMENTS[st.Z - 1];
    if ($('hudOrbital')) $('hudOrbital').textContent = `${el.symbol}-${st.Z + st.N} çekirdeği`;
    if ($('qaZoomBandBadge')) $('qaZoomBandBadge').textContent = BAND_NAMES[nucBand(Q.zoomV || 1)];
  }

  /* ------------------------------------------------------------------------
     3B MOLEKÜLLER: VSEPR üreticisi + kütüphane
     ------------------------------------------------------------------------ */
  function valenceE(Z) {
    const c = ELEMENTS[Z - 1].config;
    let maxN = 0;
    for (const k in c) if (c[k] > 0) maxN = Math.max(maxN, +k[0]);
    let s = 0;
    for (const k in c) if (c[k] > 0 && +k[0] === maxN) s += c[k];
    return s;
  }
  const CPK = {
    1: '#ffffff', 3: '#cc80ff', 4: '#c2ff00', 5: '#ffb5b5', 6: '#a0a0a0', 7: '#3050f8', 8: '#ff2a2a', 9: '#90e050',
    11: '#ab5cf2', 12: '#8aff00', 14: '#f0c8a0', 15: '#ff8000', 16: '#ffff30', 17: '#1ff01f', 19: '#8f40d4',
    20: '#3dff00', 35: '#a62929', 53: '#a000a0', 54: '#429eb0'
  };
  const atomColor = (Z) => CPK[Z] || (CATS[ELEMENTS[Z - 1].cat] ? CATS[ELEMENTS[Z - 1].cat].color : '#94a3b8');
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const subscript = (n) => String(n).split('').map((d) => SUB[d] || d).join('');

  function bondLen(Za, Zb, order) {
    const base = covR(Za) + covR(Zb);
    const f = order >= 3 ? 0.80 : (order >= 2 ? 0.87 : (order > 1 ? 0.92 : 1));
    return base * f;
  }

  const TETRA = [V(1, 1, 1), V(1, -1, -1), V(-1, 1, -1), V(-1, -1, 1)].map((v) => v.normalize());
  function bentDirs(angle) {
    const a = (angle * D2R) / 2;
    return [V(Math.sin(a), -Math.cos(a), 0), V(-Math.sin(a), -Math.cos(a), 0)];
  }
  function ligandDirs(sn, lp, angle) {
    const n = sn - lp;
    if (sn <= 2) return [V(1, 0, 0), V(-1, 0, 0)].slice(0, n);
    if (sn === 3) {
      if (lp === 0) return [0, 120, 240].map((a) => V(Math.cos(a * D2R), Math.sin(a * D2R), 0));
      return bentDirs(angle || 118).slice(0, n);
    }
    if (sn === 4) {
      if (lp === 0) return TETRA.map((v) => v.clone());
      if (lp === 1) {
        const ang = angle || 107;
        const beta = Math.acos(Math.sqrt(Math.max(0, (Math.cos(ang * D2R) + 0.5) / 1.5)));
        return [0, 120, 240].map((a) => V(Math.sin(beta) * Math.cos(a * D2R), -Math.cos(beta), Math.sin(beta) * Math.sin(a * D2R)));
      }
      return bentDirs(angle || 104.5).slice(0, n);
    }
    if (sn === 5) {
      const ax = [V(0, 1, 0), V(0, -1, 0)];
      const eq = [0, 120, 240].map((a) => V(Math.cos(a * D2R), 0, Math.sin(a * D2R)));
      if (lp === 0) return ax.concat(eq);
      if (lp === 1) return ax.concat(eq.slice(0, 2));
      if (lp === 2) return ax.concat(eq.slice(0, 1));
      return ax;
    }
    const oct = [V(1, 0, 0), V(-1, 0, 0), V(0, 0, 1), V(0, 0, -1), V(0, 1, 0), V(0, -1, 0)];
    if (lp === 0) return oct;
    if (lp === 1) return oct.slice(0, 5);
    if (lp === 2) return oct.slice(0, 4);
    return oct.slice(0, n);
  }
  function perpBasis(base) {
    const ref = Math.abs(base.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0);
    const p1 = base.clone().cross(ref).normalize();
    const p2 = base.clone().cross(p1).normalize();
    return [p1, p2];
  }
  function lpDirsAround(base, k, spread) {
    if (k <= 0) return [];
    if (k === 1) return [base.clone()];
    const [p1, p2] = perpBasis(base);
    const out = [];
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + 0.6;
      out.push(base.clone().multiplyScalar(Math.cos(spread)).add(p1.clone().multiplyScalar(Math.sin(spread) * Math.cos(a))).add(p2.clone().multiplyScalar(Math.sin(spread) * Math.sin(a))).normalize());
    }
    return out;
  }
  function centralLpDirs(lp, dirs) {
    if (lp <= 0) return [];
    const S = dirs.reduce((s, d) => s.add(d), V(0, 0, 0));
    if (S.length() > 0.35) {
      return lpDirsAround(S.negate().normalize(), lp, lp === 1 ? 0 : 0.95);
    }
    // simetrik düzen: ligandlara dik eksen(ler)
    let axis = V(0, 1, 0);
    if (dirs.length >= 2) {
      const c = dirs[0].clone().cross(dirs[1]);
      if (c.length() > 0.2) axis = c.normalize();
      else axis = perpBasis(dirs[0])[0];
    }
    if (lp === 2) return [axis.clone(), axis.clone().negate()];
    return lpDirsAround(axis, lp, 1.2);
  }

  const GEOM_NAMES = {
    '2_0': 'Doğrusal', '3_0': 'Düzlemsel üçgen', '3_1': 'Bükülmüş (açısal)', '4_0': 'Düzgün dörtyüzlü',
    '4_1': 'Üçgen piramit', '4_2': 'Bükülmüş (açısal)', '5_0': 'Üçgen çift piramit', '5_1': 'Tahterevalli (seesaw)',
    '5_2': 'T-şekilli', '5_3': 'Doğrusal', '6_0': 'Düzgün sekizyüzlü', '6_1': 'Kare piramit', '6_2': 'Kare düzlem'
  };
  const HYBRID = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };

  function finishLigandLP(atoms, bonds, centerIdx) {
    atoms.forEach((a, i) => {
      if (i === centerIdx || a.Z === 1) return;
      const b = bonds.filter((bd) => bd.a === i || bd.b === i);
      if (b.length !== 1) return;
      const ord = b[0].order || 1;
      const lpT = Math.floor((valenceE(a.Z) - ord) / 2);
      if (lpT <= 0 || ord === 0) return;
      const other = atoms[b[0].a === i ? b[0].b : b[0].a];
      const base = a.p.clone().sub(other.p).normalize();
      a.lp = lpDirsAround(base, Math.min(lpT, 3), 0.95);
    });
  }

  function buildCentral(Zc, ligs, o = {}) {
    const vc = valenceE(Zc);
    const sumOrd = ligs.reduce((s, l) => s + l.order, 0);
    const lp = o.lp != null ? o.lp : Math.max(0, Math.floor((vc - sumOrd) / 2));
    const sn = ligs.length + lp;
    const dirs = ligandDirs(Math.max(2, sn), lp, o.angle);
    const atoms = [{ Z: Zc, p: V(0, 0, 0), charge: 0, lp: [] }];
    const bonds = [];
    ligs.forEach((l, i) => {
      const d = (dirs[i] || V(Math.cos(i * 2.4), Math.sin(i * 2.4), 0.3).normalize()).clone();
      atoms.push({ Z: l.Z, p: d.multiplyScalar(bondLen(Zc, l.Z, l.order)), charge: 0, lp: [] });
      bonds.push({ a: 0, b: i + 1, order: l.order });
    });
    atoms[0].lp = centralLpDirs(lp, dirs.slice(0, ligs.length));
    finishLigandLP(atoms, bonds, 0);
    return {
      atoms, bonds, sn, lp, centerIdx: 0,
      geometry: GEOM_NAMES[`${Math.max(2, sn)}_${lp}`] || 'Genel', hybrid: HYBRID[Math.max(2, sn)] || 'sp³',
      angle: o.angle || null
    };
  }

  function buildDiatomic(Za, Zb, order) {
    const L = bondLen(Za, Zb, order);
    const atoms = [{ Z: Za, p: V(-L / 2, 0, 0), charge: 0, lp: [] }, { Z: Zb, p: V(L / 2, 0, 0), charge: 0, lp: [] }];
    const bonds = [{ a: 0, b: 1, order }];
    finishLigandLP(atoms, bonds, -1);
    return { atoms, bonds, sn: 2, lp: 0, centerIdx: 0, geometry: 'Doğrusal (iki atomlu)', hybrid: 'sp' };
  }

  function buildIonic(cationZ, cq, anionZs, aq) {
    const atoms = [{ Z: cationZ, p: V(0, 0, 0), charge: cq, lp: [] }];
    const bonds = [];
    const dirs = ligandDirs(Math.max(2, anionZs.length), 0, null);
    const L = (covR(cationZ) + covR(anionZs[0])) * 0.88;
    anionZs.forEach((Z, i) => {
      const d = (dirs[i] || V(1, 0, 0)).clone().multiplyScalar(L);
      atoms.push({ Z, p: d, charge: aq, lp: [] });
      bonds.push({ a: 0, b: i + 1, order: 0 });
    });
    return {
      atoms, bonds, sn: anionZs.length + 0, lp: 0, centerIdx: 0, ionic: true,
      geometry: anionZs.length === 1 ? 'İyonik çift (gaz fazı)' : 'İyonik (' + (GEOM_NAMES[`${Math.max(2, anionZs.length)}_0`] || '') + ')',
      hybrid: 'İyonik bağ'
    };
  }

  function H(Z) { return ELZ[Z] || 1; }
  const S = ELZ;
  function ligs(Z, n, order) { return Array.from({ length: n }, () => ({ Z, order })); }

  function buildMultiCenter(kind) {
    const atoms = [], bonds = [];
    const add = (Z, x, y, z) => { atoms.push({ Z, p: V(x, y, z), charge: 0, lp: [] }); return atoms.length - 1; };
    const bd = (a, b, order) => bonds.push({ a, b, order });
    let geometry = '', hybrid = '';
    if (kind === 'c2h2') {
      const c1 = add(6, -0.6, 0, 0), c2 = add(6, 0.6, 0, 0), h1 = add(1, -1.66, 0, 0), h2 = add(1, 1.66, 0, 0);
      bd(c1, c2, 3); bd(c1, h1, 1); bd(c2, h2, 1); geometry = 'Doğrusal (her C için)'; hybrid = 'sp';
    } else if (kind === 'c2h4') {
      const c1 = add(6, -0.67, 0, 0), c2 = add(6, 0.67, 0, 0);
      [[-1.24, 0.93], [-1.24, -0.93]].forEach(([x, y]) => bd(c1, add(1, x, y, 0), 1));
      [[1.24, 0.93], [1.24, -0.93]].forEach(([x, y]) => bd(c2, add(1, x, y, 0), 1));
      bd(c1, c2, 2); geometry = 'Düzlemsel üçgen (her C için)'; hybrid = 'sp²';
    } else if (kind === 'c2h6') {
      const c1 = add(6, -0.77, 0, 0), c2 = add(6, 0.77, 0, 0);
      for (let k = 0; k < 3; k++) {
        const a = k * 2.0944, b = a + Math.PI / 3;
        bd(c1, add(1, -0.77 - 0.36, Math.cos(a) * 1.03, Math.sin(a) * 1.03), 1);
        bd(c2, add(1, 0.77 + 0.36, Math.cos(b) * 1.03, Math.sin(b) * 1.03), 1);
      }
      bd(c1, c2, 1); geometry = 'Düzgün dörtyüzlü (her C için)'; hybrid = 'sp³';
    } else if (kind === 'c6h6') {
      const cs = [];
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        cs.push(add(6, Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0));
      }
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        bd(cs[k], add(1, Math.cos(a) * 2.48, Math.sin(a) * 2.48, 0), 1);
        bd(cs[k], cs[(k + 1) % 6], k % 2 === 0 ? 2 : 1);
      }
      geometry = 'Düzlemsel altıgen (aromatik)'; hybrid = 'sp²';
    } else if (kind === 'ch3oh') {
      const c = add(6, 0, 0, 0), o = add(8, 1.43, 0, 0), ho = add(1, 1.743, 0.908, 0);
      bd(c, o, 1); bd(o, ho, 1);
      bd(c, add(1, -0.36, 1.03, 0), 1); bd(c, add(1, -0.36, -0.515, 0.892), 1); bd(c, add(1, -0.36, -0.515, -0.892), 1);
      geometry = 'Dörtyüzlü (C) / Bükülmüş (O)'; hybrid = 'sp³';
      atoms[o].lp = lpDirsAround(V(0.3, -0.8, 0).normalize(), 2, 0.8);
    }
    return { atoms, bonds, sn: 4, lp: 0, centerIdx: -1, geometry, hybrid, multi: true };
  }

  const LIB = [];
  function reg(key, formula, name, en, data, extra) {
    LIB.push(Object.assign({ key, formula, name, en, data }, extra || {}));
  }
  reg('h2', 'H₂', 'Hidrojen', 'hydrogen', () => buildDiatomic(1, 1, 1));
  reg('n2', 'N₂', 'Azot', 'nitrogen', () => buildDiatomic(7, 7, 3));
  reg('o2', 'O₂', 'Oksijen', 'oxygen', () => buildDiatomic(8, 8, 2));
  reg('f2', 'F₂', 'Flor', 'fluorine', () => buildDiatomic(9, 9, 1));
  reg('cl2', 'Cl₂', 'Klor', 'chlorine', () => buildDiatomic(17, 17, 1));
  reg('hf', 'HF', 'Hidrojen florür', 'hydrogen fluoride', () => buildDiatomic(1, 9, 1));
  reg('hcl', 'HCl', 'Hidrojen klorür', 'hydrogen chloride', () => buildDiatomic(1, 17, 1));
  reg('co', 'CO', 'Karbon monoksit', 'carbon monoxide', () => buildDiatomic(6, 8, 3));
  reg('no', 'NO', 'Nitrik oksit', 'nitric oxide', () => buildDiatomic(7, 8, 2.5));
  reg('h2o', 'H₂O', 'Su', 'water', () => buildCentral(8, ligs(1, 2, 1), { angle: 104.5 }));
  reg('h2s', 'H₂S', 'Hidrojen sülfür', 'hydrogen sulfide', () => buildCentral(16, ligs(1, 2, 1), { angle: 92.1 }));
  reg('co2', 'CO₂', 'Karbondioksit', 'carbon dioxide', () => buildCentral(6, ligs(8, 2, 2)));
  reg('so2', 'SO₂', 'Kükürt dioksit', 'sulfur dioxide', () => buildCentral(16, ligs(8, 2, 2), { angle: 119 }));
  reg('o3', 'O₃', 'Ozon', 'ozone', () => buildCentral(8, ligs(8, 2, 1.5), { angle: 116.8, lp: 1 }));
  reg('hcn', 'HCN', 'Hidrojen siyanür', 'hydrogen cyanide', () => buildCentral(6, [{ Z: 1, order: 1 }, { Z: 7, order: 3 }]));
  reg('nh3', 'NH₃', 'Amonyak', 'ammonia', () => buildCentral(7, ligs(1, 3, 1), { angle: 107 }));
  reg('ph3', 'PH₃', 'Fosfin', 'phosphine', () => buildCentral(15, ligs(1, 3, 1), { angle: 93.5 }));
  reg('ch4', 'CH₄', 'Metan', 'methane', () => buildCentral(6, ligs(1, 4, 1)));
  reg('sih4', 'SiH₄', 'Silan', 'silane', () => buildCentral(14, ligs(1, 4, 1)));
  reg('ccl4', 'CCl₄', 'Karbon tetraklorür', 'carbon tetrachloride', () => buildCentral(6, ligs(17, 4, 1)));
  reg('bf3', 'BF₃', 'Bor triflorür', 'boron trifluoride', () => buildCentral(5, ligs(9, 3, 1)));
  reg('bcl3', 'BCl₃', 'Bor triklorür', 'boron trichloride', () => buildCentral(5, ligs(17, 3, 1)));
  reg('so3', 'SO₃', 'Kükürt trioksit', 'sulfur trioxide', () => buildCentral(16, ligs(8, 3, 2)));
  reg('pcl5', 'PCl₅', 'Fosfor pentaklorür', 'phosphorus pentachloride', () => buildCentral(15, ligs(17, 5, 1)));
  reg('sf4', 'SF₄', 'Kükürt tetraflorür', 'sulfur tetrafluoride', () => buildCentral(16, ligs(9, 4, 1)));
  reg('clf3', 'ClF₃', 'Klor triflorür', 'chlorine trifluoride', () => buildCentral(17, ligs(9, 3, 1)));
  reg('sf6', 'SF₆', 'Kükürt heksaflorür', 'sulfur hexafluoride', () => buildCentral(16, ligs(9, 6, 1)));
  reg('xef4', 'XeF₄', 'Ksenon tetraflorür', 'xenon tetrafluoride', () => buildCentral(54, ligs(9, 4, 1)));
  reg('c2h2', 'C₂H₂', 'Etin (Asetilen)', 'acetylene', () => buildMultiCenter('c2h2'));
  reg('c2h4', 'C₂H₄', 'Eten (Etilen)', 'ethylene', () => buildMultiCenter('c2h4'));
  reg('c2h6', 'C₂H₆', 'Etan', 'ethane', () => buildMultiCenter('c2h6'));
  reg('c6h6', 'C₆H₆', 'Benzen', 'benzene', () => buildMultiCenter('c6h6'));
  reg('ch3oh', 'CH₃OH', 'Metanol', 'methanol', () => buildMultiCenter('ch3oh'));
  reg('nacl', 'NaCl', 'Sodyum klorür (iyonik)', 'sodium chloride', () => buildIonic(11, 1, [17], -1));
  reg('lif', 'LiF', 'Lityum florür (iyonik)', 'lithium fluoride', () => buildIonic(3, 1, [9], -1));
  reg('kbr', 'KBr', 'Potasyum bromür (iyonik)', 'potassium bromide', () => buildIonic(19, 1, [35], -1));
  reg('mgo', 'MgO', 'Magnezyum oksit (iyonik)', 'magnesium oxide', () => buildIonic(12, 2, [8], -2));
  reg('mgcl2', 'MgCl₂', 'Magnezyum klorür (iyonik)', 'magnesium chloride', () => buildIonic(12, 2, [17, 17], -1));
  reg('cacl2', 'CaCl₂', 'Kalsiyum klorür (iyonik)', 'calcium chloride', () => buildIonic(20, 2, [17, 17], -1));

  function libMol(key) {
    const e = LIB.find((x) => x.key === key);
    if (!e) return null;
    const d = e.data();
    return Object.assign(d, { key: e.key, formula: e.formula, name: e.name });
  }

  /* --- Formül ayrıştırıcı ("İnşa Et") --- */
  function parseFormula(str) {
    const s = str.replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080)).replace(/\s+/g, '');
    const re = /([A-Z][a-z]?)(\d*)/g;
    const counts = [];
    let m, cons = 0;
    while ((m = re.exec(s))) {
      if (m.index !== cons) return null;
      cons += m[0].length;
      const Z = ELZ[m[1]];
      if (!Z) return null;
      const c = m[2] ? +m[2] : 1;
      const ex = counts.find((x) => x.Z === Z);
      if (ex) ex.c += c; else counts.push({ Z, c });
    }
    if (cons !== s.length || !counts.length) return null;
    return counts;
  }
  const METALS12 = new Set([3, 4, 11, 12, 19, 20, 37, 38, 55, 56]);
  const HALOGENS = new Set([9, 17, 35, 53]);
  function formulaOf(counts) {
    return counts.map((x) => ELEMENTS[x.Z - 1].symbol + (x.c > 1 ? subscript(x.c) : '')).join('');
  }
  function genericBuild(counts) {
    if (counts.length === 1) {
      const { Z, c } = counts[0];
      if (c === 1) return { element: Z };
      if (c === 2) {
        const v = valenceE(Z);
        const order = (Z === 1 || HALOGENS.has(Z)) ? 1 : (v === 6 ? 2 : (v === 5 ? 3 : 1));
        const m = buildDiatomic(Z, Z, order);
        return { mol: Object.assign(m, { key: 'build', formula: formulaOf(counts), name: 'İnşa edilen molekül' }) };
      }
      return null;
    }
    const total = counts.reduce((s, x) => s + x.c, 0);
    if (total > 9) return null;
    const metal = counts.find((x) => METALS12.has(x.Z));
    const nonm = counts.filter((x) => !METALS12.has(x.Z));
    if (metal && nonm.length === 1) {
      const an = nonm[0];
      const cq = metal.Z === 3 || metal.Z === 11 || metal.Z === 19 || metal.Z === 37 || metal.Z === 55 ? 1 : 2;
      const aq = -Math.round((metal.c * cq) / an.c);
      if (metal.c === 1) {
        const m = buildIonic(metal.Z, cq, Array(an.c).fill(an.Z), aq);
        return { mol: Object.assign(m, { key: 'build', formula: formulaOf(counts), name: 'İyonik bileşik' }) };
      }
      if (an.c === 1) {
        const m = buildIonic(an.Z, aq, Array(metal.c).fill(metal.Z), cq);
        return { mol: Object.assign(m, { key: 'build', formula: formulaOf(counts), name: 'İyonik bileşik' }) };
      }
      return null;
    }
    const cands = counts.filter((x) => x.c === 1 && x.Z !== 1);
    if (!cands.length) return null;
    cands.sort((a, b) => (ELEMENTS[a.Z - 1].en || 2) - (ELEMENTS[b.Z - 1].en || 2));
    const center = cands[0];
    const vc = valenceE(center.Z);
    const ligList = [];
    counts.forEach((x) => {
      if (x === center) return;
      let order = 1;
      if ((x.Z === 8 || x.Z === 16 || x.Z === 34) && vc >= 4 && center.Z !== 1) order = 2;
      if (x.Z === 7 && center.Z === 6 && x.c === 1) order = 3;
      for (let i = 0; i < x.c; i++) ligList.push({ Z: x.Z, order });
    });
    if (ligList.length < 1 || ligList.length > 6) return null;
    if (ligList.length === 1) {
      return { mol: Object.assign(buildDiatomic(center.Z, ligList[0].Z, ligList[0].order), { key: 'build', formula: formulaOf(counts), name: 'İnşa edilen molekül' }) };
    }
    const m = buildCentral(center.Z, ligList, {});
    return { mol: Object.assign(m, { key: 'build', formula: formulaOf(counts), name: 'İnşa edilen molekül (VSEPR)' }) };
  }

  function normalizeQuery(s) { return s.toLowerCase().replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080)).replace(/\s+/g, ''); }

  function resolveBuild(input) {
    const raw = input.trim();
    if (!raw) return { error: 'Bir formül veya element yazın.' };
    const q = normalizeQuery(raw);
    // 1) kütüphane
    const lib = LIB.find((e) => e.key === q || normalizeQuery(e.formula) === q || e.en.replace(/\s+/g, '') === q || normalizeQuery(e.name).startsWith(q));
    if (lib) return { mol: libMol(lib.key) };
    // 2) element
    if (/^\d+$/.test(q) && +q >= 1 && +q <= 118) return { element: +q };
    const el = ELEMENTS.find((e) => e.symbol.toLowerCase() === q || e.name.toLowerCase() === q || e.nameEn.toLowerCase() === q);
    if (el) return { element: el.Z };
    // 3) formül
    const counts = parseFormula(raw);
    if (counts) {
      const res = genericBuild(counts);
      if (res) return res;
      return { error: 'Bu formül için VSEPR geometrisi üretilemedi (çok merkezli büyük yapı).' };
    }
    return { error: 'Tanınmayan formül. Büyük/küçük harfe dikkat edin (ör. H2O, NaCl, SF6, Au).' };
  }

  /* --- 3B molekül oluşturucu --- */
  function placeCylinder(mesh, a, b) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(0.0001, len), 1);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
  }
  function gaussCloud(center, sig, count, color, rand, stretchDir, stretch) {
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count), ph = new Float32Array(count);
    const c = new THREE.Color(color);
    const g = () => { let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (let i = 0; i < count; i++) {
      let x = g() * sig, y = g() * sig, z = g() * sig;
      if (stretchDir) {
        const p = V(x, y, z);
        const along = stretchDir.clone().multiplyScalar(p.dot(stretchDir) * (stretch - 1));
        p.add(along);
        x = p.x; y = p.y; z = p.z;
      }
      pos[i * 3] = center.x + x; pos[i * 3 + 1] = center.y + y; pos[i * 3 + 2] = center.z + z;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = 0.1 + rand() * 0.1; ph[i] = rand();
    }
    return { pos, col, size, ph };
  }

  function buildMoleculeGroup(mol, SC, rand) {
    const g = new THREE.Group();
    const merged = { pos: [], col: [], size: [], ph: [] };
    const addCloud = (c) => {
      for (let i = 0; i < c.pos.length; i++) merged.pos.push(c.pos[i]);
      for (let i = 0; i < c.col.length; i++) merged.col.push(c.col[i]);
      for (let i = 0; i < c.size.length; i++) merged.size.push(c.size[i]);
      for (let i = 0; i < c.ph.length; i++) merged.ph.push(c.ph[i]);
    };
    const P = mol.atoms.map((a) => a.p.clone().multiplyScalar(SC));
    // atomlar
    mol.atoms.forEach((a, i) => {
      const rad = clamp(covR(a.Z) * 0.4 * SC / 2.4 * 1.0, 0.24, 0.74);
      const sph = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 24, 18),
        new THREE.MeshStandardMaterial({ color: atomColor(a.Z), roughness: 0.35, metalness: 0.1, emissive: atomColor(a.Z), emissiveIntensity: 0.18 })
      );
      sph.position.copy(P[i]);
      g.add(sph);
      addCloud(gaussCloud(P[i], rad * 1.15, 130, atomColor(a.Z), rand));
      const lb = makeSpriteLabel(ELEMENTS[a.Z - 1].symbol + (a.charge ? (a.charge > 0 ? '⁺' : '⁻') : ''), '#ffffff', 0.62);
      lb.position.copy(P[i]).add(V(0, rad + 0.5, 0));
      g.add(lb);
      (a.lp || []).forEach((d) => {
        const cc = P[i].clone().add(d.clone().multiplyScalar(rad + 0.55));
        addCloud(gaussCloud(cc, 0.2, 90, '#ffd23f', rand, d.clone(), 2.0));
      });
    });
    // bağlar
    mol.bonds.forEach((b) => {
      const A = P[b.a], B = P[b.b];
      const d = B.clone().sub(A).normalize();
      if (b.order === 0) {
        const geo = new THREE.BufferGeometry().setFromPoints([A, B]);
        const ln = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 0.22, gapSize: 0.14 }));
        ln.computeLineDistances();
        g.add(ln);
        addCloud(gaussCloud(A.clone().lerp(B, 0.5), 0.2, 90, '#fbbf24', rand, d.clone(), 3.0));
        return;
      }
      const nOrd = Math.max(1, Math.round(b.order));
      let n1 = d.clone().cross(V(0, 0, 1));
      if (n1.length() < 0.2) n1 = d.clone().cross(V(0, 1, 0));
      n1.normalize();
      const n2 = d.clone().cross(n1).normalize();
      const offs = nOrd === 1 ? [0] : (nOrd === 2 ? [-0.14, 0.14] : [-0.22, 0, 0.22]);
      offs.forEach((o) => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 8), new THREE.MeshStandardMaterial({ color: 0xc9d4e3, roughness: 0.4 }));
        const off = n1.clone().multiplyScalar(o);
        placeCylinder(cyl, A.clone().add(off), B.clone().add(off));
        g.add(cyl);
      });
      const mid = A.clone().lerp(B, 0.5);
      addCloud(gaussCloud(mid, 0.21, 160, '#3df2ff', rand, d.clone(), 2.6));
      if (b.order >= 2 || b.order === 1.5 || b.order === 2.5) {
        [1, -1].forEach((sg) => addCloud(gaussCloud(mid.clone().add(n2.clone().multiplyScalar(sg * 0.5)), 0.2, 80, '#e65bff', rand, d.clone(), 2.0)));
      }
      if (b.order >= 3) {
        [1, -1].forEach((sg) => addCloud(gaussCloud(mid.clone().add(n1.clone().multiplyScalar(sg * 0.5)), 0.2, 80, '#e65bff', rand, d.clone(), 2.0)));
      }
    });
    const pts = makePoints(new Float32Array(merged.pos), new Float32Array(merged.col), new Float32Array(merged.size), new Float32Array(merged.ph), { mode: 0, alpha: 0.9 });
    g.add(pts);
    // merkezleme
    const c = P.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / P.length);
    g.children.forEach((ch) => { if (ch !== pts) ch.position.sub(c); });
    pts.position.sub(c);
    let radius = 3;
    P.forEach((p) => { radius = Math.max(radius, p.clone().sub(c).length() + 1.2); });
    return { group: g, radius };
  }

  function molAnalysis(mol) {
    const A = mol.atoms;
    const bondsInfo = mol.bonds.map((b) => {
      const d = A[b.a].p.distanceTo(A[b.b].p);
      const ea = ELEMENTS[A[b.a].Z - 1].en || 2, eb = ELEMENTS[A[b.b].Z - 1].en || 2;
      const dEN = Math.abs(ea - eb);
      const ionicPct = (1 - Math.exp(-(dEN * dEN) / 4)) * 100;
      let type = b.order === 0 ? 'İyonik' : (dEN < 0.4 ? 'Apolar kovalent' : (dEN < 1.7 ? 'Polar kovalent' : 'İyonik karakterli'));
      return { b, d, dEN, ionicPct, type, sa: ELEMENTS[A[b.a].Z - 1].symbol, sb: ELEMENTS[A[b.b].Z - 1].symbol };
    });
    const angles = [];
    A.forEach((a, i) => {
      const nbr = [];
      mol.bonds.forEach((b) => { if (b.a === i) nbr.push(b.b); else if (b.b === i) nbr.push(b.a); });
      for (let x = 0; x < nbr.length; x++) {
        for (let y = x + 1; y < nbr.length; y++) {
          const v1 = A[nbr[x]].p.clone().sub(a.p), v2 = A[nbr[y]].p.clone().sub(a.p);
          angles.push({ at: ELEMENTS[a.Z - 1].symbol, a: ELEMENTS[A[nbr[x]].Z - 1].symbol, c: ELEMENTS[A[nbr[y]].Z - 1].symbol, deg: Math.acos(clamp(v1.dot(v2) / (v1.length() * v2.length()), -1, 1)) / D2R });
        }
      }
    });
    // dipol
    const dip = V(0, 0, 0);
    mol.bonds.forEach((b, k) => {
      const dir = A[b.b].p.clone().sub(A[b.a].p).normalize();
      const ea = ELEMENTS[A[b.a].Z - 1].en || 2, eb = ELEMENTS[A[b.b].Z - 1].en || 2;
      dip.add(dir.multiplyScalar(eb - ea));
    });
    // oktet / formal yük
    const octet = A.map((a, i) => {
      let bondE = 0;
      mol.bonds.forEach((b) => { if ((b.a === i || b.b === i) && b.order > 0) bondE += b.order * 2; });
      const lpE = (a.lp ? a.lp.length : 0) * 2;
      const tot = bondE + lpE;
      const need = a.Z === 1 ? 2 : 8;
      const fc = valenceE(a.Z) - (a.lp ? a.lp.length * 2 : 0) - bondE / 2;
      const per = ELEMENTS[a.Z - 1].row || 2;
      return { sym: ELEMENTS[a.Z - 1].symbol, tot, need, fc: mol.ionic ? a.charge : Math.round(fc * 10) / 10, ok: tot >= need || per >= 3 || a.Z === 5 || mol.ionic };
    });
    return { bondsInfo, angles, dipole: dip.length(), octet };
  }

  function updateMoleculeUI(mol) {
    const A = mol.atoms;
    let mass = 0, protons = 0, neutrons = 0, charge = 0;
    A.forEach((a) => { const el = ELEMENTS[a.Z - 1]; mass += el.mass; protons += a.Z; neutrons += el.neutrons; charge += a.charge || 0; });
    if ($('hudZ')) $('hudZ').textContent = `${protons} (p⁺)`;
    if ($('hudN')) $('hudN').textContent = `${neutrons} (n⁰)`;
    if ($('hudE')) $('hudE').textContent = `${protons - charge} (e⁻)`;
    if ($('hudOrbital')) $('hudOrbital').textContent = `${mol.formula} · ${mol.geometry}`;
    if ($('atomNuclideNums')) $('atomNuclideNums').innerHTML = `<span>${A.length}</span><span>${mol.bonds.length}</span>`;
    if ($('atomNuclideSym')) $('atomNuclideSym').textContent = mol.formula;
    if ($('atomElTitle')) $('atomElTitle').textContent = mol.name;
    if ($('atomElSub')) $('atomElSub').textContent = `${mol.geometry} · M ≈ ${mass.toFixed(2)} u`;
    if ($('atomConfigText')) $('atomConfigText').textContent = `${mol.formula}: ${A.length} atom, ${mol.bonds.length} bağ`;
    if ($('qaActiveMolBadge')) $('qaActiveMolBadge').textContent = mol.formula;
    const an = molAnalysis(mol);
    const angTxt = an.angles.length ? `${an.angles[0].deg.toFixed(1)}°` : '—';
    const polar = an.dipole > 0.35 ? 'Polar (net dipol var)' : 'Apolar (dipoller sönümlenir)';
    const box = $('qaMoleculeInfoBox');
    if (box) {
      box.innerHTML = `<b style="color:var(--cyan);">${mol.formula} — ${mol.name}</b><br>` +
        `Geometri: <b>${mol.geometry}</b> · Melezleşme: <b>${mol.hybrid}</b><br>` +
        `İlk bağ açısı: <b>${angTxt}</b> · ${polar}<br>` +
        `<span style="color:#3df2ff;">● σ bağ bulutu</span> <span style="color:#e65bff;">● π bulutu</span> <span style="color:#ffd23f;">● ortaklanmamış çift</span>`;
    }
    if ($('telAtomEN')) $('telAtomEN').textContent = polar.split(' ')[0];
    if ($('telAtomRadius')) $('telAtomRadius').textContent = `${Math.round(an.bondsInfo.length ? an.bondsInfo[0].d * 100 : 0)} pm (bağ)`;
    recordRecent({ kind: 'mol', id: mol.key === 'build' ? mol.formula : mol.key, label: `${mol.formula} · ${mol.name}` });
  }

  function buildMoleculeScene(v3) {
    const mol = Q.mol;
    const rand = mulberry(mol.formula.length * 977 + mol.atoms.length * 31);
    const { group, radius } = buildMoleculeGroup(mol, 2.4, rand);
    v3.root.add(group);
    v3.onFrame((dt) => { group.rotation.y += dt * 0.25; });
    v3.setDistance(Math.max(11, radius * 3.0));
    updateMoleculeUI(mol);
  }

