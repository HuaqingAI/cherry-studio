# PRD Quality Review — Cherry Studio 企业 AI 客户端 P0

## Overall verdict

这份 PRD 的产品方向、边界和 P0 取舍是清楚的：它把 Cherry Studio 定位为企业 AI Infrastructure 的纯客户端消费端，并用 Non-Goals、MVP Scope、Risks 和 Addendum 反复约束了不做管理后台、不复制远端资源、不重做首页 Agent。主要风险不在战略方向，而在交付门槛：若直接进入架构和故事拆解，Phase 0 契约冻结、负向验收场景、性能/埋点阈值和资源状态矩阵还不够可执行。

总体建议是 **Good / 可推进到 Phase 0 契约确认，但不应直接进入完整实现拆解**。先补齐 Phase 0 退出标准、负向 ATDD、SM-6 至 SM-8 的目标口径，以及资源状态矩阵的验收形态。

## Decision-readiness — adequate

PRD 能支持方向性决策。Vision 明确写出“最小改造、尽快跑通闭环”（§1，line 20），Non-Goals 明确排除管理后台、首页 Agent、专业模式、多企业账号和本地主数据复制（§5，lines 387-397），Open Questions 也把架构阻塞项单独列出（§13.1，lines 544-552）。这些内容让决策者能判断 P0 是“企业登录 + 三类远端资源消费”的客户端闭环，而不是企业工作台重构。

但 PRD 还没有把“可以进入架构/开发拆解”的门槛定义成可执行 gate。§13.1 说契约问题会阻塞架构方案和任务拆解，§10 Phase 0 也说要冻结五类契约，但没有写每类契约的 owner、交付物、验收证据和是否允许部分并行。

### Findings

- **[medium]** Phase 0 缺少可执行退出门槛 (§10 lines 497-502; §13.1 lines 544-552) — PRD 已经识别 OAuth、模型发现、知识库调用、技能执行、缓存撤销是架构前置阻塞项，但还没有定义“冻结完成”的证据，例如接口文档、错误码表、mock 服务、签核人或最小联调用例。这样会让后续架构评审把开放问题重新解释一遍。 *Fix:* 增加 “Phase 0 Exit Criteria” 小节，按五类契约列出 owner、输出物、验收方式和未冻结时禁止拆解的范围。

## Substance over theater — strong

这份 PRD 的内容不是模板填充。Target User 没有堆 Persona，而是用普通员工、企业 IT / AI 平台团队、开发团队三类 JTBD 支撑 P0 取舍（§2.1，lines 26-31）。NFR 也不是泛泛写“安全、可靠、可扩展”，而是落到 OAuth state、token 暴露、缓存不可授权执行、fresh/stale/offline/revoked 状态、日志脱敏和资源失败类别（§7.1 至 §7.5，lines 431-465）。

### Findings

无新增发现。

## Strategic coherence — adequate

PRD 有统一 thesis：降低普通员工接入企业 AI 的配置成本，同时保持企业 AI Infrastructure 作为资源和权限 source of truth。Features、Non-Goals、MVP Scope、Risks 和 Counter-metrics 都围绕这个 thesis 展开，例如 SM-C1 不允许为了资源可见数量而复制知识库或技能为本地主数据（§12，line 532），SM-C3 不允许把权限策略下沉到客户端（§12，line 534）。

薄弱点在指标层。Primary metrics 有明确目标，SM-1 至 SM-3 都有 90%/95% 等目标（§12，lines 518-520），但 SM-6 至 SM-8 仍是方向性观察项，没有目标、样本、采集窗口或 owner。§13.3 又把试点账号、资源样本和成功指标采集方式列为非阻塞问题（line 567），这会削弱试点是否成功的判定。

### Findings

- **[medium]** SM-6 至 SM-8 还不是可验收目标 (§12 lines 526-528; §13.3 line 567) — “7 日继续使用率”“首次可用答案耗时”“任务完成自评”能补足接入成功之外的产品结果，但目前没有目标值、采集方式、样本条件或 owner。它们会被当成观察指标，而不是发布/试点判断依据。 *Fix:* 为 SM-6 至 SM-8 添加目标或明确标注为 exploratory metrics；若作为验收指标，补齐试点样本、采集事件、统计窗口和负责人。

## Done-ness clarity — thin

FR 的基础形态是可用的：26 个 FR 都有 testable consequences，且覆盖登录、Provider、模型、知识库、技能、轻量入口、本地状态和缓存恢复（§4，lines 92-383）。PRD 也给出 3 个 Required ATDD Scenarios 覆盖首次登录、知识库调用和技能执行（§12，lines 536-540）。

问题是负向和横切验收还不够具体。许多最容易出事故的 P0 场景集中在授权取消、token 过期、资源撤销、缓存 stale/offline、401/403、单企业账号切换和日志脱敏，但 ATDD 目前只覆盖正向闭环。性能阈值和埋点模型也被推迟到架构/测试阶段冻结，缺少 PRD 级最低边界。

