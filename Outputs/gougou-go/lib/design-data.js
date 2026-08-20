/* Single source of token defaults. Design System and templates both load this file. */
(() => {
  const tokens = {
    aliases: {},
    colors: [
      { id: 'paper', name: '页面底色', variable: '--paper', value: '#f4f4f1', group: 'surface' },
      { id: 'surface', name: '内容表面', variable: '--surface', value: '#ffffff', group: 'surface' },
      { id: 'surface-soft', name: '次级表面', variable: '--surface-soft', value: '#e8e8e4', group: 'surface' },
      { id: 'ink', name: '主要文字', variable: '--ink', value: '#171717', group: 'text' },
      { id: 'muted', name: '辅助文字', variable: '--muted', value: '#666666', group: 'text' },
      { id: 'faint', name: '弱化文字', variable: '--faint', value: '#969696', group: 'text' },
      { id: 'inverse', name: '反色文字', variable: '--inverse', value: '#ffffff', group: 'text' },
      { id: 'accent', name: '强调色', variable: '--accent', value: '#171717', group: 'accent' },
      { id: 'accent-soft', name: '强调浅色', variable: '--accent-soft', value: '#deded9', group: 'accent' },
      { id: 'link', name: '链接文字', variable: '--link', value: '#171717', group: 'action' },
      { id: 'link-hover', name: '链接悬停', variable: '--link-hover', value: '#000000', group: 'action' },
      { id: 'success', name: '成功文字', variable: '--success', value: '#2b7358', group: 'status' },
      { id: 'success-bg', name: '成功背景', variable: '--success-bg', value: '#e2efe8', group: 'status' },
      { id: 'warning', name: '警告文字', variable: '--warning', value: '#9a681d', group: 'status' },
      { id: 'warning-bg', name: '警告背景', variable: '--warning-bg', value: '#f5ead5', group: 'status' },
      { id: 'danger', name: '风险文字', variable: '--danger', value: '#b64d3b', group: 'status' },
      { id: 'danger-bg', name: '风险背景', variable: '--danger-bg', value: '#f5e2de', group: 'status' },
      { id: 'line', name: '默认分割线', variable: '--line', value: '#c9c9c3', group: 'border' }
    ],
    typeScale: [
      { id: 'display', name: 'Display', variable: '--text-display', value: 60, lineHeight: 1.41 },
      { id: 'h1', name: 'Heading 1', variable: '--text-h1', value: 42, lineHeight: 1.4 },
      { id: 'h2', name: 'Heading 2', variable: '--text-h2', value: 30, lineHeight: 1.4 },
      { id: 'h3', name: 'Heading 3', variable: '--text-h3', value: 20, lineHeight: 1.4 },
      { id: 'body', name: 'Body', variable: '--text-body', value: 20, lineHeight: 1.4 },
      { id: 'small', name: 'Small', variable: '--text-small', value: 14, lineHeight: 1.4 },
      { id: 'caption', name: 'Caption', variable: '--text-caption', value: 12, lineHeight: 1.4 }
    ],
    radii: [
      { id: 'none', name: '直角', variable: '--radius-none', value: 0 },
      { id: 'sm', name: '小圆角', variable: '--radius-sm', value: 2 },
      { id: 'md', name: '中圆角', variable: '--radius-md', value: 6 },
      { id: 'lg', name: '大圆角', variable: '--radius-lg', value: 24 },
      { id: 'pill', name: '胶囊', variable: '--radius-pill', value: 999 }
    ],
    lineWidths: [
      { id: 'thin', name: '默认线宽', variable: '--line-thin', value: 1 }
    ],
    spaces: [
      { id: '1', name: 'Space 1', variable: '--space-1', value: 4 },
      { id: '2', name: 'Space 2', variable: '--space-2', value: 8 },
      { id: '3', name: 'Space 3', variable: '--space-3', value: 12 },
      { id: '4', name: 'Space 4', variable: '--space-4', value: 14 },
      { id: '5', name: 'Space 5', variable: '--space-5', value: 20 },
      { id: 'gap', name: 'Space Gap', variable: '--space-gap', value: 24 },
      { id: '6', name: 'Space 6', variable: '--space-6', value: 28 },
      { id: '7', name: 'Space 7', variable: '--space-7', value: 48 },
      { id: '8', name: 'Space 8', variable: '--space-8', value: 72 }
    ]
  };

  const components = {
    sectionHeader: {},
    cardGrid: { columns: 3, mode: 'grid', decoration: 'none', itemCount: 6, slideWidth: 0 },
    statGrid: { columns: 4, mode: 'grid', itemCount: 4, slideWidth: 0 },
    labeledList: { itemCount: 3 },
    processSteps: { variant: 'steps', itemCount: 3 },
    dataTable: { variant: 'plain', columns: 3 },
    barCompare: { orientation: 'horizontal', itemCount: 3 },
    mediaCard: { mediaLayout: 'stack', imagePosition: 'top', imageStyle: 'abstract' },
    evidenceGallery: { columns: 3, mode: 'grid', imageStyle: 'document', imageKind: 'photo', imageRatio: '3:4', imageFit: 'fit', itemCount: 3, slideWidth: 0 },
    evidenceShot: { columns: 3, mode: 'grid', imageKind: 'shot', imageRatio: '0.46:1', imageFit: 'fit', itemCount: 3, slideWidth: 0 },
    evidenceStrip: { columns: 1, mode: 'grid', imageKind: 'strip', itemCount: 1, slideWidth: 0 },
    mediaSwitch: { imageRatio: '3:4', imageFit: 'fit' },
    decisionCallout: { decoration: 'none' },
    cardGridHighlight: { columns: 3, mode: 'grid', decoration: 'none', itemCount: 6, slideWidth: 0, tone: 'highlight' },
    navigation: { position: 'top', variant: 'underline', sticky: true }
  };

  window.DesignSystemData = {
    version: 7,
    storageKey: 'knowledge-report-design-system-v7',
    clone(value) {
      return JSON.parse(JSON.stringify(value));
    },
    createDefaultTheme() {
      return {
        id: 'minimal-mono',
        name: 'Minimal Mono',
        builtIn: true,
        tokens: this.clone(tokens),
        components: this.clone(components),
        componentStyles: {}
      };
    },
    createBuiltInThemes() {
      return [this.createDefaultTheme()];
    },
    createCustomTheme(name = '未命名主题') {
      const theme = this.createDefaultTheme();
      theme.id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      theme.name = name;
      theme.builtIn = false;
      return theme;
    }
  };
})();
