import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  Settings,
  CheckCircle,
  XCircle,
  Hourglass,
  TrendingUp,
  UserPlus,
  UserMinus,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  MoreVertical,
  Crown,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useApplications } from "@/hooks/useApplications";
import { useMembers } from "@/hooks/useMembers";
import { useActivities } from "@/hooks/useActivities";
import Navbar from "@/components/Navbar";

const ClubAdmin = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useUser();
  const { getClubById, updateClub, toggleRecruiting } = useClubs();
  const { getClubApplications, updateApplicationStatus } = useApplications();
  const { getClubMembers, updateMemberRole, removeMember, isLoading: memberLoading } = useMembers();
  const { getClubActivities, createActivity, updateActivity, deleteActivity, isLoading: activityLoading } = useActivities();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [clubData, setClubData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // 活动表单
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityForm, setActivityForm] = useState({ 
    title: "", 
    content: "", 
    type: "activity",
    activity_date: "",
    status: "upcoming"
  });
  
  // 成员管理
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberRoleDialogOpen, setIsMemberRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingClub, setLoadingClub] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // 权限检查 - 确保只有社团管理员能访问
  useEffect(() => {
    if (role !== "club_admin") {
      toast.error("无权访问社团管理后台");
      navigate("/");
    }
  }, [role, navigate]);

  // 加载社团数据
  useEffect(() => {
    if (profile?.club_id) {
      loadClubData(profile.club_id);
      loadMembers(profile.club_id);
      loadActivities(profile.club_id);
    }
  }, [profile]);

  const loadClubData = async (clubId) => {
    setLoadingClub(true);
    const data = await getClubById(clubId);
    if (data) {
      setClubData(data);
      setEditForm(data);
    }
    setLoadingClub(false);
  };

  // 加载申请数据
  useEffect(() => {
    if (profile?.club_id) {
      loadApplications(profile.club_id);
    }
  }, [profile]);

  const loadApplications = async (clubId) => {
    setLoadingApps(true);
    const result = await getClubApplications(clubId);
    if (result.success) {
      const formattedApps = result.data.map(app => ({
        id: app.id,
        applicantName: app.name,
        studentId: app.student_id,
        selfIntro: app.self_intro,
        applyTime: new Date(app.apply_time).toLocaleString("zh-CN"),
        status: app.status,
        major: app.profiles?.student_id || "未知专业"
      }));
      setApplications(formattedApps);
    }
    setLoadingApps(false);
  };

  // 加载成员列表
  const loadMembers = async (clubId) => {
    setLoadingMembers(true);
    const result = await getClubMembers(clubId);
    if (result.success) {
      setMembers(result.data);
    }
    setLoadingMembers(false);
  };

  // 加载活动列表
  const loadActivities = async (clubId) => {
    setLoadingActivities(true);
    const result = await getClubActivities(clubId);
    if (result.success) {
      setActivities(result.data);
    }
    setLoadingActivities(false);
  };

  // 处理申请审核
  const handleApplication = async (id, action) => {
    const result = await updateApplicationStatus(id, action);
    if (result.success) {
      await loadApplications(profile.club_id);
      // 如果批准了，刷新成员列表
      if (action === 'approved') {
        await loadMembers(profile.club_id);
      }
    }
  };

  // 保存社团信息
  const handleSaveClubInfo = async () => {
    if (!clubData?.id) return;
    
    const result = await updateClub(clubData.id, {
      name: editForm.name,
      description: editForm.description,
      location: editForm.location,
      contact: editForm.contact,
      tags: editForm.tags,
    });
    
    if (result.success) {
      setClubData(result.data);
      setIsEditing(false);
    }
  };

  // 切换招新状态
  const handleToggleRecruiting = async () => {
    if (!clubData?.id) return;
    const result = await toggleRecruiting(clubData.id, clubData.is_recruiting);
    if (result.success) {
      setClubData(result.data);
    }
  };

  // 打开创建活动对话框
  const openCreateActivityDialog = () => {
    setEditingActivity(null);
    setActivityForm({ 
      title: "", 
      content: "", 
      type: "activity",
      activity_date: "",
      status: "upcoming"
    });
    setIsActivityDialogOpen(true);
  };

  // 打开编辑活动对话框
  const openEditActivityDialog = (activity) => {
    setEditingActivity(activity);
    setActivityForm({ 
      title: activity.title, 
      content: activity.content || "", 
      type: activity.type || "activity",
      activity_date: activity.activity_date || "",
      status: activity.status || "upcoming"
    });
    setIsActivityDialogOpen(true);
  };

  // 保存活动（创建或更新）
  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) {
      toast.error("请输入活动标题");
      return;
    }

    if (!profile?.club_id) {
      toast.error("社团信息缺失");
      return;
    }

    const activityData = {
      club_id: profile.club_id,
      ...activityForm
    };

    let result;
    if (editingActivity) {
      result = await updateActivity(editingActivity.id, activityData);
    } else {
      result = await createActivity(activityData);
    }

    if (result.success) {
      setIsActivityDialogOpen(false);
      await loadActivities(profile.club_id);
    }
  };

  // 处理删除活动
  const handleDeleteActivity = async (activityId) => {
    const result = await deleteActivity(activityId);
    if (result.success) {
      await loadActivities(profile.club_id);
    }
  };

  // 打开编辑角色对话框
  const openEditRoleDialog = (member) => {
    setSelectedMember(member);
    setNewRole(member.role || "成员");
    setIsMemberRoleDialogOpen(true);
  };

  // 保存成员角色
  const handleSaveMemberRole = async () => {
    if (!selectedMember) return;
    
    const result = await updateMemberRole(selectedMember.id, newRole);
    if (result.success) {
      setIsMemberRoleDialogOpen(false);
      await loadMembers(profile.club_id);
    }
  };

  // 处理移除成员
  const handleRemoveMember = async (memberId) => {
    if (!confirm("确定要移除该成员吗？")) return;
    
    const result = await removeMember(memberId);
    if (result.success) {
      await loadMembers(profile.club_id);
    }
  };

  // 过滤申请
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicantName?.includes(searchQuery) || app.studentId?.includes(searchQuery);
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 过滤成员
  const filteredMembers = members.filter(member => {
    const searchLower = memberSearchQuery.toLowerCase();
    return member.name?.toLowerCase().includes(searchLower) || 
           member.major?.toLowerCase().includes(searchLower) ||
           member.role?.toLowerCase().includes(searchLower);
  });

  const sidebarItems = [
    { id: "overview", label: "概览", icon: LayoutDashboard },
    { id: "info", label: "信息管理", icon: Settings },
    { id: "applications", label: "报名审核", icon: FileText },
    { id: "members", label: "成员管理", icon: Users },
    { id: "activities", label: "活动管理", icon: Megaphone },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Hourglass className="w-3 h-3 mr-1" />待审核</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const getActivityTypeBadge = (type) => {
    switch (type) {
      case "activity":
        return <Badge className="bg-purple-100 text-purple-700">活动</Badge>;
      case "notice":
        return <Badge className="bg-blue-100 text-blue-700">通知</Badge>;
      case "urgent":
        return <Badge className="bg-red-100 text-red-700">紧急</Badge>;
      default:
        return <Badge>其他</Badge>;
    }
  };

  const getActivityStatusBadge = (status) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="border-blue-200 text-blue-600">即将开始</Badge>;
      case "ongoing":
        return <Badge variant="outline" className="border-green-200 text-green-600">进行中</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-gray-200 text-gray-500">已结束</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (loadingClub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-24 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
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
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar title="社团管理后台" />

      {/* 主内容区域 */}
      <div className="relative pt-20 flex">
        {/* 侧边栏 */}
        <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {clubData?.name?.[0] || "社"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{clubData?.name || "加载中..."}</h2>
                <p className="text-xs text-gray-500">社团管理员</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === "applications" && applications.filter(a => a.status === "pending").length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {applications.filter(a => a.status === "pending").length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* 移动端标签切换 */}
        <div className="md:hidden fixed top-20 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-40">
          <div className="flex overflow-x-auto p-2 gap-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "text-gray-600 bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 主内容 */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0">
          <div className="max-w-6xl mx-auto">
            
            {/* 概览页面 */}
            {activeTab === "overview" && clubData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">社团概览</h1>
                    <p className="text-sm text-gray-500 mt-1">管理您所属的社团：{clubData.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">招新状态</span>
                    <Switch checked={clubData.is_recruiting} onCheckedChange={handleToggleRecruiting} />
                  </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">社团成员</p>
                          <p className="text-3xl font-bold text-blue-600">{members.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">待审核申请</p>
                          <p className="text-3xl font-bold text-yellow-600">
                            {applications.filter(a => a.status === "pending").length}
                          </p>
                        </div>
                        <Hourglass className="w-8 h-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">总申请数</p>
                          <p className="text-3xl font-bold text-purple-600">{applications.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">活动数量</p>
                          <p className="text-3xl font-bold text-green-600">{activities.length}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 最近申请 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>最近申请</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("applications")}>
                        查看全部
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loadingApps ? (
                        <div className="space-y-4">
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      ) : applications.filter(a => a.status === "pending").slice(0, 3).length === 0 ? (
                        <p className="text-center text-gray-500 py-4">暂无待审核申请</p>
                      ) : (
                        applications.filter(a => a.status === "pending").slice(0, 3).map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {app.applicantName?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{app.applicantName}</p>
                                <p className="text-sm text-gray-500">{app.studentId}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApplication(app.id, "rejected")}>
                                <XCircle className="w-4 h-4 mr-1" />
                                拒绝
                              </Button>
                              <Button size="sm" onClick={() => handleApplication(app.id, "approved")}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                通过
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 信息管理页面 */}
            {activeTab === "info" && clubData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">社团信息管理</h1>
                  <Button onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? "取消编辑" : "编辑信息"}
                  </Button>
                </div>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>社团名称</Label>
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>社团介绍</Label>
                          <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="mt-1 min-h-[120px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>活动地点</Label>
                            <Input
                              value={editForm.location || ""}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>联系邮箱</Label>
                            <Input
                              value={editForm.contact || ""}
                              onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>标签（用逗号分隔）</Label>
                          <Input
                            value={editForm.tags?.join(", ") || ""}
                            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                            className="mt-1"
                            placeholder="编程开发, 人工智能, 数学建模"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveClubInfo} className="bg-gradient-to-r from-blue-500 to-purple-600">
                            保存更改
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-start gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                            {clubData.name?.[0] || "社"}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{clubData.name}</h2>
                            <Badge className="bg-blue-100 text-blue-700 mb-4">{clubData.category}</Badge>
                            <p className="text-gray-600 leading-relaxed">{clubData.description}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">活动地点</p>
                              <p className="font-medium text-gray-900">{clubData.location || "未设置"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">成立时间</p>
                              <p className="font-medium text-gray-900">{clubData.founded || "未设置"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t">
                          <p className="text-sm text-gray-500 mb-3">标签</p>
                          <div className="flex flex-wrap gap-2">
                            {clubData.tags?.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700">
                                {tag}
                              </Badge>
                            )) || <span className="text-gray-400">暂无标签</span>}
                          </div>
                        </div>

                        <div className="pt-6 border-t flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">招新状态</p>
                            <p className="font-medium text-gray-900">
                              {clubData.is_recruiting ? "正在招新" : "已关闭招新"}
                            </p>
                          </div>
                          <Switch checked={clubData.is_recruiting} onCheckedChange={handleToggleRecruiting} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 报名审核页面 */}
            {activeTab === "applications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h1 className="text-2xl font-bold text-gray-900">报名申请审核</h1>

                {/* 筛选工具栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索姓名或学号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="筛选状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="pending">待审核</SelectItem>
                      <SelectItem value="approved">已通过</SelectItem>
                      <SelectItem value="rejected">已拒绝</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 申请列表 */}
                {loadingApps ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((app) => (
                      <Card key={app.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {app.applicantName?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{app.applicantName}</h3>
                                  <p className="text-sm text-gray-500">{app.studentId}</p>
                                </div>
                                {getStatusBadge(app.status)}
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">{app.selfIntro}</p>
                              </div>
                              <p className="text-xs text-gray-400 mt-3">申请时间：{app.applyTime}</p>
                            </div>
                            
                            {app.status === "pending" && (
                              <div className="flex lg:flex-col gap-2">
                                <Button onClick={() => handleApplication(app.id, "approved")} className="bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  通过
                                </Button>
                                <Button variant="outline" onClick={() => handleApplication(app.id, "rejected")} className="border-red-200 text-red-600 hover:bg-red-50">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  拒绝
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredApplications.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">没有找到匹配的申请记录</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 成员管理页面 */}
            {activeTab === "members" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">成员管理</h1>
                  <p className="text-gray-500">共 {members.length} 位成员</p>
                </div>

                {/* 搜索栏 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索成员姓名、专业或角色..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* 成员列表 */}
                {loadingMembers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMembers.map((member) => (
                      <Card key={member.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {member.name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                  {member.role === "社长" && (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {member.major || "未知专业"} · {member.role || "成员"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  加入时间：{new Date(member.join_date).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditRoleDialog(member)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                编辑角色
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                移除
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredMembers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {memberSearchQuery ? "没有找到匹配的成员" : "暂无成员数据"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 编辑角色对话框 */}
                <Dialog open={isMemberRoleDialogOpen} onOpenChange={setIsMemberRoleDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>编辑成员角色</DialogTitle>
                      <DialogDescription>
                        修改 {selectedMember?.name} 的角色
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label>选择角色</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="社长">社长</SelectItem>
                          <SelectItem value="副社长">副社长</SelectItem>
                          <SelectItem value="部长">部长</SelectItem>
                          <SelectItem value="副部长">副部长</SelectItem>
                          <SelectItem value="成员">成员</SelectItem>
                          <SelectItem value="干事">干事</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMemberRoleDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSaveMemberRole} className="bg-gradient-to-r from-blue-500 to-purple-600">
                        保存
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

            {/* 活动管理页面 */}
            {activeTab === "activities" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                    onClick={openCreateActivityDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    发布活动
                  </Button>
                </div>

                {/* 活动列表 */}
                {loadingActivities ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <Card key={activity.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {getActivityTypeBadge(activity.type)}
                                {getActivityStatusBadge(activity.status)}
                                <span className="text-sm text-gray-400">
                                  {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString('zh-CN') : '日期待定'}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                              <p className="text-gray-600 text-sm mb-3">{activity.content}</p>
                              <p className="text-xs text-gray-400">
                                发布时间：{new Date(activity.created_at).toLocaleString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditActivityDialog(activity)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                编辑
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDeleteActivity(activity.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                删除
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {activities.length === 0 && (
                      <div className="text-center py-12">
                        <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">暂无活动</p>
                        <Button 
                          className="bg-gradient-to-r from-blue-500 to-purple-600"
                          onClick={openCreateActivityDialog}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          发布第一个活动
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* 活动表单对话框 */}
                <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingActivity ? "编辑活动" : "发布新活动"}</DialogTitle>
                      <DialogDescription>
                        {editingActivity ? "修改活动信息" : "填写活动信息，通知社团成员"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>活动标题</Label>
                        <Input
                          value={activityForm.title}
                          onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                          placeholder="请输入活动标题"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>活动类型</Label>
                          <Select
                            value={activityForm.type}
                            onValueChange={(value) => setActivityForm({ ...activityForm, type: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="activity">活动</SelectItem>
                              <SelectItem value="notice">通知</SelectItem>
                              <SelectItem value="urgent">紧急</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>活动状态</Label>
                          <Select
                            value={activityForm.status}
                            onValueChange={(value) => setActivityForm({ ...activityForm, status: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">即将开始</SelectItem>
                              <SelectItem value="ongoing">进行中</SelectItem>
                              <SelectItem value="completed">已结束</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>活动日期</Label>
                        <Input
                          type="date"
                          value={activityForm.activity_date}
                          onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>活动内容</Label>
                        <Textarea
                          value={activityForm.content}
                          onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                          placeholder="请输入活动内容..."
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleSaveActivity} 
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                        disabled={activityLoading}
                      >
                        {activityLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {editingActivity ? "保存修改" : "发布活动"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default ClubAdmin;
