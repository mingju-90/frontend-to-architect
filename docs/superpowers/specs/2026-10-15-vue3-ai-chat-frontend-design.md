# Vue 3 AI 对话框前端初始化设计

## 1. 目标

将仓库调整为四个顶层业务目录：

```text
guide/      # 现有静态学习手册
frontend/   # Vue 3 AI 对话框
server/     # Node 中间件
docs/       # 知识文档
```

在 `frontend/` 中初始化一个可运行的 Vue 3 JavaScript 应用，使用 Vite、Element Plus 和 Element Plus Icons，提供基础 AI 对话界面并预留 Node 中间件接口。

## 2. 范围

本次包含：

- 把现有 `frontend/` 静态手册移动到 `guide/`，保留 Git 历史。
- 初始化 Vue 3 + JavaScript + Vite 工程。
- 接入 Element Plus 和 `@element-plus/icons-vue`。
- 实现响应式 AI 对话页面。
- 实现浏览器到 `POST /api/chat` 的基础请求和错误处理。
- 补充启动、构建和环境变量说明。

本次不包含：

- Vue Router。
- Pinia 或其他全局状态管理。
- 用户登录和权限系统。
- DeepSeek 真实调用。
- SSE 流式响应。
- 工具调用、审批和审计界面。
- 对静态学习手册内容进行重新设计。

## 3. 技术选择

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 构建工具 | Vite | 启动快，配置少，适合 Vue 3 单页应用。 |
| 框架 | Vue 3 | 使用 Composition API 和 `<script setup>`。 |
| 语言 | JavaScript | 不引入 TypeScript。 |
| UI 组件 | Element Plus | 使用官方组件完成布局、表单和反馈。 |
| 图标 | `@element-plus/icons-vue` | 与 Element Plus 配套。 |
| 请求 | 原生 `fetch` | 当前只有一个接口，不需要引入请求库。 |

## 4. 前端结构

```text
frontend/
  public/
  src/
    api/
      chat.js
    components/
      ChatComposer.vue
      ChatMessage.vue
      ConversationList.vue
    App.vue
    main.js
    styles.css
  .env.example
  index.html
  package.json
  vite.config.js
```

职责划分：

- `App.vue`：组织页面布局，维护当前会话、消息和请求状态。
- `ConversationList.vue`：展示会话列表并支持新建会话。
- `ChatMessage.vue`：展示单条用户或助手消息。
- `ChatComposer.vue`：编辑和提交用户输入。
- `api/chat.js`：封装 `/api/chat` 请求、响应解析和错误归一化。
- `main.js`：注册 Vue 应用、Element Plus 和全局样式。

## 5. 页面设计

页面采用工作台布局：

- 顶部栏展示产品名称、服务连接状态和新建会话入口。
- 左侧展示会话列表。
- 中间展示消息记录。
- 底部固定输入区，支持 `Enter` 发送，`Shift + Enter` 换行。
- 移动端将左侧会话列表切换为抽屉，主对话区保持全宽。

视觉风格保持安静、工作型：

- 使用中性色背景和边界。
- 用户消息与助手消息使用不同对齐方式。
- 主要操作使用 Element Plus 按钮和图标。
- 不使用营销式首屏、装饰性卡片或渐变背景。

## 6. 数据流

1. 用户输入消息并提交。
2. 前端立即把用户消息加入当前会话。
3. `api/chat.js` 向 `${VITE_API_BASE_URL}/api/chat` 发送 JSON 请求。
4. 请求体为 `{ message, conversationId }`。
5. 成功时读取 `{ reply, conversationId, runId }` 并加入助手消息。
6. 失败时保留用户消息，展示稳定错误信息，并允许重试。

默认接口地址为 `http://localhost:8787`。

## 7. 错误处理

前端需要区分：

- 服务不可达：提示 Node 中间件未启动。
- `MODEL_NOT_CONFIGURED`：提示模型尚未配置。
- 参数错误：展示服务返回的错误信息。
- 未知错误：展示统一失败提示，并在控制台保留原始错误。

不得把接口错误伪装成正常助手回答。

## 8. 代码约定

- 使用 ES6+ 语法。
- 按普通开发者的执行顺序组织代码。
- 仅在存在明确复用时提取函数或组件。
- JavaScript 函数、模块导出和 API 方法使用 JSDoc。
- Vue 模板中的主要布局、循环、条件分支和交互区域使用注释。
- CSS 使用明确的类名，避免依赖深层选择器。

## 9. 验证

实现后需要完成：

- `npm install` 成功。
- `npm run build` 成功。
- `npm run dev` 可启动页面。
- 桌面和移动视口无明显重叠或溢出。
- 服务不可用时页面展示明确错误。
- 启动 Node 中间件后，前端能收到当前的 `MODEL_NOT_CONFIGURED` 响应并正确展示。
- 静态手册移动后仍可通过独立静态服务器访问。

## 10. 验收标准

- 根目录存在 `guide/`、`frontend/`、`server/` 和 `docs/`。
- `frontend/` 是标准 Vue 3 + Vite + JavaScript 工程。
- Element Plus 组件和图标可以在页面中正常渲染。
- AI 对话框具备会话列表、消息区、输入区和基础发送逻辑。
- 静态学习手册不再与 Vue 应用文件混在同一目录。
