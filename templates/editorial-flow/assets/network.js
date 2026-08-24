(function () {
  const host = document.querySelector('.hotel-city-network');
  if (!host) return;

  const DEMO = {
    sampleDate: '2026-09-18',
    origins: ['上海', '北京', '杭州', '广州', '苏州', '成都'],
    destinations: [
      { city: '三亚', type: '度假城市', signal: '长住、滨海度假与酒店场景集中', verifiedOriginCount: 15, flightOriginCount: 15, railOriginCount: 0 },
      { city: '昆明', type: '度假城市', signal: '避暑、云南中转与气候型长住', verifiedOriginCount: 15, flightOriginCount: 13, railOriginCount: 5 },
      { city: '北京', type: '热门城市', signal: '携程、飞猪与美团热门目的地榜单高频城市', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 13 },
      { city: '上海', type: '热门城市', signal: '携程、飞猪与美团热门目的地榜单高频城市', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 11 },
      { city: '成都', type: '热门城市', signal: '休闲旅游、城市度假和文旅消费热度突出', verifiedOriginCount: 13, flightOriginCount: 10, railOriginCount: 6 },
      { city: '杭州', type: '热门城市', signal: '主流目的地榜单高频，周末游需求稳定', verifiedOriginCount: 14, flightOriginCount: 11, railOriginCount: 7 },
      { city: '南京', type: '热门城市', signal: '城市旅游和长三角短途度假需求', verifiedOriginCount: 14, flightOriginCount: 8, railOriginCount: 8 },
      { city: '广州', type: '热门城市', signal: '主流目的地榜单高频，华南交通枢纽', verifiedOriginCount: 14, flightOriginCount: 12, railOriginCount: 8 },
    ],
    routes: [
      { origin: '北京', destination: '三亚', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has', date: '2026-09-18' }, queryStatus: 'ok' },
      { origin: '北京', destination: '昆明', modes: ['flight', 'rail'], flights: [], rail: { trains: ['K123'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '北京', destination: '上海', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G7'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '北京', destination: '成都', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G89'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '北京', destination: '杭州', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G35'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '北京', destination: '南京', modes: ['rail'], flights: [], rail: { trains: ['G5'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '北京', destination: '广州', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '上海', destination: '三亚', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '上海', destination: '北京', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G2'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '上海', destination: '昆明', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '杭州', destination: '三亚', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '杭州', destination: '北京', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G36'], note: '可办宠物托运' }, queryStatus: 'ok' },
      { origin: '广州', destination: '三亚', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '广州', destination: '北京', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '成都', destination: '三亚', modes: ['flight'], flights: [], rail: null, manualFlight: { status: 'has' }, queryStatus: 'ok' },
      { origin: '成都', destination: '昆明', modes: ['flight', 'rail'], flights: [], rail: { trains: ['G2821'], note: '可办宠物托运' }, queryStatus: 'ok' },
    ],
  };

  const data = window.PET_TRAVEL_NETWORK || DEMO;
  const originList = host.querySelector('#originList');
  const destinationList = host.querySelector('#destinationList');
  const connectionArea = host.querySelector('#connectionArea');
  const networkSvg = host.querySelector('#networkSvg');
  const networkStatus = host.querySelector('#networkStatus');
  const originSummary = host.querySelector('#originSummary');
  const connectionEmpty = host.querySelector('#connectionEmpty');
  const routeDetail = host.querySelector('#routeDetail');
  const rows = host.querySelector('#top20Rows');
  const search = host.querySelector('#citySearch');
  const typeSelect = host.querySelector('#cityType');
  const analysisLead = host.querySelector('#analysisLead');
  const anyCoverageStat = host.querySelector('#anyCoverageStat');
  const flightCoverageStat = host.querySelector('#flightCoverageStat');
  const railCoverageStat = host.querySelector('#railCoverageStat');
  const anyCoverageText = host.querySelector('#anyCoverageText');
  const flightCoverageText = host.querySelector('#flightCoverageText');
  const railCoverageText = host.querySelector('#railCoverageText');
  const analysisConclusion = host.querySelector('#analysisConclusion');
  const originLabel = host.querySelector('.city-column.origins .column-label');
  const sampleDateText = host.querySelector('#sampleDateText');
  const networkStage = host.querySelector('#networkStage');
  if (!originList || !destinationList || !networkSvg || !data) return;

  let selectedOrigin = data.origins.includes('北京') ? '北京' : data.origins[0];
  let selectedDestination = null;
  let selectedMode = 'all';

  if (sampleDateText) sampleDateText.textContent = data.sampleDate || '';
  if (originLabel) originLabel.textContent = `出发城市 · ${data.origins.length}`;

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
    const travelLeaders = rankedDestinations.filter((item) => ['昆明', '丽江', '厦门', '西双版纳', '大理', '桂林'].includes(item.city)).slice(0, 2).map((item) => item.city).join('、');
    analysisLead.textContent = `本轮共核验 ${total} 组出发地—目的地组合，${any} 组至少有一种可行方式，占 ${percent(any)}；其中 ${both} 组可以同时选择飞机和高铁。整体供给已经覆盖大部分重点城市对，但不同方式的覆盖范围差异明显。`;
    if (anyCoverageStat) anyCoverageStat.textContent = `${percent(any)} 城市对至少一种方式可达`;
    if (flightCoverageStat) flightCoverageStat.textContent = `${percent(flight)} 城市对有直飞航班`;
    if (railCoverageStat) railCoverageStat.textContent = `${percent(rail)} 城市对有宠物托运高铁`;
    if (anyCoverageText) anyCoverageText.textContent = `${any}/${total} 组城市对至少有一种可行方式，反映重点客源城市到 Top 20 候选目的地的整体通达性。`;
    if (flightCoverageText) flightCoverageText.textContent = `${flight}/${total} 组城市对可乘飞机直达。飞机覆盖更广，尤其支撑三亚、乌鲁木齐、丽江和西双版纳等长距离旅行目的地。`;
    if (railCoverageText) railCoverageText.textContent = `${rail}/${total} 组城市对核到可办理宠物托运的直达高铁。高铁供给集中在少数主干城市对，补充部分直达需求。`;
    if (analysisConclusion) {
      analysisConclusion.innerHTML = `<strong>对酒店布局的启示：</strong>${leaders}连接的客源城市最多，${next}紧随其后；典型度假城市中，${travelLeaders || '昆明'}的通达性也较好。第一批城市可优先考虑这些高通达目的地，再结合当地旅游需求、宠物友好酒店供给和季节性确定最终顺序。`;
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
        ? (route.modes.length > 1 ? '双方式' : route.modes[0] === 'flight' ? '飞机' : '高铁')
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
      routeDetail.innerHTML = `<h3>${selectedOrigin} → ${selectedDestination}</h3><p>样本日期没有核到符合当前政策范围的直飞航班，也没有本地已核高铁车次。这不代表长期无服务。</p>`;
      return;
    }
    const flightText = route.flights?.length
      ? route.flights.slice(0, 3).map((flight) => {
        const dep = (flight.departure || '').slice(11, 16);
        const arr = (flight.arrival || '').slice(11, 16);
        return `${flight.airline} ${flight.flightNo} · ${dep}–${arr}${flight.price ? ` · 人票约 ¥${flight.price}` : ''}`;
      }).join('<br>')
      : route.manualFlight?.status === 'has'
        ? `人工核验存在直飞 · ${route.manualFlight.date || data.sampleDate}`
        : '';
    const railText = route.rail ? `${(route.rail.trains || []).join(' / ')} · ${route.rail.note || ''}` : '';
    routeDetail.innerHTML = `<h3>${selectedOrigin} → ${selectedDestination}</h3>${flightText ? `<p><strong>✈ 飞机</strong><br>${flightText}</p>` : ''}${railText ? `<p><strong>🚆 高铁</strong><br>${railText}</p>` : ''}`;
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
        networkSvg.insertAdjacentHTML('beforeend', `<path class="route-line ${mode === 'rail' ? 'rail' : ''}" d="${path}" data-destination="${route.destination}"><title>${selectedOrigin} → ${route.destination} · ${mode === 'rail' ? '高铁' : '飞机'}</title></path>`);
        const t = Math.min(0.76, 0.18 + (routeIndex / Math.max(currentRoutes.length - 1, 1)) * 0.52 + modeIndex * 0.07);
        const pt = cubicPoint(Math.min(0.78, t), p0, p1, p2, p3);
        networkSvg.insertAdjacentHTML('beforeend', `<text class="route-icon" x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}" text-anchor="middle">${mode === 'rail' ? '🚆' : '✈'}</text>`);
      });
    });
    if (connectionEmpty) connectionEmpty.hidden = currentRoutes.length > 0;
  }

  function renderSummary() {
    const stat = statusForOrigin(selectedOrigin);
    const routes = data.routes.filter((route) => route.origin === selectedOrigin && connected(route) && route.destination !== selectedOrigin);
    const flight = routes.filter((route) => route.modes.includes('flight')).length;
    const rail = routes.filter((route) => route.rail || route.modes.includes('rail')).length;
    if (originSummary) originSummary.innerHTML = `<b>${selectedOrigin}出发</b><p>已核 ${stat.connected} 个目的地 · 飞机 ${flight} · 高铁 ${rail}${stat.pending ? ` · <span class="pending">${stat.pending} 组待补查</span>` : ''}</p>`;
    if (networkStatus) networkStatus.textContent = `${selectedOrigin}已核 ${stat.connected} 个目的地${stat.pending ? `，${stat.pending} 组待补查` : ''}`;
  }

  function renderTable() {
    if (!rows) return;
    const query = (search?.value || '').trim().toLowerCase();
    const type = typeSelect?.value || 'all';
    const sorted = rankedDestinations.filter((item) => (type === 'all' || item.type === type) && (!query || `${item.city}${item.type}${item.signal}`.toLowerCase().includes(query)));
    rows.innerHTML = sorted.map((item) => {
      const rank = rankByCity.get(item.city);
      const modes = [item.flightOriginCount ? `✈ ${item.flightOriginCount}` : '', item.railOriginCount ? `🚆 ${item.railOriginCount}` : ''].filter(Boolean).join(' · ') || '待补';
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
  host.querySelectorAll('.mode-filter button').forEach((button) => button.addEventListener('click', () => {
    selectedMode = button.dataset.mode;
    host.querySelectorAll('.mode-filter button').forEach((item) => item.classList.toggle('active', item === button));
    selectedDestination = null;
    if (routeDetail) routeDetail.hidden = true;
    renderAll();
  }));
  search?.addEventListener('input', renderTable);
  typeSelect?.addEventListener('change', renderTable);
  window.addEventListener('resize', () => requestAnimationFrame(renderLines));
  renderAll();
  renderTable();
  renderAnalysis();
})();
