# Vue 3 AI 对话前端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将静态学习手册迁移到 `guide/`，并在 `frontend/` 初始化 Vue 3 + JavaScript + Element Plus 的可运行 AI 对话框。

**Architecture:** 前端使用 Vite、Vue 3 Composition API 和 Element Plus。页面由会话列表、消息区和输入区组成，聊天请求通过独立 API 模块访问现有 Node 中间件。

**Tech Stack:** Vue 3、JavaScript、Vite、Element Plus、`@element-plus/icons-vue`、Vitest。

**Spec:** `docs/superpowers/specs/2026-10-15-vue3-ai-chat-frontend-design.md`

## Global Constraints

- 使用 ES6+ 语法，不引入 TypeScript。
- 新生成的 JavaScript 函数和模块导出必须包含 JSDoc。
- Vue 模板的主要布局、条件、循环和交互区域必须添加注释。
- 不引入 Vue Router、Pinia、Axios 或 UI 框架之外的抽象层。
- 默认中间件地址为 `http://localhost:8787`。
- 接口失败不得伪装成助手正常回答。

---

### Task 1: 迁移静态学习手册

**Files:**

- Move: `frontend/index.html` → `guide/index.html`
- Move: `frontend/styles.css` → `guide/styles.css`
- Move: `frontend/app.js` → `guide/app.js`
- Move: `frontend/data.js` → `guide/data.js`
- Move: `frontend/chapters-*.js` → `guide/chapters-*.js`
- Move: `frontend/architect-guide-rendered.html` → `guide/architect-guide-rendered.html`
- Modify: `README.md`

**Interfaces:**

- Consumes: 当前 `frontend/` 内的静态学习手册。
- Produces: 顶层 `guide/` 目录，包含完整静态手册。

- [ ] **Step 1: 创建目标目录**

Run:

```bash
mkdir -p guide
```

Expected: `guide/` 目录存在。

- [ ] **Step 2: 使用 Git 移动静态文件**

Run:

```bash
git mv frontend/index.html frontend/styles.css frontend/app.js frontend/data.js \
  frontend/chapters-foundation.js frontend/chapters-application.js \
  frontend/chapters-backend.js frontend/chapters-production.js \
  frontend/chapters-agent-core.js frontend/chapters-agent-delivery.js \
  frontend/chapters-architect.js frontend/architect-guide-rendered.html guide/
```

Expected: `git status --short` 显示所有静态文件都从 `frontend/` 重命名到 `guide/`。

- [ ] **Step 3: 验证静态页面引用**

Run:

```bash
rg -n "styles.css|data.js|chapters-|app.js" guide/index.html guide/architect-guide-rendered.html
```

Expected: 所有引用仍指向 `guide/` 内的同级文件。

- [ ] **Step 4: 更新根 README 的启动方式**

在 `README.md` 的前端部分使用：

````markdown
## 静态学习手册

```bash
cd guide
python3 -m http.server 4173
```

访问 `http://localhost:4173`。

## Vue 3 AI 对话框

```bash
cd frontend
npm install
npm run dev
```
````

- [ ] **Step 5: 验证静态手册可启动**

Run:

```bash
cd guide
python3 -m http.server 4173
```

Expected: 服务启动并监听 `4173`。浏览器打开后页面、样式和脚本正常加载。

- [ ] **Step 6: 提交**

```bash
git add README.md guide frontend
git commit -m "Move static guide to top-level directory"
```

---

### Task 2: 初始化 Vue 3 与 Element Plus

**Files:**

- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.js`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/styles.css`
- Create: `frontend/.env.example`
- Create: `frontend/.gitignore`

**Interfaces:**

- Consumes: Task 1 清空后的 `frontend/` 目录。
- Produces: 可执行 `npm run dev`、`npm run build` 和 `npm run test` 的 Vue 工程。

- [ ] **Step 1: 创建标准 Vite Vue 工程**

Run:

```bash
cd frontend
npm create vite@latest . -- --template vue
```

Expected: 生成 Vue 3 JavaScript 工程文件。

- [ ] **Step 2: 安装 Element Plus 和图标**

Run:

```bash
cd frontend
npm install
npm install element-plus @element-plus/icons-vue
npm install -D vitest
```

Expected: `package.json` 和 `package-lock.json` 包含全部依赖。

- [ ] **Step 3: 配置 Vite**

将 `frontend/vite.config.js` 设置为：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Vite 开发与构建配置。
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
```

- [ ] **Step 4: 注册 Element Plus**

将 `frontend/src/main.js` 设置为：

```js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles.css'

/**
 * 创建并挂载 Vue 应用。
 * @returns {void}
 */
function bootstrap() {
  const app = createApp(App)
  app.use(ElementPlus)
  app.mount('#app')
}

