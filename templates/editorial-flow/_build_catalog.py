#!/usr/bin/env python3
"""Generate editorial-flow/index.html.

从源稿拆出的可复用组件，结构和作用接近的收成一套父组件。
壳用 editorial-flow（report-shell.is-flow / flow-stack / flow-lab）。
不要再收成 flow-h1 / flow-block。
"""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")
IMG = "../states-demo/assets"
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
        + factor("7,800", "万人", "城镇犬猫宠主")
        + op.format("×")
        + factor("71", "%", "有携宠出行意愿 / 需求")
        + op.format("×")
        + factor("50", "%", "有意愿人群选择出行")
        + op.format("×")
        + factor("2", "次 / 年", "年均携宠出行频次")
        + op.format("=")
        + factor("5,538", "万次 / 年", "年度潜在携宠旅行次数", True)
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


def stat_cell(num, unit, title, note=None, accent=False):
    extra = f'<p class="stat-row__note">{note}</p>' if note else ""
    cls = ' class="is-accent"' if accent else ""
    return (
        f"<article{cls}><div class=\"market-number\"><span>{num}</span><i>{unit}</i></div>"
        f"<h3>{title}</h3>{extra}</article>"
    )


def stat_row(*cells, cols=None):
    attr = f' data-cols="{cols}"' if cols else ""
    return f'<div class="stat-row"{attr}>{"".join(cells)}</div>'


def stat_card(num, title, body, kicker=None, ratio=None):
    kick = f'<span class="stat-card__kicker">{kicker}</span>' if kicker else ""
    rat = f'<span class="stat-card__ratio">{ratio}</span>' if ratio else ""
    return (
        f'<article class="stat-card">{kick}'
        f'<strong class="stat-card__num">{num}{rat}</strong>'
        f"<h3>{title}</h3><p>{body}</p></article>"
    )


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


def info_grid(layout, *cards, no=None):
    attr = f' data-layout="{layout}"'
    if no:
        attr += f' data-no="{no}"'
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


