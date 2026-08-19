#!/usr/bin/env python3
"""Generate editorial-default/index.html: Grid 1 / 2 / 3 / 4 / More Grids."""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")

COPY = "客舱携带不是“能不能带上飞机”，而是航司白名单、体重、笼具和主人是否同行同时成立。先把这四条收成一条可核对的链路，再谈体验和溢价。"
LONG = (
    "带宠出行的摩擦，大多发生在规则散落在航司公告、车站须知和司机口头约定里。"
    "同一只狗，客舱、货舱、高铁行李车和专车陆运用的不是同一套证件与箱包。"
    "咨询阶段把可选项铺开，下单阶段必须收敛成一条可履约路径：谁同行、走哪段、用什么笼子、证件看到哪一天。"
    "<br><br>做不到客舱的，不要用货舱话术硬上；中转超过一次的，不要承诺“门到门当天达”。"
    "材料撑不住的判断写进口径。离开时只记得大字，必须已经得到这一页该给的东西。"
)
SIGNALS = [
    ("SIGNAL 01", "入口必须先问能不能带", "先核航司白名单和体重，再谈舱位与价格，避免先下单后拒载。"),
    ("SIGNAL 02", "比较必须同一口径", "客舱、货舱、高铁、陆运都写：证件、箱包、时效、是否主人同行。"),
    ("SIGNAL 03", "证据要贴着判断", "现场照片和截图只解释这一条规则，不另开一页堆图。"),
    ("SIGNAL 04", "下一步写到人", "离开时知道先打哪个航司热线、准备哪两份证。"),
    ("SIGNAL 05", "承诺止于材料", "季节限额和中转重办，不能写成“一定能带上”。"),
]
STATS = [
    ("11", "可客舱航司", "统计口径：国内客运航司官网 2026 年 6 月公示，不含包机。"),
    ("2.1×", "咨询到下单", "有完整证件清单的会话，相对口头咨询的下单倍率。"),
    ("36", "有效城市对", "陆运专车当前可履约的对开城市，含接驳高铁的组合。"),
    ("4", "硬限制", "体重、狂犬免疫、航空箱尺寸、主人是否必须同行。"),
]
LISTS = [
    ("短途探亲", "主人同行、宠物低于客舱限重时，优先核对航司白名单，而不是先订人票。"),
    ("跨城搬家", "人宠不同行时走陆运专车或货舱，航空箱和检疫证明必须同一天核验。"),
    ("旺季出行", "春运和暑运客舱名额先锁，锁不到再给货舱或改期，不要并行占两张舱。"),
    ("中转行程", "中转超过一次不承诺当天达；每段都要重新确认箱包和交接人。"),
]
STEPS = [
    ("01", "核白名单和体重", "先确认这只宠物能否进客舱或必须货舱，再决定人票舱位。"),
    ("02", "收齐证件和箱包", "狂犬免疫、健康证明、航空箱内尺寸按最严的一段准备。"),
    ("03", "锁舱位再通知现场", "客舱名额或陆运笼位确认后，才把航班号发给司机和接驳人。"),
    ("04", "出发日只核对变化", "只看限重、体温和箱包有没有改口，不再重新讲方案。"),
]
BARS = [
    ("客舱携带", 36, None, "体验最好，规则最碎"),
    ("货舱托运", 82, "warning", "供给最大，应激最高"),
    ("高铁托运", 61, None, "体验稳定，线路有限"),
    ("专车陆运", 48, None, "门到门，成本最高"),
    ("人宠大巴", 24, None, "覆盖窄，需白名单"),
    ("中转联运", 55, "warning", "时效难承诺"),
    ("同城接驳", 19, None, "只补最后一公里"),
    ("改期等待", 88, "danger", "旺季几乎必然"),
]

HREF_CAAC = "https://www.caac.gov.cn/"
HREF_12306 = "https://www.12306.cn/"
HREF_AIR = "https://www.csair.com/"
CABIN = "../states-demo/assets/cabin-01.jpg"


def source(name=None, href=None):
    if not name:
        return ""
    if href:
        return (
            f'<p class="report-source" data-report-source>'
            f'数据来源 <a href="{href}" target="_blank" rel="noopener noreferrer">{name}</a></p>'
        )
    return f'<p class="report-source" data-report-source>数据来源 <span data-source-name>{name}</span></p>'


SOURCE = source("民航局客舱携带规定", HREF_CAAC)
SOURCE_RAIL = source("铁路 12306 宠物托运须知", HREF_12306)
SOURCE_AIR = source("南航旅客服务·宠物运输", HREF_AIR)


SOURCE_OPS = source("2026 上半年咨询会话抽样")


