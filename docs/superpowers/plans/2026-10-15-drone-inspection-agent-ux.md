# 无人机巡检对话智能体体验提升计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有无人机巡检平台中增加一个面向管理层和任务调度员的对话智能体，使用户可以在当前项目内通过自然语言查询任务、告警、设备和成果，并在对话框内通过图表、表格和列表查看结果。

**Architecture:** Vue 3 对话框负责上下文采集和结构化结果渲染，Node 中间件负责身份透传、权限校验、模型调用和只读工具执行。登录返回的可访问路由与 AI 生成的前端交互文档只用于前端能力预判，原平台 API 和用户凭证始终是权限的最终依据。

**Tech Stack:** Vue 3、JavaScript、Element Plus、ECharts、Node.js、Fastify、Zod、DeepSeek。

**Spec:** `docs/ai-agent-architecture.md`、`docs/ai-agent-tool-contract.md`、`docs/frontend-interaction-knowledge.md`。

## Global Constraints

- 第一版只读，不创建、修改、取消任务，也不控制飞行。
- 第一版只查看当前项目，不进行跨项目汇总。
- 用户权限继承当前登录用户，服务端不能使用超级管理员凭证代查。
- 登录返回路由和交互文档只能用于能力预判，不能作为最终授权结果。
- 数据查询必须调用原巡检平台接口，不直接读取业务数据库。
- 模型不能执行 SQL、访问任意 URL 或生成任意 HTML、JavaScript 和 Vue 组件。
- 所有结果都显示在对话框中，不跳转任务、告警、设备或成果详情页面。
- 图表使用白名单结构和 ECharts，表格、列表使用 Element Plus。
- JavaScript 函数和模块导出必须包含 JSDoc，Vue 模板主要区块必须包含注释。
- 无权限、无数据、超时和接口错误必须给出明确状态，不能伪造正常结果。

---

### Task 1: 固定产品范围和评测基线

**Files:**

- Create: `docs/agent-ux/scope.md`
- Create: `docs/agent-ux/evaluation-set.json`
- Modify: `docs/README.md`

**Interfaces:**

- Consumes: 当前已经确认的用户、数据域和权限边界。
- Produces: 后续工具、提示词和 UI 组件共同使用的范围和评测数据。

- [ ] **Step 1: 定义第一版用户和场景**

`docs/agent-ux/scope.md` 必须明确：

```markdown
# 第一版范围

## 用户

- 管理层
- 任务调度员

## 数据域

1. 任务
2. 告警
3. 设备
4. 成果

## 权限

- 仅当前项目
- 仅当前用户可访问的数据
- 全流程只读

## 明确不做

- 页面跳转
- 创建、修改和取消任务
- 飞行控制
- 航线修改
- 跨项目汇总
```

- [ ] **Step 2: 建立评测问题集**

`docs/agent-ux/evaluation-set.json` 至少包含 24 条问题，结构如下：

```json
[
  {
    "id": "task-overview-001",
    "role": "management",
    "question": "当前项目本周任务完成率是多少？",
    "expectedTools": ["get_project_task_overview"],
    "expectedBlocks": ["summary", "kpi-grid"],
    "forbiddenFields": ["token", "accessToken", "rawSql"]
  }
]
```

问题必须覆盖：

- 任务状态、完成率和延期。
- 告警等级、趋势和关联任务。
- 设备可用率、异常和故障。
- 成果数量、缺陷类型和严重程度。
- 缺少时间范围时的追问。
- 越权项目和无权限数据的拒绝。

- [ ] **Step 3: 校验 JSON**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('docs/agent-ux/evaluation-set.json', 'utf8')); console.log('ok')"
```

Expected: 输出 `ok`。

- [ ] **Step 4: 提交**

```bash
git add docs/agent-ux docs/README.md
git commit -m "Define agent UX scope and evaluation set"
```

---

### Task 2: 定义统一响应和 UI Block 协议

**Files:**

- Create: `server/src/contracts/agent-response.js`
- Create: `server/src/contracts/agent-response.test.js`
- Create: `docs/agent-ux/response-contract.md`

**Interfaces:**

- Consumes: Task 1 的场景和评测问题。
- Produces: `AgentResponse` 和 `Block` 结构，供 Node 与 Vue 共用。

- [ ] **Step 1: 定义响应结构**

`docs/agent-ux/response-contract.md` 必须定义：

```json
{
  "runId": "run-001",
  "answer": "当前项目本周任务完成率为 82%。",
  "blocks": [],
  "citations": [],
  "followUps": []
}
```

支持的 Block 类型：

```text
summary
kpi-grid
chart
table
list
alert
```

- [ ] **Step 2: 编写协议校验测试**

`server/src/contracts/agent-response.test.js` 至少验证：

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAgentResponse } from './agent-response.js'

test('accepts a valid kpi response', () => {
  const result = validateAgentResponse({
    runId: 'run-001',
    answer: '完成率为 82%',
    blocks: [{ type: 'kpi-grid', items: [{ label: '完成率', value: '82%' }] }],
    citations: [],
    followUps: [],
  })

  assert.equal(result.ok, true)
})

test('rejects raw html blocks', () => {
  const result = validateAgentResponse({
    runId: 'run-001',
    answer: '',
    blocks: [{ type: 'html', content: '<script />' }],
    citations: [],
    followUps: [],
  })

  assert.equal(result.ok, false)
})
```

