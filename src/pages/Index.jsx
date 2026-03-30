import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUser();

  const features = [
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
  ];

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

  // 处理开始匹配按钮点击
  const handleStartMatching = () => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }
    navigate("/survey");
  };

  // 跳转到 AI 助手
  const handleAIAssistant = () => {
    navigate("/ai-assistant");
  };

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
            
            {/* 右侧导航 - 根据登录状态显示不同内容 */}
            <div className="flex items-center gap-4">
              {/* AI 助手快捷入口 */}
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
                // 已登录状态
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
                // 未登录状态
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
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* 背景装饰 */}
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
          <motion.div 
            className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ 
              scale: [1, 1.3, 1],
              y: [0, -30, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
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
              {/* AI 助手入口按钮 */}
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
        <div className="relative max-w-5xl mx-auto mt-20">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              专为高校学生打造的智能社团招新平台,让找社团变得简单有趣
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
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
