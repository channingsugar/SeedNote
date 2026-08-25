const root = document.documentElement;
const workspace = document.querySelector('#workspace');
const inspector = document.querySelector('#inspector');
const inspectorTitle = document.querySelector('#inspectorTitle');
const inspectorBody = document.querySelector('#inspectorBody');
const breadcrumbs = document.querySelector('#breadcrumbs');
const closeInspectorButton = document.querySelector('#closeInspector');
const resetButton = document.querySelector('#resetSelection');
const copyButton = document.querySelector('#copyConfig');
const toast = document.querySelector('#toast');
const DS = window.DesignSystemData;
const activeThemeName = document.querySelector('#activeThemeName');
const themeSelect = document.querySelector('#themeSelect');
const tokenDialog = document.querySelector('#tokenDialog');
const tokenForm = document.querySelector('#tokenForm');
const tokenNameInput = document.querySelector('#tokenName');
const tokenValueInput = document.querySelector('#tokenValue');
const tokenCategoryInput = document.querySelector('#tokenCategory');
const tokenEditingIdInput = document.querySelector('#tokenEditingId');
const tokenColorGroupRow = document.querySelector('#tokenColorGroupRow');
const tokenColorGroupInput = document.querySelector('#tokenColorGroup');

let themeStore = loadThemeStore();
let activeTheme = themeStore.themes.find((theme) => theme.id === themeStore.activeThemeId) || themeStore.themes[0];
let tokenState = DS.clone(activeTheme.tokens);
let componentState = DS.clone(activeTheme.components);
normalizeDesignState();

const initialTokens = {};
[
  '--paper', '--surface', '--ink', '--accent', '--accent-soft', '--line',
  '--radius-sm', '--radius-md', '--border-thin', '--space-5',
  '--text-display', '--text-h1', '--text-h2', '--text-h3',
  '--text-body', '--text-small', '--text-caption', '--line-body'
].forEach((token) => {
  initialTokens[token] = getComputedStyle(root).getPropertyValue(token).trim();
});

document.querySelectorAll('[data-editable]').forEach((element, index) => {
  element.dataset.historyId = `asset-${index + 1}`;
});

const initialComponents = new Map();
document.querySelectorAll('[data-component-root]').forEach((component) => {
  initialComponents.set(component, {
    html: component.innerHTML,
    style: component.getAttribute('style')
  });
});

let selected = null;
let selectedRoot = null;
let toastTimer = null;
let historyStack = [];
let redoStack = [];
let restoringHistory = false;
let historyCommitScheduled = false;

let typeTokens = [];
let colorTokens = [];
let spaceTokens = [];
let radiusTokens = [];
let lineWidthTokens = [];

function refreshTokenOptions() {
  typeTokens = (tokenState.typeScale || []).map((item) => [item.name, item.variable]);
  colorTokens = (tokenState.colors || []).map((item) => [item.name, item.variable]);
  spaceTokens = (tokenState.spaces || []).map((item) => [String(item.value), item.variable]);
  radiusTokens = (tokenState.radii || []).map((item) => [item.name, item.variable]);
  lineWidthTokens = (tokenState.lineWidths || []).map((item) => [item.name, item.variable]);
}

function openInspector(element) {
  if (!element) return;
  document.querySelectorAll('.is-selected').forEach((item) => item.classList.remove('is-selected'));
  selected = element;
  selectedRoot = element.closest('[data-component-root]') || element;
  selected.classList.add('is-selected');
  inspectorTitle.textContent = selected.dataset.nodeLabel || '未命名元素';
  inspector.classList.add('is-open');
  inspector.setAttribute('aria-hidden', 'false');
  workspace.classList.add('has-inspector');
  renderBreadcrumbs();
  renderControls();
}

function closeInspector() {
  document.querySelectorAll('.is-selected').forEach((item) => item.classList.remove('is-selected'));
  selected = null;
  selectedRoot = null;
  inspector.classList.remove('is-open');
  inspector.setAttribute('aria-hidden', 'true');
  workspace.classList.remove('has-inspector');
}

function pageParentRoot(node) {
  if (!node) return null;
  const region = node.closest('#pages .page-region');
  if (!region) return null;
  return [...region.children].find((child) => (
    child.matches('[data-component-root], [data-page-parent]')
    && !child.matches('.page-region, .page-regions')
  )) || null;
}

function resolveEditable(node) {
  const editable = node?.closest?.('[data-editable]');
  if (!editable) return null;
  if (editable.matches('.page-regions, .page-region')) return editable;
  return pageParentRoot(editable) || editable;
}

function renderBreadcrumbs() {
  breadcrumbs.innerHTML = '';
  const path = [];
  let current = selected;
  const pageShell = selected?.closest('#pages .page-regions');
  const stopAt = pageShell || selectedRoot;
  while (current) {
    if (current.matches?.('[data-editable]')) path.unshift(current);
    if (current === stopAt) break;
    current = current.parentElement;
  }
  path.forEach((element) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = element.dataset.nodeLabel || '元素';
    button.addEventListener('click', () => openInspector(element));
    breadcrumbs.appendChild(button);
  });
}

const PAGE_PARENTS = [
  ['Decision Callout', 'decisionCallout'],
  ['Card Grid · 强调', 'cardGridHighlight'],
  ['Card Grid', 'cardGrid'],
  ['Stat Grid', 'statGrid'],
  ['Labeled List', 'labeledList'],
  ['Process Steps', 'processSteps'],
  ['Data Table', 'dataTable'],
  ['Bar Compare', 'barCompare'],
  ['Evidence', 'evidence']
];

const MEDIA_SPLIT_PARENTS = [
  ['默认文案', 'mediaCopy'],
  ['Labeled List', 'labeledList'],
  ['Process Steps', 'processSteps'],
  ['Card Grid · 强调', 'cardGridHighlight'],
  ['Bar Compare', 'barCompare']
];

const MEDIA_STACK_PARENTS = [
  ['默认文案', 'mediaCopy'],
  ['Decision Callout', 'decisionCallout'],
  ['Card Grid · 强调', 'cardGridHighlight'],
  ['Card Grid', 'cardGrid'],
  ['Stat Grid', 'statGrid']
];

const MEDIA_SLOT_PARENTS = [
  ['Evidence', 'evidence']
];

const EVIDENCE_KINDS = [
  ['Evidence 图片', 'photo'],
  ['Evidence 截图', 'shot'],
  ['Evidence 条带', 'strip'],
  ['Media Switch 封面', 'switch']
];

