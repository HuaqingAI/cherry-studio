---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: '基于 Cherry Studio 改造企业级 AI 能力工具，并接入上游 AI Gateway 的一键授权登录'
session_goals: '梳理现有项目能力、识别可复用架构、讨论企业级改造方向，并设计无需手动配置 API Key 的授权登录即用接入方案'
selected_approach: 'progressive-flow'
techniques_used: ['What If Scenarios', 'Ecosystem Thinking', 'Morphological Analysis', 'Decision Tree Mapping']
ideas_generated:
  - '员工AI工作台外壳'
  - '登录即注入能力'
  - '企业能力装配层'
  - '通用+岗位专属双层能力包'
  - '混合型首页'
  - '双通道首页入口'
  - '企业统一首页Agent'
  - '身份优先编排'
  - '能力包整体发放'
  - 'AI Infra统一能力源'
  - '资源级分发'
  - '规则+Agent混合编排'
  - '远端资源即时消费'
  - '现有容器优先承接'
context_file: ''
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** hth
**Date:** 2026-05-29 21:39:53

## Session Overview

**Topic:** 基于 Cherry Studio 改造企业级 AI 能力工具，并接入上游 AI Gateway 的一键授权登录
**Goals:** 梳理现有项目能力、识别可复用架构、讨论企业级改造方向，并设计无需手动配置 API Key 的授权登录即用接入方案

### Context Guidance

- 项目主体是 Electron 桌面端，但内部已经具备平台化雏形：Provider 抽象、AI Core、Agent/MCP、知识库、Local HTTP API、生命周期服务容器。
- 仓库当前处于 v2 重构期，数据层和主进程服务体系已经相对成型，适合作为企业级能力底座继续演进。
- OAuth 登录与聚合型 Provider 已有样板，不需要从零设计。

### Session Setup

- 当前讨论将优先基于 `docs/` 与关键源码事实，先明确“现状能力”和“可复用资产”。
- 重点关注两条主线：
  1. 如何把当前偏个人桌面 AI 客户端演进为企业级 AI 能力工作台。
  2. 如何把现有单 Provider OAuth 模式抽象为可对接上游 AI Gateway 的统一授权登录接入模式。

## Technique Selection

**Approach:** Progressive Technique Flow  
**Journey Design:** 从产品角色发散，到系统关系识别，再到方案组合和落地路径

**Progressive Techniques:**

- **Phase 1 - Exploration:** What If Scenarios
- **Phase 2 - Pattern Recognition:** Ecosystem Thinking
- **Phase 3 - Development:** Morphological Analysis
- **Phase 4 - Action Planning:** Decision Tree Mapping

## Phase 1 Exploration Notes

