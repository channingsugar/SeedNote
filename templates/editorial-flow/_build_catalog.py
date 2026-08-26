#!/usr/bin/env python3
"""Generate editorial-flow/index.html.

从源稿拆出的可复用组件，结构和作用接近的收成一套父组件。
壳用 editorial-flow（report-shell.is-flow / flow-stack / flow-lab）。
不要再收成 flow-h1 / flow-block。
"""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")
IMG = "assets/demo"
CABIN = f"{IMG}/cabin-01.jpg"
CABIN2 = f"{IMG}/cabin-02.jpg"
CARGO = f"{IMG}/air-cargo-01.jpg"
CARGO2 = f"{IMG}/air-cargo-02.jpg"
CARGO3 = f"{IMG}/air-cargo-03.jpg"
RAIL = f"{IMG}/rail-01.jpg"
RAIL5 = f"{IMG}/rail-05.jpg"
ROAD = f"{IMG}/road-01.jpg"
ROAD3 = f"{IMG}/road-03.jpg"
VAN = f"{IMG}/pet-van.jpg"
RIDE = f"{IMG}/ride-together.jpg"
MON = f"{IMG}/monitoring.jpg"
FLOW = f"{IMG}/rail-ota-flow.jpg"
PROFILE = f"{IMG}/pet-profile.png"
DELIVER = f"{IMG}/pet-delivery.png"
METHODS = f"{IMG}/air-methods.png"
POSTER = f"{IMG}/pet-travel.png"


def lab(name, html, el_id=None):
    attr = f' id="{el_id}"' if el_id else ""
    return f'<div class="flow-lab" data-lab="{name}"{attr}>{html}</div>'


def head(kicker, title, sub=None):
    extra = f'<p class="sub">{sub}</p>' if sub else ""
    return (
        f'<header class="slide-head"><div class="kicker">{kicker}</div>'
        f"<h2>{title}</h2>{extra}</header>"
    )


def source_note(*bits):
    inner = " · ".join(bits)
    return f'<p class="source-note">来源：{inner}</p>'


def rule(soft=False):
    return '<hr class="rule is-soft">' if soft else '<hr class="rule">'


def formula():
    def factor(num, unit, label, result=False):
        cls = "market-factor market-result" if result else "market-factor"
        return (
            f'<div class="{cls}"><div class="market-number"><span>{num}</span><i>{unit}</i></div>'
            f'<div class="market-factor-label">{label}</div></div>'
        )

    op = '<div class="market-operator" aria-hidden="true">{}</div>'
    return (
        '<div class="market-formula" aria-label="公式">'
        + factor("A", "单位", "因子：基数")
        + op.format("×")
        + factor("B", "%", "因子：转化率")
        + op.format("×")
        + factor("C", "%", "因子：采用率")
        + op.format("×")
        + factor("D", "次", "因子：频次")
        + op.format("=")
        + factor("N", "次", "结果：把算法写在这里", True)
        + "</div>"
    )


def pain(no, title, lead, items):
    lis = "".join(f"<li>{x}</li>" for x in items)
    return (
        f'<article class="pain-topic"><header class="pain-topic-head">'
        f'<h3><span class="pain-topic-index">{no}</span>{title}</h3>'
        f'<p class="pain-topic-summary">{lead}</p></header>'
        f'<div class="pain-topic-body"><ul class="pain-detail-list">{lis}</ul></div></article>'
    )


def stat_card(num, title, body="", kicker=None, suffix=None, prefix=None, variant=None, accent=False, ratio=None):
    tail = ratio if suffix is None else suffix
    flags = []
    if prefix: flags.append("data-prefix")
    if tail or variant == "note": flags.append("data-suffix")
    if kicker or variant == "note": flags.append("data-kicker")
    cls = "stat-card is-accent" if accent else "stat-card"
    attr = f' class="{cls}"' + (f' {" ".join(flags)}' if flags else "")
    kick = f'<span class="stat-card__kicker">{kicker or ""}</span>'
    pre = f'<span class="stat-card__prefix">{prefix or ""}</span>'
    suf = f'<span class="stat-card__suffix">{tail or ""}</span>'
    para = f"<p>{body}</p>" if body else ""
    return (
        f"<article{attr}>{kick}"
        f'<strong class="stat-card__num">{pre}{num}{suf}</strong>'
        f"<h3>{title}</h3>{para}</article>"
    )


def stat_cell(num, unit, title, note=None, accent=False):
    return stat_card(num, title, body=note or "", suffix=unit, accent=accent)


def stat_row(*cells, cols=None):
    attr = f' data-cols="{cols or 5}"'
    return f'<div class="stat-grid is-compact"{attr}>{"".join(cells)}</div>'


def stat_pair(title, left_label, left_val, right_label, right_val):
    return (
        f'<article class="stat-card is-pair"><h3>{title}</h3>'
        f'<div class="stat-card__pair">'
        f"<span>{left_label}<b>{left_val}</b></span>"
        f"<span>{right_label}<b>{right_val}</b></span>"
        f"</div></article>"
    )


def stat_grid(*cards, cols=None):
    attr = f' data-cols="{cols}"' if cols else ""
    return f'<div class="stat-grid"{attr}>{"".join(cards)}</div>'


def info(no, title, body, lg=False):
    no_html = f'<span class="info__no">{no}</span>' if no else ""
    cls = "info is-lg" if lg else "info"
    return (
        f'<article class="{cls}">{no_html}'
        f"<h3>{title}</h3><p>{body}</p></article>"
    )


def info_grid(layout, *cards, no=None, index=None, cols=None):
    attr = f' data-layout="{layout}"'
    if no:
        attr += f' data-no="{no}"'
    if index:
        attr += f' data-index="{index}"'
    if cols:
        attr += f' data-cols="{cols}"'
    return f'<div class="info-grid"{attr}>{"".join(cards)}</div>'


def plain(title, body):
    return f"<article class=\"plain\"><b>{title}</b><p>{body}</p></article>"


def plain_grid(*cards, cols=None, surface=None):
    attrs = []
    if cols:
        attrs.append(f'data-cols="{cols}"')
    if surface:
        attrs.append(f'data-surface="{surface}"')
    attr = (" " + " ".join(attrs)) if attrs else ""
    return f'<div class="plain-grid"{attr}>{"".join(cards)}</div>'


