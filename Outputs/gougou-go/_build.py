#!/usr/bin/env python3
"""Build index.html from report.md. Do not slice the source HTML."""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")
A = "assets"


def source(name=None):
    if not name:
        return ""
    return f'<p class="report-source" data-report-source>数据来源 <span data-source-name>{name}</span></p>'


def cells(*inner, n=None, src=False):
    items = list(inner)
    if isinstance(src, (list, tuple)):
        srcs = list(src) + [""] * max(0, len(items) - len(src))
    elif src is True:
        srcs = [""] * len(items)
    elif not src:
        srcs = [""] * len(items)
    else:
        srcs = [src] * len(items)
    bits = "".join(f'<article class="grid-cell">{x}{s}</article>' for x, s in zip(items, srcs))
    count = len(items)
    slots = 10 if count > 9 else count
    return f'<div class="page-grid" data-slots="{slots}">{bits}</div>'


def copy_c(title, body):
    return f'<div class="content" data-content="copy"><h3 class="content__title">{title}</h3><p class="content__body">{body}</p></div>'


def point_c(title, body):
    return f'<div class="content" data-content="point"><h3 class="content__title">{title}</h3><p class="content__body">{body}</p></div>'


def signal_c(i, title, body):
    return (
        f'<div class="content" data-content="signal"><span class="content__kicker">SIGNAL {i:02d}</span>'
        f'<h3 class="content__title">{title}</h3><p class="content__body">{body}</p></div>'
    )


def stat_c(val, title, body):
    return f'<div class="content" data-content="stat"><b class="stat-value">{val}</b><h3 class="content__title">{title}</h3><p class="content__body">{body}</p></div>'


def list_c(label, body):
    return f'<div class="content" data-content="list"><span class="content__label">{label}</span><p class="content__body">{body}</p></div>'


def step_c(n, title, body):
    return (
        f'<div class="content" data-content="step"><span class="content__index">{n}</span>'
        f'<div class="content__copy"><h3 class="content__title">{title}</h3><p class="content__body">{body}</p></div></div>'
    )


def step_stack_c(n, title, body):
    return (
        f'<div class="content" data-content="step-stack"><div class="content__lead">'
        f'<span class="content__index">{n}</span><h3 class="content__title">{title}</h3></div>'
        f'<p class="content__body">{body}</p></div>'
    )


def table_from(headers, rows):
    bits = []
    for i, head in enumerate(headers):
        cells_html = "".join(f"<span>{row[i]}</span>" for row in rows)
        bits.append(f'<div class="content-col"><strong>{head}</strong>{cells_html}</div>')
    cols, row_n = len(headers), 1 + len(rows)
    return (
        f'<div class="content" data-content="table">'
        f'<div class="content-cols" style="--table-cols:{cols};--table-rows:{row_n}">{"".join(bits)}</div>'
        f"</div>"
    )


def region(inner):
    return (
        '<div class="page-regions" data-regions="1" data-align="center">'
        f'<div class="page-region" data-size="fill" data-align="center">{inner}</div></div>'
    )


def evidence(items, *, kind=None, ratio="3:4", fit="fill"):
    n = len(items)
    kind_attr = f' data-image-kind="{kind}"' if kind else ""
    ratio_attr = "" if kind == "strip" else f' data-image-ratio="{ratio}"'
    fit_attr = "" if kind == "strip" else f' data-image-fit="{fit}"'
    figs = []
    for src, alt, title, cap in items:
        fig_kind = f' data-image-kind="{kind}"' if kind else ""
        fig_ratio = "" if kind == "strip" else f' data-image-ratio="{ratio}"'
        fig_fit = "" if kind == "strip" else f' data-image-fit="{fit}"'
        figs.append(
            f'<figure class="evidence-figure"{fig_kind}{fig_ratio}{fig_fit}>'
            f'<div class="evidence-window"><img src="{src}" alt="{alt}"></div>'
            f"<figcaption><b>{title}</b><span>{cap}</span></figcaption></figure>"
        )
    return region(
        f'<div class="image-grid evidence-gallery"{kind_attr}{ratio_attr}{fit_attr} data-item-count="{n}">'
        + "".join(figs)
        + "</div>"
    )


def media_switch(cards):
    figs = []
    for label, thumbs, lead, rows in cards:
        thumb_html = "".join(
            f'<button class="media-switch__thumb{" is-active" if i == 0 else ""}" type="button" '
            f'data-src="{src}" data-alt="{alt}"><img src="{src}" alt="{cap}"></button>'
            for i, (src, alt, cap) in enumerate(thumbs)
        )
        row_html = "".join(
            f'<div class="list-row"><span class="list-row__label">{k}</span><p class="list-row__text">{v}</p></div>'
            for k, v in rows
        )
        src0, alt0, _ = thumbs[0]
        figs.append(
            f'<figure class="evidence-figure media-switch is-cover" data-hover="on" data-image-ratio="9:16" data-image-fit="fill">'
            f'<div class="evidence-window"><img data-media-main src="{src0}" alt="{alt0}">'
            f'<div class="media-switch__thumbs" aria-label="切换{label}图片">{thumb_html}</div>'
            f'<div class="media-switch__panel"><h3>{label}</h3><p>{lead}</p>'
            f'<div class="list-block">{row_html}</div></div></div>'
            f'<button class="media-switch__label" type="button">{label}</button></figure>'
        )
    return region(
        f'<div class="image-grid evidence-gallery" data-image-ratio="9:16" data-image-fit="fill" data-item-count="{len(cards)}">'
        + "".join(figs)
        + "</div>"
    )


CHAPTER = {}


def slide(chapter, no, sid, title, part, body):
    label = CHAPTER.get(chapter, chapter)
    part_el = f'<p class="section-header__part">{part}</p>' if part else ""
    return f"""        <section class="report-section report-slide" data-chapter="{chapter}" data-slide="{no}" id="{sid}">
          <header class="section-header">
            <span class="section-header__no">{no} · {label}</span>
            <div>
              <h2 class="section-header__title">{title}</h2>
              {part_el}
            </div>
          </header>
          {body}
        </section>
"""


