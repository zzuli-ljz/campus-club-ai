// 豆包 AI API 服务
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_API_KEY = '31cabedd-8aa0-4745-a2f0-11d545bee4d2';
const DOUBAO_MODEL = 'doubao-1-5-lite-32k-250115';

const ENABLE_WEB_SEARCH = false;

const INTERNAL_KB = {
  school: '郑州轻工业大学',
  exitGuide: {
    process: '退出流程：1）先确认自己是该社团 active 成员；2）在平台提交“退出申请”（写明原因与时间安排）；3）社团管理员审核；4）审核通过后成员状态会从 active 变为 inactive，并同步更新社团成员数。',
    notes: '注意事项：退出申请提交后一般为待审核状态；期间仍可能收到社团通知，请保持沟通。若你是社团管理员账号，通常不能自助退社，需要联系学校管理员处理。记录留存：你的申请与审核结果会在个人中心/通知中留痕，便于后续核对。'
  },
  clubs: [
    {
      name: '程序设计协会',
      threshold: '纳新要求：对编程有兴趣即可；通常会有简单的新手测评/面谈（偏基础逻辑与学习意愿）。时间投入：每周 1 次分享/训练+自愿刷题。避坑：别一上来就报太多项目，先把语言基础与题型过一遍。',
      suitableMajors: ['计算机', '软件工程', '人工智能', '数据科学', '自动化', '电子信息'],
      activityTime: '活动安排：常见为晚间或周末训练；新生季会有入门训练营（语言/算法/工程实践）。',
      bonus: '综测/加分：以学院与学校第二课堂/综测细则为准；通常“参赛/获奖/担任骨干”更容易形成可量化材料。新生建议：先从一门语言+Git+刷题节奏开始。'
    },
    {
      name: 'AI 创新社',
      threshold: '纳新要求：对 AI/数据分析有兴趣；建议具备基础 Python（不会也可入门）。可能会有小作业（例如数据清洗/简单模型）。避坑：别把“AI”当玄学，先把数学/代码补齐。',
      suitableMajors: ['人工智能', '计算机', '数学', '统计', '自动化', '电子信息', '管理科学'],
      activityTime: '活动安排：读书会/论文分享/项目小组；常见节奏为每周 1 次线下/线上研讨+项目推进。',
      bonus: '综测/加分：以“项目产出/竞赛/实践证明”为主；若社团提供竞赛组队与成果证明，材料更好写。新生建议：优先做一个可演示的小项目（可视化/小模型/小应用）。'
    },
    {
      name: '机器人创新实验室',
      threshold: '纳新要求：动手能力与时间投入较重要；可能需要面试/笔试（电路/编程/结构择一）。避坑：项目周期长，报名后要评估课程压力，避免中途失联。',
      suitableMajors: ['自动化', '电气工程', '机械', '计算机', '电子信息', '测控'],
      activityTime: '活动安排：项目制为主（备赛/作品）；常见为周末集中训练+平时小组分工。',
      bonus: '综测/加分：更偏“竞赛/作品/专利/证书”路线；能出成果时加分/材料通常更扎实。新生建议：先跟进一个子模块（机械/电控/视觉/嵌入式）再拓展。'
    },
    {
      name: '摄影协会',
      threshold: '纳新要求：会拍/会修不重要，愿意跟拍与学习更重要；可自带相机或手机参与。避坑：别被“器材焦虑”劝退，先把构图与光线练熟。',
      suitableMajors: ['不限', '新闻传播', '艺术设计', '数字媒体', '视觉传达'],
      activityTime: '活动安排：外拍/主题训练/作品评选；常见在周末或傍晚组织外拍与后期教学。',
      bonus: '综测/加分：以学校活动摄影、作品入选、担任骨干等材料更稳；纯兴趣参与一般更偏“第二课堂时长”。新生建议：先做 1 套“校园系列作品集”。'
    },
    {
      name: '合唱团',
      threshold: '纳新要求：通常会有试唱/音域测试；不会乐理也能学，但需要稳定出勤。避坑：演出季排练会更密，慎重同时加入多个高强度社团。',
      suitableMajors: ['不限', '音乐', '播音主持', '外国语'],
      activityTime: '活动安排：固定排练+校内外演出；常见为每周 1–2 次晚间排练，演出前增加集训。',
      bonus: '综测/加分：演出证明、获奖与骨干经历更容易形成材料；普通团员更偏参与证明。新生建议：早点确定声部，跟住基础发声训练。'
    },
    {
      name: '篮球社',
      threshold: '纳新要求：新手友好；校队/竞技组可能有选拔。避坑：运动损伤要重视，别硬撑，护具与热身别省。',
      suitableMajors: ['不限'],
      activityTime: '活动安排：固定训练+约赛；常见为每周 1–2 次训练，周末组织校内联赛或友谊赛。',
      bonus: '综测/加分：赛事参与、获奖、组织比赛与骨干经历更容易加分；普通训练更多是参与记录。新生建议：先把投篮姿势与基础对抗练稳。'
    },
    {
      name: '羽毛球协会',
      threshold: '纳新要求：零基础可入；竞技组可能分层训练。避坑：羽毛球强度不低，注意膝踝保护与拍线选择。',
      suitableMajors: ['不限'],
      activityTime: '活动安排：分层训练+双打活动；常见在晚间或周末馆内训练，定期组织积分赛。',
      bonus: '综测/加分：比赛成绩与组织活动更有材料；日常参与多为第二课堂记录。新生建议：先练步伐与发接发，提升最快。'
    },
    {
      name: '志愿者协会',
      threshold: '纳新要求：责任心与守时是第一位；会有值班/培训与活动报名机制。避坑：明确“活动时长记录/证明开具”流程，避免做完没材料。',
      suitableMajors: ['不限', '社会工作', '教育', '管理', '心理'],
      activityTime: '活动安排：校内志愿、社区服务、主题公益；常见为周末或节假日活动，平时有培训与项目筹备。',
      bonus: '综测/加分：志愿时长/项目证明通常是核心材料，但具体折算规则以学院为准。新生建议：先参加 1–2 个稳定项目，再尝试组织岗位。'
    }
  ]
};

