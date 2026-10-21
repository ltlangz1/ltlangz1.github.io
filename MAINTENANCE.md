# 学术主页维护

网站：<https://ltlangz1.github.io/>。

## 更新内容

在 GitHub 中编辑 `site-data.js`，修改中英文姓名、本人确认的单位、允许公开的邮箱、Scholar 和 CV 链接。空字段会自动隐藏。

第一版暂以 `ltlangz1` 署名。论文列表为空时，论文栏目整体隐藏；只有本人批准公开、作者及发表信息与原始链接已核验的条目，才应设置 `verified: true` 并加入列表。研究方向不等于已完成成果。

英文正文在 `index.html`，对应中文在 `app.js` 的 `chinese` 字典中。修改后保持两种语言的事实一致。`styles.css` 管理布局，`assets/mark.svg` 是原创网站图标。网站不使用第三方统计、外部字体或框架依赖。

## 发布

本仓库采用无需构建的 GitHub Pages：Settings → Pages → Deploy from a branch → `main` / `/ (root)`。修改提交后等待 GitHub Pages 发布，随后访问网站确认。

保留仓库已有内容；不要上传未发表研究方案、私有实验记录、访问令牌或未经本人批准的联系方式。概念插图不是实验结果。

## 设计参考

参考 [Chelsea Finn](https://ai.stanford.edu/~cbfinn/)、[Danijar Hafner](https://danijar.com/) 与 [Jon Barron](https://jonbarron.info/) 学术主页的信息组织方式。网站布局、图示与文案为原创，没有复制其头像、研究成果或源码，也不暗示隶属、合作或背书。