def token_item(var, label, value, kind="size", sample=None):
    swatch = ""
    shown = value
    if kind == "color":
        hexv = value if str(value).startswith("#") else f"#{value}"
        swatch = (
            f'<input type="color" class="token-swatch token-color" '
            f'value="{hexv.lower()}" aria-label="{var}">'
        )
        shown = hexv.upper()
    elif kind == "size":
        w = value if str(value).endswith("px") else f"{value}px"
        swatch = f'<span class="token-swatch" style="width:{w}"></span>'
        shown = str(value)[:-2] if str(value).endswith("px") else str(value)
    elif kind == "type" and str(value).endswith("px") and "clamp" not in str(value):
        shown = str(value)[:-2]
    extra = f'<span class="token-sample" style="font-size:{value}">{sample}</span>' if sample else ""
    return (
        f'<article class="token" data-css-var="{var}" data-token-kind="{kind}">'
        f"{swatch}<div class=\"token-meta\"><b>{var}</b><span>{label}</span></div>"
        f'<span class="token-value">{shown}</span>{extra}</article>'
    )


def token_col(title, items):
    return f'<div class="token-board__col"><h3>{title}</h3>{"".join(items)}</div>'


def tokens():
    spacing = token_col("间隔", [
        token_item("--s-in", "区内", "16"),
        token_item("--s-stack", "换排", "40"),
        token_item("--s-chapter", "换章", "96"),
    ])
    type_ = token_col("字号", [
        token_item("--t-h1", "章题", "clamp(28px, 3.4vw, 40px)", "type", "章题"),
        token_item("--t-h2", "小节", "20px", "type", "小节"),
        token_item("--t-num", "数据", "clamp(36px, 4vw, 56px)", "type", "56"),
        token_item("--t-no", "编号", "12px", "type", "01"),
        token_item("--t-no-lg", "大编号", "clamp(28px, 3.2vw, 40px)", "type", "01"),
        token_item("--t-body", "正文", "16px", "type", "正文"),
        token_item("--t-aux", "辅助", "12px", "type", "辅助"),
    ])
    color = token_col("颜色", [
        token_item("--c-text", "正文", "#1D1D1F", "color"),
        token_item("--c-text-2", "次级", "#424245", "color"),
        token_item("--c-text-3", "三级", "#6E6E73", "color"),
        token_item("--c-text-4", "四级", "#86868B", "color"),
        token_item("--c-line", "线", "#E5E5EA", "color"),
        token_item("--c-accent", "强调", "#0071E3", "color"),
        token_item("--c-pos", "表正向", "#00875A", "color"),
        token_item("--c-neg", "表负向", "#C81E1E", "color"),
    ])
    line = (
        '<div class="token-board__col"><h3>线</h3>'
        + token_item("--rule", "强 · 主标题下必有", "1", "size")
        + token_item("--rule-soft", "弱", "1", "size")
        + '<div class="token-line"><hr class="rule"><small>预览 · 强线</small></div>'
        + '<div class="token-line"><hr class="rule is-soft"><small>预览 · 弱线</small></div>'
        "</div>"
    )
    return f'<div class="token-board">{spacing}{type_}{color}{line}</div>'


def topbar():
    return """<header class="topbar" aria-label="文档导航">
    <div class="topbar-inner">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.2 12.8 7 7 12.8 1.2 7Z" fill="currentColor"/></svg>
        </span>
        <span class="brand-text">报告名称 <span class="muted">· 副题</span></span>
      </div>
      <nav class="toc" aria-label="章节目录">
        <a href="#cover">封面</a>
        <a href="#ch-1">第一章</a>
        <a href="#ch-2">第二章</a>
        <a href="#ch-3">第三章</a>
        <a href="#notes">怎么用</a>
      </nav>
      <div class="tools" role="group" aria-label="工具">
        <span class="counter">8 / 22</span>
        <button class="tool ghost" type="button" aria-label="打印">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 8V3h10v5"/><rect x="5" y="11" width="14" height="8" rx="1.5"/><path d="M7 19v3h10v-3"/></svg>
        </button>
      </div>
    </div>
    <div class="progress" aria-hidden="true"><span style="width:36%"></span></div>
  </header>"""


def rail_chart():
    return """<figure class="rail-growth-chart" aria-label="折线图：同一指标随时间变化">
          <div class="rail-growth-chart-scroll">
            <svg viewBox="0 0 1160 230" role="img">
              <line class="chart-grid" x1="68" y1="178" x2="1120" y2="178" />
              <line class="chart-grid" x1="68" y1="141.5" x2="1120" y2="141.5" />
              <line class="chart-grid" x1="68" y1="105" x2="1120" y2="105" />
              <line class="chart-grid" x1="68" y1="68.5" x2="1120" y2="68.5" />
              <line class="chart-grid" x1="68" y1="32" x2="1120" y2="32" />
              <line class="chart-axis" x1="68" y1="32" x2="68" y2="178" />
              <text class="chart-tick" x="56" y="182" text-anchor="end">0</text>
              <text class="chart-tick" x="56" y="145.5" text-anchor="end">100</text>
              <text class="chart-tick" x="56" y="109" text-anchor="end">200</text>
              <text class="chart-tick" x="56" y="72.5" text-anchor="end">300</text>
              <text class="chart-tick" x="56" y="36" text-anchor="end">400</text>
              <text class="chart-axis-label" x="17" y="112" text-anchor="middle" transform="rotate(-90 17 112)">数量</text>
              <line class="chart-line chart-line--stations" x1="90" y1="176.2" x2="430" y2="168.9" />
              <line class="chart-line chart-line--stations" x1="430" y1="168.9" x2="770" y2="133.8" />
              <line class="chart-line chart-line--stations" x1="770" y1="133.8" x2="1110" y2="118.5" />
              <line class="chart-line chart-line--trains" x1="90" y1="174.4" x2="430" y2="164.1" />
              <line class="chart-line chart-line--trains" x1="430" y1="164.1" x2="770" y2="94.8" />
              <line class="chart-line chart-line--trains" x1="770" y1="94.8" x2="1110" y2="45.1" />
              <g aria-label="系列 B">
                <circle class="chart-point chart-point--stations" cx="90" cy="176.2" r="4" />
                <circle class="chart-point chart-point--stations" cx="430" cy="168.9" r="4" />
                <circle class="chart-point chart-point--stations" cx="770" cy="133.8" r="4" />
                <circle class="chart-point chart-point--stations" cx="1110" cy="118.5" r="4" />
                <text class="chart-value chart-value--stations" x="90" y="195" text-anchor="middle">5</text>
                <text class="chart-value chart-value--stations" x="430" y="188" text-anchor="middle">25</text>
                <text class="chart-value chart-value--stations" x="770" y="153" text-anchor="middle">121</text>
                <text class="chart-value chart-value--stations" x="1110" y="138" text-anchor="end">163</text>
              </g>
              <g aria-label="系列 A">
                <circle class="chart-point chart-point--trains" cx="90" cy="174.4" r="4" />
                <circle class="chart-point chart-point--trains" cx="430" cy="164.1" r="4" />
                <circle class="chart-point chart-point--trains" cx="770" cy="94.8" r="4" />
                <circle class="chart-point chart-point--trains" cx="1110" cy="45.1" r="4" />
                <text class="chart-value" x="90" y="158" text-anchor="middle">10</text>
                <text class="chart-value" x="430" y="148" text-anchor="middle">38</text>
                <text class="chart-value" x="770" y="79" text-anchor="middle">228</text>
                <text class="chart-value" x="1110" y="30" text-anchor="end">364</text>
              </g>
              <text class="chart-date" x="90" y="218" text-anchor="middle">T1</text>
              <text class="chart-date" x="430" y="218" text-anchor="middle">T2</text>
              <text class="chart-date" x="770" y="218" text-anchor="middle">T3</text>
              <text class="chart-date" x="1110" y="218" text-anchor="end">T4</text>
              <line class="chart-line chart-line--trains" x1="820" y1="18" x2="852" y2="18" />
              <text class="chart-legend" x="860" y="22">系列 A</text>
              <line class="chart-line chart-line--stations" x1="960" y1="18" x2="992" y2="18" />
              <text class="chart-legend" x="1000" y="22">系列 B</text>
            </svg>
          </div>
        </figure>"""


