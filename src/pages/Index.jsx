
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Search, 
  Heart, 
  ArrowRight, 
  Star,
  Zap,
  Target,
  User,
  LogOut,
  ChevronDown,
  Bot,
  MessageCircle,
  MapPin,
  ChevronRight,
  Flame,
  ChevronLeft,
  Activity,
  Calendar,
  Newspaper,
  Globe,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useActivities } from "@/hooks/useActivities";
import { useLanguage } from "@/contexts/LanguageContext";
import LatestPosts from "@/components/LatestPosts";
import { useState, useEffect, useCallback, useRef } from "react";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();
  const { clubs, isLoading } = useClubs();
  const { getClubActivities } = useActivities();
  const { language, toggleLanguage, t } = useLanguage();
  
  // 轮播相关状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [clubsWithActivities, setClubsWithActivities] = useState({});
  
  // 跟踪恢复自动播放的 setTimeout，避免组件卸载时泄漏
  const resumeAutoPlayTimerRef = useRef(null);

  // 计算热门社团（综合排序：成员数+活动数+招新状态）
  useEffect(() => {
    const calculateFeaturedClubs = async () => {
      if (clubs.length === 0) return;
      
      // 只考虑正在招新的社团
      const recruitingClubs = clubs.filter(club => club.is_recruiting);
      
      // 获取每个社团的活动数量
      const activitiesMap = {};
      await Promise.all(
        recruitingClubs.map(async (club) => {
          const result = await getClubActivities(club.id);
          if (result.success) {
            activitiesMap[club.id] = result.data.length;
          }
        })
      );
      setClubsWithActivities(activitiesMap);
      
      // 综合排序：成员数 * 0.6 + 活动数 * 0.4
      const sortedClubs = recruitingClubs
        .map(club => ({
          ...club,
          activityCount: activitiesMap[club.id] || 0,
          score: (club.members || 0) * 0.6 + (activitiesMap[club.id] || 0) * 0.4
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // 取前5个最热门的
      
      setFeaturedClubs(sortedClubs);
    };
    
    calculateFeaturedClubs();
  }, [clubs, getClubActivities]);

  // 自动轮播
  useEffect(() => {
    if (!autoPlay || featuredClubs.length <= 1) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredClubs.length);
    }, 5000); // 5秒自动切换
    
    return () => clearInterval(timer);
  }, [autoPlay, featuredClubs.length]);

  // 手动切换
  const goToPrev = useCallback(() => {
    // 清除之前的恢复定时器
    if (resumeAutoPlayTimerRef.current) {
      clearTimeout(resumeAutoPlayTimerRef.current);
    }
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredClubs.length) % featuredClubs.length);
    setAutoPlay(false); // 手动操作后暂停自动播放
    // 使用 ref 跟踪定时器，以便在组件卸载时清理
    resumeAutoPlayTimerRef.current = setTimeout(() => setAutoPlay(true), 10000); // 10秒后恢复
  }, [featuredClubs.length]);

  const goToNext = useCallback(() => {
    // 清除之前的恢复定时器
    if (resumeAutoPlayTimerRef.current) {
      clearTimeout(resumeAutoPlayTimerRef.current);
    }
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredClubs.length);
    setAutoPlay(false);
    // 使用 ref 跟踪定时器，以便在组件卸载时清理
    resumeAutoPlayTimerRef.current = setTimeout(() => setAutoPlay(true), 10000);
  }, [featuredClubs.length]);
  
  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      if (resumeAutoPlayTimerRef.current) {
        clearTimeout(resumeAutoPlayTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartMatching = () => {
    if (!isLoggedIn) {
      toast.error(t("loginRequired", "请先登录后再进行操作"));
      navigate("/login");
      return;
    }
    navigate("/survey");
  };

  const handleAIAssistant = () => {
    navigate("/ai-assistant");
  };

  const categoryColors = {
    "学术科技": "bg-blue-100 text-blue-700",
    "文艺创作": "bg-blue-100 text-blue-700",
    "体育运动": "bg-orange-100 text-orange-700",
    "公益实践": "bg-green-100 text-green-700",
    "技术工程": "bg-indigo-100 text-indigo-700"
  };

  // 滑动动画配置
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  const currentClub = featuredClubs[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-xl text-gray-900">{t("platformName", "社团招新平台")}</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 语言切换按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 font-medium"
                onClick={toggleLanguage}
              >
                <Globe className="w-4 h-4 mr-1" />
                <span>{language === "zh" ? "EN" : "中"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                onClick={handleAIAssistant}
              >
                <Bot className="w-4 h-4" />
                {t("aiAdvisor", "AI顾问")}
              </Button>
              
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-white/50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white text-sm">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-gray-700 font-medium max-w-[100px] truncate">
                        {user?.name || t("student", "用户")}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuItem 
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t("personalCenter", "个人中心")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/ai-assistant")}
                      className="cursor-pointer text-blue-700"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {t("aiAdvisor", "AI社团顾问")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/clubs")}
                      className="cursor-pointer"
                    >
                      <img src={logo} alt="Logo" className="w-4 h-4 mr-2 object-contain" />
                      {t("browseClubs", "浏览社团")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout", "退出登录")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                      {t("login", "登录")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white">
                      {t("joinNow", "立即加入")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero区域 */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              {language === "zh" ? "2026秋季招新火热进行中" : "Fall 2026 Recruitment Now Open"}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {language === "zh" ? "发现你的" : "Discover Your"}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">
                {language === "zh" ? "热爱" : "Passion"}
              </span>
              <br />
              {language === "zh" ? "加入精彩社团" : "Join Amazing Clubs"}
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {language === "zh" 
                ? "智能匹配系统帮你找到最适合的社团,开启丰富多彩的校园生活,遇见志同道合的伙伴"
                : "Our smart matching system helps you find the perfect clubs, start an exciting campus life, and meet like-minded friends"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white px-8 h-12 text-lg"
                onClick={handleStartMatching}
              >
                {t("startMatching", "开始匹配")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/clubs">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-300 hover:bg-white/50 px-8 h-12 text-lg"
                >
                  {t("browseClubs", "浏览社团")}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-200 hover:bg-blue-50 text-blue-700 px-8 h-12 text-lg"
                onClick={handleAIAssistant}
              >
                <Bot className="w-5 h-5 mr-2" />
                {language === "zh" ? "问AI顾问" : "Ask AI"}
              </Button>
            </div>
          </motion.div>
        </div>

      </section>

      {/* 热门社团推荐区域 - 单卡片轮播 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-4">
                <Flame className="w-4 h-4" />
                {language === "zh" ? "热门推荐" : "Hot Recommendations"}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {language === "zh" ? "本周热门社团" : "Weekly Hot Clubs"}
              </h2>
              <p className="text-gray-600">
                {language === "zh" ? "综合成员活跃度与近期活动精选推荐" : "Curated based on member activity and recent events"}
              </p>
            </motion.div>
          </div>

          {/* 轮播容器 */}
          <div className="relative">
            {/* 左右切换按钮 */}
            {featuredClubs.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* 卡片展示区域 */}
            <div className="overflow-hidden px-4">
              <AnimatePresence mode="wait" custom={direction}>
                {isLoading ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
                    <div className="h-64 bg-gray-200 animate-pulse" />
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </CardContent>
                  </Card>
                ) : featuredClubs.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl p-12 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {language === "zh" ? "暂无正在招新的社团" : "No clubs recruiting now"}
                    </h3>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/clubs")}
                    >
                      {t("viewAll", "浏览全部社团")}
                    </Button>
                  </Card>
                ) : (
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ 
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <Card 
                      className="border-0 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden cursor-pointer group"
                      onClick={() => navigate(`/clubs/${currentClub.id}`)}
                    >
                      {/* 图片区域 */}
                      <div className="relative h-56 sm:h-64 overflow-hidden">
                        {currentClub.image ? (
                          <img 
                            src={currentClub.image}
                            alt={currentClub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-6xl font-bold text-white/30">{currentClub.name?.[0] || '社'}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        
                        {/* 分类标签 */}
                        <div className="absolute top-4 left-4">
                          <Badge className={`${categoryColors[currentClub.category] || "bg-gray-100 text-gray-700"} border-0 text-sm px-3 py-1`}>
                            {currentClub.category}
                          </Badge>
                        </div>
                        
                        {/* 招新状态 */}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white border-0 shadow-md text-sm px-3 py-1">
                            {t("recruiting", "正在招新")}
                          </Badge>
                        </div>

                        {/* 排名标识 */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {currentIndex + 1}
                          </div>
                          <div className="text-white">
                            <div className="text-xs opacity-80">
                              {language === "zh" ? "热门排名" : "Hot Rank"}
                            </div>
                            <div className="font-semibold">TOP {currentIndex + 1}</div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {currentClub.name}
                            </h3>
                            <p className="text-gray-500 line-clamp-2">
                              {currentClub.description}
                            </p>
                          </div>
                        </div>

                        {/* 统计信息 */}
                        <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-500" />
                            {currentClub.members || 0} {t("members", "位成员")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-blue-600" />
                            {currentClub.activityCount || 0} {t("activities", "个活动")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-green-500" />
                            {currentClub.location || (language === "zh" ? "待定" : "TBD")}
                          </span>
                        </div>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {currentClub.tags?.slice(0, 4).map(tag => (
                            <span 
                              key={tag}
                              className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/application", { state: { club: currentClub } });
                            }}
                          >
                            {t("applyNow", "立即申请加入")}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <Button 
                            variant="outline"
                            className="px-6 h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clubs/${currentClub.id}`);
                            }}
                          >
                            {t("viewDetails", "详情")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 指示器 */}
            {featuredClubs.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {featuredClubs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // 清除之前的恢复定时器
                      if (resumeAutoPlayTimerRef.current) {
                        clearTimeout(resumeAutoPlayTimerRef.current);
                      }
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                      setAutoPlay(false);
                      // 使用 ref 跟踪定时器，以便在组件卸载时清理
                      resumeAutoPlayTimerRef.current = setTimeout(() => setAutoPlay(true), 10000);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex 
                        ? "w-8 h-2 bg-gradient-to-r from-blue-700 to-blue-500" 
                        : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 查看更多 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button 
              variant="outline" 
              size="lg"
              className="px-8"
              onClick={() => navigate("/clubs")}
            >
              {t("viewAll", "查看全部社团")}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* AI 助手介绍区域 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-800 to-blue-600 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
              <CardContent className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm mb-4">
                      <Bot className="w-4 h-4" />
                      {language === "zh" ? "智能 AI 助手" : "Smart AI Assistant"}
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                      {language === "zh" ? "不知道选什么社团？问 AI 顾问！" : "Not sure which club to choose? Ask the AI Advisor!"}
                    </h2>
                    <p className="text-white/80 mb-6 text-lg">
                      {language === "zh" 
                        ? "我们的 AI 社团顾问可以帮您推荐适合的社团、解答社团相关问题，让选择变得简单有趣。"
                        : "Our AI club advisor helps you find the perfect clubs and answers your questions, making choices easy and fun."}
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Button 
                        size="lg"
                        className="bg-white text-blue-700 hover:bg-blue-50"
                        onClick={handleAIAssistant}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {language === "zh" ? "开始对话" : "Start Chat"}
                      </Button>
                      <Button 
                        size="lg"
                        variant="ghost"
                        className="bg-transparent border-2 border-white/50 text-white hover:bg-white/20 hover:text-white"
                        onClick={() => navigate("/survey")}
                      >
                        {t("interestSurvey", "兴趣匹配")}
                      </Button>
                    </div>
                  </div>
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 flex items-center justify-center">
                    <Bot className="w-16 h-16 md:w-20 md:h-20 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {language === "zh" ? "平台特色" : "Platform Features"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === "zh" 
                ? "专为高校学生打造的智能社团招新平台,让找社团变得简单有趣"
                : "Smart club recruitment platform designed for university students, making it easy and fun to find the right clubs"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: language === "zh" ? "智能匹配" : "Smart Matching",
                description: language === "zh" 
                  ? "基于你的兴趣爱好和特长,AI智能推荐最适合的社团"
                  : "AI-powered recommendations based on your interests and skills",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: language === "zh" ? "海量社团" : "Extensive Clubs",
                description: language === "zh"
                  ? "覆盖学术、文艺、体育、公益等各类社团,总有一个适合你"
                  : "Academic, arts, sports, volunteer clubs and more",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: language === "zh" ? "一键申请" : "One-Click Apply",
                description: language === "zh"
                  ? "简化报名流程,在线提交申请,实时查看审核进度"
                  : "Streamlined application process with real-time status updates",
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: language === "zh" ? "社团互动" : "Club Interactions",
                description: language === "zh"
                  ? "与志同道合的同学交流,参与精彩活动,丰富校园生活"
                  : "Connect with like-minded students and participate in exciting activities",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-indigo-800/20" />
              <CardContent className="relative p-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl font-bold mb-4">
                  {language === "zh" ? "准备好开启社团之旅了吗?" : "Ready to Start Your Club Journey?"}
                </h2>
                <p className="text-blue-50 mb-8 max-w-xl mx-auto">
                  {language === "zh"
                    ? "加入数千名同学,发现属于你的精彩社团,结识志同道合的朋友,创造难忘的大学回忆"
                    : "Join thousands of students, discover amazing clubs, meet like-minded friends, and create unforgettable university memories"}
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-12 text-lg"
                  onClick={handleStartMatching}
                >
                  {language === "zh" ? "免费开始匹配" : "Start Matching Free"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 申请新社团区域 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 to-cyan-800/20" />
              <CardContent className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-4">
                      {language === "zh" ? "想要创建新社团？" : "Want to Create a New Club?"}
                    </h2>
                    <p className="text-blue-100 mb-6 text-lg">
                      {language === "zh"
                        ? "如果您有好的创意和想法，可以在线申请创建新社团。填写社团信息并通过审核后，即可正式运营！"
                        : "If you have great ideas, you can apply to create a new club online. Fill in the information and get approved to start!"}
                    </p>
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate("/apply-new-club")}
                    >
                      <Building2 className="w-5 h-5 mr-2" />
                      {language === "zh" ? "申请创建社团" : "Apply to Create Club"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-white/50 backdrop-blur-xl border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-gray-900">{t("platformName", "社团招新平台")}</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 {language === "zh" ? "高校社团招新智能匹配平台" : "University Club Recruitment Platform"}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                {language === "zh" ? "关于我们" : "About Us"}
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                {language === "zh" ? "使用指南" : "Help"}
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                {language === "zh" ? "联系方式" : "Contact"}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

