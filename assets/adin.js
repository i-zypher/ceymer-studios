/* ==========================================================
   ADIN — site companion
   Character is a faithful vanilla-JS port of the app's
   RobotSVG.tsx: exact fin_ geometry, CSS-variable theming,
   the three-layer mag-lev idle (body bounce + head float +
   spring compression), arm sway, expressions, and the
   prep→wave→end greeting sequence.
   Hybrid chat: scripted paths first, AI endpoint fallback.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- config ---------- */
  // Direct Cloud Run endpoint (verified working). CORS is configured on the
  // server for ceymer-studios.com. If the Firebase Hosting rewrite is fixed
  // later, this can go back to the same-origin path '/api/chat'.
  const AI_ENDPOINT = 'https://ceymer-chat-282094196661.us-east1.run.app/chat';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scripted dialogue ---------- */
  const SCRIPT = {
    start: {
      text: "Hi, I'm ADIN! I help people learn technology in Corey's apps — and here, I answer questions about his work. What would you like to know?",
      chips: ['who', 'apps', 'war', 'humcity', 'contact']
    },
    who: {
      label: "Who is Corey?",
      text: "Corey Miller is a self-taught developer and the founder of Ceymer Studios LLC in Jefferson Hills, Pennsylvania. He started building apps on a tablet with AI-assisted tools and now ships cross-platform apps on real infrastructure — Firebase, Cloud Run, Capacitor. He holds the Google UX Design Professional Certificate (I'm the capstone!) and is working through IBM's iOS & Android Developer certificate.",
      chips: ['apps', 'process', 'contact']
    },
    apps: {
      label: "Show me the apps",
      text: "Two are live on both app stores: me — ADIN, a tech tutor for older adults with a safe practice phone — and Scapeboard, a business manager for landscapers. There's also Your Leader, a civic-engagement app, Ceymer Trading, an algorithmic trading lab with an AI decision layer, and Hum City, a cyberpunk audio drama Corey co-creates with John Vogel. Tap any card to read the full story.",
      chips: ['trading', 'war', 'humcity']
    },
    trading: {
      label: "The trading app?",
      text: "Ceymer Trading is Corey's personal engineering lab: an algorithmic trading terminal on Firebase Cloud Functions with the Alpaca API for market access, and Claude Haiku as an AI analyst that must write out its reasoning before anything trades. Hard-coded guardrails sit between the AI and the order button — the AI proposes, the rules dispose. It's private, and it's absolutely not financial advice!",
      chips: ['apps', 'process', 'contact']
    },
    war: {
      label: "iOS war stories",
      text: "Oh, the scars! My iOS port took three App Store rejections — Android references, a broken support URL, and Apple demanding a first-launch AI consent dialog. Scapeboard's was wilder: a missing Main.storyboard caused a black screen that took days to diagnose, plus six-plus rejections and a Firebase auth rebuild for WKWebView. Every one is documented in the case studies — Corey believes shipping stories are part of the craft.",
      chips: ['apps', 'process', 'contact']
    },
    humcity: {
      label: "What's Hum City?",
      text: "Hum City is a serialized cyberpunk audio-drama universe Corey co-creates with his writing partner John Vogel, published on their YouTube channel Synth & Syn. It's also an AI playground — Corey trained a small language model from scratch on the Hum City corpus. Its page is the only dark one on this site. Fitting, right?",
      chips: ['apps', 'who', 'contact']
    },
    process: {
      label: "How does he work?",
      text: "One loop, every project: research → design → test → iterate. He learned it formally in the Google UX cert and applies it to everything — my welcome screen exists because usability testing showed people froze at the old one. Under the hood it's React + Capacitor + Firebase + Cloud Run, shipped by one person.",
      chips: ['war', 'apps', 'contact']
    },
    contact: {
      label: "How do I reach him?",
      text: "Email corey@ceymer-studios.com — he reads everything. If you're hiring for UX, customer success, or AI quality roles, definitely say hi.",
      chips: ['who', 'apps']
    }
  };

  /* ==========================================================
     ADIN SVG — geometry from RobotSVG.tsx (fin_ constants)
     head r=11.86810 @ (25,16.86810) · body 11.86810×23.73620 @ (25,56.5)
     eyes rx=2.967025 ry=5.93405 @ y=11.52752, cx 21.43957 / 28.56043
     pupils r=1.421775 · arms rx=3.95603 ry=15.82413, idle ±15°,
     pivots (13.13190, 38.69777) / (36.86810, 38.69777)
     jet rings rx 5.93405 / 4.45054 / 3.33790 (holes ×0.65/×0.55)
     Colors flow from --adin-body-color CSS vars, same as the app.
     ========================================================== */
  const ADIN_SVG = `
  <svg id="adin-char" viewBox="-2 -12 54 114" style="width:86px;height:182px;overflow:visible" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Adin assistant, expression: default. Click to chat.">
    <style>
      @keyframes bodyIdleBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      @keyframes headMagLev { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      @keyframes springMagLev { 0%, 100% { transform: scaleY(1) translateY(0); } 50% { transform: scaleY(1.3) translateY(2px); } }
      @keyframes armSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
      @keyframes armSwayOpposite { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-5deg); } }
      .robot-main-group { filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.3)); }
      .robot-is-bouncing .robot-main-group { animation: bodyIdleBounce 2s ease-in-out infinite; }
      .robot-is-bouncing .robot-head-group { animation: headMagLev 2s ease-in-out infinite; }
      .robot-is-bouncing .robot-jet-spring { animation: springMagLev 2s ease-in-out infinite; }
      .robot-is-bouncing .robot-left-arm-idle-sway { animation: armSway 2s ease-in-out infinite; }
      .robot-is-bouncing .robot-right-arm-idle-sway { animation: armSwayOpposite 2s ease-in-out infinite; }
    </style>
    <defs>
      <radialGradient id="headGradient" cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
        <stop offset="0%" style="stop-color:var(--adin-gradient-highlight-color)"/>
        <stop offset="50%" style="stop-color:var(--adin-gradient-mid-color)"/>
        <stop offset="100%" style="stop-color:var(--adin-gradient-shadow-color)"/>
      </radialGradient>
      <radialGradient id="bodyGradient" cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
        <stop offset="0%" style="stop-color:var(--adin-gradient-highlight-color)"/>
        <stop offset="50%" style="stop-color:var(--adin-gradient-mid-color)"/>
        <stop offset="100%" style="stop-color:var(--adin-gradient-shadow-color)"/>
      </radialGradient>
      <radialGradient id="armGradient" cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
        <stop offset="0%" style="stop-color:var(--adin-gradient-highlight-color)"/>
        <stop offset="50%" style="stop-color:var(--adin-gradient-mid-color)"/>
        <stop offset="100%" style="stop-color:var(--adin-gradient-shadow-color)"/>
      </radialGradient>
      <radialGradient id="eyeSocketGradient" cx="50%" cy="50%" r="70%" fx="40%" fy="40%">
        <stop offset="0%" style="stop-color:#FFFFFF"/>
        <stop offset="100%" style="stop-color:#F8F8F8"/>
      </radialGradient>
      <linearGradient id="jetRing1Gradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" style="stop-color:#bdc3c7"/><stop offset="100%" style="stop-color:#95a5a6"/>
      </linearGradient>
      <mask id="maskJetRing1">
        <ellipse cx="25" cy="83.0974" rx="5.93405" ry="1.421775" fill="white"/>
        <ellipse cx="25" cy="83.0974" rx="3.85713" ry="0.78198" fill="black"/>
      </mask>
      <mask id="maskJetRing2">
        <ellipse cx="25" cy="87.42446" rx="4.45054" ry="1.421775" fill="white"/>
        <ellipse cx="25" cy="87.42446" rx="2.89285" ry="0.78198" fill="black"/>
      </mask>
      <mask id="maskJetRing3">
        <ellipse cx="25" cy="91.75152" rx="3.33790" ry="1.421775" fill="white"/>
        <ellipse cx="25" cy="91.75152" rx="2.16964" ry="0.78198" fill="black"/>
      </mask>
    </defs>

    <g id="adin-main" class="robot-main-group" style="transition: transform 0.4s ease-out">
      <!-- Body -->
      <ellipse cx="25" cy="56.5" rx="11.8681" ry="23.7362" fill="url(#bodyGradient)"/>

      <!-- Left Arm: sway wrapper > rotation group > ellipse -->
      <g class="robot-left-arm-idle-sway" style="transform-origin: 13.1319px 38.69777px">
        <g id="adin-arm-l-rot" style="transform: rotate(15deg); transform-origin: 13.1319px 38.69777px; transition: transform 0.4s ease-out">
          <ellipse cx="9.17587" cy="54.52191" rx="3.95603" ry="15.82413" fill="url(#armGradient)"/>
        </g>
      </g>

      <!-- Right Arm -->
      <g class="robot-right-arm-idle-sway" style="transform-origin: 36.8681px 38.69777px">
        <g id="adin-arm-r-rot" style="transform: rotate(-15deg); transform-origin: 36.8681px 38.69777px; transition: transform 0.4s ease-in-out">
          <ellipse cx="40.82413" cy="54.52191" rx="3.95603" ry="15.82413" fill="url(#armGradient)"/>
        </g>
      </g>

      <!-- Head -->
      <g id="adin-head" class="robot-head-group" style="transform-origin: 25px 16.8681px; transition: transform 0.4s ease-out">
        <circle cx="25" cy="16.8681" r="11.8681" fill="url(#headGradient)"/>
        <ellipse cx="21.43957" cy="11.52752" rx="2.967025" ry="5.93405" fill="url(#eyeSocketGradient)"/>
        <ellipse cx="28.56043" cy="11.52752" rx="2.967025" ry="5.93405" fill="url(#eyeSocketGradient)"/>
        <circle id="adin-pupil-l" cx="21.43957" cy="11.52752" r="1.421775" fill="var(--adin-pupil-color, #333)"/>
        <circle id="adin-pupil-r" cx="28.56043" cy="11.52752" r="1.421775" fill="var(--adin-pupil-color, #333)"/>
        <path id="adin-mouth" d="M19.65935 23.39547 Q25 25.76906 30.34065 23.39547" stroke="var(--adin-pupil-color, #333)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Mag-Lev Spring -->
      <g class="robot-jet-spring" style="transform-origin: 25px 83.0974px">
        <g stroke="#7f8c8d" fill="url(#jetRing1Gradient)">
          <ellipse cx="25" cy="83.0974" rx="5.93405" ry="1.421775" mask="url(#maskJetRing1)" stroke-width="0.3"/>
          <ellipse cx="25" cy="87.42446" rx="4.45054" ry="1.421775" mask="url(#maskJetRing2)" stroke-width="0.5"/>
          <ellipse cx="25" cy="91.75152" rx="3.33790" ry="1.421775" mask="url(#maskJetRing3)" stroke-width="0.5"/>
        </g>
        <circle cx="25" cy="96.07859" r="1.421775" fill="var(--adin-body-color)"/>
      </g>
    </g>
  </svg>`;

  /* ---------- mount ---------- */
  const dock = document.createElement('div');
  dock.id = 'adin-dock';
  dock.innerHTML = `<div id="adin-bubble" role="status"></div>${ADIN_SVG}`;
  document.body.appendChild(dock);

  const chat = document.createElement('div');
  chat.id = 'adin-chat';
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', 'Chat with ADIN');
  chat.innerHTML = `
    <div class="chat-head">
      <div><div class="t">ADIN</div><div class="s">studio helper · ask me anything</div></div>
      <button class="chat-close" aria-label="Close chat">×</button>
    </div>
    <div id="adin-log"></div>
    <form id="adin-form">
      <input id="adin-input" type="text" placeholder="Ask about Corey's work…" autocomplete="off" />
      <button id="adin-send" type="submit">Send</button>
    </form>`;
  document.body.appendChild(chat);

  const char = document.getElementById('adin-char');
  const bubble = document.getElementById('adin-bubble');
  const log = document.getElementById('adin-log');
  const form = document.getElementById('adin-form');
  const input = document.getElementById('adin-input');
  const mainG = document.getElementById('adin-main');
  const headG = document.getElementById('adin-head');
  const armL = document.getElementById('adin-arm-l-rot');
  const armR = document.getElementById('adin-arm-r-rot');
  const mouth = document.getElementById('adin-mouth');
  const pl = document.getElementById('adin-pupil-l');
  const pr = document.getElementById('adin-pupil-r');

  /* ---------- expression engine (port of the switch in RobotSVG.tsx) ---------- */
  const SMILE = {
    default:  { d: 'M19.65935 23.39547 Q25 25.76906 30.34065 23.39547', fill: 'none' },
    talking:  { d: 'M18.65935,23.39547 Q25,27.76906 31.34065,23.39547 Z', fill: 'var(--adin-pupil-color, #333)' },
    thinking: { d: 'M20.65935 24.39547 Q25 24.76906 29.34065 24.39547', fill: 'none' },
    waving:   { d: 'M18.65935,23.39547 Q25,31.76906 31.34065,23.39547 Z', fill: 'var(--adin-pupil-color, #333)' }
  };
  const ARMS = { default: [15, -15], thinking: [45, -15], talking: [15, -15], waving: [15, -15] };

  let currentExpression = 'default';
  function setExpression(expr) {
    currentExpression = expr;
    const s = SMILE[expr] || SMILE.default;
    mouth.setAttribute('d', s.d);
    mouth.setAttribute('fill', s.fill);
    const [l, r] = ARMS[expr] || ARMS.default;
    armL.style.transform = `rotate(${l}deg)`;
    if (!waving) armR.style.transform = `rotate(${r}deg)`;
    char.setAttribute('aria-label', `Adin assistant, expression: ${expr}. Click to chat.`);
  }

  /* idle bounce: only while in a bouncing expression, never while waving */
  function updateBounce() {
    const bouncing = !reduceMotion && !waving &&
      ['default', 'thinking', 'talking'].includes(currentExpression);
    char.classList.toggle('robot-is-bouncing', bouncing);
  }

  /* ---------- wave sequence (prep → 6 oscillations → end) ---------- */
  let waving = false;
  function wave(done) {
    if (reduceMotion || waving) { if (done) done(); return; }
    waving = true;
    updateBounce();
    setExpression('waving');
    /* prep: arm up, head tilt, body lift */
    armR.style.transition = 'transform 0.4s ease-in-out';
    armR.style.transform = 'rotate(-135deg)';
    headG.style.transform = 'rotate(8deg)';
    mainG.style.transform = 'translateY(-5px)';
    let count = 0;
    setTimeout(function oscillate() {
      if (count < 6) {
        armR.style.transition = 'transform 0.2s ease-in-out';
        armR.style.transform = `rotate(${-135 + (count % 2 === 0 ? 15 : -15)}deg)`;
        count++;
        setTimeout(oscillate, 200);
      } else {
        /* end */
        setTimeout(() => {
          armR.style.transition = 'transform 0.4s ease-in-out';
          armR.style.transform = 'rotate(-15deg)';
          headG.style.transform = '';
          mainG.style.transform = '';
          waving = false;
          setExpression('default');
          updateBounce();
          if (done) done();
        }, 500);
      }
    }, 400);
  }

  /* ---------- pupils follow cursor (clamps from RobotSVG.tsx) ---------- */
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    const MAX_X = 2.967025 - 1.421775 - 0.2;  /* 1.34525 */
    const MAX_Y = 5.93405 - 1.421775 - 0.2;   /* 4.31228 */
    let raf = null;
    window.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = char.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.12;
        /* normalize to -1..1 like the app's eyeTarget, then clamp */
        const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / 300));
        const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / 300));
        pl.setAttribute('cx', 21.43957 + nx * MAX_X); pl.setAttribute('cy', 11.52752 + ny * MAX_Y);
        pr.setAttribute('cx', 28.56043 + nx * MAX_X); pr.setAttribute('cy', 11.52752 + ny * MAX_Y);
      });
    }, { passive: true });
  }

  /* ---------- speech bubble ---------- */
  let bubbleTimer = null, talkTimer = null;
  function say(text, ms = 5200) {
    bubble.textContent = text;
    bubble.classList.add('show');
    if (!waving) setExpression('talking');
    clearTimeout(bubbleTimer); clearTimeout(talkTimer);
    talkTimer = setTimeout(() => { if (!waving) setExpression('default'); }, 1400);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  window.adinSay = say; // pages can call this
  window.adinWave = wave;

  updateBounce();

  /* greet once per session — with the real wave */
  if (!sessionStorage.getItem('adin-greeted')) {
    sessionStorage.setItem('adin-greeted', '1');
    setTimeout(() => {
      wave();
      say("Hi! I'm ADIN. Click me if you have questions — I know everything about this studio.", 6500);
    }, 1200);
  }

  /* ---------- scroll commentary via [data-adin] ---------- */
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting && !seen.has(en.target)) {
        seen.add(en.target);
        if (!chat.classList.contains('open')) say(en.target.dataset.adin);
      }
    });
  }, { threshold: 0.45 });
  document.querySelectorAll('[data-adin]').forEach(el => io.observe(el));

  /* ---------- scroll reveal ---------- */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => rio.observe(el));

  /* ---------- click: chat · triple-click: wave ---------- */
  let clicks = 0, clickTimer = null;
  char.addEventListener('click', () => {
    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (clicks >= 3) {
        wave();
        say('Hi hi hi! Okay — did you want to chat?');
      } else {
        openChat();
      }
      clicks = 0;
    }, 280);
  });

  /* ---------- chat ---------- */
  const history = []; // {role, content} for the AI endpoint

  function addMsg(text, who) {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    if (who === 'adin') renderMarkdown(m, text); else m.textContent = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  /* Minimal markdown → DOM. Builds real nodes instead of setting innerHTML,
     so model output can never inject markup. Handles **bold**, *italic*,
     `code`, and paragraph breaks — everything else stays literal text. */
  function renderMarkdown(el, text) {
    const blocks = String(text).trim().split(/\n\s*\n/);
    blocks.forEach((block, i) => {
      if (i > 0) el.appendChild(document.createElement('br'));
      const line = block.replace(/\n/g, ' ');
      const re = /(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+\*|`[^`]+`)/g;
      let last = 0, match;
      while ((match = re.exec(line)) !== null) {
        if (match.index > last) el.appendChild(document.createTextNode(line.slice(last, match.index)));
        const tok = match[0];
        let node;
        if (tok.startsWith('**')) { node = document.createElement('strong'); node.textContent = tok.slice(2, -2); }
        else if (tok.startsWith('`')) { node = document.createElement('code'); node.textContent = tok.slice(1, -1); }
        else { node = document.createElement('em'); node.textContent = tok.slice(1, -1); }
        el.appendChild(node);
        last = match.index + tok.length;
      }
      if (last < line.length) el.appendChild(document.createTextNode(line.slice(last)));
    });
  }
  function addChips(keys) {
    const row = document.createElement('div');
    row.className = 'chip-row';
    keys.forEach(k => {
      const s = SCRIPT[k];
      if (!s) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-chip';
      b.textContent = s.label;
      b.addEventListener('click', () => {
        addMsg(s.label, 'me');
        history.push({ role: 'user', content: s.label });
        setTimeout(() => {
          addMsg(s.text, 'adin');
          history.push({ role: 'assistant', content: s.text });
          addChips(s.chips);
        }, 350);
      });
      row.appendChild(b);
    });
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  let chatStarted = false;
  function openChat() {
    bubble.classList.remove('show');
    chat.classList.add('open');
    dock.style.display = 'none';
    if (!chatStarted) {
      chatStarted = true;
      addMsg(SCRIPT.start.text, 'adin');
      addChips(SCRIPT.start.chips);
    }
    input.focus();
  }
  function closeChat() {
    chat.classList.remove('open');
    dock.style.display = '';
  }
  chat.querySelector('.chat-close').addEventListener('click', closeChat);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });

  /* free text → AI endpoint with graceful fallback */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    addMsg(q, 'me');
    history.push({ role: 'user', content: q });
    setExpression('thinking');
    const thinking = addMsg('thinking…', 'adin');
    thinking.classList.add('thinking');
    try {
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: history.slice(-12) })
      });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      thinking.remove();
      setExpression('default');
      const reply = (data.reply || '').trim() || "Hmm, I lost my train of thought. Try one of these?";
      addMsg(reply, 'adin');
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      thinking.remove();
      setExpression('default');
      addMsg("My smart-brain is napping right now (the AI service isn't reachable) — but my regular brain knows plenty! Pick a topic:", 'adin');
      addChips(SCRIPT.start.chips);
    }
  });
})();