def cover(chapter, no, sid, kicker, title, lead, image=None, active=False, number=True, subtitle=None, kind=None, scope=None, author=None, date=None, cta=None, cta_href="#why"):
    media = f'<div class="chapter-cover__media" data-caption="off"><img src="{image}" alt=""></div>' if image else ""
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
    actions = f'<div class="chapter-cover__actions"><a class="{btn_class}" href="{cta_href}">{cta}</a></div>' if cta else ""
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


NAV = [
    ("#cover", "封面"),
    ("#why", "为什么做"),
    ("#air", "飞机"),
    ("#rail", "高铁"),
    ("#land", "陆运"),
    ("#papers", "证件"),
    ("#hotel", "酒店"),
    ("#close", "机会"),
    ("#notes", "口径"),
]

CHAPTER.update({
    "why": "为什么做",
    "air": "飞机",
    "rail": "高铁",
    "land": "陆运",
    "papers": "证件",
    "hotel": "酒店",
    "close": "机会",
})

SRC_BOOK = source("《2026年中国宠物行业白皮书》·《携宠出行意愿调研报告》·《携程酒店数据》")
SRC_PAIN = source("《携宠出行意愿调研报告｜漏斗 MECE 修复版》·《宠物运输调研》·《宠物酒店调研》")
SRC_USER = source("《携宠出行意愿调研报告｜漏斗 MECE 修复版》")
SRC_AIR = source("运输调研 · 航空宠物运输的供给规模")
SRC_CABIN = source("运输调研 · 客舱宠物产品的供给特点")
SRC_RAIL = source("12306 / 中铁快运 · 运输调研")
SRC_LAND = source("服务商询价样本 · 滴滴页面")
SRC_HOTEL = source("杭州 Top10 电话核实 · 小红书热度抽样")
SRC_NEWS = source("南方都市报 · 宠物友好酒店暑期搜索量同比涨八成")

nav_bits = []
for i, (href, label) in enumerate(NAV):
    cls = ' class="is-active"' if i == 0 else ""
    nav_bits.append(f'<a href="{href}"{cls}>{label}</a>')
nav = "\n        ".join(nav_bits)
parts = []
parts.append(f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>携宠出行服务 · 一站式携宠旅行解决方案</title>
  <link rel="stylesheet" href="lib/components.css">
  <link rel="stylesheet" href="lib/template.css">
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
      <div class="document-nav__brand"><span class="document-nav__mark" aria-hidden="true"></span><strong>携宠出行服务</strong></div>
      <div class="document-nav__links">{nav}
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
    "cover", "00", "cover", "携宠出行服务", "一站式携宠旅行解决方案",
    "让“带宠出游”从一次次艰难的攻略拼凑，变成一条可被信赖的完整链路。",
    image=f"{A}/cover-01-img.png", active=True, number=False,
    subtitle="Pet-friendly Travel Solution",
    scope="8 章", kind="v0.7 提案汇报稿", date="2026.08",
    cta="开始阅读", cta_href="#why",
))

formula = (
    '<div class="formula" data-item-count="5">'
    '<div class="formula__factor"><b>7800万</b><span>城镇犬猫宠主</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>71%</b><span>有携宠出行意愿</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>50%</b><span>有意愿人群选择出行</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>2次</b><span>年均出行频次</span></div>'
    '<span class="formula__op is-eq">=</span>'
    '<div class="formula__factor is-result"><b>5538万</b><span>年度潜在次数</span></div>'
    "</div>"
)
parts.append(slide("why", "01.a", "why", "按情景估算，一年超过五千万次", "50% 出行、每年 2 次是假设", cells(formula, src=SRC_BOOK)))
parts.append(slide("why", "01.b", "market-stats", "存量已经能付费，住宿和托运都有溢价", "白皮书、意愿调研、携程酒店数据", cells(
    stat_c("1.26亿", "城镇犬猫总量", "存量口径，不是出行次数。"),
    stat_c("18.7%", "年度付费渗透率", "年度活跃付费占存量。"),
    stat_c("1458万", "年度活跃人群", "已经在付费的人。"),
    stat_c("+30%", "携宠住宿客单", "相对不住宠物的客单。"),
    stat_c("+76%", "航空托运溢价", "相对普通人票的溢价。"),
    n=5, src=SRC_BOOK,
)))

parts.append(slide("why", "01.c", "pain-point", "带宠出门，比人出门麻烦多了", "", cells(point_c(
    "带宠出门，比人出门麻烦多了",
    "信息是真是假、价格是否透明、规则是否适用、下单之后能否履约，全要用户逐一确认。",
), src=SRC_PAIN)))
parts.append(slide("why", "01.d", "pain-four", "手续、政策、价格、不确定性要逐一确认", "", cells(
    signal_c(1, "手续麻烦", "高铁用户 38.1% 认为检疫证明麻烦；飞机用户 54.6% 被检疫、航空箱和提前申请困扰。开放题里“手续简化 / 代办”被提及约 40 次。"),
    signal_c(2, "政策复杂", "南航不设固定 kg、能放进箱即可；海航含箱 ≤7kg；东航不占座 ≤10kg、占座 ≤18kg。只有部分指定房型可携宠。"),
    signal_c(3, "价格模糊", "航空还要叠加箱包、保障费和保险。酒店 29.5% 认为清洁费、押金不透明；计收单位也不统一。"),
    signal_c(4, "不确定性", "高铁 61.6% 担心看不到。飞机 69.7% 担心货舱；50.3% 只接受进客舱。36.0% 担心到店被拒。"),
    n=4, src=SRC_PAIN,
)))

parts.append(slide("why", "01.e", "user-stats", "养宠用户更贵，而且要一站式", "意愿调研｜漏斗 MECE 修复版", cells(
    stat_c("49.9%", "养宠用户中 88VIP", "大盘是 29.8%。"),
    stat_c("1.7×", "相对大盘的 88VIP", "养宠用户是大盘的 1.7 倍。"),
    stat_c("2.4×", "多品类相对单品类", "42.9% 对 17.7%。"),
    stat_c("85.7%", "认为一站式有必要", "一站式携宠服务。"),
    n=4, src=SRC_USER,
)))