bootstrap()
```

- [ ] **Step 5: 添加环境变量示例**

`frontend/.env.example`：

```dotenv
VITE_API_BASE_URL=http://localhost:8787
```

- [ ] **Step 6: 添加构建脚本**

确保 `frontend/package.json` 包含：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 7: 验证基础工程**

Run:

```bash
cd frontend
npm run build
```

Expected: 构建成功，生成 `dist/`。

- [ ] **Step 8: 提交**

```bash
git add frontend
git commit -m "Initialize Vue 3 frontend with Element Plus"
```

---

### Task 3: 实现聊天 API 模块

**Files:**

- Create: `frontend/src/api/chat.js`
- Create: `frontend/src/api/chat.test.js`

**Interfaces:**

- Consumes: `VITE_API_BASE_URL` 环境变量。
- Produces: `requestChat(payload)`，返回 `Promise<{ reply: string, conversationId?: string, runId?: string }>`。

- [ ] **Step 1: 编写失败测试**

`frontend/src/api/chat.test.js`：

```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestChat } from './chat.js'

describe('requestChat', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns assistant reply from the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ reply: '你好', conversationId: 'conversation-1' }),
      }),
    )

    const result = await requestChat({ message: '你好' })

    expect(result.reply).toBe('你好')
    expect(result.conversationId).toBe('conversation-1')
  })

  it('throws a readable error for MODEL_NOT_CONFIGURED', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'MODEL_NOT_CONFIGURED',
            message: 'Configure the DeepSeek adapter before handling chat requests.',
          },
        }),
      }),
    )

    await expect(requestChat({ message: '你好' })).rejects.toThrow('模型服务尚未配置')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
cd frontend
npm test -- src/api/chat.test.js
```

Expected: FAIL，提示无法解析 `./chat.js`。

- [ ] **Step 3: 实现 API 模块**

`frontend/src/api/chat.js`：

```js
const defaultApiBaseUrl = 'http://localhost:8787'
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, '')

/**
 * 把服务端错误转换为页面可以直接展示的 Error。
 * @param {Response} response
 * @param {Record<string, unknown>} body
 * @returns {Error}
 */
function createResponseError(response, body) {
  const error = body?.error ?? {}
  const code = typeof error.code === 'string' ? error.code : 'REQUEST_FAILED'

  if (code === 'MODEL_NOT_CONFIGURED') {
    return new Error('模型服务尚未配置')
  }

  if (typeof error.message === 'string' && error.message) {
    return new Error(error.message)
  }

  return new Error(`请求失败（HTTP ${response.status}）`)
}

/**
 * 读取响应体并容忍非 JSON 错误响应。
 * @param {Response} response
 * @returns {Promise<Record<string, unknown>>}
 */
async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return {}
  }

  return response.json()
}

/**
 * 向 Node 中间件发送聊天消息。
 * @param {{ message: string, conversationId?: string }} payload
 * @returns {Promise<{ reply: string, conversationId?: string, runId?: string }>}
 */