- [ ] **Step 3: 实现协议校验**

`server/src/contracts/agent-response.js` 必须：

- 只接受白名单 Block。
- 校验每类 Block 的必填字段。
- 拒绝 `html`、`script`、`component` 等任意渲染类型。
- 返回 `{ ok, value?, errors? }`，不直接抛异常。

- [ ] **Step 4: 运行测试**

Run:

```bash
node --test server/src/contracts/agent-response.test.js
```

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add server/src/contracts docs/agent-ux/response-contract.md
git commit -m "Define agent response and UI block contract"
```

---

### Task 3: 建立权限和当前项目上下文

**Files:**

- Create: `server/src/modules/context/auth-context.js`
- Create: `server/src/modules/context/project-context.js`
- Create: `server/src/modules/context/context.test.js`
- Create: `docs/agent-ux/permission-model.md`

**Interfaces:**

- Consumes: 登录用户凭证、登录返回的可访问路由、当前 `projectId` 和当前 `route`。
- Produces: `resolveAgentContext(request)`，返回可信用户、项目、页面和能力上下文。

- [ ] **Step 1: 定义权限模型**

`docs/agent-ux/permission-model.md` 必须写明：

```text
候选能力 =
  用户可访问路由
  ∩ 交互文档中的页面能力
  ∩ 当前项目范围

最终授权 =
  原平台 API 对当前用户、当前项目和目标资源的实时校验
```

- [ ] **Step 2: 编写上下文测试**

测试必须覆盖：

- 当前用户和当前项目有效时返回上下文。
- 伪造其他项目 ID 时拒绝。
- 用户没有对应路由时隐藏候选查询。
- 路由可访问但原平台拒绝数据时，工具返回权限错误。
- 交互文档版本缺失时，不开放未确认能力。

- [ ] **Step 3: 实现上下文解析**

`resolveAgentContext(request)` 的返回结构：

```js
{
  userId,
  tenantId,
  projectId,
  accessToken,
  route,
  pageId,
  capabilities,
  requestId
}
```

服务端必须以凭证和原平台校验结果为准，不能信任消息正文中的 `projectId`。

- [ ] **Step 4: 运行测试**

Run:

```bash
node --test server/src/modules/context/context.test.js
```

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add server/src/modules/context docs/agent-ux/permission-model.md
git commit -m "Add agent permission and project context"
```

---

### Task 4: 定义只读业务工具

**Files:**

- Create: `server/src/tools/registry.js`
- Create: `server/src/tools/task-tools.js`
- Create: `server/src/tools/alert-tools.js`
- Create: `server/src/tools/device-tools.js`
- Create: `server/src/tools/result-tools.js`
- Create: `server/src/tools/tools.test.js`
- Create: `docs/agent-ux/tool-catalog.md`

**Interfaces:**

- Consumes: `resolveAgentContext(request)`。
- Produces: 只读工具注册表，所有工具返回标准化 Block 数据。

- [ ] **Step 1: 固定工具清单**

第一版工具：

```text
get_project_task_overview
list_project_tasks
get_task_summary

get_project_alert_overview
list_project_alerts
get_alert_summary

get_project_device_overview
list_project_devices
get_device_summary

get_project_result_overview
list_project_results
get_result_summary
```

所有工具必须定义 `inputSchema`、`outputSchema`、`permission`、`timeoutMs` 和 `risk: 'read'`。

- [ ] **Step 2: 编写工具级测试**

测试必须覆盖：

- 参数不合法时返回 `TOOL_INPUT_INVALID`。
- 无权限时返回 `RESOURCE_NOT_ACCESSIBLE`。
- 原接口超时返回 `BACKEND_TIMEOUT`。
- 返回结果不包含 Token、密码、原始 SQL 和未脱敏联系人。
- 列表工具限制最大返回行数。

- [ ] **Step 3: 实现 Backend Adapter**

每个工具调用原平台现有接口，不直接访问数据库。Adapter 负责：

- 传入用户凭证。
- 映射原接口参数。
- 裁剪字段。
- 转换为统一业务结构。
- 保留原始记录 ID 和 requestId 供引用。

