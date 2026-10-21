# Campus Club AI · 校园社团智能招新平台

<div align="center">

<img src="src/assets/logo.png" width="110" alt="Campus Club AI" />

**让新生找到对的社团，让社团找到对的人**

🏆 2026年中国大学生计算机设计大赛 省级三等奖（河南赛区，项目编号 2026024121）

[![React](https://img.shields.io/badge/React-18.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Radix-black?style=for-the-badge)](https://ui.shadcn.com/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3fcf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-ff4154?style=for-the-badge&logo=reactquery)](https://tanstack.com/query/)

**🌐 在线演示：[http://campus-club-ai.xyz](http://campus-club-ai.xyz)**

[简体中文](#-项目简介) | [English](#english)

</div>

---

## 📖 项目简介

招新季的真实场景是这样的：新生对着几十个社团海报不知道选哪个，社团抱着传单在食堂门口蹲一个星期，收上来的报名表一半信息不全，社长再用 Excel 人工汇总。

Campus Club AI 把这条链路搬到了线上：**学生端**浏览 / 搜索社团、填兴趣问卷、提交申请、跟踪审核进度；**社团端**管理成员、发布活动与帖子；**校管理员端**审核新建社团、看全校数据。中间插了一个 AI 助手——你直接用自然语言说"帮我推荐几个周末有空的社团然后申请"，它能接住整句话，推荐、追问信息、代填申请、提交，一路做完。

### 三种角色，各自要什么

| 角色 | 核心诉求 | 平台给的能力 |
|------|----------|--------------|
| 学生 | 找到适合自己、时间不冲突的社团 | 分类浏览 / 标签筛选 / 兴趣问卷推荐 / AI 对话式申请 |
| 社长 | 高效纳新、管理成员和活动 | 申请审核、成员管理、活动与帖子发布、数据统计 |
| 校管理员 | 全校社团规范化管理 | 新建社团审批、全校数据看板、异常通知处理 |

---

## ✨ 功能特性

**学生端**
- 社团浏览：分类 / 标签 / 关键词多维筛选，详情页聚合活动、帖子、评价；
- 兴趣问卷（Survey）：填写学院、年级、兴趣标签、课余时间，驱动推荐算法；
- 申请全流程可视化：提交 → 待审核 → 通过 / 驳回，每一步状态可查；
- 收藏、活动报名、退社申请、站内通知，一套做完。

**AI 助手**（本项目最核心的部分，单独一节展开 👇）

**社团 / 校管理端**
- ClubAdmin：成员管理、申请审批、活动发布、帖子管理；
- SchoolAdmin：新建社团审批、全校级 Analytics 数据看板（Recharts 可视化）；
- 通知中心：审核结果、活动提醒实时推送。

**体验层**
- 🌐 中英双语全覆盖（`LanguageContext` + 集中式 translations），切换即时生效；
- 📱 响应式布局，桌面 / 移动端一致体验；
- ✨ Framer Motion 页面过渡与微交互。

---

## 🤖 AI 助手架构

代码在 `src/pages/AIAssistant.jsx`（2400 行）和 `src/services/doubaoService.js`，背后是豆包大模型，但**不是简单包一层 chat**。

### 意图路由：先确定性分流，再进大模型

`detectAgentIntent` 引擎用一组正则先对用户输入做意图分类，命中 7 类"事务型"意图之一就走对应的业务处理分支：

```js
// src/pages/AIAssistant.jsx
const detectAgentIntent = (text) => {
  // ...正则识别
  if (wantsNewClubs)        return { type: "new_clubs" };       // 查新社团
  if (wantsLeaveStatus)     return { type: "leave_status" };    // 退社进度
  if (wantsLeave)           return { type: "leave" };           // 申请退社
  if (wantsCancel)          return { type: "cancel" };          // 撤销申请
  if (wantsStatus)          return { type: "status" };          // 查申请进度
  if (wantsApplyDirect && wantsRecommend && wantsRecommendApply)
                            return { type: "recommend_apply" }; // 推荐并申请
  if (wantsApplyDirect)     return { type: "apply" };           // 直接申请
  return null; // 未命中 → 交给 LLM 自由问答
};
```

**为什么这么设计**：事务型请求（"帮我退社""申请进度到哪了"）需要**确定的执行结果**——直接查库、改状态，交给 LLM 编只会出幻觉；而开放性问答（"摄影协会累不累"）才需要模型的生成能力。正则分流几乎零成本、零延迟、结果可测试，LLM 只处理它真正擅长的那部分。这是整条链路里最关键的取舍。

### 申请场景的"结构化记忆"

走 `apply` 分支时，助手不会傻乎乎地直接提交。它会先检查用户画像里缺什么（学院、年级、兴趣、课余时间），缺什么就**在对话里追问**，凑齐后再调用 LLM 生成一段个性化的自荐信（结合社团纳新要求 + 用户背景），最后落库。`getMissingApplyProfileFields` 和 `extractApplicationMentions` 负责从闲聊式的句子里提取"用户提到了哪个社团"这种结构化信息。

### 内置知识库兜底

`doubaoService.js` 里维护了一份结构化的校内社团知识（各社团纳新门槛、活动节奏、综测加分路径、避坑建议），作为 prompt 上下文注入，保证 AI 回答"哪个社团好进""对综测有没有帮助"这类问题时说的是**这个学校的事实**，而不是模型的通用想象。

---

## 🛠️ 技术栈

| 层次 | 选型 | 说明 |
|------|------|------|
| 框架 | React 18.2 + Vite 5.4 | SPA，React Router 6 路由 |
| UI | Tailwind CSS 3.4 + shadcn/ui (Radix) | 无头组件 + 原子化样式，可访问性开箱即得 |
| 动效 | Framer Motion 11 | 页面过渡、列表动画 |
| 服务端状态 | TanStack Query 5 | 14 个领域 hook（`useClubs` / `useApplications`…）统一缓存、失效与重试 |
| 表单 | React Hook Form + Zod | schema 校验，申请 / 注册 / 问卷全走这条链 |
| 后端 | Supabase（PostgreSQL + Auth + Realtime） | 20+ 份 SQL 迁移脚本版本化管理库结构 |
| AI | 豆包大模型（火山方舟 API） | 意图路由 + 知识库增强生成 |
| 可视化 | Recharts | 管理端数据看板 |
| 其他 | Resend（邮件）、qrcode.react、html-to-image | 邮件通知、分享二维码、海报导出 |

---

## 🚀 快速开始

```bash
git clone https://github.com/zzuli-ljz/campus-club-ai.git
cd campus-club-ai
npm install
npm run dev
```

Node.js ≥ 18。启动前在项目根目录配好环境变量：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DOUBAO_API_KEY=your_doubao_api_key
```

数据库结构用 `src/supabase/migrations/` 下的 SQL 脚本按文件名顺序执行即可。

生产构建：`npm run build`，产物部署在阿里云，线上地址 👉 **http://campus-club-ai.xyz**

---

## 📂 项目结构

```
src/
├── pages/               # 路由页面（AIAssistant 是最大的一个，2400 行）
├── components/          # 通用组件 + ui/（shadcn 基础组件）
├── hooks/               # 14 个 TanStack Query 领域 hook
├── services/            # doubaoService（AI）、emailService
├── contexts/            # User / Language / Notification 三个全局 Context
├── i18n/                # 集中式翻译文件
├── supabase/migrations/ # 20+ SQL 迁移脚本
└── integrations/        # Supabase 客户端集成
```

---

## 🌍 English

### Overview

**Campus Club AI** is a smart campus club recruitment & management platform, built with React 18 + Vite + Tailwind + shadcn/ui on the front end and Supabase (PostgreSQL, Auth, Realtime) as the backend. It serves three roles — students (browse, get recommendations, apply, track status), club admins (member & activity management), and school admins (approval & campus-wide analytics) — and glues everything together with an AI assistant powered by the Doubao LLM.

🏆 Provincial 3rd Prize, 2026 China Collegiate Computing Contest (Henan Division).

### The AI assistant

The interesting part is in `src/pages/AIAssistant.jsx`: a `detectAgentIntent` engine classifies each message with deterministic regex routing into **7 transactional intents** (apply, recommend-and-apply, cancel, check status, leave club, leave status, new clubs) *before* anything reaches the LLM. Transactional requests are executed directly against the database — no hallucinated mutations; the LLM only handles open-ended Q&A, enriched with a curated campus-specific knowledge base (club entry requirements, schedules, bonus-point paths). For applications, the assistant runs a structured-memory loop: detect missing profile fields → ask follow-up questions → generate a personalized self-introduction via the LLM → submit.

### Quick start

```bash
npm install && npm run dev   # Node >= 18
```

Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DOUBAO_API_KEY`, then apply the SQL migrations in `src/supabase/migrations/`.

Live demo: **http://campus-club-ai.xyz**

---

## 📝 备注

- 兴趣问卷数据同时驱动推荐列表和 AI 助手的追问逻辑，两处共享同一份用户画像；
- AI 助手的校内社团知识库在 `doubaoService.js` 的 `INTERNAL_KB`，换学校用改这一处即可；
- 国际化文案集中在 `src/i18n/translations.js`，新增语言加一份词典即可。