matrix = (
    '<div class="matrix" data-item-count="4">'
    '<span class="matrix__axis" data-edge="left">空白低</span>'
    '<div class="matrix__plot">'
    '<span class="matrix__axis" data-edge="top">规模化高</span>'
    '<div class="matrix__quads">'
    '<article class="matrix__cell"><strong>垂直品类服务</strong><p>代办、专车与单点深耕，增长来自渗透</p></article>'
    '<article class="matrix__cell"><strong>一站式服务（代理）</strong><p>整合资质、运输、住宿与目的地链路</p></article>'
    '<article class="matrix__cell"><strong>拓展机会市场</strong><p>把既有垂直能力复制到新客群</p></article>'
    '<article class="matrix__cell"><strong>自助型服务</strong><p>用户更小众，市场与能力需同步教育</p></article>'
    "</div>"
    '<span class="matrix__axis" data-edge="bottom">规模化低</span>'
    "</div>"
    '<span class="matrix__axis" data-edge="right">空白高</span>'
    "</div>"
)
parts.append(slide("why", "01.f", "pmf-matrix", "一站式代理落在高规模化、高服务空白", "服务空白度 × 规模化程度", cells(matrix, src=False)))


# 02 飞机
parts.append(slide("air", "02.a", "air", "问题不是有没有运输方式", "", cells(copy_c(
    "问题不是有没有运输方式",
    "跨城带宠的问题不是“有没有运输方式”，而是不同方式的准入条件、宠物位置、价格口径、办理材料和交接流程高度非标。"
    "<br><br>真正影响用户决策的，是“宠物能不能运”、“能不能和主人同行”、“实际总价是多少”，以及“需要提前准备哪些材料”。平台如果只提供分散入口，用户仍要逐一询问。",
), src=False)))
parts.append(slide("air", "02.b", "transport-modes", "目前可以归为四类", "北京—杭州", media_switch([
    ("飞机进客舱", [
        (f"{A}/transport-03-宠物装入软包进入飞机客舱.jpg", "宠物装入软包进入飞机客舱", "软包进客舱"),
        (f"{A}/transport-04-多只宠物犬在飞机客舱座位旁陪伴主人出行.jpg", "宠物犬在飞机客舱内", "客舱内陪伴"),
        (f"{A}/transport-05-大型犬乘坐首都航空杭州至三亚航班的费用与登机清单.jpg", "大型犬客舱出行费用与清单", "费用清单"),
    ], "软包随主人进客舱。陪伴感最好，费用通常最高。",
     [("宠物费用", "约 ¥1,288–1,430 / 只，人票另计"), ("宠物位置", "客舱座椅下方软包"), ("主人", "必须同行")]),
    ("飞机托运", [
        (f"{A}/transport-06-航空箱在机场完成固定与交运.jpg", "航空箱在机场完成固定与交运", "交运"),
        (f"{A}/transport-07-工作人员装卸宠物航空箱.jpg", "工作人员装卸宠物航空箱", "装卸"),
        (f"{A}/transport-08-飞机前后货舱位置说明.jpg", "飞机前后货舱位置说明", "货舱位置"),
        (f"{A}/transport-09-飞机有氧货舱说明.jpg", "飞机有氧货舱说明", "有氧舱"),
        (f"{A}/transport-10-飞机货舱内部环境.jpg", "飞机货舱内部环境", "货舱"),
        (f"{A}/transport-11-货舱内的多个宠物航空箱.jpg", "货舱内的多个宠物航空箱", "多箱"),
        (f"{A}/transport-12-飞机货舱装载空间.jpg", "飞机货舱装载空间", "装载"),
        (f"{A}/transport-13-机场内等待交运的宠物航空箱.jpg", "机场内等待交运的宠物航空箱", "待交运"),
    ], "有氧货舱航空箱，可同机或单独飞。两端都要交接。",
     [("宠物费用", "同机约 ¥548，单独飞约 ¥950"), ("宠物位置", "有氧货舱航空箱"), ("主人", "可同行或不同行")]),
    ("高铁托运", [
        (f"{A}/transport-14-高铁宠物运输箱的温湿度与氧气监控.jpg", "高铁宠物运输箱的温湿度与氧气监控", "监控"),
        (f"{A}/transport-15-高铁行李车厢内的宠物专用运输箱.jpg", "高铁行李车厢内的宠物专用运输箱", "运输箱"),
        (f"{A}/transport-16-高铁行李车厢储物柜.jpg", "高铁行李车厢储物柜", "储物柜"),
        (f"{A}/transport-17-高铁站宠物托运办理区.jpg", "高铁站宠物托运办理区", "办理区"),
        (f"{A}/transport-18-宠物在高铁专用运输箱内.jpg", "宠物在高铁专用运输箱内", "箱内"),
    ], "行李车厢恒温监控运输箱，主人通常同车。",
     [("宠物费用", "约 ¥500 / 只，人票另计"), ("宠物位置", "行李车厢专用运输箱"), ("主人", "通常同一车次")]),
    ("陆运", [
        (f"{A}/transport-19-宠物跨城运输车辆内部.jpg", "宠物跨城运输车辆内部", "车内"),
        (f"{A}/transport-20-运输车辆内的宠物笼位.jpg", "运输车辆内的宠物笼位", "笼位"),
        (f"{A}/transport-21-带固定笼位的专业宠物运输车.jpg", "带固定笼位的专业宠物运输车", "专业车"),
        (f"{A}/transport-22-宠物运输车笼位内部.jpg", "宠物运输车笼位内部", "笼内"),
        (f"{A}/transport-23-宠物陆运订单的定位与车厢监控.jpg", "宠物陆运订单的定位与车厢监控", "监控"),
        (f"{A}/transport-24-人宠共同乘坐跨城商务车.jpg", "人宠共同乘坐跨城商务车", "同行"),
        (f"{A}/transport-25-多人和宠物共同乘坐跨城车辆.jpg", "多人和宠物共同乘坐跨城车辆", "多人同行"),
    ], "班线、拼车、专车和人宠同行。通常少办一份检疫证明。",
     [("宠物费用", "约 ¥450–1,280 / 只"), ("宠物位置", "笼位或同行座舱"), ("主人", "可同行或不同行")]),
])))