def cells(*inner, n=None, src=True):
    items = list(inner)
    if isinstance(src, (list, tuple)):
        srcs = list(src) + [""] * max(0, len(items) - len(src))
    elif src is True:
        srcs = [SOURCE] * len(items)
    elif not src:
        srcs = [""] * len(items)
    else:
        srcs = [src] * len(items)
    bits = "".join(f'<article class="grid-cell">{x}{s}</article>' for x, s in zip(items, srcs))
    slots = n if n is not None else len(inner)
    return f'<div class="page-grid" data-slots="{slots}">{bits}</div>'


def copy_c():
    return f'<div class="content" data-content="copy"><h3 class="content__title">先收成一条可履约的路径</h3><p class="content__body">{LONG}</p></div>'


def point_c():
    return f'<div class="content" data-content="point"><h3 class="content__title">客舱不是默认选项</h3><p class="content__body">{COPY}</p></div>'


def signal_c(i=0):
    k, t, b = SIGNALS[i]
    return f'<div class="content" data-content="signal"><span class="content__kicker">{k}</span><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div>'


def stat_c(i=0):
    v, t, b = STATS[i]
    return f'<div class="content" data-content="stat"><b class="stat-value">{v}</b><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div>'


def list_c(i=0):
    t, b = LISTS[i]
    return f'<div class="content" data-content="list"><span class="content__label">{t}</span><p class="content__body">{b}</p></div>'


def step_c(i=0):
    n, t, b = STEPS[i]
    return (
        f'<div class="content" data-content="step"><span class="content__index">{n}</span>'
        f'<div class="content__copy"><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div></div>'
    )


def step_stack_c(i=0):
    n, t, b = STEPS[i]
    return (
        f'<div class="content" data-content="step-stack"><div class="content__lead">'
        f'<span class="content__index">{n}</span><h3 class="content__title">{t}</h3></div>'
        f'<p class="content__body">{b}</p></div>'
    )


def table_from(headers, rows):
    bits = []
    for i, head in enumerate(headers):
        cells_html = "".join(f"<span>{row[i]}</span>" for row in rows)
        bits.append(f'<div class="content-col"><strong>{head}</strong>{cells_html}</div>')
    return f'<div class="content" data-content="table"><div class="content-cols">{"".join(bits)}</div></div>'


TABLE_WIDE = table_from(
    ["航司", "客舱", "限重", "笼具", "证件", "报备", "旺季", "中转", "价位", "判断"],
    [
        ["国航", "<strong>可带</strong>", "5 kg", "软包", "狂犬+健康", "48 h", "限额", "需重办", "高", "<em>优先验证</em>"],
        ["东航", "可带", "5 kg", "软包", "狂犬+健康", "24 h", "限额", "需重办", "高", "作备选"],
        ["南航", "<strong>可带</strong>", "5 kg", "软包", "狂犬+健康", "48 h", "严控", "不承诺", "高", "<em>优先验证</em>"],
        ["海航", "可带", "5 kg", "软包", "狂犬+健康", "48 h", "限额", "需重办", "中", "航线先核"],
        ["厦航", "部分", "5 kg", "软包", "狂犬+健康", "72 h", "停售", "不接受", "中", "看始发站"],
        ["春秋", "不可", "—", "航空箱", "狂犬+健康", "72 h", "货舱", "可中转", "低", "改货舱"],
        ["吉祥", "可带", "5 kg", "软包", "狂犬+健康", "48 h", "限额", "需重办", "中", "作补充"],
        ["川航", "部分", "5 kg", "软包", "狂犬+健康", "48 h", "限额", "需重办", "中", "航线先核"],
        ["山航", "不可", "—", "航空箱", "狂犬+健康", "72 h", "货舱", "可中转", "低", "改货舱"],
        ["深航", "可带", "5 kg", "软包", "狂犬+健康", "48 h", "限额", "需重办", "中", "作备选"],
    ],
)
TABLE_AIR = table_from(
    ["航司", "客舱政策", "判断"],
    [
        ["国航", "主人同行 · ≤5 kg · 软包", "<em>优先验证</em>"],
        ["南航", "主人同行 · ≤5 kg · 提前 48 h", "<strong>可锁舱</strong>"],
        ["东航", "主人同行 · 名额少", "作备选"],
        ["春秋", "不接受客舱", "改货舱或陆运"],
        ["厦航", "视始发站开放", "当天核官网"],
        ["海航", "可带但旺季限额", "先问热线"],
    ],
)
TABLE_RAIL = table_from(
    ["线路", "托运条件", "判断"],
    [
        ["京沪", "专用运输箱 · 同一车次", "<strong>体验稳定</strong>"],
        ["广深港", "不接受活体", "改陆运"],
        ["成渝", "行李车有位才收", "出发前 24 h 确认"],
        ["杭温", "检疫证明当日有效", "可作补充"],
        ["京广", "高峰停办", "避开节前三天"],
        ["沪昆", "箱内温湿度可查", "<em>优先联运</em>"],
    ],
)
TABLE_ROAD = table_from(
    ["城市对", "时效", "判断"],
    [
        ["沪杭", "门到门 4 h", "<em>优先</em>"],
        ["京津", "门到门 3 h", "<strong>可当日</strong>"],
        ["广深", "6–8 h · 含接驳", "避开晚高峰"],
        ["成渝", "4 h", "笼位充足"],
        ["沪宁", "3 h", "可加急"],
        ["京沪", "过夜专车", "不承诺次日早"],
    ],
)
TABLE_DOCS = table_from(
    ["材料", "有效期", "用途"],
    [
        ["狂犬免疫", "接种满 21 天", "客舱 / 货舱 / 高铁"],
        ["健康证明", "出具 7 日内", "货舱与跨省陆运"],
        ["宠物照片", "近 30 日", "下单核对毛色"],
        ["航空箱尺寸", "按最严航司", "货舱必查"],
        ["主人证件", "与订票一致", "客舱同行"],
        ["交接授权", "当日手写", "人宠不同行"],
    ],
)


