# 🎓 大学社团招新智能匹配平台 (Campus Club AI)

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![AI](https://img.shields.io/badge/AI-Doubao-red.svg)](https://www.volcengine.com/product/ark)

> **让每一个灵魂在大学找到归属。**  
> 基于 AI 智能算法与大数据分析的校园社团招新一站式解决方案。

---

## 🌟 项目简介

**大学社团招新智能匹配平台** 旨在解决传统社团招新中信息不对称、匹配效率低的问题。通过集成 **字节跳动豆包 (Doubao) 大模型**，平台能够根据学生的兴趣爱好、专业背景及性格特点，精准推荐最适合的社团，同时为社团管理员提供高效的成员管理工具。

## ✨ 核心功能

### 🤖 AI 智能匹配
- **个性化推荐**：基于用户兴趣问卷，AI 自动分析并推荐契合度最高的社团。
- **AI 社团顾问**：集成豆包大模型，提供 24/7 的在线咨询服务，解答关于社团活动、加入要求等各类疑问。

### 📢 社团广场
- **全方位展示**：涵盖学术、文艺、体育、公益等各类社团，支持多维度筛选与搜索。
- **动态更新**：实时展示社团招新状态、成员规模及近期活动。

### 📝 极简申请流程
- **一键报名**：告别繁琐纸质表单，在线提交申请。
- **进度追踪**：实时查看申请审核进度，重要通知即时送达。

### 🛠️ 管理工作台
- **社团管理员**：管理成员审核、发布活动公告、编辑社团资料。
- **校级管理员**：统筹全校社团数据，审核新社团入驻，维护平台秩序。

## 🚀 技术架构

- **前端**：React 18 + Vite + Tailwind CSS
- **UI 组件库**：Shadcn UI + Framer Motion (动画效果)
- **后端/数据库**：Supabase (BaaS)
- **AI 接口**：字节跳动火山引擎 - 豆包大模型 (Doubao-1.5-lite)
- **状态管理/路由**：React Router Dom + TanStack Query

## 🛠️ 环境要求

- **Node.js**: 18.x 或更高版本
- **包管理器**: npm 或 yarn

## 📦 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/zzuli-ljz/campus-club-ai.git
   cd campus-club-ai
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   复制 `.env.example` 为 `.env` 并填写你的 Supabase 和 AI API 配置：
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **构建生产版本**
   ```bash
   npm run build
   ```

## 📄 开源协议

本项目遵循 [MIT License](LICENSE) 协议。

---

感谢使用 **大学社团招新智能匹配平台**！如果您有任何建议或反馈，欢迎提交 Issue。