function renderControls() {
  inspectorBody.innerHTML = '';
  const kind = selected.dataset.kind;
  const pageRegion = selected.closest('#pages .page-region');
  if (kind === 'page-region' || (pageRegion && selected.matches('[data-component-root]'))) {
    addParentSwapControl(kind === 'page-region' ? pageRegion : selected);
  }

  if (kind === 'dynamic-token') {
    renderDynamicTokenControls(selected.dataset.category, selected.dataset.tokenId);
    return;
  }
  if (kind === 'color-token') {
    addColorControl('颜色值', selected.dataset.token);
    addInfo('这是基础 Token。修改后，所有引用该语义颜色的组件都会实时更新。');
    return;
  }
  if (['radius-token', 'line-token', 'space-token'].includes(kind)) {
    const config = {
      'radius-token': ['圆角', 0, 24, 1],
      'line-token': ['线条粗细', 1, 6, 1],
      'space-token': ['间距', 4, 64, 2]
    }[kind];
    addRootTokenRange(config[0], selected.dataset.token, config[1], config[2], config[3]);
    addInfo('这是基础 Token。组件只能引用该值，不会创建新的游离样式。');
    return;
  }
  if (kind === 'type-system') {
    addSelect('字体家族', [
      ['现代无衬线', 'var(--font-sans)'],
      ['中文宋体', 'var(--font-serif)'],
      ['等宽字体', 'var(--font-mono)']
    ], (value) => selected.style.fontFamily = value);
    addRootTokenRange('正文行高', '--line-body', 1.3, 2.1, .02, '');
    return;
  }
  if (kind === 'text-atom') {
    const token = inferTypeToken(selected);
    if (token) addRootTokenRange('字号 Token', token, 11, 72, 1);
    addSelect('字体家族', [
      ['现代无衬线', 'var(--font-sans)'],
      ['中文宋体', 'var(--font-serif)'],
      ['等宽字体', 'var(--font-mono)']
    ], (value) => selected.style.fontFamily = value);
    addAlignmentControl();
    return;
  }

  if (['text-child', 'table-cell'].includes(kind)) {
    addTokenChoices('字号角色', typeTokens, (token) => {
      selected.style.fontSize = `var(${token})`;
    }, getReferencedToken(selected.style.fontSize));
    addTokenChoices('文字颜色', colorTokens, (token) => {
      selected.style.color = `var(${token})`;
    }, getReferencedToken(selected.style.color));
    addTokenChoices('字重', [
      ['常规', '--weight-regular'],
      ['中等', '--weight-medium'],
      ['粗体', '--weight-bold']
    ], (token) => {
      selected.style.fontWeight = `var(${token})`;
    }, getReferencedToken(selected.style.fontWeight));
    addAlignmentControl();
    return;
  }

  if (kind === 'grid-component') {
    const component = selected;
    const componentId = ensureComponentId(component, component.dataset.pageParent || 'grid');
    const splitBand = component.classList.contains('is-highlight') && component.closest('[data-media-page="split"]');
    const availableItems = splitBand ? 6 : Math.max(12, gridChildren(component).length);
    const itemCount = Math.min(availableItems, currentItemCount(component, componentId));
    if (splitBand && currentItemCount(component, componentId) > 6) setGridItemCount(component, 6);
    addRange('卡片数量', 1, availableItems, 1, itemCount, (value) => {
      setGridItemCount(component, value);
      applyBalancedColumns(component, value);
      toggleHorizontalControls(component, componentState[componentId]?.mode === 'horizontal');
    }, '', () => renderControls());
    const columns = ensureEvenGrid(component, itemCount);
    addSelect('排列列数', evenColumnOptions(itemCount), (value) => {
      setGridColumns(component, Number(value));
      setHorizontalEligibility(component, componentId, Number(value));
    }, String(columns));
    addSelect('展示方式', [['网格', 'grid'], ['横向滑动', 'horizontal']], (value) => {
      if (value === 'horizontal' && Number(componentState[componentId]?.columns || 3) < 2) return;
      updateComponentConfig(componentId, 'mode', value);
      component.classList.toggle('is-horizontal', value === 'horizontal');
      if (value === 'horizontal') {
        applyHorizontalTrack(component, componentState[componentId]?.columns || HORIZONTAL_VISIBLE);
      } else {
        setGridColumns(component, componentState[componentId]?.columns || balancedColumns(currentItemCount(component)));
      }
      syncComponentItems(component, componentState[componentId]?.itemCount || availableItems);
      toggleHorizontalControls(component, value === 'horizontal');
    }, componentState[componentId]?.mode || 'grid');
    addRange('横滑卡片宽度', 0, 520, 10, componentState[componentId]?.slideWidth || 0, (value) => {
      component.style.setProperty('--slide-width', `${value}px`);
      updateComponentConfig(componentId, 'slideWidth', value);
      toggleHorizontalControls(component, componentState[componentId]?.mode === 'horizontal');
    });
    setHorizontalEligibility(component, componentId, componentState[componentId]?.columns || 3);
    if (component.classList.contains('card-grid') && !component.querySelector('.stat-value')) {
      addSelect('卡片样式', [['默认', 'plain'], ['强调色', 'highlight']], (value) => {
        component.classList.toggle('is-highlight', value === 'highlight');
        if (component.dataset.pageParent) {
          component.dataset.pageParent = value === 'highlight' ? 'cardGridHighlight' : 'cardGrid';
        }
        updateComponentConfig(componentId, 'tone', value);
      }, component.classList.contains('is-highlight') ? 'highlight' : 'plain');
      addDecorationControl(componentId, component);
    }
    if (component.querySelector('.stat-value')) {
      addInfo('Stat Grid：数字用 DIN Alternate、不加粗。数字行只放数字或符号，单位写进标题或口径。文字固定居中。');
    }
    addTokenChoices('网格间距', spaceTokens, (token) => {
      component.style.setProperty('--card-gap', `var(${token})`);
    }, getReferencedToken(component.style.getPropertyValue('--card-gap')));
    addTokenChoices('内容内边距', spaceTokens, (token) => {
      component.style.setProperty('--card-padding', `var(${token})`);
    }, getReferencedToken(component.style.getPropertyValue('--card-padding')));
    return;
  }

  if (['card-child', 'callout-component'].includes(kind)) {
    addTokenChoices('内边距', spaceTokens, (token) => {
      selected.style.padding = `var(${token})`;
    }, getReferencedToken(selected.style.padding));
    addTokenChoices('圆角', radiusTokens, (token) => {
      selected.style.borderRadius = `var(${token})`;
    }, getReferencedToken(selected.style.borderRadius));
    addRange('最小高度', 80, 360, 4, Math.round(selected.getBoundingClientRect().height), (value) => {
      selected.style.minHeight = `${value}px`;
    });
    if (kind === 'callout-component') {
      addInfo('结论 / 判断只保留一种样式：无装饰条、无色块。');
    }
    return;
  }

  if (kind === 'section-header') {
    addInfo('编号、标题、导语上下排列。导语跟满标题宽度，不要用 max-width 提前截断换行。');
    addTokenChoices('栏间距', spaceTokens, (token) => {
      selected.style.gap = `var(${token})`;
    }, getReferencedToken(selected.style.gap));
    return;
  }

  if (kind === 'content-group') {
    addTokenChoices('内边距', [['无', '--space-1'], ...spaceTokens.slice(1)], (token) => {
      selected.style.padding = `var(${token})`;
    }, getReferencedToken(selected.style.padding));
    addSelect('文本对齐', [['左对齐', 'left'], ['居中', 'center'], ['右对齐', 'right']], (value) => {
      selected.style.textAlign = value;
    });
    return;
  }

  if (kind === 'steps-component') {
    const componentId = selected.dataset.componentId || 'processSteps';
    selected.classList.remove('is-rail');
    if (componentState[componentId]?.variant === 'rail') updateComponentConfig(componentId, 'variant', 'steps');
    addLinearCountControl(selected, componentId);
    addInfo('步骤之间用分隔线，不再加顶部装饰线。');
    return;
  }

  if (['list-component', 'table-component'].includes(kind)) {
    if (kind === 'table-component') {
      const componentId = selected.dataset.componentId || 'dataTable';
      if (componentState[componentId]?.variant === 'matrix') {
        updateComponentConfig(componentId, 'variant', 'plain');
        renderDataTable(selected, componentState[componentId]);
      }
      addRange('比较列数', 2, 4, 1, Number(componentState[componentId]?.columns || 3), (value) => {
        updateComponentConfig(componentId, 'columns', value);
        renderDataTable(selected, componentState[componentId]);
      }, '');
    } else {
      addLinearCountControl(selected, selected.dataset.componentId || 'labeledList');
    }
    addInfo('List / Table 不再加顶部装饰线。分区里默认拉满宽度、高度 fill，条目在各自格子里垂直居中。超出一屏时在分区内上下滚动。');
    return;
  }

  if (kind === 'bar-compare-component') {
    const componentId = selected.dataset.componentId || 'barCompare';
    addSelect('比较方向', [['横向条', 'horizontal'], ['纵向条', 'vertical']], (value) => {
      selected.classList.toggle('is-vertical', value === 'vertical');
      updateComponentConfig(componentId, 'orientation', value);
      syncBarCompareOrientation(selected, value);
    }, componentState[componentId]?.orientation || (selected.classList.contains('is-vertical') ? 'vertical' : 'horizontal'));
    if (selected.closest('[data-media-page="split"]')) {
      addInfo('左右分区里 Bar Compare 默认横向条，可再改成纵向。');
    }
    addLinearCountControl(selected, componentId);
    return;
  }

  if (kind === 'bar-fill') {
    const vertical = selected.closest('.bar-compare')?.classList.contains('is-vertical');
    const current = Math.round(parseFloat(selected.style.width) || parseFloat(selected.style.getPropertyValue('--bar-size')) || 50);
    addRange('填充比例', 5, 100, 1, current, (value) => {
      if (vertical) {
        selected.style.width = '';
        selected.style.setProperty('--bar-size', `${value}%`);
      } else {
        selected.style.removeProperty('--bar-size');
        selected.style.width = `${value}%`;
      }
    }, '%');
    addSelect('条形语义色', [['强调色', 'accent'], ['成功', 'success'], ['警告', 'warning'], ['风险', 'danger']], (value) => {
      selected.removeAttribute('data-tone');
      if (value !== 'accent') selected.dataset.tone = value;
    }, selected.dataset.tone || 'accent');
    return;
  }

  if (['list-row', 'step-row', 'table-row'].includes(kind)) {
    addTokenChoices('行内边距', spaceTokens, (token) => {
      selected.style.paddingTop = `var(${token})`;
      selected.style.paddingBottom = `var(${token})`;
    }, getReferencedToken(selected.style.paddingTop));
    if (kind !== 'table-row') {
      addRange('左列宽度', 40, 220, 5, getGridFirstColumn(selected) || 100, (value) => {
        selected.style.gridTemplateColumns = `${value}px 1fr`;
      });
    }
    return;
  }

  if (kind === 'media-component') {
    const componentId = ensureComponentId(selected, selected.dataset.pageParent || 'mediaCard');
    addSelect('图文结构', [
      ['上图下文', 'stack'],
      ['左图右文', 'split'],
      ['左文右图', 'split-reverse'],
      ['文字叠图', 'overlay']
    ], (value) => {
      applyMediaLayout(selected, value);
      updateComponentConfig(componentId, 'mediaLayout', value);
      updateComponentConfig(componentId, 'imagePosition', value === 'split' ? 'left' : (value === 'split-reverse' ? 'right' : (value === 'overlay' ? 'overlay' : 'top')));
    }, mediaLayoutOf(selected));
    addRatioControl(selected);
    addFitControl(selected);
    addInfo('Media Card 只放 1 张。文字叠图会加遮罩，避免字看不清。');
    addTokenChoices('圆角', radiusTokens, (token) => {
      selected.style.borderRadius = `var(${token})`;
    }, getReferencedToken(selected.style.borderRadius));
    addSelect('图片样式', [['抽象占位', 'abstract'], ['文档', 'document'], ['照片色块', 'photo'], ['纯色', 'plain']], (value) => {
      selected.dataset.imageStyle = value;
      updateComponentConfig(componentId, 'imageStyle', value);
    }, componentState[componentId]?.imageStyle || 'abstract');
    return;
  }

  if (kind === 'evidence-component' || kind === 'media-switch-component') {
    const row = selected.classList.contains('evidence-gallery')
      ? selected
      : selected.closest('.evidence-gallery');
    const component = row || selected;
    const componentId = ensureComponentId(component, component.dataset.pageParent || 'evidence');
    const state = componentState[componentId] || {};
    const evidenceKind = inferEvidenceKind(component);
    addSelect('种类', EVIDENCE_KINDS, (value) => {
      const next = applyEvidenceKind(component, value);
      if (next && next !== component) {
        openInspector(next);
        return;
      }
      renderControls();
    }, evidenceKind);
    const itemHost = row || (component.classList.contains('evidence-gallery') ? component : null);
    if (evidenceKind === 'strip') {
      if (itemHost) {
        setGridItemCount(itemHost, 1);
        applyEvidenceRow(itemHost);
      }
      addInfo('条带只放 1 张。高度铺满，按比例变宽，超出在图窗内横滑。');
    } else if (inColumnSplit(component)) {
      if (itemHost) {
        setGridItemCount(itemHost, 1);
        applyEvidenceRow(itemHost);
      }
      addInfo('左右分区里 Evidence 只放 1 张。');
    } else if (itemHost) {
      const itemCount = currentItemCount(itemHost, componentId);
      addRange('排列数量', 1, Math.max(8, gridChildren(itemHost).length), 1, itemCount, (value) => {
        setGridItemCount(itemHost, value);
        applyEvidenceRow(itemHost);
        bindMediaSwitches(itemHost);
      }, '');
    } else if (component.classList.contains('media-switch') && component.dataset.componentId !== 'mediaSwitch') {
      addRange('排列数量', 1, 8, 1, 1, (value) => {
        const wrap = createEvidenceGalleryShell(component);
        component.replaceWith(wrap);
        component.removeAttribute('data-component-root');
        wrap.appendChild(component);
        afterPageClone(wrap);
        setGridItemCount(wrap, value);
        applyEvidenceRow(wrap);
        bindMediaSwitches(wrap);
        openInspector(wrap);
      }, '');
    }
    if (evidenceKind === 'switch') {
      const switchNode = selected.closest('.media-switch') || component.querySelector('.media-switch') || component;
      const thumbsRoot = switchNode.querySelector('.media-switch__thumbs');
      if (thumbsRoot) {
        const thumbs = gridChildren(thumbsRoot);
        addRange('缩略图数量', 1, Math.max(8, thumbs.length), 1, currentItemCount(thumbsRoot) || thumbs.length, (value) => {
          const roots = itemHost
            ? [...itemHost.querySelectorAll('.media-switch__thumbs')]
            : [thumbsRoot];
          roots.forEach((root) => setGridItemCount(root, value));
        }, '');
      }
      addRatioControl(switchNode);
      addFitControl(switchNode);
      addHoverControl(switchNode);
      addInfo('Media Switch 只保留封面展开。窗口按比例定宽，默认 Fit 不裁切。缩略图数量单独设。');
    } else {
      addHoverControl(selected.closest('.evidence-figure'));
      const currentKind = component.getAttribute('data-image-kind') || state.imageKind || 'photo';
      if (currentKind === 'strip') {
        addInfo('条带只放 1 张。高度铺满，按图宽横滑，不再限制最大宽高。');
      } else if (currentKind === 'shot' || currentKind === 'long') {
        addFitControl(component);
        addInfo('截图锁定 0.46:1。默认 Fit 完整露出，可选 Fill 铺满。');
      } else {
        addRatioControl(component);
        addFitControl(component);
        addInfo('图片窗口按所选比例定宽。默认 Fit 不裁切，Fill 会铺满裁切。');
      }
    }
    if (!component.closest('[data-media-page] [data-slot="media"]')) {
      addSelect('图注', [['显示', 'on'], ['隐藏', 'off']], (value) => {
        const host = itemHost || component;
        host.setAttribute('data-caption', value);
        host.querySelectorAll('.evidence-figure').forEach((figure) => figure.setAttribute('data-caption', value));
        if (host.classList.contains('evidence-figure')) host.setAttribute('data-caption', value);
        requestAnimationFrame(() => {
          if (host.classList.contains('evidence-gallery')) layoutEvidenceGallery(host);
          else layoutEvidenceStandalone(host);
        });
      }, (itemHost || component).getAttribute('data-caption') === 'off' ? 'off' : 'on');
    }
    addSelect('图片样式', [['文档网格', 'document'], ['照片色块', 'photo'], ['纯色', 'plain']], (value) => {
      component.dataset.imageStyle = value;
      updateComponentConfig(componentId, 'imageStyle', value);
    }, state.imageStyle || 'document');
    addTokenChoices('网格间距', spaceTokens, (token) => component.style.setProperty('--card-gap', `var(${token})`), getReferencedToken(component.style.getPropertyValue('--card-gap')));
    return;
  }

  if (kind === 'image-child') {
    addHoverControl(selected.closest('.evidence-figure, .media-switch'));
    addInfo('图片窗口由父组件控制。Evidence 只排一排，高度铺满，宽度按种类比例，超出横滑。Hover 展开按每张图开关。同一窗口多图用 Media Switch。');
    return;
  }

  if (kind === 'navigation-component') {
    addSelect('位置', [['顶部', 'top'], ['侧边', 'side']], (value) => {
      selected.classList.toggle('is-side', value === 'side');
      updateComponentConfig('navigation', 'position', value);
    }, componentState.navigation?.position || 'top');
    addSelect('导航样式', [['下划线', 'underline'], ['分段', 'segmented'], ['紧凑', 'compact'], ['轨道', 'rail']], (value) => {
      selected.classList.remove('nav-underline', 'nav-segmented', 'nav-compact', 'nav-rail');
      selected.classList.add(`nav-${value}`);
      updateComponentConfig('navigation', 'variant', value);
    }, componentState.navigation?.variant || 'underline');
    addSelect('吸附', [['开启', 'true'], ['关闭', 'false']], (value) => {
      selected.classList.toggle('is-sticky', value === 'true');
      updateComponentConfig('navigation', 'sticky', value === 'true');
    }, String(componentState.navigation?.sticky ?? true));
    addSelect('折叠', [['展开', 'false'], ['仅当前项', 'true']], (value) => {
      selected.classList.toggle('is-collapsed', value === 'true');
      updateComponentConfig('navigation', 'collapsed', value === 'true');
    }, String(componentState.navigation?.collapsed || false));
    addTokenChoices('项目间距', spaceTokens, (token) => selected.style.gap = `var(${token})`, getReferencedToken(selected.style.gap));
    return;
  }

  if (kind === 'button-atom') {
    const variant = selected.classList.contains('inverse')
      ? 'inverse'
      : selected.classList.contains('primary')
        ? 'primary'
        : selected.classList.contains('subtle')
          ? 'subtle'
          : 'default';
    addSelect('样式', [['主要', 'primary'], ['次要', 'default'], ['弱化', 'subtle'], ['反色', 'inverse']], (value) => {
      selected.classList.remove('primary', 'subtle', 'inverse');
      if (value !== 'default') selected.classList.add(value);
    }, variant);
    addRange('高度', 32, 64, 2, Math.round(selected.getBoundingClientRect().height), (value) => {
      selected.style.minHeight = `${value}px`;
    });
    addTokenChoices('圆角', radiusTokens, (token) => {
      selected.style.borderRadius = `var(${token})`;
    }, getReferencedToken(selected.style.borderRadius) || '--radius-pill');
    addInfo('Hover 是原子行为：上移 1px 并加阴影。深色封面上的 CTA 用反色。');
    return;
  }

  if (kind === 'link-atom') {
    addTokenChoices('链接颜色', colorTokens, (token) => {
      selected.style.color = `var(${token})`;
    }, getReferencedToken(selected.style.color) || '--link');
    addTokenChoices('悬停颜色', colorTokens, (token) => {
      selected.style.setProperty('--link-hover', `var(${token})`);
    }, getReferencedToken(selected.style.getPropertyValue('--link-hover')) || '--link-hover');
    addTokenChoices('下划线偏移', spaceTokens.slice(0, 3), (token) => {
      selected.style.textUnderlineOffset = `var(${token})`;
    }, getReferencedToken(selected.style.textUnderlineOffset) || '--space-1');
    return;
  }

  if (kind === 'badge-atom') {
    addTokenChoices('字号角色', typeTokens.slice(4), (token) => {
      selected.style.fontSize = `var(${token})`;
    }, getReferencedToken(selected.style.fontSize));
    addSelect('语义状态', [['成功', 'success'], ['警告', 'warning'], ['风险', 'danger']], (value) => {
      selected.classList.remove('success', 'warning', 'danger');
      selected.classList.add(value);
    }, ['success', 'warning', 'danger'].find((value) => selected.classList.contains(value)) || 'success');
    addTokenChoices('圆角', radiusTokens, (token) => {
      selected.style.borderRadius = `var(${token})`;
    }, getReferencedToken(selected.style.borderRadius) || '--radius-pill');
    return;
  }

  if (kind === 'divider-atom') {
    addRange('粗细', 1, 6, 1, getBorderTopWidth(selected) || 1, (value) => {
      selected.style.borderTopWidth = `${value}px`;
    });
    addTokenChoices('颜色', colorTokens.slice(0, 4), (token) => {
      selected.style.borderTopColor = `var(${token})`;
    }, getReferencedToken(selected.style.borderTopColor));
    return;
  }

  if (['report-cover', 'chapter-cover', 'report-notes'].includes(kind)) {
    addInfo('壳只定整份文档角色。封面、章节封面、口径说明走已有 markup，不要再包一层预览框。');
    return;
  }

  if (kind === 'page-regions') {
    if (selected.dataset.mediaPage) {
      addSelect('配图方向', [['左右', 'split'], ['上下', 'stack']], (value) => {
        applyMediaPageMode(selected, value);
        renderControls();
      }, selected.dataset.mediaPage);
      addInfo('左边或上边固定是纯图，不显示图注。另一边是定宽或定高的内容区，可换成允许的父组件。');
      return;
    }
    addSelect('分区数', [['1 区', '1']], (value) => {
      selected.dataset.regions = value;
      syncRegionTracks(selected);
      renderControls();
    }, selected.dataset.regions || '1');
    addInfo('1 分区整屏居中。配图页用「配图 · 左右 / 上下」。');
    return;
  }

  if (kind === 'page-region') {
    const regions = selected.closest('.page-regions');
    if (regions?.dataset.mediaPage) {
      addInfo(selected.dataset.slot === 'media'
        ? '配图区不是 Evidence，只放纯图，不显示图注。'
        : (regions.dataset.mediaPage === 'split'
          ? '右侧定宽。可换成 List / Steps / Band / Bar Compare。不得用 Table。Band 最多 6 张且贴边，Bar 默认横向条，其余留间距后铺满。'
          : '底部定高、只排 1 行。可换成 Callout / Card Grid 强调色 / Card Grid / Stat Grid。Grid 留间隔后铺满内容区。'));
      return;
    }
    addInfo('1 分区固定为 fill 并居中。');
    return;
  }

  if (kind === 'media-copy-component') {
    addInfo('配图页的默认文案。可在内容区换成其他父组件。');
    return;
  }

  addInfo('该元素继承父组件布局。请选择它的父级或内部文字以继续调整。');
}

function balancedColumns(count, maxCols = 4) {
  const n = Math.max(1, Number(count) || 1);
  if (n === 5) return 5;
  const limit = Math.min(maxCols, n);
  let best = 1;
  let bestScore = Infinity;
  for (let cols = 1; cols <= limit; cols += 1) {
    if (n % cols !== 0) continue;
    const rows = n / cols;
    const score = Math.abs(rows - cols) * 10 - cols;
    if (score < bestScore) {
      bestScore = score;
      best = cols;
    }
  }
  return best;
}

const HORIZONTAL_VISIBLE = 5.5;

