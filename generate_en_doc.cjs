const {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel,
  WidthType, AlignmentType, BorderStyle, PageOrientation, convertInchesToTwip
} = require('docx');
const fs = require('fs');

// ============ Part 1: System Architecture ============
const part1Content = [
  new Paragraph({
    text: "Part 1 – System-Level Architecture",
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 }
  }),
  new Paragraph({
    text: "The Campus Club Recruitment Platform is a full-stack BaaS application with the following major subsystems:",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "1. Authentication Subsystem",
    children: [new TextRun({ text: " - Supabase Auth handles login/logout with email and OAuth. Role-based access control (student/club-admin/school-admin).", bold: false })]
  }),
  new Paragraph({
    text: "2. Club Management Subsystem",
    children: [new TextRun({ text: " - CRUD operations on clubs, categories, tags, and recruitment settings via Supabase database.", bold: false })]
  }),
  new Paragraph({
    text: "3. Application & Membership Subsystem",
    children: [new TextRun({ text: " - Application submission, review workflow, and member roster management.", bold: false })]
  }),
  new Paragraph({
    text: "4. Analytics & Visualization Subsystem",
    children: [new TextRun({ text: " - Real-time dashboards with charts for approval rates, member growth, and heatmaps.", bold: false })]
  }),
  new Paragraph({
    text: "5. Notification Subsystem",
    children: [new TextRun({ text: " - In-app and email notifications via Supabase Edge Functions.", bold: false })]
  }),
  new Paragraph({
    text: "6. AI Assistant Subsystem",
    children: [new TextRun({ text: " - Doubao AI integration for Q&A and smart recommendations.", bold: false })]
  }),
];

// ============ Part 2: Software vs Hardware View ============
const part2Content = [
  new Paragraph({
    text: "Part 2 – Perspectives: Software vs Hardware",
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 }
  }),
  new Paragraph({
    text: "Software-Led Components:",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "All 6 subsystems listed above are software-driven. The UI (React/Tailwind), business logic (hooks/custom hooks), and database operations (Supabase client) are pure software.",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "Hardware-Led Components:",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "Browser rendering engine (CPU/GPU), Supabase's managed PostgreSQL servers, and CDN edge nodes. These are external and not directly controllable.",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "Risk of Single Perspective:",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "Only viewing the software perspective may miss hardware-level bottlenecks like browser memory limits, network latency, or Supabase cold-start delays.",
    spacing: { after: 100 }
  }),
];

// ============ Part 3: Interfaces ============
const part3Content = [
  new Paragraph({
    text: "Part 3 – Interfaces and Dependencies",
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 }
  }),
  new Paragraph({
    text: "Interface 1: Supabase Database Interface",
    style: "ListNumber",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "What is passed: Data (CRUD operations on clubs, applications, users); Control (RLS policies); Timing (async queries via createClient).",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "Interface 2: Doubao AI External Service Interface",
    style: "ListNumber",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "What is passed: Control (HTTP POST with API key); Timing (async stream responses); Failure propagation: if API fails, AIAssistant component shows error state and users lose smart recommendation features.",
    spacing: { after: 100 }
  }),
];

// ============ Part 4: Dynamic Behavior (Peak Load) ============
const part4Content = [
  new Paragraph({
    text: "Part 4 – Dynamic Behavior: Peak Load Scenario",
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 }
  }),
  new Paragraph({
    text: "During peak registration (e.g., club recruitment week), concurrent user count spikes from 50 to 500+. Time variation:",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "T=0s: 500 users simultaneously click 'Apply' button → burst of POST requests.",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "T=1-3s: Supabase handles connection pool; RLS policies evaluate per-row access.",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "T=5s+: Notification triggers → Edge Function sends batch emails; AI assistant response time degrades.",
    style: "ListBullet",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "Data/Control Flow:",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "User Action → useApplications (submitApplication) → Supabase INSERT → RLS check → Trigger Edge Function → Notification INSERT → User receives alert.",
    spacing: { after: 100 }
  }),
];

// ============ Part 5: KPP Association ============
const part5Content = [
  new Paragraph({
    text: "Part 5 – Dynamic Behavior and KPP Association",
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 }
  }),
  new Paragraph({
    text: "Key Performance Parameters (KPPs):",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "KPP1: Page load time < 3s (per usePageTracking hook)",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "KPP2: Application submission success rate > 99%",
    style: "ListBullet",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "KPP3: Notification delivery within 5s",
    style: "ListBullet",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "KPP Violation Scenario:",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "During peak load, KPP1 is violated: useClubs fetches all clubs synchronously, causing UI freeze for 5-8s. This is a code-level bottleneck: useClubs.js has no pagination or debouncing.",
    spacing: { after: 100 }
  }),
  new Paragraph({
    text: "Static Diagram Limitation:",
    spacing: { after: 50 }
  }),
  new Paragraph({
    text: "Static architecture diagrams only show component relationships, not real-time data fetching patterns. The N+1 query issue in useClubs cannot be detected from a static view.",
    spacing: { after: 100 }
  }),
];

// ============ System Block Diagram Table ============
const systemDiagramTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Subsystem", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Responsibility", bold: true })], width: { size: 40, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Code Module", bold: true })], width: { size: 40, type: WidthType.PERCENTAGE } }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("1. Authentication")] }),
        new TableCell({ children: [new Paragraph("Login/logout, role-based access")] }),
        new TableCell({ children: [new Paragraph("UserContext.jsx")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("2. Club Management")] }),
        new TableCell({ children: [new Paragraph("CRUD for clubs, categories, tags")] }),
        new TableCell({ children: [new Paragraph("ClubList.jsx, useClubs.js")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("3. Application & Member")] }),
        new TableCell({ children: [new Paragraph("Submit/review applications, rosters")] }),
        new TableCell({ children: [new Paragraph("Application.jsx, useApplications.js")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("4. Analytics")] }),
        new TableCell({ children: [new Paragraph("Dashboard, charts, heatmaps")] }),
        new TableCell({ children: [new Paragraph("Charts.jsx, SchoolAdmin.jsx")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("5. Notification")] }),
        new TableCell({ children: [new Paragraph("In-app alerts, email triggers")] }),
        new TableCell({ children: [new Paragraph("useNotifications.js")] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("6. AI Assistant")] }),
        new TableCell({ children: [new Paragraph("Doubao AI Q&A and recommendations")] }),
        new TableCell({ children: [new Paragraph("AIAssistant.jsx, doubaoService.js")] }),
      ]
    }),
  ]
});

// ============ Assemble Document ============
const doc = new Document({
  sections: [{
    properties: {
      page: { orientation: PageOrientation.LANDSCAPE }
    },
    children: [
      new Paragraph({
        text: "Campus Club Recruitment Platform",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "System Architecture Analysis Report",
        heading: HeadingLevel.SUBTITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      ...part1Content,
      systemDiagramTable,
      ...part2Content,
      ...part3Content,
      ...part4Content,
      ...part5Content,
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('System_Architecture_Analysis.docx', buffer);
  console.log('Document generated: System_Architecture_Analysis.docx');
});
