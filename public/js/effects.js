/**
 * KeyClash visual + audio effects
 */
(function (global) {
  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let confetti = [];
  let dpr = 1;
  let audioCtx = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function tone(freq, duration, type, gainValue, when) {
    const ac = ensureAudio();
    if (!ac) return;
    const t0 = when || ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const SFX = {
    key() {
      tone(620 + Math.random() * 80, 0.05, "triangle", 0.03);
    },
    error() {
      tone(160, 0.12, "square", 0.04);
      tone(120, 0.14, "sawtooth", 0.02, (audioCtx && audioCtx.currentTime) || 0);
    },
    countdown(n) {
      if (n === "GO") {
        tone(520, 0.12, "sine", 0.1);
        tone(780, 0.18, "triangle", 0.08, (audioCtx && audioCtx.currentTime + 0.05) || 0);
      } else {
        tone(330 + n * 40, 0.12, "sine", 0.08);
      }
    },
    finish() {
      const ac = ensureAudio();
      if (!ac) return;
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => tone(f, 0.22, "triangle", 0.07, ac.currentTime + i * 0.08));
    },
    victory() {
      const ac = ensureAudio();
      if (!ac) return;
      const fanfare = [523, 659, 784, 1046, 784, 1046, 1319];
      fanfare.forEach((f, i) => tone(f, 0.18, "triangle", 0.08, ac.currentTime + i * 0.07));
    },
    join() {
      tone(440, 0.08, "sine", 0.05);
      tone(660, 0.1, "triangle", 0.04, (audioCtx && audioCtx.currentTime + 0.06) || 0);
    },
  };

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function burstAtElement(el, color, count) {
    if (!el) {
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, color, count || 18);
      return;
    }
    const r = el.getBoundingClientRect();
    spawnParticles(r.left + r.width / 2, r.top + r.height / 2, color || "#00f5d4", count || 16);
  }

  function launchConfetti(opts) {
    const amount = (opts && opts.amount) || 120;
    const colors = ["#00f5d4", "#f72585", "#ffd60a", "#7b2cbf", "#4cc9f0", "#06d6a0", "#fff"];
    for (let i = 0; i < amount; i++) {
      confetti.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 220,
        w: 6 + Math.random() * 7,
        h: 8 + Math.random() * 12,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: -0.18 + Math.random() * 0.36,
        color: colors[i % colors.length],
        life: 1,
        decay: 0.0025 + Math.random() * 0.0035,
      });
    }
    if (!opts || opts.sound !== false) SFX.finish();
  }

  function victoryFX(place) {
    launchConfetti({ amount: place === 1 ? 180 : 90, sound: false });
    if (place === 1) {
      SFX.victory();
      screenFlash("rgba(255,214,10,0.18)");
      // secondary burst
      setTimeout(() => launchConfetti({ amount: 80, sound: false }), 280);
    } else {
      SFX.finish();
      screenFlash("rgba(0,245,212,0.12)");
    }

    const burst = document.getElementById("win-burst");
    const title = document.getElementById("win-burst-title");
    const sub = document.getElementById("win-burst-sub");
    if (burst && title && sub) {
      title.textContent = place === 1 ? "VICTORY" : "FINISHED";
      sub.textContent = place === 1 ? "1st Place · Crown Yours" : `#${place} · Nice run`;
      burst.hidden = false;
      clearTimeout(burst._hideTimer);
      burst._hideTimer = setTimeout(() => {
        burst.hidden = true;
      }, 2400);
    }
  }

  function screenFlash(color) {
    const flash = document.createElement("div");
    flash.style.cssText = `
      position:fixed;inset:0;z-index:49;pointer-events:none;
      background:${color || "rgba(0,245,212,0.12)"};
      animation: fxFlash 0.35s ease forwards;
    `;
    if (!document.getElementById("fx-flash-style")) {
      const style = document.createElement("style");
      style.id = "fx-flash-style";
      style.textContent = `@keyframes fxFlash{from{opacity:1}to{opacity:0}}`;
      document.head.appendChild(style);
    }
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vr;
      c.life -= c.decay;
      if (c.life <= 0 || c.y > window.innerHeight + 40) {
        confetti.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  tick();

  // Unlock audio on first interaction
  ["pointerdown", "keydown"].forEach((ev) => {
    window.addEventListener(
      ev,
      () => {
        ensureAudio();
      },
      { once: true, capture: true }
    );
  });

  global.KeyClashFX = {
    SFX,
    burstAtElement,
    spawnParticles,
    launchConfetti,
    screenFlash,
    victoryFX,
  };
})(window);
