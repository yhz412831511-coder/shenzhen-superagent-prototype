# 深圳政务超级智能体 · 统一任务工作台

当前原型访问地址：

<https://yhz412831511-coder.github.io/shenzhen-superagent-prototype/>

这是用户端交互原型，包含统一任务工作台、历史任务、任务概览、内置浏览器、成果审阅与批注、资料库、AI Memory、专业智能体、技能、插件与连接器、自动化、模型调度以及输入区命令／权限／语音交互。

## 本地运行

```bash
cd site
pnpm install
pnpm run dev
```

## GitHub Pages发布

当前版本已发布到 `gh-pages` 分支并由 GitHub Pages 提供服务。后续若补齐 GitHub CLI 的 `workflow` 授权，可启用自动发布工作流；规范访问地址保持不变。发布入口固定使用仓库路径 `/shenzhen-superagent-prototype/`，不随构建产物变化。

静态发布入口位于 `site/static/`，复用同一套 `app/page.tsx` 与全局样式，不维护第二套业务页面。
