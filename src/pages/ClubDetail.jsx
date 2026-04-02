import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Heart, 
  Share2,
  MessageCircle,
  Star,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useFavorites } from "@/hooks/useFavorites";
import ClubReviews from "@/components/ClubReviews";
import ClubPosts from "@/components/ClubPosts";
import Navbar from "@/components/Navbar";

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const { getClubById } = useClubs();
  const { addFavorite, removeFavorite, checkIsFavorite } = useFavorites();
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClubData();
  }, [id]);

  useEffect(() => {
    if (isLoggedIn && club && user) {
      checkFavoriteStatus();
    }
  }, [isLoggedIn, club, user]);

  const loadClubData = async () => {
    setLoading(true);
    const data = await getClubById(id);
    if (data) {
      setClub(data);
    } else {
      toast.error("社团不存在");
      navigate("/clubs");
    }
    setLoading(false);
  };

  const checkFavoriteStatus = async () => {
    if (!user || !club) return;
    const result = await checkIsFavorite(user.id, club.id);
    if (result.success) {
      setIsFavorite(result.isFavorite);
    }
  };

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }

    if (!club) return;

    setIsLoading(true);
    
    if (isFavorite) {
      const result = await removeFavorite(club.id);
      if (result.success) {
        setIsFavorite(false);
      }
    } else {
      const result = await addFavorite(club.id);
      if (result.success) {
        setIsFavorite(true);
      }
    }
    
    setIsLoading(false);
  };

  const handleApply = () => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }
    navigate("/application", { state: { club } });
  };

  const categoryColors = {
    "学术科技": "bg-blue-100 text-blue-700",
    "文艺创作": "bg-purple-100 text-purple-700",
    "体育运动": "bg-orange-100 text-orange-700",
    "公益实践": "bg-green-100 text-green-700",
    "技术工程": "bg-indigo-100 text-indigo-700"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!club) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar showBack={true} backText="返回社团列表" />

      {/* Hero 区域 */}
      <div className="relative pt-20">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={club.image || `https://nocode.meituan.com/photo/search?keyword=club,activity&width=800&height=400`} 
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <Badge className={`${categoryColors[club.category] || "bg-gray-100 text-gray-700"} mb-3 text-sm px-3 py-1`}>
                {club.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{club.name}</h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {club.members || 0} 位成员
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {club.location || "待定"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <Button 
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12"
            onClick={handleApply}
          >
            申请加入
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`h-12 w-12 ${isFavorite ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
            onClick={toggleFavorite}
            disabled={isLoading}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("链接已复制");
            }}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* 标签页内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              社团介绍
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              社团动态
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              成员评价
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* 基本信息卡片 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">关于我们</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {club.description || "暂无社团介绍"}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">成立时间</p>
                      <p className="font-medium text-gray-900">{club.founded || "未设置"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">社长</p>
                      <p className="font-medium text-gray-900">{club.president || "未设置"}</p>
                    </div>
                  </div>
                </div>

                {club.tags && club.tags.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-3">社团标签</p>
                    <div className="flex flex-wrap gap-2">
                      {club.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{club.location || "待定"}</span>
                  </div>
                  {club.contact && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{club.contact}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <ClubPosts clubId={club.id} showCreate={false} />
          </TabsContent>

          <TabsContent value="reviews">
            <ClubReviews clubId={club.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClubDetail;
