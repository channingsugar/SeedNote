(() => {
  const CHROME = [
    '.theme-control', '.report-chrome', '.report-chrome-hotspot', '.document-nav',
    '.report-pager',     '.seed-edit-menu', '.seed-edit-done', '.seed-edit-svg-input',
    '.seed-edit-color', '.seed-edit-palette', '.seed-edit-media', '.seed-edit-handle', '.seed-edit-handle-h',
    '.seed-edit-ghost', '.seed-edit-grip', '.seed-edit-bold', '.seed-edit-size', '.seed-edit-rule', '.seed-edit-trash', '.topbar', 'nav.toc', '.tools',
  ].join(', ');

  const BLOCK_TAGS = new Set([
    'SECTION', 'ARTICLE', 'MAIN', 'BODY', 'HTML', 'HEADER', 'FOOTER', 'NAV',
    'ASIDE', 'FIGURE', 'UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR',
    'SVG', 'PATH', 'G', 'RECT', 'CIRCLE', 'LINE', 'POLYLINE', 'POLYGON', 'DEFS',
    'CLIPPATH', 'MASK', 'USE', 'SYMBOL',
  ]);

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT',
    'IFRAME', 'CANVAS',
  ]);

  const slugOf = () => {
    const parts = location.pathname.replace(/\/index\.html?$/i, '').split('/').filter(Boolean);
    return parts[parts.length - 1] || 'report';
  };

  const openDb = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('seed-report-edit', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const idbGet = (store, key) => openDb().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));

  const idbSet = (store, key, value) => openDb().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));

  const isSvgText = (node) => node instanceof SVGTextElement || node instanceof SVGTSpanElement;

    const isChrome = (node) => !!(node && (node.closest?.(CHROME) || node.closest?.('.seed-edit-menu, .seed-edit-done, .seed-edit-bold, .seed-edit-svg-input')));

  const slideOf = (node) =>
    node.closest?.('.report-slide, .chapter, section[id], article[id]') || document.body;

  const pathOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      const parent = n.parentElement;
      if (!parent) break;
      const tag = n.tagName;
      const same = [...parent.children].filter((c) => c.tagName === tag);
      const idx = same.indexOf(n);
      parts.push(same.length > 1 ? `${tag}[${idx}]` : tag);
      n = parent;
    }
    return parts.reverse().join('>');
  };

  const fromPath = (path) => {
    const parts = (path || '').split('>').filter(Boolean);
    let n = document.documentElement;
    for (const part of parts) {
      const m = part.match(/^([A-Za-z0-9-]+)(?:\[(\d+)\])?$/);
      if (!m) return null;
      const tag = m[1];
      const idx = +(m[2] || 0);
      const same = [...n.children].filter((c) => c.tagName === tag);
      n = same[idx];
      if (!n) return null;
    }
    return n;
  };

  const hasVisibleText = (n) => !!(n.textContent || '').replace(/\s+/g, '');

  const isTextSlot = (n) => {
    if (!n || n.nodeType !== 1) return false;
    if (isChrome(n)) return false;
    if (SKIP_TAGS.has(n.tagName)) return false;
    if (BLOCK_TAGS.has(n.tagName)) return false;
    if (n.matches?.('img, video, source, picture')) return false;
    if (!hasVisibleText(n)) return false;
    const blockChild = [...n.children].some((c) => BLOCK_TAGS.has(c.tagName) || /^(DIV|P|H1|H2|H3|H4|H5|H6|UL|OL|LI|TABLE|ARTICLE|SECTION|HEADER|FIGURE)$/.test(c.tagName));
    if (blockChild) return false;
    return true;
  };

  const wrapTextNode = (textNode) => {
    const span = document.createElement('span');
    span.dataset.seedEditWrap = '1';
    textNode.parentNode.insertBefore(span, textNode);
    span.appendChild(textNode);
    return span;
  };

  const textTargetOf = (node) => {
    if (!node) return null;
    const start = node.nodeType === 3 ? node.parentElement : node;
    if (!start || isChrome(start)) return null;

    const svgText = start.closest?.('text, tspan');
    if (svgText && !isChrome(svgText)) return svgText;

    if (start.closest?.('svg') && !start.closest?.('text, tspan, foreignObject')) return null;
    if (start.closest?.('img, video')) return null;

    const finding = start.closest?.('.finding');
    if (finding && !isChrome(finding)) return finding;

    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (parent && [...parent.childNodes].some((c) => c.nodeType === 1)) return wrapTextNode(node);
    }

    for (let n = start; n && n !== document.body; n = n.parentElement) {
      if (isChrome(n)) return null;
      if (isTextSlot(n)) return n;
    }
    return null;
  };

  const mediaTargetOf = (node) => {
    if (!node || node.nodeType === 3) node = node?.parentElement;
    if (!node || isChrome(node)) return null;
    if (node.closest('figcaption')) return null;

    if (node.closest('.gallery-open, .tool, .icon')) return null;
    if (node.closest('button') && !node.closest('button').querySelector('img, video')) return null;

    const img = node.closest('img');
    if (img) return img;
    const video = node.closest('video');
    if (video) return video;
    const svg = node.closest('svg');
    if (svg) {
      if (svg.closest('.icon, .gallery-open, .topbar, button')) return null;
      if (svg.querySelector('symbol') || svg.getAttribute('width') === '0') return null;
      return svg;
    }

    const frame = node.closest('.shot__frame, .gallery-stage, .brand-concept-film, .shot, figure, .comp-media');
    if (frame) return frame.querySelector('img, video, svg');
    const cover = node.closest?.('.chapter-cover');
    if (cover && (cover.getAttribute('data-cover') === 'image' || cover.getAttribute('data-cover') === 'split')) {
      return cover.querySelector('.chapter-cover__media img') || null;
    }
    return null;
  };

  const COMPONENT_SEL = [
    '.shot-grid', '.shot-stack', '.shot-plan', '.shot', '.brand-concept-film', 'figure.shot', '.gallery-stage',
    '.transport-cards',
    '.plain-table-wrap', '.table-wrap', '.hotel-ranking-block', '.network-node-table',
    '.plain-grid', '.info-grid', '.stat-grid', '.stat-row',
    '.rail-growth-chart', '.venn-wrap', '.ansoff-wrap', '.hotel-funnel-chart',
    '.network-shell', '.hotel-city-network',
    '.market-formula', '.finding', '.pain-text-list', '.point',
  ].join(', ');

  const mediaBoxOf = (el) => {
    if (!el) return null;
    return el.closest('.shot, .brand-concept-film, figure, .gallery-stage') || el.parentElement;
  };

  const resizeBoxOf = (el) => {
    if (!el || el.nodeType === 3) el = el?.parentElement;
    if (!el || isChrome(el)) return null;
    const asideMedia = el.closest('.comp-media');
    if (asideMedia) return asideMedia;
    const shell = el.closest('.network-shell');
    if (shell) return shell;
    const rank = el.closest('.hotel-ranking-block');
    if (rank) return rank;
    const nodeTable = el.closest('.network-node-table');
    if (nodeTable) return nodeTable;
    const shot = el.closest('.shot, figure.shot');
    if (shot) return shot.closest('.shot-grid, .shot-stack') || shot;
    const gallery = el.closest('.gallery-stage');
    if (gallery) return gallery.closest('.transport-cards') || gallery;
    const ansoff = el.closest('.ansoff-wrap, .ansoff-grid');
    if (ansoff) return ansoff.closest('.ansoff-wrap') || ansoff;
    const table = el.closest('.plain-table-wrap, .table-wrap');
    if (table) return table.closest('.hotel-ranking-block') || table;
    const host = el.closest(COMPONENT_SEL);
    return host || null;
  };

  const isMediaBox = (box) => !!(box && box.matches('.shot, .shot-grid, .shot-stack, .shot-plan, .gallery-stage, .brand-concept-film, figure.shot, .transport-cards, .comp-media'));
  const isShotSurface = (box) => !!(box && box.matches('.shot, figure.shot, .shot-grid, .shot-stack, .comp-media'));
  const isAsideHost = (box) => !!(box?.matches?.('.info-grid[data-aside], .pain-text-list[data-aside], .plain-grid[data-aside]'));
  const isAsideFrame = (box) => !!(box?.matches?.('.comp-media') && isAsideHost(box.parentElement));
  const asideGroupOf = (box) => {
    if (!box) return null;
    if (isAsideHost(box)) return box;
    if (isAsideFrame(box)) return box.parentElement;
    const media = box.closest?.('.comp-media');
    return media && isAsideHost(media.parentElement) ? media.parentElement : null;
  };
  const asideShotOf = (box) => {
    if (!box) return null;
    if (box.matches?.('.shot, figure.shot') && box.closest('.comp-media')) return box;
    return (isAsideFrame(box) ? box : box?.closest?.('.comp-media'))?.querySelector?.('.shot') || null;
  };
  const isIntrinsicHeight = (box) => !!(box && box.matches('.market-formula, .stat-grid, .stat-row, .info-grid, .plain-grid, .point, .finding') && !isAsideHost(box));
  const parsePx = (value) => {
    if (!value || value === '100%' || value === 'auto') return null;
    const n = parseFloat(value);
    return n > 0 ? n : null;
  };

  const readLayout = (box) => {
    const asideGroup = asideGroupOf(box);
    const sizingAsideCol = isAsideFrame(box) || !!box?.closest?.('.comp-media');
    const asideW = sizingAsideCol ? asideGroup?.style.getPropertyValue('--aside-w') : '';
    const inner = asideShotOf(box);
    return {
      align: box?.dataset.align || inner?.dataset.align || 'left',
      fit: box?.dataset.fit || inner?.dataset.fit || (asideGroup ? 'fit' : (isShotSurface(box) ? 'fill' : 'fit')),
      width: asideW ? parseFloat(asideW) : (box?.style.width ? parseFloat(box.style.width) : null),
      height: asideGroup
        ? (parsePx(asideGroup.style.height) || parsePx(asideGroup.style.minHeight))
        : (parsePx(box?.style.height) || parsePx(box?.style.minHeight)),
    };
  };

  const writeLayout = (box, layout = {}) => {
    if (!box) return;
    const isShotBox = box.matches('.shot, figure.shot');
    const inShotGrid = isShotBox && !!box.parentElement?.matches?.('.shot-grid, .shot-stack');
    const asideGroup = asideGroupOf(box);
    const asideCol = isAsideFrame(box) || (isShotBox && !!box.closest('.comp-media'));
    const innerShot = asideShotOf(box);
    const align = layout.align || 'left';
    const fit = layout.fit || (asideGroup ? 'fit' : (isShotSurface(box) ? 'fill' : 'fit'));
    box.dataset.align = align;
    box.dataset.fit = fit;
    if (box.matches('.shot-grid, .shot-stack')) {
      box.querySelectorAll(':scope > .shot').forEach((shot) => {
        shot.dataset.fit = fit;
        shot.dataset.align = 'left';
      });
    }
    if (innerShot && innerShot !== box) {
      innerShot.dataset.fit = fit;
      innerShot.dataset.align = align;
    }
    if (asideCol && asideGroup) {
      if (layout.width) asideGroup.style.setProperty('--aside-w', `${Math.round(layout.width)}px`);
      else asideGroup.style.removeProperty('--aside-w');
      box.style.removeProperty('width');
      box.style.maxWidth = '100%';
      if (innerShot) {
        innerShot.style.removeProperty('width');
        innerShot.style.maxWidth = '100%';
      }
    } else if (inShotGrid) {
      box.style.removeProperty('width');
      box.style.maxWidth = '100%';
    } else if (layout.width) {
      box.style.width = `${Math.round(layout.width)}px`;
      box.style.maxWidth = '100%';
    } else {
      box.style.removeProperty('width');
      if (isShotSurface(box) || isShotBox) box.style.maxWidth = '100%';
      else box.style.removeProperty('max-width');
    }
    const frame = box.matches('.shot-grid, .shot-stack, .transport-cards, .ansoff-wrap, .info-grid, .stat-grid, .plain-grid, .market-formula')
      ? box
      : (box.querySelector('.shot__frame') || box);
    const rankScroll = box.matches('.hotel-ranking-block')
      ? box.querySelector('.hotel-ranking-scroll')
      : (box.matches('.hotel-ranking-scroll') ? box : null);
    const isGridBox = box.matches('.plain-grid, .info-grid, .stat-grid, .ansoff-wrap, .shot-grid, .shot-stack');
    const isFormula = box.matches('.market-formula');
    const isRankBlock = box.matches('.hotel-ranking-block');
    const isNodeTable = box.matches('.network-node-table');
    const isNetworkShell = box.matches('.network-shell');
    const isTableBox = box.matches('.plain-table-wrap, .table-wrap');
    const isFunnel = box.matches('.hotel-funnel-chart');
    const isChartBox = box.matches('.rail-growth-chart, .venn-wrap, .hotel-funnel-chart');
    const shotRowsOf = (grid) => {
      const cols = Math.max(1, Number(grid.getAttribute('data-cols') || 1));
      const n = grid.querySelectorAll(':scope > .shot').length;
      return Math.max(1, Math.ceil(n / cols));
    };
    const sizeShotGrid = (grid, h) => {
      const rows = shotRowsOf(grid);
      grid.classList.add('is-sized');
      grid.style.height = `${h}px`;
      grid.style.minHeight = `${h}px`;
      grid.style.maxHeight = `${h}px`;
      grid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
      grid.style.gridAutoRows = 'minmax(0, 1fr)';
    };
    const fillShot = (shot, opts = {}) => {
      shot.style.display = 'flex';
      shot.style.flexDirection = 'column';
      shot.style.minHeight = '0';
      shot.style.overflow = opts.keepCaption ? 'visible' : 'hidden';
      const imgFrame = shot.querySelector('.shot__frame');
      if (imgFrame) {
        imgFrame.style.removeProperty('height');
        imgFrame.style.removeProperty('max-height');
        imgFrame.style.flex = '1 1 auto';
        imgFrame.style.minHeight = '0';
        imgFrame.style.overflow = 'hidden';
      }
    };
    const sizeAsideGroup = (host, h, shot) => {
      host.style.height = 'auto';
      host.style.minHeight = `${h}px`;
      host.style.removeProperty('max-height');
      host.style.overflow = 'visible';
      host.classList.add('is-aside-sized');
      const mediaShot = shot || host.querySelector(':scope > .comp-media .shot');
      if (!mediaShot) return;
      mediaShot.classList.add('is-sized');
      mediaShot.style.removeProperty('height');
      mediaShot.style.removeProperty('width');
      mediaShot.style.minHeight = '0';
      mediaShot.style.maxWidth = '100%';
      mediaShot.style.removeProperty('max-height');
      fillShot(mediaShot, { keepCaption: true });
    };
    if (isIntrinsicHeight(box)) {
      box.classList.remove('is-sized');
      box.style.removeProperty('height');
      box.style.removeProperty('min-height');
      box.style.removeProperty('max-height');
      box.style.removeProperty('overflow');
      box.style.removeProperty('overflow-y');
      box.style.removeProperty('grid-template-rows');
      box.style.removeProperty('grid-auto-rows');
    } else if (layout.height) {
      const h = Math.round(layout.height);
      box.style.maxHeight = 'none';
      if (box.matches('.shot-grid, .shot-stack')) {
        sizeShotGrid(box, h);
      } else if (asideGroup) {
        sizeAsideGroup(asideGroup, h, innerShot);
      } else if (isShotBox) {
        box.classList.add('is-sized');
        box.style.height = `${h}px`;
        box.style.minHeight = `${h}px`;
        box.style.maxHeight = `${h}px`;
      } else {
        box.style.height = `${h}px`;
        if (isRankBlock || isNetworkShell || isTableBox || isNodeTable || isFunnel) box.style.minHeight = `${h}px`;
        else box.style.removeProperty('min-height');
      }
      if (frame !== box && !isNetworkShell && !isGridBox && !isShotBox && !asideGroup) {
        frame.style.height = `${h}px`;
        frame.style.maxHeight = 'none';
      }
      if (isShotBox) {
        fillShot(box);
        box.style.overflow = 'hidden';
      } else if (box.matches('.shot-grid, .shot-stack')) {
        box.style.overflow = 'hidden';
        box.querySelectorAll(':scope > .shot').forEach(fillShot);
      } else if (asideGroup) {
        const mediaShot = asideGroup.querySelector(':scope > .comp-media .shot');
        if (mediaShot) fillShot(mediaShot, { keepCaption: true });
        asideGroup.style.overflow = 'visible';
      } else if (isRankBlock || isNetworkShell || isGridBox || isMediaBox(box) || isChartBox || isTableBox || isNodeTable) {
        box.style.overflow = 'hidden';
      } else {
        box.style.overflow = 'auto';
      }
      if (isFormula) {
        box.style.display = 'flex';
        box.style.flexDirection = 'row';
        box.style.flexWrap = 'nowrap';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'space-between';
        box.style.overflowX = 'auto';
        box.style.overflowY = 'hidden';
      }
      if (isTableBox) {
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.overflowX = 'auto';
        box.style.overflowY = 'hidden';
      }
      if (isNodeTable) {
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        const wrap = box.querySelector('.table-wrap');
        if (wrap) {
          wrap.style.flex = '1 1 auto';
          wrap.style.minHeight = '0';
          wrap.style.height = 'auto';
          wrap.style.overflow = 'auto';
        }
      }
      if (isFunnel) {
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        const scroll = box.querySelector('.hotel-funnel-chart-scroll');
        if (scroll) {
          scroll.style.flex = '1 1 auto';
          scroll.style.minHeight = '0';
          scroll.style.height = 'auto';
          scroll.style.overflow = 'hidden';
        }
        const svg = box.querySelector('svg');
        if (svg) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.minWidth = '0';
          svg.style.minHeight = '0';
        }
      }
      if (rankScroll) {
        rankScroll.style.maxHeight = 'none';
        rankScroll.style.overflow = 'auto';
        if (isRankBlock) {
          rankScroll.style.height = 'auto';
          rankScroll.style.minHeight = '0';
          rankScroll.style.flex = '1 1 auto';
        }
      }
      if (isNetworkShell) {
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        const stage = box.querySelector('.network-stage');
        if (stage) {
          stage.style.minHeight = '0';
          stage.style.flex = '1 1 auto';
          stage.style.height = 'auto';
          stage.style.overflow = 'hidden';
          stage.style.gridTemplateRows = 'minmax(0, 1fr)';
        }
        box.querySelectorAll('.connection-area, #networkSvg').forEach((el) => {
          el.style.removeProperty('height');
          el.style.removeProperty('min-height');
          el.style.removeProperty('max-height');
          el.style.removeProperty('width');
          el.style.removeProperty('overflow');
        });
      }
    } else {
      box.style.removeProperty('height');
      box.style.removeProperty('min-height');
      box.style.removeProperty('max-height');
      if (frame !== box) {
        frame.style.removeProperty('height');
        frame.style.removeProperty('max-height');
      }
      if (isShotBox) {
        box.classList.remove('is-sized');
        box.style.removeProperty('display');
        box.style.removeProperty('flex-direction');
        box.style.removeProperty('overflow');
        const imgFrame = box.querySelector('.shot__frame');
        if (imgFrame) {
          imgFrame.style.removeProperty('flex');
          imgFrame.style.removeProperty('min-height');
          imgFrame.style.removeProperty('overflow');
        }
        if (asideGroup) {
          asideGroup.style.removeProperty('height');
          asideGroup.style.removeProperty('min-height');
          asideGroup.classList.remove('is-aside-sized');
        }
      } else if (asideGroup) {
        asideGroup.style.removeProperty('height');
        asideGroup.style.removeProperty('min-height');
        asideGroup.classList.remove('is-aside-sized');
        const mediaShot = asideGroup.querySelector(':scope > .comp-media .shot');
        if (mediaShot) {
          mediaShot.classList.remove('is-sized');
          mediaShot.style.removeProperty('height');
          mediaShot.style.removeProperty('min-height');
          mediaShot.style.removeProperty('display');
          mediaShot.style.removeProperty('flex-direction');
          mediaShot.style.removeProperty('overflow');
          const imgFrame = mediaShot.querySelector('.shot__frame');
          if (imgFrame) {
            imgFrame.style.removeProperty('flex');
            imgFrame.style.removeProperty('min-height');
            imgFrame.style.removeProperty('overflow');
          }
        }
      } else if (box.matches('.shot-grid, .shot-stack')) {
        box.classList.remove('is-sized');
        box.style.removeProperty('overflow');
        box.style.removeProperty('grid-template-rows');
        box.style.removeProperty('grid-auto-rows');
        box.querySelectorAll(':scope > .shot').forEach((shot) => {
          shot.style.removeProperty('display');
          shot.style.removeProperty('flex-direction');
          shot.style.removeProperty('min-height');
          shot.style.removeProperty('height');
          shot.style.removeProperty('overflow');
          const imgFrame = shot.querySelector('.shot__frame');
          if (imgFrame) {
            imgFrame.style.removeProperty('flex');
            imgFrame.style.removeProperty('min-height');
            imgFrame.style.removeProperty('overflow');
          }
        });
      } else if (!isMediaBox(box)) {
        box.style.removeProperty('overflow');
      }
      if (rankScroll) {
        rankScroll.style.removeProperty('height');
        rankScroll.style.removeProperty('min-height');
        rankScroll.style.removeProperty('max-height');
        rankScroll.style.removeProperty('overflow');
        rankScroll.style.removeProperty('flex');
      }
      if (isNetworkShell) {
        box.style.removeProperty('display');
        box.style.removeProperty('flex-direction');
        const stage = box.querySelector('.network-stage');
        if (stage) {
          stage.style.removeProperty('min-height');
          stage.style.removeProperty('flex');
          stage.style.removeProperty('height');
          stage.style.removeProperty('overflow');
          stage.style.removeProperty('grid-template-rows');
        }
      }
      if (isTableBox) {
        box.style.removeProperty('display');
        box.style.removeProperty('flex-direction');
        box.style.removeProperty('overflow-x');
        box.style.removeProperty('overflow-y');
      }
      if (isNodeTable) {
        box.style.removeProperty('display');
        box.style.removeProperty('flex-direction');
        const wrap = box.querySelector('.table-wrap');
        if (wrap) {
          wrap.style.removeProperty('flex');
          wrap.style.removeProperty('min-height');
          wrap.style.removeProperty('height');
          wrap.style.removeProperty('overflow');
        }
      }
      if (isFunnel) {
        box.style.removeProperty('display');
        box.style.removeProperty('flex-direction');
        const scroll = box.querySelector('.hotel-funnel-chart-scroll');
        if (scroll) {
          scroll.style.removeProperty('flex');
          scroll.style.removeProperty('min-height');
          scroll.style.removeProperty('height');
          scroll.style.removeProperty('overflow');
        }
        const svg = box.querySelector('svg');
        if (svg) {
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.removeProperty('width');
          svg.style.removeProperty('height');
          svg.style.removeProperty('min-width');
          svg.style.removeProperty('min-height');
        }
      }
    }
    if (fit === 'fill' && !layout.height) {
      const ratio = box.dataset.seedRatio;
      if (ratio) frame.style.aspectRatio = ratio;
    } else {
      frame.style.removeProperty('aspect-ratio');
    }
    layoutChartHeight(box);
    layoutFunnelHeight(box);
    if (isNetworkShell || isChartBox) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
      });
    }
  };

  const readMarkup = (node) => (isSvgText(node) ? node.textContent : node.innerHTML);

  const writeMarkup = (node, value) => {
    if (isSvgText(node)) node.textContent = value;
    else node.innerHTML = value;
  };

  const VARIANT_SPECS = [
    {
      group: 'stat',
      sel: '.stat-card:not(.is-pair)',
      title: '类型',
      checks: [
        { id: 'prefix', label: '前缀' },
        { id: 'suffix', label: '后缀' },
        { id: 'kicker', label: '说明' },
      ],
      items: [
        { id: 'layout-grid-a', label: '格子 A' },
        { id: 'layout-grid-b', label: '格子 B' },
      ],
    },
    {
      group: 'stat-row',
      sel: '.stat-row',
      sections: [
        {
          id: 'cols',
          title: '列数',
          items: [
            { id: 'cols-2', label: '2' },
            { id: 'cols-3', label: '3' },
            { id: 'cols-4', label: '4' },
            { id: 'cols-5', label: '5' },
          ],
        },
      ],
    },
    {
      group: 'info',
      sel: '.info-grid',
      sections: [
        {
          id: 'layout',
          title: '布局',
          items: [
            { id: 'layout-grid-a', label: '格子 A' },
            { id: 'layout-grid-b', label: '格子 B' },
            { id: 'layout-stack', label: '列表 A' },
            { id: 'layout-row', label: '列表 B' },
          ],
        },
        {
          id: 'index',
          check: true,
          items: [
            { id: 'index-on', label: '显示编号', check: true },
          ],
        },
        {
          id: 'bg',
          check: true,
          items: [
            { id: 'bg', label: '背景', check: true },
          ],
        },
        {
          id: 'pos',
          title: '编号位置',
          when: 'index-on',
          side: true,
          items: [
            { id: 'pos-top', label: '顶部' },
            { id: 'pos-left', label: '左侧' },
          ],
        },
        {
          id: 'type',
          title: '编号类型',
          when: 'index-on',
          side: true,
          items: [
            { id: 'type-num', label: '数字' },
            { id: 'type-alpha', label: '字母' },
            { id: 'type-q', label: '问题' },
            { id: 'type-label', label: '标签' },
          ],
        },
        {
          id: 'size',
          title: '编号字号',
          when: 'index-on',
          side: true,
          items: [
            { id: 'no-lg', label: '大' },
            { id: 'no-sm', label: '小' },
          ],
        },
        {
          id: 'cols',
          title: '列数',
          when: 'grid',
          items: [
            { id: 'cols-2', label: '2' },
            { id: 'cols-3', label: '3' },
            { id: 'cols-4', label: '4' },
            { id: 'cols-5', label: '5' },
          ],
        },
      ],
    },
    {
      group: 'plain',
      sel: '.plain-grid',
      sections: [
        {
          id: 'layout',
          title: '布局',
          items: [
            { id: 'layout-grid-a', label: '格子 A' },
            { id: 'layout-grid-b', label: '格子 B' },
          ],
        },
        {
          id: 'surface',
          title: '底',
          items: [
            { id: 'plain', label: '默认底' },
            { id: 'tint', label: '浅底' },
            { id: 'line', label: '夹线' },
          ],
        },
      ],
    },
    {
      group: 'pain',
      sel: '.pain-text-list',
      sections: [
        {
          id: 'layout',
          title: '布局',
          items: [
            { id: 'layout-grid-a', label: '格子 A' },
            { id: 'layout-grid-b', label: '格子 B' },
          ],
        },
        {
          id: 'cols',
          title: '列数',
          items: [
            { id: 'cols-2', label: '2' },
            { id: 'cols-3', label: '3' },
            { id: 'cols-4', label: '4' },
            { id: 'cols-5', label: '5' },
          ],
        },
      ],
    },
    {
      group: 'point',
      sel: '.point',
      items: [
        { id: 'tint', label: '观点色块' },
        { id: 'soft', label: '浅底观点' },
      ],
    },
    {
      group: 'shot',
      sel: '.shot',
      title: '类型',
      items: [
        { id: 'crop', label: '裁切' },
        { id: 'scroll', label: '可滚动' },
        { id: 'wide', label: '宽图' },
        { id: 'poster', label: '海报' },
      ],
    },
    {
      group: 'cover',
      sel: '.chapter-cover',
      title: '版式',
      items: [
        { id: 'left', label: '左齐' },
        { id: 'center', label: '居中' },
        { id: 'image', label: '配图' },
        { id: 'split', label: '图文分栏' },
      ],
    },
  ];

  const specOf = (host) => VARIANT_SPECS.find((spec) => host?.matches?.(spec.sel)) || null;

  const variantHostOf = (node) => {
    if (!node?.closest) return null;
    if (node.closest('.comp-media')) {
      const shot = node.closest('.shot') || node.closest('.comp-media')?.querySelector('.shot');
      if (shot) return shot;
    }
    for (const spec of VARIANT_SPECS) {
      const host = node.closest(spec.sel);
      if (host) return host;
    }
    return null;
  };

  const infoKindOf = (grid) => {
    const v = grid.getAttribute('data-layout') || '';
    if (v === 'cols' || v === 'stack' || v === 'row' || v === 'label') return v;
    return 'left';
  };

  const infoShapeOf = (grid) => {
    const v = grid.getAttribute('data-layout') || '';
    if (v === 'stack' || v === 'label') return 'stack';
    if (v === 'row') return 'row';
    return 'grid';
  };

  const infoPosOf = (grid) => {
    const pos = grid.getAttribute('data-pos');
    if (pos === 'top' || pos === 'left') return pos;
    return (grid.getAttribute('data-layout') || '') === 'cols' ? 'top' : 'left';
  };

  const writeInfoKind = (grid, kind) => {
    const cur = grid.getAttribute('data-layout') || '';
    if (cur === 'split' || cur === '2') grid.dataset.seedLeftLayout = cur;
    if (kind === 'left') {
      const fallback = grid.getAttribute('data-cols') === '2' ? 'split' : '2';
      grid.setAttribute('data-layout', grid.dataset.seedLeftLayout || fallback);
      return;
    }
    if (kind === 'label') {
      grid.setAttribute('data-layout', 'stack');
      return;
    }
    grid.setAttribute('data-layout', kind);
  };

  const writeInfoShape = (grid, shape) => {
    const pos = infoPosOf(grid);
    if (shape === 'grid') {
      writeInfoKind(grid, pos === 'left' ? 'left' : 'cols');
    } else {
      writeInfoKind(grid, shape === 'row' ? 'row' : 'stack');
    }
    grid.setAttribute('data-pos', pos);
  };

  const writeInfoPos = (grid, pos) => {
    grid.setAttribute('data-pos', pos);
    if (infoShapeOf(grid) === 'grid') writeInfoKind(grid, pos === 'left' ? 'left' : 'cols');
  };

  const infoColsOf = (grid) => {
    const n = Number(grid.getAttribute('data-cols') || 0);
    if (n === 2 || n === 3 || n === 4 || n === 5) return n;
    return 3;
  };

  const writeInfoCols = (grid, n) => {
    const cols = n === 2 || n === 3 || n === 4 || n === 5 ? n : 3;
    grid.setAttribute('data-cols', String(cols));
    if (infoShapeOf(grid) === 'grid') {
      writeInfoKind(grid, 'cols');
      if (!grid.getAttribute('data-pos')) grid.setAttribute('data-pos', 'top');
    }
  };

  const GRID_HOST_SEL = '.info-grid, .plain-grid, .pain-text-list, .stat-grid, .stat-row';
  const gridHostOf = (host) => {
    if (!host) return null;
    if (host.matches?.(GRID_HOST_SEL)) return host;
    return host.closest?.(GRID_HOST_SEL) || null;
  };
  const gridKindOf = (host) => (gridHostOf(host)?.getAttribute('data-grid') === 'b' ? 'b' : 'a');
  const writeGridKind = (host, kind) => {
    const grid = gridHostOf(host);
    if (!grid) return;
    if (kind === 'b') grid.setAttribute('data-grid', 'b');
    else grid.removeAttribute('data-grid');
  };
  const infoBgOn = (host) => host?.hasAttribute?.('data-bg');
  const infoBgColorOf = (host) => {
    const raw = host?.style?.getPropertyValue('--info-bg')?.trim();
    return raw || '';
  };
  const writeInfoBg = (host, on, color) => {
    if (!host?.matches?.('.info-grid')) return;
    if (on) {
      host.setAttribute('data-bg', '');
      host.style.setProperty('--info-bg', color || infoBgColorOf(host) || '#EDF4FD');
    } else {
      host.removeAttribute('data-bg');
      host.style.removeProperty('--info-bg');
    }
  };

  const asideHostOf = (node) => {
    if (!node?.closest) return null;
    return node.closest('.info-grid, .pain-text-list, .plain-grid');
  };
  const asideOn = (host) => !!(host && host.hasAttribute('data-aside') && host.querySelector(':scope > .comp-media'));
  const asidePosOf = (host) => (host?.getAttribute('data-aside') === 'left' ? 'left' : 'right');
  const emptyAsideShot = () => {
    const wrap = document.createElement('div');
    wrap.className = 'comp-media';
    wrap.innerHTML = '<figure class="shot" data-kind="photo"><div class="shot__frame"><img alt=""></div><figcaption><b>图片标题</b><span>一句说明。</span></figcaption></figure>';
    return wrap;
  };
  const ensureAsideCaption = (shot) => {
    if (!shot || shot.querySelector(':scope > figcaption')) return;
    const cap = document.createElement('figcaption');
    cap.innerHTML = '<b>图片标题</b><span>一句说明。</span>';
    shot.append(cap);
  };
  const convertPlainGrid = (grid) => {
    if (!grid?.matches?.('.plain-grid')) return grid;
    const main = grid.querySelector(':scope > .comp-main') || grid;
    const items = [...main.querySelectorAll(':scope > .plain')];
    items.forEach((plain, i) => {
      const article = document.createElement('article');
      article.className = 'info';
      const no = document.createElement('span');
      no.className = 'info__no';
      no.textContent = String(i + 1).padStart(2, '0');
      const titleSrc = plain.querySelector(':scope > b');
      const h3 = document.createElement('h3');
      if (titleSrc) h3.innerHTML = titleSrc.innerHTML;
      else h3.textContent = '要点标题';
      article.append(no, h3);
      [...plain.children].forEach((child) => {
        if (child === titleSrc) return;
        article.append(child);
      });
      plain.replaceWith(article);
    });
    const cols = grid.getAttribute('data-cols');
    const kind = grid.getAttribute('data-grid');
    const aside = grid.getAttribute('data-aside');
    const surface = grid.getAttribute('data-surface');
    grid.classList.remove('plain-grid');
    grid.classList.add('info-grid');
    grid.setAttribute('data-layout', 'cols');
    grid.setAttribute('data-pos', 'top');
    grid.setAttribute('data-index', 'off');
    if (cols) grid.setAttribute('data-cols', cols);
    else if (items.length >= 2) grid.setAttribute('data-cols', String(Math.min(5, Math.max(2, items.length))));
    if (kind) grid.setAttribute('data-grid', kind);
    if (aside) grid.setAttribute('data-aside', aside);
    if (surface === 'tint') grid.setAttribute('data-bg', '');
    grid.removeAttribute('data-surface');
    return grid;
  };

  const migrateCoverActions = (root = document) => {
    root.querySelectorAll('.chapter-cover').forEach((cover) => {
      if (cover.querySelector('.chapter-cover__actions')) return;
      const leads = [...cover.querySelectorAll('.chapter-cover__lead')];
      const candidate = [...leads].reverse().find((p) => {
        const links = [...p.querySelectorAll(':scope > a')];
        if (!links.length) return false;
        const clone = p.cloneNode(true);
        clone.querySelectorAll('a').forEach((a) => a.remove());
        return !clone.textContent.replace(/\s/g, '');
      });
      if (!candidate) return;
      const actions = document.createElement('div');
      actions.className = 'chapter-cover__actions';
      [...candidate.querySelectorAll(':scope > a')].forEach((a, i) => {
        a.classList.add('button');
        if (i === 0) a.classList.add('primary');
        a.textContent = (a.textContent || '').replace(/\s*→\s*$/, '').trim();
        actions.append(a);
      });
      candidate.replaceWith(actions);
    });
  };

  const hydrateEditorial = (root = document) => {
    migrateCoverActions(root);
    root.querySelectorAll('.plain-grid').forEach(convertPlainGrid);
  };

  const wrapAsideMain = (host) => {
    if (!host) return null;
    let main = host.querySelector(':scope > .comp-main');
    if (main) return main;
    main = document.createElement('div');
    main.className = 'comp-main';
    [...host.children]
      .filter((el) => !el.classList.contains('comp-media') && !el.classList.contains('comp-main'))
      .forEach((el) => main.append(el));
    const media = host.querySelector(':scope > .comp-media');
    if (media) host.insertBefore(main, media);
    else host.prepend(main);
    return main;
  };
  const unwrapAsideMain = (host) => {
    const main = host.querySelector(':scope > .comp-main');
    if (!main) return;
    while (main.firstChild) host.insertBefore(main.firstChild, main);
    main.remove();
  };
  const stripItemAsides = (root = document) => {
    root.querySelectorAll('.info[data-aside], .pain-topic-head[data-aside], .pain-detail-list li[data-aside]').forEach((el) => {
      el.removeAttribute('data-aside');
      el.querySelector(':scope > .comp-media')?.remove();
    });
  };
  const writeAside = (host, on, pos) => {
    if (!host) return;
    stripItemAsides(host);
    const media = host.querySelector(':scope > .comp-media');
    if (on) {
      const next = pos === 'left' || pos === 'right' ? pos : asidePosOf(host);
      host.setAttribute('data-aside', next);
      wrapAsideMain(host);
      if (!media) host.append(emptyAsideShot());
      host.querySelectorAll(':scope > .comp-media .shot').forEach(ensureAsideCaption);
    } else {
      host.removeAttribute('data-aside');
      host.style.removeProperty('height');
      host.style.removeProperty('min-height');
      host.style.removeProperty('--aside-w');
      host.classList.remove('is-aside-sized');
      media?.remove();
      unwrapAsideMain(host);
    }
  };

  const writeInfoNo = (grid, lg) => {
    if (lg) grid.setAttribute('data-no', 'lg');
    else grid.removeAttribute('data-no');
    grid.querySelectorAll('.info').forEach((el) => el.classList.toggle('is-lg', lg));
  };

  const isSeqNo = (text) => /^(0?\d+|Q\d+|[A-Z])$/i.test(String(text || '').trim());

  const infoIndexOf = (grid) => (grid.getAttribute('data-index') === 'off' ? 'off' : 'on');

  const infoTypeOf = (grid) => {
    const v = grid.getAttribute('data-index');
    if (v === 'alpha' || v === 'q' || v === 'label') return v;
    if (v === 'off') {
      const remembered = grid.dataset.seedIndexType;
      if (remembered === 'alpha' || remembered === 'q' || remembered === 'label' || remembered === 'num') {
        return remembered;
      }
    }
    if ((grid.getAttribute('data-layout') || '') === 'label') return 'label';
    const labels = infoLabelsOf(grid).map((t) => t.trim()).filter(Boolean);
    if (labels.length && labels.every((t) => /^Q\d+$/i.test(t))) return 'q';
    if (labels.length && labels.every((t) => /^[A-Z]$/.test(t))) return 'alpha';
    if (labels.length && labels.every((t) => !isSeqNo(t))) return 'label';
    return 'num';
  };

  const infoLabelsOf = (grid) => [...grid.querySelectorAll('.info')].map((el) => {
    const no = el.querySelector('.info__no');
    return no ? no.textContent : '';
  });

  const formatInfoIndex = (i, type) => {
    if (type === 'alpha') return String.fromCharCode(65 + (i % 26));
    if (type === 'q') return `Q${i + 1}`;
    return String(i + 1).padStart(2, '0');
  };

  const ensureInfoNo = (item) => {
    let no = item.querySelector('.info__no');
    if (!no) {
      no = document.createElement('span');
      no.className = 'info__no';
      item.prepend(no);
    }
    return no;
  };

  const writeInfoLabels = (grid, labels) => {
    grid.querySelectorAll('.info').forEach((el, i) => {
      if (labels && labels[i] != null) ensureInfoNo(el).textContent = labels[i];
    });
  };

  const writeInfoIndex = (grid, kind, labels) => {
    if (labels) writeInfoLabels(grid, labels);
    if (kind === 'off') {
      if (!labels) {
        const prev = grid.getAttribute('data-index');
        if (prev && prev !== 'off') grid.dataset.seedIndexType = prev === 'alpha' || prev === 'q' || prev === 'label' ? prev : 'num';
        else if (!grid.dataset.seedIndexType) grid.dataset.seedIndexType = infoTypeOf(grid);
      }
      grid.setAttribute('data-index', 'off');
      return;
    }
    const type = kind === 'alpha' || kind === 'q' || kind === 'label' || kind === 'num' ? kind : 'num';
    grid.dataset.seedIndexType = type;
    if ((grid.getAttribute('data-layout') || '') === 'label') grid.setAttribute('data-layout', 'stack');
    if (!labels) {
      grid.querySelectorAll('.info').forEach((el, i) => {
        const no = ensureInfoNo(el);
        if (type === 'label') {
          if (!no.textContent.trim() || isSeqNo(no.textContent)) no.textContent = '标签';
          return;
        }
        no.textContent = formatInfoIndex(i, type);
      });
    }
    if (type === 'num') grid.removeAttribute('data-index');
    else grid.setAttribute('data-index', type);
  };

  const ensureStatSlots = (card) => {
    let kicker = card.querySelector('.stat-card__kicker');
    if (!kicker) {
      kicker = document.createElement('span');
      kicker.className = 'stat-card__kicker';
      card.prepend(kicker);
    }
    let num = card.querySelector('.stat-card__num');
    if (!num) {
      num = document.createElement('strong');
      num.className = 'stat-card__num';
      kicker.after(num);
    }
    let prefix = num.querySelector('.stat-card__prefix');
    if (!prefix) {
      prefix = document.createElement('span');
      prefix.className = 'stat-card__prefix';
      num.prepend(prefix);
    }
    let suffix = num.querySelector('.stat-card__suffix') || num.querySelector('.stat-card__ratio');
    if (!suffix) {
      suffix = document.createElement('span');
      suffix.className = 'stat-card__suffix';
      num.append(suffix);
    } else {
      suffix.className = 'stat-card__suffix';
    }
    return { kicker, num, prefix, suffix };
  };

  const statFlagOn = (card, flag) => {
    if (card.hasAttribute(`data-${flag}`)) return true;
    if (flag === 'kicker' || flag === 'suffix') return card.getAttribute('data-variant') === 'note';
    return false;
  };

  const writeStatFlag = (card, flag, on) => {
    ensureStatSlots(card);
    const slots = ensureStatSlots(card);
    if (card.getAttribute('data-variant') === 'note') {
      if (!card.hasAttribute('data-kicker')) card.setAttribute('data-kicker', '');
      if (!card.hasAttribute('data-suffix')) card.setAttribute('data-suffix', '');
      card.removeAttribute('data-variant');
    }
    if (on) {
      card.setAttribute(`data-${flag}`, '');
      if (flag === 'prefix' && !(slots.prefix.textContent || '').trim()) slots.prefix.textContent = '¥';
      if (flag === 'suffix' && !(slots.suffix.textContent || '').trim()) slots.suffix.textContent = '%';
      if (flag === 'kicker' && !(slots.kicker.textContent || '').trim()) slots.kicker.textContent = '说明';
    } else {
      card.removeAttribute(`data-${flag}`);
    }
  };

  const writeStatCols = (host, cols) => {
    const grid = host.closest?.('.stat-grid, .stat-row') || (host.matches?.('.stat-grid, .stat-row') ? host : null);
    if (!grid) return;
    if (cols) grid.setAttribute('data-cols', String(cols));
    else grid.removeAttribute('data-cols');
  };

  const ensureShotGrid = (host) => {
    if (!host) return null;
    if (host.matches?.('.shot-grid')) return host;
    const nested = host.closest?.('.shot-grid');
    if (nested) return nested;
    const shot = host.matches?.('.shot, figure.shot') ? host : null;
    if (!shot || shot.closest('.shot-stack, .chapter-cover')) return null;
    const wrap = document.createElement('div');
    wrap.className = 'shot-grid';
    wrap.setAttribute('data-cols', '1');
    shot.replaceWith(wrap);
    wrap.append(shot);
    return wrap;
  };

  const writeShotCols = (host, cols) => {
    const grid = ensureShotGrid(host);
    if (!grid) return;
    grid.setAttribute('data-cols', String(cols || 1));
    grid.querySelectorAll(':scope > .shot').forEach((shot) => {
      shot.style.removeProperty('width');
      shot.style.removeProperty('max-width');
      shot.style.removeProperty('margin-left');
      shot.style.removeProperty('margin-right');
      if (shot.dataset.align === 'center' || shot.dataset.align === 'right') shot.dataset.align = 'left';
    });
    if (grid.classList.contains('is-sized')) {
      const colsN = Math.max(1, Number(cols || 1));
      const n = grid.querySelectorAll(':scope > .shot').length;
      const rows = Math.max(1, Math.ceil(n / colsN));
      grid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    }
  };

  const writePlainCols = (host, cols) => {
    const grid = host.closest?.('.plain-grid') || (host.matches?.('.plain-grid') ? host : null);
    if (!grid) return;
    grid.setAttribute('data-cols', String(cols || 4));
  };

  const writeHostCols = (host, spec, n) => {
    if (!host || !spec) return;
    const cols = Number(n);
    if (spec.group === 'stat' || spec.group === 'stat-row') writeStatCols(host, cols);
    else if (spec.group === 'info') writeInfoCols(host, cols);
    else if (spec.group === 'shot') writeShotCols(host, cols);
    else if (spec.group === 'plain') writePlainCols(host, cols);
    else if (spec.group === 'pain') {
      const grid = host.closest?.('.pain-text-list') || (host.matches?.('.pain-text-list') ? host : null);
      if (grid) grid.setAttribute('data-cols', String(cols || 2));
    }
  };

  const colsRangeOf = (spec, host) => {
    if (!spec || !host) return null;
    if (spec.group === 'shot') {
      if (host.closest('.comp-media')) return null;
      const grid = host.closest('.shot-grid') || (host.matches('.shot-grid') ? host : null);
      const n = Number((grid || host).getAttribute?.('data-cols') || 1);
      return { min: 1, max: 5, value: n >= 1 && n <= 5 ? n : 1 };
    }
    if (spec.group === 'stat') {
      const grid = host.closest('.stat-grid') || (host.matches('.stat-grid') ? host : null);
      if (!grid) return null;
      const fallback = grid.classList.contains('is-compact') ? 5 : 3;
      const n = Number(grid.getAttribute('data-cols') || fallback);
      return { min: 2, max: 5, value: n >= 2 && n <= 5 ? n : fallback };
    }
    if (spec.group === 'stat-row') {
      const n = Number(host.getAttribute('data-cols') || 5);
      return { min: 2, max: 5, value: n >= 2 && n <= 5 ? n : 5 };
    }
    if (spec.group === 'info') {
      return { min: 2, max: 5, value: infoColsOf(host) };
    }
    if (spec.group === 'plain') {
      const n = Number(host.getAttribute('data-cols') || 4);
      return { min: 2, max: 5, value: n >= 2 && n <= 5 ? n : 4 };
    }
    if (spec.group === 'pain') {
      const n = Number(host.getAttribute('data-cols') || 2);
      return { min: 1, max: 5, value: n >= 1 && n <= 5 ? n : 2 };
    }
    return null;
  };

  const COVER_KINDS = new Set(['left', 'center', 'image', 'split']);
  const COVER_MEDIA_SRC = 'assets/demo/pet-travel.png';

  const ensureCoverMedia = (host) => {
    if (!host?.matches?.('.chapter-cover')) return;
    let copy = host.querySelector(':scope > .chapter-cover__copy');
    if (!copy) {
      copy = document.createElement('div');
      copy.className = 'chapter-cover__copy';
      [...host.children].forEach((el) => {
        if (el.classList.contains('chapter-cover__media')) return;
        copy.append(el);
      });
      host.append(copy);
    }
    let media = host.querySelector(':scope > .chapter-cover__media');
    if (!media) {
      media = document.createElement('div');
      media.className = 'chapter-cover__media';
      const img = document.createElement('img');
      img.alt = '';
      img.src = COVER_MEDIA_SRC;
      media.append(img);
      host.prepend(media);
      return;
    }
    let img = media.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      media.append(img);
    }
    if (!(img.getAttribute('src') || '').trim()) img.src = COVER_MEDIA_SRC;
  };

  const writeCoverKind = (host, id) => {
    ensureCoverMedia(host);
    const kind = COVER_KINDS.has(id) ? id : 'left';
    if (kind === 'left') host.removeAttribute('data-cover');
    else host.setAttribute('data-cover', kind);
  };

  const coverKindOf = (host) => {
    const kind = host?.getAttribute?.('data-cover') || 'left';
    return COVER_KINDS.has(kind) ? kind : 'left';
  };

  const snapshotVariant = (host) => {
    const spec = specOf(host);
    if (!spec) return null;
    if (spec.group === 'stat') {
      const grid = host.closest('.stat-grid') || (host.matches('.stat-grid') ? host : null);
      return {
        group: 'stat',
        prefix: statFlagOn(host, 'prefix'),
        suffix: statFlagOn(host, 'suffix'),
        kicker: statFlagOn(host, 'kicker'),
        cols: grid?.getAttribute('data-cols') || '',
        grid: gridKindOf(grid || host),
      };
    }
    if (spec.group === 'stat-row') {
      return { group: 'stat-row', cols: host.getAttribute('data-cols') || '' };
    }
    if (spec.group === 'info') {
      return {
        group: 'info',
        layout: infoKindOf(host),
        pos: infoPosOf(host),
        no: host.getAttribute('data-no') === 'lg' || host.querySelector('.info.is-lg') ? 'lg' : 'sm',
        index: infoIndexOf(host),
        type: infoTypeOf(host),
        labels: infoLabelsOf(host),
        seedIndexType: host.dataset.seedIndexType || '',
        seedLeftLayout: host.dataset.seedLeftLayout || '',
        cols: infoColsOf(host),
        grid: gridKindOf(host),
        bg: infoBgOn(host),
        bgColor: infoBgColorOf(host),
      };
    }
    if (spec.group === 'plain') {
      return {
        group: 'plain',
        surface: host.getAttribute('data-surface') || 'plain',
        cols: host.getAttribute('data-cols') || '',
        grid: gridKindOf(host),
      };
    }
    if (spec.group === 'pain') {
      return {
        group: 'pain',
        cols: host.getAttribute('data-cols') || '2',
        grid: gridKindOf(host),
      };
    }
    if (spec.group === 'point') return { group: 'point', soft: host.classList.contains('is-soft') };
    if (spec.group === 'shot') {
      const kind = host.getAttribute('data-kind') || 'crop';
      const grid = host.closest('.shot-grid');
      return {
        group: 'shot',
        kind: kind === 'photo' ? 'crop' : kind,
        shotCols: grid?.getAttribute('data-cols') || '',
      };
    }
    if (spec.group === 'cover') return { group: 'cover', kind: coverKindOf(host) };
    return { group: spec.group };
  };

  const restoreVariant = (host, snap) => {
    if (!host || !snap) return;
    if (snap.group === 'stat') {
      writeStatFlag(host, 'prefix', !!snap.prefix);
      writeStatFlag(host, 'suffix', !!snap.suffix);
      writeStatFlag(host, 'kicker', !!snap.kicker);
      if (snap.variant === 'note' && snap.prefix == null) {
        writeStatFlag(host, 'suffix', true);
        writeStatFlag(host, 'kicker', true);
      }
      writeStatCols(host, snap.cols);
      writeGridKind(host, snap.grid);
      return;
    }
    if (snap.group === 'stat-row') {
      writeStatCols(host, snap.cols);
      writeGridKind(host, snap.grid);
      return;
    }
    if (snap.group === 'info') {
      if (snap.seedLeftLayout) host.dataset.seedLeftLayout = snap.seedLeftLayout;
      else delete host.dataset.seedLeftLayout;
      writeInfoKind(host, snap.layout === 'label' ? 'stack' : snap.layout);
      if (snap.pos) host.setAttribute('data-pos', snap.pos);
      else host.removeAttribute('data-pos');
      writeInfoNo(host, snap.no === 'lg');
      if (snap.seedIndexType) host.dataset.seedIndexType = snap.seedIndexType;
      else delete host.dataset.seedIndexType;
      const indexKind = snap.index === 'off'
        ? 'off'
        : (snap.index === 'on' ? (snap.type || 'num') : (snap.index || snap.type || 'num'));
      writeInfoIndex(host, indexKind, snap.labels);
      if (snap.cols) writeInfoCols(host, snap.cols);
      writeGridKind(host, snap.grid);
      writeInfoBg(host, !!snap.bg, snap.bgColor);
      return;
    }
    if (snap.group === 'plain') {
      if (!snap.surface || snap.surface === 'plain') host.removeAttribute('data-surface');
      else host.setAttribute('data-surface', snap.surface);
      if (snap.cols) host.setAttribute('data-cols', snap.cols);
      writeGridKind(host, snap.grid);
      return;
    }
    if (snap.group === 'pain') {
      if (snap.cols) host.setAttribute('data-cols', snap.cols);
      writeGridKind(host, snap.grid);
      return;
    }
    if (snap.group === 'point') {
      host.classList.toggle('is-soft', !!snap.soft);
      return;
    }
    if (snap.group === 'shot') {
      if (snap.kind) host.setAttribute('data-kind', snap.kind === 'photo' ? 'crop' : snap.kind);
      if ('shotCols' in snap) writeShotCols(host, snap.shotCols || 1);
      return;
    }
    if (snap.group === 'cover') writeCoverKind(host, snap.kind);
  };

  const applyVariantId = (host, id) => {
    const spec = specOf(host);
    if (!spec) return;
    const before = snapshotVariant(host);
    const colsMatch = String(id || '').match(/^cols-([1-5])$/);
    if (colsMatch) {
      writeHostCols(host, spec, colsMatch[1]);
      return { before, after: snapshotVariant(host) };
    }
    if (spec.group === 'stat') {
      if (id === 'prefix' || id === 'suffix' || id === 'kicker') {
        writeStatFlag(host, id, !statFlagOn(host, id));
      } else if (id === 'layout-grid-a' || id === 'layout-grid') writeGridKind(host, 'a');
      else if (id === 'layout-grid-b') writeGridKind(host, 'b');
    } else if (spec.group === 'info') {
      if (id === 'no-lg') writeInfoNo(host, true);
      else if (id === 'no-sm') writeInfoNo(host, false);
      else if (id === 'index-off') writeInfoIndex(host, 'off');
      else if (id === 'index-on') {
        if ((host.getAttribute('data-index') || '') === 'off') {
          writeInfoIndex(host, infoTypeOf(host), infoLabelsOf(host));
        } else {
          writeInfoIndex(host, 'off');
        }
      }
      else if (id === 'type-alpha') writeInfoIndex(host, 'alpha');
      else if (id === 'type-num') writeInfoIndex(host, 'num');
      else if (id === 'type-q') writeInfoIndex(host, 'q');
      else if (id === 'type-label') writeInfoIndex(host, 'label');
      else if (id === 'layout-grid' || id === 'layout-grid-a') {
        writeInfoShape(host, 'grid');
        writeGridKind(host, 'a');
      }
      else if (id === 'layout-grid-b') {
        writeInfoShape(host, 'grid');
        writeGridKind(host, 'b');
      }
      else if (id === 'layout-stack') writeInfoShape(host, 'stack');
      else if (id === 'layout-row') writeInfoShape(host, 'row');
      else if (id === 'pos-top') writeInfoPos(host, 'top');
      else if (id === 'pos-left') writeInfoPos(host, 'left');
      else if (id === 'bg') writeInfoBg(host, !infoBgOn(host), infoBgColorOf(host));
      else writeInfoKind(host, id);
    } else if (spec.group === 'plain') {
      if (id === 'layout-grid-a' || id === 'layout-grid') writeGridKind(host, 'a');
      else if (id === 'layout-grid-b') writeGridKind(host, 'b');
      else restoreVariant(host, { group: 'plain', surface: id, cols: host.getAttribute('data-cols') || '', grid: gridKindOf(host) });
    } else if (spec.group === 'pain') {
      if (id === 'layout-grid-a' || id === 'layout-grid') writeGridKind(host, 'a');
      else if (id === 'layout-grid-b') writeGridKind(host, 'b');
    } else if (spec.group === 'point') {
      restoreVariant(host, { group: 'point', soft: id === 'soft' });
    } else if (spec.group === 'shot') {
      host.setAttribute('data-kind', id === 'photo' ? 'crop' : id);
    } else if (spec.group === 'cover') {
      writeCoverKind(host, id);
    }
    return { before, after: snapshotVariant(host) };
  };

  const variantActiveIds = (host) => {
    const snap = snapshotVariant(host);
    if (!snap) return [];
    if (snap.group === 'stat') {
      const ids = [];
      if (snap.prefix) ids.push('prefix');
      if (snap.suffix) ids.push('suffix');
      if (snap.kicker) ids.push('kicker');
      if (snap.cols) ids.push(`cols-${snap.cols}`);
      ids.push(snap.grid === 'b' ? 'layout-grid-b' : 'layout-grid-a');
      return ids;
    }
    if (snap.group === 'stat-row') {
      const ids = snap.cols ? [`cols-${snap.cols}`] : [];
      ids.push(snap.grid === 'b' ? 'layout-grid-b' : 'layout-grid-a');
      return ids;
    }
    if (snap.group === 'info') {
      const shape = snap.layout === 'row' ? 'row' : (snap.layout === 'stack' || snap.layout === 'label') ? 'stack' : 'grid';
      const type = snap.type === 'alpha' || snap.type === 'q' || snap.type === 'label' ? snap.type : 'num';
      const pos = snap.pos || (snap.layout === 'cols' ? 'top' : 'left');
      const ids = [
        shape === 'grid' ? (snap.grid === 'b' ? 'layout-grid-b' : 'layout-grid-a') : `layout-${shape}`,
        snap.index === 'off' ? 'index-off' : 'index-on',
        `pos-${pos}`,
        `type-${type}`,
        snap.no === 'lg' ? 'no-lg' : 'no-sm',
        `cols-${snap.cols || 3}`,
      ];
      if (snap.bg) ids.push('bg');
      return ids;
    }
    if (snap.group === 'plain') {
      const ids = [snap.surface || 'plain'];
      if (snap.cols) ids.push(`cols-${snap.cols}`);
      ids.push(snap.grid === 'b' ? 'layout-grid-b' : 'layout-grid-a');
      return ids;
    }
    if (snap.group === 'pain') {
      const ids = [snap.grid === 'b' ? 'layout-grid-b' : 'layout-grid-a'];
      if (snap.cols) ids.push(`cols-${snap.cols}`);
      return ids;
    }
    if (snap.group === 'point') return [snap.soft ? 'soft' : 'tint'];
    if (snap.group === 'shot') {
      const ids = [snap.kind === 'photo' ? 'crop' : (snap.kind || 'crop')];
      if (snap.shotCols) ids.push(`cols-${snap.shotCols}`);
      return ids;
    }
    if (snap.group === 'cover') return [snap.kind || 'left'];
    return [];
  };

  const parseChartNumber = (raw) => {
    const m = String(raw || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  };

  const nearEq = (a, b) => Math.abs(a - b) < 0.8;

  const readChartScale = (svg) => {
    const grids = [...svg.querySelectorAll('.chart-grid')]
      .map((el) => +el.getAttribute('y1'))
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => b - a);
    const ticks = [...svg.querySelectorAll('.chart-tick')]
      .map((el) => parseChartNumber(el.textContent))
      .filter((n) => n != null);
    if (grids.length < 2 || ticks.length < 2) return null;
    return { y0: grids[0], yMax: grids[grids.length - 1], v0: ticks[0], vMax: ticks[ticks.length - 1] };
  };

  const valueToY = (scale, value) => {
    const span = scale.vMax - scale.v0 || 1;
    return scale.y0 - ((value - scale.v0) / span) * (scale.y0 - scale.yMax);
  };

  const niceMax = (value) => {
    const v = Math.max(0, Number(value) || 0);
    if (v === 0) return 100;
    const padded = v * 1.12;
    const mag = 10 ** Math.floor(Math.log10(padded));
    const n = padded / mag;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * mag;
  };

  const formatTick = (n) => {
    if (n >= 1000 && n % 1000 === 0) return String(n);
    if (n >= 100 && n % 1 === 0) return String(Math.round(n));
    return String(n);
  };

  const remapChart = (svg) => {
    if (!svg) return;
    const grids = [...svg.querySelectorAll('.chart-grid')]
      .map((el) => +el.getAttribute('y1'))
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => b - a);
    const ticks = [...svg.querySelectorAll('.chart-tick')]
      .sort((a, b) => (+b.getAttribute('y') || 0) - (+a.getAttribute('y') || 0));
    const values = [...svg.querySelectorAll('.chart-value')]
      .map((el) => parseChartNumber(el.textContent))
      .filter((n) => n != null);
    if (grids.length < 2 || !values.length) {
      syncChartValueLegacy(svg);
      return;
    }
    const y0 = grids[0];
    const yMax = grids[grids.length - 1];
    const maxV = niceMax(Math.max(...values, 0));
    const scale = { y0, yMax, v0: 0, vMax: maxV };
    ticks.forEach((el, i) => {
      const t = ticks.length === 1 ? 1 : i / (ticks.length - 1);
      el.textContent = formatTick(maxV * t);
    });
    const series = [
      { point: '.chart-point--trains', value: '.chart-value:not(.chart-value--stations)', line: '.chart-line--trains' },
      { point: '.chart-point--stations', value: '.chart-value--stations', line: '.chart-line--stations' },
    ];
    series.forEach((spec) => {
      const circles = [...svg.querySelectorAll(spec.point)]
        .sort((a, b) => (+a.getAttribute('cx') || 0) - (+b.getAttribute('cx') || 0));
      const texts = [...svg.querySelectorAll(spec.value)]
        .sort((a, b) => (+a.getAttribute('x') || 0) - (+b.getAttribute('x') || 0));
      if (!circles.length) return;
      circles.forEach((circle, i) => {
        const textEl = texts[i];
        const value = parseChartNumber(textEl?.textContent);
        if (value == null) return;
        const nextY = valueToY(scale, value);
        const oldY = +circle.getAttribute('cy');
        if (!textEl.dataset.seedDy) {
          textEl.dataset.seedDy = String((+textEl.getAttribute('y') || oldY) - oldY);
        }
        circle.setAttribute('cy', nextY.toFixed(1));
        textEl.setAttribute('y', (nextY + Number(textEl.dataset.seedDy)).toFixed(1));
      });
      const lines = [...svg.querySelectorAll(spec.line)].filter((el) => el.tagName === 'line');
      lines.forEach((line, i) => {
        const a = circles[i];
        const b = circles[i + 1];
        if (!a || !b) return;
        line.setAttribute('x1', a.getAttribute('cx'));
        line.setAttribute('y1', a.getAttribute('cy'));
        line.setAttribute('x2', b.getAttribute('cx'));
        line.setAttribute('y2', b.getAttribute('cy'));
      });
    });
    svg.querySelectorAll('polyline').forEach((el) => {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (nums.length < 4) return;
      const pts = [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = nums[i];
        const circle = [...svg.querySelectorAll('circle.chart-point')]
          .find((c) => nearEq(+c.getAttribute('cx'), x));
        pts.push(`${x},${circle ? circle.getAttribute('cy') : nums[i + 1]}`);
      }
      el.setAttribute('points', pts.join(' '));
    });
  };

  const layoutChartHeight = (box) => {
    if (!box?.matches?.('.rail-growth-chart')) return;
    const svg = box.querySelector('svg');
    if (!svg) return;
    if (!svg.dataset.seedVbH) {
      const vb = svg.viewBox.baseVal;
      svg.dataset.seedVbW = String(vb.width || 1160);
      svg.dataset.seedVbH = String(vb.height || 230);
      const grids = [...svg.querySelectorAll('.chart-grid')]
        .map((el) => +el.getAttribute('y1'))
        .filter((y) => Number.isFinite(y));
      svg.dataset.seedYMax = String(Math.min(...grids, 32));
      svg.dataset.seedY0 = String(Math.max(...grids, 178));
    }
    const vbW = +svg.dataset.seedVbW;
    const origH = +svg.dataset.seedVbH;
    const padTop = +svg.dataset.seedYMax;
    const padBot = origH - +svg.dataset.seedY0;
    const cssH = box.clientHeight || origH;
    const cssW = box.clientWidth || vbW;
    const vbH = box.style.height
      ? Math.max(origH, vbW * (cssH / Math.max(cssW, 1)))
      : origH;
    svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
    const yMax = padTop;
    const y0 = vbH - padBot;
    const grids = [...svg.querySelectorAll('.chart-grid')]
      .sort((a, b) => (+b.getAttribute('y1') || 0) - (+a.getAttribute('y1') || 0));
    const ticks = [...svg.querySelectorAll('.chart-tick')]
      .sort((a, b) => (+b.getAttribute('y') || 0) - (+a.getAttribute('y') || 0));
    grids.forEach((el, i) => {
      const t = grids.length === 1 ? 1 : i / (grids.length - 1);
      const y = (y0 - t * (y0 - yMax)).toFixed(1);
      el.setAttribute('y1', y);
      el.setAttribute('y2', y);
    });
    ticks.forEach((el, i) => {
      const t = ticks.length === 1 ? 1 : i / (ticks.length - 1);
      el.setAttribute('y', (y0 - t * (y0 - yMax) + 4).toFixed(1));
    });
    const axis = svg.querySelector('.chart-axis');
    if (axis) {
      axis.setAttribute('y1', yMax.toFixed(1));
      axis.setAttribute('y2', y0.toFixed(1));
    }
    const mid = (y0 + yMax) / 2;
    const axisLabel = svg.querySelector('.chart-axis-label');
    if (axisLabel) {
      const x = +axisLabel.getAttribute('x') || 17;
      axisLabel.setAttribute('y', mid.toFixed(1));
      axisLabel.setAttribute('transform', `rotate(-90 ${x} ${mid.toFixed(1)})`);
    }
    svg.querySelectorAll('.chart-date').forEach((el) => {
      el.setAttribute('y', (vbH - 12).toFixed(1));
    });
    remapChart(svg);
  };

  const scaleFunnelPathY = (d, sy) => (d || '').replace(
    /([ML])\s*([-\d.]+)[,\s]+([-\d.]+)/gi,
    (_, cmd, x, y) => `${cmd}${x} ${(parseFloat(y) * sy).toFixed(1)}`
  );

  const layoutFunnelHeight = (box) => {
    if (!box?.matches?.('.hotel-funnel-chart')) return;
    const svg = box.querySelector('svg');
    if (!svg) return;
    if (!svg.dataset.seedFunnelH) {
      const vb = svg.viewBox.baseVal;
      svg.dataset.seedFunnelW = String(vb.width || 1200);
      svg.dataset.seedFunnelH = String(vb.height || 300);
      svg.querySelectorAll('path.funnel-line').forEach((el) => {
        el.dataset.seedD = el.getAttribute('d') || '';
      });
      svg.querySelectorAll(':scope > g').forEach((el) => {
        el.dataset.seedT = el.getAttribute('transform') || '';
      });
    }
    const origW = +svg.dataset.seedFunnelW;
    const origH = +svg.dataset.seedFunnelH;
    const cssH = box.clientHeight || origH;
    const cssW = box.clientWidth || origW;
    const vbH = box.style.height
      ? Math.max(origH, origW * (cssH / Math.max(cssW, 1)))
      : origH;
    const sy = vbH / origH;
    svg.setAttribute('viewBox', `0 0 ${origW} ${vbH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.querySelectorAll('path.funnel-line').forEach((el) => {
      el.setAttribute('d', scaleFunnelPathY(el.dataset.seedD, sy));
    });
    svg.querySelectorAll(':scope > g').forEach((el) => {
      const t = el.dataset.seedT || '';
      el.setAttribute('transform', t.replace(
        /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/i,
        (_, x, y) => `translate(${x} ${(parseFloat(y) * sy).toFixed(1)})`
      ));
    });
  };

  const syncChartValueLegacy = (svg) => {
    const scale = readChartScale(svg);
    if (!scale) return;
    svg.querySelectorAll('.chart-value').forEach((textEl) => {
      const value = parseChartNumber(textEl.textContent);
      if (value == null) return;
      const group = textEl.closest('g') || svg;
      const texts = [...group.querySelectorAll('.chart-value')];
      const circles = [...group.querySelectorAll('circle.chart-point')];
      const x = +textEl.getAttribute('x');
      const circle = circles.find((c) => nearEq(+c.getAttribute('cx'), x)) || circles[texts.indexOf(textEl)];
      if (!circle) return;
      const oldX = +circle.getAttribute('cx');
      const oldY = +circle.getAttribute('cy');
      const nextY = valueToY(scale, value);
      circle.setAttribute('cy', nextY.toFixed(1));
      const labelOffset = (+textEl.getAttribute('y') || oldY) - oldY;
      textEl.setAttribute('y', (nextY + labelOffset).toFixed(1));
      svg.querySelectorAll('line.chart-line').forEach((line) => {
        if (nearEq(+line.getAttribute('x1'), oldX) && nearEq(+line.getAttribute('y1'), oldY)) {
          line.setAttribute('y1', nextY.toFixed(1));
        }
        if (nearEq(+line.getAttribute('x2'), oldX) && nearEq(+line.getAttribute('y2'), oldY)) {
          line.setAttribute('y2', nextY.toFixed(1));
        }
      });
    });
  };

  const syncChartValue = (textEl) => {
    const svg = textEl?.closest?.('svg') || (textEl?.classList?.contains('chart-value') ? textEl.closest('svg') : null);
    if (svg) remapChart(svg);
  };

  const hexInputValue = (raw) => {
    const s = String(raw || '').trim();
    const m6 = s.match(/^#([0-9a-f]{6})$/i);
    if (m6) return `#${m6[1].toLowerCase()}`;
    const m3 = s.match(/^#([0-9a-f]{3})$/i);
    if (!m3) return '';
    const [a, b, c] = m3[1].split('');
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  };

  const cssColorToHex = (raw) => {
    const fromHex = hexInputValue(raw);
    if (fromHex) return fromHex;
    const m = String(raw || '').trim().match(/^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/i);
    if (!m) return '';
    const h = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
  };

  const TEXT_COLOR_TOKENS = ['--c-text', '--c-text-2', '--c-text-3', '--c-text-4', '--c-accent', '--c-pos', '--c-neg', '--c-line'];

  const listColorTokens = () => {
    const seen = new Set();
    const names = [];
    document.querySelectorAll('[data-css-var][data-token-kind="color"]').forEach((host) => {
      const name = host.dataset.cssVar;
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    TEXT_COLOR_TOKENS.forEach((name) => {
      if (seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    return names;
  };

  const tokenColorHex = (name) => {
    const live = getComputedStyle(document.documentElement).getPropertyValue(name)
      || getComputedStyle(document.body).getPropertyValue(name);
    return cssColorToHex(live);
  };

  const paintColorSwatch = (swatch, value) => {
    if (!swatch) return;
    const hex = hexInputValue(value);
    if (swatch.tagName === 'INPUT') {
      if (hex) swatch.value = hex;
      return;
    }
    swatch.style.background = value;
  };

  const applyTokenValue = (node, { persistTheme = true } = {}) => {
    const host = node?.closest?.('[data-css-var]') || (node?.dataset?.cssVar ? node : null);
    const token = host?.dataset?.cssVar;
    if (!token) return;
    const valueEl = node?.classList?.contains('token-value')
      ? node
      : (host.querySelector('.token-value') || node);
    const raw = (valueEl.textContent || '').trim();
    if (!raw) return;
    const kind = host.dataset.tokenKind || (raw.startsWith('#') || raw.startsWith('rgb') ? 'color' : 'size');
    const value = kind === 'color' || /clamp\(|^[a-z#]|[a-z%)]$/i.test(raw)
      ? (kind === 'color' ? (hexInputValue(raw) || raw).toUpperCase() : raw)
      : `${parseFloat(raw) || 0}px`;
    if (kind === 'color' && valueEl && valueEl !== host && !valueEl.isContentEditable) {
      valueEl.textContent = value;
    }
    document.documentElement.style.setProperty(token, value);
    if (persistTheme && window.ThemeRuntime?.updateToken) {
      try { window.ThemeRuntime.updateToken(token, value); } catch (_) { /* keep live CSS even if theme store rejects */ }
    }
    const swatch = host.querySelector('.token-swatch');
    if (!swatch) return;
    if (kind === 'color') paintColorSwatch(swatch, value);
    if (kind === 'size') {
      const px = `${parseFloat(value) || parseFloat(raw) || 16}px`;
      swatch.style.width = px;
      swatch.style.height = Math.min(parseFloat(px) || 16, 40) + 'px';
    }
    if (kind === 'radius') {
      const px = `${parseFloat(value) || parseFloat(raw) || 0}px`;
      swatch.style.borderRadius = px;
    }
  };

  const ITEM_SPECS = [
    { host: '.pain-detail-list', item: ':scope > li' },
    { host: '.info-grid', item: ':scope > .info, :scope > .comp-main > .info' },
    { host: '.stat-grid', item: ':scope > .stat-card' },
    { host: '.plain-grid', item: ':scope > .plain, :scope > .comp-main > .plain' },
    { host: '.stat-row', item: ':scope > article' },
    { host: '.pain-text-list', item: ':scope > .pain-topic, :scope > .comp-main > .pain-topic' },
    { host: '.transport-cards', item: ':scope > .transport-card' },
    { host: '.shot-grid', item: ':scope > .shot' },
    { host: '.market-formula', item: ':scope > .market-factor:not(.market-result)' },
  ];

  const BLOCK_KIND_SEL = [
    ['.slide-head', '章头'],
    ['.subsection', '小节'],
    ['.research-lead', '导语'],
    ['.source-note', '来源'],
    ['hr.rule', '分割线'],
    ['.info-grid', '编号信息'],
    ['.stat-grid.is-compact', '横排数字'],
    ['.stat-grid', '数字信息'],
    ['.plain-grid', '无编号信息'],
    ['.stat-row', '横排数字'],
    ['.point', '观点'],
    ['.pain-text-list', '议题格'],
    ['.finding', '自定义文本'],
    ['.shot-grid', '图'],
    ['.shot-stack', '图'],
    ['.shot', '图'],
    ['.plain-table-wrap', '表格'],
    ['.market-formula', '公式'],
    ['.rail-growth-chart', '折线图'],
    ['.ansoff-wrap', '四象限矩阵'],
    ['.ansoff-grid', '四象限矩阵'],
    ['.hotel-funnel-chart', '漏斗图'],
    ['.hotel-city-network', '关系网络'],
    ['.network-node-table', '节点表'],
    ['.hotel-ranking-block', '排行榜'],
    ['.transport-cards', '图文卡'],
    ['.venn-wrap', '韦恩图'],
    ['.chapter-cover', '封面'],
  ];

  const BLOCK_TEMPLATES = [
    { id: 'head', label: '章头', html: '<header class="slide-head"><div class="kicker">题域</div><h2>判断句写在这里</h2></header><hr class="rule">' },
    { id: 'sub', label: '小节标题', html: '<div class="subsection"><h3>小节标题</h3></div>' },
    { id: 'lead', label: '导语', html: '<div class="research-lead"><p>待填。写清边界、这一节接下来用什么证据。</p></div>' },
    { id: 'source', label: '来源', html: '<p class="source-note">来源：待填</p>' },
    { id: 'rule', label: '分割线', html: '<hr class="rule">' },
    { id: 'formula', label: '公式', html: '<div class="market-formula" aria-label="公式"><div class="market-factor"><div class="market-number"><span>A</span><i>单位</i></div><div class="market-factor-label">因子：基数</div></div><div class="market-operator" aria-hidden="true">×</div><div class="market-factor"><div class="market-number"><span>B</span><i>%</i></div><div class="market-factor-label">因子：转化率</div></div><div class="market-operator" aria-hidden="true">=</div><div class="market-factor market-result"><div class="market-number"><span>N</span><i>次</i></div><div class="market-factor-label">结果</div></div></div>' },
    { id: 'stat-row', label: '横排数字', html: '<div class="stat-grid is-compact" data-cols="5"><article class="stat-card" data-suffix><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix">%</span></strong><h3>指标名称</h3></article><article class="stat-card" data-suffix><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix">%</span></strong><h3>指标名称</h3></article><article class="stat-card" data-suffix><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix">%</span></strong><h3>指标名称</h3></article></div>' },
    { id: 'stat', label: '数字信息', html: '<div class="stat-grid"><article class="stat-card"><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix"></span></strong><h3>标题</h3><p>待填。</p></article><article class="stat-card"><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix"></span></strong><h3>标题</h3><p>待填。</p></article></div>' },
    { id: 'info', label: '编号信息', html: '<div class="info-grid" data-layout="cols" data-cols="2" data-pos="top"><article class="info"><span class="info__no">01</span><h3>要点标题</h3><p>待填。写清这条在论证什么。</p></article><article class="info"><span class="info__no">02</span><h3>要点标题</h3><p>待填。</p></article></div>' },
    { id: 'plain', label: '无编号信息', html: '<div class="info-grid" data-layout="cols" data-cols="2" data-pos="top" data-index="off"><article class="info"><span class="info__no">01</span><h3>要点标题</h3><p>待填。</p></article><article class="info"><span class="info__no">02</span><h3>要点标题</h3><p>待填。</p></article></div>' },
    { id: 'point', label: '观点', html: '<aside class="point"><span>观点</span><p>待填。一句立场。</p></aside>' },
    { id: 'pain', label: '议题格', html: '<div class="pain-text-list" data-cols="2"><article class="pain-topic"><header class="pain-topic-head"><h3><span class="pain-topic-index">01</span>议题名称</h3><p class="pain-topic-summary">一句概括：这一格要回答什么问题。</p></header><div class="pain-topic-body"><ul class="pain-detail-list"><li>待填</li></ul></div></article></div>' },
    { id: 'finding', label: '自定义文本', html: '<article class="finding"><p>待填。可改字号、颜色、加粗，可插入弱分割线。</p></article>' },
    { id: 'table', label: '表格', html: '<div class="plain-table-wrap"><table class="airline-matrix"><thead><tr><th>维度</th><th><span class="table-level">对象 A</span><span class="table-score">对照档</span></th><th class="is-accent"><span class="table-level">对象 B</span><span class="table-score">强调档</span></th></tr></thead><tbody><tr><td>指标</td><td>待填</td><td>待填</td></tr></tbody></table></div>' },
    { id: 'chart', label: '折线图', html: '<figure class="rail-growth-chart" aria-label="折线图"><div class="rail-growth-chart-scroll"><svg viewBox="0 0 640 220" role="img"><line class="chart-grid" x1="56" y1="170" x2="600" y2="170"/><line class="chart-axis" x1="56" y1="30" x2="56" y2="170"/><line class="chart-line" x1="80" y1="150" x2="320" y2="110"/><line class="chart-line" x1="320" y1="110" x2="560" y2="50"/><circle class="chart-point" cx="80" cy="150" r="4"/><circle class="chart-point" cx="320" cy="110" r="4"/><circle class="chart-point" cx="560" cy="50" r="4"/><text class="chart-value" x="80" y="140" text-anchor="middle">10</text><text class="chart-value" x="320" y="100" text-anchor="middle">40</text><text class="chart-value" x="560" y="40" text-anchor="middle">90</text><text class="chart-date" x="80" y="198" text-anchor="middle">T1</text><text class="chart-date" x="320" y="198" text-anchor="middle">T2</text><text class="chart-date" x="560" y="198" text-anchor="end">T3</text></svg></div></figure>' },
    { id: 'ansoff', label: '四象限矩阵', html: '<div class="ansoff-wrap"><div class="ansoff-grid" aria-label="四象限矩阵"><div class="ansoff-corner"></div><div class="ansoff-col-head"><span class="ansoff-kicker">横轴 · 低</span><span class="ansoff-title">象限 · 左</span></div><div class="ansoff-col-head"><span class="ansoff-kicker">横轴 · 高</span><span class="ansoff-title">象限 · 右</span></div><div class="ansoff-row-head"><span class="ansoff-kicker">纵轴 · 高</span></div><div class="ansoff-cell"><span class="cell-tag">I</span><h4>象限名称</h4><p>待填。</p></div><div class="ansoff-cell"><span class="cell-tag">II</span><h4>象限名称</h4><p>待填。</p></div><div class="ansoff-row-head"><span class="ansoff-kicker">纵轴 · 低</span></div><div class="ansoff-cell"><span class="cell-tag">III</span><h4>象限名称</h4><p>待填。</p></div><div class="ansoff-cell"><span class="cell-tag">IV</span><h4>象限名称</h4><p>待填。</p></div></div></div>' },
    { id: 'rank', label: '排行榜', html: '<section class="hotel-ranking-block"><div class="hotel-ranking-head"><div><h4>排行榜标题</h4><p>待填。</p></div></div><div class="hotel-ranking-scroll"><table><thead><tr><th>#</th><th>名称</th><th>分值</th></tr></thead><tbody><tr><td class="rank">1</td><td class="hotel-name">对象 01</td><td class="score total">0</td></tr><tr><td class="rank">2</td><td class="hotel-name">对象 02</td><td class="score total">0</td></tr></tbody></table></div></section>' },
    { id: 'shot', label: '图', html: '<div class="shot-grid" data-cols="2"><figure class="shot" data-kind="photo"><div class="shot__frame"><img alt=""></div><figcaption><b>图片标题</b><span>一句说明。右键替换图片。</span></figcaption></figure></div>' },
    { id: 'transport', label: '图文卡', html: '<div class="transport-cards"><article class="transport-card"><div class="transport-card-copy"><h3>方案名称</h3><p>一句对比。</p><div class="transport-facts"><div class="transport-fact"><span>属性</span><strong>待填</strong></div></div></div></article></div>' },
  ];

  const markupRootOf = () =>
    document.querySelector('[data-report-slides]')
    || document.querySelector('.report-slides')
    || null;

  const stackOf = (node) => node?.closest?.('.flow-stack') || null;

  const blockOf = (node) => {
    const stack = stackOf(node);
    if (!stack || !node) return null;
    let n = node.nodeType === 1 ? node : node.parentElement;
    while (n && n.parentElement !== stack) n = n.parentElement;
    return n && n.parentElement === stack ? n : null;
  };

  const itemMatchOf = (node) => {
    if (!node?.closest) return null;
    for (const spec of ITEM_SPECS) {
      const host = node.closest(spec.host);
      if (!host) continue;
      const itemSel = spec.item.replace(':scope > ', '');
      const item = node.closest(itemSel);
      if (item && host.contains(item) && (item.parentElement === host || item.parentElement?.classList.contains('comp-main'))) return { spec, host, item };
      if (host === node || host.contains(node)) return { spec, host, item: null };
    }
    const shot = node.closest('.shot');
    if (shot && !shot.closest('.shot-grid, .shot-stack, .chapter-cover, .comp-media')) {
      const spec = ITEM_SPECS.find((s) => s.host === '.shot-grid');
      if (spec) return { spec, host: shot, item: shot, wrapShot: true };
    }
    return null;
  };

  const headingAnchorOf = (node) => {
    if (!node?.closest) return null;
    const head = node.closest('.slide-head, .chapter-cover');
    if (head) return head;
    const sub = node.closest('.subsection');
    if (sub) {
      const title = sub.querySelector(':scope > h2, :scope > h3');
      if (node === sub) return sub;
      if (title && (node === title || title.contains(node))) return sub;
      return null;
    }
    const heading = node.closest('h2, h3');
    if (!heading) return null;
    if (heading.parentElement?.matches?.('.flow-stack, .flow-lab')) return heading;
    return null;
  };

  const isHeadingStart = (el) => {
    if (!el?.matches) return false;
    if (el.matches('.slide-head, .subsection, .chapter-cover')) return true;
    if (el.matches('h2, h3')) return true;
    if (el.matches('.flow-lab') && el.querySelector(':scope > .slide-head, :scope > .subsection, :scope > h2, :scope > h3, :scope > .chapter-cover')) return true;
    return false;
  };

  const headingGroupOf = (node) => {
    const anchor = headingAnchorOf(node);
    if (!anchor) return null;
    const lab = anchor.closest('.flow-lab');
    if (lab) return { anchor, nodes: [lab] };
    const start = anchor;
    const parent = start.parentElement;
    if (!parent) return { anchor, nodes: [start] };
    const kids = [...parent.children];
    const i = kids.indexOf(start);
    if (i < 0) return { anchor, nodes: [start] };
    const nodes = [];
    for (let j = i; j < kids.length; j += 1) {
      const el = kids[j];
      if (j > i && isHeadingStart(el)) break;
      nodes.push(el);
    }
    return { anchor, nodes };
  };

  const clipTitle = (text) => {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    return t.length > 36 ? `${t.slice(0, 36)}…` : t;
  };

  const blockTitleOf = (el) => {
    if (!el) return '组件';
    if (el.matches?.('.flow-lab') && el.dataset.lab) return el.dataset.lab;
    if (el.matches?.('.slide-head')) return clipTitle(el.querySelector('h2')?.textContent) || '章头';
    if (el.matches?.('.subsection')) return clipTitle(el.querySelector('h3')?.textContent) || '小节';
    if (el.matches?.('h2, h3')) return clipTitle(el.textContent) || '标题';
    if (el.matches?.('hr.rule')) return el.classList.contains('is-soft') ? '分割线 · 弱' : '分割线';
    for (const [sel, label] of BLOCK_KIND_SEL) {
      if (el.matches(sel)) {
        const inner = el.querySelector('h2, h3, h4, figcaption b, b, .kicker');
        const text = clipTitle(inner?.textContent);
        return text && text !== label ? `${label} · ${text}` : label;
      }
    }
    const fallback = clipTitle(el.querySelector?.('h2, h3, h4, b')?.textContent);
    return fallback || '组件';
  };

  const itemTitleOf = (item) => {
    if (!item) return '条目';
    if (item.matches('.market-factor')) return clipTitle(item.querySelector('.market-factor-label')?.textContent) || '因子';
    if (item.matches('li')) return clipTitle(item.textContent) || '条目';
    const title = item.querySelector('h3, h4, b, .hotel-name, figcaption b');
    return clipTitle(title?.textContent) || clipTitle(item.textContent) || '条目';
  };

  const nearestStack = (node, clientY) => {
    const hit = stackOf(node);
    if (hit) return hit;
    const stacks = [...document.querySelectorAll('.flow-stack')];
    if (!stacks.length) return null;
    let best = stacks[0];
    let bestDist = Infinity;
    stacks.forEach((stack) => {
      const box = stack.getBoundingClientRect();
      const mid = (box.top + box.bottom) / 2;
      const dist = Math.abs(clientY - mid);
      if (dist < bestDist) {
        best = stack;
        bestDist = dist;
      }
    });
    return best;
  };

  const insertPointFromY = (parent, clientY) => {
    const kids = [...parent.children].filter((el) => el.nodeType === 1 && !el.matches?.('.seed-edit-ghost'));
    for (const el of kids) {
      const box = el.getBoundingClientRect();
      if (clientY < box.top + box.height / 2) return { parent, before: el };
    }
    return { parent, before: null };
  };

  const htmlToNodes = (html) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    return [...wrap.childNodes].filter((n) => n.nodeType === 1);
  };

  const placeNodes = (nodes, parent, before) => {
    if (!parent) return;
    nodes.forEach((n) => {
      if (before && before.parentNode === parent) parent.insertBefore(n, before);
      else parent.appendChild(n);
    });
  };

  const isBlankHit = (node) => {
    if (!node || isChrome(node)) return false;
    if (node.closest?.('.seed-edit-menu, .seed-edit-done, .seed-edit-bold, .seed-edit-media, .seed-edit-handle, .seed-edit-handle-h')) return false;
    if (node.matches?.('.flow-stack, .report-slide, .report-section, .report-stage, .report-slides, .report-shell, body, html')) return true;
    return false;
  };

  const captureMarkup = () => {
    const root = markupRootOf();
    if (!root) return '';
    return root.innerHTML;
  };

  const stripSortAttrs = (root) => {
    (root || document).querySelectorAll('[data-seed-sort-title]').forEach((el) => el.removeAttribute('data-seed-sort-title'));
    (root || document).querySelectorAll('.is-seed-drag, .is-seed-item-host').forEach((el) => {
      el.classList.remove('is-seed-drag', 'is-seed-item-host');
    });
  };

  const mount = () => {
    if (document.documentElement.dataset.seedEditMounted) return;
    document.documentElement.dataset.seedEditMounted = '1';
    document.documentElement.classList.add('seed-edit-on');

    const slug = slugOf();
    const isCatalog = !!document.querySelector('.report-shell[data-catalog]');
    const objectUrls = new Map();
    const originals = { texts: {}, media: {}, variants: {} };
    const state = { texts: {}, media: {}, variants: {}, markup: '' };
    const history = [];
    let histAt = -1;
    let applyingHist = false;
    let fileInput = null;
    let activeText = null;
    let beforeEdit = '';
    let svgInput = null;
    let restoredMarkup = false;
    let sorting = false;
    let menuInsertAt = null;
    let menuHeading = null;
    let menuItemHit = null;
    let menuAside = null;
    let menuBlock = null;
    let menuAt = { x: 0, y: 0 };

    const menu = document.createElement('div');
    menu.className = 'seed-edit-menu';
    menu.hidden = true;
    menu.innerHTML = [
      '<div class="seed-edit-menu__main">',
      '<button type="button" data-edit-text-action>编辑</button>',
      '<button type="button" data-edit-image-action>替换</button>',
      '<button type="button" data-edit-layout-action>尺寸</button>',
      '<div class="seed-edit-menu__rule" data-edit-struct-rule hidden></div>',
      '<button type="button" data-edit-add-item hidden>新增一条</button>',
      '<div class="seed-edit-menu__insert" data-edit-insert hidden>',
      '<button type="button" data-edit-insert-toggle>新增组件</button>',
      '<div class="seed-edit-menu__sub" data-edit-insert-list hidden></div>',
      '</div>',
      '<div class="seed-edit-menu__rule" data-edit-delete-rule hidden></div>',
      '<button type="button" data-edit-del-item hidden>删除本条</button>',
      '<button type="button" data-edit-del-group hidden>删除本组</button>',
      '<button type="button" data-edit-del-block hidden>删除组件</button>',
      '</div>',
      '<div class="seed-edit-menu__side" data-edit-variant-side hidden></div>',
      '<div class="seed-edit-menu__side" data-edit-aside-side hidden></div>',
    ].join('');
    document.body.appendChild(menu);
    const menuMain = menu.querySelector('.seed-edit-menu__main');
    const menuSide = menu.querySelector('[data-edit-variant-side]');
    const menuAsideSide = menu.querySelector('[data-edit-aside-side]');
    const textBtn = menu.querySelector('[data-edit-text-action]');
    const imageBtn = menu.querySelector('[data-edit-image-action]');
    const layoutBtn = menu.querySelector('[data-edit-layout-action]');
    const structRule = menu.querySelector('[data-edit-struct-rule]');
    const deleteRule = menu.querySelector('[data-edit-delete-rule]');
    const addItemBtn = menu.querySelector('[data-edit-add-item]');
    const delItemBtn = menu.querySelector('[data-edit-del-item]');
    const delGroupBtn = menu.querySelector('[data-edit-del-group]');
    const delBlockBtn = menu.querySelector('[data-edit-del-block]');
    const insertWrap = menu.querySelector('[data-edit-insert]');
    const insertToggle = menu.querySelector('[data-edit-insert-toggle]');
    const insertList = menu.querySelector('[data-edit-insert-list]');
    insertList.innerHTML = BLOCK_TEMPLATES.map((t) => `<button type="button" data-edit-insert-id="${t.id}">${t.label}</button>`).join('');
    let menuText = null;
    let menuMedia = null;
    let menuVariant = null;
    let menuResize = null;

    const mediaBar = document.createElement('div');
    mediaBar.className = 'seed-edit-media';
    mediaBar.hidden = true;
    mediaBar.innerHTML = [
      '<div class="seed-edit-media__row" data-media-only><span>对齐</span><div class="seed-edit-media__btns">',
      '<button type="button" data-align="left">左</button>',
      '<button type="button" data-align="center">中</button>',
      '<button type="button" data-align="right">右</button></div></div>',
      '<div class="seed-edit-media__row" data-media-only><span>填充</span><div class="seed-edit-media__btns">',
      '<button type="button" data-fit="fit">适应</button>',
      '<button type="button" data-fit="fill">铺满</button></div></div>',
      '<p class="seed-edit-media__hint">拖右边改宽，拖下边改高</p>',
    ].join('');
    document.body.appendChild(mediaBar);
    const handle = document.createElement('button');
    handle.className = 'seed-edit-handle';
    handle.type = 'button';
    handle.hidden = true;
    handle.setAttribute('aria-label', '拖拽调整宽度');
    document.body.appendChild(handle);
    const handleH = document.createElement('button');
    handleH.className = 'seed-edit-handle-h';
    handleH.type = 'button';
    handleH.hidden = true;
    handleH.setAttribute('aria-label', '拖拽调整高度');
    document.body.appendChild(handleH);
    let activeBox = null;

    const doneBtn = document.createElement('button');
    doneBtn.className = 'seed-edit-done';
    doneBtn.type = 'button';
    doneBtn.hidden = true;
    doneBtn.textContent = '完成';
    document.body.appendChild(doneBtn);
    const boldBtn = document.createElement('button');
    boldBtn.className = 'seed-edit-bold';
    boldBtn.type = 'button';
    boldBtn.hidden = true;
    boldBtn.textContent = '加粗';
    boldBtn.setAttribute('aria-label', '选中文字加粗');
    document.body.appendChild(boldBtn);
    const sizeSel = document.createElement('select');
    sizeSel.className = 'seed-edit-size';
    sizeSel.hidden = true;
    sizeSel.setAttribute('aria-label', '字号');
    sizeSel.innerHTML = '<option value="">字号</option><option value="12px">12</option><option value="14px">14</option><option value="15px">15</option><option value="16px">16</option><option value="20px">20</option>';
    document.body.appendChild(sizeSel);
    const ruleBtn = document.createElement('button');
    ruleBtn.className = 'seed-edit-rule';
    ruleBtn.type = 'button';
    ruleBtn.hidden = true;
    ruleBtn.textContent = '分割线';
    ruleBtn.setAttribute('aria-label', '插入弱分割线');
    document.body.appendChild(ruleBtn);
    const colorPick = document.createElement('input');
    colorPick.type = 'color';
    colorPick.className = 'seed-edit-color';
    colorPick.hidden = true;
    colorPick.setAttribute('aria-label', '自定义颜色');
    const colorWrap = document.createElement('label');
    colorWrap.className = 'seed-edit-color-wrap';
    colorWrap.hidden = true;
    colorWrap.title = '自定义颜色';
    colorWrap.innerHTML = '<span class="seed-edit-color-wrap__icon" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 13.8l1.1-3.8 7.2-7.2a1.4 1.4 0 0 1 2 2l-7.2 7.2-3.1 1.8z"/><path d="M9.2 3.8l3 3"/></svg></span>';
    colorWrap.append(colorPick);
    const colorPalette = document.createElement('div');
    colorPalette.className = 'seed-edit-palette';
    colorPalette.hidden = true;
    colorPalette.setAttribute('aria-label', '主题色');
    const paletteSwatches = document.createElement('div');
    paletteSwatches.className = 'seed-edit-palette__swatches';
    const paletteActions = document.createElement('div');
    paletteActions.className = 'seed-edit-palette__actions';
    paletteSwatches.append(colorWrap);
    colorPalette.append(paletteSwatches, paletteActions);
    document.body.appendChild(colorPalette);
    let colorBefore = '';
    let savedRange = null;

    const hideMenu = () => {
      menu.hidden = true;
      insertList.hidden = true;
      menuSide.hidden = true;
      menuAsideSide.hidden = true;
      menu.classList.remove('is-split');
      menuText = null;
      menuMedia = null;
      menuVariant = null;
      menuResize = null;
      menuInsertAt = null;
      menuHeading = null;
      menuItemHit = null;
      menuAside = null;
      menuBlock = null;
    };

    const paintVariantMenu = (host) => {
      menu.querySelectorAll('[data-edit-variant], [data-edit-variant-rule], [data-edit-variant-label], [data-edit-variant-check], [data-edit-cols-stepper], [data-edit-bg-color], [data-edit-aside-check]').forEach((el) => el.remove());
      menuSide.replaceChildren();
      menuSide.hidden = true;
      menu.classList.remove('is-split');
      const spec = specOf(host);
      if (!spec) return;
      const rule = document.createElement('div');
      rule.className = 'seed-edit-menu__rule';
      rule.setAttribute('data-edit-variant-rule', '');
      menuMain.append(rule);
      const active = new Set(variantActiveIds(host));
      const appendLabel = (parent, title) => {
        const label = document.createElement('div');
        label.className = 'seed-edit-menu__label';
        label.setAttribute('data-edit-variant-label', '');
        label.textContent = title;
        parent.append(label);
      };
      const appendItem = (parent, item) => {
        if (item.rule) {
          const split = document.createElement('div');
          split.className = 'seed-edit-menu__rule';
          split.setAttribute('data-edit-variant-rule', '');
          parent.append(split);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.editVariant = item.id;
        btn.textContent = item.label;
        btn.classList.toggle('is-on', active.has(item.id));
        parent.append(btn);
      };
      const appendCheck = (parent, item) => {
        const label = document.createElement('label');
        label.className = 'seed-edit-menu__check';
        label.setAttribute('data-edit-variant-check', '');
        const title = document.createElement('span');
        title.textContent = item.label;
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.dataset.editVariant = item.id;
        box.checked = active.has(item.id);
        label.append(title, box);
        parent.append(label);
      };
      const appendColsStepper = (parent, range) => {
        if (!range) return;
        const row = document.createElement('div');
        row.className = 'seed-edit-menu__row';
        row.setAttribute('data-edit-cols-stepper', '');
        const title = document.createElement('span');
        title.className = 'seed-edit-menu__row-label';
        title.textContent = '列数';
        const stepper = document.createElement('div');
        stepper.className = 'seed-edit-stepper';
        const minus = document.createElement('button');
        minus.type = 'button';
        minus.dataset.editColsStep = '-1';
        minus.innerHTML = '<span aria-hidden="true">−</span>';
        minus.disabled = range.value <= range.min;
        minus.setAttribute('aria-label', '减少列数');
        const value = document.createElement('span');
        value.textContent = String(range.value);
        const plus = document.createElement('button');
        plus.type = 'button';
        plus.dataset.editColsStep = '1';
        plus.innerHTML = '<span aria-hidden="true">+</span>';
        plus.disabled = range.value >= range.max;
        plus.setAttribute('aria-label', '增加列数');
        stepper.append(minus, value, plus);
        row.append(title, stepper);
        parent.append(row);
      };
      if (spec.sections) {
        const indexOn = !active.has('index-off');
        spec.sections.forEach((section) => {
          if (section.when === 'index-on' && !indexOn) return;
          if (section.when === 'grid' && !active.has('layout-grid') && !active.has('layout-grid-a') && !active.has('layout-grid-b')) return;
          const parent = section.side ? menuSide : menuMain;
          if (section.id === 'cols') {
            appendColsStepper(parent, colsRangeOf(spec, host));
            return;
          }
          if (section.title) appendLabel(parent, section.title);
          if (section.check) {
            (section.items || []).forEach((item) => appendCheck(parent, item));
            return;
          }
          (section.items || []).forEach((item) => appendItem(parent, item));
        });
        if (menuSide.childElementCount) {
          menuSide.hidden = false;
          menu.classList.add('is-split');
        }
        if (spec.group === 'info' && active.has('bg')) {
          const row = document.createElement('label');
          row.className = 'seed-edit-menu__row';
          row.setAttribute('data-edit-bg-color', '');
          const title = document.createElement('span');
          title.className = 'seed-edit-menu__row-label';
          title.textContent = '背景色';
          const input = document.createElement('input');
          input.type = 'color';
          input.className = 'seed-edit-menu__swatch';
          input.setAttribute('data-edit-bg-color-input', '');
          const current = infoBgColorOf(host);
          input.value = /^#[0-9a-fA-F]{6}$/.test(current) ? current : '#EDF4FD';
          row.append(title, input);
          menuMain.append(row);
        }
      } else {
        if (spec.title) appendLabel(menuMain, spec.title);
        (spec.checks || []).forEach((item) => appendCheck(menuMain, item));
        (spec.items || []).forEach((item) => appendItem(menuMain, item));
      }
      if ((spec.group === 'shot' && !host.closest('.comp-media')) || spec.group === 'stat' || spec.group === 'plain') {
        appendColsStepper(menuMain, colsRangeOf(spec, host));
      }
    };

    const paintAsideCheck = (aside) => {
      menu.querySelectorAll('[data-edit-aside-check]').forEach((el) => el.remove());
      menuAsideSide.replaceChildren();
      menuAsideSide.hidden = true;
      if (!aside) {
        if (menuSide.childElementCount) {
          menuSide.hidden = false;
          menu.classList.add('is-split');
        }
        return;
      }
      const label = document.createElement('label');
      label.className = 'seed-edit-menu__check';
      label.setAttribute('data-edit-aside-check', '');
      const title = document.createElement('span');
      title.textContent = '配图';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.editAside = 'on';
      box.checked = asideOn(aside);
      label.append(title, box);
      menuMain.append(label);
      if (!asideOn(aside)) {
        if (menuSide.childElementCount) {
          menuSide.hidden = false;
          menu.classList.add('is-split');
        }
        return;
      }
      const posLabel = document.createElement('div');
      posLabel.className = 'seed-edit-menu__label';
      posLabel.textContent = '配图位置';
      menuAsideSide.append(posLabel);
      const pos = asidePosOf(aside);
      ['left', 'right'].forEach((id) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.editAsidePos = id;
        btn.textContent = id === 'left' ? '左' : '右';
        btn.classList.toggle('is-on', pos === id);
        menuAsideSide.append(btn);
      });
      menuAsideSide.hidden = false;
      menu.classList.add('is-split');
      if (menuSide.childElementCount) menuSide.hidden = false;
    };

    const showMenu = (event, { text, media, variant, resize, heading, itemHit, block, insertAt, aside } = {}) => {
      menuText = text || null;
      menuMedia = media || null;
      menuVariant = variant || null;
      menuResize = resize || null;
      menuHeading = heading || null;
      menuItemHit = itemHit || null;
      menuAside = aside || null;
      menuBlock = block || null;
      menuInsertAt = insertAt || null;
      textBtn.hidden = !menuText;
      imageBtn.hidden = !(menuMedia || isAsideFrame(menuResize));
      layoutBtn.hidden = menuMedia?.closest?.('.chapter-cover') ? true : !(menuMedia || menuResize);
      const canAddItem = !!(menuItemHit?.host);
      const canDelItem = !!(menuItemHit?.item && menuItemHit.host && menuItemHit.host.querySelectorAll(menuItemHit.spec.item).length > 1);
      const canDelGroup = !!(menuHeading?.nodes?.length);
      const canDelBlock = !!(menuBlock && !canDelGroup);
      const canInsert = !!menuInsertAt;
      addItemBtn.hidden = !canAddItem;
      delItemBtn.hidden = !canDelItem;
      delGroupBtn.hidden = !canDelGroup;
      delBlockBtn.hidden = !canDelBlock;
      insertWrap.hidden = !canInsert;
      insertList.hidden = true;
      const hasPrimary = !textBtn.hidden || !imageBtn.hidden || !layoutBtn.hidden;
      structRule.hidden = !(hasPrimary && (canAddItem || canInsert));
      paintVariantMenu(menuVariant);
      paintAsideCheck(menuAside);
      const hasDelete = canDelItem || canDelGroup || canDelBlock;
      deleteRule.hidden = !hasDelete;
      if (hasDelete) {
        menuMain.append(deleteRule);
        if (!delItemBtn.hidden) menuMain.append(delItemBtn);
        if (!delGroupBtn.hidden) menuMain.append(delGroupBtn);
        if (!delBlockBtn.hidden) menuMain.append(delBlockBtn);
      }
      const hasAction = hasPrimary || menuVariant || menuAside
        || canAddItem || canDelItem || canDelGroup || canDelBlock || canInsert;
      if (!hasAction) return;
      for (const el of menuMain.children) {
        if (el.hidden) continue;
        if (el.classList.contains('seed-edit-menu__rule')) el.hidden = true;
        else break;
      }
      menu.hidden = false;
      menuAt = { x: event.clientX, y: event.clientY };
      const box = menu.getBoundingClientRect();
      const pad = 8;
      menu.style.left = `${Math.max(pad, Math.min(menuAt.x, window.innerWidth - box.width - pad))}px`;
      menu.style.top = `${Math.max(pad, Math.min(menuAt.y, window.innerHeight - box.height - pad))}px`;
    };

    const refreshOpenMenu = () => {
      if (menu.hidden || (!menuVariant && !menuAside)) return;
      paintVariantMenu(menuVariant);
      paintAsideCheck(menuAside);
      const hasDelete = !delItemBtn.hidden || !delGroupBtn.hidden || !delBlockBtn.hidden;
      deleteRule.hidden = !hasDelete;
      if (hasDelete) {
        menuMain.append(deleteRule);
        if (!delItemBtn.hidden) menuMain.append(delItemBtn);
        if (!delGroupBtn.hidden) menuMain.append(delGroupBtn);
        if (!delBlockBtn.hidden) menuMain.append(delBlockBtn);
      }
      const box = menu.getBoundingClientRect();
      const pad = 8;
      menu.style.left = `${Math.max(pad, Math.min(menuAt.x, window.innerWidth - box.width - pad))}px`;
      menu.style.top = `${Math.max(pad, Math.min(menuAt.y, window.innerHeight - box.height - pad))}px`;
    };

    const persist = async () => {
      if (isCatalog) return;
      const root = markupRootOf();
      if (root) state.markup = root.innerHTML;
      await idbSet('state', slug, {
        texts: state.texts,
        media: state.media,
        variants: state.variants,
        images: state.media,
        markup: state.markup,
      });
    };

    const nodeByKey = (key) => {
      const live = document.querySelector(`[data-edit-key="${CSS.escape(key)}"]`);
      if (live) return live;
      if (restoredMarkup) return null;
      const path = (key || '').split('::').slice(2).join('::');
      const node = fromPath(path);
      if (node) node.dataset.editKey = key;
      return node;
    };

    const record = (op) => {
      if (applyingHist) return;
      history.splice(histAt + 1);
      history.push(op);
      if (history.length > 80) history.shift();
      histAt = history.length - 1;
    };

    const runHistory = async (dir) => {
      if (activeText || sorting) return;
      if (activeBox) stopMediaAdjust();
      if (dir === 'undo') {
        if (histAt < 0) return;
        applyingHist = true;
        await Promise.resolve(history[histAt].undo());
        histAt -= 1;
        applyingHist = false;
        persist();
        return;
      }
      if (histAt >= history.length - 1) return;
      applyingHist = true;
      histAt += 1;
      await Promise.resolve(history[histAt].redo());
      applyingHist = false;
      persist();
    };

    const infoIndexType = (grid) => grid.getAttribute('data-index') || 'num';

    const renumberInfo = (grid) => {
      if (!grid?.matches?.('.info-grid')) return;
      const type = infoIndexType(grid);
      if (type === 'off' || type === 'label') return;
      [...grid.querySelectorAll(':scope > .info, :scope > .comp-main > .info')].forEach((item, i) => {
        const no = item.querySelector(':scope > .info__no');
        if (!no) return;
        if (type === 'alpha') no.textContent = String.fromCharCode(65 + (i % 26));
        else if (type === 'q') no.textContent = `Q${i + 1}`;
        else no.textContent = String(i + 1).padStart(2, '0');
      });
    };

    const renumberPain = (host) => {
      if (!host?.matches?.('.pain-text-list')) return;
      [...host.querySelectorAll(':scope > .pain-topic, :scope > .comp-main > .pain-topic')].forEach((item, i) => {
        const no = item.querySelector('.pain-topic-index');
        if (no) no.textContent = String(i + 1).padStart(2, '0');
      });
    };

    const renumberFinding = (host) => {
      if (!host?.matches?.('.finding')) return;
      const marks = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
      [...host.querySelectorAll(':scope > .finding-sub')].forEach((item, i) => {
        const title = item.querySelector(':scope > b');
        if (!title) return;
        const rest = (title.textContent || '').replace(/^[①-⑳]\s*/, '').trim() || '新分点';
        title.textContent = `${marks[i] || `${i + 1}.`} ${rest}`;
      });
    };

    const syncFormula = (host) => {
      if (!host?.matches?.('.market-formula')) return;
      const factors = [...host.querySelectorAll(':scope > .market-factor:not(.market-result)')];
      const result = host.querySelector(':scope > .market-result');
      host.querySelectorAll(':scope > .market-operator').forEach((el) => el.remove());
      factors.forEach((factor, i) => {
        const op = document.createElement('div');
        op.className = 'market-operator';
        op.setAttribute('aria-hidden', 'true');
        op.textContent = i === factors.length - 1 ? '=' : '×';
        const before = factor.nextSibling;
        host.insertBefore(op, before);
      });
      if (result) host.appendChild(result);
    };

    const resetClonedItem = (node, spec, host) => {
      node.querySelectorAll('[data-edit-key]').forEach((el) => el.removeAttribute('data-edit-key'));
      node.querySelectorAll('.comp-media').forEach((el) => el.remove());
      node.removeAttribute('data-aside');
      node.querySelectorAll('[data-aside]').forEach((el) => el.removeAttribute('data-aside'));
      if (spec.host === '.info-grid') {
        const title = node.querySelector('h3');
        const body = node.querySelector('p');
        if (title) title.textContent = '新标题';
        if (body) body.textContent = '待填';
      } else if (spec.host === '.stat-grid') {
        const num = node.querySelector('.stat-card__num');
        const title = node.querySelector('h3');
        const body = node.querySelector('p');
        if (num) num.childNodes.forEach((n) => { if (n.nodeType === 3) n.textContent = '0'; });
        if (title) title.textContent = '新标题';
        if (body) body.textContent = '待填';
      } else if (spec.host === '.plain-grid') {
        const title = node.querySelector('b');
        const body = node.querySelector('p');
        if (title) title.textContent = '新标题';
        if (body) body.textContent = '待填';
      } else if (spec.host === '.pain-text-list') {
        const title = node.querySelector('h3');
        const idx = title?.querySelector('.pain-topic-index');
        if (title) {
          const label = document.createTextNode('议题名称');
          title.textContent = '';
          if (idx) title.append(idx, label);
          else title.textContent = '议题名称';
        }
        const summary = node.querySelector('.pain-topic-summary');
        if (summary) summary.textContent = '一句概括。';
      } else if (spec.host === '.transport-cards') {
        const title = node.querySelector('h3');
        const body = node.querySelector('p');
        if (title) title.textContent = '方案名称';
        if (body) body.textContent = '待填';
      } else if (spec.host === '.finding') {
        const title = node.querySelector(':scope > b');
        if (title) title.textContent = '① 新分点';
        const body = node.querySelector('p');
        const lines = node.querySelector('.stat-lines');
        if (lines) lines.remove();
        if (body) body.textContent = '待填';
        else {
          const p = document.createElement('p');
          p.textContent = '待填';
          node.append(p);
        }
      } else if (spec.host === '.market-formula') {
        const num = node.querySelector('.market-number span');
        const unit = node.querySelector('.market-number i');
        const label = node.querySelector('.market-factor-label');
        if (num) num.textContent = 'X';
        if (unit) unit.textContent = '单位';
        if (label) label.textContent = '因子：新因子';
        node.classList.remove('market-result');
      } else if (spec.host === '.pain-detail-list' || node.matches?.('li')) {
        node.textContent = '待填';
      } else if (spec.host === '.stat-row') {
        const title = node.querySelector('h3');
        const num = node.querySelector('.market-number span');
        if (title) title.textContent = '指标名称';
        if (num) num.textContent = '0';
      } else if (spec.host === '.shot-grid') {
        const title = node.querySelector('figcaption b');
        const cap = node.querySelector('figcaption span');
        if (title) title.textContent = '图片标题';
        if (cap) cap.textContent = '待填';
      }
      if (host) {
        renumberInfo(host);
        renumberPain(host);
        renumberFinding(host);
        syncFormula(host);
      }
    };

    const defaultItemHtml = (spec) => {
      if (spec.host === '.info-grid') return '<article class="info"><span class="info__no">01</span><h3>新标题</h3><p>待填</p></article>';
      if (spec.host === '.stat-grid') return '<article class="stat-card"><span class="stat-card__kicker"></span><strong class="stat-card__num"><span class="stat-card__prefix"></span>0<span class="stat-card__suffix"></span></strong><h3>新标题</h3><p>待填</p></article>';
      if (spec.host === '.plain-grid') return '<article class="plain"><b>新标题</b><p>待填</p></article>';
      if (spec.host === '.stat-row') return '<article><div class="market-number"><span>0</span><i></i></div><h3>指标名称</h3></article>';
      if (spec.host === '.pain-text-list') return '<article class="pain-topic"><header class="pain-topic-head"><h3><span class="pain-topic-index">01</span>议题名称</h3><p class="pain-topic-summary">一句概括。</p></header><div class="pain-topic-body"><ul class="pain-detail-list"><li>待填</li></ul></div></article>';
      if (spec.host === '.finding') return '<div class="finding-sub"><b>① 新分点</b><p>待填</p></div>';
      if (spec.host === '.market-formula') return '<div class="market-factor"><div class="market-number"><span>X</span><i>单位</i></div><div class="market-factor-label">因子：新因子</div></div>';
      if (spec.host === '.pain-detail-list') return '<li>待填</li>';
      if (spec.host === '.shot-grid') return '<figure class="shot" data-kind="photo"><div class="shot__frame"><img alt=""></div><figcaption><b>图片标题</b><span>待填</span></figcaption></figure>';
      if (spec.host === '.transport-cards') return '<article class="transport-card"><div class="transport-card-copy"><h3>方案名称</h3><p>待填</p></div></article>';
      return '<div>待填</div>';
    };

    const syncHost = (el) => {
      if (!el) return;
      const info = el.matches?.('.info-grid') ? el : el.closest?.('.info-grid');
      const pain = el.matches?.('.pain-text-list') ? el : el.closest?.('.pain-text-list');
      const finding = el.matches?.('.finding') ? el : el.closest?.('.finding');
      const formula = el.matches?.('.market-formula') ? el : el.closest?.('.market-formula');
      if (info) renumberInfo(info);
      if (pain) renumberPain(pain);
      if (finding) renumberFinding(finding);
      if (formula) syncFormula(formula);
    };

    const recordRemove = (nodes) => {
      const snap = nodes.map((el) => ({
        el,
        parent: el.parentElement,
        before: el.nextSibling,
      }));
      const parents = [...new Set(snap.map((s) => s.parent).filter(Boolean))];
      nodes.forEach((el) => el.remove());
      parents.forEach(syncHost);
      record({
        undo: () => {
          snap.forEach(({ el, parent, before }) => {
            if (!parent) return;
            parent.insertBefore(el, before);
          });
          parents.forEach(syncHost);
        },
        redo: () => {
          nodes.forEach((el) => el.remove());
          parents.forEach(syncHost);
        },
      });
      persist();
    };

    const recordInsert = (nodes, parent, before) => {
      placeNodes(nodes, parent, before);
      syncHost(parent);
      record({
        undo: () => {
          nodes.forEach((n) => n.remove());
          syncHost(parent);
        },
        redo: () => {
          placeNodes(nodes, parent, before);
          syncHost(parent);
        },
      });
      persist();
    };

    const recordMove = (el, fromParent, fromBefore, toParent, toBefore) => {
      record({
        undo: () => {
          if (!fromParent) return;
          if (fromBefore && fromBefore.parentNode === fromParent) fromParent.insertBefore(el, fromBefore);
          else fromParent.appendChild(el);
          syncHost(fromParent);
          if (toParent !== fromParent) syncHost(toParent);
        },
        redo: () => {
          if (!toParent) return;
          if (toBefore && toBefore.parentNode === toParent) toParent.insertBefore(el, toBefore);
          else toParent.appendChild(el);
          syncHost(toParent);
          if (toParent !== fromParent) syncHost(fromParent);
        },
      });
      persist();
    };

    const addItemAt = (hit) => {
      if (!hit?.host) return;
      if (hit.wrapShot && hit.item?.matches?.('.shot') && !hit.item.closest('.shot-grid')) {
        const grid = document.createElement('div');
        grid.className = 'shot-grid';
        grid.setAttribute('data-cols', '2');
        hit.item.replaceWith(grid);
        grid.append(hit.item);
        hit = { spec: hit.spec, host: grid, item: hit.item };
      }
      const items = [...hit.host.querySelectorAll(hit.spec.item)];
      const src = hit.item || items[items.length - 1];
      const node = src ? src.cloneNode(true) : htmlToNodes(defaultItemHtml(hit.spec))[0];
      if (!node) return;
      resetClonedItem(node, hit.spec, null);
      const listParent = hit.host.querySelector(':scope > .comp-main') || hit.host;
      let before = hit.item ? hit.item.nextSibling : null;
      if (hit.spec.host === '.market-formula') {
        before = hit.host.querySelector(':scope > .market-result') || null;
      }
      const asideMedia = hit.host.querySelector(':scope > .comp-media');
      if (!before && asideMedia && listParent === hit.host) before = asideMedia;
      recordInsert([node], listParent, before);
    };

    const removeItem = (hit) => {
      if (!hit?.item || !hit.host) return;
      const items = [...hit.host.querySelectorAll(hit.spec.item)];
      if (items.length <= 1) return;
      recordRemove([hit.item]);
    };

    const removeGroup = (group) => {
      if (!group?.nodes?.length) return;
      recordRemove(group.nodes);
    };

    const removeBlock = (block) => {
      if (!block) return;
      recordRemove([block]);
    };

    const insertBlock = (id, at) => {
      const spec = BLOCK_TEMPLATES.find((t) => t.id === id);
      if (!spec || !at?.parent) return;
      const nodes = htmlToNodes(spec.html);
      if (!nodes.length) return;
      recordInsert(nodes, at.parent, at.before || null);
    };

    const ghost = document.createElement('div');
    ghost.className = 'seed-edit-ghost';
    ghost.hidden = true;
    document.body.appendChild(ghost);
    const trash = document.createElement('div');
    trash.className = 'seed-edit-trash';
    trash.hidden = true;
    trash.innerHTML = '<span class="seed-edit-trash__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"/></svg></span><span>拖到这里删除</span>';
    document.body.appendChild(trash);
    const grip = document.createElement('button');
    grip.className = 'seed-edit-grip';
    grip.type = 'button';
    grip.hidden = true;
    grip.setAttribute('aria-label', '拖动排序');
    document.body.appendChild(grip);
    let gripTarget = null;
    let gripMode = 'block';

    const placeGrip = (el, mode) => {
      if (!el || sorting || activeText || activeBox) {
        grip.hidden = true;
        gripTarget = null;
        return;
      }
      gripTarget = el;
      gripMode = mode;
      const box = el.getBoundingClientRect();
      grip.hidden = false;
      const gw = grip.offsetWidth || 24;
      grip.style.left = `${Math.max(2, box.left - gw + 8)}px`;
      grip.style.top = `${Math.max(4, box.top + 6)}px`;
    };

    const pointerNearGrip = (event) => {
      if (event.target === grip || event.target.closest?.('.seed-edit-grip')) return true;
      if (!gripTarget || grip.hidden) return false;
      const g = grip.getBoundingClientRect();
      const t = gripTarget.getBoundingClientRect();
      const left = Math.min(g.left, t.left) - 10;
      const right = Math.max(g.right, t.left + 20);
      const top = Math.min(g.top, t.top) - 8;
      const bottom = Math.max(g.bottom, t.top + 56);
      return event.clientX >= left && event.clientX <= right
        && event.clientY >= top && event.clientY <= bottom;
    };

    const clearSortAttrs = () => {
      stripSortAttrs(document);
      document.documentElement.classList.remove('is-seed-sorting', 'is-seed-sorting-items');
      ghost.hidden = true;
      ghost.classList.remove('is-item');
      grip.hidden = true;
      gripTarget = null;
      sorting = false;
      trash.hidden = true;
      trash.classList.remove('is-hot');
    };

    const enterBlockSort = (stack) => {
      sorting = true;
      document.documentElement.classList.add('is-seed-sorting');
      [...stack.children].forEach((el) => {
        if (el.nodeType !== 1) return;
        el.dataset.seedSortTitle = blockTitleOf(el);
      });
    };

    const enterItemSort = (host) => {
      sorting = true;
      host.classList.add('is-seed-item-host');
      document.documentElement.classList.add('is-seed-sorting-items');
      const spec = ITEM_SPECS.find((s) => host.matches(s.host));
      const items = spec ? [...host.querySelectorAll(spec.item)] : [...host.children];
      items.forEach((el) => {
        el.dataset.seedSortTitle = itemTitleOf(el);
      });
    };

    const flowAxisOf = (parent, kids) => {
      const sample = kids.length >= 2
        ? kids
        : [...parent.children].filter((n) => n.nodeType === 1);
      if (sample.length >= 2) {
        const a = sample[0].getBoundingClientRect();
        const b = sample[1].getBoundingClientRect();
        return Math.abs(b.left - a.left) >= Math.abs(b.top - a.top) ? 'x' : 'y';
      }
      const cs = getComputedStyle(parent);
      if (cs.display.includes('flex') && String(cs.flexDirection).startsWith('row')) return 'x';
      if (cs.display === 'grid') {
        const cols = cs.gridTemplateColumns.split(' ').filter((t) => t && t !== 'none');
        if (cols.length > 1) return 'x';
      }
      return 'y';
    };

    const liveReorder = (el, parent, clientX, clientY) => {
      const asideMedia = parent.querySelector(':scope > .comp-media');
      const kids = [...parent.children].filter((n) => {
        if (n.nodeType !== 1 || n === el) return false;
        if (n.matches?.('.comp-media')) return false;
        if (parent.matches?.('.market-formula')) return n.matches('.market-factor:not(.market-result)');
        return true;
      });
      if (!kids.length) {
        if (asideMedia) parent.insertBefore(el, asideMedia);
        else parent.appendChild(el);
        return;
      }
      let best = kids[0];
      let bestDist = Infinity;
      kids.forEach((kid) => {
        const box = kid.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const dist = (clientX - cx) ** 2 + (clientY - cy) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = kid;
        }
      });
      const box = best.getBoundingClientRect();
      const after = flowAxisOf(parent, kids) === 'x'
        ? clientX > box.left + box.width / 2
        : clientY > box.top + box.height / 2;
      if (after) {
        let next = best.nextElementSibling;
        if (next === el) next = next.nextElementSibling;
        if (next && next !== asideMedia) parent.insertBefore(el, next);
        else if (asideMedia) parent.insertBefore(el, asideMedia);
        else parent.appendChild(el);
      } else {
        parent.insertBefore(el, best);
      }
    };

    const startSortDrag = (el, parent, event, mode) => {
      if (sorting || activeText || activeBox) return;
      event.preventDefault();
      const fromParent = parent;
      const fromBefore = el.nextSibling;
      if (mode === 'item') enterItemSort(parent);
      else enterBlockSort(parent);
      el.classList.add('is-seed-drag');
      grip.hidden = true;
      trash.hidden = false;
      trash.classList.remove('is-hot');
      ghost.textContent = el.dataset.seedSortTitle || (mode === 'item' ? itemTitleOf(el) : blockTitleOf(el));
      ghost.classList.remove('is-item');
      ghost.hidden = false;
      ghost.style.left = `${event.clientX + 12}px`;
      ghost.style.top = `${event.clientY - 18}px`;
      let lastX = event.clientX;
      let lastY = event.clientY;
      let scrollRaf = 0;
      const overTrash = (x, y) => {
        const box = trash.getBoundingClientRect();
        return y >= box.top && x >= 0 && x <= window.innerWidth;
      };
      const scrollRoot = () => document.scrollingElement || document.documentElement;
      const applyEdgeScroll = () => {
        if (!sorting) return;
        const topbar = document.querySelector('.report-shell.is-flow > .topbar, .topbar');
        const topEdge = topbar ? topbar.getBoundingClientRect().bottom : 0;
        const trashTop = trash.hidden ? window.innerHeight : trash.getBoundingClientRect().top;
        const zone = 140;
        let dy = 0;
        if (lastY < topEdge + zone) {
          const t = lastY <= topEdge ? 1 : 1 - (lastY - topEdge) / zone;
          dy = -Math.ceil(28 + t * 72);
        } else if (!overTrash(lastX, lastY) && lastY > trashTop - zone && lastY <= trashTop) {
          const t = 1 - (trashTop - lastY) / zone;
          dy = Math.ceil(28 + t * 72);
        }
        if (dy) {
          const root = scrollRoot();
          const prev = root.scrollTop;
          window.scrollBy(0, dy);
          if (root.scrollTop === prev) root.scrollTop = Math.max(0, prev + dy);
          if (root.scrollTop !== prev && !overTrash(lastX, lastY)) {
            liveReorder(el, parent, lastX, lastY);
          }
        }
        scrollRaf = requestAnimationFrame(applyEdgeScroll);
      };
      const onMove = (move) => {
        lastX = move.clientX;
        lastY = move.clientY;
        ghost.style.left = `${move.clientX + 12}px`;
        ghost.style.top = `${move.clientY - 18}px`;
        const hot = overTrash(move.clientX, move.clientY);
        trash.classList.toggle('is-hot', hot);
        if (!hot) liveReorder(el, parent, move.clientX, move.clientY);
      };
      const onUp = () => {
        cancelAnimationFrame(scrollRaf);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        el.classList.remove('is-seed-drag');
        const dropDelete = trash.classList.contains('is-hot');
        if (dropDelete) {
          if (fromParent) {
            if (fromBefore && fromBefore.parentNode === fromParent) fromParent.insertBefore(el, fromBefore);
            else fromParent.appendChild(el);
          }
          clearSortAttrs();
          if (mode === 'item') {
            const spec = ITEM_SPECS.find((s) => fromParent.matches(s.host));
            const count = spec ? fromParent.querySelectorAll(spec.item).length : 1;
            if (count <= 1) recordRemove([blockOf(fromParent) || fromParent]);
            else recordRemove([el]);
          } else {
            recordRemove([el]);
          }
          return;
        }
        const toParent = el.parentElement;
        const toBefore = el.nextSibling;
        const moved = fromParent !== toParent || fromBefore !== toBefore;
        clearSortAttrs();
        if (moved) {
          syncHost(parent);
          recordMove(el, fromParent, fromBefore, toParent, toBefore);
        }
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      scrollRaf = requestAnimationFrame(applyEdgeScroll);
    };

    const writeTextState = (key, value) => {
      const node = nodeByKey(key);
      if (!node) return;
      writeMarkup(node, value);
      if (originals.texts[key] === value) delete state.texts[key];
      else state.texts[key] = value;
      syncChartValue(node);
      applyTokenValue(node);
    };

    const ensureKey = (node, kind) => {
      if (node.dataset.editKey) return node.dataset.editKey;
      const slide = slideOf(node);
      const base = slide?.id || slide?.dataset?.slide || 'page';
      const key = `${base}::${kind}::${pathOf(node)}`;
      node.dataset.editKey = key;
      return key;
    };

    const placeDone = (anchor) => {
      const node = anchor || activeText;
      if (!node || !node.getBoundingClientRect) return;
      const box = node.getBoundingClientRect();
      const pad = 8;
      const panelOn = !colorPalette.hidden;
      const el = panelOn ? colorPalette : doneBtn;
      if (!el || el.hidden) return;
      const w = el.offsetWidth || (panelOn ? 180 : 72);
      const h = el.offsetHeight || (panelOn ? 92 : 28);
      const fitsRight = box.right + pad + w <= window.innerWidth - pad;
      let left;
      let top;
      if (fitsRight) {
        left = box.right + pad;
        top = box.top;
      } else {
        left = Math.max(pad, Math.min(box.left, window.innerWidth - pad - w));
        top = box.bottom + pad;
        if (top + h > window.innerHeight - pad) top = Math.max(pad, box.top - h - pad);
      }
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };

    const dockEditChrome = () => {
      paletteActions.append(sizeSel, ruleBtn, boldBtn, doneBtn);
      colorWrap.hidden = colorPick.hidden;
    };

    const hideColorPick = () => {
      colorPick.hidden = true;
      colorWrap.hidden = true;
      colorPalette.hidden = true;
      document.body.append(sizeSel, ruleBtn, boldBtn, doneBtn);
    };

    const paintColorPalette = () => {
      paletteSwatches.querySelectorAll('[data-color-token]').forEach((el) => el.remove());
      listColorTokens().forEach((name) => {
        const hex = tokenColorHex(name);
        if (!hex) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.colorToken = name;
        btn.title = name;
        btn.setAttribute('aria-label', name);
        btn.style.background = `var(${name})`;
        paletteSwatches.insertBefore(btn, colorWrap);
      });
    };

    const showColorPickFor = (valueEl) => {
      const hex = hexInputValue(valueEl?.textContent);
      colorPick.hidden = false;
      colorWrap.hidden = false;
      colorPalette.hidden = false;
      paintColorPalette();
      if (hex) colorPick.value = hex;
    };

    const colorHostOf = (node) => node?.closest?.('[data-css-var][data-token-kind="color"]');

    const applyColorHex = (host, hex, { history = false, previous } = {}) => {
      const valueEl = host?.querySelector?.('.token-value');
      if (!valueEl || !hex) return;
      const display = hex.toUpperCase();
      const prev = previous ?? (valueEl.textContent || '').trim();
      const editing = valueEl.isContentEditable;
      if (!editing) valueEl.textContent = display;
      else if (document.activeElement !== valueEl) valueEl.textContent = display;
      applyTokenValue(valueEl);
      paintColorSwatch(host.querySelector('.token-swatch'), display);
      if (!colorPick.hidden) colorPick.value = hexInputValue(display) || colorPick.value;
      if (!history || prev.toUpperCase() === display) return;
      const key = ensureKey(valueEl, 'text');
      if (!(key in originals.texts)) originals.texts[key] = prev;
      record({
        undo: () => writeTextState(key, prev),
        redo: () => writeTextState(key, display),
      });
    };

    const enhanceColorTokens = () => {
      document.querySelectorAll('[data-css-var][data-token-kind="color"]').forEach((host) => {
        const valueEl = host.querySelector('.token-value');
        const hex = hexInputValue(valueEl?.textContent || '') || '#000000';
        let input = host.querySelector('input.token-color, input[type="color"]');
        if (input) {
          input.classList.add('token-swatch', 'token-color');
          input.value = hex;
          return;
        }
        const swatch = host.querySelector('.token-swatch');
        input = document.createElement('input');
        input.type = 'color';
        input.className = 'token-swatch token-color';
        input.value = hex;
        input.setAttribute('aria-label', host.dataset.cssVar || '颜色');
        if (swatch) swatch.replaceWith(input);
        else host.prepend(input);
      });
    };

    const clearSvgInput = () => {
      svgInput?.remove();
      svgInput = null;
    };

    const stopTextEdit = ({ commit = true } = {}) => {
      if (!activeText) return;
      const node = activeText;
      const key = node.dataset.editKey;
      const value = svgInput ? svgInput.value : readMarkup(node);
      const previous = beforeEdit;
      node.removeAttribute('contenteditable');
      node.removeAttribute('data-edit-text');
      document.documentElement.classList.remove('is-inline-editing');
      doneBtn.hidden = true;
      boldBtn.hidden = true;
      sizeSel.hidden = true;
      ruleBtn.hidden = true;
      hideColorPick();
      clearSvgInput();
      activeText = null;
      if (!commit) {
        if (key) {
          writeMarkup(node, previous);
          syncChartValue(node);
          applyTokenValue(node);
        }
        return;
      }
      if (!key) return;
      if (originals.texts[key] === value) delete state.texts[key];
      else state.texts[key] = value;
      syncChartValue(node);
      applyTokenValue(node);
      if (previous !== value) {
        record({
          undo: () => writeTextState(key, previous),
          redo: () => writeTextState(key, value),
        });
      }
      persist();
    };

    const startSvgTextEdit = (node) => {
      const box = node.getBoundingClientRect();
      svgInput = document.createElement('input');
      svgInput.className = 'seed-edit-svg-input';
      svgInput.value = node.textContent || '';
      svgInput.style.left = `${Math.max(8, box.left)}px`;
      svgInput.style.top = `${Math.max(8, box.top)}px`;
      svgInput.style.width = `${Math.max(box.width + 24, 120)}px`;
      svgInput.style.height = `${Math.max(box.height, 28)}px`;
      document.body.appendChild(svgInput);
      svgInput.addEventListener('input', () => {
        node.textContent = svgInput.value;
        syncChartValue(node);
      });
      svgInput.focus();
      svgInput.select();
      placeDone(svgInput);
    };

    const startTextEdit = (node) => {
      if (!node) return;
      if (activeText && activeText !== node) stopTextEdit({ commit: true });
      const key = ensureKey(node, 'text');
      if (!(key in originals.texts)) originals.texts[key] = readMarkup(node);
      beforeEdit = readMarkup(node);
      activeText = node;
      node.setAttribute('data-edit-text', '');
      document.documentElement.classList.add('is-inline-editing');
      doneBtn.hidden = false;
      if (isSvgText(node)) {
        boldBtn.hidden = true;
        sizeSel.hidden = true;
        ruleBtn.hidden = true;
        hideColorPick();
        startSvgTextEdit(node);
        return;
      }
      node.contentEditable = 'true';
      node.spellcheck = false;
      node.focus();
      const tokenColor = !!node.closest?.('[data-token-kind="color"]');
      const finding = !!node.matches?.('.finding');
      boldBtn.hidden = tokenColor;
      sizeSel.hidden = !finding;
      sizeSel.value = '';
      ruleBtn.hidden = !finding;
      if (tokenColor) showColorPickFor(node);
      else {
        colorPick.hidden = false;
        colorPick.value = '#1d1d1f';
        paintColorPalette();
        colorPalette.hidden = false;
      }
      dockEditChrome();
      placeDone(node);
    };

    const mediaKindOf = (file) => {
      const type = String(file?.type || '').toLowerCase();
      if (type.startsWith('video/')) return 'video';
      if (type.startsWith('image/')) return 'image';
      const name = String(file?.name || '').toLowerCase();
      if (/\.(mp4|webm|mov|m4v|ogv)$/.test(name)) return 'video';
      return 'image';
    };

    const resolveMediaEl = (el) => {
      if (!el) return null;
      if (el.matches?.('img, video, svg')) return el;
      return el.querySelector?.('img, video, svg')
        || el.closest?.('.comp-media, .shot, figure, .shot__frame')?.querySelector?.('img, video, svg')
        || null;
    };

    const ensureMediaEl = (el) => {
      const live = resolveMediaEl(el);
      if (live) return live;
      const frame = el?.querySelector?.('.shot__frame')
        || el?.closest?.('.comp-media, .shot, figure')?.querySelector?.('.shot__frame');
      if (!frame) return el;
      const img = document.createElement('img');
      img.alt = '';
      frame.prepend(img);
      return img;
    };

    const applyMediaFile = (el, file, url) => {
      const kind = mediaKindOf(file);
      const isVideo = kind === 'video';
      const isImage = kind === 'image';
      let node = ensureMediaEl(el);
      if (!node) return el;
      const tag = node.tagName.toLowerCase();

      const swap = (next) => {
        next.dataset.editKey = node.dataset.editKey || el?.dataset?.editKey || '';
        node.replaceWith(next);
        return next;
      };

      const stampShot = (media) => {
        const shot = media.closest?.('.shot, [data-gallery]');
        if (!shot) return;
        shot.setAttribute('data-lightbox-src', url);
        const alt = media.getAttribute?.('alt') || file?.name || '';
        if (alt) shot.setAttribute('data-lightbox-alt', alt);
      };

      if (tag === 'video') {
        if (isVideo) {
          node.querySelectorAll('source').forEach((source) => {
            source.src = url;
          });
          node.src = url;
          node.load();
          stampShot(node);
          return node;
        }
        if (isImage) {
          node.poster = url;
          stampShot(node);
          return node;
        }
      }

      if (tag === 'img') {
        if (isImage) {
          node.src = url;
          node.setAttribute('src', url);
          if (node.hasAttribute('data-src')) node.setAttribute('data-src', url);
          const thumb = node.closest('.gallery-thumb');
          if (thumb) thumb.setAttribute('data-src', url);
          stampShot(node);
          return node;
        }
        if (isVideo) {
          const video = document.createElement('video');
          video.controls = true;
          video.playsInline = true;
          video.src = url;
          video.style.cssText = node.getAttribute('style') || '';
          video.className = node.className;
          const next = swap(video);
          stampShot(next);
          return next;
        }
      }

      if (tag === 'svg') {
        const media = document.createElement(isVideo ? 'video' : 'img');
        if (isVideo) {
          media.controls = true;
          media.playsInline = true;
        }
        media.src = url;
        const box = node.getBoundingClientRect();
        media.style.width = '100%';
        media.style.maxWidth = `${Math.round(box.width)}px`;
        media.style.display = 'block';
        const next = swap(media);
        stampShot(next);
        return next;
      }
      return node;
    };

    const captureMediaSnap = (el) => {
      if (!el) return null;
      const tag = el.tagName.toLowerCase();
      return {
        tag,
        src: el.getAttribute('src') || el.querySelector?.('source')?.getAttribute('src') || '',
        poster: el.getAttribute('poster') || '',
        cls: el.getAttribute('class') || '',
        style: el.getAttribute('style') || '',
        dataSrc: el.getAttribute('data-src') || '',
        lightbox: el.closest('.shot, [data-gallery]')?.getAttribute('data-lightbox-src') || '',
        html: tag === 'svg' ? el.outerHTML : '',
      };
    };

    const restoreMediaSnap = (el, snap, blob) => {
      if (!el) return el;
      if (blob instanceof Blob) {
        const prev = objectUrls.get(el.dataset.editKey);
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(blob);
        objectUrls.set(el.dataset.editKey, url);
        return applyMediaFile(el, blob, url);
      }
      if (!snap) return el;
      if (snap.tag === 'svg' && snap.html) {
        const wrap = document.createElement('div');
        wrap.innerHTML = snap.html;
        const next = wrap.firstElementChild;
        if (next) {
          next.dataset.editKey = el.dataset.editKey || '';
          el.replaceWith(next);
          return next;
        }
      }
      let node = el;
      if (snap.tag && node.tagName.toLowerCase() !== snap.tag && (snap.tag === 'img' || snap.tag === 'video')) {
        const next = document.createElement(snap.tag);
        next.dataset.editKey = node.dataset.editKey || '';
        if (snap.cls) next.className = snap.cls;
        if (snap.style) next.setAttribute('style', snap.style);
        if (snap.tag === 'video') {
          next.controls = true;
          next.playsInline = true;
        }
        node.replaceWith(next);
        node = next;
      }
      if (snap.src) node.setAttribute('src', snap.src);
      if (snap.poster) node.setAttribute('poster', snap.poster);
      else node.removeAttribute?.('poster');
      if (snap.dataSrc) node.setAttribute('data-src', snap.dataSrc);
      const shot = node.closest?.('.shot, [data-gallery]');
      if (shot && snap.lightbox) shot.setAttribute('data-lightbox-src', snap.lightbox);
      if (node.tagName === 'VIDEO') node.load?.();
      return node;
    };

    const pickMedia = (el) => {
      const target = ensureMediaEl(el);
      if (!target) return;
      const key = ensureKey(target, 'media');
      if (!(key in originals.media)) originals.media[key] = captureMediaSnap(target);
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.hidden = true;
        document.body.appendChild(fileInput);
      }
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        const node = ensureMediaEl(nodeByKey(key) || target);
        if (!node) return;
        if (node !== target && !node.dataset.editKey) node.dataset.editKey = key;
        const beforeBlob = await idbGet('blobs', `${slug}::${key}`).catch(() => null);
        const beforeSnap = captureMediaSnap(node);
        const beforeRec = state.media[key] ? { ...state.media[key] } : null;
        const prevUrl = objectUrls.get(key);
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        const url = URL.createObjectURL(file);
        objectUrls.set(key, url);
        applyMediaFile(node, file, url);
        const afterRec = { ...(beforeRec || {}), name: file.name, type: file.type || mediaKindOf(file) };
        state.media[key] = afterRec;
        try {
          await idbSet('blobs', `${slug}::${key}`, file);
        } catch (_) { /* keep live preview even if cache write fails */ }
        record({
          undo: async () => {
            const cur = ensureMediaEl(nodeByKey(key));
            if (!cur) return;
            if (beforeBlob instanceof Blob) {
              await idbSet('blobs', `${slug}::${key}`, beforeBlob).catch(() => {});
              restoreMediaSnap(cur, beforeSnap, beforeBlob);
              state.media[key] = beforeRec;
              return;
            }
            restoreMediaSnap(cur, originals.media[key] || beforeSnap, null);
            if (beforeRec) state.media[key] = beforeRec;
            else delete state.media[key];
          },
          redo: async () => {
            const cur = ensureMediaEl(nodeByKey(key));
            if (!cur) return;
            await idbSet('blobs', `${slug}::${key}`, file).catch(() => {});
            const nextUrl = URL.createObjectURL(file);
            const old = objectUrls.get(key);
            if (old) URL.revokeObjectURL(old);
            objectUrls.set(key, nextUrl);
            applyMediaFile(cur, file, nextUrl);
            state.media[key] = afterRec;
          },
        });
        persist();
      };
      fileInput.click();
    };

    const placeMediaChrome = () => {
      if (!activeBox) return;
      const box = activeBox.getBoundingClientRect();
      mediaBar.hidden = false;
      handle.hidden = false;
      handleH.hidden = isIntrinsicHeight(activeBox);
      const showMedia = isMediaBox(activeBox) || isShotSurface(activeBox) || !!activeBox.querySelector?.('img, video');
      mediaBar.querySelectorAll('[data-media-only]').forEach((row) => {
        row.hidden = !showMedia;
      });
      const bar = mediaBar.getBoundingClientRect();
      let left = box.left;
      let top = box.top - bar.height - 8;
      if (top < 8) top = box.bottom + 8;
      mediaBar.style.left = `${Math.max(8, Math.min(left, window.innerWidth - bar.width - 8))}px`;
      mediaBar.style.top = `${top}px`;
      handle.style.position = 'fixed';
      handle.style.left = `${box.right - 7}px`;
      handle.style.top = `${box.top + box.height / 2 - 28}px`;
      handle.style.margin = '0';
      handleH.style.position = 'fixed';
      handleH.style.left = `${box.left + box.width / 2 - 28}px`;
      handleH.style.top = `${box.bottom - 7}px`;
      handleH.style.margin = '0';
      mediaBar.querySelectorAll('[data-align]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.align === (activeBox.dataset.align || 'left'));
      });
      mediaBar.querySelectorAll('[data-fit]').forEach((btn) => {
        const fallback = isShotSurface(activeBox) ? 'fill' : 'fit';
        btn.classList.toggle('is-on', btn.dataset.fit === (activeBox.dataset.fit || fallback));
      });
    };

    const applyVariant = (host, id) => {
      if (!host || !id) return;
      const key = ensureKey(host, 'variant');
      if (!(key in originals.variants)) originals.variants[key] = snapshotVariant(host);
      const changed = applyVariantId(host, id);
      if (!changed) return;
      const after = changed.after;
      const before = changed.before;
      if (JSON.stringify(after) === JSON.stringify(originals.variants[key])) delete state.variants[key];
      else state.variants[key] = after;
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        record({
          undo: () => {
            const node = nodeByKey(key);
            if (!node) return;
            restoreVariant(node, before);
            if (JSON.stringify(before) === JSON.stringify(originals.variants[key])) delete state.variants[key];
            else state.variants[key] = before;
          },
          redo: () => {
            const node = nodeByKey(key);
            if (!node) return;
            restoreVariant(node, after);
            if (JSON.stringify(after) === JSON.stringify(originals.variants[key])) delete state.variants[key];
            else state.variants[key] = after;
          },
        });
      }
      persist();
    };

    const persistLayout = (box, { recordOp = true } = {}) => {
      const key = box.dataset.editKey || ensureKey(box, 'media');
      const rec = state.media[key] || {};
      const next = readLayout(box);
      const prev = rec.layout ? { ...rec.layout } : originals.media[key]?.layout || null;
      rec.layout = next;
      state.media[key] = rec;
      if (recordOp && JSON.stringify(prev) !== JSON.stringify(next)) {
        record({
          undo: () => {
            const host = nodeByKey(key);
            if (!host) return;
            writeLayout(host, prev || { align: 'left', fit: 'fit', width: null, height: null });
            const cur = state.media[key] || {};
            cur.layout = prev;
            state.media[key] = cur;
          },
          redo: () => {
            const host = nodeByKey(key);
            if (!host) return;
            writeLayout(host, next);
            const cur = state.media[key] || {};
            cur.layout = next;
            state.media[key] = cur;
          },
        });
      }
      persist();
    };

    const stopMediaAdjust = () => {
      if (!activeBox) return;
      activeBox.removeAttribute('data-seed-editing-media');
      persistLayout(activeBox, { recordOp: false });
      activeBox = null;
      mediaBar.hidden = true;
      handle.hidden = true;
      handleH.hidden = true;
      document.documentElement.classList.remove('is-inline-editing');
    };

    const startMediaAdjust = (el) => {
      const box = resizeBoxOf(el);
      if (!box) return;
      if (activeBox && activeBox !== box) stopMediaAdjust();
      const key = ensureKey(box, 'media');
      if (el.dataset && !el.dataset.editKey) el.dataset.editKey = key;
      const rect = box.getBoundingClientRect();
      if (!box.dataset.seedRatio) box.dataset.seedRatio = String(rect.width / Math.max(rect.height, 1));
      activeBox = box;
      box.setAttribute('data-seed-editing-media', '');
      if (!box.dataset.align) box.dataset.align = 'left';
      if (!box.dataset.fit) box.dataset.fit = 'fill';
      document.documentElement.classList.add('is-inline-editing');
      placeMediaChrome();
    };

    mediaBar.addEventListener('click', (event) => {
      if (!activeBox) return;
      const align = event.target.closest('[data-align]')?.dataset.align;
      const fit = event.target.closest('[data-fit]')?.dataset.fit;
      if (align) writeLayout(activeBox, { ...readLayout(activeBox), align });
      if (fit) writeLayout(activeBox, { ...readLayout(activeBox), fit });
      persistLayout(activeBox);
      placeMediaChrome();
    });

    const bindResizeHandle = (el, axis) => {
      el.addEventListener('pointerdown', (event) => {
        if (!activeBox) return;
        if (event.detail > 1) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        const startX = event.clientX;
        const startY = event.clientY;
        const startBox = activeBox.getBoundingClientRect();
        const asideFrame = activeBox.matches('.comp-media') ? activeBox : activeBox.closest('.comp-media');
        const asideParent = asideFrame?.parentElement?.matches?.('.info-grid, .pain-text-list')
          ? asideFrame.parentElement
          : null;
        const parentW = asideParent
          ? Math.max(200, asideParent.getBoundingClientRect().width - 120)
          : (activeBox.parentElement?.getBoundingClientRect().width || window.innerWidth);
        const onMove = (move) => {
          const layout = readLayout(activeBox);
          if (axis === 'x') {
            const nextW = Math.max(120, Math.min(parentW, startBox.width + (move.clientX - startX)));
            writeLayout(activeBox, { ...layout, width: nextW });
          } else if (!isIntrinsicHeight(activeBox)) {
            const minH = (isShotSurface(activeBox) || isAsideHost(activeBox) || isAsideFrame(activeBox)) ? 96 : 80;
            const nextH = Math.max(minH, startBox.height + (move.clientY - startY));
            writeLayout(activeBox, { ...layout, height: nextH });
          }
          placeMediaChrome();
        };
        const onUp = () => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          persistLayout(activeBox);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      });
      el.addEventListener('dblclick', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!activeBox) return;
        const layout = readLayout(activeBox);
        if (axis === 'x') writeLayout(activeBox, { ...layout, width: null });
        else writeLayout(activeBox, { ...layout, height: null });
        persistLayout(activeBox);
        placeMediaChrome();
      });
    };
    bindResizeHandle(handle, 'x');
    bindResizeHandle(handleH, 'y');

    const applyStateToDom = async () => {
      if (state.markup) {
        const root = markupRootOf();
        if (root) {
          root.innerHTML = state.markup;
          restoredMarkup = true;
          stripSortAttrs(root);
        }
      }
      for (const [key, rec] of Object.entries(state.variants || {})) {
        const node = nodeByKey(key);
        if (!node) continue;
        if (!(key in originals.variants)) originals.variants[key] = snapshotVariant(node);
        const snap = typeof rec === 'string' ? { group: 'info', layout: rec, no: 'sm' } : rec;
        restoreVariant(node, snap);
      }
      for (const [key, value] of Object.entries(state.texts || {})) {
        const live = document.querySelector(`[data-edit-key="${CSS.escape(key)}"]`);
        const path = key.split('::').slice(2).join('::');
        const node = live || (restoredMarkup ? null : fromPath(path));
        if (!node || node.closest('[data-css-var]')) continue;
        node.dataset.editKey = key;
        if (!(key in originals.texts)) originals.texts[key] = readMarkup(node);
        writeMarkup(node, value);
      }
      document.querySelectorAll('.chart-value').forEach((el) => syncChartValue(el));
      if (!window.ThemeRuntime) {
        document.querySelectorAll('.token-value').forEach((el) => applyTokenValue(el, { persistTheme: false }));
      }
      for (const [key, rec] of Object.entries(state.media || {})) {
        const live = document.querySelector(`[data-edit-key="${CSS.escape(key)}"]`);
        const path = key.split('::').slice(2).join('::');
        let node = live || (restoredMarkup ? null : fromPath(path));
        if (!node) continue;
        node.dataset.editKey = key;
        if (rec.layout) writeLayout(resizeBoxOf(node) || node, rec.layout);
        const blob = await idbGet('blobs', `${slug}::${key}`);
        if (!(blob instanceof Blob)) continue;
        const prev = objectUrls.get(key);
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(blob);
        objectUrls.set(key, url);
        applyMediaFile(ensureMediaEl(node) || node, blob, url);
      }
      document.querySelectorAll('.market-formula, .stat-grid, .stat-row, .info-grid, .plain-grid, .point, .finding').forEach((box) => {
        if (isAsideHost(box)) return;
        writeLayout(box, { ...readLayout(box), height: null });
      });
    };

    document.addEventListener('contextmenu', (event) => {
      const raw = event.target;
      const node = raw instanceof Element ? raw : raw?.parentElement;
      if (!node || isChrome(node)) return;
      const colorHost = node.closest?.('[data-css-var][data-token-kind="color"]');
      if (colorHost) {
        event.preventDefault();
        event.stopPropagation();
        showMenu(event, { text: colorHost.querySelector('.token-value') });
        return;
      }
      const onGraphic = !!(node.closest('img, video') || (node.closest('svg') && !node.closest('text, tspan, foreignObject')));
      const text = onGraphic && !node.closest('text, tspan') ? null : textTargetOf(raw.nodeType === 3 ? raw : node);
      const inAsideShot = !!node.closest('.comp-media');
      const media = mediaTargetOf(node) || (inAsideShot ? node.closest('.comp-media').querySelector('img, video, svg') : null);
      const variant = variantHostOf(node);
      const resize = resizeBoxOf(node);
      const both = text && media && isSvgText(text);
      const heading = headingGroupOf(node);
      const itemHit = inAsideShot ? null : itemMatchOf(node);
      const aside = asideHostOf(node);
      const block = blockOf(node);
      const blank = isBlankHit(node);
      const stack = nearestStack(node, event.clientY);
      const insertAt = blank && stack ? insertPointFromY(stack, event.clientY) : null;
      if (!text && !media && !variant && !resize && !heading && !itemHit && !insertAt && !block && !aside) return;
      event.preventDefault();
      event.stopPropagation();
      showMenu(event, {
        text: insertAt ? null : text,
        media: insertAt ? null : (inAsideShot || both || !text ? media : null),
        variant: insertAt ? null : variant,
        resize: insertAt || media ? null : resize,
        heading: insertAt ? null : heading,
        itemHit: insertAt ? null : itemHit,
        aside: insertAt ? null : aside,
        block: insertAt ? null : block,
        insertAt,
      });
    }, true);

    menu.addEventListener('click', (event) => {
      if (event.target.closest('[data-edit-insert-toggle]')) {
        event.preventDefault();
        insertList.hidden = !insertList.hidden;
        if (!insertList.hidden) {
          insertList.style.top = '0px';
          insertList.style.left = 'calc(100% + 6px)';
          insertList.style.right = 'auto';
          const menuBox = menu.getBoundingClientRect();
          const subBox = insertList.getBoundingClientRect();
          if (menuBox.right + subBox.width > window.innerWidth - 8) {
            insertList.style.left = 'auto';
            insertList.style.right = 'calc(100% + 6px)';
          }
          let after = insertList.getBoundingClientRect();
          if (after.bottom > window.innerHeight - 8) {
            insertList.style.top = `${window.innerHeight - 8 - after.bottom}px`;
          }
          after = insertList.getBoundingClientRect();
          if (after.top < 8) insertList.style.top = `${(parseFloat(insertList.style.top) || 0) + (8 - after.top)}px`;
        }
        return;
      }
      const insertId = event.target.closest('[data-edit-insert-id]')?.dataset.editInsertId;
      if (insertId && menuInsertAt) insertBlock(insertId, menuInsertAt);
      if (event.target.closest('[data-edit-cols-stepper]')) {
        event.preventDefault();
        event.stopPropagation();
        const colsStep = event.target.closest('[data-edit-cols-step]');
        if (colsStep && !colsStep.disabled && menuVariant) {
          const spec = specOf(menuVariant);
          const range = colsRangeOf(spec, menuVariant);
          const delta = Number.parseInt(colsStep.dataset.editColsStep, 10);
          if (range && Number.isFinite(delta)) {
            const next = Math.min(range.max, Math.max(range.min, range.value + delta));
            if (next !== range.value) applyVariant(menuVariant, `cols-${next}`);
            refreshOpenMenu();
          }
        }
        return;
      }
      if (event.target.closest('[data-edit-bg-color]')) return;
      if (event.target.closest('[data-edit-aside-check]') && menuAside) {
        event.preventDefault();
        event.stopPropagation();
        const host = menuAside;
        const before = asideOn(host);
        const beforePos = asidePosOf(host);
        writeAside(host, !before);
        persist();
        record({
          undo: () => { writeAside(host, before, beforePos); persist(); },
          redo: () => { writeAside(host, !before, before ? beforePos : 'right'); persist(); },
        });
        refreshOpenMenu();
        return;
      }
      const asidePosBtn = event.target.closest('[data-edit-aside-pos]');
      if (asidePosBtn && menuAside) {
        event.preventDefault();
        event.stopPropagation();
        const host = menuAside;
        const beforePos = asidePosOf(host);
        const nextPos = asidePosBtn.dataset.editAsidePos === 'left' ? 'left' : 'right';
        if (nextPos !== beforePos) {
          writeAside(host, true, nextPos);
          persist();
          record({
            undo: () => { writeAside(host, true, beforePos); persist(); },
            redo: () => { writeAside(host, true, nextPos); persist(); },
          });
        }
        refreshOpenMenu();
        return;
      }
      const checkHost = event.target.closest('[data-edit-variant-check]');
      const variantId = checkHost?.querySelector('[data-edit-variant]')?.dataset.editVariant
        || event.target.closest('[data-edit-variant]')?.dataset.editVariant;
      if (variantId && menuVariant) {
        applyVariant(menuVariant, variantId);
        if (checkHost) {
          refreshOpenMenu();
          return;
        }
      }
      if (event.target.closest('[data-edit-text-action]') && menuText) startTextEdit(menuText);
      if (event.target.closest('[data-edit-image-action]') && (menuMedia || menuResize)) {
        pickMedia(menuMedia || menuResize);
        hideMenu();
        return;
      }
      if (event.target.closest('[data-edit-layout-action]') && (menuMedia || menuResize)) {
        startMediaAdjust(menuMedia || menuResize);
        hideMenu();
        return;
      }
      if (event.target.closest('[data-edit-add-item]') && menuItemHit) addItemAt(menuItemHit);
      if (event.target.closest('[data-edit-del-item]') && menuItemHit) removeItem(menuItemHit);
      if (event.target.closest('[data-edit-del-group]') && menuHeading) removeGroup(menuHeading);
      if (event.target.closest('[data-edit-del-block]') && menuBlock) removeBlock(menuBlock);
      hideMenu();
    });

    menu.addEventListener('input', (event) => {
      const color = event.target.closest('[data-edit-bg-color-input]');
      if (!color || !menuVariant) return;
      writeInfoBg(menuVariant, true, color.value);
    });
    menu.addEventListener('change', (event) => {
      const color = event.target.closest('[data-edit-bg-color-input]');
      if (!color || !menuVariant) return;
      const host = menuVariant;
      const key = ensureKey(host, 'variant');
      const after = snapshotVariant(host);
      if (JSON.stringify(after) === JSON.stringify(originals.variants[key])) delete state.variants[key];
      else state.variants[key] = after;
      persist();
    });

    doneBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopTextEdit({ commit: true });
    });
    const rememberRange = () => {
      if (!activeText || isSvgText(activeText) || colorHostOf(activeText)) return;
      const sel = window.getSelection();
      if (sel.rangeCount && activeText.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
    };

    const restoreRange = () => {
      if (!savedRange || !activeText) return;
      activeText.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    };

    const applyForeColor = (hex) => {
      restoreRange();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, hex);
    };

    const applyFontSize = (px) => {
      if (!px) return;
      restoreRange();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontSize', false, '7');
      (activeText || document).querySelectorAll('font[size="7"]').forEach((el) => {
        const span = document.createElement('span');
        span.style.fontSize = px;
        while (el.firstChild) span.appendChild(el.firstChild);
        el.replaceWith(span);
      });
      (activeText || document).querySelectorAll('span').forEach((el) => {
        const size = el.style.fontSize;
        if (size === 'xxx-large' || size === 'xx-large') el.style.fontSize = px;
      });
    };

    document.addEventListener('selectionchange', rememberRange);
    boldBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    boldBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!activeText || isSvgText(activeText)) return;
      restoreRange();
      document.execCommand('bold');
    });
    sizeSel.addEventListener('pointerdown', (event) => event.stopPropagation());
    sizeSel.addEventListener('change', () => {
      if (!activeText || isSvgText(activeText)) return;
      applyFontSize(sizeSel.value);
      sizeSel.value = '';
    });
    ruleBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    ruleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!activeText || isSvgText(activeText)) return;
      restoreRange();
      const sel = window.getSelection();
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      let block = range?.startContainer || null;
      if (block?.nodeType === 3) block = block.parentElement;
      while (block && block.parentElement && block.parentElement !== activeText) block = block.parentElement;
      const hr = document.createElement('hr');
      hr.className = 'rule is-soft';
      if (block && block.parentElement === activeText) block.after(hr);
      else activeText.append(hr);
      const next = document.createRange();
      next.setStartAfter(hr);
      next.collapse(true);
      sel.removeAllRanges();
      sel.addRange(next);
      savedRange = next.cloneRange();
    });
    colorPick.addEventListener('pointerdown', () => rememberRange());
    colorPalette.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      rememberRange();
      if (event.target.closest?.('.seed-edit-color, .seed-edit-color-wrap, .seed-edit-done, .seed-edit-bold, .seed-edit-size, .seed-edit-rule')) return;
      event.preventDefault();
    });
    colorPalette.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest?.('.seed-edit-color, .seed-edit-color-wrap, .seed-edit-done, .seed-edit-bold, .seed-edit-size, .seed-edit-rule')) return;
      event.preventDefault();
      const btn = event.target.closest?.('[data-color-token]');
      if (!btn || !activeText || isSvgText(activeText)) return;
      const hex = tokenColorHex(btn.dataset.colorToken);
      if (!hex) return;
      applyForeColor(hex);
      colorPick.value = hex;
    });

    document.addEventListener('pointerdown', (event) => {
      if (!menu.hidden && !event.target.closest('.seed-edit-menu')) hideMenu();
      if (activeBox && !event.target.closest('.seed-edit-media, .seed-edit-handle, .seed-edit-handle-h, [data-seed-editing-media]')) {
        stopMediaAdjust();
      }
      if (event.button !== 0) return;
      if (sorting || activeText || activeBox) return;
      const onGrip = event.target.closest?.('.seed-edit-grip');
      if (onGrip && gripTarget?.parentElement) {
        startSortDrag(gripTarget, gripTarget.parentElement, event, gripMode);
      }
    }, true);

    document.addEventListener('pointermove', (event) => {
      if (sorting || activeText || activeBox || !menu.hidden) return;
      if (event.target.closest?.('.seed-edit-menu, .seed-edit-done, .seed-edit-bold, .seed-edit-size, .seed-edit-rule, .seed-edit-color, .seed-edit-palette, .seed-edit-media, .seed-edit-handle, .seed-edit-handle-h, .seed-edit-trash')) return;
      if (pointerNearGrip(event)) return;
      const node = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!node || isChrome(node)) {
        grip.hidden = true;
        gripTarget = null;
        return;
      }
      const itemHit = itemMatchOf(node);
      if (itemHit?.item) {
        placeGrip(itemHit.item, 'item');
        return;
      }
      const block = blockOf(node);
      if (block) {
        placeGrip(block, 'block');
        return;
      }
      grip.hidden = true;
      gripTarget = null;
    });

    document.addEventListener('keydown', (event) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') {
        if (activeText) return;
        event.preventDefault();
        runHistory(event.shiftKey ? 'redo' : 'undo');
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        if (activeText) return;
        event.preventDefault();
        runHistory('redo');
        return;
      }
      if (event.key === 'Escape') {
        hideMenu();
        if (sorting) {
          event.preventDefault();
          clearSortAttrs();
        }
        if (activeBox) {
          event.preventDefault();
          stopMediaAdjust();
        }
        if (activeText) {
          event.preventDefault();
          stopTextEdit({ commit: false });
        }
        return;
      }
      if (!activeText) return;
      if (meta && event.key.toLowerCase() === 'b' && !isSvgText(activeText)) {
        event.preventDefault();
        document.execCommand('bold');
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !activeText.matches?.('.finding')) {
        event.preventDefault();
        stopTextEdit({ commit: true });
      }
    });

    document.addEventListener('focusin', (event) => {
      const input = event.target.closest?.('input.token-color, input.seed-edit-color');
      if (input) colorBefore = input.value;
    });

    document.addEventListener('input', (event) => {
      const chromePick = event.target.closest?.('input.seed-edit-color');
      if (chromePick && activeText) {
        const host = colorHostOf(activeText);
        if (host) applyColorHex(host, chromePick.value);
        else applyForeColor(chromePick.value);
        return;
      }
      const boardPick = event.target.closest?.('input.token-color');
      if (boardPick) {
        const host = colorHostOf(boardPick);
        if (host) applyColorHex(host, boardPick.value);
        return;
      }
      if (activeText?.classList.contains('token-value') && colorHostOf(activeText)) {
        applyTokenValue(activeText);
        const hex = hexInputValue(activeText.textContent);
        const swatch = colorHostOf(activeText).querySelector('input.token-color');
        if (hex && swatch) swatch.value = hex;
        if (hex && !colorPick.hidden) colorPick.value = hex;
      }
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest?.('input.token-color, input.seed-edit-color');
      if (!input) return;
      const host = colorHostOf(input) || (activeText && colorHostOf(activeText));
      if (!host) return;
      applyColorHex(host, input.value, { history: true, previous: (colorBefore || '').toUpperCase() });
    });

    window.addEventListener('resize', () => {
      if (activeText) placeDone(svgInput || activeText);
      if (activeBox) placeMediaChrome();
    });
    document.addEventListener('scroll', () => {
      if (activeText) placeDone(svgInput || activeText);
      if (activeBox) placeMediaChrome();
    }, true);

    enhanceColorTokens();
    hydrateEditorial();
    document.querySelectorAll('.comp-media .shot').forEach(ensureAsideCaption);
    document.querySelectorAll('.market-formula, .stat-grid, .stat-row, .info-grid, .plain-grid, .point, .finding').forEach((box) => {
      if (isAsideHost(box)) return;
      writeLayout(box, { ...readLayout(box), height: null });
    });
    if (!isCatalog) {
      idbGet('state', slug).then(async (saved) => {
        if (saved && (saved.texts || saved.media || saved.images || saved.markup || saved.variants)) {
          state.texts = saved.texts || {};
          state.media = saved.media || saved.images || {};
          state.variants = saved.variants || {};
          state.markup = saved.markup || '';
          await applyStateToDom();
          stripItemAsides();
          hydrateEditorial();
          document.querySelectorAll('.info-grid[data-aside], .pain-text-list[data-aside], .plain-grid[data-aside]').forEach((host) => {
            if (host.querySelector(':scope > .comp-media')) wrapAsideMain(host);
            host.querySelectorAll(':scope > .comp-media .shot').forEach(ensureAsideCaption);
          });
          persist().catch(() => {});
        }
      }).catch(() => {});
    }
  };

  window.SeedEdit = { mount };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount(), { once: true });
  } else {
    mount();
  }
})();
