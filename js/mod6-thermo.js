/* ============================================================================
   affePhysics — MODÜL 6: Termodinamik, İstatistiksel Fizik ve Akışkanlar
   1. Maxwell-Boltzmann İdeal Gaz Odası, Piston ve Maxwell'in Cini (Entropi)
   2. Bernoulli Akışkanlar Tüneli (Venturi Borusu & Uçak Kanadı Aerodinamiği)
   ============================================================================ */
(function () {
  'use strict';

  const { clamp, fitCanvas, drawVectorArrow } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '6_1',
    // 6.1: Maxwell-Boltzmann & Maxwell'in Cini
    gasTemp: 350,       // K
    gasVolPct: 85,      // %
    gasCount: 130,
    demonActive: false,
    molecules: [],
    // 6.2: Bernoulli Akışkanlar Tüneli
    fluidMode: 'venturi', // 'venturi' | 'airfoil'
    inletSpeed: 4.5,      // m/s
    throatRatio: 0.48,    // A2 / A1
    airfoilAoA: 8,        // derece (Hücum açısı)
    fluidParticles: []
  };

  /* ==========================================================================
     6.1. MAXWELL-BOLTZMANN İDEAL GAZ ODASI & MAXWELL'İN CİNİ
     ========================================================================== */
  function initMolecules() {
    state.molecules = [];
    const baseSpeed = Math.sqrt(state.gasTemp) * 7.2;
    for (let i = 0; i < state.gasCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      // Box-Muller ile Maxwell-benzeri başlangıç hız dağılımı
      const u1 = Math.max(1e-5, Math.random());
      const u2 = Math.random();
      const mag = baseSpeed * Math.sqrt(-2 * Math.log(u1)) * 0.55;
      state.molecules.push({
        x: 0.12 + Math.random() * 0.76,
        y: 0.15 + Math.random() * 0.7,
        vx: Math.cos(ang) * mag,
        vy: Math.sin(ang) * mag,
        r: 4.2
      });
    }
  }

  function rescaleGasTemperature(newT) {
    const ratio = Math.sqrt(newT / Math.max(50, state.gasTemp));
    state.gasTemp = newT;
    state.molecules.forEach((m) => {
      m.vx *= ratio;
      m.vy *= ratio;
    });
  }

  function stepIdealGas(dt) {
    const canvas = $('gasCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const pad = 28;
    const boxLeft = pad;
    const boxRight = w - pad;
    const boxBottom = h - pad;
    const maxBoxH = h - pad * 2;
    const curBoxH = maxBoxH * (state.gasVolPct / 100);
    const boxTop = boxBottom - curBoxH;
    const midX = (boxLeft + boxRight) * 0.5;

    // Cam Silindir ve Hareketli Piston Çizimi
    ctx.fillStyle = 'rgba(12, 20, 38, 0.72)';
    ctx.fillRect(boxLeft, boxTop, boxRight - boxLeft, curBoxH);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxLeft, boxTop, boxRight - boxLeft, curBoxH);

    // Üst Piston Plakası
    ctx.fillStyle = '#334155';
    ctx.fillRect(boxLeft + 2, boxTop - 14, boxRight - boxLeft - 4, 14);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(midX - 10, 8, 20, Math.max(0, boxTop - 22));

    const vThreshold = Math.sqrt(state.gasTemp) * 7.2;

    // Maxwell'in Cini Ara Bölmesi ve Akıllı Kapısı
    if (state.demonActive) {
      const gateY1 = (boxTop + boxBottom) * 0.5 - 32;
      const gateY2 = (boxTop + boxBottom) * 0.5 + 32;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(midX, boxTop); ctx.lineTo(midX, gateY1);
      ctx.moveTo(midX, gateY2); ctx.lineTo(midX, boxBottom);
      ctx.stroke();

      // Kapı aralığı (kesikli mor çizgi)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(midX, gateY1); ctx.lineTo(midX, gateY2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.font = '700 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('😈 MAXWELL’İN CİNİ KAPISI', midX, boxTop + 16);
    }

    let leftEk = 0, leftN = 0;
    let rightEk = 0, rightN = 0;
    const speeds = [];

    // Molekülleri İlerlet ve Duvar/Cin Çarpışmalarını Çöz
    const mols = state.molecules;
    for (let i = 0; i < mols.length; i++) {
      const m = mols[i];
      let px = boxLeft + m.x * (boxRight - boxLeft);
      let py = boxTop + m.y * curBoxH;
      const prevPx = px;

      px += m.vx * dt;
      py += m.vy * dt;

      if (px < boxLeft + m.r) { px = boxLeft + m.r; m.vx = Math.abs(m.vx); }
      if (px > boxRight - m.r) { px = boxRight - m.r; m.vx = -Math.abs(m.vx); }
      if (py < boxTop + m.r) { py = boxTop + m.r; m.vy = Math.abs(m.vy); }
      if (py > boxBottom - m.r) { py = boxBottom - m.r; m.vy = -Math.abs(m.vy); }

      const speed = Math.hypot(m.vx, m.vy);
      speeds.push(speed);

      // Maxwell'in Cini Kuralı: Hızlı molekülleri sağa geçir, yavaşları sola geçir!
      if (state.demonActive) {
        const crossedLeftToRight = prevPx <= midX && px > midX;
        const crossedRightToLeft = prevPx >= midX && px < midX;
        const isFast = speed >= vThreshold;

        if (crossedLeftToRight && !isFast) {
          // Yavaş molekül sağa geçmek istiyor -> Geri yansıt!
          px = midX - m.r;
          m.vx = -Math.abs(m.vx);
        } else if (crossedRightToLeft && isFast) {
          // Hızlı molekül sola geçmek istiyor -> Geri yansıt!
          px = midX + m.r;
          m.vx = Math.abs(m.vx);
        }
      }

      m.x = clamp((px - boxLeft) / (boxRight - boxLeft), 0.01, 0.99);
      m.y = clamp((py - boxTop) / curBoxH, 0.01, 0.99);

      if (px < midX) { leftEk += speed * speed; leftN++; }
      else { rightEk += speed * speed; rightN++; }

      // Hıza göre renk: Mavi (Yavaş/Soğuk) -> Camgöbeği -> Kehribar -> Kırmızı (Hızlı/Sıcak)
      const ratio = clamp(speed / (vThreshold * 1.65), 0, 1);
      const hue = Math.round(215 - ratio * 210);
      ctx.fillStyle = `hsl(${hue}, 92%, 58%)`;
      ctx.beginPath();
      ctx.arc(px, py, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Molekül-Molekül Elastik Çarpışmaları (Alt küme örneklemesi)
    const boxW = boxRight - boxLeft;
    for (let i = 0; i < mols.length; i++) {
      for (let j = i + 1; j < mols.length; j++) {
        const a = mols[i], b = mols[j];
        const dx = (b.x - a.x) * boxW;
        const dy = (b.y - a.y) * curBoxH;
        const dist = Math.hypot(dx, dy);
        const minD = a.r + b.r;
        if (dist < minD && dist > 1e-4) {
          const nx = dx / dist, ny = dy / dist;
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const vn = dvx * nx + dvy * ny;
          if (vn > 0) {
            a.vx -= vn * nx; a.vy -= vn * ny;
            b.vx += vn * nx; b.vy += vn * ny;
          }
        }
      }
    }

    // Sol ve Sağ Oda Sıcaklıkları (Maxwell'in Cini etkisini göstermek için)
    const Tleft = leftN > 0 ? Math.round((leftEk / leftN) / 52) : state.gasTemp;
    const Tright = rightN > 0 ? Math.round((rightEk / rightN) / 52) : state.gasTemp;
    if (state.demonActive) {
      ctx.font = '700 11.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText(`Sol Oda (Soğuk): T_sol ≈ ${Tleft} K (${leftN} mol)`, boxLeft + 12, boxBottom - 10);
      ctx.fillStyle = '#ff3366';
      ctx.textAlign = 'right';
      ctx.fillText(`Sağ Oda (Sıcak): T_sağ ≈ ${Tright} K (${rightN} mol)`, boxRight - 12, boxBottom - 10);
    }

    // Telemetri & Maxwell-Boltzmann Grafiği
    const P = ((state.gasCount * state.gasTemp) / (state.gasVolPct * 32)).toFixed(2);
    const vRms = Math.round(Math.sqrt(3 * 8.314 * state.gasTemp / 0.028));
    $('telGasPressure').textContent = `${P} atm`;
    $('telGasVrms').textContent = `${vRms} m/s`;
    $('telGasDeltaT').textContent = state.demonActive ? `ΔT = ${Math.abs(Tright - Tleft)} K` : '0 K (Dengede)';

    drawMaxwellBoltzmannPlot(speeds, vThreshold);
  }

  function drawMaxwellBoltzmannPlot(speeds, vScale) {
    const canvas = $('mbPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const bins = new Array(16).fill(0);
    const maxV = 360;
    speeds.forEach((s) => {
      const idx = clamp(Math.floor((s / maxV) * bins.length), 0, bins.length - 1);
      bins[idx]++;
    });
    const maxBin = Math.max(10, ...bins);

    const padL = 24, padB = 22, padT = 18;
    const pw = w - padL - 10;
    const ph = h - padT - padB;
    const bw = pw / bins.length;

    // Canlı Hız Histogram Çubukları
    bins.forEach((cnt, i) => {
      const bh = (cnt / maxBin) * ph * 0.88;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.28)';
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.65)';
      ctx.fillRect(padL + i * bw + 1, padT + ph - bh, bw - 3, bh);
      ctx.strokeRect(padL + i * bw + 1, padT + ph - bh, bw - 3, bh);
    });

    // Teorik Maxwell-Boltzmann Eğrisi f(v) ∝ v² exp(-v² / v_p²)
    const vp = Math.max(40, vScale * 0.85);
    ctx.beginPath();
    for (let x = 0; x <= pw; x += 3) {
      const v = (x / pw) * maxV;
      const u = v / vp;
      const f = u * u * Math.exp(1 - u * u); // Tepe değeri = 1
      const py = padT + ph - f * ph * 0.82;
      if (x === 0) ctx.moveTo(padL + x, py); else ctx.lineTo(padL + x, py);
    }
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('Maxwell-Boltzmann Hız Dağılımı f(v)', padL, 12);
  }

  /* ==========================================================================
     6.2. BERNOULLI AKIŞKANLAR TÜNELİ & UÇAK KANADI (AIRFOIL) AERODİNAMİĞİ
     ========================================================================== */
  function initFluidParticles() {
    state.fluidParticles = [];
    for (let i = 0; i < 95; i++) {
      state.fluidParticles.push({
        x: Math.random(),
        lane: (Math.random() * 2 - 1) * 0.86
      });
    }
  }

  function stepBernoulliTunnel(dt) {
    const canvas = $('bernoulliCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cy = h * 0.56;
    const rho = 1.225; // hava/akışkan yoğunluğu

    if (state.fluidMode === 'venturi') {
      const R1 = 92;
      const R2 = R1 * state.throatRatio;
      const halfSpan = (x) => {
        const u = (x - w * 0.5) / (w * 0.22);
        return R1 - (R1 - R2) * Math.exp(-u * u);
      };

      // Basınç Isı Haritası Arka Planı (Dar boğazda düşük basınç = Camgöbeği/Mor)
      for (let x = 30; x < w - 30; x += 8) {
        const rHere = halfSpan(x);
        const vRatio = R1 / rHere;
        const pNorm = clamp(1 - (vRatio * vRatio - 1) / 3.5, 0, 1);
        const hue = Math.round(190 + (1 - pNorm) * 140);
        ctx.fillStyle = `hsla(${hue}, 85%, 45%, 0.28)`;
        ctx.fillRect(x, cy - rHere, 9, rHere * 2);
      }

      // Laminer Akış Çizgileri
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
      ctx.lineWidth = 1.3;
      for (let lane = -0.8; lane <= 0.8; lane += 0.2) {
        ctx.beginPath();
        for (let x = 30; x <= w - 30; x += 6) {
          const sy = cy + lane * halfSpan(x);
          if (x === 30) ctx.moveTo(x, sy); else ctx.lineTo(x, sy);
        }
        ctx.stroke();
      }

      // Akışkan İzleyici Parçacıklar (Süreklilik denklemi: v(x) = v1 * R1 / R(x))
      ctx.fillStyle = '#00f2fe';
      state.fluidParticles.forEach((fp) => {
        const px = 30 + fp.x * (w - 60);
        const rHere = halfSpan(px);
        const localV = state.inletSpeed * (R1 / rHere);
        fp.x = (fp.x + (localV * 0.042 * dt)) % 1.0;
        const py = cy + fp.lane * rHere;
        ctx.beginPath();
        ctx.arc(px, py, 3.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Venturi Boru Duvarları
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 30; x <= w - 30; x += 5) {
        const yTop = cy - halfSpan(x);
        if (x === 30) ctx.moveTo(x, yTop); else ctx.lineTo(x, yTop);
      }
      for (let x = 30; x <= w - 30; x += 5) {
        const yBot = cy + halfSpan(x);
        if (x === 30) ctx.moveTo(x, yBot); else ctx.lineTo(x, yBot);
      }
      ctx.stroke();

      // Üstte 3 Adet Manometre Basınç Sütunu (Giriş P1, Boğaz P2, Çıkış P3)
      const v1 = state.inletSpeed;
      const v2 = v1 / state.throatRatio;
      const P1 = 101.3; // kPa
      const P2 = Math.max(60, P1 - 0.5 * rho * (v2 * v2 - v1 * v1) * 0.35);

      [
        { x: w * 0.22, p: P1, lbl: `P₁ = ${P1.toFixed(1)} kPa` },
        { x: w * 0.50, p: P2, lbl: `P₂ = ${P2.toFixed(1)} kPa (Düşük!)` },
        { x: w * 0.78, p: P1, lbl: `P₃ = ${P1.toFixed(1)} kPa` }
      ].forEach((m) => {
        const topWall = cy - halfSpan(m.x);
        const colH = clamp(((m.p - 55) / 55) * 68, 12, 72);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(m.x - 10, 18, 20, topWall - 18);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.55)';
        ctx.fillRect(m.x - 8, topWall - colH, 16, colH);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(m.lbl, m.x, 14);
      });

      $('telBernV2').textContent = `${v2.toFixed(2)} m/s`;
      $('telBernDeltaP').textContent = `−${(P1 - P2).toFixed(2)} kPa`;
      $('telBernLift').textContent = 'Venturi Modu';
    } else {
      // NACA Uçak Kanadı (Airfoil) ve Kaldırma Kuvveti
      const cx = w * 0.48;
      const aoaRad = -(state.airfoilAoA * Math.PI) / 180;
      const vTop = state.inletSpeed * (1 + 0.22 + state.airfoilAoA * 0.032);
      const vBot = state.inletSpeed * Math.max(0.5, 1 - state.airfoilAoA * 0.018);
      const deltaP = 0.5 * rho * (vTop * vTop - vBot * vBot);
      const liftForce = Math.max(0, deltaP * 42);

      // Akış çizgileri ve parçacıklar
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
      ctx.lineWidth = 1.5;
      for (let lane = -0.8; lane <= 0.8; lane += 0.16) {
        ctx.beginPath();
        for (let x = 25; x <= w - 25; x += 6) {
          const dx = (x - cx) / 110;
          const bump = Math.exp(-dx * dx) * (lane < 0 ? -34 - state.airfoilAoA * 1.4 : 18);
          const sy = cy + lane * 115 + bump;
          if (x === 25) ctx.moveTo(x, sy); else ctx.lineTo(x, sy);
        }
        ctx.stroke();
      }

      // İzleyici parçacıklar (Üstte daha hızlı!)
      ctx.fillStyle = '#00f2fe';
      state.fluidParticles.forEach((fp) => {
        const isUpper = fp.lane < 0;
        const speedMult = isUpper ? (vTop / state.inletSpeed) : (vBot / state.inletSpeed);
        fp.x = (fp.x + state.inletSpeed * speedMult * 0.04 * dt) % 1.0;
        const px = 25 + fp.x * (w - 50);
        const dx = (px - cx) / 110;
        const bump = Math.exp(-dx * dx) * (isUpper ? -34 - state.airfoilAoA * 1.4 : 18);
        const py = cy + fp.lane * 115 + bump;
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      });

      // Uçak Kanadı (Airfoil) Kesiti
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(aoaRad);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-105, 0);
      ctx.bezierCurveTo(-65, -42, 25, -24, 110, 4);
      ctx.bezierCurveTo(25, 14, -65, 18, -105, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Kaldırma Kuvveti (F_lift) Vektörü
      drawVectorArrow(ctx, cx, cy, cx, cy - clamp(liftForce * 0.35, 25, 130), '#10b981', `F_kaldırma (${liftForce.toFixed(0)} N)`);

      $('telBernV2').textContent = `v_üst = ${vTop.toFixed(2)} m/s`;
      $('telBernDeltaP').textContent = `${deltaP.toFixed(1)} Pa`;
      $('telBernLift').textContent = `${liftForce.toFixed(0)} N`;
    }
  }

  /* ==========================================================================
     MODÜL 6 BAŞLATICI VE KONTROLLER
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod6 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['6_1', '6_2'].forEach((id) => {
      const pane = $(`mod6_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function init() {
    initMolecules();
    initFluidParticles();

    // 6.1 Kontrolleri
    $('gasTempSlider')?.addEventListener('input', (e) => {
      rescaleGasTemperature(+e.target.value);
      $('gasTempVal').textContent = `${state.gasTemp} K`;
    });
    $('gasVolSlider')?.addEventListener('input', (e) => {
      state.gasVolPct = +e.target.value;
      $('gasVolVal').textContent = `%${state.gasVolPct}`;
    });
    $('gasDemonChk')?.addEventListener('change', (e) => {
      state.demonActive = e.target.checked;
    });
    $('gasResetBtn')?.addEventListener('click', initMolecules);

    // 6.2 Kontrolleri
    document.querySelectorAll('[data-fluid-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.fluidMode = btn.dataset.fluidMode;
        document.querySelectorAll('[data-fluid-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.fluidMode === state.fluidMode)
        );
      });
    });
    $('fluidSpeedSlider')?.addEventListener('input', (e) => {
      state.inletSpeed = +e.target.value;
      $('fluidSpeedVal').textContent = `${state.inletSpeed.toFixed(1)} m/s`;
    });
    $('fluidThroatSlider')?.addEventListener('input', (e) => {
      state.throatRatio = +e.target.value;
      $('fluidThroatVal').textContent = state.throatRatio.toFixed(2);
    });
    $('fluidAoASlider')?.addEventListener('input', (e) => {
      state.airfoilAoA = +e.target.value;
      $('fluidAoAVal').textContent = `${state.airfoilAoA}°`;
    });

    document.querySelectorAll('#mod6 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod6El = $('mod6');
      if (!mod6El || !mod6El.classList.contains('active')) return;
      const dt = Math.min(0.035, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '6_1') stepIdealGas(dt);
      else if (state.activeSub === '6_2') stepBernoulliTunnel(dt);
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '6_1') {
      if (preset.T) {
        rescaleGasTemperature(preset.T);
        $('gasTempSlider').value = preset.T;
        $('gasTempVal').textContent = `${preset.T} K`;
      }
      if (preset.demon != null) {
        state.demonActive = preset.demon;
        $('gasDemonChk').checked = preset.demon;
      }
    } else if (preset.sub === '6_2') {
      if (preset.mode) {
        state.fluidMode = preset.mode;
        document.querySelectorAll('[data-fluid-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.fluidMode === state.fluidMode)
        );
      }
      if (preset.throat != null) {
        state.throatRatio = preset.throat;
        $('fluidThroatSlider').value = preset.throat;
        $('fluidThroatVal').textContent = preset.throat.toFixed(2);
      }
      if (preset.aoa != null) {
        state.airfoilAoA = preset.aoa;
        $('fluidAoASlider').value = preset.aoa;
        $('fluidAoAVal').textContent = `${preset.aoa}°`;
      }
    }
  }

  window.Mod6Thermo = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