- [ ] **Step 4: 运行测试**

Run:

```bash
node --test server/src/tools/tools.test.js
```

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add server/src/tools docs/agent-ux/tool-catalog.md
git commit -m "Add read-only inspection agent tools"
```

---

### Task 5: 实现对话内结构化结果渲染

**Files:**

- Create: `frontend/src/components/blocks/BlockRenderer.vue`
- Create: `frontend/src/components/blocks/SummaryBlock.vue`
- Create: `frontend/src/components/blocks/KpiGridBlock.vue`
- Create: `frontend/src/components/blocks/ChartBlock.vue`
- Create: `frontend/src/components/blocks/TableBlock.vue`
- Create: `frontend/src/components/blocks/ListBlock.vue`
- Create: `frontend/src/components/blocks/AlertBlock.vue`
- Modify: `frontend/src/components/ChatMessage.vue`
- Modify: `frontend/src/styles.css`

**Interfaces:**

- Consumes: Task 2 的 `AgentResponse.blocks`。
- Produces: 在对话消息内展示摘要、KPI、图表、表格、列表和风险提示。

- [ ] **Step 1: 安装图表依赖**

Run:

```bash
pnpm --dir frontend add echarts vue-echarts
```

Expected: `frontend/package.json` 包含 ECharts 和 Vue ECharts。

- [ ] **Step 2: 实现 BlockRenderer**

`BlockRenderer.vue` 只根据 `block.type` 选择白名单组件，未知类型显示“暂不支持的结果类型”，不得使用 `v-html`。

- [ ] **Step 3: 实现 KPI、图表和表格**

- `KpiGridBlock` 显示指标、值、单位和同比变化。
- `ChartBlock` 支持 `line`、`bar` 和 `pie`。
- `TableBlock` 使用 `el-table`，支持排序和分页。
- 图表和表格必须有空状态、加载状态和错误状态。

- [ ] **Step 4: 实现列表和告警**

- `ListBlock` 显示任务、设备或成果的摘要列表。
- `AlertBlock` 按风险等级使用不同颜色。
- 所有时间、状态、数量和单位使用统一格式化函数。

- [ ] **Step 5: 编写组件测试**

测试必须覆盖：

- 每种白名单 Block 可以渲染。
- 未知类型不会执行代码。
- 空数据不会产生空白区域。
- 表格列和行结构不匹配时显示错误状态。
- 图表容器在桌面和移动视口内不溢出。

- [ ] **Step 6: 运行测试和构建**

Run:

```bash
pnpm --dir frontend test
pnpm --dir frontend build
```

Expected: 测试和构建通过。

- [ ] **Step 7: 提交**

```bash
git add frontend
git commit -m "Render structured agent results in chat"
```

---

### Task 6: 接入 Agent 运行时和只读工具闭环

**Files:**

- Create: `server/src/runtime/agent-runtime.js`
- Create: `server/src/model/deepseek-client.js`
- Create: `server/src/model/prompt-builder.js`
- Create: `server/src/modules/chat/chat-route.js`
- Create: `server/src/runtime/agent-runtime.test.js`
- Modify: `server/src/index.js`

**Interfaces:**

- Consumes: 权限上下文、工具注册表和 DeepSeek 客户端。
- Produces: `POST /api/chat` 返回完整 `AgentResponse`。

- [ ] **Step 1: 实现提示词构建**

Prompt 只包含：

- 当前用户角色和页面上下文。
- 当前项目公开元数据。
- 可用工具和参数 Schema。
- 用户问题。

不得包含：

- Access Token。
- 完整原始业务记录。
- 内部数据库字段。
- 管理员凭证。

- [ ] **Step 2: 实现工具调用循环**

Agent Runtime 必须限制：

```text
最大模型轮数：4
最大工具调用数：8
单次运行超时：30 秒
单次工具超时：8 秒
```

模型只能选择已注册工具，Node 再次校验工具名、参数、权限和资源范围。

- [ ] **Step 3: 实现 `/api/chat`**

请求：

```json
{
  "message": "当前项目有哪些高风险告警？",
  "projectId": "p-001",
  "route": "/projects/p-001/alerts"
}
```

响应：

```json
{
  "runId": "run-001",
  "answer": "当前项目有 3 条高风险告警。",
  "blocks": [],
  "citations": [],
  "followUps": []
}
```

- [ ] **Step 4: 运行测试**

Run:

```bash
node --test server/src/runtime/agent-runtime.test.js
```

Expected: 只读工具闭环、权限拒绝、超时和错误映射全部通过。

- [ ] **Step 5: 提交**

```bash
git add server
git commit -m "Add read-only agent runtime"
```

---

### Task 7: 接入前端交互文档和路由能力

**Files:**

- Create: `docs/agent-ux/interaction-manifest.schema.json`
- Create: `scripts/validate-interaction-manifest.mjs`
- Modify: `server/src/modules/context/context.test.js`
- Modify: `package.json`

**Interfaces:**

- Consumes: 平台前端代码生成的交互文档和登录返回的可访问路由。
- Produces: 经版本校验的页面能力清单，用于查询范围预判，不用于最终授权。

- [ ] **Step 1: 定义交互文档 Schema**

每条记录至少包含：

```json
{
  "appVersion": "2026.10.15",
  "route": "/projects/:projectId/tasks",
  "pageId": "task-list",
  "queries": ["list_project_tasks", "get_project_task_overview"],
  "requiredPermission": "task:read",
  "dataScope": "current-project",
  "sourcePath": "src/views/task/TaskListView.vue"
}
```

- [ ] **Step 2: 实现清单校验**

校验脚本必须检查：

- 路由格式。
- 工具名称是否已注册。
- 页面 ID 是否重复。
- 权限字段是否存在。
- 当前应用版本是否存在。

- [ ] **Step 3: 增加根命令**

`package.json` 增加：

```json
{
  "scripts": {
    "validate:interaction": "node scripts/validate-interaction-manifest.mjs"
  }
}
```

- [ ] **Step 4: 运行测试**

Run:

```bash
pnpm validate:interaction
node --test server/src/modules/context/context.test.js
```

Expected: 清单有效，页面能力只能缩小候选范围，不能扩大后端权限。

- [ ] **Step 5: 提交**

```bash
git add scripts server docs/agent-ux package.json
git commit -m "Validate interaction manifest and route capabilities"
```

---

### Task 8: 评测、性能和安全验收

**Files:**

- Create: `docs/agent-ux/evaluation-report.md`
- Create: `scripts/run-agent-evaluation.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: Task 1 的评测集、只读工具和完整 Agent Runtime。
- Produces: 可重复运行的质量和权限评测报告。