const normalizeText = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const generateApplicationSelfIntro = async (club, userProfile = null, memory = null, language = 'zh') => {
  const safeClub = club && typeof club === 'object' ? club : {};
  const name = safeClub.name || (language === 'zh' ? '该社团' : 'the club');
  const category = safeClub.category || '';
  const description = safeClub.description || '';
  const tags = Array.isArray(safeClub.tags) ? safeClub.tags.filter(Boolean).slice(0, 8) : [];

  const major = typeof memory?.major === 'string' ? memory.major.trim() : '';
  const interests = Array.isArray(memory?.interests) ? memory.interests.filter(Boolean).slice(0, 8) : [];
  const college = typeof memory?.college === 'string' ? memory.college.trim() : '';
  const grade = typeof memory?.grade === 'string' ? memory.grade.trim() : '';
  const gender = typeof memory?.gender === 'string' ? memory.gender.trim() : '';
  const freeTime = typeof memory?.freeTime === 'string' ? memory.freeTime.trim() : '';
  const studentName = userProfile?.name || '';

  const kb = (INTERNAL_KB.clubs || []).find(c => c && typeof c === 'object' && c.name === safeClub.name) || null;
  const kbThreshold = kb?.threshold || '';
  const kbActivityTime = kb?.activityTime || '';
  const kbSuitableMajors = Array.isArray(kb?.suitableMajors) ? kb.suitableMajors.filter(Boolean).slice(0, 10) : [];
  const kbBonus = kb?.bonus || '';

  const system = language === 'en'
    ? [
        'You are the student and you write a club application self-introduction in a natural, handwritten student voice.',
        'Hard constraints:',
        '- Do NOT fabricate specific awards, internships, projects, positions, or competition results.',
        '- Avoid empty clichés and template phrases. Do not use lines like: "I am passionate about...", "I hope to improve myself...", "I have always loved...", "I believe I can learn a lot".',
        '- Must be specific to the chosen club: mention 2 concrete reasons based on the club description/tags/KB info.',
        '- Must include 1 concrete personal fit: connect major/interests to what you can contribute (use "I am learning..." if you cannot assert past experience).',
        '- Must include a realistic time commitment plan (flexible but specific, e.g., weekly attendance + how you handle exam weeks).',
        '- Must include 1 sentence about teamwork/collaboration.',
      '- Must naturally incorporate student details (college/grade/availability) if provided.',
        '- Output ONLY the self introduction text (2-3 short paragraphs), no title, no bullet points.',
        '- 90 to 170 words.'
      ].join('\n')
    : [
        '你扮演“申请入会的学生本人”，写一段社团入会申请的自我介绍/申请理由，口吻像真实大学生手写：真诚、接地气、不官腔。',
        '硬性约束：',
        '- 禁止编造任何具体奖项/实习/项目/职务/比赛成绩等事实；不能写“我参加过××比赛获奖/当过部长”等未给出的经历。',
        '- 禁止空洞套话与模板腔。不要出现这类句式：',
        '  “我对××充满热情/一直以来很喜欢/希望提升自我/相信能学到很多/希望在社团中锻炼自己/希望结识志同道合的朋友”。',
        '- 必须针对所选社团定制：基于社团简介/标签/知识库信息写出至少 2 个具体理由（要落到活动形态或方向上）。',
        '- 必须结合个人画像：把“专业/兴趣”与能贡献的能力联系起来；如果不能确定经历，用“我正在学习/我计划补齐”表达，别硬编。',
        '- 必须写出可执行的时间投入承诺：例如每周至少参加 1 次活动/训练；考试周提前沟通、保证不失联。',
        '- 必须有 1 句体现团队协作（分工、沟通、按时交付）。',
      '- 如果提供了学院/年级/性别/课余时间安排，请自然融入，不要生硬罗列。',
        '- 只输出正文，2~3 段短段落，不要标题、不要列表。',
        '- 160~260 字。'
      ].join('\n');

  const user = language === 'en'
    ? [
        `Club: ${name}${category ? ` (${category})` : ''}`,
        `Club description: ${description || 'N/A'}`,
        `Club tags: ${tags.length > 0 ? tags.join(', ') : 'N/A'}`,
        `Club KB (if available) - requirements: ${kbThreshold || 'N/A'}`,
        `Club KB (if available) - schedule: ${kbActivityTime || 'N/A'}`,
        `Club KB (if available) - suitable majors: ${kbSuitableMajors.length > 0 ? kbSuitableMajors.join(', ') : 'N/A'}`,
        `Club KB (if available) - bonus/notes: ${kbBonus || 'N/A'}`,
        `Student name: ${studentName || 'N/A'}`,
        `Student college: ${college || 'N/A'}`,
        `Student grade: ${grade || 'N/A'}`,
        `Student gender: ${gender || 'N/A'}`,
        `Student major: ${major || 'N/A'}`,
        `Student interests: ${interests.length > 0 ? interests.join(', ') : 'N/A'}`,
        `Student availability: ${freeTime || 'N/A'}`
      ].join('\n')
    : [
        `社团：${name}${category ? `（${category}）` : ''}`,
        `社团简介：${description || '暂无'}`,
        `社团标签：${tags.length > 0 ? tags.join('、') : '暂无'}`,
        `社团知识库（如有）：门槛/要求：${kbThreshold || '未收录'}`,
        `社团知识库（如有）：活动安排：${kbActivityTime || '未收录'}`,
        `社团知识库（如有）：适合专业：${kbSuitableMajors.length > 0 ? kbSuitableMajors.join('、') : '未收录'}`,
        `社团知识库（如有）：综测/建议：${kbBonus || '未收录'}`,
        `学生姓名：${studentName || '未提供'}`,
        `学院：${college || '未提供'}`,
        `年级：${grade || '未提供'}`,
        `性别：${gender || '未提供'}`,
        `学生专业：${major || '未提供'}`,
        `学生兴趣：${interests.length > 0 ? interests.join('、') : '未提供'}`,
        `课余时间：${freeTime || '未提供'}`
      ].join('\n');

  const response = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUBAO_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.6,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
};