function peekSlideColumns(columns) {
  const raw = Number(columns);
  if (Number.isFinite(raw) && raw > 0 && raw % 1 === 0.5) return raw;
  const full = Number.isFinite(raw) && raw >= 2 ? raw : 5;
  return full + 0.5;
}

function evenColumnOptions(count, maxCols = 4) {
  const n = Math.max(1, Number(count) || 1);
  const limit = n === 5 ? 5 : maxCols;
  const options = [];
  for (let cols = 1; cols <= Math.min(limit, n); cols += 1) {
    if (n % cols === 0) options.push([`${cols} × ${n / cols}`, String(cols)]);
  }
  if (needsHorizontalRow(n)) {
    options.push(['5 列半横滑', String(HORIZONTAL_VISIBLE)]);
    for (let cols = 2; cols <= Math.min(maxCols, n); cols += 1) {
      options.push([`${cols} 列横滑`, String(cols)]);
    }
  }
  return options.length ? options : [['1 × 1', '1']];
}

function needsHorizontalRow(itemCount) {
  const n = Math.max(1, Number(itemCount) || 1);
  return n === 7 || n >= 9;
}

function gridChildren(component) {
  return [...component.children].filter((item) => !item.classList.contains('scroll-controls'));
}

function currentItemCount(component, componentId) {
  const marked = Number(component.dataset.itemCount);
  if (marked) return marked;
  if (componentId && componentState[componentId]?.itemCount) return Number(componentState[componentId].itemCount);
  return gridChildren(component).filter((item) => !item.classList.contains('is-component-item-hidden')).length || gridChildren(component).length || 1;
}

function ensureComponentId(component, fallback) {
  if (!component.dataset.componentId) {
    component.dataset.componentId = `${fallback || 'comp'}-${Math.random().toString(36).slice(2, 7)}`;
  }
  componentState[component.dataset.componentId] ||= {};
  return component.dataset.componentId;
}

function mediaLayoutOf(card) {
  if (card?.dataset.mediaLayout) return card.dataset.mediaLayout;
  if (card?.classList.contains('is-split')) return 'split';
  return 'stack';
}

function applyMediaLayout(card, layout) {
  if (!card) return;
  const next = ['stack', 'split', 'split-reverse', 'overlay'].includes(layout) ? layout : 'stack';
  card.dataset.mediaLayout = next;
  card.classList.toggle('is-split', next === 'split' || next === 'split-reverse');
  card.style.removeProperty('display');
  card.style.removeProperty('grid-template-columns');
  card.style.removeProperty('direction');
}

function inColumnSplit(node) {
  const regions = node?.closest?.('.page-regions');
  const region = node?.closest?.('.page-region');
  if (!regions || !region) return false;
  if (region.dataset.span === 'foot') return false;
  if (regions.dataset.regions === '3') return true;
  return regions.dataset.regions === '2' && (regions.dataset.split || 'columns') === 'columns';
}

function enforceSplitLayoutRules(scope = document) {
  const list = [];
  if (scope.matches?.('.page-regions')) list.push(scope);
  if (scope.querySelectorAll) list.push(...scope.querySelectorAll('.page-regions'));
  list.forEach((regions) => {
    regions.querySelectorAll(':scope > .page-region').forEach((region) => {
      if (!inColumnSplit(region)) return;
      region.querySelectorAll('.evidence-gallery').forEach((grid) => {
        setGridItemCount(grid, 1);
        applyEvidenceRow(grid);
      });
      region.querySelectorAll('.card-grid:has(> .media-card)').forEach((grid) => {
        const card = grid.querySelector(':scope > .media-card');
        if (card) grid.replaceWith(card);
      });
    });
  });
}

function isEvidenceRow(component) {
  return Boolean(component?.classList.contains('evidence-gallery'));
}

const evidenceLayoutObservers = new WeakMap();

function parseEvidenceRatio(node) {
  if (!node) return { w: 3, h: 4 };
  if (node.getAttribute('data-image-kind') === 'shot' || node.querySelector('[data-image-kind="shot"]')) {
    return { w: 0.46, h: 1 };
  }
  const isCover = node.classList.contains('media-switch')
    || node.classList.contains('is-cover')
    || Boolean(node.querySelector?.(':scope > .media-switch.is-cover, :scope > .media-switch'));
  if (isCover && !node.getAttribute('data-image-ratio') && !node.querySelector('[data-image-ratio]')) {
    return { w: 9, h: 16 };
  }
  const raw = node.getAttribute('data-image-ratio')
    || node.querySelector('[data-image-ratio]')?.getAttribute('data-image-ratio')
    || getComputedStyle(node).getPropertyValue('--image-ratio')
    || '3 / 4';
  const parts = String(raw).split(/[:/]/).map((part) => parseFloat(part.trim()));
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return { w: parts[0], h: parts[1] };
  return { w: 3, h: 4 };
}

function evidenceGapPx(node) {
  const styles = getComputedStyle(node || document.documentElement);
  return parseFloat(styles.getPropertyValue('--space-4'))
    || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-4'))
    || 16;
}

function evidenceInnerBox(node) {
  if (!node) return { w: 0, h: 0 };
  const styles = getComputedStyle(node);
  const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
  const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  return {
    w: Math.max(0, (node.clientWidth || 0) - padX),
    h: Math.max(0, (node.clientHeight || 0) - padY),
  };
}

function syncEvidenceScrollFade(gallery) {
  if (!gallery) return;
  const max = gallery.scrollWidth - gallery.clientWidth;
  gallery.classList.toggle('is-scroll-end', max <= 1 || gallery.scrollLeft >= max - 1);
}

