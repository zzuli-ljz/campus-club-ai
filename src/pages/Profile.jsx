import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings, 
  User,
  Hash,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  HourglassIcon,
  Users,
  Heart,
  Edit3,
  Save,
  ArrowRight,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useApplications } from "@/hooks/useApplications";
import { useFavorites } from "@/hooks/useFavorites";
import Navbar from "@/components/Navbar";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, updateUser, isProfileLoading } = useUser();
  const { getUserApplications } = useApplications();
  const { getUserFavorites } = useFavorites();
  const [activeTab, setActiveTab] = useState("applications");
  const [isEditing, setIsEditing] = useState(false);
  
  // 用户资料
  const [editForm, setEditForm] = useState({
    name: "",
    studentId: "",
    bio: ""
  });

  // 数据加载状态
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  // 报名记录
  const [applications, setApplications] = useState([]);
  
  // 已加入的社团
  const [myClubs, setMyClubs] = useState([]);

  // 收藏的社团
  const [favorites, setFavorites] = useState([]);

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        studentId: profile.student_id || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  // 加载用户数据
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      // 加载报名记录
      setLoadingApplications(true);
      const appsResult = await getUserApplications(user.id);
      if (appsResult.success) {
        // 格式化数据
        const formattedApps = appsResult.data.map(app => ({
          id: app.id,
          clubName: app.clubs?.name || "未知社团",
          clubCategory: app.clubs?.category || "其他",
          selfIntro: app.self_intro,
          status: app.status,
          applyTime: new Date(app.apply_time).toLocaleString("zh-CN")
        }));
        setApplications(formattedApps);
      }
      setLoadingApplications(false);

      // 加载已加入的社团 - 直接从 club_members 表查询
      setLoadingClubs(true);
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select(`
            id,
            role,
            join_date,
            clubs:club_id (
              id,
              name,
              category,
              description
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('join_date', { ascending: false });

        if (memberError) {
          console.error('查询社团成员失败:', memberError);
        } else {
          const formattedClubs = (memberData || []).map(item => ({
            id: item.clubs?.id,
            name: item.clubs?.name || '未知社团',
            category: item.clubs?.category || '其他',
            description: item.clubs?.description,
            joinDate: new Date(item.join_date).toLocaleDateString('zh-CN'),
            role: item.role || '成员',
            memberId: item.id
          })).filter(club => club.id); // 过滤掉无效数据
          
          setMyClubs(formattedClubs);
        }
      } catch (err) {
        console.error('加载已加入社团失败:', err);
      }
      setLoadingClubs(false);

      // 加载收藏
      setLoadingFavorites(true);
      const favsResult = await getUserFavorites(user.id);
      if (favsResult.success) {
        const formattedFavs = favsResult.data.map(club => ({
          id: club.id,
          name: club.name,
          category: club.category,
          description: club.description
        }));
        setFavorites(formattedFavs);
      }
      setLoadingFavorites(false);
    };

    loadUserData();
  }, [user, getUserApplications, getUserFavorites]);

  const handleSaveProfile = async () => {
    const result = await updateUser({
      name: editForm.name,
      student_id: editForm.studentId,
      bio: editForm.bio,
    });
    
    if (result.success) {
      setIsEditing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <HourglassIcon className="w-3 h-3 mr-1" />
            审核中
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            已通过
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            未通过
          </Badge>
        );
      default:
        return <Badge>未知</Badge>;
    }
  };

  // 加载中状态
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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
      <Navbar title="个人中心" />

      {/* 主内容 */}
      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* 用户信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                      {profile?.name?.[0] || user?.email?.[0] || "用"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {profile?.name || "未设置姓名"}
                    </h1>
                    <p className="text-gray-500 mb-3">
                      {profile?.student_id || "未设置学号"} · {profile?.email || user?.email || "未设置邮箱"}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        已加入 {myClubs.length} 个社团
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                        <FileText className="w-3 h-3 mr-1" />
                        已报名 {applications.length} 次
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 px-4"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        保存资料
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        修改资料
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 编辑资料表单 */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    编辑个人资料
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        姓名
                      </Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        学号
                      </Label>
                      <Input
                        value={editForm.studentId}
                        onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                        placeholder="请输入学号"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      个人简介
                    </Label>
                    <Input
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="写一段简短的自我介绍..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                      onClick={handleSaveProfile}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存更改
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 标签页内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/80">
                <TabsTrigger value="applications" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  报名记录
                </TabsTrigger>
                <TabsTrigger value="clubs" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  我的社团
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  我的收藏
                </TabsTrigger>
              </TabsList>

              {/* 报名记录 */}
              <TabsContent value="applications" className="mt-6 space-y-4">
                {loadingApplications ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : applications.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无报名记录</h3>
                      <p className="text-gray-500 mb-4">还没有提交过社团申请，快去浏览社团吧</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                        onClick={() => navigate("/clubs")}
                      >
                        浏览社团
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  applications.map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{app.clubName}</h4>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {app.clubCategory}
                              </Badge>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {app.selfIntro}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            申请时间：{app.applyTime}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* 我的社团 */}
              <TabsContent value="clubs" className="mt-6 space-y-4">
                {loadingClubs ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : myClubs.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">还未加入任何社团</h3>
                      <p className="text-gray-500 mb-4">加入社团后，这里会显示你的社团信息</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                        onClick={() => navigate("/clubs")}
                      >
                        去加入社团
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  myClubs.map((club, index) => (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {club.name[0]}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{club.name}</h4>
                                <p className="text-sm text-gray-500">
                                  加入时间：{club.joinDate} · 身份：{club.role}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/clubs/${club.id}`)}
                            >
                              查看
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* 我的收藏 */}
              <TabsContent value="favorites" className="mt-6 space-y-4">
                {loadingFavorites ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : favorites.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
                      <p className="text-gray-500 mb-4">收藏感兴趣的社团，方便以后查看</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                        onClick={() => navigate("/clubs")}
                      >
                        去收藏社团
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  favorites.map((club, index) => (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{club.name}</h4>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {club.category}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/clubs/${club.id}`)}
                              >
                                查看详情
                              </Button>
                              <Button 
                                className="bg-gradient-to-r from-blue-500 to-purple-600"
                                size="sm"
                                onClick={() => navigate("/application", { state: { club } })}
                              >
                                立即申请
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