export const generateLeaveRequestReason = async (club, userProfile = null, memory = null, language = 'zh') => {
  const safeClub = club && typeof club === 'object' ? club : {};
  const name = safeClub.name || (language === 'zh' ? '该社团' : 'the club');
  const category = safeClub.category || '';
  const description = safeClub.description || '';
  const tags = Array.isArray(safeClub.tags) ? safeClub.tags.filter(Boolean).slice(0, 8) : [];

  const major = typeof memory?.major === 'string' ? memory.major.trim() : '';
  const interests = Array.isArray(memory?.interests) ? memory.interests.filter(Boolean).slice(0, 8) : [];

  const kb = (INTERNAL_KB.clubs || []).find(c => c && typeof c === 'object' && c.name === safeClub.name) || null;
  const kbActivityTime = kb?.activityTime || '';

  const system = language === 'en'
    ? [
        'You are the student writing a short, polite club leave request reason.',
        'Hard constraints:',
        '- Do NOT fabricate specific achievements or conflicts.',
        '- Avoid template clichés.',
        '- Must be specific and realistic: mention study load / schedule and how you will hand over responsibilities (if any).',
        '- Tone: sincere, not official, like a real student message.',
        '- Output ONLY the reason text (1-2 short paragraphs), no title, no bullet points.',
        '- 60 to 120 words.'
      ].join('\n')
    : [
        '你扮演“申请退出社团的学生本人”，写一段退社申请理由，语气礼貌但不官腔，像真实大学生发给社团负责人的消息。',
        '硬性约束：',
        '- 禁止编造具体经历与冲突（比如“我拿到××offer/要去实习”这类没给出的就别写）。',
        '- 禁止模板套话，别写“由于个人原因/希望提升自己”等空话。',
        '- 内容要具体可执行：说明最近课业/安排压力、可投入时间变化；如果涉及任务/资料，说明会配合交接。',
        '- 只输出正文，1~2 段短段落，不要标题、不要列表。',
        '- 100~180 字。'
      ].join('\n');

  const user = language === 'en'
    ? [
        `Club: ${name}${category ? ` (${category})` : ''}`,
        `Club description: ${description || 'N/A'}`,
        `Club tags: ${tags.length > 0 ? tags.join(', ') : 'N/A'}`,
        `Club schedule (KB if available): ${kbActivityTime || 'N/A'}`,
        `Student major: ${major || 'N/A'}`,
        `Student interests: ${interests.length > 0 ? interests.join(', ') : 'N/A'}`
      ].join('\n')
    : [
        `社团：${name}${category ? `（${category}）` : ''}`,
        `社团简介：${description || '暂无'}`,
        `社团标签：${tags.length > 0 ? tags.join('、') : '暂无'}`,
        `社团活动安排（知识库如有）：${kbActivityTime || '未收录'}`,
        `我的专业：${major || '未提供'}`,
        `我的兴趣：${interests.length > 0 ? interests.join('、') : '未提供'}`
      ].join('\n');

  const response = await fetch(DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUBAO_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.5,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
};

const pickBestClubMatches = (query, clubs, limit = 5) => {
  const q = normalizeText(query);
  if (!q) return [];

  const list = Array.isArray(clubs) ? clubs : [];
  const scored = list.map((club) => {
    const name = normalizeText(club?.name);
    const category = normalizeText(club?.category);
    const desc = normalizeText(club?.description);
    const tags = Array.isArray(club?.tags) ? club.tags.map(normalizeText) : [];

    let score = 0;
    if (name && q.includes(name)) score += 10;
    if (category && q.includes(category)) score += 4;
    if (desc && desc.includes(q)) score += 2;
    for (const t of tags) {
      if (t && q.includes(t)) score += 3;
    }

    return { club, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.club);
};

const buildEmbeddedKbContext = (query, clubs, language = 'zh') => {
  const matched = pickBestClubMatches(query, clubs, 5);
  const kbClubs = Array.isArray(INTERNAL_KB.clubs) ? INTERNAL_KB.clubs : [];

  const byName = new Map(
    kbClubs
      .filter((c) => c && typeof c === 'object' && typeof c.name === 'string')
      .map((c) => [c.name, c])
  );

  const lines = matched.map((club) => {
    const kb = club?.name ? byName.get(club.name) : null;
    const tags = Array.isArray(club?.tags) ? club.tags.filter(Boolean) : [];

    const threshold = kb?.threshold || '';
    const activityTime = kb?.activityTime || '';
    const suitableMajors = Array.isArray(kb?.suitableMajors) ? kb.suitableMajors.filter(Boolean) : [];
    const bonus = kb?.bonus || '';

    if (language === 'en') {
      return [
        `- Club: ${club?.name || 'Unknown'} (${club?.category || 'Unknown'})`,
        `  Description: ${club?.description || 'N/A'}`,
        `  Tags: ${tags.length > 0 ? tags.join(', ') : 'N/A'}`,
        `  Requirements: ${threshold || 'Not recorded'}`,
        `  Schedule: ${activityTime || 'Not recorded'}`,
        `  Suitable majors: ${suitableMajors.length > 0 ? suitableMajors.join(', ') : 'Not recorded'}`,
        `  Comprehensive score bonus: ${bonus || 'Not recorded'}`
      ].join('\n');
    }

    return [
      `- 社团：${club?.name || '未知'}（${club?.category || '未知类别'}）`,
      `  简介：${club?.description || '暂无'}`,
      `  标签：${tags.length > 0 ? tags.join('、') : '暂无'}`,
      `  门槛：${threshold || '未收录'}`,
      `  活动时间：${activityTime || '未收录'}`,
      `  适合专业：${suitableMajors.length > 0 ? suitableMajors.join('、') : '未收录'}`,
      `  综测加分：${bonus || '未收录'}`
    ].join('\n');
  });

  const wantsExit = /(退出|退社|退团|离开社团|leave)/i.test(String(query || ''));
  const exitGuide = INTERNAL_KB.exitGuide && typeof INTERNAL_KB.exitGuide === 'object'
    ? INTERNAL_KB.exitGuide
    : null;

  const exitText = wantsExit && exitGuide
    ? (language === 'en'
        ? `\n\n【Club Exit Guide】\n- Process: ${exitGuide.process}\n- Notes: ${exitGuide.notes}`
        : `\n\n【社团退出指引】\n- ${exitGuide.process}\n- ${exitGuide.notes}`)
    : '';

  if (lines.length === 0) {
    return (language === 'en'
      ? `\n\n【Embedded Campus KB (${INTERNAL_KB.school})】\nNo relevant entries found for this query.`
      : `\n\n【内置校园知识库（${INTERNAL_KB.school}）】\n未检索到与本问题匹配的知识条目。`) + exitText;
  }

  return (language === 'en'
    ? `\n\n【Embedded Campus KB (${INTERNAL_KB.school})】\n${lines.join('\n\n')}`
    : `\n\n【内置校园知识库（${INTERNAL_KB.school}）】\n${lines.join('\n\n')}`) + exitText;
};

const buildStrictAnswerRules = (language = 'zh') => {
  if (language === 'en') {
    return `\n\n【Answer Constraints】\n1) For any club-related question, ONLY use facts explicitly provided in: (a) Embedded Campus KB, (b) the platform club list/context in this prompt, (c) long-term memory.\n2) If a requested detail is not present (e.g., requirements, schedule, bonus), you MUST reply “Not recorded in the knowledge base” and suggest how to obtain it (contact the club/admin).\n3) Do NOT browse the web, do NOT guess, do NOT fabricate.\n4) When recommending, cite the specific club fields you used (category/tags/description/records).\n\n【Style Guide】\n- Keep text concise and readable; avoid large unbroken paragraphs.\n- Use short sections (e.g., 【Summary】, 【Why this club】, 【Requirements】, 【Schedule】) and lightweight bullet lines.\n- Do not drop any provided club facts; reorganize them for clarity.`;
  }
  return `\n\n【回答约束】\n1）所有“社团相关问题”只能使用本提示词中明确给出的事实：①【内置校园知识库】②【平台社团列表/用户数据上下文】③【用户长期记忆】。\n2）遇到知识库未收录的信息（如门槛/活动时间/综测加分等），必须明确回答“知识库未收录”，并建议用户联系社团/管理员获取。\n3）禁止联网搜索、禁止猜测、禁止编造。\n4）做推荐时必须引用你依据的具体字段（类别/标签/简介/记录）。\n\n【排版风格】\n- 文案精简精炼，避免大段堆砌。\n- 用清晰分段+轻量列表呈现：先给结论，再给依据。\n- 不得删除任何已提供的社团事实信息，只能重排让阅读更清爽。`;
};

/**
 * 判断用户问题是否需要网络搜索
 * 不需要搜索：社团相关、平台功能、申请流程等数据库覆盖的内容
 * 需要搜索：天气、新闻、实时信息、通用知识等
 */
const needsWebSearch = (message) => {
  if (!ENABLE_WEB_SEARCH) return false;
  const lowerMsg = message.toLowerCase();
  
  // 不需要搜索的关键词（社团平台相关）
  const noSearchKeywords = [
    '社团', '俱乐部', '招新', '报名', '申请', '加入', '活动',
    'club', 'recruit', 'apply', 'join', 'activity',
    '管理员', '审核', '收藏', 'favorite', 'approve',
    '成员', 'member', '社团列表', '平台'
  ];
  
  // 需要搜索的关键词（实时信息）
  const searchKeywords = [
    '天气', 'weather', '温度', 'temperature',
    '新闻', 'news', '今日', '今天', '最新',
    '股票', '股价', '汇率', 'exchange rate',
    '比分', '比赛结果', 'score', 'match',
    '什么是', 'how to', 'what is', '怎么', '如何做',
    '介绍一下', '告诉我关于', 'tell me about',
    '现在几点', '时间', 'current time',
    '流感', '疫情', '病毒', 'disease',
    '比赛', '赛事', 'tournament'
  ];
  
  // 如果包含社团相关词，不搜索
  const hasClubKeyword = noSearchKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
  
  // 如果包含实时信息关键词，需要搜索
  const hasSearchKeyword = searchKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
  
  // 如果是纯粹的社团问题，不搜索
  if (hasClubKeyword && !hasSearchKeyword) {
    return false;
  }
  
  // 如果是问天气、新闻、通用知识等，搜索
  return hasSearchKeyword;
};

/**
 * 获取网络搜索结果
 * @param {string} query - 搜索关键词
 * @param {string} language - 当前语言
 * @returns {Promise<string>} - 搜索结果摘要
 */
const getWebSearchResults = async (query, language = 'zh') => {
  try {
    // 这里可以调用实际的搜索 API
    // 由于当前环境有 web_search 工具，我们模拟一个搜索函数
    // 实际项目中可以接入 Google Search API、Bing Search API 等
    
    const searchPrompt = language === 'zh' 
      ? `用一句话简洁回答：${query}，只返回事实性信息，不要编造。`
      : `Answer concisely in one sentence: ${query}, only return factual information.`;
    
    // 这里可以发起搜索请求
    // 由于豆包模型本身有一定的知识库，我们主要用它来判断何时需要搜索
    // 实际生产环境建议接入真实搜索 API
    
    return null; // 返回 null 表示使用 AI 自身知识
  } catch (error) {
    console.error('Web search failed:', error);
    return null;
  }
};

/**
 * 调用豆包 AI API 获取回复
 * @param {string} userMessage - 用户消息
 * @param {Array} clubs - 社团列表数据（作为上下文）
 * @param {Object} userProfile - 用户资料
 * @param {Function} onChunk - 流式回调
 * @param {Object} extraData - 额外数据
 * @param {Array} conversationHistory - 对话历史
 * @param {string} language - 当前语言 'zh' | 'en'
 * @returns {Promise<string>} - AI 回复内容
 */
export const callDoubaoAI = async (userMessage, clubs = [], userProfile = null, onChunk = null, extraData = {}, conversationHistory = [], language = 'zh') => {
  try {
    // 构建系统提示词，包含社团信息上下文
    const systemPrompt = buildSystemPrompt(clubs, userProfile, extraData, language, null, userMessage);

    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: buildMessages(systemPrompt, userMessage, conversationHistory),
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('API 返回格式异常');
    }
  } catch (error) {
    console.error('豆包 AI 调用失败:', error);
    throw error;
  }
};

/**
 * 构建消息列表（支持多轮对话）
 */
const buildMessages = (systemPrompt, userMessage, conversationHistory = []) => {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // 添加对话历史
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });
  
  // 添加当前用户消息
  messages.push({ role: 'user', content: userMessage });
  
  return messages;
};