parts.append(slide("air", "02.c", "air-stats", "六成多航司能托运，三成试点进客舱", "政策允许不等于每个航班都可办理", cells(
    stat_c("34/52", "有氧舱托运", "约 65% 国内常态化客运航司具备政策基础，仍受机型、温度与当班装载限制。"),
    stat_c("17/52", "试点进客舱", "约 33% 已开放付费产品，通常按机场白名单和单班名额执行。"),
    stat_c("1100–1350", "进客舱航线池", "约占全国 4501 条国内单向直达的 25%–30%；进池不等于每天有名额。"),
    n=3, src=SRC_AIR,
)))
parts.append(slide("air", "02.d", "air-table", "航司开了，不等于航线都能办", "单向国内自营直达", cells(table_from(
    ["航司", "可携宠进客舱航线", "国内全部直达航线", "航司内部覆盖率"],
    [
        ["南方航空", "870 条", "约 1520 条", "<strong>约 57%</strong>"],
        ["东方航空", "约 630 条", "约 1350 条", "约 47%"],
        ["海南航空", "约 450 条", "约 980 条", "约 43%"],
    ],
), src=SRC_AIR)))
parts.append(slide("air", "02.e", "air-judge", "供给不是问题，而是先找哪家航司", "", cells(point_c(
    "供给不是问题，而是先找哪家航司",
    "供给不是问题，而是如何寻找合适的航司进行流程简化和服务能力突破。",
), src=SRC_AIR)))

parts.append(slide("air", "02.f", "partners-edge", "开放仍会按航线、机型和名额变动", "", cells(
    signal_c(1, "核心枢纽与旅游城市优先", "北京、上海、广州、深圳、杭州、成都、西安，以及海口、三亚、丽江更常进白名单。"),
    signal_c(2, "主干航线比支线更成熟", "A320、波音 737 和宽体机更容易具备条件；C909 等支线机型通常是硬约束。"),
    signal_c(3, "“开放”仍会动态变化", "换季、临时换机、高温管控、代码共享和单班宠物名额，会让政策支持与当天可订出现差异。"),
    signal_c(4, "航司产品差异明显", "单人可带数量、是否允许占座、箱包尺寸、重量、申请时限和材料各不相同，平台必须逐项结构化。"),
    n=4, src=SRC_CABIN,
)))
parts.append(slide("air", "02.g", "partners-table", "南航覆盖最广、办理最晚，海航能带两只", "国内客舱产品", cells(table_from(
    ["维度", "南方航空", "海南航空", "东方航空"],
    [
        ["可办航线 / 国内直达", "870 / 约 1520", "450+ / 约 980", "约 630 / 约 1350"],
        ["覆盖率", "<strong>约 57%</strong>，45 座机场", "约 43%，38 个城市", "约 47%，36 个国内城市"],
        ["申请截止", "<em>起飞前 6 小时</em>，App / 小程序", "48h 前在线；进入 24h 后可在乘机日到机场申请", "仅起飞前 7 天至 24h"],
        ["每位旅客宠物数", "1 只", "<strong>最多 2 只</strong>：1 占座 + 1 不占座", "1 只"],
        ["每趟航班总宠物数", "最多 4 只", "窄体最多 4；宽体最多 6", "最多 2 只"],
        ["不占座箱包", "35×28×24cm", "40×38×25cm", "35×28×24cm"],
        ["占座箱包", "同规格，可加购相邻座", "60×40×35cm", "55×35×35cm"],
        ["重量", "不设明确 kg 上限，能装入箱即可", "含箱总重 ≤7kg", "不占座建议 ≤10kg；占座建议 ≤18kg"],
        ["基础价格", "<2000km ¥1299；≥2000km ¥1499", "¥1430", "¥1288"],
        ["材料", "检疫证明、疫苗注射证明；机场签协议", "动物 A 证、疫苗证明、宠物身份证明（如有）", "电子申请书、检疫证明原件、健康声明 / 狂犬疫苗原件"],
    ],
), src=SRC_CABIN)))
parts.append(slide("air", "02.h", "partners-pick", "首选南航，第二家选海航", "东航放到第二阶段", cells(point_c(
    "首选南航，第二家选海航",
    "首选南航，用最大覆盖、较低办理门槛和完整运输方式建立基础供给；第二家选择海航，补足两宠、大箱包、占座和临近出发时申请宠物服务的需求。东航适合在第二阶段补充城市与班次。",
), src=SRC_CABIN)))

parts.append(slide("air", "02.i", "air-plan-steps", "先讲清两种托运，再打包成一笔订单", "", cells(
    step_stack_c("01", "可选托运方式", "讲清楚进客舱与有氧舱托运的区别；用户完成选择后，再展示对应价格。"),
    step_stack_c("02", "灵活搭售", "把不同航司的增值服务与手续代办，嵌入同一条下单链路。"),
    step_stack_c("03", "打包交易", "把机票、宠物运输、相邻座位与手续代办合并为一笔订单。"),
    n=3,
)))
parts.append(slide("air", "02.j", "air-plan-flow", "线上链路要接到检疫代办和订单详情", "", evidence([
    (f"{A}/air-solution-26-飞机携宠出行设计方案-覆盖首页-托运方式说明-检疫代办-航班与服务选择-下单-订.png",
     "飞机携宠出行设计方案", "飞机下单链路", "串联托运方式说明、检疫代办、航班与服务选择、下单和订单详情"),
], kind="strip")))

