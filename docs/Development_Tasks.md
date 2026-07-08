# FlowLens（心流镜）MVP 开发任务清单

> 本清单由资深架构师基于 `PRD.md`、`Architecture.md`、`Final_Acceptance.md` 拆解而成。
> 执行原则：**步进式开发 + 每个 Task 完成后强制人类验收 + debug_log.md 沉淀**。

---

## Task 1：项目脚手架与三端同构基座搭建
**核心目标**：初始化 Expo（含 Web 支持）项目，验证 iOS / Android / Web 三端同一份代码均可启动，并搭建 Expo Router 基础路由。
- 初始化 Expo 项目（TypeScript 模板）
- 开启 Web 支持并配置 `metro.config.js` / `app.json`
- 集成 Expo Router，建立底部/侧边导航骨架（今日 / 复盘 / 设置）
- 建立响应式布局工具函数（`useBreakpoint` 判断 Mobile / Desktop）
- **验收点**：`npm run web` 能在浏览器打开，且能在 Expo Go 或模拟器中打开，导航可切换。

---

## Task 2：设计系统与响应式布局基座
**核心目标**：构建跨端主题、样式规范与响应式容器组件，为后续所有页面提供 UI 基座。
- 定义颜色 / 字体 / 间距 Token（浅色主题优先）
- 封装 `<ResponsiveLayout>`：Mobile 单栏、Desktop 双栏
- 封装通用组件：Button、Card、Input、Modal
- **验收点**：一个 Demo 页面在窄屏显示单栏、宽屏显示双栏，无布局撕裂。

---

## Task 3：Zustand 全局状态与本地持久化
**核心目标**：搭建 Zustand Store，管理任务列表、当前专注任务、UI 主题；接入 AsyncStorage / localStorage 做本地缓存。
- 定义 `useTaskStore`、`useFocusStore`、`useUIStore`
- 抽象持久化中间件（跨端兼容）
- **验收点**：刷新页面/重启 App 后本地状态可恢复。

---

## Task 4：Supabase 云端接入与数据模型
**核心目标**：创建 Supabase 项目，设计 `tasks`、`reviews` 表结构，接入 SDK 并实现"本地状态 ↔ 云端"双向同步。
- Supabase 项目初始化 + 环境变量 `.env`
- 表结构 SQL 与 Row Level Security
- 封装 `syncService`：增删改自动 upsert，启动时拉取
- **验收点**：手机端新增任务，浏览器端刷新可秒级看到。

---

## Task 5：动态排期模块（备忘录式日程）
**核心目标**：实现自然语言时间块输入（早/中/晚 + 精确时间），Mobile 极简列表 / Desktop 日历看板双形态。
- 输入框：解析 "早上写周报"、"14:00 开会" 等
- Mobile：按时间顺序的极简列表
- Desktop：分栏日历看板
- **验收点**：输入自然语言后正确解析，两端同步显示。

---

## Task 6：手动心流锁定（专注模式）
**核心目标**：点击任务进入沉浸式计时页面，隐藏其他任务；Desktop 支持全屏 / 悬浮窗。
- 全天日程总览页
- 沉浸式计时器界面（仅显示当前任务 + 计时）
- Desktop 端 `requestFullscreen` 或悬浮窗样式
- 结束后标记完成，引导下一任务
- **验收点**：满足 `Final_Acceptance.md` 排期与专注模块所有条款。

---

## Task 7：录音采集与 Whisper 转录
**核心目标**：接入 Expo Audio 录制音频，上传至 Whisper API 得到文字，显示在屏幕上。
- 录音按钮 + 权限申请（跨端）
- 上传音频 → Whisper API → 文字回显
- **验收点**：说话后 10 秒内屏幕出现准确文字。

---

## Task 8：LLM 结构化复盘生成
**核心目标**：将转录文本 + System Prompt 发送 LLM，返回 `{成就, 问题, 情绪}` JSON，写入 Supabase 并渲染卡片。
- 抽象 `llmService.generateReview(text)`
- 结构化 JSON 校验 + 错误重试
- 复盘卡片 UI（三段式）
- **验收点**：10 秒内生成结构化视图，跨端同步。

---

## Task 9：复盘详情、周报与情绪趋势（Desktop 专属增强）
**核心目标**：Desktop 端提供周报视图与情绪打分趋势图；Mobile 保持简洁列表。
- 周维度数据聚合
- 折线图（情绪分数走势）
- **验收点**：Desktop 显示周报 + 图表，Mobile 显示列表。

---

## Task 10：Final Acceptance 全量回归 & 打包
**核心目标**：对照 `Final_Acceptance.md` 逐项走查，修复遗留问题，产出 Web 构建产物与 Expo 预览链接。
- 三端响应式回归
- 排期 / 专注 / 复盘全链路测试
- `npx expo export -p web` 打包
- **验收点**：`Final_Acceptance.md` 全部通过。

---

## 里程碑
| 阶段 | Task | 交付 |
|------|------|------|
| 基础 | 1-4 | 三端脚手架 + 云同步 |
| 核心 | 5-6 | 排期 + 专注 |
| AI | 7-8 | 录音复盘全链路 |
| 增强 | 9-10 | 周报 + 上线 |
