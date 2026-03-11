<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // ── Star field state ────────────────────────────────────────
  interface Star {
    x: number;
    y: number;
    z: number;
    opacity: number;
    size: number;
  }

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    hue: number;
  }

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number;
  let stars: Star[] = [];
  let particles: Particle[] = [];
  let time = 0;
  let mouseX = 0.5;
  let mouseY = 0.5;

  const STAR_COUNT = 220;
  const PARTICLE_COUNT = 35;
  const DRIFT_SPEED = 0.0003;

  // ── Typewriter state ────────────────────────────────────────
  let statusLines: { text: string; class: string; visible: boolean }[] = [
    { text: '[ .. ] resolving signal chain', class: 'pend', visible: false },
    { text: '[ OK ] local systems nominal', class: 'ok', visible: false },
    { text: '[WARN] upstream capacity depleted', class: 'warn', visible: false },
    { text: '[FAIL] analysis channel unavailable', class: 'fail', visible: false },
    { text: '[ .. ] standing by for recovery', class: 'pend', visible: false }
  ];

  let showContent = false;
  let showCta = false;

  function initStars(width: number, height: number) {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      opacity: Math.random() * 0.6 + 0.1,
      size: Math.random() * 1.8 + 0.3
    }));
  }

  function spawnParticle(width: number, height: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.3 + 0.1;
    return {
      x: width * 0.5 + (Math.random() - 0.5) * width * 0.3,
      y: height * 0.5 + (Math.random() - 0.5) * height * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 300 + 200,
      size: Math.random() * 2 + 0.5,
      hue: Math.random() > 0.5 ? 36 : 174 // gold or teal
    };
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    time += 1;

    // Clear with trail effect
    ctx.fillStyle = 'rgba(8, 9, 11, 0.12)';
    ctx.fillRect(0, 0, w, h);

    // Parallax offsets from mouse
    const px = (mouseX - 0.5) * 18;
    const py = (mouseY - 0.5) * 12;

    // ── Stars ─────────────────────────────────
    for (const star of stars) {
      // Slow drift
      star.y += DRIFT_SPEED * (1 + star.z) * 2;
      star.x += DRIFT_SPEED * Math.sin(time * 0.002 + star.z * 10) * 0.5;

      // Wrap
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }

      // Twinkle
      const twinkle = Math.sin(time * 0.02 + star.z * 100) * 0.3 + 0.7;
      const finalOpacity = star.opacity * twinkle;

      const drawX = star.x + px * star.z;
      const drawY = star.y + py * star.z;

      ctx.beginPath();
      ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.z > 0.7
        ? `rgba(199, 156, 87, ${finalOpacity})`
        : star.z > 0.4
          ? `rgba(121, 166, 163, ${finalOpacity * 0.7})`
          : `rgba(240, 232, 218, ${finalOpacity * 0.5})`;
      ctx.fill();

      // Occasional glow on bright stars
      if (star.size > 1.4 && twinkle > 0.85) {
        ctx.beginPath();
        ctx.arc(drawX, drawY, star.size * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, star.size * 3);
        grad.addColorStop(0, `rgba(199, 156, 87, ${finalOpacity * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    // ── Drift particles ───────────────────────
    while (particles.length < PARTICLE_COUNT) {
      particles.push(spawnParticle(w, h));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += 1;

      if (p.life > p.maxLife) {
        particles[i] = spawnParticle(w, h);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Smooth fade in/out
      const lifeRatio = p.life / p.maxLife;
      const fade = lifeRatio < 0.1
        ? lifeRatio / 0.1
        : lifeRatio > 0.8
          ? (1 - lifeRatio) / 0.2
          : 1;

      const alpha = fade * 0.35;

      ctx.beginPath();
      ctx.arc(p.x + px * 0.3, p.y + py * 0.3, p.size, 0, Math.PI * 2);
      if (p.hue === 36) {
        ctx.fillStyle = `rgba(199, 156, 87, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(121, 166, 163, ${alpha})`;
      }
      ctx.fill();
    }

    // ── Central nebula glow ───────────────────
    const nebulaX = w * 0.5 + px * 0.5;
    const nebulaY = h * 0.42 + py * 0.5;
    const pulse = Math.sin(time * 0.008) * 0.15 + 0.85;
    const nebulaRadius = Math.min(w, h) * 0.28 * pulse;

    const nebula = ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, nebulaRadius);
    nebula.addColorStop(0, `rgba(199, 156, 87, ${0.04 * pulse})`);
    nebula.addColorStop(0.4, `rgba(121, 166, 163, ${0.025 * pulse})`);
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);

    // ── Orbital ring ──────────────────────────
    const ringRadius = Math.min(w, h) * 0.16;
    const ringRotation = time * 0.003;

    ctx.save();
    ctx.translate(nebulaX, nebulaY);
    ctx.rotate(ringRotation);
    ctx.scale(1, 0.35);

    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(199, 156, 87, ${0.08 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Second ring, counter-rotating
    ctx.rotate(-ringRotation * 2.4);
    ctx.scale(1.3, 1.1);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(121, 166, 163, ${0.06 * pulse})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.restore();

    animationFrame = requestAnimationFrame(render);
  }

  function handleResize() {
    if (!canvas || !browser) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx?.scale(dpr, dpr);
    initStars(window.innerWidth, window.innerHeight);
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }

  onMount(() => {
    if (!browser || !canvas) return;

    ctx = canvas.getContext('2d');
    handleResize();

    // Clear canvas fully on first frame
    if (ctx) {
      ctx.fillStyle = '#08090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animationFrame = requestAnimationFrame(render);

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Staggered typewriter reveal
    statusLines.forEach((_, i) => {
      setTimeout(() => {
        statusLines[i].visible = true;
        statusLines = statusLines;
      }, 600 + i * 700);
    });

    // Show main content after status lines
    setTimeout(() => {
      showContent = true;
    }, 600 + statusLines.length * 700 + 400);

    setTimeout(() => {
      showCta = true;
    }, 600 + statusLines.length * 700 + 1200);
  });

  onDestroy(() => {
    if (!browser) return;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
  });
</script>

<svelte:head>
  <title>Drifting · Thought Structure</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="billing-error-page" id="billing-error-page">
  <!-- Canvas background -->
  <canvas bind:this={canvas} class="star-canvas" aria-hidden="true"></canvas>

  <!-- Scan band -->
  <div class="scan-band" aria-hidden="true"></div>

  <!-- Grid overlay -->
  <div class="grid-overlay" aria-hidden="true"></div>

  <!-- Vignette -->
  <div class="vignette" aria-hidden="true"></div>

  <!-- Content -->
  <div class="content-shell">
    <!-- Corner brackets -->
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>

    <!-- Status terminal -->
    <div class="terminal-block">
      {#each statusLines as line}
        <div class="status-line {line.class}" class:visible={line.visible}>
          <span class="status-text">{line.text}</span>
          {#if line.visible}
            <span class="cursor-blink">_</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Main message -->
    <div class="main-message" class:visible={showContent}>
      <p class="section-label" aria-hidden="true">00 / drifting</p>
      <h1 class="heading">
        the signal<br />needs rest.
      </h1>
      <p class="body-text">
        the analysis engine has reached its quiet
        threshold. it will return once the channel
        clears on its own.
      </p>
      <p class="body-text quiet">
        nothing is broken. just still.
      </p>
    </div>

    <!-- CTA / status footer -->
    <div class="cta-block" class:visible={showCta}>
      <a href="/" class="return-link" id="billing-error-return">
        <span class="link-bracket">[</span>
        <span class="link-text">return to input</span>
        <span class="link-bracket">]</span>
      </a>
      <div class="status-footer">
        <span class="status-dot"></span>
        <span class="status-label">monitoring for signal recovery</span>
      </div>
    </div>
  </div>
</div>

<style>
  /* ── Page shell ───────────────────────────── */
  .billing-error-page {
    position: relative;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #08090b;
  }

  /* ── Canvas ───────────────────────────────── */
  .star-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  /* ── Ambient layers ───────────────────────── */
  .scan-band {
    position: fixed;
    top: 0;
    left: 0;
    width: 24%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(199, 156, 87, 0.06), transparent);
    animation: scan 6s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes scan {
    from { transform: translateX(-120%); }
    to   { transform: translateX(520%); }
  }

  .grid-overlay {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(to right, transparent 0, transparent calc(100% - 1px), rgba(199, 156, 87, 0.04) calc(100% - 1px)),
      linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), rgba(121, 166, 163, 0.03) calc(100% - 1px));
    background-size: 72px 72px;
    mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
    opacity: 0.5;
    pointer-events: none;
    z-index: 1;
  }

  .vignette {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%),
      radial-gradient(circle at top, rgba(182, 106, 72, 0.06), transparent 40%);
    pointer-events: none;
    z-index: 2;
  }

  /* ── Content shell ────────────────────────── */
  .content-shell {
    position: relative;
    z-index: 3;
    max-width: 540px;
    width: 100%;
    padding: clamp(2rem, 5vw, 4rem);
    margin: 0 auto;
  }

  /* ── Corner brackets ──────────────────────── */
  .corner {
    position: absolute;
    width: 2rem;
    height: 2rem;
    border-color: rgba(182, 106, 72, 0.28);
    border-style: solid;
    pointer-events: none;
    opacity: 0;
    animation: corner-fade-in 1.5s ease-out forwards;
  }

  .tl { top: 0; left: 0; border-width: 1px 0 0 1px; animation-delay: 0.3s; }
  .tr { top: 0; right: 0; border-width: 1px 1px 0 0; animation-delay: 0.5s; }
  .bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; animation-delay: 0.7s; }
  .br { bottom: 0; right: 0; border-width: 0 1px 1px 0; animation-delay: 0.9s; }

  @keyframes corner-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Terminal block ───────────────────────── */
  .terminal-block {
    margin-bottom: 2.5rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
  }

  .status-line {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    line-height: 2;
    white-space: nowrap;
  }

  .status-line.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .status-line.pend .status-text {
    color: var(--status-pend);
  }

  .status-line.ok .status-text {
    color: var(--status-ok);
  }

  .status-line.fail .status-text {
    color: var(--status-fail);
  }

  .status-line.warn .status-text {
    color: var(--status-warn);
  }

  .cursor-blink {
    color: var(--muted-strong);
    animation: blink 1s step-end infinite;
    margin-left: 2px;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  /* ── Main message ─────────────────────────── */
  .main-message {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .main-message.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .section-label {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--status-fail);
    margin: 0 0 1.2rem 0;
  }

  .heading {
    font-family: var(--font-body);
    font-size: clamp(2.2rem, 5vw, 3.6rem);
    font-weight: 400;
    line-height: 0.94;
    letter-spacing: -0.04em;
    color: var(--text);
    margin: 0 0 1.6rem 0;
    max-width: 10ch;
  }

  .body-text {
    font-family: var(--font-body);
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--text-soft);
    margin: 0 0 0.8rem 0;
    max-width: 30rem;
  }

  .body-text.quiet {
    color: var(--muted);
    font-style: italic;
    margin-top: 0.4rem;
  }

  /* ── CTA block ────────────────────────────── */
  .cta-block {
    margin-top: 2.8rem;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s,
                transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
  }

  .cta-block.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .return-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--accent);
    padding: 0.6rem 1rem;
    border: 1px solid rgba(199, 156, 87, 0.2);
    background: linear-gradient(135deg, rgba(199, 156, 87, 0.06), transparent 60%);
    transition: var(--transition-smooth);
  }

  .return-link:hover {
    transform: translateY(-2px);
    border-color: rgba(199, 156, 87, 0.4);
    background: linear-gradient(135deg, rgba(199, 156, 87, 0.12), transparent 60%);
    color: var(--accent-strong);
  }

  .link-bracket {
    color: var(--muted-strong);
    font-weight: 500;
  }

  .status-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.4rem;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted-strong);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-fail);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.3); }
  }

  /* ── Reduced motion ───────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .scan-band,
    .cursor-blink,
    .status-dot,
    .corner { animation: none !important; }

    .status-line,
    .main-message,
    .cta-block {
      transition: none !important;
      transform: none !important;
      opacity: 1 !important;
    }

    .corner { opacity: 1 !important; }
  }

  /* ── Mobile adjustments ───────────────────── */
  @media (max-width: 600px) {
    .content-shell {
      padding: 2rem 1.5rem;
    }

    .heading {
      font-size: clamp(1.8rem, 8vw, 2.8rem);
    }
  }
</style>
