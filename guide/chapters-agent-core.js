architectChapter({
  id: "agent-project-scope",
  stageId: "agent",
  level: "L3",
  title: "AI 智能体项目：目标、边界与用户流程",
  subtitle: "先定义自然语言能做什么，再讨论模型和代码",
  tags: ["AI 智能体", "产品边界", "用户流程", "权限"],
  summary:
    "这个项目不是做一个通用聊天框，而是让用户通过自然语言查询、分析和提交无人机巡检业务操作，同时保持原后端不变。",
  core: [
    {
      heading: "项目目标与能力清单",
      paragraphs: [
        "第一阶段目标是做一个只读 Copilot：用户可以用自然语言查询项目、设备、航线、巡检任务、缺陷、图片和报告。Node 中间层把原后端已有 API 封装成工具，DeepSeek 负责理解问题、选择工具、解释结果和组织答案。",
        "第二阶段才开放受控写操作，例如创建巡检任务、提交报告草稿、导出结果。写操作必须经过权限校验、确认卡片和幂等提交。第三阶段再考虑知识库、复杂分析和更丰富的报告生成。这样安排能让工具选择、权限和审计先稳定下来。",
      ],
      bullets: [
        "只读：查询、筛选、汇总、对比和解释。",
        "受控写入：创建任务、提交草稿和导出报告。",
        "禁止直接控制：AI 不直接启动、返航或改变真实无人机航线。",
      ],
    },
    {
      heading: "关键用户流程",
      paragraphs: [
        "典型流程是：用户选择项目和上下文，用自己的账号登录，提出问题；Node 校验身份和权限，构造允许使用的工具列表；DeepSeek 选择工具；Node 调用原后端并标准化结果；模型基于工具结果生成答案；前端用 SSE 展示文字、工具过程和引用。",
        "写操作会在工具层拆成 prepare 和 commit。prepare 只生成操作计划和确认卡片，不产生副作用；用户确认后，commit 才调用原后端。这样用户知道将创建什么、影响哪个项目、由谁执行，也能避免模型误解直接产生业务动作。",
      ],
      bullets: [
        "每个运行都有 runId、用户、租户、项目和状态。",
        "每个工具调用都有参数、结果、耗时和错误。",
        "高风险动作必须有确认和审计。",
      ],
      code: {
        language: "text",
        text: "只读查询：\n用户 -> Vue3 -> Node BFF -> DeepSeek -> Tool -> 原后端 -> 结果\n\n受控写入：\n用户 -> prepare -> 确认卡片 -> commit -> 原后端 -> 审计",
      },
    },
    {
      heading: "不改后端的真实含义",
      paragraphs: [
        "不改后端接口意味着 Node 只能调用现有 API，或者对现有接口做适配、聚合和裁剪。Node 不能凭空创造原后端没有的业务事务、权限或设备控制能力。只读查询可以考虑读副本，但写操作必须走现有接口。",
        "如果现有接口缺少能力，应该把需求记录为后端接口需求，或者在 Node 中提供明确受限的降级功能。不能让 Agent 直接访问主数据库、绕过权限或自行模拟原业务系统。",
      ],
      bullets: [
        "Node 是 BFF、Agent Gateway 和 Adapter，不是新的业务主库。",
        "原后端仍然是事实来源和最终授权者。",
        "无法安全实现的能力先不开放。",
      ],
    },
  ],
  why:
    "AI 智能体最容易失败的方式，是先做聊天框，再发现权限、数据和操作边界都没有定义。先锁定业务能力和风险，后面的模型、工具和前端交互才有稳定目标。",
  goals: [
    "能写出第一阶段只读能力和禁止能力清单。",
    "能画出从自然语言到原后端 API 的完整流程。",
    "能区分查询、草稿、写入和设备控制四类风险。",
  ],
  practice:
    "写出 20 条真实用户问题，标注每条问题需要哪些原后端接口、工具、权限和是否需要人工确认。",
  acceptance: [
    "每个场景都有明确输入、工具、结果和失败行为。",
    "没有未定义权限边界的写操作。",
    "所有高风险动作都经过 prepare/commit。",
  ],
  pitfalls: [
    "把智能体设计成什么都能做的通用聊天机器人。",
    "让模型直接生成接口 URL 或 SQL。",
    "在没有接口的情况下让 Node 直接修改业务库。",
  ],
  architectLens:
    "架构师首先要定义业务边界和失败影响。这个项目的核心不是模型有多聪明，而是让自然语言进入一个可控、可审计、可恢复的业务执行链。",
});

