/* ============================================================================
   affePhysics — MODÜL 4: Elektromanyetizma ve Maxwell Alan Laboratuvarı
   1. İnteraktif Elektrostatik/Manyetostatik Alan Kum Havuzu & Lorentz Yörüngeleri
   2. Faraday Elektromanyetik İndüksiyonu, Lenz Yasası ve AC Jeneratör
   ============================================================================ */
(function () {
  'use strict';

  const { clamp, rk4Step, fitCanvas, drawVectorArrow } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '4_1',
    // 4.1: Elektrostatik & Lorentz Kum Havuzu
    charges: [
      { x: -110, y: 0, q: +1 },
      { x: +110, y: 0, q: -1 }
    ],
    Bz: 0.45,
    showVectors: true,
    showHeatmap: true,
    testParticles: [],
    draggingIdx: -1,
    // 4.2: Faraday İndüksiyonu
    magX: -140,
    magY: 0,
    magVx: 0,
    draggingMagnet: false,
    autoGen: true,
    genFreq: 1.4,
    coilTurns: 6,
    fluxHistory: []
  };

  /* ==========================================================================
     4.1. ELEKTROSTATİK ALAN, EŞPOTANSİYEL ISI HARİTASI & LORENTZ YÖRÜNGESİ
     ========================================================================== */
  function evalElectricField(x, y) {
    let Ex = 0, Ey = 0, V = 0;
    const k = 140000;
    for (const c of state.charges) {
      const dx = x - c.x;
      const dy = y - c.y;
      const r2 = dx * dx + dy * dy + 220;
      const r = Math.sqrt(r2);
      Ex += (k * c.q * dx) / (r2 * r);
      Ey += (k * c.q * dy) / (r2 * r);
      V += (k * c.q) / (r * 120);
    }
    return { Ex, Ey, V };
  }

  function applyChargePreset(type) {
    state.testParticles = [];
    if (type === 'dipole') {
      state.charges = [
        { x: -110, y: 0, q: +1 },
        { x: +110, y: 0, q: -1 }
      ];
    } else if (type === 'quadrupole') {
      state.charges = [
        { x: -95, y: -80, q: +1 },
        { x: +95, y: -80, q: -1 },
        { x: -95, y: +80, q: -1 },
        { x: +95, y: +80, q: +1 }
      ];
    } else if (type === 'capacitor') {
      state.charges = [];
      for (let i = -2; i <= 2; i++) {
        state.charges.push({ x: -120, y: i * 48, q: +1 });
        state.charges.push({ x: +120, y: i * 48, q: -1 });
      }
    }
  }

  function launchLorentzParticle() {
    for (let i = -1; i <= 1; i++) {
      state.testParticles.push({
        x: -210,
        y: i * 55,
        vx: 145,
        vy: i * 18,
        q: 1,
        trail: []
      });
    }
  }

  function stepElectrostaticSandbox(dt) {
    const canvas = $('emFieldCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.5;

    // 1. Eşpotansiyel Voltaj Isı Haritası (Hızlı Izgara Hücreleri)
    if (state.showHeatmap) {
      const cell = 18;
      for (let gx = 0; gx < w; gx += cell) {
        for (let gy = 0; gy < h; gy += cell) {
          const { V } = evalElectricField(gx - cx, gy - cy);
          const norm = clamp(V / 16.0, -1, 1);
          if (Math.abs(norm) < 0.03) continue;
          if (norm > 0) {
            ctx.fillStyle = `rgba(255, 51, 102, ${Math.abs(norm) * 0.34})`;
          } else {
            ctx.fillStyle = `rgba(0, 242, 254, ${Math.abs(norm) * 0.34})`;
          }
          ctx.fillRect(gx, gy, cell, cell);

          // Eşpotansiyel kontur halkası vurgusu
          if (Math.abs((Math.abs(V) % 3.2) - 1.6) < 0.16) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(gx, gy, cell, 2);
          }
        }
      }
    }

    // 2. Elektrik Alan Vektör Okları Izgarası
    if (state.showVectors) {
      const step = 42;
      for (let gx = 28; gx < w - 20; gx += step) {
        for (let gy = 28; gy < h - 20; gy += step) {
          const { Ex, Ey } = evalElectricField(gx - cx, gy - cy);
          const mag = Math.hypot(Ex, Ey);
          if (mag < 0.05) continue;
          const len = clamp(Math.log1p(mag) * 6.5, 6, 20);
          const ux = (Ex / mag) * len;
          const uy = (Ey / mag) * len;
          const alpha = clamp(mag / 25, 0.25, 0.85);
          drawVectorArrow(
            ctx,
            gx - ux * 0.5, gy - uy * 0.5,
            gx + ux * 0.5, gy + uy * 0.5,
            `rgba(226, 232, 240, ${alpha})`
          );
        }
      }
    }

    // 3. Yüklü Test Parçacıklarını Lorentz Kuvveti F = q(E + v × B) ile RK4 İlerlet
    for (let i = state.testParticles.length - 1; i >= 0; i--) {
      const tp = state.testParticles[i];
      const next = rk4Step([tp.x, tp.y, tp.vx, tp.vy], 0, dt, (st) => {
        const { Ex, Ey } = evalElectricField(st[0], st[1]);
        const omega = state.Bz * 1.65;
        const ax = Ex * 18 + st[3] * omega;
        const ay = Ey * 18 - st[2] * omega;
        return [st[2], st[3], ax, ay];
      });
      tp.x = next[0]; tp.y = next[1]; tp.vx = next[2]; tp.vy = next[3];
      tp.trail.push([cx + tp.x, cy + tp.y]);
      if (tp.trail.length > 120) tp.trail.shift();

      ctx.beginPath();
      tp.trail.forEach(([tx, ty], idx) => {
        if (idx === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      });
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(cx + tp.x, cy + tp.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Eksi yüke çarptıysa veya ekran dışına çıktıysa temizle
      const hitCharge = state.charges.some((c) => c.q < 0 && Math.hypot(tp.x - c.x, tp.y - c.y) < 16);
      if (hitCharge || Math.abs(tp.x) > w * 0.55 || Math.abs(tp.y) > h * 0.55) {
        state.testParticles.splice(i, 1);
      }
    }

    // 4. Noktasal Yükleri (+q / −q) Çiz
    state.charges.forEach((c) => {
      const sx = cx + c.x;
      const sy = cy + c.y;
      const col = c.q > 0 ? '#ff3366' : '#00f2fe';
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.q > 0 ? '+q' : '−q', sx, sy + 4.5);
    });

    // Telemetri
    $('telEmCount').textContent = `${state.charges.length} Yük`;
    $('telEmBz').textContent = `${state.Bz.toFixed(2)} T`;
  }

  /* ==========================================================================
     4.2. FARADAY ELEKTROMANYETİK İNDÜKSİYON VE AC/DC JENERATÖR DENEYİ
     ========================================================================== */
  let genTime = 0;
  let electronPhase = 0;

  function stepFaradayInduction(dt) {
    const canvas = $('faradayCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.54, cy = h * 0.52;

    if (state.autoGen && !state.draggingMagnet) {
      genTime += dt * state.genFreq * Math.PI * 2;
      const prevX = state.magX;
      state.magX = Math.sin(genTime) * 145;
      state.magVx = (state.magX - prevX) / Math.max(0.001, dt);
    } else if (!state.draggingMagnet) {
      state.magVx *= 0.85;
    }

    // Manyetik Akı Φ_B(x) = Φ_0 * exp(-x^2 / (2 * σ^2))
    const sigma = 85;
    const u = state.magX / sigma;
    const flux = Math.exp(-0.5 * u * u);
    // dΦ/dt = (dΦ/dx) * vx
    const dFluxDx = (-u / sigma) * flux;
    const emf = -state.coilTurns * dFluxDx * state.magVx * 0.38; // Volt
    electronPhase += emf * dt * 2.5;

    // 1. Üstte Bağlı "Canlı Cam Akkor Lamba" ve Galvanometre
    const bulbX = cx, bulbY = 62;
    const power = clamp(Math.abs(emf) / 9.0, 0, 1);

    // Lamba Işıma Halesi
    if (power > 0.02) {
      const glow = ctx.createRadialGradient(bulbX, bulbY, 6, bulbX, bulbY, 24 + power * 75);
      glow.addColorStop(0, `rgba(253, 224, 71, ${0.95 * power})`);
      glow.addColorStop(0.45, `rgba(245, 158, 11, ${0.55 * power})`);
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(bulbX, bulbY, 24 + power * 75, 0, Math.PI * 2); ctx.fill();
    }

    // Cam Lamba Küresi
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.strokeStyle = power > 0.1 ? '#fde047' : '#94a3b8';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(bulbX, bulbY, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Lamba Filamanı
    ctx.strokeStyle = power > 0.05 ? '#fef08a' : '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bulbX - 8, bulbY + 18);
    ctx.lineTo(bulbX - 5, bulbY - 6);
    ctx.lineTo(bulbX + 5, bulbY - 6);
    ctx.lineTo(bulbX + 8, bulbY + 18);
    ctx.stroke();

    // 2. Bakır Solenoid Bobin Sarımları
    const coilW = 150;
    const coilH = 54;
    const turns = state.coilTurns;
    const turnSpacing = coilW / turns;

    // Bobin İletken Bağlantı Telleri
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - coilW * 0.5, cy - coilH);
    ctx.lineTo(bulbX - 10, bulbY + 22);
    ctx.moveTo(cx + coilW * 0.5, cy - coilH);
    ctx.lineTo(bulbX + 10, bulbY + 22);
    ctx.stroke();

    // 3. Çubuk Mıknatıs (N - S) ve Manyetik Alan Çizgileri
    const mx = cx + state.magX;
    const my = cy;

    // Manyetik Dipol Alan Çizgileri
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.22)';
    ctx.lineWidth = 1.4;
    for (let rLoop = 42; rLoop <= 115; rLoop += 35) {
      ctx.beginPath();
      ctx.ellipse(mx, my - rLoop * 0.55, 85, rLoop * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(mx, my + rLoop * 0.55, 85, rLoop * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mıknatıs Gövdesi (Kırmızı N / Mavi S)
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(mx, my - 20, 62, 40);
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(mx - 62, my - 20, 62, 40);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx - 62, my - 20, 124, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', mx + 31, my + 5);
    ctx.fillText('S', mx - 31, my + 5);

    // Ön Bobin Sarımları ve Sürüklenen Elektronlar
    for (let i = 0; i < turns; i++) {
      const tx = cx - coilW * 0.5 + (i + 0.5) * turnSpacing;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(tx, cy, turnSpacing * 0.38, coilH, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Elektron akışı noktası
      const eAng = (electronPhase + i * 0.8) % (Math.PI * 2);
      const ex = tx + Math.cos(eAng) * (turnSpacing * 0.38);
      const ey = cy + Math.sin(eAng) * coilH;
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath(); ctx.arc(ex, ey, 3.8, 0, Math.PI * 2); ctx.fill();
    }

    // Telemetri ve Osiloskop
    $('telFaradayFlux').textContent = `${(flux * 100).toFixed(1)} mWb`;
    $('telFaradayEmf').textContent = `${emf.toFixed(2)} V`;
    $('telFaradayPower').textContent = `${(emf * emf * 0.45).toFixed(2)} W`;

    state.fluxHistory.push({ flux, emf });
    if (state.fluxHistory.length > 160) state.fluxHistory.shift();
    drawFaradayOscilloscope();
  }

  function drawFaradayOscilloscope() {
    const canvas = $('faradayPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const midY = h * 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

    // Manyetik Akı Φ_B(t)
    ctx.beginPath();
    state.fluxHistory.forEach((pt, i) => {
      const x = (i / 160) * w;
      const y = midY - pt.flux * (h * 0.36);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // İndüksiyon EMK ε(t) = -N dΦ/dt
    ctx.beginPath();
    state.fluxHistory.forEach((pt, i) => {
      const x = (i / 160) * w;
      const y = clamp(midY - pt.emf * 5.2, 6, h - 6);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('AC Osiloskop: Mavi = Akı Φ_B(t), Kehribar = EMK ε(t)', 8, 14);
  }

  /* ==========================================================================
     MODÜL 4 BAŞLATICI VE DOKUNMATİK/FARE SÜRÜKLEME OLAYLARI
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod4 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['4_1', '4_2'].forEach((id) => {
      const pane = $(`mod4_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function init() {
    // 4.1 Kanvas üzerinde yük sürükleme
    const emCnv = $('emFieldCanvas');
    if (emCnv) {
      emCnv.addEventListener('pointerdown', (e) => {
        const rect = emCnv.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width * 0.5;
        const y = e.clientY - rect.top - rect.height * 0.5;
        const idx = state.charges.findIndex((c) => Math.hypot(c.x - x, c.y - y) < 24);
        if (idx >= 0) {
          state.draggingIdx = idx;
          emCnv.setPointerCapture(e.pointerId);
        }
      });
      emCnv.addEventListener('pointermove', (e) => {
        if (state.draggingIdx < 0) return;
        const rect = emCnv.getBoundingClientRect();
        state.charges[state.draggingIdx].x = e.clientX - rect.left - rect.width * 0.5;
        state.charges[state.draggingIdx].y = e.clientY - rect.top - rect.height * 0.5;
      });
      const endDrag = () => { state.draggingIdx = -1; };
      emCnv.addEventListener('pointerup', endDrag);
      emCnv.addEventListener('pointercancel', endDrag);
    }

    $('emAddPosBtn')?.addEventListener('click', () => {
      state.charges.push({ x: (Math.random() - 0.5) * 180, y: (Math.random() - 0.5) * 140, q: +1 });
    });
    $('emAddNegBtn')?.addEventListener('click', () => {
      state.charges.push({ x: (Math.random() - 0.5) * 180, y: (Math.random() - 0.5) * 140, q: -1 });
    });
    document.querySelectorAll('[data-em-preset]').forEach((btn) => {
      btn.addEventListener('click', () => applyChargePreset(btn.dataset.emPreset));
    });
    $('emBzSlider')?.addEventListener('input', (e) => {
      state.Bz = +e.target.value;
      $('emBzVal').textContent = `${state.Bz.toFixed(2)} T`;
    });
    $('emLaunchBtn')?.addEventListener('click', launchLorentzParticle);

    // 4.2 Kanvas üzerinde mıknatıs sürükleme
    const farCnv = $('faradayCanvas');
    if (farCnv) {
      farCnv.addEventListener('pointerdown', (e) => {
        state.draggingMagnet = true;
        state.autoGen = false;
        const chk = $('faradayAutoChk');
        if (chk) chk.checked = false;
        farCnv.setPointerCapture(e.pointerId);
      });
      farCnv.addEventListener('pointermove', (e) => {
        if (!state.draggingMagnet) return;
        const rect = farCnv.getBoundingClientRect();
        const newX = clamp(e.clientX - rect.left - rect.width * 0.54, -220, 220);
        state.magVx = (newX - state.magX) * 45;
        state.magX = newX;
      });
      const endMag = () => { state.draggingMagnet = false; };
      farCnv.addEventListener('pointerup', endMag);
      farCnv.addEventListener('pointercancel', endMag);
    }

    $('faradayTurnsSlider')?.addEventListener('input', (e) => {
      state.coilTurns = +e.target.value;
      $('faradayTurnsVal').textContent = `${state.coilTurns} Sarım`;
    });
    $('faradayFreqSlider')?.addEventListener('input', (e) => {
      state.genFreq = +e.target.value;
      $('faradayFreqVal').textContent = `${state.genFreq.toFixed(1)} Hz`;
    });
    $('faradayAutoChk')?.addEventListener('change', (e) => {
      state.autoGen = e.target.checked;
    });

    document.querySelectorAll('#mod4 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod4El = $('mod4');
      if (!mod4El || !mod4El.classList.contains('active')) return;
      const dt = Math.min(0.035, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '4_1') stepElectrostaticSandbox(dt);
      else if (state.activeSub === '4_2') stepFaradayInduction(dt);
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '4_1') {
      if (preset.preset) applyChargePreset(preset.preset);
      if (preset.Bz != null) {
        state.Bz = preset.Bz;
        $('emBzSlider').value = preset.Bz;
        $('emBzVal').textContent = `${preset.Bz.toFixed(2)} T`;
      }
      if (preset.launch) launchLorentzParticle();
    } else if (preset.sub === '4_2') {
      if (preset.autoGen != null) {
        state.autoGen = preset.autoGen;
        $('faradayAutoChk').checked = preset.autoGen;
      }
      if (preset.turns) {
        state.coilTurns = preset.turns;
        $('faradayTurnsSlider').value = preset.turns;
        $('faradayTurnsVal').textContent = `${preset.turns} Sarım`;
      }
    }
  }

  window.Mod4Electromag = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
