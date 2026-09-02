(function () {
  'use strict';

  // ---- Footer year ----
  document.querySelectorAll('#vftYear').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Mobile nav (burger) ----
  var burger = document.getElementById('vnavBurger');
  var links = document.getElementById('vnavLinks');
  var burgerIcon = document.getElementById('vnavBurgerIcon');
  function closeMenu() {
    if (!links || !burger) return;
    links.style.maxHeight = '0px';
    burger.setAttribute('aria-expanded', 'false');
    if (burgerIcon) burgerIcon.className = 'fa-solid fa-bars';
  }
  if (burger && links) {
    burger.addEventListener('click', function () {
      var isOpen = links.style.maxHeight && links.style.maxHeight !== '0px';
      if (isOpen) {
        closeMenu();
      } else {
        links.style.maxHeight = links.scrollHeight + 'px';
        burger.setAttribute('aria-expanded', 'true');
        if (burgerIcon) burgerIcon.className = 'fa-solid fa-xmark';
      }
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  // ---- Sticky nav: hide on scroll down, reveal on scroll up; also auto-close mobile menu ----
  var vnav = document.querySelector('.vnav');
  if (vnav) {
    var lastY = window.scrollY;
    var scrollTicking = false;
    window.addEventListener('scroll', function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (Math.abs(y - lastY) > 4) {
          if (y > lastY && y > 100) vnav.classList.add('vnav-hidden');
          else vnav.classList.remove('vnav-hidden');
          lastY = y;
        }
        closeMenu();
        scrollTicking = false;
      });
    }, { passive: true });
  }

  // ---- Hero scroll-down arrow ----
  document.querySelectorAll('.phs-scroll-down').forEach(function (arrow) {
    arrow.addEventListener('click', function (e) {
      var targetId = arrow.getAttribute('href');
      var target = targetId && document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Informational banner (auto-show, auto-hide, no tracking) ----
  var vck = document.getElementById('vck');
  if (vck) {
    var progress = document.getElementById('vckProgress');
    var hideBanner = function () {
      vck.classList.add('vck-hide');
      if (progress) progress.classList.remove('vck-run');
    };
    setTimeout(function () { vck.classList.remove('vck-hide'); }, 900);
    setTimeout(hideBanner, 900 + 8000);
    var acceptBtn = document.getElementById('vckAccept');
    if (acceptBtn) acceptBtn.addEventListener('click', hideBanner);
    var closeBtn = document.getElementById('vckClose');
    if (closeBtn) closeBtn.addEventListener('click', hideBanner);
  }

  // ---- Region filter chips (if present) ----
  document.querySelectorAll('.phs-filters').forEach(function (filterBar) {
    var grid = filterBar.parentElement.querySelector('.phs-grid');
    if (!grid) return;
    filterBar.querySelectorAll('.phs-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        filterBar.querySelectorAll('.phs-chip').forEach(function (c) { c.classList.remove('phs-active'); });
        chip.classList.add('phs-active');
        var filter = chip.getAttribute('data-filter');
        grid.querySelectorAll('.phs-card').forEach(function (card) {
          var show = filter === 'all' || card.getAttribute('data-zone') === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  });

  // ---- Photo gallery carousel ----
  document.querySelectorAll('.phg-carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.phg-track');
    var prev = carousel.querySelector('.phg-prev');
    var next = carousel.querySelector('.phg-next');
    var dotsWrap = carousel.querySelector('.phg-dots');
    var slides = track ? Array.from(track.children) : [];
    var dots = dotsWrap ? Array.from(dotsWrap.children) : [];

    function scrollToIndex(i) {
      if (!slides[i]) return;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }
    function activeIndex() {
      var trackLeft = track.scrollLeft;
      var closest = 0, min = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft - trackLeft);
        if (d < min) { min = d; closest = i; }
      });
      return closest;
    }
    function syncDots() {
      var idx = activeIndex();
      dots.forEach(function (d, i) { d.classList.toggle('phg-dot-active', i === idx); });
    }
    if (prev) prev.addEventListener('click', function () { scrollToIndex(Math.max(0, activeIndex() - 1)); });
    if (next) next.addEventListener('click', function () { scrollToIndex(Math.min(slides.length - 1, activeIndex() + 1)); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { scrollToIndex(i); }); });
    if (track) track.addEventListener('scroll', function () {
      clearTimeout(track._t);
      track._t = setTimeout(syncDots, 100);
    });

    // Lightbox
    var section = carousel.closest('.phg-section') || carousel.parentElement;
    var lightbox = section.querySelector('.phg-lightbox');
    if (lightbox) {
      slides.forEach(function (slide) {
        var img = slide.querySelector('img');
        if (!img) return;
        slide.addEventListener('click', function () {
          lightbox.innerHTML =
            '<button class="phg-lightbox-close" aria-label="إغلاق" style="position:absolute;top:20px;inset-inline-end:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:2">&times;</button>' +
            '<img src="' + img.currentSrc + '" alt="' + (img.alt || '') + '" style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:12px">';
          lightbox.classList.remove('sf-hidden');
          lightbox.style.cssText += ';position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(9,42,33,.92)';
          lightbox.querySelector('.phg-lightbox-close').addEventListener('click', closeLightbox);
        });
      });
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
    }
    function closeLightbox() {
      lightbox.classList.add('sf-hidden');
      lightbox.innerHTML = '';
    }
  });

  // ---- Developer stats counters ----
  var counters = document.querySelectorAll('.phd-count[data-target]');
  if (counters.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        var target = parseFloat(el.getAttribute('data-target'));
        var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        var duration = 1400;
        var start = null;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var value = target * progress;
          el.textContent = decimals ? value.toFixed(decimals) : Math.round(value);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = decimals ? target.toFixed(decimals) : target;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  // ---- Budget assistant: recommend a project from the page's own cards, then hand off to WhatsApp ----
  var whatsappNumber = '201006140168';
  var pbaSection = document.querySelector('.pba-section');
  if (pbaSection) {
    var downInput = document.getElementById('pbaDown');
    var monthlyInput = document.getElementById('pbaMonthly');
    var yearsInput = document.getElementById('pbaYears');
    var submitBtn = document.getElementById('pbaSubmit');
    var resultBox = document.getElementById('pbaResult');
    var resultLabel = document.getElementById('pbaResultLabel');
    var resultName = document.getElementById('pbaResultName');
    var resultMeta = document.getElementById('pbaResultMeta');
    var resultWa = document.getElementById('pbaResultWa');
    var anotherBtn = document.getElementById('pbaAnother');

    function parseMoney(v) {
      return parseInt((v || '').replace(/[^\d]/g, ''), 10) || 0;
    }

    // Format as the user types: digits only, comma every 3 digits.
    function wireMoneyInput(el) {
      el.addEventListener('input', function () {
        var digits = parseMoney(el.value);
        el.value = digits ? digits.toLocaleString('en-US') : '';
        updateSubmitState();
      });
    }
    wireMoneyInput(downInput);
    wireMoneyInput(monthlyInput);

    function updateSubmitState() {
      submitBtn.disabled = !(parseMoney(downInput.value) > 0 && parseMoney(monthlyInput.value) > 0);
    }

    function readProjects() {
      return Array.from(document.querySelectorAll('.phs-card')).map(function (card) {
        var statValues = card.querySelectorAll('.phs-stat-value');
        var priceEl = card.querySelector('.phs-price-value');
        var locEl = card.querySelector('.phs-loc');
        var priceDigits = priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : '0';
        return {
          name: (card.querySelector('.phs-name') || {}).textContent || '',
          down: statValues[0] ? parseFloat(statValues[0].textContent) : 0,
          years: statValues[1] ? parseFloat(statValues[1].textContent) : 0,
          price: parseInt(priceDigits, 10) || 0,
          loc: locEl ? locEl.textContent.trim() : '',
        };
      }).filter(function (p) { return p.name && p.price; });
    }

    // Down payment + monthly installment describe what the customer can actually pay;
    // reconstruct an implied affordable price from them rather than asking for a
    // budget number outright, then rank every project against it — never just one.
    // If nothing truly fits, we still return a ranked list (closest-to-affordable
    // first) instead of nothing, so the lead is never a dead end.
    function buildCandidates(down, monthly, years) {
      var projects = readProjects();
      if (!projects.length) return { list: [], fits: false };

      function requiredDown(p) { return p.price * (p.down / 100); }
      function impliedMonthly(p) {
        var financeYears = years || p.years || 8;
        return (p.price - requiredDown(p)) / (financeYears * 12);
      }

      var fits = projects.filter(function (p) {
        return requiredDown(p) <= down * 1.05 && impliedMonthly(p) <= monthly * 1.15;
      });
      var goodFit = fits.length > 0;
      var pool = (goodFit ? fits : projects).slice();

      if (goodFit) {
        var impliedBudget = down + monthly * (years || 8) * 12;
        pool.sort(function (a, b) { return Math.abs(a.price - impliedBudget) - Math.abs(b.price - impliedBudget); });
      } else {
        // Rank by how far each project is from being affordable (smallest shortfall first).
        pool.sort(function (a, b) {
          var gapA = Math.max(0, requiredDown(a) - down) + Math.max(0, impliedMonthly(a) - monthly) * 12;
          var gapB = Math.max(0, requiredDown(b) - down) + Math.max(0, impliedMonthly(b) - monthly) * 12;
          return gapA - gapB;
        });
      }
      return { list: pool, fits: goodFit };
    }

    var state = { list: [], index: 0, fits: true, down: 0, monthly: 0, years: 0 };

    function renderCurrentPick() {
      var pick = state.list[state.index];
      if (!pick) return;

      resultLabel.textContent = state.fits ? 'الأنسب لإمكانياتك' : 'أقرب خيار متاح — وهنساعدك تظبط خطة السداد';
      resultName.textContent = pick.name + (pick.loc ? ' — ' + pick.loc : '');
      var metaParts = [];
      if (pick.price) metaParts.push('يبدأ من ' + pick.price.toLocaleString('en-US') + ' جنيه');
      if (pick.down) metaParts.push('مقدم ' + pick.down + '%');
      if (pick.years) metaParts.push('تقسيط ' + pick.years + ' سنوات');
      resultMeta.textContent = metaParts.join(' · ');

      // Kept in English end to end: WhatsApp's message-preview rendering doesn't apply
      // proper bidi isolation, so an English project name dropped into an Arabic
      // sentence (pick.name below) comes out visually scrambled once the chat opens.
      var lines = state.fits
        ? ["Hi, I'd like a project recommendation based on my budget:"]
        : ["Hi, my available budget is a bit below the current project requirements — I'd like to know if there's a flexible payment plan available:"];
      lines.push('Available down payment: ' + state.down.toLocaleString('en-US') + ' EGP');
      lines.push('Suitable monthly installment: ' + state.monthly.toLocaleString('en-US') + ' EGP');
      if (state.years) lines.push('Installment period: ' + state.years + ' years');
      lines.push((state.fits ? 'Recommended project: ' : 'Closest available project: ') + pick.name);
      resultWa.href = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(lines.join('\n'));

      anotherBtn.style.display = state.list.length > 1 ? '' : 'none';
    }

    if (submitBtn) submitBtn.addEventListener('click', function () {
      var down = parseMoney(downInput.value);
      var monthly = parseMoney(monthlyInput.value);
      var years = parseFloat(yearsInput.value) || 0;
      if (!down || !monthly) return;

      var result = buildCandidates(down, monthly, years);
      if (!result.list.length) return;

      state = { list: result.list, index: 0, fits: result.fits, down: down, monthly: monthly, years: years };
      renderCurrentPick();

      resultBox.classList.remove('sf-hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    if (anotherBtn) anotherBtn.addEventListener('click', function () {
      if (!state.list.length) return;
      state.index = (state.index + 1) % state.list.length;
      renderCurrentPick();
    });
  }
})();
