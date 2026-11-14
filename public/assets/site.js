/* ==========================================================
   Site behaviour: optional interface sound + the Ask ADIN box.
   Sound is off until the visitor turns it on.
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'ceymer-sound';
  var on = false;
  var ctx = null;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, at, dur, vol) {
    if (!on || !ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime + at;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  var toggles = document.querySelectorAll('.sound-toggle');
  function paint() {
    toggles.forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = b.querySelector('span');
      if (label) label.textContent = on ? 'Sound on' : 'Sound off';
    });
  }
  paint();

  toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      on = !on;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      paint();
      if (on && ensureCtx()) {
        var chime = function () { tone(523, 0, 0.16, 0.06); tone(784, 0.11, 0.24, 0.06); };
        if (ctx.state === 'suspended') ctx.resume().then(chime); else chime();
      }
    });
  });

  /* A browser only lets sound start after a click or key press, so a saved
     "on" setting wakes up on the visitor's first one. */
  function wake() {
    if (on && ensureCtx() && ctx.state === 'suspended') ctx.resume();
  }
  document.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', wake);

  document.querySelectorAll('[data-tick]').forEach(function (el) {
    el.addEventListener('mouseenter', function () { tone(880, 0, 0.07, 0.03); });
  });

  /* Ask ADIN box: hands the question to the chat in adin.js */
  var ask = document.getElementById('ask-form');
  if (ask) {
    ask.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('ask-input');
      var q = input ? input.value : '';
      if (input) input.value = '';
      tone(660, 0, 0.1, 0.04);
      if (window.adinAsk) window.adinAsk(q);
    });
  }
})();
