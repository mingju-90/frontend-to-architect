# AI 智能体工具契约

## 1. 目标

工具契约把原后端 API 封装成模型可使用、Node 可验证、用户可审计的业务能力。

工具不是简单代理接口。每个工具必须明确：

- 谁能调用。
- 能读取或修改什么数据。
- 参数范围是什么。
- 是否需要人工确认。
- 失败如何恢复。
- 结果如何裁剪给模型。

## 2. 工具分类

| 类型 | 示例 | 是否允许自动执行 | 审计 |
| --- | --- | --- | --- |
| 查询 | 查询项目、任务、设备、缺陷 | 是 | 记录调用摘要 |
| 分析 | 汇总、对比、生成建议 | 是 | 记录输入和引用 |
| 草稿 | 生成报告草稿、任务预览 | 是 | 记录草稿 |
| 写入 | 创建任务、取消任务、导出报告 | 否，必须确认 | 完整审计 |
| 关键操作 | 启动设备、修改真实航线 | 不开放给 Agent | 原平台安全链路 |

## 3. 工具定义

```ts
type ToolContext = {
  userId: string
  tenantId: string
  accessToken: string
  requestId: string
  runId: string
}

type ToolDefinition<TInput, TOutput> = {
  name: string
  description: string
  inputSchema: ZodSchema<TInput>
  outputSchema: ZodSchema<TOutput>
  permission: string
  risk: 'read' | 'draft' | 'write' | 'critical'
  timeoutMs: number
  idempotency: 'none' | 'optional' | 'required'
  prepare?: (input: TInput, context: ToolContext) => Promise<unknown>
  execute: (input: TInput, context: ToolContext) => Promise<TOutput>
}
```

## 4. 只读工具示例

```ts
const GetInspectionOverview = defineTool({
  name: 'get_inspection_overview',
  description: '查询项目在指定时间范围内的巡检任务和异常概览',
  inputSchema: z.object({
    projectId: z.string().uuid(),
    from: z.string().datetime(),
    to: z.string().datetime(),
    severity: z.enum(['low', 'medium', 'high']).optional(),
  }),
  outputSchema: InspectionOverviewSchema,
  permission: 'inspection:read',
  risk: 'read',
  timeoutMs: 8000,
  idempotency: 'none',
  execute: async (input, context) => {
    await requireProjectAccess(input.projectId, context)
    return backend.getInspectionOverview(input, context)
  },
})
```

## 5. 写入工具示例

```ts
const PrepareCreateTask = defineTool({
  name: 'prepare_create_inspection_task',
  description: '生成巡检任务创建计划，不真正提交',
  inputSchema: CreateInspectionTaskSchema,
  outputSchema: TaskPreparationSchema,
  permission: 'inspection:create',
  risk: 'write',
  timeoutMs: 8000,
  idempotency: 'required',
  execute: async (input, context) => {
    await requireProjectOwner(input.projectId, context)
    await assertRouteAndDeviceAvailable(input, context)
    return createApprovalPreparation(input, context)
  },
})

const CommitCreateTask = defineTool({
  name: 'commit_create_inspection_task',
  description: '在用户确认后创建巡检任务',
  inputSchema: z.object({
    preparationId: z.string().uuid(),
    idempotencyKey: z.string().uuid(),
  }),
  outputSchema: CreatedTaskSchema,
  permission: 'inspection:create',
  risk: 'write',
  timeoutMs: 15000,
  idempotency: 'required',
  execute: async (input, context) => {
    const preparation = await consumeApprovedPreparation(input, context)
    return backend.createInspectionTask(preparation, context, input.idempotencyKey)
  },
})
```

## 6. 工具结果标准化

模型需要的不是原后端全部字段，而是：

- 稳定业务 ID。
- 状态和时间。
- 关键指标和摘要。
- 原始记录引用。
- 错误码和可操作建议。

以下内容通常不应进入模型：

- Token、密码、密钥。
- 内部数据库字段。
- 完整人物和联系方式。
- 原始视频和超大图片。
- 未经裁剪的日志。

## 7. 错误码建议

| 错误码 | 含义 |
| --- | --- |
| `TOOL_NOT_ALLOWED` | 当前用户不允许调用该工具 |
| `TOOL_INPUT_INVALID` | 参数结构或业务范围非法 |
| `RESOURCE_NOT_ACCESSIBLE` | 资源不存在或用户无权访问 |
| `APPROVAL_REQUIRED` | 需要人工确认 |
| `APPROVAL_EXPIRED` | 确认已过期 |
| `IDEMPOTENCY_CONFLICT` | 幂等键对应其他操作 |
| `BACKEND_TIMEOUT` | 原后端超时 |
| `BACKEND_CONFLICT` | 业务状态冲突 |
| `MODEL_UNAVAILABLE` | 模型不可用 |

## 8. 审计字段

每次重要工具调用至少记录：

- `runId`
- `toolName`
- `userId`
- `tenantId`
- `projectId`
- `inputSummary`
- `permissionResult`
- `approvalId`
- `idempotencyKey`
- `backendRequestId`
- `status`
- `errorCode`
- `startedAt`
- `finishedAt`

## 9. 客户端动作契约

客户端动作是前端白名单操作，不是服务端业务工具。

```ts
type ClientActionDefinition<TParams> = {
  id: string
  description: string
  paramsSchema: ZodSchema<TParams>
  permission?: string
  preconditions: string[]
  result: string
  handler: (params: TParams) => Promise<void> | void
}
```

示例：

```ts
const OpenTaskForm = defineClientAction({
  id: 'task.open_create_form',
  description: '打开创建子任务表单',
  paramsSchema: z.object({
    projectId: z.string().uuid(),
    parentTaskId: z.string().uuid(),
  }),
  permission: 'task:create',
  preconditions: ['当前用户拥有 task:create 权限'],
  result: '打开表单并预填父任务',
  handler: ({ projectId, parentTaskId }) => {
    router.push({
      name: 'task-create',
      params: { projectId },
      query: { parentTaskId },
    })
  },
})
```

规则：

- 模型只能输出注册过的 `actionId`。
- 前端执行前再次校验参数和前置条件。
- 客户端动作不能直接写原后端。
- 需要业务写入时，先执行客户端动作打开表单，再通过 Server Tool 和审批完成提交。

对应文档：[前端交互知识库与客户端动作](./frontend-interaction-knowledge.md)。