def table_c(kind="air"):
    return {
        "wide": TABLE_WIDE,
        "air": TABLE_AIR,
        "rail": TABLE_RAIL,
        "road": TABLE_ROAD,
        "docs": TABLE_DOCS,
    }[kind]


def bar_h(n=8):
    items = []
    for label, val, tone, note in BARS[:n]:
        tone_attr = f' data-tone="{tone}"' if tone else ""
        items.append(
            f'<div class="bar-compare__item"><div class="bar-compare__row">'
            f'<span class="bar-compare__label">{label}</span>'
            f'<div class="bar-compare__track"><div class="bar-compare__fill"{tone_attr} style="width:{val}%"></div></div>'
            f'<strong class="bar-compare__value">{val}</strong></div>'
            f'<p class="bar-compare__note">{note}</p></div>'
        )
    return f'<div class="bar-compare" data-item-count="{n}"><p class="bar-compare__title">咨询结构 · 出行方式</p>{"".join(items)}</div>'


def bar_v(n=4):
    items = []
    for label, val, tone, note in BARS[:n]:
        tone_attr = f' data-tone="{tone}"' if tone else ""
        items.append(
            f'<div class="bar-compare__item">'
            f'<strong class="bar-compare__value">{val}</strong>'
            f'<div class="bar-compare__track"><div class="bar-compare__fill"{tone_attr} style="--bar-size:{val}%"></div></div>'
            f'<span class="bar-compare__label">{label}</span>'
            f'<p class="bar-compare__note">{note}</p></div>'
        )
    return f'<div class="bar-compare is-vertical" data-item-count="{n}"><p class="bar-compare__title">履约把握</p>{"".join(items)}</div>'


def formula_c():
    return (
        '<div class="formula" data-item-count="4">'
        '<div class="formula__factor"><b><small>≤</small>5 kg</b><span>客舱限重</span></div>'
        '<span class="formula__op">×</span>'
        '<div class="formula__factor"><b>证件</b><span>狂犬+健康证</span></div>'
        '<span class="formula__op">×</span>'
        '<div class="formula__factor"><b>白名单</b><span>航司允许客舱</span></div>'
        '<span class="formula__op is-eq">=</span>'
        '<div class="formula__factor is-result"><b>可带</b><span>主人同行客舱</span></div>'
        "</div>"
    )


def matrix_c():
    return (
        '<div class="matrix" data-item-count="4">'
        '<span class="matrix__axis" data-edge="left">难协调</span>'
        '<div class="matrix__plot">'
        '<span class="matrix__axis" data-edge="top">体验好</span>'
        '<div class="matrix__quads">'
        '<article class="matrix__cell"><strong>客舱携带</strong><p>体验最好，规则最碎，要逐家核</p></article>'
        '<article class="matrix__cell"><strong>高铁托运</strong><p>体验稳定，线路少，箱位要预留</p></article>'
        '<article class="matrix__cell"><strong>货舱托运</strong><p>供给最大，应激高，中转需重办</p></article>'
        '<article class="matrix__cell"><strong>专车陆运</strong><p>门到门可控，成本最高</p></article>'
        "</div>"
        '<span class="matrix__axis" data-edge="bottom">体验差</span>'
        "</div>"
        '<span class="matrix__axis" data-edge="right">好落地</span>'
        "</div>"
    )


def line_c():
    return (
        '<figure class="line-chart" data-series="1">'
        '<ul class="line-chart__legend"><li data-series="a">客舱携带咨询</li></ul>'
        '<svg class="line-chart__plot" viewBox="0 0 640 280" preserveAspectRatio="xMidYMid meet"></svg>'
        '<ol class="line-chart__points">'
        "<li><span>1月</span><b data-chart-series=\"a\">18</b></li>"
        "<li><span>2月</span><b data-chart-series=\"a\">41</b></li>"
        "<li><span>3月</span><b data-chart-series=\"a\">27</b></li>"
        "<li><span>4月</span><b data-chart-series=\"a\">33</b></li>"
        "<li><span>5月</span><b data-chart-series=\"a\">38</b></li>"
        "</ol></figure>"
    )