function evidenceCaptionPx(node, items) {
  if (node?.closest?.('[data-media-page] [data-slot="media"]') || node?.closest?.('[data-media-page]')) return 0;
  if (node?.getAttribute('data-caption') === 'off' || node?.closest?.('[data-caption="off"]')) return 0;
  const hasCaption = (items || [node]).some((item) => item?.querySelector?.('figcaption') && item.getAttribute('data-caption') !== 'off');
  if (!hasCaption) return 0;
  const raw = getComputedStyle(node).getPropertyValue('--evidence-caption-height').trim();
  if (raw.endsWith('rem')) {
    return parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  const value = parseFloat(raw);
  if (Number.isFinite(value)) return value;
  return items?.[0]?.querySelector('figcaption')?.offsetHeight || 0;
}

function evidenceItems(gallery) {
  return [...gallery.children].filter((item) => (
    item.matches('.evidence-figure, .media-switch, .media-card')
    && !item.classList.contains('is-component-item-hidden')
    && !item.classList.contains('scroll-controls')
  ));
}

function layoutEvidenceStandalone(node) {
  if (!node || node.getAttribute('data-image-kind') === 'strip' || node.closest('.evidence-gallery')) return;
  if (node.closest('[data-slot="media"]')) {
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
    const boxH = region.clientHeight || node.clientHeight || 0;
    const boxW = region.clientWidth || 0;
    if (boxH >= 8) {
      const itemW = Math.min(boxW || boxH, boxH * (ratio.w / ratio.h));
      node.style.setProperty('--evidence-item-width', `${itemW}px`);
      node.style.width = `${itemW}px`;
      node.style.height = '100%';
      return;
    }
  }
  node.style.removeProperty('width');
  node.style.removeProperty('height');
  node.style.removeProperty('--evidence-item-width');
}

function layoutEvidenceGallery(gallery) {
  if (!gallery || !gallery.classList.contains('evidence-gallery')) return;
  if (gallery.closest('[data-slot="media"]')) {
    gallery.style.removeProperty('--evidence-item-width');
    gallery.dataset.evidenceLayout = 'center';
    return;
  }
  if (gallery.getAttribute('data-image-kind') === 'strip') {
    gallery.dataset.evidenceLayout = 'strip';
    gallery.style.removeProperty('--evidence-item-width');
    gallery.classList.remove('is-scrollable');
    return;
  }
  const items = evidenceItems(gallery);
  if (!items.length) return;
  const box = evidenceInnerBox(gallery);
  const galleryH = box.h || evidenceInnerBox(gallery.parentElement).h;
  const galleryW = box.w || evidenceInnerBox(gallery.parentElement).w;
  if (galleryH < 8 || galleryW < 8) return;
  const ratio = parseEvidenceRatio(gallery);
  gallery.style.setProperty('--image-ratio', `${ratio.w} / ${ratio.h}`);
  const ratioW = Math.max(1, galleryH - evidenceCaptionPx(gallery, items)) * (ratio.w / ratio.h);
  const gap = evidenceGapPx(gallery);
  const nFull = Math.max(1, Math.floor((galleryW + gap) / (ratioW + gap)));
  const count = items.length;
  let layout = 'center';
  if (count === 1) {
    layout = 'center';
  } else if (count <= nFull) {
    layout = 'even';
  } else {
    layout = 'scroll';
  }
  gallery.dataset.evidenceLayout = layout;
  gallery.style.setProperty('--evidence-item-width', `${ratioW}px`);
  gallery.classList.toggle('is-scrollable', layout === 'scroll');
  if (layout !== 'scroll') gallery.classList.remove('is-scroll-end');
  else syncEvidenceScrollFade(gallery);
}

function layoutEvidenceNode(node) {
  if (!node) return;
  if (node.classList.contains('evidence-gallery')) layoutEvidenceGallery(node);
  else layoutEvidenceStandalone(node);
}

function observeEvidenceLayout(node) {
  if (!node || evidenceLayoutObservers.has(node)) {
    layoutEvidenceNode(node);
    return;
  }
  const observer = new ResizeObserver(() => layoutEvidenceNode(node));
  observer.observe(node);
  if (node.parentElement) observer.observe(node.parentElement);
  evidenceLayoutObservers.set(node, observer);
  layoutEvidenceNode(node);
}

function applyEvidenceRow(component) {
  if (!component) return component;
  if (component.classList.contains('image-grid')) component.classList.add('evidence-gallery');
  component.classList.remove('is-horizontal');
  component.style.removeProperty('display');
  component.style.removeProperty('grid-template-columns');
  component.dataset.itemCount = String(currentItemCount(component));
  requestAnimationFrame(() => observeEvidenceLayout(component));
  return component;
}

function addHoverControl(figure) {
  if (!figure?.classList.contains('evidence-figure') && !figure?.classList.contains('media-switch')) return;
  const current = figure.getAttribute('data-hover') === 'off'
    ? 'off'
    : (figure.getAttribute('data-hover') === 'on' || figure.classList.contains('is-cover') ? 'on' : 'off');
  if (figure.classList.contains('media-switch')) figure.classList.add('is-cover');
  addSelect('Hover 展开', [['关闭', 'off'], ['开启', 'on']], (value) => {
    figure.setAttribute('data-hover', value);
    if (figure.classList.contains('media-switch') || value === 'on') figure.classList.add('is-cover');
  }, current);
}

function applyHorizontalTrack(component, columns) {
  const cols = peekSlideColumns(columns);
  component.style.setProperty('--component-columns', cols);
  component.style.setProperty('--slide-cols', String(cols));
  component.dataset.slideColumns = String(cols);
  component.style.removeProperty('display');
  component.style.removeProperty('grid-template-columns');
  return cols;
}

function setGridColumns(component, columns) {
  const cols = Math.max(1, Number(columns) || 1);
  if (isEvidenceRow(component)) {
    applyEvidenceRow(component);
    const componentId = component.dataset.componentId;
    if (componentId) updateComponentConfig(componentId, 'columns', cols);
    return cols;
  }
  if (component.classList.contains('is-horizontal')) {
    const slideCols = applyHorizontalTrack(component, cols);
    const componentId = component.dataset.componentId;
    if (componentId) updateComponentConfig(componentId, 'columns', slideCols);
    return slideCols;
  }
  component.style.setProperty('--component-columns', cols);
  component.style.removeProperty('--slide-cols');
  if (component.classList.contains('card-grid') || component.classList.contains('image-grid') || component.classList.contains('highlight-band')) {
    component.style.display = 'grid';
    component.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }
  const componentId = component.dataset.componentId;
  if (componentId) updateComponentConfig(componentId, 'columns', cols);
  return cols;
}

function setGridItemCount(component, count) {
  const splitBand = component.classList.contains('is-highlight') && component.closest('[data-media-page="split"]');
  const cap = splitBand ? 6 : (isEvidenceRow(component) || component.classList.contains('media-switch__thumbs') ? 8 : 12);
  const target = (isEvidenceRow(component) && (inColumnSplit(component) || inferEvidenceKind(component) === 'strip'))
    ? 1
    : Math.min(cap, Math.max(1, Number(count) || 1));
  const items = gridChildren(component);
  const template = items[0];
  while (gridChildren(component).length < target && template) {
    const clone = template.cloneNode(true);
    clone.classList.remove('is-component-item-hidden', 'is-active', 'is-open');
    clone.querySelectorAll('[data-history-id]').forEach((node) => delete node.dataset.historyId);
    delete clone.dataset.switchReady;
    clone.querySelectorAll('[data-switch-ready]').forEach((node) => delete node.dataset.switchReady);
    if (component.classList.contains('media-switch__thumbs')) {
      const index = gridChildren(component).length + 1;
      const label = String(index).padStart(2, '0');
      if (!clone.querySelector('img')) clone.textContent = label;
      clone.setAttribute('data-alt', clone.getAttribute('data-alt') || `PHOTO ${label}`);
    }
    component.appendChild(clone);
    bindMediaSwitches(clone);
  }
  syncComponentItems(component, target);
  const componentId = component.dataset.componentId;
  if (componentId) updateComponentConfig(componentId, 'itemCount', target);
  return target;
}

function applyBalancedColumns(component, itemCount) {
  if (isEvidenceRow(component)) {
    applyEvidenceRow(component);
    return currentItemCount(component);
  }
  const n = Math.max(1, Number(itemCount) || 1);
  if (n === 5) {
    component.classList.remove('is-horizontal');
    setGridColumns(component, 5);
    component.dataset.itemCount = '5';
    const fiveId = component.dataset.componentId;
    if (fiveId) {
      updateComponentConfig(fiveId, 'mode', 'grid');
      updateComponentConfig(fiveId, 'columns', 5);
    }
    setHorizontalEligibility(component, fiveId, 5);
    toggleHorizontalControls(component, false);
    return 5;
  }
  if (needsHorizontalRow(n)) {
    const visible = HORIZONTAL_VISIBLE;
    component.classList.add('is-horizontal');
    setGridColumns(component, visible);
    component.dataset.itemCount = String(n);
    const componentId = component.dataset.componentId;
    if (componentId) {
      updateComponentConfig(componentId, 'mode', 'horizontal');
      updateComponentConfig(componentId, 'columns', visible);
    }
    setHorizontalEligibility(component, componentId, visible);
    toggleHorizontalControls(component, true);
    return visible;
  }
  const cols = balancedColumns(n);
  component.classList.remove('is-horizontal');
  setGridColumns(component, cols);
  component.dataset.itemCount = String(n);
  const componentId = component.dataset.componentId;
  if (componentId && componentState[componentId]?.mode === 'horizontal') {
    updateComponentConfig(componentId, 'mode', 'grid');
  }
  setHorizontalEligibility(component, component.dataset.componentId, cols);
  return cols;
}

function ensureEvenGrid(component, itemCount) {
  const n = Math.max(1, Number(itemCount) || 1);
  component.dataset.itemCount = String(n);
  if (isEvidenceRow(component)) {
    applyEvidenceRow(component);
    return n;
  }
  if (n === 5 || needsHorizontalRow(n)) {
    return applyBalancedColumns(component, n);
  }
  if (component.classList.contains('is-horizontal')) {
    return getNumber(component.style.getPropertyValue('--component-columns')) || n;
  }
  const current = getNumber(component.style.getPropertyValue('--component-columns'))
    || componentState[component.dataset.componentId]?.columns
    || 3;
  if (n % current === 0) return current;
  return applyBalancedColumns(component, n);
}

function inferEvidenceKind(component) {
  if (component.classList.contains('media-switch') || component.querySelector(':scope > .media-switch')) return 'switch';
  const kind = component.getAttribute('data-image-kind') || component.querySelector('[data-image-kind]')?.getAttribute('data-image-kind') || 'photo';
  if (kind === 'shot' || kind === 'strip') return kind;
  return 'photo';
}

function createEvidenceGalleryShell(from) {
  const wrap = document.createElement('div');
  wrap.className = 'image-grid evidence-gallery';
  wrap.setAttribute('data-editable', '');
  wrap.dataset.kind = 'evidence-component';
  wrap.dataset.nodeLabel = from?.dataset.nodeLabel || '证据图片组';
  wrap.setAttribute('data-component-root', '');
  wrap.dataset.pageParent = 'evidence';
  if (from?.dataset.componentId) wrap.dataset.componentId = from.dataset.componentId;
  else ensureComponentId(wrap, 'evidence');
  return wrap;
}

function applyEvidenceKind(component, kind) {
  if (kind === 'natural') kind = 'photo';
  const sourceId = {
    photo: 'evidenceGallery',
    shot: 'evidenceShot',
    strip: 'evidenceStrip',
    switch: 'mediaSwitch'
  }[kind] || 'evidenceGallery';
  const already = inferEvidenceKind(component);
  if (already === kind && (
    (kind === 'switch' && (component.classList.contains('media-switch') || component.querySelector(':scope > .media-switch')))
    || (kind !== 'switch' && component.classList.contains('evidence-gallery'))
  )) {
    if (kind !== 'switch') {
      const imageKind = kind === 'photo' ? 'photo' : kind;
      const ratio = kind === 'shot' ? '0.46:1' : kind === 'strip' ? '' : (component.getAttribute('data-image-ratio') || '3:4');
      applyImageWindow(component, { kind: imageKind, fit: component.getAttribute('data-image-fit') || 'fit', ratio });
    }
    applyEvidenceRow(component.classList.contains('evidence-gallery') ? component : component.closest('.evidence-gallery'));
    return component;
  }
  if (kind === 'switch') {
    const card = makePageClone('mediaSwitch');
    if (!card) return component;
    const wrap = createEvidenceGalleryShell(component);
    card.removeAttribute('data-component-root');
    delete card.dataset.componentId;
    card.dataset.kind = 'media-switch-component';
    card.classList.add('is-cover');
    if (!card.getAttribute('data-hover')) card.setAttribute('data-hover', 'on');
    wrap.appendChild(card);
    component.replaceWith(wrap);
    return afterPageClone(wrap);
  }
  const next = makePageClone(sourceId);
  if (!next) return component;
  next.dataset.pageParent = 'evidence';
  component.replaceWith(next);
  const ready = afterPageClone(next);
  const imageKind = kind === 'photo' ? 'photo' : kind;
  const ratio = kind === 'shot' ? '0.46:1' : kind === 'strip' ? '' : '3:4';
  applyImageWindow(ready, { kind: imageKind, fit: 'fit', ratio });
  applyEvidenceRow(ready);
  if (kind === 'strip') setGridItemCount(ready, 1);
  return ready;
}

function formatStatValues(scope = document) {
  const nodes = [];
  if (scope.matches?.('.stat-value')) nodes.push(scope);
  if (scope.querySelectorAll) nodes.push(...scope.querySelectorAll('.stat-value'));
  nodes.forEach((node) => {
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
}

function formatCalloutText(scope = document) {
  const nodes = [];
  if (scope.matches?.('.callout p, .callout strong')) nodes.push(scope);
  if (scope.querySelectorAll) nodes.push(...scope.querySelectorAll('.callout p, .callout strong'));
  nodes.forEach((node) => {
    const text = node.textContent.replace(/\s*\n\s*/g, '').trim();
    if (!text) return;
    node.textContent = text.replace(/([。．.;；])\s*/g, '$1\n').replace(/\n+$/, '');
  });
}

function inferPageParent(node) {
  if (!node) return '';
  if (node.dataset.pageParent) return node.dataset.pageParent;
  if (node.classList.contains('media-page__copy')) return 'mediaCopy';
  if (node.classList.contains('highlight-band') || (node.classList.contains('card-grid') && node.classList.contains('is-highlight'))) return 'cardGridHighlight';
  if (node.classList.contains('callout')) return 'decisionCallout';
  if (node.classList.contains('card-grid') && node.querySelector('.stat-value')) return 'statGrid';
  if (node.classList.contains('card-grid')) return 'cardGrid';
  if (node.classList.contains('list-block')) return 'labeledList';
  if (node.classList.contains('steps')) return 'processSteps';
  if (node.classList.contains('table-wrap')) return 'dataTable';
  if (node.classList.contains('bar-compare')) return 'barCompare';
  if (node.classList.contains('media-switch') || node.classList.contains('evidence-gallery') || node.classList.contains('evidence-figure')) return 'evidence';
  return '';
}

function parentsForTarget(target) {
  const page = target.closest('[data-media-page]')?.dataset.mediaPage || '';
  const slot = target.closest('[data-slot]')?.dataset.slot || target.dataset.slot || '';
  if (page && slot === 'media') return MEDIA_SLOT_PARENTS;
  if (page === 'split' && slot === 'copy') return MEDIA_SPLIT_PARENTS;
  if (page === 'stack' && slot === 'copy') return MEDIA_STACK_PARENTS;
  return PAGE_PARENTS;
}

function addParentSwapControl(target) {
  const currentNode = target.classList.contains('page-region')
    ? target.querySelector(':scope > [data-component-root], :scope > [data-kind]')
    : target;
  const options = parentsForTarget(target);
  addSelect('替换为', options, (value) => {
    const next = target.classList.contains('page-region')
      ? replaceRegionContent(target, value)
      : replacePageParent(target, value);
    if (next) openInspector(next);
  }, inferPageParent(currentNode));
}

function createMediaCopy() {
  const wrap = document.createElement('div');
  wrap.className = 'media-page__copy';
  wrap.dataset.pageParent = 'mediaCopy';
  wrap.dataset.kind = 'media-copy-component';
  wrap.dataset.nodeLabel = '默认文案';
  wrap.setAttribute('data-editable', '');
  wrap.setAttribute('data-component-root', '');
  wrap.innerHTML = [
    '<span class="eyebrow" data-editable data-kind="text-child" data-node-label="媒体标签">EVIDENCE 01</span>',
    '<h3 data-editable data-kind="text-child" data-node-label="媒体标题">图片不是装饰，而是证据</h3>',
    '<p data-editable data-kind="text-child" data-node-label="媒体正文">说明图像展示了什么，以及它支持哪一个判断。重要信息不能只存在于图片内部。</p>',
    '<div class="media-meta" data-editable data-kind="text-child" data-node-label="图片来源">来源：示例资料 · 2026</div>'
  ].join('');
  return wrap;
}

function makePageClone(sourceId) {
  if (sourceId === 'cardGridHighlight') {
    const clone = makePageClone('cardGrid');
    if (!clone) return null;
    clone.classList.add('is-highlight');
    clone.dataset.pageParent = 'cardGridHighlight';
    clone.dataset.componentId = `page-cardGridHighlight-${Math.random().toString(36).slice(2, 7)}`;
    return clone;
  }
  if (sourceId === 'mediaCopy') {
    const source = document.querySelector('#pages [data-page-parent="mediaCopy"]');
    const clone = source ? source.cloneNode(true) : createMediaCopy();
    clone.dataset.pageParent = 'mediaCopy';
    clone.dataset.componentId = `page-mediaCopy-${Math.random().toString(36).slice(2, 7)}`;
    clone.querySelectorAll('[data-history-id]').forEach((node) => delete node.dataset.historyId);
    delete clone.dataset.historyId;
    return clone;
  }
  const sourceKey = sourceId === 'evidence' ? 'evidenceGallery' : sourceId;
  const source = document.querySelector(`#components [data-component-id="${sourceKey}"]`);
  if (!source) return null;
  const clone = source.cloneNode(true);
  clone.dataset.pageParent = sourceId;
  clone.dataset.componentId = `page-${sourceId}-${Math.random().toString(36).slice(2, 7)}`;
  clone.querySelectorAll('[data-component-id]').forEach((node) => {
    if (node !== clone) delete node.dataset.componentId;
  });
  clone.querySelectorAll('[data-history-id]').forEach((node) => delete node.dataset.historyId);
  delete clone.dataset.historyId;
  delete clone.dataset.switchReady;
  if (sourceId === 'evidence') {
    clone.querySelectorAll('.evidence-window').forEach((windowNode) => {
      if (/^SHOT\b/i.test((windowNode.textContent || '').trim())) windowNode.textContent = '';
    });
  }
  return clone;
}

function afterPageClone(clone) {
  if (!clone) return clone;
  [clone, ...clone.querySelectorAll('[data-editable]')].forEach((element, index) => {
    element.dataset.historyId = `page-${Date.now()}-${index}`;
  });
  clone.tabIndex = 0;
  initialComponents.set(clone, {
    html: clone.innerHTML,
    style: clone.getAttribute('style')
  });
  const sourceConfig = activeTheme.components[
    clone.classList.contains('media-switch') ? 'mediaSwitch'
    : clone.dataset.pageParent === 'evidence' ? 'evidenceGallery'
    : clone.dataset.pageParent
  ] || {};
  componentState[clone.dataset.componentId] = DS.clone(sourceConfig);
  applyComponentConfig(clone.dataset.componentId, componentState[clone.dataset.componentId]);
  if (clone.matches('.evidence-gallery')) {
    applyEvidenceRow(clone);
  } else if (clone.matches('.card-grid, .image-grid, .highlight-band')) {
    ensureEvenGrid(clone, componentState[clone.dataset.componentId]?.itemCount || clone.children.length);
  }
  const mediaPage = clone.closest('[data-media-page]');
  silenceMediaPageCaptions(mediaPage || clone);
  if (mediaPage?.dataset.mediaPage === 'split') applySplitCopyRules(clone);
  if (mediaPage?.dataset.mediaPage === 'stack' && (clone.classList.contains('card-grid') || clone.classList.contains('highlight-band'))) {
    if (clone.querySelector('.stat-value')) {
      setGridItemCount(clone, 4);
      setGridColumns(clone, 4);
    } else {
      setGridItemCount(clone, 3);
      setGridColumns(clone, 3);
    }
    clone.classList.remove('is-horizontal');
  }
  if (clone.closest('[data-slot="media"]') && clone.classList.contains('evidence-gallery')) {
    setGridItemCount(clone, 1);
    applyImageWindow(clone, { fit: 'fill' });
  }
  formatCalloutText(clone);
  formatStatValues(clone);
  bindMediaSwitches(clone);
  const regions = clone.closest('.page-regions');
  if (regions) enforceSplitLayoutRules(regions);
  scheduleHistoryCommit();
  return clone;
}

const CENTER_FILL_PARENTS = new Set(['labeledList', 'processSteps', 'dataTable', 'barCompare']);

function applyCenterFillDefault(node) {
  const region = node?.closest?.('.page-region');
  if (!region) return;
  region.dataset.align = 'center';
  region.dataset.size = 'fill';
  const regions = region.closest('.page-regions');
  if (regions) syncRegionTracks(regions);
}

function replaceRegionContent(region, sourceId) {
  const clone = makePageClone(sourceId);
  if (!clone) return null;
  region.replaceChildren(clone);
  if (region.dataset.slot === 'copy') {
    region.dataset.size = region.closest('[data-media-page]') ? 'fill' : 'fit';
  } else if (CENTER_FILL_PARENTS.has(sourceId) && !region.closest('[data-media-page]')) {
    region.dataset.align = 'center';
    region.dataset.size = 'fill';
  }
  const ready = afterPageClone(clone);
  if (CENTER_FILL_PARENTS.has(sourceId) && !region.closest('[data-media-page]')) applyCenterFillDefault(ready);
  return ready;
}

function replacePageParent(node, sourceId) {
  const clone = makePageClone(sourceId);
  if (!clone) return null;
  node.replaceWith(clone);
  const ready = afterPageClone(clone);
  if (CENTER_FILL_PARENTS.has(sourceId)) applyCenterFillDefault(ready);
  return ready;
}

function regionSize(region) {
  return region?.dataset.size === 'fit' ? 'fit' : 'fill';
}

function trackPair(first, second) {
  const a = first === 'fit' ? 'fit' : 'fill';
  const b = second === 'fit' ? 'fit' : 'fill';
  if (a === 'fit' && b === 'fit') return 'fill-fill';
  return `${a}-${b}`;
}

function silenceMediaPageCaptions(scope) {
  const page = scope?.closest?.('[data-media-page]')
    || (scope?.matches?.('[data-media-page]') ? scope : null);
  if (!page) return;
  page.querySelectorAll('[data-slot="media"] .evidence-figure, [data-slot="media"] .media-switch, [data-slot="media"] .evidence-gallery').forEach((node) => {
    node.setAttribute('data-caption', 'off');
  });
}

function applySplitCopyRules(node) {
  const page = node?.closest?.('[data-media-page="split"]')
    || (node?.matches?.('[data-media-page="split"]') ? node : null);
  if (!page) return;
  page.querySelectorAll('[data-slot="copy"] .card-grid.is-highlight, [data-slot="copy"] .highlight-band').forEach((band) => {
    if (currentItemCount(band) > 6) setGridItemCount(band, 6);
  });
  page.querySelectorAll('[data-slot="copy"] .bar-compare').forEach((bar) => {
    bar.classList.remove('is-vertical');
    const id = bar.dataset.componentId;
    if (id) updateComponentConfig(id, 'orientation', 'horizontal');
    syncBarCompareOrientation(bar, 'horizontal');
  });
}

function applyMediaPageMode(regions, mode) {
  const next = mode === 'stack' ? 'stack' : 'split';
  regions.dataset.mediaPage = next;
  regions.dataset.regions = '2';
  regions.dataset.split = next === 'stack' ? 'rows' : 'columns';
  regions.dataset.track = 'fill-fit';
  const copy = regions.querySelector('[data-slot="copy"]');
  const current = inferPageParent(copy?.querySelector(':scope > [data-component-root], :scope > [data-page-parent]'));
  const allowed = next === 'split' ? MEDIA_SPLIT_PARENTS : MEDIA_STACK_PARENTS;
  if (current && !allowed.some(([, id]) => id === current)) {
    replaceRegionContent(copy, 'mediaCopy');
  }
  silenceMediaPageCaptions(regions);
  if (next === 'split') applySplitCopyRules(regions);
  syncRegionTracks(regions);
}

function syncRegionTracks(regions) {
  if (!regions) return;
  if (regions.dataset.mediaPage) {
    const kids = [...regions.querySelectorAll(':scope > .page-region')];
    const media = kids.find((region) => region.dataset.slot === 'media') || kids[0];
    const copy = kids.find((region) => region.dataset.slot === 'copy') || kids[1];
    if (media) {
      media.dataset.slot = 'media';
      media.dataset.size = 'fill';
    }
    if (copy) {
      copy.dataset.slot = 'copy';
      copy.dataset.size = 'fill';
    }
    regions.dataset.regions = '2';
    regions.dataset.split = regions.dataset.mediaPage === 'stack' ? 'rows' : 'columns';
    regions.dataset.track = 'fill-fit';
    return;
  }
  const count = regions.dataset.regions || '1';
  const kids = [...regions.querySelectorAll(':scope > .page-region')];
  if (count === '1') {
    regions.dataset.align = 'center';
    kids.forEach((region) => {
      region.dataset.size = 'fill';
      region.dataset.align = 'center';
    });
    delete regions.dataset.track;
    delete regions.dataset.trackX;
    delete regions.dataset.trackY;
  } else if (count === '2') {
    const first = regionSize(kids[0]);
    const second = regionSize(kids[1]);
    const pair = trackPair(first, second);
    if (pair === 'fill-fill' && first === 'fit' && second === 'fit') {
      kids.forEach((region) => { region.dataset.size = 'fill'; });
    } else {
      if (kids[0]) kids[0].dataset.size = pair.split('-')[0];
      if (kids[1]) kids[1].dataset.size = pair.split('-')[1];
    }
    regions.dataset.track = pair;
  } else {
    const tops = kids.filter((region) => region.dataset.span !== 'foot');
    const foot = kids.find((region) => region.dataset.span === 'foot');
    const xPair = trackPair(regionSize(tops[0]), regionSize(tops[1]));
    if (tops[0]) tops[0].dataset.size = xPair.split('-')[0];
    if (tops[1]) tops[1].dataset.size = xPair.split('-')[1];
    const topFit = xPair === 'fit-fill' || xPair === 'fill-fit' ? 'fill' : (xPair === 'fill-fill' ? 'fill' : 'fit');
    const yPair = trackPair(topFit, regionSize(foot));
    if (foot) foot.dataset.size = yPair.split('-')[1];
    regions.dataset.trackX = xPair;
    regions.dataset.trackY = yPair;
  }
  enforceSplitLayoutRules(regions);
}

function setRegionSize(region, size) {
  const root = region.closest('.page-regions');
  if (!root) return;
  const count = root.dataset.regions || '1';
  region.dataset.size = size;
  if (size === 'fit' && count !== '1') {
    if (count === '2') {
      const others = [...root.querySelectorAll(':scope > .page-region')].filter((item) => item !== region);
      if (others.every((item) => regionSize(item) === 'fit')) {
        others[0].dataset.size = 'fill';
        showToast('同一轴不能都是 fit，另一区已改为 fill');
      }
    } else if (region.dataset.span === 'foot') {
      const tops = [...root.querySelectorAll(':scope > .page-region:not([data-span="foot"])')];
      if (tops.every((item) => regionSize(item) === 'fit')) {
        tops.forEach((item) => { item.dataset.size = 'fill'; });
        showToast('同一轴不能都是 fit，上区已改为 fill');
      }
    } else {
      const others = [...root.querySelectorAll(':scope > .page-region:not([data-span="foot"])')].filter((item) => item !== region);
      if (others.every((item) => regionSize(item) === 'fit')) {
        others[0].dataset.size = 'fill';
        showToast('同一轴不能都是 fit，另一区已改为 fill');
      }
    }
  }
  syncRegionTracks(root);
}

function addInfo(text) {
  const paragraph = document.createElement('p');
  paragraph.className = 'type-small';
  paragraph.textContent = text;
  inspectorBody.appendChild(paragraph);
}

function addColorControl(label, token) {
  const group = createGroup(label);
  const input = document.createElement('input');
  input.type = 'color';
  input.value = toHex(getComputedStyle(root).getPropertyValue(token).trim());
  input.style.width = '100%';
  input.style.height = '42px';
  input.style.padding = '3px';
  input.style.border = '1px solid var(--line)';
  input.addEventListener('input', () => {
    root.style.setProperty(token, input.value);
    markThemeDirty();
    scheduleHistoryCommit();
  });
  group.appendChild(input);
}

function addRootTokenRange(label, token, min, max, step, unit = 'px') {
  const current = parseFloat(getComputedStyle(root).getPropertyValue(token)) || min;
  addRange(label, min, max, step, current, (value) => {
    root.style.setProperty(token, `${value}${unit}`);
  }, unit);
}

function addComponentTokenRange(component, label, token, min, max, step, unit = 'px') {
  const computed = parseFloat(getComputedStyle(component).getPropertyValue(token));
  const current = Number.isFinite(computed) && computed > 1 ? Math.round(computed) : min;
  addRange(label, min, max, step, current, (value) => {
    component.style.setProperty(token, `${value}${unit}`);
  }, unit);
}

function addRange(label, min, max, step, current, onChange, unit = 'px', onCommit) {
  const group = createGroup(label);
  const labelNode = group.querySelector('.control-label');
  const output = document.createElement('output');
  output.textContent = `${current}${unit}`;
  labelNode.appendChild(output);

  const row = document.createElement('div');
  row.className = 'control-row';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = current;
  const number = document.createElement('input');
  number.type = 'number';
  number.min = min;
  number.max = max;
  number.step = step;
  number.value = current;

  const update = (value) => {
    const normalized = Math.min(max, Math.max(min, Number(value)));
    range.value = normalized;
    number.value = normalized;
    output.textContent = `${normalized}${unit}`;
    onChange(normalized);
    markThemeDirty();
    scheduleHistoryCommit();
  };
  range.addEventListener('pointerdown', (event) => event.stopPropagation());
  range.addEventListener('input', () => update(range.value));
  number.addEventListener('input', () => update(number.value));
  range.addEventListener('change', () => onCommit?.());
  number.addEventListener('change', () => onCommit?.());
  range.addEventListener('dblclick', () => {
    update(current);
    showToast('参数已复位');
  });
  row.append(range, number);
  group.appendChild(row);
}

function addSelect(label, options, onChange, currentValue = '') {
  const group = createGroup(label);
  const select = document.createElement('select');
  select.className = 'control-select';
  options.forEach(([name, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = name;
    select.appendChild(option);
  });
  if (currentValue !== '') select.value = String(currentValue);
  select.addEventListener('change', () => {
    onChange(select.value);
    markThemeDirty();
    scheduleHistoryCommit();
  });
  group.appendChild(select);
}

function addTokenChoices(label, options, onChange, activeToken = '') {
  const group = createGroup(label);
  const grid = document.createElement('div');
  grid.className = 'choice-grid';
  options.forEach(([name, token]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `choice${token === activeToken ? ' is-active' : ''}`;
    button.textContent = name;
    const colorToken = tokenState.colors?.find((item) => item.variable === token);
    if (colorToken) {
      button.classList.add('choice--color');
      button.style.background = `var(${token})`;
      button.style.color = isDarkColor(colorToken.value) ? 'var(--inverse)' : 'var(--ink)';
      button.title = `${name} · ${colorToken.value}`;
    }
    button.addEventListener('click', () => {
      grid.querySelectorAll('.choice').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      onChange(token);
      markThemeDirty();
      scheduleHistoryCommit();
    });
    grid.appendChild(button);
  });
  group.appendChild(grid);
}

function addAlignmentControl() {
  addTokenChoices('对齐', [['左', 'left'], ['中', 'center'], ['右', 'right']], (value) => {
    selected.style.textAlign = value;
  }, selected.style.textAlign);
}

function ratioCss(ratio) {
  const parts = String(ratio || '3:4').split(/[:/]/).map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) return `${parts[0]} / ${parts[1]}`;
  return '3 / 4';
}

function applyImageWindow(component, { kind, fit, ratio } = {}) {
  const nodes = [component, ...component.querySelectorAll('.evidence-figure, .media-card, .evidence-window, .media-card__image')];
  const nextRatio = kind === 'shot' ? '0.46:1' : ratio;
  const nextFit = fit === 'fill' ? 'fill' : (fit === undefined ? undefined : 'fit');
  [...new Set(nodes)].forEach((node) => {
    if (kind !== undefined) {
      if (kind && kind !== 'photo') node.setAttribute('data-image-kind', kind);
      else node.removeAttribute('data-image-kind');
    }
    if (nextFit !== undefined) node.setAttribute('data-image-fit', nextFit);
    if (nextRatio !== undefined) {
      if (nextRatio) {
        node.setAttribute('data-image-ratio', nextRatio);
        node.style.setProperty('--image-ratio', ratioCss(nextRatio));
      } else {
        node.removeAttribute('data-image-ratio');
        node.style.removeProperty('--image-ratio');
      }
    }
  });
  requestAnimationFrame(() => {
    const gallery = component.classList.contains('evidence-gallery')
      ? component
      : (component.closest('.evidence-gallery') || component.querySelector('.evidence-gallery'));
    if (gallery) {
      layoutEvidenceGallery(gallery);
      return;
    }
    const standalone = component.matches('.media-switch, .evidence-figure')
      ? component
      : component.closest('.media-switch, .evidence-figure');
    if (standalone) layoutEvidenceStandalone(standalone);
  });
}

function addRatioControl(target) {
  const current = target.getAttribute('data-image-ratio') || '3:4';
  addSelect('图片比例', [
    ['1:1', '1:1'],
    ['4:3', '4:3'],
    ['3:4', '3:4'],
    ['9:16', '9:16'],
    ['0.46:1', '0.46:1']
  ], (value) => {
    applyImageWindow(target, { ratio: value });
    const id = target.dataset.componentId || target.closest('[data-component-id]')?.dataset.componentId;
    if (id) updateComponentConfig(id, 'imageRatio', value);
  }, current);
}

function addFitControl(target) {
  const current = target.getAttribute('data-image-fit') === 'fill' ? 'fill' : 'fit';
  addSelect('适配方式', [['Fit 完整露出', 'fit'], ['Fill 铺满裁切', 'fill']], (value) => {
    applyImageWindow(target, { fit: value });
    const id = target.dataset.componentId || target.closest('[data-component-id]')?.dataset.componentId;
    if (id) updateComponentConfig(id, 'imageFit', value);
  }, current);
}

function createGroup(label) {
  const group = document.createElement('section');
  group.className = 'control-group';
  const labelNode = document.createElement('div');
  labelNode.className = 'control-label';
  const span = document.createElement('span');
  span.textContent = label;
  labelNode.appendChild(span);
  group.appendChild(labelNode);
  inspectorBody.appendChild(group);
  return group;
}

const colorGroupMeta = {
  surface: '表面与背景',
  text: '文字',
  accent: '强调与品牌',
  action: '交互与功能',
  status: '状态反馈',
  border: '边框与分割'
};

function inferColorGroup(token) {
  if (['paper', 'surface', 'surface-soft'].includes(token.id)) return 'surface';
  if (['ink', 'muted', 'faint', 'inverse'].includes(token.id)) return 'text';
  if (token.id === 'line') return 'border';
  if (['link', 'link-hover'].includes(token.id)) return 'action';
  if (['success', 'success-bg', 'warning', 'warning-bg', 'danger', 'danger-bg'].includes(token.id)) return 'status';
  return 'accent';
}

function normalizeDesignState() {
  const defaults = DS.createDefaultTheme();
  tokenState ||= {};
  componentState ||= {};
  tokenState.aliases ||= {};
  ['colors', 'typeScale', 'radii', 'lineWidths', 'spaces'].forEach((category) => {
    if (!Array.isArray(tokenState[category]) || !tokenState[category].length) {
      tokenState[category] = DS.clone(defaults.tokens[category]);
    }
    defaults.tokens[category].forEach((token) => {
      if (!tokenState[category].some((item) => item.id === token.id || item.variable === token.variable)) {
        tokenState[category].push(DS.clone(token));
      }
    });
  });
  tokenState.colors.forEach((token) => token.group ||= inferColorGroup(token));
  const legacyLineIds = new Set(['regular', 'strong', 'heavy']);
  tokenState.lineWidths = tokenState.lineWidths.filter((token) => !legacyLineIds.has(token.id));
  if (!tokenState.lineWidths.length) tokenState.lineWidths = DS.clone(defaults.tokens.lineWidths);
  tokenState.aliases['--line-regular'] = '--line-thin';
  tokenState.aliases['--line-strong'] = '--line-thin';
  tokenState.aliases['--line-heavy'] = '--line-thin';
  Object.entries(defaults.components).forEach(([id, config]) => {
    componentState[id] ||= {};
    Object.entries(config).forEach(([key, value]) => {
      if (componentState[id][key] === undefined) componentState[id][key] = value;
    });
  });
}

function captureHistoryState() {
  const assets = {};
  document.querySelectorAll('[data-history-id]').forEach((element) => {
    assets[element.dataset.historyId] = {
      style: element.getAttribute('style') || '',
      className: [...element.classList].filter((name) => !['is-selected', 'affected-flash'].includes(name)).join(' ')
    };
  });
  return {
    tokens: DS.clone(tokenState),
    components: DS.clone(componentState),
    assets
  };
}

function restoreHistoryState(state) {
  restoringHistory = true;
  closeInspector();
  tokenState = DS.clone(state.tokens);
  componentState = DS.clone(state.components);
  normalizeDesignState();
  applyTokenState();
  renderTokenCollections();
  Object.entries(state.assets).forEach(([historyId, asset]) => {
    const element = document.querySelector(`[data-history-id="${historyId}"]`);
    if (!element) return;
    if (asset.style) element.setAttribute('style', asset.style);
    else element.removeAttribute('style');
    element.className = asset.className;
  });
  Object.entries(componentState).forEach(([id, config]) => applyComponentConfig(id, config));
  markThemeDirty();
  restoringHistory = false;
}

function resetHistory() {
  historyStack = [captureHistoryState()];
  redoStack = [];
}

function scheduleHistoryCommit() {
  if (restoringHistory || historyCommitScheduled) return;
  historyCommitScheduled = true;
  queueMicrotask(() => {
    historyCommitScheduled = false;
    const next = captureHistoryState();
    const serialized = JSON.stringify(next);
    if (serialized === JSON.stringify(historyStack.at(-1))) return;
    historyStack.push(next);
    if (historyStack.length > 150) historyStack.shift();
    redoStack = [];
  });
}

function undoEditorChange() {
  if (historyStack.length < 2) return showToast('没有可撤销的修改');
  const current = historyStack.pop();
  redoStack.push(current);
  restoreHistoryState(historyStack.at(-1));
  showToast('已撤销');
}

function redoEditorChange() {
  const next = redoStack.pop();
  if (!next) return showToast('没有可重做的修改');
  historyStack.push(next);
  restoreHistoryState(next);
  showToast('已重做');
}

function loadThemeStore() {
  const builtIns = DS.createBuiltInThemes();
  try {
    const saved = JSON.parse(localStorage.getItem(DS.storageKey));
    if (saved?.version === DS.version && Array.isArray(saved.themes) && saved.themes.length) {
      const savedById = new Map(saved.themes.map((theme) => [theme.id, theme]));
      const themes = builtIns.map((builtIn) => {
        const savedTheme = savedById.get(builtIn.id);
        if (!savedTheme?.tokens) return builtIn;
        return {
          ...DS.clone(builtIn),
          name: savedTheme.name || builtIn.name,
          tokens: DS.clone(savedTheme.tokens),
          components: DS.clone(savedTheme.components || builtIn.components),
          componentStyles: DS.clone(savedTheme.componentStyles || {}),
          builtIn: true
        };
      });
      const builtInIds = new Set(builtIns.map((theme) => theme.id));
      saved.themes.forEach((theme) => {
        if (!theme.builtIn && !builtInIds.has(theme.id) && theme.tokens) themes.push(DS.clone(theme));
      });
      const activeThemeId = themes.some((theme) => theme.id === saved.activeThemeId) ? saved.activeThemeId : builtIns[0].id;
      return { version: DS.version, activeThemeId, themes };
    }
  } catch {}
  return { version: DS.version, activeThemeId: builtIns[0].id, themes: builtIns };
}

function persistThemeStore() {
  localStorage.setItem(DS.storageKey, JSON.stringify({
    version: DS.version,
    activeThemeId: themeStore.activeThemeId,
    themes: themeStore.themes
  }));
}

function applyTokenState() {
  ['colors', 'typeScale', 'radii', 'lineWidths', 'spaces'].forEach((category) => {
    (tokenState[category] || []).forEach((token) => {
      const unit = category === 'colors' ? '' : 'px';
      root.style.setProperty(token.variable, `${token.value}${unit}`);
      if (category === 'typeScale' && token.lineHeight) {
        root.style.setProperty(`--line-${token.id}`, token.lineHeight);
      }
    });
  });
  Object.entries(tokenState.aliases || {}).forEach(([retired, replacement]) => root.style.setProperty(retired, `var(${replacement})`));
  refreshTokenOptions();
}

function renderTokenCollections() {
  const colorGrid = document.querySelector('#colorTokenGrid');
  if (!colorGrid) return;
  colorGrid.innerHTML = '';
  Object.entries(colorGroupMeta).forEach(([groupId, groupName]) => {
    const tokens = (tokenState.colors || []).filter((token) => token.group === groupId);
    if (!tokens.length) return;
    const section = document.createElement('section');
    section.className = 'color-group';
    section.innerHTML = `<h3 class="color-group__title">${escapeHtml(groupName)}</h3><div class="token-grid"></div>`;
    const grid = section.querySelector('.token-grid');
    tokens.forEach((token) => {
      const item = document.createElement('div');
      item.className = `swatch${isDarkColor(token.value) ? ' is-dark' : ''}`;
      item.style.setProperty('--swatch', `var(${token.variable})`);
      setTokenDataset(item, 'colors', token);
      item.innerHTML = `<b>${escapeHtml(token.name)}</b><code>${escapeHtml(token.variable)}</code>`;
      grid.appendChild(item);
    });
    colorGrid.appendChild(section);
  });

  const typeList = document.querySelector('#typeScaleList');
  if (typeList) {
    typeList.innerHTML = '';
    const samples = ['知识不是堆积，而是结构。', '从信息中建立清晰判断', '先给结论，再展开证据', '章节中的核心观点', '正文承担完整解释，并在连续阅读中保持舒适。', '用于图片说明、数据口径与补充信息。', '数据来源'];
    (tokenState.typeScale || []).forEach((token, index) => {
      const row = document.createElement('div');
      row.className = 'type-row';
      setTokenDataset(row, 'typeScale', token);
      row.innerHTML = `<div class="type-meta">${escapeHtml(token.name)}<br>${token.value} / ${token.lineHeight || 1.5}</div><div style="font-size:var(${token.variable});line-height:${token.lineHeight || 1.5};font-weight:${index < 4 ? 'var(--weight-bold)' : 'var(--weight-regular)'}">${escapeHtml(samples[index] || '自定义字号层级')}</div>`;
      typeList.appendChild(row);
    });
  }

  renderMetricTokens('#radiusTokenGrid', 'radii', 'radius');
  renderMetricTokens('#lineTokenGrid', 'lineWidths', 'line');
  renderMetricTokens('#spaceTokenGrid', 'spaces', 'space');
}

function renderMetricTokens(selector, category, demo) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = '';
  (tokenState[category] || []).forEach((token) => {
    const item = document.createElement('article');
    item.className = 'foundation-item';
    setTokenDataset(item, category, token);
    const demoMarkup = demo === 'radius'
      ? `<div class="radius-demo" style="--radius:var(${token.variable})"></div>`
      : demo === 'line'
        ? `<div class="line-demo" style="--line-width:var(${token.variable})"></div>`
        : `<div class="space-demo" style="--demo-size:var(${token.variable})"></div>`;
    item.innerHTML = `<b>${escapeHtml(token.name)}</b><p>${token.value}px · ${escapeHtml(token.variable)}</p>${demoMarkup}`;
    container.appendChild(item);
  });
}

function setTokenDataset(element, category, token) {
  element.dataset.editable = '';
  element.dataset.kind = 'dynamic-token';
  element.dataset.category = category;
  element.dataset.tokenId = token.id;
  element.dataset.nodeLabel = token.name;
  element.tabIndex = 0;
}

function renderDynamicTokenControls(category, tokenId) {
  const collection = tokenState[category];
  const token = collection?.find((item) => item.id === tokenId);
  if (!token) return addInfo('Token 已不存在。');
  if (category === 'colors') {
    addColorControl('颜色值', token.variable);
    inspectorBody.querySelector('input[type="color"]').addEventListener('input', (event) => {
      token.value = event.target.value;
      updateTokenPreview(category, token);
      flashTokenReferences(token.variable);
      markThemeDirty();
    });
    addSelect('使用场景', Object.entries(colorGroupMeta).map(([value, name]) => [name, value]), (value) => {
      token.group = value;
      renderTokenCollections();
      const replacement = document.querySelector(`[data-category="colors"][data-token-id="${token.id}"]`);
      if (replacement) openInspector(replacement);
      markThemeDirty();
    }, token.group || inferColorGroup(token));
  } else {
    const ranges = {
      typeScale: ['字号', 9, 96, 1],
      radii: ['圆角', 0, 999, 1],
      lineWidths: ['线条粗细', 1, 12, 1],
      spaces: ['间距', 0, 120, 1]
    };
    const [label, min, max, step] = ranges[category];
    addRange(label, min, max, step, token.value, (value) => {
      token.value = value;
      root.style.setProperty(token.variable, `${value}px`);
      updateTokenPreview(category, token);
      flashTokenReferences(token.variable);
      markThemeDirty();
    });
    if (category === 'typeScale') {
      addRange('行高', 1, 2.4, .02, token.lineHeight || 1.5, (value) => {
        token.lineHeight = value;
        root.style.setProperty(`--line-${token.id}`, value);
        updateTokenPreview(category, token);
        markThemeDirty();
      }, '');
    }
  }

  const renameGroup = createGroup('Token 名称');
  const rename = document.createElement('input');
  rename.className = 'control-select';
  rename.value = token.name;
  rename.addEventListener('change', () => {
    token.name = rename.value.trim() || token.name;
    selected.dataset.nodeLabel = token.name;
    inspectorTitle.textContent = token.name;
    renderTokenCollections();
    refreshTokenOptions();
    const replacement = document.querySelector(`[data-category="${category}"][data-token-id="${token.id}"]`);
    if (replacement) openInspector(replacement);
    markThemeDirty();
    scheduleHistoryCommit();
  });
  renameGroup.appendChild(rename);

  if (collection.length > 1) {
    let replacementId = collection.find((item) => item.id !== token.id).id;
    addSelect('删除后替换为', collection.filter((item) => item.id !== token.id).map((item) => [item.name, item.id]), (value) => {
      replacementId = value;
    }, replacementId);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'token-delete';
    remove.textContent = '删除这个 Token';
    remove.addEventListener('click', () => deleteToken(category, token.id, replacementId));
    inspectorBody.appendChild(remove);
  } else {
    addInfo('每个分类至少保留一个 Token。');
  }
}

function updateTokenPreview(category, token) {
  const preview = document.querySelector(`[data-category="${category}"][data-token-id="${token.id}"]`);
  if (!preview) return;
  if (category === 'colors') {
    preview.classList.toggle('is-dark', isDarkColor(token.value));
  } else if (category === 'typeScale') {
    const meta = preview.querySelector('.type-meta');
    if (meta) meta.innerHTML = `${escapeHtml(token.name)}<br>${token.value} / ${token.lineHeight || 1.5}`;
  } else {
    const description = preview.querySelector('p');
    if (description) description.textContent = `${token.value}px · ${token.variable}`;
  }
}

function deleteToken(category, tokenId, replacementId) {
  const collection = tokenState[category];
  const token = collection.find((item) => item.id === tokenId);
  const replacement = collection.find((item) => item.id === replacementId);
  if (!token || !replacement || !window.confirm(`删除“${token.name}”，并将引用迁移到“${replacement.name}”？`)) return;
  document.querySelectorAll('[style]').forEach((element) => {
    const properties = Array.from(element.style);
    properties.forEach((property) => {
      if (property === token.variable) return;
      const value = element.style.getPropertyValue(property);
      if (value.includes(token.variable)) {
        element.style.setProperty(property, value.split(token.variable).join(replacement.variable), element.style.getPropertyPriority(property));
      }
    });
  });
  tokenState.aliases ||= {};
  Object.entries(tokenState.aliases).forEach(([retired, target]) => {
    if (target === token.variable) tokenState.aliases[retired] = replacement.variable;
  });
  tokenState.aliases[token.variable] = replacement.variable;
  root.style.setProperty(token.variable, `var(${replacement.variable})`);
  tokenState[category] = collection.filter((item) => item.id !== tokenId);
  refreshTokenOptions();
  renderTokenCollections();
  closeInspector();
  markThemeDirty();
  scheduleHistoryCommit();
  showToast('Token 已删除并迁移引用');
}

function openTokenDialog(category, token = null) {
  tokenCategoryInput.value = category;
  tokenEditingIdInput.value = token?.id || '';
  tokenNameInput.value = token?.name || '';
  const defaults = { colors: '#546a85', typeScale: 18, radii: 8, lineWidths: 2, spaces: 16 };
  tokenValueInput.value = token?.value ?? defaults[category];
  tokenColorGroupRow.hidden = category !== 'colors';
  tokenColorGroupInput.value = token?.group || 'accent';
  document.querySelector('#tokenDialogTitle').textContent = token ? '编辑 Token' : '新增 Token';
  tokenDialog.showModal();
  requestAnimationFrame(() => tokenNameInput.focus());
}

function saveTokenFromDialog() {
  const category = tokenCategoryInput.value;
  const collection = tokenState[category];
  const editingId = tokenEditingIdInput.value;
  const name = tokenNameInput.value.trim();
  if (!collection || !name) return;
  const numeric = category !== 'colors';
  const value = numeric ? Number(tokenValueInput.value) : tokenValueInput.value;
  if ((numeric && !Number.isFinite(value)) || (!numeric && !/^#[0-9a-f]{6}$/i.test(value))) {
    showToast('请输入有效数值');
    return;
  }
  if (editingId) {
    const token = collection.find((item) => item.id === editingId);
    if (token) Object.assign(token, { name, value }, category === 'colors' ? { group: tokenColorGroupInput.value } : {});
  } else {
    const idBase = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || 'custom';
    let id = idBase;
    let index = 2;
    while (collection.some((item) => item.id === id)) id = `${idBase}-${index++}`;
    const prefixes = { colors: 'color', typeScale: 'text', radii: 'radius', lineWidths: 'line', spaces: 'space' };
    collection.push({
      id,
      name,
      value,
      variable: `--${prefixes[category]}-${id}`,
      ...(category === 'colors' ? { group: tokenColorGroupInput.value } : {}),
      ...(category === 'typeScale' ? { lineHeight: 1.5 } : {})
    });
  }
  applyTokenState();
  renderTokenCollections();
  tokenDialog.close();
  markThemeDirty();
  scheduleHistoryCommit();
  showToast('Token 已保存');
}

function updateComponentConfig(componentId, property, value) {
  if (!componentId) return;
  componentState[componentId] ||= {};
  componentState[componentId][property] = value;
  markThemeDirty();
}

function addDecorationControl(componentId, element) {
  addSelect('装饰线', [['无装饰', 'none'], ['顶部整线', 'top'], ['顶部短线', 'short'], ['左侧线', 'left'], ['角标线', 'corner']], (value) => {
    element.dataset.decoration = value || 'none';
    if (value === 'none') {
      element.style.removeProperty('--decoration-color');
      element.style.removeProperty('--decoration-width');
    }
    updateComponentConfig(componentId, 'decoration', value);
  }, componentState[componentId]?.decoration || 'none');
  addTokenChoices('线条颜色', colorTokens, (token) => element.style.setProperty('--decoration-color', `var(${token})`), getReferencedToken(element.style.getPropertyValue('--decoration-color')));
  addTokenChoices('线条粗细', lineWidthTokens, (token) => element.style.setProperty('--decoration-width', `var(${token})`), getReferencedToken(element.style.getPropertyValue('--decoration-width')));
}

const LINEAR_ITEM_CAP = 10;

function isLinearList(component) {
  return Boolean(component?.classList.contains('list-block') || component?.classList.contains('steps') || component?.classList.contains('bar-compare'));
}

function linearItems(component) {
  return [...component.children].filter((item) => !item.classList.contains('scroll-controls'));
}

function addLinearCountControl(component, componentId) {
  const current = Math.min(LINEAR_ITEM_CAP, Math.max(1, Number(componentState[componentId]?.itemCount || linearItems(component).filter((item) => !item.classList.contains('is-component-item-hidden')).length || 1)));
  addRange('条目数量', 1, LINEAR_ITEM_CAP, 1, current, (value) => {
    ensureLinearItems(component, value);
  }, '');
}

function ensureLinearItems(component, count, persist = true) {
  const target = Math.min(LINEAR_ITEM_CAP, Math.max(1, Number(count) || 1));
  const template = linearItems(component)[0];
  while (linearItems(component).length < target && template) {
    const index = linearItems(component).length + 1;
    const clone = template.cloneNode(true);
    clone.classList.remove('is-component-item-hidden');
    clone.querySelectorAll('[data-history-id]').forEach((node) => delete node.dataset.historyId);
    delete clone.dataset.historyId;
    if (component.classList.contains('steps')) {
      const idx = clone.querySelector('.step__index');
      if (idx) idx.textContent = String(index).padStart(2, '0');
    } else if (component.classList.contains('bar-compare')) {
      const label = clone.querySelector('.bar-compare__label');
      if (label) label.textContent = `方案 ${String.fromCharCode(64 + Math.min(index, 26))}`;
    } else if (component.classList.contains('list-block')) {
      const label = clone.querySelector('.list-row__label');
      if (label) label.textContent = `条目 ${index}`;
    }
    component.appendChild(clone);
  }
  syncComponentItems(component, target);
  const id = component.dataset.componentId || component.dataset.pageParent;
  if (persist && id) updateComponentConfig(id, 'itemCount', target);
  return target;
}

function syncComponentItems(component, itemCount) {
  const items = [...component.children].filter((item) => !item.classList.contains('scroll-controls'));
  const visibleCount = Math.min(items.length, Math.max(1, Number(itemCount)));
  items.forEach((item, index) => item.classList.toggle('is-component-item-hidden', index >= visibleCount));
  component.dataset.itemCount = String(visibleCount);
}

const DATA_TABLE_MODEL = {
  rowHeader: '方案',
  dimHeader: '维度',
  attributes: ['覆盖能力', '实施成本', '结论'],
  entities: [
    {
      name: '方案 A',
      badge: { text: 'TOP 1', tone: 'success' },
      cells: [
        { text: '完整', mark: 'best' },
        { text: '中等', mark: null },
        { text: '优先验证', mark: 'best' }
      ]
    },
    {
      name: '方案 B',
      badge: { text: 'TOP 2', tone: 'warning' },
      cells: [
        { text: '局部', mark: null },
        { text: '较低', mark: 'best' },
        { text: '作为补充', mark: null }
      ]
    },
    {
      name: '方案 C',
      badge: null,
      cells: [
        { text: '有限', mark: 'weak' },
        { text: '较高', mark: null },
        { text: '暂不采用', mark: 'weak' }
      ]
    },
    {
      name: '方案 D',
      badge: null,
      cells: [
        { text: '中等', mark: null },
        { text: '中等', mark: null },
        { text: '观察', mark: null }
      ]
    }
  ]
};

function cellClass(mark) {
  if (mark === 'best') return ' class="cell-best"';
  if (mark === 'weak') return ' class="cell-weak"';
  return '';
}

function renderDataTable(wrap, config = {}) {
  const table = wrap.querySelector('.data-table') || wrap;
  const variant = config.variant || 'plain';
  const columns = Math.max(2, Math.min(4, Number(config.columns) || 3));
  const entities = DATA_TABLE_MODEL.entities.slice(0, columns);
  const attrs = DATA_TABLE_MODEL.attributes;
  table.classList.toggle('is-matrix', variant === 'matrix');
  if (variant === 'matrix') {
    table.innerHTML = `
      <thead><tr data-editable data-kind="table-row" data-node-label="表头">
        <th data-editable data-kind="table-cell" data-node-label="表头单元格">${DATA_TABLE_MODEL.dimHeader}</th>
        ${entities.map((entity) => `<th data-editable data-kind="table-cell" data-node-label="表头单元格">${entity.badge ? `<span class="badge ${entity.badge.tone}">${entity.badge.text}</span> ` : ''}${entity.name}</th>`).join('')}
      </tr></thead>
      <tbody>
        ${attrs.map((attr, attrIndex) => `<tr data-editable data-kind="table-row" data-node-label="数据行">
          <td data-editable data-kind="table-cell" data-node-label="数据单元格">${attr}</td>
          ${entities.map((entity) => {
            const cell = entity.cells[attrIndex];
            return `<td data-editable data-kind="table-cell" data-node-label="数据单元格"${cellClass(cell.mark)}>${cell.text}</td>`;
          }).join('')}
        </tr>`).join('')}
      </tbody>`;
  } else {
    table.innerHTML = `
      <thead><tr data-editable data-kind="table-row" data-node-label="表头">
        <th data-editable data-kind="table-cell" data-node-label="表头单元格">${DATA_TABLE_MODEL.rowHeader}</th>
        ${attrs.map((attr) => `<th data-editable data-kind="table-cell" data-node-label="表头单元格">${attr}</th>`).join('')}
      </tr></thead>
      <tbody>
        ${entities.map((entity) => `<tr data-editable data-kind="table-row" data-node-label="数据行">
          <td data-editable data-kind="table-cell" data-node-label="数据单元格"><strong>${entity.name}</strong></td>
          ${entity.cells.map((cell) => `<td data-editable data-kind="table-cell" data-node-label="数据单元格"${cellClass(cell.mark)}>${cell.text}</td>`).join('')}
        </tr>`).join('')}
      </tbody>`;
  }
  table.querySelectorAll('[data-editable]').forEach((element) => {
    if (!element.dataset.historyId) element.dataset.historyId = `asset-table-${Math.random().toString(36).slice(2, 8)}`;
  });
}

function syncBarCompareOrientation(component, orientation) {
  component.querySelectorAll('.bar-compare__fill').forEach((fill) => {
    const current = parseFloat(fill.style.width) || parseFloat(fill.style.getPropertyValue('--bar-size')) || parseFloat(fill.style.height) || 50;
    if (orientation === 'vertical') {
      fill.style.width = '';
      fill.style.height = '';
      fill.style.setProperty('--bar-size', `${current}%`);
    } else {
      fill.style.removeProperty('--bar-size');
      fill.style.height = '';
      fill.style.width = `${current}%`;
    }
  });
}

function setHorizontalEligibility(component, componentId, columns) {
  const slideCols = component.classList.contains('is-horizontal')
    ? peekSlideColumns(columns)
    : Math.max(2, Number(columns) || 2);
  const eligible = slideCols >= 2;
  if (component.classList.contains('is-horizontal')) {
    component.dataset.slideColumns = String(slideCols);
    component.style.setProperty('--slide-cols', String(slideCols));
  }
  const displayGroup = [...inspectorBody.querySelectorAll('.control-group')].find((group) => group.querySelector('.control-label span')?.textContent === '展示方式');
  const select = displayGroup?.querySelector('select');
  const horizontalOption = select?.querySelector('option[value="horizontal"]');
  if (horizontalOption) horizontalOption.disabled = !eligible;
  if (!eligible && componentState[componentId]?.mode === 'horizontal') {
    componentState[componentId].mode = 'grid';
    component.classList.remove('is-horizontal');
    syncComponentItems(component, componentState[componentId]?.itemCount || component.children.length);
    toggleHorizontalControls(component, false);
    if (select) select.value = 'grid';
    markThemeDirty();
  }
  requestAnimationFrame(() => {
    const controls = component.closest('.component-frame')?.querySelector(':scope > .scroll-controls');
    controls?._update?.();
  });
}

function toggleHorizontalControls(component, visible) {
  const frame = component.closest('.component-frame');
  if (!frame) return;
  let controls = frame.querySelector(':scope > .scroll-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'scroll-controls';
    controls.innerHTML = '<button type="button" data-scroll="-1" aria-label="向前滚动">←</button><output>1 / 1</output><button type="button" data-scroll="1" aria-label="向后滚动">→</button>';
    controls.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      const metrics = getHorizontalMetrics(component);
      const targetIndex = Math.max(0, Math.min(metrics.positions.length - 1, metrics.page - 1 + Number(button.dataset.scroll)));
      component.scrollTo({ left: metrics.positions[targetIndex], behavior: 'smooth' });
    }));
    const update = () => {
      const metrics = getHorizontalMetrics(component);
      controls.querySelector('output').textContent = `${metrics.page} / ${metrics.pages}`;
      controls.querySelector('[data-scroll="-1"]').disabled = metrics.page <= 1;
      controls.querySelector('[data-scroll="1"]').disabled = metrics.page >= metrics.pages;
      component.classList.toggle('has-horizontal-overflow', controls._horizontalVisible && metrics.pages > 1);
      controls.hidden = !controls._horizontalVisible || metrics.pages <= 1;
    };
    component.addEventListener('scroll', update, { passive: true });
    controls._update = update;
    frame.appendChild(controls);
  }
  controls._horizontalVisible = visible;
  controls.hidden = !visible;
  requestAnimationFrame(() => controls._update?.());
}

