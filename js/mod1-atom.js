/* ============================================================================
   affePhysics — MODÜL 1: Atom Modelleri Evrimi, 3B Kuantum Orbitalleri,
   Nükleer Fizik ve Standart Model (Kuark/Gluon) Laboratuvarı
   ============================================================================ */
(function () {
  'use strict';

  const { ELEMENTS, CATS, ORDER, CAP, calcNuclearProperties, SM_PARTICLES, HADRONS } = window.PhysData;
  const {
    clamp, rk4Step, radialProbDensity, realSphericalHarmonic, evalPsi3D,
    orbitalLabel, wavelengthToColor, createViewer3D, makeSpriteLabel, fitCanvas
  } = window.PhysCore;

  const $ = (id) => document.getElementById(id);

  // Modül 1 Durum Yöneticisi
  const state = {
    activeSub: '1_1',
    // 1.1: 3B Kuantum Atom
    Z: 6, // Karbon ile başla (veya Hidrojen/Altın geçişi)
    N: 6,
    n: 2,
    l: 1,
    ml: 0,
    ms: 0.5,
    viewMode: 'cloud', // 'bohr' | 'cloud' | 'glass' | 'slice' | 'rabi'
    sliceAxis: 'y',    // 'x' | 'y' | 'z'
    zoomStage: 1,      // 1: Atom (10^-10 m) | 2: Çekirdek (10^-15 m) | 3: Kuark-Gluon (<10^-15 m)
    antimatter: false,
    cloudDensity: 5500,
    // 1.2: Tarihsel Atom Modelleri & Spektrometre
    histModel: 'rutherford', // 'dalton' | 'thomson' | 'rutherford' | 'bohr' | 'debroglie' | 'schrodinger'
    gunType: 'alpha',        // 'alpha' | 'photon'
    alphaEnergy: 5.0,        // MeV
    targetZ: 79,             // Altın (Au)
    photonLambda: 656.3,     // nm (Balmer H-alfa)
    whiteLight: false,
    multiNuclei: false,
    // 1.3: Nükleer Fizik & Fisyon
    nucZ: 6,
    nucN: 8,                 // Karbon-14 varsayılan
    fissionMode: false,
    controlRodPct: 35,
    // 1.4: Standart Model & Hadron Sentezleyici
    selectedSM: 'u',
    hadronMode: 'baryon',    // 'baryon' | 'meson'
    q1: 'u',
    q2: 'u',
    q3: 'd'
  };

  let viewer3d = null;
  let activeSubLoop = null;

  /* ==========================================================================
     ALT SEKME 1.1: 3B KUANTUM ATOM VE KATMAN İNCELEYİCİ (simulator_dark.html)
     ========================================================================== */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function packNucleons(A, radius, seed) {
    const rand = rng(seed);
    const R = radius * 1.15 * Math.cbrt(Math.max(1, A));
    const pts = [];
    for (let i = 0; i < A; i++) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const rr = R * Math.cbrt(rand());
      const s = Math.sqrt(1 - u * u);
      pts.push(new THREE.Vector3(s * Math.cos(th) * rr, u * rr, s * Math.sin(th) * rr));
    }
    if (A === 1) pts[0].set(0, 0, 0);
    const minD = radius * 1.85;
    const tmp = new THREE.Vector3();
    const iters = A > 140 ? 10 : 20;
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < A; i++) {
        for (let j = i + 1; j < A; j++) {
          tmp.subVectors(pts[j], pts[i]);
          const d = tmp.length();
          if (d < minD && d > 1e-5) {
            tmp.multiplyScalar(((minD - d) / d) * 0.5);
            pts[j].add(tmp);
            pts[i].sub(tmp);
          }
        }
      }
      for (const p of pts) p.multiplyScalar(0.96);
    }
    return pts;
  }

  function buildNucleusGroup(Z, N, rNuc = 0.24, isAntimatter = false) {
    const A = Math.max(1, Z + N);
    const pts = packNucleons(A, rNuc, Z * 4999 + N);
    const geo = new THREE.SphereGeometry(rNuc, 18, 14);
    const pColor = isAntimatter ? 0x00f2fe : 0xff3366;
    const nColor = isAntimatter ? 0xa855f7 : 0x64748b;

    const pMat = new THREE.MeshStandardMaterial({
      color: pColor, emissive: pColor, emissiveIntensity: 0.28, roughness: 0.3, metalness: 0.1
    });
    const nMat = new THREE.MeshStandardMaterial({
      color: nColor, roughness: 0.45, metalness: 0.15
    });

    const pMesh = new THREE.InstancedMesh(geo, pMat, Math.max(1, Z));
    const nMesh = new THREE.InstancedMesh(geo, nMat, Math.max(1, N));

    const rand = rng(Z * 31 + N * 17 + 7);
    const isP = Array.from({ length: A }, (_, i) => i < Z);
    for (let i = A - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [isP[i], isP[j]] = [isP[j], isP[i]];
    }

    const mat4 = new THREE.Matrix4();
    let pi = 0, ni = 0;
    pts.forEach((p, idx) => {
      mat4.makeTranslation(p.x, p.y, p.z);
      if (isP[idx]) pMesh.setMatrixAt(pi++, mat4);
      else nMesh.setMatrixAt(ni++, mat4);
    });
    pMesh.count = pi;
    nMesh.count = ni;

    const group = new THREE.Group();
    group.add(pMesh, nMesh);

    // Güçlü Nükleer Kuvvet Halesi
    const haloRadius = rNuc * 1.45 * Math.cbrt(A) + 0.18;
    const haloGeo = new THREE.SphereGeometry(haloRadius, 28, 20);
    const haloMat = new THREE.MeshBasicMaterial({
      color: isAntimatter ? 0x00f2fe : 0xff3366,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    group.add(new THREE.Mesh(haloGeo, haloMat));

    return { group, pts, isP, haloRadius };
  }

  // Monte Carlo |ψ_{nlm}(r,θ,φ)|² Nokta Bulutu Üretici
  function buildQuantumCloud(n, l, m, count, sliceMode, sliceAxis, isAntimatter) {
    const maxR = n * n * 2.5 + 3.0;
    // Maksimum olasılık yoğunluğunu tahmin et
    let maxProb = 1e-6;
    const rand = rng(n * 1009 + l * 97 + (m + 10) * 13);
    for (let i = 0; i < 900; i++) {
      const r = rand() * maxR * 0.7;
      const th = Math.acos(rand() * 2 - 1);
      const ph = rand() * Math.PI * 2;
      const x = r * Math.sin(th) * Math.cos(ph);
      const y = r * Math.sin(th) * Math.sin(ph);
      const z = r * Math.cos(th);
      const psi = evalPsi3D(n, l, m, x, y, z);
      const p = psi * psi * (r * r + 0.25);
      if (p > maxProb) maxProb = p;
    }

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    const posCol = new THREE.Color(isAntimatter ? '#ff3366' : '#00f2fe');
    const negCol = new THREE.Color(isAntimatter ? '#fbbf24' : '#a855f7');

    const visualScale = 6.2 / maxR;
    let accepted = 0;
    let guard = 0;
    const maxGuard = count * 85;

    while (accepted < count && guard < maxGuard) {
      guard++;
      const r = Math.pow(rand(), 0.65) * maxR;
      let u = rand() * 2 - 1;
      let ph = rand() * Math.PI * 2;
      const th = Math.acos(u);
      let x = r * Math.sin(th) * Math.cos(ph);
      let y = r * Math.sin(th) * Math.sin(ph);
      let z = r * Math.cos(th);

      if (sliceMode) {
        if (sliceAxis === 'y' && y > 0) y = -y;
        else if (sliceAxis === 'x' && x > 0) x = -x;
        else if (sliceAxis === 'z' && z > 0) z = -z;
      }

      const psi = evalPsi3D(n, l, m, x, y, z);
      const weight = psi * psi * (r * r + 0.15);
      if (rand() * maxProb * 0.75 < weight) {
        // Three.js'te dikey eksen Y olduğu için fiziksel Z eksenini Y'ye eşle
        positions[accepted * 3] = x * visualScale;
        positions[accepted * 3 + 1] = z * visualScale;
        positions[accepted * 3 + 2] = -y * visualScale;

        const c = psi >= 0 ? posCol : negCol;
        colors[accepted * 3] = c.r;
        colors[accepted * 3 + 1] = c.g;
        colors[accepted * 3 + 2] = c.b;
        phases[accepted] = psi >= 0 ? 1 : -1;
        accepted++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Parlak dairesel nokta dokusu
    const cnv = document.createElement('canvas');
    cnv.width = cnv.height = 64;
    const g = cnv.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const pointTex = new THREE.CanvasTexture(cnv);

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: pointTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    return { points, positions, colors, phases, count: accepted, visualScale, maxR };
  }

  // "Canlı Cam (Ultra Glass Orbital)" 3B Küresel Harmonik Yüzey Üretici
  function buildUltraGlassOrbital(n, l, m, isAntimatter) {
    const seg = 96;
    const vals = [];
    const dirs = [];
    let maxVal = 1e-6;

    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI;
      for (let j = 0; j <= seg; j++) {
        const ph = (j / seg) * Math.PI * 2;
        const v = realSphericalHarmonic(l, m, th, ph);
        vals.push(v);
        dirs.push([Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]);
        if (Math.abs(v) > maxVal) maxVal = Math.abs(v);
      }
    }

    const pos = new Float32Array(vals.length * 3);
    const col = new Float32Array(vals.length * 3);
    const posC = new THREE.Color(isAntimatter ? '#ff3366' : '#00f2fe');
    const negC = new THREE.Color(isAntimatter ? '#fbbf24' : '#a855f7');
    const scale = 3.2 + n * 0.45;

    vals.forEach((v, k) => {
      const r = (Math.abs(v) / maxVal) * scale;
      const [x, y, z] = dirs[k];
      pos[k * 3] = x * r;
      pos[k * 3 + 1] = z * r;
      pos[k * 3 + 2] = -y * r;
      const c = v >= 0 ? posC : negC;
      col[k * 3] = c.r;
      col[k * 3 + 1] = c.g;
      col[k * 3 + 2] = c.b;
    });

    const idx = [];
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j;
        const b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const group = new THREE.Group();

    // Cam iç yüzey + parlak tel kafes halesi
    const glassMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.62,
      shininess: 110,
      specular: 0xffffff
    });
    group.add(new THREE.Mesh(geo, glassMat));

    const wireMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(geo, wireMat));

    // Radyal düğüm kürelerini (n - l - 1 adet) yarı-saydam cam katman olarak ekle
    const radialNodes = Math.max(0, n - l - 1);
    for (let rn = 1; rn <= radialNodes; rn++) {
      const nr = (rn / (radialNodes + 1)) * scale * 0.72;
      const nodeGeo = new THREE.SphereGeometry(nr, 32, 24);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.11,
        wireframe: true
      });
      group.add(new THREE.Mesh(nodeGeo, nodeMat));
    }

    return group;
  }

  // Kademe 3: Proton (uud) / Nötron (udd) İçi 3 Kuark ve QCD Gluon Kuvvet Tüpleri
  function buildQuarkGluonStage(v, isAntimatter) {
    const group = new THREE.Group();

    // Konfinement (Hapis) Çantası Küresi
    const bagGeo = new THREE.SphereGeometry(4.2, 40, 32);
    const bagMat = new THREE.MeshPhongMaterial({
      color: isAntimatter ? 0x00f2fe : 0xa855f7,
      transparent: true,
      opacity: 0.11,
      side: THREE.BackSide,
      shininess: 90
    });
    group.add(new THREE.Mesh(bagGeo, bagMat));

    // 3 Renk Yüklü Kuark: Kırmızı, Yeşil, Mavi
    const quarkDefs = [
      { label: isAntimatter ? 'ū (−2/3e)' : 'u (+2/3e)', color: 0xff3366, pos: new THREE.Vector3(-2.1, 1.3, 0) },
      { label: isAntimatter ? 'ū (−2/3e)' : 'u (+2/3e)', color: 0x10b981, pos: new THREE.Vector3(2.1, 1.3, 0) },
      { label: isAntimatter ? 'd̄ (+1/3e)' : 'd (−1/3e)', color: 0x00f2fe, pos: new THREE.Vector3(0, -2.2, 0) }
    ];

    const quarkMeshes = [];
    quarkDefs.forEach((qd) => {
      const qGroup = new THREE.Group();
      qGroup.position.copy(qd.pos);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 28, 22),
        new THREE.MeshStandardMaterial({
          color: qd.color,
          emissive: qd.color,
          emissiveIntensity: 0.55,
          roughness: 0.2
        })
      );
      qGroup.add(sphere);
      const lbl = makeSpriteLabel(qd.label, '#ffffff', 0.65);
      lbl.position.set(0, 1.05, 0);
      qGroup.add(lbl);
      group.add(qGroup);
      quarkMeshes.push({ qGroup, basePos: qd.pos.clone() });
    });

    // Merkez Y-Tipi QCD Gluon Akı Tüpleri (Flux Tubes) — parlayan enerji halkaları
    const gluonRings = [];
    const ringGeo = new THREE.TorusGeometry(0.28, 0.06, 10, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    for (let leg = 0; leg < 3; leg++) {
      for (let s = 1; s <= 7; s++) {
        const m = new THREE.Mesh(ringGeo, ringMat);
        group.add(m);
        gluonRings.push({ mesh: m, leg, frac: s / 8 });
      }
    }

    // Merkez Gluon Kavşağı (Junction)
    const junc = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    group.add(junc);

    v.root.add(group);
    v.setDistance(13.5);

    v.onFrame((dt, t) => {
      quarkMeshes.forEach((qm, idx) => {
        qm.qGroup.position.x = qm.basePos.x + Math.sin(t * 3.8 + idx * 2.1) * 0.28;
        qm.qGroup.position.y = qm.basePos.y + Math.cos(t * 4.3 + idx * 1.7) * 0.28;
        qm.qGroup.position.z = Math.sin(t * 3.1 + idx) * 0.25;
      });

      const center = new THREE.Vector3(
        Math.sin(t * 5.0) * 0.12,
        Math.cos(t * 4.5) * 0.12,
        0
      );
      junc.position.copy(center);

      gluonRings.forEach((gr) => {
        const target = quarkMeshes[gr.leg].qGroup.position;
        const pulse = (gr.frac + t * 0.9) % 1.0;
        gr.mesh.position.lerpVectors(center, target, pulse);
        gr.mesh.lookAt(target);
        const sc = 0.75 + 0.45 * Math.sin(pulse * Math.PI);
        gr.mesh.scale.set(sc, sc, sc);
      });
    });
  }

  function rebuildAtom3DScene() {
    if (!viewer3d) return;
    const MQ = window.Mod1Quantum;
    if (state.zoomStage === 1 && MQ && MQ.shouldTakeOver && MQ.shouldTakeOver()) {
      MQ.renderActive();
      return;
    }
    viewer3d.clear();

    const el = ELEMENTS[state.Z - 1];
    const isAnti = state.antimatter;

    // Eksen Çizgileri
    const axGroup = new THREE.Group();
    const L = 5.5;
    [
      [[L, 0, 0], 0xff3366, 'X'],
      [[0, L, 0], 0x00f2fe, 'Z'],
      [[0, 0, -L], 0x10b981, 'Y']
    ].forEach(([p, col, name]) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-p[0], -p[1], -p[2]),
        new THREE.Vector3(p[0], p[1], p[2])
      ]);
      axGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.28 })));
      const lb = makeSpriteLabel(name, '#94a3b8', 0.48);
      lb.position.set(p[0] * 1.08, p[1] * 1.08, p[2] * 1.08);
      axGroup.add(lb);
    });
    viewer3d.root.add(axGroup);

    // Kademe 3: Kuark ve Gluon Akı Tüpleri
    if (state.zoomStage === 3) {
      buildQuarkGluonStage(viewer3d, isAnti);
      return;
    }

    // Kademe 2: Nükleer Çekirdek ve Güçlü Kuvvet Halesi (10^-15 m)
    if (state.zoomStage === 2) {
      const nuc = buildNucleusGroup(state.Z, state.N, 0.48, isAnti);
      viewer3d.root.add(nuc.group);
      viewer3d.setDistance(Math.max(7.5, nuc.haloRadius * 3.8));
      viewer3d.onFrame((dt, t) => {
        nuc.group.rotation.y += dt * 0.35;
        const s = 1 + 0.03 * Math.sin(t * 6.0);
        nuc.group.scale.set(s, s, s);
      });
      return;
    }

    // Kademe 1: Atomik Ölçek (10^-10 m)
    const nuc = buildNucleusGroup(state.Z, state.N, 0.16, isAnti);
    viewer3d.root.add(nuc.group);

    if (state.viewMode === 'bohr') {
      const shells = el.shells;
      const eGeo = new THREE.SphereGeometry(0.16, 18, 14);
      const eColor = isAnti ? 0xff3366 : 0x00f2fe;
      const eMat = new THREE.MeshStandardMaterial({
        color: eColor, emissive: eColor, emissiveIntensity: 1.1, roughness: 0.2
      });
      const ringMat = new THREE.MeshBasicMaterial({
        color: isAnti ? 0xf43f5e : 0x38bdf8, transparent: true, opacity: 0.34
      });
      const base = nuc.haloRadius + 1.05;
      const step = 0.88;
      const orbits = [];

      shells.forEach((cnt, idx) => {
        const radius = base + idx * step;
        const g = new THREE.Group();
        g.rotation.x = Math.PI / 2 + Math.sin(idx * 1.6 + 0.3) * 0.36;
        g.rotation.y = Math.cos(idx * 2.1) * 0.32;
        g.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.015, 8, 128), ringMat));

        const eg = new THREE.Group();
        for (let k = 0; k < cnt; k++) {
          const ang = (k / cnt) * Math.PI * 2;
          const e = new THREE.Mesh(eGeo, eMat);
          e.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
          eg.add(e);
        }
        g.add(eg);
        viewer3d.root.add(g);
        orbits.push({ eg, speed: (1.3 / Math.sqrt(idx + 1)) * (idx % 2 ? -1 : 1) });
      });

      const outer = shells.length ? base + (shells.length - 1) * step : 4;
      viewer3d.setDistance(Math.max(11, outer * 3.1));
      viewer3d.onFrame((dt) => {
        orbits.forEach((o) => { o.eg.rotation.z += dt * o.speed; });
        nuc.group.rotation.y += dt * 0.2;
      });
    } else if (state.viewMode === 'glass') {
      const glassGroup = buildUltraGlassOrbital(state.n, state.l, state.ml, isAnti);
      viewer3d.root.add(glassGroup);
      viewer3d.setDistance(13.5);
      viewer3d.onFrame((dt, t) => {
        glassGroup.rotation.y += dt * 0.15;
        const pulse = 1 + 0.025 * Math.sin(t * 2.5);
        glassGroup.scale.set(pulse, pulse, pulse);
      });
    } else {
      // 'cloud', 'slice' veya 'rabi'
      const isSlice = state.viewMode === 'slice';
      const cloud = buildQuantumCloud(
        state.n, state.l, state.ml, state.cloudDensity, isSlice, state.sliceAxis, isAnti
      );
      viewer3d.root.add(cloud.points);
      viewer3d.setDistance(14.5);

      if (state.viewMode === 'rabi') {
        // Rabi Dipol Salınımı: ψ_1 (1s) ve ψ_2 (n,l,m) süperpozisyonu
        const baseY = new Float32Array(cloud.positions.length);
        for (let i = 0; i < cloud.positions.length; i++) baseY[i] = cloud.positions[i];
        viewer3d.onFrame((dt, t) => {
          const posAttr = cloud.points.geometry.getAttribute('position');
          const arr = posAttr.array;
          const osc = Math.sin(t * 3.6);
          for (let i = 0; i < cloud.count; i++) {
            const ph = cloud.phases[i];
            arr[i * 3 + 1] = baseY[i * 3 + 1] + osc * 0.85 * ph;
          }
          posAttr.needsUpdate = true;
        });
      }
    }
  }

  // Radyal Olasılık Dağılımı P(r) = 4πr²|R_{nl}(r)|² Grafiği
  function drawRadialDistributionPlot() {
    const canvas = $('radialPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const n = state.n;
    const l = state.l;
    const maxR = n * n * 2.6 + 4.0;
    const samples = 220;
    const vals = [];
    let peak = 1e-9;
    let peakR = 0;

    for (let i = 0; i <= samples; i++) {
      const r = (i / samples) * maxR;
      const p = radialProbDensity(n, l, r);
      vals.push({ r, p });
      if (p > peak) {
        peak = p;
        peakR = r;
      }
    }

    const padL = 34, padR = 14, padT = 18, padB = 24;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    // Izgara
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      const y = padT + (ph * g) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    }

    // Eğri altı dolgu
    const grad = ctx.createLinearGradient(0, padT, 0, padT + ph);
    grad.addColorStop(0, state.antimatter ? 'rgba(255, 51, 102, 0.45)' : 'rgba(0, 242, 254, 0.45)');
    grad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

    ctx.beginPath();
    ctx.moveTo(padL, padT + ph);
    vals.forEach((pt) => {
      const x = padL + (pt.r / maxR) * pw;
      const y = padT + ph - (pt.p / peak) * ph;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + pw, padT + ph);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Eğri çizgisi
    ctx.beginPath();
    vals.forEach((pt, idx) => {
      const x = padL + (pt.r / maxR) * pw;
      const y = padT + ph - (pt.p / peak) * ph;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = state.antimatter ? '#ff3366' : '#00f2fe';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Radyal düğümleri (yerel minimum = 0 noktalarını) işaretle
    ctx.fillStyle = '#f59e0b';
    for (let i = 2; i < vals.length - 2; i++) {
      if (vals[i].p < vals[i - 1].p && vals[i].p < vals[i + 1].p && vals[i].p < peak * 0.015) {
        const nx = padL + (vals[i].r / maxR) * pw;
        const ny = padT + ph;
        ctx.beginPath();
        ctx.arc(nx, ny - 2, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eksen yazıları
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('P(r) = 4πr²|R_nl(r)|²', padL + 4, padT + 10);
    ctx.fillText(`r_max ≈ ${peakR.toFixed(1)} a₀`, w - padR - 86, padT + 10);
    ctx.fillText('0 a₀', padL, h - 6);
    ctx.fillText(`${maxR.toFixed(0)} a₀`, w - padR - 32, h - 6);
  }

  function renderHundDiagram(conf) {
    const container = $('hundBoxContainer');
    if (!container) return;
    const activeSubs = ORDER.filter((s) => (conf[s] || 0) > 0);
    container.innerHTML = activeSubs.map((sub) => {
      const lChar = sub[1];
      const boxes = CAP[lChar] / 2;
      const count = conf[sub] || 0;
      const boxSpans = [];
      for (let b = 0; b < boxes; b++) {
        const up = count > b;
        const down = count > b + boxes;
        boxSpans.push(`<span class="orb-spin-box">${up ? '↑' : ''}${down ? '↓' : ''}</span>`);
      }
      return `
        <div class="subshell-group">
          <div class="subshell-boxes">${boxSpans.join('')}</div>
          <span class="subshell-lbl">${sub}<sup>${count}</sup></span>
        </div>`;
    }).join('');
  }

  function updateAtomUI() {
    const el = ELEMENTS[state.Z - 1];
    if (!el) return;

    // Quantum sayı kısıtlarını doğrula: l < n, |ml| <= l
    if (state.l >= state.n) state.l = state.n - 1;
    if (Math.abs(state.ml) > state.l) state.ml = 0;

    // l ve ml seçeneklerini güncelle
    const lSel = $('qnL');
    if (lSel) {
      const lNames = ['0 (s - Küresel)', '1 (p - İki Loblu)', '2 (d - Dört Loblu)', '3 (f - Çok Loblu)', '4 (g - Hiper-Lob)'];
      lSel.innerHTML = Array.from({ length: state.n }, (_, i) =>
        `<option value="${i}" ${i === state.l ? 'selected' : ''}>l = ${lNames[i] || i}</option>`
      ).join('');
    }

    const mlSel = $('qnMl');
    if (mlSel) {
      const opts = [];
      for (let m = -state.l; m <= state.l; m++) {
        opts.push(`<option value="${m}" ${m === state.ml ? 'selected' : ''}>m_l = ${m > 0 ? '+' + m : m}</option>`);
      }
      mlSel.innerHTML = opts.join('');
    }

    $('qnNVal').textContent = `n = ${state.n}`;
    const orbLbl = orbitalLabel(state.n, state.l, state.ml);
    $('activeOrbitalBadge').textContent = `Orbital: ${orbLbl}`;

    const A = state.Z + state.N;
    const antiPrefix = state.antimatter ? 'Anti-' : '';
    $('atomNuclideNums').innerHTML = `<span>${A}</span><span>${state.Z}</span>`;
    $('atomNuclideSym').textContent = state.antimatter ? `${el.symbol}̄` : el.symbol;
    $('atomElTitle').textContent = `${antiPrefix}${el.name} (${el.symbol})`;
    $('atomElSub').textContent = `${CATS[el.cat].name} · Kütle: ${el.mass} u`;

    $('hudZ').textContent = `${state.Z} (${state.antimatter ? 'p̄⁻' : 'p⁺'})`;
    $('hudN').textContent = `${state.N} (${state.antimatter ? 'n̄⁰' : 'n⁰'})`;
    $('hudE').textContent = `${state.Z} (${state.antimatter ? 'e⁺' : 'e⁻'})`;
    $('hudOrbital').textContent = orbLbl;

    const radNodes = Math.max(0, state.n - state.l - 1);
    const angNodes = state.l;
    $('telRadNodes').textContent = `${radNodes} Küresel Kabuk`;
    $('telAngNodes').textContent = `${angNodes} Düzlem/Koni`;
    $('telTotalNodes').textContent = `${state.n - 1} Toplam Düğüm`;
    const eLevel = (-13.6 / (state.n * state.n)).toFixed(2);
    $('telEnergyN').textContent = `${eLevel} eV (H-benzeri)`;

    $('atomConfigText').textContent = el.configStr;
    renderHundDiagram(el.config);
    drawRadialDistributionPlot();
    rebuildAtom3DScene();
  }

  function selectElementForAtom(Z) {
    const el = ELEMENTS[clamp(Z, 1, 118) - 1];
    state.Z = el.Z;
    state.N = el.neutrons;
    state.n = clamp(el.qn.n, 1, 5);
    state.l = clamp(el.qn.l, 0, state.n - 1);
    state.ml = clamp(el.qn.ml, -state.l, state.l);
    const selEl = $('atomElementSelect');
    if (selEl) selEl.value = String(el.Z);
    updateAtomUI();
  }

  /* ==========================================================================
     ALT SEKME 1.2: TARİHSEL ATOM MODELLERİ, ALFA SAÇILMASI & SPEKTROMETRE
     ========================================================================== */
  const histSim = {
    alphas: [],
    photons: [],
    emittedPhotons: [],
    electronN: 1,
    exciteTimer: 0,
    phase: 0,
    recordedLines: new Set([656.3, 486.1])
  };

  // Hidrojen Spektral Geçişleri (nm)
  const H_LINES = [
    { ni: 2, nf: 1, lambda: 121.6, series: 'Lyman-α (UV)' },
    { ni: 3, nf: 1, lambda: 102.6, series: 'Lyman-β (UV)' },
    { ni: 4, nf: 1, lambda: 97.3, series: 'Lyman-γ (UV)' },
    { ni: 3, nf: 2, lambda: 656.3, series: 'Balmer Hα (Kırmızı)' },
    { ni: 4, nf: 2, lambda: 486.1, series: 'Balmer Hβ (Camgöbeği)' },
    { ni: 5, nf: 2, lambda: 434.0, series: 'Balmer Hγ (Mavi-Mor)' },
    { ni: 6, nf: 2, lambda: 410.2, series: 'Balmer Hδ (Mor)' },
    { ni: 4, nf: 3, lambda: 1875.1, series: 'Paschen-α (IR)' },
    { ni: 5, nf: 3, lambda: 1281.8, series: 'Paschen-β (IR)' },
    { ni: 6, nf: 3, lambda: 1093.8, series: 'Paschen-γ (IR)' }
  ];

  function fireHistoricalParticle() {
    if (state.gunType === 'alpha') {
      for (let i = 0; i < 9; i++) {
        const b = (i - 4) * 24 + (Math.random() - 0.5) * 8;
        histSim.alphas.push({
          x: -260,
          y: b,
          vx: 180 + state.alphaEnergy * 22,
          vy: 0,
          trail: []
        });
      }
    } else {
      const lambdas = state.whiteLight
        ? [121.6, 102.6, 656.3, 486.1, 434.0, 410.2, 550.0]
        : [state.photonLambda];
      lambdas.forEach((lam, idx) => {
        histSim.photons.push({
          x: -250 - idx * 28,
          y: (idx - (lambdas.length - 1) * 0.5) * 14,
          vx: 260,
          vy: 0,
          lambda: lam,
          absorbed: false
        });
      });
    }
  }

  function stepHistoricalSim(dt) {
    const canvas = $('histSimCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    const cx = w * 0.5;
    const cy = h * 0.44;
    histSim.phase += dt;

    ctx.clearRect(0, 0, w, h);

    // Arka plan koordinat ızgarası
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h * 0.78); ctx.stroke();
    }
    for (let y = 0; y < h * 0.78; y += 45) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Seçilen Tarihsel Atom Modelini Merkezde Çiz
    const m = state.histModel;
    const atomR = 88;

    if (m === 'dalton') {
      const grad = ctx.createRadialGradient(cx - 24, cy - 24, 8, cx, cy, atomR);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, atomR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Dalton (1803): İçi Dolu Bilardo Topu', cx, cy + atomR + 22);
    } else if (m === 'thomson') {
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, atomR);
      grad.addColorStop(0, 'rgba(255, 51, 102, 0.36)');
      grad.addColorStop(1, 'rgba(255, 51, 102, 0.08)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, atomR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.5)'; ctx.stroke();
      // Gömülü elektronlar ("Üzümlü Kek")
      const ePts = [[0, 0], [-38, -28], [38, -28], [-38, 28], [38, 28], [0, -52], [0, 52], [-54, 0], [54, 0]];
      ePts.forEach(([ex, ey], i) => {
        const jx = ex + Math.sin(histSim.phase * 4 + i) * 3;
        const jy = ey + Math.cos(histSim.phase * 4 + i) * 3;
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath(); ctx.arc(cx + jx, cy + jy, 5.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#fda4af'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Thomson (1904): Pozitif Küre İçinde Elektronlar (Üzümlü Kek)', cx, cy + atomR + 22);
    } else if (m === 'rutherford') {
      const centers = state.multiNuclei
        ? [[cx - 90, cy - 65], [cx + 75, cy - 65], [cx, cy], [cx - 90, cy + 65], [cx + 75, cy + 65]]
        : [[cx, cy]];
      centers.forEach(([nx, ny]) => {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.22)';
        ctx.beginPath(); ctx.arc(nx, ny, 56, 0, Math.PI * 2); ctx.stroke();
        // Yoğun pozitif çekirdek
        const g = ctx.createRadialGradient(nx, ny, 1, nx, ny, 14);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, '#ff3366');
        g.addColorStop(1, 'rgba(255,51,102,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nx, ny, 14, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#f8fafc'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`Rutherford (1911): Yoğun Çekirdek (Z = ${state.targetZ}) & Coulomb Saçılması`, cx, cy + atomR + 26);
    } else if (m === 'bohr' || m === 'debroglie' || m === 'schrodinger') {
      // Enerji seviyeleri n = 1..5
      for (let n = 1; n <= 5; n++) {
        const r = n * 21;
        if (m === 'debroglie' && n === histSim.electronN) {
          // De Broglie Duran Dalga: 2πr = nλ
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2; a += 0.03) {
            const wave = r + 7 * Math.sin(n * a) * Math.cos(histSim.phase * 8);
            const wx = cx + Math.cos(a) * wave;
            const wy = cy + Math.sin(a) * wave;
            if (a === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
          }
          ctx.closePath();
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = n === histSim.electronN ? 'rgba(0, 242, 254, 0.7)' : 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = n === histSim.electronN ? 1.8 : 1;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        }
      }

      if (m === 'schrodinger') {
        const orbR = histSim.electronN * 21;
        const g = ctx.createRadialGradient(cx, cy, orbR * 0.2, cx, cy, orbR * 1.35);
        g.addColorStop(0, 'rgba(0, 242, 254, 0.42)');
        g.addColorStop(0.6, 'rgba(168, 85, 247, 0.25)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, orbR * 1.35, 0, Math.PI * 2); ctx.fill();
      } else {
        const er = histSim.electronN * 21;
        const ea = histSim.phase * (4.5 / histSim.electronN);
        const ex = cx + Math.cos(ea) * er;
        const ey = cy + Math.sin(ea) * er;
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Merkez proton
      ctx.fillStyle = '#ff3366';
      ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.fill();

      // Uyarılmış durumdan kendiliğinden emisyonla alt seviyeye geçiş
      if (histSim.electronN > 1) {
        histSim.exciteTimer -= dt;
        if (histSim.exciteTimer <= 0) {
          const ni = histSim.electronN;
          const nf = ni > 2 && Math.random() < 0.65 ? 2 : 1;
          histSim.electronN = nf;
          const match = H_LINES.find((l) => l.ni === ni && l.nf === nf) || H_LINES[3];
          histSim.recordedLines.add(match.lambda);
          const ang = (Math.random() - 0.5) * 1.2;
          histSim.emittedPhotons.push({
            x: cx, y: cy,
            vx: Math.cos(ang) * 220,
            vy: Math.sin(ang) * 220,
            lambda: match.lambda,
            label: `${match.lambda} nm`
          });
        }
      }
    }

    // Alfa Parçacıklarını RK4 ile İlerlet
    const centers = (m === 'rutherford' && state.multiNuclei)
      ? [[0, 0], [-90, -65], [75, -65], [-90, 65], [75, 65]]
      : [[0, 0]];

    for (let i = histSim.alphas.length - 1; i >= 0; i--) {
      const a = histSim.alphas[i];
      if (m === 'dalton') {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        const d = Math.hypot(a.x, a.y);
        if (d < atomR && a.x < 0) {
          const nx = a.x / d, ny = a.y / d;
          const dot = a.vx * nx + a.vy * ny;
          a.vx -= 2 * dot * nx;
          a.vy -= 2 * dot * ny;
          a.x = nx * (atomR + 2);
          a.y = ny * (atomR + 2);
        }
      } else if (m === 'thomson') {
        // Thomson modelinde zayıf yumuşak sapma (<1°)
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        const d = Math.hypot(a.x, a.y);
        if (d < atomR) {
          a.vy += (a.y / atomR) * 18 * dt;
        }
      } else {
        // Gerçek Coulomb Saçılması — RK4 İntegrasyonu: F = k * Z / r^2
        const kCoulomb = (state.targetZ * 420000) / Math.max(1.5, state.alphaEnergy);
        const next = rk4Step([a.x, a.y, a.vx, a.vy], 0, dt, (st) => {
          let ax = 0, ay = 0;
          for (const [cxOff, cyOff] of centers) {
            const dx = st[0] - cxOff;
            const dy = st[1] - cyOff;
            const r2 = dx * dx + dy * dy + 36;
            const r = Math.sqrt(r2);
            const f = kCoulomb / (r2 * r);
            ax += f * dx;
            ay += f * dy;
          }
          return [st[2], st[3], ax, ay];
        });
        a.x = next[0]; a.y = next[1]; a.vx = next[2]; a.vy = next[3];
      }

      a.trail.push([cx + a.x, cy + a.y]);
      if (a.trail.length > 48) a.trail.shift();

      // Çizim
      ctx.beginPath();
      a.trail.forEach(([tx, ty], idx) => {
        if (idx === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      });
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.72)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(cx + a.x, cy + a.y, 4.2, 0, Math.PI * 2); ctx.fill();

      if (Math.abs(a.x) > w * 0.6 || Math.abs(a.y) > h * 0.6) {
        histSim.alphas.splice(i, 1);
      }
    }

    // Gelen Fotonları İlerlet
    for (let i = histSim.photons.length - 1; i >= 0; i--) {
      const p = histSim.photons[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const col = wavelengthToColor(p.lambda);

      // Dalga paketi çizimi
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let s = -14; s <= 14; s += 2) {
        const wx = cx + p.x + s;
        const wy = cy + p.y + Math.sin(s * 0.6 + histSim.phase * 20) * 5;
        if (s === -14) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      if (!p.absorbed && Math.hypot(p.x, p.y) < 35 && (m === 'bohr' || m === 'debroglie' || m === 'schrodinger')) {
        // Rezonans kontrolü
        const match = H_LINES.find((hl) => Math.abs(hl.lambda - p.lambda) < 28);
        if (match) {
          histSim.electronN = match.ni;
          histSim.exciteTimer = 1.1;
          histSim.recordedLines.add(match.lambda);
          histSim.photons.splice(i, 1);
          continue;
        }
      }
      if (p.x > w * 0.55) histSim.photons.splice(i, 1);
    }

    // Yayılan Emisyon Fotonları
    for (let i = histSim.emittedPhotons.length - 1; i >= 0; i--) {
      const ep = histSim.emittedPhotons[i];
      ep.x += ep.vx * dt;
      ep.y += ep.vy * dt;
      const col = wavelengthToColor(ep.lambda);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillText(ep.label, ep.x + 8, ep.y - 6);
      if (ep.x < 0 || ep.x > w || ep.y < 0 || ep.y > h) histSim.emittedPhotons.splice(i, 1);
    }

    // Alt Kısımda "Canlı Cam Spektrometre" (Lyman UV | Balmer Görünür | Paschen IR)
    const specY = h * 0.79;
    const specH = h * 0.19;
    ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
    ctx.fillRect(12, specY, w - 24, specH);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.strokeRect(12, specY, w - 24, specH);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('CANLI CAM EMİSYON SPEKTROMETRESİ — Lyman (UV) · Balmer (Görünür: 410–656 nm) · Paschen (IR)', 22, specY + 16);

    H_LINES.forEach((hl) => {
      // Logaritmik/bölgesel konumlama: 90 nm .. 1900 nm
      const norm = (Math.log(hl.lambda) - Math.log(90)) / (Math.log(1950) - Math.log(90));
      const lx = 26 + norm * (w - 52);
      const isLit = histSim.recordedLines.has(hl.lambda);
      const col = wavelengthToColor(hl.lambda, isLit ? 1.0 : 0.32);

      ctx.strokeStyle = col;
      ctx.lineWidth = isLit ? 3.2 : 1.4;
      if (isLit) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(lx, specY + 24);
      ctx.lineTo(lx, specY + specH - 18);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isLit ? '#f8fafc' : '#64748b';
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hl.lambda.toFixed(0)}`, lx, specY + specH - 5);
    });
  }

  /* ==========================================================================
     ALT SEKME 1.3: NÜKLEER FİZİK, SEGRÈ DİYAGRAMI VE U-235 FİSYON TEZGAHI
     ========================================================================== */
  const fissionSim = {
    nuclei: [],
    neutrons: [],
    fragments: [],
    energyReleasedMeV: 0,
    fissionCount: 0
  };

  function resetFissionReactor() {
    fissionSim.nuclei = [];
    fissionSim.neutrons = [];
    fissionSim.fragments = [];
    fissionSim.energyReleasedMeV = 0;
    fissionSim.fissionCount = 0;

    // 4x6 = 24 adet U-235 çekirdeği ızgarası
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        fissionSim.nuclei.push({
          gx: c, gy: r,
          fissioned: false,
          excited: 0
        });
      }
    }
  }

  function triggerNuclearDecayOrNeutron() {
    if (state.fissionMode) {
      fissionSim.neutrons.push({
        x: 30,
        y: 190 + (Math.random() - 0.5) * 40,
        vx: 165,
        vy: (Math.random() - 0.5) * 30
      });
      return;
    }

    const props = calcNuclearProperties(state.nucZ, state.nucN);
    if (props.stable) return;

    if (props.mode.startsWith('α')) {
      state.nucZ = Math.max(1, state.nucZ - 2);
      state.nucN = Math.max(0, state.nucN - 2);
      fissionSim.fragments.push({ x: 0, y: 0, vx: 160, vy: -90, r: 9, color: '#f59e0b', label: 'α (⁴He²⁺)' });
    } else if (props.mode.startsWith('β⁻')) {
      state.nucZ = Math.min(118, state.nucZ + 1);
      state.nucN = Math.max(0, state.nucN - 1);
      fissionSim.fragments.push({ x: 0, y: 0, vx: 210, vy: -110, r: 5, color: '#00f2fe', label: 'β⁻ (e⁻)' });
      fissionSim.fragments.push({ x: 0, y: 0, vx: 190, vy: 110, r: 4, color: '#a855f7', label: 'ν̄ₑ' });
    } else {
      state.nucZ = Math.max(1, state.nucZ - 1);
      state.nucN = state.nucN + 1;
      fissionSim.fragments.push({ x: 0, y: 0, vx: 210, vy: -110, r: 5, color: '#ff3366', label: 'β⁺ (e⁺)' });
      fissionSim.fragments.push({ x: 0, y: 0, vx: 190, vy: 110, r: 4, color: '#a855f7', label: 'νₑ' });
    }
    updateNuclearUI();
  }

  function updateNuclearUI() {
    const el = ELEMENTS[clamp(state.nucZ, 1, 118) - 1];
    const props = calcNuclearProperties(state.nucZ, state.nucN);

    $('nucZVal').textContent = state.nucZ;
    $('nucNVal').textContent = state.nucN;
    $('nucTitleBadge').textContent = `${el.name}-${props.A} (${props.A}${el.symbol})`;
    $('telMassDefect').textContent = `${props.massDefect.toFixed(4)} u`;
    $('telTotalEb').textContent = `${props.Eb.toFixed(1)} MeV`;
    $('telEbPerA').textContent = `${props.EbPerA.toFixed(2)} MeV/nükleon`;
    $('telDecayMode').textContent = props.mode;
    $('telHalfLife').textContent = props.halfLife;

    drawSegreChart();
  }

  function drawSegreChart() {
    const canvas = $('segrePlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const pad = 26;
    const pw = w - pad * 1.5;
    const ph = h - pad * 1.5;

    // N = Z referans doğrusu
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(pad + pw * 0.65, h - pad - ph * 0.65);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kararlılık vadisi noktaları (Z = 1..95)
    for (let z = 1; z <= 95; z += 2) {
      const nOpt = z <= 20 ? z : Math.round(z + 0.0062 * Math.pow(z * 2.15, 1.65));
      const x = pad + (z / 100) * pw;
      const y = h - pad - (nOpt / 155) * ph;
      ctx.fillStyle = z <= 82 ? 'rgba(16, 185, 129, 0.65)' : 'rgba(245, 158, 11, 0.55)';
      ctx.fillRect(x - 2, y - 4, 4, 8);
    }

    // Seçili izotop noktası
    const curX = pad + (state.nucZ / 100) * pw;
    const curY = h - pad - (state.nucN / 155) * ph;
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(curX, curY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('Segrè Kararlılık Vadisi (Dikey: N, Yatay: Z)', pad, 14);
    ctx.fillText('Z (Proton) →', w - 82, h - 6);
  }

  function stepNuclearCanvas(dt) {
    const canvas = $('nuclearSimCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    if (!state.fissionMode) {
      // İzotop Çekirdeği ve Bozunum Sahnesi
      const cx = w * 0.5, cy = h * 0.5;
      const A = state.nucZ + state.nucN;
      const rand = rng(state.nucZ * 97 + state.nucN * 31);
      const R = clamp(16 + Math.cbrt(A) * 12, 20, 82);

      // Güçlü kuvvet halesi
      const g = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.45);
      g.addColorStop(0, 'rgba(255, 51, 102, 0.28)');
      g.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2); ctx.fill();

      // Nükleonları çiz
      const count = Math.min(A, 140);
      for (let i = 0; i < count; i++) {
        const rr = Math.sqrt(rand()) * R;
        const ang = rand() * Math.PI * 2;
        const jx = Math.sin(performance.now() * 0.008 + i) * 1.6;
        const jy = Math.cos(performance.now() * 0.008 + i * 1.3) * 1.6;
        const nx = cx + Math.cos(ang) * rr + jx;
        const ny = cy + Math.sin(ang) * rr + jy;
        const isProton = i < Math.round((state.nucZ / A) * count);
        ctx.fillStyle = isProton ? '#ff3366' : '#64748b';
        ctx.beginPath(); ctx.arc(nx, ny, 6.5, 0, Math.PI * 2); ctx.fill();
      }

      // Fırlayan bozunum parçacıkları
      for (let i = fissionSim.fragments.length - 1; i >= 0; i--) {
        const f = fissionSim.fragments[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(cx + f.x, cy + f.y, f.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText(f.label, cx + f.x + 12, cy + f.y + 4);
        if (Math.hypot(f.x, f.y) > w * 0.6) fissionSim.fragments.splice(i, 1);
      }
      return;
    }

    // Uranyum-235 Zincirleme Fisyon Reaktörü Kalbi
    const padX = 85, padY = 75;
    const stepX = (w - padX * 2) / 5;
    const stepY = (h - padY * 2) / 3;
    const rodDepth = (state.controlRodPct / 100) * (h - 40);

    // Kadmiyum/Bor Kontrol Çubuklarını Çiz
    ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
    ctx.strokeStyle = '#94a3b8';
    for (let c = 0; c < 5; c++) {
      const rx = padX + c * stepX + stepX * 0.5 - 6;
      ctx.fillRect(rx, 10, 12, rodDepth);
      ctx.strokeRect(rx, 10, 12, rodDepth);
    }

    // U-235 Çekirdeklerini Çiz
    fissionSim.nuclei.forEach((nuc) => {
      if (nuc.fissioned) return;
      const nx = padX + nuc.gx * stepX;
      const ny = padY + nuc.gy * stepY;
      nuc.x = nx; nuc.y = ny;

      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(nx, ny, 15, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#05070d';
      ctx.font = '800 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('²³⁵U', nx, ny + 3);
    });

    // Termal Nötronları İlerlet ve Çarpışma / Kontrol Çubuğu Yutulması Hesapla
    for (let i = fissionSim.neutrons.length - 1; i >= 0; i--) {
      const n = fissionSim.neutrons[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // Kontrol çubuğu tarafından yutulma
      let absorbedByRod = false;
      for (let c = 0; c < 5; c++) {
        const rx = padX + c * stepX + stepX * 0.5;
        if (Math.abs(n.x - rx) < 8 && n.y < 10 + rodDepth) {
          absorbedByRod = true;
          break;
        }
      }
      if (absorbedByRod) {
        fissionSim.neutrons.splice(i, 1);
        continue;
      }

      // U-235 Çekirdeğine çarpma -> Ba-141 + Kr-92 + 3 nötron + 200 MeV!
      let hit = false;
      for (const nuc of fissionSim.nuclei) {
        if (!nuc.fissioned && Math.hypot(n.x - nuc.x, n.y - nuc.y) < 18) {
          nuc.fissioned = true;
          hit = true;
          fissionSim.fissionCount++;
          fissionSim.energyReleasedMeV += 200;

          // Baryum-141 ve Kripton-92 fisyon ürünleri
          fissionSim.fragments.push(
            { x: nuc.x, y: nuc.y, vx: -55, vy: -65, r: 10, color: '#10b981', label: '¹⁴¹Ba' },
            { x: nuc.x, y: nuc.y, vx: 55, vy: 65, r: 8.5, color: '#a855f7', label: '⁹²Kr' }
          );

          // 3 Yeni Hızlı Nötron
          for (let k = 0; k < 3; k++) {
            const ang = (Math.random() - 0.5) * Math.PI * 1.4 + (k - 1) * 0.5;
            fissionSim.neutrons.push({
              x: nuc.x,
              y: nuc.y,
              vx: Math.cos(ang) * 165,
              vy: Math.sin(ang) * 165
            });
          }
          break;
        }
      }

      if (hit || n.x < 0 || n.x > w || n.y < 0 || n.y > h) {
        fissionSim.neutrons.splice(i, 1);
        continue;
      }

      ctx.fillStyle = '#00f2fe';
      ctx.beginPath(); ctx.arc(n.x, n.y, 4.5, 0, Math.PI * 2); ctx.fill();
    }

    // Fisyon ürünlerini çiz
    for (let i = fissionSim.fragments.length - 1; i >= 0; i--) {
      const f = fissionSim.fragments[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText(f.label, f.x, f.y - 12);
      if (f.x < 0 || f.x > w || f.y < 0 || f.y > h) fissionSim.fragments.splice(i, 1);
    }

    // Telemetri yazısı
    ctx.fillStyle = '#fde047';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Bölünen ²³⁵U: ${fissionSim.fissionCount}/24 · Açığa Çıkan Enerji: ${fissionSim.energyReleasedMeV} MeV · Kontrol Çubuğu: %${state.controlRodPct}`, 16, h - 14);
  }

  /* ==========================================================================
     ALT SEKME 1.4: STANDART MODEL VE HADRON (KUARK-GLUON) SENTEZLEYİCİ
     ========================================================================== */
  function buildStandardModelGrid() {
    const grid = $('smGridContainer');
    if (!grid) return;
    grid.innerHTML = SM_PARTICLES.map((p) => `
      <button class="sm-card ${state.selectedSM === p.id ? 'active' : ''}" data-sm="${p.id}" style="border-color:${p.color}55">
        <span class="sm-sym" style="color:${p.color}">${p.sym}</span>
        <span class="sm-name">${p.name.split(' ')[0]}</span>
      </button>
    `).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.sm-card');
      if (!btn) return;
      state.selectedSM = btn.dataset.sm;
      updateStandardModelUI();
    });
  }

  function resolveHadron() {
    if (state.hadronMode === 'baryon') {
      const key = [state.q1, state.q2, state.q3].sort().join('');
      return HADRONS[key] || {
        sym: 'qqq*',
        name: `Egzotik Baryon (${state.q1}${state.q2}${state.q3})`,
        type: 'Uyarılmış Baryon Durumu',
        charge: 'Kuark Toplamı',
        mass: 1380,
        quarkMass: 45,
        spin: '1/2',
        halfLife: '10⁻²³ s',
        desc: 'Kırmızı + Yeşil + Mavi renk teklisi (color singlet) kuralına uyan üçlü kuark kombinasyonu.'
      };
    } else {
      const key = `${state.q1}_${state.q2}`;
      return HADRONS[key] || {
        sym: 'qq̄*',
        name: `Mezon Durumu (${state.q1}${state.q2.replace('bar', '̄')})`,
        type: 'Mezon (Renk + Antirenk)',
        charge: 'Kuark Toplamı',
        mass: 770,
        quarkMass: 25,
        spin: '0 / 1',
        halfLife: '10⁻²³ s',
        desc: 'Kuark ve antikuarkın Renk + Antirenk = Beyaz kuralıyla bağlandığı mezon durumu.'
      };
    }
  }

  function updateStandardModelUI() {
    const grid = $('smGridContainer');
    if (grid) {
      grid.querySelectorAll('.sm-card').forEach((b) => {
        b.classList.toggle('active', b.dataset.sm === state.selectedSM);
      });
    }

    const p = SM_PARTICLES.find((x) => x.id === state.selectedSM) || SM_PARTICLES[0];
    $('smDetailTitle').textContent = `${p.name} (${p.sym})`;
    $('smDetailGroup').textContent = p.group;
    $('smDetailMass').textContent = p.mass;
    $('smDetailCharge').textContent = p.charge;
    $('smDetailSpin').textContent = p.spin;
    $('smDetailDesc').textContent = p.desc;

    // Hadron bilgilerini güncelle
    const q3Wrap = $('hadronQ3Wrap');
    if (q3Wrap) q3Wrap.hidden = state.hadronMode === 'meson';

    const q2Sel = $('hadronQ2');
    if (q2Sel) {
      if (state.hadronMode === 'meson') {
        if (!state.q2.endsWith('bar')) state.q2 = 'dbar';
        q2Sel.innerHTML = `
          <option value="ubar" ${state.q2 === 'ubar' ? 'selected' : ''}>ū (Anti-Yukarı, −2/3e, Anti-Renk)</option>
          <option value="dbar" ${state.q2 === 'dbar' ? 'selected' : ''}>d̄ (Anti-Aşağı, +1/3e, Anti-Renk)</option>
          <option value="sbar" ${state.q2 === 'sbar' ? 'selected' : ''}>s̄ (Anti-Garip, +1/3e, Anti-Renk)</option>`;
      } else {
        if (state.q2.endsWith('bar')) state.q2 = 'u';
        q2Sel.innerHTML = `
          <option value="u" ${state.q2 === 'u' ? 'selected' : ''}>u (Yukarı, +2/3e, Yeşil)</option>
          <option value="d" ${state.q2 === 'd' ? 'selected' : ''}>d (Aşağı, −1/3e, Yeşil)</option>
          <option value="s" ${state.q2 === 's' ? 'selected' : ''}>s (Garip, −1/3e, Yeşil)</option>`;
      }
    }

    const had = resolveHadron();
    $('hadronResultTitle').textContent = `${had.name} (${had.sym})`;
    $('hadronResultMeta').textContent = `${had.type} · Yük: ${had.charge} · Spin: ${had.spin} · Kütle: ${had.mass} MeV/c²`;
    $('hadronResultDesc').textContent = had.desc;

    const qPct = ((had.quarkMass / had.mass) * 100).toFixed(1);
    const gPct = (100 - parseFloat(qPct)).toFixed(1);
    $('telHiggsMassPct').textContent = `%${qPct} (${had.quarkMass} MeV)`;
    $('telGluonMassPct').textContent = `%${gPct} (${(had.mass - had.quarkMass).toFixed(1)} MeV)`;
  }

  function stepHadronCanvas(dt) {
    const canvas = $('hadronSimCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.46;
    const t = performance.now() * 0.003;
    const had = resolveHadron();

    // QCD Hapis Alanı
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 130);
    g.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
    g.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.fill();

    const pts = state.hadronMode === 'baryon'
      ? [
          { q: state.q1, col: '#ff3366', cName: 'Kırmızı', x: cx - 72 + Math.sin(t) * 8, y: cy - 42 + Math.cos(t) * 8 },
          { q: state.q2, col: '#10b981', cName: 'Yeşil', x: cx + 72 + Math.cos(t * 1.1) * 8, y: cy - 42 + Math.sin(t * 1.1) * 8 },
          { q: state.q3, col: '#00f2fe', cName: 'Mavi', x: cx + Math.sin(t * 0.9) * 8, y: cy + 68 + Math.cos(t * 0.9) * 8 }
        ]
      : [
          { q: state.q1, col: '#ff3366', cName: 'Kırmızı', x: cx - 78 + Math.sin(t) * 8, y: cy + Math.cos(t) * 8 },
          { q: state.q2.replace('bar', '̄'), col: '#00f2fe', cName: 'Anti-Kırmızı', x: cx + 78 - Math.sin(t) * 8, y: cy - Math.cos(t) * 8 }
        ];

    // Gluon yayları
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      ctx.beginPath();
      for (let s = 0; s <= 24; s++) {
        const u = s / 24;
        const lx = a.x + (b.x - a.x) * u + Math.sin(u * Math.PI * 6 + t * 5) * 6;
        const ly = a.y + (b.y - a.y) * u + Math.cos(u * Math.PI * 6 + t * 5) * 6;
        if (s === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }

    // Kuark küreleri
    pts.forEach((p) => {
      ctx.fillStyle = p.col;
      ctx.shadowColor = p.col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.q, p.x, p.y + 5);
      ctx.font = '600 10px Inter';
      ctx.fillText(p.cName, p.x, p.y + 38);
    });

    // Alt Kütle Kökeni Barı (%99 Gluon Enerjisi vs %1 Higgs Kuark Kütlesi)
    const barY = h - 46;
    const barW = w - 60;
    const qFrac = clamp(had.quarkMass / had.mass, 0.01, 0.99);
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(30, barY, barW * qFrac, 14);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(30 + barW * qFrac, barY, barW * (1 - qFrac), 14);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${had.name} (${had.sym}) Kütle Dağılımı: Çıplak Kuark Kütlesi ${had.quarkMass} MeV · QCD Gluon Bağlanma Enerjisi ${(had.mass - had.quarkMass).toFixed(1)} MeV`,
      30, barY - 6
    );
  }

  /* ==========================================================================
     PERİYODİK TABLO 118 ELEMENT MODAL KURULUMU
     ========================================================================== */
  function initPeriodicTableModal() {
    const grid = $('ptableModalGrid');
    const modal = $('ptableModalBackdrop');
    if (!grid || !modal) return;

    grid.innerHTML = ELEMENTS.map((el) => {
      const catCol = CATS[el.cat].color;
      return `
        <button class="pt-cell" data-z="${el.Z}" style="grid-column:${el.col};grid-row:${el.row};border-color:${catCol}66">
          <small>${el.Z}</small>
          <b style="color:${catCol}">${el.symbol}</b>
          <span>${el.name}</span>
        </button>`;
    }).join('');

    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.pt-cell');
      if (!cell) return;
      const z = +cell.dataset.z;
      selectElementForAtom(z);
      modal.hidden = true;
    });

    $('openPtableModalBtn')?.addEventListener('click', () => {
      modal.hidden = false;
    });
    $('closePtableModalBtn')?.addEventListener('click', () => {
      modal.hidden = true;
    });
  }

  /* ==========================================================================
     MODÜL 1 BAŞLATICI VE ALT SEKME YÖNLENDİRİCİSİ
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod1 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['1_1', '1_2', '1_3', '1_4'].forEach((id) => {
      const pane = $(`mod1_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });

    if (viewer3d) viewer3d.setRunning(subId === '1_1');
    if (subId === '1_1') updateAtomUI();
    else if (subId === '1_2') fireHistoricalParticle();
    else if (subId === '1_3') updateNuclearUI();
    else if (subId === '1_4') updateStandardModelUI();
  }

  function init() {
    // Element açılır listesini doldur
    const selEl = $('atomElementSelect');
    if (selEl) {
      selEl.innerHTML = ELEMENTS.map((e) =>
        `<option value="${e.Z}" ${e.Z === state.Z ? 'selected' : ''}>${e.Z}. ${e.name} (${e.symbol}) — ${e.configStr}</option>`
      ).join('');
      selEl.addEventListener('change', () => selectElementForAtom(+selEl.value));
    }

    initPeriodicTableModal();

    // 3B Sahneyi Başlat
    viewer3d = createViewer3D($('atom3DStage'), { distance: 14.5, tilt: 0.35, spin: -0.5 });

    // Kuantum Sayıları Kontrolleri
    $('qnN')?.addEventListener('input', (e) => {
      state.n = +e.target.value;
      updateAtomUI();
    });
    $('qnL')?.addEventListener('change', (e) => {
      state.l = +e.target.value;
      updateAtomUI();
    });
    $('qnMl')?.addEventListener('change', (e) => {
      state.ml = +e.target.value;
      updateAtomUI();
    });

    // Görünüm Modu Butonları
    document.querySelectorAll('[data-atom-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.viewMode = btn.dataset.atomView;
        document.querySelectorAll('[data-atom-view]').forEach((b) =>
          b.classList.toggle('active', b.dataset.atomView === state.viewMode)
        );
        updateAtomUI();
      });
    });

    // Derinlik Zoom Kademeleri (1: Atom, 2: Çekirdek, 3: Kuark-Gluon)
    document.querySelectorAll('[data-zoom-stage]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.zoomStage = +btn.dataset.zoomStage;
        document.querySelectorAll('[data-zoom-stage]').forEach((b) =>
          b.classList.toggle('active', +b.dataset.zoomStage === state.zoomStage)
        );
        updateAtomUI();
      });
    });

    // Antimadde Geçiş Butonu
    $('toggleAntimatterBtn')?.addEventListener('click', (e) => {
      state.antimatter = !state.antimatter;
      e.currentTarget.classList.toggle('active', state.antimatter);
      e.currentTarget.textContent = state.antimatter
        ? '⚡ Antimadde Modu: AKTİF (Pozitron / Antiproton)'
        : '🌌 Antimadde (Antiatom) Moduna Geç';
      updateAtomUI();
    });

    // 1.2 Kontrolleri
    document.querySelectorAll('[data-hist-model]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.histModel = btn.dataset.histModel;
        document.querySelectorAll('[data-hist-model]').forEach((b) =>
          b.classList.toggle('active', b.dataset.histModel === state.histModel)
        );
      });
    });
    document.querySelectorAll('[data-gun-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.gunType = btn.dataset.gunType;
        document.querySelectorAll('[data-gun-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.gunType === state.gunType)
        );
      });
    });
    $('histLambdaSlider')?.addEventListener('input', (e) => {
      state.photonLambda = +e.target.value;
      $('histLambdaVal').textContent = `${state.photonLambda} nm`;
    });
    $('histWhiteLightChk')?.addEventListener('change', (e) => {
      state.whiteLight = e.target.checked;
    });
    $('histMultiNucChk')?.addEventListener('change', (e) => {
      state.multiNuclei = e.target.checked;
    });
    $('fireHistGunBtn')?.addEventListener('click', fireHistoricalParticle);

    // 1.3 Kontrolleri
    $('nucZSlider')?.addEventListener('input', (e) => {
      state.nucZ = +e.target.value;
      updateNuclearUI();
    });
    $('nucNSlider')?.addEventListener('input', (e) => {
      state.nucN = +e.target.value;
      updateNuclearUI();
    });
    $('nucPresetSelect')?.addEventListener('change', (e) => {
      const [z, n] = e.target.value.split('_').map(Number);
      state.nucZ = z; state.nucN = n;
      $('nucZSlider').value = z;
      $('nucNSlider').value = n;
      state.fissionMode = false;
      updateNuclearUI();
    });
    $('toggleFissionModeBtn')?.addEventListener('click', (e) => {
      state.fissionMode = !state.fissionMode;
      e.currentTarget.classList.toggle('active', state.fissionMode);
      if (state.fissionMode) resetFissionReactor();
    });
    $('controlRodSlider')?.addEventListener('input', (e) => {
      state.controlRodPct = +e.target.value;
      $('controlRodVal').textContent = `%${state.controlRodPct}`;
    });
    $('triggerDecayBtn')?.addEventListener('click', triggerNuclearDecayOrNeutron);
    $('resetFissionBtn')?.addEventListener('click', resetFissionReactor);

    // 1.4 Kontrolleri
    buildStandardModelGrid();
    document.querySelectorAll('[data-hadron-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.hadronMode = btn.dataset.hadronMode;
        document.querySelectorAll('[data-hadron-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.hadronMode === state.hadronMode)
        );
        updateStandardModelUI();
      });
    });
    ['hadronQ1', 'hadronQ2', 'hadronQ3'].forEach((id, idx) => {
      $(id)?.addEventListener('change', (e) => {
        state[`q${idx + 1}`] = e.target.value;
        updateStandardModelUI();
      });
    });

    // Alt sekme butonları
    document.querySelectorAll('#mod1 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    resetFissionReactor();
    updateAtomUI();
    updateNuclearUI();
    updateStandardModelUI();

    // 2B Alt Sekmeler İçin Animasyon Döngüsü
    let lastT = performance.now();
    function loop2D(now) {
      requestAnimationFrame(loop2D);
      const mod1El = $('mod1');
      if (!mod1El || !mod1El.classList.contains('active')) return;
      const dt = Math.min(0.04, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '1_2') stepHistoricalSim(dt);
      else if (state.activeSub === '1_3') stepNuclearCanvas(dt);
      else if (state.activeSub === '1_4') stepHadronCanvas(dt);
    }
    requestAnimationFrame(loop2D);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '1_1') {
      if (preset.n) { state.n = preset.n; $('qnN').value = preset.n; }
      if (preset.l != null) state.l = preset.l;
      if (preset.ml != null) state.ml = preset.ml;
      if (preset.viewMode) {
        state.viewMode = preset.viewMode;
        document.querySelectorAll('[data-atom-view]').forEach((b) =>
          b.classList.toggle('active', b.dataset.atomView === state.viewMode)
        );
      }
      if (preset.zoomStage) {
        state.zoomStage = preset.zoomStage;
        document.querySelectorAll('[data-zoom-stage]').forEach((b) =>
          b.classList.toggle('active', +b.dataset.zoomStage === state.zoomStage)
        );
      }
      updateAtomUI();
    } else if (preset.sub === '1_2') {
      if (preset.model) {
        state.histModel = preset.model;
        document.querySelectorAll('[data-hist-model]').forEach((b) =>
          b.classList.toggle('active', b.dataset.histModel === state.histModel)
        );
      }
      if (preset.gun) {
        state.gunType = preset.gun;
        document.querySelectorAll('[data-gun-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.gunType === state.gunType)
        );
      }
      fireHistoricalParticle();
    } else if (preset.sub === '1_3') {
      if (preset.Z) { state.nucZ = preset.Z; $('nucZSlider').value = preset.Z; }
      if (preset.N != null) { state.nucN = preset.N; $('nucNSlider').value = preset.N; }
      state.fissionMode = !!preset.fissionMode;
      $('toggleFissionModeBtn')?.classList.toggle('active', state.fissionMode);
      if (preset.rodPct != null) {
        state.controlRodPct = preset.rodPct;
        $('controlRodSlider').value = preset.rodPct;
        $('controlRodVal').textContent = `%${preset.rodPct}`;
      }
      if (state.fissionMode) {
        resetFissionReactor();
        triggerNuclearDecayOrNeutron();
      }
      updateNuclearUI();
    } else if (preset.sub === '1_4') {
      if (preset.mode) {
        state.hadronMode = preset.mode;
        document.querySelectorAll('[data-hadron-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.hadronMode === state.hadronMode)
        );
      }
      if (preset.q1) { state.q1 = preset.q1; $('hadronQ1').value = preset.q1; }
      if (preset.q2) { state.q2 = preset.q2; }
      if (preset.q3) { state.q3 = preset.q3; $('hadronQ3').value = preset.q3; }
      updateStandardModelUI();
    }
  }

  window.Mod1Atom = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`,
    setRunning: (r) => viewer3d && viewer3d.setRunning(r && state.activeSub === '1_1'),
    getViewer3D: () => viewer3d,
    getState: () => state,
    updateUI: updateAtomUI,
    selectElement: selectElementForAtom
  };
})();
