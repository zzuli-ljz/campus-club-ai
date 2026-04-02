
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
  Sparkles, 
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
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useActivities } from "@/hooks/useActivities";
import LatestPosts from "@/components/LatestPosts";
import { useState, useEffect, useCallback } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();
  const { clubs, isLoading } = useClubs();
  const { getClubActivities } = useActivities();
  
  // 轮播相关状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [clubsWithActivities, setClubsWithActivities] = useState({});

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
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredClubs.length) % featuredClubs.length);
    setAutoPlay(false); // 手动操作后暂停自动播放
    setTimeout(() => setAutoPlay(true), 10000); // 10秒后恢复
  }, [featuredClubs.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredClubs.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  }, [featuredClubs.length]);

  const stats = [
    { number: "200+", label: "入驻社团" },
    { number: "5000+", label: "活跃成员" },
    { number: "98%", label: "满意度" },
    { number: "50+", label: "年度活动" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartMatching = () => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
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
    "文艺创作": "bg-purple-100 text-purple-700",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">社团招新平台</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={handleAIAssistant}
              >
                <Bot className="w-4 h-4" />
                AI顾问
              </Button>
              
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-white/50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-gray-700 font-medium max-w-[100px] truncate">
                        {user?.name || "用户"}
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
                      个人中心
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/ai-assistant")}
                      className="cursor-pointer text-purple-600"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI社团顾问
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/clubs")}
                      className="cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      浏览社团
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                      登录
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      立即加入
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
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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
              2026秋季招新火热进行中
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              发现你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">热爱</span>
              <br />
              加入精彩社团
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              智能匹配系统帮你找到最适合的社团,开启丰富多彩的校园生活,遇见志同道合的伙伴
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 h-12 text-lg"
                onClick={handleStartMatching}
              >
                开始匹配
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/clubs">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-300 hover:bg-white/50 px-8 h-12 text-lg"
                >
                  浏览社团
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-purple-300 hover:bg-purple-50 text-purple-700 px-8 h-12 text-lg"
                onClick={handleAIAssistant}
              >
                <Bot className="w-5 h-5 mr-2" />
                问AI顾问
              </Button>
            </div>
          </motion.div>
        </div>

        {/* 数据统计 */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门社团推荐区域 - 单卡片轮播 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
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
                热门推荐
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">本周热门社团</h2>
              <p className="text-gray-600">
                综合成员活跃度与近期活动精选推荐
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无正在招新的社团</h3>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/clubs")}
                    >
                      浏览全部社团
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
                        <img 
                          src={currentClub.image || `https://nocode.meituan.com/photo/search?keyword=club,activity&width=800&height=400`} 
                          alt={currentClub.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
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
                            正在招新
                          </Badge>
                        </div>

                        {/* 排名标识 */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {currentIndex + 1}
                          </div>
                          <div className="text-white">
                            <div className="text-xs opacity-80">热门排名</div>
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
                            {currentClub.members || 0} 位成员
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-purple-500" />
                            {currentClub.activityCount || 0} 个活动
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-green-500" />
                            {currentClub.location || "待定"}
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
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/application", { state: { club: currentClub } });
                            }}
                          >
                            立即申请加入
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
                            详情
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
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                      setAutoPlay(false);
                      setTimeout(() => setAutoPlay(true), 10000);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentIndex 
                        ? "w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-600" 
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
              查看全部社团
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 最新社团动态板块 */}
      <LatestPosts />

      {/* AI 助手介绍区域 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 to-blue-700 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://nocode.meituan.com/photo/search?keyword=ai,technology&width=800&height=600')] opacity-10 bg-cover bg-center" />
              <CardContent className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm mb-4">
                      <Bot className="w-4 h-4" />
                      智能 AI 助手
                    </div>
                    <h2 className="text-3xl font-bold mb-4">不知道选什么社团？问 AI 顾问！</h2>
                    <p className="text-white/80 mb-6 text-lg">
                      我们的 AI 社团顾问可以帮您推荐适合的社团、解答社团相关问题，让选择变得简单有趣。
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Button 
                        size="lg"
                        className="bg-white text-purple-600 hover:bg-purple-50"
                        onClick={handleAIAssistant}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        开始对话
                      </Button>
                      <Button 
                        size="lg"
                        variant="ghost"
                        className="bg-transparent border-2 border-white/50 text-white hover:bg-white/20 hover:text-white"
                        onClick={() => navigate("/survey")}
                      >
                        兴趣匹配
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">平台特色</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              专为高校学生打造的智能社团招新平台,让找社团变得简单有趣
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: "智能匹配",
                description: "基于你的兴趣爱好和特长,AI智能推荐最适合的社团",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "海量社团",
                description: "覆盖学术、文艺、体育、公益等各类社团,总有一个适合你",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "一键申请",
                description: "简化报名流程,在线提交申请,实时查看审核进度",
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: "社团互动",
                description: "与志同道合的同学交流,参与精彩活动,丰富校园生活",
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 mb-4">
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
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-700 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://nocode.meituan.com/photo/search?keyword=university,campus&width=800&height=600')] opacity-10 bg-cover bg-center" />
              <CardContent className="relative p-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl font-bold mb-4">准备好开启社团之旅了吗?</h2>
                <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                  加入数千名同学,发现属于你的精彩社团,结识志同道合的朋友,创造难忘的大学回忆
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-12 text-lg"
                  onClick={handleStartMatching}
                >
                  免费开始匹配
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">社团招新平台</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 高校社团招新智能匹配平台. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">关于我们</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">使用指南</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">联系方式</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