function getHorizontalMetrics(component) {
  const items = [...component.children].filter((item) => getComputedStyle(item).display !== 'none');
  const gap = parseFloat(getComputedStyle(component).gap) || 0;
  const itemWidth = items[0]?.getBoundingClientRect().width || component.clientWidth;
  const pageSpan = Math.max(1, itemWidth + gap);
  const maxScroll = Math.max(0, component.scrollWidth - component.clientWidth);
  const positions = [0];
  for (let position = pageSpan; position < maxScroll - 1; position += pageSpan) positions.push(position);
  if (maxScroll > 1) positions.push(maxScroll);
  const nearestIndex = positions.reduce((best, position, index) => (
    Math.abs(position - component.scrollLeft) < Math.abs(positions[best] - component.scrollLeft) ? index : best
  ), 0);
  return { page: nearestIndex + 1, pages: positions.length, pageSpan, positions };
}

function applyComponentConfig(componentId, config) {
  const component = document.querySelector(`[data-component-id="${componentId}"]`);
  if (!component || !config) return;
  if ('columns' in config && componentId !== 'dataTable' && componentId !== 'barCompare') {
    component.style.setProperty('--component-columns', config.columns);
  }
  const horizontalAllowed = Number(config.columns || 0) >= 2;
  if (Number(config.itemCount) === 5) {
    config.mode = 'grid';
    config.columns = 5;
  } else if (needsHorizontalRow(config.itemCount || currentItemCount(component))) {
    config.mode = 'horizontal';
    config.columns = HORIZONTAL_VISIBLE;
  }
  if (config.mode === 'horizontal' && !horizontalAllowed && !needsHorizontalRow(config.itemCount || currentItemCount(component))) config.mode = 'grid';
  if ('mode' in config && !isEvidenceRow(component)) component.classList.toggle('is-horizontal', config.mode === 'horizontal');
  if (isEvidenceRow(component)) applyEvidenceRow(component);
  if (component.classList.contains('is-horizontal') || config.mode === 'horizontal') {
    applyHorizontalTrack(component, config.columns);
  } else if ('columns' in config && (component.classList.contains('card-grid') || component.classList.contains('image-grid') || component.classList.contains('highlight-band'))) {
    component.style.display = 'grid';
    component.style.gridTemplateColumns = `repeat(${Math.max(1, Number(config.columns) || 3)}, minmax(0, 1fr))`;
  }
  if ('slideWidth' in config) component.style.setProperty('--slide-width', `${Math.max(0, Number(config.slideWidth) || 0)}px`);
  if ('tone' in config && component.classList.contains('card-grid') && !component.querySelector('.stat-value')) {
    component.classList.toggle('is-highlight', config.tone === 'highlight');
  }
  if ('decoration' in config) {
    if (component.classList.contains('callout')) config.decoration = 'none';
    if (config.decoration && config.decoration !== 'none') component.dataset.decoration = config.decoration;
    else component.setAttribute('data-decoration', 'none');
  }
  if ('imageStyle' in config) component.dataset.imageStyle = config.imageStyle;
  const imagePatch = {};
  if ('imageKind' in config) imagePatch.kind = config.imageKind || 'photo';
  if ('imageFit' in config) imagePatch.fit = config.imageFit || '';
  if (imagePatch.kind === 'shot' || config.imageKind === 'shot') imagePatch.ratio = '0.46:1';
  else if ('imageRatio' in config) imagePatch.ratio = config.imageRatio || '';
  if (config.imageFit === 'natural') imagePatch.fit = 'fit';
  if (Object.keys(imagePatch).length) applyImageWindow(component, imagePatch);
  if (componentId === 'dataTable') {
    config.variant = 'plain';
    renderDataTable(component, config);
  }
  if (componentId === 'processSteps') {
    config.variant = 'steps';
    component.classList.remove('is-rail');
  }
  if (component.classList.contains('callout')) {
    component.removeAttribute('data-decoration');
    component.style.removeProperty('--decoration-color');
    component.style.removeProperty('--decoration-width');
  }
  if (componentId === 'barCompare') {
    const orientation = config.orientation || 'horizontal';
    component.classList.toggle('is-vertical', orientation === 'vertical');
    component.style.removeProperty('--component-columns');
    delete config.columns;
    syncBarCompareOrientation(component, orientation);
  }
  if (component.classList.contains('media-card')) {
    const layout = config.mediaLayout
      || (config.imagePosition === 'left' || config.imagePosition === 'split' ? 'split'
        : config.imagePosition === 'right' ? 'split-reverse'
        : config.imagePosition === 'overlay' ? 'overlay'
        : 'stack');
    applyMediaLayout(component, layout);
  }
  if (componentId === 'navigation') {
    component.classList.toggle('is-side', config.position === 'side');
    component.classList.toggle('is-sticky', Boolean(config.sticky));
    component.classList.toggle('is-collapsed', Boolean(config.collapsed));
    component.classList.remove('nav-underline', 'nav-segmented', 'nav-compact', 'nav-rail');
    component.classList.add(`nav-${config.variant || 'underline'}`);
  }
  if (inferEvidenceKind(component) === 'strip') config.itemCount = 1;
  if (isLinearList(component)) {
    ensureLinearItems(component, config.itemCount || linearItems(component).length, false);
  } else if (componentId !== 'dataTable' && !component.classList.contains('media-card') && !component.classList.contains('media-switch')) {
    syncComponentItems(component, config.itemCount || component.children.length);
  }
  if ('mode' in config) toggleHorizontalControls(component, config.mode === 'horizontal');
}