def ansoff():
    def cell(tag, title, body, hint, extra="", cls=""):
        return (
            f'<div class="ansoff-cell{cls}"><span class="cell-tag">{tag}</span>'
            f"<h4>{title}</h4><p>{body}</p>"
            f'<p class="cell-hint">{hint}</p>{extra}</div>'
        )
    return f"""<div class="ansoff-wrap">
    <div class="ansoff-grid" aria-label="四象限矩阵：纵轴规模化 × 横轴空白度">
      <div class="ansoff-corner"></div>
      <div class="ansoff-col-head"><span class="ansoff-kicker">空白度 · 低</span><span class="ansoff-title">象限 · 渗透</span></div>
      <div class="ansoff-col-head"><span class="ansoff-kicker accent">空白度 · 高</span><span class="ansoff-title">象限 · 开发</span></div>
      <div class="ansoff-row-head"><span class="ansoff-kicker">规模化 · 高</span></div>
      {cell("等级 I", "象限名称 A", "高规模、低空白时做什么。", "规模化高 / 空白度低。增长来自既有供给的渗透。")}
      {cell("等级 II", "象限名称 B", "高规模、高空白时做什么。", "规模化高 / 空白度高。", extra='<p class="cell-hint">需要强调的象限加 accent。</p>', cls=" accent")}
      <div class="ansoff-row-head"><span class="ansoff-kicker">规模化 · 低</span></div>
      {cell("等级 III", "象限名称 C", "低规模、低空白时做什么。", "规模化低 / 空白度低。增长依赖新客群或新区域。", cls=" is-hatch")}
      {cell("等级 IV", "象限名称 D", "低规模、高空白时做什么。", "规模化低 / 空白度高。市场与能力都要重新教育。", cls=" is-quiet")}
    </div>
  </div>"""


def city_network():
    return """<div class="hotel-city-network">
        <span id="sampleDateText" hidden></span>
        <div class="section-head">
          <div><p>左侧选起点，右侧选终点，中间看两种关系是否连通。用于点对点供给、覆盖或通路。</p></div>
          <div class="legend"><span><i></i>方式 A</span><span class="train"><i></i>方式 B</span></div>
        </div>
        <section class="network-shell" aria-label="起点与终点连线">
          <div class="network-toolbar">
            <b>显示方式</b>
            <div class="mode-filter" role="group" aria-label="关系类型筛选">
              <button class="active" data-mode="all" type="button">全部</button>
              <button data-mode="flight" type="button">方式 A</button>
              <button data-mode="rail" type="button">方式 B</button>
            </div>
            <span class="network-status" id="networkStatus">读取数据中</span>
          </div>
          <div class="network-stage" id="networkStage">
            <aside class="city-column origins">
              <p class="column-label">起点</p>
              <div class="city-list" id="originList"></div>
            </aside>
            <div class="connection-area" id="connectionArea">
              <svg id="networkSvg" aria-hidden="true"></svg>
              <div class="connection-empty" id="connectionEmpty">选择左侧起点<br>查看已核到的连通关系</div>
              <div class="origin-summary" id="originSummary"></div>
              <div class="route-detail" id="routeDetail" hidden></div>
            </div>
            <aside class="city-column destinations">
              <p class="column-label">终点候选</p>
              <div id="destinationList"></div>
            </aside>
          </div>
        </section>
      </div>"""


def node_table():
    return """<div class="network-node-table">
        <div class="section-head top20-head">
          <div><h2>节点表</h2><p>终点按连通数排序。列：类型、信号、已核起点数、方式。</p></div>
        </div>
        <div class="table-tools">
          <input id="citySearch" type="search" placeholder="搜索节点、类型或信号" aria-label="搜索终点">
          <select id="cityType" aria-label="筛选终点类型"><option value="all">全部类型</option></select>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>终点</th><th>类型</th><th>信号</th><th>已核起点</th><th>方式</th></tr></thead>
            <tbody id="top20Rows"></tbody>
          </table>
        </div>
      </div>"""


