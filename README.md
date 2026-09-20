# 深圳政务超级智能体 · 统一任务工作台

当前原型访问地址：

<https://yhz412831511-coder.github.io/shenzhen-superagent-prototype/>

这是三产品统一交互原型，包含超级智能体、智能体管理后台和记忆管理系统。超级智能体提供统一任务工作台、历史任务、任务概览、内置浏览器、成果审阅与批注、资料库、专业智能、工作技能、系统与工具、自动化和模型调度；管理后台提供组织、能力、Token、评测、运行与安全治理；记忆管理系统提供六类记忆、来源证据、生命周期、授权调用与异常治理。

三个产品共用一个长期维护地址：

- 超级智能体：<https://yhz412831511-coder.github.io/shenzhen-superagent-prototype/>
- 智能体管理后台：<https://yhz412831511-coder.github.io/shenzhen-superagent-prototype/?product=admin>
- 记忆管理系统：<https://yhz412831511-coder.github.io/shenzhen-superagent-prototype/?product=memory-system>

本仓库同时作为超级智能体、智能体管理后台和记忆管理系统的统一原型入口。三个产品的地址、接入方式和后续目录约定见 [UNIFIED_PRODUCT_ENTRY.md](UNIFIED_PRODUCT_ENTRY.md)，本地实施约束见 [AGENTS.md](AGENTS.md)。

## 本地运行

```bash
cd site
pnpm install
pnpm run dev
```

## GitHub Pages发布

当前版本已发布到 `gh-pages` 分支并由 GitHub Pages 提供服务。后续若补齐 GitHub CLI 的 `workflow` 授权，可启用自动发布工作流；规范访问地址保持不变。发布入口固定使用仓库路径 `/shenzhen-superagent-prototype/`，不随构建产物变化。

静态发布入口位于 `site/static/`，复用同一套 `app/page.tsx` 与全局样式，不维护第二套业务页面。
