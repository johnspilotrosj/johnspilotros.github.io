/* ============================================================
   John Spilotros · Real Estate — interactions
   - Progressive cached navigation (pages cached & kept open)
   - Scroll-aware header + mobile nav
   - Neighborhood explorer, mortgage estimator, CMA/contact forms
   No build step, no dependencies. Degrades gracefully on file://.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGES = ['index.html', 'listings.html', 'about.html', 'buyers-sellers.html', 'contact.html'];

  /* Lead delivery config.
     - Default (LEAD_ENDPOINT empty): leads are delivered through the visitor's own
       email client (a pre-filled mailto to LEAD_EMAIL). Works today, no account.
     - Upgrade to silent background delivery: create a free form at
       https://formspree.io and paste its endpoint below, e.g.
       'https://formspree.io/f/xxxxxxxx'. (Netlify Forms also works if hosted there.) */
  var LEAD_ENDPOINT = '';
  var LEAD_EMAIL = 'johnspilotros@kw.com';

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fileOf(url) {
    try {
      var p = new URL(url, location.href).pathname;
      var f = p.substring(p.lastIndexOf('/') + 1);
      return f === '' ? 'index.html' : f;
    } catch (e) { return 'index.html'; }
  }
  function fmtMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  /* ---------------------------------------------------------
     Header scroll state
  --------------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     Mobile nav
  --------------------------------------------------------- */
  function initMobileNav() {
    var toggle = $('.nav-toggle');
    if (!toggle || toggle.dataset.inited) return;
    toggle.dataset.inited = '1';
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $all('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------
     Active-nav sync
  --------------------------------------------------------- */
  function syncActiveNav(file) {
    $all('[data-route]').forEach(function (a) {
      if (a.getAttribute('data-route') === file) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------------------
     Reveal-on-scroll (never gates visibility: content is visible
     by default; class added only when motion is safe; hard
     safety net force-reveals everything after a short delay)
  --------------------------------------------------------- */
  var revealObserver = null;
  function initReveals(root) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      $all('[data-reveal], [data-reveal-stagger]', root).forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    document.documentElement.classList.add('motion-ready');
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    var els = $all('[data-reveal], [data-reveal-stagger]', root);
    els.forEach(function (el) {
      if (el.dataset.revealStagger !== undefined) {
        Array.prototype.forEach.call(el.children, function (child, i) {
          child.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
        });
      }
      revealObserver.observe(el);
    });
    // safety net: anything still hidden after 2.4s reveals regardless
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('is-in'); });
    }, 2400);
  }

  /* ---------------------------------------------------------
     Neighborhood explorer
  --------------------------------------------------------- */
  function initHood(root) {
    var hood = $('[data-hood]', root);
    if (!hood || hood.dataset.inited) return;
    hood.dataset.inited = '1';
    var tabs = $all('.hood-tab', hood);
    var img = $('.hood-panel img', hood);
    var capH = $('.hood-caption h3', hood);
    var capP = $('.hood-caption p', hood);
    var panel = $('.hood-panel', hood);

    function select(tab) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
      var d = tab.dataset;
      capH.textContent = d.name;
      capP.textContent = d.blurb;
      img.src = d.img;
      img.alt = d.alt || d.name;
      if (!prefersReduced) {
        panel.classList.remove('hood-fade');
        void panel.offsetWidth;
        panel.classList.add('hood-fade');
      }
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); tabs[(i + 1) % tabs.length].click(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); tabs[(i - 1 + tabs.length) % tabs.length].click(); }
      });
    });
  }

  /* ---------------------------------------------------------
     Mortgage estimator (principal & interest only)
  --------------------------------------------------------- */
  function initMortgage(root) {
    var calc = $('[data-mortgage]', root);
    if (!calc || calc.dataset.inited) return;
    calc.dataset.inited = '1';

    var price = $('[data-m="price"]', calc);
    var down = $('[data-m="down"]', calc);
    var rate = $('[data-m="rate"]', calc);
    var term = $('[data-m="term"]', calc);
    var outPrice = $('[data-out="price"]', calc);
    var outDown = $('[data-out="down"]', calc);
    var outRate = $('[data-out="rate"]', calc);
    var outTerm = $('[data-out="term"]', calc);
    var outPay = $('[data-out="pay"]', calc);
    var outLoan = $('[data-out="loan"]', calc);
    var outDownPct = $all('[data-out="downpct"]', calc);

    var STORE = 'js-mortgage';
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved) {
        if (saved.price) price.value = saved.price;
        if (saved.down) down.value = saved.down;
        if (saved.rate) rate.value = saved.rate;
        if (saved.term) term.value = saved.term;
      }
    } catch (e) {}

    function update() {
      var P = +price.value, D = +down.value, R = +rate.value, T = +term.value;
      var loan = Math.max(P - D, 0);
      var r = (R / 100) / 12;
      var n = T * 12;
      var monthly = r === 0 ? loan / n : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      outPrice.textContent = fmtMoney(P);
      outDown.textContent = fmtMoney(D);
      outRate.textContent = R.toFixed(2) + '%';
      outTerm.textContent = T + ' yr';
      outPay.textContent = fmtMoney(monthly || 0);
      outLoan.textContent = fmtMoney(loan);
      var pctText = P > 0 ? Math.round((D / P) * 100) + '%' : '0%';
      outDownPct.forEach(function (el) { el.textContent = pctText; });
      // screen-reader friendly slider values (otherwise sliders announce raw numbers)
      price.setAttribute('aria-valuetext', fmtMoney(P));
      down.setAttribute('aria-valuetext', fmtMoney(D) + ' (' + pctText + ' down)');
      rate.setAttribute('aria-valuetext', R.toFixed(2) + '%');
      term.setAttribute('aria-valuetext', T + ' years');
      try { localStorage.setItem(STORE, JSON.stringify({ price: P, down: D, rate: R, term: T })); } catch (e) {}
    }
    [price, down, rate, term].forEach(function (el) { el.addEventListener('input', update); });
    update();
  }

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast';
      t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
      document.body.appendChild(t);
    }
    $('span', t).textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }

  /* ---------------------------------------------------------
     Forms (validation + real lead delivery).
     Delivery uses LEAD_ENDPOINT (Formspree/Netlify) when set, and
     otherwise falls back to a pre-filled mailto so a lead is never
     silently lost. See LEAD_ENDPOINT config at the top of this file.
  --------------------------------------------------------- */
  function initForms(root) {
    function deliverByEmail(form) {
      var lines = [];
      $all('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.type === 'submit' || el.type === 'hidden' || el.name === 'company_website') return;
        var label = el.getAttribute('data-label')
          || (el.labels && el.labels[0] && el.labels[0].textContent.replace(/\*/g, '').trim())
          || el.name;
        var val = el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value;
        if (val) lines.push(label + ': ' + val);
      });
      var subject = form.getAttribute('data-subject') || 'New lead from your website';
      window.location.href = 'mailto:' + LEAD_EMAIL
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));
    }
    function showSuccess(form) {
      var success = $('.form-success', form.parentNode) || $('.form-success', form);
      if (success) {
        form.style.display = 'none';
        success.classList.add('show');
        success.setAttribute('tabindex', '-1');
        try { success.focus(); } catch (e) {}
      }
      toast(form.dataset.toast || 'Thanks — your message is on its way.');
    }
    $all('form[data-leadform]', root).forEach(function (form) {
      if (form.dataset.inited) return;
      form.dataset.inited = '1';

      // prefill CMA address from a hero hand-off
      var addr = $('[name="address"]', form);
      if (addr) {
        try {
          var pre = sessionStorage.getItem('cma-address');
          if (pre) { addr.value = pre; sessionStorage.removeItem('cma-address'); }
        } catch (e) {}
      }

      // prefill contact message from a listing "Inquire" hand-off
      var msg = $('[name="message"]', form);
      if (msg) {
        try {
          var li = sessionStorage.getItem('inquiry-listing');
          if (li && !msg.value) {
            msg.value = "I'm interested in " + li + ". Could you send me more details and let me know about a showing?";
            sessionStorage.removeItem('inquiry-listing');
          }
        } catch (e) {}
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var hp = $('[name="company_website"]', form);
        if (hp && hp.value) { return; } // honeypot: silently drop bots
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (LEAD_ENDPOINT) {
          var btn = $('button[type="submit"]', form);
          if (btn) { btn.disabled = true; }
          fetch(LEAD_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('bad'); showSuccess(form); form.reset(); })
            .catch(function () { if (btn) { btn.disabled = false; } deliverByEmail(form); showSuccess(form); form.reset(); });
        } else {
          deliverByEmail(form);
          showSuccess(form);
          form.reset();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Hero home-value hand-off
  --------------------------------------------------------- */
  function initHeroTool(root) {
    var tool = $('[data-hero-tool]', root);
    if (!tool || tool.dataset.inited) return;
    tool.dataset.inited = '1';
    var input = $('input', tool);
    var go = function () {
      try { if (input && input.value.trim()) sessionStorage.setItem('cma-address', input.value.trim()); } catch (e) {}
      navigate('buyers-sellers.html#home-value');
    };
    $('button', tool).addEventListener('click', go);
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }

  /* ---------------------------------------------------------
     Listings (rendered from data/listings.json — edited in /admin)
  --------------------------------------------------------- */
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function statusClass(status) {
    return 'st-' + String(status || 'For Sale').toLowerCase().replace(/[^a-z]+/g, '-');
  }
  function listingEmptyHTML() {
    return '<div class="listings-empty">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-5h5v5"/></svg>'
      + '<h3>New listings are on the way.</h3>'
      + "<p>I'm lining up homes across Boise and the Treasure Valley right now. Looking for something specific? Tell me what you're after and I'll send you matching homes&nbsp;— often before they hit the open market.</p>"
      + '<a class="btn btn-accent" href="contact.html" data-route="contact.html">Tell me what you\'re looking for <span class="arrow">&rarr;</span></a>'
      + '</div>';
  }
  function listingCardHTML(l, i) {
    var photos = (l.photos || []).filter(Boolean);
    var addr = escHtml(l.address || '');
    var city = escHtml(l.city || '');
    var alt = addr + (city ? ', ' + city : '');
    var media = photos[0]
      ? '<img loading="lazy" src="' + escHtml(photos[0]) + '" alt="' + alt + '">'
      : '<div class="listing-noimg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/></svg></div>';
    var count = photos.length > 1 ? '<span class="listing-count">' + photos.length + ' photos</span>' : '';
    var specs = [];
    if (l.beds) specs.push('<span><strong>' + escHtml(l.beds) + '</strong> bd</span>');
    if (l.baths) specs.push('<span><strong>' + escHtml(l.baths) + '</strong> ba</span>');
    if (l.sqft) specs.push('<span><strong>' + Number(l.sqft).toLocaleString('en-US') + '</strong> sqft</span>');
    return '<article class="listing-card">'
      + '<div class="listing-media">' + media
      +   '<span class="listing-badge ' + statusClass(l.status) + '">' + escHtml(l.status || 'For Sale') + '</span>' + count
      + '</div>'
      + '<div class="listing-body">'
      +   '<div class="listing-price">' + escHtml(l.price || 'Call for price') + '</div>'
      +   '<div class="listing-addr">' + addr + '</div>'
      +   (city ? '<div class="listing-city">' + city + (l.mls ? ' &middot; MLS ' + escHtml(l.mls) : '') + '</div>' : '')
      +   (specs.length ? '<div class="listing-specs">' + specs.join('') + '</div>' : '')
      +   '<div class="listing-actions">'
      +     '<button type="button" class="btn btn-ghost listing-view" data-index="' + i + '">View details</button>'
      +     '<a class="btn listing-inquire" href="contact.html" data-route="contact.html" data-inquire="' + alt + '">Inquire</a>'
      +   '</div>'
      + '</div>'
      + '</article>';
  }

  var listingModal = null, listingLastFocus = null;
  function ensureListingModal() {
    if (listingModal) return listingModal;
    listingModal = document.createElement('div');
    listingModal.className = 'listing-modal';
    listingModal.setAttribute('role', 'dialog');
    listingModal.setAttribute('aria-modal', 'true');
    listingModal.setAttribute('aria-hidden', 'true');
    listingModal.innerHTML = '<div class="listing-modal-backdrop" data-close></div>'
      + '<div class="listing-modal-panel" role="document">'
      + '<button class="listing-modal-close" type="button" aria-label="Close" data-close>&times;</button>'
      + '<div class="listing-modal-content"></div>'
      + '</div>';
    document.body.appendChild(listingModal);
    listingModal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeListingModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && listingModal.classList.contains('open')) closeListingModal();
    });
    return listingModal;
  }
  function openListingModal(l) {
    if (!l) return;
    var m = ensureListingModal();
    var photos = (l.photos || []).filter(Boolean);
    var alt = escHtml((l.address || '') + (l.city ? ', ' + l.city : ''));
    var gallery = photos.length
      ? '<div class="lm-gallery">' + photos.map(function (p, i) {
          return '<img loading="lazy" src="' + escHtml(p) + '" alt="' + escHtml((l.address || 'Listing') + ' photo ' + (i + 1)) + '">';
        }).join('') + '</div>'
      : '';
    var specs = [];
    if (l.beds) specs.push('<div><span>' + escHtml(l.beds) + '</span>Beds</div>');
    if (l.baths) specs.push('<div><span>' + escHtml(l.baths) + '</span>Baths</div>');
    if (l.sqft) specs.push('<div><span>' + Number(l.sqft).toLocaleString('en-US') + '</span>Sq Ft</div>');
    if (l.lot) specs.push('<div><span>' + escHtml(l.lot) + '</span>Lot</div>');
    if (l.year_built) specs.push('<div><span>' + escHtml(l.year_built) + '</span>Built</div>');
    $('.listing-modal-content', m).innerHTML =
        '<div class="lm-head">'
      +   '<span class="listing-badge ' + statusClass(l.status) + '">' + escHtml(l.status || 'For Sale') + '</span>'
      +   '<div class="lm-price">' + escHtml(l.price || 'Call for price') + '</div>'
      +   '<h2>' + escHtml(l.address || '') + '</h2>'
      +   (l.city ? '<p class="lm-city">' + escHtml(l.city) + (l.mls ? ' &middot; MLS ' + escHtml(l.mls) : '') + '</p>' : '')
      + '</div>'
      + (specs.length ? '<div class="lm-specs">' + specs.join('') + '</div>' : '')
      + gallery
      + (l.description ? '<div class="lm-desc">' + escHtml(l.description).replace(/\n/g, '<br>') + '</div>' : '')
      + '<div class="lm-actions"><a class="btn btn-accent" href="contact.html" data-route="contact.html" data-inquire="' + alt + '">Inquire about this home <span class="arrow">&rarr;</span></a></div>';
    var inq = $('[data-inquire]', m);
    if (inq) inq.addEventListener('click', function () {
      try { sessionStorage.setItem('inquiry-listing', inq.getAttribute('data-inquire')); } catch (e) {}
      closeListingModal();
    });
    listingLastFocus = document.activeElement;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    var c = $('.listing-modal-close', m); if (c) c.focus();
  }
  function closeListingModal() {
    if (!listingModal) return;
    listingModal.classList.remove('open');
    listingModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (listingLastFocus && listingLastFocus.focus) { try { listingLastFocus.focus(); } catch (e) {} }
  }

  function initListings(root) {
    var box = $('[data-listings]', root);
    if (!box || box.dataset.inited) return;
    box.dataset.inited = '1';
    fetch('data/listings.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(function (data) {
        var items = (data && data.listings ? data.listings : []).filter(function (l) {
          return l && (l.address || l.price || (l.photos && l.photos.length));
        });
        items.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
        if (!items.length) { box.classList.add('is-empty'); box.innerHTML = listingEmptyHTML(); return; }
        box.classList.remove('is-empty');
        box.innerHTML = items.map(listingCardHTML).join('');
        box.addEventListener('click', function (e) {
          var inq = e.target.closest('[data-inquire]');
          if (inq) { try { sessionStorage.setItem('inquiry-listing', inq.getAttribute('data-inquire')); } catch (x) {} return; }
          var view = e.target.closest('.listing-view');
          if (view) { openListingModal(items[+view.getAttribute('data-index')]); }
        });
      })
      .catch(function () {
        // fetch unavailable (e.g. opened from disk) — keep the static empty-state already in the page
        if (!box.querySelector('.listings-empty') && !box.querySelector('.listing-card')) {
          box.classList.add('is-empty');
          box.innerHTML = listingEmptyHTML();
        }
      });
  }

  /* ---------------------------------------------------------
     Per-page init (idempotent — runs on load and after swaps)
  --------------------------------------------------------- */
  function initPage(root) {
    root = root || document;
    initReveals(root);
    initHood(root);
    initMortgage(root);
    initForms(root);
    initHeroTool(root);
    initListings(root);
  }

  /* ---------------------------------------------------------
     Cached router (progressive enhancement)
     - keeps fetched pages in memory so revisits are instant
     - View Transition crossfade when available
     - disabled on file:// (where fetch is blocked); links work natively
  --------------------------------------------------------- */
  var cache = new Map();
  var canRoute = location.protocol === 'http:' || location.protocol === 'https:';
  var main = $('#main');

  function setMain(html, title, file, hash) {
    main.innerHTML = html;
    document.title = title;
    syncActiveNav(file);
    initPage(main);
    if (hash) {
      var target = document.getElementById(hash.slice(1));
      if (target) { target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function applyDoc(entry, file, hash, push, url) {
    if (push) history.pushState({ url: url }, '', url);
    if (!prefersReduced && document.startViewTransition) {
      document.startViewTransition(function () { setMain(entry.html, entry.title, file, hash); });
    } else {
      setMain(entry.html, entry.title, file, hash);
    }
  }

  function fetchPage(url) {
    var key = fileOf(url);
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('bad'); return r.text(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        var m = doc.querySelector('#main');
        if (!m) throw new Error('no-main');
        var entry = { html: m.innerHTML, title: doc.title };
        cache.set(key, entry);
        return entry;
      });
  }

  function navigate(url, push) {
    if (push === undefined) push = true;
    if (!canRoute || !main) { location.href = url; return; }
    var u = new URL(url, location.href);
    var file = fileOf(u.href);
    var hash = u.hash;
    document.body.classList.remove('nav-open');
    fetchPage(u.pathname.split('/').pop() || 'index.html')
      .then(function (entry) { applyDoc(entry, file, hash, push, u.pathname + u.hash); })
      .catch(function () { location.href = url; });
  }
  window.__navigate = navigate;
  // expose for the hero tool closure above
  function navigateGlobal(url) { navigate(url); }
  window.navigate = navigateGlobal;

  function isInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:\/\/)/.test(href) && new URL(href, location.href).origin !== location.origin) return false;
    var u;
    try { u = new URL(href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin) return false;
    return PAGES.indexOf(fileOf(u.href)) !== -1;
  }

  function initRouter() {
    if (!canRoute || !main) return;
    document.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var a = e.target.closest('a[href]');
      if (!a || !isInternal(a)) return;
      var u = new URL(a.getAttribute('href'), location.href);
      // same page + hash → let browser handle smooth anchor scroll
      if (fileOf(u.href) === fileOf(location.href) && u.hash) return;
      e.preventDefault();
      navigate(a.getAttribute('href'));
    });
    window.addEventListener('popstate', function () {
      navigate(location.pathname + location.hash, false);
    });
    // prefetch the rest of the site while idle → pages "stay open"
    var prefetch = function () {
      PAGES.forEach(function (p) { if (p !== fileOf(location.href)) fetchPage(p).catch(function () {}); });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(prefetch, { timeout: 2500 });
    else setTimeout(prefetch, 1800);
    // prefetch on hover/focus for instant feel
    document.addEventListener('mouseover', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (a && isInternal(a)) fetchPage(fileOf(new URL(a.getAttribute('href'), location.href).href)).catch(function () {});
    });
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  function boot() {
    initHeader();
    initMobileNav();
    initRouter();
    initPage(document);
    syncActiveNav(fileOf(location.href));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