architectChapter({
  id: "agent-node-selection",
  stageId: "agent",
  level: "L3",
  title: "Node 中间层框架选型",
  subtitle: "Express、Fastify、NestJS 的对比与最终选择",
  tags: ["Node", "Fastify", "NestJS", "Express", "选型"],
  summary:
    "这个项目选择 Fastify + TypeScript + Zod 作为默认 Node 框架，兼顾低学习成本、流式输出、插件边界和后续模块化。",
  core: [
    {
      heading: "为什么优先 Fastify",
      paragraphs: [
        "Fastify 的请求模型简单，路由、Hook、插件和 Schema 边界清晰。它原生支持 JSON Schema，性能好，TypeScript 体验稳定，SSE 和原始响应也容易控制。对于从 Vue 3 转过来的开发者，Fastify 比 NestJS 少一层依赖注入和装饰器抽象，更容易看清请求如何进入路由、如何调用工具和如何返回流。",
        "Agent 中间层的核心差异在于它同时要做鉴权、工具执行、SSE、日志、模型调用和审计。Fastify 的插件机制足以把这些能力组织起来，同时不会一开始就引入大量框架概念。先用简单边界验证业务，等模块、团队和治理需求真实出现后再考虑更重的框架。",
      ],
      bullets: [
        "推荐组合：Node.js 22 + Fastify + TypeScript + Zod。",
        "适合做 BFF、API Gateway、工具执行和 SSE。",
        "保持业务逻辑在普通 TypeScript 模块中，不让路由文件变胖。",
      ],
      code: {
        language: "typescript",
        text: "import Fastify from \"fastify\"\nimport { z } from \"zod\"\n\nconst app = Fastify({ logger: true })\n\napp.post(\"/api/agent/runs\", async (request, reply) => {\n  const input = CreateRunSchema.parse(request.body)\n  return reply.code(202).send({ runId: await createRun(input) })\n})",
      },
    },
    {
      heading: "对比 Express 和 NestJS",
      paragraphs: [
        "Express 生态成熟、资料多，但插件、Schema、错误处理和模块边界更依赖团队自觉。它可以做这个项目，但大型 Agent BFF 很容易演变成中间件堆叠和路由直接调用上游。对于需要 SSE、权限、审计和工具注册的项目，Fastify 的约束更强但仍然轻量。",
        "NestJS 适合已经有微服务、团队规模较大、需要统一依赖注入和模块治理的组织。它提供 Guard、Pipe、Interceptor、模块和依赖注入，但这些能力也提高学习成本。若团队已经大量使用 NestJS，可以继续使用；如果从一个前端开发者自学开始，默认先用 Fastify。",
      ],
      bullets: [
        "Express：生态最广，但结构和校验更依赖团队约定。",
        "Fastify：推荐首选，轻量、类型友好、流式控制清晰。",
        "NestJS：适合已有强治理需求或团队已有统一实践。",
      ],
    },
    {
      heading: "选型步骤总结",
      paragraphs: [
        "先把需求按 BFF、工具执行、SSE、鉴权、持久化、队列和运维分类；再列出团队最熟悉的技术和必须遵守的运行环境；然后对每个框架评估学习成本、模块边界、流式能力、生态和长期维护，最后用一个最小请求链路验证性能与调试体验。",
        "选型结论不是永久承诺。可以用 Fastify 先完成 MVP，并用清晰的插件和模块边界保留替换可能性。框架选型的真正目标是让业务调用链容易理解和测试，而不是获得最大规模的抽象。",
      ],
      bullets: [
        "需求清单：鉴权、流式、工具、队列、日志、测试。",
        "约束清单：Node 版本、部署环境、团队经验、合规要求。",
        "验证清单：SSE、错误处理、Schema、连接池和优雅停机。",
      ],
    },
  ],
  why:
    "Node 框架决定项目初期的学习负担和代码边界。对不熟悉 Node 的前端开发者，能读懂完整请求链，比一开始引入大量企业级抽象更重要。",
  goals: [
    "能说明三种框架的适用场景和代价。",
    "能用 Fastify 搭建最小请求和 SSE 服务。",
    "能把路由、业务、工具和存储拆成清晰模块。",
  ],
  practice:
    "分别用 Fastify 和 Express 实现一个带鉴权、错误响应和 SSE 的最小接口，比较代码量、调试方式和边界。",
  acceptance: [
    "能解释为什么本阶段不选择 NestJS。",
    "Fastify 路由中出现复杂的模型编排，说明边界已经失控。",
    "SSE、错误处理和优雅停机可在本地验证。",
  ],
  pitfalls: [
    "因为某个框架流行就跳过需求分析。",
    "把所有业务都写进 Fastify route handler。",
    "一开始就引入依赖注入、注册器、策略工厂等多层抽象。",
  ],
  architectLens:
    "架构师选框架时会优先考虑团队的认知成本和维护路径，而不是只比较性能数字。Fastify 的价值是足够快、足够清晰，也足够容易在后期重新分层。",
});