def venn2_c():
    return (
        '<div class="venn" data-circles="2">'
        '<svg class="venn__plot" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
        "<defs><clipPath id=\"venn-2-a\"><circle cx=\"145\" cy=\"120\" r=\"92\"></circle></clipPath></defs>"
        '<circle class="venn__circle" data-set="a" cx="145" cy="120" r="92"></circle>'
        '<circle class="venn__circle" data-set="b" cx="255" cy="120" r="92"></circle>'
        '<circle class="venn__overlap" cx="255" cy="120" r="92" clip-path="url(#venn-2-a)"></circle>'
        "</svg>"
        '<p class="venn__label" data-region="a">客舱规则</p>'
        '<p class="venn__label" data-region="b">货舱规则</p>'
        '<p class="venn__label" data-region="ab">检疫与箱包</p>'
        "</div>"
    )


def venn3_c():
    return (
        '<div class="venn" data-circles="3">'
        '<svg class="venn__plot" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
        "<defs>"
        "<clipPath id=\"venn-3-a\"><circle cx=\"150\" cy=\"118\" r=\"86\"></circle></clipPath>"
        "<clipPath id=\"venn-3-ab\"><circle cx=\"150\" cy=\"118\" r=\"86\"></circle></clipPath>"
        "</defs>"
        '<circle class="venn__circle" data-set="a" cx="150" cy="118" r="86"></circle>'
        '<circle class="venn__circle" data-set="b" cx="250" cy="118" r="86"></circle>'
        '<circle class="venn__circle" data-set="c" cx="200" cy="198" r="86"></circle>'
        '<circle class="venn__overlap" cx="250" cy="118" r="86" clip-path="url(#venn-3-a)"></circle>'
        '<circle class="venn__overlap" cx="200" cy="198" r="86" clip-path="url(#venn-3-ab)"></circle>'
        "</svg>"
        '<p class="venn__label" data-region="a">客舱</p>'
        '<p class="venn__label" data-region="b">货舱</p>'
        '<p class="venn__label" data-region="c">中转</p>'
        '<p class="venn__label" data-region="ab">箱包</p>'
        '<p class="venn__label" data-region="abc">检疫</p>'
        "</div>"
    )


ASSET = "../states-demo/assets"


def region(inner):
    return (
        '<div class="page-regions" data-regions="1" data-align="center">'
        f'<div class="page-region" data-size="fill" data-align="center">{inner}</div></div>'
    )


def evidence_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-ratio="3:4" data-image-fit="fill" data-item-count="3">'
        f'<figure class="evidence-figure" data-image-ratio="3:4" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/cabin-01.jpg" alt="宠物装入软包进入飞机客舱"></div>'
        "<figcaption><b>客舱软包</b><span>登机口称重后装入软包，置于座椅下方</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="3:4" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/rail-01.jpg" alt="高铁行李车厢内的宠物专用运输箱"></div>'
        "<figcaption><b>高铁运输箱</b><span>行李车厢固定位，温湿度可查，需预留箱位</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="3:4" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-01.jpg" alt="宠物跨城运输车辆内部"></div>'
        "<figcaption><b>陆运笼位</b><span>专车固定笼，人宠可不同行，交接人写进运单</span></figcaption></figure></div>"
    )


def evidence_shot_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit" data-item-count="3">'
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-profile.png" alt="宠物档案界面"></div>'
        "<figcaption><b>宠物档案</b><span>体重、疫苗和近照必须对上同一只</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-travel.png" alt="宠物出行下单界面"></div>'
        "<figcaption><b>出行下单</b><span>先锁舱位，再填箱包尺寸和证件有效期</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-delivery.png" alt="宠物配送进度界面"></div>'
        "<figcaption><b>配送进度</b><span>交接人、箱号和下一站在同一屏核对</span></figcaption></figure></div>"
    )


def evidence_wide_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-ratio="4:3" data-image-fit="fill" data-item-count="3">'
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-01.jpg" alt="宠物跨城运输车辆内部"></div>'
        "<figcaption><b>跨城专车</b><span>笼位固定、空调直吹箱体，适合人宠不同行</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-03.jpg" alt="带固定笼位的专业宠物运输车"></div>'
        "<figcaption><b>专业运输车</b><span>独立笼位带锁定，出发前核对箱号与芯片</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/ride-together.jpg" alt="人宠共同乘坐跨城车辆"></div>'
        "<figcaption><b>人宠同行</b><span>主人坐副驾，宠物在后舱笼位，中途可停车查看</span></figcaption></figure></div>"
    )