def tokens():
    rows = [
        ("间隔", "--s-in 16 · --s-stack 40 · --s-chapter 96"),
        ("字号", "--t-h1 章题 · --t-h2 20 · --t-num 数据 · --t-no / --t-no-lg 编号 · --t-body 16 · --t-aux 12"),
        ("颜色", "--c-text / -2 / -3 / -4 · --c-line · --c-accent · --c-pos / --c-neg 表数据栏"),
        ("线", ".rule 强 2px · .rule.is-soft 弱 1px · 主标题下必有强线"),
    ]
    cells = "".join(
        f'<article class="plain"><b>{k}</b><p>{v}</p></article>' for k, v in rows
    )
    return f'<div class="plain-grid" data-cols="4" data-surface="line">{cells}</div>'


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
    return (
        f'<figure class="shot" data-kind="{kind}" data-lightbox-src="{src}" '
        f'data-lightbox-alt="{alt}" data-lightbox-group="{group}">'
        f'<div class="shot__frame"><img src="{src}" alt="{alt}" tabindex="0"></div>'
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
    src0, alt0 = thumbs[0]
    fact_html = "".join(
        f'<div class="transport-fact"><span>{k}</span><strong>{v}</strong></div>'
        for k, v in facts
    )
    return (
        f'<article class="transport-card" data-gallery>'
        f'<div class="gallery-stage"><img class="gallery-main" src="{src0}" alt="{alt0}" tabindex="0">'
        f'<button class="gallery-open" type="button" aria-label="查看大图">↗</button>'
        f'<div class="gallery-thumbs">{"".join(thumb_html)}</div></div>'
        f'<div class="transport-card-copy"><h3>{title}</h3><p>{lead}</p>'
        f'<div class="transport-facts">{fact_html}</div></div></article>'
    )


PAIN_CARD = pain(
    "01", "手续麻烦",
    "证件流程复杂、有效期长短不一、出入境要求不一致。",
    [
        "高铁用户中，<strong>38.1%</strong> 认为办理《动物检疫合格证明》手续麻烦。",
        "飞机用户中，<strong>54.6%</strong> 被检疫证明、航空箱和提前申请等复杂手续困扰。",
        "开放题中，“手续简化 / 代办”被提及约 <strong>40 次</strong>，是频次最高的主题。",
        "不同地区、交通方式和往返程要求不一致，用户必须重新核对材料与有效期。",
    ],
)

VENN = """<div class="venn-wrap">
<svg class="venn" viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="韦恩图：三类场景共同依赖疫苗">
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
    <text x="450" y="48" text-anchor="middle">酒店入住</text>
    <text x="158" y="411" text-anchor="end">航空、高铁</text>
    <text x="742" y="411" text-anchor="start">长途陆运</text>
  </g>
  <g class="venn-cert" fill="#1D1D1F" text-anchor="middle">
    <text x="450" y="198" font-size="21" font-weight="700">养宠许可证</text>
    <text x="450" y="222" font-size="13" fill="#3A3A3F">（猫证、犬证）</text>
    <text x="305" y="432" font-size="21" font-weight="700">检疫</text>
    <text x="305" y="456" font-size="13" fill="#3A3A3F">（出发前几天）</text>
    <text x="595" y="432" font-size="21" font-weight="700">无额外证件</text>
    <text x="450" y="353" font-size="21" font-weight="700">疫苗</text>
    <text x="450" y="377" font-size="13" fill="#3A3A3F">（猫 3 联、犬 8 联）</text>
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
    lab("章头", head("01 · 市场", "携宠旅行是一个每年超5000万次的潜在旅行市场。")),
    lab("章头 · 副标题", head(
        "CONCEPT FILM",
        "品牌概念：飞猪出发，狗狗GO~",
        "花间堂订单占比 95% 是带狗入住用户，所以用狗的概念为核心延展出品牌设计。",
    )),
    lab("导语", '<div class="research-lead"><p>跨城带宠的问题不是“有没有运输方式”，而是不同方式的准入条件、宠物位置、价格口径、办理材料和交接流程高度非标。真正影响用户决策的，是“宠物能不能运”、“能不能和主人同行”、“实际总价是多少”，以及“需要提前准备哪些材料”。</p></div>'),
    lab("来源", source_note(
        "《2026年中国宠物行业白皮书》",
        "《携宠出行意愿调研报告》",
        "《携程酒店数据》",
    )),
    lab("分割线", rule()),
    lab("分割线弱", rule(soft=True)),
    lab("公式", formula()),
    lab("横排数字", stat_row(
        stat_cell("49.9", "%", "养宠用户中 88VIP 占比"),
        stat_cell("29.8", "%", "大盘 88VIP 占比", "养宠用户是大盘的 1.7 倍"),
        stat_cell("17.7", "%", "单品类需求度"),
        stat_cell("42.9", "%", "多品类需求度", "约为单品类的 2.4 倍"),
        stat_cell("85.7", "%", "认为一站式有必要", accent=True),
        cols=5,
    )),
    lab("数字信息", stat_grid(
        stat_card("34 / 52", "航司支持有氧舱托运", "约 65% 国内常态化客运航司具备政策基础；是否能运仍取决于具体机型、温度与当班装载条件。"),
        stat_card("17 / 52", "航司试点宠物进客舱", "约 33% 航司已开放付费产品，通常按机场白名单、指定国内直达航班和单班名额执行。"),
        stat_card("6%", "杭州 4 星 / 5 星占比", "宠物友好酒店中的高星供给仍然很少。", kicker="现状 · 平台供给", ratio="377 / 6326"),
    )),
    lab("数字信息 · 成对", stat_grid(
        stat_pair("有氧舱托运", "航司覆盖", "约 65%", "航线覆盖", "约 55–65%"),
        stat_pair("宠物进客舱", "航司覆盖", "约 33%", "航线覆盖", "约 25–30%"),
        cols=2,
    )),
    lab("编号信息", info_grid("2",
        info("01", "核心枢纽与旅游城市优先", "北京、上海、广州、深圳、杭州、成都、西安等枢纽，以及海口、三亚、丽江等旅游城市更常进入白名单。"),
        info("02", "主干航线比支线更成熟", "A320、波音 737 和宽体机更容易具备运输条件；C909 等支线机型通常形成硬约束。"),
        info("03", "“开放”仍会动态变化", "换季、临时换机、高温管控、代码共享和单班宠物名额，都会让“政策支持”与“当天可订”出现差异。"),
        info("04", "航司产品差异明显", "单人可带数量、是否允许占座、箱包尺寸、重量、申请时限和材料要求各不相同。"),
    )),
    lab("编号信息 · 列表", info_grid("stack",
        info("01", "先确认这班能不能运", "查航司、机场、机型、品种和当班名额。"),
        info("02", "订人票，并申请宠物服务", "进客舱 / 同机托运先选人票，再申请同一航班的宠物服务。"),
        info("03", "临近出发办理检疫证明", "携带宠物、身份证或属地居住证明、免疫记录，到申报点接受临床检查。"),
    )),
    lab("编号信息 · 大编号", info_grid("stack",
        info("01", "先确认这班能不能运", "查航司、机场、机型、品种和当班名额。", lg=True),
        info("02", "订人票，并申请宠物服务", "进客舱 / 同机托运先选人票，再申请同一航班的宠物服务。", lg=True),
        info("03", "临近出发办理检疫证明", "携带宠物、身份证或属地居住证明、免疫记录，到申报点接受临床检查。", lg=True),
        no="lg",
    )),
    lab("编号信息 · 横排卡片", info_grid("cols",
        info("01", "先确认这班能不能运", "查航司、机场、机型、品种和当班名额。", lg=True),
        info("02", "订人票，并申请宠物服务", "进客舱 / 同机托运先选人票，再申请同一航班的宠物服务。", lg=True),
        info("03", "临近出发办理检疫证明", "携带宠物、身份证或属地居住证明、免疫记录，到申报点接受临床检查。", lg=True),
        no="lg",
    )),
    lab("编号信息 · 行", info_grid("row",
        info("Q1", "带宠物能否入住？", "犬种、体重、数量限制，以及是否需要入住材料。OTA 展示的信息经常与酒店实际政策不符。"),
        info("01", "宠物档案", "录入品种、体重、芯片、疫苗、性情等结构化信息，自动筛选匹配其体型与政策的可用服务。"),
        info("CAT", "准备猫三联等免疫记录", "部分航司申请时要求猫三联证明；申报点也可能核验其他有效免疫记录。"),
    )),
    lab("编号信息 · 标签", info_grid("label",
        info("运输方式", "专用运输箱", "铁路提供 54×43×40cm 专用运输箱，每箱 1 只，放置在列车指定行李车厢；运输途中不能探视。"),
        info("预约时间", "至少提前 1 天", "当天 12:00 前可约次日，12:00 后最早约第三日。"),
        info("办理材料", "检疫证明当日有效", "携带宠物、本人有效身份证件、购票证明及承运当日有效的《动物检疫合格证明》。"),
        info("线下时间", "开车前至少 2 小时", "到中铁快运营业部办理；列车到站后建议在 1 小时内领取。"),
    )),
    lab("无编号信息", plain_grid(
        plain("价格通常更低", "京杭拼载询价约 ¥450–1,280，明显低于飞机进客舱。"),
        plain("手续更简单", "本次服务商样本多数不要求检疫证明。"),
        plain("宠物类型更广", "滴滴档案覆盖猫、狗、鸟类、鱼类和其他合规宠物。"),
        plain("陪伴方式可选", "可让宠物单独运输，也可选择人宠同行。"),
        surface="tint",
    )),
    lab("观点", point("观点判断", "供给不是问题，而是如何寻找合适的航司进行流程简化和服务能力突破。")),
    lab("观点 · 浅底", point("", "<strong>合作顺序建议：</strong>首选南航，用最大覆盖建立基础供给；第二家选择海航，补足两宠、大箱包和临近出发申请。", soft=True)),
    lab("痛点卡", PAIN_CARD),
    lab("发现", """<article class="finding">
        <h3>信息失真严重：既有“信息缺失”，更有“信息有误”</h3>
        <p>现状下用户需要靠“打电话”才能完成决策。</p>
        <div class="finding-sub">
          <b>① 信息有误——平台写的和实际不符</b>
          <p>电话实测 2 例：一家飞猪写“不可携带宠物”（实际部分房型可以）；另一家写 ¥100 / 晚（实际免费）。</p>
        </div>
        <div class="finding-sub">
          <b>② 信息缺失——决定能否入住的关键条件，平台不展示</b>
          <div class="stat-lines">
            <div class="stat-line"><b>50%</b><p><strong>证件、疫苗时效要求</strong>　5 / 10 家要求养宠许可证 / 疫苗证。</p></div>
            <div class="stat-line"><b>30%</b><p><strong>仅部分房型可带宠物</strong>　3 / 10 家有房型限制。</p></div>
          </div>
        </div>
      </article>"""),
    lab("表格", """<div class="plain-table-wrap"><table class="airline-matrix">
        <thead><tr><th>维度</th>
          <th><span class="airline-title">南方航空 <span class="airline-rank one">TOP 1</span></span></th>
          <th><span class="airline-title">海南航空 <span class="airline-rank two">TOP 2</span></span></th>
          <th><span class="airline-title">东方航空</span></th></tr></thead>
        <tbody>
          <tr><td>覆盖率</td><td class="best">约 57%，45 座机场</td><td>约 43%，38 个城市</td><td>约 47%，36 个国内城市</td></tr>
          <tr><td>申请截止</td><td class="best">起飞前 6 小时</td><td>48h 前在线；进入 24h 后可到机场申请</td><td class="weak">仅起飞前 7 天至 24h</td></tr>
          <tr><td>每位旅客宠物数</td><td>1 只</td><td class="best">最多 2 只</td><td>1 只</td></tr>
          <tr><td>基础价格</td><td>&lt;2000km ¥1299</td><td>¥1430</td><td class="best">¥1288</td></tr>
        </tbody>
      </table></div>"""),
    lab("图", '<div class="shot-grid" data-cols="2">'
        + shot(PROFILE, "滴滴宠物档案", "宠物档案 · 类型更广", "可选狗、猫、鸟类、鱼类和其他合规宠物")
        + shot(METHODS, "动物检疫合格证明示例", "《动物检疫合格证明》示例", "运输方式和行程信息需按实际承运填写。", kind="crop", group="cert")
        + "</div>"),
    lab("图 · 滚动", shot(DELIVER, "玩小伴小程序", "玩小伴 · 微信小程序", "酒店以套餐为主，基本都有平台专属清洁费优惠。", kind="scroll", group="app")),
    lab("图 · 宽", shot(FLOW, "12306 爱宠行链路", "", "进入宠物托运、查询仓位、选择对应人票、锁定仓位并提交订单。", kind="wide")),
    lab("图 · 方案", (
        '<article class="shot-plan"><div class="shot-plan__label"><span>方案</span><h4>飞机</h4></div>'
        + shot(FLOW, "飞机下单链路", "", "串联托运方式说明、检疫代办、航班与服务选择、下单和订单详情。", kind="wide")
        + "</article>"
    )),
    lab("海报墙", '<div class="shot-grid" data-cols="4">'
        + shot(POSTER, "手续帮你办", "", "", kind="poster", group="poster")
        + shot(CABIN, "同舱更安心", "", "", kind="poster", group="poster")
        + shot(PROFILE, "带宠放心住", "", "", kind="poster", group="poster")
        + shot(DELIVER, "一站下单全搞定", "", "", kind="poster", group="poster")
        + "</div>"),
    lab("运输卡", transport_card(
        "飞机进客舱",
        "宠物装入符合要求的软包，随主人进入客舱。陪伴感最好，费用通常最高。",
        [("宠物费用", "约 ¥1,288–1,430 / 只"), ("宠物位置", "客舱座椅下方软包"), ("主人", "必须同行"), ("主要限制", "机场白名单、名额、体重与软包要求")],
        [(CABIN, "软包进客舱"), (CABIN2, "客舱内陪伴"), (METHODS, "费用清单")],
    )),
    lab("韦恩图", VENN),
])

combo_market = "".join([
    head("01 · 市场", "携宠旅行是一个每年超5000万次的潜在旅行市场。"),
    rule(),
    formula(),
    stat_row(
        stat_cell("1.26", "亿只", "城镇犬猫总量"),
        stat_cell("18.7", "%", "年度付费渗透率"),
        stat_cell("1,458", "万人", "年度活跃人群"),
        stat_cell("+30", "%", "携宠住宿客单", accent=True),
        stat_cell("+76", "%", "航空托运溢价", accent=True),
        cols=5,
    ),
    source_note("《2026年中国宠物行业白皮书》", "《携宠出行意愿调研报告》", "《携程酒店数据》"),
])

combo_pain = "".join([
    head("02 · 痛点", "手续麻烦、政策复杂、价格模糊、不确定性，是阻碍用户出行的4个核心痛点。"),
    rule(),
    '<div class="research-lead"><p>信息是真是假、价格是否透明、规则是否适用、下单之后能否履约，全要用户逐一确认——带宠出门，比人出门麻烦多了。</p></div>',
    '<div class="pain-text-list">',
    PAIN_CARD,
    pain("02", "政策复杂", "用户必须逐一确认自己的宠物是否匹配航司要求与酒店政策。", [
        "重量：不设固定 kg、能放进箱即可（南航）；含箱 ≤ 7kg（海航）；不占座 ≤ 10kg、占座 ≤ 18kg（东航）。",
        "尺寸：不占座箱包 40 × 38 × 25cm；占座箱包 60 × 40 × 35cm。",
        "年龄：满 8 周（南航）；满 2 个月（东航）。",
        "数量：最多 1 只（南航、东航）；最多 2 只（海航）。",
    ]),
    pain("03", "价格模糊", "无法判断应该选择哪种运输和住宿方式，价格不可比导致选择困难。", [
        "航空：每家航司的进客舱、同机托运价格不同，还要叠加箱包、保障费和保险。",
        "酒店：29.5% 认为清洁费、押金不透明。",
        "清洁费：可能按每只每晚、每间每晚、每只每间、一次性或免费计收。",
    ]),
    pain("04", "不确定性", "既担心运输途中宠物出事，也担心抵达酒店后被拒。", [
        "高铁：61.6% 担心全程看不到、不能探视。",
        "飞机：69.7% 担心货舱温度、加压和意外。",
        "36.0% 担心到店被拒、酒店临时变卦。",
    ]),
    "</div>",
])

combo_transport = "".join([
    head("06 · 运输全景", "跨城带宠，目前有四条路可走。"),
    rule(),
    '<div class="research-lead"><p>问题不是“有没有运输方式”，而是准入、位置、价格、材料和交接高度非标。平台更有价值的是把四种方式做成可比较、可校验、可下单的结构化信息。</p></div>',
    '<div class="transport-cards">',
    transport_card("飞机进客舱", "软包随主人进客舱。陪伴感最好，费用通常最高。",
                   [("费用", "约 ¥1,288–1,430"), ("位置", "客舱软包"), ("主人", "必须同行")],
                   [(CABIN, "软包"), (CABIN2, "陪伴")]),
    transport_card("飞机托运", "有氧货舱航空箱，可同机或单独飞。两端都要交接。",
                   [("费用", "同机约 ¥548"), ("位置", "有氧货舱"), ("主人", "可同行或不同行")],
                   [(CARGO, "交运"), (CARGO2, "装卸"), (CARGO3, "货舱")]),
    transport_card("高铁托运", "行李车厢恒温监控运输箱，主人通常同车。",
                   [("费用", "约 ¥500 / 只"), ("位置", "行李车厢"), ("主人", "通常同一车次")],
                   [(RAIL, "运输箱"), (RAIL5, "办理区"), (MON, "监控")]),
    transport_card("陆运", "班线、拼车、专车和人宠同行。通常少办一份检疫证明。",
                   [("费用", "约 ¥450–1,280"), ("位置", "笼位或同行"), ("主人", "可同行或不同行")],
                   [(ROAD, "车内"), (VAN, "专业车"), (RIDE, "同行")]),
    "</div>",
])

combo_air = "".join([
    head("07 · 航空规模", "航空供给已经形成规模：有氧舱托运是主流能力，宠物进客舱正在从少数试点扩展为航司付费增值产品。"),
    rule(),
    stat_grid(
        stat_card("34 / 52", "航司支持有氧舱托运", "约 65% 国内常态化客运航司具备政策基础。"),
        stat_card("17 / 52", "航司试点宠物进客舱", "约 33% 航司已开放付费产品。"),
        stat_card("1,100–1,350", "估算进客舱航线池", "约占全国国内单向直达航线的 25%–30%。"),
    ),
    point("观点判断", "供给不是问题，而是如何寻找合适的航司进行流程简化和服务能力突破。"),
])

combo_hotel = "".join([
    head("15 · 住宿七问", "把“宠物友好”从一个标签，拆成可比较、可计算、可确认的结构化信息"),
    rule(),
    '<div class="research-lead"><p>携宠入住的问题不是“有没有宠物友好酒店”，而是标签背后的规则高度非标。</p></div>',
    info_grid("row",
        info("Q1", "带宠物能否入住？", "犬种、体重、数量限制，以及是否需要入住材料。"),
        info("Q2", "额外费用是多少？", "清洁费与保证金，其中清洁费还分“按晚收”和“按次收”。"),
        info("Q3", "是否有房型限制？", "部分酒店只有指定房型可携宠，最低价房型往往不在可携宠范围内。"),
        info("Q4", "活动范围有多大？", "只能待在客房，还是可以去公区、餐厅、户外场地或草坪。"),
    ),
    plain_grid(
        plain("Q1–Q3 决定能不能入住", "准入条件与费用。任何一项不满足，结果是入住失败。"),
        plain("Q4–Q7 决定是不是住得好", "自由度、房间条件、赔偿规则与确认凭证。"),
        cols=2,
        surface="tint",
    ),
])

combo_papers = "".join([
    head("14 · 资质", "三个圈是三类出行场景，正中的交集才是所有场景共同依赖的最小颗粒度。"),
    rule(),
    VENN,
    point("产品含义", "疫苗是唯一的公共分母，应作为宠物档案的<em>必填底座</em>；其余证件按出行方式<em>动态叠加</em>。"),
    info_grid("2",
        info("DOG", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内。"),
        info("CAT", "准备猫三联等免疫记录", "部分航司申请时要求猫三联证明。"),
    ),
])

html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>知识汇报模板 · 流式 v2</title>
  <link rel="stylesheet" href="../shared/components.css">
  <link rel="stylesheet" href="assets/template.css">
  <link rel="stylesheet" href="assets/flow.css">
  <link rel="stylesheet" href="assets/source.css">
  <link rel="stylesheet" href="assets/lib.css">
  <link rel="stylesheet" href="assets/v2.css">
</head>
<body>
  <div class="theme-control" id="themeControl" aria-label="主题控制">
    <div class="theme-control__label">
      <span>THEME</span>
      <strong data-theme-name>Editorial 默认</strong>
    </div>
    <select data-theme-select aria-label="切换主题"></select>
    <button type="button" data-theme-import-trigger>导入主题</button>
    <input data-theme-import type="file" accept="application/json,.json" hidden>
    <p class="theme-control__hint">切换或导入主题后，整页设计语言会同步替换</p>
    <div class="theme-control__toast" data-theme-toast role="status" aria-live="polite"></div>
  </div>

  <div class="report-shell is-flow" data-catalog>
    <nav class="document-nav nav-underline is-sticky" data-component-id="navigation" aria-label="文档章节">
      <div class="document-nav__brand"><span class="document-nav__mark" aria-hidden="true"></span><strong>SEED</strong></div>
      <div class="document-nav__links"><a href="#cover" class="is-active">封面</a>
        <a href="#lib">组件</a>
        <a href="#combo-market">组合</a>
        <a href="#notes">口径</a>
      </div>
    </nav>

    <div class="report-stage" data-report-stage>
      <div class="report-slides" data-report-slides>
        <section class="report-slide is-chapter-cover is-active" data-chapter="cover" data-slide="00" id="cover">
          <header class="chapter-cover">
            <span class="chapter-cover__kicker">流式 v2</span>
            <h2 class="chapter-cover__title">源稿组件库</h2>
            <p class="chapter-cover__lead">从独立版 HTML 拆出的可复用块。结构和作用接近的收成一套父组件，用 data-* / is-* 切换变体。组合是上下叠，不要做成圆角卡片壳，也不要再收成 flow-block。</p>
            <p class="chapter-cover__byline"><span class="chapter-cover__scope">组件 + 组合</span><span class="chapter-cover__kind">editorial-flow</span></p>
            <div class="chapter-cover__actions"><a class="button primary" href="#lib">开始阅读</a></div>
          </header>
        </section>
        <section class="report-section report-slide" data-chapter="lib" data-slide="01" id="lib">
          <div class="flow-stack">{lib}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.a" id="combo-market">
          <div class="flow-stack">{combo_market}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.b" id="combo-pain">
          <div class="flow-stack">{combo_pain}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.c" id="combo-transport">
          <div class="flow-stack">{combo_transport}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.d" id="combo-air">
          <div class="flow-stack">{combo_air}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.e" id="combo-papers">
          <div class="flow-stack">{combo_papers}</div>
        </section>
        <section class="report-section report-slide" data-chapter="combo" data-slide="02.f" id="combo-hotel">
          <div class="flow-stack">{combo_hotel}</div>
        </section>
        <section class="report-slide" data-chapter="notes" data-slide="03" id="notes">
          <footer class="report-notes">
            <h2>怎么用</h2>
            <ol>
              <li>这是流式模板。壳是文档栏：report-shell.is-flow、吸顶导航、flow-stack 上下叠。</li>
              <li>合并后的父组件：<code>.stat-row</code> 横排数字；<code>.stat-card</code> 数字信息（<code>.is-pair</code> 成对）；<code>.info</code> 编号信息（<code>data-layout</code>：2 / stack / row / label / cols；<code>.is-lg</code> / <code>data-no="lg"</code> 大编号）；<code>.plain</code> 无编号信息（<code>data-surface</code>：tint / line）；<code>.point</code> 观点（<code>.is-soft</code> 浅底）；<code>.shot</code> 图（<code>data-kind</code>：photo / crop / scroll / wide / poster）。</li>
              <li>组件库必须带基础 token：间隔 <code>--s-in</code> / <code>--s-stack</code> / <code>--s-chapter</code>；字号 <code>--t-h1</code> / <code>--t-num</code> / <code>--t-no-lg</code> / <code>--t-body</code> / <code>--t-aux</code>；颜色 <code>--c-text</code> 档、<code>--c-line</code>、<code>--c-accent</code>、表数据栏 <code>--c-pos</code> / <code>--c-neg</code>；分割线 <code>.rule</code> / <code>.rule.is-soft</code>。</li>
              <li>仍独立：公式、痛点卡、发现、运输卡、韦恩图、导语、来源、章头、分割线。</li>
              <li>同类块用父组件 + 变体，不要另起皮肤，也不要再收成 flow-block。</li>
              <li>组合变体是同一栏里上下叠。不要把组合做成圆角卡片壳，也不要做成一屏一问。</li>
              <li>每个主标题（<code>.slide-head</code>）下方必须紧跟一条可见的<strong>强线</strong> <code>.rule</code>，不得省略，不得用下一块顶线替代，CSS 不得把这条线 <code>display:none</code>。小节标题下必须有弱线。其余块之间不加线，只靠间距。表 / list / 卡内部只用 1px 弱线。</li>
              <li>间距分三档。区内 <code>--s-in</code>（16，含章头→强线）；章内换排 <code>--s-stack</code>（40，含强线→第一块）；换章 <code>--s-chapter</code>（96）。来源贴在所属证据块下面，不要和换章同一档。</li>
              <li>格内条目留在该卡里。例如痛点卡的百分比、运输卡的费用行，不要抬成新的一排。</li>
              <li>来源写一次。源格没有口径句，就不要补。</li>
              <li>分屏是另一套：templates/editorial-page/。旧稿在 templates/draft/。报告不要抄 data-catalog。</li>
              <li>未进库：城市通航交互网络、酒店热度榜动态表、高铁扩容折线图。需要时压成宽图或静态表。</li>
            </ol>
          </footer>
        </section>
      </div>
    </div>
  </div>
{LIGHTBOX}
  <link rel="stylesheet" href="../../editor/seed-edit.css">
  <script src="../shared/design-data.js"></script>
  <script src="../shared/theme-runtime.js"></script>
  <script src="../../editor/seed-edit.js"></script>
  <script src="assets/template.js"></script>
  <script src="assets/source.js"></script>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
