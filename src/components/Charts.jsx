import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// 动态计数动画 Hook
function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
}

// 动态数字组件
function AnimatedNumber({ value, className }) {
  const count = useCountUp(value);
  return <div className={className}>{count.toLocaleString()}</div>;
}

// 数据概览卡片
export function ClubStatsDashboard({ clubs, applications, language = "zh" }) {
  const totalClubs = clubs.length;
  const totalMembers = clubs.reduce((sum, club) => sum + (club.members || 0), 0);
  const recruitingClubs = clubs.filter(c => c.is_recruiting).length;
  const totalApplications = applications.length;

  const stats = [
    { label: language === "zh" ? "社团总数" : "Total Clubs", value: totalClubs, icon: "🏛️", gradient: "from-blue-500 to-blue-600" },
    { label: language === "zh" ? "总成员数" : "Total Members", value: totalMembers, icon: "👥", gradient: "from-emerald-500 to-emerald-600" },
    { label: language === "zh" ? "正在招新" : "Recruiting", value: recruitingClubs, icon: "📢", gradient: "from-amber-500 to-orange-500" },
    { label: language === "zh" ? "申请总数" : "Applications", value: totalApplications, icon: "📝", gradient: "from-purple-500 to-violet-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-[100px]`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <AnimatedNumber value={stat.value} className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent" />
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 社团分类分布 - 改为水平条形图
export function ClubCategoryPieChart({ clubs, language = "zh" }) {
  const [animated, setAnimated] = useState(false);
  
  const categoryData = clubs.reduce((acc, club) => {
    acc[club.category] = (acc[club.category] || 0) + 1;
    return acc;
  }, {});

  // 固定的颜色配置 - 每个分类对应一个独特颜色
  const categoryConfig = {
    "学术科技": { bg: "bg-blue-500", gradient: "from-blue-500 to-blue-600", light: "bg-blue-50 border-blue-200", text: "text-blue-600" },
    "文艺创作": { bg: "bg-pink-500", gradient: "from-pink-500 to-rose-500", light: "bg-pink-50 border-pink-200", text: "text-pink-600" },
    "体育运动": { bg: "bg-emerald-500", gradient: "from-emerald-500 to-teal-500", light: "bg-emerald-50 border-emerald-200", text: "text-emerald-600" },
    "公益实践": { bg: "bg-amber-500", gradient: "from-amber-500 to-orange-500", light: "bg-amber-50 border-amber-200", text: "text-amber-600" },
    "技术工程": { bg: "bg-violet-500", gradient: "from-violet-500 to-purple-500", light: "bg-violet-50 border-violet-200", text: "text-violet-600" },
  };

  // 分类名称映射
  const categoryNames = {
    "学术科技": language === "zh" ? "学术科技" : "Academic",
    "文艺创作": language === "zh" ? "文艺创作" : "Arts",
    "体育运动": language === "zh" ? "体育运动" : "Sports",
    "公益实践": language === "zh" ? "公益实践" : "Volunteer",
    "技术工程": language === "zh" ? "技术工程" : "Tech",
  };

  const total = Object.values(categoryData).reduce((a, b) => a + b, 0);
  const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
        {language === "zh" ? "社团分类分布" : "Club Categories"}
        <span className="text-xs font-normal text-gray-400 ml-auto">{total} {language === "zh" ? "个社团" : "clubs"}</span>
      </h3>
      
      <div className="space-y-3">
        {entries.map(([category, count], index) => {
          const config = categoryConfig[category] || { bg: "bg-gray-500", gradient: "from-gray-500 to-gray-600", light: "bg-gray-50 border-gray-200", text: "text-gray-600" };
          const percentage = (count / total) * 100;
          const barWidth = animated ? (count / maxValue) * 100 : 0;
          
          return (
            <motion.div 
              key={category} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl ${config.light} border transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${config.gradient}`} />
                  <span className="text-sm font-medium text-gray-800">{categoryNames[category] || category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${config.text}`}>{count}</span>
                  <span className="text-xs text-gray-400">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: animated ? `${barWidth}%` : 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// 各分类社团数量雷达图 - 展示不同分类的社团数量特征
export function UserInterestRadarChart({ clubs, language = "zh" }) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 按分类统计社团数量
  const categories = ["学术科技", "文艺创作", "体育运动", "公益实践", "技术工程"];
  const categoryData = clubs.reduce((acc, club) => {
    acc[club.category] = (acc[club.category] || 0) + 1;
    return acc;
  }, {});

  const data = categories.map(cat => ({
    category: cat,
    value: categoryData[cat] || 0,
  }));

  const maxValue = Math.max(...data.map(d => d.value), 1);

  const colors = {
    "学术科技": "#3b82f6",
    "文艺创作": "#ec4899",
    "体育运动": "#10b981",
    "公益实践": "#f59e0b",
    "技术工程": "#8b5cf6",
  };

  const center = 90;
  const radius = 55;
  
  const getPoint = (index, value) => {
    const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = data.map((d, i) => getPoint(i, d.value)).map(p => `${p.x},${p.y}`).join(" ");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full" />
        {language === "zh" ? "各分类社团数量" : "Clubs by Category"}
        <span className="text-xs font-normal text-gray-400 ml-auto">{language === "zh" ? "雷达图" : "Radar"}</span>
      </h3>
      
      <div className="relative flex-1 min-h-[160px]">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="categoryRadarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
          </defs>
          
          {/* 背景网格 */}
          {[20, 40, 60, 80, 100].map(level => (
            <motion.polygon
              key={level}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: level * 0.02 }}
              points={data.map((_, i) => {
                const angle = (i * 2 * Math.PI) / data.length - Math.PI / 2;
                const r = (level / 100) * radius;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              }).join(" ")}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          
          {/* 轴线 */}
          {data.map((_, i) => {
            const angle = (i * 2 * Math.PI) / data.length - Math.PI / 2;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}
          
          {/* 数据区域 */}
          <motion.polygon
            points={points}
            fill="url(#categoryRadarGradient)"
            stroke="#8b5cf6"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          
          {/* 数据点 */}
          {data.map((d, i) => {
            const p = getPoint(i, d.value);
            return (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={colors[d.category] || "#8b5cf6"}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
              />
            );
          })}
        </svg>
        
        {/* 标签 */}
        <div className="absolute inset-0">
          {data.map((d, i) => {
            const angle = (i * 2 * Math.PI) / data.length - Math.PI / 2;
            const labelRadius = radius + 15;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-[9px] text-center leading-tight"
                style={{
                  left: `${(x / 180) * 100}%`,
                  top: `${(y / 180) * 100}%`,
                }}
              >
                <div className="text-gray-600 font-medium">{d.category}</div>
                <div className="text-gray-400 text-[8px]">{d.value}{language === "zh" ? "个" : ""}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">{language === "zh" ? "展示各分类社团数量分布特征" : "Shows club count distribution by category"}</p>
      </div>
    </motion.div>
  );
}

// 热门社团标签
export function HotTagsChart({ clubs, language = "zh" }) {
  const [visible, setVisible] = useState(false);
  
  const tagCounts = clubs.reduce((acc, club) => {
    if (club.tags && Array.isArray(club.tags)) {
      club.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const maxCount = topTags[0]?.[1] || 1;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 为每个分类分配颜色
  const categoryColors = {
    "学术科技": { bg: "bg-blue-500", hover: "hover:bg-blue-600", border: "border-blue-300" },
    "文艺创作": { bg: "bg-pink-500", hover: "hover:bg-pink-600", border: "border-pink-300" },
    "体育运动": { bg: "bg-emerald-500", hover: "hover:bg-emerald-600", border: "border-emerald-300" },
    "公益实践": { bg: "bg-amber-500", hover: "hover:bg-amber-600", border: "border-amber-300" },
    "技术工程": { bg: "bg-violet-500", hover: "hover:bg-violet-600", border: "border-violet-300" },
  };

  // 根据社团分类给标签分配颜色
  const getTagColor = (tag) => {
    for (const club of clubs) {
      if (club.tags && club.tags.includes(tag)) {
        const cat = club.category;
        if (categoryColors[cat]) {
          return categoryColors[cat];
        }
      }
    }
    // 默认颜色
    return { bg: "bg-gray-500", hover: "hover:bg-gray-600", border: "border-gray-300" };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
        {language === "zh" ? "热门社团标签" : "Popular Tags"}
        <span className="text-xs font-normal text-gray-400 ml-auto">TOP 15</span>
      </h3>
      
      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
        {topTags.map(([tag, count], index) => {
          const color = getTagColor(tag);
          const size = 0.75 + (count / maxCount) * 0.4;
          
          return (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0 }}
              transition={{ delay: index * 0.05, type: "spring" }}
              whileHover={{ scale: 1.1, y: -2 }}
              className={`px-2 py-0.5 rounded cursor-pointer ${color.bg} ${color.hover} text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-0.5`}
              style={{ fontSize: `${10 * size}px` }}
              title={`${tag}: ${count} ${language === "zh" ? "个社团使用" : "clubs using this tag"}`}
            >
              {tag}
              <span className="text-[9px] opacity-75">×{count}</span>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>{language === "zh" ? "标签大小表示使用频率" : "Tag size indicates frequency"}</span>
        <span>{topTags.length} {language === "zh" ? "个热门标签" : "popular tags"}</span>
      </div>
    </motion.div>
  );
}

// 成员数量柱状图
export function ClubMembersBarChart({ clubs, language = "zh" }) {
  const sortedClubs = [...clubs]
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, 8);

  const maxMembers = Math.max(...sortedClubs.map(c => c.members || 0), 1);

  const gradients = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-purple-500 to-violet-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-sky-500",
    "from-indigo-500 to-blue-600",
    "from-lime-500 to-green-500",
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        {language === "zh" ? "成员数量 TOP 8" : "Members TOP 8"}
      </h3>
      
      <div className="space-y-3">
        {sortedClubs.map((club, index) => {
          const percentage = ((club.members || 0) / maxMembers) * 100;
          
          return (
            <motion.div 
              key={club.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group"
            >
              <div className="flex justify-between items-center mb-1.5">
                <motion.span 
                  className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate max-w-36"
                  whileHover={{ x: 4 }}
                >
                  <span className="text-gray-400 mr-1">{index + 1}.</span>
                  {club.name}
                </motion.span>
                <motion.span 
                  className="text-sm font-bold text-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.08 }}
                >
                  {club.members || 0}
                  <span className="text-gray-400 font-normal text-xs ml-0.5">{language === "zh" ? "人" : ""}</span>
                </motion.span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${gradients[index % gradients.length]} rounded-full relative`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// 申请趋势图
export function ApplicationTrendChart({ applications, language = "zh" }) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const monthlyData = applications.reduce((acc, app) => {
    if (app.apply_time) {
      const date = new Date(app.apply_time);
      const monthKey = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
  const values = sortedMonths.map(m => monthlyData[m]);
  const maxValue = Math.max(...values, 1);

  const points = values.map((v, i) => ({
    x: 30 + (i / (values.length - 1 || 1)) * 220,
    y: 90 - (v / maxValue) * 65,
    value: v,
    month: sortedMonths[i],
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x} 100 L 30 100 Z`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-sky-500 rounded-full" />
        {language === "zh" ? "申请趋势" : "Application Trend"}
        <span className="text-xs font-normal text-gray-400 ml-auto">{language === "zh" ? "按月统计" : "Monthly"}</span>
      </h3>
      
      <div className="relative h-36">
        {sortedMonths.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs">{language === "zh" ? "暂无申请数据" : "No data"}</div>
            </div>
          </div>
        ) : (
          <svg viewBox="0 0 280 110" className="w-full h-full">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
                <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
              </linearGradient>
            </defs>
            
            {[0, 1, 2, 3].map(i => (
              <line
                key={i}
                x1="30"
                y1={10 + i * 22}
                x2="250"
                y2={10 + i * 22}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}
            
            <motion.path
              d={areaD}
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            
            <motion.path
              d={pathD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: animated ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            
            {points.map((p, i) => (
              <motion.g key={i}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="white"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: animated ? 1 : 0 }}
                  transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
                />
                <motion.text
                  x={p.x}
                  y={p.y - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-700 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animated ? 1 : 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                >
                  {p.value}
                </motion.text>
                <motion.text
                  x={p.x}
                  y="105"
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animated ? 1 : 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                >
                  {p.month}
                </motion.text>
              </motion.g>
            ))}
          </svg>
        )}
      </div>
    </motion.div>
  );
}

// 申请漏斗图
export function ApplicationFunnelChart({ applications, language = "zh" }) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const total = applications.length;
  const pending = applications.filter(a => a.status === "pending").length;
  const approved = applications.filter(a => a.status === "approved").length;
  const rejected = applications.filter(a => a.status === "rejected").length;

  const stages = [
    { name: language === "zh" ? "提交申请" : "Submitted", value: total, color: "from-blue-500 to-blue-600", light: "bg-blue-100 text-blue-700" },
    { name: language === "zh" ? "待审核" : "Pending", value: pending, color: "from-amber-500 to-yellow-500", light: "bg-amber-100 text-amber-700" },
    { name: language === "zh" ? "审核通过" : "Approved", value: approved, color: "from-emerald-500 to-teal-500", light: "bg-emerald-100 text-emerald-700" },
    { name: language === "zh" ? "审核拒绝" : "Rejected", value: rejected, color: "from-red-500 to-rose-500", light: "bg-red-100 text-red-700" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
        {language === "zh" ? "申请转化漏斗" : "Application Funnel"}
      </h3>
      
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const percentage = total > 0 ? (stage.value / total) * 100 : 0;
          const width = Math.max(percentage, 8);
          
          return (
            <motion.div 
              key={stage.name} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <motion.span 
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stage.light}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: animated ? 1 : 0 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                >
                  {stage.value} {language === "zh" ? "人" : ""} ({percentage.toFixed(0)}%)
                </motion.span>
              </div>
              <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${stage.color} rounded-lg flex items-center justify-end pr-3 text-white text-sm font-medium shadow-md`}
                  initial={{ width: 0 }}
                  animate={{ width: animated ? `${width}%` : 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                >
                  {percentage > 12 && stage.value}
                </motion.div>
              </div>
              
              {index < stages.length - 1 && (
                <motion.div 
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-gray-300 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animated ? 1 : 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  ▼
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        className="mt-5 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{language === "zh" ? "总体通过率" : "Approval Rate"}</span>
          <span className="text-lg font-bold text-emerald-600">
            {total > 0 ? ((approved / total) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: animated ? `${total > 0 ? (approved / total) * 100 : 0}%` : 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// 社团成员增长趋势 - 新增
export function ClubGrowthTrendChart({ clubs, language = "zh" }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 按创建时间统计社团增长
  const monthlyData = clubs.reduce((acc, club) => {
    if (club.created_at) {
      const date = new Date(club.created_at);
      const monthKey = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
  const values = sortedMonths.map(m => monthlyData[m]);
  const maxValue = Math.max(...values, 1);

  // 计算累计增长
  const cumulativeData = values.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, []);

  const points = values.map((v, i) => ({
    x: (i / (values.length - 1 || 1)) * 200 + 30,
    y: 100 - (v / maxValue) * 60 - 15,
    value: v,
    month: sortedMonths[i],
    cumulative: cumulativeData[i],
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        {language === "zh" ? "社团增长趋势" : "Club Growth"}
        <span className="text-[10px] font-normal text-gray-400 ml-auto">{language === "zh" ? "近6月" : "6M"}</span>
      </h3>

      <div className="relative h-48">
        {sortedMonths.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
            {language === "zh" ? "暂无数据" : "No data"}
          </div>
        ) : (
          <svg viewBox="0 0 260 180" className="w-full h-full">
            {/* 网格线 */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="30"
                y1={20 + i * 32}
                x2="230"
                y2={20 + i * 32}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}

            {/* 趋势线 */}
            <motion.path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: animated ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* 数据点 */}
            {points.map((p, i) => (
              <motion.g key={i}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: animated ? 1 : 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                />
                <motion.text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-700 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animated ? 1 : 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  {p.value}
                </motion.text>
                <motion.text
                  x={p.x}
                  y="170"
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animated ? 1 : 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  {p.month?.slice(5)}
                </motion.text>
              </motion.g>
            ))}
          </svg>
        )}
      </div>

      {/* 统计摘要 */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <div className="text-center flex-1">
          <div className="text-xs text-gray-400">{language === "zh" ? "本月新增" : "This Month"}</div>
          <div className="text-base font-bold text-emerald-600">{values[values.length - 1] || 0}</div>
        </div>
        <div className="text-center flex-1 border-x border-gray-100">
          <div className="text-xs text-gray-400">{language === "zh" ? "累计" : "Total"}</div>
          <div className="text-base font-bold text-gray-700">{cumulativeData[cumulativeData.length - 1] || clubs.length}</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-xs text-gray-400">{language === "zh" ? "月均" : "Avg"}</div>
          <div className="text-base font-bold text-blue-600">
            {(values.reduce((a, b) => a + b, 0) / values.length || 0).toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 各社团申请分布 - 新增
export function ClubApplicationDistribution({ clubs, applications, language = "zh" }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 统计每个社团的申请数量
  const clubAppCounts = applications.reduce((acc, app) => {
    acc[app.club_id] = (acc[app.club_id] || 0) + 1;
    return acc;
  }, {});

  // 获取社团名称并排序
  const topClubs = clubs
    .map(club => ({
      id: club.id,
      name: club.name,
      count: clubAppCounts[club.id] || 0,
      members: club.members || 0,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = Math.max(...topClubs.map(c => c.count), 1);
  const totalApps = topClubs.reduce((sum, c) => sum + c.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full" />
        {language === "zh" ? "热门社团申请" : "Popular Applications"}
        <span className="text-[10px] font-normal text-gray-400 ml-auto">TOP 5</span>
      </h3>

      {topClubs.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
          {language === "zh" ? "暂无申请数据" : "No applications"}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {topClubs.map((club, index) => {
              const percentage = (club.count / totalApps) * 100;
              const barWidth = (club.count / maxCount) * 100;
              const colors = [
                "from-violet-500 to-purple-500",
                "from-blue-500 to-cyan-500",
                "from-emerald-500 to-teal-500",
                "from-amber-500 to-orange-500",
                "from-pink-500 to-rose-500",
              ];

              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: animated ? 1 : 0, x: animated ? 0 : -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group py-1"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 truncate max-w-40" title={club.name}>
                      {index + 1}. {club.name}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {club.count} <span className="text-gray-400">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${colors[index]} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: animated ? `${barWidth}%` : 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 统计摘要 */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-400">{language === "zh" ? "总申请" : "Total"}</div>
              <div className="text-base font-bold text-purple-600">{applications.length}</div>
            </div>
            <div className="text-center flex-1 border-x border-gray-100">
              <div className="text-xs text-gray-400">{language === "zh" ? "热门社团" : "Top Club"}</div>
              <div className="text-base font-bold text-gray-700">
                {topClubs[0]?.count || 0}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-gray-400">{language === "zh" ? "平均" : "Avg"}</div>
              <div className="text-base font-bold text-blue-600">
                {(applications.length / clubs.length || 0).toFixed(1)}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// 各社团申请通过率分布饼状图 - 优化版
export function ClubApprovalRatePieChart({ clubs, applications, language = "zh" }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 统计每个社团的通过率 - 统计所有社团
  const clubApprovalRates = clubs.map(club => {
    const clubApps = applications.filter(a => a.club_id === club.id);
    const total = clubApps.length;
    const approved = clubApps.filter(a => a.status === "approved").length;
    const rate = total > 0 ? (approved / total) * 100 : 0;
    return { ...club, total, approved, rate };
  });

  // 按通过率分组（包括没有申请的社团，通过率0%归入低通过率）
  const highRateClubs = clubApprovalRates
    .filter(c => c.total > 0 && c.rate >= 70)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);
  const midRateClubs = clubApprovalRates
    .filter(c => c.total > 0 && c.rate >= 40 && c.rate < 70)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);
  const lowRateClubs = clubApprovalRates
    .filter(c => c.total === 0 || c.rate < 40)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const highRate = highRateClubs.length;
  const midRate = midRateClubs.length;
  const lowRate = lowRateClubs.length;
  const total = clubs.length; // 平台所有社团数量

  const data = [
    { label: language === "zh" ? "高通过率" : "High Rate", labelEn: "≥70%", value: highRate, color: "#10b981", light: "bg-emerald-50" },
    { label: language === "zh" ? "中通过率" : "Mid Rate", labelEn: "40-70%", value: midRate, color: "#f59e0b", light: "bg-amber-50" },
    { label: language === "zh" ? "低通过率" : "Low Rate", labelEn: "<40%", value: lowRate, color: "#ef4444", light: "bg-red-50" },
  ];

  // 饼图参数 - 增大尺寸
  const cx = 50, cy = 50, r = 40;
  let currentAngle = -90;

  const segments = data.map(d => {
    const angle = total > 0 ? (d.value / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...d,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      x1, y1, x2, y2, startAngle, endAngle, midAngle: (startAngle + endAngle) / 2,
    };
  });

  // 渲染社团排名项 - 增大字体
  const renderClubItem = (club, rank, color) => (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0 ${color}`}>
        {rank}
      </span>
      <span className="text-xs text-gray-600 truncate flex-1" title={club.name}>
        {club.name}
      </span>
      <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
        {club.rate.toFixed(0)}%
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        {language === "zh" ? "社团申请通过率分布" : "Approval Rate Distribution"}
      </h3>

      {total === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          {language === "zh" ? "暂无审核数据" : "No review data"}
        </div>
      ) : (
        <div>
          {/* 上半部分：饼图 + 图例 */}
          <div className="flex items-center gap-4 mb-4">
            {/* SVG 饼图 - 增大尺寸 */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {segments.map((seg, i) => (
                  <motion.path
                    key={i}
                    d={seg.path}
                    fill={seg.color}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    className="hover:opacity-80 cursor-pointer"
                  />
                ))}
                {/* 中心文字 */}
                <text x="50" y="45" textAnchor="middle" className="text-xl font-bold fill-gray-700">
                  {total}
                </text>
                <text x="50" y="60" textAnchor="middle" className="text-[9px] fill-gray-400">
                  {language === "zh" ? "社团" : "clubs"}
                </text>
              </svg>
            </div>

            {/* 图例 - 增大字体 */}
            <div className="flex-1 space-y-2">
              {segments.map((seg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl ${seg.light}`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700">
                      {seg.label}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {seg.labelEn}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: seg.color }}>
                      {seg.value}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 下半部分：前三名社团列表 - 增大字体和间距 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {/* 高通过率前三 */}
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {language === "zh" ? "高通过率" : "High"}
                </div>
                {highRateClubs.length > 0 ? (
                  highRateClubs.map((club, i) => renderClubItem(club, i + 1, "bg-emerald-500"))
                ) : (
                  <div className="text-xs text-gray-400">{language === "zh" ? "暂无" : "None"}</div>
                )}
              </div>

              {/* 中通过率前三 */}
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {language === "zh" ? "中通过率" : "Mid"}
                </div>
                {midRateClubs.length > 0 ? (
                  midRateClubs.map((club, i) => renderClubItem(club, i + 1, "bg-amber-500"))
                ) : (
                  <div className="text-xs text-gray-400">{language === "zh" ? "暂无" : "None"}</div>
                )}
              </div>

              {/* 低通过率前三 */}
              <div className="bg-red-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {language === "zh" ? "低通过率" : "Low"}
                </div>
                {lowRateClubs.length > 0 ? (
                  lowRateClubs.map((club, i) => renderClubItem(club, i + 1, "bg-red-500"))
                ) : (
                  <div className="text-xs text-gray-400">{language === "zh" ? "暂无" : "None"}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
