# 从初级前端到全栈架构师

仓库按静态学习手册、Vue 3 AI 对话框、Node 中间件和知识文档组织，用于逐步实现 AI 对话与受控工具系统。

## 仓库结构

```text
.
├── guide/      # 静态学习手册
├── frontend/   # Vue 3 AI 对话框
├── server/     # Node 中间件、模型接入与业务工具
└── docs/       # AI 智能体架构、工具契约和开发计划
```

## 静态学习手册

本地启动静态页面：

```bash
cd guide
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`。

## Vue 3 AI 对话框

首次运行先安装前端依赖：

```bash
pnpm --dir frontend install
```

在仓库根目录同时启动 Vue 和 Node：

```bash
pnpm dev
```

`Ctrl+C` 会同步关闭前端和 Node 中间件。也可以分别运行：

```bash
pnpm dev:frontend
pnpm dev:server
```

Vue 默认开发地址为 `http://localhost:5173`。

## Node 中间件

中间件使用 Node.js 22+，当前提供健康检查和聊天接口占位实现：

```bash
cd server
npm run dev
```

默认监听 `http://localhost:8787`，健康检查地址为 `http://localhost:8787/health`。

## 知识文档

- [文档索引](./docs/README.md)
- [总体架构](./docs/ai-agent-architecture.md)
- [工具契约](./docs/ai-agent-tool-contract.md)
- [自研开发计划](./docs/ai-agent-development-plan.md)
- [前端交互知识库与客户端动作](./docs/frontend-interaction-knowledge.md)

建议先阅读总体架构和开发计划，再按阶段实现聊天、SSE、只读工具以及审批闭环。
