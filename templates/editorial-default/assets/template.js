(() => {
  window.ThemeRuntime?.mountThemeControl(document.querySelector('#themeControl'));

  const mountMediaSwitch = (root = document) => {
    root.querySelectorAll('.media-switch').forEach((figure) => {
      if (figure.dataset.switchReady) return;
      figure.dataset.switchReady = '1';
      const main = figure.querySelector('[data-media-main]');
      const thumbs = [...figure.querySelectorAll('.media-switch__thumb')];
      const apply = (thumb) => {
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
      };
      figure.addEventListener('click', (event) => {
        const thumb = event.target.closest('.media-switch__thumb');
        if (thumb && figure.contains(thumb)) {
          event.preventDefault();
          event.stopPropagation();
          figure.classList.remove('is-open');
          apply(thumb);
          return;
        }
        if (
          figure.classList.contains('is-cover')
          && !window.matchMedia('(hover: hover) and (pointer: fine)').matches
          && !event.target.closest('.media-switch__thumbs, .media-switch__panel')
        ) {
          event.preventDefault();
          event.stopPropagation();
          figure.classList.toggle('is-open');
        }
      });
    });
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.media-switch.is-cover.is-open').forEach((figure) => {
        if (!figure.contains(event.target)) figure.classList.remove('is-open');
      });
    });
  };

  const formatStatValues = (root = document) => {
    root.querySelectorAll('.stat-value').forEach((node) => {
      if (node.dataset.statSymbols) return;
      if (node.querySelector('small')) {
        node.dataset.statSymbols = '1';
        return;
      }
      const text = node.textContent;
      if (!text) return;
      node.innerHTML = text.replace(/\s*([¥$€£≤≥%×/–—+])\s*/g, '<small>$1</small>');
      node.dataset.statSymbols = '1';
    });
  };

  const formatCalloutText = (root = document) => {
    root.querySelectorAll('.callout p, .callout strong').forEach((node) => {
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
      if (!head) return;
      if (!isContent) return;
      const srcNo = slide.querySelector('.section-header__no')?.textContent.trim() || '';
      const srcTitle = slide.querySelector('.section-header__title')?.textContent.trim() || '';
      const srcPart = slide.querySelector('.section-header__part')?.textContent.trim() || '';
      const noEl = head.querySelector('[data-deck-no]');
      const titleEl = head.querySelector('[data-deck-title]');
      const partEl = head.querySelector('[data-deck-part]');
      if (noEl) noEl.textContent = srcNo;
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
      if (target.closest('.theme-control, .document-nav, .report-pager, .report-chrome, .report-chrome-hotspot, a, button, input, select, textarea, label')) {
        return false;
      }
      if (target.closest('.is-chapter-cover, #cover')) {
        return true;
      }
      if (target.closest('img, figcaption, table, .table-wrap, .report-card, .highlight-item, .step, .callout, .bar-compare, .list-block, .media-switch__thumbs, .media-switch__panel, .media-switch__label, [data-lightbox-src], p, h2, h3, li')) {
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

    document.addEventListener('keydown', (event) => {
      if (lightboxOpen()) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
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
    });

    setChromeHeight();
    show(slideIndexForHash(location.hash), { hash: false, motion: 'none' });
    return true;
  };

  if (mountDeck()) {
    bindEvidenceLayout();
    return;
  }
  bindEvidenceLayout();

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
