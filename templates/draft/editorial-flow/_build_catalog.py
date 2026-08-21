#!/usr/bin/env python3
"""Generate editorial-flow/index.html from Figma Flow Content 父组件.

组合变体是文档里上下叠模块，不要做成圆角卡片壳。
分屏是另一套 templates/editorial-page/。
"""
from pathlib import Path

OUT = Path(__file__).with_name("index.html")
CABIN = "../states-demo/assets/cabin-01.jpg"


def lab(name, html, el_id=None):
    attr = f' id="{el_id}"' if el_id else ""
    return f'<div class="flow-lab" data-lab="{name}"{attr}>{html}</div>'


def h1(no, title):
    return f'<header class="flow-h1"><span class="flow-h1__no">{no}</span><h2 class="flow-h1__title">{title}</h2></header>'


def h2(title):
    return f'<h3 class="flow-h2">{title}</h3>'


def sub(label, note):
    return f'<p class="flow-sub"><strong>{label}</strong><span>{note}</span></p>'


def text(body, lead=False):
    cls = "flow-text is-lead" if lead else "flow-text"
    return f'<p class="{cls}">{body}</p>'


def source(*names):
    bits = "".join(f"<span>{n}</span>" for n in names)
    return f'<p class="flow-source"><strong>来源</strong>{bits}</p>'


def rule(strong=True):
    return f'<hr class="flow-rule{"" if strong else " is-soft"}">'


def formula(items):
    bits = []
    for i, (num, unit, label, op) in enumerate(items):
        bits.append(
            f'<div class="flow-formula__item"><div class="flow-formula__value">'
            f"<b>{num}</b><span>{unit}</span></div><p>{label}</p></div>"
        )
        if op:
            bits.append(f'<span class="flow-formula__op">{op}</span>')
    return f'<div class="flow-formula">{"".join(bits)}</div>'


def stats(rows):
    arts = []
    for num, unit, title, body in rows:
        arts.append(
            f'<article><div class="flow-formula__value"><b>{num}</b><span>{unit}</span></div>'
            f"<h3>{title}</h3><p>{body}</p></article>"
        )
    return f'<div class="flow-stats">{"".join(arts)}</div>'


def block_point(kicker, title):
    return (
        f'<aside class="flow-block flow-block--point">'
        f'<span class="flow-block__kicker">{kicker}</span>'
        f'<p class="flow-block__title">{title}</p></aside>'
    )


def block_signal(no, title, body):
    return (
        f'<article class="flow-block flow-block--signal"><span class="flow-block__no">{no}</span>'
        f'<div class="flow-block__body"><h3>{title}</h3><p>{body}</p></div></article>'
    )


def block_list(no, title, lead, bullets):
    lis = "".join(f"<li>{b}</li>" for b in bullets)
    return (
        f'<article class="flow-block flow-block--list">'
        f'<div class="flow-block__head"><span class="flow-block__no">{no}</span><h3>{title}</h3></div>'
        f'<p class="flow-block__lead">{lead}</p><ul>{lis}</ul></article>'
    )


def block_plain(title, body):
    return (
        f'<article class="flow-block flow-block--plain">'
        f'<div class="flow-block__body"><h3>{title}</h3><p>{body}</p></div></article>'
    )


def block_note(kicker, title, body):
    return (
        f'<article class="flow-block flow-block--note">'
        f'<span class="flow-block__kicker">{kicker}</span><h3>{title}</h3><p>{body}</p></article>'
    )


def block_pair(title, left, right):
    def mini(label, approx, num, unit):
        return (
            f'<div class="flow-mini"><span class="flow-mini__label">{label}</span>'
            f'<div class="flow-mini__value"><span>{approx}</span><b>{num}</b><span>{unit}</span></div></div>'
        )
    return (
        f'<aside class="flow-block flow-block--pair"><span class="flow-block__title">{title}</span>'
        f"{mini(*left)}{mini(*right)}</aside>"
    )


def grid(cols, *cards):
    return f'<div class="flow-grid" data-cols="{cols}">{"".join(cards)}</div>'


def media(n=4):
    figs = []
    for _ in range(n):
        figs.append(
            f'<figure class="flow-media"><div class="flow-media__frame">'
            f'<img src="{CABIN}" alt="〔图〕"></div>'
            f"<figcaption><b>图片标注</b><span>详细描述，最多2行。</span></figcaption></figure>"
        )
    return f'<div class="flow-grid" data-cols="{n}">{"".join(figs)}</div>'


