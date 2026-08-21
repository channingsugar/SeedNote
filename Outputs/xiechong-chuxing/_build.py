#!/usr/bin/env python3
"""Build flow index.html from report.md. Do not slice the source HTML."""
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


def slide(chapter, no, sid, title, part, body, *, flow_title=None):
    label = CHAPTER.get(chapter, chapter)
    part_el = f'<p class="section-header__part">{part}</p>' if part else ""
    flow_attr = f' data-flow-title="{flow_title}"' if flow_title else ""
    return f"""        <section class="report-section report-slide" data-chapter="{chapter}" data-slide="{no}" id="{sid}"{flow_attr}>
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


NAV = [
    ("#cover", "封面"),
    ("#market", "市场"),
    ("#pain", "痛点"),
    ("#user", "用户"),
    ("#pmf", "PMF"),
    ("#brand-concept", "品牌概念"),
    ("#transport", "运输全景"),
    ("#air-scale", "航空规模"),
    ("#air", "客舱供给"),
    ("#air-solution", "飞机建议"),
    ("#rail", "高铁"),
    ("#rail-solution", "高铁建议"),
    ("#land", "陆运"),
    ("#land-solution", "陆运建议"),
    ("#granularity", "资质"),
    ("#hotel-questions", "住宿七问"),
    ("#hotel-survey", "top10酒店"),
    ("#hotel-findings", "调研小结"),
    ("#supply-close", "竞品调研"),
    ("#hotel-solution", "酒店建议"),
    ("#value", "价值主张"),
    ("#opportunity", "总结"),
    ("#notes", "口径"),
]

CHAPTER.update({
    "market": "市场",
    "pain": "痛点",
    "user": "用户",
    "pmf": "PMF",
    "brand-concept": "品牌概念",
    "transport": "运输全景",
    "air-scale": "航空规模",
    "air": "客舱供给",
    "air-solution": "飞机建议",
    "rail": "高铁",
    "rail-solution": "高铁建议",
    "land": "陆运",
    "land-solution": "陆运建议",
    "granularity": "资质",
    "hotel-questions": "住宿七问",
    "hotel-survey": "top10酒店",
    "hotel-findings": "调研小结",
    "supply-close": "竞品调研",
    "hotel-solution": "酒店建议",
    "value": "价值主张",
    "opportunity": "总结",
})

SRC_BOOK = source("《2026年中国宠物行业白皮书》·《携宠出行意愿调研报告》·《携程酒店数据》")
SRC_PAIN = source("《携宠出行意愿调研报告｜漏斗 MECE 修复版》·《宠物运输调研》·《宠物酒店调研》")
SRC_USER = source("《携宠出行意愿调研报告｜漏斗 MECE 修复版》")
SRC_AIR = source("运输调研 · 航空宠物运输的供给规模")
SRC_CABIN = source("运输调研 · 客舱宠物产品的供给特点")
SRC_RAIL = source("12306 / 中铁快运 · 运输调研")
SRC_LAND = source("服务商询价样本 · 滴滴页面")
SRC_HOTEL = source("杭州 Top10 电话核实 · 小红书热度抽样")
SRC_NEWS = source("南方都市报 · 就“宠”你！“宠物友好酒店”暑期搜索量同比涨八成")

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
  <link rel="stylesheet" href="lib/flow.css">
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

  <div class="report-shell is-flow">
    <nav class="document-nav nav-underline is-sticky" data-component-id="navigation" aria-label="文档章节">
      <div class="document-nav__brand"><span class="document-nav__mark" aria-hidden="true"></span><strong>携宠出行服务</strong></div>
      <div class="document-nav__links">{nav}
      </div>
    </nav>

    <div class="report-stage" data-report-stage>
      <div class="report-slides" data-report-slides>
""")

parts.append(f"""        <section class="report-slide is-chapter-cover is-active" data-chapter="cover" data-slide="00" id="cover">
          <header class="chapter-cover" data-cover="image">
            <div class="chapter-cover__media" data-caption="off"><img src="{A}/cover-01-img.png" alt=""></div>
            <span class="chapter-cover__kicker">携宠出行服务</span>
            <h2 class="chapter-cover__title">一站式携宠旅行解决方案</h2>
            <p class="chapter-cover__subtitle">Pet-friendly Travel Solution</p>
            <p class="chapter-cover__lead">让“带宠出游”从一次次艰难的攻略拼凑，变成一条可被信赖的完整链路。</p>
            <p class="chapter-cover__byline"><span class="chapter-cover__scope">22 档导航</span><span class="chapter-cover__kind">v0.7 提案汇报稿</span><span class="chapter-cover__date">2026.08</span></p>
            <div class="chapter-cover__actions"><a class="button inverse" href="#market">开始阅读</a></div>
          </header>
        </section>
""")

# 01 市场
formula = (
    '<div class="formula" data-item-count="5">'
    '<div class="formula__factor"><b>7800万</b><span>城镇犬猫宠主</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>71%</b><span>有携宠出行意愿 / 需求</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>50%</b><span>有意愿人群选择出行</span></div>'
    '<span class="formula__op">×</span>'
    '<div class="formula__factor"><b>2次 / 年</b><span>年均携宠出行频次</span></div>'
    '<span class="formula__op is-eq">=</span>'
    '<div class="formula__factor is-result"><b>5538万</b><span>年度潜在携宠旅行次数</span></div>'
    "</div>"
)
parts.append(slide(
    "market", "01.a", "market",
    "携宠旅行是一个每年超5000万次的潜在旅行市场。",
    "50% 出行、每年 2 次是情景假设",
    cells(formula, src=SRC_BOOK),
    flow_title="携宠旅行是一个每年超5000万次的潜在旅行市场。",
))
parts.append(slide("market", "01.b", "market-stats", "存量已经能付费，住宿和托运都有溢价", "白皮书、意愿调研、携程酒店数据", cells(
    stat_c("1.26亿", "城镇犬猫总量", "存量口径，不是出行次数。"),
    stat_c("18.7%", "年度付费渗透率", "年度活跃付费占存量。"),
    stat_c("1458万", "年度活跃人群", "已经在付费的人。"),
    stat_c("+30%", "携宠住宿客单", "相对不住宠物的客单。"),
    stat_c("+76%", "航空托运溢价", "相对普通人票的溢价。"),
    n=5, src=SRC_BOOK,
)))

