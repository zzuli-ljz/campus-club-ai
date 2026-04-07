import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  MapPin,
  Heart,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useInterests } from "@/hooks/useInterests";
import { useFavorites } from "@/hooks/useFavorites";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";

const Recommendations = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();
  const { clubs, isLoading: clubsLoading } = useClubs();
  const { getUserInterests } = useInterests();
  const { getUserFavorites, addFavorite, removeFavorite, checkIsFavorite } = useFavorites();
  const [selectedTags, setSelectedTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("请先登录");
      navigate("/login");
      return;
    }

    const loadData = async () => {
      if (!user) return;

      // 加载用户兴趣标签
      const interestsResult = await getUserInterests(user.id);
      if (interestsResult.success && interestsResult.data.length > 0) {
        setSelectedTags(interestsResult.data);
      } else {
        // 如果没有兴趣标签，引导用户去填写
        toast.error("请先完成兴趣问卷");
        navigate("/survey");
        return;
      }

      // 加载用户收藏
      const favsResult = await getUserFavorites(user.id);
      if (favsResult.success) {
        setFavoriteIds(favsResult.data.map(c => c.id));
      }

      setLoading(false);
    };

    loadData();
  }, [isLoggedIn, user, navigate, getUserInterests, getUserFavorites]);

  // 计算推荐
  useEffect(() => {
    if (clubs.length > 0 && selectedTags.length > 0) {
      const matched = clubs.map(club => {
        const matchCount = club.tags?.filter(tag => selectedTags.includes(tag)).length || 0;
        const score = Math.min(98, 60 + matchCount * 15 + Math.floor(Math.random() * 10));
        return { ...club, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore);
      
      setRecommendations(matched);
    }
  }, [clubs, selectedTags]);

  const toggleFavorite = async (club) => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }

    if (favoriteIds.includes(club.id)) {
      const result = await removeFavorite(club.id);
      if (result.success) {
        setFavoriteIds(favoriteIds.filter(id => id !== club.id));
      }
    } else {
      const result = await addFavorite(club.id);
      if (result.success) {
        setFavoriteIds([...favoriteIds, club.id]);
      }
    }
  };

  const handleApply = (club) => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }
    navigate("/application", { state: { club } });
  };

  const handleRetake = () => {
    navigate("/survey");
  };

  if (loading || clubsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 正在为你匹配...</h2>
          <p className="text-gray-600">分析你的兴趣标签，寻找最适合的社团</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar 
        rightContent={
          <div className="text-sm text-gray-500">
            步骤 2/2：查看推荐
          </div>
        }
      />

      {/* 主内容 */}
      <main className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* 标题区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-sm" />
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900">AI 智能匹配结果</h1>
                <p className="text-gray-500">根据您的兴趣多标签相似度，为您精选以下社团</p>
              </div>
            </div>
            
            {/* 已选标签 */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/80 text-gray-700 px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleRetake} className="bg-white/80">
              <RefreshCw className="w-4 h-4 mr-2" />
              重新选择兴趣
            </Button>
          </motion.div>

          {/* 推荐列表 */}
          <div className="space-y-6">
            {recommendations.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* 图片区域 */}
                      <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
                        <img 
                          src={club.image || `https://nocode.meituan.com/photo/search?keyword=club,activity&width=400&height=300`} 
                          alt={club.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                            {club.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* 内容区域 */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{club.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {club.members || 0} 人
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {club.location || "待定"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                              {club.matchScore}%
                            </div>
                            <div className="text-xs text-gray-500">匹配度</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                        
                        {/* 匹配的标签 */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {club.tags?.map((tag) => (
                            <span 
                              key={tag}
                              className={`text-xs px-2 py-1 rounded-full ${
                                selectedTags.includes(tag)
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {selectedTags.includes(tag) && '✓ '}{tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            onClick={() => handleApply(club)}
                          >
                            申请加入
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className={favoriteIds.includes(club.id) ? 'text-red-500 border-red-200 bg-red-50' : ''}
                            onClick={() => toggleFavorite(club)}
                          >
                            <Heart className={`w-5 h-5 ${favoriteIds.includes(club.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/clubs/${club.id}`)}
                          >
                            <ExternalLink className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 底部操作 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <Button variant="outline" size="lg" onClick={() => navigate("/")} className="bg-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Recommendations;
