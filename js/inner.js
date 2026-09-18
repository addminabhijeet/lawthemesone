/* Inner pages behaviour. Core theme behaviours mirror index.html; page features are new. */
(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c){ return (c || document).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- shared navbar.html / footer.html includes ---------- */
  function loadIncludes(){
    return Promise.all($$('[data-include]').map(function(el){
      return fetch(el.getAttribute('data-include'))
        .then(function(r){ if(!r.ok) throw new Error(r.status); return r.text(); })
        .then(function(html){
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var nodes = Array.prototype.slice.call(doc.body.childNodes).map(function(n){ return document.importNode(n, true); });
          el.replaceWith.apply(el, nodes);
        })
        .catch(function(){ /* keep the fallback links that ship inside the placeholder */ });
    }));
  }

  /* ---------- preloader: dismiss as soon as the shared parts are in ---------- */
  var pre = $('#preloader');
  function hidePre(){ if(pre) pre.classList.add('loaded'); }
  setTimeout(hidePre, 1800);

  /* ---------- everything that lives in navbar.html / footer.html ---------- */
  function initChrome(){
    var topbar = $('#topbar'), header = $('#siteHeader');
    var path = $('#progressPath'), wrapEl = $('#progressWrap'), len = 0;
    if(path){
      len = path.getTotalLength();
      path.style.strokeDasharray = len + ' ' + len;
      path.style.strokeDashoffset = len;
    }
    function onScroll(){
      var top = window.scrollY;
      if(topbar && window.innerWidth <= 768) topbar.classList.toggle('collapsed', top > 50);
      if(header) header.classList.toggle('stuck', top > 50);
      if(path && wrapEl){
        var height = document.documentElement.scrollHeight - window.innerHeight;
        path.style.strokeDashoffset = height > 0 ? len - (top * len / height) : len;
        wrapEl.classList.toggle('active', top > 300);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if(wrapEl) wrapEl.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

    /* mobile menu: the burger is a real control (keyboard + aria-expanded) */
    var burger = $('#burger'), mobileMenu = $('#mobileMenu');
    function setMenu(open){
      burger.classList.toggle('open', open);
      mobileMenu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if(burger && mobileMenu){
      burger.addEventListener('click', function(){ setMenu(!mobileMenu.classList.contains('open')); });
      burger.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setMenu(!mobileMenu.classList.contains('open')); }
      });
      $$('a', mobileMenu).forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && mobileMenu.classList.contains('open')){ setMenu(false); burger.focus(); }
      });
    }

    /* mark the current page in the navbar */
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav-menu a, .mobile-menu a').forEach(function(a){
      var h = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
      if(h === here){
        a.setAttribute('aria-current', 'page');
        var drop = a.closest('.has-drop');
        if(drop && drop.firstElementChild && drop.firstElementChild !== a) drop.firstElementChild.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- footer / dark-section effects (same look as index.html, but they stop for reduced motion) ---------- */
  function initEffects(){
    var grad = 'linear-gradient(125deg,#0d0b08 0%,#1c1913 32%,#3a3120 58%,#1c1913 80%,#0d0b08 100%)';
    var textGrad = 'linear-gradient(135deg,#f7e9b4 0%,#d4af37 42%,#f0d97d 70%,#b8952e 100%)';
    var bgTargets = $$('.kn-section, .how-section, .site-footer');
    var textTargets = $$('.kn-section .section-title, .how-section .section-title, .site-footer .footer-tag, .site-footer .footer-col h4');
    bgTargets.forEach(function(el){
      el.style.setProperty('background-image', grad, 'important');
      el.style.setProperty('background-size', '320% 320%', 'important');
      el.style.setProperty('background-position', '0% 50%', 'important');
    });
    textTargets.forEach(function(el){
      el.style.setProperty('background-image', textGrad, 'important');
      el.style.setProperty('background-size', '220% auto', 'important');
      el.style.setProperty('-webkit-background-clip', 'text', 'important');
      el.style.setProperty('background-clip', 'text', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('background-position', '0% center', 'important');
    });
    if(reduced || !bgTargets.length) return;
    var DUR = 22000, HALF = DUR / 2, TEXT_DUR = 7000, start = Date.now();
    var seen = new Set();
    var all = bgTargets.concat(textTargets);
    if('IntersectionObserver' in window){
      var vis = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }); });
      all.forEach(function(el){ vis.observe(el); });
    } else {
      all.forEach(function(el){ seen.add(el); });
    }
    setInterval(function(){
      if(document.hidden) return;
      var now = Date.now();
      var e = (now - start) % DUR, p = e < HALF ? e / HALF : 2 - e / HALF;
      bgTargets.forEach(function(el){ if(seen.has(el)) el.style.setProperty('background-position', (p * 100).toFixed(1) + '% 50%', 'important'); });
      var tp = (-220 + (((now - start) % TEXT_DUR) / TEXT_DUR) * 440).toFixed(1);
      textTargets.forEach(function(el){ if(seen.has(el)) el.style.setProperty('background-position', tp + '% center', 'important'); });
    }, 50);
  }

  /* ---------- scroll reveal ---------- */
  function initReveal(){
    var reveals = $$('.reveal');
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ setTimeout(function(){ e.target.classList.add('in'); }, 50); io.unobserve(e.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
      reveals.forEach(function(el){ io.observe(el); });
    } else {
      reveals.forEach(function(el){ el.classList.add('in'); });
    }
  }

  /* ---------- category dropdown + quick search + accordion (acts, rules, notes, exams, courses) ---------- */
  function initFilters(){
    $$('[data-filter]').forEach(function(root){
      var mode = root.getAttribute('data-filter');            // 'list' (accordion) or 'cards' (course grid + pager)
      var dd = $('.dd', root), btn = $('.dd-btn', dd), menu = $('.dd-menu', dd), label = $('.dd-label', dd);
      var opts = $$('li', menu), input = $('input[type="search"]', root), none = $('.res-none', root);
      var cat = 'all', q = '', page = 1, PER = 12, apply;

      function openMenu(o){
        dd.classList.toggle('open', o);
        btn.setAttribute('aria-expanded', o ? 'true' : 'false');
        if(o){ var sel = $('[aria-selected="true"]', menu) || opts[0]; if(sel) sel.focus(); }
      }
      function select(li){
        cat = li.getAttribute('data-value');
        opts.forEach(function(o){ o.setAttribute('aria-selected', o === li ? 'true' : 'false'); });
        label.textContent = cat === 'all' ? btn.getAttribute('data-all-label') : li.textContent.trim();
      }
      btn.addEventListener('click', function(){ openMenu(!dd.classList.contains('open')); });
      document.addEventListener('click', function(e){ if(!dd.contains(e.target)) openMenu(false); });
      opts.forEach(function(li, i){
        li.tabIndex = -1;
        function choose(){ select(li); openMenu(false); btn.focus(); page = 1; apply(); }
        li.addEventListener('click', choose);
        li.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); choose(); }
          else if(e.key === 'ArrowDown'){ e.preventDefault(); (opts[i + 1] || li).focus(); }
          else if(e.key === 'ArrowUp'){ e.preventDefault(); (opts[i - 1] || li).focus(); }
          else if(e.key === 'Escape'){ openMenu(false); btn.focus(); }
        });
      });
      btn.addEventListener('keydown', function(e){ if(e.key === 'ArrowDown'){ e.preventDefault(); openMenu(true); } });
      if(input) input.addEventListener('input', function(){ q = input.value.trim().toLowerCase(); page = 1; apply(); });

      if(mode === 'list'){
        var cats = $$('.res-cat', root);
        cats.forEach(function(c){
          var head = $('.res-cat-head', c), body = $('.res-cat-body', c);
          head.addEventListener('click', function(){
            var open = head.getAttribute('aria-expanded') === 'true';
            head.setAttribute('aria-expanded', open ? 'false' : 'true'); body.hidden = open;
          });
        });
        apply = function(){
          var shown = 0;
          cats.forEach(function(c){
            var catOk = cat === 'all' || c.getAttribute('data-cat') === cat;
            var items = $$('.list-card', c), vis = 0;
            items.forEach(function(it){
              var ok = catOk && (q === '' || (it.getAttribute('data-search') || '').indexOf(q) > -1);
              it.hidden = !ok; if(ok) vis++;
            });
            $$('.res-sub', c).forEach(function(s){ s.hidden = !!s.querySelector('.list-card') && !s.querySelector('.list-card:not([hidden])'); });
            var showCat = catOk && (q === '' || vis > 0);
            c.hidden = !showCat;
            if(showCat){
              shown++;
              if(q !== ''){ $('.res-cat-head', c).setAttribute('aria-expanded', 'true'); $('.res-cat-body', c).hidden = false; }
            }
          });
          if(none) none.hidden = shown > 0;
        };
      } else {
        var cards = $$('.course-card', root), pager = $('.pager', root);
        var renderPager = function(pages){
          pager.innerHTML = '';
          if(pages <= 1){ pager.hidden = true; return; }
          pager.hidden = false;
          var add = function(text, aria, target, disabled, current){
            var li = document.createElement('li'), el = document.createElement('button');
            el.type = 'button'; el.textContent = text; el.setAttribute('aria-label', aria);
            if(disabled) el.disabled = true;
            if(current) el.setAttribute('aria-current', 'page');
            el.addEventListener('click', function(){ page = target; apply(); $('.course-grid', root).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); });
            li.appendChild(el); pager.appendChild(li);
          };
          add('‹', 'Previous page', page - 1, page === 1, false);
          for(var i = 1; i <= pages; i++) add(String(i), 'Page ' + i, i, false, i === page);
          add('›', 'Next page', page + 1, page === pages, false);
        };
        apply = function(){
          var hit = cards.filter(function(c){
            return (cat === 'all' || c.getAttribute('data-cat') === cat) && (q === '' || (c.getAttribute('data-search') || '').indexOf(q) > -1);
          });
          var pages = Math.max(1, Math.ceil(hit.length / PER));
          if(page > pages) page = pages;
          cards.forEach(function(c){ c.hidden = true; c.classList.remove('show'); });
          hit.slice((page - 1) * PER, page * PER).forEach(function(c){ c.hidden = false; c.classList.add('show'); });
          if(none) none.hidden = hit.length > 0;
          renderPager(pages);
        };
        // deep link: course.html?cat=44 (used by the footer's Programs links)
        var want = new URLSearchParams(location.search).get('cat');
        if(want){ var li = opts.filter(function(o){ return o.getAttribute('data-value') === want; })[0]; if(li) select(li); }
      }
      apply();
    });
  }

  /* ---------- gallery lightbox ---------- */
  function initLightbox(){
    var lb = $('#lightbox');
    if(!lb) return;
    var lbImg = $('img', lb), lbCap = $('.lb-cap', lb), lbClose = $('.lb-close', lb), lbPrev = $('.lb-prev', lb), lbNext = $('.lb-next', lb);
    var group = [], idx = 0, title = '', lastFocus = null;
    function show(){
      lbImg.src = group[idx]; lbImg.alt = title + ' (photo ' + (idx + 1) + ' of ' + group.length + ')';
      lbCap.textContent = title + '  ·  ' + (idx + 1) + ' / ' + group.length;
      lbPrev.hidden = lbNext.hidden = group.length < 2;
    }
    function openLb(a){
      group = a.getAttribute('data-imgs').split('|'); title = a.getAttribute('data-title'); idx = 0; lastFocus = a;
      show(); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; lbClose.focus();
    }
    function closeLb(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if(lastFocus) lastFocus.focus(); }
    $$('.album[data-imgs]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); openLb(a); }); });
    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', function(){ idx = (idx - 1 + group.length) % group.length; show(); });
    lbNext.addEventListener('click', function(){ idx = (idx + 1) % group.length; show(); });
    lb.addEventListener('click', function(e){ if(e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') closeLb();
      else if(e.key === 'ArrowLeft' && group.length > 1) lbPrev.click();
      else if(e.key === 'ArrowRight' && group.length > 1) lbNext.click();
      else if(e.key === 'Tab'){
        var f = [lbClose, lbPrev, lbNext].filter(function(x){ return !x.hidden; }), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* ---------- history tabs ---------- */
  function initTabs(){
    $$('[data-tabs]').forEach(function(root){
      var tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
      function select(i, focus){
        tabs.forEach(function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
        panels.forEach(function(p, k){ p.classList.toggle('active', k === i); });
        if(focus) tabs[i].focus();
      }
      tabs.forEach(function(t, i){
        t.addEventListener('click', function(){ select(i, false); });
        t.addEventListener('keydown', function(e){
          if(e.key === 'ArrowRight'){ e.preventDefault(); select((i + 1) % tabs.length, true); }
          else if(e.key === 'ArrowLeft'){ e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
        });
      });
      select(0, false);
    });
  }

  /* ---------- forms: front-end only here, so say so instead of failing silently ---------- */
  function initForms(){
    $$('form[data-static]').forEach(function(form){
      var status = $('.form-status', form);
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(status){
          status.hidden = false;
          status.textContent = 'Your details are ready to send. This preview is not connected to a server yet, so nothing was submitted.';
        }
      });
    });
  }

  /* ---------- boot ---------- */
  function boot(){
    initReveal(); initFilters(); initLightbox(); initTabs(); initForms();
    loadIncludes().then(function(){ initChrome(); initEffects(); setTimeout(hidePre, 120); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
