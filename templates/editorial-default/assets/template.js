(() => {
  window.ThemeRuntime?.mountThemeControl(document.querySelector('#themeControl'));

  const applyMediaThumb = (thumb) => {
    const figure = thumb.closest('.media-switch');
    if (!figure) return;
    const main = figure.querySelector('[data-media-main]');
    const thumbs = [...figure.querySelectorAll('.media-switch__thumb')];
    thumbs.forEach((item) => item.classList.toggle('is-active', item === thumb));
    const src = thumb.getAttribute('data-src') || '';
    const alt = thumb.getAttribute('data-alt') || '';
    if (main) {
      if (main.tagName === 'IMG') {
        if (src) main.src = src;
        main.alt = alt;
      } else if (alt) {
        main.textContent = alt;
      }
    }
    if (src) figure.setAttribute('data-lightbox-src', src);
    if (alt) figure.setAttribute('data-lightbox-alt', alt);
    figure.classList.remove('is-open');
  };

  const mountMediaSwitch = (root = document) => {
    root.querySelectorAll('.media-switch').forEach((figure) => {
      if (figure.dataset.switchReady) return;
      figure.dataset.switchReady = '1';
      figure.addEventListener('click', (event) => {
        if (event.target.closest('.media-switch__thumb')) return;
        if (
          figure.classList.contains('is-cover')
          && !window.matchMedia('(hover: hover) and (pointer: fine)').matches
          && !event.target.closest('.media-switch__thumbs, .media-switch__panel, .media-switch__label')
        ) {
          event.preventDefault();
          event.stopPropagation();
          figure.classList.toggle('is-open');
        }
      });
    });
  };

  if (!document.documentElement.dataset.mediaSwitchBound) {
    document.documentElement.dataset.mediaSwitchBound = '1';
    document.addEventListener('pointerdown', (event) => {
      if (document.documentElement.classList.contains('is-editing')) return;
      const thumb = event.target.closest?.('.media-switch__thumb');
      if (!thumb) return;
      event.preventDefault();
      event.stopPropagation();
      applyMediaThumb(thumb);
    }, true);
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.media-switch.is-cover.is-open').forEach((figure) => {
        if (!figure.contains(event.target)) figure.classList.remove('is-open');
      });
    });
  }

  const formatStatValues = (root = document) => {
    root.querySelectorAll('.stat-value, .formula__factor > b, .formula__factor > span, .media-switch__panel p').forEach((node) => {
      if (node.dataset.statSymbols) return;
      if (node.querySelector('small')) {
        node.dataset.statSymbols = '1';
        return;
      }
      if (node.children.length) return;
      const text = node.textContent;
      if (!text) return;
      node.innerHTML = text.replace(/\s*([¥$€£≤≥%×/–—+])\s*/g, '<small>$1</small>');
      node.dataset.statSymbols = '1';
    });
  };

  const formatCalloutText = (root = document) => {
    root.querySelectorAll('.callout p, .callout strong, .content[data-content="point"] .content__body, .content[data-content="signal"] .content__body').forEach((node) => {
      const text = node.textContent.replace(/\s*\n\s*/g, '').trim();
      if (!text) return;
      node.textContent = text.replace(/([。．.;；])\s*/g, '$1\n').replace(/\n+$/, '');
    });
  };

  const parseEvidenceRatio = (node) => {
    if (!node) return { w: 3, h: 4 };
    if (node.getAttribute('data-image-kind') === 'shot' || node.querySelector('[data-image-kind="shot"]')) {
      return { w: 0.46, h: 1 };
    }
    const raw = node.getAttribute('data-image-ratio')
      || node.querySelector('[data-image-ratio]')?.getAttribute('data-image-ratio')
      || getComputedStyle(node).getPropertyValue('--image-ratio')
      || '3 / 4';
    const parts = String(raw).split(/[:/]/).map((part) => parseFloat(part.trim()));
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return { w: parts[0], h: parts[1] };
    return { w: 3, h: 4 };
  };

  const evidenceGapPx = (node) => (
    parseFloat(getComputedStyle(node || document.documentElement).getPropertyValue('--space-4'))
    || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-4'))
    || 16
  );

  const evidenceInnerBox = (node) => {
    const styles = getComputedStyle(node);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    return {
      w: Math.max(0, (node.clientWidth || 0) - padX),
      h: Math.max(0, (node.clientHeight || 0) - padY),
    };
  };

  const syncEvidenceScrollFade = (gallery) => {
    if (!gallery) return;
    const max = gallery.scrollWidth - gallery.clientWidth;
    gallery.classList.toggle('is-scroll-end', max <= 1 || gallery.scrollLeft >= max - 1);
  };

  const evidenceCaptionPx = (node, items) => {
    const hasCaption = (items || [node]).some((item) => item?.querySelector?.('figcaption'));
    if (!hasCaption) return 0;
    const raw = getComputedStyle(node).getPropertyValue('--evidence-caption-height').trim();
    if (raw.endsWith('rem')) {
      return parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    const value = parseFloat(raw);
    if (Number.isFinite(value)) return value;
    return items?.[0]?.querySelector('figcaption')?.offsetHeight || 0;
  };

  const layoutEvidenceStandalone = (node) => {
    if (!node || node.getAttribute('data-image-kind') === 'strip' || node.closest('.evidence-gallery')) return;
    if (node.closest('[data-media-page] [data-slot="media"]')) {
      node.style.removeProperty('width');
      node.style.removeProperty('--evidence-item-width');
      node.style.height = '100%';
      return;
    }
    const ratio = parseEvidenceRatio(node);
    const ratioCssValue = `${ratio.w} / ${ratio.h}`;
    node.style.setProperty('--image-ratio', ratioCssValue);
    node.setAttribute('data-image-ratio', `${ratio.w}:${ratio.h}`);
    const windowNode = node.querySelector(':scope > .evidence-window');
    if (windowNode) {
      windowNode.style.setProperty('--image-ratio', ratioCssValue);
      windowNode.setAttribute('data-image-ratio', `${ratio.w}:${ratio.h}`);
    }
    node.dataset.evidenceLayout = 'center';
    const region = node.closest('.page-region');
    if (region) {
      const box = evidenceInnerBox(node.clientHeight >= 8 ? node : region);
      const boxH = box.h || evidenceInnerBox(region).h;
      const boxW = box.w || evidenceInnerBox(region).w;
      if (boxH >= 8) {
        const itemW = Math.min(boxW || boxH, Math.max(1, boxH - evidenceCaptionPx(node, [node])) * (ratio.w / ratio.h));
        node.style.setProperty('--evidence-item-width', `${itemW}px`);
        node.style.width = `${itemW}px`;
        node.style.height = '100%';
        return;
      }
    }
    node.style.removeProperty('width');
    node.style.removeProperty('height');
    node.style.removeProperty('--evidence-item-width');
  };

  const layoutEvidenceGallery = (gallery) => {
    if (!gallery || gallery.getAttribute('data-image-kind') === 'strip') {
      if (gallery) {
        gallery.dataset.evidenceLayout = 'strip';
        gallery.style.removeProperty('--evidence-item-width');
      }
      return;
    }
    const items = [...gallery.children].filter((item) => (
      item.matches('.evidence-figure, .media-switch, .media-card')
      && !item.classList.contains('is-component-item-hidden')
    ));
    if (!items.length) return;
    const box = evidenceInnerBox(gallery);
    const galleryH = box.h || evidenceInnerBox(gallery.parentElement || gallery).h;
    const galleryW = box.w || evidenceInnerBox(gallery.parentElement || gallery).w;
    if (galleryH < 8 || galleryW < 8) return;
    const ratio = parseEvidenceRatio(gallery);
    const ratioCssValue = `${ratio.w} / ${ratio.h}`;
    gallery.style.setProperty('--image-ratio', ratioCssValue);
    const ratioW = Math.max(1, galleryH - evidenceCaptionPx(gallery, items)) * (ratio.w / ratio.h);
    const gap = evidenceGapPx(gallery);
    const nFull = Math.max(1, Math.floor((galleryW + gap) / (ratioW + gap)));
    const count = items.length;
    let layout = 'center';
    if (count === 1) layout = 'center';
    else if (count <= nFull) layout = 'even';
    else layout = 'scroll';
    gallery.dataset.evidenceLayout = layout;
    gallery.style.setProperty('--evidence-item-width', `${ratioW}px`);
    gallery.classList.toggle('is-scrollable', layout === 'scroll');
    if (layout !== 'scroll') gallery.classList.remove('is-scroll-end');
    else syncEvidenceScrollFade(gallery);
  };

  const layoutAllEvidence = () => {
    document.querySelectorAll('.evidence-gallery').forEach(layoutEvidenceGallery);
    document.querySelectorAll('.page-region > .media-switch, .page-region > .evidence-figure').forEach(layoutEvidenceStandalone);
  };

  const bindStripWheel = (root = document) => {
    root.querySelectorAll('[data-image-kind="strip"] .evidence-window').forEach((windowNode) => {
      if (windowNode.dataset.stripWheel) return;
      windowNode.dataset.stripWheel = '1';
      windowNode.addEventListener('wheel', (event) => {
        const max = windowNode.scrollWidth - windowNode.clientWidth;
        if (max <= 1) return;
        const delta = event.deltaY + event.deltaX;
        if (!delta) return;
        event.preventDefault();
        windowNode.scrollLeft += delta;
      }, { passive: false });
    });
  };

  const bindEvidenceGalleryScroll = (root = document) => {
    root.querySelectorAll('.evidence-gallery').forEach((gallery) => {
      if (gallery.dataset.galleryScroll) return;
      gallery.dataset.galleryScroll = '1';
      gallery.addEventListener('scroll', () => syncEvidenceScrollFade(gallery), { passive: true });
      gallery.addEventListener('wheel', (event) => {
        if (!gallery.classList.contains('is-scrollable')) return;
        const max = gallery.scrollWidth - gallery.clientWidth;
        if (max <= 1) return;
        const delta = event.deltaY + event.deltaX;
        if (!delta) return;
        event.preventDefault();
        gallery.scrollLeft += delta;
      }, { passive: false });
    });
  };

  const bindEvidenceLayout = () => {
    layoutAllEvidence();
    bindStripWheel();
    bindEvidenceGalleryScroll();
    const observer = new ResizeObserver(() => layoutAllEvidence());
    document.querySelectorAll('.evidence-gallery, .page-region, [data-report-stage]').forEach((node) => observer.observe(node));
    window.addEventListener('resize', layoutAllEvidence);
  };

  mountMediaSwitch();
  formatCalloutText();
  formatStatValues();

  const assembleChrome = () => {
    const theme = document.querySelector('.theme-control');
    const pager = document.querySelector('[data-report-pager]');
    if (!pager) return;
    let chrome = document.querySelector('[data-report-chrome]');
    if (!chrome) {
      chrome = document.createElement('div');
      chrome.className = 'report-chrome';
      chrome.dataset.reportChrome = '';
      pager.parentNode.insertBefore(chrome, pager);
      if (theme) {
        const toast = theme.querySelector('[data-theme-toast], .theme-control__toast');
        if (toast) document.body.appendChild(toast);
        chrome.appendChild(theme);
      }
      chrome.appendChild(pager);
    }
    if (!document.querySelector('.report-chrome-hotspot')) {
      const spot = document.createElement('button');
      spot.type = 'button';
      spot.className = 'report-chrome-hotspot';
      spot.setAttribute('aria-label', '显示主题与翻页');
      document.body.appendChild(spot);
    }
  };

  const mountDeck = () => {
    const shell = document.querySelector('.report-shell.is-deck');
    const stage = document.querySelector('[data-report-stage]');
    if (!shell || !stage) return false;

    assembleChrome();

    const slidesRoot = stage.querySelector('[data-report-slides]') || stage;
    const slides = [...slidesRoot.querySelectorAll(':scope > .report-slide')];
    if (!slides.length) return false;

    const head = stage.querySelector('[data-deck-head]');

    const nav = document.querySelector('[data-component-id="navigation"]');
    const links = [...(nav?.querySelectorAll('a') || [])];
    const pager = document.querySelector('[data-report-pager]');
    const prevBtn = pager?.querySelector('[data-slide-prev]');
    const nextBtn = pager?.querySelector('[data-slide-next]');
    const label = pager?.querySelector('[data-slide-label]');
    const lightbox = document.querySelector('.report-lightbox, dialog.report-lightbox');
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ANIM = { fragment: 340, chapter: 560 };
    let index = 0;
    let locked = false;
    let animTimer = 0;

    const setChromeHeight = () => {
      const navEl = document.querySelector('.document-nav');
      document.documentElement.style.setProperty('--chrome-height', `${navEl?.offsetHeight || 0}px`);
    };

    const lightboxOpen = () => Boolean(lightbox && (lightbox.open || lightbox.hasAttribute('open')));

    const activateNav = (chapter) => {
      links.forEach((link) => {
        const href = (link.getAttribute('href') || '').replace('#', '');
        link.classList.toggle('is-active', href === chapter);
      });
    };

    const labelText = (slide) => {
      const value = slide?.dataset.slide || '';
      if (value === 'notes') return '口径';
      return value || '—';
    };

    const clearMotion = (slide) => {
      slide.classList.remove(
        'is-exit', 'is-enter',
        'is-exit-fragment', 'is-enter-fragment',
        'is-exit-chapter', 'is-enter-chapter',
        'is-forward', 'is-back'
      );
    };

    const syncHead = (slide) => {
      const isContent = slide.classList.contains('report-section');
      stage.classList.toggle('has-deck-head', isContent);
      const srcNo = slide.querySelector('.section-header__no')?.textContent.trim() || '';
      const srcTitle = slide.querySelector('.section-header__title')?.textContent.trim() || '';
      const srcPart = slide.querySelector('.section-header__part')?.textContent.trim() || '';
      const foot = document.querySelector('[data-deck-source]');
      stage.classList.remove('has-deck-foot');
      shell.classList.remove('has-deck-foot');
      if (foot) foot.hidden = true;
      if (!head) return;
      if (!isContent) return;
      const noEl = head.querySelector('[data-deck-no]');
      const titleEl = head.querySelector('[data-deck-title]');
      const partEl = head.querySelector('[data-deck-part]');
      const slideId = (srcNo.split('·')[0] || slide.dataset.slide || '').trim();
      if (noEl) noEl.textContent = slideId ? `简介 · ${slideId}` : '';
      if (titleEl && titleEl.textContent !== srcTitle) titleEl.textContent = srcTitle;
      if (partEl) {
        if (srcPart) {
          partEl.hidden = false;
          if (partEl.textContent !== srcPart) partEl.textContent = srcPart;
        } else {
          partEl.hidden = true;
          partEl.textContent = '';
        }
      }
    };

    const syncChrome = (slide) => {
      activateNav(slide.dataset.chapter);
      syncHead(slide);
      if (label) label.textContent = labelText(slide);
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    };

    const show = (next, { hash = true, motion = 'auto' } = {}) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      const from = slides[index];
      const to = slides[clamped];
      if (clamped === index && to.classList.contains('is-active')) {
        syncChrome(to);
        return;
      }

      const dir = clamped > index ? 'is-forward' : 'is-back';
      const chapterChange = from.dataset.chapter !== to.dataset.chapter;
      const kind = motion === 'none'
        ? 'none'
        : (motion === 'chapter' || motion === 'fragment')
          ? motion
          : (chapterChange ? 'chapter' : 'fragment');
      const duration = kind === 'none' || !motionOk ? 0 : ANIM[kind];

      window.clearTimeout(animTimer);
      slides.forEach((slide) => clearMotion(slide));

      if (duration) {
        from.classList.remove('is-active');
        from.classList.add('is-exit', `is-exit-${kind}`, dir);
        from.setAttribute('aria-hidden', 'true');
        from.setAttribute('inert', '');
        to.classList.add('is-active', 'is-enter', `is-enter-${kind}`, dir);
        to.removeAttribute('inert');
        to.setAttribute('aria-hidden', 'false');
        animTimer = window.setTimeout(() => {
          clearMotion(from);
          clearMotion(to);
          to.classList.add('is-active');
        }, duration);
      } else {
        from.classList.remove('is-active');
        from.setAttribute('aria-hidden', 'true');
        from.setAttribute('inert', '');
        to.classList.add('is-active');
        to.removeAttribute('inert');
        to.setAttribute('aria-hidden', 'false');
      }

      index = clamped;
      to.querySelectorAll('.page-region, .table-wrap, .evidence-window').forEach((box) => {
        box.scrollTop = 0;
        box.scrollLeft = 0;
      });
      syncChrome(to);
      if (hash && to.id) history.replaceState(null, '', `#${to.id}`);
      document.dispatchEvent(new CustomEvent('seed:slidechange'));
      requestAnimationFrame(() => drawLineCharts(to));
    };

    const go = (delta) => {
      if (!delta || locked) return;
      const next = index + delta;
      if (next < 0 || next >= slides.length) return;
      locked = true;
      show(next);
      const chapterChange = slides[index].dataset.chapter !== slides[Math.max(0, index - delta)]?.dataset.chapter;
      window.setTimeout(() => { locked = false; }, chapterChange ? ANIM.chapter : ANIM.fragment);
    };

    const slideIndexForHash = (hash) => {
      const id = (hash || '').replace('#', '');
      if (!id) return 0;
      const el = document.getElementById(id);
      if (!el) {
        const byChapter = slides.findIndex((slide) => slide.dataset.chapter === id);
        return byChapter >= 0 ? byChapter : 0;
      }
      const slide = el.classList.contains('report-slide') ? el : el.closest('.report-slide');
      const found = slides.indexOf(slide);
      return found >= 0 ? found : 0;
    };

    const isBlankClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return false;
      if (document.documentElement.classList.contains('is-editing')) return false;
      if (target.closest('.theme-control, .document-nav, .report-pager, .report-chrome, .report-chrome-hotspot, a, button, input, select, textarea, label')) {
        return false;
      }
      if (target.closest('.is-chapter-cover, #cover')) {
        return true;
      }
      if (target.closest('img, figcaption, table, .table-wrap, .content[data-content="table"], .page-grid[data-slots="5"], .report-card, .highlight-item, .step, .callout, .bar-compare, .list-block, .media-switch__thumbs, .media-switch__panel, .media-switch__label, [data-lightbox-src], p, h2, h3, li')) {
        return false;
      }
      return Boolean(target.closest('.report-slide'));
    };

    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        event.preventDefault();
        show(slideIndexForHash(href), { motion: 'chapter' });
        link.blur();
      });
    });

    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor || anchor.closest('[data-component-id="navigation"]')) return;
      const href = anchor.getAttribute('href') || '';
      if (href.length < 2) return;
      const next = slideIndexForHash(href);
      if (document.getElementById(href.slice(1)) || slides[next]) {
        event.preventDefault();
        show(next);
      }
    });

    stage.addEventListener('click', (event) => {
      if (lightboxOpen()) return;
      if (!isBlankClick(event)) return;
      go(1);
    });

    prevBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      go(-1);
    });
    nextBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      go(1);
    });

    document.querySelectorAll('.page-grid[data-slots="5"]').forEach((grid) => {
      grid.addEventListener('wheel', (event) => {
        if (grid.scrollWidth <= grid.clientWidth + 1) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        const max = grid.scrollWidth - grid.clientWidth;
        const next = grid.scrollLeft + delta;
        if ((delta > 0 && grid.scrollLeft < max) || (delta < 0 && grid.scrollLeft > 0)) {
          event.preventDefault();
          grid.scrollLeft = Math.max(0, Math.min(max, next));
        }
      }, { passive: false });
    });

    document.addEventListener('keydown', (event) => {
      if (lightboxOpen()) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
      const strip = document.querySelector('.report-slide.is-active .page-grid[data-slots="5"]');
      if (strip && strip.scrollWidth > strip.clientWidth + 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const max = strip.scrollWidth - strip.clientWidth;
        const next = strip.scrollLeft + (event.key === 'ArrowRight' ? 320 : -320);
        if ((event.key === 'ArrowRight' && strip.scrollLeft < max - 1) || (event.key === 'ArrowLeft' && strip.scrollLeft > 1)) {
          event.preventDefault();
          strip.scrollLeft = Math.max(0, Math.min(max, next));
          return;
        }
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === 'Enter') {
        if (event.target.closest('button, a, summary')) return;
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === ' ' || event.key === 'Spacebar') {
        if (event.target.closest('button, a')) return;
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        show(0, { motion: 'chapter' });
      }
      if (event.key === 'End') {
        event.preventDefault();
        show(slides.length - 1, { motion: 'chapter' });
      }
    });

    window.addEventListener('hashchange', () => {
      show(slideIndexForHash(location.hash), { hash: false, motion: 'none' });
    });
    window.addEventListener('resize', () => {
      setChromeHeight();
      layoutAllEvidence();
      drawLineCharts();
    });

    setChromeHeight();
    show(slideIndexForHash(location.hash), { hash: false, motion: 'none' });
    return true;
  };

  const TEXT_SELECTORS = [
    '.section-header__title',
    '.section-header__part',
    '.report-cover h1',
    '.report-cover__lead',
    '.report-cover__kicker',
    '.chapter-cover__title',
    '.chapter-cover__subtitle',
    '.chapter-cover__lead',
    '.chapter-cover__kicker',
    '.chapter-cover__kind',
    '.chapter-cover__scope',
    '.chapter-cover__date',
    '.chapter-cover__author',
    '.callout strong',
    '.callout p',
    '.report-card__kicker',
    '.report-card__title',
    '.report-card__body',
    '.stat-value',
    '.list-row__label',
    '.list-row__text',
    '.step__title',
    '.step__body',
    '.data-table th',
    '.data-table td',
    '.bar-compare__title',
    '.bar-compare__label',
    '.bar-compare__value',
    '.bar-compare__note',
    '.content-col > strong',
    '.content-col > span',
    'figcaption b',
    'figcaption span',
    '.media-page__copy .eyebrow',
    '.media-page__copy h3',
    '.media-page__copy p',
    '.media-page__copy .media-meta',
    '.media-switch__panel h3',
    '.media-switch__panel p',
    '.report-notes h2',
    '.report-notes li',
    '.media-meta',
    '[data-deck-title]',
    '[data-deck-part]',
    '[data-deck-source]',
    '.report-source a',
    '.report-source [data-source-name]',
    '.formula__factor > b',
    '.formula__factor > span',
    '.formula__op',
    '.matrix__cell > strong',
    '.matrix__cell > p',
    '.matrix__axis',
    '.line-chart__legend li',
    '.line-chart__points span',
    '.line-chart__points b',
    '.venn__label',
  ].join(', ');

  const reportSlug = () => {
    const parts = location.pathname.replace(/\/index\.html?$/, '').split('/').filter(Boolean);
    return parts[parts.length - 1] || 'report';
  };

  const openEditDb = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('seed-report-edit', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const idbGet = (store, key) => openEditDb().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));

  const idbSet = (store, key, value) => openEditDb().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));

  const emptyState = () => ({
    texts: {},
    images: {},
    blocks: {},
    sources: {},
    history: [],
    cursor: -1,
    exportedSig: '',
    nextVersion: 2,
  });

  const fieldSig = (state) => JSON.stringify({ texts: state.texts, images: state.images, blocks: state.blocks, sources: state.sources });

  const GRID_MAX = 8;
  const STACK_GRID_MAX = 4;

  const columnsForGrid = (parent, count) => {
    if (parent.closest('[data-media-page="stack"]')) return String(Math.min(count, STACK_GRID_MAX));
    if (count <= 3) return String(count);
    if (count === 4) return '2';
    if (count <= 6) return '3';
    return '4';
  };

  const maxItemsOf = (parent) => {
    if (parent.matches('.card-grid')) {
      if (parent.closest('[data-media-page="stack"]')) return STACK_GRID_MAX;
      if (parent.matches('.is-highlight') && parent.closest('[data-media-page="split"]')) return 6;
      return GRID_MAX;
    }
    if (parent.matches('.formula')) return 5;
    if (parent.matches('.venn')) return 3;
    if (parent.matches('.matrix')) return 4;
    return 24;
  };

  const drawLineCharts = (root = document) => {
    (root.matches?.('.line-chart') ? [root] : [...root.querySelectorAll('.line-chart')]).forEach((chart) => {
      const svg = chart.querySelector('.line-chart__plot');
      if (!svg) return;
      const rows = [...chart.querySelectorAll('.line-chart__points li')];
      const keys = [...new Set(rows.flatMap((row) => (
        [...row.querySelectorAll('[data-chart-series]')].map((node) => node.dataset.chartSeries || 'a')
      )))];
      const valuesOf = (key) => rows.map((row) => {
        const node = row.querySelector(`[data-chart-series="${key}"]`);
        return Number(String(node?.textContent || '').replace(/[^\d.-]/g, '')) || 0;
      });
      const all = keys.flatMap(valuesOf);
      const rawMax = Math.max(1, ...all);
      const niceStep = (value) => {
        const pow = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
        const n = value / pow;
        return (n <= 1.5 ? 1 : n <= 3 ? 2 : n <= 7 ? 5 : 10) * pow;
      };
      const tickStep = niceStep(rawMax / 4);
      const max = Math.ceil(rawMax / tickStep) * tickStep;
      const ticks = [];
      for (let value = 0; value <= max + tickStep / 2; value += tickStep) ticks.push(value);
      const w = 640;
      const h = 280;
      const pad = { l: 52, r: 16, t: 18, b: 14 };
      const xAt = (i, n) => pad.l + (n <= 1 ? (w - pad.l - pad.r) / 2 : i * (w - pad.l - pad.r) / (n - 1));
      const yAt = (value) => h - pad.b - (value / max) * (h - pad.t - pad.b);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.replaceChildren();
      const ns = 'http://www.w3.org/2000/svg';
      const add = (name, attrs, text) => {
        const node = document.createElementNS(ns, name);
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
        if (text != null) node.textContent = text;
        svg.appendChild(node);
        return node;
      };
      ticks.forEach((value) => {
        const y = yAt(value);
        add('line', { class: 'line-chart__grid', x1: pad.l, y1: y, x2: w - pad.r, y2: y });
        add('text', {
          class: 'line-chart__axis',
          x: String(pad.l - 8),
          y: String(y + 4),
          'text-anchor': 'end',
        }, Number.isInteger(value) ? String(value) : String(value));
      });
      add('line', { class: 'line-chart__grid', x1: pad.l, y1: pad.t, x2: pad.l, y2: h - pad.b });
      keys.forEach((key) => {
        const vals = valuesOf(key);
        const pts = vals.map((value, i) => `${xAt(i, vals.length).toFixed(2)},${yAt(value).toFixed(2)}`).join(' ');
        add('polyline', { class: 'line-chart__series', 'data-series': key, points: pts });
        vals.forEach((value, i) => {
          add('circle', {
            class: 'line-chart__dot',
            'data-series': key,
            cx: xAt(i, vals.length).toFixed(2),
            cy: yAt(value).toFixed(2),
            r: '5',
          });
        });
      });
      const list = chart.querySelector('.line-chart__points');
      const placeLabels = () => {
        if (!list) return;
        const svgRect = svg.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const ctm = svg.getScreenCTM?.();
        if (ctm && listRect.width > 1) {
          rows.forEach((row, i) => {
            const pt = svg.createSVGPoint();
            pt.x = xAt(i, rows.length);
            pt.y = 0;
            row.style.left = `${pt.matrixTransform(ctm).x - listRect.left}px`;
          });
          return;
        }
        const scale = Math.min(svgRect.width / w, svgRect.height / h) || 1;
        const originX = (svgRect.width - w * scale) / 2;
        rows.forEach((row, i) => {
          row.style.left = `${originX + xAt(i, rows.length) * scale}px`;
        });
      };
      placeLabels();
      requestAnimationFrame(placeLabels);
    });
  };

  const syncItemLayout = (parent) => {
    if (!parent) return;
    const count = parent.querySelectorAll(itemSelector(parent)).length;
    parent.setAttribute('data-item-count', String(count));
    parent.classList.toggle('is-stacked', count > 5);
    if (parent.matches('.card-grid')) {
      parent.style.setProperty('--component-columns', columnsForGrid(parent, count));
    }
    if (parent.matches('.line-chart')) drawLineCharts(parent);
  };

  const ADDABLE_PARENTS = '.card-grid, .list-block, .steps, .bar-compare, .table-wrap, .evidence-gallery, .line-chart, .content-cols';
  const ADDABLE_ITEMS = '.report-card, .list-row, .step, .bar-compare__item, tbody tr, .evidence-figure, .line-chart__points li, .content-col';

  const COPY_REGION = '[data-media-page] > [data-slot="copy"]';

  const canAddTo = (parent) => {
    if (!parent) return false;
    if (parent.closest('.callout, .media-page__copy')) return false;
    if (parent.getAttribute('data-image-kind') === 'strip') return false;
    return parent.matches(ADDABLE_PARENTS);
  };

  const parentFromEvent = (event) => {
    const node = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!node) return { parent: null, item: null };
    const item = node.closest(ADDABLE_ITEMS);
    let parent = item?.closest(ADDABLE_PARENTS) || node.closest(ADDABLE_PARENTS);
    if (!parent) {
      const region = node.closest(`${COPY_REGION}, .page-region`);
      const found = [...(region?.querySelectorAll(ADDABLE_PARENTS) || [])].filter(canAddTo);
      if (found.length === 1) parent = found[0];
    }
    if (!parent || !canAddTo(parent)) return { parent: null, item: null };
    return { parent, item: item && parent.contains(item) ? item : null };
  };

  const itemSelector = (parent) => {
    if (parent.matches('.card-grid')) return ':scope > .report-card';
    if (parent.matches('.list-block')) return ':scope > .list-row';
    if (parent.matches('.steps')) return ':scope > .step';
    if (parent.matches('.bar-compare')) return ':scope > .bar-compare__item';
    if (parent.matches('.table-wrap')) return ':scope tbody tr';
    if (parent.matches('.evidence-gallery')) return ':scope > .evidence-figure';
    if (parent.matches('.line-chart')) return ':scope .line-chart__points li';
    if (parent.matches('.content-cols')) return ':scope > .content-col';
    return ADDABLE_ITEMS;
  };

  const blockKeyOf = (parent) => {
    const slide = parent.closest('.report-slide');
    const id = slide?.dataset.slide || slide?.id || 'page';
    const type = [...parent.classList].find((name) => (
      ['card-grid', 'list-block', 'steps', 'bar-compare', 'table-wrap', 'evidence-gallery', 'line-chart', 'content-cols'].includes(name)
    )) || 'block';
    return `${id}::${type}`;
  };

  const clearClone = (clone) => {
    clone.querySelectorAll(TEXT_SELECTORS).forEach((node) => {
      if (node.classList.contains('stat-value')) node.textContent = '0';
      else if (node.classList.contains('step__index')) return;
      else node.textContent = '新条目';
    });
    clone.querySelectorAll('img').forEach((img) => {
      img.removeAttribute('src');
      img.alt = '';
    });
    clone.querySelectorAll('.evidence-window').forEach((win) => {
      if (!win.querySelector('img')) win.textContent = 'IMAGE';
    });
    return clone;
  };

  const renumberSteps = (parent) => {
    [...parent.querySelectorAll(':scope > .step .step__index')].forEach((node, i) => {
      node.textContent = String(i + 1).padStart(2, '0');
    });
  };

  const collectTextNodes = (root) => [...root.querySelectorAll(TEXT_SELECTORS)].filter((node) => {
    if (node.closest('.theme-control, .report-chrome, .document-nav, .report-pager')) return false;
    if (node.matches('[data-deck-title], [data-deck-part], [data-deck-source], .section-header__part')) return true;
    if (node.hidden || node.getAttribute('hidden') !== null) return false;
    return true;
  });

  const collectImages = (root) => [...root.querySelectorAll('img')].filter((node) => (
    !node.closest('.theme-control, .report-chrome, .document-nav, .report-pager')
  ));

  const slideOf = (node) => node.closest('.report-slide') || document.querySelector('.report-slide.is-active');

  const fieldKey = (node, kind, index) => {
    const slide = slideOf(node);
    const id = slide?.dataset.slide || slide?.id || 'page';
    if (node.matches?.('[data-deck-title]')) return `${id}::title`;
    if (node.matches?.('[data-deck-part]')) return `${id}::part`;
    if (node.matches?.('[data-deck-source]')) return `${id}::source`;
    if (node.classList?.contains('section-header__title')) return `${id}::title`;
    if (node.classList?.contains('section-header__part')) return `${id}::part`;
    return `${id}::${kind}:${index}`;
  };

  const applyText = (node, value) => {
    if (node.classList.contains('stat-value')) {
      node.dataset.statSymbols = '';
      node.textContent = value;
      return;
    }
    node.textContent = value;
  };

  const syncPairedTitle = (node, value) => {
    const slide = slideOf(node) || document.querySelector('.report-slide.is-active');
    if (!slide) return;
    if (node.matches('[data-deck-title]') || node.classList.contains('section-header__title')) {
      slide.querySelectorAll('.section-header__title, [data-deck-title]').forEach((el) => {
        if (el !== node) el.textContent = value;
      });
      const head = document.querySelector('[data-deck-title]');
      if (head && head !== node) head.textContent = value;
    }
    if (node.matches('[data-deck-part]') || node.classList.contains('section-header__part')) {
      slide.querySelectorAll('.section-header__part, [data-deck-part]').forEach((el) => {
        if (el !== node) {
          el.textContent = value;
          el.hidden = !value;
        }
      });
      const head = document.querySelector('[data-deck-part]');
      if (head && head !== node) {
        head.textContent = value;
        head.hidden = !value;
      }
    }
    if (node.matches('[data-deck-source]')) {
      const foot = document.querySelector('[data-deck-source]');
      if (foot && foot !== node) foot.textContent = value;
    }
  };

  const mountReportEditor = () => {
    const chrome = document.querySelector('[data-report-chrome]');
    const spot = document.querySelector('.report-chrome-hotspot');
    const stage = document.querySelector('[data-report-stage]');
    if (!chrome || !stage) return;

    const slug = reportSlug();
    const hasReportFile = !/editorial-default|states-demo/.test(location.pathname);
    const objectUrls = new Map();
    const originals = { texts: {}, images: {} };
    const originalBlocks = {};
    let state = emptyState();
    let reportSource = '';
    let justExited = false;
    let typingTimer = 0;
    let typingKey = '';
    let fileInput = null;

    const actions = document.createElement('div');
    actions.className = 'report-chrome__edit';
    actions.innerHTML = [
      '<button class="button subtle" type="button" data-edit-export hidden>更新文档</button>',
      '<button class="button primary" type="button" data-edit-enter hidden>编辑</button>',
      '<button class="button primary" type="button" data-edit-done hidden>完成</button>',
      '<div class="report-edit-ask" data-edit-ask><span>是否更新文档？</span><button class="button primary" type="button" data-edit-yes>是</button><button class="button subtle" type="button" data-edit-no>否</button></div>',
    ].join('');
    chrome.appendChild(actions);
    const enterBtn = actions.querySelector('[data-edit-enter]');
    const doneBtn = actions.querySelector('[data-edit-done]');
    const exportBtn = actions.querySelector('[data-edit-export]');

    const menu = document.createElement('div');
    menu.className = 'report-edit-menu';
    menu.hidden = true;
    menu.innerHTML = [
      '<button class="button subtle" type="button" data-edit-add-item>添加</button>',
      '<button class="button subtle" type="button" data-edit-remove-item>删除</button>',
      '<button class="button subtle" type="button" data-edit-add-source>添加来源</button>',
      '<button class="button subtle" type="button" data-edit-remove-source>删除来源</button>',
    ].join('');
    document.body.appendChild(menu);
    let menuTarget = null;

    const hideMenu = () => {
      menu.hidden = true;
      menuTarget = null;
    };

    const sourceOf = (slide) => slide?.querySelector('[data-report-source], .report-source');
    const sourceNameOf = (host) => host?.querySelector('a, [data-source-name]');
    const SOURCE_LABEL = '数据来源';
    const SOURCE_PLACEHOLDER = '填写出处';

    const setSourceName = (host, value) => {
      const clean = String(value || '').replace(/^(数据来源|来源：)\s*/, '').trim();
      if (!clean) {
        host.remove();
        return;
      }
      let nameEl = sourceNameOf(host);
      if (!nameEl) {
        nameEl = document.createElement('a');
        nameEl.href = '#';
        nameEl.target = '_blank';
        nameEl.rel = 'noopener noreferrer';
        host.replaceChildren(document.createTextNode(`${SOURCE_LABEL} `), nameEl);
      }
      nameEl.textContent = clean;
    };

    const placeSource = (slide) => {
      const node = document.createElement('p');
      node.className = 'report-source';
      node.dataset.reportSource = '';
      const link = document.createElement('a');
      link.href = '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = SOURCE_PLACEHOLDER;
      node.append(`${SOURCE_LABEL} `, link);
      const stackCopy = slide.querySelector('[data-media-page="stack"] > [data-slot="copy"]');
      if (stackCopy) stackCopy.appendChild(node);
      else {
        const cell = slide.querySelector('.grid-cell');
        if (cell) cell.appendChild(node);
        else {
          const full = slide.querySelector('.full-page');
          if (full) full.appendChild(node);
          else slide.querySelector('.page-regions')?.after(node);
        }
      }
      return node;
    };

    const addSource = (slide) => {
      if (!slide?.classList.contains('report-section') || sourceOf(slide)) return;
      const id = slide.dataset.slide || slide.id;
      placeSource(slide);
      state.sources[id] = SOURCE_PLACEHOLDER;
      bindKeys();
      enableEditing();
      pushHistory();
      persist();
      refreshButtons();
    };

    const removeSource = (slide) => {
      const node = sourceOf(slide);
      if (!node) return;
      const id = slide.dataset.slide || slide.id;
      node.remove();
      state.sources[id] = '';
      if (id) delete state.texts[`${id}::source`];
      bindKeys();
      enableEditing();
      pushHistory();
      persist();
      refreshButtons();
    };

    const applySources = () => {
      document.querySelectorAll('.report-section.report-slide').forEach((slide) => {
        const id = slide.dataset.slide || slide.id;
        if (!id || !Object.prototype.hasOwnProperty.call(state.sources || {}, id)) return;
        const value = state.sources[id];
        let node = sourceOf(slide);
        if (!value) {
          node?.remove();
          return;
        }
        if (!node) node = placeSource(slide);
        setSourceName(node, value);
      });
    };

    const showMenu = (event, target) => {
      menuTarget = target;
      const slide = target.slide;
      const canAdd = target.parent && canAddTo(target.parent);
      const items = canAdd ? [...target.parent.querySelectorAll(itemSelector(target.parent))] : [];
      const atMax = canAdd && items.length >= maxItemsOf(target.parent);
      menu.querySelector('[data-edit-add-item]').hidden = !canAdd || atMax;
      menu.querySelector('[data-edit-remove-item]').hidden = !canAdd || !target.item || items.length <= 1;
      menu.querySelector('[data-edit-add-source]').hidden = !slide?.classList.contains('report-section') || Boolean(sourceOf(slide));
      menu.querySelector('[data-edit-remove-source]').hidden = !sourceOf(slide);
      if ([...menu.querySelectorAll('button')].every((btn) => btn.hidden)) return;
      menu.hidden = false;
      const box = menu.getBoundingClientRect();
      const pad = 8;
      menu.style.left = `${Math.max(pad, Math.min(event.clientX, window.innerWidth - box.width - pad))}px`;
      menu.style.top = `${Math.max(pad, Math.min(event.clientY, window.innerHeight - box.height - pad))}px`;
    };

    const isEditing = () => document.documentElement.classList.contains('is-editing');
    const isDirty = () => fieldSig(state) !== state.exportedSig;

    const refreshButtons = () => {
      const editing = isEditing();
      const asking = document.documentElement.classList.contains('is-asking');
      enterBtn.hidden = editing || asking;
      doneBtn.hidden = !editing || asking;
      exportBtn.hidden = editing || asking || !hasReportFile || !isDirty();
    };

    const persist = async () => {
      const payload = {
        texts: state.texts,
        images: state.images,
        blocks: state.blocks,
        sources: state.sources,
        history: state.history,
        cursor: state.cursor,
        exportedSig: state.exportedSig,
        nextVersion: state.nextVersion,
      };
      await idbSet('state', slug, payload);
    };

    const snapshot = () => ({
      texts: { ...state.texts },
      images: { ...state.images },
      blocks: { ...state.blocks },
      sources: { ...state.sources },
    });

    const pushHistory = () => {
      const next = snapshot();
      const current = state.history[state.cursor];
      if (current && JSON.stringify(current) === JSON.stringify(next)) return;
      state.history = state.history.slice(0, state.cursor + 1);
      state.history.push(next);
      if (state.history.length > 100) state.history.shift();
      state.cursor = state.history.length - 1;
    };

    const textNodes = () => collectTextNodes(document);
    const imageNodes = () => collectImages(document);

    const indexNodes = (nodes, kind) => {
      const seen = new Map();
      return nodes.map((node) => {
        const slide = slideOf(node);
        const base = slide?.dataset.slide || slide?.id || 'page';
        const n = (seen.get(base) || 0);
        seen.set(base, n + 1);
        const key = kind === 'text' && (node.classList.contains('section-header__title') || node.matches('[data-deck-title]'))
          ? `${base}::title`
          : kind === 'text' && (node.classList.contains('section-header__part') || node.matches('[data-deck-part]'))
            ? `${base}::part`
            : kind === 'text' && node.matches('[data-deck-source]')
              ? `${base}::source`
              : `${base}::${kind}:${n}`;
        return { node, key };
      });
    };

    const bindKeys = () => {
      indexNodes(textNodes(), 'text').forEach(({ node, key }) => {
        node.dataset.editKey = key;
        if (!(key in originals.texts)) originals.texts[key] = node.textContent;
      });
      indexNodes(imageNodes(), 'img').forEach(({ node, key }) => {
        node.dataset.editKey = key;
        if (!(key in originals.images)) {
          originals.images[key] = { src: node.getAttribute('src') || '', name: (node.getAttribute('src') || '').split('/').pop() };
        }
      });
    };

    const currentValue = (key) => {
      if (key in state.texts) return state.texts[key];
      return originals.texts[key] ?? '';
    };

    const readBlock = (parent) => ({
      html: parent.innerHTML,
      itemCount: parent.getAttribute('data-item-count') || '',
    });

    const writeBlock = (parent, rec) => {
      if (!parent || rec == null) return;
      const html = typeof rec === 'string' ? rec : rec.html;
      const itemCount = typeof rec === 'string' ? null : rec.itemCount;
      if (html != null) parent.innerHTML = html;
      if (itemCount) parent.setAttribute('data-item-count', itemCount);
      else if (itemCount === '') parent.removeAttribute('data-item-count');
    };

    const captureOriginalBlocks = () => {
      document.querySelectorAll(ADDABLE_PARENTS).forEach((parent) => {
        if (!canAddTo(parent)) return;
        const key = blockKeyOf(parent);
        if (!(key in originalBlocks)) originalBlocks[key] = readBlock(parent);
      });
    };

    const applyBlocks = () => {
      const keys = new Set([
        ...Object.keys(originalBlocks),
        ...Object.keys(state.blocks || {}),
      ]);
      keys.forEach((key) => {
        const [slideId, type] = key.split('::');
        const slide = document.querySelector(`.report-slide[data-slide="${slideId}"]`);
        const parent = slide?.querySelector(`.${type}`);
        if (!parent) return;
        const rec = Object.prototype.hasOwnProperty.call(state.blocks || {}, key)
          ? state.blocks[key]
          : originalBlocks[key];
        writeBlock(parent, rec);
      });
      mountMediaSwitch();
    };

    const persistBlock = (parent) => {
      if (!parent || !canAddTo(parent)) return;
      state.blocks[blockKeyOf(parent)] = readBlock(parent);
    };

    const inAddable = (node) => {
      const parent = node.closest(ADDABLE_PARENTS);
      return Boolean(parent && canAddTo(parent));
    };

    const applyStateToDom = async () => {
      applyBlocks();
      applySources();
      document.querySelectorAll(ADDABLE_PARENTS).forEach(syncItemLayout);
      bindKeys();
      indexNodes(textNodes(), 'text').forEach(({ node, key }) => {
        if (inAddable(node)) return;
        const value = currentValue(key);
        if (value !== undefined && node.textContent !== value) {
          applyText(node, value);
          syncPairedTitle(node, value);
        }
      });
      const imgs = indexNodes(imageNodes(), 'img');
      for (const { node, key } of imgs) {
        if (inAddable(node)) continue;
        const rec = state.images[key];
        if (!rec) {
          const orig = originals.images[key];
          if (orig?.src && node.getAttribute('src') !== orig.src) node.src = orig.src;
          continue;
        }
        const blob = await idbGet('blobs', `${slug}::${key}`);
        if (blob instanceof Blob) {
          const prev = objectUrls.get(key);
          if (prev) URL.revokeObjectURL(prev);
          const url = URL.createObjectURL(blob);
          objectUrls.set(key, url);
          node.src = url;
          if (node.hasAttribute('data-src')) node.setAttribute('data-src', url);
          const main = node.closest('.media-switch')?.querySelector('[data-media-main]');
          if (node.classList.contains('media-switch__thumb') && main?.tagName === 'IMG' && node.classList.contains('is-active')) {
            main.src = url;
          }
        }
      }
    };

    const commitText = (key, value, { history = true } = {}) => {
      if (originals.texts[key] === value) {
        if (key in state.texts) delete state.texts[key];
      } else {
        state.texts[key] = value;
      }
      const node = document.querySelector(`[data-edit-key="${CSS.escape(key)}"]`);
      const parent = node?.closest(ADDABLE_PARENTS);
      if (parent && canAddTo(parent)) persistBlock(parent);
      if (key.endsWith('::source')) {
        const slideId = key.split('::')[0];
        state.sources[slideId] = value;
      }
      if (history) pushHistory();
      persist();
      refreshButtons();
    };

    const enableEditing = () => {
      bindKeys();
      const part = document.querySelector('[data-deck-part]');
      if (part) part.hidden = false;
      document.querySelectorAll('.report-slide.is-active .section-header__part').forEach((node) => {
        node.hidden = false;
      });
      indexNodes(textNodes(), 'text').forEach(({ node }) => {
        node.setAttribute('data-edit-text', '');
        node.contentEditable = 'true';
        node.spellcheck = false;
      });
      document.querySelectorAll('.evidence-figure:not(.media-switch)').forEach((node) => {
        if (node.closest('[data-image-kind="strip"]')) return;
        node.setAttribute('data-edit-frame', '');
      });
      document.querySelectorAll(ADDABLE_PARENTS).forEach((parent) => {
        if (!canAddTo(parent)) return;
        parent.setAttribute('data-edit-add', '');
        parent.querySelectorAll(itemSelector(parent)).forEach((item) => {
          item.setAttribute('data-edit-item', '');
          item.draggable = true;
        });
      });
      document.querySelectorAll(COPY_REGION).forEach((region) => {
        const found = [...region.querySelectorAll(ADDABLE_PARENTS)].filter(canAddTo);
        if (found.length === 1) region.setAttribute('data-edit-add', '');
      });
    };

    const disableEditing = () => {
      document.querySelectorAll('[data-edit-text]').forEach((node) => {
        node.removeAttribute('contenteditable');
        node.removeAttribute('data-edit-text');
      });
      document.querySelectorAll('[data-edit-frame]').forEach((node) => {
        node.removeAttribute('data-edit-frame');
        node.classList.remove('is-picked');
      });
      document.querySelectorAll('[data-edit-item]').forEach((node) => {
        node.removeAttribute('data-edit-item');
        node.removeAttribute('draggable');
      });
      document.querySelectorAll('[data-edit-add]').forEach((node) => {
        node.removeAttribute('data-edit-add');
      });
      const part = document.querySelector('[data-deck-part]');
      if (part && !part.textContent.trim()) part.hidden = true;
    };

    const enterEdit = () => {
      if (isEditing()) return;
      document.documentElement.classList.add('is-editing');
      document.documentElement.classList.remove('is-asking');
      enableEditing();
      refreshButtons();
    };

    const exitEdit = () => {
      document.documentElement.classList.remove('is-editing', 'is-asking');
      disableEditing();
      hideMenu();
      justExited = true;
      refreshButtons();
    };

    const loadReportSource = async () => {
      if (reportSource) return reportSource;
      try {
        const res = await fetch('report.md', { cache: 'no-store' });
        if (res.ok) {
          reportSource = await res.text();
          return reportSource;
        }
      } catch (_) { /* file:// */ }
      return new Promise((resolve) => {
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = '.md,text/markdown';
        picker.addEventListener('change', async () => {
          const file = picker.files?.[0];
          reportSource = file ? await file.text() : '';
          resolve(reportSource);
        });
        picker.click();
      });
    };

    const patchMarkdown = (md) => {
      const groups = {};
      Object.entries(state.texts).forEach(([key, value]) => {
        const [slide, slot] = key.split('::');
        groups[slide] ||= { title: null, part: null, texts: [] };
        if (slot === 'title') groups[slide].title = value;
        else if (slot === 'part') groups[slide].part = value;
        else groups[slide].texts.push(value);
      });
      Object.entries(state.images).forEach(([key, rec]) => {
        const slide = key.split('::')[0];
        groups[slide] ||= { title: null, part: null, texts: [], images: [] };
        groups[slide].images ||= [];
        groups[slide].images.push(rec.name);
      });
      return md.replace(/(^#{2,3}[^\n]*\n)([\s\S]*?)(?=^#{2,3} |\s*$)/gm, (full, heading, body) => {
        const token = heading.replace(/^#{2,3}\s+/, '').trim().split(/[\s·]/)[0];
        const group = groups[token];
        if (!group) return full;
        let next = body;
        if (group.title != null) {
          next = next.replace(/(`__title`：).*/, `$1${group.title}`);
        }
        if (group.part != null) {
          if (/`__part`：/.test(next)) next = next.replace(/(`__part`：).*/, `$1${group.part}`);
          else next = next.replace(/(正文：)/, `\`__part\`：${group.part}\n$1`);
        }
        if (group.texts?.length && /正文：/.test(next)) {
          const lines = next.split('\n');
          let i = 0;
          const out = lines.map((line) => {
            if (!/^\s*-\s+/.test(line) || i >= group.texts.length) return line;
            const indent = line.match(/^\s*/)[0];
            const value = group.texts[i];
            i += 1;
            return `${indent}- ${value}`;
          });
          next = out.join('\n');
        }
        if (group.images?.length && /图：/.test(next)) {
          let i = 0;
          next = next.replace(/(^\s*-\s+`)([^`]+)(`)/gm, (m, a, path, c) => {
            if (i >= group.images.length) return m;
            const name = group.images[i];
            i += 1;
            const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : 'assets/';
            return `${a}${dir}${name}${c}`;
          });
        }
        return heading + next;
      });
    };

    const exportReport = async () => {
      if (!hasReportFile) return;
      const source = await loadReportSource();
      if (!source) return;
      const md = patchMarkdown(source);
      const version = state.nextVersion || 2;
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report-v${version}.md`;
      link.click();
      URL.revokeObjectURL(link.href);
      state.nextVersion = version + 1;
      state.exportedSig = fieldSig(state);
      await persist();
      refreshButtons();
    };

    const undo = async () => {
      if (state.cursor <= 0) return;
      state.cursor -= 1;
      const snap = state.history[state.cursor];
      state.texts = { ...snap.texts };
      state.images = { ...snap.images };
      state.blocks = { ...(snap.blocks || {}) };
      state.sources = { ...(snap.sources || {}) };
      await applyStateToDom();
      if (isEditing()) enableEditing();
      persist();
      refreshButtons();
    };

    const redo = async () => {
      if (state.cursor >= state.history.length - 1) return;
      state.cursor += 1;
      const snap = state.history[state.cursor];
      state.texts = { ...snap.texts };
      state.images = { ...snap.images };
      state.blocks = { ...(snap.blocks || {}) };
      state.sources = { ...(snap.sources || {}) };
      await applyStateToDom();
      if (isEditing()) enableEditing();
      persist();
      refreshButtons();
    };

    const addItem = (parent) => {
      const sel = itemSelector(parent);
      const items = [...parent.querySelectorAll(sel)];
      const last = items[items.length - 1];
      if (!last || items.length >= maxItemsOf(parent)) return;
      const clone = clearClone(last.cloneNode(true));
      last.after(clone);
      if (parent.matches('.steps')) renumberSteps(parent);
      syncItemLayout(parent);
      persistBlock(parent);
      bindKeys();
      enableEditing();
      pushHistory();
      persist();
      refreshButtons();
    };

    const removeItem = (parent, item) => {
      const items = [...parent.querySelectorAll(itemSelector(parent))];
      if (!item || items.length <= 1 || !parent.contains(item)) return;
      item.remove();
      if (parent.matches('.steps')) renumberSteps(parent);
      syncItemLayout(parent);
      persistBlock(parent);
      bindKeys();
      enableEditing();
      pushHistory();
      persist();
      refreshButtons();
    };

    const pickImage = (img) => {
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.hidden = true;
        document.body.appendChild(fileInput);
      }
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        const key = img.dataset.editKey;
        if (!key) return;
        await idbSet('blobs', `${slug}::${key}`, file);
        state.images[key] = { name: file.name, type: file.type };
        const prev = objectUrls.get(key);
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(file);
        objectUrls.set(key, url);
        img.src = url;
        if (img.hasAttribute('data-src')) img.setAttribute('data-src', url);
        const thumb = img.closest('.media-switch__thumb');
        const main = img.closest('.media-switch')?.querySelector('[data-media-main]');
        if (thumb) {
          thumb.setAttribute('data-src', url);
          if (file.name) thumb.setAttribute('data-alt', file.name);
          if (thumb.classList.contains('is-active') && main?.tagName === 'IMG') {
            main.src = url;
            if (main.dataset.editKey) {
              state.images[main.dataset.editKey] = { name: file.name, type: file.type };
              await idbSet('blobs', `${slug}::${main.dataset.editKey}`, file);
            }
          }
        } else if (img.classList.contains('media-switch__thumb') && main?.tagName === 'IMG') {
          main.src = url;
        }
        const parent = img.closest(ADDABLE_PARENTS);
        if (parent && canAddTo(parent)) persistBlock(parent);
        pushHistory();
        persist();
        refreshButtons();
      };
      fileInput.click();
    };

    chrome.addEventListener('click', (event) => {
      if (event.target.closest('[data-edit-enter]')) {
        event.preventDefault();
        enterEdit();
        return;
      }
      if (event.target.closest('[data-edit-done]')) {
        event.preventDefault();
        if (hasReportFile && isDirty()) {
          document.documentElement.classList.add('is-asking');
          refreshButtons();
        } else {
          exitEdit();
        }
        return;
      }
      if (event.target.closest('[data-edit-yes]')) {
        event.preventDefault();
        exportReport().finally(exitEdit);
        return;
      }
      if (event.target.closest('[data-edit-no]')) {
        event.preventDefault();
        exitEdit();
        return;
      }
      if (event.target.closest('[data-edit-export]')) {
        event.preventDefault();
        exportReport();
      }
    });

    chrome.addEventListener('mouseleave', () => {
      justExited = false;
    });
    spot?.addEventListener('mouseleave', () => {
      if (!chrome.matches(':hover')) justExited = false;
    });

    document.addEventListener('input', (event) => {
      if (!isEditing()) return;
      const node = event.target.closest?.('[data-edit-text]');
      if (!node) return;
      const key = node.dataset.editKey;
      if (!key) return;
      syncPairedTitle(node, node.textContent);
      window.clearTimeout(typingTimer);
      typingKey = key;
      typingTimer = window.setTimeout(() => {
        commitText(key, node.textContent);
        typingKey = '';
      }, 400);
    });

    document.addEventListener('focusout', (event) => {
      const node = event.target.closest?.('[data-edit-text]');
      if (!node || !isEditing()) return;
      const key = node.dataset.editKey;
      if (!key) return;
      window.clearTimeout(typingTimer);
      commitText(key, node.textContent, { history: typingKey === key || !typingKey });
      typingKey = '';
    });

    document.addEventListener('click', (event) => {
      if (!isEditing()) return;
      if (event.target.closest('.report-source a')) event.preventDefault();
      if (event.target.closest('.report-chrome, .document-nav, .theme-control, .report-pager, .report-edit-menu')) return;
      const thumb = event.target.closest('.media-switch__thumb');
      if (thumb) {
        event.preventDefault();
        event.stopPropagation();
        const img = thumb.querySelector('img');
        if (img) pickImage(img);
        return;
      }
      if (event.target.closest('.media-switch, .media-switch__panel, .media-switch__label, img, figcaption, [data-edit-text]')) return;
      const frame = event.target.closest('[data-edit-frame]');
      if (!frame) return;
      event.preventDefault();
      event.stopPropagation();
      document.querySelectorAll('[data-edit-frame].is-picked').forEach((node) => node.classList.remove('is-picked'));
      frame.classList.add('is-picked');
      const img = frame.querySelector('img[data-media-main], .evidence-window img, img');
      if (img) pickImage(img);
    }, true);

    document.addEventListener('contextmenu', (event) => {
      if (!isEditing()) return;
      const node = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!node || node.closest('.report-chrome, .document-nav, .theme-control, .report-pager, .report-edit-menu')) return;
      const slide = node.closest('.report-section.report-slide');
      if (!slide) return;
      const target = parentFromEvent(event);
      event.preventDefault();
      showMenu(event, { ...target, slide });
    });

    menu.addEventListener('click', (event) => {
      if (!menuTarget) return;
      if (event.target.closest('[data-edit-add-item]') && menuTarget.parent) addItem(menuTarget.parent);
      if (event.target.closest('[data-edit-remove-item]') && menuTarget.item && menuTarget.parent) {
        removeItem(menuTarget.parent, menuTarget.item);
      }
      if (event.target.closest('[data-edit-add-source]')) addSource(menuTarget.slide);
      if (event.target.closest('[data-edit-remove-source]')) removeSource(menuTarget.slide);
      hideMenu();
    });

    document.addEventListener('pointerdown', (event) => {
      if (menu.hidden || event.target.closest('.report-edit-menu')) return;
      hideMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hideMenu();
    });

    let dragItem = null;
    document.addEventListener('dragstart', (event) => {
      if (!isEditing()) return;
      if (event.target.closest('[data-edit-text]')) {
        event.preventDefault();
        return;
      }
      const item = event.target.closest('[data-edit-item]');
      if (!item) return;
      dragItem = item;
      event.dataTransfer.effectAllowed = 'move';
    });
    document.addEventListener('dragover', (event) => {
      if (!dragItem) return;
      event.preventDefault();
    });
    document.addEventListener('drop', (event) => {
      if (!dragItem) return;
      event.preventDefault();
      const over = event.target.closest('[data-edit-item]');
      const parent = dragItem.closest(ADDABLE_PARENTS);
      if (over && parent && parent.contains(over) && over !== dragItem) {
        const items = [...parent.querySelectorAll(itemSelector(parent))];
        if (items.indexOf(dragItem) < items.indexOf(over)) over.after(dragItem);
        else over.before(dragItem);
        if (parent.matches('.steps')) renumberSteps(parent);
        syncItemLayout(parent);
        persistBlock(parent);
        bindKeys();
        pushHistory();
        persist();
      }
      dragItem = null;
    });
    document.addEventListener('dragend', () => { dragItem = null; });

    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      const undoKey = (event.metaKey || event.ctrlKey) && key === 'z' && !event.shiftKey && !event.altKey;
      const redoKey = (event.metaKey || event.ctrlKey) && ((key === 'z' && event.shiftKey) || key === 'y');
      if (!undoKey && !redoKey) return;
      event.preventDefault();
      if (typingKey) {
        const node = document.activeElement?.closest?.('[data-edit-text]');
        if (node) commitText(node.dataset.editKey, node.textContent);
        typingKey = '';
      }
      if (undoKey) undo();
      else redo();
    }, true);

    const refreshEditSurface = () => {
      hideMenu();
      bindKeys();
      if (isEditing()) enableEditing();
    };
    window.addEventListener('hashchange', refreshEditSurface);
    document.addEventListener('seed:slidechange', refreshEditSurface);

    idbGet('state', slug).then(async (saved) => {
      bindKeys();
      captureOriginalBlocks();
      document.querySelectorAll(ADDABLE_PARENTS).forEach(syncItemLayout);
      if (saved && (saved.texts || saved.images || saved.blocks || saved.sources)) {
        state = {
          texts: saved.texts || {},
          images: saved.images || {},
          blocks: saved.blocks || {},
          sources: saved.sources || {},
          history: Array.isArray(saved.history) && saved.history.length
            ? saved.history
            : [{ texts: {}, images: {}, blocks: {}, sources: {} }, { texts: { ...(saved.texts || {}) }, images: { ...(saved.images || {}) }, blocks: { ...(saved.blocks || {}) }, sources: { ...(saved.sources || {}) } }],
          cursor: Number.isInteger(saved.cursor) ? saved.cursor : 0,
          exportedSig: saved.exportedSig || fieldSig({ texts: {}, images: {}, blocks: {}, sources: {} }),
          nextVersion: saved.nextVersion || 2,
        };
        if (state.cursor < 0 || state.cursor >= state.history.length) {
          state.cursor = state.history.length - 1;
        }
        await applyStateToDom();
      } else {
        state.history = [{ texts: {}, images: {}, blocks: {}, sources: {} }];
        state.cursor = 0;
        state.exportedSig = fieldSig(state);
        await persist();
      }
      refreshButtons();
    }).catch(() => {
      bindKeys();
      captureOriginalBlocks();
      document.querySelectorAll(ADDABLE_PARENTS).forEach(syncItemLayout);
      state.history = [{ texts: {}, images: {}, blocks: {}, sources: {} }];
      state.cursor = 0;
      refreshButtons();
    });
  };

  if (mountDeck()) {
    bindEvidenceLayout();
    drawLineCharts();
    mountReportEditor();
    return;
  }
  bindEvidenceLayout();
  drawLineCharts();
  mountReportEditor();

  const nav = document.querySelector('[data-component-id="navigation"]');
  const links = [...(nav?.querySelectorAll('a') || [])];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!nav || !links.length || !sections.length) return;

  const activate = (id) => {
    links.forEach((link) => {
      const active = link.hash === `#${id}`;
      link.classList.toggle('is-active', active);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target.id);
  }, {
    rootMargin: '-18% 0px -62% 0px',
    threshold: [0, .15, .35]
  });

  sections.forEach((section) => observer.observe(section));
  activate(sections[0].id);
})();
