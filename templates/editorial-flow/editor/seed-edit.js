(() => {
  const CHROME = [
    '.theme-control', '.report-chrome', '.report-chrome-hotspot', '.document-nav',
    '.report-pager',     '.seed-edit-menu', '.seed-edit-done', '.seed-edit-svg-input',
    '.seed-edit-color', '.seed-edit-media', '.seed-edit-handle', '.seed-edit-handle-h',
    '.topbar', 'nav.toc', '.tools',
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

  const isChrome = (node) => !!(node && (node.closest?.(CHROME) || node.closest?.('.seed-edit-menu, .seed-edit-done, .seed-edit-svg-input')));

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

    const frame = node.closest('.shot__frame, .gallery-stage, .brand-concept-film, .shot, figure');
    if (frame) return frame.querySelector('img, video, svg');
    return null;
  };

  const RESIZE_SEL = [
    '.shot', '.brand-concept-film', 'figure.shot', '.gallery-stage',
    '.plain-table-wrap', '.table-wrap', '.hotel-ranking-scroll',
    '.rail-growth-chart', '.venn-wrap', '.ansoff-wrap', '.ansoff-grid', '.hotel-funnel-chart',
  ].join(', ');

  const mediaBoxOf = (el) => {
    if (!el) return null;
    return el.closest('.shot, .brand-concept-film, figure, .gallery-stage') || el.parentElement;
  };

  const resizeBoxOf = (el) => {
    if (!el || el.nodeType === 3) el = el?.parentElement;
    if (!el || isChrome(el)) return null;
    return el.closest(RESIZE_SEL);
  };

  const isMediaBox = (box) => !!(box && box.querySelector('img, video, svg') && !box.matches('.plain-table-wrap, .table-wrap, .hotel-ranking-scroll'));

  const readLayout = (box) => ({
    align: box?.dataset.align || 'left',
    fit: box?.dataset.fit || 'fit',
    width: box?.style.width ? parseFloat(box.style.width) : null,
    height: box?.style.height ? parseFloat(box.style.height) : null,
  });

  const writeLayout = (box, layout = {}) => {
    if (!box) return;
    const align = layout.align || 'left';
    const fit = layout.fit || 'fit';
    box.dataset.align = align;
    box.dataset.fit = fit;
    if (layout.width) {
      box.style.width = `${Math.round(layout.width)}px`;
      box.style.maxWidth = '100%';
    } else {
      box.style.removeProperty('width');
    }
    const frame = box.querySelector('.shot__frame') || box;
    if (layout.height) {
      const h = Math.round(layout.height);
      box.style.height = `${h}px`;
      if (frame !== box) frame.style.height = `${h}px`;
      if (!isMediaBox(box)) box.style.overflow = 'auto';
    } else {
      box.style.removeProperty('height');
      if (frame !== box) frame.style.removeProperty('height');
      if (!isMediaBox(box)) box.style.removeProperty('overflow');
    }
    if (fit === 'fill' && !layout.height) {
      const ratio = box.dataset.seedRatio;
      if (ratio) frame.style.aspectRatio = ratio;
    } else {
      frame.style.removeProperty('aspect-ratio');
    }
    layoutChartHeight(box);
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
      items: [
        { id: 'plain', label: '数字卡' },
        { id: 'note', label: '标注卡' },
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
            { id: 'layout-grid', label: '格子' },
            { id: 'layout-stack', label: '列表 A' },
            { id: 'layout-row', label: '列表 B' },
          ],
        },
        {
          id: 'index',
          title: '显示编号',
          items: [
            { id: 'index-on', label: '是' },
            { id: 'index-off', label: '否' },
          ],
        },
        {
          id: 'pos',
          title: '编号位置',
          when: 'index-on',
          items: [
            { id: 'pos-top', label: '顶部' },
            { id: 'pos-left', label: '左侧' },
          ],
        },
        {
          id: 'type',
          title: '编号类型',
          when: 'index-on',
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
          items: [
            { id: 'no-lg', label: '大' },
            { id: 'no-sm', label: '小' },
          ],
        },
      ],
    },
    {
      group: 'plain',
      sel: '.plain-grid',
      items: [
        { id: 'plain', label: '默认底' },
        { id: 'tint', label: '浅底' },
        { id: 'line', label: '夹线' },
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
      items: [
        { id: 'photo', label: '照片' },
        { id: 'crop', label: '裁切' },
        { id: 'scroll', label: '可滚动' },
        { id: 'wide', label: '宽图' },
        { id: 'poster', label: '海报' },
      ],
    },
  ];

  const specOf = (host) => VARIANT_SPECS.find((spec) => host?.matches?.(spec.sel)) || null;

  const variantHostOf = (node) => {
    if (!node?.closest) return null;
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
      const fallback = grid.hasAttribute('data-cols') ? 'split' : '2';
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

  const ensureStatNoteSlots = (card) => {
    let kicker = card.querySelector('.stat-card__kicker');
    if (!kicker) {
      kicker = document.createElement('span');
      kicker.className = 'stat-card__kicker';
      card.prepend(kicker);
    }
    if (!(kicker.textContent || '').trim()) kicker.textContent = '标签';
    let num = card.querySelector('.stat-card__num');
    if (!num) {
      num = document.createElement('strong');
      num.className = 'stat-card__num';
      kicker.after(num);
    }
    let ratio = num.querySelector('.stat-card__ratio');
    if (!ratio) {
      ratio = document.createElement('span');
      ratio.className = 'stat-card__ratio';
      num.append(ratio);
    }
    if (!(ratio.textContent || '').trim()) ratio.textContent = '0 / 0';
  };

  const writeStatVariant = (card, id) => {
    if (id === 'note') {
      ensureStatNoteSlots(card);
      card.setAttribute('data-variant', 'note');
      return;
    }
    card.removeAttribute('data-variant');
  };

  const snapshotVariant = (host) => {
    const spec = specOf(host);
    if (!spec) return null;
    if (spec.group === 'stat') {
      return { group: 'stat', variant: host.getAttribute('data-variant') === 'note' ? 'note' : 'plain' };
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
      };
    }
    if (spec.group === 'plain') return { group: 'plain', surface: host.getAttribute('data-surface') || 'plain' };
    if (spec.group === 'point') return { group: 'point', soft: host.classList.contains('is-soft') };
    if (spec.group === 'shot') return { group: 'shot', kind: host.getAttribute('data-kind') || 'photo' };
    return { group: spec.group };
  };

  const restoreVariant = (host, snap) => {
    if (!host || !snap) return;
    if (snap.group === 'stat') {
      writeStatVariant(host, snap.variant === 'note' ? 'note' : 'plain');
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
      return;
    }
    if (snap.group === 'plain') {
      if (!snap.surface || snap.surface === 'plain') host.removeAttribute('data-surface');
      else host.setAttribute('data-surface', snap.surface);
      return;
    }
    if (snap.group === 'point') {
      host.classList.toggle('is-soft', !!snap.soft);
      return;
    }
    if (snap.group === 'shot' && snap.kind) host.setAttribute('data-kind', snap.kind);
  };

  const applyVariantId = (host, id) => {
    const spec = specOf(host);
    if (!spec) return;
    const before = snapshotVariant(host);
    if (spec.group === 'stat') {
      writeStatVariant(host, id);
    } else if (spec.group === 'info') {
      if (id === 'no-lg') writeInfoNo(host, true);
      else if (id === 'no-sm') writeInfoNo(host, false);
      else if (id === 'index-off') writeInfoIndex(host, 'off');
      else if (id === 'index-on') writeInfoIndex(host, infoTypeOf(host), infoLabelsOf(host));
      else if (id === 'type-alpha') writeInfoIndex(host, 'alpha');
      else if (id === 'type-num') writeInfoIndex(host, 'num');
      else if (id === 'type-q') writeInfoIndex(host, 'q');
      else if (id === 'type-label') writeInfoIndex(host, 'label');
      else if (id === 'layout-grid') writeInfoShape(host, 'grid');
      else if (id === 'layout-stack') writeInfoShape(host, 'stack');
      else if (id === 'layout-row') writeInfoShape(host, 'row');
      else if (id === 'pos-top') writeInfoPos(host, 'top');
      else if (id === 'pos-left') writeInfoPos(host, 'left');
      else writeInfoKind(host, id);
    } else if (spec.group === 'plain') {
      restoreVariant(host, { group: 'plain', surface: id });
    } else if (spec.group === 'point') {
      restoreVariant(host, { group: 'point', soft: id === 'soft' });
    } else if (spec.group === 'shot') {
      restoreVariant(host, { group: 'shot', kind: id });
    }
    return { before, after: snapshotVariant(host) };
  };

  const variantActiveIds = (host) => {
    const snap = snapshotVariant(host);
    if (!snap) return [];
    if (snap.group === 'stat') return [snap.variant || 'plain'];
    if (snap.group === 'info') {
      const shape = snap.layout === 'row' ? 'row' : (snap.layout === 'stack' || snap.layout === 'label') ? 'stack' : 'grid';
      const type = snap.type === 'alpha' || snap.type === 'q' || snap.type === 'label' ? snap.type : 'num';
      const pos = snap.pos || (snap.layout === 'cols' ? 'top' : 'left');
      return [
        `layout-${shape}`,
        snap.index === 'off' ? 'index-off' : 'index-on',
        `pos-${pos}`,
        `type-${type}`,
        snap.no === 'lg' ? 'no-lg' : 'no-sm',
      ];
    }
    if (snap.group === 'plain') return [snap.surface || 'plain'];
    if (snap.group === 'point') return [snap.soft ? 'soft' : 'tint'];
    if (snap.group === 'shot') return [snap.kind || 'photo'];
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
  };

  const mount = () => {
    if (document.documentElement.dataset.seedEditMounted) return;
    document.documentElement.dataset.seedEditMounted = '1';

    const slug = slugOf();
    const objectUrls = new Map();
    const originals = { texts: {}, media: {}, variants: {} };
    const state = { texts: {}, media: {}, variants: {} };
    const history = [];
    let histAt = -1;
    let applyingHist = false;
    let fileInput = null;
    let activeText = null;
    let beforeEdit = '';
    let svgInput = null;

    const menu = document.createElement('div');
    menu.className = 'seed-edit-menu';
    menu.hidden = true;
    menu.innerHTML = [
      '<button type="button" data-edit-text-action>编辑</button>',
      '<button type="button" data-edit-image-action>替换</button>',
      '<button type="button" data-edit-layout-action>调整</button>',
    ].join('');
    document.body.appendChild(menu);
    const textBtn = menu.querySelector('[data-edit-text-action]');
    const imageBtn = menu.querySelector('[data-edit-image-action]');
    const layoutBtn = menu.querySelector('[data-edit-layout-action]');
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
    const colorPick = document.createElement('input');
    colorPick.type = 'color';
    colorPick.className = 'seed-edit-color';
    colorPick.hidden = true;
    colorPick.setAttribute('aria-label', '选择颜色');
    document.body.appendChild(colorPick);
    let colorBefore = '';

    const hideMenu = () => {
      menu.hidden = true;
      menuText = null;
      menuMedia = null;
      menuVariant = null;
      menuResize = null;
    };

    const paintVariantMenu = (host) => {
      menu.querySelectorAll('[data-edit-variant], [data-edit-variant-rule], [data-edit-variant-label]').forEach((el) => el.remove());
      const spec = specOf(host);
      if (!spec) return;
      const rule = document.createElement('div');
      rule.className = 'seed-edit-menu__rule';
      rule.setAttribute('data-edit-variant-rule', '');
      menu.append(rule);
      const active = new Set(variantActiveIds(host));
      const appendItem = (item) => {
        if (item.rule) {
          const split = document.createElement('div');
          split.className = 'seed-edit-menu__rule';
          split.setAttribute('data-edit-variant-rule', '');
          menu.append(split);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.editVariant = item.id;
        btn.textContent = item.label;
        btn.classList.toggle('is-on', active.has(item.id));
        menu.append(btn);
      };
      if (spec.sections) {
        const indexOn = !active.has('index-off');
        spec.sections.forEach((section) => {
          if (section.when === 'index-on' && !indexOn) return;
          const label = document.createElement('div');
          label.className = 'seed-edit-menu__label';
          label.setAttribute('data-edit-variant-label', '');
          label.textContent = section.title;
          menu.append(label);
          (section.items || []).forEach(appendItem);
        });
        return;
      }
      (spec.items || []).forEach(appendItem);
    };

    const showMenu = (event, { text, media, variant, resize }) => {
      menuText = text || null;
      menuMedia = media || null;
      menuVariant = variant || null;
      menuResize = resize || null;
      textBtn.hidden = !menuText;
      imageBtn.hidden = !menuMedia;
      layoutBtn.hidden = !(menuMedia || menuResize);
      paintVariantMenu(menuVariant);
      if (textBtn.hidden && imageBtn.hidden && layoutBtn.hidden && !menuVariant) return;
      menu.hidden = false;
      const box = menu.getBoundingClientRect();
      const pad = 8;
      menu.style.left = `${Math.max(pad, Math.min(event.clientX, window.innerWidth - box.width - pad))}px`;
      menu.style.top = `${Math.max(pad, Math.min(event.clientY, window.innerHeight - box.height - pad))}px`;
    };

    const persist = async () => {
      await idbSet('state', slug, {
        texts: state.texts,
        media: state.media,
        variants: state.variants,
        images: state.media,
      });
    };

    const nodeByKey = (key) => {
      const live = document.querySelector(`[data-edit-key="${CSS.escape(key)}"]`);
      if (live) return live;
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
      if (activeText || activeBox) return;
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
      const width = doneBtn.offsetWidth || 72;
      const height = doneBtn.offsetHeight || 34;
      const pad = 8;
      let left = box.right + pad;
      let top = box.top;
      if (left + width > window.innerWidth - pad) left = Math.max(pad, box.right - width);
      if (top + height > window.innerHeight - pad) top = Math.max(pad, box.bottom - height);
      doneBtn.style.left = `${left}px`;
      doneBtn.style.top = `${top}px`;
      if (!colorPick.hidden) {
        const size = colorPick.offsetWidth || 34;
        let cleft = left - size - 8;
        if (cleft < pad) cleft = left + width + 8;
        colorPick.style.left = `${cleft}px`;
        colorPick.style.top = `${top}px`;
      }
    };

    const hideColorPick = () => {
      colorPick.hidden = true;
    };

    const showColorPickFor = (valueEl) => {
      const hex = hexInputValue(valueEl?.textContent);
      colorPick.hidden = false;
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
        startSvgTextEdit(node);
        return;
      }
      node.contentEditable = 'true';
      node.spellcheck = false;
      node.focus();
      if (node.closest?.('[data-token-kind="color"]')) showColorPickFor(node);
      else hideColorPick();
      placeDone(node);
    };

    const applyMediaFile = (el, file, url) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const tag = el.tagName.toLowerCase();

      const swap = (next) => {
        next.dataset.editKey = el.dataset.editKey || '';
        el.replaceWith(next);
        return next;
      };

      if (tag === 'video') {
        if (isVideo) {
          el.querySelectorAll('source').forEach((source) => {
            source.src = url;
          });
          el.src = url;
          el.load();
          return el;
        }
        if (isImage) {
          el.poster = url;
          return el;
        }
      }

      if (tag === 'img') {
        if (isImage) {
          el.src = url;
          if (el.hasAttribute('data-src')) el.setAttribute('data-src', url);
          const thumb = el.closest('.gallery-thumb');
          if (thumb) thumb.setAttribute('data-src', url);
          const shot = el.closest('.shot, [data-gallery]');
          if (shot?.hasAttribute('data-lightbox-src')) shot.setAttribute('data-lightbox-src', url);
          return el;
        }
        if (isVideo) {
          const video = document.createElement('video');
          video.controls = true;
          video.playsInline = true;
          video.src = url;
          video.style.cssText = el.getAttribute('style') || '';
          video.className = el.className;
          return swap(video);
        }
      }

      if (tag === 'svg') {
        const media = document.createElement(isVideo ? 'video' : 'img');
        if (isVideo) {
          media.controls = true;
          media.playsInline = true;
        }
        media.src = url;
        const box = el.getBoundingClientRect();
        media.style.width = '100%';
        media.style.maxWidth = `${Math.round(box.width)}px`;
        media.style.display = 'block';
        return swap(media);
      }
      return el;
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
      if (!el) return;
      const key = ensureKey(el, 'media');
      if (!(key in originals.media)) originals.media[key] = captureMediaSnap(el);
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
        const node = nodeByKey(key) || el;
        const beforeBlob = await idbGet('blobs', `${slug}::${key}`);
        const beforeSnap = captureMediaSnap(node);
        const beforeRec = state.media[key] ? { ...state.media[key] } : null;
        await idbSet('blobs', `${slug}::${key}`, file);
        const afterRec = { ...(beforeRec || {}), name: file.name, type: file.type };
        state.media[key] = afterRec;
        const prevUrl = objectUrls.get(key);
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        const url = URL.createObjectURL(file);
        objectUrls.set(key, url);
        applyMediaFile(node, file, url);
        record({
          undo: async () => {
            const cur = nodeByKey(key);
            if (!cur) return;
            if (beforeBlob instanceof Blob) {
              await idbSet('blobs', `${slug}::${key}`, beforeBlob);
              restoreMediaSnap(cur, beforeSnap, beforeBlob);
              state.media[key] = beforeRec;
              return;
            }
            restoreMediaSnap(cur, originals.media[key] || beforeSnap, null);
            if (beforeRec) state.media[key] = beforeRec;
            else delete state.media[key];
          },
          redo: async () => {
            const cur = nodeByKey(key);
            if (!cur) return;
            await idbSet('blobs', `${slug}::${key}`, file);
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
      handleH.hidden = false;
      const showMedia = isMediaBox(activeBox);
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
        btn.classList.toggle('is-on', btn.dataset.fit === (activeBox.dataset.fit || 'fit'));
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
            const node = nodeByKey(key);
            const host = mediaBoxOf(node) || node;
            if (!host) return;
            writeLayout(host, prev || { align: 'left', fit: 'fit', width: null, height: null });
            const cur = state.media[key] || {};
            cur.layout = prev;
            state.media[key] = cur;
          },
          redo: () => {
            const node = nodeByKey(key);
            const host = mediaBoxOf(node) || node;
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
      const box = resizeBoxOf(el) || mediaBoxOf(el);
      if (!box) return;
      if (activeBox && activeBox !== box) stopMediaAdjust();
      const key = ensureKey(box, 'media');
      if (el.dataset && !el.dataset.editKey) el.dataset.editKey = key;
      const rect = box.getBoundingClientRect();
      if (!box.dataset.seedRatio) box.dataset.seedRatio = String(rect.width / Math.max(rect.height, 1));
      activeBox = box;
      box.setAttribute('data-seed-editing-media', '');
      if (!box.dataset.align) box.dataset.align = 'left';
      if (!box.dataset.fit) box.dataset.fit = 'fit';
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
        event.preventDefault();
        const startX = event.clientX;
        const startY = event.clientY;
        const startBox = activeBox.getBoundingClientRect();
        const parentW = activeBox.parentElement?.getBoundingClientRect().width || window.innerWidth;
        const onMove = (move) => {
          const nextW = axis === 'x'
            ? Math.max(120, Math.min(parentW, startBox.width + (move.clientX - startX)))
            : startBox.width;
          const nextH = axis === 'y'
            ? Math.max(80, startBox.height + (move.clientY - startY))
            : startBox.height;
          writeLayout(activeBox, { ...readLayout(activeBox), width: nextW, height: nextH });
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
    };
    bindResizeHandle(handle, 'x');
    bindResizeHandle(handleH, 'y');

    const applyStateToDom = async () => {
      for (const [key, rec] of Object.entries(state.variants || {})) {
        const node = nodeByKey(key);
        if (!node) continue;
        if (!(key in originals.variants)) originals.variants[key] = snapshotVariant(node);
        const snap = typeof rec === 'string' ? { group: 'info', layout: rec, no: 'sm' } : rec;
        restoreVariant(node, snap);
      }
      for (const [key, value] of Object.entries(state.texts || {})) {
        const path = key.split('::').slice(2).join('::');
        const node = fromPath(path);
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
        const path = key.split('::').slice(2).join('::');
        let node = fromPath(path);
        if (!node) continue;
        node.dataset.editKey = key;
        if (rec.layout) writeLayout(mediaBoxOf(node) || node, rec.layout);
        const blob = await idbGet('blobs', `${slug}::${key}`);
        if (!(blob instanceof Blob)) continue;
        const prev = objectUrls.get(key);
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(blob);
        objectUrls.set(key, url);
        applyMediaFile(node, blob, url);
      }
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
      const media = mediaTargetOf(node);
      const variant = variantHostOf(node);
      const resize = resizeBoxOf(node);
      const both = text && media && isSvgText(text);
      if (!text && !media && !variant && !resize) return;
      event.preventDefault();
      event.stopPropagation();
      showMenu(event, {
        text,
        media: both || !text ? media : null,
        variant,
        resize: media ? null : resize,
      });
    }, true);

    menu.addEventListener('click', (event) => {
      const variantId = event.target.closest('[data-edit-variant]')?.dataset.editVariant;
      if (variantId && menuVariant) applyVariant(menuVariant, variantId);
      if (event.target.closest('[data-edit-text-action]') && menuText) startTextEdit(menuText);
      if (event.target.closest('[data-edit-image-action]') && menuMedia) pickMedia(menuMedia);
      if (event.target.closest('[data-edit-layout-action]') && (menuMedia || menuResize)) {
        startMediaAdjust(menuMedia || menuResize);
      }
      hideMenu();
    });

    doneBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopTextEdit({ commit: true });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!menu.hidden && !event.target.closest('.seed-edit-menu')) hideMenu();
      if (activeBox && !event.target.closest('.seed-edit-media, .seed-edit-handle, .seed-edit-handle-h, [data-seed-editing-media]')) {
        stopMediaAdjust();
      }
    }, true);

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
      if (event.key === 'Enter' && !event.shiftKey) {
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
    idbGet('state', slug).then(async (saved) => {
      if (saved && (saved.texts || saved.media || saved.images)) {
        state.texts = saved.texts || {};
        state.media = saved.media || saved.images || {};
        state.variants = saved.variants || {};
        await applyStateToDom();
      }
    }).catch(() => {});
  };

  window.SeedEdit = { mount };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount(), { once: true });
  } else {
    mount();
  }
})();