# 02 痛点
parts.append(slide(
    "pain", "02.a", "pain",
    "手续麻烦、政策复杂、价格模糊、不确定性，是阻碍用户出行的4个核心痛点。",
    "",
    cells(
        signal_c(1, "手续麻烦", "高铁用户中，38.1% 认为办理《动物检疫合格证明》手续麻烦。飞机用户中，54.6% 被检疫证明、航空箱和提前申请等复杂手续困扰。开放题中，“手续简化 / 代办”被提及约 40 次，是频次最高的主题。"),
        signal_c(2, "政策复杂", "用户必须逐一确认自己的宠物是否匹配航司要求与酒店政策。不同地区、交通方式和往返程要求不一致，用户必须重新核对材料与有效期。"),
        signal_c(3, "价格模糊", "无法判断应该选择哪种运输和住宿方式，价格不可比导致选择困难。航空每家航司进客舱、同机托运价格不同，还要叠加箱包、保障费和保险。酒店 29.5% 认为清洁费、押金不透明。"),
        signal_c(4, "不确定性", "高铁 61.6% 担心全程看不到、不能探视。飞机 69.7% 担心货舱温度、加压和意外；50.3% 的飞机用户只接受宠物进入客舱。36.0% 担心到店被拒。"),
        n=4, src=SRC_PAIN,
    ),
    flow_title="手续麻烦、政策复杂、价格模糊、不确定性，是阻碍用户出行的4个核心痛点。",
))
parts.append(slide("pain", "02.b", "pain-policy", "政策要逐项核对", "航司与酒店都不统一", cells(
    list_c("重量", "不设固定 kg、能放进箱即可（南航）；含箱 ≤ 7kg（海航）；不占座 ≤ 10kg、占座 ≤ 18kg（东航）。"),
    list_c("尺寸", "不占座箱包 40 × 38 × 25cm；占座箱包 60 × 40 × 35cm。"),
    list_c("年龄", "满 8 周（南航）；满 2 个月（东航）。"),
    list_c("数量", "最多 1 只（南航、东航）；最多 2 只、1 只占座加 1 只不占座（海航）。"),
    list_c("房型限制", "只有部分指定房型可以带宠，用户不仅要挑酒店，还要继续挑房型。"),
    n=5, src=SRC_PAIN,
)))

# 03 用户
parts.append(slide(
    "user", "03.a", "user",
    "他们是高价值旅行者，需求一套一站式解决方案。",
    "意愿调研｜漏斗 MECE 修复版",
    cells(
        stat_c("49.9%", "养宠用户中 88VIP", "大盘是 29.8%。养宠用户是大盘的 1.7 倍。"),
        stat_c("1.7×", "相对大盘的 88VIP", "养宠用户是大盘的 1.7 倍。"),
        stat_c("2.4×", "多品类相对单品类", "42.9% 对 17.7%。"),
        stat_c("85.7%", "认为一站式有必要", "一站式携宠服务。"),
        n=4, src=SRC_USER,
    ),
    flow_title="他们是高价值旅行者，需求一套一站式解决方案。",
))

# 04 PMF
parts.append(slide(
    "pmf", "04.a", "pmf",
    "打造「一站式服务」来抢占市场空白，同时引入代理提升垂直品类的服务能力。",
    "服务空白度 × 规模化程度",
    evidence([
        (f"{A}/pmf-02-服务空白度与规模化程度二维矩阵-一站式代理服务位于高规模化-高服务空白象限.svg",
         "服务空白度与规模化程度二维矩阵：一站式代理服务位于高规模化、高服务空白象限",
         "一站式代理", "四个象限分别对应不同的增长策略与执行路径"),
    ], ratio="4:3", fit="fit"),
    flow_title="打造「一站式服务」来抢占市场空白，同时引入代理提升垂直品类的服务能力。",
))

# 05 品牌概念
parts.append(slide(
    "brand-concept", "05.a", "brand-concept",
    "品牌概念：飞猪出发，狗狗GO~",
    "CONCEPT FILM",
    cells(copy_c(
        "品牌概念：飞猪出发，狗狗GO~",
        "花间堂订单占比 95% 是带狗入住用户，所以用狗的概念为核心延展出品牌设计。以一句朗朗上口的「狗狗GO！」为记忆锚点，与轻快活泼的视觉语言相互咬合，把携宠出行从一件琐事转译成一种雀跃的生活仪式。"
        "<br><br>而字母 G 则变形为猫的身影——文字中的「狗」与图形里的「猫」并肩，表达不只是狗的出行，是所有毛孩子共同的出发信号。",
    )),
    flow_title="品牌概念：飞猪出发，狗狗GO~",
))
parts.append(slide("brand-concept", "05.b", "brand-poster", "概念片用海报留下记忆锚点", "视频未进模板", evidence([
    (f"{A}/brand-concept-poster.jpg", "品牌概念片海报", "概念片海报", "源稿是可播放视频，这里用海报静帧"),
    (f"{A}/value-狗狗GO.png", "狗狗GO!", "狗狗GO!", "记忆锚点"),
], ratio="16:9", fit="fit")))