**[Category #1]**: 员工AI工作台外壳  
_Concept_: 把 Cherry Studio 定位为员工统一 AI 工作台，基于企业上游 AI 基座提供的大模型 Token 与能力，让员工以极低门槛调用模型、知识、Agent 和业务工具完成日常工作。核心诉求不是“自由配置”，而是“开箱即用、默认可用、默认合规”。  
_Novelty_: 不再把产品中心放在聊天体验或模型配置，而是放在“企业能力预装 + 身份即权限 + 登录即使用”的员工工作入口。

**[Category #2]**: 登录即注入能力  
_Concept_: 员工登录后，不只是获得访问令牌，而是自动获得一整套已经装配好的工作能力，包括默认模型、默认助手、默认知识库、默认工作流、默认技能与默认权限边界。认证只是起点，真正的体验是“登录后马上开始做事”。  
_Novelty_: 把“登录”从认证动作升级为能力装配动作，弱化配置中心，强化默认交付。

**User Direction**:

- 企业版优先定位在“登录后直接按岗位拿到工作流和知识库”，甚至比这个再前进一步。
- 尽量不大肆破坏原先结构，优先基于现有内置助手、工作流、知识库、技能库等能力做企业化封装。

**[Category #3]**: 企业能力装配层  
_Concept_: 保留现有 Cherry Studio 的能力骨架，把企业化改造集中在装配层上，不重做助手、知识库、工作流和技能，而是在其上增加企业默认包、岗位包、权限包和登录装配包。  
_Novelty_: 不是替换原结构，而是给原结构加一层企业发行与编排层。

**[Category #4]**: 岗位能力包  
_Concept_: 企业管理员为不同岗位预设能力组合，如产品、销售、客服、研发、HR 各自绑定助手、知识库、工作流、技能、推荐模型和使用边界，员工登录后自动获得对应能力。  
_Novelty_: 不是所有人共用同一个 AI 外壳，而是把企业 AI 做成按角色发放的软件包。

**[Category #5]**: 双层能力包  
_Concept_: 企业能力应由“全员通用层”与“岗位专属层”组合构成。通用层提供统一的基础 AI 能力与企业公共知识，岗位层在此基础上叠加特定场景、专属知识、专属工作流与更细权限。  
_Novelty_: 避免“一刀切通用包”过浅，也避免“全岗位各自一套”维护成本过高，形成可复用又可定制的双层发行模型。

**[Category #6]**: 混合型首页  
_Concept_: 员工登录后进入的不是单一聊天页，也不是纯功能目录，而是一个混合首页：既保留自然语言入口，也直接暴露岗位能力卡片、知识入口、流程入口和推荐动作。  
_Novelty_: 让“会聊天的人”和“不会提 prompt 的人”都能立即开始工作，同时避免把企业能力埋进深层菜单。

**Homepage Direction**:

- 倾向混合型首页：既能聊天，也能点岗位能力卡片。

**[Category #7]**: 双通道首页入口  
_Concept_: 对不清楚要做什么的员工，首页提供“直接问AI”作为最低认知成本入口，甚至首次登录由 AI 主动发起引导；对熟练用户，则保留快捷选择口子，通过岗位助手、任务卡片、工作流和最近使用能力提升效率。  
_Novelty_: 不把所有用户强行放进同一种交互模式，而是把首页设计成“探索型入口 + 效率型入口”并存的双通道结构。

**[Category #8]**: 新手引导 + 熟手加速  
_Concept_: 首页同时服务新手与熟手。新手只需要表达“我要做什么”，熟手则快速进入岗位助手、工作流、知识入口与最近使用能力。  
_Novelty_: 不再把 onboarding 与高频效率路径混为一谈，而是通过分层入口同时兼顾普及率和效率。

**[Category #9]**: 首登主动引导AI  
_Concept_: 首次登录后由 AI 主动发起企业化 onboarding，对员工说明能做什么、推荐适合的入口，并把用户引导到合适的岗位能力包。  
_Novelty_: 把静态欢迎页升级为可对话、可分流、可装配的欢迎代理。

**[Category #10]**: 企业统一首页Agent  
_Concept_: 首页不是固定文案或固定助手，而是一个统一首页 Agent。它根据用户身份、岗位、权限、部门、知识可见范围和可用工作流，动态拼装欢迎内容、推荐能力和首屏快捷入口。  
_Novelty_: 不是“不同岗位做不同首页页面”，而是“同一个首页 Agent 按企业上下文动态编排首页能力”。

**[Category #11]**: 身份优先编排  
_Concept_: 首页 Agent 的首要编排依据不是用户行为数据，而是登录后即可确定的身份属性，如组织、部门、岗位、职级、权限和所属场景。系统先基于身份确定默认能力边界，再在后续逐步叠加行为优化。  
_Novelty_: 用“身份即默认能力”替代“先让用户自己探索”或“先依赖行为学习”，让开箱即用在首登时就成立。

**[Category #12]**: 能力包整体发放  
_Concept_: 助手、知识库、工作流、技能与工具权限不应作为孤立资源逐个分发，而应作为一个整体能力包一起交付给员工。员工获得的是“可工作的能力组合”，而不是若干需要自己理解和拼装的零件。  
_Novelty_: 将企业 AI 产品的分发单位从“单资源”升级为“可执行工作能力包”，更符合开箱即用目标。

**[Category #13]**: AI Infra统一能力源  
_Concept_: 助手内容、知识库、工作流、技能等能力应统一沉淀在企业 AI Infra 中，由 AI Infra 负责治理、管理、版本与分发。Cherry Studio 只是这些能力的一个工作台入口，而不是能力的唯一承载体；同一套能力还可以被 Codex 等更专业的 Agent 客户端复用。  
_Novelty_: 将产品从“企业版桌面客户端”提升为“企业 AI 能力分发网络中的一个前台终端”，从而天然支持多客户端共享同一能力底座。

**[Category #14]**: 资源级分发  
_Concept_: 修正前一轮假设后，Cherry Studio 从 AI Infra 获取的最小对象更应是单个资源，例如一个助手、一个知识库、一个工作流或一个技能。AI Infra 统一治理资源本身及其可见性，工作台入口再基于身份把这些资源组织成可用体验。  
_Novelty_: 系统中心从“模板分发”转向“资源注册表 + 入口编排”，让同一资源可以被 Cherry Studio、Codex 等不同客户端按各自方式消费。

**Correction Note**:

- 前一轮“能力包模板为最小拉取对象”是探索性假设，现已被用户纠正为“单个资源为最小拉取对象”。

**[Category #15]**: 规则+Agent混合编排  
_Concept_: 原子资源进入 Cherry Studio 后，不应完全靠前端写死规则，也不应完全交给首页 Agent 自由发挥，而应采用混合编排：由明确规则先决定可见范围、优先级和默认入口，再由首页 Agent 在规则允许范围内做解释、引导和个性化推荐。  
_Novelty_: 既保证企业可控和稳定，又保留 AI 交互的灵活性，避免“纯规则过死”或“纯Agent不可控”。

## Phase Transition

**From Phase 1 to Phase 2**

- Phase 1 已形成较稳定产品定义：Cherry Studio 是员工 AI 工作台入口，不是 AI 能力主库。
- 下一步进入 Ecosystem Thinking，重点从“产品是什么”转向“系统里各角色分别负责什么”。

## Phase 2 Pattern Recognition Notes

**[Category #16]**: Gateway即Infrastructure  
_Concept_: 用户修正了系统边界：AI Gateway 与 AI Infra 不是两个层级，而是同一个系统。可以将其理解为基于 New API 网关演进扩展出来的企业 AI Infrastructure，既承接模型网关能力，也沉淀企业 AI 资源、权限和分发能力。  
_Novelty_: 不再采用“网关负责模型，Infra负责资源”的双系统拆分，而是围绕一个统一企业 AI 基座来设计客户端接入与资源消费。

**[Category #17]**: 同层客户端消费  
_Concept_: Cherry Studio 与 Codex 等专业 Agent 客户端应被视为同层级的能力消费端，它们都依赖同一个企业 AI Infrastructure 作为 Provider 来提供 AI 资源，包括模型调用、Token、技能等。  
_Novelty_: 不把 Cherry Studio 视为专业客户端的上层或中间层，而是把多个客户端统一建模为“同源不同入口”的消费者。

**[Category #18]**: 从 NewAPI Provider 扩展  
_Concept_: Cherry Studio 当前实际上已经接入标准 NewAPI Provider，只是使用方式还是 `url + key`。企业化改造的重点不在于重做 Provider 接入，而是在现有 NewAPI 接入基础上扩展成“授权登录 + 更丰富资源范围”的企业接入模式。  
_Novelty_: 将项目改造重点从“新增 Provider 能力”转向“升级认证方式与资源发现方式”，最大化复用现有结构。

**[Category #19]**: 改造主战场在接入层  
_Concept_: 企业化改造的主突破口不在推理调用链本身，因为现有 NewAPI / 聚合 Provider 已经能承接模型访问；真正需要改造的是接入语义，包括身份获取、资源发现、资源元数据和员工侧工作台编排。  
_Novelty_: 将改造重心从“怎么调用模型”转移到“怎么以企业方式拿到能力并低门槛交付”。

**[Category #20]**: 保持NewAPI Provider外形，替换接入语义  
_Concept_: 在 Cherry Studio 内部尽量保留现有 NewAPI Provider 的运行形态和调用链，只把原本手工配置 `url + key` 的接入语义，升级为“企业授权登录后自动获得 Provider 凭据与资源上下文”。  
_Novelty_: 用户和系统仍然感知为一个 Provider，但身份、凭据和资源来源已经从手工配置切换为企业授权分发。

**[Category #21]**: 远端资源即时消费  
_Concept_: 企业资源不深度落地为 Cherry Studio 本地业务对象，而是保持远端资源身份存在。Cherry Studio 主要拉取资源元数据、展示信息和可执行入口，在展示和执行时按远端对象消费，只对必要的会话态、缓存态和用户偏好做本地持久化。  
_Novelty_: 让 Cherry Studio 更像“企业 AI 工作台薄入口”，而不是“企业资源副本库”，显著降低同步、版本冲突和治理复杂度。

## Phase Transition

**From Phase 2 to Phase 3**

- Phase 2 已稳定关键边界：企业 AI Infrastructure 是统一上游；Cherry Studio 与专业 Agent 客户端是同层消费者。
- Cherry Studio 企业化的核心不在推理链路重写，而在 `NewAPI Provider` 语义升级、远端资源发现和入口编排。
- 下一步进入 Morphological Analysis，开始拆最小改造架构模块。

## Phase 3 Development Notes

**[Category #22]**: 企业专用Provider  
_Concept_: 不把企业入口直接混进现有 `new-api` provider 的用户心智里，而是新增一个企业专用 Provider，例如 `corp-gateway` 或 `enterprise-provider`。它在内部仍可复用 `newapi` 的调用骨架，但对用户暴露为企业默认、主要甚至唯一的接入方式。  
_Novelty_: 将“企业接入”从一个可选 Provider，提升为产品级主入口，避免普通员工在多 Provider 选择中迷失。

**[Category #23]**: 员工单入口+专业模式解锁  
_Concept_: 默认情况下，普通员工只看到企业专用 Provider 和企业能力入口，不暴露复杂的多 Provider 选择；对高级用户、管理员或专业角色，再解锁专业模式，允许更自由地接入其他 Provider、Agent 客户端或高级能力。  
_Novelty_: 在同一产品里同时满足“低门槛普及”和“高自由度专业使用”，但通过用户分层而不是界面堆砌来实现。

**[Category #24]**: 现有容器优先承接  
_Concept_: 在尚未完全想清企业资源最佳组织方式之前，P0 优先将远端资源直接接入现有知识库、技能库等入口，而不是新建一套全新的远端资源目录与工作台结构。这样既最大化复用现有 UI/数据通路，也能更快跑通企业登录、资源发现与低门槛使用闭环。  
_Novelty_: 不追求首版架构最优，而是刻意选择“先嵌入现有容器、后逐步抽象”的演进策略，以最小结构破坏换取最快验证。

## Idea Organization and Prioritization

### 已确认方向

- **产品角色**：Cherry Studio 企业化后的角色是员工 AI 工作台入口，而不是企业 AI 能力主库。
- **上游形态**：AI Gateway 与 AI Infra 是同一个企业 AI Infrastructure，可理解为基于 `new-api` 演进扩展出的统一企业 AI 基座。
- **客户端关系**：Cherry Studio 与 Codex 等专业 Agent 客户端是同层消费者，都依赖统一上游 Provider 提供 AI 资源。
- **体验原则**：低门槛优先，登录即用，不要求普通员工理解 Provider / API Key / 模型配置。
- **首页形态**：采用混合型首页，兼顾“直接问 AI”和快捷能力入口。
- **编排原则**：身份优先，规则 + Agent 混合编排。
- **资源边界**：企业资源以远端资源身份存在，由 Cherry Studio 即时消费，不深度复制为本地主数据。
- **P0 演进策略**：优先将远端资源接入现有助手 / 知识库 / 技能库等容器，尽量不破坏原有结构。
- **接入策略**：新增企业专用 Provider，作为默认主入口；内部尽量复用现有 `newapi` 调用骨架。
- **用户分层**：普通员工默认单入口，专业用户解锁专业模式。

### 主要主题聚类

**Theme 1: 产品定位与入口体验**

- 员工 AI 工作台外壳
- 登录即注入能力
- 混合型首页
- 双通道首页入口
- 企业统一首页 Agent

**Theme 2: 企业能力组织方式**

- 企业能力装配层
- 通用 + 岗位专属双层能力包
- 能力包整体发放
- 身份优先编排

**Theme 3: 系统边界与资源模型**

- AI Infra 统一能力源
- 资源级分发
- 规则 + Agent 混合编排
- 远端资源即时消费

**Theme 4: 最小改造与落地策略**

- 从 NewAPI Provider 扩展
- 改造主战场在接入层
- 企业专用 Provider
- 员工单入口 + 专业模式解锁
- 现有容器优先承接

### 优先级判断

**Top Priority Ideas**

1. **企业专用 Provider 作为默认主入口**
   这是普通员工低门槛接入的关键，也是把“企业能力入口”从众多 Provider 中抬升为产品主入口的核心动作。

2. **授权登录替代 `url + key`**
   这是“一键登录开箱即用”的核心前提，也是从个人客户端范式切换到企业工作台范式的标志。

3. **远端资源接入现有容器**
   这是最小破坏现有结构、最快验证企业闭环的务实落点。

**Quick Win Opportunities**

- 基于现有 `newapi` 骨架扩展企业 Provider
- 先接入远端知识库 / 技能库到现有入口
- 默认员工单入口，后续再补专业模式解锁

**Breakthrough Concepts**

- 登录即注入能力
- 企业统一首页 Agent
- Gateway 即 Infrastructure
- 规则 + Agent 混合编排

### Action Planning

**下一步应进入 PRD 的内容**

- 目标用户与用户分层
- P0 范围与非目标
- 核心场景：登录、问 AI、知识使用、技能使用、专业模式
- 成功标准：无需配置 API Key 即可开始使用企业能力

**下一步应进入架构的内容**

- 企业专用 Provider 方案
- 授权登录链路
- 远端资源发现与消费边界
- 现有容器承接方式
- 员工模式 / 专业模式切换机制

## Session Summary and Insights

**Key Achievements**

- 明确了 Cherry Studio 企业化后的产品角色与边界
- 把“AI Gateway”与“AI Infrastructure”统一成一个上游概念
- 找到了兼顾“低门槛”和“少破坏结构”的 P0 落地方向
- 识别出最适合进入 PRD 与架构阶段的内容边界

**Session Reflections**

- 本轮讨论从产品角色发散，逐步收敛到系统边界与最小改造策略，方向已经足够稳定。
- 最重要的收敛不是某个页面长什么样，而是确认了首版应优先解决企业接入语义和远端资源消费，而不是重做整个本地产品结构。
- 后续更适合进入正式 PRD 和架构，而不是继续在 brainstorming 阶段深入实现细节。
