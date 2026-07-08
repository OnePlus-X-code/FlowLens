# Debug Log

> 每条记录一句话：**报错核心 → 修复方式**。

## Task 1
- Expo `expo start --non-interactive` 参数已废弃 → 改用环境变量 `$env:CI=1` 启用非交互模式。
- `app.json` 引用了不存在的 `./assets/favicon.png` 触发 Metro 警告 → 移除 `web.favicon` 字段（后续 Task 有资源时再补回）。

## Task 2
- `TextInput` 在 Web 端聚焦有蓝色 outline → 通过 `outlineStyle: 'none'` 覆盖（RNW 特有样式，加 `@ts-ignore` 抑制 RN 类型报错）。
- `expo export` 前 `dist/assets` 目录被清理后 Metro 扫描告警 ENOENT → 属良性告警，产物完整导出无需处理。

## Task 2.1（UI 迭代）
- 用户反馈：Input 无法换行 → 为 Input 增加 `multiline / minLines / bare` 三个开关，`blurOnSubmit=false` + `textAlignVertical='top'` 让回车自由换行且文本顶起。
- 新增 `NoteEditor` 组件模仿 iOS 原生备忘录：米黄纸感背景、无边框、大标题 + 多行正文、Web 端加 `wordBreak: break-word` 防止长串溢出。

## Task 2.2（备忘录 → 任务块）
- Node 子进程里跑 `npx tsc` 找不到 `npx.cmd` → 改为在 PowerShell 里直接调用 `npx tsc` 编译后再让 Node 加载编译产物执行测试。
- PowerShell `*>` 重定向与 Node 的 `stdio:inherit` 冲突导致输出丢失 → 拆两步：先 tsc 编译，再 node 执行测试脚本，避免嵌套 spawn。

## Task 2.3（解析器修复：节标题模式）
- 用户反馈：`上午\n-读论文\n下午\n-撰写周报` 这种"时段行 + 子任务分行"写法被误判为"(未命名任务)" + "随时" → 引入 `isPureSectionHeader` 与 `currentSection` 上下文，纯时段行只切换节，其后所有子任务继承节的时段。

## Task 3（Zustand + 持久化）
- `tsc` CLI 不支持 `--paths` 参数直接指定路径映射 → 新建 `_tmp/tsconfig.store.json` 独立配置，输出到 `_out_store` 目录再由 Node 加载。
- Node 测试脚本 `Cannot find module 'zustand'` → 在脚本顶部将项目 `node_modules` 追加到 `module.paths`，让编译产物能解析到宿主依赖。
- 测试断言失败："持久化 tasks 长度 1"实际得到 2 → 备忘录 `title` 会被拼进 `body` 再解析，导致标题也变成一条任务；改为 `title: ''` 或用 `expectedLen = gen2.length` 动态断言。
- Expo 兼容性提示：`@react-native-async-storage/async-storage@3.1.1` 高于 SDK 51 期望的 `1.23.1` → 降级到 `1.23.1` 后 TS + 17/17 store 测试仍全部通过。

## Task 4（Supabase 云同步）
- `fetchRemoteTasks` 直接返回 `res as SyncResult<TaskBlock[]>` 触发 TS2352（RemoteTaskRow 与 TaskBlock 无充分交集） → 拆开 error/skipped 两个分支显式返回，避免类型断言。
- 只 include `services/**` 编译时 tsc 会 flat 输出到 `_out_sync/` 根目录（不带 services 前缀） → 测试脚本 require 路径改为 `path.join(outDir, 'supabase.js')` 直接指向根。
- 需要在 require `@supabase/supabase-js` 之前注入 fake → 用 `Module._resolveFilename` 劫持模块解析，将 `@supabase/supabase-js` 指向落盘的 `_fake_supabase.js`，并在 `_supabase_state.js` 里持有全局内存状态供断言读取。
- `db execute` 在 CLI v2 已被移除 → 改用 `db query --linked -f schema.sql` 执行 SQL 文件。
- `npm install -g supabase` 在 Windows 上找不到原生二进制（`No matching binary for win32-x64`） → 从 GitHub releases 下载 `supabase_2.109.1_windows_amd64.zip` 解压到 `bin/` 目录。

## Task 5（动态排期模块）
- 排序测试断言写反："模糊时段排前面"实际应为"有具体时间的排前面" → `sortTasks` 中 `null minutes` 映射为 `MAX_SAFE_INTEGER` 排末尾，修正断言为"有具体时间的排前面"。
- 任务重复 bug：`nextId()` 用 `Date.now()` 生成 id，多端同一份备忘录生成的 id 不同，`mergeLWW` 无法去重 → 改为 `deterministicId(title, block, minutes)` 基于内容 hash，同一备忘录在任何设备生成的 id 完全相同。
- 云端任务全部有 `deleted_at` 非 null 导致 `fetchRemoteRows` 一条都拉不到 → 根因：`generateTasksFromNote` 先 `softDeleteAllTasks` 设了 `deleted_at`，然后 `upsertTasks` 的 payload 不含 `deleted_at` 字段无法覆盖 → 修复 `blockToRow` 把 `deleted_at: null` 加入 upsert payload，复活软删除的行。
- DesktopScheduleView 嵌套 `ScrollView horizontal` 在 Web 端被外层纵向 ScrollView 截断 → 改用 `View + overflow: 'scroll'` + `flexDirection: 'row'`。

## Task 6（专注模式）
- 用户要求 PC 端任务必须从上至下按时间顺序排列，同一时间块内也不能左右分列 → 移除 DesktopScheduleView 的 evening 双列网格，所有分组统一单列，并让 `sortTasks` 在同 minutes 内保持原输入顺序而非按标题重排。
- 点击任务进入专注模式时，勾选按钮也可能触发父级卡片点击 → 在 TaskBlockCard 的 checkbox `onPress` 中调用 `event.stopPropagation()`，避免打勾时误入专注。
- 专注状态需要跨刷新恢复但不应污染任务数据 → 新增 `useFocusStore` 独立持久化 `currentTaskId / startedAt`，今日页根据当前任务渲染 FocusSession。
- Playwright 首次验收用 `getByTestId` / `getByRole('button')` 在 React Native Web DOM 中不稳定 → 改用 placeholder 与可见文本定位，并给 Pressable 补 `accessibilityRole` 作为后续可访问性改进基础。
