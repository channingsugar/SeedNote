#!/usr/bin/env python3
"""Generate editorial-page/index.html: 分屏目录。Grid 1 / 2 / 3 / 4 / More Grids.

流式是另一套模板 templates/editorial-flow/，不要在这里加切换。

格子里的字是占位，不是成品，也不是用法说明。
写法：〔槽名〕填法。整句替换；〔〕不要带进报告。
页眉组件名（纯文字、观点、Grid 1）是目录，不是占位。
"""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")

COPY = "〔条件〕这句在什么范围成立，有何例外。一句说完，不另开一问。"
LONG = (
    "〔正文〕写成完整段落。先回答这一屏的问句，再写条件和例外，最后写材料撑不住什么。"
    "不要拆成列表，也不要写成判断句。"
    "<br><br>"
    "〔续段〕需要第二段时换行接着写。没有第二段就删掉这段。"
)
SIGNALS = [
    ("SIGNAL 01", "〔判断〕有主语、有动作，能单独成立", "〔条件〕只补这一句。一格一句。"),
    ("SIGNAL 02", "〔判断〕同一问下的第二句", "〔条件〕不要把邻句的材料写进来。"),
    ("SIGNAL 03", "〔判断〕同一问下的第三句", "〔条件〕图和数字为这一句付账。"),
    ("SIGNAL 04", "〔判断〕同一问下的第四句", "〔条件〕离开时知道先做什么。"),
    ("SIGNAL 05", "〔判断〕同一问下的第五句", "〔条件〕材料撑不住就写进口径。"),
]
STATS = [
    ("00", "〔指标名〕多少、多贵或多窄", "〔口径〕统计范围、时间、是否含例外。"),
    ("0.0×", "〔倍率名〕相对什么", "〔口径〕对比的基准写清楚。"),
    ("N", "〔计数名〕有多少个", "〔口径〕含什么、不含什么。"),
    ("—", "〔尚无数据〕", "〔口径〕材料撑不住就写破折号，不要编数字。"),
]
LISTS = [
    ("〔对象 A〕", "〔条件〕范围、限制、例外。一句说完。"),
    ("〔对象 B〕", "〔条件〕范围、限制、例外。一句说完。"),
    ("〔对象 C〕", "〔条件〕范围、限制、例外。一句说完。"),
    ("〔对象 D〕", "〔条件〕范围、限制、例外。一句说完。"),
]
STEPS = [
    ("01", "〔这一步做什么〕", "〔完成标准〕做到什么才进入下一步。"),
    ("02", "〔这一步做什么〕", "〔完成标准〕输入是什么，输出是什么。"),
    ("03", "〔这一步做什么〕", "〔完成标准〕谁来做，做到什么算过。"),
    ("04", "〔这一步做什么〕", "〔完成标准〕失败时停在哪，不要跳步。"),
]
BARS = [
    ("〔对象 A〕", 24, None, "〔差异〕短句"),
    ("〔对象 B〕", 36, None, "〔差异〕短句"),
    ("〔对象 C〕", 48, None, "〔差异〕短句"),
    ("〔对象 D〕", 61, None, "〔差异〕短句"),
    ("〔对象 E〕", 70, None, "〔差异〕短句"),
    ("〔对象 F〕", 82, "warning", "〔差异〕需留意"),
    ("〔对象 G〕", 88, "danger", "〔差异〕风险高"),
    ("〔对象 H〕", 92, None, "〔差异〕短句"),
]

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


SOURCE = source("〔出处〕文件名、官网或抽样口径")
SOURCE_OPS = source("〔出处〕口径写在数字下面")
SOURCE_DOC = source("〔出处〕公开文件或官网名称")


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
    count = len(items)
    slots = 10 if count > 9 else count
    return f'<div class="page-grid" data-slots="{slots}">{bits}</div>'


def copy_c():
    return f'<div class="content" data-content="copy"><h3 class="content__title">〔范围〕背景、边界或材料撑不住什么</h3><p class="content__body">{LONG}</p></div>'


def point_c():
    return f'<div class="content" data-content="point"><h3 class="content__title">〔判断〕有主语、有动作，能讲出口</h3><p class="content__body">{COPY}</p></div>'


def signal_c(i=0):
    _, t, b = SIGNALS[i % len(SIGNALS)]
    return f'<div class="content" data-content="signal"><span class="content__kicker">SIGNAL {i + 1:02d}</span><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div>'