def evidence_strip_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-kind="strip" data-item-count="1">'
        f'<figure class="evidence-figure" data-image-kind="strip">'
        f'<div class="evidence-window"><img src="{ASSET}/rail-ota-flow.jpg" alt="高铁宠物托运预约流程合成条"></div>'
        "<figcaption><b>12306 预约</b><span>选车次 → 填箱位 → 上传检疫证明，箱位确认前不要买人票</span></figcaption></figure></div>"
    )


def evidence_switch_c():
    def fig(label, thumbs, lead, rows):
        thumb_html = "".join(
            f'<button class="media-switch__thumb{" is-active" if i == 0 else ""}" type="button" '
            f'data-src="{src}" data-alt="{alt}"><img src="{src}" alt="{cap}"></button>'
            for i, (src, alt, cap) in enumerate(thumbs)
        )
        row_html = "".join(
            f'<div class="list-row"><span class="list-row__label">{key}</span><p class="list-row__text">{val}</p></div>'
            for key, val in rows
        )
        src0, alt0, _ = thumbs[0]
        return (
            f'<figure class="evidence-figure media-switch is-cover" data-hover="on" data-image-ratio="9:16" data-image-fit="fill">'
            f'<div class="evidence-window"><img data-media-main src="{src0}" alt="{alt0}">'
            f'<div class="media-switch__thumbs" aria-label="切换{label}图片">{thumb_html}</div>'
            f'<div class="media-switch__panel"><h3>{label}</h3><p>{lead}</p>'
            f'<div class="list-block">{row_html}</div></div></div>'
            f'<button class="media-switch__label" type="button">{label}</button></figure>'
        )

    items = [
        fig(
            "飞机进客舱",
            [
                (f"{ASSET}/cabin-01.jpg", "宠物装入软包进入飞机客舱", "软包内的客舱宠物"),
                (f"{ASSET}/cabin-02.jpg", "宠物在飞机客舱内", "客舱内的宠物"),
            ],
            "软包进客舱只在主人同行、体重 ≤5 kg、航司在白名单时成立",
            [("宠物位置", "客舱座椅下方软包"), ("主人", "必须同行")],
        ),
        fig(
            "飞机托运",
            [
                (f"{ASSET}/air-cargo-01.jpg", "航空箱在机场完成固定与交运", "航空箱固定"),
                (f"{ASSET}/air-cargo-02.jpg", "工作人员装卸宠物航空箱", "机场装卸"),
                (f"{ASSET}/air-cargo-03.jpg", "飞机货舱内部环境", "货舱内部"),
            ],
            "货舱供给最大，应激高；中转超过一次必须重新交运，不承诺当天达",
            [("宠物位置", "有氧货舱航空箱"), ("主人", "可同行或不同行")],
        ),
        fig(
            "高铁托运",
            [
                (f"{ASSET}/rail-05.jpg", "高铁宠物运输箱的温湿度与氧气监控", "环境监控屏"),
                (f"{ASSET}/rail-01.jpg", "高铁行李车厢内的宠物专用运输箱", "高铁宠物运输箱"),
            ],
            "体验稳定、线路有限；箱位要提前锁，高峰车次可能停办活体",
            [("宠物位置", "行李车厢专用运输箱"), ("主人", "通常乘坐同一车次")],
        ),
        fig(
            "陆运",
            [
                (f"{ASSET}/road-01.jpg", "宠物跨城运输车辆内部", "运输车辆内部"),
                (f"{ASSET}/road-03.jpg", "带固定笼位的专业宠物运输车", "专业运输车"),
            ],
            "门到门可控，成本最高；适合人宠不同行，或客舱、高铁都走不通的城市对",
            [("宠物位置", "运输车笼位或同行座舱"), ("主人", "可同行或不同行")],
        ),
    ]
    return region(
        '<div class="image-grid evidence-gallery" data-image-ratio="9:16" data-image-fit="fill" data-item-count="4">'
        + "".join(items)
        + "</div>"
    )


CHAPTER_LABEL = {
    "grid1": "Grid 1",
    "grid2": "Grid 2",
    "grid3": "Grid 3",
    "grid4": "Grid 4",
    "more": "More",
    "evidence": "Evidence",
}


def slide(chapter, no, sid, title, part, body, source=False):
    label = CHAPTER_LABEL.get(chapter, chapter)
    return f"""        <section class="report-section report-slide" data-chapter="{chapter}" data-slide="{no}" id="{sid}">
          <header class="section-header">
            <span class="section-header__no">{no} · {label}</span>
            <div>
              <h2 class="section-header__title">{title}</h2>
              <p class="section-header__part">{part}</p>
            </div>
          </header>
          {body}
        </section>
"""