parts.append(slide("rail", "03.a", "rail", "每天只有约百分之四的车次能办", "覆盖 163 座高铁站", cells(
    stat_c("364/9000", "每日可办车次", "约占图定 G / D / C 的 4%。"),
    stat_c("2种", "服务形态", "携宠出行人宠同车；爱宠单独行由中铁快运审核后安排。"),
    stat_c("≤15kg", "宠物准入", "肩高 ≤40cm、身长 ≤52cm；47 类烈性犬不承运。"),
    stat_c("¥400–860", "携宠出行价格", "北京—杭州约 1280km，对应约 ¥500 / 只。"),
    n=4, src=SRC_RAIL,
)))
parts.append(slide("rail", "03.b", "rail-rules", "办理要带着当日有效的检疫证明", "", cells(
    list_c("运输方式", "54×43×40cm 专用箱，每箱 1 只，指定行李车厢，途中不能探视。"),
    list_c("预约时间", "携宠出行至少提前 1 天；当天 12:00 前可约次日，之后最早第三日。爱宠单独行提前 2–5 天。"),
    list_c("办理材料", "宠物、本人证件、购票证明、承运当日有效《动物检疫合格证明》；线上传实际照片。"),
    list_c("线下时间", "开车前至少 2 小时到中铁快运营业部；到站后建议 1 小时内领取。"),
    n=4, src=SRC_RAIL,
)))
parts.append(slide("rail", "03.c", "rail-price", "北京到杭州，携宠出行大约五百元", "七月一日起按里程浮动", cells(table_from(
    ["铁路运程", "携宠出行", "爱宠单独行"],
    [
        ["1000km（含）以内", "¥400", "¥558"],
        ["1000–1500km（含）", "<strong>¥500</strong>", "¥658"],
        ["1500–2000km（含）", "¥660", "¥958"],
        ["2000km 以上", "¥860", "¥1,258"],
    ],
), src=SRC_RAIL)))
line = (
    '<figure class="line-chart" data-series="1">'
    '<ul class="line-chart__legend"><li data-series="a">可办车次</li></ul>'
    '<svg class="line-chart__plot" viewBox="0 0 640 280" preserveAspectRatio="xMidYMid meet"></svg>'
    '<ol class="line-chart__points">'
    '<li><span>2025.04</span><b data-chart-series="a">10</b></li>'
    '<li><span>2025.06</span><b data-chart-series="a">38</b></li>'
    '<li><span>2026.04</span><b data-chart-series="a">228</b></li>'
    '<li><span>2026.07</span><b data-chart-series="a">364</b></li>'
    "</ol></figure>"
)
parts.append(slide("rail", "03.d", "rail-growth", "不到三个月，站点和车次还在加", "站点 5 → 25 → 121 → 163", cells(line, src=SRC_RAIL)))
parts.append(slide("rail", "03.e", "rail-12306", "12306 自己能从查仓位连到买人票", "爱宠行", evidence([
    (f"{A}/rail-27-12306-爱宠行从入口-仓位查询到购买人票和提交订单的完整链路.jpg",
     "12306 爱宠行完整链路", "12306 爱宠行", "进入宠物托运、查询仓位、选择对应人票、锁定仓位并提交订单"),
], kind="strip")))
parts.append(slide("rail", "03.f", "rail-ota", "友商已经能查，断在买对应人票", "携程、去哪儿、智行、同程", evidence([
    (f"{A}/rail-28-携程-去哪儿-智行和同程的高铁宠物托运服务与预订衔接对比.jpg",
     "四家 OTA 高铁宠物托运衔接", "OTA 衔接", "四家均已接入查询页面，差异集中在查询后如何承接对应人票"),
], kind="strip")))

parts.append(slide("rail", "03.g", "rail-plan-two", "沿用 12306 的逻辑，做成不走回头路", "", cells(
    signal_c(1, "流程调优", "沿用 12306 的车次查询、仓位预约与购票逻辑，串成从进入到支付不走回头路的单向流程。"),
    signal_c(2, "智能箱推广", "针对全程不可见、不能探视和独自关箱的担忧，明确展示恒温、温湿度与氧气监控。"),
    n=2,
)))
parts.append(slide("rail", "03.h", "rail-plan-flow", "从仓位查询接到出票和领取", "", evidence([
    (f"{A}/rail-solution-29-高铁宠物托运流程调优-从仓位查询到人票购买-宠物票申请与支付的完整链路.png",
     "高铁流程调优", "流程调优", "从仓位查询到人票购买、宠物票申请与支付"),
    (f"{A}/rail-solution-30-高铁携宠出行设计方案-覆盖仓位查询-乘客票-宠物票申请与出票流程.png",
     "高铁设计方案", "设计方案", "覆盖仓位查询、乘客票、宠物票申请与出票"),
], kind="strip")))

parts.append(slide("land", "04.a", "land", "价格通常更低，还少办一张证明", "", cells(
    signal_c(1, "价格通常更低", "京杭拼载询价约 ¥450–1,280，明显低于飞机进客舱；整车专送和人宠同行会更高。"),
    signal_c(2, "手续更简单", "本次服务商样本多数不要求检疫证明。"),
    signal_c(3, "宠物类型更广", "滴滴档案覆盖猫、狗、鸟类、鱼类和其他合规宠物；野生、濒危等仍不承运。"),
    signal_c(4, "陪伴方式可选", "可让宠物单独运输，也可人宠同行；整车“宠物快送”也写明人可跟车。"),
    n=4, src=SRC_LAND,
)))
parts.append(slide("land", "04.b", "land-quote", "这次询价，智宠行最低", "按两端地址核价", cells(
    stat_c("¥450", "智宠行", "详细地址 + 距离 + 宠物信息；余杭到北京市区次日到达。"),
    stat_c("¥600+", "易丰", "笼具尺寸 + 两端地址，含上门接宠；余杭到朝阳次日到达。"),
    stat_c("¥1,280", "宠嗒嗒", "含空调、GPS、进度和上门接送，可加购监控、猫舱。"),
    n=3, src=SRC_LAND,
)))
parts.append(slide("land", "04.c", "land-didi", "滴滴把同行、快送和托运放在同一入口", "", evidence([
    (f"{A}/land-31-滴滴宠物档案支持的类型.png", "滴滴宠物档案支持的类型", "宠物档案", "可选狗、猫、鸟类、鱼类和其他合规宠物"),
    (f"{A}/land-32-滴滴宠物快送页面.png", "滴滴宠物快送页面", "宠物快送", "默认送宠，整车也标注人可跟车"),
    (f"{A}/land-33-10kg以内服务商报价.jpg", "10kg以内服务商报价", "10kg 内报价", "三档 ¥625、¥780、¥1280"),
], kind="shot", ratio="0.46:1", fit="fit")))
parts.append(slide("land", "04.d", "land-file", "统一档案之后，才能直接比较", "", cells(point_c(
    "统一档案之后，才能直接比较",
    "统一宠物档案和路线信息后，用户可以直接比较拼载、整车快送与人宠同行。下一步需要把宠物类型、是否可跟车、笼具、时效、监控、保险、接送和异常责任做成统一字段。",
), src=SRC_LAND)))

