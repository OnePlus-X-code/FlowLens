Frontend Layer (React Native + Expo Web)

采用一套代码基座构建 iOS、Android 与 Web 端界面 。

路由管理使用 Expo Router 实现跨端一致的导航体验。

样式层采用跨平台友好的方案（如 Tailwind for RN 或 StyleSheet），确保响应式布局生效。

Data & State Management Layer

本地状态：使用 Zustand 管理应用内全局状态（如当前专注任务、UI 主题等） 。

数据持久化与同步：接入 Supabase 作为后端即服务（BaaS），利用其轻量级特性处理日记文本、时间轴数据的存储与跨设备实时同步 。

AI Integration Layer

语音流：通过 Expo 音频模块采集音频，调用 Whisper API 进行高精度语音转文字 。

智能流：将转化后的文本连同预设的 System Prompt 发送至 LLM API，返回 JSON 格式的结构化复盘数据（成就、问题、情绪打分）并写入数据库 。