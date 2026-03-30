import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useClubs } from "@/hooks/useClubs";
import { useUser } from "@/contexts/UserContext";
import { callDoubaoAI, streamDoubaoAI } from "@/services/doubaoService";
import Navbar from "@/components/Navbar";

// 预设问题快捷按钮
const quickQuestions = [
  { icon: Lightbulb, text: "推荐适合我的社团", category: "recommend" },
  { icon: Heart, text: "文艺类社团有哪些", category: "arts" },
  { icon: Users, text: "学术科技类社团推荐", category: "tech" },
  { icon: MessageCircle, text: "如何判断社团是否适合我", category: "tips" },
];

const AIAssistant = () => {
  const navigate = useNavigate();
  const { clubs, isLoading: clubsLoading } = useClubs();
  const { user, profile } = useUser();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "ai",
      content: "你好！我是你的 AI 社团顾问 🤖\n\n我可以帮你推荐适合的社团、解答社团相关问题，或提供选择社团的建议。\n\n请告诉我你的兴趣爱好，或者想了解哪方面的社团信息？",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

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

    try {
      // 使用流式调用获得更好的体验
      let fullResponse = "";
      
      await streamDoubaoAI(
        text,
        clubs,
        profile,
        (chunk, full) => {
          fullResponse = full;
          setStreamingContent(full);
        }
      );

      // 流式响应完成后，添加到消息列表
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: fullResponse,
        timestamp: new Date(),
        relatedClubs: getRelatedClubs(fullResponse, clubs),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("AI 调用失败:", error);
      toast.error("AI 服务暂时不可用，请稍后重试");
      
      // 添加错误提示消息
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "抱歉，我暂时无法连接到 AI 服务。请检查网络后重试，或直接浏览社团列表找到感兴趣的社团！",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

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
    setMessages([
      {
        id: "welcome",
        type: "ai",
        content: "对话已重置。我是你的 AI 社团顾问，有什么可以帮助你的？",
        timestamp: new Date(),
      },
    ]);
    toast.success("对话已清空");
  };

  // 渲染消息内容（支持简单的 Markdown 格式）
  const renderMessageContent = (content) => {
    return content.split("\n").map((line, index) => {
      // 处理加粗文本 **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className={line.trim() === "" ? "h-2" : "mb-1"}>
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i} className="font-semibold text-blue-700">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar 
        title="AI 社团顾问" 
        showBack={true} 
        backText="返回"
        rightContent={
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RefreshCw className="w-4 h-4 mr-2" />
            清空对话
          </Button>
        }
      />

      {/* 主内容区域 */}
      <main className="relative pt-20 pb-4 px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)]">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          
          {/* 聊天消息区域 */}
          <Card className="flex-1 border-0 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4 pb-20">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex gap-3 ${message.type === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {/* 头像 */}
                      <Avatar className={`w-10 h-10 flex-shrink-0 ${message.type === "ai" ? "bg-gradient-to-br from-purple-500 to-blue-600" : "bg-gradient-to-br from-green-500 to-emerald-600"}`}>
                        <AvatarFallback className="text-white">
                          {message.type === "ai" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>

                      {/* 消息内容 */}
                      <div className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                        <div className={`px-4 py-3 rounded-2xl ${
                          message.type === "user" 
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-tr-sm"
                            : message.isError
                            ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-sm"
                            : "bg-gray-100 text-gray-800 rounded-tl-sm"
                        }`}>
                          <div className="text-sm leading-relaxed">
                            {renderMessageContent(message.content)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {/* 相关社团推荐卡片 */}
                        {message.relatedClubs && message.relatedClubs.length > 0 && (
                          <div className="mt-3 space-y-2 w-full">
                            <p className="text-xs text-gray-500 mb-2">相关社团推荐：</p>
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
                                      <p className="text-xs text-gray-500">{club.category} · {club.members || 0}人</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-blue-500" />
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* 流式响应显示 */}
                  {streamingContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600">
                        <AvatarFallback className="text-white">
                          <Bot className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start max-w-[80%]">
                        <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-sm">
                          <div className="text-sm leading-relaxed">
                            {renderMessageContent(streamingContent)}
                            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI 正在输入指示器 */}
                {isTyping && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600">
                      <AvatarFallback className="text-white">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">豆包 AI 正在思考...</span>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </Card>

          {/* 快捷问题按钮 */}
          {messages.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-sm text-gray-500 mb-2 text-center">💡 你可以尝试问：</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickQuestions.map((q, index) => (
                  <motion.button
                    key={q.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickQuestion(q)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-200 text-sm text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                  >
                    <q.icon className="w-4 h-4" />
                    {q.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 输入区域 */}
          <div className="mt-4 flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题，例如：我想找一个编程类的社团..."
                className="h-12 pr-12 bg-white/80 backdrop-blur-xl border-gray-200 focus:border-blue-500 rounded-full px-5"
                disabled={isTyping || clubsLoading}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => handleSendMessage()}
                disabled={isTyping || !inputMessage.trim() || clubsLoading}
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* 提示信息 */}
          <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            由豆包 AI 提供智能支持 · 点击社团卡片可查看详情
          </p>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
