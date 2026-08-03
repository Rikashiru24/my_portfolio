/* HARVIN ARISGA — Sci-Fi Portfolio Scripts */

(function () {
  'use strict';

  /* --- Intro Splash --- */
  const introSplash = document.getElementById('intro-splash');
  const introEnterBtn = document.getElementById('intro-enter-btn');
  const introTapHint = document.getElementById('intro-tap-hint');
  let introDismissed = false;
  let startScrollAchievementsFn = null;
  let onEnterArena = null;

  function dismissIntro() {
    if (introDismissed) return;
    introDismissed = true;
    if (introSplash) introSplash.classList.add('hidden');
    document.body.classList.add('loaded');
    if (typeof startScrollAchievementsFn === 'function') {
      setTimeout(startScrollAchievementsFn, 400);
    }
    if (typeof onEnterArena === 'function') {
      onEnterArena(true);
    }
  }

  if (introSplash) {
    setTimeout(() => {
      introSplash.classList.add('intro-ready');
      if (introEnterBtn) introEnterBtn.hidden = false;
      if (introTapHint) introTapHint.hidden = false;
    }, 2600);

    introSplash.addEventListener('click', dismissIntro);
    introSplash.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismissIntro();
      }
    });

    if (introEnterBtn) {
      introEnterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissIntro();
      });
    }
  } else {
    document.body.classList.add('loaded');
  }

  /* --- Floating Particles --- */
  const particleCanvas = document.getElementById('particles');
  if (particleCanvas) {
    const pCtx = particleCanvas.getContext('2d');
    let particles = [];
    let pw, ph;

    function pResize() {
      pw = particleCanvas.width = window.innerWidth;
      ph = particleCanvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * pw,
        y: Math.random() * ph,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 0.5,
        hue: Math.random() > 0.5 ? '0,240,255' : '255,0,170'
      }));
    }

    function drawParticles() {
      pCtx.clearRect(0, 0, pw, ph);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > pw) p.vx *= -1;
        if (p.y < 0 || p.y > ph) p.vy *= -1;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(${p.hue}, 0.6)`;
        pCtx.fill();
      });
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            pCtx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 120)})`;
            pCtx.lineWidth = 0.5;
            pCtx.beginPath();
            pCtx.moveTo(a.x, a.y);
            pCtx.lineTo(b.x, b.y);
            pCtx.stroke();
          }
        }
      });
      requestAnimationFrame(drawParticles);
    }

    pResize();
    initParticles();
    drawParticles();
    window.addEventListener('resize', () => { pResize(); initParticles(); });
  }

  /* --- Portrait 3D Tilt --- */
  const portraitTilt = document.getElementById('portrait-tilt');
  const portraitImg = document.getElementById('portrait-img');
  const portraitLabel = document.getElementById('portrait-reaction-label');

  const PORTRAIT_REACTIONS = [
    { id: 'neutral', src: 'images/reaction-neutral.png', label: 'READY', caption: 'Hey there!', thought: 'Oh… someone\'s scrolling my site.' },
    { id: 'smile', src: 'images/reaction-smile.png', label: 'LOCKED IN', caption: 'Smile!', thought: 'Nice. I hope you like what you see!' },
    { id: 'thinking', src: 'images/reaction-thinking.png', label: 'ANALYZING...', caption: 'Hmm...', thought: 'Hmm… should I tell them about my stack?' },
    { id: 'look-right', src: 'images/reaction-look-right.png', label: 'SCOUTING', caption: 'Over there!', thought: 'Psst — my projects are down there →' },
    { id: 'watch', src: 'images/reaction-watch.png', label: 'ON THE CLOCK', caption: 'Time check!', thought: 'Whoa, you\'re really taking your time. Respect.' },
    { id: 'confident', src: 'images/reaction-confident.png', label: 'CONFIDENT', caption: 'Confident.', thought: 'Yeah… I built all of this. Confident.' },
    { id: 'serious', src: 'images/reaction-serious.png', label: 'FOCUSED', caption: 'Locked in.', thought: 'Focus mode on. No bugs escape me.' },
    { id: 'thumbs-up', src: 'images/reaction-thumbs-up.png', label: 'APPROVED', caption: 'Let\'s go!', thought: 'You made it to the end — we\'re gonna get along!' }
  ];

  const SECTION_REACTIONS = {
    about: 'thinking',
    services: 'confident',
    projects: 'serious',
    contact: 'look-right'
  };

  let portraitIndex = 0;
  let portraitHovering = false;
  let portraitLockedUntil = 0;
  let portraitIdleTimer = null;
  let portraitAutoPlaying = false;
  let portraitAutoTimer = null;
  let portraitClickHandled = false;
  let currentReactionId = 'neutral';

  function setPortraitReaction(reactionId, options = {}) {
    const { animate = true, lockMs = 0, force = false } = options;
    const reaction = PORTRAIT_REACTIONS.find(r => r.id === reactionId) || PORTRAIT_REACTIONS[0];
    if (!portraitImg || (!force && reaction.id === currentReactionId)) return;

    currentReactionId = reaction.id;
    portraitIndex = PORTRAIT_REACTIONS.findIndex(r => r.id === reaction.id);
    if (portraitIndex < 0) portraitIndex = 0;

    if (lockMs > 0) portraitLockedUntil = Date.now() + lockMs;

    portraitImg.src = reaction.src;
    if (portraitLabel) portraitLabel.textContent = `◈ ${reaction.label}`;

    if (animate) {
      portraitImg.classList.remove('reaction-pop');
      void portraitImg.offsetWidth;
      portraitImg.classList.add('reaction-pop');
      setTimeout(() => portraitImg.classList.remove('reaction-pop'), 420);
    }
  }

  function cyclePortraitReaction() {
    if (!portraitImg || portraitAutoPlaying) return;

    clearTimeout(portraitIdleTimer);
    portraitIndex = (portraitIndex + 1) % PORTRAIT_REACTIONS.length;
    const reaction = PORTRAIT_REACTIONS[portraitIndex];

    setPortraitReaction(reaction.id, { force: true, lockMs: 1200 });
    if (portraitLabel) portraitLabel.textContent = `◈ ${reaction.caption.toUpperCase()}`;

    if (SciFiAudio.enabled) {
      ensureAudioRunning().then((ready) => {
        if (ready) SciFiAudio.playPortraitReaction(reaction.id);
      });
    }
  }

  function schedulePortraitIdle() {
    /* Idle auto-reactions disabled — portrait only changes on hover or click */
  }

  if (portraitTilt) {
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (canTilt) {
      portraitTilt.addEventListener('mousemove', e => {
        const rect = portraitTilt.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        portraitTilt.style.transform = `perspective(800px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.02)`;
      });
    }

    portraitTilt.addEventListener('mouseenter', () => {
      portraitHovering = true;
      if (!portraitAutoPlaying) {
        setPortraitReaction('smile', { force: currentReactionId !== 'smile' });
        if (portraitLabel) portraitLabel.textContent = '◈ SMILE!';
        if (SciFiAudio.enabled) {
          ensureAudioRunning().then((ready) => {
            if (ready) SciFiAudio.playPortraitSmile();
          });
        }
      }
    });

    portraitTilt.addEventListener('mouseleave', () => {
      portraitHovering = false;
      portraitTilt.style.transform = '';
      if (!portraitAutoPlaying && Date.now() >= portraitLockedUntil) {
        setPortraitReaction('neutral');
        if (portraitLabel) portraitLabel.textContent = '◈ READY';
      }
    });

    portraitTilt.addEventListener('click', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        e.stopPropagation();
        portraitClickHandled = true;
        cyclePortraitReaction();
        requestAnimationFrame(() => { portraitClickHandled = false; });
        return;
      }
      if (typeof e.button === 'number' && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      portraitClickHandled = true;
      cyclePortraitReaction();
      requestAnimationFrame(() => { portraitClickHandled = false; });
    });

    schedulePortraitIdle();
  }

  Object.entries(SECTION_REACTIONS).forEach(([sectionId, reactionId]) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !portraitHovering && !portraitAutoPlaying && Date.now() >= portraitLockedUntil) {
          setPortraitReaction(reactionId, { lockMs: 3200 });
        }
      });
    }, { threshold: 0.4 });

    observer.observe(section);
  });

  /* --- Scroll Thought Reactions --- */
  const scrollThoughtsEl = document.getElementById('scroll-thoughts');
  const thoughtPortrait = document.getElementById('thought-portrait');
  const thoughtText = document.getElementById('thought-text');
  const thoughtBubble = document.getElementById('thought-bubble');

  let scrollThoughtIndex = -1;
  let scrollThoughtsVisible = false;
  let lastThoughtSound = 0;

  function getScrollProgress() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
  }

  function getReactionIndexForScroll(progress) {
    const count = PORTRAIT_REACTIONS.length;
    const index = Math.floor((progress / 100) * count);
    return Math.min(count - 1, Math.max(0, index));
  }

  function setScrollThought(index) {
    if (index === scrollThoughtIndex) return;
    scrollThoughtIndex = index;

    const reaction = PORTRAIT_REACTIONS[index];
    if (!reaction || !thoughtPortrait) return;

    thoughtPortrait.src = reaction.src;
    if (thoughtText) {
      thoughtText.classList.remove('visible');
      void thoughtText.offsetWidth;
      thoughtText.textContent = reaction.thought;
      requestAnimationFrame(() => thoughtText.classList.add('visible'));
    }

    if (thoughtPortrait) {
      thoughtPortrait.classList.remove('thought-pop');
      void thoughtPortrait.offsetWidth;
      thoughtPortrait.classList.add('thought-pop');
    }

    if (thoughtBubble) {
      thoughtBubble.classList.remove('bubble-in');
      void thoughtBubble.offsetWidth;
      thoughtBubble.classList.add('bubble-in');
    }

    const now = Date.now();
    if (SciFiAudio.enabled && now - lastThoughtSound > 600) {
      ensureAudioRunning().then((ready) => {
        if (ready) SciFiAudio.playPortraitReaction(reaction.id);
      });
      lastThoughtSound = now;
    }
  }

  function showScrollThoughts() {
    if (!scrollThoughtsEl || scrollThoughtsVisible) return;
    scrollThoughtsVisible = true;
    scrollThoughtsEl.hidden = false;
    scrollThoughtsEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => scrollThoughtsEl.classList.add('visible'));
  }

  function hideScrollThoughts() {
    if (!scrollThoughtsEl || !scrollThoughtsVisible) return;
    scrollThoughtsVisible = false;
    scrollThoughtIndex = -1;
    scrollThoughtsEl.classList.remove('visible');
    setTimeout(() => {
      if (!scrollThoughtsVisible) {
        scrollThoughtsEl.hidden = true;
        scrollThoughtsEl.setAttribute('aria-hidden', 'true');
      }
    }, 400);
  }

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 280) {
      hideScrollThoughts();
      return;
    }

    showScrollThoughts();
    const progress = getScrollProgress();
    setScrollThought(getReactionIndexForScroll(progress));
  }, { passive: true });

  /* --- Typewriter Effect --- */
  const typewriter = document.getElementById('typewriter');
  if (typewriter) {
    const phrases = [
      'RIVAL DETECTED — PREPARE TO BE AMAZED',
      'S-RANK DEVELOPER ONLINE',
      'BUILT DIFFERENT. BUILT TO WIN.',
      'ZERO WEAKNESS. MAXIMUM OUTPUT.'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    function typeLoop() {
      const current = phrases[phraseIdx];
      if (!deleting) {
        typewriter.textContent = current.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(typeLoop, 2200);
          return;
        }
      } else {
        typewriter.textContent = current.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      setTimeout(typeLoop, deleting ? 35 : 55);
    }

    setTimeout(typeLoop, 3000);
  }

  /* --- Starfield Canvas --- */
  const canvas = document.getElementById('starfield');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function initStars(count) {
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 2 + 0.5,
          size: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.8 + 0.2
        });
      }
    }

    function drawStars() {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(star => {
        star.y -= star.z * 0.15;
        if (star.y < 0) {
          star.y = h;
          star.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${star.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }

    resize();
    initStars(Math.floor((w * h) / 8000));
    drawStars();
    window.addEventListener('resize', () => {
      resize();
      initStars(Math.floor((w * h) / 8000));
    });
  }

  /* --- Mobile Nav --- */
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  const navBackdrop = document.getElementById('nav-backdrop');

  function setNavOpen(open) {
    if (!mainNav || !navToggle) return;
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('nav-open', open);
    if (navBackdrop) {
      navBackdrop.hidden = !open;
      navBackdrop.classList.toggle('visible', open);
      navBackdrop.setAttribute('aria-hidden', String(!open));
    }
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      setNavOpen(!mainNav.classList.contains('open'));
    });

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => setNavOpen(false));
    }

    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => setNavOpen(false));
    });
  }

  /* --- Active Nav on Scroll --- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function setActiveNav() {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveNav);

  /* --- Back to Top --- */
  const backToTop = document.getElementById('back-to-top');

  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Sci-Fi Audio Engine (Web Audio API) --- */
  const SciFiAudio = {
    enabled: true,
    ctx: null,
    master: null,
    ambientNodes: [],
    bootPlayed: false,
    clickStreak: 0,
    lastClickAt: 0,

    init() {
      if (this.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    },

    async resume() {
      this.init();
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch (_) { /* blocked until user gesture */ }
      }
      return this.ctx.state === 'running';
    },

    isRunning() {
      return Boolean(this.ctx && this.ctx.state === 'running');
    },

    setEnabled(on) {
      this.enabled = on;
      if (!on) this.stopAmbient();
    },

    tone(freq, start, dur, vol = 0.12, type = 'sine', detune = 0) {
      if (!this.enabled || !this.isRunning()) return;
      const t = this.ctx.currentTime + start;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },

    sweep(startFreq, endFreq, start, dur, vol = 0.08) {
      if (!this.enabled || !this.isRunning()) return;
      const t = this.ctx.currentTime + start;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },

    playBoot() {
      const notes = [220, 330, 440, 554, 660, 880];
      notes.forEach((freq, i) => {
        this.tone(freq, i * 0.09, 0.18, 0.1, 'square');
        this.tone(freq * 2, i * 0.09, 0.12, 0.04, 'sine');
      });
      this.sweep(120, 40, 0.5, 0.8, 0.06);
    },

    playHover() {
      this.tone(880 + Math.random() * 120, 0, 0.06, 0.05, 'sine');
      this.tone(1760, 0, 0.04, 0.02, 'triangle');
    },

    playPortraitSmile() {
      this.tone(523, 0, 0.07, 0.05, 'sine');
      this.tone(659, 0.05, 0.09, 0.045, 'sine');
      this.tone(784, 0.1, 0.08, 0.035, 'triangle');
    },

    playPortraitSequenceStart() {
      this.sweep(280, 520, 0, 0.12, 0.055);
      this.tone(440, 0.08, 0.1, 0.06, 'square');
    },

    playPortraitReaction(id) {
      const reactions = {
        neutral: () => {
          this.tone(392, 0, 0.09, 0.055, 'sine');
        },
        smile: () => {
          this.tone(523, 0, 0.1, 0.065, 'sine');
          this.tone(659, 0.07, 0.11, 0.055, 'sine');
          this.tone(784, 0.14, 0.1, 0.04, 'triangle');
        },
        thinking: () => {
          this.tone(196, 0, 0.14, 0.05, 'sine');
          this.tone(247, 0.18, 0.12, 0.04, 'triangle');
          this.tone(294, 0.32, 0.1, 0.035, 'sine');
        },
        'look-right': () => {
          this.sweep(350, 900, 0, 0.11, 0.06);
          this.tone(660, 0.06, 0.08, 0.045, 'sine');
        },
        watch: () => {
          this.tone(880, 0, 0.035, 0.05, 'square');
          this.tone(880, 0.1, 0.035, 0.05, 'square');
          this.tone(1100, 0.2, 0.05, 0.04, 'sine');
        },
        confident: () => {
          this.tone(98, 0, 0.13, 0.075, 'sine');
          this.tone(392, 0.06, 0.14, 0.065, 'square');
          this.tone(494, 0.12, 0.1, 0.045, 'sine');
        },
        serious: () => {
          this.tone(165, 0, 0.12, 0.065, 'sawtooth');
          this.tone(196, 0.08, 0.11, 0.05, 'square');
        },
        'thumbs-up': () => {
          [523, 659, 784, 988, 1175].forEach((f, i) => {
            this.tone(f, i * 0.065, 0.13, 0.07, 'sine');
          });
          this.sweep(400, 1200, 0.3, 0.25, 0.05);
        }
      };
      (reactions[id] || reactions.neutral)();
    },

    playClick(variant = 'default') {
      if (!this.enabled || !this.isRunning()) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const now = performance.now();

      if (now - this.lastClickAt < 420) {
        this.clickStreak = Math.min(this.clickStreak + 1, 16);
      } else {
        this.clickStreak = 0;
      }
      this.lastClickAt = now;

      const pitch = Math.pow(1.05946, this.clickStreak);
      const bases = { button: 500, link: 540, card: 460, default: 480 };
      const base = (bases[variant] || bases.default) * pitch;

      /* Crisp transient — the tactile "tap" */
      const bufferSize = Math.floor(ctx.sampleRate * 0.028);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1400 * pitch;
      noiseFilter.Q.value = 1.4;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(variant === 'button' ? 0.18 : 0.14, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.master);
      noise.start(t);
      noise.stop(t + 0.03);

      /* Descending pop — satisfying "bloop" */
      const pop = ctx.createOscillator();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(base * 2.2, t);
      pop.frequency.exponentialRampToValueAtTime(base * 0.55, t + 0.075);
      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.001, t);
      popGain.gain.linearRampToValueAtTime(0.2, t + 0.003);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
      pop.connect(popGain);
      popGain.connect(this.master);
      pop.start(t);
      pop.stop(t + 0.1);

      /* Bright harmonic ping */
      const ping = ctx.createOscillator();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(base * 2.8, t);
      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(0.07, t);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      ping.connect(pingGain);
      pingGain.connect(this.master);
      ping.start(t);
      ping.stop(t + 0.06);

      /* Sub thump on buttons */
      if (variant === 'button') {
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, t);
        sub.frequency.exponentialRampToValueAtTime(45, t + 0.09);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.14, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        sub.connect(subGain);
        subGain.connect(this.master);
        sub.start(t);
        sub.stop(t + 0.12);
      }

      /* Link sweep — tiny whoosh */
      if (variant === 'link') {
        this.sweep(base * 0.8, base * 2.4, 0, 0.07, 0.05);
      }

      /* Combo streak reward — rising sparkle (addictive pitch climb) */
      if (this.clickStreak >= 2) {
        this.tone(base * 4, 0.01, 0.05, 0.035 + this.clickStreak * 0.003, 'sine');
      }
      if (this.clickStreak >= 5) {
        this.tone(base * 5.5, 0.02, 0.06, 0.03, 'triangle');
        this.tone(base * 7, 0.035, 0.04, 0.02, 'sine');
      }
      if (this.clickStreak >= 10) {
        this.sweep(base * 2, base * 8, 0.04, 0.12, 0.06);
      }
    },

    playNav() {
      this.sweep(300, 900, 0, 0.12, 0.07);
      this.tone(660, 0.08, 0.1, 0.06, 'sine');
    },

    playSkillReveal() {
      this.tone(523, 0, 0.1, 0.06, 'sine');
      this.tone(659, 0.06, 0.1, 0.05, 'sine');
      this.tone(784, 0.12, 0.15, 0.04, 'triangle');
    },

    playAchievement() {
      [392, 523, 659, 784, 988].forEach((f, i) => {
        this.tone(f, i * 0.07, 0.18, 0.09, 'sine');
        this.tone(f * 1.5, i * 0.07 + 0.02, 0.1, 0.03, 'triangle');
      });
    },

    playSectionUnlock() {
      this.tone(784, 0, 0.1, 0.07, 'sine');
      this.tone(988, 0.07, 0.14, 0.065, 'sine');
      this.tone(1175, 0.14, 0.16, 0.05, 'triangle');
    },

    playToastDismiss() {
      this.tone(880, 0, 0.08, 0.055, 'sine');
      this.tone(659, 0.06, 0.1, 0.045, 'triangle');
      this.tone(440, 0.11, 0.12, 0.035, 'sine');
    },

    playTransmit() {
      [440, 554, 659, 880].forEach((f, i) => {
        this.tone(f, i * 0.1, 0.2, 0.08, 'sine');
      });
      this.sweep(800, 200, 0.35, 0.4, 0.05);
    },

    playError() {
      this.tone(180, 0, 0.15, 0.1, 'sawtooth');
      this.tone(140, 0.1, 0.2, 0.08, 'square');
    },

    playScrollTick() {
      this.tone(1200, 0, 0.03, 0.025, 'sine');
    },

    startAmbient() {
      if (!this.ctx || this.ambientNodes.length) return;
      const t = this.ctx.currentTime;

      const ambientGain = this.ctx.createGain();
      ambientGain.gain.setValueAtTime(0.001, t);
      ambientGain.gain.linearRampToValueAtTime(0.04, t + 2);
      ambientGain.connect(this.master);

      [55, 82.5, 110].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        const oscGain = this.ctx.createGain();
        oscGain.gain.value = 0.3 / (i + 1);
        osc.connect(oscGain);
        oscGain.connect(ambientGain);
        osc.start();
        this.ambientNodes.push(osc, oscGain);
      });

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 8;
      lfo.connect(lfoGain);
      lfoGain.connect(this.ambientNodes[0].frequency);
      lfo.start();
      this.ambientNodes.push(lfo, lfoGain, ambientGain);

      const noise = this.createNoise(0.015);
      noise.connect(ambientGain);
      this.ambientNodes.push(noise);
    },

    createNoise(vol) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.value = vol;

      source.connect(filter);
      filter.connect(gain);
      source.start();
      this.ambientNodes.push(source, filter, gain);
      return gain;
    },

    stopAmbient() {
      this.ambientNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch (_) { /* already stopped */ }
      });
      this.ambientNodes = [];
    }
  };

  const audioToggle = document.getElementById('audio-toggle');
  const audioToast = document.getElementById('audio-toast');
  let audioUnlocked = false;
  let audioUnlockBound = false;

  function showAudioToast() {
    if (!audioToast) return;
    audioToast.classList.add('show');
    setTimeout(() => audioToast.classList.remove('show'), 3000);
  }

  async function ensureAudioRunning() {
    if (!SciFiAudio.enabled) return false;
    SciFiAudio.init();
    const running = await SciFiAudio.resume();
    if (!running) return false;

    if (!SciFiAudio.bootPlayed) {
      SciFiAudio.playBoot();
      SciFiAudio.bootPlayed = true;
    }
    SciFiAudio.startAmbient();
    return true;
  }

  function bindAudioUnlockUntilReady() {
    if (audioUnlockBound) return;
    audioUnlockBound = true;

    const tryUnlock = () => {
      if (!SciFiAudio.enabled) return;
      ensureAudioRunning().then((ready) => {
        if (ready && !audioUnlocked) {
          audioUnlocked = true;
        }
      });
    };

    ['pointerdown', 'click', 'touchstart', 'keydown', 'scroll'].forEach((evt) => {
      document.addEventListener(evt, tryUnlock, { passive: true });
      window.addEventListener(evt, tryUnlock, { passive: true });
    });
  }

  async function enableAudio(showToast = false) {
    SciFiAudio.enabled = true;
    if (audioToggle) audioToggle.setAttribute('aria-pressed', 'true');
    bindAudioUnlockUntilReady();
    const ready = await ensureAudioRunning();
    if (ready && !audioUnlocked) {
      audioUnlocked = true;
      if (showToast) showAudioToast();
    }
    return ready;
  }

  /* Audio armed on load — unlocked when user enters the arena */
  SciFiAudio.enabled = true;
  if (audioToggle) audioToggle.setAttribute('aria-pressed', 'true');
  bindAudioUnlockUntilReady();
  onEnterArena = enableAudio;

  if (audioToggle) {
    audioToggle.addEventListener('click', async () => {
      const next = audioToggle.getAttribute('aria-pressed') !== 'true';
      audioToggle.setAttribute('aria-pressed', String(next));
      if (next) {
        await enableAudio(true);
      } else {
        SciFiAudio.setEnabled(false);
      }
    });
  }

  function getClickVariant(target) {
    if (!target || target === document.documentElement) return 'default';
    const el = target.closest(
      'a, button, .btn, input, textarea, select, label, .service-card, .project-card, .social-link, .logo, .nav-link, .back-to-top, .nav-toggle, .theme-toggle, .audio-toggle, .portrait-frame, .stat-block, .tech-tag, .rank-badge'
    );
    if (!el) return 'default';
    if (el.matches('button, .btn, input[type="submit"], .nav-toggle, .audio-toggle, .theme-toggle, .back-to-top')) {
      return 'button';
    }
    if (el.matches('a, .nav-link, .social-link')) return 'link';
    if (el.matches('.service-card, .project-card, .portrait-frame, .stat-block')) return 'card';
    return 'default';
  }

  let lastTouchSound = 0;

  function playGlobalClick(e) {
    if (!SciFiAudio.enabled) return;
    if (portraitClickHandled) return;
    if (e.target.closest('#portrait-tilt')) return;
    ensureAudioRunning().then((ready) => {
      if (ready) SciFiAudio.playClick(getClickVariant(e.target));
    });
  }

  document.addEventListener('touchstart', (e) => {
    if (!SciFiAudio.enabled) return;
    lastTouchSound = Date.now();
    ensureAudioRunning().then((ready) => {
      if (ready) SciFiAudio.playClick(getClickVariant(e.target));
    });
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (Date.now() - lastTouchSound < 450) return;
    playGlobalClick(e);
  }, true);

  function bindSound(selector, handler) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (!SciFiAudio.enabled) return;
        ensureAudioRunning().then((ready) => {
          if (ready) handler();
        });
      });
    });
  }

  bindSound('.nav-link, .btn, .service-card, .project-card, .social-link, .logo', () => SciFiAudio.playHover());

  const revealCards = document.querySelectorAll('.service-card, .project-card');

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          if (SciFiAudio.enabled) {
            ensureAudioRunning().then((ready) => {
              if (ready) SciFiAudio.playSkillReveal();
            });
          }
        }, i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealCards.forEach(card => revealObserver.observe(card));

  document.querySelectorAll('.section-header, .about-panel, .tech-stack, .contact-form, .contact-panel').forEach(el => {
    el.classList.add('reveal-up');
  });

  const sectionReveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal-up').forEach(el => sectionReveal.observe(el));

  /* --- Theme Toggle (Dark / Light Mode) --- */
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';

  root.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  /* --- Counter Animation --- */
  document.querySelectorAll('[data-count]').forEach(statEl => {
    const target = parseInt(statEl.dataset.count, 10);
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let current = 0;
          const step = Math.max(1, Math.ceil(target / 40));
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            statEl.textContent = current;
          }, 40);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterObserver.observe(statEl);
  });

  /* --- Contact Form Validation --- */
  const form = document.getElementById('contact-form');
  if (form) {
    const fields = {
      name: {
        el: document.getElementById('name'),
        error: document.getElementById('name-error'),
        validate: v => v.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'
      },
      email: {
        el: document.getElementById('email'),
        error: document.getElementById('email-error'),
        validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.'
      },
      message: {
        el: document.getElementById('message'),
        error: document.getElementById('message-error'),
        validate: v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.'
      }
    };

    function validateField(key) {
      const field = fields[key];
      const msg = field.validate(field.el.value);
      field.error.textContent = msg;
      field.el.classList.toggle('error', !!msg);
      return !msg;
    }

    Object.keys(fields).forEach(key => {
      fields[key].el.addEventListener('blur', () => validateField(key));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const valid = Object.keys(fields).every(validateField);
      const success = document.getElementById('form-success');

      if (valid) {
        if (SciFiAudio.enabled) SciFiAudio.playTransmit();
        success.hidden = false;
        form.reset();
        Object.values(fields).forEach(f => f.el.classList.remove('error'));
        showTransmissionSuccess();
        setTimeout(() => { success.hidden = true; }, 5000);
      } else if (SciFiAudio.enabled) {
        SciFiAudio.playError();
      }
    });
  }

  /* --- Header shrink on scroll --- */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 50
        ? '0 4px 30px rgba(0, 240, 255, 0.1)'
        : 'none';
    });
  }

  /* --- Mission HUD + Achievements + Confetti --- */
  const achievementStack = document.getElementById('achievement-stack');
  const hudProgress = document.getElementById('hud-progress');
  const hudXpFill = document.getElementById('hud-xp-fill');
  const hudXpBar = document.getElementById('hud-xp-bar');
  const hudSession = document.getElementById('hud-session');
  const hudRank = document.getElementById('hud-rank');
  const hudAchievements = document.getElementById('hud-achievements');
  const transmissionOverlay = document.getElementById('transmission-overlay');
  const confettiCanvas = document.getElementById('confetti-canvas');

  const ACHIEVEMENTS = [
    { id: 'hero', selector: '#home', icon: '⚡', title: 'PLAYER LOADED', desc: 'Entered the arena' },
    { id: 'about', selector: '#about', icon: '◆', title: 'PROFILE DECRYPTED', desc: 'Champion dossier accessed' },
    { id: 'services', selector: '#services', icon: '⚔', title: 'ARSENAL INSPECTED', desc: 'Combat tools analyzed' },
    { id: 'projects', selector: '#projects', icon: '🎯', title: 'MISSIONS BRIEFED', desc: 'Deployed ops reviewed' },
    { id: 'contact', selector: '#contact', icon: '📡', title: 'COMMS ONLINE', desc: 'Challenge channel opened' },
    { id: 'scroll100', type: 'scroll', icon: '🏆', title: 'ARENA CLEARED', desc: '100% mission progress reached' },
    { id: 'transmission', type: 'form', icon: '✓', title: 'TRANSMISSION SENT', desc: 'Message launched to orbit' }
  ];

  const unlocked = new Set();
  const sessionStart = Date.now();
  const rankTiers = ['S', 'S+', 'S++', 'LEGEND', 'MYTHIC'];

  const SECTION_ORDER = ['hero', 'about', 'services', 'projects', 'contact'];
  const toastById = new Map();
  const toastStackOrder = [];
  let lastScrollY = window.scrollY;
  let scrollAchievementsReady = false;
  const SCROLL_ACTIVATE = 48;
  const SCROLL_HERO_ENTER = 36;
  const SCROLL_HERO_LEAVE = 58;

  const ACHIEVEMENT_SOUNDS = {
    hero: 'neutral',
    about: 'thinking',
    services: 'confident',
    projects: 'serious',
    contact: 'look-right'
  };

  function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
  }

  async function playAchievementSound(achievement) {
    if (!SciFiAudio.enabled) return;
    const ready = await ensureAudioRunning();
    if (!ready) return;
    if (achievement.type === 'scroll') {
      SciFiAudio.playAchievement();
      return;
    }
    if (achievement.type === 'form') {
      SciFiAudio.playTransmit();
      return;
    }
    const reactionId = ACHIEVEMENT_SOUNDS[achievement.id];
    if (reactionId) {
      SciFiAudio.playPortraitReaction(reactionId);
      SciFiAudio.playSectionUnlock();
    } else {
      SciFiAudio.playAchievement();
    }
  }

  async function playDismissSound() {
    if (!SciFiAudio.enabled) return;
    const ready = await ensureAudioRunning();
    if (!ready) return;
    SciFiAudio.playToastDismiss();
  }

  function markUnlocked(id) {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    updateAchievementCount();
  }

  function updateHudRank() {
    if (!hudRank) return;
    const count = unlocked.size;
    const tier = Math.min(Math.floor(count / 2), rankTiers.length - 1);
    hudRank.textContent = rankTiers[tier];
  }

  function updateAchievementCount() {
    if (hudAchievements) {
      hudAchievements.textContent = `${unlocked.size}/${ACHIEVEMENTS.length}`;
    }
    updateHudRank();
  }

  function buildToastElement(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.dataset.achievementId = achievement.id;
    toast.innerHTML = `
      <span class="achievement-icon">${achievement.icon}</span>
      <div class="achievement-body">
        <p class="achievement-tag">ACHIEVEMENT UNLOCKED</p>
        <p class="achievement-title">${achievement.title}</p>
        <p class="achievement-desc">${achievement.desc}</p>
      </div>
    `;
    return toast;
  }

  function pushToast(achievement, withSound = true) {
    if (!achievementStack) return;

    const existing = toastById.get(achievement.id);
    if (existing && !existing.classList.contains('leaving')) return;

    markUnlocked(achievement.id);

    const toast = buildToastElement(achievement);
    achievementStack.appendChild(toast);
    toastById.set(achievement.id, toast);
    toastStackOrder.push(achievement.id);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    if (withSound) playAchievementSound(achievement);
  }

  function popToast(withSound = true) {
    if (toastStackOrder.length === 0) return;
    const id = toastStackOrder.pop();
    const toast = toastById.get(id);
    if (!toast) return;

    toastById.delete(id);
    toast.classList.remove('is-visible');
    toast.classList.add('leaving');

    if (withSound) playDismissSound();

    setTimeout(() => toast.remove(), 450);
  }

  function getTargetStackIds(scrollDir) {
    const ids = [];
    const y = window.scrollY;

    if (y < SCROLL_ACTIVATE) {
      return ids;
    }

    const heroThreshold = scrollDir === 'up' ? SCROLL_HERO_LEAVE : SCROLL_HERO_ENTER;
    if (y > heroThreshold) {
      ids.push('hero');
    }

    const enterAt = window.innerHeight * (scrollDir === 'up' ? 0.76 : 0.64);

    for (const id of SECTION_ORDER.slice(1)) {
      const achievement = getAchievementById(id);
      const section = achievement && document.querySelector(achievement.selector);
      if (!section) break;
      if (section.getBoundingClientRect().top <= enterAt) {
        ids.push(id);
      } else {
        break;
      }
    }

    if (getScrollProgress() >= 98 && ids.length === SECTION_ORDER.length) {
      ids.push('scroll100');
    }

    return ids;
  }

  function syncScrollAchievements() {
    if (!scrollAchievementsReady || !achievementStack) return;

    const y = window.scrollY;
    const scrollDir = y > lastScrollY + 2 ? 'down' : y < lastScrollY - 2 ? 'up' : 'none';
    lastScrollY = y;

    const targetIds = getTargetStackIds(scrollDir === 'none' ? 'down' : scrollDir);

    while (toastStackOrder.length > targetIds.length) {
      popToast(true);
    }

    while (
      toastStackOrder.length > 0 &&
      toastStackOrder[toastStackOrder.length - 1] !== targetIds[toastStackOrder.length - 1]
    ) {
      popToast(true);
    }

    for (let i = 0; i < targetIds.length; i++) {
      const id = targetIds[i];
      if (i >= toastStackOrder.length) {
        const achievement = getAchievementById(id);
        if (achievement) pushToast(achievement, true);
      }
    }
  }

  function showOneTimeAchievement(achievement) {
    if (unlocked.has(achievement.id)) return;
    markUnlocked(achievement.id);
    if (!achievementStack) return;

    const toast = buildToastElement(achievement);
    achievementStack.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    playAchievementSound(achievement);

    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 450);
    }, 6000);
  }

  function startScrollAchievements() {
    scrollAchievementsReady = true;
  }
  startScrollAchievementsFn = startScrollAchievements;

  if (!introSplash) {
    setTimeout(startScrollAchievements, 400);
  }

  function updateMissionHud() {
    const progress = getScrollProgress();
    if (hudProgress) hudProgress.textContent = `${progress}%`;
    if (hudXpFill) hudXpFill.style.width = `${progress}%`;
    if (hudXpBar) hudXpBar.setAttribute('aria-valuenow', String(progress));
    syncScrollAchievements();
  }

  function updateSessionTimer() {
    if (!hudSession) return;
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    hudSession.textContent = `${mins}:${secs}`;
  }

  window.addEventListener('scroll', () => {
    ensureAudioRunning();
    updateMissionHud();
  }, { passive: true });

  updateMissionHud();
  updateAchievementCount();
  setInterval(updateSessionTimer, 1000);
  updateSessionTimer();

  /* Confetti burst */
  const Confetti = {
    ctx: null,
    particles: [],
    animating: false,

    init() {
      if (!confettiCanvas) return;
      this.ctx = confettiCanvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!confettiCanvas) return;
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    },

    burst(x, y, count = 120) {
      if (!this.ctx) this.init();
      if (!this.ctx) return;

      const colors = ['#00f0ff', '#ff00aa', '#7b2fff', '#ffd700', '#e8f4ff'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.particles.push({
          x: x ?? window.innerWidth / 2,
          y: y ?? window.innerHeight / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          spin: (Math.random() - 0.5) * 12,
          life: 1,
          decay: Math.random() * 0.012 + 0.008,
          shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
      }

      if (!this.animating) {
        this.animating = true;
        this.animate();
      }
    },

    animate() {
      if (!this.ctx || !confettiCanvas) return;
      this.ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      this.particles = this.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.vx *= 0.99;
        p.rotation += p.spin;
        p.life -= p.decay;

        if (p.life <= 0) return false;

        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
        return true;
      });

      if (this.particles.length) {
        requestAnimationFrame(() => this.animate());
      } else {
        this.animating = false;
        this.ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }
  };

  Confetti.init();

  function showTransmissionSuccess() {
    const formAch = ACHIEVEMENTS.find(a => a.type === 'form');
    if (formAch) showOneTimeAchievement(formAch);

    if (typeof setPortraitReaction === 'function') {
      setPortraitReaction('thumbs-up', { lockMs: 5000 });
    }

    Confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 160);
    setTimeout(() => Confetti.burst(window.innerWidth * 0.3, window.innerHeight * 0.5, 80), 150);
    setTimeout(() => Confetti.burst(window.innerWidth * 0.7, window.innerHeight * 0.5, 80), 300);

    if (transmissionOverlay) {
      transmissionOverlay.hidden = false;
      transmissionOverlay.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        transmissionOverlay.hidden = true;
        transmissionOverlay.setAttribute('aria-hidden', 'true');
      }, 2400);
    }
  }
})();