function captureComponentStyles() {
  const output = {};
  document.querySelectorAll('[data-component-root]').forEach((component) => {
    const id = component.dataset.componentId;
    output[id] = [component, ...component.querySelectorAll('[data-editable]')].map((node) => node.getAttribute('style') || '');
  });
  return output;
}

function restoreComponentStyles(styles = {}) {
  document.querySelectorAll('[data-component-root]').forEach((component) => {
    const values = styles[component.dataset.componentId] || [];
    [component, ...component.querySelectorAll('[data-editable]')].forEach((node, index) => {
      if (values[index]) node.setAttribute('style', values[index]);
      else node.removeAttribute('style');
    });
  });
}

function snapshotCurrentTheme(theme) {
  return {
    ...theme,
    tokens: DS.clone(tokenState),
    components: DS.clone(componentState),
    componentStyles: captureComponentStyles()
  };
}

function syncPageModuleHeight() {
  const themeBar = document.querySelector('.theme-bar');
  const frame = document.querySelector('#pages .component-frame');
  const name = frame?.querySelector('.component-name');
  const themeH = themeBar ? Math.ceil(themeBar.getBoundingClientRect().height) : 54;
  const framePad = frame
    ? Math.ceil(parseFloat(getComputedStyle(frame).paddingTop) + parseFloat(getComputedStyle(frame).paddingBottom))
    : 56;
  const nameH = name
    ? Math.ceil(name.getBoundingClientRect().height + parseFloat(getComputedStyle(name).marginBottom))
    : 34;
  const height = Math.max(280, Math.floor(window.innerHeight - themeH - framePad - nameH - 12));
  document.documentElement.style.setProperty('--page-module-height', `${height}px`);
}