def cover(chapter, no, sid, kicker, title, lead, image=None, active=False, number=True, date=None, author=None, subtitle=None, kind=None, scope=None, cta=None, cta_href="#grid1"):
    media = (
        f'<div class="chapter-cover__media" data-caption="off"><img src="{image}" alt=""></div>'
        if image else ""
    )
    cover_attr = ' data-cover="image"' if image else ""
    active_cls = " is-active" if active else ""
    no_el = f'<span class="chapter-cover__no">{no}</span>' if number else ""
    sub_el = f'<p class="chapter-cover__subtitle">{subtitle}</p>' if subtitle else ""
    bits = []
    if scope:
        bits.append(f'<span class="chapter-cover__scope">{scope}</span>')
    if kind:
        bits.append(f'<span class="chapter-cover__kind">{kind}</span>')
    if author:
        bits.append(f'<span class="chapter-cover__author">{author}</span>')
    if date:
        bits.append(f'<span class="chapter-cover__date">{date}</span>')
    byline = f'<p class="chapter-cover__byline">{"".join(bits)}</p>' if bits else ""
    btn_class = "button inverse" if image else "button primary"
    actions = (
        f'<div class="chapter-cover__actions"><a class="{btn_class}" href="{cta_href}">{cta}</a></div>'
        if cta else ""
    )
    return f"""        <section class="report-slide is-chapter-cover{active_cls}" data-chapter="{chapter}" data-slide="{no}" id="{sid}">
          <header class="chapter-cover"{cover_attr}>
            {media}{no_el}
            <span class="chapter-cover__kicker">{kicker}</span>
            <h2 class="chapter-cover__title">{title}</h2>
            {sub_el}
            <p class="chapter-cover__lead">{lead}</p>
            {byline}
            {actions}
          </header>
        </section>
"""


def many(factory, count, slots, src=False):
    return cells(*[factory(i) for i in range(count)], n=slots, src=src)


parts = []

parts.append("""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>知识汇报模板 · Editorial Default</title>
  <link rel="stylesheet" href="../shared/components.css">
  <link rel="stylesheet" href="assets/template.css">
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

  <div class="report-shell is-deck">
    <nav class="document-nav nav-underline is-sticky" data-component-id="navigation" aria-label="文档章节">
      <div class="document-nav__brand"><span class="document-nav__mark" aria-hidden="true"></span><strong>SEED</strong></div>
      <div class="document-nav__links">
        <a href="#cover" class="is-active">封面</a>
        <a href="#grid1">Grid 1</a>
        <a href="#grid2">Grid 2</a>
        <a href="#grid3">Grid 3</a>
        <a href="#grid4">Grid 4</a>
        <a href="#more">More Grids</a>
        <a href="#evidence">Evidence</a>
        <a href="#fullscreen">全屏</a>
        <a href="#notes">口径</a>
      </div>
    </nav>

    <div class="report-stage" data-report-stage>
      <header class="section-header report-deck-head" data-deck-head>
        <div class="report-deck-head__copy">
          <h2 class="section-header__title" data-deck-title></h2>
          <p class="section-header__part" data-deck-part hidden></p>
        </div>
        <span class="section-header__no" data-deck-no></span>
      </header>

      <div class="report-slides" data-report-slides>
""")

parts.append(cover(
    "cover", "00", "cover", "一站式携宠旅行解决方案", "携宠出行服务",
    "让“带宠出游”从一次次艰难的攻略拼凑，变成一条可被信赖的完整链路。",
    image=CABIN,
    active=True,
    number=False,
    subtitle="Pet-friendly Travel Solution",
    scope="9 章",
    kind="提案汇报稿",
    author="SEED",
    date="2026.08",
    cta="开始阅读",
    cta_href="#grid1",
))

parts.append(cover("grid1", "01", "grid1", "一格", "Grid 1", "整块 Content 占一格。数据来源在白卡里。"))

