import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot, 
  User, 
  ArrowRight,
  MessageCircle,
  Lightbulb,
  Heart,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useInterests } from "@/hooks/useInterests";
import { useApplications } from "@/hooks/useApplications";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateApplicationSelfIntro, generateLeaveRequestReason, streamDoubaoAI } from "@/services/doubaoService";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";

/**
 * 网络搜索函数 - 获取实时信息
 * @param {string} query - 用户问题
 * @returns {Promise<string|null>} - 搜索结果或 null
 */
const performWebSearch = async (query) => {
  const lowerQuery = query.toLowerCase();
  
  // 检测天气相关问题
  if (lowerQuery.includes('天气') || lowerQuery.includes('weather')) {
    try {
      // 使用 wttr.in 免费天气 API（无需密钥）
      const city = extractCity(query) || 'beijing';
      const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition[0];
        return `【实时天气信息】\n` +
          `📍 ${data.nearest_area?.[0]?.areaName?.[0]?.value || city}\n` +
          `🌡️ 温度: ${current.temp_C}°C\n` +
          `💨 体感温度: ${current.FeelsLikeC}°C\n` +
          `💧 湿度: ${current.humidity}%\n` +
          `🌬️ 风速: ${current.windspeedKmph} km/h\n` +
          `☁️ 天气状况: ${current.weatherDesc[0].value}`;
      }
    } catch (error) {
      console.error('天气查询失败:', error);
    }
  }
  
  // 检测新闻相关问题
  if (lowerQuery.includes('新闻') || lowerQuery.includes('news') || lowerQuery.includes('今日')) {
    try {
      // 使用 Hacker News API 获取最新科技新闻
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (response.ok) {
        const ids = await response.json();
        const topStories = ids.slice(0, 5);
        const stories = await Promise.all(
          topStories.map(id => 
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
          )
        );
        const newsList = stories
          .filter(s => s && s.title)
          .map((s, i) => `${i + 1}. ${s.title}`)
          .join('\n');
        return `【最新科技新闻】\n${newsList}`;
      }
    } catch (error) {
      console.error('新闻查询失败:', error);
    }
  }
  
  // 检测汇率相关问题
  if (lowerQuery.includes('汇率') || lowerQuery.includes('exchange') || lowerQuery.includes('币')) {
    try {
      // 使用 exchangerate-api 免费 API
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (response.ok) {
        const data = await response.json();
        const rates = data.rates;
        return `【美元汇率参考】\n` +
          `💵 1 USD = ${rates.CNY?.toFixed(2)} CNY\n` +
          `💴 1 USD = ${rates.JPY?.toFixed(2)} JPY\n` +
          `💶 1 USD = ${rates.EUR?.toFixed(2)} EUR\n` +
          `💷 1 USD = ${rates.GBP?.toFixed(2)} GBP`;
      }
    } catch (error) {
      console.error('汇率查询失败:', error);
    }
  }
  
  return null; // 如果没有匹配的特殊查询，返回 null
};

/**
 * 从查询中提取城市名
 */
const extractCity = (query) => {
  const cityPatterns = [
    /(?:在|去|到|是)([\u4e00-\u9fa5]{2,6})(?:的|天气|那边)/,
    /([\u4e00-\u9fa5]{2,6})(?:天气|怎么样)/,
    /weather\s+(?:in\s+)?([a-zA-Z\s]+)/i
  ];
  
  for (const pattern of cityPatterns) {
    const match = query.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
};

// 预设问题快捷按钮
const quickQuestions = [
  { icon: Lightbulb, text: "推荐适合我的社团", category: "recommend" },
  { icon: Heart, text: "文艺类社团有哪些", category: "arts" },
  { icon: Users, text: "学术科技类社团推荐", category: "tech" },
  { icon: MessageCircle, text: "如何判断社团是否适合我", category: "tips" },
];

// 智能快捷问题（根据用户状态动态生成）
const getSmartQuestions = (userData) => {
  const baseQuestions = [...quickQuestions];
  
  if (userData?.joinedClubs?.length > 0) {
    // 如果用户已加入社团，添加相关问题
    baseQuestions.push({ 
      icon: Sparkles, 
      text: "我加入的社团有什么活动", 
      category: "my_activities" 
    });
  }
  
  return baseQuestions;
};

const getMemoryStorageKey = (userId) => `ai_persistent_memory_v1:${userId || "guest"}`;

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeInterests = (interests) => {
  const list = Array.isArray(interests) ? interests : [];
  const cleaned = list
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
  return Array.from(new Set(cleaned));
};

const loadPersistentMemory = (userId) => {
  const key = getMemoryStorageKey(userId);
  const raw = localStorage.getItem(key);
  const parsed = raw ? safeJsonParse(raw, null) : null;
  if (!parsed || typeof parsed !== "object") {
    return { version: 1, major: "", interests: [], college: "", grade: "", gender: "", freeTime: "", applications: [], updatedAt: "" };
  }
  return {
    version: 1,
    major: typeof parsed.major === "string" ? parsed.major : "",
    interests: normalizeInterests(parsed.interests),
    college: typeof parsed.college === "string" ? parsed.college : "",
    grade: typeof parsed.grade === "string" ? parsed.grade : "",
    gender: typeof parsed.gender === "string" ? parsed.gender : "",
    freeTime: typeof parsed.freeTime === "string" ? parsed.freeTime : "",
    applications: Array.isArray(parsed.applications) ? parsed.applications.slice(0, 50) : [],
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
  };
};

const savePersistentMemory = (userId, memory) => {
  const key = getMemoryStorageKey(userId);
  const toSave = {
    version: 1,
    major: typeof memory.major === "string" ? memory.major : "",
    interests: normalizeInterests(memory.interests),
    college: typeof memory.college === "string" ? memory.college : "",
    grade: typeof memory.grade === "string" ? memory.grade : "",
    gender: typeof memory.gender === "string" ? memory.gender : "",
    freeTime: typeof memory.freeTime === "string" ? memory.freeTime : "",
    applications: Array.isArray(memory.applications) ? memory.applications.slice(0, 50) : [],
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(toSave));
  return toSave;
};

const extractMajorFromText = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";

  const patterns = [
    /(?:我|我的)\s*(?:专业|主修|学的|学)\s*(?:是|为)?\s*([^\s，。；,.]{2,30})/,
    /(?:我是|我读|我在读)\s*([^\s，。；,.]{2,30})\s*(?:专业|系)/,
    /(?:major)\s*(?:is|:)\s*([a-zA-Z][a-zA-Z\s&-]{1,40})/i,
  ];

  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return "";
};

const splitInterestList = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return [];
  const normalized = s
    .replace(/[。！？!?\n\r]/g, " ")
    .replace(/以及|还有|并且|并|和/g, "、")
    .replace(/[，,\/\s]+/g, "、");
  return normalized
    .split("、")
    .map((x) => x.trim())
    .filter((x) => x && x.length <= 20)
    .slice(0, 20);
};

const extractInterestsFromText = (text) => {
  const t = String(text || "").trim();
  if (!t) return [];

  const patterns = [
    /(?:兴趣爱好|爱好\/?特长)\s*(?:是|有|为|:|：)?\s*([^\n。！？!?\r]{2,60})/,
    /(?:我的)?(?:兴趣|爱好)\s*(?:是|有|为)?\s*([^\n。！？!?\r]{2,60})/,
    /(?:我)?(?:喜欢|感兴趣|偏好)\s*([^\n。！？!?\r]{2,60})/,
  ];

  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return splitInterestList(m[1]);
  }
  return [];
};

const extractCollegeFromText = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";
  const patterns = [
    /(?:学院|院系|系)\s*(?:是|为|:|：)?\s*([^\s，。]{2,30}(?:学院|书院|系))/,
    /(?:我在|我来自|我读|我目前在)\s*([^\s，。]{2,30}(?:学院|书院|系))/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return "";
};

const extractGradeFromText = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";
  const m1 = t.match(/(大一|大二|大三|大四|研一|研二|研三)/);
  if (m1 && m1[1]) return m1[1];
  const m2 = t.match(/(\d{4})\s*级/);
  if (m2 && m2[1]) return `${m2[1]}级`;
  return "";
};

const extractGenderFromText = (text) => {
  const t = String(text || "");
  if (!t) return "";
  if (/(不方便|保密|不想说|不透露)/.test(t) && /(性别|gender)/i.test(t)) return "不方便透露";
  if (/(女生|女)/.test(t)) return "女";
  if (/(男生|男)/.test(t)) return "男";
  return "";
};

const extractFreeTimeFromText = (text) => {
  const t = String(text || "").trim();
  if (!t) return "";
  const patterns = [
    /每周[^。\n]{2,30}/,
    /(?:周一|周二|周三|周四|周五|周六|周日|周末)[^。\n]{2,30}/,
    /(?:晚上|下午|中午)[^。\n]{2,30}/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[0]) return m[0].trim();
  }
  return "";
};

const getMissingApplyProfileFields = (memory) => {
  const missing = [];
  if (!memory?.college) missing.push("学院");
  if (!memory?.grade) missing.push("年级");
  if (!Array.isArray(memory?.interests) || memory.interests.length === 0) missing.push("爱好/特长");
  if (!memory?.freeTime) missing.push("课余时间安排");
  if (!memory?.gender) missing.push("性别（可选）");
  return missing;
};