function relayoutAfterTheme() {
  syncPageModuleHeight();
  document.querySelectorAll('.evidence-gallery, .media-switch, .evidence-figure').forEach((node) => layoutEvidenceNode(node));
  document.querySelectorAll('.page-regions').forEach((regions) => {
    syncRegionTracks(regions);
    enforceSplitLayoutRules(regions);
  });
}

function applyTheme(theme) {
  closeInspector();
  activeTheme = theme;
  tokenState = DS.clone(theme.tokens || {});
  componentState = DS.clone(theme.components || {});
  normalizeDesignState();
  applyTokenState();
  renderTokenCollections();
  restoreComponentStyles(theme.componentStyles);
  Object.entries(componentState).forEach(([id, config]) => applyComponentConfig(id, config));
  themeStore.activeThemeId = theme.id;
  persistThemeStore();
  renderThemeToolbar();
  resetHistory();
  requestAnimationFrame(() => {
    relayoutAfterTheme();
    requestAnimationFrame(relayoutAfterTheme);
  });
}

function renderThemeToolbar() {
  themeSelect.innerHTML = '';
  themeStore.themes.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    themeSelect.appendChild(option);
  });
  themeSelect.value = activeTheme.id;
  activeThemeName.textContent = activeTheme.name;
  document.querySelector('#deleteTheme').disabled = Boolean(activeTheme.builtIn);
}

