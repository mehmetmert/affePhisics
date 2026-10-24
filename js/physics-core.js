/* ============================================================================
   affePhysics (affeLab: Physics) — Çekirdek Fizik & Matematiksel Çözücü Motoru
   İçerik:
   1. 4. Dereceden Runge-Kutta (RK4) & Velocity Verlet Sayısal İntegratörleri
   2. Hidrojen-Benzeri Kuantum Dalga Fonksiyonları: R_nl(r), Laguerre, Küresel Harmonik Y_lm(θ,φ)
   3. Dalga Boyu (λ nm) -> Görünür / UV / IR Spektrum Renk Motoru
   4. Three.js 3B Sahne Yöneticisi (Orbit, Pinch-to-Zoom, Ultra Glass) ve 2B Vektör Çizici
   ============================================================================ */
(function () {
  'use strict';

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ==========================================================================
     1. 4. DERECEDEN RUNGE-KUTTA (RK4) VE VELOCITY VERLET ÇÖZÜCÜLERİ
     ========================================================================== */
  function rk4Step(y, t, dt, deriv) {
    const n = y.length;
    const k1 = deriv(y, t);
    const y2 = new Array(n);
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i];
    const k2 = deriv(y2, t + 0.5 * dt);

    const y3 = new Array(n);
    for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * dt * k2[i];
    const k3 = deriv(y3, t + 0.5 * dt);

    const y4 = new Array(n);
    for (let i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i];
    const k4 = deriv(y4, t + dt);

    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      next[i] = y[i] + (dt / 6.0) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return next;
  }

  /* ==========================================================================
     2. GERÇEK KUANTUM DALGA FONKSİYONU (ψ_nlm) & KÜRESEL HARMONİKLER
     ========================================================================== */
  const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800];
  function factorial(n) {
    if (n <= 0) return 1;
    if (n < FACT.length) return FACT[n];
    let r = FACT[FACT.length - 1];
    for (let i = FACT.length; i <= n; i++) r *= i;
    return r;
  }

  // Genelleştirilmiş Laguerre Polinomu L_p^alpha(x) — tekrarlama bağıntısı ile
  function assocLaguerre(p, alpha, x) {
    if (p <= 0) return 1.0;
    if (p === 1) return 1.0 + alpha - x;
    let L0 = 1.0;
    let L1 = 1.0 + alpha - x;
    for (let k = 1; k < p; k++) {
      const Lnext = ((2 * k + 1 + alpha - x) * L1 - (k + alpha) * L0) / (k + 1);
      L0 = L1;
      L1 = Lnext;
    }
    return L1;
  }

  // Normalize Radyal Dalga Fonksiyonu R_{nl}(r) (Bohr yarıçapı a_0 = 1 biriminde)
  function radialWavefunction(n, l, r) {
    if (n <= l || r < 0) return 0;
    const rho = (2.0 * r) / n;
    const p = n - l - 1;
    const alpha = 2 * l + 1;
    const norm = Math.sqrt(
      Math.pow(2.0 / n, 3) * (factorial(p) / (2.0 * n * factorial(n + l)))
    );
    const lag = assocLaguerre(p, alpha, rho);
    return norm * Math.exp(-rho * 0.5) * Math.pow(rho, l) * lag;
  }

  // Radyal Olasılık Yoğunluğu P(r) = r^2 * |R_{nl}(r)|^2
  function radialProbDensity(n, l, r) {
    const R = radialWavefunction(n, l, r);
    return r * r * R * R;
  }

  // Asosiye Legendre Polinomu P_l^m(u), m >= 0, u = cos(θ) ∈ [-1, 1]
  function assocLegendre(l, m, u) {
    const absM = Math.abs(m);
    if (absM > l) return 0;
    let pmm = 1.0;
    if (absM > 0) {
      const somx2 = Math.sqrt(Math.max(0, (1.0 - u) * (1.0 + u)));
      let fact = 1.0;
      for (let i = 1; i <= absM; i++) {
        pmm *= -fact * somx2;
        fact += 2.0;
      }
    }
    if (l === absM) return pmm;
    let pmmp1 = u * (2.0 * absM + 1.0) * pmm;
    if (l === absM + 1) return pmmp1;
    let pll = 0;
    for (let ll = absM + 2; ll <= l; ll++) {
      pll = ((2.0 * ll - 1.0) * u * pmmp1 - (ll + absM - 1.0) * pmm) / (ll - absM);
      pmm = pmmp1;
      pmmp1 = pll;
    }
    return pll;
  }

  // Gerçek Küresel Harmonik Y_{lm}(θ, φ)
  function realSphericalHarmonic(l, m, theta, phi) {
    const absM = Math.abs(m);
    const norm = Math.sqrt(
      ((2 * l + 1) / (4 * Math.PI)) * (factorial(l - absM) / factorial(l + absM))
    );
    const P = assocLegendre(l, absM, Math.cos(theta));
    if (m === 0) return norm * P;
    if (m > 0) return Math.SQRT2 * norm * P * Math.cos(absM * phi);
    return Math.SQRT2 * norm * P * Math.sin(absM * phi);
  }

  // Tam 3B Kartezyen Noktada (x, y, z) Dalga Fonksiyonu ψ_{nlm}(x,y,z)
  function evalPsi3D(n, l, m, x, y, z) {
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-7) {
      const R0 = radialWavefunction(n, l, 0);
      const Y0 = l === 0 ? 1 / Math.sqrt(4 * Math.PI) : 0;
      return R0 * Y0;
    }
    const theta = Math.acos(clamp(z / r, -1, 1));
    const phi = Math.atan2(y, x);
    const R = radialWavefunction(n, l, r);
    const Y = realSphericalHarmonic(l, m, theta, phi);
    return R * Y;
  }

  // Orbital etiketleyici (örn: n=3, l=2, m=0 -> "3d (m=0, dz²)")
  function orbitalLabel(n, l, m) {
    const lLetters = ['s', 'p', 'd', 'f', 'g'];
    const letter = lLetters[l] || `l=${l}`;
    const subMap = {
      '0_0': '',
      '1_0': 'z', '1_1': 'x', '1_-1': 'y',
      '2_0': 'z²', '2_1': 'xz', '2_-1': 'yz', '2_2': 'x²−y²', '2_-2': 'xy',
      '3_0': 'z³', '3_1': 'xz²', '3_-1': 'yz²', '3_2': 'z(x²−y²)', '3_-2': 'xyz', '3_3': 'x(x²−3y²)', '3_-3': 'y(3x²−y²)'
    };
    const sub = subMap[`${l}_${m}`] || `(m=${m})`;
    return `${n}${letter}${sub ? `_${sub}` : ''}`;
  }

  /* ==========================================================================
     3. SPEKTROSKOPİ DALGA BOYU (λ nm) -> RGB / HEX DÖNÜŞTÜRÜCÜ
     ========================================================================== */
  function wavelengthToColor(lambda, alpha = 1) {
    let r = 0, g = 0, b = 0;
    if (lambda < 380) {
      // Morötesi (UV) — Elektrik moru ışıma
      r = 155; g = 70; b = 255;
    } else if (lambda >= 380 && lambda < 440) {
      r = -(lambda - 440) / (440 - 380); g = 0.0; b = 1.0;
    } else if (lambda >= 440 && lambda < 490) {
      r = 0.0; g = (lambda - 440) / (490 - 440); b = 1.0;
    } else if (lambda >= 490 && lambda < 510) {
      r = 0.0; g = 1.0; b = -(lambda - 510) / (510 - 490);
    } else if (lambda >= 510 && lambda < 580) {
      r = (lambda - 510) / (580 - 510); g = 1.0; b = 0.0;
    } else if (lambda >= 580 && lambda < 645) {
      r = 1.0; g = -(lambda - 645) / (645 - 580); b = 0.0;
    } else if (lambda >= 645 && lambda <= 750) {
      r = 1.0; g = 0.0; b = 0.0;
    } else {
      // Kızılötesi (IR) — Derin kor kırmızı
      r = 210; g = 25; b = 45;
    }

    if (lambda >= 380 && lambda <= 750) {
      let factor = 1.0;
      if (lambda < 420) factor = 0.35 + 0.65 * (lambda - 380) / (420 - 380);
      else if (lambda > 700) factor = 0.35 + 0.65 * (750 - lambda) / (750 - 700);
      r = Math.round(255 * Math.pow(r * factor, 0.8));
      g = Math.round(255 * Math.pow(g * factor, 0.8));
      b = Math.round(255 * Math.pow(b * factor, 0.8));
    }

    if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /* ==========================================================================
     4. THREE.JS 3B SAHNE YÖNETİCİSİ & 2B KANVAS YARDIMCILARI
     ========================================================================== */
  function createViewer3D(container, opts = {}) {
    if (!window.THREE || !container) return null;
    container.innerHTML = '';

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      container.innerHTML = '<div style="padding:24px;color:#94a3b8;">WebGL başlatılamadı.</div>';
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    let targetDist = opts.distance || 16;
    let curDist = targetDist;
    let minD = opts.minDistance || 3.5;
    let maxD = opts.maxDistance || 65;
    camera.position.set(0, 0, curDist);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x090d16, 0.95);
    scene.add(hemi);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(10, 14, 16);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x00f2fe, 0.55);
    dir2.position.set(-12, -10, -10);
    scene.add(dir2);
    const dir3 = new THREE.DirectionalLight(0xa855f7, 0.45);
    dir3.position.set(0, -14, 8);
    scene.add(dir3);

    const root = new THREE.Group();
    scene.add(root);

    const st = {
      rotX: opts.tilt ?? 0.35,
      rotY: opts.spin ?? -0.45,
      velX: 0,
      velY: 0,
      autoRotate: opts.autoRotate !== false,
      dragging: false,
      lx: 0,
      ly: 0,
      running: true,
      pinchDist: 0,
      pointers: new Map()
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';

    dom.addEventListener('pointerdown', (e) => {
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture(e.pointerId);
      if (st.pointers.size === 1) {
        st.dragging = true;
        st.lx = e.clientX;
        st.ly = e.clientY;
        dom.style.cursor = 'grabbing';
      } else if (st.pointers.size === 2) {
        const pts = Array.from(st.pointers.values());
        st.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (!st.pointers.has(e.pointerId)) return;
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.pointers.size === 2) {
        const pts = Array.from(st.pointers.values());
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (st.pinchDist > 10) {
          const ratio = st.pinchDist / Math.max(10, d);
          targetDist = clamp(targetDist * ratio, minD, maxD);
        }
        st.pinchDist = d;
        return;
      }
      if (!st.dragging) return;
      st.velY = (e.clientX - st.lx) * 0.0075;
      st.velX = (e.clientY - st.ly) * 0.0075;
      st.rotY += st.velY;
      st.rotX = clamp(st.rotX + st.velX, -1.52, 1.52);
      st.lx = e.clientX;
      st.ly = e.clientY;
    });

    const endPtr = (e) => {
      st.pointers.delete(e.pointerId);
      if (st.pointers.size === 0) {
        st.dragging = false;
        dom.style.cursor = 'grab';
      }
    };
    dom.addEventListener('pointerup', endPtr);
    dom.addEventListener('pointercancel', endPtr);

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetDist = clamp(targetDist * (e.deltaY > 0 ? 1.09 : 0.91), minD, maxD);
    }, { passive: false });

    function resize() {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 480;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(container);
    resize();

    const frameCallbacks = [];
    const clock = new THREE.Clock();
    let elapsed = 0;

    function animate() {
      requestAnimationFrame(animate);
      if (!st.running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      if (!st.dragging) {
        st.velX *= 0.92;
        st.velY *= 0.92;
        st.rotY += st.velY;
        st.rotX = clamp(st.rotX + st.velX, -1.52, 1.52);
        if (st.autoRotate) st.rotY += dt * 0.25;
      }

      curDist += (targetDist - curDist) * 0.12;
      camera.position.z = curDist;
      root.rotation.set(st.rotX, st.rotY, 0);

      for (let i = 0; i < frameCallbacks.length; i++) {
        frameCallbacks[i](dt, elapsed);
      }
      renderer.render(scene, camera);
    }
    animate();

    function clear() {
      frameCallbacks.length = 0;
      while (root.children.length > 0) {
        const child = root.children[0];
        root.remove(child);
        child.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
        });
      }
    }

    return {
      scene,
      camera,
      renderer,
      root,
      clear,
      onFrame(fn) { frameCallbacks.push(fn); },
      setDistance(d) { targetDist = clamp(d, minD, maxD); },
      setAutoRotate(v) { st.autoRotate = v; },
      setRunning(v) { st.running = v; if (v) { clock.getDelta(); resize(); } },
      resize
    };
  }

  function makeSpriteLabel(text, color = '#00f2fe', scale = 0.8) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d');
    g.font = '800 54px Inter, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(5, 7, 13, 0.9)';
    g.strokeText(text, 128, 64);
    g.fillStyle = color;
    g.fillText(text, 128, 64);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale * 2, scale, 1);
    sp.renderOrder = 20;
    return sp;
  }

  function fitCanvas(canvas) {
    if (!canvas) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.floor(rect.width));
    const h = Math.max(120, Math.floor(rect.height));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr };
  }

  function drawVectorArrow(ctx, x1, y1, x2, y2, color, label = '') {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 3) return;
    const ang = Math.atan2(dy, dx);
    const head = Math.min(11, Math.max(6, len * 0.24));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = '700 11.5px "JetBrains Mono", monospace';
      const tx = x2 + Math.cos(ang) * 12;
      const ty = y2 + Math.sin(ang) * 12;
      ctx.fillStyle = 'rgba(5, 7, 13, 0.8)';
      const m = ctx.measureText(label);
      ctx.fillRect(tx - 3, ty - 9, m.width + 6, 15);
      ctx.fillStyle = color;
      ctx.fillText(label, tx, ty + 3);
    }
    ctx.restore();
  }

  window.PhysCore = {
    clamp,
    rk4Step,
    factorial,
    assocLaguerre,
    radialWavefunction,
    radialProbDensity,
    realSphericalHarmonic,
    evalPsi3D,
    orbitalLabel,
    wavelengthToColor,
    createViewer3D,
    makeSpriteLabel,
    fitCanvas,
    drawVectorArrow
  };
})();