def hotel_ranking():
    rows = [
        (1, "对象名称 01", "档位 A", "99.20", "54", "2,116", "7,703", "9,166"),
        (2, "对象名称 02", "档位 A", "93.43", "38", "823", "9,918", "12,173"),
        (3, "对象名称 03", "档位 A", "91.48", "38", "1,297", "2,982", "5,043"),
        (4, "对象名称 04", "档位 B", "87.05", "37", "500", "1,806", "3,330"),
        (5, "对象名称 05", "档位 A", "86.92", "37", "294", "3,394", "4,046"),
        (6, "对象名称 06", "档位 A", "80.71", "18", "336", "5,755", "4,858"),
        (7, "对象名称 07", "档位 B", "75.79", "15", "259", "2,243", "3,164"),
        (8, "对象名称 08", "档位 A", "75.10", "16", "172", "2,773", "1,912"),
        (9, "对象名称 09", "档位 B", "70.73", "11", "748", "428", "672"),
        (10, "对象名称 10", "档位 B", "68.81", "8", "177", "3,601", "2,430"),
        (11, "对象名称 11", "档位 A", "68.21", "14", "178", "221", "870"),
        (12, "对象名称 12", "档位 B", "64.48", "5", "193", "3,496", "2,514"),
    ]
    body = "".join(
        f'<tr><td class="rank">{r[0]}</td><td class="hotel-name">{r[1]}</td>'
        f'<td class="hotel-tier-cell"><span class="hotel-tier {"tier-luxury" if r[2]=="档位 A" else "tier-upscale"}">{r[2]}</span></td>'
        f'<td class="score total">{r[3]}</td><td class="score">{r[4]}</td><td class="score">{r[5]}</td>'
        f'<td class="score">{r[6]}</td><td class="score">{r[7]}</td></tr>'
        for r in rows
    )
    return f"""<section class="hotel-ranking-block">
          <div class="hotel-ranking-head">
            <div>
              <h4>排行榜标题</h4>
              <p>按综合分降序。目录展示前 12 行；报告里窗口可滚动看全部。</p>
            </div>
            <span class="hotel-ranking-count">12 / 161</span>
          </div>
          <div class="plain-table-wrap hotel-ranking-scroll" tabindex="0">
            <table class="poi-table hotel-ranking-table">
              <thead><tr><th>排名</th><th>对象名称</th><th>档位</th><th>综合分</th><th>指标 A</th><th>指标 B</th><th>指标 C</th><th>指标 D</th></tr></thead>
              <tbody>{body}</tbody>
            </table>
          </div>
        </section>"""


def funnel_chart():
    return """<figure class="hotel-funnel-chart" aria-label="漏斗：样本如何逐级收窄">
          <div class="hotel-funnel-chart-scroll">
            <svg viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg" role="img">
              <path class="funnel-line" d="M110 34 L600 94 L1090 154"/>
              <path class="funnel-line is-muted" d="M110 34 L410 190"/>
              <g transform="translate(110 34)">
                <circle class="funnel-node" r="7"/>
                <text class="funnel-value" x="0" y="48" text-anchor="middle">6,326</text>
                <text class="funnel-label" x="0" y="74" text-anchor="middle">总量 · 平台样本</text>
              </g>
              <g transform="translate(600 94)">
                <circle class="funnel-node" r="7"/>
                <text class="funnel-value" x="0" y="48" text-anchor="middle">161</text>
                <text class="funnel-label" x="0" y="74" text-anchor="middle">有证据的样本</text>
              </g>
              <g transform="translate(1090 154)">
                <circle class="funnel-node" r="7"/>
                <text class="funnel-value" x="0" y="48" text-anchor="middle">100</text>
                <text class="funnel-label" x="0" y="74" text-anchor="middle">审核后的优选</text>
              </g>
              <g transform="translate(410 190)">
                <circle class="funnel-node is-muted" r="7"/>
                <text class="funnel-value is-muted" x="0" y="48" text-anchor="middle">300</text>
                <text class="funnel-label is-muted" x="0" y="74" text-anchor="middle">旁路 · 长尾核验</text>
              </g>
            </svg>
          </div>
        </figure>"""


def point(kicker, title, soft=False):
    cls = "point is-soft" if soft else "point"
    kick = f"<span>{kicker}</span>" if kicker else ""
    return f'<aside class="{cls}">{kick}<p>{title}</p></aside>'


def shot(src, alt, title, cap, kind="photo", group="demo"):
    bits = []
    if title:
        bits.append(f"<b>{title}</b>")
    if cap:
        bits.append(f"<span>{cap}</span>")
    cap_html = f"<figcaption>{''.join(bits)}</figcaption>" if bits else ""
    img_alt = "" if bits else alt
    return (
        f'<figure class="shot" data-kind="{kind}" data-lightbox-src="{src}" '
        f'data-lightbox-alt="{alt}" data-lightbox-group="{group}">'
        f'<div class="shot__frame"><img src="{src}" alt="{img_alt}" tabindex="0"></div>'
        f'<button class="gallery-open" type="button" aria-label="放大查看">↗</button>'
        f"{cap_html}</figure>"
    )


def transport_card(title, lead, facts, thumbs):
    thumb_html = []
    for i, (src, alt) in enumerate(thumbs):
        active = " is-active" if i == 0 else ""
        thumb_html.append(
            f'<button class="gallery-thumb{active}" type="button" data-src="{src}" data-alt="{alt}">'
            f'<img src="{src}" alt="{alt}"></button>'
        )
    src0, _ = thumbs[0]
    fact_html = "".join(
        f'<div class="transport-fact"><span>{k}</span><strong>{v}</strong></div>'
        for k, v in facts
    )
    return (
        f'<article class="transport-card" data-gallery>'
        f'<div class="gallery-stage"><img class="gallery-main" src="{src0}" alt="" tabindex="0">'
        f'<button class="gallery-open" type="button" aria-label="查看大图">↗</button>'
        f'<div class="gallery-thumbs">{"".join(thumb_html)}</div></div>'
        f'<div class="transport-card-copy"><h3>{title}</h3><p>{lead}</p>'
        f'<div class="transport-facts">{fact_html}</div></div></article>'
    )


PAIN_LIST = (
    '<div class="pain-text-list">'
    + pain(
        "01", "议题名称",
        "一句概括：这一格要回答什么问题。",
        [
            "样本 A 中，<strong>38.1%</strong> 指向该议题的第一证据。",
            "样本 B 中，<strong>54.6%</strong> 指向同一议题的另一侧证据。",
            "开放题里该主题被提及约 <strong>40 次</strong>，用来证明它不是偶发。",
            "补充一条边界：不同渠道或往返程口径不一致时，用户必须重新核对。",
        ],
    )
    + pain("02", "议题名称", "一句概括：规则不统一时，用户要逐条核对什么。", [
        "条件甲：对象 A 不设上限；对象 B ≤ 7；对象 C 分两档 10 / 18。",
        "条件乙：规格一 40 × 38 × 25；规格二 60 × 40 × 35。",
        "条件丙：对象 A 满 8 周；对象 C 满 2 个月。",
        "条件丁：对象 A、C 最多 1；对象 B 最多 2。",
    ])
    + pain("03", "议题名称", "一句概括：价格或口径不可比时，决策卡在哪里。", [
        "渠道甲：基础价不同，还要叠加配件、保障和保险。",
        "渠道乙：<strong>29.5%</strong> 认为附加费、押金不透明。",
        "计费可能按次、按晚、按件、一次性或免费，把规则写进格内，不要抬成新卡。",
    ])
    + pain("04", "议题名称", "一句概括：过程不可见或终点可能被拒时，用户怕什么。", [
        "方式 A：<strong>61.6%</strong> 担心全程看不到。",
        "方式 B：<strong>69.7%</strong> 担心环境与意外。",
        "<strong>36.0%</strong> 担心到达后被拒或临时变卦。",
    ])
    + "</div>"
)

