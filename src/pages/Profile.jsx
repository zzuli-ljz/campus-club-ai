import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  LogOut,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useApplications } from "@/hooks/useApplications";
import { useFavorites } from "@/hooks/useFavorites";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, updateUser, isProfileLoading } = useUser();
  const { getUserApplications } = useApplications();
  const { getUserFavorites } = useFavorites();
  const { submitLeaveRequest, getUserLeaveRequests, isLoading: leaveLoading } = useLeaveRequests();
  const { language } = useLanguage();
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

  // 退出申请相关
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [leaveReason, setLeaveReason] = useState("");

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

      // 加载退出申请记录
      const leaveResult = await getUserLeaveRequests(user.id);
      if (leaveResult.success) {
        setLeaveRequests(leaveResult.data);
      }
    };

    loadUserData();
  }, [user, getUserApplications, getUserFavorites, getUserLeaveRequests]);

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
            {language === "zh" ? "审核中" : "Pending"}
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === "zh" ? "已通过" : "Approved"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            {language === "zh" ? "未通过" : "Rejected"}
          </Badge>
        );
      default:
        return <Badge>{language === "zh" ? "未知" : "Unknown"}</Badge>;
    }
  };

  // 打开退出申请对话框
  const openLeaveDialog = (club) => {
    setSelectedClub(club);
    setLeaveReason("");
    setIsLeaveDialogOpen(true);
  };

  // 提交退出申请
  const handleSubmitLeave = async () => {
    if (!selectedClub) return;
    
    const result = await submitLeaveRequest(selectedClub.id, leaveReason);
    if (result.success) {
      // 重新加载退出申请记录
      const leaveResult = await getUserLeaveRequests(user.id);
      if (leaveResult.success) {
        setLeaveRequests(leaveResult.data);
      }
      setIsLeaveDialogOpen(false);
    }
  };

  // 检查某个社团是否有待处理的退出申请
  const hasPendingLeaveRequest = (clubId) => {
    return leaveRequests.some(req => req.club_id === clubId && req.status === 'pending');
  };

  // 加载中状态
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50 pt-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar title={language === "zh" ? "个人中心" : "Personal Center"} />

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
                    <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white text-2xl">
                      {profile?.name?.[0] || user?.email?.[0] || "用"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {profile?.name || (language === "zh" ? "未设置姓名" : "Name not set")}
                    </h1>
                    <p className="text-gray-500 mb-3">
                      {(profile?.student_id || (language === "zh" ? "未设置学号" : "Student ID not set"))} · {profile?.email || user?.email || (language === "zh" ? "未设置邮箱" : "Email not set")}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        {language === "zh" ? `已加入 ${myClubs.length} 个社团` : `Joined ${myClubs.length} clubs`}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        <FileText className="w-3 h-3 mr-1" />
                        {language === "zh" ? `已报名 ${applications.length} 次` : `Applied ${applications.length} times`}
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
                        {language === "zh" ? "保存资料" : "Save"}
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        {language === "zh" ? "修改资料" : "Edit"}
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
                    {language === "zh" ? "编辑个人资料" : "Edit Personal Info"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {language === "zh" ? "姓名" : "Name"}
                      </Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder={language === "zh" ? "请输入姓名" : "Enter your name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        {language === "zh" ? "学号" : "Student ID"}
                      </Label>
                      <Input
                        value={editForm.studentId}
                        onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                        placeholder={language === "zh" ? "请输入学号" : "Enter your student ID"}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {language === "zh" ? "个人简介" : "Bio"}
                    </Label>
                    <Input
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder={language === "zh" ? "写一段简短的自我介绍..." : "Write a brief self-introduction..."}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500"
                      onClick={handleSaveProfile}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {language === "zh" ? "保存更改" : "Save Changes"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      {language === "zh" ? "取消" : "Cancel"}
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
                  {language === "zh" ? "报名记录" : "Applications"}
                </TabsTrigger>
                <TabsTrigger value="clubs" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {language === "zh" ? "我的社团" : "My Clubs"}
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {language === "zh" ? "我的收藏" : "Favorites"}
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{language === "zh" ? "暂无报名记录" : "No applications yet"}</h3>
                      <p className="text-gray-500 mb-4">{language === "zh" ? "还没有提交过社团申请，快去浏览社团吧" : "No club applications submitted yet. Go browse clubs!"}</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                        onClick={() => navigate("/clubs")}
                      >
                        {language === "zh" ? "浏览社团" : "Browse Clubs"}
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
                            {language === "zh" ? "申请时间" : "Application Time"}: {app.applyTime}
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{language === "zh" ? "还未加入任何社团" : "Not joined any clubs yet"}</h3>
                      <p className="text-gray-500 mb-4">{language === "zh" ? "加入社团后，这里会显示你的社团信息" : "After joining clubs, your club info will be shown here"}</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                        onClick={() => navigate("/clubs")}
                      >
                        {language === "zh" ? "去加入社团" : "Join a Club"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  myClubs.map((club, index) => {
                    const isPending = hasPendingLeaveRequest(club.id);
                    return (
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
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {club.name[0]}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{club.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {language === "zh" ? "加入时间" : "Join Date"}: {club.joinDate} · {language === "zh" ? "身份" : "Role"}: {club.role}
                                  </p>
                                  {isPending && (
                                    <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-0">
                                      <HourglassIcon className="w-3 h-3 mr-1" />
                                      {language === "zh" ? "退出申请审核中" : "Leave Request Pending"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/clubs/${club.id}`)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  {language === "zh" ? "查看" : "View"}
                                </Button>
                                {profile?.role !== 'club_admin' && (
                                  isPending ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      disabled
                                      className="text-gray-400"
                                    >
                                      {language === "zh" ? "等待审核" : "Waiting"}
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => openLeaveDialog(club)}
                                    >
                                      <LogOut className="w-4 h-4 mr-1" />
                                      {language === "zh" ? "申请退出" : "Apply to Exit"}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{language === "zh" ? "暂无收藏" : "No favorites yet"}</h3>
                      <p className="text-gray-500 mb-4">{language === "zh" ? "收藏感兴趣的社团，方便以后查看" : "Favorite clubs you're interested in for easy access"}</p>
                      <Button 
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                        onClick={() => navigate("/clubs")}
                      >
                        {language === "zh" ? "去收藏社团" : "Favorite Clubs"}
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
                                {language === "zh" ? "查看详情" : "View Details"}
                              </Button>
                              <Button 
                                className="bg-gradient-to-r from-blue-700 to-blue-500"
                                size="sm"
                                onClick={() => navigate("/application", { state: { club } })}
                              >
                                {language === "zh" ? "立即申请" : "Apply Now"}
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

      {/* 退出申请对话框 */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              {language === "zh" ? "申请退出社团" : "Apply to Leave Club"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh" 
                ? `您确定要申请退出「${selectedClub?.name}」吗？申请提交后将由社团管理员审核。`
                : `Are you sure you want to leave ${selectedClub?.name}? Your request will be reviewed by the club admin.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === "zh" ? "退出原因（可选）" : "Reason (optional)"}
              </Label>
              <Textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder={language === "zh" ? "请输入退出原因，帮助社团改进..." : "Please enter your reason to help the club improve..."}
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmitLeave}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
              disabled={leaveLoading}
            >
              {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
              {language === "zh" ? "确认提交" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