g1 = [
    ("01.a", "g1-copy", "纯文字", "一格 · 标题 + 正文", cells(copy_c(), src=False)),
    ("01.b", "g1-point", "观点", "一格 · 结论 + 说明", cells(point_c(), src=False)),
    ("01.c", "g1-signal", "带序号观点", "一格 · SIGNAL + 标题 + 说明", cells(signal_c(), src=False)),
    ("01.d", "g1-stat", "数据", "一格 · 数字 + 名 + 口径", cells(stat_c(), src=SOURCE_OPS)),
    ("01.e", "g1-list", "列表", "一格 · 一条", cells(list_c(), src=False)),
    ("01.f", "g1-step", "编号列表", "一格 · 序号在左", cells(step_c(), src=False)),
    ("01.g", "g1-step-stack", "编号列表纵向", "一格 · 序号压在标题上", cells(step_stack_c(), src=False)),
    ("01.h", "g1-table", "表格宽", "一格 · 整表 · 10 列 · strong / em", cells(table_c("wide"), src=SOURCE_AIR)),
    ("01.i", "g1-bar", "Bar", "一格 · 横条 + 结构标题", cells(bar_h(), src=SOURCE_OPS)),
    ("01.j", "g1-bar-v", "Bar 纵向", "一格 · 竖条 + 结构标题", cells(bar_v(), src=SOURCE_OPS)),
    ("01.k", "g1-formula", "因子公式", "一格 · 用 x 相乘", cells(formula_c(), src=SOURCE)),
    ("01.l", "g1-matrix", "Matrix", "一格 · 两轴四象限", cells(matrix_c(), src=False)),
    ("01.m", "g1-line", "Line Chart", "一格 · 同一指标随时间", cells(line_c(), src=SOURCE_OPS)),
    ("01.n", "g1-venn", "Venn 两圆", "一格 · 两个集合", cells(venn2_c(), src=False)),
    ("01.o", "g1-venn3", "Venn 三圆", "一格 · 三个集合", cells(venn3_c(), src=False)),
]
for no, sid, title, part, body in g1:
    parts.append(slide("grid1", no, sid, title, part, body))

parts.append(cover("grid2", "02", "grid2", "两格", "Grid 2", "并排两格，同一种 Content。"))
g2 = [
    ("02.a", "g2-signal", "带序号观点", "两格", many(signal_c, 2, 2)),
    ("02.b", "g2-stat", "数据", "两格", many(stat_c, 2, 2, src=SOURCE_OPS)),
    ("02.c", "g2-list", "列表", "两格", many(list_c, 2, 2)),
    ("02.d", "g2-step", "编号列表", "两格 · 横排", many(step_c, 2, 2)),
    ("02.e", "g2-table", "表格", "两格 · 客舱 / 高铁", cells(table_c("air"), table_c("rail"), n=2, src=[SOURCE_AIR, SOURCE_RAIL])),
    ("02.f", "g2-bar", "Bar", "两格 · 竖条", cells(bar_v(), bar_v(), n=2, src=SOURCE_OPS)),
]
for no, sid, title, part, body in g2:
    parts.append(slide("grid2", no, sid, title, part, body))

parts.append(cover("grid3", "03", "grid3", "三格", "Grid 3", "并排三格。编号列表用纵向。"))
g3 = [
    ("03.a", "g3-signal", "带序号观点", "三格", many(signal_c, 3, 3)),
    ("03.b", "g3-stat", "数据", "三格", many(stat_c, 3, 3, src=SOURCE_OPS)),
    ("03.c", "g3-list", "列表", "三格", many(list_c, 3, 3)),
    ("03.d", "g3-step", "编号列表", "三格 · 纵向", many(step_stack_c, 3, 3)),
    ("03.e", "g3-table", "表格", "三格 · 客舱 / 高铁 / 陆运", cells(table_c("air"), table_c("rail"), table_c("road"), n=3, src=[SOURCE_AIR, SOURCE_RAIL, ""])),
    ("03.f", "g3-bar", "Bar", "三格 · 竖条", cells(bar_v(), bar_v(), bar_v(), n=3, src=SOURCE_OPS)),
]
for no, sid, title, part, body in g3:
    parts.append(slide("grid3", no, sid, title, part, body))

parts.append(cover("grid4", "04", "grid4", "四格", "Grid 4", "2×2。"))
g4 = [
    ("04.a", "g4-signal", "带序号观点", "四格 · 2×2", many(signal_c, 4, 4)),
    ("04.b", "g4-stat", "数据", "四格 · 2×2", many(stat_c, 4, 4, src=SOURCE_OPS)),
    ("04.c", "g4-list", "列表", "四格 · 2×2", many(list_c, 4, 4)),
    ("04.d", "g4-step", "编号列表", "四格 · 横排", many(step_c, 4, 4)),
    ("04.e", "g4-table", "表格", "四格 · 客舱 / 高铁 / 陆运 / 证件", cells(table_c("air"), table_c("rail"), table_c("road"), table_c("docs"), n=4, src=[SOURCE_AIR, SOURCE_RAIL, "", SOURCE])),
    ("04.f", "g4-bar", "Bar", "四格 · 竖条", cells(*[bar_v() for _ in range(4)], n=4, src=SOURCE_OPS)),
]
for no, sid, title, part, body in g4:
    parts.append(slide("grid4", no, sid, title, part, body))