TRANSPORT_CARDS = (
    '<div class="transport-cards">'
    + transport_card("方案名称 A", "一句对比：这条方案相对其他方案的核心差异。",
                     [("属性 A", "约 ¥1,288–1,430"), ("属性 B", "取值"), ("属性 C", "必须同时发生")],
                     [(CABIN, "图 1"), (CABIN2, "图 2")])
    + transport_card("方案名称 B", "一句对比：适用边界、交接次数、能否拆开走。",
                     [("属性 A", "约 ¥548"), ("属性 B", "取值"), ("属性 C", "可拆开或同时")],
                     [(CARGO, "图 1"), (CARGO2, "图 2"), (CARGO3, "图 3")])
    + transport_card("方案名称 C", "一句对比：过程是否可见、是否必须同班次。",
                     [("属性 A", "约 ¥500 / 件"), ("属性 B", "取值"), ("属性 C", "通常同一班次")],
                     [(RAIL, "图 1"), (RAIL5, "图 2"), (MON, "图 3")])
    + transport_card("方案名称 D", "一句对比：材料是否更少、形式是否更灵活。",
                     [("属性 A", "约 ¥450–1,280"), ("属性 B", "取值"), ("属性 C", "可拆开或同时")],
                     [(ROAD, "图 1"), (VAN, "图 2"), (RIDE, "图 3")])
    + "</div>"
)

VENN = """<div class="venn-wrap">
<svg class="venn" viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="韦恩图：三组场景的共有条件">
  <defs>
    <linearGradient id="vennBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#EFF6FC"/>
      <stop offset=".46" stop-color="#EDF4FD"/>
      <stop offset="1" stop-color="#E2EEFC"/>
    </linearGradient>
    <radialGradient id="vennIndigo" cx="1" cy="0" r="1.2">
      <stop offset="0" stop-color="#D6DEFC" stop-opacity=".55"/>
      <stop offset=".55" stop-color="#D6DEFC" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="620" rx="16" fill="url(#vennBg)"/>
  <rect width="900" height="620" rx="16" fill="url(#vennIndigo)"/>
  <g style="isolation:isolate">
    <g style="mix-blend-mode:multiply">
      <circle cx="450" cy="265" r="150" fill="#EBDCB4" fill-opacity=".72"/>
      <circle cx="370" cy="404" r="150" fill="#C7B6EA" fill-opacity=".62"/>
      <circle cx="530" cy="404" r="150" fill="#AFB7F0" fill-opacity=".62"/>
    </g>
  </g>
  <g fill="none" stroke="#4C4C86" stroke-width="1.3" stroke-dasharray="7 5">
    <circle cx="450" cy="265" r="150"/>
    <circle cx="370" cy="404" r="150"/>
    <circle cx="530" cy="404" r="150"/>
  </g>
  <g stroke="#1D1D1F" stroke-width="1.6">
    <line x1="450" y1="64" x2="450" y2="108"/>
    <line x1="176" y1="404" x2="206" y2="404"/>
    <line x1="694" y1="404" x2="724" y2="404"/>
  </g>
  <g class="venn-scene" fill="#1D1D1F" font-size="19" font-weight="700">
    <text x="450" y="48" text-anchor="middle">集合 A</text>
    <text x="158" y="411" text-anchor="end">集合 B</text>
    <text x="742" y="411" text-anchor="start">集合 C</text>
  </g>
  <g class="venn-cert" fill="#1D1D1F" text-anchor="middle">
    <text x="450" y="198" font-size="21" font-weight="700">仅 A 的条件</text>
    <text x="450" y="222" font-size="13" fill="#3A3A3F">（圈外标签可写备注）</text>
    <text x="305" y="432" font-size="21" font-weight="700">仅 B 的条件</text>
    <text x="305" y="456" font-size="13" fill="#3A3A3F">（时点或范围）</text>
    <text x="595" y="432" font-size="21" font-weight="700">仅 C 的条件</text>
    <text x="450" y="353" font-size="21" font-weight="700">三方共有</text>
    <text x="450" y="377" font-size="13" fill="#3A3A3F">（交集里写共同门槛）</text>
  </g>
</svg>
</div>"""

LIGHTBOX = """
  <dialog class="media-lightbox" id="mediaLightbox" aria-label="查看大图">
    <div class="media-lightbox-frame">
      <button class="media-lightbox-close" type="button" aria-label="关闭大图">×</button>
      <button class="media-lightbox-nav media-lightbox-prev" type="button" aria-label="上一张">‹</button>
      <div class="media-lightbox-viewport" id="mediaLightboxViewport">
        <div class="media-lightbox-canvas" id="mediaLightboxCanvas">
          <img class="media-lightbox-image" id="mediaLightboxImage" alt="" draggable="false">
        </div>
      </div>
      <button class="media-lightbox-nav media-lightbox-next" type="button" aria-label="下一张">›</button>
      <div class="media-lightbox-count" aria-live="polite"></div>
      <div class="media-lightbox-zoom-controls" aria-label="大图缩放">
        <button class="media-zoom-out" type="button" aria-label="缩小">−</button>
        <button class="media-zoom-reset" type="button" aria-label="还原缩放">100%</button>
        <button class="media-zoom-in" type="button" aria-label="放大">+</button>
      </div>
    </div>
  </dialog>
"""

