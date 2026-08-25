(() => {
  const DS = window.DesignSystemData;
  if (!DS) throw new Error('DesignSystemData 未加载');

  const root = document.documentElement;
  const listeners = new Set();

  function clone(value) {
    return DS.clone(value);
  }

  function validateEditorial(tokens) {
    if (!Array.isArray(tokens)) return false;
    const variables = new Set();
    for (const token of tokens) {
      if (!token?.id || !token?.name || !token?.variable || !String(token.value || '').trim()) return false;
      if (variables.has(token.variable)) return false;
      variables.add(token.variable);
    }
    return true;
  }

  function validateTheme(theme) {
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
    if (theme.tokens.editorial && !validateEditorial(theme.tokens.editorial)) return false;
    return true;
  }

  function loadThemeStore() {
    const builtIns = DS.createBuiltInThemes();
    try {
      const saved = JSON.parse(localStorage.getItem(DS.storageKey));
      if (saved?.version === DS.version && Array.isArray(saved.themes) && saved.themes.length) {
        const savedById = new Map(saved.themes.map((theme) => [theme.id, theme]));
        const themes = builtIns.map((builtIn) => {
          const savedTheme = savedById.get(builtIn.id);
          if (!savedTheme?.tokens || !validateTheme(savedTheme)) return builtIn;
          return {
            ...clone(builtIn),
            name: savedTheme.name || builtIn.name,
            tokens: clone(savedTheme.tokens),
            components: clone(savedTheme.components || builtIn.components),
            componentStyles: clone(savedTheme.componentStyles || {}),
            builtIn: true
          };
        });
        const builtInIds = new Set(builtIns.map((theme) => theme.id));
        saved.themes.forEach((theme) => {
          if (!theme.builtIn && !builtInIds.has(theme.id) && validateTheme(theme)) {
            themes.push(clone(theme));
          }
        });
        const activeThemeId = themes.some((theme) => theme.id === saved.activeThemeId)
          ? saved.activeThemeId
          : themes[0].id;
        return { version: DS.version, themes, activeThemeId };
      }
    } catch (_) {
      /* use built-ins */
    }
    return { version: DS.version, themes: builtIns, activeThemeId: builtIns[0].id };
  }

  let store = loadThemeStore();
  let activeTheme = store.themes.find((theme) => theme.id === store.activeThemeId) || store.themes[0];

  function persist() {
    localStorage.setItem(DS.storageKey, JSON.stringify({
      version: DS.version,
      themes: store.themes,
      activeThemeId: store.activeThemeId
    }));
  }

  function ensureFunctionalTokens(tokens) {
    const defaults = DS.createDefaultTheme().tokens;
    ['colors', 'typeScale', 'radii', 'lineWidths', 'spaces', 'editorial'].forEach((category) => {
      tokens[category] ||= [];
      (defaults[category] || []).forEach((token) => {
        if (!tokens[category].some((item) => item.id === token.id || item.variable === token.variable)) {
          tokens[category].push(clone(token));
        }
      });
    });
    return tokens;
  }

  function displayEditorialValue(token) {
    const raw = String(token.value ?? '').trim();
    if ((token.kind === 'size' || token.kind === 'type') && /^-?\d+(\.\d+)?px$/.test(raw)) {
      return String(parseFloat(raw));
    }
    if (token.kind === 'color') return raw.toUpperCase();
    return raw;
  }

  function hexInputValue(raw) {
    const s = String(raw || '').trim();
    const m6 = s.match(/^#([0-9a-f]{6})$/i);
    if (m6) return `#${m6[1].toLowerCase()}`;
    const m3 = s.match(/^#([0-9a-f]{3})$/i);
    if (!m3) return '';
    const [a, b, c] = m3[1].split('');
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }

  function paintColorSwatch(swatch, value) {
    if (!swatch) return;
    const hex = hexInputValue(value);
    if (swatch.tagName === 'INPUT') {
      if (hex) swatch.value = hex;
      return;
    }
    swatch.style.background = value;
  }

  function syncTokenBoard(scope = document) {
    (activeTheme.tokens.editorial || []).forEach((token) => {
      scope.querySelectorAll(`[data-css-var="${token.variable}"]`).forEach((host) => {
        if (host.closest('[data-edit-text], [contenteditable="true"]')) return;
        const valueEl = host.querySelector('.token-value');
        if (valueEl && !valueEl.isContentEditable) valueEl.textContent = displayEditorialValue(token);
        const swatch = host.querySelector('.token-swatch');
        if (!swatch) return;
        if (token.kind === 'color') paintColorSwatch(swatch, token.value);
        if (token.kind === 'size') {
          const px = /px$/.test(token.value) ? token.value : `${parseFloat(token.value) || 0}px`;
          swatch.style.width = px;
        }
        const sample = host.querySelector('.token-sample');
        if (sample && token.kind === 'type') sample.style.fontSize = token.value;
      });
    });
  }

  function applyTokens(tokens) {
    const next = ensureFunctionalTokens(clone(tokens));
    ['colors', 'typeScale', 'radii', 'lineWidths', 'spaces'].forEach((category) => {
      (next[category] || []).forEach((token) => {
        const unit = category === 'colors' ? '' : 'px';
        root.style.setProperty(token.variable, `${token.value}${unit}`);
        if (category === 'typeScale' && token.lineHeight) {
          root.style.setProperty(`--line-${token.id}`, token.lineHeight);
        }
      });
    });
    (next.editorial || []).forEach((token) => {
      root.style.setProperty(token.variable, token.value);
    });
    Object.entries(next.aliases || {}).forEach(([retired, replacement]) => {
      root.style.setProperty(retired, `var(${replacement})`);
    });
    root.style.setProperty('--border-thin', 'var(--line-thin)');
    root.style.setProperty('--border-accent', 'var(--line-thin)');
    root.style.setProperty('--card-padding', 'var(--space-5)');
    root.style.setProperty('--card-gap', 'var(--space-4)');
    root.style.setProperty('--card-radius', 'var(--radius-sm)');
    syncTokenBoard();
  }

  function notify() {
    listeners.forEach((listener) => listener(activeTheme, store));
  }

  function applyTheme(theme, { persistStore = true } = {}) {
    if (!validateTheme(theme)) throw new Error('主题结构无效');
    activeTheme = clone(theme);
    store.activeThemeId = activeTheme.id;
    if (!store.themes.some((item) => item.id === activeTheme.id)) {
      store.themes.push(activeTheme);
    } else {
      store.themes = store.themes.map((item) => (item.id === activeTheme.id ? activeTheme : item));
    }
    applyTokens(activeTheme.tokens);
    root.dataset.themeId = activeTheme.id;
    if (persistStore) persist();
    notify();
    return activeTheme;
  }

  function setActiveTheme(themeId) {
    const theme = store.themes.find((item) => item.id === themeId);
    if (!theme) throw new Error('主题不存在');
    return applyTheme(theme);
  }

  function guessTokenKind(value) {
    const raw = String(value || '').trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw) || raw.startsWith('rgb')) return 'color';
    if (raw.includes('clamp(') || raw.includes('vw') || raw.includes('em')) return 'type';
    return 'size';
  }

  function updateToken(variable, cssValue) {
    if (!variable || cssValue == null) return activeTheme;
    const value = String(cssValue).trim();
    if (!value) return activeTheme;
    activeTheme.tokens = ensureFunctionalTokens(activeTheme.tokens);
    activeTheme.tokens.editorial ||= [];
    let token = activeTheme.tokens.editorial.find((item) => item.variable === variable);
    if (!token) {
      token = {
        id: variable.replace(/^--/, ''),
        name: variable,
        variable,
        value,
        kind: guessTokenKind(value),
      };
      activeTheme.tokens.editorial.push(token);
    } else {
      token.value = value;
      if (!token.kind) token.kind = guessTokenKind(value);
    }
    return applyTheme(activeTheme);
  }

  function exportThemeFile() {
    const payload = { version: DS.version, theme: clone(activeTheme) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safe = (activeTheme.name || 'theme').replace(/[^\w\u4e00-\u9fff-]+/g, '-');
    link.href = url;
    link.download = `${safe}.theme.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return payload;
  }

  async function importThemeFile(file) {
    const data = JSON.parse(await file.text());
    if (data.version !== DS.version || !validateTheme(data.theme)) {
      throw new Error('版本或 Token 结构不匹配');
    }
    const imported = clone(data.theme);
    imported.id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    imported.name = store.themes.some((theme) => theme.name === imported.name)
      ? `${imported.name} 导入`
      : imported.name;
    imported.builtIn = false;
    store.themes.push(imported);
    return applyTheme(imported);
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function mountThemeControl(rootEl) {
    if (!rootEl) return;
    const select = rootEl.querySelector('[data-theme-select]');
    const importInput = rootEl.querySelector('[data-theme-import]');
    const importButton = rootEl.querySelector('[data-theme-import-trigger]');
    const exportButton = rootEl.querySelector('[data-theme-export]');
    const nameNode = rootEl.querySelector('[data-theme-name]');
    const toast = rootEl.querySelector('[data-theme-toast]');

    const showToast = (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('is-visible');
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
    };

    const render = () => {
      if (nameNode) nameNode.textContent = activeTheme.name;
      if (!select) return;
      select.innerHTML = '';
      store.themes.forEach((theme) => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.builtIn ? theme.name : `${theme.name} · 自定义`;
        if (theme.id === activeTheme.id) option.selected = true;
        select.appendChild(option);
      });
    };

    select?.addEventListener('change', () => {
      try {
        setActiveTheme(select.value);
        showToast(`已切换：${activeTheme.name}`);
      } catch (error) {
        showToast(error.message);
      }
    });

    importButton?.addEventListener('click', () => importInput?.click());
    exportButton?.addEventListener('click', () => {
      exportThemeFile();
      showToast(`已导出：${activeTheme.name}`);
    });
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        await importThemeFile(file);
        showToast(`已导入：${activeTheme.name}`);
      } catch (error) {
        showToast(`导入失败：${error.message}`);
      } finally {
        importInput.value = '';
      }
    });

    onChange(render);
    render();
  }

  applyTheme(activeTheme, { persistStore: false });

  window.ThemeRuntime = {
    getActiveTheme: () => clone(activeTheme),
    getThemes: () => clone(store.themes),
    applyTheme,
    setActiveTheme,
    updateToken,
    exportThemeFile,
    importThemeFile,
    onChange,
    mountThemeControl,
    reloadFromStorage() {
      store = loadThemeStore();
      applyTheme(store.themes.find((theme) => theme.id === store.activeThemeId) || store.themes[0]);
    }
  };
})();