parts.append(cover("more", "05", "more", "更多格子", "More Grids", "5+ 横滑复用 Grid 3。"))
g5 = [
    ("05.a", "g5-signal", "带序号观点", "5+ · 横滑", many(signal_c, 5, 5)),
    ("05.b", "g5-stat", "数据", "5+ · 横滑", many(stat_c, 4, 5, src=SOURCE_OPS)),
    ("05.c", "g5-list", "列表", "5+ · 横滑", many(list_c, 4, 5)),
    ("05.d", "g5-step", "编号列表", "5+ · 纵向", many(step_stack_c, 4, 5)),
    ("05.e", "g5-table", "表格", "5+ · 横滑", cells(table_c("air"), table_c("rail"), table_c("road"), table_c("docs"), n=5, src=[SOURCE_AIR, SOURCE_RAIL, "", SOURCE])),
    ("05.f", "g5-bar", "Bar", "5+ · 竖条", cells(*[bar_v() for _ in range(4)], n=5, src=SOURCE_OPS)),
]
for no, sid, title, part, body in g5:
    parts.append(slide("more", no, sid, title, part, body))

parts.append(cover("evidence", "06", "evidence", "证据", "Evidence", "图、截图、条带与 Media Switch。不进 Grid 格。"))
parts.append(slide("evidence", "06.a", "ev-photo", "Evidence", "图 + 图注。不进 Grid 格", evidence_c()))
parts.append(slide("evidence", "06.b", "ev-shot", "Evidence 截图", "截图 · 0.46:1 Fit。不进 Grid 格", evidence_shot_c()))
parts.append(slide("evidence", "06.c", "ev-wide", "Evidence 横屏", "横屏大图 · 4:3 Fill。不进 Grid 格", evidence_wide_c()))
parts.append(slide("evidence", "06.d", "ev-strip", "Evidence 条带", "宽图横滑。不进 Grid 格", evidence_strip_c()))
parts.append(slide("evidence", "06.e", "ev-switch", "Evidence 封面", "Media Switch · 默认多张并排。不进 Grid 格", evidence_switch_c()))

parts.append(cover("fullscreen", "07", "fullscreen", "页皮", "全屏", "永远 1 块。有图、无图，或只有图。"))
parts.append(slide(
    "fullscreen", "07.a", "full-image", "全屏有图", "图铺满当底，中间一块 Content",
    '<div class="full-page" data-full="image">'
    f'<div class="full-page__media" data-caption="off"><img src="{CABIN}" alt="全屏底图"></div>'
    f'<article class="grid-cell">{copy_c()}{SOURCE_AIR}</article></div>',
))
parts.append(slide(
    "fullscreen", "07.b", "full-none", "全屏无图", "浅底，一块 Content · 无出处则不出来源",
    f'<div class="full-page" data-full="none"><article class="grid-cell">{copy_c()}</article></div>',
))
parts.append(slide(
    "fullscreen", "07.c", "full-photo", "全屏只有图", "只有图，没有文字",
    '<div class="full-page" data-full="image" data-copy="off">'
    f'<div class="full-page__media" data-caption="off"><img src="{CABIN}" alt="全屏图片"></div>'
    f'{SOURCE_AIR}</div>',
))

parts.append("""        <section class="report-slide" data-chapter="notes" data-slide="09" id="notes">
          <footer class="report-notes">
            <h2>模板使用说明</h2>
            <ol>
              <li>封面用真实文案：标题、说明、分类章节、作者、日期，并提供开始阅读。</li>
              <li>先定 Content，再选 Grid。一个 Grid 只放一种 Content。</li>
              <li>Grid 1 / 2 / 3 / 4 / More。列表和步骤一条就是一格。Grid 3 / 5+ 的编号列表用纵向。</li>
              <li>表和条整块占一格，宽度铺满，行间有分割线。可以上下滚动，不显示滚动条。有出处才写「数据来源」并挂链接；没有出处这一行不出现。字号 Caption（12），放在白卡内容区，居中。</li>
              <li>单元格里 <strong>加粗</strong> 用 strong，<em>强调</em> 用 em（强调色 + 加粗）。同一张表里示意即可，不要另开强调组件。</li>
              <li>Evidence 单独成章：现场图、截图、横屏、条带、Media Switch。不进 Grid 格。封面默认并排多张。</li>
              <li>全屏单独成章：有图、无图，或只有图。永远 1 块。</li>
              <li>视觉由设计 Token 驱动。主题与翻页栏默认隐藏，鼠标移到屏幕左下角才显示。</li>
            </ol>
          </footer>
        </section>
      </div>
    </div>

    <div class="report-pager" data-report-pager>
      <button class="button subtle" type="button" data-slide-prev>上一屏</button>
      <span class="report-pager__label" data-slide-label aria-live="polite">00</span>
      <button class="button subtle" type="button" data-slide-next>下一屏</button>
    </div>
  </div>

  <script src="../shared/design-data.js"></script>
  <script src="../shared/theme-runtime.js"></script>
  <script src="assets/template.js"></script>
</body>
</html>
""")

OUT.write_text("".join(parts), encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
