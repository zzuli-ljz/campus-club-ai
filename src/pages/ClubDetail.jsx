
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MapPin,
  Calendar,
  Heart,
  Share2,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useClubs } from "@/hooks/useClubs";
import { useActivities } from "@/hooks/useActivities";
import { useMembers } from "@/hooks/useMembers";
import { useClubMembership } from "@/hooks/useClubMembership";
import Navbar from "@/components/Navbar";

// 扩展的社团数据（与Clubs.jsx保持一致，实际项目中应该从API获取）
const clubsData = [
  {
    id: 1,
    name: "程序设计协会",
    category: "学术科技",
    description: "专注于算法竞赛、编程技术交流和项目实战，定期举办编程马拉松和技术分享会。我们致力于为编程爱好者提供一个学习、交流和成长的平台，无论你是初学者还是资深开发者，都能在这里找到志同道合的伙伴。",
    members: 156,
    tags: ["编程开发", "人工智能", "数学建模"],
    image: "https://nocode.meituan.com/photo/search?keyword=programming,coding&width=800&height=400",
    location: "科技楼 301",
    founded: "2015年",
    president: "张明",
    contact: "programming@school.edu.cn",
  },
  {
    id: 2,
    name: "摄影协会",
    category: "文艺创作",
    description: "用镜头记录美好瞬间，定期组织外拍活动、摄影培训和作品展览。我们相信每个人都能成为生活的摄影师，通过摄影发现世界的美丽。",
    members: 89,
    tags: ["摄影协会", "绘画艺术", "微电影"],
    image: "https://nocode.meituan.com/photo/search?keyword=photography,camera&width=800&height=400",
    location: "艺术中心 205",
    founded: "2012年",
    president: "刘芳",
    contact: "photo@school.edu.cn",
  },
  {
    id: 3,
    name: "篮球社",
    category: "体育运动",
    description: "热爱篮球，享受团队合作的乐趣。每周定期训练，组织校内联赛。无论你是篮球高手还是新手，都欢迎加入我们的大家庭。",
    members: 120,
    tags: ["篮球", "健身"],
    image: "https://nocode.meituan.com/photo/search?keyword=basketball,sport&width=800&height=400",
    location: "体育馆",
    founded: "2010年",
    president: "王强",
    contact: "basketball@school.edu.cn",
  },
  {
    id: 4,
    name: "志愿者协会",
    category: "公益实践",
    description: "致力于社区服务、支教助学和环保公益，用行动传递温暖。我们相信每一份小小的付出，都能汇聚成改变世界的力量。",
    members: 200,
    tags: ["志愿服务", "支教助学", "环保公益"],
    image: "https://nocode.meituan.com/photo/search?keyword=volunteer,community&width=800&height=400",
    location: "学生活动中心 102",
    founded: "2008年",
    president: "陈静",
    contact: "volunteer@school.edu.cn",
  },
  {
    id: 5,
    name: "机器人创新实验室",
    category: "技术工程",
    description: "探索机器人技术，参与各类机器人竞赛，培养工程实践能力。从机械设计到程序控制，我们覆盖机器人技术的方方面面。",
    members: 45,
    tags: ["机器人", "电子设计", "3D打印", "编程开发"],
    image: "https://nocode.meituan.com/photo/search?keyword=robot,technology&width=800&height=400",
    location: "工程楼 实验室 B",
    founded: "2018年",
    president: "吴昊",
    contact: "robot@school.edu.cn",
  }
];