### Findings

- **[medium]** Required ATDD 只覆盖正向闭环 (§12 lines 536-540; §4.7 lines 357-383) — ATDD-1 至 ATDD-3 能验证核心 happy path，但没有覆盖授权失败恢复、资源撤销、缓存不可授权执行、登录失效保护当前任务、单企业账号切换清理等 P0 高风险路径。 *Fix:* 增加至少 3 个负向 ATDD：授权取消/过期后重登恢复、资源撤销后缓存不可调用、切换企业账号时清理旧账号状态。
- **[medium]** NFR 性能和观测性缺少 P0 基线 (§7.4 lines 455-458; §7.5 lines 462-465) — PRD 要求后续冻结登录到模型列表 p95、首次对话 p95、资源发现 p95、技能执行超时和埋点事件模型，但没有给出 PRD 级临时目标或最低采集口径。故事拆解时很难判断“明显额外串行等待”“可诊断日志”是否达成。 *Fix:* 增加 provisional NFR baselines，例如首轮资源拉取不阻塞主界面、客户端新增等待不超过某阈值、必须采集的事件名/字段和脱敏字段清单；架构阶段可再修订。
- **[medium]** 资源状态矩阵仍停留在标题级要求 (§4.7 FR-24 lines 357-365; §13.2 line 558) — FR-24 列出了可用、暂无授权资源、加载失败、无权限、登录失效、资源撤销、资源下线、调用超时、缓存过期/离线展示等状态，但没有形成状态 × 资源类型 × 用户动作 × 是否可调用的矩阵。 *Fix:* 在 PRD 或 UX handoff 中补一个最小状态矩阵，至少明确每个状态的文案意图、主动作、次动作、是否允许展示缓存、是否允许发起调用。

## Scope honesty — strong

PRD 对范围非常坦诚。Non-Goals 与 MVP Scope 互相印证，单企业账号策略在 Glossary、FR-3、FR-26、Non-Goals、MVP Scope 和 Risks 中多次出现（§3 line 87; §4.1 line 127; §4.7 line 383; §5 line 394; §6.1 line 413; §11 line 512）。Assumptions Index 也能回指 3 个 inline `[ASSUMPTION]`（§14，lines 571-573），没有把上游契约假设隐藏成事实。

### Findings

- **[low]** “企业 Provider 命名和 provider id” 被归为非阻塞可能偏轻 (§13.3 line 566) — 产品命名本身可以非阻塞，但 provider id 会影响持久化 key、日志字段、埋点、i18n key 和迁移命名。若架构会先落代码骨架，provider id 可能不是纯产品细化项。 *Fix:* 将 provider id 与产品展示名拆开：展示名可非阻塞，内部 stable id 应进入 Phase 0 或架构前置确认。

## Downstream usability — adequate

PRD 对下游是可抽取的。FR 编号连续、Glossary 覆盖核心名词，UJ、FR、SM、ATDD 之间有基本引用关系；Addendum 也把架构候选方向和契约冻结项留在支持文档中，避免污染 PRD 主叙事。对 UX、Architecture、ATDD 后续工作来说，主线足够明确。

不足主要是两个：资源状态矩阵还不能直接交给 UX/测试使用；Addendum 使用英文，而 BMad 配置里的 document_output_language 是 Chinese，长期看会增加团队阅读和术语一致性成本。

### Findings

- **[low]** Addendum 输出语言与 PRD 不一致 (addendum.md lines 1-50) — 主 PRD 是中文，Addendum 是英文。内容本身清楚，但后续架构/产品联合评审时容易出现术语双写和引用漂移。 *Fix:* 若团队主要使用中文评审，把 Addendum 翻成中文或在开头声明该文件保留英文作为技术备忘；至少统一关键术语中英映射。

## Shape fit — strong

形状匹配产品类型。这个 PRD 是 brownfield 内部实现/企业能力接入型 PRD，不需要消费者产品式的重 Persona，也不需要把技术方案塞进 PRD 正文。它采用 capability spec 为主、User Journey 为辅的结构是合理的：UJ 用来说明普通员工体验闭环，Features 用来承接工程拆解，Addendum 承接架构深度。

### Findings

无新增发现。

## Mechanical notes

- FR 编号连续：FR-1 至 FR-26，无明显缺号或重复。
- SM 编号连续：SM-1 至 SM-8，Counter-metrics 为 SM-C1 至 SM-C3。
- Assumptions Index roundtrip 通过：正文 3 个 `[ASSUMPTION]` 均在 §14 收录。
- 未发现 `[NOTE FOR PM]` callout；当前 PRD 已用 Open Questions 承接主要张力，非问题。
- UJ 使用“普通员工/新员工”等角色型 protagonist，而不是具名人物。对本 PRD 的内部工具/能力规格形态可以接受；若进入 UX 叙事稿，可再补具名 protagonist。
