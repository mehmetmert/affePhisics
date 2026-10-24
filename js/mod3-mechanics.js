/* ============================================================================
   affePhysics — MODÜL 3: Klasik Mekanik, Dinamik ve Kaos Motoru (RK4 Çözücü)
   1. Serbest Cisim Diyagramı (FBD) & Kinematik Kum Havuzu
   2. Kaos Teorisi: Çift Sarkaç, Kapitza Ters Sarkacı, 3-Cisim & Faz Uzayı
   ============================================================================ */
(function () {
  'use strict';

  const { clamp, rk4Step, fitCanvas, drawVectorArrow } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '3_1',
    // 3.1: FBD & Kinematik
    fbdScene: 'incline', // 'incline' | 'atwood' | 'spring' | 'projectile'
    angle: 28,           // derece
    m1: 4.0,             // kg
    m2: 6.5,             // kg
    mu: 0.18,            // sürtünme katsayısı
    showFg: true,
    showN: true,
    showFric: true,
    showVel: true,
    showAcc: true,
    // 3.2: Kaos Motoru
    chaosSys: 'double',  // 'double' | 'kapitza' | 'threebody'
    th1Deg: 135,
    th2Deg: 115,
    L1: 1.2,
    L2: 1.0,
    ghostEnabled: true,
    damping: 0.0
  };

  /* ==========================================================================
     3.1. SERBEST CİSİM DİYAGRAMI (FBD) & KİNEMATİK SİMÜLATÖRÜ
     ========================================================================== */
  const fbdSim = {
    s: 0,
    v: 0,
    a: 0,
    pauseTimer: 0,
    draggingSpring: false,
    projX: 0,
    projY: 0,
    projVx: 0,
    projVy: 0,
    trail: [],
    history: []
  };

  function resetFBD() {
    fbdSim.s = 0;
    fbdSim.v = 0;
    fbdSim.a = 0;
    fbdSim.pauseTimer = 0;
    fbdSim.trail = [];
    fbdSim.history = [];
    const rad = (state.angle * Math.PI) / 180;
    const v0 = 44;
    fbdSim.projX = 0;
    fbdSim.projY = 0;
    fbdSim.projVx = v0 * Math.cos(rad);
    fbdSim.projVy = v0 * Math.sin(rad);
    if (state.fbdScene === 'spring') {
      // Yaylı osilatörü +115 px çekilmiş başlangıç genliğiyle başlat
      fbdSim.s = 115;
      fbdSim.v = 0;
    }
  }

  function stepFBD(dt) {
    const canvas = $('fbdCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const g = 9.81;
    const rad = (state.angle * Math.PI) / 180;
    const Fg = state.m1 * g;
    let N = 0;
    let fFric = 0;
    let netF = 0;

    if (state.fbdScene === 'incline') {
      const x0 = 90, y0 = h - 65;
      const rampLen = Math.min(w - 180, 400);
      const maxSlide = Math.max(80, rampLen - 135);

      const Fpar = Fg * Math.sin(rad);
      N = Fg * Math.cos(rad);
      const fMaxStatic = state.mu * N;

      if (Math.abs(fbdSim.v) < 0.01 && Fpar <= fMaxStatic) {
        // Statik sürtünme bloğu dengede tutuyor
        fFric = Fpar;
        netF = 0;
        fbdSim.a = 0;
        fbdSim.v = 0;
      } else {
        fFric = state.mu * N;
        netF = Math.max(0, Fpar - fFric);
        fbdSim.a = netF / state.m1;

        if (fbdSim.pauseTimer > 0) {
          // Alt takozda kısa bekleme, ardından hız=0 ile tepeden yeniden bırakma
          fbdSim.pauseTimer -= dt;
          fbdSim.v = 0;
          if (fbdSim.pauseTimer <= 0) {
            fbdSim.s = 0;
            fbdSim.v = 0;
          }
        } else {
          // Gerçek fiziksel ivmelenme: v = v0 + a*dt, s = s0 + v*dt (piksel ölçeği: 28 px = 1 m)
          const pxPerMeter = 28;
          fbdSim.v += fbdSim.a * dt;
          fbdSim.s += fbdSim.v * dt * pxPerMeter;
          if (fbdSim.s >= maxSlide) {
            fbdSim.s = maxSlide;
            fbdSim.v = 0; // Hızı sıfırla! Asla birikmesin!
            fbdSim.pauseTimer = 0.85;
          }
        }
      }

      // Eğik Düzlem Üçgenini Çiz
      const xTop = x0;
      const yTop = y0 - rampLen * Math.sin(rad);
      const xBot = x0 + rampLen * Math.cos(rad);
      const yBot = y0;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(xTop, yTop);
      ctx.lineTo(xBot, yBot);
      ctx.lineTo(xTop, yBot);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Alt durdurucu takoz
      const stopX = xTop + (65 + maxSlide + 26) * Math.cos(rad);
      const stopY = yTop + (65 + maxSlide + 26) * Math.sin(rad);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(stopX, stopY);
      ctx.lineTo(stopX + 22 * Math.sin(rad), stopY - 22 * Math.cos(rad));
      ctx.stroke();

      // Açı etiketi
      ctx.fillStyle = '#00f2fe';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(`θ = ${state.angle}°`, xBot - 82, yBot - 10);

      // Durum bilgisi
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 11px Inter';
      const statusTxt = (Fpar <= fMaxStatic && fbdSim.v === 0)
        ? '⚖️ Statik Denge: mg·sinθ ≤ μ_s·N (Hareket Yok)'
        : (fbdSim.pauseTimer > 0 ? '🛑 Alt Takoza Ulaştı (Hız Sıfırlandı, Tepeden Bırakılıyor...)' : `▶️ Kayma: x = ${(fbdSim.s / 28).toFixed(2)} m, v = ${fbdSim.v.toFixed(2)} m/s`);
      ctx.fillText(statusTxt, 20, 24);

      // Blok konumu
      const dist = 65 + clamp(fbdSim.s, 0, maxSlide);
      const bx = xTop + dist * Math.cos(rad) + 18 * Math.sin(rad);
      const by = yTop + dist * Math.sin(rad) - 18 * Math.cos(rad);

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(rad);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.2;
      ctx.fillRect(-24, -18, 48, 36);
      ctx.strokeRect(-24, -18, 48, 36);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.m1}kg`, 0, 4);
      ctx.restore();

      // FBD Kuvvet Vektör Okları
      const vScale = 1.35;
      if (state.showFg) {
        drawVectorArrow(ctx, bx, by, bx, by + Fg * vScale, '#ff3366', `mg (${Fg.toFixed(1)}N)`);
        drawVectorArrow(
          ctx, bx, by,
          bx + Fpar * vScale * Math.cos(rad),
          by + Fpar * vScale * Math.sin(rad),
          'rgba(255, 51, 102, 0.7)', `mg·sinθ (${Fpar.toFixed(1)}N)`
        );
      }
      if (state.showN) {
        drawVectorArrow(
          ctx, bx, by,
          bx + N * vScale * Math.sin(rad),
          by - N * vScale * Math.cos(rad),
          '#10b981', `N (${N.toFixed(1)}N)`
        );
      }
      if (state.showFric && fFric > 0.1) {
        drawVectorArrow(
          ctx, bx, by,
          bx - fFric * vScale * Math.cos(rad),
          by - fFric * vScale * Math.sin(rad),
          '#f59e0b', `f (${fFric.toFixed(1)}N)`
        );
      }
      if (state.showVel && Math.abs(fbdSim.v) > 0.08) {
        drawVectorArrow(
          ctx, bx, by - 26,
          bx + fbdSim.v * 14 * Math.cos(rad),
          by - 26 + fbdSim.v * 14 * Math.sin(rad),
          '#00f2fe', `v (${fbdSim.v.toFixed(1)}m/s)`
        );
      }
      if (state.showAcc && Math.abs(fbdSim.a) > 0.05) {
        drawVectorArrow(
          ctx, bx, by - 42,
          bx + fbdSim.a * 11 * Math.cos(rad),
          by - 42 + fbdSim.a * 11 * Math.sin(rad),
          '#a855f7', `a (${fbdSim.a.toFixed(2)}m/s²)`
        );
      }
    } else if (state.fbdScene === 'atwood') {
      // Atwood Makara Sistemi
      const totalM = state.m1 + state.m2;
      fbdSim.a = ((state.m2 - state.m1) / totalM) * g;
      const T = ((2 * state.m1 * state.m2) / totalM) * g;
      N = T;
      netF = (state.m2 - state.m1) * g;

      if (fbdSim.pauseTimer > 0) {
        fbdSim.pauseTimer -= dt;
        fbdSim.v = 0;
        if (fbdSim.pauseTimer <= 0) {
          fbdSim.s = 0;
          fbdSim.v = 0;
        }
      } else {
        fbdSim.v += fbdSim.a * dt;
        fbdSim.s += fbdSim.v * dt * 24;
        if (Math.abs(fbdSim.s) >= 92) {
          fbdSim.s = Math.sign(fbdSim.s) * 92;
          fbdSim.v = 0;
          fbdSim.pauseTimer = 0.9;
        }
      }

      const px = w * 0.5, py = 85, R = 44;
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, 20); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();

      const y1 = py + 145 - fbdSim.s;
      const y2 = py + 145 + fbdSim.s;
      const x1 = px - R, x2 = px + R;

      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, py); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, py); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#00f2fe';
      ctx.fillRect(x1 - 24, y1, 48, 42); ctx.strokeRect(x1 - 24, y1, 48, 42);
      ctx.strokeStyle = '#a855f7';
      ctx.fillRect(x2 - 24, y2, 48, 46); ctx.strokeRect(x2 - 24, y2, 46, 46);

      ctx.fillStyle = '#f8fafc'; ctx.font = '700 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(`m₁=${state.m1}kg`, x1, y1 + 25);
      ctx.fillText(`m₂=${state.m2}kg`, x2, y2 + 27);

      if (state.showFg) {
        drawVectorArrow(ctx, x1, y1 + 42, x1, y1 + 42 + state.m1 * g * 1.05, '#ff3366', `m₁g (${(state.m1 * g).toFixed(1)}N)`);
        drawVectorArrow(ctx, x2, y2 + 46, x2, y2 + 46 + state.m2 * g * 1.05, '#ff3366', `m₂g (${(state.m2 * g).toFixed(1)}N)`);
      }
      if (state.showN) {
        drawVectorArrow(ctx, x1, y1, x1, y1 - T * 1.05, '#10b981', `T (${T.toFixed(1)}N)`);
        drawVectorArrow(ctx, x2, y2, x2, y2 - T * 1.05, '#10b981', `T (${T.toFixed(1)}N)`);
      }
    } else if (state.fbdScene === 'spring') {
      // Yaylı Harmonik Osilatör — RK4 (Açısal frekans ω = sqrt(k/m))
      // Eğer genlik sönümlendiyse veya 0 ise otomatik olarak +115 px'ten başlat
      if (!fbdSim.draggingSpring && Math.abs(fbdSim.s) < 1.5 && Math.abs(fbdSim.v) < 1.5) {
        fbdSim.s = 115;
        fbdSim.v = 0;
      }

      const kSpring = 45 + state.angle * 1.2; // Açı kaydırıcısı yay sabiti k'yı da modüle eder (N/m)
      // Sürtünme 0.18 varsayılan olduğunda bile salınımın hemen ölmemesi için düşük sönümleme:
      const damp = state.mu <= 0.2 ? 0.0 : (state.mu - 0.2) * 1.8;

      if (!fbdSim.draggingSpring) {
        const sub = 4;
        const hSub = (dt * 2.4) / sub;
        for (let i = 0; i < sub; i++) {
          const next = rk4Step([fbdSim.s, fbdSim.v], 0, hSub, (st) => [
            st[1],
            (-kSpring * st[0] - damp * st[1]) / state.m1
          ]);
          fbdSim.s = next[0];
          fbdSim.v = next[1];
        }
      }

      fbdSim.a = (-kSpring * fbdSim.s - damp * fbdSim.v) / state.m1;
      netF = -kSpring * (fbdSim.s / 50); // Newton ölçekli
      N = Fg;
      fFric = damp * Math.abs(fbdSim.v) * 0.1;

      const wallX = 75, eqX = w * 0.54, cy = h * 0.56;
      const bx = clamp(eqX + fbdSim.s, wallX + 60, w - 55);

      // Denge Konumu (x = 0) Kesikli Çizgi
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.beginPath(); ctx.moveTo(eqX, cy - 85); ctx.lineTo(eqX, cy + 45); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#00f2fe';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Denge (x = 0)', eqX, cy + 58);

      // Duvar ve Zemin
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(wallX, cy - 68); ctx.lineTo(wallX, cy + 24); ctx.lineTo(w - 40, cy + 24); ctx.stroke();

      // Helisel Yay Çizimi
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(wallX, cy);
      const coils = 18;
      const span = Math.max(30, bx - 28 - wallX);
      for (let i = 1; i < coils; i++) {
        const cxCoil = wallX + (i / coils) * span;
        const cyCoil = cy + (i % 2 === 0 ? -15 : 15);
        ctx.lineTo(cxCoil, cyCoil);
      }
      ctx.lineTo(bx - 28, cy);
      ctx.stroke();

      // Kütle Bloğu
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2.4;
      ctx.fillRect(bx - 28, cy - 24, 56, 48);
      ctx.strokeRect(bx - 28, cy - 24, 56, 48);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(`${state.m1}kg`, bx, cy + 4);

      // Kuvvet ve Hız Vektörleri
      if (state.showFg) drawVectorArrow(ctx, bx, cy + 24, bx, cy + 24 + Fg * 1.1, '#ff3366', `mg (${Fg.toFixed(1)}N)`);
      if (state.showN) drawVectorArrow(ctx, bx, cy - 24, bx, cy - 24 - N * 1.1, '#10b981', `N (${N.toFixed(1)}N)`);
      if (state.showAcc && Math.abs(fbdSim.s) > 3) {
        drawVectorArrow(ctx, bx, cy, bx - fbdSim.s * 0.75, cy, '#a855f7', `F_yay = −kx (${netF.toFixed(1)}N)`);
      }
      if (state.showVel && Math.abs(fbdSim.v) > 3) {
        drawVectorArrow(ctx, bx, cy - 36, bx + fbdSim.v * 0.35, cy - 36, '#00f2fe', 'v');
      }

      // Üst Bilgi & Enerji Çubuğu (Ep = 1/2 kx², Ek = 1/2 mv²)
      const omega = Math.sqrt(kSpring / state.m1);
      const period = (2 * Math.PI) / omega;
      const Ep = 0.5 * kSpring * fbdSim.s * fbdSim.s;
      const Ek = 0.5 * state.m1 * fbdSim.v * fbdSim.v;
      const Etot = Math.max(1, Ep + Ek);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11.5px Inter';
      ctx.fillText(`Yaylı Harmonik Osilatör (k = ${kSpring.toFixed(0)} N/m, T = ${period.toFixed(2)} s) — Bloğu fareyle çekip bırakabilirsiniz!`, 20, 24);

      const barW = 220, barX = 20, barY = 34;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barX, barY, barW * (Ep / Etot), 8);
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(barX + barW * (Ep / Etot), barY, barW * (Ek / Etot), 8);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(`Turuncu: E_pot (1/2 kx²) = %${((Ep / Etot) * 100).toFixed(0)} · Mavi: E_kin (1/2 mv²) = %${((Ek / Etot) * 100).toFixed(0)}`, barX, barY + 20);
    } else {
      // Balistik Eğik Atış
      const drag = state.mu * 0.12;
      const next = rk4Step([fbdSim.projX, fbdSim.projY, fbdSim.projVx, fbdSim.projVy], 0, dt * 4.2, (st) => [
        st[2],
        st[3],
        -drag * st[2],
        -g - drag * st[3]
      ]);
      fbdSim.projX = next[0]; fbdSim.projY = next[1];
      fbdSim.projVx = next[2]; fbdSim.projVy = next[3];
      fbdSim.v = Math.hypot(fbdSim.projVx, fbdSim.projVy);
      fbdSim.a = g;
      netF = Fg;

      const ox = 75, oy = h - 65;
      const px = ox + fbdSim.projX * 2.4;
      const py = oy - fbdSim.projY * 2.4;
      fbdSim.trail.push([px, py]);
      if (py > oy && fbdSim.projVy < 0) resetFBD();

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      fbdSim.trail.forEach(([tx, ty], i) => {
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      });
      ctx.stroke();

      ctx.fillStyle = '#00f2fe';
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      if (state.showFg) drawVectorArrow(ctx, px, py, px, py + 42, '#ff3366', 'mg');
      if (state.showVel) drawVectorArrow(ctx, px, py, px + fbdSim.projVx * 1.1, py - fbdSim.projVy * 1.1, '#00f2fe', 'v');
    }

    // Telemetri ve Osiloskop
    $('telFbdNetF').textContent = `${netF.toFixed(2)} N`;
    $('telFbdAccel').textContent = `${fbdSim.a.toFixed(2)} m/s²`;
    $('telFbdVel').textContent = `${(state.fbdScene === 'spring' ? fbdSim.v / 50 : fbdSim.v).toFixed(2)} m/s`;
    $('telFbdNormal').textContent = `${N.toFixed(2)} N`;

    const oscV = state.fbdScene === 'spring' ? fbdSim.s * 0.25 : fbdSim.v * 6;
    const oscA = state.fbdScene === 'spring' ? fbdSim.v * 0.08 : fbdSim.a * 4;
    fbdSim.history.push({ v: oscV, a: oscA });
    if (fbdSim.history.length > 160) fbdSim.history.shift();
    drawFbdOscilloscope();
  }

  function drawFbdOscilloscope() {
    const canvas = $('fbdPlotCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const midY = h * 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

    ctx.beginPath();
    fbdSim.history.forEach((pt, i) => {
      const x = (i / 160) * w;
      const y = clamp(midY - pt.v, 8, h - 8);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    fbdSim.history.forEach((pt, i) => {
      const x = (i / 160) * w;
      const y = clamp(midY - pt.a, 8, h - 8);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(
      state.fbdScene === 'spring'
        ? 'Canlı Osiloskop: Mavi = x(t) Konum, Mor = v(t) Hız'
        : 'Canlı Osiloskop: Mavi = v(t) Hız, Mor = a(t) İvme',
      8, 14
    );
  }

  /* ==========================================================================
     3.2. KAOS TEORİSİ, ÇİFT SARKAÇ, KAPITZA SARKACI VE FAZ UZAYI (RK4)
     ========================================================================== */
  const chaosSim = {
    y1: [2.356, 2.007, 0, 0],               // Ana sarkaç [θ1, θ2, ω1, ω2]
    y2: [2.356 + 0.00001745, 2.007, 0, 0],  // Hayalet sarkaç (Δθ = 0.001°)
    trail1: [],
    trail2: [],
    phasePts: [],
    t: 0,
    bodies: []
  };

  function resetChaos() {
    const th1 = (state.th1Deg * Math.PI) / 180;
    const th2 = (state.th2Deg * Math.PI) / 180;
    const delta = 0.001 * (Math.PI / 180);
    chaosSim.y1 = [th1, th2, 0, 0];
    chaosSim.y2 = [th1 + delta, th2, 0, 0];
    chaosSim.trail1 = [];
    chaosSim.trail2 = [];
    chaosSim.phasePts = [];
    chaosSim.t = 0;

    if (state.chaosSys === 'kapitza') {
      // Baş aşağı (θ = 180° = π tepe noktasına yakın, örn. 166°) başlat:
      // Mavi sarkaç: Hızlı düşey titreşimli Kapitza sarkacı (baş aşağı dengede kalır!)
      // Mor sarkaç (Hayalet): Titreşimsiz normal sarkaç (yerçekimiyle hemen aşağı düşer!)
      const startAngle = (state.th1Deg >= 145 && state.th1Deg <= 179)
        ? (state.th1Deg * Math.PI) / 180
        : Math.PI - 0.24; // ~166°
      chaosSim.y1 = [startAngle, 0, 0, 0];
      chaosSim.y2 = [startAngle, 0, 0, 0];
    } else if (state.chaosSys === 'threebody') {
      chaosSim.bodies = [
        { x: -95, y: 0, vx: 28, vy: 42, color: '#00f2fe', trail: [] },
        { x: 95, y: 0, vx: 28, vy: 42, color: '#ff3366', trail: [] },
        { x: 0, y: 15, vx: -56, vy: -84, color: '#a855f7', trail: [] }
      ];
    }
  }

  // Tam Lagrange Çift Sarkaç Türev Fonksiyonu (RK4 için)
  function doublePendulumDeriv(st) {
    const [th1, th2, w1, w2] = st;
    const m1 = 1.0, m2 = 1.0;
    const L1 = state.L1, L2 = state.L2;
    const g = 9.81;
    const d = th1 - th2;
    const den1 = (2 * m1 + m2 - m2 * Math.cos(2 * th1 - 2 * th2));
    const a1 = (
      -g * (2 * m1 + m2) * Math.sin(th1)
      - m2 * g * Math.sin(th1 - 2 * th2)
      - 2 * Math.sin(d) * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))
    ) / (L1 * den1) - state.damping * w1;

    const a2 = (
      2 * Math.sin(d) * (
        w1 * w1 * L1 * (m1 + m2)
        + g * (m1 + m2) * Math.cos(th1)
        + w2 * w2 * L2 * m2 * Math.cos(d)
      )
    ) / (L2 * den1) - state.damping * w2;

    return [w1, w2, a1, a2];
  }

  function stepChaos(dt) {
    const canvas = $('chaosCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.46;
    const subSteps = 6;
    const hStep = (dt * 1.25) / subSteps;

    if (state.chaosSys === 'double') {
      for (let s = 0; s < subSteps; s++) {
        chaosSim.y1 = rk4Step(chaosSim.y1, chaosSim.t, hStep, doublePendulumDeriv);
        if (state.ghostEnabled) {
          chaosSim.y2 = rk4Step(chaosSim.y2, chaosSim.t, hStep, doublePendulumDeriv);
        }
        chaosSim.t += hStep;
      }

      const scale = 88;
      const drawArm = (yVec, col, trail, isGhost) => {
        const x1 = cx + state.L1 * scale * Math.sin(yVec[0]);
        const y1 = cy + state.L1 * scale * Math.cos(yVec[0]);
        const x2 = x1 + state.L2 * scale * Math.sin(yVec[1]);
        const y2 = y1 + state.L2 * scale * Math.cos(yVec[1]);

        trail.push([x2, y2]);
        if (trail.length > 220) trail.shift();

        ctx.beginPath();
        trail.forEach(([tx, ty], i) => {
          if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
        });
        ctx.strokeStyle = isGhost ? 'rgba(168, 85, 247, 0.55)' : 'rgba(0, 242, 254, 0.72)';
        ctx.lineWidth = isGhost ? 1.8 : 2.4;
        ctx.stroke();

        ctx.strokeStyle = col;
        ctx.lineWidth = isGhost ? 2.2 : 3.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x1, y1, isGhost ? 6 : 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, isGhost ? 7 : 9.5, 0, Math.PI * 2); ctx.fill();
      };

      if (state.ghostEnabled) drawArm(chaosSim.y2, '#a855f7', chaosSim.trail2, true);
      drawArm(chaosSim.y1, '#00f2fe', chaosSim.trail1, false);

      chaosSim.phasePts.push([chaosSim.y1[0], chaosSim.y1[2]]);
      if (chaosSim.phasePts.length > 320) chaosSim.phasePts.shift();

      const diffDeg = (Math.abs(chaosSim.y1[1] - chaosSim.y2[1]) * 180) / Math.PI;
      $('telChaosDiff').textContent = `${diffDeg.toFixed(3)}°`;
      $('telChaosOmega1').textContent = `${chaosSim.y1[2].toFixed(2)} rad/s`;
      $('telChaosOmega2').textContent = `${chaosSim.y1[3].toFixed(2)} rad/s`;
    } else if (state.chaosSys === 'kapitza') {
      // Kapitza Titreşimli Ters Sarkaç:
      // Tam hareket denklemi: d²θ/dt² = -[(g + a*ω_d²*cos(ω_d*t)) / L] * sin(θ) - γ * dθ/dt
      // Kapitza kararlılık kriteri: (a * ω_d)² > 2 * g * L
      const L = Math.max(0.6, state.L1);
      const amp = 0.14;   // Titreşim genliği a (m)
      const wd = 65.0;    // Yüksek titreşim frekansı ω_d (rad/s) -> (a*wd)² = 82.8 > 2*g*L = 23.5
      const steps = 40;   // Yüksek frekanslı sürücüyü tam çözmek için 40 RK4 alt adımı
      const dtSmall = dt / steps;

      for (let s = 0; s < steps; s++) {
        // 1. Mavi Sarkaç: Kapitza yüksek frekanslı düşey titreşimli (baş aşağı kararlı!)
        chaosSim.y1 = rk4Step(chaosSim.y1, chaosSim.t, dtSmall, (st, tNow) => {
          const th = st[0], w1 = st[2];
          const aEff = -((9.81 + amp * wd * wd * Math.cos(wd * tNow)) / L) * Math.sin(th) - 0.45 * w1;
          return [w1, 0, aEff, 0];
        });

        // 2. Mor Sarkaç (Karşılaştırma): Titreşimsiz normal sarkaç (hemen aşağı düşer!)
        if (state.ghostEnabled) {
          chaosSim.y2 = rk4Step(chaosSim.y2, chaosSim.t, dtSmall, (st) => {
            const th = st[0], w1 = st[2];
            const aGrav = -(9.81 / L) * Math.sin(th) - 0.25 * w1;
            return [w1, 0, aGrav, 0];
          });
        }
        chaosSim.t += dtSmall;
      }

      const baseCy = cy + 45;
      const rodLen = 145;

      // Üst kararlılık konisini ve dikey ekseni çiz
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cx, baseCy); ctx.lineTo(cx, baseCy - rodLen - 25);
      ctx.moveTo(cx, baseCy); ctx.lineTo(cx - 55, baseCy - rodLen);
      ctx.moveTo(cx, baseCy); ctx.lineTo(cx + 55, baseCy - rodLen);
      ctx.stroke();
      ctx.restore();

      // Mor Sarkaç (Titreşimsiz — Aşağı Düşen Klasik Sarkaç)
      if (state.ghostEnabled) {
        const gx = cx + rodLen * Math.sin(chaosSim.y2[0]);
        const gy = baseCy + rodLen * Math.cos(chaosSim.y2[0]);
        chaosSim.trail2.push([gx, gy]);
        if (chaosSim.trail2.length > 140) chaosSim.trail2.shift();

        ctx.beginPath();
        chaosSim.trail2.forEach(([tx, ty], i) => {
          if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
        });
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, baseCy); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(gx, gy, 9, 0, Math.PI * 2); ctx.fill();
      }

      // Mavi Sarkaç (Kapitza Düşey Sarsıcılı — Baş Aşağı Kararlı!)
      const pivotY = baseCy + Math.cos(wd * chaosSim.t) * 12;
      const bx = cx + rodLen * Math.sin(chaosSim.y1[0]);
      const by = pivotY + rodLen * Math.cos(chaosSim.y1[0]);

      chaosSim.trail1.push([bx, by]);
      if (chaosSim.trail1.length > 160) chaosSim.trail1.shift();
      ctx.beginPath();
      chaosSim.trail1.forEach(([tx, ty], i) => {
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      });
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Motorlu Düşey Sarsıcı Piston Görseli
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 22, baseCy + 18, 44, 28);
      ctx.strokeRect(cx - 22, baseCy + 18, 44, 28);
      ctx.beginPath(); ctx.moveTo(cx, baseCy + 18); ctx.lineTo(cx, pivotY); ctx.stroke();

      ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(cx, pivotY, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3366';
      ctx.shadowColor = '#ff3366'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Açıklama başlığı
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11.5px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('Kapitza Ters Sarkacı: Mavi = Düşey Titreşimli (Tepe Noktasında Kararlı!) · Mor = Titreşimsiz (Aşağı Düşer)', 18, 24);

      const tiltFromTopDeg = ((Math.PI - chaosSim.y1[0]) * 180) / Math.PI;
      chaosSim.phasePts.push([chaosSim.y1[0] - Math.PI, chaosSim.y1[2]]);
      if (chaosSim.phasePts.length > 320) chaosSim.phasePts.shift();

      $('telChaosDiff').textContent = `${tiltFromTopDeg.toFixed(1)}° (Tepe)`;
      $('telChaosOmega1').textContent = `${chaosSim.y1[2].toFixed(2)} rad/s`;
      $('telChaosOmega2').textContent = state.ghostEnabled ? `${chaosSim.y2[2].toFixed(2)} rad/s` : 'Kapalı';
    } else {
      // 3-Cisim Kütleçekim Problemi (RK4)
      const G = 420000;
      const b = chaosSim.bodies;
      for (let s = 0; s < 4; s++) {
        const dtSub = (dt * 1.4) / 4;
        const stateVec = [
          b[0].x, b[0].y, b[0].vx, b[0].vy,
          b[1].x, b[1].y, b[1].vx, b[1].vy,
          b[2].x, b[2].y, b[2].vx, b[2].vy
        ];
        const next = rk4Step(stateVec, 0, dtSub, (st) => {
          const out = new Array(12).fill(0);
          for (let i = 0; i < 3; i++) {
            out[i * 4] = st[i * 4 + 2];
            out[i * 4 + 1] = st[i * 4 + 3];
            let ax = 0, ay = 0;
            for (let j = 0; j < 3; j++) {
              if (i === j) continue;
              const dx = st[j * 4] - st[i * 4];
              const dy = st[j * 4 + 1] - st[i * 4 + 1];
              const r2 = dx * dx + dy * dy + 400;
              const r = Math.sqrt(r2);
              ax += (G * dx) / (r2 * r);
              ay += (G * dy) / (r2 * r);
            }
            out[i * 4 + 2] = ax;
            out[i * 4 + 3] = ay;
          }
          return out;
        });
        for (let i = 0; i < 3; i++) {
          b[i].x = next[i * 4]; b[i].y = next[i * 4 + 1];
          b[i].vx = next[i * 4 + 2]; b[i].vy = next[i * 4 + 3];
        }
      }

      b.forEach((body) => {
        body.trail.push([cx + body.x, cy + body.y]);
        if (body.trail.length > 180) body.trail.shift();
        ctx.beginPath();
        body.trail.forEach(([tx, ty], i) => {
          if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
        });
        ctx.strokeStyle = body.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = body.color;
        ctx.beginPath(); ctx.arc(cx + body.x, cy + body.y, 9, 0, Math.PI * 2); ctx.fill();
      });

      chaosSim.phasePts.push([b[0].x * 0.02, b[0].vx * 0.08]);
      if (chaosSim.phasePts.length > 320) chaosSim.phasePts.shift();

      $('telChaosDiff').textContent = '3-Cisim Kaos';
      $('telChaosOmega1').textContent = `${Math.hypot(b[0].vx, b[0].vy).toFixed(1)} px/s`;
      $('telChaosOmega2').textContent = `${Math.hypot(b[1].vx, b[1].vy).toFixed(1)} px/s`;
    }

    drawPhaseSpacePlot();
  }

  function drawPhaseSpacePlot() {
    const canvas = $('chaosPhaseCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5, cy = h * 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();

    ctx.beginPath();
    chaosSim.phasePts.forEach(([th, om], idx) => {
      const wrappedTh = ((th + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const x = cx + (wrappedTh / Math.PI) * (w * 0.44);
      const y = cy - (om / 12.0) * (h * 0.44);
      if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('Canlı Faz Uzayı Portresi (θ vs ω)', 8, 14);
  }

  /* ==========================================================================
     MODÜL 3 BAŞLATICI VE KONTROLLER
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod3 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['3_1', '3_2'].forEach((id) => {
      const pane = $(`mod3_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function init() {
    // 3.1 Kontrolleri
    document.querySelectorAll('[data-fbd-scene]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.fbdScene = btn.dataset.fbdScene;
        document.querySelectorAll('[data-fbd-scene]').forEach((b) =>
          b.classList.toggle('active', b.dataset.fbdScene === state.fbdScene)
        );
        resetFBD();
      });
    });
    $('fbdAngleSlider')?.addEventListener('input', (e) => {
      state.angle = +e.target.value;
      $('fbdAngleVal').textContent = `${state.angle}°`;
      if (state.fbdScene !== 'spring') resetFBD();
    });
    $('fbdM1Slider')?.addEventListener('input', (e) => {
      state.m1 = +e.target.value;
      $('fbdM1Val').textContent = `${state.m1.toFixed(1)} kg`;
    });
    $('fbdMuSlider')?.addEventListener('input', (e) => {
      state.mu = +e.target.value;
      $('fbdMuVal').textContent = state.mu.toFixed(2);
    });
    ['Fg', 'N', 'Fric', 'Vel', 'Acc'].forEach((k) => {
      $(`chkShow${k}`)?.addEventListener('change', (e) => {
        state[`show${k}`] = e.target.checked;
      });
    });
    $('fbdResetBtn')?.addEventListener('click', resetFBD);

    // Yaylı osilatörde veya eğik düzlemde fareyle bloğu çekip bırakma
    const fbdCanvas = $('fbdCanvas');
    fbdCanvas?.addEventListener('pointerdown', (e) => {
      if (state.fbdScene !== 'spring') return;
      fbdSim.draggingSpring = true;
      const rect = fbdCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      fbdSim.s = clamp(x - rect.width * 0.54, -160, 160);
      fbdSim.v = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (!fbdSim.draggingSpring || !fbdCanvas) return;
      const rect = fbdCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      fbdSim.s = clamp(x - rect.width * 0.54, -160, 160);
      fbdSim.v = 0;
    });
    window.addEventListener('pointerup', () => {
      fbdSim.draggingSpring = false;
    });

    // 3.2 Kontrolleri
    document.querySelectorAll('[data-chaos-sys]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.chaosSys = btn.dataset.chaosSys;
        document.querySelectorAll('[data-chaos-sys]').forEach((b) =>
          b.classList.toggle('active', b.dataset.chaosSys === state.chaosSys)
        );
        resetChaos();
      });
    });
    $('chaosTh1Slider')?.addEventListener('input', (e) => {
      state.th1Deg = +e.target.value;
      $('chaosTh1Val').textContent = `${state.th1Deg}°`;
      resetChaos();
    });
    $('chaosTh2Slider')?.addEventListener('input', (e) => {
      state.th2Deg = +e.target.value;
      $('chaosTh2Val').textContent = `${state.th2Deg}°`;
      resetChaos();
    });
    $('chaosL1Slider')?.addEventListener('input', (e) => {
      state.L1 = +e.target.value;
      $('chaosL1Val').textContent = `${state.L1.toFixed(1)} m`;
    });
    $('chaosGhostChk')?.addEventListener('change', (e) => {
      state.ghostEnabled = e.target.checked;
    });
    $('chaosResetBtn')?.addEventListener('click', resetChaos);

    document.querySelectorAll('#mod3 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    resetFBD();
    resetChaos();

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod3El = $('mod3');
      if (!mod3El || !mod3El.classList.contains('active')) return;
      const dt = Math.min(0.035, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '3_1') stepFBD(dt);
      else if (state.activeSub === '3_2') stepChaos(dt);
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '3_1') {
      if (preset.scene) {
        state.fbdScene = preset.scene;
        document.querySelectorAll('[data-fbd-scene]').forEach((b) =>
          b.classList.toggle('active', b.dataset.fbdScene === state.fbdScene)
        );
      }
      if (preset.angle != null) {
        state.angle = preset.angle;
        $('fbdAngleSlider').value = preset.angle;
        $('fbdAngleVal').textContent = `${preset.angle}°`;
      }
      if (preset.mu != null) {
        state.mu = preset.mu;
        $('fbdMuSlider').value = preset.mu;
        $('fbdMuVal').textContent = preset.mu.toFixed(2);
      }
      resetFBD();
    } else if (preset.sub === '3_2') {
      if (preset.sys) {
        state.chaosSys = preset.sys;
        document.querySelectorAll('[data-chaos-sys]').forEach((b) =>
          b.classList.toggle('active', b.dataset.chaosSys === state.chaosSys)
        );
      }
      if (preset.th1 != null) {
        state.th1Deg = preset.th1;
        $('chaosTh1Slider').value = preset.th1;
        $('chaosTh1Val').textContent = `${preset.th1}°`;
      }
      if (preset.th2 != null) {
        state.th2Deg = preset.th2;
        $('chaosTh2Slider').value = preset.th2;
        $('chaosTh2Val').textContent = `${preset.th2}°`;
      }
      if (preset.ghost != null) {
        state.ghostEnabled = preset.ghost;
        $('chaosGhostChk').checked = preset.ghost;
      }
      resetChaos();
    }
  }

  window.Mod3Mechanics = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