parts.append(slide("land", "04.e", "land-plan-two", "咨询和托运沟通，前后两段都不能省", "", cells(
    signal_c(1, "触点优化", "下单前要咨询服务商，下单后要沟通具体托运事宜。"),
    signal_c(2, "交通兜底", "当宠物档案显示为 37kg 成年金毛，且用户无法接受飞机约 5 倍票价时，直接推荐可承运大型犬的陆运方案。"),
    n=2,
)))
parts.append(slide("land", "04.f", "land-plan-flow", "从路线和服务商接到支付", "", evidence([
    (f"{A}/land-solution-34-陆运携宠出行设计方案-覆盖路线输入-服务商选择-订单确认与支付流程.png",
     "陆运设计方案", "专车预订", "覆盖路线输入、服务商选择、订单确认与支付"),
], kind="strip")))

venn = (
    '<div class="venn" data-circles="3">'
    '<svg class="venn__plot" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
    "<defs>"
    '<clipPath id="venn-3-a"><circle cx="150" cy="118" r="86"></circle></clipPath>'
    '<clipPath id="venn-3-ab"><circle cx="150" cy="118" r="86"></circle></clipPath>'
    "</defs>"
    '<circle class="venn__circle" data-set="a" cx="150" cy="118" r="86"></circle>'
    '<circle class="venn__circle" data-set="b" cx="250" cy="118" r="86"></circle>'
    '<circle class="venn__circle" data-set="c" cx="200" cy="198" r="86"></circle>'
    '<circle class="venn__overlap" cx="250" cy="118" r="86" clip-path="url(#venn-3-a)"></circle>'
    '<circle class="venn__overlap" cx="200" cy="198" r="86" clip-path="url(#venn-3-ab)"></circle>'
    "</svg>"
    '<p class="venn__label" data-region="a">航空、高铁</p>'
    '<p class="venn__label" data-region="b">酒店入住</p>'
    '<p class="venn__label" data-region="c">长途陆运</p>'
    '<p class="venn__label" data-region="ab">检疫 / 许可证</p>'
    '<p class="venn__label" data-region="abc">疫苗</p>'
    "</div>"
)
parts.append(slide("papers", "05.a", "papers", "疫苗是三类场景唯一共同依赖的项", "正中交集才是最小颗粒度", cells(venn, src=False)))
parts.append(slide("papers", "05.b", "papers-hard", "最麻烦的一步通常是办检疫证明", "三种航空方式前半段大致相同", cells(
    list_c("属地材料", "杭州拱墅样本要身份证或居住证明，还要官方免疫证。"),
    list_c("宠物通常要到场", "官方兽医临床检查；杭州样本还要求指定医院疫病筛查，报告仅 3 天有效。"),
    list_c("有效期很短", "杭州案例 5 天；各地常见最长 5–7 天；航司还可能要求起飞前 3–5 天内签发。"),
    list_c("时间必须卡准", "证明要覆盖承运日，行程与启运信息要一致。"),
    n=4,
)))
parts.append(slide("papers", "05.c", "papers-pet", "犬核狂犬疫苗，猫常要猫三联", "订票前先排除品种限制", cells(
    list_c("犬类", "接种已满 21 天且在有效期内；部分航司还核小动物疫苗注射证明。短鼻犬、烈性犬须订票前排除。"),
    list_c("猫类", "部分航司申请时要求猫三联；申报点也可能核其他有效免疫。"),
    n=2,
)))
parts.append(slide("papers", "05.d", "papers-steps", "三种航空方式前半段走同一组步骤", "客舱和托运的差别出在订位、箱包和交接", cells(
    step_stack_c("01", "先确认这班能不能运", "查航司、机场、机型、品种和当班名额。客舱看白名单；货舱还要有氧舱、温度和装载。"),
    step_stack_c("02", "订人票并申请宠物服务", "进客舱 / 同机托运先选人票再申请同一航班；单独飞向货运或服务商订舱。"),
    step_stack_c("03", "准备疫苗本和免疫证明", "核对姓名、接种日期、种类和有效期。办证明通常要宠物到场。"),
    step_stack_c("04", "临近出发办理检疫证明", "带宠物、证件或属地居住证明、免疫记录及当地筛查报告，接受临床检查。"),
    step_stack_c("05", "按运输方式准备箱包", "客舱用规定软包；货舱用硬质航空箱。"),
    step_stack_c("06", "提前到机场核验和交接", "进客舱通常提前至少 2 小时到人工柜台。"),
    n=5,
)))
parts.append(slide("papers", "05.e", "papers-shot", "证明上的行程必须按实际承运来填", "", evidence([
    (f"{A}/granularity-49-动物检疫合格证明示例.jpg", "动物检疫合格证明示例", "检疫证明", "图中是铁路托运案例；航空使用同类证明，行程需按实际承运填写"),
], kind="shot", ratio="0.46:1", fit="fit")))
parts.append(slide("papers", "05.f", "papers-grey", "说宠物不用到场就能出证，和公开要求冲突", "授权申报本身有正规路径", cells(point_c(
    "说宠物不用到场就能出证，和公开要求冲突",
    "淘宝等平台和宠物出行服务商可见跑腿、材料整理或“检疫代办”。授权他人申报本身有正规路径，证明仍应由官方兽医签发并完成规定查验。平台接入时需要核验签发机构、查验方式和退款责任。",
))))