lib = "".join([
    lab("基础 token", tokens()),
    lab("导航栏", topbar()),
    lab("章头", head("01 · 题域", "判断句写在这里：这一章要让读者先信什么。")),
    lab("章头 · 副标题", head(
        "小节标签",
        "需要副题时把解释放在判断句下面。",
        "副题补充口径、范围或为什么这样判断，不另起一章。",
    )),
    lab("导语", '<div class="research-lead"><p>章头与证据之间的解释。写清边界、用户实际卡在哪几件事、这一章接下来用什么证据。不要把导语画进议题格、图文卡、公式或韦恩图。</p></div>'),
    lab("来源", source_note(
        "《资料名称 A》",
        "《资料名称 B》",
        "平台 / 调研口径",
    )),
    lab("分割线", rule()),
    lab("分割线弱", rule(soft=True)),
    lab("公式", formula()),
    lab("横排数字", stat_row(
        stat_cell("49.9", "%", "指标名称 · 样本 A"),
        stat_cell("29.8", "%", "指标名称 · 对照盘", "样本 A 是对照盘的 1.7 倍"),
        stat_cell("17.7", "%", "单类需求"),
        stat_cell("42.9", "%", "多类需求", "约为单类的 2.4 倍"),
        stat_cell("85.7", "%", "关键认同度", accent=True),
        cols=5,
    )),
    lab("数字信息", stat_grid(
        stat_card("34 / 52", "覆盖率标题", "分子 / 分母。正文写口径：具备政策基础不等于当天可订，仍取决于规格、时段与名额。"),
        stat_card("17 / 52", "试点覆盖标题", "约 33% 已开放付费产品，通常按白名单、指定线路和单班名额执行。"),
        stat_card("6", "分层占比标题", "高档供给在总量中仍然很少。", kicker="现状 · 供给分层", suffix="377 / 6326"),
    )),
    lab("编号信息", info_grid("2",
        info("01", "步骤或要点标题", "并列要点。写清这条在论证什么，不要塞进数字卡。"),
        info("02", "步骤或要点标题", "条件更成熟的主干，和形成硬约束的支线，分开写。"),
        info("03", "步骤或要点标题", "“开放”仍会动态变化：换季、临时候选、额度，都会让政策与当天可订出现差异。"),
        info("04", "步骤或要点标题", "对象之间的产品差异：数量、规格、时限和材料要求各不相同。"),
    )),
    lab("编号信息 · 列表", info_grid("stack",
        info("01", "先确认这条能不能走", "查对象、节点、规格和当班名额。"),
        info("02", "先订主单，再申请附加服务", "主单与附加服务要落在同一班次。"),
        info("03", "临近出发补齐材料", "带齐身份、行程证明和当日有效的核验材料。"),
    )),
    lab("编号信息 · 大编号", info_grid("stack",
        info("01", "先确认这条能不能走", "查对象、节点、规格和当班名额。", lg=True),
        info("02", "先订主单，再申请附加服务", "主单与附加服务要落在同一班次。", lg=True),
        info("03", "临近出发补齐材料", "带齐身份、行程证明和当日有效的核验材料。", lg=True),
        no="lg",
    )),
    lab("编号信息 · 横排卡片", info_grid("cols",
        info("01", "先确认这条能不能走", "查对象、节点、规格和当班名额。", lg=True),
        info("02", "先订主单，再申请附加服务", "主单与附加服务要落在同一班次。", lg=True),
        info("03", "临近出发补齐材料", "带齐身份、行程证明和当日有效的核验材料。", lg=True),
        no="lg",
    )),
    lab("编号信息 · 隐藏编号", info_grid("cols",
        info("01", "要点标题", "同一父组件，只是不显示编号。"),
        info("02", "要点标题", "右键可打开编号，或改成字母 A B C。"),
        info("03", "要点标题", "不超过 4 条仍用编号在上。"),
        info("04", "要点标题", "四条时加 data-cols=\"4\"。"),
        index="off",
        cols="4",
    )),
    lab("编号信息 · 行", info_grid("row",
        info("Q1", "读者会问的第一句", "把限制条件写在答里：种类、体量、数量、材料。展示信息经常与现场不符。"),
        info("01", "结构化档案", "录入关键字段，用来自动筛选匹配政策的可用服务。"),
        info("TAG", "材料标签", "申请时可能要求某类证明；核验点也可能抽查其他有效记录。"),
    )),
    lab("提问", info_grid("row",
        info("Q1", "能不能用？", "限制条件，以及是否需要材料。展示信息经常与现场不符。"),
        info("Q2", "额外费用是多少？", "附加费与保证金，其中附加费还分“按晚收”和“按次收”。"),
        info("Q3", "有没有档位限制？", "部分对象只有指定档位可用，最低价往往不在范围内。"),
        info("Q4", "活动范围有多大？", "只能待在指定区，还是可以去公区、配套或户外，以及能否单独留置。"),
        info("Q5", "有哪些设施？", "是否提供餐食，以及用具、场地等配套。"),
        info("Q6", "造成损坏怎么赔？", "弄脏或损坏物品时，赔偿标准和押金扣除规则是什么。"),
        info("Q7", "如何留痕，确保到达不被拒？", "下单时是否需要备注或提前告知；口头确认后如何保障不被拒。"),
        index="q",
    )),
    lab("编号信息 · 标签", info_grid("stack",
        info("属性名", "属性取值", "规格、容量、放置位置和过程中能不能查看，写在说明里。"),
        info("预约时间", "至少提前 1 天", "当天 12:00 前可约次日，12:00 后最早约第三日。"),
        info("办理材料", "证明当日有效", "携带身份证件、购票或订单证明，以及承运当日有效的核验材料。"),
        info("线下时间", "出发前至少 2 小时", "到指定办理点；到达后建议在 1 小时内领取。"),
        index="label",
    )),
    lab("无编号信息", plain_grid(
        plain("对比点标题", "用一句可核对的数字或范围，说明它比对照方案更有利。"),
        plain("对比点标题", "样本里多数不要求某类材料。"),
        plain("对比点标题", "档案覆盖的对象类型更广。"),
        plain("对比点标题", "可单独走，也可选择同行。"),
        surface="tint",
    )),
    lab("观点", point("观点判断", "一句立场：问题不在供给有没有，而在如何找对象做流程简化和能力突破。")),
    lab("观点 · 浅底", point("", "<strong>顺序建议：</strong>首选覆盖最大的对象建立基础供给；第二家补足名额、规格和临近出发申请。", soft=True)),
    lab("议题格", PAIN_LIST),
    lab("自定义文本", """<article class="finding">
        <h3>发现标题：既有“信息缺失”，更有“信息有误”</h3>
        <hr class="rule is-soft">
        <p>现状下用户需要靠二次核验才能完成决策。</p>
        <p>① 信息有误——展示的和实际不符</p>
        <p>实测 2 例：一家写“不可用”（实际部分档位可以）；另一家写 ¥100 / 晚（实际免费）。</p>
        <p>② 信息缺失——决定能否使用的关键条件，平台不展示</p>
        <p>50% 材料、时效要求 5 / 10 家要求许可证 / 有效证明。</p>
        <p>30% 仅部分档位可用 3 / 10 家有档位限制。</p>
      </article>"""),
    lab("表格", """<div class="plain-table-wrap"><table class="airline-matrix">
        <thead><tr><th>维度</th>
          <th><span class="airline-title">对象 A <span class="airline-rank one">TOP 1</span></span></th>
          <th><span class="airline-title">对象 B <span class="airline-rank two">TOP 2</span></span></th>
          <th><span class="airline-title">对象 C</span></th></tr></thead>
        <tbody>
          <tr><td>覆盖率</td><td class="best">约 57%，45 个节点</td><td>约 43%，38 个节点</td><td>约 47%，36 个节点</td></tr>
          <tr><td>申请截止</td><td class="best">出发前 6 小时</td><td>48h 前在线；进入 24h 后可现场申请</td><td class="weak">仅出发前 7 天至 24h</td></tr>
          <tr><td>单次数量</td><td>1</td><td class="best">最多 2</td><td>1</td></tr>
          <tr><td>基础价格</td><td>&lt;2000km ¥1,299</td><td>¥1,430</td><td class="best">¥1,288</td></tr>
        </tbody>
      </table></div>"""),
    lab("折线图", rail_chart()),
    lab("四象限矩阵", ansoff()),
    lab("漏斗图", funnel_chart()),
    lab("关系网络", city_network()),
    lab("节点表", node_table()),
    lab("排行榜", hotel_ranking()),
    lab("图", '<div class="shot-grid" data-cols="2">'
        + shot(PROFILE, "截图 · 档案", "主图标题", "一句说明：这张图在论证什么。")
        + shot(METHODS, "截图 · 材料", "主图标题", "一句说明：材料或流程截图要填的字段。", kind="crop", group="cert")
        + "</div>"),
    lab("图 · 滚动", shot(DELIVER, "长截图", "主图标题 · 滚动", "长页或小程序流，用滚动变体，不要裁成方图。", kind="scroll", group="app")),
    lab("图 · 宽", (
        '<div class="shot-stack">'
        + shot(FLOW, "宽图 · 链路", "主图标题 · 链路", "进入、查询、选择、锁定并提交。宽图不要再拆成多张方图。", kind="wide")
        + '<article class="shot-plan"><div class="shot-plan__label"><span>方案</span><h4>方案名</h4></div>'
        + shot(FLOW, "宽图 · 方案", "主图标题 · 方案链路", "方案标签不是第二套组件，只是宽图上的槽。", kind="wide")
        + "</article></div>"
    )),
    lab("海报墙", '<div class="shot-grid" data-cols="4">'
        + shot(POSTER, "海报 01", "", "", kind="poster", group="poster")
        + shot(CABIN, "海报 02", "", "", kind="poster", group="poster")
        + shot(PROFILE, "海报 03", "", "", kind="poster", group="poster")
        + shot(DELIVER, "海报 04", "", "", kind="poster", group="poster")
        + "</div>"),
    lab("图文卡", TRANSPORT_CARDS),
    lab("韦恩图", VENN),
])