architectChapter({
  id: "agent-fastify-scaffold",
  stageId: "agent",
  level: "L3",
  title: "Fastify 项目骨架与模块边界",
  subtitle: "从最小可运行服务到可扩展的 Agent BFF",
  tags: ["Fastify", "项目结构", "TypeScript", "Zod"],
  summary:
    "先用最少目录建立可运行的 Agent BFF，再按真实职责增加模块，不一开始就制造复杂抽象。",
  core: [
    {
      heading: "推荐目录结构",
      paragraphs: [
        "应用入口只负责环境、插件、路由注册和关机。每个业务能力放在独立模块中，模块内部再分 route、service、schema 和 adapter。工具定义独立于路由，模型调用独立于业务服务，避免职责混在一起。",
        "建议初始使用一个应用包，而不是马上拆成多个服务。等工具调用、模型调用或后台任务出现独立扩容和部署需求时，再抽出 package 或服务。对学习者来说，先看懂一条完整调用链比看懂十个包更重要。",
      ],
      bullets: [
        "src/app.ts：创建 Fastify 实例并注册插件。",
        "src/server.ts：监听端口、处理信号和优雅停机。",
        "src/modules：run、conversation、approval、auth、audit。",
        "src/tools：工具契约和执行器。",
        "src/model：DeepSeek 适配器。",
        "src/adapters：原后端 API 客户端。",
      ],
      code: {
        language: "text",
        text: "apps/agent-api/src/\n  app.ts\n  server.ts\n  config/\n  plugins/\n  modules/\n    auth/\n    conversations/\n    runs/\n    approvals/\n  tools/\n    registry.ts\n    inspection-tools.ts\n  model/\n    deepseek-client.ts\n  adapters/\n    backend-client.ts\n  storage/\n    redis.ts\n    postgres.ts",
      },
    },
    {
      heading: "最小可运行链路",
      paragraphs: [
        "第一版只实现健康检查、登录态传递、一个聊天接口和 SSE。先不要接数据库、向量库和复杂工具。确认请求、鉴权、模型响应、流式事件、错误和关闭连接都能正常工作，再增加业务能力。",
        "接口契约用 Zod 校验，响应统一包含 requestId。所有上游调用设置超时。日志包含 runId、requestId、工具名、模型名和耗时，但不记录 Token、密码和完整业务敏感数据。",
      ],
      bullets: [
        "第一阶段只打通聊天和 SSE。",
        "第二阶段加入一个只读工具。",
        "第三阶段再加入持久化、审批和审计。",
      ],
    },
    {
      heading: "配置、错误和优雅停机",
      paragraphs: [
        "环境变量在启动时通过 Schema 校验，错误配置直接退出。请求错误通过统一错误处理器转换成稳定错误码。未知错误记录堆栈，客户端只看到错误码和 requestId。",
        "收到 SIGTERM 后先停止接收新请求，通知正在运行的任务进入取消状态，再关闭 Redis、数据库和后台队列。SSE 连接需要发送结束事件或由客户端重连到持久状态查询接口。",
      ],
      bullets: [
        "启动失败优先于运行时随机失败。",
        "错误模型从第一天就统一。",
        "流式连接与持久运行状态分离。",
      ],
    },
  ],
  why:
    "前端开发者第一次做 Node 项目时，最大的风险不是不会写接口，而是所有东西都塞进一个文件，导致权限、模型、工具和数据库互相依赖。",
  goals: [
    "能建立最小 Fastify 项目并启动。",
    "能按真实职责拆分 route、service、tool 和 adapter。",
    "能实现统一配置、错误和停机。",
  ],
  practice:
    "从零搭建 Agent BFF，完成健康检查、聊天接口、SSE、Zod 校验、统一错误和 SIGTERM 停机。",
  acceptance: [
    "路由文件只处理协议和调用服务。",
    "工具和模型不直接依赖 HTTP 请求对象。",
    "服务可以优雅关闭且不丢失连接或资源。",
  ],
  pitfalls: [
    "一开始就拆成多个微服务。",
    "把工具、Prompt、数据库和 SSE 全写在一个路由文件。",
    "环境变量缺失时仍然启动服务。",
  ],
  architectLens:
    "好的项目骨架不是目录越多越好，而是每层只有一个清楚职责。架构师要让普通开发者能在一个文件里读完一段完整业务，同时保持边界可测试。",
});

