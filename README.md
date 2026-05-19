# Campus Club AI - 智能校园社团管理平台

<div align="center">

<img src="src/assets/logo.png" width="120" alt="Campus Club AI Logo" />

**基于 AI 的智能校园社团管理与服务平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![React](https://img.shields.io/badge/react-18.2.0-61dafb)](package.json)

**🌐 在线访问：[campus-club-ai.xyz](https://campus-club-ai.xyz)**

</div>

---

## 📖 项目简介

Campus Club AI 是一个现代化的校园社团管理平台，旨在为大学生提供便捷的社团发现、加入和管理服务。平台集成了 AI 智能助手，为用户提供个性化的社团推荐和智能问答服务。

### 核心特性

- 🤖 **AI 智能助手** - 基于豆包大模型，提供 7×24 小时智能问答服务
- 🎯 **智能推荐系统** - 基于用户兴趣和行为提供个性化社团推荐
- 📱 **响应式设计** - 适配桌面端和移动端，提供一致的用户体验
- 🌐 **多语言支持** - 支持中英文切换
- 🔐 **安全认证** - 基于 Supabase 的安全用户认证系统
- 📊 **数据分析** - 为管理员提供可视化数据统计面板

---

## 🛠️ 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| [React](https://react.dev/) | 18.2.0 | 核心 UI 框架 |
| [Vite](https://vitejs.dev/) | 5.4.11 | 构建工具与开发服务器 |
| [React Router](https://reactrouter.com/) | 6.23.1 | 客户端路由管理 |

### UI 设计与组件

| 技术 | 版本 | 用途 |
|------|------|------|
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.4 | 原子化 CSS 框架 |
| [shadcn/ui](https://ui.shadcn.com/) | - | UI 组件库（基于 Radix UI） |
| [Radix UI](https://www.radix-ui.com/) | 1.1.0+ | 无样式可访问组件 |
| [Framer Motion](https://www.framer.com/motion/) | 11.3.9 | 交互动画库 |
| [Lucide React](https://lucide.dev/) | 0.417.0 | 图标库 |

### 状态管理与数据

| 技术 | 版本 | 用途 |
|------|------|------|
| [TanStack Query](https://tanstack.com/query/) | 5.48.0 | 服务端状态管理 |
| [Axios](https://axios-http.com/) | 1.6.8 | HTTP 客户端 |
| [date-fns](https://date-fns.org/) | 3.6.0 | 日期处理工具 |

### 后端即服务

| 技术 | 版本 | 用途 |
|------|------|------|
| [Supabase](https://supabase.com/) | 2.57.4 | 后端即服务（BaaS） |
| PostgreSQL | - | 关系型数据库 |
| Supabase Auth | - | 用户认证系统 |
| Supabase Realtime | - | 实时数据订阅 |

### 表单与验证

| 技术 | 版本 | 用途 |
|------|------|------|
| [React Hook Form](https://react-hook-form.com/) | 7.52.0 | 表单状态管理 |
| [Zod](https://zod.dev/) | 3.23.8 | 数据验证 schema |

### 第三方服务

| 技术 | 用途 |
|------|------|
| [豆包大模型 (Doubao)](https://www.volcengine.com/product/doubao) | AI 智能助手后端 |
| [Resend](https://resend.com/) | 邮件发送服务 |
| [Recharts](https://recharts.org/) | 数据可视化图表 |
| [QRCode.react](https://www.npmjs.com/package/qrcode.react) | 二维码生成 |

### 开发工具

| 技术 | 用途 |
|------|------|
| ESLint | 代码质量检查 |
| PostCSS | CSS 转换工具 |
| Autoprefixer | CSS 前缀自动补全 |

---

## 📁 项目结构

```
src/
├── assets/              # 静态资源
├── components/          # React 组件
│   └── ui/             # shadcn/ui 基础组件
├── contexts/           # React Context 上下文
├── hooks/              # 自定义 React Hooks
├── pages/              # 页面组件
├── services/          # 业务服务层
│   └── doubaoService.js  # 豆包 AI 服务
├── supabase/          # Supabase 配置与数据库迁移
│   ├── client.js      # Supabase 客户端
│   └── migrations/    # 数据库迁移脚本
└── integrations/      # 第三方集成
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:8081

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

---

## 🌐 部署

### 阿里云部署

项目已部署至阿里云服务器：**https://campus-club-ai.xyz**

### GitHub Pages

项目支持 GitHub Pages 静态部署。

---

## 📝 主要功能模块

| 模块 | 描述 |
|------|------|
| 首页 | 热门社团推荐、活动轮播展示 |
| 社团浏览 | 分类浏览、搜索过滤、标签筛选 |
| 社团详情 | 社团信息、活动列表、帖子、评价 |
| 用户中心 | 个人资料、我的社团、申请记录 |
| AI 助手 | 智能问答、社团相关问题解答 |
| 智能推荐 | 基于兴趣和行为的个性化推荐 |
| 社团管理 | 社长管理社团成员、活动、帖子 |
| 学校管理 | 管理员审核新社团、数据统计 |
| 通知系统 | 站内消息、活动提醒 |

---

## 🔧 环境变量配置

项目需要配置以下环境变量：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 豆包大模型配置
VITE_DOUBAO_API_KEY=your_doubao_api_key
```

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- [shadcn/ui](https://ui.shadcn.com/) - 精美的开源 UI 组件
- [Tailwind CSS](https://tailwindcss.com/) - 优雅的 CSS 框架
- [Supabase](https://supabase.com/) - 强大的开源 BaaS 平台
- [豆包大模型](https://www.volcengine.com/product/doubao) - 智能 AI 服务

---

<div align="center">

**Made with ❤️ for Campus Communities**

</div>
