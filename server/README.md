# Node 中间件

该目录负责 AI 对话框与业务系统之间的中间层，后续按知识文档中的架构逐步实现：

- DeepSeek 模型调用与 SSE 流式返回。
- 用户、租户和项目权限上下文。
- 工具注册、参数校验、审批、幂等和审计。
- 原巡检后端 Adapter。

当前入口是 `src/index.js`，不依赖第三方包：

```bash
npm run dev
```

可用接口：

- `GET /health`
- `POST /api/chat`

`POST /api/chat` 目前只校验输入并返回 `MODEL_NOT_CONFIGURED`，等待接入模型客户端。