# 06 运输全景
parts.append(slide(
    "transport", "06.a", "transport",
    "跨城带宠，目前有四条路可走。",
    "飞机进客舱 / 飞机托运 / 高铁托运 / 陆运",
    cells(copy_c(
        "问题不是有没有运输方式",
        "跨城带宠的问题不是“有没有运输方式”，而是不同方式的准入条件、宠物位置、价格口径、办理材料和交接流程高度非标。"
        "<br><br>真正影响用户决策的，是“宠物能不能运”、“能不能和主人同行”、“实际总价是多少”，以及“需要提前准备哪些材料”。平台如果只提供分散入口，用户仍要逐一询问；更有价值的是把四种方式做成可比较、可校验、可下单的结构化信息。",
    )),
    flow_title="跨城带宠，目前有四条路可走。",
))
parts.append(slide("transport", "06.b", "transport-modes", "四种方式可以并排放在一起比较", "北京—杭州样本价", media_switch([
    ("飞机进客舱", [
        (f"{A}/transport-03-宠物装入软包进入飞机客舱.jpg", "宠物装入软包进入飞机客舱", "软包进客舱"),
        (f"{A}/transport-04-多只宠物犬在飞机客舱座位旁陪伴主人出行.jpg", "宠物犬在飞机客舱内", "客舱内陪伴"),
        (f"{A}/transport-05-大型犬乘坐首都航空杭州至三亚航班的费用与登机清单.jpg", "大型犬客舱出行费用与清单", "费用清单"),
    ], "软包随主人进客舱。陪伴感最好，费用通常最高。",
     [("宠物费用", "约 ¥1,288–1,430 / 只，人票另计"), ("宠物位置", "客舱座椅下方软包"), ("主人", "必须同行"), ("主要限制", "机场白名单、名额、体重与软包要求")]),
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
     [("宠物费用", "同机约 ¥548，单独飞约 ¥950"), ("宠物位置", "有氧货舱航空箱"), ("主人", "可同行或不同行"), ("主要限制", "机型、高温、检疫证明与机场条件")]),
    ("高铁托运", [
        (f"{A}/transport-14-高铁宠物运输箱的温湿度与氧气监控.jpg", "高铁宠物运输箱的温湿度与氧气监控", "监控"),
        (f"{A}/transport-15-高铁行李车厢内的宠物专用运输箱.jpg", "高铁行李车厢内的宠物专用运输箱", "运输箱"),
        (f"{A}/transport-16-高铁行李车厢储物柜.jpg", "高铁行李车厢储物柜", "储物柜"),
        (f"{A}/transport-17-高铁站宠物托运办理区.jpg", "高铁站宠物托运办理区", "办理区"),
        (f"{A}/transport-18-宠物在高铁专用运输箱内.jpg", "宠物在高铁专用运输箱内", "箱内"),
    ], "行李车厢恒温监控运输箱，主人通常同车。",
     [("宠物费用", "约 ¥500 / 只，人票另计"), ("宠物位置", "行李车厢专用运输箱"), ("主人", "通常同一车次"), ("主要限制", "车次和站点少，体型与犬种受限")]),
    ("陆运", [
        (f"{A}/transport-19-宠物跨城运输车辆内部.jpg", "宠物跨城运输车辆内部", "车内"),
        (f"{A}/transport-20-运输车辆内的宠物笼位.jpg", "运输车辆内的宠物笼位", "笼位"),
        (f"{A}/transport-21-带固定笼位的专业宠物运输车.jpg", "带固定笼位的专业宠物运输车", "专业车"),
        (f"{A}/transport-22-宠物运输车笼位内部.jpg", "宠物运输车笼位内部", "笼内"),
        (f"{A}/transport-23-宠物陆运订单的定位与车厢监控.jpg", "宠物陆运订单的定位与车厢监控", "监控"),
        (f"{A}/transport-24-人宠共同乘坐跨城商务车.jpg", "人宠共同乘坐跨城商务车", "同行"),
        (f"{A}/transport-25-多人和宠物共同乘坐跨城车辆.jpg", "多人和宠物共同乘坐跨城车辆", "多人同行"),
    ], "班线、拼车、专车和人宠同行。通常少办一份检疫证明。",
     [("宠物费用", "约 ¥450–1,280 / 只"), ("宠物位置", "笼位或同行座舱"), ("主人", "可同行或不同行"), ("主要限制", "时长较长，车辆与服务标准不一")]),
])))

# 07 航空规模
parts.append(slide(
    "air-scale", "07.a", "air-scale",
    "航空供给已经形成规模：有氧舱托运是主流能力，宠物进客舱正在从少数试点扩展为航司付费增值产品。",
    "政策允许不等于每个航班都可办理",
    cells(
        stat_c("34/52", "航司支持有氧舱托运", "约 65% 国内常态化客运航司具备政策基础；是否能运仍取决于具体机型、温度与当班装载条件。"),
        stat_c("17/52", "航司试点宠物进客舱", "约 33% 航司已开放付费产品，通常按机场白名单、指定国内直达航班和单班名额执行。"),
        stat_c("1100–1350", "估算进客舱航线池", "约占全国 4,501 条国内单向直达航线的 25%–30%；航线进入池子，不代表每天、每一班都有名额。"),
        n=3, src=SRC_AIR,
    ),
    flow_title="航空供给已经形成规模：有氧舱托运是主流能力，宠物进客舱正在从少数试点扩展为航司付费增值产品。",
))
parts.append(slide("air-scale", "07.b", "air-scale-table", "公开过航线数量的代表航司", "单向国内自营直达", cells(table_from(
    ["航司", "可携宠进客舱航线", "国内全部直达航线", "航司内部覆盖率"],
    [
        ["南方航空", "870 条", "约 1520 条", "<strong>约 57%</strong>"],
        ["东方航空", "约 630 条", "约 1350 条", "约 47%"],
        ["海南航空", "约 450 条", "约 980 条", "约 43%"],
    ],
), src=SRC_AIR)))
parts.append(slide("air-scale", "07.c", "air-scale-judge", "供给不是问题，而是先找哪家航司", "", cells(point_c(
    "供给不是问题，而是先找哪家航司",
    "供给不是问题，而是如何寻找合适的航司进行流程简化和服务能力突破。",
), src=SRC_AIR)))