# 06 酒店
parts.append(slide("hotel", "06.a", "hotel", "问题不是有没有宠物友好标签", "", cells(copy_c(
    "问题不是有没有宠物友好标签",
    "携宠入住的问题不是“有没有宠物友好酒店”，而是标签背后的规则高度非标。平台如果只展示“可携宠”，信息颗粒度不够。"
    "<br><br>用户关注点已经从“能不能带宠物”转向酒店内宠物管理规则、清洁和房型价格等细节。",
), src=SRC_NEWS)))
parts.append(slide("hotel", "06.b", "hotel-q-in", "前三问决定能不能住", "", cells(
    list_c("Q1 能否入住", "犬种、体重、数量，以及犬证、疫苗本。OTA 展示经常与酒店实际不符。"),
    list_c("Q2 额外费用", "清洁费与保证金；清洁费还分按晚收和按次收。"),
    list_c("Q3 房型限制", "部分酒店只有指定房型可携宠，最低价房型往往不在范围内。"),
    n=3,
)))
parts.append(slide("hotel", "06.c", "hotel-q-stay", "后四问决定是不是住得好", "", cells(
    list_c("Q4 活动范围", "只能待客房，还是可去公区、餐厅、户外；能否单独留房。"),
    list_c("Q5 宠物设施", "餐食、厕所、玩具、睡窝、食盆和水盆。"),
    list_c("Q6 损坏怎么赔", "弄脏沙发或床、抓坏家具时的标准和押金扣除。"),
    list_c("Q7 如何确认留痕", "下单是否要备注或提前告知；口头确认后如何保障到店不被拒。"),
    n=4,
)))

parts.append(slide("hotel", "06.d", "hotel-t10-stats", "平台写的和酒店说的对不上", "杭州 Top10 电话核实", cells(
    stat_c("2/10", "平台信息有误", "一家写不可携宠实际可以，一家写 ¥100/晚 实际免费。"),
    stat_c("5/10", "要求证件材料", "养宠许可证或疫苗证，其中 2 家还有疫苗时效。"),
    stat_c("4套", "清洁费口径", "每间每次 / 每只每次 / 每间每晚 / 每只每晚并存。"),
    stat_c("10/10", "损坏赔偿无规则", "全部单独计费、无明确标准。"),
    n=4, src=SRC_HOTEL,
)))
parts.append(slide("hotel", "06.e", "hotel-t10-fee", "清洁费四套口径，单价相同总支出能差四倍", "假设单价 ¥200，带 2 只住 2 晚", cells(table_from(
    ["计费方式", "计费单位数", "总支出"],
    [
        ["每间每次", "1", "¥200"],
        ["每只每晚", "2 只 × 2 晚 = 4", "<strong>¥800</strong>"],
    ],
), src=SRC_HOTEL)))
parts.append(slide("hotel", "06.f", "hotel-t10-risk", "损坏赔偿全部没有公开标准", "", cells(
    list_c("损坏无规则", "10 / 10 对物品损坏均单独计费、没有公开标准。"),
    list_c("尿损另计", "8 / 10 收了清洁费仍对尿损另行计费；仅 20% 把尿损含在清洁费内。"),
    list_c("押金无标准", "4 / 10 收取押金：康莱德、树华希尔顿、嘉悦里、度喜天丽。"),
    n=3, src=SRC_HOTEL,
)))

parts.append(slide("hotel", "06.g", "rivals-point", "小程序在做评测和权益，OTA 还停在筛选项", "", cells(point_c(
    "小程序在做评测和权益，OTA 还停在筛选项",
    "专注宠物酒店的产品通过亲自体验筛选供给，并拿到专属清洁费优惠。因都主打“亲自”体验过，供给也有地域性。OTA 仍以“可携带宠物”筛选项为主。",
))))
parts.append(slide("hotel", "06.h", "rivals-wxb", "玩小伴把清洁费优惠做进套餐", "供给以江浙沪为主", evidence([
    (f"{A}/supply-close-37-玩小伴微信小程序的宠物酒店特价房券-房型与宠物保险页面.jpg", "玩小伴微信小程序", "玩小伴", "套餐常带专属清洁费优惠"),
], kind="strip")))
parts.append(slide("hotel", "06.i", "rivals-fungo", "FunGo 在列表和详情都侧重宠物信息", "供给以广州为主", evidence([
    (f"{A}/supply-close-38-FunGo-微信小程序的宠物友好标签与房型详情页面.jpg", "FunGo 微信小程序", "FunGo", "List 和 Detail 都侧重宠物信息"),
], kind="strip")))
parts.append(slide("hotel", "06.j", "rivals-ctrip", "携程能把收费写到每间每晚", "", evidence([
    (f"{A}/supply-close-39-携程宠物筛选-酒店政策与宠物收费展示.jpg", "携程宠物筛选与收费", "携程", "收费政策能写到每间每晚，标签更细"),
], kind="strip")))
parts.append(slide("hotel", "06.k", "rivals-fliggy", "飞猪政策多见详询酒店", "", evidence([
    (f"{A}/supply-close-40-飞猪宠物友好筛选与宠物政策展示.jpg", "飞猪宠物政策", "飞猪", "政策里多见费用详询酒店"),
], kind="strip")))
parts.append(slide("hotel", "06.l", "rivals-meituan", "美团允许携带，具体咨询酒店", "", evidence([
    (f"{A}/supply-close-41-美团宠物筛选与宠物政策展示.jpg", "美团宠物政策", "美团", "允许携带宠物，具体咨询酒店"),
], kind="strip")))
parts.append(slide("hotel", "06.m", "rivals-booking", "Booking 把宠物费用前置到列表", "", evidence([
    (f"{A}/supply-close-42-Booking-准许携带宠物筛选与宠物费用说明.jpg", "Booking 宠物费用", "Booking", "把宠物费用前置到列表卡片"),
], kind="strip")))
parts.append(slide("hotel", "06.n", "rivals-list", "频道和榜单有合辑，入口深", "", evidence([
    (f"{A}/supply-close-44-携程宠游会频道-宠物档案-友好景点-友好酒店与宠物托运入口.jpg", "携程宠游会", "宠游会", "档案、景点、酒店、托运已经搭在一起，入口深"),
    (f"{A}/supply-close-45-大众点评必住榜-2025-的宠物友好标签.jpg", "大众点评必住榜", "必住榜", "宠物友好只是横向标签之一"),
    (f"{A}/supply-close-46-猫途鹰旅行者之选曼谷宠物友好酒店榜.jpg", "猫途鹰宠物友好榜", "旅行者之选", "以城市为单位出榜，信息展示接近常规酒店"),
], kind="shot", ratio="0.46:1", fit="fit")))

