# 学术主页维护

网站：<https://ltlangz1.github.io/>。纯静态页面，无需构建；不依赖框架、外部字体或第三方统计。

## 文件分工

| 文件 | 内容 |
| --- | --- |
| `site-data.js` | 姓名、身份、单位、照片、各类链接、新闻、论文。**日常更新只改这里。** |
| `index.html` | 英文正文（研究方向、理念等）。 |
| `app.js` | 对应的中文文案（`chinese` 字典），以及页面交互和数据渲染。 |
| `hero.js` | 首屏实时动画（Fig. 0）：CEM 规划器在流场里“想象”多条未来轨迹，鼠标位置即目标。 |
| `figures.js` | 研究方向的三张实时示意图与“潜空间肖像”占位图。 |
| `styles.css` | 版式与深 / 浅两套配色（顶部 `--accent` 等变量）。 |
| `assets/` | 站点图标 `mark.svg`、分享预览图 `og.jpg`、自托管字体（Instrument Serif，SIL OFL，许可见 `assets/fonts/OFL.txt`）。 |

改英文正文时，记得同步修改 `app.js` 里对应 key 的中文，保持两种语言事实一致。

## 常见更新

- **姓名 / 身份 / 单位**：改 `site-data.js` 的 `name`、`role`（如 PhD Student / 博士研究生）、`affiliation`、`department`。空字段自动隐藏。改名后，把新名字也加进 `selfNames`，论文作者列表才会加粗本人。
- **照片**：放一张方形或 4:5 的照片到 `assets/portrait.jpg`（≥ 480 px），再填 `portrait: "./assets/portrait.jpg"`。留空时显示按名字生成的吸引子图案。
- **邮箱、Scholar、ORCID、X、CV**：填上对应字段即显示在首屏和联系区；CV 可放 `./assets/cv.pdf`。
- **新闻**：在 `news` 里按新到旧添加 `{ date: "2026.10", en: "...", zh: "..." }`。
- **论文**：在 `publications` 里添加条目，字段见文件内注释。`image` 是缩略图；`video` 是悬停时播放的短视频（建议 ≤ 2 MB 的静音 mp4，桌面端悬停播放、手机端进入视口播放）；`highlight: true` 会高亮标题；`bibtex` 会出现“复制 BibTeX”按钮。只有设置 `verified: true` 且信息已核实、本人同意公开的条目才会显示。论文列表为空时整个栏目和导航项自动隐藏。
- **预览版式**：在网址后加 `?demo`（如 `http://localhost:8000/?demo`），会用示例条目展示论文和新闻栏目，并带“预览模式”提示，不影响正式页面。

## 链接参数

- `?lang=zh` / `?lang=en`：直接打开中文或英文版（分享给国内老师时可用 `https://ltlangz1.github.io/?lang=zh`）。
- `?theme=light` / `?theme=dark`：指定配色。访客手动切换后，语言和配色都会被浏览器记住。

## 本地预览

```bash
cd ltlangz1.github.io
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

## 发布

GitHub Pages：Settings → Pages → Deploy from a branch → `main` / `/ (root)`。推送到 `main` 后等一两分钟生效。

## 注意

- 不要上传未发表的研究方案、在审稿件的细节（双盲审稿期间尤其注意）、私有实验记录、访问令牌或未经本人同意的联系方式。
- 研究方向的动态示意图是概念演示，不代表实验结果（页面上已注明）。
- 首屏、三张示意图在页面不可见或标签页切到后台时会自动暂停；系统开启“减少动态效果”时只显示静态画面。
- `og.jpg` 是社交平台分享卡片，画面不含姓名，改名后无需重做。

## 设计参考

借鉴（未复制代码或素材）：[Jon Barron](https://jonbarron.info/) 与 [Ben Mildenhall](https://bmild.github.io/) 的悬停播放论文预览，[Danijar Hafner](https://danijar.com/) 的首屏研究口号，[Yilun Du](https://yilundu.github.io/) 的衬线标题与按需加载视频，[Bartosz Ciechanowski](https://ciechanow.ski/) 与 [Distill](https://distill.pub/) 的可交互图示，[Keenan Crane](https://www.cs.cmu.edu/~kmcrane/) 的单一强调色。不暗示隶属、合作或背书。
