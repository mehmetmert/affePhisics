/* ============================================================================
   affePhysics — MODÜL 2: "Canlı Cam" Laboratuvarı
   1. Wilson Bulut Odası (Cloud Chamber)
   2. J.J. Thomson Katot Işını Cam Tüpü (Crookes Tüpü, e/m)
   3. Einstein Fotoelektrik Etki Cam Hücresi (1905)
   4. Millikan Yağ Damlası Mikroskop Vizörü (1909)
   ============================================================================ */
(function () {
  'use strict';

  const { PHOTO_METALS } = window.PhysData;
  const { clamp, wavelengthToColor, fitCanvas, drawVectorArrow } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '2_1',
    // 2.1: Wilson Bulut Odası
    ccSource: 'mixed', // 'alpha' | 'beta' | 'muon' | 'mixed'
    ccB: 0.8,          // Tesla (dış manyetik alan)
    ccTemp: -42,       // °C
    // 2.2: J.J. Thomson Crookes Tüpü
    thVacc: 2500,      // V (Hızlandırıcı anot gerilimi)
    thE: 18,           // kV/m (Elektrik alan)
    thB: 0.65,         // mT (Manyetik alan)
    // 2.3: Fotoelektrik Etki
    peMetal: 'na',
    peLambda: 400,     // nm
    peIntensity: 75,   // %
    peVoltage: 0.5,    // V
    // 2.4: Millikan Yağ Damlası
    mlVoltage: 320,    // V
    mlPlateDist: 0.005 // 5 mm
  };

  /* ==========================================================================
     2.1. WILSON BULUT ODASI (CLOUD CHAMBER)
     ========================================================================== */
  const tracks = [];
  const vaporDots = [];
  for (let i = 0; i < 120; i++) {
    vaporDots.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 1.4, vy: 0.03 + Math.random() * 0.05 });
  }

  function spawnCloudTrack(w, h) {
    const cx = w * 0.14;
    const cy = h * 0.5;
    let type = state.ccSource;
    if (type === 'mixed') {
      const r = Math.random();
      type = r < 0.38 ? 'alpha' : (r < 0.78 ? 'beta' : 'muon');
    }

    if (type === 'alpha') {
      const ang = (Math.random() - 0.5) * 0.85;
      const speed = 170 + Math.random() * 45;
      tracks.push({
        type: 'α (⁴He²⁺)',
        q: +2,
        mass: 4.0,
        x: cx,
        y: cy + (Math.random() - 0.5) * 16,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.25,
        width: 5.2,
        color: 'rgba(248, 250, 252, 0.92)',
        glow: '#f59e0b',
        pts: [[cx, cy]]
      });
    } else if (type === 'beta') {
      const isPositron = Math.random() < 0.42;
      const ang = (Math.random() - 0.5) * 0.9;
      const speed = 250 + Math.random() * 60;
      tracks.push({
        type: isPositron ? 'β⁺ (e⁺)' : 'β⁻ (e⁻)',
        q: isPositron ? +1 : -1,
        mass: 0.18,
        x: cx,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 0,
        maxLife: 1.35,
        width: 1.9,
        color: isPositron ? 'rgba(255, 100, 140, 0.88)' : 'rgba(165, 243, 252, 0.9)',
        glow: isPositron ? '#ff3366' : '#00f2fe',
        pts: [[cx, cy]]
      });
    } else {
      // Kozmik Müon: rastgele kenardan girer, yüksek enerjilidir
      const sx = w * (0.2 + Math.random() * 0.7);
      const sy = 15;
      const ang = Math.PI * 0.5 + (Math.random() - 0.5) * 0.55;
      const speed = 340;
      tracks.push({
        type: 'μ⁻ (Kozmik Müon)',
        q: -1,
        mass: 1.8,
        x: sx,
        y: sy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 0,
        maxLife: 1.3,
        width: 2.4,
        color: 'rgba(192, 132, 252, 0.92)',
        glow: '#a855f7',
        pts: [[sx, sy]]
      });
    }
  }

  function stepCloudChamber(dt) {
    const canvas = $('ccCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    // Koyu buzlu cam hazne arka planı
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, w * 0.6);
    bg.addColorStop(0, '#0b1528');
    bg.addColorStop(1, '#04070e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Manyetik alan sembolleri (⊙ dışarı veya ⊗ içeri)
    if (Math.abs(state.ccB) > 0.05) {
      ctx.fillStyle = 'rgba(0, 242, 254, 0.16)';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      const sym = state.ccB > 0 ? '⊙' : '⊗';
      for (let x = 60; x < w - 40; x += 70) {
        for (let y = 50; y < h - 40; y += 65) {
          ctx.fillText(sym, x, y);
        }
      }
    }

    // Alkol buharı damlacıkları
    ctx.fillStyle = 'rgba(203, 213, 225, 0.16)';
    vaporDots.forEach((v) => {
      v.y = (v.y + v.vy * dt) % 1.0;
      ctx.beginPath();
      ctx.arc(v.x * w, v.y * h, v.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Radyoaktif kaynak muhafazası (Sol taraf)
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.fillRect(14, h * 0.5 - 26, 48, 52);
    ctx.strokeRect(14, h * 0.5 - 26, 48, 52);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillText('☢ KAYNAK', 18, h * 0.5 + 4);

    if (Math.random() < 0.14) spawnCloudTrack(w, h);

    // İzleri ilerlet ve çiz
    for (let i = tracks.length - 1; i >= 0; i--) {
      const tr = tracks[i];
      tr.life += dt;
      if (tr.life < tr.maxLife) {
        // Lorentz kuvveti: a = (q * B / m) * (v × B_z)
        const omega = (tr.q * state.ccB * 1.45) / tr.mass;
        const ax = omega * tr.vy;
        const ay = -omega * tr.vx;
        tr.vx += ax * dt;
        tr.vy += ay * dt;
        // Hafif viskoz yavaşlama
        tr.vx *= 1 - 0.18 * dt;
        tr.vy *= 1 - 0.18 * dt;
        tr.x += tr.vx * dt;
        tr.y += tr.vy * dt;
        tr.pts.push([tr.x, tr.y]);
      }

      const fade = clamp(1 - (tr.life - tr.maxLife) / 1.8, 0, 1);
      if (fade <= 0) {
        tracks.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = tr.color;
      ctx.shadowColor = tr.glow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = tr.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      tr.pts.forEach(([px, py], idx) => {
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const last = tr.pts[tr.pts.length - 1];
      if (last) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(tr.type, last[0] + 6, last[1] - 4);
      }
      ctx.restore();
    }

    // Cam hazne çerçevesi yansıması
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  /* ==========================================================================
     2.2. J.J. THOMSON KATOT IŞINI CAM TÜPÜ (CROOKES TÜPÜ - 1897)
     ========================================================================== */
  function stepThomsonTube() {
    const canvas = $('thomsonCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cy = h * 0.5;
    const eOverM = 1.7588e11; // C/kg
    const vx = Math.sqrt(2 * eOverM * state.thVacc); // m/s (yaklaşık 2.9e7 m/s)
    const Efield = state.thE * 1000; // V/m
    const Bfield = state.thB * 0.001; // T

    // Cam Crookes Tüpü Gövdesi
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 226, 255, 0.42)';
    ctx.fillStyle = 'rgba(15, 28, 52, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(35, cy - 85, w - 70, 170, 48);
    ctx.fill();
    ctx.stroke();

    // Katot ve Anot Kolimatörü
    ctx.fillStyle = '#64748b';
    ctx.fillRect(55, cy - 32, 16, 64);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(115, cy - 45, 10, 34);
    ctx.fillRect(115, cy + 11, 10, 34);

    // Saptırma Plakaları (+ ve −)
    const plateX1 = w * 0.34;
    const plateX2 = w * 0.64;
    ctx.fillStyle = state.thE >= 0 ? '#ff3366' : '#00f2fe';
    ctx.fillRect(plateX1, cy - 58, plateX2 - plateX1, 8);
    ctx.fillStyle = state.thE >= 0 ? '#00f2fe' : '#ff3366';
    ctx.fillRect(plateX1, cy + 50, plateX2 - plateX1, 8);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(`Saptırma Plakası E = ${state.thE.toFixed(1)} kV/m`, plateX1, cy - 66);

    // Helmholtz Bobini Çemberi
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.48)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc((plateX1 + plateX2) * 0.5, cy, 72, 0, Math.PI * 2);
    ctx.stroke();

    // Yeşil Floresan Katot Işını (Elektron Demeti) Yörüngesi
    // Net ivme: a_y = (e/m) * (E - v_x * B)
    const netAccelNorm = (Efield - vx * Bfield) / 28000;
    const screenX = w - 55;
    let curY = cy;
    let vy = 0;

    ctx.beginPath();
    ctx.moveTo(65, cy);
    for (let x = 65; x <= screenX; x += 4) {
      if (x >= plateX1 && x <= plateX2) {
        vy -= netAccelNorm * 0.055;
      }
      curY = clamp(curY + vy * 0.25, cy - 76, cy + 76);
      ctx.lineTo(x, curY);
    }
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fosforlu Ekran Üzerinde Parlayan Çarpma Noktası
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#34d399'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(screenX, curY, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Telemetri Güncellemesi
    const deflectionMm = ((cy - curY) * 0.45).toFixed(1);
    const vWien = Math.abs(Bfield) > 1e-5 ? (Efield / Math.abs(Bfield)) : 0;
    $('telThVelocity').textContent = `${(vx / 1e7).toFixed(2)} × 10⁷ m/s`;
    $('telThDeflection').textContent = `${deflectionMm} mm`;
    $('telThWien').textContent = Bfield !== 0 ? `${(vWien / 1e7).toFixed(2)} × 10⁷ m/s` : '—';
    $('telThEM').textContent = `1,759 × 10¹¹ C/kg`;
  }

  /* ==========================================================================
     2.3. EINSTEIN FOTOELEKTRİK ETKİ CAM HÜCRESİ (1905)
     ========================================================================== */
  const photoElectrons = [];

  function stepPhotoelectric(dt) {
    const canvas = $('photoCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const metal = PHOTO_METALS.find((m) => m.id === state.peMetal) || PHOTO_METALS[0];
    const Ephoton = 1239.84 / state.peLambda; // eV
    const EkMax = Math.max(0, Ephoton - metal.W);
    const Vstop = EkMax; // V
    const thresholdLambda = 1239.84 / metal.W;

    // Akım hesabı
    let currentMicroA = 0;
    if (Ephoton >= metal.W && state.peVoltage >= -Vstop) {
      const vFactor = state.peVoltage >= 0
        ? 1.0
        : clamp(1 + state.peVoltage / Math.max(0.01, Vstop), 0, 1);
      currentMicroA = (state.peIntensity / 100) * (1.2 + EkMax * 0.65) * vFactor * 100;
    }

    // Vakumlu Kuvars Cam Tüp Çizimi
    const cy = h * 0.46;
    const tubeL = 90, tubeR = w - 90;
    ctx.strokeStyle = 'rgba(148, 226, 255, 0.45)';
    ctx.fillStyle = 'rgba(12, 22, 42, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(tubeL, cy - 75, tubeR - tubeL, 150, 65);
    ctx.fill();
    ctx.stroke();

    // Katot Metali (Sol) ve Anot Plakası (Sağ)
    const cathX = tubeL + 36;
    const anodeX = tubeR - 36;
    ctx.fillStyle = metal.color;
    ctx.fillRect(cathX - 8, cy - 50, 12, 100);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(anodeX - 4, cy - 50, 10, 100);

    // Üstten Gelen Monokromatik Işık Demeti (Fotonlar)
    const beamCol = wavelengthToColor(state.peLambda, 0.35 + (state.peIntensity / 220));
    if (state.peIntensity > 0) {
      ctx.fillStyle = beamCol;
      ctx.beginPath();
      ctx.moveTo(tubeL + 10, 10);
      ctx.lineTo(tubeL + 95, 10);
      ctx.lineTo(cathX + 6, cy + 36);
      ctx.lineTo(cathX + 4, cy - 36);
      ctx.closePath();
      ctx.fill();
    }

    // Fotoelektron üretimi
    if (Ephoton >= metal.W && state.peIntensity > 0 && Math.random() < (state.peIntensity / 100) * 0.45) {
      const eKin = Math.random() * EkMax;
      const v0 = 90 + Math.sqrt(eKin) * 85;
      photoElectrons.push({
        x: cathX + 6,
        y: cy + (Math.random() - 0.5) * 76,
        vx: v0,
        vy: (Math.random() - 0.5) * 18
      });
    }

    // Fotoelektronları ilerlet (Elektrik alan ivmesi: a_x ∝ V)
    const accelX = state.peVoltage * 72;
    for (let i = photoElectrons.length - 1; i >= 0; i--) {
      const pe = photoElectrons[i];
      pe.vx += accelX * dt;
      pe.x += pe.vx * dt;
      pe.y += pe.vy * dt;

      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(pe.x, pe.y, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      if (pe.x >= anodeX || pe.x < cathX) {
        photoElectrons.splice(i, 1);
      }
    }

    // Alt Devre & Mikroampermetre
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cathX, cy + 50);
    ctx.lineTo(cathX, h - 28);
    ctx.lineTo(anodeX, h - 28);
    ctx.lineTo(anodeX, cy + 50);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(w * 0.5 - 85, h - 44, 170, 28);
    ctx.strokeStyle = '#00f2fe';
    ctx.strokeRect(w * 0.5 - 85, h - 44, 170, 28);
    ctx.fillStyle = '#00f2fe';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Ampermetre: ${currentMicroA.toFixed(1)} μA`, w * 0.5, h - 26);

    // Durum Uyarı Mesajı
    ctx.font = '700 11.5px Inter';
    if (Ephoton < metal.W) {
      ctx.fillStyle = '#ff3366';
      ctx.fillText(`⚠️ E_foton (${Ephoton.toFixed(2)} eV) < W (${metal.W.toFixed(2)} eV): Eşik Aşılamadı — Elektron Kopmaz!`, w * 0.5, 24);
    } else if (state.peVoltage < -Vstop) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`🛑 Durdurma Potansiyeli Aşıldı (V < −${Vstop.toFixed(2)} V): Elektronlar Anoda Ulaşamıyor!`, w * 0.5, 24);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.fillText(`✅ Fotoelektrik Akım Aktif: E_k,max = ${EkMax.toFixed(2)} eV · λ_eşik = ${thresholdLambda.toFixed(0)} nm`, w * 0.5, 24);
    }

    // Telemetri ve E_k - f Grafiği
    $('telPePhotonE').textContent = `${Ephoton.toFixed(2)} eV`;
    $('telPeWorkFn').textContent = `${metal.W.toFixed(2)} eV (${thresholdLambda.toFixed(0)} nm)`;
    $('telPeEkMax').textContent = `${EkMax.toFixed(2)} eV`;
    $('telPeCurrent').textContent = `${currentMicroA.toFixed(1)} μA`;

    drawPhotoPlot(metal, Ephoton, EkMax);
  }

  function drawPhotoPlot(metal, Ephoton, EkMax) {
    const canvas = $('photoPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const padL = 34, padR = 14, padT = 16, padB = 24;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    // Eksenler: Yatay E_foton (0..9 eV), Dikey E_k,max (0..6 eV)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph);
    ctx.stroke();

    // E_k = hf - W doğrusu
    const x0 = padL + (metal.W / 9.0) * pw;
    const xMax = padL + pw;
    const yMax = padT + ph - ((9.0 - metal.W) / 6.0) * ph;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT + ph);
    ctx.lineTo(x0, padT + ph);
    ctx.lineTo(xMax, yMax);
    ctx.stroke();

    // Mevcut çalışma noktası
    const cx = padL + clamp(Ephoton / 9.0, 0, 1) * pw;
    const cy = padT + ph - clamp(EkMax / 6.0, 0, 1) * ph;
    ctx.fillStyle = Ephoton >= metal.W ? '#10b981' : '#ff3366';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('E_k,max = hf − W (Eğim = Planck Sabiti h)', padL + 6, padT + 10);
    ctx.fillText(`f₀ (${metal.W} eV)`, Math.max(padL, x0 - 18), h - 6);
  }

  /* ==========================================================================
     2.4. MILLIKAN YAĞ DAMLASI MİKROSKOP VİZÖRÜ (1909)
     ========================================================================== */
  const oilDrop = {
    y: 0,       // merkezden sapma (piksel)
    vy: 0,
    nElectrons: 3,
    massKg: 1.96e-14,
    measuredHistory: [3.204, 4.806, 1.602, 6.408]
  };

  function spawnNewOilDrop() {
    oilDrop.y = -40;
    oilDrop.vy = 0;
    oilDrop.nElectrons = 1 + Math.floor(Math.random() * 5); // 1e .. 5e
    const mult = 0.85 + Math.random() * 0.4;
    oilDrop.massKg = 1.6e-14 * mult;
    updateMillikanTelemetry();
  }

  function autoBalanceMillikan() {
    const g = 9.81;
    const eCharge = 1.60217663e-19;
    const q = oilDrop.nElectrons * eCharge;
    const Veq = (oilDrop.massKg * g * state.mlPlateDist) / q;
    state.mlVoltage = clamp(Math.round(Veq), 50, 900);
    const sl = $('mlVoltageSlider');
    if (sl) sl.value = state.mlVoltage;
    $('mlVoltageVal').textContent = `${state.mlVoltage} V`;
    oilDrop.vy = 0;
    const qMeasured = (oilDrop.nElectrons * 1.602).toFixed(3);
    if (!oilDrop.measuredHistory.includes(+qMeasured)) {
      oilDrop.measuredHistory.unshift(+qMeasured);
      if (oilDrop.measuredHistory.length > 6) oilDrop.measuredHistory.pop();
    }
    updateMillikanTelemetry();
  }

  function updateMillikanTelemetry() {
    const g = 9.81;
    const eCharge = 1.60217663e-19;
    const Fg = oilDrop.massKg * g;
    const qTrue = oilDrop.nElectrons * eCharge;
    const Fe = qTrue * (state.mlVoltage / state.mlPlateDist);
    const qCalc = (Fg * state.mlPlateDist) / Math.max(1, state.mlVoltage);

    $('telMlFg').textContent = `${(Fg * 1e13).toFixed(2)} × 10⁻¹³ N`;
    $('telMlFe').textContent = `${(Fe * 1e13).toFixed(2)} × 10⁻¹³ N`;
    $('telMlQ').textContent = `${(qTrue * 1e19).toFixed(3)} × 10⁻¹⁹ C`;
    $('telMlN').textContent = `n = ${oilDrop.nElectrons} elektron (${oilDrop.nElectrons}·e)`;
  }

  function stepMillikan(dt) {
    const canvas = $('millikanCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.5;
    const R = Math.min(w, h) * 0.42;

    // Kuvvet hesabı
    const g = 9.81;
    const eCharge = 1.60217663e-19;
    const Fg = oilDrop.massKg * g;
    const qTrue = oilDrop.nElectrons * eCharge;
    const Fe = qTrue * (state.mlVoltage / state.mlPlateDist);
    // Stokes viskoz direnç ile terminal hıza yaklaşım
    const netForceNorm = (Fg - Fe) / Fg; // + ise aşağı, - ise yukarı
    const targetVy = netForceNorm * 65;
    oilDrop.vy += (targetVy - oilDrop.vy) * Math.min(1, dt * 8);
    oilDrop.y = clamp(oilDrop.y + oilDrop.vy * dt, -R + 28, R - 28);

    // Dairesel Mikroskop Merceği Vizörü
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#091326';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.stroke();
    ctx.clip();

    // Mikrometre Retikül Çizgileri
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    for (let dy = -R; dy <= R; dy += 24) {
      const wTick = dy % 48 === 0 ? 36 : 16;
      ctx.beginPath();
      ctx.moveTo(cx - wTick, cy + dy);
      ctx.lineTo(cx + wTick, cy + dy);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.stroke();

    // Üst (+) ve Alt (−) Kondansatör Plakaları
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(cx - R, cy - R + 6, R * 2, 12);
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(cx - R, cy + R - 18, R * 2, 12);

    // Yağ Damlası ve Kuvvet Vektörleri
    const dy = cy + oilDrop.y;
    drawVectorArrow(ctx, cx, dy, cx, dy + 48, '#ff3366', 'F_g = mg');
    const feLen = clamp((Fe / Fg) * 48, 6, 95);
    drawVectorArrow(ctx, cx, dy, cx, dy - feLen, '#00f2fe', 'F_e = qE');

    // Altın sarısı parlayan yağ damlacığı
    const dropGrad = ctx.createRadialGradient(cx - 3, dy - 3, 1, cx, dy, 11);
    dropGrad.addColorStop(0, '#fef08a');
    dropGrad.addColorStop(0.6, '#f59e0b');
    dropGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = dropGrad;
    ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(cx, dy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Denge durumu rozeti
    const isBalanced = Math.abs(netForceNorm) < 0.025;
    ctx.fillStyle = isBalanced ? '#10b981' : '#f59e0b';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      isBalanced
        ? `✅ ASKI DENGESİ SAĞLANDI (v ≈ 0): q = ${oilDrop.nElectrons}·e = ${(oilDrop.nElectrons * 1.602).toFixed(3)} × 10⁻¹⁹ C`
        : `Damlacık Hızı v_y = ${oilDrop.vy.toFixed(1)} μm/s (Denge için V ayarlayın)`,
      cx, h - 12
    );
  }

  /* ==========================================================================
     MODÜL 2 BAŞLATICI VE ALT SEKME KONTROLÜ
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod2 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['2_1', '2_2', '2_3', '2_4'].forEach((id) => {
      const pane = $(`mod2_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
    if (subId === '2_4') updateMillikanTelemetry();
  }

  function init() {
    // 2.1 Kontrolleri
    document.querySelectorAll('[data-cc-source]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.ccSource = btn.dataset.ccSource;
        document.querySelectorAll('[data-cc-source]').forEach((b) =>
          b.classList.toggle('active', b.dataset.ccSource === state.ccSource)
        );
      });
    });
    $('ccBSlider')?.addEventListener('input', (e) => {
      state.ccB = +e.target.value;
      $('ccBVal').textContent = `${state.ccB.toFixed(2)} T`;
    });

    // 2.2 Kontrolleri
    $('thVaccSlider')?.addEventListener('input', (e) => {
      state.thVacc = +e.target.value;
      $('thVaccVal').textContent = `${state.thVacc} V`;
    });
    $('thESlider')?.addEventListener('input', (e) => {
      state.thE = +e.target.value;
      $('thEVal').textContent = `${state.thE.toFixed(1)} kV/m`;
    });
    $('thBSlider')?.addEventListener('input', (e) => {
      state.thB = +e.target.value;
      $('thBVal').textContent = `${state.thB.toFixed(2)} mT`;
    });
    $('thWienBalanceBtn')?.addEventListener('click', () => {
      const eOverM = 1.7588e11;
      const vx = Math.sqrt(2 * eOverM * state.thVacc);
      const B = Math.max(0.2, Math.abs(state.thB)) * 0.001;
      state.thB = Math.max(0.2, Math.abs(state.thB));
      state.thE = +((vx * B) / 1000).toFixed(1);
      $('thESlider').value = state.thE;
      $('thEVal').textContent = `${state.thE.toFixed(1)} kV/m`;
      $('thBSlider').value = state.thB;
      $('thBVal').textContent = `${state.thB.toFixed(2)} mT`;
    });

    // 2.3 Kontrolleri
    $('peMetalSelect')?.addEventListener('change', (e) => {
      state.peMetal = e.target.value;
    });
    $('peLambdaSlider')?.addEventListener('input', (e) => {
      state.peLambda = +e.target.value;
      $('peLambdaVal').textContent = `${state.peLambda} nm`;
    });
    $('peIntensitySlider')?.addEventListener('input', (e) => {
      state.peIntensity = +e.target.value;
      $('peIntensityVal').textContent = `%${state.peIntensity}`;
    });
    $('peVoltageSlider')?.addEventListener('input', (e) => {
      state.peVoltage = +e.target.value;
      $('peVoltageVal').textContent = `${state.peVoltage.toFixed(2)} V`;
    });

    // 2.4 Kontrolleri
    $('mlVoltageSlider')?.addEventListener('input', (e) => {
      state.mlVoltage = +e.target.value;
      $('mlVoltageVal').textContent = `${state.mlVoltage} V`;
      updateMillikanTelemetry();
    });
    $('mlNewDropBtn')?.addEventListener('click', spawnNewOilDrop);
    $('mlAutoBalanceBtn')?.addEventListener('click', autoBalanceMillikan);

    document.querySelectorAll('#mod2 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    updateMillikanTelemetry();

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod2El = $('mod2');
      if (!mod2El || !mod2El.classList.contains('active')) return;
      const dt = Math.min(0.04, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '2_1') stepCloudChamber(dt);
      else if (state.activeSub === '2_2') stepThomsonTube();
      else if (state.activeSub === '2_3') stepPhotoelectric(dt);
      else if (state.activeSub === '2_4') stepMillikan(dt);
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '2_1') {
      if (preset.source) {
        state.ccSource = preset.source;
        document.querySelectorAll('[data-cc-source]').forEach((b) =>
          b.classList.toggle('active', b.dataset.ccSource === state.ccSource)
        );
      }
      if (preset.B != null) {
        state.ccB = preset.B;
        $('ccBSlider').value = preset.B;
        $('ccBVal').textContent = `${preset.B.toFixed(2)} T`;
      }
    } else if (preset.sub === '2_2') {
      if (preset.balance) {
        $('thWienBalanceBtn')?.click();
      } else {
        if (preset.E != null) { state.thE = preset.E; $('thESlider').value = preset.E; $('thEVal').textContent = `${preset.E} kV/m`; }
        if (preset.B != null) { state.thB = preset.B; $('thBSlider').value = preset.B; $('thBVal').textContent = `${preset.B} mT`; }
      }
    } else if (preset.sub === '2_3') {
      if (preset.metal) { state.peMetal = preset.metal; $('peMetalSelect').value = preset.metal; }
      if (preset.lambda) { state.peLambda = preset.lambda; $('peLambdaSlider').value = preset.lambda; $('peLambdaVal').textContent = `${preset.lambda} nm`; }
      if (preset.intensity != null) { state.peIntensity = preset.intensity; $('peIntensitySlider').value = preset.intensity; $('peIntensityVal').textContent = `%${preset.intensity}`; }
      if (preset.stopV) {
        const m = PHOTO_METALS.find((x) => x.id === state.peMetal) || PHOTO_METALS[0];
        const v0 = Math.max(0, 1239.84 / state.peLambda - m.W);
        state.peVoltage = -v0 - 0.15;
        $('peVoltageSlider').value = state.peVoltage;
        $('peVoltageVal').textContent = `${state.peVoltage.toFixed(2)} V`;
      } else if (preset.V != null) {
        state.peVoltage = preset.V;
        $('peVoltageSlider').value = preset.V;
        $('peVoltageVal').textContent = `${preset.V.toFixed(2)} V`;
      }
    } else if (preset.sub === '2_4') {
      if (preset.newDrop) spawnNewOilDrop();
      if (preset.autoBalance) autoBalanceMillikan();
    }
  }

  window.Mod2GlassLab = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
