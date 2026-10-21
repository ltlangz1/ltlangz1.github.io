(() => {
  "use strict";
  const root = document.documentElement;
  const profile = window.ACADEMIC_PROFILE || {};
  const demo = new URLSearchParams(location.search).has("demo");
  const english = Object.fromEntries([...document.querySelectorAll("[data-i18n]")].map(el => [el.dataset.i18n, el.innerHTML]));
  const chinese = {
    skip: "跳至正文", navAbout: "关于", navResearch: "研究", navPerspective: "理念", navPublications: "论文", navNews: "动态", navContact: "联系",
    heroEyebrow: "世界模型 · 具身智能",
    taglineA: "让智能体在行动之前，先", taglineB: "世界。",
    heroLede: "我研究智能体如何为不断变化的世界建立连贯的内部模型，推断看不见的部分，并借助对未来的想象决定下一步行动。",
    ctaResearch: "了解研究", hudLive: "实时", hudPlanner: "规划器", hudCost: "代价",
    hudCaption: "移动光标设定目标。淡色细线是想象中的未来，琥珀色是智能体最终执行的规划。",
    aboutTitle: "关于",
    aboutLead: "我的研究兴趣位于<strong>世界模型</strong>与<strong>具身智能</strong>的交叉处。",
    aboutBody: "我关注智能体如何在变化的环境中保持连贯的世界认知，推断未被观测到的状态，并利用对未来的预测指导行动；尤其关注多视角场景动态、部分可观测条件下的决策，以及兼顾新环境适应与已有知识保持的学习方法。",
    chip1: "世界模型", chip2: "基于模型的强化学习", chip3: "多视角生成", chip4: "信念空间规划", chip5: "持续适应", chip6: "具身智能",
    researchTitle: "研究", researchDeck: "围绕物理世界建模，探索三个相互关联的问题。",
    r1Label: "表征与动态建模", r1Title: "跨视角、跨时间的连贯世界",
    r1Body: "不同视角的观测，如何指向同一个持续演化的场景？我关注持久场景表征、对象身份，以及多视角未来预测的一致性。",
    questionLabel: "我关心的问题", r1Question: "当对象被遮挡或观察视角改变时，模型应该记住什么？哪些新观测应当促使模型修正已有记忆？",
    r2Label: "不确定性与决策", r2Title: "面向不可见状态的推理与规划",
    r2Body: "没有被观测到的对象，仍可能存在。我关注如何维护对隐藏状态与多种未来的信念，并将其用于自动驾驶与具身规划中的决策。",
    r2Question: "哪些不确定性真正影响行动选择？什么时候，补充一次观测比立即采取行动更有价值？",
    r3Label: "持续学习与泛化", r3Title: "学会适应变化，保留有用知识",
    r3Body: "环境发生变化时，智能体既需要适应新条件，也需要保留已有知识。我关注如何辨识变化、决定何时学习，以及将知识迁移至未见条件。",
    r3Question: "在提交长期模型更新之前，需要获取什么交互证据？如何同时评估新环境适应与旧知识保持？",
    figureNote: "图示为研究问题的实时概念演示，不代表实验结果。",
    perspectiveTitle: "研究理念",
    perspectiveQuote: "评价世界模型，不仅要看它预测了怎样的未来，更要看它帮助智能体做出了怎样的决策。",
    perspectiveBody: "这意味着需要将表征、不确定性与控制联系起来：模型记住什么，决定了它如何预测；尚未消除的不确定性，影响智能体应当如何行动；而交互又为下一次学习提供新的证据。",
    perspectiveMethods: "在这些问题上，我重视清晰的假设、条件匹配的实验对照，以及连接模型行为与下游决策的评价方式。",
    loop1: "表征", loop1s: "记住什么", loop2: "预测", loop2s: "可能发生什么", loop3: "决策", loop3s: "该做什么", loop4: "交互", loop4s: "接下来学什么",
    loopCenter: "世界", loopCenterSub: "模型", loopCaption: "我关心的闭环：表征、预测、决策、交互。",
    publicationsTitle: "论文", demoBanner: "预览模式：以下为展示版式的示例条目，并非真实论文。",
    newsTitle: "动态", contactTitle: "联系",
    contactBig: "一起聊聊<br><em>世界模型</em>与具身智能。",
    contactBody: "欢迎交流研究问题、想法与合作可能。",
    updated: "最近更新", source: "网站源码 ↗", colophonLabel: "设计说明",
    colophonBody: "本网站为原创设计，借鉴（而非复制）了以下学术主页与可交互讲解的思路：",
    colophonBarron: "（悬停即播放的论文预览图）", colophonHafner: "（克制的排版）", and: "与",
    colophonLive: "（可观看、可交互的图示）",
    colophonEnd: "参考不代表合作、隶属或背书关系。纯 HTML、CSS 与 JavaScript 实现；无统计追踪，无外部字体或框架。标题字体：Instrument Serif（SIL OFL）。"
  };
  const words = { en: ["imagine", "predict", "plan", "reason"], zh: ["想象", "预测", "推演", "理解"] };
  const ui = {
    en: { title: "World Models & Embodied AI", affiliation: "Affiliation", focus: "Focus", focusValue: "World models · Embodied AI", role: "Position", copy: "Copy BibTeX", copied: "Copied ✓", paper: "Paper", code: "Code", project: "Project", menu: "Menu", toLight: "Switch to light theme", toDark: "Switch to dark theme", lang: "切换为中文", nav: "Main navigation", interests: "Research interests", email: "Email", description: "World models and embodied intelligence: coherent scene representations, planning under partial observability, and continual adaptation." },
    zh: { title: "世界模型与具身智能", affiliation: "单位", focus: "方向", focusValue: "世界模型 · 具身智能", role: "身份", copy: "复制 BibTeX", copied: "已复制 ✓", paper: "论文", code: "代码", project: "项目", menu: "菜单", toLight: "切换为浅色主题", toDark: "切换为深色主题", lang: "Switch to English", nav: "主导航", interests: "研究兴趣", email: "邮箱", description: "世界模型与具身智能研究：跨视角连贯的场景表征、部分可观测条件下的规划、持续学习与泛化。" }
  };
  let language = "en";

  /* ——— helpers ——— */
  const $ = id => document.getElementById(id);
  const pick = value => (value && typeof value === "object") ? (value[language] || value.en || "") : (value || "");
  function safeURL(value, allowMail = false) {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value, location.href);
      if (url.protocol === "https:" || (allowMail && url.protocol === "mailto:")) return url.href;
      if (value.startsWith("./") && url.origin === location.origin) return url.href;
    } catch (_) { /* An invalid link is not rendered. */ }
    return "";
  }
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "className") node.className = value; else node.setAttribute(key, value);
    }
    for (const child of children) if (child !== null && child !== undefined) node.append(child);
    return node;
  }
  // Instrument Serif's "1" looks like "l": digits in serif display text get the sans face.
  function withDigits(text) {
    const frag = document.createDocumentFragment();
    for (const part of String(text).split(/(\d+)/)) if (part) frag.append(/^\d+$/.test(part) ? el("span", { className: "num" }, part) : part);
    return frag;
  }
  const external = url => /^https:/.test(url) && !url.startsWith(location.origin) ? { target: "_blank", rel: "noopener" } : {};

  function links() {
    const out = [];
    const github = safeURL(profile.github);
    if (github) out.push({ key: "GitHub", label: "GitHub", value: github.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, ""), url: github, rel: "me" });
    if (profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) out.push({ key: "Email", label: ui[language].email, value: profile.email, url: "mailto:" + profile.email });
    if (safeURL(profile.scholar)) out.push({ key: "Scholar", label: "Scholar", value: "Google Scholar", url: safeURL(profile.scholar), rel: "me" });
    if (safeURL(profile.orcid)) out.push({ key: "ORCID", label: "ORCID", value: profile.orcid.replace(/^https:\/\/orcid\.org\//, ""), url: safeURL(profile.orcid), rel: "me" });
    if (safeURL(profile.x)) out.push({ key: "X", label: "X", value: "@" + safeURL(profile.x).split("/").filter(Boolean).pop(), url: safeURL(profile.x), rel: "me" });
    if (safeURL(profile.cv)) out.push({ key: "CV", label: "CV", value: "Curriculum Vitae (PDF)", url: safeURL(profile.cv) });
    return out;
  }

  /* ——— identity ——— */
  function renderIdentity() {
    const name = pick(profile.name) || "ltlangz1";
    document.querySelectorAll('[data-person="name"]').forEach(node => { node.textContent = name; });
    $("hero-name").replaceChildren(withDigits(name));
    document.title = `${name} — ${ui[language].title}`;
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[name="description"]').content = ui[language].description;

    const meta = [pick(profile.role), pick(profile.department), pick(profile.affiliation)].filter(Boolean);
    const heroMeta = $("hero-meta");
    heroMeta.replaceChildren();
    meta.forEach((part, i) => { if (i) heroMeta.append(el("span", { className: "sep", "aria-hidden": "true" }, "/")); heroMeta.append(part); });
    heroMeta.hidden = meta.length === 0;
    $("portrait-affiliation").textContent = pick(profile.affiliation);

    const facts = $("facts");
    facts.replaceChildren();
    const rows = [];
    if (pick(profile.role)) rows.push([ui[language].role, pick(profile.role)]);
    const affiliation = [pick(profile.department), pick(profile.affiliation)].filter(Boolean).join(language === "zh" ? "，" : ", ");
    if (affiliation) rows.push([ui[language].affiliation, affiliation]);
    rows.push([ui[language].focus, ui[language].focusValue]);
    for (const [k, v] of rows) facts.append(el("dt", {}, k), el("dd", {}, v));

    const heroLinks = $("hero-links");
    const contact = $("contact-links");
    heroLinks.replaceChildren(); contact.replaceChildren();
    for (const link of links()) {
      heroLinks.append(el("a", { href: link.url, rel: link.rel, ...external(link.url) }, link.label + " ↗"));
      contact.append(el("li", {}, el("a", { href: link.url, rel: link.rel, ...external(link.url) },
        el("span", { className: "k" }, link.label), el("span", { className: "v" }, withDigits(link.value)), el("span", { className: "arrow", "aria-hidden": "true" }, "↗"))));
    }
    $("interest-chips").setAttribute("aria-label", ui[language].interests);

    const portrait = safeURL(profile.portrait);
    const frame = document.querySelector(".portrait-frame");
    if (portrait && !frame) {
      const img = el("img", { className: "portrait-frame", src: portrait, alt: name, loading: "lazy", width: "480", height: "600" });
      $("portrait-mark").replaceWith(img);
    } else if (frame) frame.alt = name;

    const updated = $("updated");
    updated.textContent = profile.updated || "";
    updated.dateTime = profile.updated || "";
    updated.parentElement.hidden = !profile.updated;
  }

  function structuredData() {
    const sameAs = [profile.github, profile.scholar, profile.orcid, profile.x].map(u => safeURL(u)).filter(Boolean);
    const data = {
      "@context": "https://schema.org", "@type": "Person",
      name: profile.name?.en || "ltlangz1", url: "https://ltlangz1.github.io/", sameAs,
      knowsAbout: ["World models", "Embodied AI", "Model-based reinforcement learning", "Planning under uncertainty", "Continual learning"]
    };
    if (profile.affiliation?.en) data.affiliation = { "@type": "CollegeOrUniversity", name: profile.affiliation.en };
    if (profile.name?.zh && profile.name.zh !== data.name) data.alternateName = profile.name.zh;
    document.head.append(el("script", { type: "application/ld+json" }, JSON.stringify(data)));
  }

  /* ——— publications & news ——— */
  const sample = [
    { title: "Example Title: Imagined Rollouts for Long-Horizon Embodied Planning", authors: ["Your Name", "Collaborator A", "Advisor B"], venue: "Venue", year: 2027, paper: "https://arxiv.org/", code: "https://github.com/", project: "https://ltlangz1.github.io/", note: { en: "Example", zh: "示例" }, highlight: true, bibtex: "@inproceedings{example2027,\n  title = {Example Title},\n  author = {Your Name and Collaborator A and Advisor B},\n  booktitle = {Venue},\n  year = {2027}\n}", verified: true },
    { title: "Another Example: Belief-Space World Models under Occlusion", authors: ["Collaborator C", "Your Name"], venue: "Workshop", year: 2026, paper: "https://arxiv.org/", verified: true }
  ];
  const sampleNews = [
    { date: "2026.10", en: "Example news item — e.g. a paper accepted, a talk, or a new position.", zh: "示例动态，例如论文接收、学术报告或新的职位。" }
  ];

  function authorLine(authors) {
    const p = el("p", { className: "pub-authors" });
    const self = new Set((profile.selfNames || []).concat(demo ? ["Your Name"] : []).map(s => s.toLowerCase()));
    const list = Array.isArray(authors) ? authors : String(authors).split(/,\s*/);
    list.forEach((author, i) => {
      if (i) p.append(", ");
      const clean = author.replace(/[*†]/g, "").trim();
      p.append(self.has(clean.toLowerCase()) ? el("b", {}, author) : author);
    });
    return p;
  }

  function renderPublications() {
    const real = (Array.isArray(profile.publications) ? profile.publications : []).filter(p => p.verified === true && p.title && p.authors && p.venue && Number.isInteger(p.year) && safeURL(p.paper));
    const entries = real.length ? real : (demo ? sample : []);
    $("demo-banner").hidden = !(demo && !real.length);
    const section = $("publications");
    section.hidden = entries.length === 0;
    const list = $("publication-list");
    list.replaceChildren();
    for (const p of entries) {
      const url = safeURL(p.paper);
      const thumb = el("a", { className: "pub-thumb", href: url, tabindex: "-1", "aria-hidden": "true", ...external(url) });
      if (safeURL(p.image)) thumb.append(el("img", { src: safeURL(p.image), alt: "", loading: "lazy" }));
      else thumb.append(el("span", { className: "placeholder" }, String(p.venue).slice(0, 1) + "·" + String(p.year).slice(-2)));
      if (safeURL(p.video)) thumb.append(el("video", { muted: "", loop: "", playsinline: "", preload: "none", "data-src": safeURL(p.video) }));

      const venue = el("div", { className: "pub-venue" }, `${p.venue} ${p.year}`);
      if (pick(p.note)) venue.append(el("span", { className: "note" }, pick(p.note)));
      const linkRow = el("div", { className: "pub-links" });
      for (const key of ["paper", "code", "project"]) {
        const href = safeURL(p[key]);
        if (href) linkRow.append(el("a", { href, ...external(href) }, ui[language][key]));
      }
      if (p.bibtex) {
        const button = el("button", { type: "button" }, ui[language].copy);
        button.addEventListener("click", () => {
          const done = () => { button.textContent = ui[language].copied; setTimeout(() => { button.textContent = ui[language].copy; }, 1600); };
          if (navigator.clipboard) navigator.clipboard.writeText(p.bibtex).then(done, () => {}); else done();
        });
        linkRow.append(button);
      }
      const body = el("div", {}, venue, el("h3", { className: "pub-title" }, el("a", { href: url, ...external(url) }, p.title)), authorLine(p.authors), linkRow);
      const article = el("article", { className: "publication" + (p.highlight ? " highlight" : "") }, thumb, body);
      const video = thumb.querySelector("video");
      if (video) {
        const play = () => {
          video.muted = true;
          if (!video.src) { video.src = video.dataset.src; video.addEventListener("canplay", () => video.classList.add("ready"), { once: true }); }
          video.play().catch(() => {});
        };
        const stop = () => { video.pause(); };
        if (matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
          // Touch screens cannot hover: play the teaser while it is on screen instead.
          new IntersectionObserver(([entry]) => { if (entry.isIntersecting) play(); else stop(); }, { threshold: 0.5 }).observe(thumb);
        }
        article.addEventListener("pointerenter", play);
        article.addEventListener("pointerleave", stop);
        article.addEventListener("focusin", play);
        article.addEventListener("focusout", stop);
      }
      list.append(article);
    }
  }

  function renderNews() {
    const real = (Array.isArray(profile.news) ? profile.news : []).filter(n => n.date && (n.en || n.zh));
    const items = real.length ? real : (demo ? sampleNews : []);
    $("news").hidden = items.length === 0;
    const list = $("news-list");
    list.replaceChildren();
    for (const n of items) list.append(el("li", {}, el("time", {}, n.date), el("span", {}, n[language] || n.en || n.zh)));
  }

  function renumber() {
    let i = 0;
    document.querySelectorAll("main > section").forEach(section => {
      const index = section.querySelector(".section-index");
      if (!section.hidden && index) index.textContent = String(++i).padStart(2, "0");
      const nav = document.querySelector(`[data-nav-for="${section.id}"]`);
      if (nav) nav.hidden = section.hidden;
    });
  }

  /* ——— language ——— */
  function setLanguage(value) {
    language = value === "zh" ? "zh" : "en";
    root.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach(node => {
      // Only the hard-coded, trusted translations above are inserted as HTML.
      node.innerHTML = language === "zh" ? (chinese[node.dataset.i18n] ?? english[node.dataset.i18n]) : english[node.dataset.i18n];
    });
    const button = $("language-switch");
    button.textContent = language === "zh" ? "EN" : "中文";
    button.setAttribute("aria-label", ui[language].lang);
    $("site-nav").setAttribute("aria-label", ui[language].nav);
    $("menu-toggle").setAttribute("aria-label", ui[language].menu);
    updateThemeLabel();
    renderIdentity(); renderPublications(); renderNews(); renumber();
    rotor.reset();
    try { localStorage.setItem("site-language", language); } catch (_) { /* Storage may be disabled. */ }
    document.dispatchEvent(new CustomEvent("languagechange", { detail: language }));
  }

  /* ——— theme ——— */
  function updateThemeLabel() {
    const dark = root.dataset.theme !== "light";
    $("theme-switch").setAttribute("aria-label", dark ? ui[language].toLight : ui[language].toDark);
    document.querySelector('meta[name="theme-color"]').content = dark ? "#07090d" : "#f6f5f0";
  }
  $("theme-switch").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("site-theme", root.dataset.theme); } catch (_) {}
    updateThemeLabel();
    document.dispatchEvent(new CustomEvent("themechange"));
  });

  /* ——— rotating word in the tagline ——— */
  const rotor = (() => {
    const node = $("rotor-word");
    const box = node.parentElement;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let i = 0, timer = 0;
    const fit = () => { box.style.width = Math.ceil(node.getBoundingClientRect().width + 2) + "px"; };
    function next() {
      node.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words[language].length;
        node.textContent = words[language][i];
        fit();
        node.classList.remove("out"); node.classList.add("pre");
        void node.offsetWidth;
        node.classList.remove("pre");
      }, 450);
    }
    if (document.fonts) document.fonts.ready.then(fit);
    addEventListener("resize", fit);
    return {
      reset() {
        clearInterval(timer); i = 0; node.textContent = words[language][0]; fit();
        if (!still.matches) timer = setInterval(() => { if (!document.hidden) next(); }, 2800);
      }
    };
  })();

  /* ——— menu ——— */
  const nav = $("site-nav"), menu = $("menu-toggle");
  const closeMenu = () => { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); };
  menu.addEventListener("click", event => {
    event.stopPropagation();
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open); menu.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("click", event => { if (!nav.contains(event.target)) closeMenu(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

  /* ——— boot ——— */
  let initial = new URLSearchParams(location.search).get("lang") || "en";
  try { if (!new URLSearchParams(location.search).get("lang")) initial = localStorage.getItem("site-language") || "en"; } catch (_) {}
  structuredData();
  setLanguage(initial);
  $("language-switch").addEventListener("click", () => setLanguage(language === "en" ? "zh" : "en"));
  $("copyright-year").textContent = String(new Date().getFullYear());

  /* ——— scroll: progress bar, masthead, active section ——— */
  const masthead = document.querySelector(".masthead");
  const progress = document.querySelector(".scroll-progress");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--progress", max > 0 ? (scrollY / max).toFixed(4) : "0");
    masthead.classList.toggle("scrolled", scrollY > 24);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    const navLinks = [...document.querySelectorAll('.navigation a[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => { if (a.hash === "#" + entry.target.id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-35% 0px -60% 0px", threshold: 0 });
    document.querySelectorAll("main > section").forEach(section => sectionObserver.observe(section));

    root.classList.add("reveal-on");
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(node => {
      const siblings = [...node.parentElement.children].filter(c => c.classList.contains("reveal"));
      node.style.setProperty("--delay", (Math.min(siblings.indexOf(node), 4) * 0.08) + "s");
      revealObserver.observe(node);
    });
  }

  /* ——— cursor spotlight on figures ——— */
  document.querySelectorAll(".spotlight").forEach(node => {
    node.addEventListener("pointermove", event => {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", (event.clientX - r.left) + "px");
      node.style.setProperty("--my", (event.clientY - r.top) + "px");
    });
  });
})();
