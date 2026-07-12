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

  const MUTE_KEY = "keyclash_muted";
  const VOL_KEY = "keyclash_volume";
  const KEY_SFX_KEY = "keyclash_key_sfx";

  let muted = false;
  let volume = 0.7; // 0..1 master volume
  let keySfx = true;

  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
    const v = Number(localStorage.getItem(VOL_KEY));
    if (Number.isFinite(v)) volume = Math.min(1, Math.max(0, v));
    if (localStorage.getItem(KEY_SFX_KEY) === "0") keySfx = false;
  } catch (_) {
    muted = false;
    volume = 0.7;
    keySfx = true;
  }

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

  function isMuted() {
    return muted || volume <= 0.001;
  }

  function getVolume() {
    return volume;
  }

  function getVolumePercent() {
    return Math.round(volume * 100);
  }

  function isKeySfxEnabled() {
    return keySfx;
  }

  function setMuted(value) {
    muted = !!value;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch (_) {}
    syncAudioUi();
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function setVolume(value) {
    const n = Number(value);
    volume = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.7;
    try {
      localStorage.setItem(VOL_KEY, String(volume));
    } catch (_) {}
    // Auto-unmute when raising volume from muted-by-slider
    if (volume > 0.001 && muted && value !== 0) {
      // keep explicit mute flag independent unless user moves slider while muted
    }
    syncAudioUi();
    return volume;
  }

  function setVolumePercent(pct) {
    return setVolume(Number(pct) / 100);
  }

  function setKeySfx(value) {
    keySfx = !!value;
    try {
      localStorage.setItem(KEY_SFX_KEY, keySfx ? "1" : "0");
    } catch (_) {}
    syncAudioUi();
    return keySfx;
  }

  function effectiveGain(base) {
    if (muted || volume <= 0.001) return 0;
    return (base || 0.08) * volume;
  }

  function syncAudioUi() {
    const settingsBtn = document.getElementById("btn-settings");
    if (settingsBtn) {
      const silent = isMuted();
      settingsBtn.classList.toggle("is-muted", silent);
      settingsBtn.setAttribute(
        "aria-label",
        silent ? "Settings (sound muted)" : "Settings"
      );
      settingsBtn.title = silent
        ? "Settings · Sound muted"
        : "Settings · Sound " + getVolumePercent() + "%";
      const icon = settingsBtn.querySelector(".settings-sound-dot");
      if (icon) icon.hidden = !silent;
    }

    // Legacy floating mute (if present)
    const muteBtn = document.getElementById("btn-mute");
    if (muteBtn) {
      muteBtn.classList.toggle("is-muted", muted || volume <= 0.001);
      muteBtn.setAttribute("aria-pressed", muted || volume <= 0.001 ? "true" : "false");
      muteBtn.setAttribute(
        "aria-label",
        muted || volume <= 0.001 ? "Unmute sounds" : "Mute sounds"
      );
      muteBtn.title =
        muted || volume <= 0.001
          ? "Sound off — tap to unmute"
          : "Sound " + getVolumePercent() + "% — tap to mute";
      const mIcon = muteBtn.querySelector(".mute-icon");
      if (mIcon) mIcon.textContent = muted || volume <= 0.001 ? "🔇" : "🔊";
    }

    const muteToggle = document.getElementById("settings-mute");
    if (muteToggle) {
      muteToggle.checked = muted;
      muteToggle.setAttribute("aria-checked", muted ? "true" : "false");
    }

    const volSlider = document.getElementById("settings-volume");
    if (volSlider) {
      volSlider.value = String(getVolumePercent());
      // Keep enabled while muted so users can pre-set level / drag to unmute
      volSlider.disabled = false;
    }

    const volLabel = document.getElementById("settings-volume-label");
    if (volLabel) {
      volLabel.textContent = muted ? "Muted" : getVolumePercent() + "%";
    }

    const keyToggle = document.getElementById("settings-key-sfx");
    if (keyToggle) {
      keyToggle.checked = keySfx;
    }

    const volFill = document.getElementById("settings-volume-fill");
    if (volFill) {
      const pct = muted ? 0 : getVolumePercent();
      volFill.style.width = pct + "%";
    }
  }

  // Back-compat alias
  const syncMuteUi = syncAudioUi;

  function ensureAudio() {
    if (isMuted()) return null;
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
    if (isMuted()) return;
    const ac = ensureAudio();
    if (!ac) return;
    const g = effectiveGain(gainValue || 0.08);
    if (g <= 0.0001) return;
    const t0 = when || ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  const SFX = {
    key() {
      if (isMuted() || !keySfx) return;
      tone(620 + Math.random() * 80, 0.05, "triangle", 0.03);
    },
    error() {
      if (isMuted()) return;
      tone(160, 0.12, "square", 0.04);
      tone(120, 0.14, "sawtooth", 0.02, (audioCtx && audioCtx.currentTime) || 0);
    },
    countdown(n) {
      if (isMuted()) return;
      if (n === "GO") {
        tone(520, 0.12, "sine", 0.1);
        tone(780, 0.18, "triangle", 0.09, (audioCtx && audioCtx.currentTime + 0.05) || 0);
        tone(1040, 0.2, "sine", 0.06, (audioCtx && audioCtx.currentTime + 0.12) || 0);
      } else {
        const step = typeof n === "number" ? n : 3;
        tone(280 + step * 55, 0.11, "sine", 0.09);
        tone(280 + step * 55, 0.06, "triangle", 0.04, (audioCtx && audioCtx.currentTime + 0.04) || 0);
      }
    },
    start() {
      if (isMuted()) return;
      SFX.countdown("GO");
    },
    finish() {
      if (isMuted()) return;
      const ac = ensureAudio();
      if (!ac) return;
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => tone(f, 0.22, "triangle", 0.07, ac.currentTime + i * 0.08));
    },
    victory() {
      if (isMuted()) return;
      const ac = ensureAudio();
      if (!ac) return;
      const fanfare = [523, 659, 784, 1046, 784, 1046, 1319];
      fanfare.forEach((f, i) => tone(f, 0.18, "triangle", 0.09, ac.currentTime + i * 0.07));
      tone(1568, 0.28, "sine", 0.05, ac.currentTime + 0.55);
    },
    join() {
      if (isMuted()) return;
      tone(440, 0.08, "sine", 0.05);
      tone(660, 0.1, "triangle", 0.04, (audioCtx && audioCtx.currentTime + 0.06) || 0);
    },
    click() {
      if (isMuted()) return;
      tone(880, 0.04, "triangle", 0.025);
    },
    /** Preview for settings calibration */
    test() {
      if (isMuted()) return;
      const ac = ensureAudio();
      if (!ac) return;
      tone(440, 0.1, "sine", 0.08);
      tone(660, 0.12, "triangle", 0.07, ac.currentTime + 0.1);
      tone(880, 0.14, "sine", 0.06, ac.currentTime + 0.22);
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

  ["pointerdown", "keydown"].forEach((ev) => {
    window.addEventListener(
      ev,
      () => {
        if (!isMuted()) ensureAudio();
      },
      { once: true, capture: true }
    );
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncAudioUi);
  } else {
    syncAudioUi();
  }

  global.KeyClashFX = {
    SFX,
    burstAtElement,
    spawnParticles,
    launchConfetti,
    screenFlash,
    victoryFX,
    isMuted,
    setMuted,
    toggleMute,
    getVolume,
    getVolumePercent,
    setVolume,
    setVolumePercent,
    isKeySfxEnabled,
    setKeySfx,
    syncMuteUi,
    syncAudioUi,
  };
})(window);
