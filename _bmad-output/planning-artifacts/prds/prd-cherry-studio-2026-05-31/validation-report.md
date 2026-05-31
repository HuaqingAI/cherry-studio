# Validation Report — Cherry Studio 企业 AI 客户端 P0

- **PRD:** `D:\ProgramData\git\repository\github\huaqingai\cherry-studio\_bmad-output\planning-artifacts\prds\prd-cherry-studio-2026-05-31\prd.md`
- **Rubric:** `D:\ProgramData\git\repository\github\huaqingai\cherry-studio\.agents\skills\bmad-prd\assets\prd-validation-checklist.md`
- **Run at:** 2026-05-31T02:04:09.0155415+08:00
- **Grade:** Good

## Overall verdict

这份 PRD 的产品方向、边界和 P0 取舍是清楚的：它把 Cherry Studio 定位为企业 AI Infrastructure 的纯客户端消费端，并用 Non-Goals、MVP Scope、Risks 和 Addendum 反复约束了不做管理后台、不复制远端资源、不重做首页 Agent。主要风险不在战略方向，而在交付门槛：若直接进入架构和故事拆解，Phase 0 契约冻结、负向验收场景、性能/埋点阈值和资源状态矩阵还不够可执行。

总体建议是 **Good / 可推进到 Phase 0 契约确认，但不应直接进入完整实现拆解**。先补齐 Phase 0 退出标准、负向 ATDD、SM-6 至 SM-8 的目标口径，以及资源状态矩阵的验收形态。

## Dimension verdicts

- Decision-readiness — adequate
- Substance over theater — strong
- Strategic coherence — adequate
- Done-ness clarity — thin
- Scope honesty — strong
- Downstream usability — adequate
- Shape fit — strong

## Findings by severity

### Critical (0)

无。

### High (0)

无。

### Medium (5)

**[Decision-readiness]** Phase 0 缺少可执行退出门槛 (§10 lines 497-502; §13.1 lines 544-552)  
PRD 已经识别 OAuth、模型发现、知识库调用、技能执行、缓存撤销是架构前置阻塞项，但还没有定义“冻结完成”的证据，例如接口文档、错误码表、mock 服务、签核人或最小联调用例。这样会让后续架构评审把开放问题重新解释一遍。  
Fix: 增加 “Phase 0 Exit Criteria” 小节，按五类契约列出 owner、输出物、验收方式和未冻结时禁止拆解的范围。

**[Strategic coherence]** SM-6 至 SM-8 还不是可验收目标 (§12 lines 526-528; §13.3 line 567)  
“7 日继续使用率”“首次可用答案耗时”“任务完成自评”能补足接入成功之外的产品结果，但目前没有目标值、采集方式、样本条件或 owner。它们会被当成观察指标，而不是发布/试点判断依据。  
Fix: 为 SM-6 至 SM-8 添加目标或明确标注为 exploratory metrics；若作为验收指标，补齐试点样本、采集事件、统计窗口和负责人。

**[Done-ness clarity]** Required ATDD 只覆盖正向闭环 (§12 lines 536-540; §4.7 lines 357-383)  
ATDD-1 至 ATDD-3 能验证核心 happy path，但没有覆盖授权失败恢复、资源撤销、缓存不可授权执行、登录失效保护当前任务、单企业账号切换清理等 P0 高风险路径。  
Fix: 增加至少 3 个负向 ATDD：授权取消/过期后重登恢复、资源撤销后缓存不可调用、切换企业账号时清理旧账号状态。

**[Done-ness clarity]** NFR 性能和观测性缺少 P0 基线 (§7.4 lines 455-458; §7.5 lines 462-465)  
PRD 要求后续冻结登录到模型列表 p95、首次对话 p95、资源发现 p95、技能执行超时和埋点事件模型，但没有给出 PRD 级临时目标或最低采集口径。故事拆解时很难判断“明显额外串行等待”“可诊断日志”是否达成。  
Fix: 增加 provisional NFR baselines，例如首轮资源拉取不阻塞主界面、客户端新增等待不超过某阈值、必须采集的事件名/字段和脱敏字段清单；架构阶段可再修订。

**[Done-ness clarity]** 资源状态矩阵仍停留在标题级要求 (§4.7 FR-24 lines 357-365; §13.2 line 558)  
FR-24 列出了可用、暂无授权资源、加载失败、无权限、登录失效、资源撤销、资源下线、调用超时、缓存过期/离线展示等状态，但没有形成状态 × 资源类型 × 用户动作 × 是否可调用的矩阵。  
Fix: 在 PRD 或 UX handoff 中补一个最小状态矩阵，至少明确每个状态的文案意图、主动作、次动作、是否允许展示缓存、是否允许发起调用。

### Low (2)

**[Scope honesty]** “企业 Provider 命名和 provider id” 被归为非阻塞可能偏轻 (§13.3 line 566)  
产品命名本身可以非阻塞，但 provider id 会影响持久化 key、日志字段、埋点、i18n key 和迁移命名。若架构会先落代码骨架，provider id 可能不是纯产品细化项。  
Fix: 将 provider id 与产品展示名拆开：展示名可非阻塞，内部 stable id 应进入 Phase 0 或架构前置确认。

**[Downstream usability]** Addendum 输出语言与 PRD 不一致 (addendum.md lines 1-50)  
主 PRD 是中文，Addendum 是英文。内容本身清楚，但后续架构/产品联合评审时容易出现术语双写和引用漂移。  
Fix: 若团队主要使用中文评审，把 Addendum 翻成中文或在开头声明该文件保留英文作为技术备忘；至少统一关键术语中英映射。

## Mechanical notes

- FR 编号连续：FR-1 至 FR-26，无明显缺号或重复。
- SM 编号连续：SM-1 至 SM-8，Counter-metrics 为 SM-C1 至 SM-C3。
- Assumptions Index roundtrip 通过：正文 3 个 `[ASSUMPTION]` 均在 §14 收录。
- 未发现 `[NOTE FOR PM]` callout；当前 PRD 已用 Open Questions 承接主要张力，非问题。
- UJ 使用“普通员工/新员工”等角色型 protagonist，而不是具名人物。对本 PRD 的内部工具/能力规格形态可以接受；若进入 UX 叙事稿，可再补具名 protagonist。

## Reviewer files

- `review-rubric.md`
