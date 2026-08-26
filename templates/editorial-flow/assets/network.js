(function () {
  const host = document.querySelector('.hotel-city-network');
  const tableHost = document.querySelector('.network-node-table') || host;
  if (!host && !tableHost) return;

  const MODE_LABEL = { flight: '方式 A', rail: '方式 B' };

  const DEMO = {
    sampleDate: '2026-09-18',
    origins: ['起点 A', '起点 B', '起点 C', '起点 D', '起点 E', '起点 F'],
    destinations: [
      { city: '终点 01', type: '类型甲', signal: '信号：长住、集中场景', verifiedOriginCount: 15, flightOriginCount: 15, railOriginCount: 0 },
      { city: '终点 02', type: '类型甲', signal: '信号：中转与季节性需求', verifiedOriginCount: 15, flightOriginCount: 13, railOriginCount: 5 },
      { city: '终点 03', type: '类型乙', signal: '信号：高频目的地', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 13 },
      { city: '终点 04', type: '类型乙', signal: '信号：高频目的地', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 11 },
      { city: '终点 05', type: '类型乙', signal: '信号：休闲与消费热度', verifiedOriginCount: 13, flightOriginCount: 10, railOriginCount: 6 },
      { city: '终点 06', type: '类型乙', signal: '信号：周末短途稳定', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 7 },
      { city: '终点 07', type: '类型乙', signal: '信号：区域短途需求', verifiedOriginCount: 14, flightOriginCount: 8, railOriginCount: 8 },
    ],
    routes: [
      { origin: '起点 A', destination: '终点 01', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has', date: '2026-09-18' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 02', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-01'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 03', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-02'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 04', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-03'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 05', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-04'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 06', modes: ['rail'], flights: [], rail: { trains: ['B-05'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 A', destination: '终点 07', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 B', destination: '终点 01', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 B', destination: '终点 03', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-06'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 B', destination: '终点 02', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 C', destination: '终点 01', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 C', destination: '终点 03', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-07'], note: '方式 B 可办' }, queryStatus: 'ok' },
      { origin: '起点 D', destination: '终点 01', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 D', destination: '终点 03', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 E', destination: '终点 01', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '起点 F', destination: '终点 02', modes: ['flight', 'rail'], flights: [], rail: { trains: ['B-08'], note: '方式 B 可办' }, queryStatus: 'ok' },
    ],
  };

  const data = window.NETWORK_DATA || window.PET_TRAVEL_NETWORK || DEMO;
  const q = (root, sel) => root?.querySelector(sel);
  const originList = q(host, '#originList');
  const destinationList = q(host, '#destinationList');
  const connectionArea = q(host, '#connectionArea');
  const networkSvg = q(host, '#networkSvg');
  const networkStatus = q(host, '#networkStatus');
  const originSummary = q(host, '#originSummary');
  const connectionEmpty = q(host, '#connectionEmpty');
  const routeDetail = q(host, '#routeDetail');
  const rows = q(tableHost, '#top20Rows');
  const search = q(tableHost, '#citySearch');
  const typeSelect = q(tableHost, '#cityType');
  const analysisLead = q(host, '#analysisLead');
  const anyCoverageStat = q(host, '#anyCoverageStat');
  const flightCoverageStat = q(host, '#flightCoverageStat');
  const railCoverageStat = q(host, '#railCoverageStat');
  const anyCoverageText = q(host, '#anyCoverageText');
  const flightCoverageText = q(host, '#flightCoverageText');
  const railCoverageText = q(host, '#railCoverageText');
  const analysisConclusion = q(host, '#analysisConclusion');
  const originLabel = q(host, '.city-column.origins .column-label');
  const sampleDateText = q(host, '#sampleDateText');
  const networkStage = q(host, '#networkStage');
  const hasNetwork = !!(originList && destinationList && networkSvg && data);
  if (!hasNetwork && !rows) return;

  let selectedOrigin = data.origins[0];
  let selectedDestination = null;
  let selectedMode = 'all';

  if (sampleDateText) sampleDateText.textContent = data.sampleDate || '';
  if (originLabel) originLabel.textContent = `起点 · ${data.origins.length}`;

  const rankedDestinations = [...data.destinations]
    .sort((a, b) => b.verifiedOriginCount - a.verifiedOriginCount || data.destinations.indexOf(a) - data.destinations.indexOf(b));
  const rankByCity = new Map(rankedDestinations.map((item, index) => [item.city, index + 1]));

  const connected = (route) => route.modes && route.modes.some((mode) => selectedMode === 'all' || mode === selectedMode);
  const routeFor = (origin, destination) => data.routes.find((route) => route.origin === origin && route.destination === destination);
  const statusForOrigin = (origin) => {
    const routes = data.routes.filter((route) => route.origin === origin);
    return {
      connected: routes.filter(connected).length,
      pending: routes.filter((route) => route.queryStatus === 'failed').length,
    };
  };

  const visibleDestinations = () => rankedDestinations.filter((item) => item.city !== selectedOrigin);

  const cubicPoint = (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };

  function renderAnalysis() {
    if (!analysisLead) return;
    const total = data.routes.length || 1;
    const any = data.routes.filter((route) => route.modes?.length).length;
    const flight = data.routes.filter((route) => route.modes?.includes('flight')).length;
    const rail = data.routes.filter((route) => route.modes?.includes('rail')).length;
    const both = data.routes.filter((route) => route.modes?.includes('flight') && route.modes?.includes('rail')).length;
    const percent = (count) => `${Math.round((count / total) * 100)}%`;
    const leaders = rankedDestinations.slice(0, 2).map((item) => item.city).join('、');
    const next = rankedDestinations.slice(2, 7).map((item) => item.city).join('、');
    analysisLead.textContent = `本轮共核验 ${total} 组起点—终点组合，${any} 组至少有一种连通方式，占 ${percent(any)}；其中 ${both} 组可以同时选择方式 A 和方式 B。整体覆盖大部分重点节点对，但两种方式的覆盖范围差异明显。`;
    if (anyCoverageStat) anyCoverageStat.textContent = `${percent(any)} 节点对至少一种方式可达`;
    if (flightCoverageStat) flightCoverageStat.textContent = `${percent(flight)} 节点对有方式 A`;
    if (railCoverageStat) railCoverageStat.textContent = `${percent(rail)} 节点对有方式 B`;
    if (anyCoverageText) anyCoverageText.textContent = `${any}/${total} 组节点对至少有一种可行方式，反映重点起点到候选终点的整体连通性。`;
    if (flightCoverageText) flightCoverageText.textContent = `${flight}/${total} 组节点对可用方式 A 直达。方式 A 覆盖更广，尤其支撑长距离终点。`;
    if (railCoverageText) railCoverageText.textContent = `${rail}/${total} 组节点对核到方式 B。方式 B 集中在少数主干节点对，补充部分直达需求。`;
    if (analysisConclusion) {
      analysisConclusion.innerHTML = `<strong>布局启示：</strong>${leaders}连接的起点最多，${next}紧随其后。第一批可优先这些高连通终点，再结合当地需求、供给和季节性确定顺序。`;
    }
  }

  function renderOrigins() {
    originList.innerHTML = data.origins.map((origin) => {
      const stat = statusForOrigin(origin);
      const empty = stat.connected === 0 ? ' is-empty' : '';
      const on = origin === selectedOrigin ? ' active' : '';
      return `<button class="city-button${on}${empty}" data-origin="${origin}"><strong>${origin}</strong><small>${stat.connected} 条</small></button>`;
    }).join('');
    originList.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      selectedOrigin = button.dataset.origin;
      selectedDestination = null;
      if (routeDetail) routeDetail.hidden = true;
      renderAll();
    }));
  }

  function renderDestinations() {
    destinationList.innerHTML = visibleDestinations().map((destination, index) => {
      const route = routeFor(selectedOrigin, destination.city);
      const available = route && connected(route);
      const pending = route && route.queryStatus === 'failed';
      const state = available
        ? (route.modes.length > 1 ? '双方式' : MODE_LABEL[route.modes[0]] || route.modes[0])
        : pending ? '待补查' : '';
      const on = destination.city === selectedDestination ? ' active' : '';
      return `<div class="destination-row${on}" data-destination="${destination.city}" data-available="${available ? 'yes' : 'no'}"><span class="rank">${String(index + 1).padStart(2, '0')}</span><strong>${destination.city}</strong><small>${state}</small></div>`;
    }).join('');
    destinationList.querySelectorAll('.destination-row').forEach((row) => row.addEventListener('click', () => {
      selectedDestination = row.dataset.destination;
      renderDestinations();
      renderRouteDetail();
    }));
  }

  function renderRouteDetail() {
    if (!routeDetail) return;
    const route = routeFor(selectedOrigin, selectedDestination);
    routeDetail.hidden = false;
    if (!route || route.queryStatus === 'failed') {
      routeDetail.innerHTML = `<h3>${selectedOrigin} → ${selectedDestination}</h3><p class="pending">本轮查询未完成，先标为待补查，不作不可行判断。</p>`;
      return;
    }
    if (!route.modes.length) {
      routeDetail.innerHTML = `<h3>${selectedOrigin} → ${selectedDestination}</h3><p>样本日期没有核到方式 A，也没有已核的方式 B。这不代表长期无连接。</p>`;
      return;
    }
    const flightText = route.flights?.length
      ? route.flights.slice(0, 3).map((flight) => {
        const dep = (flight.departure || '').slice(11, 16);
        const arr = (flight.arrival || '').slice(11, 16);
        return `${flight.airline} ${flight.flightNo} · ${dep}–${arr}${flight.price ? ` · 约 ¥${flight.price}` : ''}`;
      }).join('<br>')
      : route.manualFlight?.status === 'has'
        ? `人工核验存在直达 · ${route.manualFlight.date || data.sampleDate}`
        : '';
    const railText = route.rail ? `${(route.rail.trains || []).join(' / ')} · ${route.rail.note || ''}` : '';
    routeDetail.innerHTML = `<h3>${selectedOrigin} → ${selectedDestination}</h3>${flightText ? `<p><strong>${MODE_LABEL.flight}</strong><br>${flightText}</p>` : ''}${railText ? `<p><strong>${MODE_LABEL.rail}</strong><br>${railText}</p>` : ''}`;
  }

  function renderLines() {
    networkSvg.innerHTML = '';
    if (!connectionArea || !networkStage) return;
    const originButton = originList.querySelector(`[data-origin="${selectedOrigin}"]`);
    if (!originButton) return;
    const areaRect = connectionArea.getBoundingClientRect();
    const stageRect = networkStage.getBoundingClientRect();
    const originRect = originButton.getBoundingClientRect();
    const startY = originRect.top + originRect.height / 2 - stageRect.top;
    const x1 = 0;
    const x2 = areaRect.width;
    const currentRoutes = data.routes.filter((route) => route.origin === selectedOrigin && connected(route) && route.destination !== selectedOrigin);
    currentRoutes.forEach((route, routeIndex) => {
      const target = destinationList.querySelector(`[data-destination="${route.destination}"]`);
      if (!target) return;
      const targetRect = target.getBoundingClientRect();
      const endY = targetRect.top + targetRect.height / 2 - stageRect.top;
      const modes = route.modes.filter((mode) => selectedMode === 'all' || mode === selectedMode);
      modes.forEach((mode, modeIndex) => {
        const offset = modes.length > 1 ? (modeIndex === 0 ? -5 : 5) : 0;
        const curve = Math.max(65, Math.abs(endY - startY) * 0.24);
        const p0 = { x: x1, y: startY + offset };
        const p1 = { x: curve, y: startY + offset };
        const p2 = { x: x2 - curve, y: endY + offset };
        const p3 = { x: x2, y: endY + offset };
        const path = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
        const label = MODE_LABEL[mode] || mode;
        networkSvg.insertAdjacentHTML('beforeend', `<path class="route-line ${mode === 'rail' ? 'rail' : ''}" d="${path}" data-destination="${route.destination}"><title>${selectedOrigin} → ${route.destination} · ${label}</title></path>`);
        const t = Math.min(0.76, 0.18 + (routeIndex / Math.max(currentRoutes.length - 1, 1)) * 0.52 + modeIndex * 0.07);
        const pt = cubicPoint(Math.min(0.78, t), p0, p1, p2, p3);
        networkSvg.insertAdjacentHTML('beforeend', `<text class="route-icon" x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}" text-anchor="middle">${mode === 'rail' ? 'B' : 'A'}</text>`);
      });
    });
    if (connectionEmpty) connectionEmpty.hidden = currentRoutes.length > 0;
  }

  function renderSummary() {
    const stat = statusForOrigin(selectedOrigin);
    const routes = data.routes.filter((route) => route.origin === selectedOrigin && connected(route) && route.destination !== selectedOrigin);
    const flight = routes.filter((route) => route.modes.includes('flight')).length;
    const rail = routes.filter((route) => route.rail || route.modes.includes('rail')).length;
    if (originSummary) originSummary.innerHTML = `<b>${selectedOrigin}</b><p>已核 ${stat.connected} 个终点 · ${MODE_LABEL.flight} ${flight} · ${MODE_LABEL.rail} ${rail}${stat.pending ? ` · <span class="pending">${stat.pending} 组待补查</span>` : ''}</p>`;
    if (networkStatus) networkStatus.textContent = `${selectedOrigin}已核 ${stat.connected} 个终点${stat.pending ? `，${stat.pending} 组待补查` : ''}`;
  }

  function renderTable() {
    if (!rows) return;
    const query = (search?.value || '').trim().toLowerCase();
    const type = typeSelect?.value || 'all';
    const sorted = rankedDestinations.filter((item) => (type === 'all' || item.type === type) && (!query || `${item.city}${item.type}${item.signal}`.toLowerCase().includes(query)));
    rows.innerHTML = sorted.map((item) => {
      const rank = rankByCity.get(item.city);
      const modes = [item.flightOriginCount ? `${MODE_LABEL.flight} ${item.flightOriginCount}` : '', item.railOriginCount ? `${MODE_LABEL.rail} ${item.railOriginCount}` : ''].filter(Boolean).join(' · ') || '待补';
      return `<tr><td>${String(rank).padStart(2, '0')}</td><td>${item.city}</td><td><span class="tag">${item.type}</span></td><td>${item.signal}</td><td><span class="coverage-number">${item.verifiedOriginCount}</span> / ${data.origins.length}</td><td>${modes}</td></tr>`;
    }).join('');
  }

  function renderAll() {
    renderOrigins();
    renderDestinations();
    renderSummary();
    requestAnimationFrame(renderLines);
  }

  if (typeSelect && !typeSelect.dataset.filled) {
    [...new Set(data.destinations.map((item) => item.type))].forEach((type) => {
      typeSelect.insertAdjacentHTML('beforeend', `<option value="${type}">${type}</option>`);
    });
    typeSelect.dataset.filled = '1';
  }
  host?.querySelectorAll('.mode-filter button').forEach((button) => button.addEventListener('click', () => {
    selectedMode = button.dataset.mode;
    host.querySelectorAll('.mode-filter button').forEach((item) => item.classList.toggle('active', item === button));
    selectedDestination = null;
    if (routeDetail) routeDetail.hidden = true;
    renderAll();
  }));
  search?.addEventListener('input', renderTable);
  typeSelect?.addEventListener('change', renderTable);
  if (hasNetwork) {
    window.addEventListener('resize', () => requestAnimationFrame(renderLines));
    renderAll();
    renderAnalysis();
  }
  renderTable();
})();
