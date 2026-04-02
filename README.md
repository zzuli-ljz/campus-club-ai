# 🎓 大学社团招新智能匹配平台 (Campus Club AI)

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![AI](https://img.shields.io/badge/AI-Doubao-red.svg)](https://www.volcengine.com/product/ark)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.3-purple.svg)](https://www.framer.com/motion/)

> **让每一个灵魂在大学找到归属。**  
> 基于 AI 智能算法与大数据分析的校园社团招新一站式解决方案。

---

## 🌟 项目简介

**大学社团招新智能匹配平台** 旨在解决传统社团招新中信息不对称、匹配效率低的问题。通过集成 **字节跳动豆包 (Doubao) 大模型**，平台能够根据学生的兴趣爱好、专业背景及性格特点，精准推荐最适合的社团。

最新版本引入了 **社团动态 (Posts)**、**评价系统 (Reviews)** 和 **标签体系 (Tags)**，构建了一个充满活力的校园社交生态系统。

## ✨ 核心功能

### 🤖 AI 智能匹配与咨询
- **个性化推荐**：基于用户兴趣问卷，AI 自动分析并推荐契合度最高的社团。
- **AI 社团顾问**：集成豆包大模型，提供 24/7 的在线咨询服务，解答关于社团活动、加入要求等各类疑问。

### 📢 动态社交生态
- **社团动态 (Posts)**：社团可发布 **动态、公告、活动、荣誉** 等四类内容，支持点赞与浏览量统计。
- **评价系统 (Reviews)**：成员可对加入的社团进行星级评价（1-5星）并添加标签（如“氛围友好”、“活动丰富”），支持管理员回复。
- **标签选择器 (Tag Selector)**：多维度的标签管理，支持自定义标签并持久化存储。

### 🏟️ 社团广场与展示
- **全方位展示**：涵盖学术、文艺、体育、公益等各类社团，支持多维度筛选与搜索。
- **实时看板**：首页展示 **最新动态** 与热门社团，让校园生活触手可及。

### 🛠️ 管理工作台
- **社团管理员 (Club Admin)**：管理成员审核、发布动态/活动、回复评价、编辑社团资料。
- **校级管理员 (School Admin)**：统筹全校社团数据，管理标签库，审核新社团入驻，维护平台秩序。

## 🚀 技术架构

- **前端核心**：React 18 + Vite + Tailwind CSS
- **交互与样式**：Shadcn UI + Framer Motion (细腻的交互动画) + Lucide Icons
- **后端服务 (BaaS)**：Supabase (身份认证、实时数据库、RLS 行级安全、存储)
- **AI 智能**：字节跳动火山引擎 - 豆包大模型 (Doubao-1.5-lite)
- **状态与路由**：React Router Dom + TanStack Query (数据缓存与同步)

## 🛠️ 环境要求

- **Node.js**: 18.x 或更高版本 (推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理)
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
   复制 `.env.example` 为 `.env` 并填写你的配置：
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **数据库初始化**
   执行 `src/supabase/migrations/` 下的 SQL 脚本进行数据库表结构与 RLS 策略的初始化。

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📄 开源协议

本项目遵循 [MIT License](LICENSE) 协议。

---

感谢使用 **大学社团招新智能匹配平台**！如果您有任何建议或反馈，欢迎提交 Issue。