parts.append(slide("hotel", "06.o", "hotel-plan-map", "七个问题可以落到筛选、种草、保障三层", "", cells(table_from(
    ["层级", "解决的决策", "包含的字段", "对应问题"],
    [
        ["筛选", "能不能住 / 要多花多少钱", "类型、禁养、体重、数量、证件、房型、清洁费口径", "Q1–Q3"],
        ["种草", "是不是只能待在房间", "活动区域、禁止区域、可否留房、房间设施", "Q4–Q5"],
        ["保障", "承诺是否可靠 / 到店会不会被拒", "押金、损坏规则、服务保障", "Q6–Q7"],
    ],
))))
parts.append(slide("hotel", "06.p", "hotel-plan-steps", "用档案自动筛，并把收费和准入放到决策前", "", cells(
    step_stack_c("01", "档案自动化筛选", "AI 分析照片或证件，生成有效字段，过滤不符合宠物条件的酒店。"),
    step_stack_c("02", "清晰的价格展示", "讲清楚清洁费逻辑，筛选项还可以按晚数预估总价。"),
    step_stack_c("03", "健全的政策表达", "详情页首屏需要看到政策，有独立页面展示政策、设施、活动。"),
    n=3,
)))
parts.append(slide("hotel", "06.q", "hotel-plan-ui", "档案和详情要接到筛选之前", "", evidence([
    (f"{A}/hotel-solution-47-酒店宠物档案设计方案-覆盖证件上传-AI图片识别和档案填写.png", "酒店宠物档案设计方案", "宠物档案", "通过照片或证件识别有效字段，再由用户确认"),
    (f"{A}/hotel-solution-48-宠物友好酒店设计方案-覆盖自动筛选-酒店详情-宠物政策与设施详情.png", "宠物友好酒店设计方案", "酒店详情", "自动筛选，并把收费、准入、设施前置"),
], kind="strip")))
parts.append(slide("hotel", "06.r", "hotel-plan-funnel", "从飞猪标签到核实成功，供给会少一截", "", cells(
    step_c("01", "2500 家飞猪宠物友好", "爬取小红书笔记去重后，先从平台标签池开始。"),
    step_c("02", "165 家真实入住经验", "有效笔记 469 条：有明确住宿实体，且有宠物可以跟人一起入住的信号。"),
    step_c("03", "100 家撞库优选", "与飞猪供给撞库后的 TOP。"),
    step_c("04", "50 家核实成功", "标准化信息核实成功，才能进入决策链。"),
    n=4,
)))


# 07 机会
parts.append(slide("close", "07.a", "close", "带宠出行，从碰运气到看清单", "", evidence([
    (f"{A}/value-51-手续帮你办服务海报.png", "手续帮你办", "手续帮你办", "把检疫和材料收进同一条订单"),
    (f"{A}/value-52-同舱更安心服务海报.png", "同舱更安心", "同舱更安心", "能进客舱时，人和宠不分开"),
    (f"{A}/value-53-带宠放心住服务海报.png", "带宠放心住", "带宠放心住", "准入、费用和到店不被拒写进决策前"),
    (f"{A}/value-54-一站下单全搞定服务海报.png", "一站下单全搞定", "一站下单全搞定", "运输和住宿不再拆成多次确认"),
], ratio="3:4", fit="fill")))

parts.append(slide("close", "07.b", "chance-point", "关键不是增加入口，而是减少反复确认", "", cells(point_c(
    "关键不是增加入口，而是减少反复确认",
    "从分散供给到一站式履约，关键不是增加入口，而是减少用户反复确认。我们不与垂直品类抢执行，而是把它们的执行层接入到一条用户能看懂的决策链路上。",
))))
parts.append(slide("close", "07.c", "chance-map", "机会落在资质突破和信息整合", "", evidence([
    (f"{A}/opportunity-55-宠物旅行一站式服务机会象限-资质与服务能力突破-信息整合能力.png",
     "一站式服务机会象限", "机会象限", "上半区解决资质与服务能力缺口，下半区把零散信息变成可下单的决策"),
], ratio="4:3", fit="fill")))
parts.append(slide("close", "07.d", "chance-list", "档案、清单、价格、设施、推荐要接到同一条链", "", cells(
    list_c("宠物档案", "录入品种、体重、芯片、疫苗、性情，自动筛选匹配其体型与政策的可用服务。"),
    list_c("合规清单", "检疫证、运输政策、酒店入住要求、景点规定一键生成，可勾选代办并合并入同一订单。"),
    list_c("价格透明", "按房型拆清洁费 + 宠物附加费，每间每晚精确到元。"),
    list_c("设施齐全", "把宠物友好拆成床 / 食盆 / 围栏 / 拾便袋 / 庭院 / 周边宠物医院。"),
    list_c("交叉推荐", "“人想去 ∩ 宠能一起去”，产出可执行的榜单与同行实测。"),
    list_c("信息整合", "聚合有效信息，组装成用户下单决策。"),
)))

parts.append("""        <section class="report-slide" data-chapter="notes" data-slide="08" id="notes">
          <footer class="report-notes">
            <h2>这些数字能推到哪</h2>
            <ol>
              <li>5538 万次里的 50% 选择出行、每年 2 次，是情景假设，不是观测值。来源含《2026 年中国宠物行业白皮书》《携宠出行意愿调研报告》《携程酒店数据》。</li>
              <li>进客舱航线 1100–1350、航线覆盖 25%–30% / 55%–65%，是行业汇总估算区间；航线进池不等于每天有名额。</li>
              <li>北京—杭州价格是样本：客舱基础服务费、派到托运、12306 携宠出行优惠价、陆运拼载询价，口径不同，不能直接比总价。</li>
              <li>高铁 OTA 衔接以源页截图为准；没有把未出现在原文中的逐家故障写成结论。</li>
              <li>酒店 Top10 来自杭州小红书热度抽样电话核实，不能外推全国。清洁费四倍差是“2 只 × 2 晚、单价 ¥200”的设定。</li>
              <li>承诺宠物不到场即可出证，与多地公开临床检查要求冲突；材料撑不住“代办一定合规”。</li>
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

  <script src="lib/design-data.js"></script>
  <script src="lib/theme-runtime.js"></script>
  <script src="lib/template.js"></script>
</body>
</html>
""")

OUT.write_text("".join(parts), encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