const buildMemoryInfo = (memory, language = 'zh') => {
  if (!memory || typeof memory !== 'object') return '';

  const major = typeof memory.major === 'string' ? memory.major.trim() : '';
  const interests = Array.isArray(memory.interests)
    ? memory.interests.map(i => (typeof i === 'string' ? i.trim() : '')).filter(Boolean).slice(0, 12)
    : [];

  const mentionedApps = Array.isArray(memory.applications)
    ? memory.applications
        .filter(a => a && typeof a === 'object' && typeof a.club_name === 'string')
        .map(a => a.club_name.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  if (!major && interests.length === 0 && mentionedApps.length === 0) return '';

  if (language === 'en') {
    const lines = [];
    if (major) lines.push(`- Major: ${major}`);
    if (interests.length > 0) lines.push(`- Interests: ${interests.join(', ')}`);
    if (mentionedApps.length > 0) lines.push(`- Club applications mentioned: ${mentionedApps.join(', ')}`);
    return `\n\n【Long-term Memory】\n${lines.join('\n')}`;
  }

  const lines = [];
  if (major) lines.push(`- 专业：${major}`);
  if (interests.length > 0) lines.push(`- 兴趣：${interests.join('、')}`);
  if (mentionedApps.length > 0) lines.push(`- 提到的申请：${mentionedApps.join('、')}`);
  return `\n\n【用户长期记忆】\n${lines.join('\n')}`;
};

/**
 * 构建系统提示词（增强版）
 * @param {Array} clubs - 社团列表
 * @param {Object} userProfile - 用户资料
 * @param {Object} extraData - 额外数据（活动、申请、收藏等）
 * @param {string} language - 当前语言 'zh' | 'en'
 * @returns {string} - 系统提示词
 */
const buildSystemPrompt = (clubs, userProfile, extraData = {}, language = 'zh', memory = null, userMessage = '') => {
  const {
    activities = [],
    joinedClubs = [],
    applications = [],
    favorites = [],
    clubPosts = []
  } = extraData;
  
  // 筛选正在招新的社团
  const recruitingClubs = clubs.filter(c => c.is_recruiting);
  
  // 获取用户已加入的社团ID列表
  const joinedClubIds = joinedClubs?.map(m => m.club_id) || [];
  const joinedClubNames = joinedClubIds.map(id => {
    const club = clubs.find(c => c.id === id);
    return club?.name || (language === 'zh' ? '未知社团' : 'Unknown Club');
  });
  
  // 获取用户已申请的社团
  const appliedClubIds = applications?.map(a => a.club_id) || [];
  
  // 获取用户收藏的社团
  const favoriteClubIds = favorites?.map(f => f.club_id) || [];
  
  // 根据语言返回社团信息
  const getLocalizedText = () => {
    if (language === 'en') {
      return {
        userInfo: userProfile 
          ? `Current User: ${userProfile.name || 'Unknown'}, Role: ${userProfile.role || 'Student'}${userProfile.student_id ? `, Student ID: ${userProfile.student_id}` : ''}`
          : 'Current User: Guest',
        joinedClubsTitle: joinedClubNames.length > 0 
          ? `\n\n【Your Clubs】${joinedClubNames.length} clubs joined:\n   ${joinedClubNames.join(', ')}`
          : userProfile ? '\n\n【Your Clubs】You haven\'t joined any clubs yet' : '',
        applicationStatus: applications && applications.length > 0
          ? `\n\n【Application Status】${applications.filter(a => a.status === 'pending').length} pending, ${applications.filter(a => a.status === 'rejected').length} rejected`
          : '',
        favoritesTitle: favoriteClubIds.length > 0
          ? '\n\n【Your Favorites】' + favoriteClubIds.map(id => {
              const club = clubs.find(c => c.id === id);
              return club?.name || 'Unknown';
            }).join(', ')
          : '',
        clubsListTitle: '\n\n【Club List】（Clubs Currently Recruiting）',
        noClubs: 'No clubs currently recruiting',
        duties: [
          'Recommend suitable clubs based on student interests, major, and needs',
          'Answer questions about clubs (activities, schedule, requirements, contacts, etc.)',
          'Provide professional advice on choosing clubs',
          'Introduce club features and advantages',
          'Ask questions to understand their interests if they\'re unsure',
          '【Smart Detection】When user says "apply", "join", "sign up", proactively ask if they need help',
          '【Proactive Service】Inform students about:',
          '   - Whether the club is recruiting',
          '   - Whether the student has joined/applied/favorited the club',
          '   - Club contacts and contact information',
          '   - Recent club activities'
        ],
        cardFormat: 'When recommending clubs or activities, you can include smart cards:\n- Club card: [卡片:club:ClubID:ClubName:ClubDescription:Action]\n- Activity card: [卡片:activity:ClubID:ActivityTitle:DateLocation:Action]\n\nExample:\n- [卡片:club:c123:Programming Club:For programming enthusiasts:View Details|Apply Now]\n- [卡片:activity:a456:Weekend Hackathon:May 20th 14:00:View Details|Sign Up]',
        answerRequirements: [
          'Be friendly and enthusiastic, like a helpful senior student',
          'Be concise and clear in your answers',
          'Explain why you recommend specific clubs',
          'If unsure, be honest and suggest contacting the club directly',
          'Ask about grade, major, interests for more personalized recommendations',
          'If long-term memory already includes major/interests/application info, do not ask again; use it directly and only confirm when necessary'
        ],
        webSearchGuidance: '【Web Search Usage】If user asks about real-time info (weather, news, general knowledge), you can use web search. If user asks about clubs, activities, platform features - use the provided database context, do NOT search.',
        searchKeywords: 'Web search is helpful for: weather, news, current events, general knowledge. Web search is NOT needed for: club recommendations, activity info, application help, platform questions.',
        languageInstruction: 'IMPORTANT: You MUST respond in the SAME language the user is using. If the user writes in English, reply in English. If the user writes in Chinese, reply in Chinese.',
        useEmoji: 'Feel free to use emoji to make the conversation more lively'
      };
    }
    
    // 中文
    return {
      userInfo: userProfile 
        ? `当前用户：${userProfile.name || '未知'}，角色：${userProfile.role || '学生'}${userProfile.student_id ? `，学号：${userProfile.student_id}` : ''}`
        : '当前用户：访客',
      joinedClubsTitle: joinedClubNames.length > 0 
        ? `\n\n【您已加入的社团】共 ${joinedClubNames.length} 个：\n   ${joinedClubNames.join('、')}`
        : userProfile ? '\n\n【您已加入的社团】您还没有加入任何社团' : '',
      applicationStatus: applications && applications.length > 0
        ? `\n\n【申请状态】待审核 ${applications.filter(a => a.status === 'pending').length} 个、已拒绝 ${applications.filter(a => a.status === 'rejected').length} 个`
        : '',
      favoritesTitle: favoriteClubIds.length > 0
        ? '\n\n【您收藏的社团】' + favoriteClubIds.map(id => {
            const club = clubs.find(c => c.id === id);
            return club?.name || '未知';
          }).join('、')
        : '',
      clubsListTitle: '\n\n【平台社团列表】（正在招新的社团）',
      noClubs: '暂无正在招新的社团',
      duties: [
        '根据学生的兴趣、专业和需求，推荐合适的社团',
        '解答关于社团的各类问题（活动、时间、要求、负责人等）',
        '提供选择社团的专业建议',
        '介绍社团的特点和优势',
        '如果学生不确定选什么，通过提问了解他们的兴趣爱好',
        '【智能识别】当用户说"申请"、"加入"、"报名"等关键词时，主动询问是否需要帮助申请',
        '【主动服务】主动告知学生：',
        '   - 社团是否正在招新',
        '   - 学生是否已加入/已申请/已收藏该社团',
        '   - 社团的负责人和联系方式',
        '   - 社团的近期活动'
      ],
      cardFormat: '当你推荐社团时，可以附带智能卡片供用户直接操作。格式如下：\n- 社团卡片：[卡片:club:社团ID:社团名称:社团简介:操作]\n- 活动卡片：[卡片:activity:社团ID:活动标题:活动时间地点:操作]\n\n例如：\n- [卡片:club:c123:程序设计协会:编程爱好者聚集地:查看详情|申请加入]\n- [卡片:activity:a456:周末编程马拉松:5月20日 14:00:查看详情|立即报名]',
      answerRequirements: [
        '语气友好、热情，像学长学姐一样亲切',
        '回答简洁明了，突出重点',
        '推荐社团时说明推荐理由',
        '如果不确定答案，诚实告知并建议学生直接联系社团',
        '可以询问学生的年级、专业、兴趣爱好来提供更精准的建议',
        '如果【用户长期记忆】里已经有专业/兴趣/申请信息，不要重复追问，直接基于这些信息给建议；需要更新时再简短确认'
      ],
      webSearchGuidance: '【网络搜索使用】如果用户询问实时信息（天气、新闻、通用知识等），可以使用网络搜索。如果用户询问社团、活动、平台功能等 - 请使用提供的数据库上下文，不要搜索。',
      searchKeywords: '适合搜索的内容：天气、新闻、时事、通用知识。不需要搜索的内容：社团推荐、活动详情、申请帮助、平台问题。',
      languageInstruction: '重要：你必须使用与用户相同的语言回复。如果用户用英文，你就用英文回复；如果用户用中文，你就用中文回复。',
      useEmoji: '适当使用 emoji 让对话更生动'
    };
  };
  
  const t = getLocalizedText();
  const memoryInfo = buildMemoryInfo(memory, language);
  const kbContext = buildEmbeddedKbContext(userMessage, recruitingClubs, language);
  const strictRules = buildStrictAnswerRules(language);
  
  // 构建社团信息文本
  const clubsInfo = recruitingClubs.map((club, index) => {
    // 查找该社团的活动
    const clubActivities = activities.filter(a => a.club_id === club.id && a.status === 'upcoming').slice(0, 2);
    const activityInfo = clubActivities.length > 0 
      ? clubActivities.map(a => `   📅 ${language === 'zh' ? '近期活动' : 'Upcoming'}: ${a.title} (${a.activity_date || (language === 'zh' ? '时间待定' : 'TBD')})`).join('\n')
      : '';
    
    // 检查用户状态
    let userStatus = '';
    if (joinedClubIds.includes(club.id)) {
      userStatus = language === 'zh' ? '\n   ✓ 您已加入此社团' : '\n   ✓ You have joined this club';
    } else if (appliedClubIds.includes(club.id)) {
      const app = applications.find(a => a.club_id === club.id);
      const statusText = language === 'zh' 
        ? (app?.status === 'pending' ? '待审核' : app?.status === 'rejected' ? '已拒绝' : '审核中')
        : (app?.status === 'pending' ? 'Pending' : app?.status === 'rejected' ? 'Rejected' : 'Under Review');
      userStatus = language === 'zh' ? `\n   ⏳ 您已申请加入（${statusText}）` : `\n   ⏳ You have applied (${statusText})`;
    } else if (favoriteClubIds.includes(club.id)) {
      userStatus = language === 'zh' ? '\n   ⭐ 您已收藏此社团' : '\n   ⭐ You have favorited this club';
    } else {
      userStatus = language === 'zh' ? '\n   ✅ 可申请加入' : '\n   ✅ Available to join';
    }
    
    const descLabel = language === 'zh' ? '简介' : 'Description';
    const tagsLabel = language === 'zh' ? '标签' : 'Tags';
    const membersLabel = language === 'zh' ? '成员数' : 'Members';
    const leaderLabel = language === 'zh' ? '负责人' : 'Leader';
    const contactLabel = language === 'zh' ? '联系方式' : 'Contact';
    const locationLabel = language === 'zh' ? '活动地点' : 'Location';
    const descPlaceholder = language === 'zh' ? '暂无描述' : 'No description';
    const tagsPlaceholder = language === 'zh' ? '暂无' : 'None';
    const leaderPlaceholder = language === 'zh' ? '暂无' : 'None';
    const contactPlaceholder = language === 'zh' ? '暂无' : 'None';
    const locationPlaceholder = language === 'zh' ? '待定' : 'TBD';
    
    return `${index + 1}. ${club.name}（${club.category}）
   ${descLabel}：${club.description || descPlaceholder}
   ${tagsLabel}：${club.tags?.join('、') || tagsPlaceholder}
   ${membersLabel}：${club.members || 0}${language === 'zh' ? '人' : ''}
   ${leaderLabel}：${club.president || leaderPlaceholder}
   ${contactLabel}：${club.contact || contactPlaceholder}
   ${locationLabel}：${club.location || locationPlaceholder}
   ${activityInfo}${userStatus}`;
  }).join('\n\n');

  // 近期活动
  let activitiesInfo = '';
  if (activities.length > 0) {
    const recentActivities = activities.slice(0, 5);
    const activitiesTitle = language === 'zh' ? '【近期社团活动】' : '【Recent Club Activities】';
    activitiesInfo = '\n\n' + activitiesTitle + '\n' + recentActivities.map(a => {
      const club = clubs.find(c => c.id === a.club_id);
      return `📅 ${a.title} | ${club?.name || (language === 'zh' ? '未知' : 'Unknown')} | ${a.activity_date || (language === 'zh' ? '待定' : 'TBD')}`;
    }).join('\n');
  }

  const dutyTitle = language === 'zh' ? '你的职责' : 'Your Responsibilities';
  const cardTitle = language === 'zh' ? '【智能卡片】（重要）' : '【Smart Cards】（Important）';
  const onlyUseWhen = language === 'zh' ? '只有在真正推荐具体社团或活动时才使用卡片，不要滥用。' : 'Only use cards when recommending specific clubs or activities, don\'t overuse.';
  const answerTitle = language === 'zh' ? '回答要求' : 'Answer Requirements';

  return `${language === 'zh' ? '你是高校社团招新平台的 AI 社团顾问，专门帮助学生找到最适合自己的社团。' : 'You are the AI Club Advisor for the Campus Club Recruitment Platform, helping students find the most suitable clubs.'}

${t.userInfo}${memoryInfo}${kbContext}${strictRules}${t.joinedClubsTitle}${t.applicationStatus}${t.favoritesTitle}${activitiesInfo}

${t.clubsListTitle}

${clubsInfo || t.noClubs}

${dutyTitle}：
${t.duties.map((d, i) => `${i + 1}. ${d}`).join('\n')}

${cardTitle}
${t.cardFormat}

${onlyUseWhen}

${answerTitle}：
${t.answerRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

${t.languageInstruction}
${t.useEmoji}

${t.webSearchGuidance}
${t.searchKeywords}`;
};

/**
 * 流式调用豆包 AI API（用于打字机效果）
 * @param {string} userMessage - 用户消息
 * @param {Array} clubs - 社团列表数据
 * @param {Object} userProfile - 用户资料
 * @param {Function} onChunk - 每次收到数据块的回调
 * @param {Object} extraData - 额外数据
 * @param {Array} conversationHistory - 对话历史
 * @param {string} language - 当前语言 'zh' | 'en'
 * @param {Function} webSearchFn - 可选的网络搜索函数
 * @returns {Promise<void>}
 */
export const streamDoubaoAI = async (userMessage, clubs, userProfile, onChunk, extraData = {}, conversationHistory = [], language = 'zh', webSearchFn = null, memory = null) => {
  try {
    const systemPrompt = buildSystemPrompt(clubs, userProfile, extraData, language, memory, userMessage);
    let messages = buildMessages(systemPrompt, userMessage, conversationHistory);

    // 检查是否需要网络搜索
    if (webSearchFn && needsWebSearch(userMessage)) {
      try {
        // 通知前端开始搜索
        onChunk('', '', { searching: true });
        
        // 执行网络搜索
        const searchResults = await webSearchFn(userMessage);
        
        // 如果有搜索结果，添加到上下文中
        if (searchResults) {
          const searchContext = language === 'zh'
            ? `\n\n【网络搜索结果】\n${searchResults}\n\n请基于以上搜索结果回答用户问题。`
            : `\n\n【Web Search Results】\n${searchResults}\n\nPlease answer based on the search results above.`;
          
          // 在最后一条用户消息后追加搜索结果
          const lastUserMsgIndex = messages.length - 1;
          messages[lastUserMsgIndex].content += searchContext;
        }
        
        // 通知前端搜索完成
        onChunk('', '', { searching: false });
      } catch (searchError) {
        console.error('Web search error:', searchError);
        // 搜索失败不影响正常流程，继续使用 AI 自身知识
        onChunk('', '', { searching: false });
      }
    }

    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
        
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.slice(6));
            if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
              const content = jsonData.choices[0].delta.content;
              fullContent += content;
              onChunk(content, fullContent);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('流式调用失败:', error);
    throw error;
  }
};