architectChapter({
  id: "agent-auth-context",
  stageId: "agent",
  level: "L3",
  title: "身份、权限与上下文透传",
  subtitle: "不改后端接口，如何保证 Agent 继承真实用户权限",
  tags: ["认证", "授权", "Token", "多租户", "上下文"],
  summary:
    "Agent 中间层必须继承真实用户身份。前端登录态进入 Node 后，Node 在调用原后端时透传用户凭证，并在工具层额外做资源和动作校验。",
  core: [
    {
      heading: "身份进入和 Token 透传",
      paragraphs: [
        "Vue 3 登录后拿到原后端或统一认证系统签发的会话凭证。请求 Agent BFF 时携带 Cookie 或 Authorization。Node 不把 Token 拼进 Prompt，也不在日志中输出完整 Token。调用原后端时，使用同一用户凭证或对等服务令牌，并明确原后端最终的授权规则。",
        "如果原后端使用 Cookie，Node 需要正确转发 Cookie、处理 SameSite 和 CSRF；如果使用 JWT，Node 只解析必要声明，并把 Token 保留在服务端请求上下文。任何模型都无法看到原始凭证。",
      ],
      bullets: [
        "用户身份由统一认证系统产生。",
        "Node 只传身份上下文，不自己伪造角色。",
        "服务账号只能用于明确的系统任务和最小权限。",
      ],
      code: {
        language: "typescript",
        text: "type RequestContext = {\n  userId: string\n  tenantId: string\n  accessToken: string\n  projectIds: string[]\n}\n\n// 只把 userId、tenantId、项目范围传给 Agent，\n// accessToken 只用于 Backend Adapter 发起原后端请求。",
      },
    },
    {
      heading: "工具权限和资源归属",
      paragraphs: [
        "每轮运行先根据用户身份计算可用工具。查询任务时传入项目 ID，Node 先确认用户能访问项目，再调用原后端。用户可能在 URL 或对话中提交其他项目 ID，权限过滤必须在服务端完成。",
        "模型不应该自己决定用户是否有权限。模型只能提出工具调用意图，Node 通过权限策略和原后端响应共同判断。没有权限时返回稳定错误，并让 Agent 向用户说明失败原因。",
      ],
      bullets: [
        "工具列表按用户权限收缩。",
        "参数中的资源 ID 必须重新做资源归属校验。",
        "原后端拒绝时不要伪装成成功。",
      ],
    },
    {
      heading: "上下文和敏感数据边界",
      paragraphs: [
        "用户的当前项目、任务、页面和选中记录可以作为上下文传给 Agent，但必须标注来源和权限范围。项目描述、巡检报告和设备信息可能包含敏感数据，传给模型前应执行脱敏、裁剪和最小化。",
        "上下文不能替代实时查询。用户上下文只用于理解意图，真正的事实状态必须通过工具回源确认。这样能避免用户切换项目后模型仍使用旧上下文。",
      ],
      bullets: [
        "上下文带 userId、tenantId 和资源 ID。",
        "模型只接收完成当前任务所需字段。",
        "事实数据每次通过工具确认。",
      ],
    },
  ],
  why:
    "AI 中间层最危险的问题是使用一个权限过大的服务账号调用原后端。只要模型选择错工具或参数被伪造，就可能造成跨项目、跨租户的数据泄漏。",
  goals: [
    "能画出 Vue 3 到 Node 再到原后端的身份链路。",
    "能为工具建立权限、租户和资源归属校验。",
    "能在交给模型前脱敏和裁剪上下文。",
  ],
  practice:
    "实现登录、项目切换、Agent 请求和原后端调用，覆盖 OWNER、MEMBER 和越权项目 ID 测试。",
  acceptance: [
    "模型上下文中不存在原始 Token。",
    "伪造项目 ID、任务 ID 和设备 ID 全部被拒绝。",
    "权限被撤销后旧的 Agent 上下文不能继续访问数据。",
  ],
  pitfalls: [
    "用管理员服务账号代表所有用户调用后端。",
    "把 JWT 放进 Prompt 帮助模型理解权限。",
    "只在前端过滤项目列表，不在 Node 和原后端校验。",
  ],
  architectLens:
    "架构师要把身份、租户、资源和动作统一定义成一个权限模型。Agent、BFF、队列和后台任务都必须沿用同一模型，不能各自实现一套近似判断。",
});

