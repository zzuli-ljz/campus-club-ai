// 豆包 AI API 服务
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_API_KEY = '31cabedd-8aa0-4745-a2f0-11d545bee4d2';
const DOUBAO_MODEL = 'doubao-1-5-lite-32k-250115';

/**
 * 调用豆包 AI API 获取回复
 * @param {string} userMessage - 用户消息
 * @param {Array} clubs - 社团列表数据（作为上下文）
 * @param {Object} userProfile - 用户资料
 * @returns {Promise<string>} - AI 回复内容
 */
export const callDoubaoAI = async (userMessage, clubs = [], userProfile = null) => {
  try {
    // 构建系统提示词，包含社团信息上下文
    const systemPrompt = buildSystemPrompt(clubs, userProfile);

    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
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
 * 构建系统提示词
 * @param {Array} clubs - 社团列表
 * @param {Object} userProfile - 用户资料
 * @returns {string} - 系统提示词
 */
const buildSystemPrompt = (clubs, userProfile) => {
  // 筛选正在招新的社团
  const recruitingClubs = clubs.filter(c => c.is_recruiting);
  
  // 构建社团信息文本
  const clubsInfo = recruitingClubs.map((club, index) => {
    return `${index + 1}. ${club.name}（${club.category}）
   简介：${club.description || '暂无描述'}
   标签：${club.tags?.join('、') || '暂无'}
   成员数：${club.members || 0}人
   地点：${club.location || '待定'}`;
  }).join('\n\n');

  const userInfo = userProfile 
    ? `当前用户：${userProfile.name || '未知'}，角色：${userProfile.role || '学生'}`
    : '当前用户：访客';

  return `你是高校社团招新平台的 AI 社团顾问，专门帮助学生找到最适合自己的社团。

${userInfo}

平台目前有 ${recruitingClubs.length} 个社团正在招新：

${clubsInfo || '暂无正在招新的社团'}

你的职责：
1. 根据学生的兴趣、专业和需求，推荐合适的社团
2. 解答关于社团的各类问题（活动、时间、要求等）
3. 提供选择社团的专业建议
4. 介绍社团的特点和优势
5. 如果学生不确定选什么，通过提问了解他们的兴趣爱好

回答要求：
- 语气友好、热情，像学长学姐一样亲切
- 回答简洁明了，突出重点
- 推荐社团时说明推荐理由
- 如果不确定答案，诚实告知并建议学生直接联系社团
- 可以询问学生的年级、专业、兴趣爱好来提供更精准的建议

请用中文回答，适当使用 emoji 让对话更生动。`;
};

/**
 * 流式调用豆包 AI API（用于打字机效果）
 * @param {string} userMessage - 用户消息
 * @param {Array} clubs - 社团列表数据
 * @param {Object} userProfile - 用户资料
 * @param {Function} onChunk - 每次收到数据块的回调
 * @returns {Promise<void>}
 */
export const streamDoubaoAI = async (userMessage, clubs, userProfile, onChunk) => {
  try {
    const systemPrompt = buildSystemPrompt(clubs, userProfile);

    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true, // 启用流式输出
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