def stat_c(i=0):
    v, t, b = STATS[i % len(STATS)]
    return f'<div class="content" data-content="stat"><b class="stat-value">{v}</b><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div>'


def list_c(i=0):
    letters = "ABCDEFGHIJ"
    _, b = LISTS[i % len(LISTS)]
    return f'<div class="content" data-content="list"><span class="content__label">〔对象 {letters[i % 10]}〕</span><p class="content__body">{b}</p></div>'


def step_c(i=0):
    _, t, b = STEPS[i % len(STEPS)]
    n = f"{i + 1:02d}"
    return (
        f'<div class="content" data-content="step"><span class="content__index">{n}</span>'
        f'<div class="content__copy"><h3 class="content__title">{t}</h3><p class="content__body">{b}</p></div></div>'
    )


def step_stack_c(i=0):
    _, t, b = STEPS[i % len(STEPS)]
    n = f"{i + 1:02d}"
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
    cols, row_n = len(headers), 1 + len(rows)
    return (
        f'<div class="content" data-content="table">'
        f'<div class="content-cols" style="--table-cols:{cols};--table-rows:{row_n}">{"".join(bits)}</div>'
        f"</div>"
    )


TABLE_WIDE = table_from(
    ["〔对象〕", "〔属性〕", "〔条件〕", "〔时效〕", "〔范围〕", "〔例外〕", "〔状态〕", "〔成本〕", "〔风险〕", "〔判断〕"],
    [
        ["〔A〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "<em>〔取舍〕</em>"],
        ["〔B〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔C〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "<strong>〔强调〕</strong>"],
        ["〔D〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔E〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔F〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔G〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "<em>〔取舍〕</em>"],
        ["〔H〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔I〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
        ["〔J〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔值〕", "〔取舍〕"],
    ],
)
TABLE_CMP = table_from(
    ["〔对象〕", "〔条件〕", "〔判断〕"],
    [
        ["〔对象 A〕", "〔条件〕范围和例外", "<em>〔取舍〕</em>"],
        ["〔对象 B〕", "〔条件〕范围和例外", "〔取舍〕"],
        ["〔对象 C〕", "〔条件〕范围和例外", "<strong>〔强调〕</strong>"],
        ["〔对象 D〕", "〔条件〕范围和例外", "〔取舍〕"],
        ["〔对象 E〕", "〔条件〕范围和例外", "〔取舍〕"],
        ["〔对象 F〕", "〔条件〕范围和例外", "〔取舍〕"],
    ],
)
TABLE_SPEC = table_from(
    ["〔对象〕", "〔规格〕", "〔边界〕"],
    [
        ["〔对象 A〕", "〔规格〕可核对的量", "〔边界〕超出就停下"],
        ["〔对象 B〕", "〔规格〕可核对的量", "〔边界〕超出就停下"],
        ["〔对象 C〕", "〔规格〕可核对的量", "<strong>〔强调〕</strong>"],
        ["〔对象 D〕", "〔规格〕可核对的量", "〔边界〕超出就停下"],
        ["〔对象 E〕", "〔规格〕可核对的量", "<em>〔取舍〕</em>"],
        ["〔对象 F〕", "〔规格〕可核对的量", "〔边界〕超出就停下"],
    ],
)
TABLE_TIME = table_from(
    ["〔对象〕", "〔时效〕", "〔判断〕"],
    [
        ["〔对象 A〕", "〔时效〕多久能完成", "<em>〔取舍〕</em>"],
        ["〔对象 B〕", "〔时效〕多久能完成", "<strong>〔强调〕</strong>"],
        ["〔对象 C〕", "〔时效〕多久能完成", "〔取舍〕"],
        ["〔对象 D〕", "〔时效〕多久能完成", "〔取舍〕"],
        ["〔对象 E〕", "〔时效〕多久能完成", "〔取舍〕"],
        ["〔对象 F〕", "〔时效〕多久能完成", "〔取舍〕"],
    ],
)
TABLE_DOC = table_from(
    ["〔材料〕", "〔有效期〕", "〔用途〕"],
    [
        ["〔材料 A〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
        ["〔材料 B〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
        ["〔材料 C〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
        ["〔材料 D〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
        ["〔材料 E〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
        ["〔材料 F〕", "〔有效期〕从何时算", "〔用途〕用在哪一步"],
    ],
)


def table_c(kind="cmp"):
    return {
        "wide": TABLE_WIDE,
        "when": TABLE_CMP,
        "slot": TABLE_SPEC,
        "grid": TABLE_TIME,
        "fill": TABLE_DOC,
        "cmp": TABLE_CMP,
        "spec": TABLE_SPEC,
        "time": TABLE_TIME,
        "doc": TABLE_DOC,
        "air": TABLE_CMP,
        "rail": TABLE_SPEC,
        "road": TABLE_TIME,
        "docs": TABLE_DOC,
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
    return f'<div class="bar-compare" data-item-count="{n}"><p class="bar-compare__title">〔组标题〕同一口径下比什么</p>{"".join(items)}</div>'


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
    return f'<div class="bar-compare is-vertical" data-item-count="{n}"><p class="bar-compare__title">〔组标题〕同一口径下比什么</p>{"".join(items)}</div>'


def formula_c():
    return (
        '<div class="formula" data-item-count="4">'
        '<div class="formula__factor"><b>〔A〕</b><span>〔条件〕参与相乘的因子</span></div>'
        '<span class="formula__op">×</span>'
        '<div class="formula__factor"><b>〔B〕</b><span>〔条件〕参与相乘的因子</span></div>'
        '<span class="formula__op">×</span>'
        '<div class="formula__factor"><b>〔C〕</b><span>〔条件〕参与相乘的因子</span></div>'
        '<span class="formula__op is-eq">=</span>'
        '<div class="formula__factor is-result"><b>〔结果〕</b><span>〔含义〕同时成立时得到什么</span></div>'
        "</div>"
    )


def matrix_c():
    return (
        '<div class="matrix" data-item-count="4">'
        '<span class="matrix__axis" data-edge="left">〔横轴负〕</span>'
        '<div class="matrix__plot">'
        '<span class="matrix__axis" data-edge="top">〔纵轴正〕</span>'
        '<div class="matrix__quads">'
        '<article class="matrix__cell"><strong>〔对象 A〕</strong><p>〔为何在这格〕</p></article>'
        '<article class="matrix__cell"><strong>〔对象 B〕</strong><p>〔为何在这格〕</p></article>'
        '<article class="matrix__cell"><strong>〔对象 C〕</strong><p>〔为何在这格〕</p></article>'
        '<article class="matrix__cell"><strong>〔对象 D〕</strong><p>〔为何在这格〕</p></article>'
        "</div>"
        '<span class="matrix__axis" data-edge="bottom">〔纵轴负〕</span>'
        "</div>"
        '<span class="matrix__axis" data-edge="right">〔横轴正〕</span>'
        "</div>"
    )


def line_c():
    return (
        '<figure class="line-chart" data-series="1">'
        '<ul class="line-chart__legend"><li data-series="a">〔指标〕同一口径随时间</li></ul>'
        '<svg class="line-chart__plot" viewBox="0 0 640 280" preserveAspectRatio="xMidYMid meet"></svg>'
        '<ol class="line-chart__points">'
        "<li><span>〔期 1〕</span><b data-chart-series=\"a\">18</b></li>"
        "<li><span>〔期 2〕</span><b data-chart-series=\"a\">41</b></li>"
        "<li><span>〔期 3〕</span><b data-chart-series=\"a\">27</b></li>"
        "<li><span>〔期 4〕</span><b data-chart-series=\"a\">33</b></li>"
        "<li><span>〔期 5〕</span><b data-chart-series=\"a\">38</b></li>"
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
        '<p class="venn__label" data-region="a">〔集合 A〕</p>'
        '<p class="venn__label" data-region="b">〔集合 B〕</p>'
        '<p class="venn__label" data-region="ab">〔交集〕</p>'
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
        '<p class="venn__label" data-region="a">〔集合 A〕</p>'
        '<p class="venn__label" data-region="b">〔集合 B〕</p>'
        '<p class="venn__label" data-region="c">〔集合 C〕</p>'
        '<p class="venn__label" data-region="ab">〔AB 交〕</p>'
        '<p class="venn__label" data-region="abc">〔三交〕</p>'
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
        f'<div class="evidence-window"><img src="{ASSET}/cabin-01.jpg" alt="〔图〕现场"></div>'
        "<figcaption><b>〔对象 A〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="3:4" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/rail-01.jpg" alt="〔图〕现场"></div>'
        "<figcaption><b>〔对象 B〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="3:4" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-01.jpg" alt="〔图〕现场"></div>'
        "<figcaption><b>〔对象 C〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure></div>"
    )


def evidence_shot_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit" data-item-count="3">'
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-profile.png" alt="〔图〕截图"></div>'
        "<figcaption><b>〔界面 A〕</b><span>〔核对〕这一屏要看清哪个字段</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-travel.png" alt="〔图〕截图"></div>'
        "<figcaption><b>〔界面 B〕</b><span>〔核对〕这一屏要看清哪个字段</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-kind="shot" data-image-ratio="0.46:1" data-image-fit="fit">'
        f'<div class="evidence-window"><img src="{ASSET}/pet-delivery.png" alt="〔图〕截图"></div>'
        "<figcaption><b>〔界面 C〕</b><span>〔核对〕这一屏要看清哪个字段</span></figcaption></figure></div>"
    )


def evidence_wide_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-ratio="4:3" data-image-fit="fill" data-item-count="3">'
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-01.jpg" alt="〔图〕横屏"></div>'
        "<figcaption><b>〔对象 A〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/road-03.jpg" alt="〔图〕横屏"></div>'
        "<figcaption><b>〔对象 B〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure>"
        f'<figure class="evidence-figure" data-image-ratio="4:3" data-image-fit="fill">'
        f'<div class="evidence-window"><img src="{ASSET}/ride-together.jpg" alt="〔图〕横屏"></div>'
        "<figcaption><b>〔对象 C〕</b><span>〔证明〕这张图证明什么</span></figcaption></figure></div>"
    )


def evidence_strip_c():
    return region(
        '<div class="image-grid evidence-gallery" data-image-kind="strip" data-item-count="1">'
        f'<figure class="evidence-figure" data-image-kind="strip">'
        f'<div class="evidence-window"><img src="{ASSET}/rail-ota-flow.jpg" alt="〔图〕条带"></div>'
        "<figcaption><b>〔流程〕</b><span>〔证明〕这一条带证明哪几步按什么顺序</span></figcaption></figure></div>"
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
            "〔对象 A〕",
            [
                (f"{ASSET}/cabin-01.jpg", "〔图〕主图", "〔图 1〕"),
                (f"{ASSET}/cabin-02.jpg", "〔图〕主图", "〔图 2〕"),
            ],
            "〔判断〕这一张要带走什么",
            [("〔字段〕", "〔值〕"), ("〔字段〕", "〔值〕")],
        ),
        fig(
            "〔对象 B〕",
            [
                (f"{ASSET}/air-cargo-01.jpg", "〔图〕主图", "〔图 1〕"),
                (f"{ASSET}/air-cargo-02.jpg", "〔图〕主图", "〔图 2〕"),
                (f"{ASSET}/air-cargo-03.jpg", "〔图〕主图", "〔图 3〕"),
            ],
            "〔判断〕这一张要带走什么",
            [("〔字段〕", "〔值〕"), ("〔字段〕", "〔值〕")],
        ),
        fig(
            "〔对象 C〕",
            [
                (f"{ASSET}/rail-05.jpg", "〔图〕主图", "〔图 1〕"),
                (f"{ASSET}/rail-01.jpg", "〔图〕主图", "〔图 2〕"),
            ],
            "〔判断〕这一张要带走什么",
            [("〔字段〕", "〔值〕"), ("〔字段〕", "〔值〕")],
        ),
        fig(
            "〔对象 D〕",
            [
                (f"{ASSET}/road-01.jpg", "〔图〕主图", "〔图 1〕"),
                (f"{ASSET}/road-03.jpg", "〔图〕主图", "〔图 2〕"),
            ],
            "〔判断〕这一张要带走什么",
            [("〔字段〕", "〔值〕"), ("〔字段〕", "〔值〕")],
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
  <title>知识汇报模板 · 分屏</title>
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

  <div class="report-shell is-deck" data-catalog>
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
    "cover", "00", "cover", "〔题域〕", "〔主判断〕整场结束时能复述的一句",
    "〔开场〕这件事是什么，凭什么成立，出去之后先做什么。",
    image=CABIN,
    active=True,
    number=False,
    subtitle="〔副题〕没有就删",
    scope="N 章",
    kind="〔稿件类型〕",
    author="〔作者〕",
    date="〔日期〕",
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
    ("01.h", "g1-table", "表格宽", "一格 · 整表 · 10 列 · strong / em", cells(table_c("wide"), src=SOURCE_DOC)),
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
    ("02.e", "g2-table", "表格", "两格 · 少列对照", cells(table_c("cmp"), table_c("spec"), n=2, src=[SOURCE_DOC, SOURCE])),
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
    ("03.e", "g3-table", "表格", "三格 · 少列对照", cells(table_c("cmp"), table_c("spec"), table_c("time"), n=3, src=[SOURCE_DOC, SOURCE, ""])),
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
    ("04.e", "g4-table", "表格", "四格 · 少列对照", cells(table_c("cmp"), table_c("spec"), table_c("time"), table_c("doc"), n=4, src=[SOURCE_DOC, SOURCE, "", SOURCE_OPS])),
    ("04.f", "g4-bar", "Bar", "四格 · 竖条", cells(*[bar_v() for _ in range(4)], n=4, src=SOURCE_OPS)),
]
for no, sid, title, part, body in g4:
    parts.append(slide("grid4", no, sid, title, part, body))

parts.append(cover("more", "05", "more", "更多格子", "More Grids", "5–9 一次铺开；超过 9 格再用横滑。"))
g5 = [
    ("05.a", "g5-signal", "带序号观点", "五格 · 3+2", many(signal_c, 5, 5)),
    ("05.b", "g5-stat", "数据", "六格 · 3×2", many(stat_c, 6, 6, src=SOURCE_OPS)),
    ("05.c", "g5-list", "列表", "九格 · 3×3", many(list_c, 9, 9)),
    ("05.d", "g5-step", "编号列表", "五格 · 纵向", many(step_stack_c, 5, 5)),
    ("05.e", "g5-table", "表格", "六格 · 3×2", cells(*[table_c("cmp") for _ in range(6)], n=6, src=SOURCE_DOC)),
    ("05.f", "g5-bar", "Bar", "10+ · 横滑", cells(*[bar_v() for _ in range(10)], n=10, src=SOURCE_OPS)),
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
    f'<div class="full-page__media" data-caption="off"><img src="{CABIN}" alt="〔图〕全屏底图"></div>'
    f'<article class="grid-cell">{copy_c()}{SOURCE}</article></div>',
))
parts.append(slide(
    "fullscreen", "07.b", "full-none", "全屏无图", "浅底，一块 Content · 无出处则不出来源",
    f'<div class="full-page" data-full="none"><article class="grid-cell">{copy_c()}</article></div>',
))
parts.append(slide(
    "fullscreen", "07.c", "full-photo", "全屏只有图", "只有图，没有文字",
    '<div class="full-page" data-full="image" data-copy="off">'
    f'<div class="full-page__media" data-caption="off"><img src="{CABIN}" alt="〔图〕全屏图片"></div>'
    f'{SOURCE}</div>',
))

parts.append("""        <section class="report-slide" data-chapter="notes" data-slide="09" id="notes">
          <footer class="report-notes">
            <h2>模板使用说明</h2>
            <ol>
              <li>格子里带〔〕的是占位。整句换成调研原文；〔〕不要带进报告。</li>
              <li>〔〕里是槽名，后面是填法。页眉组件名（纯文字、观点、Grid 1）是目录，不要改。</li>
              <li>封面填：题域、主判断、开场、副题、章数、稿件类型、作者、日期。</li>
              <li>先定 Content，再选 Grid。一个 Grid 只放一种 Content。</li>
              <li>Grid 1 / 2 / 3 / 4 / 5–9 / 10+。列表和步骤一条就是一格。Grid 3 / 5–9 / 10+ 的编号列表用纵向。5–9 一次铺开，超过 9 格才横滑。</li>
              <li>表和条整块占一格，宽度铺满，行间有分割线。可以上下滚动，不显示滚动条。有出处才写「数据来源」并挂链接；没有出处这一行不出现。字号 Caption（12），放在白卡内容区，居中。</li>
              <li>单元格里 <strong>加粗</strong> 用 strong，<em>强调</em> 用 em（强调色 + 加粗）。同一张表里示意即可，不要另开强调组件。</li>
              <li>Evidence 单独成章：现场图、截图、横屏、条带、Media Switch。不进 Grid 格。封面默认并排多张。</li>
              <li>全屏单独成章：有图、无图，或只有图。永远 1 块。</li>
              <li>视觉由设计 Token 驱动。主题栏固定在左下角。右键文字编辑、右键图片替换。翻页用键盘或顶栏。</li>
              <li>这是分屏模板。流式是另一套：templates/editorial-flow/。两套不能互切，也不要加「流式阅读」按钮。</li>
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