architectChapter({
  id: "agent-tool-design",
  stageId: "agent",
  level: "L3",
  title: "把现有后端 API 封装成 Agent 工具",
  subtitle: "工具契约、参数校验、结果裁剪、写入确认和审计",
  tags: ["Tool Calling", "Adapter", "Zod", "幂等", "审批"],
  summary:
    "工具是模型能力与真实业务之间的唯一桥。模型只能提出调用意图，Node 负责验证参数、权限、风险和原后端调用。",
  core: [
    {
      heading: "工具契约",
      paragraphs: [
        "每个工具包含名称、用途、输入 Schema、输出 Schema、权限范围、风险等级、超时、幂等策略和执行函数。工具描述要面向模型，但执行函数只接收已验证的结构化输入，不接收自然语言和任意 URL。",
        "工具应与业务意图接近，而不是机械复制每一个后端接口。例如 get_inspection_overview 可以聚合任务、缺陷和媒体摘要；list_inspection_tasks 则只负责查询。工具过多会让模型选择困难，工具过粗又难以校验权限。",
      ],
      bullets: [
        "读工具默认无副作用。",
        "草稿工具只生成结果，不写入业务状态。",
        "写工具必须声明权限、确认和幂等要求。",
      ],
      code: {
        language: "typescript",
        text: "const GetTaskDetail = defineTool({\n  name: \"get_task_detail\",\n  description: \"查询指定巡检任务详情\",\n  input: z.object({ taskId: z.string().uuid() }),\n  permission: \"inspection:read\",\n  risk: \"read\",\n  timeoutMs: 5000,\n  execute: async (input, context) => backend.getTask(input.taskId, context),\n})",
      },
    },
    {
      heading: "结果标准化和裁剪",
      paragraphs: [
        "原后端响应可能包含数据库字段、内部状态和大量媒体信息。Adapter 应转换成稳定的工具结果，只保留模型需要的 ID、状态、时间、摘要和引用。图片、视频和遥测数据返回元数据或分析结果，不把原文件内容直接塞进文本模型。",
        "工具结果作为外部内容再次进入模型时，必须视为不可信数据。它可以提供事实依据，但不能修改系统规则、工具白名单或权限策略。工具结果中出现的指令应作为普通文本展示和引用。",
      ],
      bullets: [
        "结果字段稳定、少而明确。",
        "保留原始记录链接和引用标识。",
        "过滤内部字段、敏感字段和超大内容。",
      ],
    },
    {
      heading: "写工具的两阶段设计",
      paragraphs: [
        "prepare_create_task 接收自然语言解析后的参数，校验项目、时间、设备、航线和用户权限，生成确认卡片和准备记录。用户确认后，commit_create_task 使用 prepare 记录和 idempotencyKey 调用原后端。",
        "prepare 不能写入原业务状态。commit 必须重新检查资源状态，因为用户确认期间任务可能已被取消、项目权限可能变化、设备可能进入不可用状态。重复 commit 返回同一个业务结果。",
      ],
      bullets: [
        "prepare 记录有 owner、过期时间和状态。",
        "commit 使用用户身份而不是服务账号越权执行。",
        "审计记录包含原始自然语言、参数摘要和原后端响应。",
      ],
    },
  ],
  why:
    "模型不会自动理解后端接口、权限和事务。Tool Layer 是安全边界，也是把普通 API 变成可控 Agent 能力的核心工程。",
  goals: [
    "能把一个原后端接口转换成清晰工具契约。",
    "能区分读工具和写工具的权限、确认与幂等策略。",
    "能标准化工具结果并防止间接提示注入。",
  ],
  practice:
    "选择项目、任务、缺陷和报告四类接口，分别实现读工具；再实现创建任务的 prepare/commit 两阶段写工具。",
  acceptance: [
    "模型无法调用未注册工具或任意 URL。",
    "写操作未确认时不会产生任何业务副作用。",
    "重复提交同一个幂等键不会重复创建任务。",
  ],
  pitfalls: [
    "让模型直接输出 SQL 或内部接口地址。",
    "把整个后端响应原样交给模型。",
    "prepare 阶段就调用原后端写接口。",
  ],
  architectLens:
    "工具设计体现了架构边界。架构师要控制模型能做什么、如何验证、失败如何恢复，而不是增加更多 Prompt 让模型“自觉”。",
});

