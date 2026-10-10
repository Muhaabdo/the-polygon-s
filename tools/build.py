#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Builds the project landing pages (AR at the root, EN under /en/) and the thank-you pages.

    python3 tools/build.py

Content lives in tools/site_data.py; markup lives here. Output files are committed, so the
host only ever serves static HTML.
"""
import json
import os
import sys
from html import escape as esc

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from site_data import SITE, PROJECTS, T  # noqa: E402

LANGS = ("ar", "en")
ASSET_V = "20261010e"


def ic(name):
    return f'<svg class="ic" aria-hidden="true"><use href="/assets/img/icons.svg#i-{name}"></use></svg>'


def money(n):
    return f"{n:,}"


def price_html(n, t):
    num = f'<b>{money(n)}</b>'
    return f'<span>{t["from"]}</span>{num}<span>{t["egp"]}</span>' if t["dir"] == "rtl" else f'<span>{t["from"]} {t["egp"]}</span>{num}'


def url(slug, lang, absolute=False):
    path = ("/en/" if lang == "en" else "/") + slug
    if slug == "":
        path = "/en/" if lang == "en" else "/"
    return (SITE["domain"] + path) if absolute else path


def img(project_img, name):
    return f"/assets/img/projects/{project_img}/{name}.webp"


def build_sprite():
    icons = json.load(open(os.path.join(HERE, "icons.json"), encoding="utf-8"))
    out = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">']
    for name, d in icons.items():
        paths = "".join(f'<path d="{p}"/>' for p in d["d"])
        out.append(f'<symbol id="i-{name}" viewBox="{d["vb"]}">{paths}</symbol>')
    out.append("</svg>")
    with open(os.path.join(ROOT, "assets/img/icons.svg"), "w", encoding="utf-8") as f:
        f.write("".join(out))


def gtm_head():
    return ("<!-- Google Tag Manager -->\n"
            "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n"
            "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n"
            "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n"
            "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n"
            f"}})(window,document,'script','dataLayer','{SITE['gtm']}');</script>\n"
            "<!-- End Google Tag Manager -->")


def gtm_body():
    return ("<!-- Google Tag Manager (noscript) -->\n"
            f'<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={SITE["gtm"]}"\n'
            'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n'
            "<!-- End Google Tag Manager (noscript) -->")


def lang_bar(slug, lang, t):
    cur = ' aria-current="true"'
    return f'''<div class="lang">
 <div class="wrap">
  <nav class="lang-switch" aria-label="Language">
   <a href="{url(slug, "ar")}" lang="ar" hreflang="ar"{cur if lang == "ar" else ""}>العربية</a>
   <a href="{url(slug, "en")}" lang="en" hreflang="en"{cur if lang == "en" else ""}>English</a>
  </nav>
 </div>
</div>'''


def unit_card(p, u, lang, t, title, launch=None):
    """One unit card. `launch` is the new-phase dict when the unit belongs to it."""
    value = f'{launch["name"]} - {u["name"]}' if launch else u["name"]
    imgs = "".join(f'<img src="{img(p["img"], i)}" alt="{esc(title)} — {esc(u["name"])}" loading="lazy">' for i in u.get("imgs", []))
    mini = (f'''<div class="mini">{imgs}</div>
     <button class="mini-nav prev" type="button" aria-label="prev">{ic("chev-r" if t["dir"] == "rtl" else "chev-l")}</button>
     <button class="mini-nav next" type="button" aria-label="next">{ic("chev-l" if t["dir"] == "rtl" else "chev-r")}</button>
     <div class="mini-dots"></div>''' if imgs else "")
    badges = [esc(b) for b in u.get("badges", [])]
    if u.get("finish"):
        badges.append(esc(t["fin_" + u["finish"]]))
    badges = "".join(f'<span class="badge">{b}</span>' for b in badges)
    if "land" in u:
        specs = [(t["u_bua"], u["bua"]), (t["u_land"], u["land"])]
        spec_html = "".join(f'<div class="spec"><span>{esc(k)}</span><b><span class="ltr">{esc(v)}</span> {esc(t["sqm"])}</b></div>' for k, v in specs)
    else:
        spec_html = (f'<div class="spec"><span>{esc(t["u_area"])}</span><b><span class="ltr">{esc(u["area"])}</span> {esc(t["sqm"])}</b></div>'
                     f'<div class="spec"><span>{esc(t["u_deliv"])}</span><b>{p["delivery"]}</b></div>')
    price = price_html(u["price"], t) if u["price"] else f'<b class="price-req">{esc(t["price_req"])}</b>'
    off = f'<span class="card-off">{esc(t["new_launch"])}</span>' if launch else ""
    return f'''<article class="card">
    <div class="card-media">
     {mini}
     {off}<span class="card-tag">{ic("pin")} {esc(launch["name"] if launch else p["area"][lang])}</span>
    </div>
    <div class="card-body">
     <h3 class="card-name">{esc(u["name"])}</h3>
     <div class="card-sub">{esc(u["sub"][lang])}</div>
     <div class="badges">{badges}</div>
     <div class="specs">{spec_html}</div>
     <div class="price">{price}</div>
     <button class="btn btn-dark" type="button" data-cta="{"launch_card" if launch else "unit_card"}" data-unit="{esc(value)}">{ic("whatsapp")} {esc(t["cta_card"])}</button>
    </div>
   </article>'''


def footer(lang, t):
    return f'''<footer class="ft">
 <div class="wrap">
  <div class="ft-top">
   <div>
    <div class="ft-logo">VIBE <span>Real Estate</span></div>
    <div class="ft-acr">Vision · Investment · Brokerage · Excellence</div>
    <p class="ft-tag">{esc(t["ft_tag"])}</p>
   </div>
   <div class="ft-disc">{ic("info")}<p>{t["ft_disc"]}</p></div>
  </div>
  <div class="ft-bot">
   <div>© <span id="year">2026</span> VIBE Real Estate — {esc(t["ft_rights"])}</div>
   <ul class="ft-links">
    <li><a href="/about-us">{esc(t["ft_about"])}</a></li>
    <li><a href="/privacy-policy">{esc(t["ft_priv"])}</a></li>
   </ul>
  </div>
 </div>
</footer>'''


def cookie(t):
    return f'''<div class="ck hide" id="ck" role="region" aria-label="{esc(t["ck_aria"])}">
 <button class="ck-x" type="button" data-ck-close aria-label="{esc(t["close"])}">{ic("x")}</button>
 <div class="ck-top">
  <div class="ck-ic">{ic("cookie")}</div>
  <div><div class="ck-title">{t["ck_title"]}</div><div class="ck-text"><span class="ck-long">{t["ck_text"]}</span><span class="ck-short">{t["ck_short"]}</span></div></div>
 </div>
 <button class="btn ck-ok" type="button" data-ck-close>{ic("check")} <span class="ck-long">{esc(t["ck_ok"])}</span><span class="ck-short">{esc(t["ck_ok_short"])}</span></button>
</div>'''


def lead_form(p, t, loc, inline=False, uid="m"):
    """`p` is a project dict, or None on the home page where the select picks the project."""
    lab = {"l": t["f_unit"], "ph": t["f_unit_ph"], "err": t["f_unit_err"]}
    if p is None:
        lab = {"l": t["f_project"], "ph": t["f_project_ph"], "err": t["f_project_err"]}
        opts = "".join(f'<option value="{esc(o["name"])}">{esc(o["title"])}</option>' for o in PROJECTS.values() if o.get("ready"))
    else:
        opts = "".join(f'<option value="{esc(u["name"])}">{esc(u["name"])}</option>' for u in p["units"])
        if p.get("launch"):
            L = p["launch"]
            opts += f'<optgroup label="{esc(L["name"])}">' + "".join(
                f'<option value="{esc(L["name"])} - {esc(u["name"])}">{esc(u["name"])}</option>' for u in L["units"]) + "</optgroup>"
    return f'''<form class="lf" novalidate data-loc="{loc}"{" data-inline" if inline else ""}>
 <div class="lf-f">
  <label for="{uid}-name">{esc(t["f_name"])}</label>
  <input type="text" id="{uid}-name" name="name" autocomplete="name" placeholder="{esc(t["f_name_ph"])}" maxlength="60" required>
  <div class="lf-err">{esc(t["f_name_err"])}</div>
 </div>
 <div class="lf-f">
  <label for="{uid}-phone">{esc(t["f_phone"])}</label>
  <div class="ph">
   <button type="button" class="ph-cc" aria-haspopup="listbox" aria-expanded="false" aria-label="{esc(t["f_cc"])}">
    <img src="/assets/img/flags/EG.svg" width="24" height="16" alt=""><b>+20</b>{ic("chev-d")}
   </button>
   <input type="tel" id="{uid}-phone" name="phone" inputmode="tel" autocomplete="tel-national" maxlength="20" required>
   <div class="cc-pop">
    <div class="cc-search"><input type="text" placeholder="{esc(t["f_cc_search"])}" aria-label="{esc(t["f_cc_search"])}" autocomplete="off"></div>
    <div class="cc-list" role="listbox"></div>
   </div>
  </div>
  <div class="lf-err">{esc(t["f_phone_err"])}</div>
 </div>
 <div class="lf-f">
  <label for="{uid}-unit">{esc(lab["l"])}</label>
  <select id="{uid}-unit" name="unit">
   <option value="">{esc(lab["ph"])}</option>{opts}
   <option value="Not sure">{esc(t["f_unit_any"])}</option>
  </select>
  <div class="lf-err">{esc(lab["err"])}</div>
 </div>
 <input class="lf-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
 <button class="btn lf-submit" type="submit">{ic("whatsapp")}<span>{esc(t["f_submit"])}</span></button>
 <p class="lf-priv">{t["f_priv"]}</p>
</form>'''


def other_cards(slug, lang, t):
    out = []
    for s, o in PROJECTS.items():
        if s == slug:
            continue
        media = (f'<img src="{img(o["img"], o["card"])}" alt="{esc(o["title"])}" loading="lazy" '
                 f'style="width:100%;height:100%;object-fit:cover">') if o.get("card") else ""
        off = f'<span class="card-off">{esc(t["more_off"].format(p=o["discount"]["pct"]))}</span>' if o["discount"] else ""
        badges = "".join(f'<span class="badge">{esc(b)}</span>' for b in o["types"][lang])
        out.append(f'''<a class="card" href="{url(s, lang)}" data-track="project_switch" data-loc="other_projects" data-target="{esc(o["name"])}">
    <div class="card-media">{media}{off}<span class="card-tag">{ic("pin")} {esc(o["area"][lang])}</span></div>
    <div class="card-body">
     <h3 class="card-name">{esc(o["title"])}</h3>
     <div class="badges">{badges}</div>
     <div class="specs">
      <div class="spec"><span>{esc(t["down"])}</span><b>{o["down"]}%</b></div>
      <div class="spec"><span>{esc(t["years"])}</span><b>{o["years"]}</b></div>
      <div class="spec"><span>{esc(t["u_deliv"])}</span><b>{o["delivery"]}</b></div>
     </div>
     <div class="price">{price_html(o["price_from"], t)}</div>
     <span class="card-more">{esc(t["more_link"])} {ic("arrow-l" if t["dir"] == "rtl" else "arrow-r")}</span>
    </div>
   </a>''')
    return "\n   ".join(out)


def jsonld(slug, p, lang, t):
    page = url(slug, lang, True)
    org = SITE["domain"] + "/#organization"
    hero = SITE["domain"] + img(p["img"], p["hero"]) if p.get("hero") else SITE["domain"] + img("px", "hero")
    graph = [
        {"@type": "RealEstateAgent", "@id": org, "name": SITE["brand"], "url": SITE["domain"] + "/",
         "telephone": SITE["tel_intl"], "image": hero,
         "address": {"@type": "PostalAddress", "addressLocality": "Cairo", "addressCountry": "EG"}},
        {"@type": "WebPage", "@id": page + "#webpage", "url": page, "name": p["seo"][lang]["title"],
         "description": p["seo"][lang]["desc"], "inLanguage": lang,
         "primaryImageOfPage": hero,
         "publisher": {"@id": org}, "breadcrumb": {"@id": page + "#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": page + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": t["crumb_home"], "item": url("", lang, True)},
            {"@type": "ListItem", "position": 2, "name": p["title"], "item": page}]},
        {"@type": "ApartmentComplex", "@id": page + "#project", "name": p["title"], "url": page,
         "description": p["about"][lang][0], "image": hero,
         "address": {"@type": "PostalAddress", "addressLocality": p["area"]["en"], "addressRegion": "Giza", "addressCountry": "EG"}},
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)


def head(title, desc, canonical, alternates, lang, t, og_img=None, robots="max-image-preview:large", preload=None, ld=None):
    alt = "".join(f'<link rel="alternate" hreflang="{h}" href="{u}">\n' for h, u in alternates)
    og = (f'<meta property="og:image" content="{og_img}">\n<meta name="twitter:card" content="summary_large_image">\n'
          f'<meta name="twitter:image" content="{og_img}">\n') if og_img else ""
    pre = f'<link rel="preload" as="image" href="{preload}" fetchpriority="high">\n' if preload else ""
    ldtag = f'<script type="application/ld+json">\n{ld}\n</script>\n' if ld else ""
    return f'''<!DOCTYPE html>
<html lang="{lang}" dir="{t["dir"]}">
<head>
{gtm_head()}
<meta charset="UTF-8">
<title>{esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#092A21">
<link rel="canonical" href="{canonical}">
{alt}<meta property="og:type" content="website">
<meta property="og:site_name" content="{SITE["brand"]}">
<meta property="og:locale" content="{t["locale"]}">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
{og}<link rel="icon" href="/assets/img/9d3f36778e2c.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/{"38a4b645fee6" if lang == "ar" else "f347d8f3fcaf"}.woff2">
{pre}<link rel="stylesheet" href="/assets/css/project.css?v={ASSET_V}">
{ldtag}</head>
<body>
{gtm_body()}
'''


def project_page(slug, lang):
    p, t = PROJECTS[slug], T[lang]
    title = p["title"]
    alternates = [("ar", url(slug, "ar", True)), ("en", url(slug, "en", True)), ("x-default", url(slug, "ar", True))]
    hero_img = img(p["img"], p["hero"]) if p.get("hero") else None
    has_gallery = len(p.get("gallery", [])) >= 2
    cfg = {
        "lang": lang, "project": p["name"], "projectName": title, "endpoint": SITE["endpoint"],
        "thankYou": url("thank-you", lang),
        "t": {"submit": t["f_submit"], "sending": t["f_sending"], "noCountry": t["no_country"], "close": t["close"]},
    }
    nav_links = "".join(f'<a href="{h}">{esc(x)}</a>' for h, x in t["nav"] if has_gallery or h != "#gallery")
    disc = p["discount"]
    offer_badge = (f'<div class="hero-offer">{ic("tag")} {esc(t["offer_badge"].format(p=disc["pct"], y=disc["years"]))}</div>' if disc else "")
    millions = f'{p["price_from"] / 1e6:.1f}'

    feats = "".join(
        f'<div class="feat"><div class="feat-ic">{ic(f["ic"])}</div><div><h3>{esc(f[lang][0])}</h3><p>{esc(f[lang][1])}</p></div></div>'
        for f in p["features"])
    facts = "".join(f'<div class="fact"><b class="num">{esc(f["v"])}</b><span>{esc(f[lang])}</span></div>' for f in p["facts"])
    about_ps = "".join(f"<p>{esc(x)}</p>" for x in p["about"][lang])

    unit_cards = [unit_card(p, u, lang, t, title) for u in p["units"]]
    launch_html = ""
    if p.get("launch"):
        L = p["launch"]
        launch_cards = "".join(unit_card(p, u, lang, t, title, launch=L) for u in L["units"])
        launch_html = f'''
  <div class="launch" id="launch">
   <div class="launch-head">
    <div class="eyebrow">{esc(t["launch_eyebrow"])}</div>
    <h3>{esc(t["launch_h"].format(n=L["name"]))}</h3>
    <p>{esc(L["intro"][lang])}</p>
    <span class="launch-pay">{ic("tag")} {esc(t["launch_pay"].format(d=L["down"], y=L["years"]))}</span>
   </div>
   <div class="cards cards-3">{launch_cards}</div>
  </div>'''

    if disc:
        offer_h = t["offer_h"].format(p=disc["pct"], y=disc["years"])
        offer_p = t["offer_p"].format(d=p["down"], yy=p["years"])
    else:
        offer_h = t["plan_h"].format(d=p["down"], yy=p["years"])
        offer_p = t["plan_p"]

    loc = p["location"]
    loc_items = "".join(f'<div class="loc-item"><b>{esc(x["b"][lang])}</b><span>{esc(x["s"][lang])}</span></div>' for x in loc["points"])
    gallery = "".join(
        f'<figure data-lb="{img(p["img"], g["img"])}" data-lb-group="gallery" data-cap="{esc(g["cap"][lang])}">'
        f'<img src="{img(p["img"], g["img"])}" alt="{esc(g["cap"][lang])}" loading="lazy"><figcaption>{esc(g["cap"][lang])}</figcaption></figure>'
        for g in p.get("gallery", []))
    points = "".join(f"<li>{ic('check')} {esc(x)}</li>" for x in t["final_points"])
    prev_i, next_i = ("chev-r", "chev-l") if t["dir"] == "rtl" else ("chev-l", "chev-r")

    gallery_sec = f'''<section class="sec" id="gallery">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["gal_eyebrow"])}</div><h2>{esc(t["gal_h"])}</h2><p>{esc(t["gal_p"].format(t=title))}</p></div>
  <div class="car gal">
   <button class="car-btn prev" type="button" aria-label="prev">{ic(prev_i)}</button>
   <div class="car-track">{gallery}</div>
   <button class="car-btn next" type="button" aria-label="next">{ic(next_i)}</button>
   <div class="car-dots"></div>
  </div>
 </div>
</section>''' if has_gallery else ""
    loc_map = (f'''<div>
    <div class="loc-map" data-lb="{img(p["img"], loc["map"])}" data-lb-group="map" data-cap="{esc(loc["map_cap"][lang])}"><img src="{img(p["img"], loc["map"])}" alt="{esc(title)} master plan" loading="lazy"></div>
    <p class="loc-cap">{esc(loc["map_cap"][lang])}</p>
   </div>''' if loc.get("map") else "")

    html = head(p["seo"][lang]["title"], p["seo"][lang]["desc"], url(slug, lang, True), alternates, lang, t,
                og_img=(SITE["domain"] + hero_img) if hero_img else None, preload=hero_img, ld=jsonld(slug, p, lang, t))
    html += f'''{lang_bar(slug, lang, t)}
<header class="nav">
 <div class="wrap">
  <a class="logo" href="{url("", lang)}" aria-label="VIBE Real Estate"><strong>VIBE <span>Real Estate</span></strong><small>Luxury Properties</small></a>
  <nav class="nav-links" aria-label="{esc(t["menu"])}">{nav_links}</nav>
  <button class="btn btn-cta" type="button" data-cta="nav">{ic("whatsapp")} {esc(t["nav_cta"])}</button>
  <button class="nav-burger" type="button" aria-label="{esc(t["menu"])}" aria-expanded="false">{ic("bars")}</button>
 </div>
</header>

<main>
<section class="hero{"" if hero_img else " hero-plain"}">
 {f'<img class="hero-bg" src="{hero_img}" alt="{esc(title)}" fetchpriority="high">' if hero_img else ""}
 <div class="hero-in">
  <div class="eyebrow">Palm Hills Developments</div>
  <h1><span class="ltr">{esc(title)}</span></h1>
  <p class="hero-sub">{esc(p["hero_sub"][lang])}</p>
  {offer_badge}
  <div class="hero-stats">
   <div class="hero-stat"><b>{p["down"]}%</b><span>{esc(t["down"])}</span></div>
   <div class="hero-stat"><b>{p["years"]}</b><span>{esc(t["years"])}</span></div>
   <div class="hero-stat"><b>{millions}</b><span>{esc(t["from_m"])}</span></div>
  </div>
  <button class="btn btn-cta btn-lg" type="button" data-cta="hero">{ic("whatsapp")} {esc(t["cta_main"])}</button>
  <p class="hero-note">{esc(t["hero_note"])}</p>
 </div>
</section>

<section class="sec" id="units">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["units_eyebrow"])}</div><h2>{esc(t["units_h"].format(t=title))}</h2><p>{esc(t["units_p"])}</p></div>
  <div class="cards{" cards-3" if len(unit_cards) == 3 else ""}">
   {"".join(unit_cards)}
  </div>
  {launch_html}
  <div class="offer">
   <div><h3>{offer_h}</h3><p>{esc(offer_p)}</p></div>
   <div><button class="btn btn-cta btn-lg" type="button" data-cta="offer">{ic("whatsapp")} {esc(t["offer_cta"])}</button></div>
  </div>
  <p class="disclaimer">{ic("info")}<span>{esc(t["units_disc"])}</span></p>
 </div>
</section>

<section class="sec sec-white" id="about">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["about_eyebrow"])}</div><h2>{esc(t["about_h"].format(t=title))}</h2><p>{esc(t["about_p"])}</p></div>
  <div class="about{"" if p.get("about_img") else " about-solo"}">
   <div class="about-text">{about_ps}<div class="about-facts">{facts}</div></div>
   {f'<div class="about-img"><img src="{img(p["img"], p["about_img"])}" alt="{esc(title)}" loading="lazy"></div>' if p.get("about_img") else ""}
  </div>
  <div class="feats">{feats}</div>
 </div>
</section>

<section class="sec sec-dark" id="location">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["loc_eyebrow"])}</div><h2>{esc(t["loc_h"].format(t=title))}</h2><p>{esc(t["loc_p"])}</p></div>
  <div class="loc{"" if loc.get("map") else " loc-solo"}">
   <div><p class="loc-text">{esc(loc["text"][lang])}</p><div class="loc-list">{loc_items}</div></div>
   {loc_map}
  </div>
 </div>
</section>

{gallery_sec}
<section class="sec sec-white" id="more">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["more_eyebrow"])}</div><h2>{esc(t["more_h"])}</h2><p>{esc(t["more_p"].format(t=title))}</p></div>
  <div class="car others">
   <button class="car-btn prev" type="button" aria-label="prev">{ic(prev_i)}</button>
   <div class="car-track">
   {other_cards(slug, lang, t)}
   </div>
   <button class="car-btn next" type="button" aria-label="next">{ic(next_i)}</button>
   <div class="car-dots"></div>
  </div>
 </div>
</section>

<section class="sec sec-dark" id="contact">
 <div class="wrap">
  <div class="final">
   <div>
    <div class="eyebrow">Palm Hills Developments</div>
    <h2>{t["final_h"].format(t='<span class="ltr">' + esc(title) + '</span>')}</h2>
    <p class="final-lead">{esc(t["final_lead"])}</p>
    <ul class="final-points">{points}</ul>
    <a class="final-call" href="tel:{SITE["tel"]}" data-track="call_click" data-loc="final">{ic("phone")} {esc(t["final_call"])}<span class="ltr">{SITE["tel"]}</span></a>
   </div>
   <div class="final-card">
    <h3>{esc(t["final_form_h"])}</h3>
    {lead_form(p, t, "final_form", inline=True, uid="f")}
   </div>
  </div>
 </div>
</section>
</main>

{footer(lang, t)}

<div class="stick" role="region" aria-label="{esc(t["stick_cta"])}">
 <div class="stick-txt"><small>{esc(title)} — {esc(t["stick_from"])}</small><b>{money(p["price_from"])}</b> <small style="display:inline">{esc(t["egp"])}</small></div>
 <button class="btn btn-cta" type="button" data-cta="sticky_bar">{ic("whatsapp")} {esc(t["stick_cta"])}</button>
</div>

<div class="modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="leadTitle">
 <div class="modal-box">
  <button class="modal-x" type="button" data-modal-close aria-label="{esc(t["close"])}">{ic("x")}</button>
  <div class="modal-head">
   <div class="modal-wa">{ic("whatsapp")}</div>
   <h2 id="leadTitle">{esc(t["f_title"])}</h2>
   <p>{esc(t["f_sub"])}</p>
   <span class="modal-ctx"></span>
  </div>
  <div class="modal-body">{lead_form(p, t, "modal", uid="m")}</div>
 </div>
</div>

{cookie(t)}

<script>window.VIBE={json.dumps(cfg, ensure_ascii=False)};</script>
<script src="/assets/js/countries.js?v={ASSET_V}" defer></script>
<script src="/assets/js/project.js?v={ASSET_V}" defer></script>
</body>
</html>
'''
    return html


def home_page(lang):
    t = T[lang]
    alternates = [("ar", url("", "ar", True)), ("en", url("", "en", True)), ("x-default", url("", "ar", True))]
    hero_img = img("palm-parks", "hero")
    cfg = {"lang": lang, "project": "", "projectName": SITE["brand"], "pickProject": True, "backTitle": t["home_back"],
           "endpoint": SITE["endpoint"], "thankYou": url("thank-you", lang),
           "t": {"submit": t["f_submit"], "sending": t["f_sending"], "noCountry": t["no_country"], "close": t["close"]}}
    nav_links = "".join(f'<a href="{h}">{esc(x)}</a>' for h, x in t["home_nav"])
    stats = "".join(f'<div class="hero-stat"><b>{esc(v)}</b><span>{esc(k)}</span></div>' for v, k in t["home_stats"])
    arrow = ic("arrow-l" if t["dir"] == "rtl" else "arrow-r")
    more = "".join(f'''<a class="card" href="{m["href"]}" data-track="project_switch" data-loc="home_more" data-target="{esc(m["title"])}">
    <div class="card-media"><img src="{img("home", m["img"])}" alt="{esc(m["title"])}" loading="lazy" style="width:100%;height:100%;object-fit:cover"><span class="card-tag">{ic("pin")} {esc(m["tag"])}</span></div>
    <div class="card-body"><h3 class="card-name">{esc(m["title"])}</h3><p class="card-sub" style="margin:6px 0 14px">{esc(m["text"])}</p>
     <span class="card-more" style="margin-top:auto">{esc(t["home_explore"])} {arrow}</span></div>
   </a>''' for m in t["home_more"])
    vibe = "".join(f'<div class="vibe"><b>{l}</b><h3>{esc(n)}</h3><p>{esc(d)}</p></div>' for l, n, d in t["home_vibe"])
    about_ps = "".join(f"<p>{esc(x)}</p>" for x in t["home_about"])
    items = [{"@type": "ListItem", "position": i + 1, "name": o["title"], "url": url(s, lang, True)}
             for i, (s, o) in enumerate(PROJECTS.items()) if o.get("ready")]
    org = SITE["domain"] + "/#organization"
    ld = json.dumps({"@context": "https://schema.org", "@graph": [
        {"@type": "RealEstateAgent", "@id": org, "name": SITE["brand"], "url": SITE["domain"] + "/", "telephone": SITE["tel_intl"],
         "image": SITE["domain"] + hero_img, "address": {"@type": "PostalAddress", "addressLocality": "Cairo", "addressCountry": "EG"}},
        {"@type": "WebSite", "@id": SITE["domain"] + "/#website", "url": SITE["domain"] + "/", "name": SITE["brand"], "inLanguage": ["ar", "en"], "publisher": {"@id": org}},
        {"@type": "ItemList", "name": t["home_h1"], "itemListElement": items}]}, ensure_ascii=False, indent=1)
    html = head(t["home_seo_title"], t["home_seo_desc"], url("", lang, True), alternates, lang, t,
                og_img=SITE["domain"] + hero_img, preload=hero_img, ld=ld)
    html += f'''{lang_bar("", lang, t)}
<header class="nav">
 <div class="wrap">
  <a class="logo" href="{url("", lang)}" aria-label="VIBE Real Estate"><strong>VIBE <span>Real Estate</span></strong><small>Luxury Properties</small></a>
  <nav class="nav-links" aria-label="{esc(t["menu"])}">{nav_links}</nav>
  <button class="btn btn-cta" type="button" data-cta="nav">{ic("whatsapp")} {esc(t["nav_cta"])}</button>
  <button class="nav-burger" type="button" aria-label="{esc(t["menu"])}" aria-expanded="false">{ic("bars")}</button>
 </div>
</header>

<main>
<section class="hero">
 <img class="hero-bg" src="{hero_img}" alt="Palm Hills" fetchpriority="high">
 <div class="hero-in">
  <div class="eyebrow">{esc(t["home_eyebrow"])}</div>
  <h1 class="hero-h1-ar">{esc(t["home_h1"])}</h1>
  <p class="hero-sub">{esc(t["home_sub"])}</p>
  <div class="hero-stats">{stats}</div>
  <div class="hero-btns">
   <a class="btn btn-cta btn-lg" href="#projects">{esc(t["home_cta2"])}</a>
   <button class="btn btn-ghost" type="button" data-cta="hero">{ic("whatsapp")} {esc(t["cta_main"])}</button>
  </div>
 </div>
</section>

<section class="sec" id="projects">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["home_proj_eyebrow"])}</div><h2>{esc(t["home_proj_h"])}</h2><p>{esc(t["home_proj_p"])}</p></div>
  <div class="cards cards-3 others">
   {other_cards(None, lang, t)}
  </div>
  <p class="disclaimer">{ic("info")}<span>{esc(t["units_disc"])}</span></p>
 </div>
</section>

<section class="sec sec-white" id="more">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["home_more_eyebrow"])}</div><h2>{esc(t["home_more_h"])}</h2><p>{esc(t["home_more_p"])}</p></div>
  <div class="cards cards-2 others">{more}</div>
 </div>
</section>

<section class="sec sec-dark" id="about">
 <div class="wrap">
  <div class="sec-head"><div class="eyebrow">{esc(t["home_about_eyebrow"])}</div><h2>{esc(t["home_about_h"])}</h2></div>
  <div class="home-about">{about_ps}</div>
  <div class="vibes">{vibe}</div>
  <p style="text-align:center;margin-top:26px"><a class="btn btn-ghost" href="/about-us">{esc(t["home_about_link"])} {arrow}</a></p>
 </div>
</section>

<section class="sec" id="contact" style="background:linear-gradient(160deg,var(--em-deep),var(--em))">
 <div class="wrap">
  <div class="final">
   <div>
    <div class="eyebrow">VIBE Real Estate</div>
    <h2>{t["home_final_h"]}</h2>
    <p class="final-lead">{esc(t["home_final_lead"])}</p>
    <ul class="final-points">{"".join(f"<li>{ic('check')} {esc(x)}</li>" for x in t["final_points"])}</ul>
    <a class="final-call" href="tel:{SITE["tel"]}" data-track="call_click" data-loc="final">{ic("phone")} {esc(t["final_call"])}<span class="ltr">{SITE["tel"]}</span></a>
   </div>
   <div class="final-card">
    <h3>{esc(t["final_form_h"])}</h3>
    {lead_form(None, t, "final_form", inline=True, uid="f")}
   </div>
  </div>
 </div>
</section>
</main>

{footer(lang, t)}

<div class="modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="leadTitle">
 <div class="modal-box">
  <button class="modal-x" type="button" data-modal-close aria-label="{esc(t["close"])}">{ic("x")}</button>
  <div class="modal-head">
   <div class="modal-wa">{ic("whatsapp")}</div>
   <h2 id="leadTitle">{esc(t["f_title"])}</h2>
   <p>{esc(t["f_sub"])}</p>
   <span class="modal-ctx"></span>
  </div>
  <div class="modal-body">{lead_form(None, t, "modal", uid="m")}</div>
 </div>
</div>

{cookie(t)}

<script>window.VIBE={json.dumps(cfg, ensure_ascii=False)};</script>
<script src="/assets/js/countries.js?v={ASSET_V}" defer></script>
<script src="/assets/js/project.js?v={ASSET_V}" defer></script>
</body>
</html>
'''
    return html


def thank_you(lang):
    t = T[lang]
    alternates = [("ar", url("thank-you", "ar", True)), ("en", url("thank-you", "en", True))]
    cfg = {"lang": lang, "wa": SITE["wa"], "t": {
        "waMsg": t["wa_msg"], "waMsgGeneric": t["wa_msg_generic"], "backTo": t["ty_back"],
        "redirecting": t["ty_redirecting"], "notOpened": t["ty_not_opened"],
        "titleGeneric": t["ty_title_generic"], "textGeneric": t["ty_text_generic"], "titleProject": t["ty_title_p"]}}
    html = head(t["ty_seo_title"], t["ty_text_generic"], url("thank-you", lang, True), alternates, lang, t,
                robots="noindex, nofollow")
    html += f'''{lang_bar("thank-you", lang, t)}
<main class="ty">
 <div class="ty-box">
  <div class="ty-ok">{ic("check")}</div>
  <h1 id="tyTitle">{esc(t["ty_title"])}</h1>
  <p id="tyText">{esc(t["ty_text"])}</p>
  <span class="ty-ctx" id="tyCtx" hidden></span>
  <ul class="ty-points" id="tyPoints">{"".join(f"<li>{ic('check')} {esc(x)}</li>" for x in t["ty_points"])}</ul>
  <a class="btn ty-wa" id="tyWa" href="https://wa.me/{SITE["wa"]}" rel="noopener">{ic("whatsapp")} {esc(t["ty_btn"])}</a>
  <div class="ty-bar" id="tyBar"><i></i></div>
  <p class="ty-count" id="tyCount" aria-live="polite"></p>
  <a class="ty-back" id="tyBack" href="{url("", lang)}">{ic("arrow-r" if t["dir"] == "rtl" else "arrow-l")} <span id="tyBackText">{esc(t["ty_back_generic"])}</span></a>
 </div>
</main>
<script>window.VIBE={json.dumps(cfg, ensure_ascii=False)};</script>
<script src="/assets/js/thank-you.js?v={ASSET_V}" defer></script>
</body>
</html>
'''
    return html


def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("built", rel, f"({len(content.encode('utf-8')) // 1024} KB)")


def sitemap():
    import datetime
    today = datetime.date.today().isoformat()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    home_alts = "".join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{url("", l, True)}"/>' for h, l in (("ar", "ar"), ("en", "en"), ("x-default", "ar")))
    for l in LANGS:
        out.append(f"  <url><loc>{url('', l, True)}</loc><lastmod>{today}</lastmod>{home_alts}</url>")
    for path in ["/palm-hills-projects-west", "/palm-hills-projects-east", "/hacienda-ras-al-hekma", "/about-us", "/privacy-policy"]:
        out.append(f"  <url><loc>{SITE['domain']}{path}</loc></url>")
    for slug, p in PROJECTS.items():
        if not p.get("ready"):
            continue
        for lang in LANGS:
            alts = "".join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{url(slug, l, True)}"/>'
                           for h, l in (("ar", "ar"), ("en", "en"), ("x-default", "ar")))
            out.append(f"  <url><loc>{url(slug, lang, True)}</loc><lastmod>{today}</lastmod>{alts}</url>")
    out.append("</urlset>")
    write("sitemap.xml", "\n".join(out) + "\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /thank-you\nDisallow: /en/thank-you\nDisallow: /tools/\n\nSitemap: {SITE['domain']}/sitemap.xml\n")


def main():
    build_sprite()
    sitemap()
    for slug, p in PROJECTS.items():
        if not p.get("ready"):
            continue
        for lang in LANGS:
            write((f"en/{slug}.html" if lang == "en" else f"{slug}.html"), project_page(slug, lang))
    for lang in LANGS:
        write("en/thank-you.html" if lang == "en" else "thank-you.html", thank_you(lang))
        write("en/index.html" if lang == "en" else "index.html", home_page(lang))


if __name__ == "__main__":
    main()
