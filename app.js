(() => {
  "use strict";
  const profile = window.ACADEMIC_PROFILE || {};
  const english = Object.fromEntries([...document.querySelectorAll("[data-i18n]")].map(el => [el.dataset.i18n, el.innerHTML]));
  const chinese = {
    skip: "跳至正文", navResearch: "研究", navPerspective: "理念", navPublications: "论文", navContact: "联系",
    profileField: "世界模型<br>与具身智能", profileNote: "感知世界，预测变化，<br>在交互中学习行动。",
    introEyebrow: "世界模型 · 具身智能",
    introTitle: "理解世界，<br>学习如何行动。",
    introBody: "我的研究聚焦世界模型与具身智能：智能体如何在变化的环境中保持连贯的世界认知，推断未被观测到的状态，并利用对未来的预测指导行动。",
    introSecondary: "我尤其关注多视角场景动态、部分可观测条件下的决策，以及兼顾新环境适应与已有知识保持的学习方法。",
    explore: "了解我的研究方向", researchTitle: "研究方向", researchDeck: "围绕物理世界建模，探索三个相互关联的问题。",
    r1Label: "表征与动态建模", r1Title: "跨视角、跨时间的连贯世界",
    r1Body: "不同视角的观测，如何指向同一个持续演化的场景？我关注持久场景表征、对象身份，以及多视角未来预测的一致性。",
    questionLabel: "我关心的问题", r1Question: "当对象被遮挡或观察视角改变时，模型应该记住什么？哪些新观测应当促使模型修正已有记忆？",
    r2Label: "不确定性与决策", r2Title: "面向不可见状态的推理与规划",
    r2Body: "没有被观测到的对象，仍可能存在。我关注如何维护对隐藏状态与多种未来的信念，并将其用于自动驾驶与具身规划中的决策。",
    r2Question: "哪些不确定性真正影响行动选择？什么时候，补充一次观测比立即采取行动更有价值？",
    r3Label: "持续学习与泛化", r3Title: "学会适应变化，保留有用知识",
    r3Body: "环境发生变化时，智能体既需要适应新条件，也需要保留已有知识。我关注如何辨识变化、决定何时学习，以及将知识迁移至未见条件。",
    r3Question: "在提交长期模型更新之前，需要获取什么交互证据？如何同时评估新环境适应与旧知识保持？",
    figureCaption: "图示用于说明研究兴趣，不代表实验结果。", perspectiveTitle: "研究理念",
    perspectiveQuote: "评价世界模型，不仅要看它预测了怎样的未来，更要看它帮助智能体做出了怎样的决策。",
    perspectiveBody: "这意味着需要将表征、不确定性与控制联系起来：模型记住什么，决定了它如何预测；尚未消除的不确定性，影响智能体应当如何行动；而交互又为下一次学习提供新的证据。",
    perspectiveMethods: "在这些问题上，我重视清晰的假设、条件匹配的实验对照，以及连接模型行为与下游决策的评价方式。",
    interestsLabel: "研究兴趣", interests: "世界模型 · 基于模型的学习 · 多视角生成 · 信念空间规划 · 持续适应",
    publicationsTitle: "代表论文", contactTitle: "联系", contactBody: "欢迎交流世界模型、具身智能与交互学习相关的研究问题：",
    source: "网站源码 ↗", colophonLabel: "设计说明",
    colophonBody: "本网站为原创设计，借鉴学术主页以研究内容为核心的组织方式，参考包括",
    colophonEnd: "参考不代表合作、隶属或背书关系。"
  };
  let language = "en";
  function safeURL(value, allowMail = false) {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value, location.href);
      if (url.protocol === "https:" || (allowMail && url.protocol === "mailto:")) return url.href;
      if (value.startsWith("./") && url.origin === location.origin) return url.href;
    } catch (_) { /* An invalid link is not rendered. */ }
    return "";
  }
  function newLink(label, url) {
    const a = document.createElement("a");
    a.textContent = label; a.href = url;
    return a;
  }
  function renderIdentity() {
    const name = profile.name?.[language] || profile.name?.en || "ltlangz1";
    document.querySelectorAll('[data-person="name"]').forEach(el => { el.textContent = name; });
    document.title = `${name} — ${language === "zh" ? "世界模型与具身智能" : "World Models & Embodied AI"}`;
    document.querySelector('meta[property="og:title"]').content = document.title;
    const affiliation = document.getElementById("affiliation");
    affiliation.textContent = profile.affiliation?.[language] || profile.affiliation?.en || "";
    affiliation.hidden = !affiliation.textContent;
    const links = document.getElementById("profile-links");
    const contacts = document.getElementById("contact-links");
    links.replaceChildren(); contacts.replaceChildren();
    const github = safeURL(profile.github);
    if (github) {
      const link = newLink("GitHub ↗", github); link.rel = "me"; links.append(link);
      const contact = newLink("GitHub / " + new URL(github).pathname.split("/").filter(Boolean)[0] + " ↗", github);
      contact.className = "text-link"; contacts.append(contact);
    }
    if (profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      const mail = safeURL("mailto:" + profile.email, true);
      links.append(newLink(language === "zh" ? "邮箱 ↗" : "Email ↗", mail));
      const contact = newLink(profile.email + " ↗", mail); contact.className = "text-link"; contacts.append(contact);
    }
    if (safeURL(profile.scholar)) links.append(newLink("Scholar ↗", safeURL(profile.scholar)));
    if (safeURL(profile.cv)) links.append(newLink("CV ↗", safeURL(profile.cv)));
  }
  function renderPublications() {
    const entries = (Array.isArray(profile.publications) ? profile.publications : []).filter(p => p.verified === true && p.title && p.authors && p.venue && Number.isInteger(p.year) && safeURL(p.paper));
    const section = document.getElementById("publications");
    section.hidden = entries.length === 0;
    document.getElementById("publications-nav").hidden = section.hidden;
    document.getElementById("contact-number").textContent = entries.length ? "04" : "03";
    const list = document.getElementById("publications-list"); list.replaceChildren();
    for (const p of entries) {
      const article = document.createElement("article"); article.className = "publication";
      const title = document.createElement("h3"); title.append(newLink(p.title, safeURL(p.paper))); article.append(title);
      const authors = document.createElement("p"); authors.textContent = p.authors; article.append(authors);
      const venue = document.createElement("p"); venue.textContent = `${p.venue} · ${p.year}`; article.append(venue);
      const links = document.createElement("div"); links.className = "publication-links";
      for (const [key, en, zh] of [["paper", "Paper", "论文"], ["code", "Code", "代码"], ["project", "Project", "项目"]]) {
        if (safeURL(p[key])) links.append(newLink((language === "zh" ? zh : en) + " ↗", safeURL(p[key])));
      }
      article.append(links); list.append(article);
    }
  }
  function setLanguage(value) {
    language = value === "zh" ? "zh" : "en";
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      // Only the hard-coded, trusted translations above are inserted as HTML.
      el.innerHTML = language === "zh" ? (chinese[key] ?? english[key]) : english[key];
    });
    const button = document.getElementById("language-switch");
    button.textContent = language === "zh" ? "EN" : "中文";
    button.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
    document.querySelector("nav").setAttribute("aria-label", language === "zh" ? "主导航" : "Main navigation");
    document.querySelector("aside").setAttribute("aria-label", language === "zh" ? "研究者简介" : "Researcher profile");
    document.querySelector('meta[name="description"]').content = language === "zh" ? "世界模型与具身智能研究：多视角动态建模、部分可观测下的规划、持续学习与泛化。" : "Research interests in world models, embodied intelligence, uncertainty-aware planning, and continual learning.";
    renderIdentity(); renderPublications();
    try { localStorage.setItem("academic-language", language); } catch (_) { /* Storage may be disabled. */ }
  }
  let initial = "en";
  try { initial = localStorage.getItem("academic-language") || "en"; } catch (_) {}
  setLanguage(initial);
  const button = document.getElementById("language-switch"); button.hidden = false;
  button.addEventListener("click", () => setLanguage(language === "en" ? "zh" : "en"));
  const headings = [...document.querySelectorAll("main > section:not([hidden])")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.navigation a[href^="#"]').forEach(a => {
          if (a.hash === "#" + entry.target.id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-5% 0px -65% 0px", threshold: 0 });
    headings.forEach(section => observer.observe(section));
  }
  document.getElementById("copyright-year").textContent = String(new Date().getFullYear());
})();