- [ ] **Step 1: 实现评测执行器**

评测执行器逐条发送问题，记录：

- 选择的工具。
- 实际响应 Block。
- 总耗时。
- 是否越权。
- 是否包含禁止字段。
- 是否给出正确追问。

- [ ] **Step 2: 增加根命令**

`package.json` 增加：

```json
{
  "scripts": {
    "evaluate:agent": "node scripts/run-agent-evaluation.mjs"
  }
}
```

- [ ] **Step 3: 设置验收阈值**

第一版验收阈值：

```text
工具选择正确率：>= 90%
结构化 Block 合法率：100%
越权响应：0
禁止字段泄漏：0
普通查询 P95：<= 8 秒
表格首次展示：<= 100 行
```

- [ ] **Step 4: 执行评测**

Run:

```bash
pnpm evaluate:agent
pnpm --dir frontend test
pnpm --dir frontend build
pnpm --dir server check
```

Expected: 所有阈值达到，详细结果写入 `docs/agent-ux/evaluation-report.md`。

- [ ] **Step 5: 提交**

```bash
git add docs/agent-ux scripts package.json
git commit -m "Add agent quality and permission evaluation"
```

---

### Task 9: 灰度发布和体验优化

**Files:**

- Create: `docs/agent-ux/rollout.md`
- Modify: `docs/README.md`

**Interfaces:**

- Consumes: 通过评测的只读 Agent。
- Produces: 可回退、可观察、可反馈的生产发布方案。

- [ ] **Step 1: 定义灰度范围**

发布顺序：

```text
内部测试账号
  -> 单个试点项目
  -> 管理层只读
  -> 任务调度员只读
  -> 扩大项目范围
```

- [ ] **Step 2: 增加可观测指标**

至少记录：

- `runId`
- `userId`
- `projectId`
- `pageId`
- 工具名称和耗时
- 模型 Token 和耗时
- Block 类型
- 权限结果
- 错误码
- 用户反馈

- [ ] **Step 3: 定义回退条件**

出现以下任一情况立即关闭 Agent：

- 发现越权数据。
- 出现禁止字段泄漏。
- 错误数据导致管理层误判。
- 工具错误率持续超过 5%。
- P95 响应时间持续超过 15 秒。

- [ ] **Step 4: 收集体验反馈**

反馈只记录：

- 问题是否解决。
- 数据是否正确。
- 图表或表格是否易读。
- 是否还需要追问。
- 是否出现了不需要的信息。

不得在反馈中保存敏感业务数据。

- [ ] **Step 5: 提交**

```bash
git add docs/agent-ux docs/README.md
git commit -m "Add agent rollout and feedback plan"
```