html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>知识汇报模板 · 流式 v2</title>
  <link rel="stylesheet" href="design-system/components.css">
  <link rel="stylesheet" href="assets/template.css?v=5">
  <link rel="stylesheet" href="assets/flow.css?v=5">
  <link rel="stylesheet" href="assets/source.css?v=18">
  <link rel="stylesheet" href="assets/lib.css?v=20">
  <link rel="stylesheet" href="assets/v2.css?v=9">
</head>
<body>
  <div class="theme-control" id="themeControl" aria-label="主题控制">
    <div class="theme-control__label">
      <span>THEME</span>
      <strong data-theme-name>Editorial 默认</strong>
    </div>
    <select data-theme-select aria-label="切换主题"></select>
    <button type="button" data-theme-import-trigger>导入主题</button>
    <button type="button" data-theme-export>导出主题</button>
    <input data-theme-import type="file" accept="application/json,.json" hidden>
    <p class="theme-control__hint">点颜色色块用取色器，或右键改数值；会写入当前主题并立刻作用于整页。导入导出只在本目录页</p>
    <div class="theme-control__toast" data-theme-toast role="status" aria-live="polite"></div>
  </div>

  <div class="report-shell is-flow" data-catalog>
    <nav class="document-nav nav-underline is-sticky" data-component-id="navigation" aria-label="文档章节">
      <div class="document-nav__brand"><span class="document-nav__mark" aria-hidden="true"></span><strong>SEED</strong></div>
      <div class="document-nav__links"><a href="#cover" class="is-active">封面</a>
        <a href="#lib">组件</a>
        <a href="#notes">怎么用</a>
      </div>
    </nav>

    <div class="report-stage" data-report-stage>
      <div class="report-slides" data-report-slides>
        <section class="report-slide is-chapter-cover is-active" data-chapter="cover" data-slide="00" id="cover">
          <header class="chapter-cover">
            <div class="chapter-cover__media"><img src="assets/demo/pet-travel.png" alt=""></div>
            <div class="chapter-cover__copy">
            <span class="chapter-cover__kicker">流式 v2</span>
            <h2 class="chapter-cover__title">流式组件库</h2>
            <p class="chapter-cover__lead">可复用块按结构和作用收成父组件，用 data-* / is-* 切换变体。每个组件只陈列内容：不要把章头、分割线和导语画进议题格、图文卡、公式、韦恩图或提问。文案是槽位说明，换成项目内容即可。</p>
            <p class="chapter-cover__byline"><span class="chapter-cover__scope">组件</span><span class="chapter-cover__kind">editorial-flow</span></p>
            <div class="chapter-cover__actions"><a class="button primary" href="#lib">开始阅读</a></div>
            </div>
          </header>
        </section>
        <section class="report-section report-slide" data-chapter="lib" data-slide="01" id="lib">
          <div class="flow-stack">{lib}</div>
        </section>
        <section class="report-slide" data-chapter="notes" data-slide="02" id="notes">
          <footer class="report-notes">
            <h2>怎么用</h2>
            <ol>
              <li>这是流式模板。壳是文档栏：report-shell.is-flow、吸顶导航、flow-stack 上下叠。封面右键切版式：左齐 / 居中 / 配图 / 图文分栏（<code>data-cover</code>：省略、<code>center</code>、<code>image</code>、<code>split</code>）；配图封面可右键替换图片。拖组件排序时封面不显示。</li>
              <li>合并后的父组件：<code>.stat-card</code> / <code>.stat-grid</code> 数字信息（横排数字是同一父组件的紧凑排：<code>.stat-grid.is-compact</code>；右键勾选前缀 / 后缀 / 说明，列数 2–5）；<code>.info</code> 编号信息（布局：格子 <code>cols</code> / 列表 A <code>stack</code> / 列表 B <code>row</code>；<code>data-pos</code> 顶部 / 左侧；<code>data-index</code>：数字 / <code>alpha</code> / <code>q</code> 问题 / <code>label</code> 标签 / <code>off</code> 隐藏；<code>.is-lg</code> / <code>data-no="lg"</code> 大编号；格子列数 2–5）；<code>.plain</code> 无编号信息（<code>data-surface</code>：tint / line）；<code>.point</code> 观点（<code>.is-soft</code> 浅底）；<code>.shot</code> 图（<code>data-kind</code>：photo / crop / scroll / wide / poster；右键新增一条，列数 1–5）。</li>
              <li>组件库必须带基础 token：间隔 <code>--s-in</code> / <code>--s-stack</code> / <code>--s-chapter</code>；字号 <code>--t-h1</code> / <code>--t-num</code> / <code>--t-no-lg</code> / <code>--t-body</code> / <code>--t-aux</code>；颜色 <code>--c-text</code> 档、<code>--c-line</code>、<code>--c-accent</code>、表数据栏 <code>--c-pos</code> / <code>--c-neg</code>；分割线 <code>.rule</code> / <code>.rule.is-soft</code>。</li>
              <li>仍独立：公式、议题格 <code>.pain-text-list</code> / <code>.pain-topic</code>、自定义文本 <code>.finding</code>、图文卡 <code>.transport-cards</code> / <code>.transport-card</code>、韦恩图、导语、来源、章头、分割线、导航栏 <code>.topbar</code>、折线图 <code>.rail-growth-chart</code>、四象限矩阵 <code>.ansoff-grid</code>、漏斗图 <code>.hotel-funnel-chart</code>、关系网络 <code>.hotel-city-network</code>、节点表 <code>.network-node-table</code>、排行榜 <code>.hotel-ranking-block</code>。关系网络和节点表是两个父组件，不要包在同一块里。</li>
              <li>同类块用父组件 + 变体，不要另起皮肤，也不要再收成 flow-block。</li>
              <li>公式、韦恩图、提问、议题格、图文卡只保留内容。章头 <code>.slide-head</code>、分割线 <code>.rule</code>、导语 <code>.research-lead</code> 是独立组件，不要画进这些块。报告里章头下方仍必须紧跟强线，那是排版规则，不是组件自带的。</li>
              <li>报告中每个主标题（<code>.slide-head</code>）下方必须紧跟一条可见的<strong>强线</strong> <code>.rule</code>，不得省略，不得用下一块顶线替代，CSS 不得把这条线 <code>display:none</code>。小节标题下不加线，只用间隔。其余块之间不加线，只靠间距。表 / list / 卡内部只用 1px 弱线。编号信息不超过 4 条用 <code>data-layout="cols"</code>（编号在上），5 条及以上才用 <code>stack</code>。</li>
              <li>间距分三档。区内 <code>--s-in</code>（16，含章头→强线）；章内换排 <code>--s-stack</code>（40，含强线→第一块）；换章 <code>--s-chapter</code>（96）。来源贴在所属证据块下面，不要和换章同一档。</li>
              <li>格内条目留在该卡里。例如议题格的百分比、图文卡的属性行，不要抬成新的一排。</li>
              <li>来源写一次。源格没有口径句，就不要补。</li>
              <li>没有源 HTML 时：从 <code>templates/editorial-flow/report.html</code> 生成报告。对照目录选父组件，缺了才新增。不要抄 <code>data-catalog</code>，报告导航用 <code>.topbar</code>。主题导入导出只在本目录页，不要做到报告壳上。</li>
              <li>分屏是另一套：templates/editorial-page/。旧稿在 templates/draft/。报告不要抄 data-catalog。报告导航用 <code>.topbar</code>，不要用目录壳的 <code>.document-nav</code>。</li>
              <li>结构说明：两张截图卡是同一父组件 <code>.shot</code>，<code>photo</code> / <code>crop</code> 变体；图区坏图时不把 alt 再写一层，标题只留在 figcaption。宽图和方案图也是同一父组件：<code>.shot[data-kind=wide]</code>，方案只是 <code>.shot-plan</code> 标签槽，目录收在「图 · 宽」。提问是 <code>.info-grid[data-layout=row]</code> 的问答内容，不是新父组件；底下浅底格是无编号信息，不要画进提问。关系网络舞台高度跟左右列表走，不要写死 min-height。图 / 表 / 折线右键「尺寸」可拖宽高；折线拖高后绘图区跟着拉高，改数字后纵轴刻度自适应。韦恩图第三圈保留，圈内文案是该集合自己的判断。公式和韦恩图只在组件区出现一次。公式与数字信息不是同一组件：公式是算法，数字是支撑数字。四象限矩阵目录用代码版 <code>.ansoff-grid</code>。基础 token 右键改数值，立刻作用于整页并写入当前主题，可导出 JSON 在本目录导入。颜色 token 点色块用取色器，也可改 hex。议题四格是同一父组件 <code>.pain-topic</code> 铺进 <code>.pain-text-list</code>，目录名「议题格」；01–04 主题不同，不把正文并成一块。图文四卡是同一父组件 <code>.transport-card</code> 横排进 <code>.transport-cards</code>，目录名「图文卡」；导语不画进卡。图廊主图不另写当前图名，缩略图才是切换槽，不是第二个组件。</li>
            </ol>
          </footer>
        </section>
      </div>
    </div>
  </div>
{LIGHTBOX}
  <link rel="stylesheet" href="editor/seed-edit.css?v=22">
  <script src="design-system/design-data.js"></script>
  <script src="design-system/theme-runtime.js"></script>
  <script src="editor/seed-edit.js?v=22"></script>
  <script src="assets/template.js"></script>
  <script src="assets/source.js"></script>
  <script src="assets/network.js?v=16"></script>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
