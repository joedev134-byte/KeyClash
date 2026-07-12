/**
 * Lightweight canvas charts for KeyClash race results (no deps).
 */
(function (global) {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Array<{t:number,wpm:number,progress:number,accuracy:number}>} history
   * @param {{ title?: string }} [opts]
   */
  function drawRaceCharts(canvas, history, opts) {
    if (!canvas) return;
    const samples = Array.isArray(history) ? history.slice() : [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 360;
    const cssH = canvas.clientHeight || 200;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 36, r: 14, t: 28, b: 28 };
    const w = cssW - pad.l - pad.r;
    const h = cssH - pad.t - pad.b;

    // background
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, 0, 0, cssW, cssH, 12);
    ctx.fill();

    if (samples.length < 2) {
      ctx.fillStyle = "#8b93b8";
      ctx.font = "13px Outfit, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Not enough data for chart", cssW / 2, cssH / 2);
      return;
    }

    const t0 = samples[0].t;
    const tMax = Math.max(1, samples[samples.length - 1].t - t0);
    const maxWpm = Math.max(20, ...samples.map((s) => s.wpm || 0));
    const yMax = Math.ceil(maxWpm / 10) * 10;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#8b93b8";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + w, y);
      ctx.stroke();
      const val = Math.round(yMax * (1 - i / 4));
      ctx.fillText(String(val), pad.l - 6, y + 3);
    }

    // x labels
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const x = pad.l + (w * i) / 4;
      const sec = ((tMax * i) / 4 / 1000).toFixed(i === 0 ? 0 : 1);
      ctx.fillText(sec + "s", x, cssH - 8);
    }

    function xOf(s) {
      return pad.l + ((s.t - t0) / tMax) * w;
    }
    function yWpm(s) {
      return pad.t + h - ((s.wpm || 0) / yMax) * h;
    }
    function yProg(s) {
      return pad.t + h - ((s.progress || 0) / 100) * h;
    }

    // progress area (under)
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = xOf(s);
      const y = yProg(s);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(samples[samples.length - 1]), pad.t + h);
    ctx.lineTo(xOf(samples[0]), pad.t + h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
    grad.addColorStop(0, "rgba(0,245,212,0.22)");
    grad.addColorStop(1, "rgba(0,245,212,0.02)");
    ctx.fillStyle = grad;
    ctx.fill();

    // progress line
    strokeSeries(ctx, samples, xOf, yProg, "#00f5d4", 2);

    // WPM line
    strokeSeries(ctx, samples, xOf, yWpm, "#f72585", 2.5);

    // legend + title
    ctx.font = "600 12px Outfit, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#e8ecff";
    ctx.fillText((opts && opts.title) || "Your race graph", pad.l, 16);

    ctx.font = "11px Outfit, system-ui, sans-serif";
    legend(ctx, pad.l + w - 150, 12, "#f72585", "WPM");
    legend(ctx, pad.l + w - 80, 12, "#00f5d4", "Progress");
  }

  function strokeSeries(ctx, samples, xOf, yOf, color, width) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    samples.forEach((s, i) => {
      const x = xOf(s);
      const y = yOf(s);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // end dot
    const last = samples[samples.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xOf(last), yOf(last), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function legend(ctx, x, y, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 5, 10, 3);
    ctx.fillStyle = "#8b93b8";
    ctx.fillText(label, x + 14, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /**
   * Build summary stats from history + final snapshot.
   */
  function summarizeHistory(history, finalStats) {
    const samples = history || [];
    const peakWpm = samples.reduce((m, s) => Math.max(m, s.wpm || 0), finalStats.wpm || 0);
    const avgWpm =
      samples.length > 0
        ? Math.round(samples.reduce((a, s) => a + (s.wpm || 0), 0) / samples.length)
        : finalStats.wpm || 0;
    const durationMs =
      samples.length > 1 ? samples[samples.length - 1].t - samples[0].t : finalStats.elapsed || 0;
    return {
      peakWpm,
      avgWpm,
      durationMs,
      finalWpm: finalStats.wpm || 0,
      accuracy: finalStats.accuracy != null ? finalStats.accuracy : 100,
      errors: finalStats.errors || 0,
      progress: finalStats.progress != null ? finalStats.progress : 100,
      place: finalStats.place || null,
      correct: finalStats.correct || 0,
    };
  }

  global.KeyClashCharts = {
    drawRaceCharts,
    summarizeHistory,
  };
})(window);
