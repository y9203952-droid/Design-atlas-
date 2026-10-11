(function () {
  const cv = document.getElementById("c");
  if (!cv) return;
  const g = cv.getContext("2d");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, D, motes = [];

  function rs() {
    D = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.parentElement.clientWidth || innerWidth;
    H = cv.parentElement.clientHeight || innerHeight;
    cv.width = W * D;
    cv.height = H * D;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    g.setTransform(D, 0, 0, D, 0, 0);
    seed();
  }

  function seed() {
    const n = Math.min(90, Math.floor((W * H) / 7000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + Math.random() * 1.8,
      a: 0.12 + Math.random() * 0.35,
      s: 0.06 + Math.random() * 0.16,
      p: Math.random() * Math.PI * 2,
      gold: Math.random() > 0.55,
    }));
  }

  function draw(t) {
    g.clearRect(0, 0, W, H);
    const g1 = g.createRadialGradient(W * 0.15, H * 0.8, 0, W * 0.15, H * 0.8, 280);
    g1.addColorStop(0, "rgba(184,87,125,0.16)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = g1;
    g.fillRect(0, 0, W, H);
    const g2 = g.createRadialGradient(W, 0, 0, W, 0, 260);
    g2.addColorStop(0, "rgba(201,128,84,0.18)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = g2;
    g.fillRect(0, 0, W, H);

    for (const s of motes) {
      const tw = RM ? s.a : s.a * (0.6 + 0.4 * Math.sin(t * s.s + s.p));
      g.beginPath();
      g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      g.fillStyle = s.gold ? `rgba(138,90,43,${tw})` : `rgba(23,13,44,${tw})`;
      g.fill();
    }
    if (!RM) requestAnimationFrame(draw);
  }

  addEventListener("resize", rs);
  rs();
  requestAnimationFrame(draw);
})();