# 08 客舱供给
parts.append(slide(
    "air", "08.a", "air",
    "开放程度整体在提高，但它不是一张统一的“宠物票”。",
    "航线、机型、名额、箱包、重量和材料由航司分别定义",
    cells(
        signal_c(1, "核心枢纽与旅游城市优先", "北京、上海、广州、深圳、杭州、成都、西安等枢纽，以及海口、三亚、丽江等旅游城市更常进入白名单。"),
        signal_c(2, "主干航线比支线更成熟", "A320、波音 737 和宽体机更容易具备运输条件；C909 等支线机型通常形成硬约束。"),
        signal_c(3, "“开放”仍会动态变化", "换季、临时换机、高温管控、代码共享和单班宠物名额，都会让“政策支持”与“当天可订”出现差异。"),
        signal_c(4, "航司产品差异明显", "单人可带数量、是否允许占座、箱包尺寸、重量、申请时限和材料要求各不相同，平台必须逐项结构化。"),
        n=4, src=SRC_CABIN,
    ),
    flow_title="开放程度整体在提高，但它不是一张统一的“宠物票”。",
))
parts.append(slide("air", "08.b", "air-table", "南航覆盖最广、办理最晚，海航能带两只", "国内客舱宠物产品口径", cells(table_from(
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
parts.append(slide("air", "08.c", "air-pick", "首选南航，第二家选海航", "东航放到第二阶段", cells(point_c(
    "首选南航，第二家选海航",
    "首选南航，用最大覆盖、较低办理门槛和完整运输方式建立基础供给；第二家选择海航，补足两宠、大箱包、占座和临近出发时申请宠物服务的需求。东航适合在第二阶段补充城市与班次。",
), src=SRC_CABIN)))

# 09 飞机建议
parts.append(slide(
    "air-solution", "09.a", "air-solution",
    "打造包含检疫代办和托运的线上化链路，一站式搞定下单。",
    "",
    cells(
        step_stack_c("01", "可选托运方式", "讲清楚进客舱与有氧舱托运两种方式的区别；用户完成选择后，再展示对应价格。"),
        step_stack_c("02", "灵活搭售", "把不同航司的增值服务与手续代办，嵌入同一条下单链路。"),
        step_stack_c("03", "打包交易", "把机票、宠物运输、相邻座位与手续代办合并为一笔订单，一键完成原本分散在多个渠道的支付。"),
        n=3,
    ),
    flow_title="打造包含检疫代办和托运的线上化链路，一站式搞定下单。",
))
parts.append(slide("air-solution", "09.b", "air-solution-flow", "线上链路要接到检疫代办和订单详情", "", evidence([
    (f"{A}/air-solution-26-飞机携宠出行设计方案-覆盖首页-托运方式说明-检疫代办-航班与服务选择-下单-订.png",
     "飞机携宠出行设计方案", "飞机下单链路", "串联托运方式说明、检疫代办、航班与服务选择、下单和订单详情"),
], kind="strip")))

# 10 高铁
parts.append(slide(
    "rail", "10.a", "rail",
    "12306 已提供高铁宠物托运，OTA 的预订衔接仍不稳定",
    "覆盖 163 座高铁站",
    cells(
        stat_c("364/9000", "每日可办车次", "约占全国每日图定 G / D / C 车次的 4%。"),
        stat_c("2种", "服务形态", "“携宠出行”支持人宠同车；“爱宠单独行”由中铁快运审核后安排车次。"),
        stat_c("≤15kg", "宠物准入", "同时要求肩高 ≤40cm、身长 ≤52cm；47 类烈性犬及不符合健康条件的宠物不承运。"),
        stat_c("¥400–860", "携宠出行价格", "按运输里程分四档浮动。北京—杭州约 1280km，对应约 ¥500 / 只。"),
        n=4, src=SRC_RAIL,
    ),
    flow_title="12306 已提供高铁宠物托运，OTA 的预订衔接仍不稳定",
))
parts.append(slide("rail", "10.b", "rail-rules", "办理要带着当日有效的检疫证明", "", cells(
    list_c("运输方式", "铁路提供 54×43×40cm 专用运输箱，每箱 1 只，放置在列车指定行李车厢；运输途中不能探视。"),
    list_c("预约时间", "携宠出行至少提前 1 天预约；当天 12:00 前可约次日，12:00 后最早约第三日。爱宠单独行需提前 2–5 天预约。"),
    list_c("办理材料", "携带宠物、本人有效身份证件、购票证明及承运当日有效的《动物检疫合格证明》。线上预约上传宠物实际照片。"),
    list_c("线下时间", "开车前至少 2 小时到中铁快运营业部办理；列车到站后建议在 1 小时内领取。"),
    n=4, src=SRC_RAIL,
)))
parts.append(slide("rail", "10.c", "rail-price", "北京到杭州，携宠出行大约五百元", "2026 年 7 月 1 日起执行市场化浮动价格，两种服务均含 ¥2,000 基础保险", cells(table_from(
    ["铁路运程", "携宠出行", "爱宠单独行"],
    [
        ["1000km（含）以内", "¥400", "¥558"],
        ["1000–1500km（含）", "<strong>¥500</strong>", "¥658"],
        ["1500–2000km（含）", "¥660", "¥958"],
        ["2000km 以上", "¥860", "¥1,258"],
    ],
), src=SRC_RAIL)))
parts.append(slide("rail", "10.d", "rail-growth", "高铁宠物托运扩张趋势很快", "增长重点会从增加城市转向加密车次", cells(
    stat_c("42座", "不到三个月新增车站", "分别增长约 35%。"),
    stat_c("136趟", "不到三个月新增车次", "分别增长约 60%。"),
    stat_c("32站", "最新一轮新增车站", "最新一轮扩容。"),
    stat_c("92趟", "最新一轮新增车次", "可以判断：高铁运宠正在快速完成全国节点铺设。"),
    n=4, src=SRC_RAIL,
)))
parts.append(slide("rail", "10.e", "rail-12306", "12306 自己能从查仓位连到买人票", "爱宠行", evidence([
    (f"{A}/rail-27-12306-爱宠行从入口-仓位查询到购买人票和提交订单的完整链路.jpg",
     "12306 爱宠行从入口、仓位查询到购买人票和提交订单的完整链路", "12306 爱宠行", "进入宠物托运、查询仓位、选择对应人票、锁定仓位并提交订单"),
], kind="strip")))
parts.append(slide("rail", "10.f", "rail-ota", "友商已经能查，断在买对应人票", "携程、去哪儿、智行、同程", evidence([
    (f"{A}/rail-28-携程-去哪儿-智行和同程的高铁宠物托运服务与预订衔接对比.jpg",
     "携程、去哪儿、智行和同程的高铁宠物托运服务与预订衔接对比", "OTA 衔接", "四家均已接入查询页面，差异集中在查询后如何承接对应人票"),
], kind="strip")))

# 11 高铁建议
parts.append(slide(
    "rail-solution", "11.a", "rail-solution",
    "串联仓位查询、人票购买、宠物票申请、支付、出票与到站领取。",
    "",
    cells(
        signal_c(1, "流程调优", "沿用 12306 的车次查询、仓位预约与购票逻辑，串成从进入到支付不走回头路的单向流程。"),
        signal_c(2, "智能箱推广", "针对全程不可见、不能探视和独自关箱的担忧，明确展示恒温、温湿度与氧气监控等具体能力。"),
        n=2,
    ),
    flow_title="串联仓位查询、人票购买、宠物票申请、支付、出票与到站领取。",
))
parts.append(slide("rail-solution", "11.b", "rail-solution-flow", "从仓位查询接到出票和领取", "", evidence([
    (f"{A}/rail-solution-29-高铁宠物托运流程调优-从仓位查询到人票购买-宠物票申请与支付的完整链路.png",
     "高铁宠物托运流程调优", "流程调优", "从仓位查询到人票购买、宠物票申请与支付"),
    (f"{A}/rail-solution-30-高铁携宠出行设计方案-覆盖仓位查询-乘客票-宠物票申请与出票流程.png",
     "高铁携宠出行设计方案", "设计方案", "覆盖仓位查询、乘客票、宠物票申请与出票"),
], kind="strip")))

# 12 陆运
parts.append(slide(
    "land", "12.a", "land",
    "陆运：价格通常更低，手续也更少",
    "",
    cells(
        signal_c(1, "价格通常更低", "京杭拼载询价约 ¥450–1,280，明显低于飞机进客舱；整车专送和人宠同行价格会更高。"),
        signal_c(2, "手续更简单", "本次服务商样本多数不要求检疫证明，用户无需围绕短有效期反复准备材料。"),
        signal_c(3, "宠物类型更广", "滴滴档案覆盖猫、狗、鸟类、鱼类和其他合规宠物；野生、濒危等禁运动物仍不承运。"),
        signal_c(4, "陪伴方式可选", "可让宠物单独运输，也可选择人宠同行；整车“宠物快送”页面同样显示人可跟车。"),
        n=4, src=SRC_LAND,
    ),
    flow_title="陆运：价格通常更低，手续也更少",
))
parts.append(slide("land", "12.b", "land-quote", "这次询价，智宠行最低", "按两端地址核价", cells(
    stat_c("¥450", "智宠行", "详细地址 + 距离 + 宠物信息；杭州余杭到北京市区次日到达。"),
    stat_c("¥600+", "易丰", "笼具尺寸 + 两端地址，含上门接宠；余杭到朝阳次日到达。"),
    stat_c("¥1,280", "宠嗒嗒", "含空调、GPS、服务进度和上门接送，可加购一宠一监控、猫舱。"),
    n=3, src=SRC_LAND,
)))
parts.append(slide("land", "12.c", "land-didi", "滴滴把同行、快送和托运放在同一入口", "", evidence([
    (f"{A}/land-31-滴滴宠物档案支持的类型.png", "滴滴宠物档案支持的类型", "宠物档案", "可选狗、猫、鸟类、鱼类和其他合规宠物"),
    (f"{A}/land-32-滴滴宠物快送页面.png", "滴滴宠物快送页面", "宠物快送", "默认送宠，整车也标注人可跟车"),
    (f"{A}/land-33-10kg以内服务商报价.jpg", "10kg以内服务商报价", "10kg 内报价", "三档 ¥625、¥780、¥1280"),
], kind="shot", ratio="0.46:1", fit="fit")))
parts.append(slide("land", "12.d", "land-file", "统一档案之后，才能直接比较", "", cells(point_c(
    "统一档案之后，才能直接比较",
    "统一宠物档案和路线信息后，用户可以直接比较服务商拼载、整车快送与人宠同行。下一步需要把宠物类型、是否可跟车、笼具、时效、监控、保险、接送和异常责任做成统一字段，减少下单后的二次确认。",
), src=SRC_LAND)))

# 13 陆运建议
parts.append(slide(
    "land-solution", "13.a", "land-solution",
    "围绕起终点、服务商能力、价格与订单状态，建立完整的专车预订链路。",
    "",
    cells(
        signal_c(1, "触点优化", "下单前需要咨询服务商，下单后需要沟通具体托运事宜；前后两段联系都不能省。"),
        signal_c(2, "交通兜底", "当宠物档案显示为 37kg 成年金毛，且用户无法接受飞机约 5 倍票价时，直接推荐可承运大型犬的陆运方案。"),
        n=2,
    ),
    flow_title="围绕起终点、服务商能力、价格与订单状态，建立完整的专车预订链路。",
))
parts.append(slide("land-solution", "13.b", "land-solution-flow", "从路线和服务商接到支付", "", evidence([
    (f"{A}/land-solution-34-陆运携宠出行设计方案-覆盖路线输入-服务商选择-订单确认与支付流程.png",
     "陆运携宠出行设计方案", "专车预订", "覆盖路线输入、服务商选择、订单确认与支付"),
], kind="strip")))

# 14 资质
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
    '<p class="venn__label" data-region="ab">检疫证明</p>'
    '<p class="venn__label" data-region="abc">疫苗</p>'
    "</div>"
)
parts.append(slide(
    "granularity", "14.a", "granularity",
    "三个圈是三类出行场景，正中的交集才是所有场景共同依赖的最小颗粒度。",
    "疫苗是唯一的公共分母",
    cells(venn),
    flow_title="三个圈是三类出行场景，正中的交集才是所有场景共同依赖的最小颗粒度。",
))
parts.append(slide("granularity", "14.b", "papers-hard", "最麻烦的一步通常是办检疫证明", "三种航空方式前半段大致相同", cells(
    list_c("属地材料", "杭州拱墅办理样本要求身份证或居住证明，还要有官方免疫证；不同城区和城市的材料口径可能不同。"),
    list_c("宠物通常要到场", "官方兽医需要做临床检查。杭州样本还要求先到指定医院做疫病筛查，筛查报告仅 3 天有效。"),
    list_c("有效期很短", "杭州公开办理案例中的检疫证明有效期为 5 天；各地常见最长 5–7 天，航司还可能要求起飞前 3–5 天内签发。"),
    list_c("时间必须卡准", "证明要覆盖承运日，行程与启运信息也要一致。办早会过期，办晚可能赶不上申报点工作时间。"),
    n=4,
)))
parts.append(slide("granularity", "14.c", "papers-pet", "犬核狂犬疫苗，猫常要猫三联", "订票前先排除品种限制", cells(
    list_c("犬类", "重点检查狂犬疫苗记录：确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。"),
    list_c("猫类", "准备猫三联等免疫记录。部分航司申请时要求猫三联证明；申报点也可能核验其他有效免疫记录。"),
    n=2,
)))
parts.append(slide("granularity", "14.d", "papers-steps", "三种航空方式前半段走同一组步骤", "客舱和托运的差别主要出现在订位方式、箱包要求和机场交接", cells(
    step_stack_c("01", "先确认这班能不能运", "查航司、机场、机型、品种和当班名额。客舱看白名单与宠物名额；货舱还要确认有氧舱、温度和装载条件。"),
    step_stack_c("02", "订人票，并申请宠物服务", "进客舱 / 同机托运先选人票，再申请同一航班的宠物服务。宠物单独飞不需要主人购买人票，单独向货运或服务商订舱。"),
    step_stack_c("03", "准备疫苗本和免疫证明", "提前检查宠物姓名、接种日期、疫苗种类和有效期。办理检疫证明时通常需要宠物到场。"),
    step_stack_c("04", "临近出发办理《动物检疫合格证明》", "携带宠物、身份证或属地居住证明、免疫记录及当地要求的筛查报告，到申报点接受临床检查。"),
    step_stack_c("05", "按运输方式准备箱包和用品", "客舱使用航司规定尺寸的软包；货舱使用符合要求的硬质航空箱。"),
    step_stack_c("06", "提前到机场，完成材料核验和交接", "进客舱通常提前至少 2 小时到人工柜台。同机 / 单独托运到货运或特殊行李柜台交宠。"),
    n=6,
)))
parts.append(slide("granularity", "14.e", "papers-shot", "证明上的行程必须按实际承运来填", "", evidence([
    (f"{A}/granularity-49-动物检疫合格证明示例.jpg", "动物检疫合格证明示例", "检疫证明", "图中是铁路托运案例；航空使用同类证明，运输方式和行程信息需按实际承运填写"),
], kind="shot", ratio="0.46:1", fit="fit")))
parts.append(slide("granularity", "14.f", "papers-grey", "说宠物不用到场就能出证，和公开要求冲突", "授权申报本身有正规路径", cells(point_c(
    "说宠物不用到场就能出证，和公开要求冲突",
    "淘宝等平台和宠物出行服务商可见跑腿、材料整理或“检疫代办”。授权他人申报本身有正规路径，证明仍应由官方兽医签发并完成规定查验；承诺“宠物无需到场即可出证”的服务与多地公开的临床检查要求冲突，存在合规灰区。平台接入时需要核验签发机构、查验方式和退款责任。",
))))

# 15 住宿七问
parts.append(slide(
    "hotel-questions", "15.a", "hotel-questions",
    "把“宠物友好”从一个标签，拆成可比较、可计算、可确认的结构化信息",
    "",
    cells(copy_c(
        "问题不是有没有宠物友好酒店",
        "携宠入住的问题不是“有没有宠物友好酒店”，而是“宠物友好标签背后的规则高度非标”。真正影响用户决策的，是“宠物能不能被准入”、“实际总价是多少”、“宠物在酒店能不能活动”，以及“出了清洁 / 损坏问题到底怎么赔”。"
        "<br><br>国内携程相关报道也提到，用户关注点已经从“能不能带宠物”转向“针对酒店内宠物管理规则、宠物清洁、房型价格等细节化问题也成为用户关注的重点”。",
    ), src=SRC_NEWS),
    flow_title="把“宠物友好”从一个标签，拆成可比较、可计算、可确认的结构化信息",
))
parts.append(slide("hotel-questions", "15.b", "hotel-q-in", "前三问决定能不能入住", "任何一项不满足，结果是入住失败", cells(
    list_c("Q1 带宠物能否入住？", "犬种、体重、数量限制，以及是否需要入住材料（犬证、疫苗本）。OTA 展示的信息经常与酒店实际政策不符。"),
    list_c("Q2 额外费用是多少？", "清洁费与保证金，其中清洁费还分“按晚收”和“按次收”。"),
    list_c("Q3 是否有房型限制？", "部分酒店只有指定房型可携宠，最低价房型往往不在可携宠范围内。"),
    n=3,
)))
parts.append(slide("hotel-questions", "15.c", "hotel-q-stay", "后四问决定是不是住得好", "", cells(
    list_c("Q4 活动范围有多大？", "只能待在客房，还是可以去公区、餐厅、户外场地或草坪，以及能否单独留房。"),
    list_c("Q5 有哪些宠物设施？", "是否提供宠物餐食，以及宠物厕所、玩具、睡窝、食盆和水盆等用品。"),
    list_c("Q6 造成损坏怎么赔偿？", "宠物弄脏沙发或床、抓坏家具等物品时，赔偿标准和押金扣除规则是什么。"),
    list_c("Q7 如何确认留痕，确保到店不会被拒？", "下单时是否需要备注或提前告知前台；口头确认后，如何保障到店不被拒。"),
    n=4,
)))

# 16 top10
parts.append(slide(
    "hotel-survey", "16.a", "hotel-survey",
    "杭州 Top10 宠物酒店电话调研",
    "热度 = 小红书总赞数 + 总收藏数",
    cells(table_from(
        ["酒店", "清洁费", "证件", "体重 / 数量", "损坏"],
        [
            ["杭州富春芳草地臻品之选度假酒店", "每间每次 ¥200", "无需", "不限 / 2 只", "损坏无规则；尿损含在清洁费"],
            ["杭州桐庐康莱德酒店", "每只每晚 ¥600–1500", "犬：许可证、疫苗证；猫：疫苗证", "34kg 内 / 2 只", "损坏无规则；尿损另计"],
            ["杭州西溪花间堂", "每只每次 ¥200", "犬：许可证 or 疫苗证；猫：无需", "不限 / 2 只", "损坏无规则；尿损 ¥200"],
            ["天目山树华酒店 · 希尔顿格芮精选", "每间每次 ¥350", "犬猫疫苗证（超 2 周且 1 年内）", "25kg 内 / 2 只", "损坏无规则；尿损另计"],
            ["桐庐开元森泊 · 外婆家度假酒店", "每间每次 ¥200", "无需", "不限 / 不限", "部分房型不可携宠；尿损含在清洁费"],
            ["朴宿 · 所在", "免费（飞猪写不可携宠）", "犬：许可证 or 疫苗证；猫：疫苗证", "不限 / 不限", "仅部分房型可带；尿损另计"],
            ["桐庐语山水 · 叙旧度假民宿", "免费（飞猪写 ¥100/晚）", "犬：许可证 or 疫苗证；猫：疫苗证", "不限 / 不限", "损坏无规则；尿损 ¥200"],
            ["杭州金沙湖和达希尔顿嘉悦里酒店", "每间每次 ¥300", "犬猫均要许可证、疫苗证", "17.5kg 内 / 2 只", "不可单独留房；尿损另计"],
            ["千岛湖绿城蓝湾度假酒店", "免费", "无需", "30kg 内 / 1 只", "损坏无规则；尿损另计"],
            ["天目山度喜天丽酒店", "每间每晚 ¥260", "无需", "10kg 内 / 1 只", "仅部分房型可带；尿损另计"],
        ],
    ), src=SRC_HOTEL),
    flow_title="杭州 Top10 宠物酒店电话调研",
))
parts.append(slide("hotel-survey", "16.b", "hotel-huajian", "花间堂：宠物订单占总订单 20%", "2023—2024 年宠物订单量增长 23%", evidence([
    (f"{A}/hotel-survey-35-花间堂宠物订单占比-订单量增长-宠物类型与出行方式四组数据.png",
     "花间堂宠物订单占比、订单量增长、宠物类型与出行方式四组数据", "花间堂", "狗 95%、猫 4%、其他 1%；自驾游 80%、兴趣社团游 20%"),
], kind="strip")))

# 17 调研小结
parts.append(slide(
    "hotel-findings", "17.a", "hotel-findings",
    "信息错误、费用混乱，宠物友好酒店亟待解决“标准化”问题。",
    "T10 电话实测",
    cells(
        stat_c("2/10", "平台信息有误", "飞猪页面与酒店实际政策不一致：一家写“不可携宠”实际可以，一家写 ¥100/晚 实际免费。"),
        stat_c("5/10", "要求证件材料", "需要养宠许可证或疫苗证，其中 2 家还有疫苗时效要求（接种超 2 周且在 1 年内）。"),
        stat_c("4套", "清洁费计费口径", "每间每次 / 每只每次 / 每间每晚 / 每只每晚并存，单价相同时总支出可差 4 倍。"),
        stat_c("10/10", "损坏赔偿无规则", "全部酒店对物品损坏均“单独计费、无明确标准”。"),
        n=4, src=SRC_HOTEL,
    ),
    flow_title="信息错误、费用混乱，宠物友好酒店亟待解决“标准化”问题。",
))
parts.append(slide("hotel-findings", "17.b", "hotel-fee", "清洁费四套口径，单价相同总支出能差四倍", "假设单价 ¥200，带 2 只住 2 晚", cells(table_from(
    ["计费方式", "计费单位数", "总支出"],
    [
        ["每间每次", "1（与只数、晚数无关）", "¥200"],
        ["每只每晚", "2 只 × 2 晚 = 4", "<strong>¥800</strong>"],
    ],
), src=SRC_HOTEL)))
parts.append(slide("hotel-findings", "17.c", "hotel-risk", "酒店普遍把损坏和清洁风险转嫁给用户，但规则模糊", "", cells(
    list_c("损坏无规则", "10 / 10 对物品损坏均单独计费、没有公开标准。"),
    list_c("尿损另计", "8 / 10 收了清洁费仍对尿损另行计费；仅 20% 把尿损含在清洁费内。"),
    list_c("押金无标准", "4 / 10 需要收取押金：康莱德、树华希尔顿、嘉悦里、度喜天丽，且对押金扣罚无标准。"),
    n=3, src=SRC_HOTEL,
)))

# 18 竞品
parts.append(slide(
    "supply-close", "18.a", "supply-close",
    "竞品现状：专注宠物的小程序在做评测&权益，OTA 还停在筛选项。",
    "",
    cells(point_c(
        "小程序在做评测和权益，OTA 还停在筛选项",
        "重点在宠物友好酒店的评测和筛选，通过亲自体验筛选出体验较好的酒店，有专属价格供给，特别是可以拿到专属的权益如减免宠物清洁费。因都主打“亲自”体验过，所以供给也有地域性。国内各大 OTA 现在都还是以“可携带宠物”筛选项为主。",
    )),
    flow_title="竞品现状：专注宠物的小程序在做评测&权益，OTA 还停在筛选项。",
))
parts.append(slide("supply-close", "18.b", "rivals-mini", "专注宠物酒店的产品", "江浙沪 / 广州", evidence([
    (f"{A}/supply-close-37-玩小伴微信小程序的宠物酒店特价房券-房型与宠物保险页面.jpg", "玩小伴微信小程序", "玩小伴", "酒店以套餐为主，基本都有平台专属清洁费优惠"),
    (f"{A}/supply-close-38-FunGo-微信小程序的宠物友好标签与房型详情页面.jpg", "FunGo 微信小程序", "FunGo", "List 和 Detail 都侧重宠物信息"),
], kind="strip")))
parts.append(slide("supply-close", "18.c", "rivals-ota", "OTA 仍以“可携带宠物”筛选项为主", "四家都没有解决总价可计算和到店不被拒", evidence([
    (f"{A}/supply-close-39-携程宠物筛选-酒店政策与宠物收费展示.jpg", "携程宠物筛选与收费", "携程", "收费政策能写到每间每晚"),
    (f"{A}/supply-close-40-飞猪宠物友好筛选与宠物政策展示.jpg", "飞猪宠物政策", "飞猪", "政策里多见费用详询酒店"),
    (f"{A}/supply-close-41-美团宠物筛选与宠物政策展示.jpg", "美团宠物政策", "美团", "允许携带宠物，具体咨询酒店"),
    (f"{A}/supply-close-42-Booking-准许携带宠物筛选与宠物费用说明.jpg", "Booking 宠物费用", "Booking", "把宠物费用前置到列表卡片"),
], kind="strip")))
parts.append(slide("supply-close", "18.d", "rivals-list", "频道和榜单有合辑，入口深", "", evidence([
    (f"{A}/supply-close-44-携程宠游会频道-宠物档案-友好景点-友好酒店与宠物托运入口.jpg", "携程宠游会", "宠游会", "档案、景点、酒店、托运已经搭在一起，入口深"),
    (f"{A}/supply-close-45-大众点评必住榜-2025-的宠物友好标签.jpg", "大众点评必住榜", "必住榜", "宠物友好只是横向标签之一"),
    (f"{A}/supply-close-46-猫途鹰旅行者之选曼谷宠物友好酒店榜.jpg", "猫途鹰宠物友好榜", "旅行者之选", "以城市为单位出榜，信息展示接近常规酒店"),
    (f"{A}/supply-close-43-携程宠物标签体系-收费携带宠物-免费携带宠物-可携带宠物-狗狗友好-猫猫友好.png", "携程宠物标签体系", "标签细粒度", "收费 / 免费 / 可携带 / 狗狗友好 / 猫猫友好"),
], kind="shot", ratio="0.46:1", fit="fit")))

# 19 酒店建议
parts.append(slide(
    "hotel-solution", "19.a", "hotel-solution",
    "01 通过交叉通航的验证，选出核心城市进行酒店业务拓展。",
    "交互网络图未进模板",
    cells(copy_c(
        "通航核验结果小结",
        "飞机覆盖更广，尤其支撑三亚、乌鲁木齐、丽江和西双版纳等长距离旅行目的地。高铁供给集中在少数主干城市对，补充部分直达需求。"
        "<br><br>这是酒店布局的交通供给底图，并非完整市场排名。飞机表示样本日期存在直飞，高铁表示已经核到可办理宠物托运的具体直达车次；未连线表示本轮没有核到对应服务。后续再叠加宠物友好酒店量、搜索热度、客单价和季节性，形成最终 Top 20 优先级。",
    )),
    flow_title="01 通过交叉通航的验证，选出核心城市进行酒店业务拓展。",
))
parts.append(slide("hotel-solution", "19.b", "hotel-plan-map", "七个问题可以落到筛选、种草、保障三层", "02 撞库筛选核心酒店", cells(table_from(
    ["层级", "解决的决策", "包含的字段", "对应问题"],
    [
        ["筛选", "我的宠物能不能住 / 要多花多少钱", "类型、禁养、体重、数量、证件、房型、清洁费口径", "Q1–Q3"],
        ["种草", "宠物是不是只能待在房间", "活动区域、禁止区域、可否留房、房间设施", "Q4–Q5"],
        ["保障", "承诺是否可靠 / 到店会不会被拒", "押金、损坏规则、服务保障", "Q6–Q7"],
    ],
))))
parts.append(slide("hotel-solution", "19.c", "hotel-star", "建议优先选择 4 星 / 5 星合作", "去重后热度榜前 30 中没有一家 2 星 / 3 星", cells(
    stat_c("6%", "平台供给里的 4 星 / 5 星", "杭州宠物友好酒店 377 / 6326。"),
    stat_c("66%", "真实入住样本里的 4 星 / 5 星", "小红书宠物友好酒店 105 / 161。"),
    n=2,
)))
parts.append(slide("hotel-solution", "19.d", "hotel-plan-steps", "03 AI 识别形成可复用档案", "通过档案自动筛选酒店", cells(
    step_stack_c("01", "档案自动化筛选", "AI 分析宠物照片或证件，快速生成档案中的有效字段，对酒店信息进行匹配，自动帮用户过滤掉不符合宠物条件的选择。"),
    step_stack_c("02", "清晰的价格展示", "讲清楚清洁费的收费逻辑，筛选项还可以按晚数来预估总价。"),
    step_stack_c("03", "健全的政策表达", "详情页首屏第一权重肯定是需要看到政策的，有独立页面展示政策、设施、活动内容。"),
    n=3,
)))
parts.append(slide("hotel-solution", "19.e", "hotel-plan-shots", "后台报名、档案和详情要接到筛选之前", "", evidence([
    (f"{A}/hotel-solution-飞猪商家后台报名与信息填写.png", "飞猪商家后台的宠物友好酒店报名和信息填写页面", "后台报名", "填写信息 + AI 辅助审核，减轻 BD 压力"),
    (f"{A}/hotel-solution-47-酒店宠物档案设计方案-覆盖证件上传-AI图片识别和档案填写.png", "酒店宠物档案设计方案", "宠物档案", "通过照片或证件识别有效字段，再由用户确认"),
    (f"{A}/hotel-solution-48-宠物友好酒店设计方案-覆盖自动筛选-酒店详情-宠物政策与设施详情.png", "宠物友好酒店设计方案", "酒店详情", "自动筛选，并把收费、准入、设施前置"),
], kind="strip")))

# 20 价值主张
parts.append(slide(
    "value", "20.a", "value",
    "带宠出行，从“碰运气”到“看清单”。",
    "手续帮你办 · 同舱更安心 · 带宠放心住 · 一站下单全搞定",
    evidence([
        (f"{A}/value-51-手续帮你办服务海报.png", "手续帮你办服务海报", "手续帮你办", "把检疫和材料收进同一条订单"),
        (f"{A}/value-52-同舱更安心服务海报.png", "同舱更安心服务海报", "同舱更安心", "能进客舱时，人和宠不分开"),
        (f"{A}/value-53-带宠放心住服务海报.png", "带宠放心住服务海报", "带宠放心住", "准入、费用和到店不被拒写进决策前"),
        (f"{A}/value-54-一站下单全搞定服务海报.png", "一站下单全搞定服务海报", "一站下单全搞定", "运输和住宿不再拆成多次确认"),
    ], ratio="3:4", fit="fill"),
    flow_title="带宠出行，从“碰运气”到“看清单”。",
))

# 21 总结
parts.append(slide(
    "opportunity", "21.a", "opportunity",
    "一站式服务的机会，在于借用代理能力突破资质，补齐服务链、整合分散信息，降低用户携宠出行的复杂度。",
    "上半区解决资质与服务能力缺口，下半区把零散信息变成可下单的决策",
    evidence([
        (f"{A}/opportunity-55-宠物旅行一站式服务机会象限-资质与服务能力突破-信息整合能力.png",
         "宠物旅行一站式服务机会象限：资质与服务能力突破、信息整合能力", "机会象限", "上半区解决资质与服务能力缺口，下半区把零散信息变成用户可直接下单的决策"),
    ], ratio="4:3", fit="fill"),
    flow_title="一站式服务的机会，在于借用代理能力突破资质，补齐服务链、整合分散信息，降低用户携宠出行的复杂度。",
))
parts.append(slide("opportunity", "21.b", "chance-list", "档案、清单、价格、设施、推荐要接到同一条链", "", cells(
    list_c("宠物档案", "录入品种、体重、芯片、疫苗、性情等结构化信息，自动筛选匹配其体型与政策的可用服务，不再挨个打电话确认。"),
    list_c("合规清单", "出发前的检疫证、运输政策、酒店入住要求、景点规定一键生成，可勾选代办并合并入同一订单。"),
    list_c("价格透明", "按房型拆“清洁费 + 宠物附加费”，每间每晚精确到元；下单前可一键复核。"),
    list_c("设施齐全", "把“宠物友好”标签拆成结构化字段：宠物床 / 食盆 / 围栏 / 拾便袋 / 庭院 / 周边宠物医院。"),
    list_c("交叉推荐", "“人想去 ∩ 宠能一起去”做交集，产出真实可执行的榜单与同行旅伴实测笔记加权推荐。"),
    list_c("信息整合能力", "聚合有效信息，组装成用户下单决策——减少麻烦和噪音，提升决策效率，通过服务能力锁定履约。"),
)))
parts.append(slide("opportunity", "21.c", "chance-point", "关键不是增加入口，而是减少反复确认", "", cells(point_c(
    "关键不是增加入口，而是减少反复确认",
    "从分散供给到一站式履约，关键不是增加入口，而是减少用户反复确认。我们不与垂直品类抢执行，而是把它们的执行层接入到一条用户能看懂的决策链路上。",
))))

parts.append("""        <section class="report-slide" data-chapter="notes" data-slide="22" id="notes">
          <footer class="report-notes">
            <h2>这些数字能推到哪</h2>
            <ol>
              <li>5538 万次里的 50% 选择出行、每年 2 次，是情景假设，不是观测值。来源含《2026 年中国宠物行业白皮书》《携宠出行意愿调研报告》《携程酒店数据》。</li>
              <li>进客舱航线 1100–1350、航线覆盖 25%–30% / 55%–65%，是行业汇总估算区间；航线进池不等于每天有名额。</li>
              <li>北京—杭州价格是样本：客舱基础服务费、派到托运、12306 携宠出行优惠价、陆运拼载询价，口径不同，不能直接比总价。</li>
              <li>高铁 OTA 衔接以源页截图为准；没有把未出现在原文中的逐家故障写成结论。</li>
              <li>酒店 Top10 来自杭州小红书热度抽样电话核实，不能外推全国。清洁费四倍差是“2 只 × 2 晚、单价 ¥200”的设定。</li>
              <li>承诺宠物不到场即可出证，与多地公开临床检查要求冲突；材料撑不住“代办一定合规”。</li>
              <li>品牌概念片、城市通航交互网络未进模板：分别用海报静帧和文字小结代替。</li>
            </ol>
          </footer>
        </section>
      </div>
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