const extractApplicationMentions = (text, clubs) => {
  const t = String(text || "");
  if (!/(申请|报名|加入|提交申请|报了)/.test(t)) return [];
  const list = Array.isArray(clubs) ? clubs : [];
  const matched = [];
  for (const club of list) {
    if (club?.name && t.includes(club.name)) {
      matched.push({
        club_id: club.id,
        club_name: club.name,
        source: "chat",
        status: "mentioned",
        updated_at: new Date().toISOString(),
      });
    }
  }
  return matched.slice(0, 10);
};

const detectAgentIntent = (text) => {
  const t = String(text || "").trim();
  const lower = t.toLowerCase();

  const wantsLeaveStatus =
    /(退出|退社|退团).*(进度|状态|结果|审核|同意|通过|成功)|我退出了吗|退出了吗|退社了吗|退团了吗/.test(t) ||
    /\b(leave|quit)\b.*\b(status|result)\b/.test(lower);
  const wantsNewClubs =
    /(最近|最新|新开|新设|新成立|新增).*(社团|俱乐部)|新社团有哪些|新开的社团有哪些|最近开设的社团有哪些/.test(t) ||
    /\b(new|latest)\b.*\b(club|clubs)\b/.test(lower);
  const wantsLeave = /申请退出|退出|退社|退团|离开社团|退团申请/.test(t) || /\bleave\b/.test(lower);
  const wantsApplyDirect =
    /申请加入|提交申请|帮我报|帮我申请|替我申请|一键申请|直接申请/.test(t) ||
    /\bapply\b|\bjoin\b/.test(lower);
  const wantsApplyQuestion =
    /申请什么社团|加入什么社团|能申请什么社团|想加入什么社团|什么社团|哪个社团/.test(t);
  const wantsCancel = /取消|撤销|撤回/.test(t) && (/申请|报名/.test(t) || /\bcancel\b/.test(lower));
  const wantsStatus = /进度|状态|查询|查一下|看看/.test(t) && (/申请|报名/.test(t) || /\bstatus\b/.test(lower));
  const wantsRecommend = /推荐|适合我|给我选|帮我选|找.*社团|有哪些社团/.test(t) || /\brecommend\b/.test(lower);
  const wantsRecommendApply =
    /推荐.*(并|然后).*(申请|报名|加入)|推荐.*直接申请|并帮我(直接)?申请|推荐并申请/.test(t);

  if (wantsNewClubs) return { type: "new_clubs" };
  if (wantsLeaveStatus) return { type: "leave_status" };
  if (wantsLeave) return { type: "leave" };
  if (wantsCancel) return { type: "cancel" };
  if (wantsStatus) return { type: "status" };
  if (wantsApplyDirect && wantsRecommend && wantsRecommendApply) return { type: "recommend_apply" };
  if (wantsApplyDirect && wantsApplyQuestion) return null;
  if (wantsApplyDirect) return { type: "apply" };
  return null;
};

const isApplicationResultQuestion = (text) => {
  const t = String(text || "").trim();
  if (!t) return false;
  return /(通过了没|通过了吗|通过没有|过了吗|批了吗|审核结果|审核了吗|结果怎么样|结果如何|被拒了吗|拒了吗|拒了没|没通过|通过没)/.test(t);
};

const pickLatestLeaveRequestForClub = (leaveRequests, clubId) => {
  const list = Array.isArray(leaveRequests) ? leaveRequests : [];
  const candidates = list.filter((r) => r && r.club_id === clubId);
  if (candidates.length === 0) return null;
  const timeOf = (r) => {
    const raw = r?.updated_at || r?.updatedAt || r?.apply_time || r?.applyTime || r?.created_at || r?.createdAt || "";
    const ts = Date.parse(raw);
    return Number.isFinite(ts) ? ts : 0;
  };
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i += 1) {
    const cur = candidates[i];
    if (timeOf(cur) > timeOf(best)) best = cur;
  }
  return best;
};

const formatSingleLeaveStatus = (club, leaveRequest, isActiveMember, language) => {
  const clubName = club?.name || (language === "zh" ? "该社团" : "this club");
  const status = leaveRequest?.status || "";

  if (language !== "zh") {
    if (status === "approved") return `✅ Your leave request for "${clubName}" is approved.`;
    if (status === "rejected") return `❌ Your leave request for "${clubName}" was rejected.`;
    if (status === "pending") return `⏳ Your leave request for "${clubName}" is pending review.`;
    if (!leaveRequest && !isActiveMember) return `✅ You are not an active member of "${clubName}".`;
    if (!leaveRequest && isActiveMember) return `I can't find a leave request for "${clubName}".`;
    return `Leave status for "${clubName}": ${status || "unknown"}`;
  }

  if (status === "approved") return `✅ 「${clubName}」退社已通过：你已成功退出，成员权限已变更。`;
  if (status === "rejected") return `❌ 「${clubName}」退社未通过：管理员已拒绝你的退出申请。`;
  if (status === "pending") return `⏳ 「${clubName}」退社待审核：已提交申请，请等待管理员处理。`;
  if (!leaveRequest && !isActiveMember) return `✅ 你当前已不在「${clubName}」成员列表，应该已经退出了。`;
  if (!leaveRequest && isActiveMember) return `我没查到你对「${clubName}」的退社申请记录；如果你想退出，我可以帮你一键提交。`;
  return `「${clubName}」退社状态：${status || "未知"}`;
};

const pickLatestApplicationForClub = (applications, clubId) => {
  const list = Array.isArray(applications) ? applications : [];
  const candidates = list.filter((a) => a && a.club_id === clubId);
  if (candidates.length === 0) return null;
  const timeOf = (a) => {
    const raw = a?.updated_at || a?.updatedAt || a?.created_at || a?.createdAt || "";
    const ts = Date.parse(raw);
    return Number.isFinite(ts) ? ts : 0;
  };
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i += 1) {
    const cur = candidates[i];
    if (timeOf(cur) > timeOf(best)) best = cur;
  }
  return best;
};

const isActiveMemberOfClub = (joinedClubs, clubId) => {
  const list = Array.isArray(joinedClubs) ? joinedClubs : [];
  return list.some((m) => m && m.club_id === clubId);
};

const findLastReferencedClub = (clubs, conversationHistory) => {
  const list = Array.isArray(clubs) ? clubs : [];
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const c = String(history[i]?.content || "");
    if (!c) continue;
    const match = list.find((club) => club?.name && c.includes(club.name));
    if (match) return match;
  }
  return null;
};

const pickTargetClubFromText = (text, clubs) => {
  const t = String(text || "");
  const list = Array.isArray(clubs) ? clubs : [];
  const exact = list.find((c) => c?.name && t.includes(c.name));
  if (exact) return exact;

  const keywords = [
    { k: "编程", tag: "编程开发" },
    { k: "AI", tag: "人工智能" },
    { k: "英语", tag: "语言学习" },
    { k: "english", tag: "language" },
    { k: "摄影", tag: "摄影协会" },
    { k: "篮球", tag: "篮球" },
    { k: "志愿", tag: "志愿服务" },
    { k: "机器人", tag: "机器人" },
    { k: "合唱", tag: "合唱团" },
    { k: "羽毛球", tag: "羽毛球" }
  ];

  for (const { k, tag } of keywords) {
    if (t.toLowerCase().includes(String(k).toLowerCase())) {
      const found = list.find((c) => {
        const tags = Array.isArray(c?.tags) ? c.tags : [];
        return tags.some((x) => String(x).includes(tag) || String(tag).includes(x));
      });
      if (found) return found;
    }
  }

  return null;
};

const pickClubByFuzzyName = (text, clubs) => {
  const t = String(text || "").trim();
  const list = Array.isArray(clubs) ? clubs : [];
  if (!t || list.length === 0) return null;

  const candidates = list.filter((c) => c?.name && (c.name.includes(t) || t.includes(c.name)));
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return null;

  return pickTargetClubFromText(t, list);
};

const pickNewestClubs = (clubs, limit = 6) => {
  const list = Array.isArray(clubs) ? clubs.filter(Boolean) : [];
  const timeOf = (c) => {
    const raw = c?.created_at || c?.createdAt || c?.updated_at || c?.updatedAt || "";
    const ts = Date.parse(raw);
    return Number.isFinite(ts) ? ts : 0;
  };
  return list
    .slice()
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, Math.max(1, Math.min(12, limit)));
};