def table():
    rows = "".join(
        "<tr><th>行标题</th><td>列内容</td><td>列内容</td><td>列内容</td>"
        "<td>列内容</td><td>列内容</td><td>约 57%</td></tr>"
        for _ in range(6)
    )
    return (
        "<table class=\"flow-table\"><thead><tr>"
        + "".join("<th>列标题</th>" for _ in range(7))
        + f"</tr></thead><tbody>{rows}</tbody></table>"
    )


def bar_h():
    items = []
    for _ in range(4):
        items.append(
            '<div class="bar-compare__item"><div class="bar-compare__row">'
            '<span class="bar-compare__label">Bar标题</span>'
            '<div class="bar-compare__track"><div class="bar-compare__fill" style="width:80%"></div></div>'
            '<strong class="bar-compare__value">80</strong></div>'
            '<p class="bar-compare__note">Bar描述</p></div>'
        )
    return f'<div class="bar-compare" data-item-count="4"><p class="bar-compare__title">组标题</p>{"".join(items)}</div>'


def bar_v():
    items = []
    for _ in range(4):
        items.append(
            '<div class="bar-compare__item"><div class="bar-compare__row">'
            '<strong class="bar-compare__value">80</strong>'
            '<div class="bar-compare__track"><div class="bar-compare__fill" style="height:80%;width:100%"></div></div>'
            '<span class="bar-compare__label">Bar标题</span></div>'
            '<p class="bar-compare__note">Bar描述</p></div>'
        )
    return f'<div class="bar-compare is-vertical" data-item-count="4"><p class="bar-compare__title">组标题</p>{"".join(items)}</div>'


def matrix():
    return (
        '<div class="matrix" data-item-count="4">'
        '<span class="matrix__axis" data-edge="left">难做</span>'
        '<div class="matrix__plot">'
        '<span class="matrix__axis" data-edge="top">收益高</span>'
        '<div class="matrix__quads">'
        '<article class="matrix__cell"><strong>内容</strong><p>副标题</p></article>'
        '<article class="matrix__cell"><strong>内容</strong><p>副标题</p></article>'
        '<article class="matrix__cell"><strong>内容</strong><p>副标题</p></article>'
        '<article class="matrix__cell"><strong>内容</strong><p>副标题</p></article>'
        "</div>"
        '<span class="matrix__axis" data-edge="bottom">收益低</span>'
        "</div>"
        '<span class="matrix__axis" data-edge="right">好做</span>'
        "</div>"
    )


def stack(*bits, chapter, no, sid):
    inner = "".join(bits)
    return f"""        <section class="report-section report-slide" data-chapter="{chapter}" data-slide="{no}" id="{sid}">
          <div class="flow-stack">{inner}</div>
        </section>
"""


FORMULA = formula([
    ("7,800", "万人", "潜在旅行人次", "×"),
    ("71", "%", "有携宠出行意愿 / 需求", "×"),
    ("50", "%", "有意愿人群选择出行", "×"),
    ("2", "次 / 年", "年均携宠出行频次", "="),
    ("5,538", "万次 / 年", "年度潜在携宠旅行次数", None),
])
STATS = stats([
    ("49.9", "%", "大盘 88VIP 占比", "约 65% 国内常态化客运航司具备政策基础；是否能运仍取决于具体机型、温度与当班装载条件。"),
    ("49.9", "%", "大盘 88VIP 占比", "多行说明文案。多行说明文案。多行说明文案。"),
    ("49.9", "%", "大盘 88VIP 占比", "一行说明文案"),
    ("49.9", "%", "大盘 88VIP 占比", " "),
])
PAIN = [
    ("01", "手续麻烦", "证件流程复杂、有效期长短不一、出入境要求不一致。", [
        "高铁用户中，38.1% 认为办理《动物检疫合格证明》手续麻烦。",
        "飞机用户中，54.6% 被检疫证明、航空箱和提前申请等复杂手续困扰。",
        "开放题中，“手续简化 / 代办”被提及约 40 次，是频次最高的主题。",
        "不同地区、交通方式和往返程要求不一致，用户必须重新核对材料与有效期。",
    ]),
    ("02", "政策复杂", "用户必须逐一确认自己的宠物是否匹配航司要求与酒店政策。", [
        "重量：不设固定 kg、能放进箱即可（南航）；含箱 ≤ 7kg（海航）；不占座 ≤ 10kg、占座 ≤ 18kg（东航）。",
        "尺寸：不占座箱包 40 × 38 × 25cm；占座箱包 60 × 40 × 35cm。",
        "年龄：满 8 周（南航）；满 2 个月（东航）。",
        "数量：最多 1 只（南航、东航）；最多 2 只、1 只占座加 1 只不占座（海航）。",
    ]),
    ("03", "价格模糊", "无法判断应该选择哪种运输和住宿方式，价格不可比导致选择困难。", [
        "航空：每家航司的进客舱、同机托运价格不同，还要叠加箱包、保障费和保险。",
        "酒店：29.5% 认为清洁费、押金不透明，每家酒店的收费标准不同。",
        "清洁费：可能按每只每晚、每间每晚、每只每间、一次性或免费计收。",
    ]),
    ("04", "不确定性", "既担心运输途中宠物出事，也担心抵达酒店后被拒。", [
        "高铁：61.6% 担心全程看不到；60.1% 担心独自关箱数小时。",
        "飞机：69.7% 担心货舱温度、加压和意外；50.3% 只接受进客舱。",
        "36.0% 担心到店被拒；30.7% 担心卫生或其他住客介意。",
    ]),
]
SRC = source("《2026年中国宠物行业白皮书》", "《携宠出行意愿调研报告》", "《携程酒店数据》")

