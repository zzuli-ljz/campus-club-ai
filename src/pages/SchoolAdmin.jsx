
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Shield,
  School,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  UserCheck,
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import Navbar from "@/components/Navbar";

const SchoolAdmin = () => {
  const navigate = useNavigate();
  const { user, role, createClubAdminAccount, getClubAdminAccounts, deleteClubAdminAccount } = useUser();
  const { clubs, isLoading: clubsLoading, toggleRecruiting, fetchClubs } = useClubs();
  const [activeTab, setActiveTab] = useState("overview");
  const [clubAdmins, setClubAdmins] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  
  // 创建社团管理员表单
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    clubId: "",
  });

  // 统计数据
  const [stats, setStats] = useState({
    totalClubs: 0,
    activeClubs: 0,
    totalApplications: 342,
    pendingApplications: 28,
    totalClubAdmins: 0,
  });

  // 权限检查
  useEffect(() => {
    if (role !== "school_admin") {
      toast.error("无权访问学校管理后台");
      navigate("/");
    }
  }, [role, navigate]);

  // 加载社团管理员账号
  useEffect(() => {
    loadClubAdmins();
  }, []);

  // 更新统计数据
  useEffect(() => {
    if (clubs.length > 0) {
      setStats(prev => ({
        ...prev,
        totalClubs: clubs.length,
        activeClubs: clubs.filter(c => c.is_recruiting).length,
      }));
    }
  }, [clubs]);

  const loadClubAdmins = async () => {
    setLoadingAdmins(true);
    const accounts = await getClubAdminAccounts();
    setClubAdmins(accounts);
    setStats(prev => ({ ...prev, totalClubAdmins: accounts.length }));
    setLoadingAdmins(false);
  };

  // 处理创建社团管理员
  const handleCreateClubAdmin = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim() || !createForm.clubId) {
      toast.error("请填写完整信息");
      return;
    }

    const selectedClub = clubs.find(c => c.id.toString() === createForm.clubId);
    if (!selectedClub) {
      toast.error("请选择所属社团");
      return;
    }

    const result = await createClubAdminAccount({
      ...createForm,
      clubId: selectedClub.id,
      clubName: selectedClub.name,
    });

    if (result.success) {
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", email: "", password: "", clubId: "" });
      await loadClubAdmins();
    }
  };

  // 删除社团管理员
  const handleDeleteClubAdmin = async (adminId) => {
    const result = await deleteClubAdminAccount(adminId);
    if (result.success) {
      await loadClubAdmins();
    }
  };

  // 切换社团状态
  const handleToggleClubStatus = async (clubId, currentStatus) => {
    const result = await toggleRecruiting(clubId, currentStatus);
    if (result.success) {
      toast.success(result.data.is_recruiting ? "社团已开启招新" : "社团已关闭招新");
    }
  };

  const sidebarItems = [
    { id: "overview", label: "平台概览", icon: LayoutDashboard },
    { id: "accounts", label: "账号管理", icon: Users },
    { id: "clubs", label: "社团管理", icon: Building2 },
  ];

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
      <Navbar title="学校管理后台" />

      {/* 主内容区域 */}
      <div className="relative pt-20 flex">
        {/* 侧边栏 */}
        <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">学校管理后台</h2>
                <p className="text-xs text-gray-500">超级管理员</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
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
                    ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white"
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
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">平台概览</h1>
                  <Badge className="bg-purple-100 text-purple-700">
                    <Shield className="w-3 h-3 mr-1" />
                    学校管理员
                  </Badge>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">入驻社团</p>
                          <p className="text-3xl font-bold text-blue-600">{stats.totalClubs}</p>
                        </div>
                        <Building2 className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">招新中社团</p>
                          <p className="text-3xl font-bold text-green-600">{stats.activeClubs}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">报名申请</p>
                          <p className="text-3xl font-bold text-orange-600">{stats.totalApplications}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">待审核</p>
                          <p className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">社团管理员</p>
                          <p className="text-3xl font-bold text-indigo-600">{stats.totalClubAdmins}</p>
                        </div>
                        <School className="w-8 h-8 text-indigo-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 快捷操作 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">快捷操作</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-700"
                        onClick={() => setActiveTab("accounts")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        创建社团管理员账号
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab("clubs")}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        管理社团状态
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">系统信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <p>固定学校管理员账号：</p>
                      <p className="font-mono bg-gray-100 px-2 py-1 rounded">school@admin.com</p>
                      <p className="text-xs text-gray-400">该账号为系统内置，不可删除</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* 账号管理页面 */}
            {activeTab === "accounts" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">账号管理</h1>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-purple-700"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建账号
                  </Button>
                </div>

                {/* 创建账号对话框 */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>创建社团管理员账号</DialogTitle>
                      <DialogDescription>为指定社团创建管理员账号</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>管理员姓名</Label>
                        <Input
                          value={createForm.name}
                          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                          placeholder="请输入姓名"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>登录邮箱</Label>
                        <Input
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                          placeholder="请输入邮箱"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>登录密码</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            placeholder="请输入密码"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>所属社团</Label>
                        <Select
                          value={createForm.clubId}
                          onValueChange={(value) => setCreateForm({ ...createForm, clubId: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="选择社团" />
                          </SelectTrigger>
                          <SelectContent>
                            {clubsLoading ? (
                              <div className="p-2 text-center text-sm text-gray-500">加载中...</div>
                            ) : (
                              clubs.map(club => (
                                <SelectItem key={club.id} value={club.id.toString()}>
                                  {club.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleCreateClubAdmin}
                        className="bg-gradient-to-r from-purple-500 to-purple-700"
                      >
                        创建账号
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 账号列表 */}
                <div className="space-y-4">
                  {loadingAdmins ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : clubAdmins.length === 0 ? (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无社团管理员账号</h3>
                        <p className="text-gray-500 mb-4">点击上方按钮创建第一个账号</p>
                      </CardContent>
                    </Card>
                  ) : (
                    clubAdmins.map((admin) => (
                      <Card key={admin.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                                {admin.name[0]}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                                <p className="text-sm text-gray-500">{admin.email}</p>
                                <Badge className="mt-1 bg-blue-100 text-blue-700">
                                  {admin.club_name}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteClubAdmin(admin.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 社团管理页面 */}
            {activeTab === "clubs" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">社团管理</h1>
                  <Button 
                    variant="outline" 
                    onClick={fetchClubs}
                    disabled={clubsLoading}
                  >
                    {clubsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "刷新数据"}
                  </Button>
                </div>

                {clubsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : clubs.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12 text-center">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无社团数据</h3>
                      <p className="text-gray-500 mb-4">系统尚未录入社团信息，请先初始化数据库</p>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-purple-700"
                        onClick={fetchClubs}
                      >
                        重新加载
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {clubs.map((club) => (
                      <Card key={club.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {club.name?.[0] || "社"}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{club.name}</h3>
                                <p className="text-sm text-gray-500">{club.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={club.is_recruiting ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                                {club.is_recruiting ? "招新中" : "已关闭"}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">招新</span>
                                <Switch 
                                  checked={club.is_recruiting}
                                  onCheckedChange={() => handleToggleClubStatus(club.id, club.is_recruiting)}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default SchoolAdmin;