architectChapter({
  id: "agent-deepseek",
  stageId: "agent",
  level: "L3",
  title: "DeepSeek 接入与 Prompt 编排",
  subtitle: "模型调用、工具选择、流式、结构化输出和降级",
  tags: ["DeepSeek", "Prompt", "Tool Calling", "流式输出"],
  summary:
    "DeepSeek 负责理解、规划和组织语言，Node 负责提供确定性的工具、权限和错误边界。模型能力必须以当前账号和官方文档为准。",
  core: [
    {
      heading: "模型调用边界",
      paragraphs: [
        "DeepSeek API Key 只存在 Node 服务端的 Secret 中。前端只调用自己的 Agent BFF。Node 根据任务选择模型：普通问答和工具编排使用稳定、成本可控的对话模型；复杂分析和长报告可使用推理能力更强的模型。模型名、上下文限制、流式、Tool Calling 和 JSON 能力要以当前官方文档和账号可用模型为准。",
        "每次模型请求只发送必要上下文：系统策略、用户目标、允许工具、历史摘要和经过裁剪的工具结果。不要把整个数据库、文件或完整 Token 带入模型。",
      ],
      bullets: [
        "模型只访问服务端，不经过浏览器。",
        "模型选择独立于业务逻辑，随时可以替换。",
        "Prompt、模型版本和参数进入运行记录。",
      ],
      code: {
        language: "typescript",
        text: "const response = await deepseek.chat.completions.create({\n  model: \"deepseek-chat\",\n  messages,\n  tools: availableTools,\n  stream: true,\n  temperature: 0.1,\n})",
      },
    },
    {
      heading: "Prompt 分层与工具选择",
      paragraphs: [
        "系统 Prompt 说明身份、权限边界、工具使用规则、禁止动作和回答要求；用户 Prompt 说明当前目标和上下文；工具结果单独作为数据消息，不混入系统指令。工具描述要短而明确，每个工具只负责一个可解释的业务能力。",
        "如果模型直接支持 Tool Calling，优先使用官方协议。如果当前模型或账号的工具调用支持不稳定，就让模型输出严格 JSON 计划，再由 Node 用 Zod 校验并执行。无论哪种方式，执行前都必须校验工具名、参数、权限和风险等级。",
      ],
      bullets: [
        "系统规则与外部数据严格分离。",
        "工具选择失败要能重新规划而不是盲目重试。",
        "输出不是最终事实，工具结果才提供业务事实。",
      ],
    },
    {
      heading: "流式输出和降级",
      paragraphs: [
        "模型流式响应可以通过 SSE 转发给 Vue 3。前端显示 text delta、tool started、tool completed、approval required 和 artifact ready 事件。工具执行和审批是结构化事件，不能混在模型文本里。",
        "模型超时、限流或供应商故障时，可以提供最近一次工具结果、改为非流式结果、返回明确失败或让用户重试。错误不能伪造答案，也不能自动执行写入工具作为降级。",
      ],
      bullets: [
        "流式只影响展示，不影响运行状态持久化。",
        "模型失败有稳定错误码和重试策略。",
        "费用和 Token 纳入每次运行记录。",
      ],
    },
  ],
  why:
    "DeepSeek 是核心能力来源，但也是不可确定、可能限流和需要治理的外部依赖。接入层必须让模型可替换、可观测、可降级。",
  goals: [
    "能安全地在 Node 中配置 DeepSeek Key。",
    "能分层构造 Prompt 并使用工具调用。",
    "能处理流式、超时、限流和结构化输出失败。",
  ],
  practice:
    "实现一个聊天接口，支持 DeepSeek 流式输出、一个只读工具、工具事件和模型失败降级。",
  acceptance: [
    "浏览器中不存在 DeepSeek Key。",
    "模型输出未经 Schema 校验不会执行工具。",
    "限流和超时不会造成写入操作重复执行。",
  ],
  pitfalls: [
    "把 DeepSeek Key 放到 Vue 环境变量。",
    "让模型自由拼接后端 URL。",
    "依赖自然语言解析所有 JSON 结果。",
  ],
  architectLens:
    "模型适配器应屏蔽供应商差异，让业务只依赖统一的调用结果、工具事件、Token 统计和错误模型。这样未来更换模型不需要重写整个 Agent。",
});