export async function requestChat(payload) {
  let response

  try {
    response = await fetch(`${apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error(error)
    throw new Error('无法连接 AI 中间件，请确认 Node 服务已启动')
  }

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createResponseError(response, body)
  }

  if (typeof body.reply !== 'string' || !body.reply.trim()) {
    throw new Error('AI 服务返回了无效回复')
  }

  return {
    reply: body.reply,
    conversationId: typeof body.conversationId === 'string' ? body.conversationId : undefined,
    runId: typeof body.runId === 'string' ? body.runId : undefined,
  }
}
```

- [ ] **Step 4: 运行测试**

Run:

```bash
cd frontend
npm test -- src/api/chat.test.js
```

Expected: 2 个测试通过。

- [ ] **Step 5: 提交**

```bash
git add frontend/src/api
git commit -m "Add AI chat API client"
```

---

### Task 4: 实现 AI 对话界面

**Files:**

- Create: `frontend/src/components/ConversationList.vue`
- Create: `frontend/src/components/ChatMessage.vue`
- Create: `frontend/src/components/ChatComposer.vue`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/styles.css`

**Interfaces:**

- Consumes: `requestChat(payload)` from Task 3。
- Produces: 可发送消息、展示回答和错误提示的完整对话页面。

- [ ] **Step 1: 实现会话列表组件**

`frontend/src/components/ConversationList.vue`：

```vue
<script setup>
defineProps({
  conversations: {
    type: Array,
    required: true,
  },
  activeId: {
    type: String,
    required: true,
  },
})

defineEmits(['create', 'select'])
</script>

<template>
  <!-- 会话列表头部 -->
  <div class="conversation-list">
    <el-button class="conversation-list__create" type="primary" @click="$emit('create')">
      新建对话
    </el-button>

    <!-- 会话列表 -->
    <el-scrollbar class="conversation-list__scroll">
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-list__item"
        :class="{ 'is-active': conversation.id === activeId }"
        type="button"
        @click="$emit('select', conversation.id)"
      >
        {{ conversation.title }}
      </button>
    </el-scrollbar>
  </div>
</template>
```

- [ ] **Step 2: 实现消息组件**

`frontend/src/components/ChatMessage.vue`：

```vue
<script setup>
defineProps({
  message: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <!-- 单条用户或助手消息 -->
  <article class="message" :class="`message--${message.role}`">
    <div class="message__avatar">
      {{ message.role === 'user' ? '我' : 'AI' }}
    </div>
    <div class="message__body">
      <p>{{ message.content }}</p>
    </div>
  </article>
</template>
```

- [ ] **Step 3: 实现输入组件**

`frontend/src/components/ChatComposer.vue`：

```vue
<script setup>
import { ref } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])
const draft = ref('')

/**
 * 提交当前输入内容。
 * @returns {void}
 */
function submit() {
  const message = draft.value.trim()

  if (!message || props.disabled) {
    return
  }

  emit('submit', message)
  draft.value = ''
}

/**
 * 处理输入框快捷键。
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <!-- 对话输入区 -->
  <div class="composer">
    <el-input
      v-model="draft"
      type="textarea"
      :rows="3"
      resize="none"
      placeholder="输入问题，Enter 发送，Shift + Enter 换行"
      @keydown="handleKeydown"
    />

    <!-- 发送操作 -->
    <div class="composer__actions">
      <el-button type="primary" :loading="disabled" @click="submit">
        发送
      </el-button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 组装对话页面**

`frontend/src/App.vue`：

```vue
<script setup>
import { computed, ref } from 'vue'
import { Menu, Monitor, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ChatComposer from './components/ChatComposer.vue'
import ChatMessage from './components/ChatMessage.vue'
import ConversationList from './components/ConversationList.vue'
import { requestChat } from './api/chat.js'

/**
 * 创建一条新会话。
 * @returns {{ id: string, title: string, messages: Array }}
 */
function createConversationRecord() {
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    messages: [],
  }
}

const firstConversation = createConversationRecord()
const conversations = ref([firstConversation])
const activeId = ref(firstConversation.id)
const sending = ref(false)
const mobileConversationVisible = ref(false)
const connectionText = ref('等待请求')
const connectionType = ref('info')
const activeConversation = computed(
  () => conversations.value.find((conversation) => conversation.id === activeId.value),
)

/**
 * 新建会话并切换为当前会话。
 * @returns {void}
 */
function createConversation() {
  const conversation = createConversationRecord()
  conversations.value.unshift(conversation)
  activeId.value = conversation.id
}

/**
 * 切换当前会话并关闭移动端会话抽屉。
 * @param {string} conversationId
 * @returns {void}
 */
function selectConversation(conversationId) {
  activeId.value = conversationId
  mobileConversationVisible.value = false
}

/**
 * 发送用户消息并追加助手回复。
 * @param {string} content
 * @returns {Promise<void>}
 */
async function sendMessage(content) {
  const conversation = activeConversation.value

  if (!conversation || sending.value) {
    return
  }

  conversation.title = content.slice(0, 18)
  conversation.messages.push({
    id: crypto.randomUUID(),
    role: 'user',
    content,
  })
  sending.value = true

  try {
    const result = await requestChat({
      message: content,
      conversationId: conversation.id,
    })

    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.reply,
    })
    connectionText.value = '服务已连接'
    connectionType.value = 'success'
  } catch (error) {
    console.error(error)
    connectionText.value = '连接异常'
    connectionType.value = 'danger'
    ElMessage.error(error instanceof Error ? error.message : '发送失败')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <el-container class="app-shell">
    <!-- 顶部栏 -->
    <el-header class="app-header">
      <div class="app-header__brand">
        <el-icon><Monitor /></el-icon>
        <div>
          <strong>AI 对话工作台</strong>
          <span>Vue 3 + Element Plus</span>
        </div>
      </div>

      <!-- 状态和操作 -->
      <div class="app-header__actions">
        <el-tag :type="connectionType" effect="plain">{{ connectionText }}</el-tag>
        <el-button class="mobile-menu-button" circle @click="mobileConversationVisible = true">
          <el-icon><Menu /></el-icon>
        </el-button>
        <el-button type="primary" @click="createConversation">
          <el-icon><Plus /></el-icon>
          新建对话
        </el-button>
      </div>
    </el-header>

    <el-container class="app-body">
      <!-- 桌面端会话列表 -->
      <el-aside class="conversation-aside" width="264px">
        <ConversationList
          :conversations="conversations"
          :active-id="activeId"
          @create="createConversation"
          @select="selectConversation"
        />
      </el-aside>

      <!-- 对话主区域 -->
      <el-main class="chat-main">
        <div class="chat-panel">
          <div class="message-list">
            <el-empty
              v-if="!activeConversation?.messages.length"
              description="输入问题开始对话"
            />

            <!-- 当前会话消息 -->
            <ChatMessage
              v-for="message in activeConversation?.messages ?? []"
              :key="message.id"
              :message="message"
            />
          </div>

          <ChatComposer :disabled="sending" @submit="sendMessage" />
        </div>
      </el-main>
    </el-container>

    <!-- 移动端会话抽屉 -->
    <el-drawer
      v-model="mobileConversationVisible"
      direction="ltr"
      size="82%"
      :with-header="false"
    >
      <ConversationList
        :conversations="conversations"
        :active-id="activeId"
        @create="createConversation"
        @select="selectConversation"
      />
    </el-drawer>
  </el-container>
</template>
```

- [ ] **Step 5: 添加响应式样式**

`frontend/src/styles.css`：

```css
:root {
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2937;
  background: #f3f4f6;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.app-header__brand,
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__brand div {
  display: grid;
  gap: 2px;
}

.app-header__brand span {
  color: #6b7280;
  font-size: 12px;
}

.app-body {
  height: calc(100vh - 64px);
}

.conversation-aside {
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
}

.chat-main {
  padding: 0;
  background: #f7f8fa;
}

.chat-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: min(920px, 100%);
  height: 100%;
  margin: 0 auto;
  padding: 24px;
}

.message-list {
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #ffffff;
  background: #2563eb;
  border-radius: 8px;
}

.message--assistant .message__avatar {
  background: #334155;
}

.message__body {
  max-width: min(680px, calc(100% - 48px));
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.message--user .message__body {
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
}

.message__body p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
}

.composer {
  display: grid;
  gap: 10px;
  padding-top: 16px;
}

.composer__actions {
  display: flex;
  justify-content: flex-end;
}

.conversation-list {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  padding: 18px;
}

.conversation-list__create {
  width: 100%;
}

.conversation-list__scroll {
  min-height: 0;
}

.conversation-list__item {
  width: 100%;
  margin-bottom: 6px;
  padding: 10px 12px;
  overflow: hidden;
  color: #374151;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.conversation-list__item.is-active {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.mobile-menu-button {
  display: none;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }

  .app-header__brand span,
  .app-header__actions > .el-button--primary {
    display: none;
  }

  .conversation-aside {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .chat-panel {
    padding: 14px;
  }

  .message__body {
    max-width: calc(100% - 48px);
  }
}
```

- [ ] **Step 6: 运行构建和测试**

Run:

```bash
cd frontend
npm test
npm run build
```

Expected: 测试和构建全部通过。

- [ ] **Step 7: 浏览器验证**

Run:

```bash
cd frontend
npm run dev
```

使用桌面和移动视口检查：

- 会话列表、消息区和输入区没有重叠。
- 输入内容后可以出现用户消息。
- Node 服务未启动时显示连接错误。
- 启动 Node 服务后显示 `模型服务尚未配置`。

- [ ] **Step 8: 提交**

```bash
git add frontend/src
git commit -m "Build AI chat interface"
```

---

### Task 5: 最终联调与文档

**Files:**

- Modify: `README.md`
- Modify: `frontend/.env.example`
- Modify: `frontend/package.json`

**Interfaces:**

- Consumes: Vue 应用、`guide/` 静态手册和 Node 中间件。
- Produces: 可以按 README 独立启动、构建和联调的仓库。

- [ ] **Step 1: 启动 Node 中间件**

Run:

```bash
cd server
npm start
```

Expected: 日志显示监听 `http://localhost:8787`。

- [ ] **Step 2: 验证中间件接口**

Run:

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'
```

Expected:

- 健康检查返回 `{"status":"ok",...}`。
- 聊天接口返回 `MODEL_NOT_CONFIGURED`。

- [ ] **Step 3: 启动 Vue 并检查错误展示**

Run:

```bash
cd frontend
npm run dev
```

Expected: 发送消息后页面显示“模型服务尚未配置”，不会新增错误的助手回答。

- [ ] **Step 4: 验证静态手册**

Run:

```bash
cd guide
python3 -m http.server 4173
```

Expected: 静态手册可以正常打开。

- [ ] **Step 5: 更新 README**

README 必须分别说明：

```markdown
- guide：静态学习手册
- frontend：Vue 3 AI 对话框
- server：Node 中间件
- docs：架构与开发知识
```

并分别给出 `guide`、`frontend`、`server` 的启动命令。

- [ ] **Step 6: 最终检查**

Run:

```bash
git diff --check
git status --short --branch
```

Expected: 无格式错误，工作区干净，`main` 与 `origin/main` 状态明确。

- [ ] **Step 7: 提交并推送**

```bash
git add README.md frontend server guide docs
git commit -m "Document Vue frontend workflow"
git push origin main
```
