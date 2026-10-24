/* ============================================================================
   affePhysics — MODÜL 7: Özel Görelilik ve Kuantum Dalga Mekaniği
   1. Einstein Özel Görelilik: Çift Gözlemci, Foton Işık Saati & Lorentz Faktörü
   2. Kuantum Tünelleme: 1B Zaman-Bağımlı Schrödinger Denklemi (TDSE) Çözücüsü
   ============================================================================ */
(function () {
  'use strict';

  const { clamp, wavelengthToColor, fitCanvas } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '7_1',
    // 7.1: Özel Görelilik
    beta: 0.866,        // v/c (γ = 2.00 ile başla)
    earthTime: 0,
    shipTime: 0,
    shipX: 60,
    photonY: 0,
    photonDir: 1,
    shipPhotonY: 0,
    shipPhotonDir: 1,
    // 7.2: Kuantum Tünelleme (1B TDSE)
    barrierRatio: 1.22, // V0 / E
    barrierWidth: 18,   // grid birimi
    barrierType: 'single', // 'single' | 'double' | 'step'
    k0: 1.15,
    showRealImag: true
  };

  /* ==========================================================================
     7.1. EINSTEIN ÖZEL GÖRELİLİK (SPECIAL RELATIVITY) ÇİFT GÖZLEMCİ SAHNESİ
     ========================================================================== */
  function stepRelativity(dt) {
    const canvas = $('relativityCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const beta = clamp(state.beta, 0, 0.999);
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    state.earthTime += dt;
    state.shipTime += dt / gamma;

    const midH = h * 0.5;
    const L0 = 150;
    const Lcontracted = L0 / gamma;

    // Arka plan yıldızları
    ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
    for (let i = 0; i < 28; i++) {
      const sx = ((i * 97) % w);
      const sy = ((i * 53) % (midH - 20)) + 10;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // ---------------- ÜST EKRAN: DÜNYA (İSTASYON) GÖZLEMCİSİ ----------------
    ctx.fillStyle = '#00f2fe';
    ctx.font = '700 11.5px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`1. DÜNYA GÖZLEMCİSİ ÇERÇEVESİ (S): Araç Boyu L = L₀/γ (${(100 / gamma).toFixed(1)}%) · Işık Saati Yavaşlar (Δt = γ·Δt₀)`, 16, 20);

    const topCy = midH * 0.55;
    state.shipX += beta * 145 * dt;
    if (state.shipX > w - 90) state.shipX = 90;

    // Doppler Kayması Dalga Halkaları (Önde Maviye, Arkada Kırmızıya Kayma)
    const lambdaRest = 550; // Yeşil-Sarı
    const lambdaFront = clamp(lambdaRest * Math.sqrt((1 - beta) / (1 + beta)), 360, 750);
    const lambdaBack = clamp(lambdaRest * Math.sqrt((1 + beta) / (1 - beta)), 360, 750);

    for (let r = 18; r <= 54; r += 18) {
      ctx.strokeStyle = wavelengthToColor(lambdaFront, 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.shipX + Lcontracted * 0.5 + (54 - r) * beta * 0.45, topCy, r, -0.9, 0.9);
      ctx.stroke();

      ctx.strokeStyle = wavelengthToColor(lambdaBack, 0.45);
      ctx.beginPath();
      ctx.arc(state.shipX - Lcontracted * 0.5 - (54 - r) * beta * 0.45, topCy, r, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
    }

    // Boy Kısalmasına Uğramış Uzay Aracı Gövdesi
    ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(state.shipX - Lcontracted * 0.5, topCy - 44, Lcontracted, 88, 14);
    ctx.fill();
    ctx.stroke();

    // Foton Işık Saati (Dünya gözlemcisine göre dikey hız c_y = c / γ!)
    const clockH = 36;
    state.photonY += (state.photonDir * (160 / gamma) * dt);
    if (state.photonY > clockH) { state.photonY = clockH; state.photonDir = -1; }
    if (state.photonY < -clockH) { state.photonY = -clockH; state.photonDir = 1; }

    // Üst ve alt aynalar
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(state.shipX - 14, topCy - clockH - 5, 28, 4);
    ctx.fillRect(state.shipX - 14, topCy + clockH + 1, 28, 4);

    // Foton topu
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(state.shipX, topCy + state.photonY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Orta Ayırıcı Çizgi
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, midH); ctx.lineTo(w, midH); ctx.stroke();

    // ---------------- ALT EKRAN: UZAY ARACI İÇİ GÖZLEMCİSİ ----------------
    ctx.fillStyle = '#a855f7';
    ctx.font = '700 11.5px Inter';
    ctx.fillText(`2. UZAY ARACI İÇİ GÖZLEMCİ ÇERÇEVESİ (S'): Araç Durgun (L = L₀) · Dış Uzay/Cetvel Kısalır!`, 16, midH + 20);

    const botCy = midH + (h - midH) * 0.56;
    const botCx = w * 0.5;

    // Geriye doğru akan ve boy kısalmasına uğramış dış uzay cetveli
    const gridSpacing = Math.max(10, 70 / gamma);
    const gridOffset = (state.earthTime * beta * 160) % gridSpacing;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1.4;
    for (let x = -gridOffset; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, midH + 30);
      ctx.lineTo(x, h - 10);
      ctx.stroke();
    }

    // Tam Durgun Boyda (L0) Uzay Aracı
    ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(botCx - L0 * 0.5, botCy - 44, L0, 88, 14);
    ctx.fill();
    ctx.stroke();

    // Araç içi Foton Işık Saati (Tam hızda dikey tik-tak)
    state.shipPhotonY += state.shipPhotonDir * 160 * dt;
    if (state.shipPhotonY > clockH) { state.shipPhotonY = clockH; state.shipPhotonDir = -1; }
    if (state.shipPhotonY < -clockH) { state.shipPhotonY = -clockH; state.shipPhotonDir = 1; }

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(botCx - 16, botCy - clockH - 5, 32, 4);
    ctx.fillRect(botCx - 16, botCy + clockH + 1, 32, 4);

    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(botCx, botCy + state.shipPhotonY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Telemetri ve Lorentz Grafiği
    $('telRelGamma').textContent = `γ = ${gamma.toFixed(3)}`;
    $('telRelLength').textContent = `%${(100 / gamma).toFixed(1)} L₀`;
    $('telRelTimeEarth').textContent = `${state.earthTime.toFixed(1)} s`;
    $('telRelTimeShip').textContent = `${state.shipTime.toFixed(1)} s`;
    $('telRelDoppler').textContent = `${lambdaFront.toFixed(0)} nm (Ön) / ${lambdaBack.toFixed(0)} nm (Arka)`;

    drawLorentzPlot(beta, gamma);
  }

  function drawLorentzPlot(curBeta, curGamma) {
    const canvas = $('lorentzPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const padL = 30, padB = 22, padT = 16, padR = 14;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph);
    ctx.stroke();

    // γ(β) = 1 / sqrt(1 - β²) eğrisi (γ = 1..10)
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const b = (i / 100) * 0.995;
      const g = Math.min(10, 1 / Math.sqrt(1 - b * b));
      const x = padL + b * pw;
      const y = padT + ph - ((g - 1) / 9) * ph;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const cx = padL + curBeta * pw;
    const cy = padT + ph - ((Math.min(10, curGamma) - 1) / 9) * ph;
    ctx.fillStyle = '#ff3366';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('Lorentz Faktörü γ(v/c)', padL + 6, padT + 10);
    ctx.fillText('0c', padL, h - 6);
    ctx.fillText('1c', w - padR - 14, h - 6);
  }

  /* ==========================================================================
     7.2. KUANTUM TÜNELLEME (1B ZAMAN-BAĞIMLI SCHRÖDINGER ÇÖZÜCÜ — TDSE)
     ========================================================================== */
  const NX = 520;
  const psiR = new Float64Array(NX);
  const psiI = new Float64Array(NX);
  const potV = new Float64Array(NX);

  function initTDSEWavepacket() {
    const x0 = Math.floor(NX * 0.23);
    const sigma = 22.0;
    const k0 = state.k0;
    const E0 = 0.5 * k0 * k0;
    const V0 = E0 * state.barrierRatio;

    // Potansiyel Bariyerini Kur
    potV.fill(0);
    const bStart = Math.floor(NX * 0.5);
    const w = state.barrierWidth;

    if (state.barrierType === 'single') {
      for (let i = bStart; i < bStart + w && i < NX; i++) potV[i] = V0;
    } else if (state.barrierType === 'double') {
      // Çift Rezonans Bariyeri (Fabry-Pérot Kuantum Kuyusu)
      const wHalf = Math.max(5, Math.floor(w * 0.65));
      const wellGap = 24;
      for (let i = bStart - wellGap; i < bStart - wellGap + wHalf; i++) potV[i] = V0;
      for (let i = bStart + wellGap; i < bStart + wellGap + wHalf; i++) potV[i] = V0;
    } else if (state.barrierType === 'step') {
      for (let i = bStart; i < NX; i++) potV[i] = V0;
    }

    // Gauss Dalga Paketi ψ(x, 0) = exp(-(x-x0)² / 4σ²) * exp(i k0 x)
    let norm = 0;
    for (let i = 0; i < NX; i++) {
      const dx = i - x0;
      const env = Math.exp(-(dx * dx) / (4 * sigma * sigma));
      psiR[i] = env * Math.cos(k0 * dx);
      psiI[i] = env * Math.sin(k0 * dx);
      norm += psiR[i] * psiR[i] + psiI[i] * psiI[i];
    }
    const scale = 1 / Math.sqrt(Math.max(1e-12, norm));
    for (let i = 0; i < NX; i++) {
      psiR[i] *= scale;
      psiI[i] *= scale;
    }
  }

  function stepTDSE() {
    const canvas = $('tdseCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    // Staggered Leapfrog FDTD İntegrasyonu (Her karede 18 alt adım)
    const dt = 0.24;
    for (let step = 0; step < 18; step++) {
      for (let i = 1; i < NX - 1; i++) {
        const lapI = psiI[i + 1] - 2 * psiI[i] + psiI[i - 1];
        psiR[i] += dt * (-0.5 * lapI + potV[i] * psiI[i]);
      }
      for (let i = 1; i < NX - 1; i++) {
        const lapR = psiR[i + 1] - 2 * psiR[i] + psiR[i - 1];
        psiI[i] -= dt * (-0.5 * lapR + potV[i] * psiR[i]);
      }
      // Kenar yutucu sönüm (Absorbing Boundary Condition)
      for (let i = 0; i < 20; i++) {
        const damp = 0.996 + 0.004 * (i / 20);
        psiR[i] *= damp; psiI[i] *= damp;
        psiR[NX - 1 - i] *= damp; psiI[NX - 1 - i] *= damp;
      }
    }

    const baseLine = h * 0.72;
    const E0 = 0.5 * state.k0 * state.k0;

    // 1. Potansiyel Bariyerini V(x) ve Elektron Enerji Seviyesini E Çiz
    ctx.fillStyle = 'rgba(245, 158, 11, 0.24)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseLine);
    for (let i = 0; i < NX; i++) {
      const px = (i / NX) * w;
      const py = baseLine - (potV[i] / E0) * 125;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w, baseLine);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elektron Kinetik Enerji Çizgisi (E)
    const eLineY = baseLine - 125;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, eLineY); ctx.lineTo(w, eLineY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#10b981';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('Elektron Enerjisi (E)', 14, eLineY - 6);

    // 2. Re(ψ) ve Im(ψ) Faz Dalgaları
    if (state.showRealImag) {
      ctx.beginPath();
      for (let i = 0; i < NX; i++) {
        const px = (i / NX) * w;
        const py = baseLine - psiR[i] * 520;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.52)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < NX; i++) {
        const px = (i / NX) * w;
        const py = baseLine - psiI[i] * 520;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.52)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Olasılık Yoğunluğu Zarfı |ψ(x,t)|²
    ctx.beginPath();
    ctx.moveTo(0, baseLine);
    let leftProb = 0;
    let rightProb = 0;
    const bCenter = Math.floor(NX * 0.52);

    for (let i = 0; i < NX; i++) {
      const prob = psiR[i] * psiR[i] + psiI[i] * psiI[i];
      if (i < bCenter) leftProb += prob;
      else rightProb += prob;

      const px = (i / NX) * w;
      const py = baseLine - prob * 3800;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w, baseLine);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseLine - 220, 0, baseLine);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.48)');
    grad.addColorStop(1, 'rgba(0, 242, 254, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    const totalP = Math.max(1e-9, leftProb + rightProb);
    const R = (leftProb / totalP) * 100;
    const T = (rightProb / totalP) * 100;

    $('telTdseT').textContent = `%${T.toFixed(1)}`;
    $('telTdseR').textContent = `%${R.toFixed(1)}`;
    $('telTdseRatio').textContent = `V₀ = ${state.barrierRatio.toFixed(2)} E`;
  }

  /* ==========================================================================
     MODÜL 7 BAŞLATICI VE KONTROLLER
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod7 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['7_1', '7_2'].forEach((id) => {
      const pane = $(`mod7_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
    if (subId === '7_2') initTDSEWavepacket();
  }

  function init() {
    // 7.1 Kontrolleri
    $('relBetaSlider')?.addEventListener('input', (e) => {
      state.beta = +e.target.value;
      $('relBetaVal').textContent = `${state.beta.toFixed(3)} c`;
    });
    $('relResetClocksBtn')?.addEventListener('click', () => {
      state.earthTime = 0;
      state.shipTime = 0;
    });

    // 7.2 Kontrolleri
    document.querySelectorAll('[data-barrier-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.barrierType = btn.dataset.barrierType;
        document.querySelectorAll('[data-barrier-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.barrierType === state.barrierType)
        );
        initTDSEWavepacket();
      });
    });
    $('tdseV0Slider')?.addEventListener('input', (e) => {
      state.barrierRatio = +e.target.value;
      $('tdseV0Val').textContent = `${state.barrierRatio.toFixed(2)} × E`;
      initTDSEWavepacket();
    });
    $('tdseWidthSlider')?.addEventListener('input', (e) => {
      state.barrierWidth = +e.target.value;
      $('tdseWidthVal').textContent = `${state.barrierWidth} birim`;
      initTDSEWavepacket();
    });
    $('tdseFireBtn')?.addEventListener('click', initTDSEWavepacket);

    document.querySelectorAll('#mod7 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    initTDSEWavepacket();

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod7El = $('mod7');
      if (!mod7El || !mod7El.classList.contains('active')) return;
      const dt = Math.min(0.035, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '7_1') stepRelativity(dt);
      else if (state.activeSub === '7_2') stepTDSE();
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '7_1') {
      if (preset.beta != null) {
        state.beta = preset.beta;
        $('relBetaSlider').value = preset.beta;
        $('relBetaVal').textContent = `${preset.beta.toFixed(3)} c`;
      }
      state.earthTime = 0;
      state.shipTime = 0;
    } else if (preset.sub === '7_2') {
      if (preset.V0 != null) {
        state.barrierRatio = preset.V0;
        $('tdseV0Slider').value = preset.V0;
        $('tdseV0Val').textContent = `${preset.V0.toFixed(2)} × E`;
      }
      if (preset.width != null) {
        state.barrierWidth = preset.width;
        $('tdseWidthSlider').value = preset.width;
        $('tdseWidthVal').textContent = `${preset.width} birim`;
      }
      if (preset.barrierType) {
        state.barrierType = preset.barrierType;
        document.querySelectorAll('[data-barrier-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.barrierType === state.barrierType)
        );
      }
      initTDSEWavepacket();
    }
  }

  window.Mod7Modern = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
