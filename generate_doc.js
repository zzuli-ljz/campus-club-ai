const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
        Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
        HeadingLevel, BorderStyle, WidthType, ShadingType,
        VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// 系统架构图（用ASCII图形表示）
const systemArchitectureDiagram = `
┌─────────────────────────────────────────────────────────────────────────────┐
│                         高校社团招新平台架构图                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐         ┌──────────────────┐        ┌──────────────┐   │
│    │   用户端      │         │     学生用户      │        │  社团管理员   │   │
│    │  (Student)   │◄───────►│  (Student User)  │◄──────►│(Club Admin)  │   │
│    └──────┬───────┘         └────────┬─────────┘        └──────┬───────┘   │
│           │                           │                          │            │
│           │     ┌─────────────────────┴─────────────────────┐     │            │
│           │     │                                           │     │            │
│    ┌──────▼─────▼───────┐           ┌─────────────────────▼──────▼───────┐  │
│    │   学校管理员端      │           │           前端展示层                 │  │
│    │ (School Admin)     │           │  React + Vite + Tailwind CSS        │  │
│    └──────┬─────────────┘           │  Framer Motion (动画效果)            │  │
│           │                         └─────────────────────┬────────────────┘  │
│           │                                             │                    │
│    ┌──────▼─────────────────────────────────────────────▼───────────────┐   │
│    │                        React Router (路由管理)                      │   │
│    └──────┬─────────────────────────────────────────────┬───────────────┘   │
│           │                                             │                    │
│    ┌──────▼──────────────────────┐    ┌──────────────▼────────────────┐    │
│    │      Context / State         │    │         Hooks                 │    │
│    │  - UserContext (认证状态)    │    │  - useClubs (社团CRUD)       │    │
│    │  - NotificationContext       │    │  - useApplications (申请)    │    │
│    │  - LanguageContext (国际化)  │    │  - useMembers (成员管理)     │    │
│    └──────────────────────────────┘    │  - useNotifications           │    │
│                                        │  - useClubPosts (动态)        │    │
│                                        └──────────────┬───────────────┘    │
│                                                     │                     │
│    ┌────────────────────────────────────────────────▼──────────────────┐    │
│    │                      Supabase (BaaS 后端服务)                      │    │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │    │
│    │  │   Auth      │  │  Database   │  │   Storage   │  │ Realtime│  │    │
│    │  │  认证服务    │  │ PostgreSQL  │  │  文件存储   │  │  实时   │  │    │
│    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───┬───┘  │    │
│    │         │                 │                 │              │      │    │
│    │  ┌──────▼─────────────────▼─────────────────▼──────────────▼───┐  │    │
│    │  │              数据库表结构 (Tables)                           │  │    │
│    │  │  clubs | profiles | applications | club_members |           │  │    │
│    │  │  notifications | club_posts | reviews | tags               │  │    │
│    │  └──────────────────────────────────────────────────────────────┘  │    │
│    └──────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    │ API 调用                               │
│                                    ▼                                        │
│    ┌──────────────────────────────────────────────────────────────────┐   │
│    │                     外部服务集成                                   │   │
│    │  ┌────────────────────────────────────────────────────────────┐   │   │
│    │  │              豆包AI (Doubao) - AI助手服务                  │   │   │
│    │  │              ark.cn-beijing.volces.com                    │   │   │
│    │  └────────────────────────────────────────────────────────────┘   │   │
│    └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
`;

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "微软雅黑", size: 24 } // 12pt default
      }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "微软雅黑", color: "1F4E79" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "微软雅黑", color: "2E75B6" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "微软雅黑", color: "4472C4" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers2",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "高校社团招新平台 - 系统架构分析", font: "微软雅黑", size: 20, color: "666666" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "第 ", font: "微软雅黑", size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], font: "微软雅黑", size: 20 }),
            new TextRun({ text: " 页", font: "微软雅黑", size: 20 })
          ]
        })]
      })
    },
    children: [
      // 标题
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "高校社团招新平台", font: "微软雅黑", size: 48, bold: true, color: "1F4E79" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "系统架构分析报告", font: "微软雅黑", size: 36, color: "4472C4" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [new TextRun({ text: "—— 基于代码实现的深度分析", font: "微软雅黑", size: 24, color: "666666" })]
      }),

      // Part 1
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Part 1 – 系统可视化：系统级框图", font: "微软雅黑" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "1.1 主要子系统及职责", font: "微软雅黑" })]
      }),

      // 子系统表格
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 3680, 3680],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "1F4E79", type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "子系统", font: "微软雅黑", size: 24, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "1F4E79", type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "核心职责", font: "微软雅黑", size: 24, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "1F4E79", type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "对应代码模块", font: "微软雅黑", size: 24, bold: true, color: "FFFFFF" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "1. 用户认证系统", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "管理用户注册、登录、角色权限（学生/社团管理员/学校管理员）", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "UserContext.jsx, supabase.auth", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "2. 社团管理系统", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "社团信息CRUD、分类管理、标签系统、招新状态控制", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "useClubs.js, Clubs.jsx, ClubDetail.jsx", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "3. 申请与成员管理", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "入会申请提交/审批、成员状态管理（active/inactive）、退出申请", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "useApplications.js, useMembers.js, Application.jsx", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "4. 数据分析与可视化", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "多维度图表展示：分类分布、成员趋势、申请漏斗、通过率饼图", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Charts.jsx (7种图表组件)", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "5. 通知系统", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "多类型通知推送：申请结果、退出审批、新动态提醒", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "useNotifications.js, NotificationContext.jsx", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2000, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "6. AI助手", font: "微软雅黑", size: 22, bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "智能社团推荐、问答服务、流式响应输出", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "doubaoService.js, AIAssistant.jsx", font: "微软雅黑", size: 22 })] })]
              }),
            ]
          }),
        ]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "1.2 子系统间的接口关系", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "主要接口包括：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun({ text: "Supabase Client API：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "所有前端组件通过统一的 supabase 实例与后端通信（src/integrations/supabase/client.js）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun({ text: "React Context：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "UserContext 共享认证状态，LanguageContext 共享国际化设置", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun({ text: "Custom Hooks：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "业务逻辑封装在 useXXX.js 中，如 useClubs、useApplications", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun({ text: "豆包AI API：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "通过 RESTful API 调用外部AI服务", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Part 2 – 视角与观点", font: "微软雅黑" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.1 软件主导部分", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "本系统几乎完全由软件主导，主要包括：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "前端界面层：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "React + Tailwind CSS 构建的所有UI组件，包括数据可视化图表", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "业务逻辑层：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "所有 CRUD 操作、状态管理、数据验证逻辑", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "认证授权：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "Supabase Auth 提供的用户身份验证和会话管理", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "AI服务集成：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "豆包AI API 的调用逻辑和响应处理", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.2 硬件主导部分", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "系统本身没有直接控制硬件，但依赖于以下基础设施：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "客户端设备：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "用户浏览器运行的计算机/手机性能影响响应速度", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "网络基础设施：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "Supabase 服务器和豆包AI 服务器的网络延迟", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "云服务端：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "Supabase 托管的 PostgreSQL 数据库服务器", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.3 软硬件视图的交互", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "软件视图通过 HTTP/HTTPS 协议与远程服务器通信，网络质量直接影响用户体验。硬件瓶颈可能导致：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "页面加载时间延长（网络延迟 > 200ms）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "API 调用超时（Supabase 响应 > 3s）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "AI 响应缓慢或失败（豆包API 延迟）", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.4 单视角风险分析", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "仅从软件视角分析会带来以下风险：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "性能瓶颈被忽视：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "代码优化良好但网络延迟导致慢", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "可用性问题：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "弱网环境下系统不可用，但代码逻辑正确", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "扩展性误判：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "未考虑服务器硬件限制导致并发能力被高估", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // Part 3
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Part 3 – 接口与依赖", font: "微软雅黑" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "3.1 接口一：Supabase 数据库接口", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "传递内容：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "数据：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "社团信息、用户资料、申请记录、通知等结构化数据", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "控制：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "Row Level Security (RLS) 策略控制数据访问权限", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "时序：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "异步 HTTP 请求，带自动重试和会话刷新机制", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "依赖关系：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "前端所有功能依赖于数据库可用性", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "身份认证依赖于 Auth 服务", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "实时通知依赖于 Realtime 服务", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "失败传播：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "数据库宕机 → 所有 CRUD 操作失败 → 系统完全不可用", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "网络波动 → 部分请求超时 → 数据不一致风险", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Auth 服务异常 → 用户无法登录 → 整个认证流程中断", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "3.2 接口二：豆包AI 外部服务接口", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "传递内容：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "数据：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "用户消息、社团上下文、用户profile（JSON格式）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "控制：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "temperature、max_tokens 等生成参数", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "时序：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "支持流式输出（stream: true），逐 token 返回", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "依赖关系：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "AI助手功能完全依赖豆包API可用性", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "需要有效的 API Key（硬编码在 doubaoService.js）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "系统提示词包含社团数据，影响回答质量", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "失败传播：", font: "微软雅黑", size: 24, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "API 不可用 → AI助手显示错误提示，但不影响其他功能", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "API 延迟高 → 打字机效果卡顿，用户体验下降", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "API Key 过期 → 服务完全中断", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // Part 4
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Part 4 – 动态行为场景：峰值负载", font: "微软雅黑" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.1 场景描述", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "招新季高峰期（如开学第一周），大量学生同时访问平台：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "1000+ 学生同时在线浏览社团", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "500+ 并发申请提交", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "社团管理员同时审批申请", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.2 时间变化", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "在峰值负载下，系统各环节响应时间变化：", font: "微软雅黑", size: 24 })]
      }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "指标", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "正常负载", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "峰值负载", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "数据库查询", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "50-100ms", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "500-2000ms", font: "微软雅黑", size: 22, bold: true, color: "C00000" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "申请提交", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "100-200ms", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-5s（超时风险）", font: "微软雅黑", size: 22, bold: true, color: "C00000" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "页面加载", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0.5-1s", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3-10s", font: "微软雅黑", size: 22, bold: true, color: "C00000" })] })]
              }),
            ]
          }),
        ]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.3 数据流动", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "峰值负载下的数据流动路径：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "numbers2", level: 0 },
        children: [new TextRun({ text: "用户浏览器 → React 组件状态更新", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers2", level: 0 },
        children: [new TextRun({ text: "React → Supabase Client (HTTP 请求批处理)", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers2", level: 0 },
        children: [new TextRun({ text: "Supabase → PostgreSQL (连接池竞争)", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbers2", level: 0 },
        children: [new TextRun({ text: "返回结果 → 触发通知写入 → club_members 更新", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.4 控制流动", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "控制权在峰值负载下的变化：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "前端：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "显示 Loading 状态，等待后端响应（useState + isLoading 标志）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Supabase：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "自动令牌刷新、请求排队、重试机制", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "数据库：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "事务锁等待、RLS 策略评估", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // Part 5
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Part 5 – 行为与性能的关联", font: "微软雅黑" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "5.1 关键性能参数（KPP）定义", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "基于系统代码实现，定义以下 KPP：", font: "微软雅黑", size: 24 })]
      }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 4680, 2340],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "4472C4", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KPP", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 4680, type: WidthType.DXA },
                shading: { fill: "4472C4", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "定义", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "4472C4", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "阈值", font: "微软雅黑", size: 22, bold: true, color: "FFFFFF" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "KPP1: API响应时间", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 4680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Supabase 数据库查询的平均响应时间", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "< 500ms", font: "微软雅黑", size: 22, bold: true, color: "008000" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "KPP2: 申请成功率", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 4680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "申请提交后成功写入数据库的比例", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "> 99%", font: "微软雅黑", size: 22, bold: true, color: "008000" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "E7E6E6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "KPP3: 页面完全加载", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 4680, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "首屏所有组件渲染完成的耗时", font: "微软雅黑", size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "< 3s", font: "微软雅黑", size: 22, bold: true, color: "008000" })] })]
              }),
            ]
          }),
        ]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "5.2 峰值负载下 KPP 被违反的场景", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "动态行为如何导致 KPP 违规：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "KPP1 违规：", font: "微软雅黑", size: 22, bold: true, color: "C00000" }), new TextRun({ text: "useClubs.js 中 Promise.all 并行查询成员数量，高并发时数据库连接池耗尽，查询排队等待时间 > 500ms", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "KPP2 违规：", font: "微软雅黑", size: 22, bold: true, color: "C00000" }), new TextRun({ text: "submitApplication 时序依赖：先写入 applications，再更新 club_members，再更新 clubs.members，任意一步超时都会导致数据不一致", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "KPP3 违规：", font: "微软雅黑", size: 22, bold: true, color: "C00000" }), new TextRun({ text: "SchoolAdmin.jsx 同步加载6个数据源（社团、管理员、学生、申请、标签、统计数据），渲染阻塞", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "5.3 瓶颈与延迟位置分析", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "静态图无法发现的问题：", font: "微软雅黑", size: 24, bold: true })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "useClubs.js 第24-38行：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "循环内 Promise.all 查询每个社团的成员数，N+1 查询问题", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "useApplications.js 第104-124行：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "串行查询申请人 profile 信息，可优化为批量查询", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "SchoolAdmin.jsx 第176-200行：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "多个 useEffect 并行触发数据加载，无依赖管理，可能重复请求", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Charts.jsx 动画效果：", font: "微软雅黑", size: 22, bold: true }), new TextRun({ text: "Framer Motion 动画在高刷新率下可能影响首屏渲染时间", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "5.4 为什么静态图无法发现问题", font: "微软雅黑" })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "静态架构图只能展示：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "组件的调用关系（谁调用谁）", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "接口的输入输出定义", font: "微软雅黑", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "数据结构的静态定义", font: "微软雅黑", size: 22 })]
      }),

      new Paragraph({
        children: [new TextRun({ text: "但无法展示：", font: "微软雅黑", size: 24 })]
      }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "异步操作的时序竞争条件（如 useEffect 竞态）", font: "微软雅黑", size: 22, color: "C00000" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "循环内的网络请求（N+1 问题）", font: "微软雅黑", size: 22, color: "C00000" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "峰值负载下的资源争用", font: "微软雅黑", size: 22, color: "C00000" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "动画渲染对首屏的影响", font: "微软雅黑", size: 22, color: "C00000" })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "外部 API 的实际延迟分布", font: "微软雅黑", size: 22, color: "C00000" })]
      }),

      new Paragraph({
        spacing: { before: 400 },
        children: [new TextRun({ text: "结论：", font: "微软雅黑", size: 24, bold: true, color: "1F4E79" }), new TextRun({ text: "本系统是纯软件系统，性能瓶颈主要来自异步网络调用和数据库查询优化。静态架构图展示了系统的模块划分，但无法揭示运行时性能问题。必须结合动态场景分析和性能监控才能发现 KPP 违规风险。", font: "微软雅黑", size: 24 })]
      }),
    ]
  }]
});

// 生成文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("d:\\desktop\\桌面文件夹\\课程作业\\25-26第二学期\\软件应用集成\\Project_campus_club_ai\\Project_campus_club_ai\\系统架构分析报告.docx", buffer);
  console.log("文档生成成功！");
});