const categoryColors = {
  "学术科技": "bg-blue-100 text-blue-700",
  "文艺创作": "bg-purple-100 text-purple-700",
  "体育运动": "bg-orange-100 text-orange-700",
  "公益实践": "bg-green-100 text-green-700",
  "技术工程": "bg-indigo-100 text-indigo-700"
};

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();
  const { addFavorite, removeFavorite, checkIsFavorite } = useFavorites();
  const { getClubById } = useClubs();
  const { getClubActivities } = useActivities();
  const { getClubMembers } = useMembers();
  const { checkIsMember, isLoading: checkingMembership } = useClubMembership();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [isLoading, setIsLoading] = useState(false);
  const [club, setClub] = useState(null);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingClub, setLoadingClub] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState(null);

  // 查找社团基础数据
  const baseClub = clubsData.find(c => c.id === parseInt(id)) || clubsData[0];

  // 加载社团详情（从数据库获取最新数据）
  useEffect(() => {
    const loadClubDetail = async () => {
      setLoadingClub(true);
      const data = await getClubById(parseInt(id));
      if (data) {
        // 合并基础数据和数据库数据
        setClub({ ...baseClub, ...data });
      } else {
        setClub(baseClub);
      }
      setLoadingClub(false);
    };
    loadClubDetail();
  }, [id, baseClub, getClubById]);

  // 加载活动数据（从数据库获取）
  useEffect(() => {
    const loadActivities = async () => {
      setLoadingActivities(true);
      const result = await getClubActivities(parseInt(id));
      if (result.success) {
        setActivities(result.data);
      }
      setLoadingActivities(false);
    };
    loadActivities();
  }, [id, getClubActivities]);

  // 加载成员数据（从数据库获取）
  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true);
      const result = await getClubMembers(parseInt(id));
      if (result.success) {
        setMembers(result.data);
      }
      setLoadingMembers(false);
    };
    loadMembers();
  }, [id, getClubMembers]);

  // 检查用户是否已经是该社团成员
  useEffect(() => {
    const checkMembership = async () => {
      if (!isLoggedIn || !user || !club) {
        setIsMember(false);
        setMemberRole(null);
        return;
      }
      
      const result = await checkIsMember(user.id, club.id);
      if (result.isMember) {
        setIsMember(true);
        setMemberRole(result.memberInfo?.role || '成员');
      } else {
        setIsMember(false);
        setMemberRole(null);
      }
    };
    
    checkMembership();
  }, [isLoggedIn, user, club, checkIsMember]);

  // 页面加载时检查是否已收藏
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isLoggedIn || !user || !club) return;
      
      const result = await checkIsFavorite(user.id, club.id);
      if (result.success) {
        setIsFavorite(result.isFavorite);
      }
    };
    
    checkFavoriteStatus();
  }, [isLoggedIn, user, club, checkIsFavorite]);

  // 处理申请加入按钮点击
  const handleApply = () => {
    if (!isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login");
      return;
    }
    
    // 检查社团是否正在招新
    if (!club?.is_recruiting) {
      toast.error("该社团已停止招新");
      return;
    }
    
    // 检查是否已经是成员
    if (isMember) {
      toast.error(`您已经是该社团的${memberRole}，无需重复申请`);
      return;
    }
    
    navigate("/application", { state: { club } });
  };

  const handleShare = () => {
    toast.success("链接已复制到剪贴板");
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

  // 获取活动状态标签
  const getActivityStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已结束</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700">即将开始</Badge>;
      case 'ongoing':
        return <Badge className="bg-orange-100 text-orange-700">进行中</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">未知</Badge>;
    }
  };

  // 获取活动类型标签
  const getActivityTypeBadge = (type) => {
    switch (type) {
      case 'activity':
        return <Badge variant="outline" className="border-purple-200 text-purple-600">活动</Badge>;
      case 'notice':
        return <Badge variant="outline" className="border-blue-200 text-blue-600">通知</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="border-red-200 text-red-600">紧急</Badge>;
      default:
        return null;
    }
  };

  const displayClub = club || baseClub;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar 
        showBack={true}
        backText="返回列表"
        onBack={() => navigate("/clubs")}
      />

      {/* 主内容 */}
      <main className="relative pt-20 pb-24">
        {/* 顶部大图 */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img 
            src={displayClub.image} 
            alt={displayClub.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${categoryColors[displayClub.category]} border-0`}>
                    {displayClub.category}
                  </Badge>
                  {/* 招新状态标签 */}
                  {displayClub.is_recruiting ? (
                    <Badge className="bg-green-500 text-white border-0">
                      正在招新
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500 text-white border-0">
                      已停止招新
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {displayClub.name}
                </h1>
                <p className="text-white/80 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {displayClub.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    成立于{displayClub.founded}
                  </span>
                </p>
              </motion.div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={`bg-white/20 backdrop-blur-md border-0 hover:bg-white/30 ${isFavorite ? "text-red-500" : "text-white"}`}
              onClick={toggleFavorite}
              disabled={isLoading}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/20 backdrop-blur-md border-0 hover:bg-white/30 text-white"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* 统计卡片 */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-xl mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {loadingMembers ? "..." : members.length}
                    </div>
                    <div className="text-sm text-gray-500">成员</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {loadingActivities ? "..." : activities.length}
                    </div>
                    <div className="text-sm text-gray-500">活动</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {displayClub.tags?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">标签</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 招新状态提示（已停止招新时显示） */}
            {!displayClub.is_recruiting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-lg bg-gray-100 backdrop-blur-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">该社团已停止招新</h3>
                      <p className="text-sm text-gray-500">目前不接受新的申请，请关注社团后续动态</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 已是成员提示 */}
            {isMember && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-lg bg-green-50 backdrop-blur-xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">您已是该社团成员</h3>
                      <p className="text-sm text-gray-500">您的身份：{memberRole}，无需重复申请</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 标签展示 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {displayClub.tags?.map(tag => (
                <span 
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/80 text-blue-700 text-sm border border-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 标签页 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-24">
              <TabsList className="grid w-full grid-cols-3 bg-white/80">
                <TabsTrigger value="about">社团介绍</TabsTrigger>
                <TabsTrigger value="activities">活动历史</TabsTrigger>
                <TabsTrigger value="members">成员列表</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">关于我们</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {displayClub.description}
                    </p>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        社长：{displayClub.president}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        活动地点：{displayClub.location}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <div className="space-y-4">
                  {loadingActivities ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : activities.length === 0 ? (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                      <CardContent className="p-8 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活动</h3>
                        <p className="text-gray-500">该社团尚未发布任何活动</p>
                      </CardContent>
                    </Card>
                  ) : (
                    activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getActivityTypeBadge(activity.type)}
                                  {getActivityStatusBadge(activity.status)}
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">{activity.title}</h4>
                                {activity.content && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.content}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {activity.activity_date 
                                      ? new Date(activity.activity_date).toLocaleDateString('zh-CN')
                                      : '日期待定'
                                    }
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    发布于 {new Date(activity.created_at).toLocaleDateString('zh-CN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-6">
                    {loadingMembers ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无成员数据</h3>
                        <p className="text-gray-500">该社团暂无成员记录</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member, index) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                                {member.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">
                                {member.major || "未知专业"} · 加入于 {new Date(member.join_date).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              {member.role || "成员"}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {!loadingMembers && members.length > 0 && (
                      <div className="mt-6 text-center text-sm text-gray-500">
                        共 {members.length} 位成员
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="hidden sm:block flex-1">
            <p className="font-medium text-gray-900">{displayClub.name}</p>
            <p className="text-sm text-gray-500">
              {loadingMembers ? "加载中..." : `${members.length} 位成员`}
            </p>
          </div>
          
          {isMember ? (
            // 已是成员状态
            <Button 
              className="flex-1 sm:flex-none h-12 px-8 bg-green-500 hover:bg-green-600 text-white font-medium cursor-default"
              disabled={true}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              已是成员（{memberRole}）
            </Button>
          ) : !displayClub.is_recruiting ? (
            // 已停止招新状态
            <Button 
              className="flex-1 sm:flex-none h-12 px-8 bg-gray-400 hover:bg-gray-400 text-white font-medium cursor-not-allowed"
              disabled={true}
            >
              <XCircle className="w-5 h-5 mr-2" />
              已停止招新
            </Button>
          ) : (
            // 正常申请状态
            <Button 
              className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              onClick={handleApply}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              申请加入
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;