let persistDirtyTimer = null;

function syncActiveThemeToStore() {
  const snapshot = snapshotCurrentTheme(activeTheme);
  const index = themeStore.themes.findIndex((theme) => theme.id === activeTheme.id);
  if (index >= 0) {
    themeStore.themes[index] = snapshot;
    activeTheme = themeStore.themes[index];
  } else {
    themeStore.themes.push(snapshot);
    activeTheme = themeStore.themes[themeStore.themes.length - 1];
  }
  themeStore.activeThemeId = activeTheme.id;
}

function markThemeDirty() {
  if (!activeThemeName.textContent.endsWith(' · 未保存')) activeThemeName.textContent = `${activeTheme.name} · 未保存`;
  clearTimeout(persistDirtyTimer);
  persistDirtyTimer = setTimeout(() => {
    syncActiveThemeToStore();
    persistThemeStore();
    if (!activeThemeName.textContent.endsWith(' · 已同步')) {
      activeThemeName.textContent = `${activeTheme.name} · 已同步`;
    }
  }, 280);
}

function saveActiveTheme() {
  syncActiveThemeToStore();
  themeStore.activeThemeId = activeTheme.id;
  persistThemeStore();
  renderThemeToolbar();
  showToast('主题已保存，模板页刷新后可直接切换');
}

function createTheme() {
  const name = window.prompt('新主题名称：', '新主题');
  if (!name) return;
  const theme = snapshotCurrentTheme({ ...DS.createCustomTheme(name), name });
  themeStore.themes.push(theme);
  applyTheme(theme);
  showToast('主题已创建');
}

function renameActiveTheme() {
  if (activeTheme.builtIn) return showToast('内置主题不能重命名');
  const name = window.prompt('新的主题名称：', activeTheme.name);
  if (!name) return;
  activeTheme.name = name;
  const stored = themeStore.themes.find((theme) => theme.id === activeTheme.id);
  if (stored) stored.name = name;
  persistThemeStore();
  renderThemeToolbar();
}

function deleteActiveTheme() {
  if (activeTheme.builtIn) return;
  if (!window.confirm(`删除主题“${activeTheme.name}”？`)) return;
  themeStore.themes = themeStore.themes.filter((theme) => theme.id !== activeTheme.id);
  applyTheme(themeStore.themes[0]);
  showToast('主题已删除');
}

function exportActiveTheme() {
  const content = JSON.stringify({ version: DS.version, theme: snapshotCurrentTheme(activeTheme) }, null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  link.download = `${activeTheme.name.replace(/[^\w\u4e00-\u9fa5-]+/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importThemeFile(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.version !== DS.version || !validateImportedTheme(data.theme)) throw new Error('版本、Token 或引用结构不匹配');
    const imported = DS.clone(data.theme);
    imported.id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    imported.name = themeStore.themes.some((theme) => theme.name === imported.name) ? `${imported.name} 导入` : imported.name;
    imported.builtIn = false;
    themeStore.themes.push(imported);
    applyTheme(imported);
    showToast('主题已导入');
  } catch (error) {
    showToast(`导入失败：${error.message}`);
  }
}

function validateImportedTheme(theme) {
  if (!theme?.tokens || !theme?.components) return false;
  const categories = ['colors', 'typeScale', 'radii', 'lineWidths', 'spaces'];
  const variables = new Set();
  for (const category of categories) {
    if (!Array.isArray(theme.tokens[category]) || !theme.tokens[category].length) return false;
    for (const token of theme.tokens[category]) {
      if (!token.id || !token.name || !token.variable || variables.has(token.variable)) return false;
      if (category === 'colors' ? !/^#[0-9a-f]{6}$/i.test(token.value) : !Number.isFinite(Number(token.value))) return false;
      variables.add(token.variable);
    }
  }
  const requiredIds = ['sectionHeader', 'cardGrid', 'statGrid', 'labeledList', 'processSteps', 'dataTable', 'barCompare', 'evidenceGallery', 'decisionCallout', 'cardGridHighlight', 'navigation'];
  return requiredIds.every((id) => theme.components[id]);
}

function flashTokenReferences(variable) {
  document.querySelectorAll('[data-component-root]').forEach((component) => {
    const usesToken = getComputedStyle(component).cssText?.includes(variable)
      || component.getAttribute('style')?.includes(variable)
      || [...component.querySelectorAll('[style]')].some((item) => item.getAttribute('style').includes(variable));
    if (usesToken || ['--space-4', '--space-5', '--line-thin', '--accent'].includes(variable)) {
      component.classList.remove('affected-flash');
      requestAnimationFrame(() => component.classList.add('affected-flash'));
    }
  });
}

function isDarkColor(hex) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 142;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function resetSelection() {
  if (!selected) return;
  if (selected.dataset.kind === 'dynamic-token') {
    const category = selected.dataset.category;
    const original = activeTheme.tokens[category]?.find((item) => item.id === selected.dataset.tokenId);
    const current = tokenState[category]?.find((item) => item.id === selected.dataset.tokenId);
    if (original && current) Object.assign(current, DS.clone(original));
    applyTokenState();
    renderTokenCollections();
    closeInspector();
    scheduleHistoryCommit();
    showToast('Token 已恢复');
    return;
  }
  const token = selected.dataset.token;
  if (token && initialTokens[token]) {
    root.style.setProperty(token, initialTokens[token]);
    renderControls();
    scheduleHistoryCommit();
    showToast('Token 已恢复');
    return;
  }
  if (selectedRoot?.matches('[data-component-root]')) {
    const snapshot = initialComponents.get(selectedRoot);
    if (snapshot) {
      selectedRoot.innerHTML = snapshot.html;
      if (snapshot.style === null) selectedRoot.removeAttribute('style');
      else selectedRoot.setAttribute('style', snapshot.style);
      const componentId = selectedRoot.dataset.componentId;
      if (componentId && activeTheme.components[componentId]) {
        componentState[componentId] = DS.clone(activeTheme.components[componentId]);
        applyComponentConfig(componentId, componentState[componentId]);
      }
      openInspector(selectedRoot);
      scheduleHistoryCommit();
      showToast('父组件已恢复');
      return;
    }
  }
  selected.removeAttribute('style');
  renderControls();
  scheduleHistoryCommit();
  showToast('元素已恢复');
}

async function copyConfig() {
  if (!selected) return;
  let content;
  if (selected.dataset.kind === 'dynamic-token') {
    const item = tokenState[selected.dataset.category].find((token) => token.id === selected.dataset.tokenId);
    content = JSON.stringify(item, null, 2);
  } else if (selected.dataset.token) {
    const token = selected.dataset.token;
    content = `:root {\n  ${token}: ${getComputedStyle(root).getPropertyValue(token).trim()};\n}`;
  } else {
    const editable = [selectedRoot, ...selectedRoot.querySelectorAll('[data-editable]')];
    const changes = editable
      .filter((element) => element.getAttribute('style'))
      .map((element) => ({
        node: element.dataset.nodeLabel,
        style: element.getAttribute('style')
      }));
    content = JSON.stringify({
      component: selectedRoot.dataset.nodeLabel,
      changes
    }, null, 2);
  }
  try {
    await navigator.clipboard.writeText(content);
    showToast('配置已复制');
  } catch {
    showToast('浏览器未授权复制');
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1600);
}

function inferTypeToken(element) {
  if (element.classList.contains('type-display')) return '--text-display';
  if (element.classList.contains('type-h1')) return '--text-h1';
  if (element.classList.contains('type-h2')) return '--text-h2';
  if (element.classList.contains('type-h3')) return '--text-h3';
  if (element.classList.contains('type-body')) return '--text-body';
  if (element.classList.contains('type-small')) return '--text-small';
  return null;
}

function getReferencedToken(value) {
  return value?.match(/var\((--[^)]+)\)/)?.[1] || '';
}

function getNumber(value) {
  return parseFloat(value) || 0;
}

function getGridFirstColumn(element) {
  const template = getComputedStyle(element).gridTemplateColumns;
  return parseFloat(template.split(' ')[0]) || 0;
}

function getBorderTopWidth(element) {
  return parseFloat(getComputedStyle(element).borderTopWidth) || 0;
}

function toHex(color) {
  if (color.startsWith('#')) return color.slice(0, 7);
  const values = color.match(/\d+/g);
  if (!values) return '#000000';
  return `#${values.slice(0, 3).map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`;
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#inspector') || event.target.closest('.side-nav') || event.target.closest('.theme-bar') || event.target.closest('.token-dialog') || event.target.closest('.scroll-controls')) return;
  const editable = resolveEditable(event.target);
  if (!editable) {
    closeInspector();
    return;
  }
  if (event.target.closest('a, button') && !editable.closest('#pages')) event.preventDefault();
  event.stopPropagation();
  openInspector(editable);
});

closeInspectorButton.addEventListener('click', closeInspector);
resetButton.addEventListener('click', resetSelection);
copyButton.addEventListener('click', copyConfig);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !tokenDialog.open) {
    event.preventDefault();
    if (event.shiftKey) redoEditorChange();
    else undoEditorChange();
    return;
  }
  if (event.key === 'Escape') closeInspector();
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-editable]')) {
    event.preventDefault();
    openInspector(resolveEditable(event.target) || event.target);
  }
});

document.querySelectorAll('[data-add-token]').forEach((button) => {
  button.addEventListener('click', () => openTokenDialog(button.dataset.addToken));
});
tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveTokenFromDialog();
});
document.querySelector('#closeTokenDialog').addEventListener('click', () => tokenDialog.close());
document.querySelector('#cancelTokenDialog').addEventListener('click', () => tokenDialog.close());
themeSelect.addEventListener('change', () => {
  const theme = themeStore.themes.find((item) => item.id === themeSelect.value);
  if (theme) applyTheme(theme);
});
document.querySelector('#newTheme').addEventListener('click', createTheme);
document.querySelector('#saveTheme').addEventListener('click', saveActiveTheme);
document.querySelector('#renameTheme').addEventListener('click', renameActiveTheme);
document.querySelector('#deleteTheme').addEventListener('click', deleteActiveTheme);
document.querySelector('#exportTheme').addEventListener('click', exportActiveTheme);
document.querySelector('#importTheme').addEventListener('click', () => document.querySelector('#themeFileInput').click());
document.querySelector('#themeFileInput').addEventListener('change', (event) => {
  if (event.target.files[0]) importThemeFile(event.target.files[0]);
  event.target.value = '';
});

function isRowScroller(node) {
  return node?.classList.contains('is-horizontal') || node?.classList.contains('evidence-gallery');
}

document.querySelectorAll('.card-grid, .image-grid, .highlight-band').forEach((scroller) => {
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  scroller.addEventListener('pointerdown', (event) => {
    if (!isRowScroller(scroller) || event.target.closest('input, button, a, [data-kind="image-child"]')) return;
    dragging = true;
    startX = event.clientX;
    startScroll = scroller.scrollLeft;
    scroller.setPointerCapture(event.pointerId);
  });
  scroller.addEventListener('pointermove', (event) => {
    if (dragging) scroller.scrollLeft = startScroll - (event.clientX - startX);
  });
  scroller.addEventListener('pointerup', () => dragging = false);
  scroller.addEventListener('pointercancel', () => dragging = false);
  scroller.addEventListener('keydown', (event) => {
    if (!isRowScroller(scroller) || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const columns = Math.max(2, Number(componentState[scroller.dataset.componentId]?.columns || 2));
    scroller.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * scroller.clientWidth / columns, behavior: 'smooth' });
  });
});

document.addEventListener('wheel', (event) => {
  const scroller = event.target.closest?.('.is-horizontal, .evidence-gallery');
  if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (!delta) return;
  event.preventDefault();
  scroller.scrollBy({ left: delta, behavior: 'auto' });
}, { passive: false, capture: true });

const navLinks = [...document.querySelectorAll('.side-nav nav a')];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-20% 0px -70%' });
sections.forEach((section) => observer.observe(section));

const documentNav = document.querySelector('[data-component-id="navigation"]');
if (documentNav) {
  const documentNavLinks = [...documentNav.querySelectorAll('a')];
  const documentSections = documentNavLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const documentObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      documentNavLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-18% 0px -72%' });
  documentSections.forEach((section) => documentObserver.observe(section));
}

document.querySelectorAll('[data-component-root]').forEach((component) => component.tabIndex = 0);
applyTheme(activeTheme);

function bindMediaSwitches(scope = document) {
  const figures = [];
  if (scope.matches?.('.media-switch')) figures.push(scope);
  if (scope.querySelectorAll) figures.push(...scope.querySelectorAll('.media-switch'));
  figures.forEach((figure) => {
    if (figure.dataset.switchReady) return;
    figure.dataset.switchReady = '1';
    const main = figure.querySelector('[data-media-main]');
    const thumbs = [...figure.querySelectorAll('.media-switch__thumb')];
    figure.addEventListener('click', (event) => {
      const thumb = event.target.closest('.media-switch__thumb');
      if (thumb && figure.contains(thumb)) {
        event.preventDefault();
        event.stopPropagation();
        figure.classList.remove('is-open');
        thumbs.forEach((item) => item.classList.toggle('is-active', item === thumb));
        const alt = thumb.getAttribute('data-alt') || '';
        const src = thumb.getAttribute('data-src') || '';
        if (main) {
          if (main.tagName === 'IMG') {
            if (src) main.src = src;
            main.alt = alt;
          } else if (alt) {
            main.textContent = alt;
          }
        }
        return;
      }
      const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const hoverOn = figure.getAttribute('data-hover') !== 'off';
      if (
        figure.classList.contains('is-cover')
        && !(hoverOn && fineHover)
        && !event.target.closest('.media-switch__thumbs, .media-switch__panel, .media-switch__label')
      ) {
        event.preventDefault();
        event.stopPropagation();
        figure.classList.toggle('is-open');
      }
    });
  });
}

bindMediaSwitches();
formatCalloutText();
formatStatValues();
document.querySelectorAll('[data-image-kind="strip"] .evidence-window').forEach((windowNode) => {
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
document.querySelectorAll('.evidence-gallery').forEach((gallery) => {
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
document.querySelectorAll('.card-grid, .image-grid, .highlight-band').forEach((grid) => {
  if (isEvidenceRow(grid)) {
    applyEvidenceRow(grid);
    return;
  }
  const count = componentState[grid.dataset.componentId]?.itemCount || [...grid.children].filter((item) => !item.classList.contains('scroll-controls') && !item.classList.contains('is-component-item-hidden')).length;
  ensureEvenGrid(grid, count);
});
document.querySelectorAll('#pages .page-regions').forEach((regions) => syncRegionTracks(regions));
document.querySelectorAll('.component-frame > .media-switch, .page-region > .media-switch, .page-region > .evidence-figure').forEach(observeEvidenceLayout);
syncPageModuleHeight();
window.addEventListener('resize', syncPageModuleHeight);
