const ARCHITECT_GUIDE = {
  stages: [
    {
      id: "foundation",
      number: "01",
      title: "前端起步",
      description:
        "先理解浏览器、页面结构、样式系统和 JavaScript 语言模型，形成可独立完成页面和交互的能力。",
    },
    {
      id: "application",
      number: "02",
      title: "前端应用与工程",
      description:
        "从会写页面走向会维护应用，掌握类型系统、Vue、React、状态、数据流、测试、构建和性能。",
    },
    {
      id: "backend",
      number: "03",
      title: "服务端与数据",
      description:
        "进入 Node、HTTP、接口、认证授权、SQL、事务、索引、缓存、队列和可观测性，打通完整业务链路。",
    },
    {
      id: "production",
      number: "04",
      title: "生产与架构",
      description:
        "理解容器、CI/CD、容量、可靠性、安全、合规、系统设计和技术演进，开始承担系统级责任。",
    },
    {
      id: "agent",
      number: "05",
      title: "AI 智能体全栈项目",
      description:
        "用 Vue 3、Node 中间层和 DeepSeek 构建自然语言操作平台，在不改后端接口的前提下封装工具、权限、审批、审计和完整开发流程。",
    },
    {
      id: "architect",
      number: "06",
      title: "全栈架构师",
      description:
        "从需求、领域、取舍、风险、成本和团队工程能力出发，做能够落地并长期演进的架构决策。",
    },
  ],
  chapters: [],
};

const architectChapter = (chapter) => {
  ARCHITECT_GUIDE.chapters.push(chapter);
};

window.ARCHITECT_GUIDE = ARCHITECT_GUIDE;
