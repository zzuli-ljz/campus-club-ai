# 🎓 基于多标签相似度的高校社团智能推荐系统 (Campus Club AI)

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![AI](https://img.shields.io/badge/AI-Doubao-red.svg)](https://www.volcengine.com/product/ark)
[![Competition](https://img.shields.io/badge/Competition-4C-orange.svg)](http://jsjds.blcu.edu.cn/)

> **让每一个灵魂在大学找到归属。**  
> 本作品旨在通过 AI 语义分析与多维标签匹配技术，解决高校社团招新中的信息过载与低效匹配问题。

---

## 🏆 作品亮点 (中国大学生计算机设计大赛 4C)

本作品专为高校社团生态设计，具备以下核心竞争力：

- **核心技术：多标签相似度算法**
  系统不仅基于简单的分类筛选，更通过构建用户多维兴趣画像（Interest Profiling）与社团标签空间，实现跨类别的智能推荐。
- **创新应用：LLM 驱动的语义匹配**
  集成 **字节跳动豆包 (Doubao) 大模型**，通过自然语言处理技术，深度理解用户需求，提供比传统过滤算法更具“温度”和“精度”的咨询体验。
- **全链路闭环：一站式招新管理**
  从兴趣发现、智能匹配、实时咨询到在线报名、成员审核、评价反馈，构建了完整的数字化招新全流程。

## ✨ 核心功能

### 🤖 AI 智能引擎
- **智能推荐算法**：基于多维标签相似度，量化用户与社团的契合度（Match Score），让推荐结果直观且精准。
- **AI 社团顾问**：内置基于豆包大模型的智能助手，深度集成社团实时动态与历史数据，提供专家级的咨询建议。

### 📢 动态社交生态
- **社团动态 (Posts)**：支持发布动态、公告、活动及荣誉，并具备实时点赞与统计功能。
- **全方位评价系统 (Reviews)**：成员可进行多维度评价（1-5星 + 印象标签），构建真实的社团口碑体系。
- **标签治理体系**：校级管理员可统一管理全校标签库，确保数据规范化。

### 🛠️ 分权管理架构
- **三端权限分离**：学生端（探索与申请）、社团端（内容发布与成员审核）、学校端（全局监管与账号发放）。

## 🚀 技术架构

- **前端核心**：React 18 + Vite + Tailwind CSS
- **动效与 UI**：Framer Motion + Shadcn UI + Lucide Icons
- **后端服务**：Supabase (PostgreSQL + Auth + RLS + Realtime)
- **AI 能力**：字节跳动火山引擎 - 豆包大模型 (Doubao-1.5-lite-32k)
- **数据管理**：TanStack Query (React Query) 实现高性能数据缓存

## 📦 快速部署

1. **环境准备**
   - Node.js 18.x+
   - Supabase 账号及项目

2. **安装运行**
   ```bash
   npm install
   # 启动项目 (端口 8081)
   npm run dev
   ```

3. **环境变量配置**
   创建 `.env` 文件并填入以下内容：
   ```env
   VITE_SUPABASE_URL=你的Supabase项目地址
   VITE_SUPABASE_ANON_KEY=你的Supabase匿名Key
   ```

4. **数据库初始化**
   - 依次运行 `src/supabase/migrations/` 下的 SQL 脚本。
   - 重点检查 `init_database.sql` 和各个 `fix_*.sql` 脚本以确保 RLS 权限正确。

## 🛡️ 开发与排障

- **白屏处理**：若遇到页面空白，请在浏览器开发者工具中清除 **Application -> Storage** 下的网站数据，以排除旧平台 Service Worker 的干扰。
- **内存溢出**：若构建过程中出现 OOM，请设置环境变量：`$env:NODE_OPTIONS="--max-old-space-size=4096"`。

---

感谢使用 **大学社团招新智能匹配平台**！本项目由开发者为 2026 年中国大学生计算机设计大赛倾心打造。