const pickBestClubForUser = (clubs, memory) => {
  const list = Array.isArray(clubs) ? clubs : [];
  const interests = Array.isArray(memory?.interests) ? memory.interests : [];
  if (list.length === 0) return null;
  if (interests.length === 0) return list[0];

  const scored = list.map((c) => {
    const tags = Array.isArray(c?.tags) ? c.tags : [];
    const hit = interests.reduce((acc, it) => (tags.some((t) => String(t).includes(it) || String(it).includes(t)) ? acc + 1 : acc), 0);
    return { club: c, score: hit };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.club || list[0];
};

const formatApplicationStatus = (applications, clubs, language) => {
  const list = Array.isArray(applications) ? applications : [];
  if (list.length === 0) {
    return language === "zh" ? "你目前没有任何社团申请记录。" : "You have no club applications yet.";
  }
  const statusLabel = (s) => {
    if (language !== "zh") return s;
    if (s === "pending") return "待审核";
    if (s === "approved") return "已通过";
    if (s === "rejected") return "已拒绝";
    return "未知";
  };
  const lines = list.slice(0, 8).map((a) => {
    const club = clubs.find((c) => c.id === a.club_id);
    return `- ${club?.name || (language === "zh" ? "未知社团" : "Unknown Club")}：${statusLabel(a.status)}`;
  });
  return lines.join("\n");
};

const formatSingleApplicationStatus = (club, application, isMember, language) => {
  const clubName = club?.name || (language === "zh" ? "该社团" : "this club");
  if (isMember) {
    return language === "zh"
      ? `✅ 「${clubName}」已通过：你目前已经是社团成员（个人中心会显示成员状态）。`
      : `✅ You're already a member of "${clubName}".`;
  }
  if (!application) {
    return language === "zh"
      ? `我这边没查到你对「${clubName}」的申请记录。`
      : `I can't find your application record for "${clubName}".`;
  }
  const status = application.status;
  if (language !== "zh") {
    if (status === "approved") return `✅ Your application for "${clubName}" is approved.`;
    if (status === "rejected") return `❌ Your application for "${clubName}" was rejected.`;
    if (status === "pending") return `⏳ Your application for "${clubName}" is pending review.`;
    return `Status for "${clubName}": ${status || "unknown"}`;
  }
  if (status === "approved") return `✅ 「${clubName}」已通过：你已经通过审核，可以在个人中心查看成员状态。`;
  if (status === "rejected") return `❌ 「${clubName}」未通过：你可以稍后重新提交申请（建议把自我介绍写得更具体）。`;
  if (status === "pending") return `⏳ 「${clubName}」待审核：请耐心等待社团管理员处理。`;
  return `「${clubName}」当前状态：${status || "未知"}`;
};

const AIAssistant = () => {
  const navigate = useNavigate();
  const { clubs, isLoading: clubsLoading } = useClubs();
  const { user, profile } = useUser();
  const { language } = useLanguage();
  const { getUserInterests } = useInterests();
  const { submitApplication } = useApplications();
  const { submitLeaveRequest } = useLeaveRequests();
  
  // 从 sessionStorage 恢复对话历史
  const getInitialMessages = () => {
    const saved = sessionStorage.getItem('ai_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 恢复日期对象
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error('恢复对话历史失败:', e);
      }
    }
    return [
      {
        id: "welcome",
        type: "ai",
        content: language === "zh" 
          ? "你好！我是你的 AI 社团顾问 🤖\n\n我可以帮你推荐适合的社团、解答社团相关问题，或提供选择社团的建议。\n\n请告诉我你的兴趣爱好，或者想了解哪方面的社团信息？"
          : "Hello! I'm your AI Club Advisor 🤖\n\nI can help you find suitable clubs, answer club-related questions, or give advice on choosing clubs.\n\nTell me about your interests or what kind of clubs you'd like to know about?",
        timestamp: new Date(),
        isEnhanced: false,
      },
    ];
  };

  const getInitialConversationHistory = () => {
    const saved = sessionStorage.getItem('ai_conversation_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('恢复对话历史失败:', e);
      }
    }
    return [];
  };

  // 多轮对话状态
  const [messages, setMessages] = useState(getInitialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationHistory, setConversationHistory] = useState(getInitialConversationHistory);
  const [persistentMemory, setPersistentMemory] = useState(() => loadPersistentMemory(user?.id));
  const [streamingDisplay, setStreamingDisplay] = useState("");
  const [agentStatus, setAgentStatus] = useState({ running: false, label: "" });
  const [pendingApplyContext, setPendingApplyContext] = useState(null);
  const [pendingLeaveContext, setPendingLeaveContext] = useState(null);
  const [applyProfileDraft, setApplyProfileDraft] = useState({
    college: "",
    grade: "",
    gender: "",
    interests: "",
    freeTime: "",
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const streamingTargetRef = useRef("");
  const streamingDisplayRef = useRef("");
  
  const handleApplyProfileSubmit = () => {
    if (!pendingApplyContext) return;

    const college = (applyProfileDraft.college || "").trim();
    const grade = (applyProfileDraft.grade || "").trim();
    const interests = (applyProfileDraft.interests || "").trim();
    const freeTime = (applyProfileDraft.freeTime || "").trim();
    const gender = (applyProfileDraft.gender || "").trim();

    if (!college || !grade || !interests || !freeTime) {
      toast.error(language === "zh" ? "请先把学院、年级、爱好/特长、课余时间填完整" : "Please complete college, grade, hobbies/skills and availability");
      return;
    }

    const payload =
      `学院：${college}\n` +
      `年级：${grade}\n` +
      `爱好/特长：${interests}\n` +
      `课余时间：${freeTime}\n` +
      (gender ? `性别：${gender}\n` : "");

    handleSendMessage(payload);
  };

  // 增强数据状态
  const [extraData, setExtraData] = useState({
    activities: [],
    joinedClubs: [],
    applications: [],
    favorites: [],
    clubPosts: []
  });

  // 获取增强数据（活动、申请、收藏等）
  const fetchExtraData = useCallback(async () => {
    const data = {
      activities: [],
      joinedClubs: [],
      applications: [],
      favorites: [],
      clubPosts: []
    };
    
    // 获取近期活动
    try {
      const { data: activities } = await supabase
        .from('club_activities')
        .select('*')
        .eq('status', 'upcoming')
        .order('activity_date', { ascending: true })
        .limit(50);
      data.activities = activities || [];
    } catch (e) {
      console.log('获取活动失败:', e);
    }
    
    // 如果用户已登录，获取更多信息
    if (user?.id) {
      // 获取已加入的社团
      try {
        const { data: members } = await supabase
          .from('club_members')
          .select('club_id, join_date, role')
          .eq('user_id', user.id)
          .eq('status', 'active');
        data.joinedClubs = members || [];
      } catch (e) {
        console.log('获取已加入社团失败:', e);
      }
      
      // 获取申请记录
      try {
        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id);
        data.applications = apps || [];
      } catch (e) {
        console.log('获取申请记录失败:', e);
      }
      
      // 获取收藏
      try {
        const { data: favs } = await supabase
          .from('favorite_clubs')
          .select('club_id')
          .eq('user_id', user.id);
        data.favorites = favs || [];
      } catch (e) {
        console.log('获取收藏失败:', e);
      }
    }
    
    setExtraData(data);
    return data;
  }, [user?.id]);

  // 初始化和用户变化时获取数据
  useEffect(() => {
    fetchExtraData();
  }, [fetchExtraData]);

  useEffect(() => {
    setPersistentMemory(loadPersistentMemory(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!pendingApplyContext) return;
    setApplyProfileDraft({
      college: persistentMemory?.college || "",
      grade: persistentMemory?.grade || "",
      gender: persistentMemory?.gender || "",
      interests: Array.isArray(persistentMemory?.interests) ? persistentMemory.interests.join("、") : "",
      freeTime: persistentMemory?.freeTime || "",
    });
  }, [pendingApplyContext, persistentMemory]);

  useEffect(() => {
    const syncInterests = async () => {
      if (!user?.id) return;
      const res = await getUserInterests(user.id);
      if (res?.success) {
        setPersistentMemory((prev) => {
          const next = savePersistentMemory(user.id, {
            ...prev,
            interests: normalizeInterests([...(prev.interests || []), ...(res.data || [])]),
          });
          return next;
        });
      }
    };
    syncInterests();
  }, [user?.id, getUserInterests]);

  useEffect(() => {
    if (!user?.id) return;
    if (!Array.isArray(extraData?.applications)) return;
    setPersistentMemory((prev) => {
      const normalizedApps = extraData.applications.slice(0, 50).map((a) => ({
        club_id: a.club_id,
        status: a.status,
        updated_at: a.updated_at || a.apply_time || new Date().toISOString(),
        source: "db",
      }));
      const next = savePersistentMemory(user.id, {
        ...prev,
        applications: normalizedApps,
      });
      return next;
    });
  }, [user?.id, extraData?.applications]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 发送消息
  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

    const extractedMajor = extractMajorFromText(text);
    const extractedInterests = extractInterestsFromText(text);
    const extractedCollege = extractCollegeFromText(text);
    const extractedGrade = extractGradeFromText(text);
    const extractedGender = extractGenderFromText(text);
    const extractedFreeTime = extractFreeTimeFromText(text);
    const extractedAppMentions = extractApplicationMentions(text, clubs);

    const nextMemory = savePersistentMemory(user?.id, {
      ...persistentMemory,
      major: extractedMajor || persistentMemory.major,
      interests: normalizeInterests([...(persistentMemory.interests || []), ...extractedInterests]),
      college: extractedCollege || persistentMemory.college,
      grade: extractedGrade || persistentMemory.grade,
      gender: extractedGender || persistentMemory.gender,
      freeTime: extractedFreeTime || persistentMemory.freeTime,
      applications: Array.isArray(persistentMemory.applications)
        ? [...extractedAppMentions, ...persistentMemory.applications].slice(0, 50)
        : extractedAppMentions.slice(0, 50),
    });
    setPersistentMemory(nextMemory);

    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setStreamingContent("");
    setStreamingDisplay("");
    setAgentStatus({ running: false, label: "" });

    const resumeApply = pendingApplyContext && typeof pendingApplyContext === "object";
    const looksLikeLeaveStatus = /(退出|退社|退团).*(进度|状态|结果|审核|同意|通过|成功)|我退出了吗|退出了吗|退社了吗|退团了吗/.test(text);
    const resumeLeave =
      !resumeApply &&
      pendingLeaveContext &&
      typeof pendingLeaveContext === "object" &&
      !looksLikeLeaveStatus &&
      String(text || "").trim().length <= 20;

    let intent = resumeApply
      ? { type: "apply_resume", clubId: pendingApplyContext.clubId }
      : resumeLeave
      ? { type: "leave" }
      : detectAgentIntent(text);

    if (looksLikeLeaveStatus && pendingLeaveContext) setPendingLeaveContext(null);

    if (!resumeApply && !resumeLeave && !intent && isApplicationResultQuestion(text)) {
      const lastClub = findLastReferencedClub(clubs, conversationHistory);
      if (lastClub) intent = { type: "status", clubId: lastClub.id };
    }

    const addAgentMessage = (content, card = null, isError = false) => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content,
        timestamp: new Date(),
        isEnhanced: true,
        isError,
        agentCard: card,
      };
      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        sessionStorage.setItem("ai_chat_messages", JSON.stringify(newMessages));
        return newMessages;
      });
      setConversationHistory((prev) => {
        const newHistory = [...prev, { type: "user", content: text }, { type: "assistant", content }];
        sessionStorage.setItem("ai_conversation_history", JSON.stringify(newHistory));
        return newHistory;
      });
    };

    try {
      if (intent) {
        if (!user?.id) {
          addAgentMessage(
            language === "zh" ? "要自动办理申请/查询进度/取消申请，需要先登录账号。" : "Please log in to apply/query/cancel automatically.",
            { title: language === "zh" ? "自动化执行失败" : "Automation failed", status: "error", steps: [] },
            true
          );
          return;
        }

        if (intent.type === "apply_resume") {
          const targetClub = (clubs || []).find((c) => c.id === intent.clubId) || null;
          if (!targetClub) {
            setPendingApplyContext(null);
          } else {
            const missing = getMissingApplyProfileFields(nextMemory).filter((m) => m !== "性别（可选）");
            if (missing.length > 0) {
              addAgentMessage(
                language === "zh"
                  ? `我还差一点信息才能把申请写得更像你本人：${missing.join("、")}。\n你可以按这个格式回我一条：\n学院：××学院\n年级：大一/大二/2024级\n爱好/特长：…\n课余时间：每周…`
                  : `I still need a bit more info: ${missing.join(", ")}.`,
                { title: language === "zh" ? "补充信息" : "More info needed", status: "error", steps: [] },
                true
              );
              return;
            }
            setPendingApplyContext(null);
            const applyIntent = { type: "apply", targetClub };
            intent.type = applyIntent.type;
            intent.targetClub = applyIntent.targetClub;
          }
        }

        if (intent.type === "new_clubs") {
          setAgentStatus({ running: true, label: language === "zh" ? "正在刷新最新社团…" : "Fetching latest clubs…" });
          let latestClubs = [];
          try {
            const { data, error } = await supabase
              .from("clubs")
              .select("id,name,category,description,tags,created_at,is_recruiting,member_count,contact,location")
              .order("created_at", { ascending: false })
              .limit(8);
            if (error) throw error;
            latestClubs = Array.isArray(data) ? data : [];
          } catch {
            latestClubs = pickNewestClubs(clubs || [], 8);
          }

          if (!Array.isArray(latestClubs) || latestClubs.length === 0) {
            addAgentMessage(
              language === "zh" ? "我这边暂时没拉到最新社团列表，你可以稍后再试一下。" : "I can't fetch the latest club list right now. Please try again later.",
              { title: language === "zh" ? "最新社团" : "Latest Clubs", status: "error", steps: [] },
              true
            );
            return;
          }

          const lines = latestClubs.slice(0, 8).map((c) => {
            const name = c?.name || (language === "zh" ? "未命名社团" : "Unnamed Club");
            const category = c?.category ? `（${c.category}）` : "";
            const desc = c?.description ? `简介：${String(c.description).trim()}` : "";
            const tags = Array.isArray(c?.tags) && c.tags.length > 0 ? `标签：${c.tags.join("、")}` : "";
            const count = typeof c?.member_count === "number" ? `成员数：${c.member_count}人` : "";
            const contact = c?.contact ? `联系方式：${c.contact}` : "";
            const location = c?.location ? `活动地点：${c.location}` : "";
            const recruit = c?.is_recruiting ? "✅ 可申请加入" : "⭐ 已创建（非招新期也可关注）";
            return [
              `- ${name}${category}`,
              desc,
              tags,
              count,
              contact,
              location,
              recruit,
            ]
              .filter((x) => x && String(x).trim())
              .join("\n");
          });

          addAgentMessage(
            language === "zh"
              ? `我给你拉了最新创建的社团（按时间倒序）：\n\n${lines.join("\n\n")}\n\n你想了解其中哪个？也可以直接说“帮我申请加入 XX”。`
              : `Here are the latest clubs (newest first):\n\n${lines.join("\n\n")}`,
            { title: language === "zh" ? "最近新开设的社团" : "Latest Clubs", status: "success", steps: [] }
          );
          return;
        }

        if (intent.type === "leave_status") {
          setPendingLeaveContext(null);
          setAgentStatus({ running: true, label: language === "zh" ? "正在查询退社进度…" : "Checking leave status…" });

          const targetClubFromText = pickClubByFuzzyName(text, clubs || []);
          const targetClubFromHistory = findLastReferencedClub(clubs || [], conversationHistory);
          const targetClub = targetClubFromText || targetClubFromHistory;

          if (!targetClub) {
            addAgentMessage(
              language === "zh" ? "你想查询哪个社团的退社状态？请带上社团名称，比如“我退出羽毛球协会通过了吗？”" : "Which club do you want to check leave status for?",
              { title: language === "zh" ? "需要指定社团" : "Club required", status: "error", steps: [] },
              true
            );
            return;
          }

          const latest = await fetchExtraData();
          const latestJoined = latest?.joinedClubs || extraData?.joinedClubs || [];
          const isActiveMember = isActiveMemberOfClub(latestJoined, targetClub.id);

          let leaveRequests = [];
          try {
            const { data, error } = await supabase
              .from("leave_requests")
              .select("*")
              .eq("user_id", user.id)
              .eq("club_id", targetClub.id)
              .limit(20);
            if (error) throw error;
            leaveRequests = data || [];
          } catch {
            leaveRequests = [];
          }

          const latestLeave = pickLatestLeaveRequestForClub(leaveRequests, targetClub.id);
          const content = formatSingleLeaveStatus(targetClub, latestLeave, isActiveMember, language);
          addAgentMessage(
            content,
            {
              title: language === "zh" ? "退社状态" : "Leave Status",
              status: latestLeave?.status === "approved" || (!isActiveMember && !latestLeave) ? "success" : latestLeave?.status === "rejected" ? "error" : "success",
              steps: [
                language === "zh" ? "刷新并读取最新成员状态" : "Refresh membership",
                language === "zh" ? "读取退社申请记录" : "Read leave requests",
                language === "zh" ? "返回退社结果" : "Return result"
              ],
              clubId: targetClub.id
            },
            latestLeave?.status === "rejected"
          );
          return;
        }

        if (intent.type === "leave") {
          setAgentStatus({ running: true, label: language === "zh" ? "正在校验社团成员身份…" : "Checking membership…" });

          const joinedIds = (extraData?.joinedClubs || []).map((m) => m.club_id);
          const joinedClubsFull = (clubs || []).filter((c) => joinedIds.includes(c.id));

          let targetClub = pickClubByFuzzyName(text, joinedClubsFull);
          if (!targetClub && joinedClubsFull.length === 1) targetClub = joinedClubsFull[0];

          if (!targetClub) {
            const joinedNames = joinedClubsFull.map((c) => c.name).filter(Boolean);
            setPendingLeaveContext({ createdAt: Date.now() });
            addAgentMessage(
              joinedNames.length > 0
                ? (language === "zh"
                    ? `我可以帮你一键发起退社申请。你目前加入了：${joinedNames.join("、")}。\n请直接回复你要退出的社团名称（比如“${joinedNames[0]}”）。`
                    : `I can help you submit a leave request. You joined: ${joinedNames.join(", ")}. Please reply which club you want to leave.`)
                : (language === "zh" ? "我没查到你当前加入的社团记录，先去个人中心确认一下是否已加入。" : "I can't find your joined clubs. Please check your profile."),
              { title: language === "zh" ? "需要指定社团" : "Club required", status: "error", steps: [] },
              true
            );
            return;
          }

          setPendingLeaveContext(null);
          const isMember = joinedIds.includes(targetClub.id);
          if (!isMember) {
            addAgentMessage(
              language === "zh" ? `你当前不是「${targetClub.name}」的成员，无法发起退社申请。` : `You are not a member of "${targetClub.name}".`,
              { title: language === "zh" ? "校验失败" : "Check failed", status: "error", steps: [] },
              true
            );
            return;
          }

          setAgentStatus({ running: true, label: language === "zh" ? "正在生成退社申请文案…" : "Writing leave request…" });
          let reason = "";
          try {
            reason = await generateLeaveRequestReason(targetClub, profile, persistentMemory, language);
          } catch {
            reason = language === "zh"
              ? `最近课业安排有点紧（作业/考试周集中），我能投入社团活动的时间明显变少，担心影响团队进度，所以想申请退出「${targetClub.name}」。如果有需要我配合交接的事项/资料，我会尽量在本周内处理完，也感谢大家这段时间的照顾。`
              : `My course workload is getting heavier recently, and I can't commit enough time for "${targetClub.name}" activities. I'd like to submit a leave request. If anything needs handover, I will cooperate and finish it this week.`;
          }

          setAgentStatus({ running: true, label: language === "zh" ? "正在提交退出申请…" : "Submitting leave request…" });
          const res = await submitLeaveRequest(targetClub.id, reason);

          if (!res?.success) {
            setPendingLeaveContext(null);
            addAgentMessage(
              (language === "zh" ? "退出申请提交失败：" : "Leave request failed: ") + (res?.error || ""),
              {
                title: language === "zh" ? "退社失败" : "Leave failed",
                status: "error",
                steps: [
                  language === "zh" ? `校验成员身份：${targetClub.name}` : `Check membership: ${targetClub.name}`,
                  language === "zh" ? "生成退社申请文案" : "Generate leave request",
                  language === "zh" ? "提交退出申请" : "Submit request"
                ],
                clubId: targetClub.id
              },
              true
            );
            return;
          }

          setAgentStatus({ running: true, label: language === "zh" ? "正在同步刷新你的状态…" : "Refreshing status…" });
          await fetchExtraData();

          addAgentMessage(
            language === "zh"
              ? `已为你向「${targetClub.name}」提交退社申请 ✅\n\n退社申请内容（可复制）：\n${reason}\n\n目前状态：待社团管理员审核。审核通过后，你的成员状态会同步更新到个人中心。`
              : `Leave request submitted for "${targetClub.name}" ✅\n\nReason:\n${reason}\n\nStatus: pending approval. Your membership status will update after approval.`,
            {
              title: language === "zh" ? "一键退社申请" : "One-click Leave",
              status: "success",
              steps: [
                language === "zh" ? `校验成员身份：${targetClub.name}` : `Check membership: ${targetClub.name}`,
                language === "zh" ? "生成退社申请文案" : "Generate leave request",
                language === "zh" ? "提交退出申请" : "Submit request",
                language === "zh" ? "刷新个人数据" : "Refresh data"
              ],
              clubId: targetClub.id
            }
          );
          return;
        }

        if (intent.type === "status") {
          setAgentStatus({ running: true, label: language === "zh" ? "正在查询申请进度…" : "Checking application status…" });
          const latest = await fetchExtraData();
          const latestApps = latest?.applications || extraData?.applications || [];
          const latestJoined = latest?.joinedClubs || extraData?.joinedClubs || [];

          const clubId = intent.clubId;
          if (clubId) {
            const club = (clubs || []).find((c) => c.id === clubId) || null;
            const isMember = isActiveMemberOfClub(latestJoined, clubId);
            const app = pickLatestApplicationForClub(latestApps, clubId);
            addAgentMessage(
              formatSingleApplicationStatus(club, app, isMember, language),
              {
                title: language === "zh" ? "申请结果" : "Application Result",
                status: isMember || app?.status === "approved" ? "success" : app?.status === "rejected" ? "error" : "success",
                steps: [
                  language === "zh" ? "刷新并读取最新申请记录" : "Refresh and read latest records",
                  language === "zh" ? "返回审核结果" : "Return the result"
                ],
                clubId: club?.id
              },
              app?.status === "rejected"
            );
            return;
          }

          addAgentMessage(
            (language === "zh" ? "已为你查询申请进度：\n" : "Here is your application status:\n") +
              formatApplicationStatus(latestApps, clubs, language),
            {
              title: language === "zh" ? "申请进度查询" : "Application Status",
              status: "success",
              steps: [
                language === "zh" ? "刷新并读取最新申请记录" : "Refresh and read latest records",
                language === "zh" ? "汇总状态并返回" : "Summarize and return"
              ]
            }
          );
          return;
        }

        const recruitingClubs = (clubs || []).filter((c) => c.is_recruiting);

        if (intent.type === "cancel") {
          setAgentStatus({ running: true, label: language === "zh" ? "正在取消申请…" : "Canceling application…" });
          const targetClub = pickTargetClubFromText(text, recruitingClubs.length > 0 ? recruitingClubs : clubs);
          if (!targetClub) {
            addAgentMessage(language === "zh" ? "当前没有可操作的社团目标。" : "No target club found.", { title: language === "zh" ? "取消失败" : "Cancel failed", status: "error", steps: [] }, true);
            return;
          }

          const { error } = await supabase
            .from("applications")
            .delete()
            .eq("user_id", user.id)
            .eq("club_id", targetClub.id)
            .eq("status", "pending");

          if (error) throw error;

          addAgentMessage(
            language === "zh" ? `已为你取消对「${targetClub.name}」的申请（仅可取消待审核申请）。` : `Canceled your pending application for "${targetClub.name}".`,
            {
              title: language === "zh" ? "取消申请" : "Cancel Application",
              status: "success",
              steps: [
                language === "zh" ? `定位目标社团：${targetClub.name}` : `Target club: ${targetClub.name}`,
                language === "zh" ? "调用取消申请接口" : "Call cancel API",
                language === "zh" ? "返回结果" : "Return result"
              ],
              clubId: targetClub.id
            }
          );
          fetchExtraData();
          return;
        }

        if (intent.type === "apply" || intent.type === "recommend_apply") {
          setAgentStatus({ running: true, label: language === "zh" ? "正在为你自动办理入会申请…" : "Auto applying for you…" });
          const targetClub = intent.targetClub
            ? intent.targetClub
            : intent.type === "recommend_apply"
            ? pickBestClubForUser(recruitingClubs.length > 0 ? recruitingClubs : clubs, nextMemory)
            : pickTargetClubFromText(text, recruitingClubs.length > 0 ? recruitingClubs : clubs);

          if (!targetClub) {
            addAgentMessage(language === "zh" ? "当前没有可申请的社团目标。" : "No target club available.", { title: language === "zh" ? "申请失败" : "Apply failed", status: "error", steps: [] }, true);
            return;
          }

          const alreadyJoined = (extraData?.joinedClubs || []).some((m) => m.club_id === targetClub.id);
          const alreadyApplied = (extraData?.applications || []).some((a) => a.club_id === targetClub.id && a.status === "pending");
          if (alreadyJoined) {
            addAgentMessage(language === "zh" ? `你已经是「${targetClub.name}」成员，无需重复申请。` : `You are already a member of "${targetClub.name}".`, { title: language === "zh" ? "无需申请" : "No action needed", status: "success", steps: [] });
            return;
          }
          if (alreadyApplied) {
            addAgentMessage(language === "zh" ? `你已提交过「${targetClub.name}」的申请，当前处于待审核状态。` : `You already have a pending application for "${targetClub.name}".`, { title: language === "zh" ? "已在队列" : "Already pending", status: "success", steps: [] });
            return;
          }

          if (!profile?.name || !profile?.student_id) {
            addAgentMessage(
              language === "zh" ? "要一键提交申请，需要你的姓名与学号已完善（请先到个人资料补全）。" : "To apply automatically, please complete your name & student ID in Profile first.",
              { title: language === "zh" ? "资料缺失" : "Missing profile", status: "error", steps: [] },
              true
            );
            return;
          }

          const missing = getMissingApplyProfileFields(nextMemory).filter((m) => m !== "性别（可选）");
          if (missing.length > 0) {
            setPendingApplyContext({ clubId: targetClub.id, clubName: targetClub.name, createdAt: Date.now() });
            addAgentMessage(
              language === "zh"
                ? `我可以帮你一键写并提交「${targetClub.name}」的入会申请。为了让文案更像你本人，请先在下方信息卡片补充：学院、年级、爱好/特长、课余时间（性别可选）。`
                : `To personalize your application, please share your college, grade, hobbies/skills, and weekly availability.`,
              {
                title: language === "zh" ? "申请前补充信息" : "Info needed",
                status: "success",
                steps: [
                  language === "zh" ? "收集个人信息（用于定制文案）" : "Collect profile info",
                  language === "zh" ? "自动撰写申请内容" : "Generate application",
                  language === "zh" ? "提交申请" : "Submit"
                ],
                clubId: targetClub.id
              }
            );
            return;
          }

          setAgentStatus({ running: true, label: language === "zh" ? "正在一键撰写申请内容…" : "Writing application…" });
          const selfIntro = await generateApplicationSelfIntro(targetClub, profile, nextMemory, language);

          setAgentStatus({ running: true, label: language === "zh" ? "正在提交申请…" : "Submitting application…" });
          const result = await submitApplication({
            club_id: targetClub.id,
            name: profile.name,
            student_id: profile.student_id,
            self_intro: selfIntro || (language === "zh" ? "我希望加入贵社团，积极参与活动并贡献自己的力量。" : "I'd love to join and contribute actively."),
          });

          if (!result?.success) {
            addAgentMessage(
              (language === "zh" ? "申请提交失败：" : "Application failed: ") + (result?.error || ""),
              { title: language === "zh" ? "提交失败" : "Submit failed", status: "error", steps: [] },
              true
            );
            return;
          }

          addAgentMessage(
            language === "zh"
              ? `已为你完成「${targetClub.name}」入会申请一键撰写并提交 ✅\n\n申请内容（可复制）：\n${selfIntro}`
              : `Applied to "${targetClub.name}" successfully ✅\n\nApplication text:\n${selfIntro}`,
            {
              title: language === "zh" ? "自动化入会申请" : "Auto Club Application",
              status: "success",
              steps: [
                language === "zh" ? `定位目标社团：${targetClub.name}` : `Target club: ${targetClub.name}`,
                language === "zh" ? "自动撰写申请内容" : "Generate application text",
                language === "zh" ? "提交申请并返回结果" : "Submit and return result"
              ],
              clubId: targetClub.id
            }
          );
          fetchExtraData();
          return;
        }
      }

      // 使用流式调用获得更好的体验（传递多轮对话上下文）
      let fullResponse = "";
      
      await streamDoubaoAI(
        text,
        clubs,
        profile,
        (chunk, full) => {
          fullResponse = full;
          setStreamingContent(full);
        },
        extraData,           // 额外数据
        conversationHistory,  // 对话历史
        language,             // 当前语言
        performWebSearch,     // 网络搜索函数
        nextMemory            // 用户永久记忆
      );

      // 流式响应完成后，添加到消息列表
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: fullResponse,
        timestamp: new Date(),
        relatedClubs: getRelatedClubs(fullResponse, clubs),
        isEnhanced: true,
      };
      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        sessionStorage.setItem('ai_chat_messages', JSON.stringify(newMessages));
        return newMessages;
      });
      
      // 更新对话历史
      setConversationHistory((prev) => {
        const newHistory = [
          ...prev,
          { type: 'user', content: text },
          { type: 'assistant', content: fullResponse }
        ];
        sessionStorage.setItem('ai_conversation_history', JSON.stringify(newHistory));
        return newHistory;
      });
      
      setStreamingContent("");
      
      // 刷新增强数据（可能有更新）
      fetchExtraData();
    } catch (error) {
      console.error("AI 调用失败:", error);
      toast.error(language === "zh" ? "AI 服务暂时不可用，请稍后重试" : "AI service temporarily unavailable. Please try again later.");
      
      // 添加错误提示消息
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: language === "zh" 
          ? "抱歉，我暂时无法连接到 AI 服务。请检查网络后重试，或直接浏览社团列表找到感兴趣的社团！"
          : "Sorry, I cannot connect to the AI service right now. Please check your network or browse the club list to find interesting clubs!",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    streamingTargetRef.current = streamingContent || "";
    if (!streamingTargetRef.current) {
      streamingDisplayRef.current = "";
      setStreamingDisplay("");
    }
  }, [streamingContent]);

  useEffect(() => {
    typingTimerRef.current = setInterval(() => {
      const target = streamingTargetRef.current;
      if (!target) return;
      const current = streamingDisplayRef.current;
      if (current.length >= target.length) return;
      const next = target.slice(0, Math.min(target.length, current.length + 3));
      streamingDisplayRef.current = next;
      setStreamingDisplay(next);
    }, 24);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    };
  }, []);

  // 从 AI 回复中提取相关社团
  const getRelatedClubs = (response, clubs) => {
    const related = [];
    const recruitingClubs = clubs.filter(c => c.is_recruiting);
    
    // 检查回复中提到的社团名称
    recruitingClubs.forEach(club => {
      if (response.includes(club.name)) {
        related.push(club);
      }
    });
    
    // 如果提到了类别，添加该类别的前几个社团
    const categories = ["学术科技", "文艺创作", "体育运动", "公益实践", "技术工程"];
    categories.forEach(cat => {
      if (response.includes(cat)) {
        const catClubs = recruitingClubs.filter(c => c.category === cat).slice(0, 2);
        catClubs.forEach(club => {
          if (!related.find(r => r.id === club.id)) {
            related.push(club);
          }
        });
      }
    });
    
    return related.slice(0, 3);
  };

  // ========== Phase 3: 智能交互卡片 ==========
  
  // 解析 AI 回复中的卡片标记
  // 支持格式: [卡片:club:ID:标题:分类:描述...] 或 [卡片:activity:ID:标题:描述...]
  const parseAIContent = (content, clubs) => {
    const cards = [];
    
    // 社团卡片正则 - 格式: [卡片:club:ID:标题:分类:描述]
    const clubCardRegex = /\[卡片:club:([^:\]]+):([^:\]]+):([^:\]]+):([^\]]+)\]/g;
    let match;
    
    while ((match = clubCardRegex.exec(content)) !== null) {
      const [fullMatch, id, title, category, description] = match;
      const club = clubs.find(c => c.id === id || c.name === id);
      
      if (club) {
        cards.push({
          type: 'club',
          id: club.id,
          title: club.name,
          description: club.description || description,
          category: club.category || category,
          members: club.members || 0,
          club
        });
      } else {
        // 如果没有找到对应社团，也创建一个卡片
        cards.push({
          type: 'club',
          id,
          title,
          description,
          category,
          members: 0,
          club: null
        });
      }
    }
    
    // 活动卡片正则 - 格式: [卡片:activity:ID:标题:描述]
    const activityCardRegex = /\[卡片:activity:([^:\]]+):([^:\]]+):([^\]]+)\]/g;
    
    while ((match = activityCardRegex.exec(content)) !== null) {
      const [fullMatch, id, title, description] = match;
      cards.push({
        type: 'activity',
        id,
        title,
        description,
        action: 'view'
      });
    }
    
    return cards;
  };

  // 处理卡片操作
  const handleCardAction = async (card, action) => {
    if (!user) {
      toast.error(language === "zh" ? "请先登录" : "Please login first");
      navigate("/login");
      return;
    }
    
    try {
      if (card.type === 'club') {
        // 找到对应的完整社团信息
        const clubData = card.club || clubs.find(c => c.id === card.id || c.name === card.title);
        
        if (action === 'apply') {
          // 跳转到申请页面（和社团详情页一样的逻辑）
          if (clubData) {
            navigate("/application", { state: { club: clubData } });
          } else {
            // 如果没有完整的社团数据，尝试跳转到社团详情页
            toast.info(language === "zh" ? "正在跳转到社团详情页..." : "Redirecting to club page...");
            navigate(`/clubs/${card.id}`);
          }
        } else if (action === 'favorite') {
          // 收藏社团
          if (!clubData) {
            toast.error(language === "zh" ? "无法获取社团信息" : "Cannot get club info");
            return;
          }
          const { error } = await supabase
            .from('favorite_clubs')
            .insert([{ user_id: user.id, club_id: clubData.id }]);
          
          if (error) {
            if (error.code === '23505') {
              toast.info(language === "zh" ? "已经在收藏中了" : "Already in favorites");
            } else {
              throw error;
            }
          } else {
            toast.success(language === "zh" ? "已添加到收藏" : "Added to favorites");
            fetchExtraData();
          }
        } else if (action === 'view') {
          // 查看社团详情
          if (clubData) {
            navigate(`/clubs/${clubData.id}`);
          } else {
            // 使用 card.id（如果 clubData 不存在）
            navigate(`/clubs/${card.id}`);
          }
        }
      } else if (card.type === 'activity') {
        if (action === 'register') {
          toast.info(language === "zh" ? "请前往活动详情页报名" : "Please go to activity page to register");
        } else if (action === 'view') {
          navigate(`/clubs/${card.id}/activities`);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(language === "zh" ? "操作失败，请重试" : "Operation failed, please retry");
    }
  };

  // 渲染智能卡片（支持多语言）
  const renderSmartCards = (cards) => {
    const t = {
      viewDetails: language === 'zh' ? '查看详情' : 'View Details',
      applyNow: language === 'zh' ? '申请加入' : 'Apply Now',
      signUpNow: language === 'zh' ? '立即报名' : 'Sign Up Now',
      noDescription: language === 'zh' ? '暂无描述' : 'No description',
      members: language === 'zh' ? '人' : 'members',
      tbd: language === 'zh' ? '待定' : 'TBD',
      viewDetailsHint: language === 'zh' ? '社团详情请查看详情页' : 'Please view details page for more info',
      membersCount: language === 'zh' ? '👥 {count} 人 | 📍 {location}' : '👥 {count} members | 📍 {location}',
    };
    
    return (
      <div className="mt-3 space-y-2">
        {cards.map((card, index) => (
          <motion.div
            key={`${card.type}-${card.id}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden"
          >
            {card.type === 'club' && (
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{card.title}</h4>
                      {card.category && (
                        <Badge variant="secondary" className="text-xs">
                          {card.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {card.description || t.noDescription}
                    </p>
                    {card.club ? (
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'zh' 
                          ? `👥 ${card.members} ${t.members} | 📍 ${card.club.location || t.tbd}`
                          : `👥 ${card.members} ${t.members} | 📍 ${card.club.location || t.tbd}`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {t.viewDetailsHint}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleCardAction(card, 'view')}
                  >
                    {t.viewDetails}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCardAction(card, 'apply')}
                  >
                    {t.applyNow}
                  </Button>
                </div>
              </div>
            )}
            {card.type === 'activity' && (
              <div className="p-3">
                <h4 className="font-medium text-gray-900">📅 {card.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleCardAction(card, 'view')}
                  >
                    {t.viewDetails}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCardAction(card, 'register')}
                  >
                    {t.signUpNow}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const handleQuickQuestion = (question) => {
    handleSendMessage(question.text);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const navigateToClub = (clubId) => {
    navigate(`/clubs/${clubId}`);
  };

  const clearChat = () => {
    const welcomeMsg = {
      id: "welcome",
      type: "ai",
      content: language === "zh" 
        ? "对话已重置。我是你的 AI 社团顾问，有什么可以帮助你的？"
        : "Chat reset. I'm your AI club advisor. How can I help?",
      timestamp: new Date(),
      isEnhanced: false,
    };
    setMessages([welcomeMsg]);
    sessionStorage.setItem('ai_chat_messages', JSON.stringify([welcomeMsg]));
    setConversationHistory([]);
    sessionStorage.setItem('ai_conversation_history', JSON.stringify([]));
    toast.success(language === "zh" ? "对话已清空" : "Chat cleared");
  };

  const isMeaningfulFieldValue = (value) => {
    const v = String(value || "").trim();
    if (!v) return false;
    if (/^(未收录|暂无|未提供|未公布|N\/A|Not recorded|Not recorded in the knowledge base)$/i.test(v)) return false;
    return true;
  };

  const formatLongText = (value) => {
    let v = String(value || "").replace(/\r\n/g, "\n").trim();
    if (!v) return "";
    v = v.replace(/\n{3,}/g, "\n\n");
    const hasBreaks = v.includes("\n");
    const hasAscii = /[A-Za-z]/.test(v);
    if (!hasBreaks) {
      if (hasAscii && v.length >= 220) {
        v = v.replace(/([.!?])\s+/g, "$1\n");
      } else if (!hasAscii && v.length >= 180) {
        v = v.replace(/。/g, "。\n");
      }
    }
    return v.replace(/\n{3,}/g, "\n\n").trim();
  };

  const parseClubBlocks = (text) => {
    const lines = String(text || "").split("\n").map((l) => l.trimEnd());
    const blocks = [];
    let current = null;

    const startRegex = /^-\s*(.+?)（(.+?)）\s*$/;
    const kvRegex = /^(简介|标签|成员数|负责人|联系方式|活动地点|门槛|活动时间|适合专业|综测加分|推荐理由)\s*：\s*(.*)$/;

    const pushCurrent = () => {
      if (!current) return;
      const hasAny =
        current.name ||
        current.category ||
        current.description ||
        (current.tags && current.tags.length > 0) ||
        current.members ||
        current.leader ||
        current.contact ||
        current.location ||
        current.statusText;
      if (hasAny) blocks.push(current);
      current = null;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      const startMatch = line.match(startRegex);
      if (startMatch) {
        pushCurrent();
        current = {
          name: startMatch[1].trim(),
          category: startMatch[2].trim(),
          description: "",
          tags: [],
          members: "",
          leader: "",
          contact: "",
          location: "",
          threshold: "",
          activityTime: "",
          suitableMajors: "",
          bonus: "",
          recommendReason: "",
          statusText: "",
          statusTone: "",
        };
        continue;
      }

      if (!current) continue;

      const cleaned = line.replace(/^\/\/\s*/, "");
      const kv = cleaned.match(kvRegex);
      if (kv) {
        const key = kv[1];
        const value = (kv[2] || "").trim();
        if (key === "简介") {
          current.description = value;
        } else if (key === "标签") {
          const parts = value
            .split(/[、，,]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12);
          current.tags = Array.from(new Set(parts));
        } else if (key === "成员数") {
          current.members = value;
        } else if (key === "负责人") {
          current.leader = value;
        } else if (key === "联系方式") {
          current.contact = value;
        } else if (key === "活动地点") {
          current.location = value;
        } else if (key === "门槛") {
          current.threshold = value;
        } else if (key === "活动时间") {
          current.activityTime = value;
        } else if (key === "适合专业") {
          current.suitableMajors = value;
        } else if (key === "综测加分") {
          current.bonus = value;
        } else if (key === "推荐理由") {
          current.recommendReason = value;
        }
        continue;
      }

      if (/^[⏳✅⭐✓]/.test(cleaned)) {
        current.statusText = cleaned;
        if (cleaned.startsWith("⏳")) current.statusTone = "pending";
        else if (cleaned.startsWith("✅") || cleaned.startsWith("✓")) current.statusTone = "success";
        else if (cleaned.startsWith("⭐")) current.statusTone = "info";
        continue;
      }

      if (current.description) {
        current.description = `${current.description}\n${cleaned}`.trim();
      }
    }

    pushCurrent();
    return blocks.length >= 2 ? blocks : [];
  };

  const renderClubBlocks = (blocks, isAi) => {
    const statusBadgeClass = (tone) => {
      if (tone === "success") return "bg-emerald-600/10 text-emerald-700 border-emerald-200";
      if (tone === "pending") return "bg-amber-600/10 text-amber-700 border-amber-200";
      if (tone === "info") return "bg-sky-600/10 text-sky-700 border-sky-200";
      return "bg-gray-600/10 text-gray-700 border-gray-200";
    };

    const labelClass = isAi ? "text-gray-500" : "text-white/80";
    const valueClass = isAi ? "text-gray-800" : "text-white";

    return (
      <div className="space-y-3">
        {blocks.map((b, idx) => (
          <Card key={`${b.name}-${idx}`} className="border border-white/60 bg-white/70 shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{b.name}</span>
                    {b.category && (
                      <Badge variant="secondary" className="bg-blue-600/10 text-blue-700 border border-blue-200">
                        {b.category}
                      </Badge>
                    )}
                  </div>
                </div>
                {b.statusText && (
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${statusBadgeClass(b.statusTone)}`}>
                    {b.statusText}
                  </span>
                )}
              </div>

              {b.description && (
                <div className="mt-3">
                  <p className="text-sm leading-7 text-gray-700 whitespace-pre-line break-words">
                    {formatLongText(b.description)}
                  </p>
                </div>
              )}

              {b.tags && b.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {b.members && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <span className={labelClass}>成员数</span>
                    <span className={valueClass}>{b.members}</span>
                  </div>
                )}
                {isMeaningfulFieldValue(b.leader) && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <span className={labelClass}>负责人</span>
                    <span className={`${valueClass} truncate`}>{b.leader}</span>
                  </div>
                )}
                {isMeaningfulFieldValue(b.contact) && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <span className={labelClass}>联系方式</span>
                    <span className={`${valueClass} truncate`}>{b.contact}</span>
                  </div>
                )}
                {isMeaningfulFieldValue(b.location) && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <span className={labelClass}>活动地点</span>
                    <span className={`${valueClass} truncate`}>{b.location}</span>
                  </div>
                )}
                {isMeaningfulFieldValue(b.threshold) && (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className={labelClass}>纳新要求</span>
                      <span className={`${valueClass} text-right whitespace-pre-line`}>{formatLongText(b.threshold)}</span>
                    </div>
                  </div>
                )}
                {isMeaningfulFieldValue(b.activityTime) && (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className={labelClass}>活动安排</span>
                      <span className={`${valueClass} text-right whitespace-pre-line`}>{formatLongText(b.activityTime)}</span>
                    </div>
                  </div>
                )}
                {isMeaningfulFieldValue(b.suitableMajors) && (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className={labelClass}>适合专业</span>
                      <span className={`${valueClass} text-right whitespace-pre-line`}>{formatLongText(b.suitableMajors)}</span>
                    </div>
                  </div>
                )}
                {isMeaningfulFieldValue(b.bonus) && (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className={labelClass}>综测/说明</span>
                      <span className={`${valueClass} text-right whitespace-pre-line`}>{formatLongText(b.bonus)}</span>
                    </div>
                  </div>
                )}
                {isMeaningfulFieldValue(b.recommendReason) && (
                  <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className={labelClass}>推荐理由</span>
                      <span className={`${valueClass} text-right whitespace-pre-line`}>{formatLongText(b.recommendReason)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // 渲染消息内容（支持简单的 Markdown 格式）
  const renderMessageContent = (content, messageType = "ai") => {
    // 移除卡片标记，只保留纯文本
    const cleanContent = content
      .replace(/\[卡片:club:[^:\]]+:[^:\]]+:[^:\]]+:[^\]]+\]/g, '')
      .replace(/\[卡片:activity:[^:\]]+:[^:\]]+:[^\]]+\]/g, '')
      .trim();
    
    const isAi = messageType === "ai";
    const clubBlocks = isAi ? parseClubBlocks(cleanContent) : [];
    if (clubBlocks.length > 0) {
      return renderClubBlocks(clubBlocks, isAi);
    }

    const rawLines = cleanContent.split("\n").map((l) => l.trimEnd());
    const normalizedLines = [];
    for (const l of rawLines) {
      const trimmed = l.trim();
      if (!trimmed) {
        normalizedLines.push("");
        continue;
      }
      const prev = normalizedLines.length > 0 ? normalizedLines[normalizedLines.length - 1].trim() : "";
      if (prev && prev === trimmed) continue;
      normalizedLines.push(formatLongText(trimmed));
    }

    return normalizedLines.map((line, index) => {
      // 跳过只包含空卡片的行
      if (line.trim() === "") {
        return <div key={index} className="h-3" />;
      }

      const trimmed = line.trim();
      const isSectionTitle = /^【[^】]{1,30}】/.test(trimmed);
      const isBullet = /^[-•]\s+/.test(trimmed);

      // 处理加粗文本 **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p
          key={index}
          className={
            isSectionTitle
              ? `mt-3 mb-2 font-semibold ${isAi ? "text-gray-900" : ""}`
              : isBullet
              ? `mb-1.5 ${isAi ? "text-gray-700" : ""}`
              : `mb-2 ${isAi ? "text-gray-800" : ""}`
          }
        >
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i} className={`font-semibold ${isAi ? "text-blue-700" : ""}`}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar 
        title={language === "zh" ? "AI 社团顾问" : "AI Club Advisor"} 
        showBack={true} 
        backText={language === "zh" ? "返回" : "Back"}
        rightContent={
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === "zh" ? "清空对话" : "Clear Chat"}
          </Button>
        }
      />

      {/* 主内容区域 */}
      <main className="relative pt-24 pb-4 px-4 sm:px-6 lg:px-8 h-[calc(100vh-70px)]">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          
          {/* 聊天消息区域 - 扩大并优化 */}
          <Card className="flex-1 border-0 shadow-xl bg-white/95 backdrop-blur-2xl overflow-hidden rounded-2xl">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-5 pb-24">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex gap-3 sm:gap-4 ${message.type === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {/* 头像 - 优化尺寸 */}
                      <Avatar className={`w-11 h-11 flex-shrink-0 ring-2 ring-offset-2 ${
                        message.type === "ai" 
                          ? "ring-blue-100 border-0" 
                          : "ring-green-100 bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}>
                        {message.type === "ai" ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                            <img src={logo} alt="AI" className="w-7 h-7 object-contain" />
                          </div>
                        ) : (
                          <AvatarFallback className="text-white font-medium">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* 消息内容 - 扩大最大宽度 */}
                      <div className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
                        <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                          message.type === "user" 
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-sm"
                            : message.isError
                            ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-sm"
                            : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
                        }`}>
                          <div className="text-sm sm:text-base leading-7 break-words">
                            {renderMessageContent(message.content, message.type)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1.5 px-1">
                          {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {message.type === "ai" && message.agentCard && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}
                            className="mt-3 w-full"
                          >
                            <Card className={`border-0 shadow-lg overflow-hidden ${
                              message.agentCard.status === "success"
                                ? "bg-gradient-to-r from-emerald-50 to-sky-50"
                                : "bg-gradient-to-r from-rose-50 to-orange-50"
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                                      message.agentCard.status === "success"
                                        ? "bg-emerald-600/10 text-emerald-700"
                                        : "bg-rose-600/10 text-rose-700"
                                    }`}>
                                      {message.agentCard.status === "success" ? (
                                        <CheckCircle className="w-5 h-5" />
                                      ) : (
                                        <AlertCircle className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {message.agentCard.title}
                                      </p>
                                      {Array.isArray(message.agentCard.steps) && message.agentCard.steps.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {message.agentCard.steps.slice(0, 4).map((s, i) => (
                                            <p key={i} className="text-xs text-gray-600 leading-relaxed">
                                              {i + 1}. {s}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {message.agentCard.clubId && (
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => navigateToClub(message.agentCard.clubId)}
                                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/60 shadow-sm text-sm text-blue-700"
                                    >
                                      {language === "zh" ? "查看社团" : "View Club"}
                                      <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}

                        {/* Phase 3: 智能交互卡片 */}
                        {message.type === "ai" && message.isEnhanced && (
                          <>
                            {/* 解析并渲染智能卡片 */}
                            {(() => {
                              const cards = parseAIContent(message.content, clubs);
                              return cards.length > 0 ? renderSmartCards(cards) : null;
                            })()}
                            
                            {/* 保留原有的相关社团推荐 */}
                            {message.relatedClubs && message.relatedClubs.length > 0 && (
                              <div className="mt-3 space-y-2 w-full">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {language === "zh" ? "相关社团推荐" : "Related Clubs"}
                                </p>
                                {message.relatedClubs.map((club) => (
                                  <motion.div
                                    key={club.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="cursor-pointer"
                                    onClick={() => navigateToClub(club.id)}
                                  >
                                    <Card className="border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                      <CardContent className="p-3 flex items-center justify-between">
                                        <div>
                                          <h4 className="font-medium text-gray-900 text-sm">{club.name}</h4>
                                          <p className="text-xs text-gray-500">{club.category} · {club.members || 0}{language === "zh" ? "人" : " members"}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-blue-500" />
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* 流式响应显示 - 优化样式 */}
                  {streamingContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex gap-3 sm:gap-4"
                    >
                      <Avatar className="w-11 h-11 flex-shrink-0 ring-2 ring-blue-100">
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <img src={logo} alt="AI" className="w-7 h-7 object-contain" />
                        </div>
                      </Avatar>
                      <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                        <div className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm">
                          <div className="text-sm sm:text-base leading-7 break-words">
                            {renderMessageContent(streamingDisplay, "ai")}
                            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI 正在输入指示器 - 优化样式 */}
                {isTyping && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <Avatar className="w-11 h-11 flex-shrink-0 ring-2 ring-blue-100">
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <img src={logo} alt="AI" className="w-7 h-7 object-contain" />
                      </div>
                    </Avatar>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-5 py-3 flex items-center gap-3 border border-gray-100">
                      <div className="flex gap-1.5">
                        <motion.div
                          className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.div
                          className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {agentStatus.running
                          ? agentStatus.label
                          : language === "zh"
                          ? "豆包 AI 正在思考..."
                          : "Doubao AI is thinking..."}
                      </span>
                    </div>
                  </motion.div>
                )}

                {pendingApplyContext && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <Avatar className="w-11 h-11 flex-shrink-0 ring-2 ring-blue-100">
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <img src={logo} alt="AI" className="w-7 h-7 object-contain" />
                      </div>
                    </Avatar>
                    <div className="flex flex-col items-start max-w-[92%] sm:max-w-[80%] w-full">
                      <Card className="w-full border border-blue-100 bg-white/90 backdrop-blur-xl shadow-md rounded-2xl overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                {language === "zh"
                                  ? `补充信息后我再帮你申请「${pendingApplyContext.clubName}」`
                                  : `Tell me a bit more to apply for "${pendingApplyContext.clubName}"`}
                              </p>
                              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                                {language === "zh"
                                  ? "这些信息只用于把申请理由写得更像你本人（不会影响其它功能）。"
                                  : "This is only for personalizing the application text."}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setPendingApplyContext(null)}
                              className="shrink-0 text-xs px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-gray-600"
                            >
                              {language === "zh" ? "稍后再填" : "Later"}
                            </motion.button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <p className="text-xs text-gray-500">{language === "zh" ? "学院" : "College"}</p>
                              <Input
                                value={applyProfileDraft.college}
                                onChange={(e) => setApplyProfileDraft((p) => ({ ...p, college: e.target.value }))}
                                placeholder={language === "zh" ? "例如：计算机与人工智能学院" : "e.g. School of ..."}
                                className="h-11 rounded-xl bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs text-gray-500">{language === "zh" ? "年级" : "Grade"}</p>
                              <Input
                                value={applyProfileDraft.grade}
                                onChange={(e) => setApplyProfileDraft((p) => ({ ...p, grade: e.target.value }))}
                                placeholder={language === "zh" ? "例如：大一 / 大二 / 2024级" : "e.g. Sophomore / 2024"}
                                className="h-11 rounded-xl bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <p className="text-xs text-gray-500">{language === "zh" ? "爱好/特长" : "Hobbies / Skills"}</p>
                              <Input
                                value={applyProfileDraft.interests}
                                onChange={(e) => setApplyProfileDraft((p) => ({ ...p, interests: e.target.value }))}
                                placeholder={language === "zh" ? "例如：编程、篮球、摄影、社交" : "e.g. coding, basketball, photography"}
                                className="h-11 rounded-xl bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <p className="text-xs text-gray-500">{language === "zh" ? "课余时间安排" : "Availability"}</p>
                              <Input
                                value={applyProfileDraft.freeTime}
                                onChange={(e) => setApplyProfileDraft((p) => ({ ...p, freeTime: e.target.value }))}
                                placeholder={language === "zh" ? "例如：每周2次晚7点后/周末下午" : "e.g. two evenings per week / weekends"}
                                className="h-11 rounded-xl bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <p className="text-xs text-gray-500">{language === "zh" ? "性别（可选）" : "Gender (optional)"}</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: language === "zh" ? "男" : "Male", value: "男" },
                                  { label: language === "zh" ? "女" : "Female", value: "女" },
                                  { label: language === "zh" ? "不方便透露" : "Prefer not to say", value: "不方便透露" },
                                ].map((g) => (
                                  <motion.button
                                    key={g.value}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setApplyProfileDraft((p) => ({ ...p, gender: g.value }))}
                                    className={`px-3 py-2 rounded-xl border text-sm shadow-sm transition-colors ${
                                      applyProfileDraft.gender === g.value
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white/80 text-gray-700 border-gray-200 hover:border-blue-300"
                                    }`}
                                  >
                                    {g.label}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={handleApplyProfileSubmit}
                              className="inline-flex items-center justify-center h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                            >
                              {language === "zh" ? "生成并提交申请" : "Generate & Submit"}
                            </motion.button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </Card>

          {/* 快捷问题按钮 - 优化样式 */}
          {messages.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-2"
            >
              <p className="text-sm text-gray-500 mb-3 text-center">💡 {language === "zh" ? "你可以尝试问：" : "You can try asking:"}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {quickQuestions.map((q, index) => (
                  <motion.button
                    key={q.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickQuestion(q)}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/90 border border-gray-200 text-sm text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all shadow-md backdrop-blur-sm"
                  >
                    <q.icon className="w-4 h-4 text-blue-500" />
                    {q.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 输入区域 - 优化样式 */}
          <div className="mt-4 px-2">
            <div className="relative flex items-center gap-3">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === "zh" ? "输入你的问题，例如：我想找一个编程类的社团..." : "Ask a question, e.g.: I want to find a programming club..."}
                className="h-14 pr-14 bg-white/90 backdrop-blur-xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-2xl px-6 text-base shadow-lg"
                disabled={isTyping || clubsLoading}
              />
              <Button
                size="icon"
                className="absolute right-2 h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all disabled:opacity-50"
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputMessage.trim() || clubsLoading}
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* 底部提示信息 - 优化样式 */}
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-sm border border-blue-100">
              <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            {language === "zh" ? "由豆包 AI 提供智能支持 · 可回答天气、新闻等实时问题" : "Powered by Doubao AI · Can answer real-time questions like weather & news"}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
