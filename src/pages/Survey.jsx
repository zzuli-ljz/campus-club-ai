import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  BookOpen, 
  Music, 
  Trophy, 
  Heart, 
  Code,
  Check,
  RotateCcw,
  Loader2,
  Bot
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useInterests } from "@/hooks/useInterests";
import { useCategoryTags } from "@/hooks/useCategoryTags";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";

// 分类配置（图标和样式）
const categoryConfig = {
  academic: {
    id: "academic",
    name: "学术科技",
    icon: <BookOpen className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    categoryName: "学术科技"
  },
  arts: {
    id: "arts",
    name: "文艺创作",
    icon: <Music className="w-5 h-5" />,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    categoryName: "文艺创作"
  },
  sports: {
    id: "sports",
    name: "体育运动",
    icon: <Trophy className="w-5 h-5" />,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    categoryName: "体育运动"
  },
  public: {
    id: "public",
    name: "公益实践",
    icon: <Heart className="w-5 h-5" />,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    categoryName: "公益实践"
  },
  tech: {
    id: "tech",
    name: "技术工程",
    icon: <Code className="w-5 h-5" />,
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    categoryName: "技术工程"
  }
};

const Survey = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { saveInterests, getUserInterests, isLoading: interestsLoading } = useInterests();
  const { tagsByCategory, isLoading: tagsLoading, categoryMapping } = useCategoryTags();
  const [selectedTags, setSelectedTags] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 构建动态分类数据
  const [interestCategories, setInterestCategories] = useState([]);

  // 根据数据库标签构建分类数据
  useEffect(() => {
    if (Object.keys(tagsByCategory).length > 0) {
      const dynamicCategories = Object.entries(categoryConfig).map(([key, config]) => {
        const categoryTags = tagsByCategory[config.categoryName] || [];
        return {
          ...config,
          tags: categoryTags
        };
      }).filter(cat => cat.tags.length > 0); // 只显示有标签的分类
      
      setInterestCategories(dynamicCategories);
    }
  }, [tagsByCategory]);

  // 加载已保存的兴趣标签
  useEffect(() => {
    const loadInterests = async () => {
      if (user) {
        const result = await getUserInterests(user.id);
        if (result.success && result.data.length > 0) {
          setSelectedTags(result.data);
        }
      }
      setIsInitialLoading(false);
    };
    loadInterests();
  }, [user, getUserInterests]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        toast.warning("最多只能选择5个标签哦");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      toast.error("请至少选择一个兴趣标签");
      return;
    }
    
    setIsAnimating(true);
    
    // 保存到数据库
    const result = await saveInterests(selectedTags);
    
    if (result.success) {
      toast.success(`已选择 ${selectedTags.length} 个兴趣标签`);
      setTimeout(() => {
        navigate("/recommendations");
      }, 600);
    } else {
      setIsAnimating(false);
    }
  };

  const handleReset = () => {
    setSelectedTags([]);
    toast.info("已清空选择");
  };

  if (isInitialLoading || tagsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载标签数据中...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Navbar 
        showBack={true} 
        backText="返回首页" 
        onBack={() => navigate("/")}
        rightContent={
          <div className="text-sm text-gray-500">
            步骤 1/2：选择兴趣
          </div>
        }
      />

      <main className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-10"
          >
            <img src={logo} alt="Logo" className="w-16 h-16 mb-4 rounded-2xl object-contain shadow-md" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              个性化兴趣问卷
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              选择你感兴趣的标签，AI将为你精准推荐最适合的社团
            </p>
            
            {/* AI 助手提示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={() => navigate("/ai-assistant")}
              >
                <Bot className="w-4 h-4 mr-2" />
                不确定选什么？问问 AI 顾问
              </Button>
            </motion.div>
            
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200">
              <span className="text-sm text-gray-600">已选择</span>
              <span className={`text-lg font-bold ${selectedTags.length >= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                {selectedTags.length}
              </span>
              <span className="text-sm text-gray-600">/ 5 个标签</span>
              {selectedTags.length > 0 && (
                <button
                  onClick={handleReset}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="清空选择"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          <div className="space-y-6">
            {interestCategories.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl p-8 text-center">
                <p className="text-gray-500">暂无标签数据，请联系管理员添加</p>
              </Card>
            ) : (
              interestCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white shadow-md`}>
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">选择你感兴趣的{category.name}方向</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {category.tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleTag(tag)}
                              disabled={interestsLoading}
                              className={`
                                relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                ${isSelected 
                                  ? `${category.bgColor} ${category.textColor} ${category.borderColor} border-2 shadow-md` 
                                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                                }
                                ${isSelected ? 'pr-8' : ''}
                                ${interestsLoading ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              {tag}
                              {isSelected && (
                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${category.textColor}`}>
                                  <Check className="w-4 h-4" />
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {selectedTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">我的兴趣标签：</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-blue-700 text-sm border border-blue-200 shadow-sm"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block text-sm text-gray-500">
            {selectedTags.length === 0 
              ? "请至少选择一个兴趣标签" 
              : `已选择 ${selectedTags.length} 个标签，点击生成推荐`}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-12 px-6 border-gray-300"
              onClick={() => navigate("/")}
            >
              返回首页
            </Button>
            <Button
              className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              onClick={handleSubmit}
              disabled={isAnimating || interestsLoading || selectedTags.length === 0}
            >
              {isAnimating || interestsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  生成推荐
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Survey;