NAV = [
    ("#cover", "封面"),
    ("#lib", "组件"),
    ("#combo-text", "组合"),
    ("#notes", "口径"),
]
nav_bits = []
for i, (href, label) in enumerate(NAV):
    cls = ' class="is-active"' if i == 0 else ""
    nav_bits.append(f"<a href=\"{href}\"{cls}>{label}</a>")
nav = "\n        ".join(nav_bits)

parts = [f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>知识汇报模板 · 流式</title>
  <link rel="stylesheet" href="../shared/components.css">
  <link rel="stylesheet" href="assets/template.css">
  <link rel="stylesheet" href="assets/flow.css">
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
      <div class="document-nav__links">{nav}
      </div>
    </nav>

    <div class="report-stage" data-report-stage>
      <div class="report-slides" data-report-slides>
"""]

parts.append("""        <section class="report-slide is-chapter-cover is-active" data-chapter="cover" data-slide="00" id="cover">
          <header class="chapter-cover">
            <span class="chapter-cover__kicker">流式</span>
            <h2 class="chapter-cover__title">文档栏组件库</h2>
            <p class="chapter-cover__lead">父组件按 Figma Flow Content 收敛。组合变体是同一栏里上下叠，不要做成圆角卡片壳。</p>
            <p class="chapter-cover__byline"><span class="chapter-cover__scope">组件 + 组合</span><span class="chapter-cover__kind">editorial-flow</span></p>
            <div class="chapter-cover__actions"><a class="button primary" href="#lib">开始阅读</a></div>
          </header>
        </section>
""")

# 父组件
lib_bits = [
    lab("一级标题", h1("01 · 市场", "携宠旅行是一个每年超5000万次的潜在旅行市场。")),
    lab("分割线强", rule(True)),
    lab("二级标题", h2("公开过航线数量的代表航司")),
    lab("副标题", sub("潜在旅行人次", "按有意愿人群中 50% 实际出行、每年出行 2 次的情景估算")),
    lab("文本", text("花间堂订单占比 95% 是带狗入住用户，所以用狗的概念为核心延展出品牌设计。以一句朗朗上口的「狗狗GO！」为记忆锚点，与轻快活泼的视觉语言相互咬合，把携宠出行从一件琐事转译成一种雀跃的生活仪式。"), "g1-copy"),
    lab("带编号文本", text("读图\n上圈 · 酒店入住：额外需要养宠许可证（猫证 / 犬证）——属于长期持有型证件，办一次长期有效。\n左下圈 · 航空、高铁：额外需要动物检疫合格证明。\n右下圈 · 长途陆运：不额外要求证件。\n正中交集 · 疫苗：三类场景唯一共同依赖的项。", lead=True)),
    lab("来源", SRC),
    lab("分割线弱", rule(False)),
    lab("公式", FORMULA),
    lab("大数据", STATS),
    lab("成对数据", block_pair("标题", ("说明", "约", "49.9", "%"), ("说明", "约", "49.9", "%"))),
    lab("观点", block_point("观点判断", "供给不是问题，而是如何寻找合适的航司进行流程简化和服务能力突破")),
    lab("编号信息块 a", block_signal("01", "核心枢纽与旅游城市优先", "北京、上海、广州、深圳、杭州、成都、西安等枢纽，以及海口、三亚、丽江等旅游城市更常进入白名单。")),
    lab("编号 list", block_list(*PAIN[0])),
    lab("编号信息块 b", block_note("01", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。")),
    lab("无编号信息块", block_plain("价格通常更低", "京杭拼载询价约 ¥450–1,280，明显低于飞机进客舱；整车专送和人宠同行价格会更高。")),
    lab("注释信息块", block_note("CAT", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。")),
    lab("表格", table()),
    lab("图", media(1)),
    lab("Bar", bar_h()),
    lab("Bar 纵向", bar_v()),
    lab("Matrix", matrix()),
]
parts.append(stack(*lib_bits, chapter="lib", no="01", sid="lib"))

# 组合变体
parts.append(stack(
    h1("01 · 市场", "携宠旅行是一个每年超5000万次的潜在旅行市场。"),
    rule(True),
    sub("潜在旅行人次", "按有意愿人群中 50% 实际出行、每年出行 2 次的情景估算"),
    FORMULA,
    rule(False),
    FORMULA,
    SRC,
    chapter="combo", no="02.a", sid="combo-text",
))
parts.append(stack(
    h1("02 · 痛点总结", "手续麻烦、政策复杂、价格模糊、不确定性，是阻碍用户出行的4个核心痛点。"),
    text("花间堂订单占比 95% 是带狗入住用户，所以用狗的概念为核心延展出品牌设计。以一句朗朗上口的「狗狗GO！」为记忆锚点，与轻快活泼的视觉语言相互咬合，把携宠出行从一件琐事转译成一种雀跃的生活仪式。而字母 G 则变形为猫的身影——文字中的「狗」与图形里的「猫」并肩，表达不只是狗的出行，是所有毛孩子共同的出发信号。"),
    rule(True),
    grid(2, *[block_list(*p) for p in PAIN]),
    SRC,
    chapter="combo", no="02.b", sid="combo-list",
))
parts.append(stack(
    h1("03 · 用户", "他们是高价值旅行者，需求一套一站式解决方案。"),
    rule(True),
    media(4),
    chapter="combo", no="02.c", sid="combo-media",
))
parts.append(stack(
    h1("08 · 运输", "跨城带宠，目前有四条路可走。"),
    text("飞机进客舱 / 飞机托运 / 高铁托运 / 陆运。差异集中在宠物与人的位置、价格、办理材料、交接次数和覆盖范围。"),
    rule(True),
    STATS,
    grid(2,
         block_pair("标题", ("说明", "约", "49.9", "%"), ("说明", "约", "49.9", "%")),
         block_pair("标题", ("说明", "约", "49.9", "%"), ("说明", "约", "49.9", "%"))),
    SRC,
    chapter="combo", no="02.d", sid="combo-stats",
))
parts.append(stack(
    h1("08 · 运输", "跨城带宠，目前有四条路可走。"),
    text("飞机进客舱 / 飞机托运 / 高铁托运 / 陆运。差异集中在宠物与人的位置、价格、办理材料、交接次数和覆盖范围。"),
    rule(True),
    grid(2, block_plain("价格通常更低", "京杭拼载询价约 ¥450–1,280，明显低于飞机进客舱。"),
         block_plain("手续更简单", "本次服务商样本多数不要求检疫证明。"),
         block_plain("宠物类型更广", "滴滴档案覆盖猫、狗、鸟类、鱼类和其他合规宠物。"),
         block_plain("陪伴方式可选", "可让宠物单独运输，也可选择人宠同行。")),
    SRC,
    chapter="combo", no="02.e", sid="combo-cards",
))
parts.append(stack(
    h1("08 · 运输", "跨城带宠，目前有四条路可走。"),
    text("飞机进客舱 / 飞机托运 / 高铁托运 / 陆运。差异集中在宠物与人的位置、价格、办理材料、交接次数和覆盖范围。"),
    rule(True),
    grid(3,
         block_note("01", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。"),
         block_note("01", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。"),
         block_note("01", "重点检查狂犬疫苗记录", "确认接种已满 21 天且仍在有效期内；部分航司还会核验小动物疫苗注射证明。短鼻犬、烈性犬等品种限制需要在订票前先排除。")),
    SRC,
    media(1),
    chapter="combo", no="02.f", sid="combo-mix",
))

parts.append("""        <section class="report-slide" data-chapter="notes" data-slide="03" id="notes">
          <footer class="report-notes">
            <h2>怎么用</h2>
            <ol>
              <li>只使用「组件」里的父组件。之后出现同类块，按对应组件的样式实现，不要另起皮肤。</li>
              <li>组合变体是文档栏里上下叠，间距 30。不要把组合做成圆角卡片壳。</li>
              <li>一节里可以任意叠：一级标题、分割线、副标题、公式、大数据、信息块、图、表、来源。</li>
              <li>格内条目留在该信息块里，不要抬成新的一排模块。</li>
              <li>来源写一次。源格没有口径句，就不要补。</li>
              <li>这是流式模板。分屏是另一套：templates/editorial-page/。两套不能互切。报告不要抄 data-catalog。</li>
            </ol>
          </footer>
        </section>
        <footer class="flow-foot">
          <div>
            <h2>标题</h2>
            <p>副标题</p>
          </div>
          <p>简介 · 01.01A</p>
        </footer>
      </div>
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