/**
 * AI 可执行的工具定义（Phase 4: Function Calling）
 */
export const AI_TOOLS = [
  {
    name: 'apply_club',
    description: '申请加入社团。用户想要申请加入某个社团时调用。',
    parameters: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: '社团ID' },
        motivation: { type: 'string', description: '申请理由（可选）' }
      },
      required: ['club_id']
    }
  },
  {
    name: 'search_clubs',
    description: '搜索社团。可以按关键词或类别搜索社团。',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        category: { type: 'string', description: '社团类别' }
      }
    }
  },
  {
    name: 'get_club_activities',
    description: '获取社团的活动列表。',
    parameters: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: '社团ID' }
      },
      required: ['club_id']
    }
  },
  {
    name: 'cancel_application',
    description: '取消社团申请。用户想要取消之前提交的申请时调用。',
    parameters: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: '社团ID' }
      },
      required: ['club_id']
    }
  },
  {
    name: 'favorite_club',
    description: '收藏或取消收藏社团。',
    parameters: {
      type: 'object',
      properties: {
        club_id: { type: 'string', description: '社团ID' },
        action: { type: 'string', enum: ['add', 'remove'], description: '操作：add添加收藏，remove取消收藏' }
      },
      required: ['club_id', 'action']
    }
  }
];

