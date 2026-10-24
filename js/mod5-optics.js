/* ============================================================================
   affePhysics — MODÜL 5: Geometrik Optik, Kuantum Çift Yarık & Kardeş Kuantum Deneyleri
   5.1. Canlı Cam Mercekler, Fiber Optik & Cauchy Dispersiyon Prizması
   5.2. Young & Tonomura Kuantum Çift Yarık, Kuantum Silgi (Eraser) & Aharonov-Bohm
   5.3. Stern-Gerlach Spin Kuantizasyonu, Mach-Zehnder Gecikmeli Seçim & Davisson-Germer
   ============================================================================ */
(function () {
  'use strict';

  const { clamp, wavelengthToColor, fitCanvas } = window.PhysCore;
  const $ = (id) => document.getElementById(id);

  const state = {
    activeSub: '5_1',
    // 5.1: Astra AI Bending Light (Işığın Kırılması), Mercekler & Cauchy Prizması
    optElement: 'bending', // 'bending' | 'prism' | 'convex' | 'concave' | 'fiber'
    n1: 1.000,             // Üst ortam kırılma indisi
    n2: 1.520,             // Alt ortam kırılma indisi
    showProtractor: true,  // 360° İletki (Açıölçer)
    lightBursts: [],       // Ateşlenen foton/dalga darbeleri
    draggingLaser: false,
    beamAngle: 42,         // Gelme açısı θ₁ (Normal ile yapılan açı veya ışın açısı)
    glassIndexA: 1.52,
    dispersionB: 0.014,
    whiteLight: false,
    monoLambda: 532,

    // 5.2: Kuantum Çift Yarık, Kuantum Silgi & Aharonov-Bohm
    slitParticle: 'electron', // 'electron' | 'photon' | 'buckyball' | 'neutron' | 'classical'
    slitMode: 'quantum',      // 'quantum' | 'wave' | 'iso3d' | 'both'
    slitCount: 2,             // N = 1..5
    slitDist: 48,             // d (μm)
    slitWidth: 12,            // a (μm)
    slitLambda: 520,          // nm (görsel/etkin dalga boyu)
    slitRate: 8,              // parçacık/kare
    whichWayDetector: false,
    quantumEraser: false,
    abFlux: 0.0,              // Φ_B / Φ_0 (-1..+1)
    electronHits: [],
    flyingPackets: [],
    bins: new Float32Array(120),

    // 5.3: Kardeş Kuantum Deneyleri
    qexpType: 'sterngerlach', // 'sterngerlach' | 'machzehnder' | 'davisson'
    // Stern-Gerlach
    sgGrad: 1.4,
    sgMode: 'quantum',        // 'quantum' | 'classical' | 'sequential'
    sgParticles: [],
    sgHits: [],
    // Mach-Zehnder
    mzPhasePi: 0.0,           // 0..2 π
    mzBS2: true,
    mzSpy: false,
    mzPhotons: [],
    mzCountD1: 0,
    mzCountD2: 0,
    // Davisson-Germer
    dgVolt: 54,
    dgSpacing: 0.215
  };

  /* ==========================================================================
     5.1. ASTRA LAB "BENDING LIGHT" (IŞIĞIN KIRILMASI), MERCEKLER & CAUCHY PRİZMA
     ========================================================================== */
  function drawBendingLight(ctx, w, h, dt = 0.016) {
    const cx = w * 0.5, cy = h * 0.52;
    const n1 = state.n1;
    const n2 = state.glassIndexA; // Alt ortam indisi hem seçiciden hem kaydırıcıdan güncellenir

    // 1. Üst Ortam (n1) ve Alt Ortam (n2) Görsel Katmanları
    const topAlpha = clamp((n1 - 1.0) * 0.25, 0.02, 0.35);
    const botAlpha = clamp((n2 - 1.0) * 0.25, 0.02, 0.38);

    ctx.fillStyle = `rgba(56, 189, 248, ${topAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, w, cy);
    ctx.fillStyle = `rgba(0, 242, 254, ${botAlpha.toFixed(3)})`;
    ctx.fillRect(0, cy, w, h - cy);

    // Ara yüzey sınır çizgisi ve Normal (N) doğrusu
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx, 18); ctx.lineTo(cx, h - 18); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('Normal (N)', cx + 8, 30);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`ÜST ORTAM: n₁ = ${n1.toFixed(3)} (v₁ = ${(1 / n1).toFixed(2)} c)`, 18, 28);
    ctx.fillText(`ALT ORTAM: n₂ = ${n2.toFixed(3)} (v₂ = ${(1 / n2).toFixed(2)} c)`, 18, h - 16);

    // 2. 360° İletki (Protractor) Çizimi
    if (state.showProtractor) {
      const pR = Math.min(w, h) * 0.34;
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.32)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, pR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, pR - 14, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (let deg = 0; deg < 360; deg += 10) {
        // Normal (dikey eksen) 0° olacak şekilde ölçeklendir
        const rad = ((deg - 90) * Math.PI) / 180;
        const inner = deg % 30 === 0 ? pR - 14 : pR - 7;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
        ctx.lineTo(cx + Math.cos(rad) * pR, cy + Math.sin(rad) * pR);
        ctx.stroke();
        if (deg % 30 === 0) {
          const dispDeg = deg <= 90 ? deg : (deg <= 180 ? 180 - deg : (deg <= 270 ? deg - 180 : 360 - deg));
          ctx.fillText(`${dispDeg}°`, cx + Math.cos(rad) * (pR + 12), cy + Math.sin(rad) * (pR + 12) + 3);
        }
      }
      ctx.restore();
    }

    // 3. Kritik Açı (θ_c) Konisi (Eğer n1 > n2 ise)
    let critDeg = null;
    if (n1 > n2) {
      const critRad = Math.asin(clamp(n2 / n1, 0, 1));
      critDeg = (critRad * 180) / Math.PI;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - Math.sin(critRad) * 220, cy - Math.cos(critRad) * 220);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(critRad) * 220, cy - Math.cos(critRad) * 220);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Gelen Işın, Yansıyan Işın ve Kırılan Işın (Snell + Fresnel Denklemleri)
    const th1Deg = clamp(Math.abs(state.beamAngle), 0, 86);
    const signX = state.beamAngle >= 0 ? -1 : 1; // Sol üstten veya sağ üstten geliş
    const th1 = (th1Deg * Math.PI) / 180;
    const beamLen = Math.max(w, h) * 0.46;

    const srcX = cx + signX * Math.sin(th1) * (beamLen * 0.78);
    const srcY = cy - Math.cos(th1) * (beamLen * 0.78);

    // Gelen ışın
    const baseCol = state.whiteLight ? '#ffffff' : '#00f2fe';
    ctx.strokeStyle = baseCol;
    ctx.shadowColor = baseCol; ctx.shadowBlur = 14;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(srcX, srcY);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lazer Gövdesi (Sürüklenebilir)
    ctx.save();
    ctx.translate(srcX, srcY);
    ctx.rotate(Math.atan2(cy - srcY, cx - srcX));
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.fillRect(-36, -11, 42, 22);
    ctx.strokeRect(-36, -11, 42, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText('LAZER', -30, 3);
    ctx.restore();

    // Snell Yasası: n1 * sin(θ1) = n2 * sin(θ2) ve Fresnel Yansıma Oranı (R)
    const sinTh2 = (n1 * Math.sin(th1)) / n2;
    let R = 1.0;
    let th2 = Math.PI * 0.5;
    let isTIR = false;

    if (sinTh2 >= 1.0) {
      isTIR = true;
      R = 1.0; // %100 Tam İç Yansıma!
    } else {
      th2 = Math.asin(clamp(sinTh2, -1, 1));
      const c1 = Math.cos(th1), c2 = Math.cos(th2);
      const rs = Math.pow((n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2 + 1e-9), 2);
      const rp = Math.pow((n1 * c2 - n2 * c1) / (n1 * c2 + n2 * c1 + 1e-9), 2);
      R = clamp(0.5 * (rs + rp), 0, 1);
    }
    const T = 1.0 - R;

    // Yansıyan Işın (θ_yansıma = θ1)
    const reflX = cx - signX * Math.sin(th1) * beamLen;
    const reflY = cy - Math.cos(th1) * beamLen;
    ctx.strokeStyle = isTIR ? '#ff3366' : `rgba(0, 242, 254, ${clamp(0.18 + R * 0.82, 0.2, 1.0).toFixed(2)})`;
    ctx.lineWidth = 1.5 + R * 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(reflX, reflY);
    ctx.stroke();

    // Kırılan Işın(lar) (Tam iç yansıma yoksa)
    if (!isTIR) {
      if (state.whiteLight) {
        const lams = [700, 640, 580, 530, 480, 430, 390];
        lams.forEach((lam) => {
          const lamUm = lam / 1000;
          const n2Lam = n2 + (state.dispersionB * 4.2) / (lamUm * lamUm) - state.dispersionB * 12;
          const s2 = clamp((n1 * Math.sin(th1)) / n2Lam, -0.999, 0.999);
          const t2 = Math.asin(s2);
          const rx = cx - signX * Math.sin(t2) * beamLen;
          const ry = cy + Math.cos(t2) * beamLen;
          ctx.strokeStyle = wavelengthToColor(lam, clamp(0.35 + T * 0.65, 0.3, 1.0));
          ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.stroke();
        });
      } else {
        const refrX = cx - signX * Math.sin(th2) * beamLen;
        const refrY = cy + Math.cos(th2) * beamLen;
        ctx.strokeStyle = `rgba(16, 185, 129, ${clamp(0.25 + T * 0.75, 0.25, 1.0).toFixed(2)})`;
        ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5 + T * 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refrX, refrY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // 5. Ateşlenen Foton Darbeleri (Light Bursts)
    for (let i = state.lightBursts.length - 1; i >= 0; i--) {
      const b = state.lightBursts[i];
      b.u += dt * 1.1;
      if (b.u >= 2.0) {
        state.lightBursts.splice(i, 1);
        continue;
      }
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
      if (b.u < 1.0) {
        const bx = srcX + (cx - srcX) * b.u;
        const by = srcY + (cy - srcY) * b.u;
        ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, Math.PI * 2); ctx.fill();
      } else {
        const u2 = b.u - 1.0;
        // Yansıyan darbe
        const rbx = cx + (reflX - cx) * u2;
        const rby = cy + (reflY - cy) * u2;
        ctx.beginPath(); ctx.arc(rbx, rby, 4.5, 0, Math.PI * 2); ctx.fill();
        // Kırılan darbe (ortam hızıyla ölçekli: v2/v1 = n1/n2)
        if (!isTIR) {
          const speedRatio = clamp(n1 / n2, 0.35, 1.8);
          const refrX = cx - signX * Math.sin(th2) * beamLen;
          const refrY = cy + Math.cos(th2) * beamLen;
          const tbx = cx + (refrX - cx) * (u2 * speedRatio);
          const tby = cy + (refrY - cy) * (u2 * speedRatio);
          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(tbx, tby, 6, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    }

    // 6. Canlı Telemetri Etiketleri
    const th2Deg = (th2 * 180) / Math.PI;
    ctx.fillStyle = '#00f2fe';
    ctx.font = '700 11.5px "JetBrains Mono", monospace';
    ctx.fillText(`Gelen: θ₁ = ${th1Deg.toFixed(1)}° (%100)`, cx - 165, cy - 12);
    ctx.fillStyle = isTIR ? '#ff3366' : '#38bdf8';
    ctx.fillText(`Yansıyan: θ_r = ${th1Deg.toFixed(1)}° (%${(R * 100).toFixed(1)})`, cx + 22, cy - 12);

    if (isTIR) {
      ctx.fillStyle = '#ff3366';
      ctx.fillText(`🔥 TAM İÇ YANSIMA! (θ₁ = ${th1Deg.toFixed(1)}° > θ_c = ${critDeg.toFixed(1)}°)`, cx - 135, cy + 32);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.fillText(`Kırılan: θ₂ = ${th2Deg.toFixed(1)}° (%${(T * 100).toFixed(1)})`, cx + 22, cy + 28);
    }

    if ($('telOptIndex')) $('telOptIndex').textContent = `${(n2 / n1).toFixed(2)} (${n1.toFixed(2)}→${n2.toFixed(2)})`;
    if ($('telOptCrit')) {
      $('telOptCrit').textContent = critDeg != null ? `${critDeg.toFixed(1)}°` : (n2 > n1 ? `${((Math.asin(n1 / n2) * 180) / Math.PI).toFixed(1)}° (Alttan)` : 'Yok (n₁=n₂)');
    }
    if ($('telOptFocal')) {
      $('telOptFocal').textContent = isTIR
        ? `Tam İç Yansıma! (%100 Yansıma, θ_c = ${critDeg.toFixed(1)}°)`
        : `θ₂ = ${th2Deg.toFixed(1)}° · Kırılan %${(T * 100).toFixed(1)} · Yansıyan %${(R * 100).toFixed(1)}`;
    }
  }

  function stepRayOptics(dt = 0.016) {
    const canvas = $('rayOpticsCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    if (state.optElement === 'bending') {
      drawBendingLight(ctx, w, h, dt);
      return;
    }

    const cx = w * 0.5, cy = h * 0.52;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy); ctx.stroke();
    ctx.setLineDash([]);

    const criticalDeg = (Math.asin(1 / Math.max(1.01, state.glassIndexA)) * 180) / Math.PI;
    if ($('telOptIndex')) $('telOptIndex').textContent = state.glassIndexA.toFixed(2);
    if ($('telOptCrit')) $('telOptCrit').textContent = `${criticalDeg.toFixed(1)}°`;

    if (state.optElement === 'prism') {
      const R = 115;
      const pTop = { x: cx, y: cy - R * 0.92 };
      const pLeft = { x: cx - R, y: cy + R * 0.72 };
      const pRight = { x: cx + R, y: cy + R * 0.72 };

      const grad = ctx.createLinearGradient(pLeft.x, pTop.y, pRight.x, pRight.y);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0.22)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.22)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const hit1 = { x: (pTop.x + pLeft.x) * 0.5, y: (pTop.y + pLeft.y) * 0.5 };
      const incRad = (state.beamAngle * Math.PI) / 180;
      const srcX = 30;
      const srcY = hit1.y + (hit1.x - srcX) * Math.tan(incRad);

      ctx.strokeStyle = state.whiteLight ? '#ffffff' : wavelengthToColor(state.monoLambda);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(hit1.x, hit1.y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const wavelengths = state.whiteLight
        ? [700, 650, 610, 580, 550, 520, 490, 465, 440, 415, 390]
        : [state.monoLambda];

      wavelengths.forEach((lam) => {
        const lamUm = lam / 1000;
        const nLambda = state.glassIndexA + (state.dispersionB * 4.5) / (lamUm * lamUm);
        const col = wavelengthToColor(lam, 0.92);

        const internalSlope = -0.06 + (nLambda - 1.5) * 0.42 - incRad * 0.45;
        const hit2X = hit1.x + 88;
        const hit2Y = hit1.y + 88 * internalSlope;

        const exitSlope = 0.16 + (nLambda - 1.48) * 1.45 - incRad * 0.35;
        const outX = w - 20;
        const outY = hit2Y + (outX - hit2X) * exitSlope;

        ctx.strokeStyle = col;
        ctx.lineWidth = state.whiteLight ? 2.6 : 4.0;
        ctx.beginPath();
        ctx.moveTo(hit1.x, hit1.y);
        ctx.lineTo(hit2X, hit2Y);
        ctx.lineTo(outX, outY);
        ctx.stroke();
      });

      if ($('telOptFocal')) $('telOptFocal').textContent = 'Dispersiyon Spektrumu';
    } else if (state.optElement === 'convex' || state.optElement === 'concave') {
      const isConvex = state.optElement === 'convex';
      const f = (isConvex ? 1 : -1) * (115 / Math.max(0.2, state.glassIndexA - 1));
      if ($('telOptFocal')) $('telOptFocal').textContent = `f = ${f.toFixed(0)} mm`;

      ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      if (isConvex) {
        ctx.ellipse(cx, cy, 24, 115, 0, 0, Math.PI * 2);
      } else {
        ctx.moveTo(cx - 26, cy - 115);
        ctx.quadraticCurveTo(cx - 6, cy, cx - 26, cy + 115);
        ctx.lineTo(cx + 26, cy + 115);
        ctx.quadraticCurveTo(cx + 6, cy, cx + 26, cy - 115);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();

      const fx1 = cx - Math.abs(f);
      const fx2 = cx + Math.abs(f);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(fx1, cy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(fx2, cy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText('F', fx1 - 4, cy + 18);
      ctx.fillText("F'", fx2 - 4, cy + 18);

      const col = state.whiteLight ? '#00f2fe' : wavelengthToColor(state.monoLambda);
      for (let dy = -80; dy <= 80; dy += 20) {
        const yIn = cy + dy;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(30, yIn);
        ctx.lineTo(cx, yIn);

        const slope = -dy / f;
        const outX = w - 25;
        const outY = yIn + (outX - cx) * slope;
        ctx.lineTo(outX, outY);
        ctx.stroke();

        if (!isConvex) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.32)';
          ctx.beginPath();
          ctx.moveTo(cx, yIn);
          ctx.lineTo(fx1, cy);
          ctx.stroke();
          ctx.restore();
        }
      }
    } else {
      if ($('telOptFocal')) $('telOptFocal').textContent = 'Tam İç Yansıma (θ > θ_c)';
      const topY = cy - 46;
      const botY = cy + 46;

      ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.fillRect(60, topY, w - 120, 92);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, topY); ctx.lineTo(w - 60, topY);
      ctx.moveTo(60, botY); ctx.lineTo(w - 60, botY);
      ctx.stroke();

      const col = state.whiteLight ? '#10b981' : wavelengthToColor(state.monoLambda);
      const angRad = (clamp(state.beamAngle, 6, 38) * Math.PI) / 180;
      let rx = 60, ry = cy;
      let dyDir = -Math.tan(angRad);

      ctx.strokeStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);

      while (rx < w - 60) {
        const targetY = dyDir < 0 ? topY : botY;
        const stepX = (targetY - ry) / dyDir;
        if (rx + stepX >= w - 60) {
          const remX = w - 60 - rx;
          ctx.lineTo(w - 60, ry + remX * dyDir);
          break;
        }
        rx += stepX;
        ry = targetY;
        ctx.lineTo(rx, ry);
        dyDir = -dyDir;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  /* ==========================================================================
     5.2. KAPSAMLI KUANTUM ÇİFT YARIK, KUANTUM SİLGİ VE AHARONOV-BOHM DENEYİ
     ========================================================================== */
  let wavePhase = 0;

  function getParticleMeta() {
    switch (state.slitParticle) {
      case 'photon': return { sym: 'γ', name: 'Foton (Işık)', color: wavelengthToColor(state.slitLambda), isClassical: false };
      case 'buckyball': return { sym: 'C₆₀', name: 'Fulleren Dev Molekül (720 u)', color: '#10b981', isClassical: false };
      case 'neutron': return { sym: 'n⁰', name: 'Soğuk Nötron', color: '#a855f7', isClassical: false };
      case 'classical': return { sym: 'Bilye', name: 'Klasik Mermi (P₁₂ = P₁+P₂)', color: '#f59e0b', isClassical: true };
      default: return { sym: 'e⁻', name: 'Elektron (Tonomura)', color: '#00f2fe', isClassical: false };
    }
  }

  // Hangi-yol dedektörü açık VE kuantum silgi kapalıysa (veya klasik mermi seçiliyse) girişim çöker!
  function isCoherentInterference() {
    const meta = getParticleMeta();
    if (meta.isClassical) return false;
    if (state.whichWayDetector && !state.quantumEraser) return false;
    return true;
  }

  // Konum yNorm ∈ [-1, 1] için N-Yarık + Kırınım + Aharonov-Bohm Şiddet Fonksiyonu I(y)
  function evalDoubleSlitIntensity(yNorm) {
    const N = state.slitCount;
    const kLambda = 520 / state.slitLambda;
    const alpha = Math.PI * (state.slitWidth * 0.085) * kLambda * yNorm;
    const sinc = Math.abs(alpha) < 1e-4 ? 1.0 : Math.sin(alpha) / alpha;
    const diffEnv = sinc * sinc;

    if (N === 1) {
      return clamp(diffEnv, 0, 1);
    }

    if (!isCoherentInterference()) {
      // Çökmüş Dalga Fonksiyonu veya Klasik Bilye: N adet ayrık Gauss bandı toplamı
      let sum = 0;
      const spacing = state.slitDist / 170;
      for (let k = 0; k < N; k++) {
        const offset = (k - (N - 1) * 0.5) * spacing;
        sum += Math.exp(-Math.pow((yNorm - offset) / 0.17, 2));
      }
      return clamp((sum / Math.sqrt(N)) * 0.72, 0, 1);
    }

    // Kuantum Süperpozisyon: N-yarık girişim faktörü + Aharonov-Bohm faz kayması Δφ = 2π(Φ_B/Φ_0)
    const abPhase = Math.PI * state.abFlux; // cos²(β + Δφ/2)
    const beta = Math.PI * (state.slitDist * 0.115) * kLambda * yNorm + abPhase;

    let interf = 1.0;
    if (N === 2) {
      interf = Math.cos(beta) * Math.cos(beta);
    } else {
      const sinB = Math.sin(beta);
      interf = Math.abs(sinB) < 1e-4 ? 1.0 : Math.pow(Math.sin(N * beta) / (N * sinB), 2);
    }
    return clamp(interf * diffEnv, 0, 1);
  }

  function clearQuantumHits() {
    state.electronHits = [];
    state.flyingPackets = [];
    state.bins.fill(0);
  }

  function sampleHitYNorm() {
    for (let guard = 0; guard < 40; guard++) {
      const yTry = Math.random() * 2 - 1;
      if (Math.random() < evalDoubleSlitIntensity(yTry)) {
        return yTry;
      }
    }
    return (Math.random() - 0.5) * 0.4;
  }

  function fireSingleQuantumPacket() {
    const yTarget = sampleHitYNorm();
    state.flyingPackets.push({
      progress: 0,
      yTarget
    });
  }

  function recordScreenHit(yNorm, screenX, h) {
    const cy = h * 0.5;
    state.electronHits.push({
      x: screenX + (Math.random() - 0.5) * 28,
      y: cy + yNorm * (h * 0.43),
      yNorm
    });
    const binIdx = clamp(Math.floor(((yNorm + 1) * 0.5) * state.bins.length), 0, state.bins.length - 1);
    state.bins[binIdx] += 1;
    if (state.electronHits.length > 3500) {
      state.electronHits.splice(0, state.electronHits.length - 3500);
    }
  }

  function stepDoubleSlit(dt) {
    const canvas = $('doubleSlitCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    wavePhase += dt * 7.8;
    const meta = getParticleMeta();
    const coherent = isCoherentInterference();
    const pCol = coherent ? meta.color : '#ff3366';

    const barrierX = w * 0.25;
    const screenX = w * 0.72;
    const cy = h * 0.5;
    const N = state.slitCount;
    const slitStep = state.slitDist * 1.1;

    // Yarıkların dikey merkezlerini hesapla
    const slitCenters = [];
    for (let k = 0; k < N; k++) {
      slitCenters.push(cy + (k - (N - 1) * 0.5) * slitStep);
    }

    // 3B İzometrik Görünüm Modu ('iso3d')
    if (state.slitMode === 'iso3d') {
      drawIso3DDoubleSlit(ctx, w, h, slitCenters, pCol, coherent, meta);
      updateDoubleSlitTelemetry(meta, coherent);
      return;
    }

    // 1. Parçacık Kaynağı / Tabancası (Sol Taraf)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = pCol;
    ctx.lineWidth = 2;
    ctx.fillRect(16, cy - 18, 46, 36);
    ctx.strokeRect(16, cy - 18, 46, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`${meta.sym} Kaynağı`, 12, cy - 24);

    // Kaynaktan engele gelen düzlem dalga / parçacık demeti
    ctx.strokeStyle = coherent ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255, 51, 102, 0.25)';
    ctx.lineWidth = 1.5;
    const inWaveStep = 22;
    const inOff = (wavePhase * 3.5) % inWaveStep;
    for (let wx = 66 + inOff; wx < barrierX - 6; wx += inWaveStep) {
      ctx.beginPath();
      ctx.moveTo(wx, cy - 95);
      ctx.lineTo(wx, cy + 95);
      ctx.stroke();
    }

    // 2. Yarık Engeli Çizimi
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    const halfGap = clamp(state.slitWidth * 0.65, 4, 18);
    let lastY = 14;
    slitCenters.forEach((sy) => {
      const topEdge = Math.max(lastY, sy - halfGap);
      ctx.beginPath();
      ctx.moveTo(barrierX, lastY);
      ctx.lineTo(barrierX, topEdge);
      ctx.stroke();
      lastY = sy + halfGap;
    });
    ctx.beginPath();
    ctx.moveTo(barrierX, lastY);
    ctx.lineTo(barrierX, h - 14);
    ctx.stroke();

    // 3. Aharonov-Bohm Solenoidi (Yarıkların Hemen Arkasında Merkezde)
    if (Math.abs(state.abFlux) > 0.01 && N >= 2) {
      const solX = barrierX + 18;
      const solY = cy;
      ctx.fillStyle = state.abFlux > 0 ? 'rgba(245, 158, 11, 0.28)' : 'rgba(168, 85, 247, 0.28)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(solX, solY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillText(state.abFlux > 0 ? '⊙B' : '⊗B', solX - 8, solY + 3);
      ctx.fillText(`Φ=${state.abFlux.toFixed(2)}Φ₀`, solX - 20, solY + 24);
    }

    // 4. Hangi-Yol Dedektörü & Kuantum Silgi Görselleri
    if (state.whichWayDetector) {
      ctx.fillStyle = '#ff3366';
      ctx.font = '700 11px Inter';
      ctx.fillText('👁️ HANGİ-YOL LAZER DEDEKTÖRÜ AÇIK', barrierX - 35, 26);
      slitCenters.forEach((sy) => {
        ctx.fillStyle = 'rgba(255, 51, 102, 0.28)';
        ctx.beginPath();
        ctx.arc(barrierX + 10, sy, 9, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (state.quantumEraser) {
      const erX = (barrierX + screenX) * 0.52;
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(erX, 24);
      ctx.lineTo(erX, h - 24);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#10b981';
      ctx.font = '700 11px Inter';
      ctx.fillText('🔮 KUANTUM SİLGİ (45° Polarizör: Hangi-Yol Bilgisini Siler!)', erX - 95, h - 10);
    }

    // 5. 2B Dalga Alanı Görünümü ('wave' veya 'both')
    if (state.slitMode === 'wave' || state.slitMode === 'both') {
      const waveSpacing = state.slitLambda * 0.044;
      const offset = (wavePhase * 3.5) % waveSpacing;
      ctx.strokeStyle = coherent ? wavelengthToColor(state.slitLambda, 0.36) : 'rgba(255, 51, 102, 0.25)';
      ctx.lineWidth = 1.7;

      slitCenters.forEach((sy, idx) => {
        const phaseShift = idx * state.abFlux * waveSpacing * 0.5;
        for (let r = (offset + phaseShift + waveSpacing) % waveSpacing; r < screenX - barrierX; r += waveSpacing) {
          ctx.beginPath();
          ctx.arc(barrierX, sy, Math.max(2, r), -Math.PI * 0.44, Math.PI * 0.44);
          ctx.stroke();
        }
      });
    }

    // 6. Kuantum Tekil Parçacık Birikimi & Uçan Dalga Paketleri ('quantum' veya 'both')
    if (state.slitMode === 'quantum' || state.slitMode === 'both') {
      for (let k = 0; k < state.slitRate; k++) {
        const yNorm = sampleHitYNorm();
        recordScreenHit(yNorm, screenX, h);
      }

      // Tekli ateşlenen uçan dalga paketlerini ilerlet ve çiz
      for (let i = state.flyingPackets.length - 1; i >= 0; i--) {
        const pkt = state.flyingPackets[i];
        pkt.progress += dt * 1.15;
        if (pkt.progress >= 1.0) {
          recordScreenHit(pkt.yTarget, screenX, h);
          state.flyingPackets.splice(i, 1);
          continue;
        }
        if (pkt.progress < 0.35) {
          const u = pkt.progress / 0.35;
          const px = 62 + u * (barrierX - 62);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(px, cy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Yarıklardan geçtikten sonra süperpozisyon dalga cephesi olarak yayılır ve ekranda tek noktaya çöker!
          const u = (pkt.progress - 0.35) / 0.65;
          const r = u * (screenX - barrierX);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          slitCenters.forEach((sy) => {
            ctx.beginPath();
            ctx.arc(barrierX, sy, r, -0.5, 0.5);
            ctx.stroke();
          });
        }
      }

      // Ekrandaki vuruş noktalarını çiz
      ctx.fillStyle = pCol;
      state.electronHits.forEach((hit) => {
        ctx.fillRect(hit.x, hit.y, 2.3, 2.3);
      });
    }

    // 7. Sağ Taraf: Karşı Dedektör Ekranı, Gerçek Zamanlı Histogram ve Teorik |ψ|² Zarfı
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(screenX, 15);
    ctx.lineTo(screenX, h - 15);
    ctx.stroke();

    const maxPlotW = Math.max(50, w - screenX - 34);

    // Deneysel vuruş histogramı (yarı-saydam çubuklar)
    let maxBin = 1;
    for (let i = 0; i < state.bins.length; i++) {
      if (state.bins[i] > maxBin) maxBin = state.bins[i];
    }
    if (state.electronHits.length > 10) {
      ctx.fillStyle = coherent ? 'rgba(0, 242, 254, 0.22)' : 'rgba(255, 51, 102, 0.22)';
      const binH = (h * 0.86) / state.bins.length;
      for (let i = 0; i < state.bins.length; i++) {
        const bw = (state.bins[i] / maxBin) * maxPlotW * 0.92;
        const by = cy + ((i / state.bins.length) * 2 - 1) * (h * 0.43);
        ctx.fillRect(screenX + 16, by - binH * 0.5, bw, Math.max(1.5, binH - 0.5));
      }
    }

    // Teorik Kuantum Olasılık Yoğunluğu Eğrisi I(y) = |ψ(y)|²
    ctx.beginPath();
    for (let py = 18; py <= h - 18; py += 2) {
      const yNorm = (py - cy) / (h * 0.43);
      const I = evalDoubleSlitIntensity(yNorm);
      const ix = screenX + 16 + I * maxPlotW;
      if (py === 18) ctx.moveTo(ix, py); else ctx.lineTo(ix, py);
    }
    ctx.strokeStyle = pCol;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    updateDoubleSlitTelemetry(meta, coherent);
  }

  function drawIso3DDoubleSlit(ctx, w, h, slitCenters, pCol, coherent, meta) {
    // Sürekli parçacık birikimi devam etsin
    for (let k = 0; k < Math.ceil(state.slitRate * 0.5); k++) {
      recordScreenHit(sampleHitYNorm(), w * 0.72, h);
    }

    const cx = w * 0.44, cy = h * 0.54;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 12px Inter';
    ctx.fillText(`3B Perspektif Dalga Fonksiyonu ψ₁ + ψ₂ ve Dedektör Duvarı (${meta.name})`, 18, 24);

    // 3B İzometrik Dalga Yüzeyi (x: yayılma yönü, y: yarık boyu, z: Re[ψ] yüksekliği)
    const rows = 34, cols = 44;
    const kWave = (520 / state.slitLambda) * 0.24;
    for (let r = 0; r < rows; r++) {
      const yNorm = (r / (rows - 1)) * 2 - 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const xNorm = c / cols; // 0 (yarıklar) -> 1 (ekran)
        const distX = 0.25 + xNorm * 1.4;
        let psiRe = 0;
        if (coherent) {
          const N = state.slitCount;
          const sp = state.slitDist / 160;
          for (let s = 0; s < N; s++) {
            const sy = (s - (N - 1) * 0.5) * sp;
            const d = Math.hypot(distX, yNorm - sy);
            const ab = s * Math.PI * state.abFlux;
            psiRe += Math.cos(d * 28 * kWave - wavePhase + ab) / Math.sqrt(d + 0.2);
          }
          psiRe /= Math.sqrt(N);
        } else {
          const env = evalDoubleSlitIntensity(yNorm);
          psiRe = env * Math.cos(distX * 22 - wavePhase) * 0.6;
        }

        const isoX = cx + (xNorm - 0.5) * (w * 0.48) - yNorm * (w * 0.14);
        const isoY = cy + yNorm * (h * 0.32) + (xNorm - 0.5) * (h * 0.14) - psiRe * 18;
        if (c === 0) ctx.moveTo(isoX, isoY); else ctx.lineTo(isoX, isoY);
      }
      ctx.strokeStyle = coherent ? 'rgba(0, 242, 254, 0.45)' : 'rgba(255, 51, 102, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Sağ Kenarda 3B Dedektör Duvarı Şiddet Profili
    const wallX = w * 0.82;
    ctx.beginPath();
    for (let r = 0; r <= 80; r++) {
      const yNorm = (r / 80) * 2 - 1;
      const I = evalDoubleSlitIntensity(yNorm);
      const px = wallX - yNorm * (w * 0.11) + I * 58;
      const py = cy + yNorm * (h * 0.32) + 0.5 * (h * 0.14) - I * 26;
      if (r === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = pCol;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function updateDoubleSlitTelemetry(meta, coherent) {
    const fringeSpacing = ((state.slitLambda * 1.2) / state.slitDist).toFixed(2);
    if ($('telSlitFringe')) $('telSlitFringe').textContent = state.slitCount === 1 ? 'Tek Yarık Kırınımı' : `${fringeSpacing} mm`;
    if ($('telSlitHits')) $('telSlitHits').textContent = `${state.electronHits.length} ${meta.sym}`;
    if ($('telSlitVisibility')) {
      $('telSlitVisibility').textContent = coherent ? 'V = %100 (Girişim Var)' : 'V = %0 (Girişim Yok)';
      $('telSlitVisibility').style.color = coherent ? '#10b981' : '#ff3366';
    }
    if ($('telSlitPhase')) {
      const dPhi = (2 * Math.PI * state.abFlux).toFixed(2);
      $('telSlitPhase').textContent = `Δφ = ${dPhi} rad`;
    }
    if ($('telSlitState')) {
      if (meta.isClassical) {
        $('telSlitState').textContent = 'Klasik Parçacık: P₁₂ = P₁ + P₂ (2 Şerit)';
      } else if (state.whichWayDetector && state.quantumEraser) {
        $('telSlitState').textContent = '🔮 Kuantum Silgi Aktif: Girişim Geri Geldi! |ψ₁+ψ₂|²';
      } else if (state.whichWayDetector) {
        $('telSlitState').textContent = '👁️ Çökmüş Dalga Fonksiyonu: |ψ₁|² + |ψ₂|² (2 Klasik Bant)';
      } else {
        $('telSlitState').textContent = `Süperpozisyon |ψ₁+ψ₂|² (${state.slitCount} Yarık)`;
      }
    }
  }

  /* ==========================================================================
     5.3. KARDEŞ KUANTUM DENEYLERİ: STERN-GERLACH, MACH-ZEHNDER & DAVISSON-GERMER
     ========================================================================== */
  function stepQuantumExperiments(dt) {
    const canvas = $('quantumExpCanvas');
    const info = fitCanvas(canvas);
    if (!info) return;
    const { ctx, w, h } = info;
    ctx.clearRect(0, 0, w, h);

    if (state.qexpType === 'sterngerlach') {
      stepSternGerlach(ctx, w, h, dt);
    } else if (state.qexpType === 'machzehnder') {
      stepMachZehnder(ctx, w, h, dt);
    } else {
      stepDavissonGermer(ctx, w, h, dt);
    }
  }

  function stepSternGerlach(ctx, w, h, dt) {
    const cy = h * 0.5;
    const magnetX1 = w * 0.28;
    const magnetX2 = w * 0.60;
    const screenX = w * 0.82;

    // 1. Gümüş (Ag) Atom Fırını
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.fillRect(20, cy - 26, 68, 52);
    ctx.strokeRect(20, cy - 26, 68, 52);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('Ag Fırını', 26, cy - 4);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9.5px Inter';
    ctx.fillText('1000 °C', 32, cy + 12);

    // 2. Homojen Olmayan Mıknatıs Kutupları (Üst: Sivri N Kutbu, Alt: Düz S Kutbu -> ∂B_z/∂z)
    ctx.fillStyle = 'rgba(255, 51, 102, 0.25)';
    ctx.strokeStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(magnetX1, cy - 95);
    ctx.lineTo(magnetX2, cy - 95);
    ctx.lineTo((magnetX1 + magnetX2) * 0.5, cy - 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff3366';
    ctx.font = '800 12px Inter';
    ctx.fillText('N (Sivri Kutup: Yüksek ∂B/∂z)', magnetX1 + 12, cy - 102);

    ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.strokeStyle = '#00f2fe';
    ctx.fillRect(magnetX1, cy + 42, magnetX2 - magnetX1, 42);
    ctx.strokeRect(magnetX1, cy + 42, magnetX2 - magnetX1, 42);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('S (Yassı Kutup)', magnetX1 + 48, cy + 68);

    // Ardışık 3 Filtreli (SG_z -> SG_x -> SG_z) Mod Çizimi
    if (state.sgMode === 'sequential') {
      drawSequentialSternGerlach(ctx, w, h, cy);
      return;
    }

    // 3. Yeni Gümüş Atomları Fırlat
    if (Math.random() < 0.55) {
      let ms = 0;
      if (state.sgMode === 'quantum') {
        // Kuantum Spin-1/2: SADECE +1 ve -1!
        ms = Math.random() < 0.5 ? 1 : -1;
      } else {
        // Klasik Mıknatıs Beklentisi: Sürekli cos(θ) ∈ [-1, +1]
        ms = Math.random() * 2 - 1;
      }
      state.sgParticles.push({
        x: 90,
        y: cy + (Math.random() - 0.5) * 4,
        vx: 230,
        vy: 0,
        ms
      });
    }

    // 4. Atomları İlerlet ve Çiz
    for (let i = state.sgParticles.length - 1; i >= 0; i--) {
      const p = state.sgParticles[i];
      p.x += p.vx * dt;
      if (p.x >= magnetX1 && p.x <= magnetX2) {
        // Manyetik gradyan kuvveti F_z = μ_z (∂B_z/∂z)
        p.vy += -p.ms * state.sgGrad * 145 * dt;
      }
      p.y += p.vy * dt;

      const col = p.ms >= 0 ? '#00f2fe' : '#ff3366';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();

      if (p.x >= screenX) {
        state.sgHits.push({ y: p.y, ms: p.ms });
        if (state.sgHits.length > 900) state.sgHits.shift();
        state.sgParticles.splice(i, 1);
      }
    }

    // 5. Dedektör Cam Levhası ve Biriken İki Ayrık Spin Lekesi
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, 30);
    ctx.lineTo(screenX, h - 30);
    ctx.stroke();

    state.sgHits.forEach((hit) => {
      ctx.fillStyle = hit.ms >= 0 ? 'rgba(0, 242, 254, 0.75)' : 'rgba(255, 51, 102, 0.75)';
      ctx.fillRect(screenX + 6 + Math.random() * 22, hit.y, 3, 3);
    });

    ctx.fillStyle = '#00f2fe';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('m_s = +1/2 (↑)', screenX + 34, cy - state.sgGrad * 36);
    ctx.fillStyle = '#ff3366';
    ctx.fillText('m_s = −1/2 (↓)', screenX + 34, cy + state.sgGrad * 36);

    if ($('telQexpMode')) $('telQexpMode').textContent = 'Stern-Gerlach (1922)';
    if ($('telQexpResult')) {
      $('telQexpResult').textContent = state.sgMode === 'quantum' ? '2 Ayrık Kuantum Leke (±ℏ/2)' : 'Klasik Sürekli Şerit';
    }
    if ($('telQexpDetail')) {
      $('telQexpDetail').textContent = state.sgMode === 'quantum'
        ? 'Gümüş atomunun spini uzayda yalnızca 2 ayrık yönelim (+ℏ/2 ve −ℏ/2) alabilir!'
        : 'Klasik fiziğe göre rastgele yönelimli mıknatıslar ekranda kesintisiz tek bir şerit oluşturmalıydı.';
    }
  }

  function drawSequentialSternGerlach(ctx, w, h, cy) {
    const boxes = [
      { x: w * 0.18, y: cy, title: '1. SG_z Mıknatısı', sub: '|↑_z⟩ Seçilir (↓ Bloke)' },
      { x: w * 0.46, y: cy - 35, title: '2. SG_x Mıknatısı', sub: '|↑_z⟩ = (|↑_x⟩+|↓_x⟩)/√2' },
      { x: w * 0.72, y: cy - 65, title: '3. SG_z Mıknatısı', sub: 'Hafıza Silindi: %50 ↑_z, %50 ↓_z!' }
    ];

    boxes.forEach((b) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.fillRect(b.x, b.y - 26, 135, 52);
      ctx.strokeRect(b.x, b.y - 26, 135, 52);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 11px Inter';
      ctx.fillText(b.title, b.x + 8, b.y - 6);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.fillText(b.sub, b.x + 8, b.y + 12);
    });

    // Akış kolları
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(88, cy); ctx.lineTo(boxes[0].x, cy);
    ctx.moveTo(boxes[0].x + 135, cy - 10); ctx.lineTo(boxes[1].x, boxes[1].y);
    ctx.moveTo(boxes[1].x + 135, boxes[1].y - 10); ctx.lineTo(boxes[2].x, boxes[2].y);
    ctx.stroke();

    // Son çıkışta yeniden %50 |↑_z⟩ ve %50 |↓_z⟩ ayrılması!
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(boxes[2].x + 135, boxes[2].y - 8);
    ctx.lineTo(w - 25, boxes[2].y - 42);
    ctx.stroke();

    ctx.strokeStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(boxes[2].x + 135, boxes[2].y + 8);
    ctx.lineTo(w - 25, boxes[2].y + 42);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('%50 |↑_z⟩', w - 85, boxes[2].y - 48);
    ctx.fillStyle = '#ff3366';
    ctx.fillText('%50 |↓_z⟩ (Geri Geldi!)', w - 145, boxes[2].y + 58);

    if ($('telQexpResult')) $('telQexpResult').textContent = '[S_x, S_z] = iℏS_y ≠ 0';
    if ($('telQexpDetail')) {
      $('telQexpDetail').textContent = '1. filtrede |↓_z⟩ tamamen elendiği halde, araya giren SG_x ölçümü Z-spini belirsizleştirir ve 3. filtrede |↓_z⟩ %50 olasılıkla geri döner!';
    }
  }

  function stepMachZehnder(ctx, w, h, dt) {
    const x1 = w * 0.22, x2 = w * 0.68;
    const yTop = h * 0.26, yBot = h * 0.72;

    // Optik Kollar (Üst Kol ve Alt Kol)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Giriş -> BS1
    ctx.moveTo(40, yBot); ctx.lineTo(x1, yBot);
    // Kol 1: BS1 -> M1 (Üst Sol) -> BS2 (Üst Sağ)
    ctx.moveTo(x1, yBot); ctx.lineTo(x1, yTop); ctx.lineTo(x2, yTop);
    // Kol 2: BS1 -> M2 (Alt Sağ) -> BS2 (Üst Sağ)
    ctx.moveTo(x1, yBot); ctx.lineTo(x2, yBot); ctx.lineTo(x2, yTop);
    // Çıkışlar: D1 (Sağ) ve D2 (Üst)
    ctx.moveTo(x2, yTop); ctx.lineTo(w - 55, yTop);
    ctx.moveTo(x2, yTop); ctx.lineTo(x2, 35);
    ctx.stroke();

    // BS1 (1. Yarı-Geçirgen Ayna)
    const drawMirror = (mx, my, label, isBS, active = true) => {
      if (!active) return;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = isBS ? 'rgba(0, 242, 254, 0.35)' : '#94a3b8';
      ctx.strokeStyle = isBS ? '#00f2fe' : '#f8fafc';
      ctx.lineWidth = 2.2;
      ctx.fillRect(-22, -4, 44, 8);
      ctx.strokeRect(-22, -4, 44, 8);
      ctx.restore();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(label, mx - 18, my + 28);
    };

    drawMirror(x1, yBot, 'BS₁ (%50/%50)', true, true);
    drawMirror(x1, yTop, 'Ayna M₁', false, true);
    drawMirror(x2, yBot, 'Ayna M₂', false, true);
    drawMirror(x2, yTop, 'BS₂ (Gecikmeli Seçim)', true, state.mzBS2);

    // Üst Kolda Faz Kaydırıcı Cam Plaka (Δφ)
    const phX = (x1 + x2) * 0.5;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.strokeStyle = '#a855f7';
    ctx.fillRect(phX - 14, yTop - 16, 28, 32);
    ctx.strokeRect(phX - 14, yTop - 16, 28, 32);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`Δφ = ${state.mzPhasePi.toFixed(2)}π`, phX - 28, yTop - 22);

    // Hangi-Yol Dedektörü
    if (state.mzSpy) {
      ctx.fillStyle = '#ff3366';
      ctx.beginPath(); ctx.arc(phX + 55, yTop, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('👁️ Casus Dedektör', phX + 25, yTop + 26);
    }

    // Kuantum Olasılıkları P(D1) ve P(D2)
    let pD1 = 0.5, pD2 = 0.5;
    if (state.mzBS2 && !state.mzSpy) {
      const phi = state.mzPhasePi * Math.PI;
      pD1 = Math.pow(Math.cos(phi * 0.5), 2);
      pD2 = Math.pow(Math.sin(phi * 0.5), 2);
    }

    // Otomatik veya manuel foton paketleri
    if (Math.random() < 0.08) {
      state.mzPhotons.push({ u: 0 });
    }
    for (let i = state.mzPhotons.length - 1; i >= 0; i--) {
      const ph = state.mzPhotons[i];
      ph.u += dt * 0.85;
      if (ph.u >= 1.0) {
        if (Math.random() < pD1) state.mzCountD1++;
        else state.mzCountD2++;
        state.mzPhotons.splice(i, 1);
        continue;
      }
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
      if (ph.u < 0.25) {
        const k = ph.u / 0.25;
        ctx.beginPath(); ctx.arc(40 + k * (x1 - 40), yBot, 6, 0, Math.PI * 2); ctx.fill();
      } else if (ph.u < 0.55) {
        const k = (ph.u - 0.25) / 0.30;
        // İki kolda aynı anda süperpozisyon!
        ctx.beginPath(); ctx.arc(x1, yBot - k * (yBot - yTop), 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x1 + k * (x2 - x1), yBot, 5, 0, Math.PI * 2); ctx.fill();
      } else {
        const k = (ph.u - 0.55) / 0.45;
        ctx.beginPath(); ctx.arc(x1 + k * (x2 - x1), yTop, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x2, yBot - k * (yBot - yTop), 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Dedektör Kutuları D1 ve D2
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#10b981';
    ctx.fillRect(w - 55, yTop - 18, 46, 36); ctx.strokeRect(w - 55, yTop - 18, 46, 36);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`D₁: %${(pD1 * 100).toFixed(0)}`, w - 65, yTop + 32);

    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#f59e0b';
    ctx.fillRect(x2 - 23, 12, 46, 26); ctx.strokeRect(x2 - 23, 12, 46, 26);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`D₂: %${(pD2 * 100).toFixed(0)}`, x2 + 30, 28);

    if ($('telQexpMode')) $('telQexpMode').textContent = 'Mach-Zehnder & Gecikmeli Seçim';
    if ($('telQexpResult')) {
      $('telQexpResult').textContent = `P(D₁)=%${(pD1 * 100).toFixed(0)} · P(D₂)=%${(pD2 * 100).toFixed(0)}`;
    }
    if ($('telQexpDetail')) {
      $('telQexpDetail').textContent = (state.mzBS2 && !state.mzSpy)
        ? 'BS₂ takılı: Foton her iki koldan aynı anda geçip kendi kendisiyle girişim yapar!'
        : 'BS₂ çıkarıldı veya casus dedektör açık: Foton tek bir yolu seçer (%50 D₁, %50 D₂ parçacık davranışı)!';
    }
  }

  function stepDavissonGermer(ctx, w, h) {
    const cx = w * 0.42, cy = h * 0.62;
    // De Broglie dalga boyu: λ = 1.226 / sqrt(V) nm
    const lambdaNm = 1.226 / Math.sqrt(Math.max(10, state.dgVolt));
    // Bragg açısı: sin(θ) = λ / (2*d)
    const sinTh = clamp(lambdaNm / (2 * state.dgSpacing), 0.15, 0.96);
    const braggDeg = (Math.asin(sinTh) * 180) / Math.PI;

    // Nikel Kristal Atom Düzlemleri
    const rows = 4, cols = 9;
    const stepX = clamp(state.dgSpacing * 165, 24, 48);
    const stepY = 26;
    for (let r = 0; r < rows; r++) {
      const py = cy + r * stepY;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx - (cols * 0.5) * stepX, py);
      ctx.lineTo(cx + (cols * 0.5) * stepX, py);
      ctx.stroke();
      for (let c = 0; c < cols; c++) {
        const px = cx + (c - (cols - 1) * 0.5) * stepX;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Gelen Elektron Demeti ve Kırınıma Uğrayan Bragg Demeti
    const angRad = (braggDeg * Math.PI) / 180;
    const beamLen = 175;
    const inX = cx - Math.cos(angRad) * beamLen;
    const inY = cy - Math.sin(angRad) * beamLen;
    const outX = cx + Math.cos(angRad) * beamLen;
    const outY = cy - Math.sin(angRad) * beamLen;

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(cx, cy); ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(outX, outY); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(`λ_dB = h/p = ${lambdaNm.toFixed(3)} nm (V = ${state.dgVolt} V)`, 24, 28);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Bragg Maksimumu: θ = ${braggDeg.toFixed(1)}° (nλ = 2d·sinθ)`, 24, 48);

    if ($('telQexpMode')) $('telQexpMode').textContent = 'Davisson-Germer (1927)';
    if ($('telQexpResult')) $('telQexpResult').textContent = `λ_dB = ${lambdaNm.toFixed(3)} nm, θ = ${braggDeg.toFixed(1)}°`;
    if ($('telQexpDetail')) {
      $('telQexpDetail').textContent = '54 V hızlandırıcı gerilimde λ = 0.167 nm olan elektronlar Nikel kristalinden keskin Bragg kırınımı yaparak De Broglie hipotezini kanıtladı!';
    }
  }

  /* ==========================================================================
     MODÜL 5 BAŞLATICI VE KONTROLLER
     ========================================================================== */
  function switchSubtab(subId) {
    state.activeSub = subId;
    document.querySelectorAll('#mod5 .subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === subId);
    });
    ['5_1', '5_2', '5_3'].forEach((id) => {
      const pane = $(`mod5_sub_${id}`);
      if (pane) pane.hidden = id !== subId;
    });
  }

  function init() {
    // 5.1 Kontrolleri (Astra Lab Bending Light + Prizma + Mercek + Fiber)
    document.querySelectorAll('[data-opt-el]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.optElement = btn.dataset.optEl;
        document.querySelectorAll('[data-opt-el]').forEach((b) =>
          b.classList.toggle('active', b.dataset.optEl === state.optElement)
        );
      });
    });
    $('optMatTopSelect')?.addEventListener('change', (e) => {
      state.n1 = +e.target.value;
      if ($('optN1Val')) $('optN1Val').textContent = `n₁ = ${state.n1.toFixed(3)}`;
    });
    $('optMatBotSelect')?.addEventListener('change', (e) => {
      state.glassIndexA = +e.target.value;
      if ($('optN2Val')) $('optN2Val').textContent = `n₂ = ${state.glassIndexA.toFixed(3)}`;
      if ($('optIndexSlider')) $('optIndexSlider').value = state.glassIndexA;
      if ($('optIndexVal')) $('optIndexVal').textContent = state.glassIndexA.toFixed(2);
    });
    $('optSwapMediaBtn')?.addEventListener('click', () => {
      const tmp = state.n1;
      state.n1 = state.glassIndexA;
      state.glassIndexA = tmp;
      if ($('optN1Val')) $('optN1Val').textContent = `n₁ = ${state.n1.toFixed(3)}`;
      if ($('optN2Val')) $('optN2Val').textContent = `n₂ = ${state.glassIndexA.toFixed(3)}`;
      if ($('optMatTopSelect')) $('optMatTopSelect').value = state.n1.toFixed(3);
      if ($('optMatBotSelect')) $('optMatBotSelect').value = state.glassIndexA.toFixed(3);
      if ($('optIndexSlider')) $('optIndexSlider').value = state.glassIndexA;
      if ($('optIndexVal')) $('optIndexVal').textContent = state.glassIndexA.toFixed(2);
    });
    $('optProtractorChk')?.addEventListener('change', (e) => {
      state.showProtractor = e.target.checked;
    });
    $('optFireBurstBtn')?.addEventListener('click', () => {
      for (let i = 0; i < 3; i++) {
        state.lightBursts.push({ u: -i * 0.14 });
      }
    });
    $('optAngleSlider')?.addEventListener('input', (e) => {
      state.beamAngle = +e.target.value;
      $('optAngleVal').textContent = `${state.beamAngle}°`;
    });
    $('optIndexSlider')?.addEventListener('input', (e) => {
      state.glassIndexA = +e.target.value;
      $('optIndexVal').textContent = state.glassIndexA.toFixed(2);
      if ($('optN2Val')) $('optN2Val').textContent = `n₂ = ${state.glassIndexA.toFixed(3)}`;
    });
    $('optDispSlider')?.addEventListener('input', (e) => {
      state.dispersionB = +e.target.value;
      $('optDispVal').textContent = state.dispersionB.toFixed(3);
    });
    $('optWhiteChk')?.addEventListener('change', (e) => {
      state.whiteLight = e.target.checked;
    });

    // Bending Light tuvalinde lazer açısını fareyle/dokunmatikle sürükleme
    const rayCanvas = $('rayOpticsCanvas');
    const updateLaserFromPointer = (e) => {
      if (!rayCanvas || state.optElement !== 'bending') return;
      const rect = rayCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width * 0.5;
      const cy = rect.height * 0.52;
      if (py >= cy - 4) return;
      const dx = cx - px;
      const dy = cy - py;
      const deg = clamp(Math.round((Math.atan2(dx, dy) * 180) / Math.PI), -82, 85);
      state.beamAngle = deg;
      if ($('optAngleSlider')) $('optAngleSlider').value = deg;
      if ($('optAngleVal')) $('optAngleVal').textContent = `${deg}°`;
    };
    rayCanvas?.addEventListener('pointerdown', (e) => {
      if (state.optElement !== 'bending') return;
      state.draggingLaser = true;
      updateLaserFromPointer(e);
    });
    window.addEventListener('pointermove', (e) => {
      if (state.draggingLaser) updateLaserFromPointer(e);
    });
    window.addEventListener('pointerup', () => {
      state.draggingLaser = false;
    });

    // 5.2 Çift Yarık Kontrolleri
    $('slitParticleSelect')?.addEventListener('change', (e) => {
      state.slitParticle = e.target.value;
      clearQuantumHits();
    });
    document.querySelectorAll('[data-slit-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.slitMode = btn.dataset.slitMode;
        document.querySelectorAll('[data-slit-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.slitMode === state.slitMode)
        );
      });
    });
    $('slitCountSlider')?.addEventListener('input', (e) => {
      state.slitCount = +e.target.value;
      const names = { 1: 'Tek Yarık Kırınımı', 2: 'Çift Yarık (Young)', 3: '3 Yarık', 4: '4 Yarık', 5: '5 Yarık (Kırınım Ağacı)' };
      $('slitCountVal').textContent = `N = ${state.slitCount} (${names[state.slitCount]})`;
      clearQuantumHits();
    });
    $('slitDistSlider')?.addEventListener('input', (e) => {
      state.slitDist = +e.target.value;
      $('slitDistVal').textContent = `${state.slitDist} μm`;
      clearQuantumHits();
    });
    $('slitWidthSlider')?.addEventListener('input', (e) => {
      state.slitWidth = +e.target.value;
      $('slitWidthVal').textContent = `${state.slitWidth} μm`;
      clearQuantumHits();
    });
    $('slitLambdaSlider')?.addEventListener('input', (e) => {
      state.slitLambda = +e.target.value;
      $('slitLambdaVal').textContent = `${state.slitLambda} nm`;
      clearQuantumHits();
    });
    $('slitRateSlider')?.addEventListener('input', (e) => {
      state.slitRate = +e.target.value;
      $('slitRateVal').textContent = `${state.slitRate} parçacık`;
    });
    $('slitSingleShotBtn')?.addEventListener('click', () => {
      fireSingleQuantumPacket();
    });
    $('slitDetectorChk')?.addEventListener('change', (e) => {
      state.whichWayDetector = e.target.checked;
      clearQuantumHits();
    });
    $('slitEraserChk')?.addEventListener('change', (e) => {
      state.quantumEraser = e.target.checked;
      clearQuantumHits();
    });
    $('slitABFluxSlider')?.addEventListener('input', (e) => {
      state.abFlux = +e.target.value;
      $('slitABFluxVal').textContent = `${state.abFlux.toFixed(2)} Φ₀`;
      clearQuantumHits();
    });
    $('slitClearBtn')?.addEventListener('click', clearQuantumHits);

    // 5.3 Kardeş Kuantum Deneyleri Kontrolleri
    document.querySelectorAll('[data-qexp-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.qexpType = btn.dataset.qexpType;
        document.querySelectorAll('[data-qexp-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.qexpType === state.qexpType)
        );
        if ($('qexpControlsSG')) $('qexpControlsSG').hidden = state.qexpType !== 'sterngerlach';
        if ($('qexpControlsMZ')) $('qexpControlsMZ').hidden = state.qexpType !== 'machzehnder';
        if ($('qexpControlsDG')) $('qexpControlsDG').hidden = state.qexpType !== 'davisson';
      });
    });
    $('sgGradSlider')?.addEventListener('input', (e) => {
      state.sgGrad = +e.target.value;
      $('sgGradVal').textContent = `${state.sgGrad.toFixed(2)} T/mm`;
      state.sgHits = [];
    });
    $('sgParticleSelect')?.addEventListener('change', (e) => {
      state.sgMode = e.target.value;
      state.sgHits = [];
      state.sgParticles = [];
    });
    $('sgResetBtn')?.addEventListener('click', () => {
      state.sgHits = [];
      state.sgParticles = [];
    });
    $('mzPhaseSlider')?.addEventListener('input', (e) => {
      state.mzPhasePi = +e.target.value;
      $('mzPhaseVal').textContent = `${state.mzPhasePi.toFixed(2)} π`;
    });
    $('mzBS2Chk')?.addEventListener('change', (e) => {
      state.mzBS2 = e.target.checked;
    });
    $('mzSpyChk')?.addEventListener('change', (e) => {
      state.mzSpy = e.target.checked;
    });
    $('mzFirePhotonBtn')?.addEventListener('click', () => {
      for (let i = 0; i < 4; i++) state.mzPhotons.push({ u: i * 0.06 });
    });
    $('dgVoltSlider')?.addEventListener('input', (e) => {
      state.dgVolt = +e.target.value;
      $('dgVoltVal').textContent = `${state.dgVolt} V`;
    });
    $('dgSpacingSlider')?.addEventListener('input', (e) => {
      state.dgSpacing = +e.target.value;
      $('dgSpacingVal').textContent = `${state.dgSpacing.toFixed(3)} nm`;
    });

    document.querySelectorAll('#mod5 .subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSubtab(btn.dataset.sub);
        if (window.AffePhysics) window.AffePhysics.onSubtabChanged();
      });
    });

    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const mod5El = $('mod5');
      if (!mod5El || !mod5El.classList.contains('active')) return;
      const dt = Math.min(0.035, (now - lastT) / 1000);
      lastT = now;

      if (state.activeSub === '5_1') stepRayOptics(dt);
      else if (state.activeSub === '5_2') stepDoubleSlit(dt);
      else if (state.activeSub === '5_3') stepQuantumExperiments(dt);
    }
    requestAnimationFrame(loop);
  }

  function applyPreset(preset) {
    if (preset.sub) switchSubtab(preset.sub);
    if (preset.sub === '5_1') {
      if (preset.element) {
        state.optElement = preset.element;
        document.querySelectorAll('[data-opt-el]').forEach((b) =>
          b.classList.toggle('active', b.dataset.optEl === state.optElement)
        );
      }
      if (preset.whiteLight != null) {
        state.whiteLight = preset.whiteLight;
        if ($('optWhiteChk')) $('optWhiteChk').checked = preset.whiteLight;
      }
    } else if (preset.sub === '5_2') {
      if (preset.mode) {
        state.slitMode = preset.mode;
        document.querySelectorAll('[data-slit-mode]').forEach((b) =>
          b.classList.toggle('active', b.dataset.slitMode === state.slitMode)
        );
      }
      if (preset.detector != null) {
        state.whichWayDetector = preset.detector;
        if ($('slitDetectorChk')) $('slitDetectorChk').checked = preset.detector;
      }
      if (preset.eraser != null) {
        state.quantumEraser = preset.eraser;
        if ($('slitEraserChk')) $('slitEraserChk').checked = preset.eraser;
      }
      if (preset.abFlux != null) {
        state.abFlux = preset.abFlux;
        if ($('slitABFluxSlider')) $('slitABFluxSlider').value = preset.abFlux;
        if ($('slitABFluxVal')) $('slitABFluxVal').textContent = `${preset.abFlux.toFixed(2)} Φ₀`;
      }
      clearQuantumHits();
    } else if (preset.sub === '5_3') {
      if (preset.expType) {
        state.qexpType = preset.expType;
        document.querySelectorAll('[data-qexp-type]').forEach((b) =>
          b.classList.toggle('active', b.dataset.qexpType === state.qexpType)
        );
        if ($('qexpControlsSG')) $('qexpControlsSG').hidden = state.qexpType !== 'sterngerlach';
        if ($('qexpControlsMZ')) $('qexpControlsMZ').hidden = state.qexpType !== 'machzehnder';
        if ($('qexpControlsDG')) $('qexpControlsDG').hidden = state.qexpType !== 'davisson';
      }
      if (preset.sgMode && $('sgParticleSelect')) {
        state.sgMode = preset.sgMode;
        $('sgParticleSelect').value = preset.sgMode;
      }
    }
  }

  window.Mod5Optics = {
    init,
    switchSubtab,
    applyPreset,
    getActiveSub: () => `mod${state.activeSub}`
  };
})();
