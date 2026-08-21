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
      if (document.documentElement.classList.contains('is-inline-editing')) return;
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

  const flowEvidenceFrame = (node) => {
    const parent = node?.parentElement;
    const width = Math.max(
      evidenceInnerBox(node).w,
      parent ? evidenceInnerBox(parent).w : 0,
      node?.clientWidth || 0,
      Math.min(1160, window.innerWidth - 48),
    );
    return {
      w: Math.max(240, width),
      h: 0,
    };
  };

  const layoutEvidenceStandalone = (node) => {
    if (!node || node.getAttribute('data-image-kind') === 'strip' || node.closest('.evidence-gallery')) return;
    if (node.closest('[data-media-page] [data-slot="media"]')) {
      node.style.removeProperty('width');
      node.style.removeProperty('--evidence-item-width');
      node.style.height = 'auto';
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
    node.style.removeProperty('width');
    node.style.removeProperty('--evidence-item-width');
    node.style.height = 'auto';
    node.style.maxWidth = '100%';
  };

  const resetEvidenceBoxStyles = (item) => {
    const windowNode = item?.querySelector?.(':scope > .evidence-window');
    const img = windowNode?.querySelector('img');
    item?.style.removeProperty('width');
    item?.style.removeProperty('height');
    item?.style.removeProperty('align-items');
    if (windowNode) {
      windowNode.style.removeProperty('width');
      windowNode.style.removeProperty('height');
      windowNode.style.removeProperty('max-height');
      windowNode.style.removeProperty('overflow');
      windowNode.style.removeProperty('aspect-ratio');
      windowNode.style.removeProperty('margin-inline');
    }
    if (img) {
      img.style.removeProperty('width');
      img.style.removeProperty('height');
      img.style.removeProperty('max-height');
      img.style.removeProperty('object-fit');
      img.style.removeProperty('object-position');
    }
  };

  const layoutEvidenceStrip = (gallery) => {
    if (!gallery || gallery.getAttribute('data-image-kind') !== 'strip') return;
    gallery.dataset.evidenceLayout = 'strip';
    gallery.style.removeProperty('--evidence-item-width');
    const items = [...gallery.children].filter((item) => (
      item.matches('.evidence-figure, .media-switch, .media-card')
      && !item.classList.contains('is-component-item-hidden')
    ));
    gallery.style.removeProperty('height');
    gallery.style.removeProperty('max-height');
    gallery.style.removeProperty('overflow');
    items.forEach(resetEvidenceBoxStyles);
    gallery.classList.remove('is-scrollable', 'is-scroll-end');
  };

  const layoutEvidenceGallery = (gallery) => {
    if (!gallery || gallery.getAttribute('data-image-kind') === 'strip') {
      layoutEvidenceStrip(gallery);
      return;
    }
    const items = [...gallery.children].filter((item) => (
      item.matches('.evidence-figure, .media-switch, .media-card')
      && !item.classList.contains('is-component-item-hidden')
    ));
    if (!items.length) return;
    const box = evidenceInnerBox(gallery);
    const parentBox = evidenceInnerBox(gallery.parentElement || gallery);
    const frame = flowEvidenceFrame(gallery);
    const galleryW = box.w || parentBox.w || frame.w || 0;
    const ratio = parseEvidenceRatio(gallery);
    const ratioCssValue = `${ratio.w} / ${ratio.h}`;
    gallery.style.setProperty('--image-ratio', ratioCssValue);
    const gap = evidenceGapPx(gallery);
    const count = items.length;
    gallery.style.removeProperty('height');
    gallery.style.removeProperty('max-height');
    gallery.style.removeProperty('overflow');
    items.forEach(resetEvidenceBoxStyles);
    if (galleryW < 8) return;
    if (gallery.getAttribute('data-image-ratio') === '9:16') {
      gallery.dataset.evidenceLayout = 'even';
      gallery.style.removeProperty('--evidence-item-width');
      gallery.classList.remove('is-scrollable', 'is-scroll-end');
      return;
    }
    const minItem = ratio.w / ratio.h < 0.55 ? 148 : ratio.w / ratio.h > 1.2 ? 300 : 220;
    const nCols = Math.max(1, Math.min(count, Math.floor((galleryW + gap) / (minItem + gap))));
    const ratioW = Math.max(120, (galleryW - gap * (nCols - 1)) / nCols);
    gallery.dataset.evidenceLayout = count === 1 ? 'center' : 'even';
    gallery.style.setProperty('--evidence-item-width', `${ratioW}px`);
    gallery.classList.remove('is-scrollable', 'is-scroll-end');
  };

  const layoutAllEvidence = () => {
    document.querySelectorAll('.evidence-gallery').forEach(layoutEvidenceGallery);
    document.querySelectorAll('.page-region > .media-switch, .page-region > .evidence-figure').forEach(layoutEvidenceStandalone);
  };

  const bindEvidenceImages = (root = document) => {
    root.querySelectorAll('.evidence-gallery img, .page-region > .evidence-figure img').forEach((img) => {
      if (img.dataset.evidenceBind) return;
      img.dataset.evidenceBind = '1';
      img.addEventListener('load', layoutAllEvidence);
    });
  };

  const bindEvidenceLayout = () => {
    layoutAllEvidence();
    bindEvidenceImages();
    const observer = new ResizeObserver(() => layoutAllEvidence());
    document.querySelectorAll('.evidence-gallery, .page-region, [data-report-stage]').forEach((node) => observer.observe(node));
    window.addEventListener('resize', layoutAllEvidence);
  };

  mountMediaSwitch();
  formatCalloutText();
  formatStatValues();

  const assembleChrome = () => {
    const theme = document.querySelector('.theme-control');
    if (!theme) return;
    let chrome = document.querySelector('[data-report-chrome]');
    if (!chrome) {
      chrome = document.createElement('div');
      chrome.className = 'report-chrome';
      chrome.dataset.reportChrome = '';
      const host = document.querySelector('.report-shell') || document.body;
      const pager = document.querySelector('[data-report-pager]');
      if (pager) host.insertBefore(chrome, pager);
      else host.appendChild(chrome);
      const toast = theme.querySelector('[data-theme-toast], .theme-control__toast');
      if (toast) document.body.appendChild(toast);
      chrome.appendChild(theme);
    }
    if (!document.querySelector('.report-chrome-hotspot')) {
      const spot = document.createElement('button');
      spot.type = 'button';
      spot.className = 'report-chrome-hotspot';
      spot.setAttribute('aria-label', '显示主题');
      document.body.appendChild(spot);
    }
  };

  const mountFlow = () => {
    const shell = document.querySelector('.report-shell.is-flow');
    const stage = document.querySelector('[data-report-stage]');
    if (!shell || !stage) return false;

    assembleChrome();

    const slidesRoot = stage.querySelector('[data-report-slides]') || stage;
    const slides = [...slidesRoot.querySelectorAll(':scope > .report-slide')];
    if (!slides.length) return false;

    const nav = document.querySelector('[data-component-id="navigation"]');
    const links = [...(nav?.querySelectorAll('a') || [])];
    let index = 0;

    const setChromeHeight = () => {
      const navEl = document.querySelector('.document-nav');
      document.documentElement.style.setProperty('--chrome-height', `${navEl?.offsetHeight || 0}px`);
    };

    const syncNavAlign = () => {
      const track = nav?.querySelector('.document-nav__links');
      if (!track) return;
      track.classList.remove('is-overflow');
      track.classList.toggle('is-overflow', track.scrollWidth > track.clientWidth + 1);
    };

    const syncTableTracks = () => {
      document.querySelectorAll('.content-cols').forEach((cols) => {
        const colEls = [...cols.children].filter((el) => el.classList.contains('content-col'));
        if (!colEls.length) return;
        cols.style.setProperty('--table-cols', String(colEls.length));
        cols.style.setProperty('--table-rows', String(colEls[0].children.length));
      });
    };

    const activateNav = (chapter) => {
      const track = nav?.querySelector('.document-nav__links');
      links.forEach((link) => {
        const href = (link.getAttribute('href') || '').replace('#', '');
        const on = href === chapter;
        link.classList.toggle('is-active', on);
        if (!on || !track) return;
        const linkBox = link.getBoundingClientRect();
        const trackBox = track.getBoundingClientRect();
        const pad = 12;
        if (linkBox.left < trackBox.left + pad) {
          track.scrollLeft += linkBox.left - trackBox.left - pad;
        } else if (linkBox.right > trackBox.right - pad) {
          track.scrollLeft += linkBox.right - trackBox.right + pad;
        }
      });
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

    const show = (next, { hash = true, motion = 'auto' } = {}) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      const to = slides[clamped];
      index = clamped;
      slides.forEach((slide) => {
        slide.classList.toggle('is-active', slide === to);
        slide.removeAttribute('inert');
        slide.setAttribute('aria-hidden', 'false');
      });
      activateNav(to.dataset.chapter);
      if (hash && to.id) history.replaceState(null, '', `#${to.id}`);
      to.scrollIntoView({ behavior: motion === 'none' ? 'auto' : 'smooth', block: 'start' });
      document.dispatchEvent(new CustomEvent('seed:slidechange'));
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

    const syncFlowHeadings = () => {
      const catalog = shell.hasAttribute('data-catalog');
      let prev = '';
      slides.forEach((slide) => {
        slide.classList.remove('is-flow-chapter-start', 'is-flow-keep-title');
        slide.removeAttribute('data-flow-chapter-title');
        if (slide.classList.contains('is-chapter-cover') || slide.dataset.chapter === 'cover') return;
        if (catalog) {
          slide.classList.add('is-flow-keep-title');
          return;
        }
        const chapter = slide.dataset.chapter || '';
        if (chapter && chapter !== prev) {
          prev = chapter;
          if (!slide.querySelector(':scope > .report-notes > h2')) {
            const thesis = (slide.getAttribute('data-flow-title') || '').trim();
            const label = thesis || (nav?.querySelector(`a[href="#${chapter}"]`)?.textContent || '').trim();
            if (label) {
              slide.classList.add('is-flow-chapter-start');
              slide.setAttribute('data-flow-chapter-title', label);
            }
          }
        }
        const keep = Boolean(slide.querySelector(
          '.page-grid[data-slots="1"] .content[data-content="copy"], .page-grid[data-slots="1"] .content[data-content="point"]'
        ));
        slide.classList.toggle('is-flow-keep-title', keep);
      });
    };

    const flowObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const slide = visible.target;
      const i = slides.indexOf(slide);
      if (i < 0 || i === index) return;
      index = i;
      slides.forEach((item) => item.classList.toggle('is-active', item === slide));
      activateNav(slide.dataset.chapter);
      if (slide.id) history.replaceState(null, '', `#${slide.id}`);
    }, {
      rootMargin: '-18% 0px -62% 0px',
      threshold: [0.12, 0.35, 0.6],
    });
    slides.forEach((slide) => flowObserver.observe(slide));

    window.addEventListener('hashchange', () => {
      show(slideIndexForHash(location.hash), { hash: false, motion: 'none' });
    });
    window.addEventListener('resize', () => {
      setChromeHeight();
      syncNavAlign();
      syncTableTracks();
      layoutAllEvidence();
      drawLineCharts();
    });

    slides.forEach((slide) => {
      slide.removeAttribute('inert');
      slide.setAttribute('aria-hidden', 'false');
    });
    setChromeHeight();
    syncNavAlign();
    syncTableTracks();
    syncFlowHeadings();
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
    '.content__title',
    '.content__body',
    '.content__label',
    '.content__kicker',
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

  const CHROME_SEL = '.theme-control, .report-chrome, .report-chrome-hotspot, .document-nav, .report-pager, .report-edit-menu, .report-edit-done';

  const collectTextNodes = (root) => [...root.querySelectorAll(TEXT_SELECTORS)].filter((node) => {
    if (node.closest(CHROME_SEL)) return false;
    if (node.matches('[data-deck-title], [data-deck-part], [data-deck-source]')) return true;
    if (node.hidden || node.getAttribute('hidden') !== null) return false;
    return true;
  });

  const collectImages = (root) => [...root.querySelectorAll('img')].filter((node) => (
    !node.closest(CHROME_SEL)
  ));

  const slideOf = (node) => node.closest('.report-slide') || document.querySelector('.report-slide.is-active');

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

  const textTargetOf = (node) => {
    if (!node || node.closest(CHROME_SEL)) return null;
    return node.closest(TEXT_SELECTORS);
  };

  const imageTargetOf = (node) => {
    if (!node || node.closest(CHROME_SEL)) return null;
    if (node.closest('figcaption, .media-switch__panel, .media-switch__label, .chapter-cover__actions')) return null;
    if (node.matches('img')) return node;
    const fromThumb = node.closest('.media-switch__thumb')?.querySelector('img');
    if (fromThumb) return fromThumb;
    const fromWin = node.closest('.evidence-window')?.querySelector('img');
    if (fromWin) return fromWin;
    const fromFig = node.closest('.evidence-figure')?.querySelector('.evidence-window img, img');
    if (fromFig) return fromFig;
    const cover = node.closest('.chapter-cover[data-cover="image"], .full-page[data-full="image"]');
    if (cover) return cover.querySelector('.chapter-cover__media img, img');
    return null;
  };

  const mountReportEditor = () => {
    const stage = document.querySelector('[data-report-stage]');
    if (!stage) return;

    const slug = reportSlug();
    const objectUrls = new Map();
    const originals = { texts: {}, images: {} };
    const state = { texts: {}, images: {} };
    let fileInput = null;
    let activeText = null;
    let beforeEdit = '';

    const menu = document.createElement('div');
    menu.className = 'report-edit-menu';
    menu.hidden = true;
    menu.innerHTML = [
      '<button class="button subtle" type="button" data-edit-text-action>编辑</button>',
      '<button class="button subtle" type="button" data-edit-image-action>替换</button>',
    ].join('');
    document.body.appendChild(menu);
    const textBtn = menu.querySelector('[data-edit-text-action]');
    const imageBtn = menu.querySelector('[data-edit-image-action]');
    let menuText = null;
    let menuImage = null;

    const doneBtn = document.createElement('button');
    doneBtn.className = 'button primary report-edit-done';
    doneBtn.type = 'button';
    doneBtn.hidden = true;
    doneBtn.textContent = '完成';
    document.body.appendChild(doneBtn);

    const hideMenu = () => {
      menu.hidden = true;
      menuText = null;
      menuImage = null;
    };

    const showMenu = (event, { text, image }) => {
      menuText = text || null;
      menuImage = image || null;
      textBtn.hidden = !menuText;
      imageBtn.hidden = !menuImage;
      if (textBtn.hidden && imageBtn.hidden) return;
      menu.replaceChildren(...[textBtn, imageBtn].filter((btn) => !btn.hidden));
      menu.hidden = false;
      const box = menu.getBoundingClientRect();
      const pad = 8;
      menu.style.left = `${Math.max(pad, Math.min(event.clientX, window.innerWidth - box.width - pad))}px`;
      menu.style.top = `${Math.max(pad, Math.min(event.clientY, window.innerHeight - box.height - pad))}px`;
    };

    const persist = async () => {
      await idbSet('state', slug, { texts: state.texts, images: state.images });
    };

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
      indexNodes(collectTextNodes(document), 'text').forEach(({ node, key }) => {
        node.dataset.editKey = key;
        if (!(key in originals.texts)) originals.texts[key] = node.textContent;
      });
      indexNodes(collectImages(document), 'img').forEach(({ node, key }) => {
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

    const placeDone = () => {
      if (!activeText) return;
      const box = activeText.getBoundingClientRect();
      const width = doneBtn.offsetWidth || 72;
      const height = doneBtn.offsetHeight || 34;
      const pad = 8;
      let left = box.right + pad;
      let top = box.top;
      if (left + width > window.innerWidth - pad) left = Math.max(pad, box.right - width);
      if (top + height > window.innerHeight - pad) top = Math.max(pad, box.bottom - height);
      doneBtn.style.left = `${left}px`;
      doneBtn.style.top = `${top}px`;
    };

    const stopTextEdit = ({ commit = true } = {}) => {
      if (!activeText) return;
      const node = activeText;
      const key = node.dataset.editKey;
      node.removeAttribute('contenteditable');
      node.removeAttribute('data-edit-text');
      document.documentElement.classList.remove('is-inline-editing');
      doneBtn.hidden = true;
      activeText = null;
      if (!commit) {
        if (key) applyText(node, beforeEdit);
        syncPairedTitle(node, beforeEdit);
        formatStatValues(node.parentElement || document);
        return;
      }
      const value = node.textContent;
      if (!key) return;
      if (originals.texts[key] === value) delete state.texts[key];
      else state.texts[key] = value;
      syncPairedTitle(node, value);
      formatStatValues(node.parentElement || document);
      persist();
    };

    const startTextEdit = (node) => {
      if (!node) return;
      if (activeText && activeText !== node) stopTextEdit({ commit: true });
      bindKeys();
      if (!node.dataset.editKey) bindKeys();
      beforeEdit = node.textContent;
      activeText = node;
      node.setAttribute('data-edit-text', '');
      node.contentEditable = 'true';
      node.spellcheck = false;
      document.documentElement.classList.add('is-inline-editing');
      doneBtn.hidden = false;
      node.focus();
      placeDone();
    };

    const pickImage = (img) => {
      if (!img) return;
      bindKeys();
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
        } else if (img.hasAttribute('data-media-main') && main === img) {
          const active = img.closest('.media-switch')?.querySelector('.media-switch__thumb.is-active');
          if (active) {
            active.setAttribute('data-src', url);
            const thumbImg = active.querySelector('img');
            if (thumbImg) {
              thumbImg.src = url;
              if (thumbImg.dataset.editKey) {
                state.images[thumbImg.dataset.editKey] = { name: file.name, type: file.type };
                await idbSet('blobs', `${slug}::${thumbImg.dataset.editKey}`, file);
              }
            }
          }
        }
        persist();
      };
      fileInput.click();
    };

    const applyStateToDom = async () => {
      bindKeys();
      indexNodes(collectTextNodes(document), 'text').forEach(({ node, key }) => {
        const value = currentValue(key);
        if (value !== undefined && node.textContent !== value) {
          applyText(node, value);
          syncPairedTitle(node, value);
        }
      });
      for (const { node, key } of indexNodes(collectImages(document), 'img')) {
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
          if (node.closest('.media-switch__thumb')?.classList.contains('is-active') && main?.tagName === 'IMG') {
            main.src = url;
          }
        }
      }
    };

    document.addEventListener('contextmenu', (event) => {
      const node = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!node || node.closest(CHROME_SEL)) return;
      const text = textTargetOf(node);
      const image = text ? null : imageTargetOf(node);
      if (!image && !text) return;
      event.preventDefault();
      showMenu(event, { text, image });
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('[data-edit-text-action]') && menuText) startTextEdit(menuText);
      if (event.target.closest('[data-edit-image-action]') && menuImage) pickImage(menuImage);
      hideMenu();
    });

    doneBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopTextEdit({ commit: true });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!menu.hidden && !event.target.closest('.report-edit-menu')) hideMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideMenu();
        if (activeText) {
          event.preventDefault();
          stopTextEdit({ commit: false });
        }
        return;
      }
      if (!activeText) return;
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        stopTextEdit({ commit: true });
      }
    });

    window.addEventListener('resize', () => {
      if (activeText) placeDone();
    });
    document.addEventListener('scroll', () => {
      if (activeText) placeDone();
    }, true);

    document.addEventListener('seed:slidechange', () => {
      hideMenu();
      if (activeText) stopTextEdit({ commit: true });
      bindKeys();
    });
    window.addEventListener('hashchange', () => {
      hideMenu();
      if (activeText) stopTextEdit({ commit: true });
      bindKeys();
    });

    idbGet('state', slug).then(async (saved) => {
      bindKeys();
      if (saved && (saved.texts || saved.images)) {
        state.texts = saved.texts || {};
        state.images = saved.images || {};
        await applyStateToDom();
      }
    }).catch(() => {
      bindKeys();
    });
  };

  if (mountFlow()) {
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