/**
 * 执行 AI 调用的工具
 * @param {string} toolName - 工具名称
 * @param {Object} params - 工具参数
 * @param {Object} context - 上下文（user, supabase等）
 * @returns {Promise<Object>} - 执行结果
 */
export const executeAITool = async (toolName, params, context) => {
  const { supabase, user } = context;
  
  try {
    switch (toolName) {
      case 'apply_club':
        return await executeApplyClub(params, supabase, user);
      
      case 'search_clubs':
        return await executeSearchClubs(params);
      
      case 'get_club_activities':
        return await executeGetClubActivities(params, supabase);
      
      case 'cancel_application':
        return await executeCancelApplication(params, supabase, user);
      
      case 'favorite_club':
        return await executeFavoriteClub(params, supabase, user);
      
      default:
        return { success: false, error: `未知工具: ${toolName}` };
    }
  } catch (error) {
    console.error(`执行工具 ${toolName} 失败:`, error);
    return { success: false, error: error.message };
  }
};

// 工具执行函数
const executeApplyClub = async (params, supabase, user) => {
  if (!user) return { success: false, error: '请先登录' };
  
  const { club_id, motivation } = params;
  
  // 检查是否已申请
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('club_id', club_id)
    .maybeSingle();
  
  if (existing) {
    if (existing.status === 'approved') {
      return { success: false, error: '您已经是该社团成员了' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: '您已经申请过了，请等待审核' };
    }
  }
  
  // 检查是否已是成员
  const { data: member } = await supabase
    .from('club_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('club_id', club_id)
    .eq('status', 'active')
    .maybeSingle();
  
  if (member) {
    return { success: false, error: '您已经是该社团成员了' };
  }
  
  // 提交申请
  const { data, error } = await supabase
    .from('applications')
    .insert([{
      user_id: user.id,
      club_id,
      motivation: motivation || '',
      status: 'pending',
      apply_time: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return { success: true, message: '申请已提交，等待社团管理员审核' };
};

const executeSearchClubs = async (params) => {
  // 搜索功能通过前端过滤实现，这里返回搜索参数
  return { success: true, params };
};

const executeGetClubActivities = async (params, supabase) => {
  const { club_id } = params;
  
  const { data, error } = await supabase
    .from('club_activities')
    .select('*')
    .eq('club_id', club_id)
    .eq('status', 'upcoming')
    .order('activity_date', { ascending: true })
    .limit(10);
  
  if (error) throw error;
  
  return { success: true, activities: data || [] };
};

const executeCancelApplication = async (params, supabase, user) => {
  if (!user) return { success: false, error: '请先登录' };
  
  const { club_id } = params;
  
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', user.id)
    .eq('club_id', club_id)
    .eq('status', 'pending');
  
  if (error) throw error;
  
  return { success: true, message: '申请已取消' };
};

const executeFavoriteClub = async (params, supabase, user) => {
  if (!user) return { success: false, error: '请先登录' };
  
  const { club_id, action } = params;
  
  if (action === 'add') {
    const { error } = await supabase
      .from('favorite_clubs')
      .insert([{ user_id: user.id, club_id }]);
    
    if (error && error.code !== '23505') throw error;
    return { success: true, message: '已添加到收藏' };
  } else {
    const { error } = await supabase
      .from('favorite_clubs')
      .delete()
      .eq('user_id', user.id)
      .eq('club_id', club_id);
    
    if (error) throw error;
    return { success: true, message: '已取消收藏' };
  }
};