architectChapter({
  id: "agent-runtime",
  stageId: "agent",
  level: "L3",
  title: "Agent Runtime 与状态机",
  subtitle: "规划、工具循环、暂停、审批、恢复、取消和限制",
  tags: ["Agent Runtime", "状态机", "恢复", "取消"],
  summary:
    "Agent 不是一次模型调用，而是一段有状态、有边界、可暂停和可审计的运行过程。",
  core: [
    {
      heading: "运行状态",
      paragraphs: [
        "一次 run 从 RECEIVED 开始，经过 PLANNING、TOOL_RUNNING，可能进入 WAITING_APPROVAL、COMPLETED、FAILED 或 CANCELLED。状态存放在 Redis 或 PostgreSQL，并关联用户、会话、当前项目和模型版本。",
        "每一步都记录输入摘要、模型响应、工具调用、工具结果、耗时、Token 和错误。这样断线、部署重启或模型升级后，运行仍可恢复和回放。",
      ],
      bullets: [
        "状态机是业务事实，不只是 UI 状态。",
        "工具结果写入运行记录后再进入下一步。",
        "取消是状态流转，不等于直接杀掉进程。",
      ],
      code: {
        language: "text",
        text: "RECEIVED -> PLANNING -> TOOL_RUNNING\n  -> WAITING_APPROVAL -> EXECUTING -> COMPLETED\n  -> FAILED\n  -> CANCELLED",
      },
    },
    {
      heading: "工具循环和限制",
      paragraphs: [
        "Agent Runtime 向模型提供工具，执行返回结果，再把结果交回模型继续判断。必须限制最大规划轮数、最大工具调用次数、单工具超时和总运行时间。达到限制时返回已有结果，不要继续循环。",
        "模型重复调用相同工具、参数相同且没有新信息时，应停止或要求用户澄清。工具失败要区分可重试、权限拒绝和业务冲突，不能把所有错误都返回给模型继续猜。",
      ],
      bullets: [
        "默认最大 6 轮规划、12 次工具调用。",
        "读工具可以有限重试，写工具依靠幂等和确认。",
        "达到限制后保留中间结果并解释原因。",
      ],
    },
    {
      heading: "暂停、恢复和取消",
      paragraphs: [
        "等待审批时，运行暂停但状态不丢失。用户确认后恢复时重新加载最新权限和资源状态，再执行 commit。浏览器断开不取消运行，用户主动取消时发送取消信号给模型流和工具执行。",
        "原后端已经成功执行的写操作不能在前端伪装成“取消成功”。这种情况下应展示真实结果，并提供后续撤销或补偿流程。",
      ],
      bullets: [
        "审批有超时和过期状态。",
        "恢复时重新校验权限和资源。",
        "取消的边界必须明确到模型、工具或原后端任务。",
      ],
    },
  ],
  why:
    "没有运行状态机，Agent 就只能依赖前端连接和模型上下文。断线、审批、失败和取消都会变成无法解释的行为。",
  goals: [
    "能设计一次运行的完整状态流转。",
    "能限制模型循环并处理重复工具调用。",
    "能实现暂停、恢复、取消和回放。",
  ],
  practice:
    "实现一个 Agent Runtime，支持只读工具循环、审批暂停、恢复和取消，并保存完整运行记录。",
  acceptance: [
    "刷新或断线后可以查询同一 run。",
    "审批未完成时不会执行写工具。",
    "重复恢复不会重复调用 commit。",
  ],
  pitfalls: [
    "把运行状态只放在前端内存。",
    "无限允许模型调用工具。",
    "用户取消时杀掉进程却没有记录结果。",
  ],
  architectLens:
    "Agent Runtime 是小型分布式工作流。架构师需要定义状态、边界、恢复和幂等，而不是只关心模型输出是否看起来合理。",
});
