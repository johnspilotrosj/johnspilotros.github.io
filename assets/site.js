/* Dry Creek Services — interactions.
   anime.js (window.anime): hero timeline, text scrambles, counters, SVG drawing, loops.
   Motion (window.Motion): scroll-linked progress, in-view reveals, hover/press springs, marquee, FAQ. */
(function () {
  'use strict';
  var A = window.anime;
  var M = window.Motion;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = !!(A && M) && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var EASE = [0.22, 1, 0.36, 1];
  var GLYPHS = '/\\|-_<>[]{}#*+~=:.';
  var rnd = function (n) { return Math.floor(Math.random() * n); };

  /* ------------------------------------------------ always-on behaviour */
  var head = $('.site-head');
  var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.textContent = open ? '[x]' : '[=]';
    if (open && canAnimate) {
      M.animate($$('a', menu), { opacity: [0, 1], x: [24, 0] }, { duration: 0.45, delay: M.stagger(0.05), ease: EASE });
    }
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* scramble helper: morph an element's text from random glyphs into `to` */
  function scramble(el, to, ms) {
    if (!canAnimate) { el.textContent = to; return; }
    var seeds = to.split('').map(function () { return Math.random(); });
    var state = { p: 0 };
    A.animate(state, {
      p: 1, duration: ms || 500, ease: 'outQuad',
      onUpdate: function () {
        var out = '';
        for (var i = 0; i < to.length; i++) {
          var ch = to[i];
          out += (ch === '\n' || ch === ' ' || state.p >= seeds[i]) ? ch : GLYPHS[rnd(GLYPHS.length)];
        }
        el.textContent = out;
      },
      onComplete: function () { el.textContent = to; }
    });
  }

  /* ------------------------------------------------ hero terminal */
  var term = $('#term');
  if (term) {
    var artEl = $('#term-art');
    var lineEl = $('#term-line');
    var creek = $('#term-creek');
    var tabs = $$('.term-tabs button', term);
    var arts = {};
    $$('.card [data-art]').forEach(function (p) { arts[p.getAttribute('data-art')] = p.textContent; });
    var current = 0;
    var auto = true;
    var visible = true;

    var select = function (i, user) {
      if (user) auto = false;
      current = i;
      tabs.forEach(function (t, n) { t.setAttribute('aria-selected', String(n === i)); });
      var key = tabs[i].getAttribute('data-art');
      if (arts[key]) scramble(artEl, arts[key], 700);
      scramble(lineEl, '> ' + tabs[i].getAttribute('data-line'), 500);
    };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { select(i, true); }); });

    if (!reduce) {
      /* the creek: three rows of flowing ASCII water */
      var t0 = 0;
      var water = [' ', ' ', '.', '~', '~', '=', '~'];
      var drawCreek = function () {
        if (!visible || document.hidden) return;
        var cols = 54, rows = 3, out = '';
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var v = Math.sin(c * 0.33 + t0 + r * 1.3) + Math.sin(c * 0.12 - t0 * 0.6 + r);
            out += water[Math.max(0, Math.min(water.length - 1, Math.round((v + 2) / 4 * (water.length - 1))))];
          }
          if (r < rows - 1) out += '\n';
        }
        creek.textContent = out;
        t0 += 0.22;
      };
      setInterval(drawCreek, 110);
      setInterval(function () { if (auto && visible && !document.hidden) select((current + 1) % tabs.length, false); }, 4800);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(term);
      }
    }
  }

  /* ------------------------------------------------ quote form */
  var form = $('#quote-form');
  if (form) {
    var ENDPOINTS = ['https://formspree.io/f/mrejgagq', 'https://formspree.io/f/mbdwrdqq'];
    var status = $('#form-status');
    var submit = $('#quote-submit');
    var label = submit.innerHTML;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name=_gotcha]').value) return;
      submit.disabled = true;
      submit.textContent = 'Sending...';
      status.className = 'form-status';
      status.textContent = '';
      var build = function () {
        var d = new FormData(form);
        d.append('_replyto', form.querySelector('[name=email]').value);
        return d;
      };
      Promise.all(ENDPOINTS.map(function (u) {
        return fetch(u, { method: 'POST', body: build(), headers: { Accept: 'application/json' } })
          .then(function (r) { return r.ok; }).catch(function () { return false; });
      })).then(function (res) {
        submit.disabled = false;
        submit.innerHTML = label;
        if (res.some(Boolean)) {
          form.reset();
          status.className = 'form-status ok';
          scramble(status, "[ok] request sent -- we'll be in touch today", 700);
          if (canAnimate) M.animate(form, { scale: [1, 1.015, 1] }, { duration: 0.5, ease: EASE });
        } else {
          status.className = 'form-status err';
          status.textContent = '[!] could not send -- please call (208) 985-5394';
        }
      });
    });
  }

  /* ------------------------------------------------ FAQ accordion */
  $$('.faq details').forEach(function (d) {
    var sum = $('summary', d);
    var ans = $('.ans', d);
    sum.addEventListener('click', function (e) {
      if (!canAnimate) return;
      e.preventDefault();
      if (d.open) {
        M.animate(ans, { height: [ans.offsetHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 0.3, ease: EASE })
          .finished.then(function () { d.open = false; ans.style.height = ''; ans.style.opacity = ''; });
      } else {
        d.open = true;
        var h = ans.scrollHeight;
        M.animate(ans, { height: ['0px', h + 'px'], opacity: [0, 1] }, { duration: 0.45, ease: EASE })
          .finished.then(function () { ans.style.height = ''; });
      }
    });
  });

  window.__dcReady = true;
  if (!canAnimate) { root.classList.remove('js'); return; }

  /* ================================================ animation layer */

  /* Motion: scroll progress bar */
  M.scroll(M.animate('.progress', { scaleX: [0, 1] }, { ease: 'linear' }));

  /* anime.js: hero intro timeline */
  var title = $('#hero-title');
  if (title) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'svg') {
          split(n);
        }
      });
    })(title);
    var words = $$('.w', title);
    words.forEach(function (w) { w.style.opacity = 0; });
    title.style.opacity = 1;
    var heroBits = $$('[data-hero]');
    var tl = A.createTimeline({ defaults: { ease: 'outExpo' } });
    tl.add(words, { opacity: [0, 1], y: ['0.6em', 0], rotate: [4, 0], duration: 900, delay: A.stagger(55) }, 0);
    if (heroBits.length) tl.add(heroBits, { opacity: [0, 1], y: [22, 0], duration: 800, delay: A.stagger(90) }, 250);
    var squiggle = $('#squiggle');
    if (squiggle) {
      var drawable = A.svg.createDrawable(squiggle);
      tl.add(drawable, { draw: ['0 0', '0 1'], duration: 900, ease: 'inOutQuad' }, 700);
    }
    if (term) {
      term.style.opacity = 0;
      M.animate(term, { opacity: [0, 1], y: [40, 0], rotate: [2, 0] }, { type: 'spring', stiffness: 90, damping: 14, delay: 0.25 });
    }
  }

  /* anime.js: floating hero blobs */
  $$('.blob').forEach(function (b, i) {
    A.animate(b, { y: [0, i ? -26 : 30], x: [0, i ? 14 : -18], scale: [1, 1.12], duration: 4200 + i * 900, ease: 'inOutSine', loop: true, alternate: true });
  });

  /* Motion: in-view reveals */
  $$('[data-reveal]').forEach(function (el) {
    M.inView(el, function () {
      M.animate(el, { opacity: [0, 1], y: [30, 0] }, { duration: 0.75, ease: EASE });
    }, { amount: 0.18 });
  });
  $$('[data-stagger]').forEach(function (group) {
    var kids = $$(':scope > *', group).filter(function (k) { return k.tagName.toLowerCase() !== 'svg'; });
    var line = $('.steps-line', group);
    M.inView(group, function () {
      M.animate(kids, { opacity: [0, 1], y: [34, 0], scale: [0.96, 1] }, { duration: 0.7, delay: M.stagger(0.09), ease: EASE });
      if (line) {
        line.style.opacity = 1;
        M.animate(line, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 1.4, delay: 0.2, ease: 'easeInOut' });
        A.animate($$('.step-n', group), { rotate: [-12, 0], scale: [0.6, 1], duration: 900, delay: A.stagger(140, { start: 150 }), ease: 'outElastic(1, .6)' });
      }
    }, { amount: 0.15 });
  });

  /* anime.js: count-up numbers */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    M.inView(el, function () {
      var o = { v: 0 };
      A.animate(o, {
        v: target, duration: 1600, ease: 'outExpo',
        onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('en-US'); },
        onComplete: function () { el.textContent = target.toLocaleString('en-US'); }
      });
    }, { amount: 0.6 });
  });

  /* anime.js: review stars pop in */
  $$('.stars').forEach(function (s) {
    var stars = $$('span', s);
    M.inView(s, function () {
      A.animate(stars, { scale: [0, 1], rotate: [-90, 0], duration: 700, delay: A.stagger(80), ease: 'outBack' });
    }, { amount: 0.8 });
  });

  /* anime.js: ASCII art types itself in when a card or panel scrolls into view */
  $$('.card .ascii, .panel .ascii, .why-item .ico, .foot-ascii, .map pre').forEach(function (pre) {
    if (pre.children.length) {
      M.inView(pre, function () { M.animate(pre, { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.9, ease: EASE }); }, { amount: 0.3 });
      return;
    }
    var text = pre.textContent;
    M.inView(pre, function () { scramble(pre, text, 900); }, { amount: 0.4 });
  });

  /* anime.js: ASCII link scramble on hover */
  $$('.ax').forEach(function (a) {
    if (a.children.length) return;
    var text = a.textContent;
    var busy = false;
    a.addEventListener('mouseenter', function () {
      if (busy) return;
      busy = true;
      a.style.minWidth = a.offsetWidth + 'px';
      scramble(a, text, 380);
      setTimeout(function () { busy = false; }, 400);
    });
  });

  /* Motion: spring hover + press */
  $$('.card, .why-item, .review, .stat, .fact, .towns li').forEach(function (el) {
    M.hover(el, function () {
      M.animate(el, { y: -6 }, { type: 'spring', stiffness: 320, damping: 18 });
      return function () { M.animate(el, { y: 0 }, { type: 'spring', stiffness: 320, damping: 22 }); };
    });
  });
  $$('.btn').forEach(function (el) {
    M.hover(el, function () {
      M.animate(el, { scale: 1.04 }, { type: 'spring', stiffness: 400, damping: 15 });
      return function () { M.animate(el, { scale: 1 }, { type: 'spring', stiffness: 400, damping: 20 }); };
    });
    M.press(el, function () {
      M.animate(el, { scale: 0.96 }, { duration: 0.1 });
      return function () { M.animate(el, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 15 }); };
    });
  });

  /* Motion: marquee */
  var track = $('#marquee');
  if (track) {
    track.innerHTML += track.innerHTML;
    var half = track.scrollWidth / 2;
    M.animate(track, { x: [0, -half] }, { duration: half / 60, repeat: Infinity, ease: 'linear' });
  }

  /* Motion: scroll-linked parallax on decorative ASCII */
  $$('.page-ascii, .cta-ascii').forEach(function (el) {
    var host = el.parentElement;
    M.scroll(M.animate(el, { y: [40, -40] }, { ease: 'linear' }), { target: host, offset: ['start end', 'end start'] });
  });

  /* Motion: logo mark wiggle */
  var mark = $('.logo-mark');
  if (mark) {
    M.hover($('.logo'), function () {
      M.animate(mark, { rotate: [0, -10, 8, 0] }, { duration: 0.5 });
    });
  }
})();
