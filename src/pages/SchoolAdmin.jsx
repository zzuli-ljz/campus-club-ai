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
  Loader2,
  Edit3,
  Save,
  Search,
  MapPin,
  Calendar,
  Tag,
  X,
  Tags,
  GraduationCap,
  User,
  Lock,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useCategoryTags } from "@/hooks/useCategoryTags";
import TagSelector from "@/components/TagSelector";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

const SchoolAdmin = () => {
  const navigate = useNavigate();
  const { user, role, createClubAdminAccount, getClubAdminAccounts, deleteClubAdminAccount } = useUser();
  const { clubs, isLoading: clubsLoading, toggleRecruiting, fetchClubs, createClub, updateClub, deleteClub } = useClubs();
  const { tagsByCategory, addCustomTag, deleteTag, getTagsForCategory, isLoading: tagsLoading, fetchCategoryTags } = useCategoryTags();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [clubAdmins, setClubAdmins] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateClubDialogOpen, setIsCreateClubDialogOpen] = useState(false);
  const [isEditClubDialogOpen, setIsEditClubDialogOpen] = useState(false);
  const [isDeleteClubDialogOpen, setIsDeleteClubDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchClubQuery, setSearchClubQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // 账号管理相关状态
  const [accountTypeFilter, setAccountTypeFilter] = useState("all"); // all, club_admin, student
  const [searchAccountQuery, setSearchAccountQuery] = useState("");
  const [isViewAccountDialogOpen, setIsViewAccountDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  
  // 创建社团管理员表单
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    clubId: "",
  });

  // 编辑账号表单
  const [editAccountForm, setEditAccountForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // 创建/编辑社团表单
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    founded: "",
    president: "",
    contact: "",
    selectedTags: [],
    image: "",
    is_recruiting: true,
  });

  // 标签管理相关状态
  const [selectedCategoryForTag, setSelectedCategoryForTag] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  // 分类选项
  const categories = [
    "学术科技",
    "文艺创作",
    "体育运动",
    "公益实践",
    "技术工程"
  ];

  // 统计数据
  const [stats, setStats] = useState({
    totalClubs: 0,
    activeClubs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalClubAdmins: 0,
    totalStudents: 0,
    totalTags: 0,
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
    loadStudentAccounts();
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

  // 更新标签统计
  useEffect(() => {
    const totalTags = Object.values(tagsByCategory).reduce((sum, tags) => sum + tags.length, 0);
    setStats(prev => ({ ...prev, totalTags }));
  }, [tagsByCategory]);

  // 加载申请统计数据
  useEffect(() => {
    loadApplicationStats();
  }, []);

  // 获取申请统计数据
  const loadApplicationStats = async () => {
    setLoadingStats(true);
    try {
      // 获取总申请数
      const { count: totalCount, error: totalError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // 获取待审核申请数
      const { count: pendingCount, error: pendingError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      setStats(prev => ({
        ...prev,
        totalApplications: totalCount || 0,
        pendingApplications: pendingCount || 0,
      }));
    } catch (err) {
      console.error('加载申请统计数据失败:', err);
      toast.error('加载统计数据失败');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadClubAdmins = async () => {
    setLoadingAdmins(true);
    const accounts = await getClubAdminAccounts();
    setClubAdmins(accounts);
    setStats(prev => ({ ...prev, totalClubAdmins: accounts.length }));
    setLoadingAdmins(false);
  };

  // 加载学生账号 - 修复版本
  const loadStudentAccounts = async () => {
    setLoadingStudents(true);
    try {
      console.log('开始加载学生账号...');
      
      // 先尝试获取所有 profiles 数据，不设置角色过滤
      const { data: allData, error: allError } = await supabase
        .from('profiles')
        .select('id, name, email, student_id, role, created_at')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('查询 profiles 表失败:', allError);
        toast.error('数据库查询失败: ' + allError.message);
        setLoadingStudents(false);
        return;
      }

      console.log('获取到所有 profiles 数据:', allData?.length || 0, '条记录');
      console.log('数据详情:', allData);

      // 过滤出学生账号（role 为 student 或 role 为空）
      const studentData = (allData || []).filter(profile => 
        profile.role === 'student' || !profile.role
      );

      console.log('过滤后的学生账号:', studentData.length, '条记录');
      
      setStudentAccounts(studentData);
      setStats(prev => ({ ...prev, totalStudents: studentData.length }));
      
      if (studentData.length === 0 && allData?.length > 0) {
        toast.info(`查询成功，但未找到学生账号。共有 ${allData.length} 个用户，角色分布: ${JSON.stringify(
          allData.reduce((acc, p) => {
            acc[p.role || 'null'] = (acc[p.role || 'null'] || 0) + 1;
            return acc;
          }, {})
        )}`);
      }
    } catch (err) {
      console.error('加载学生账号失败:', err);
      toast.error('加载学生账号失败: ' + (err.message || '未知错误'));
    } finally {
      setLoadingStudents(false);
    }
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

  // 删除学生账号
  const handleDeleteStudent = async (studentId) => {
    try {
      // 删除用户资料
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast.success("学生账号已删除");
      await loadStudentAccounts();
    } catch (err) {
      toast.error("删除失败: " + err.message);
    }
  };

  // 打开查看账号详情对话框
  const openViewAccountDialog = (account, type) => {
    setSelectedAccount({ ...account, type });
    setShowAccountPassword(false);
    setIsViewAccountDialogOpen(true);
  };

  // 打开编辑账号对话框
  const openEditAccountDialog = (account, type) => {
    setSelectedAccount({ ...account, type });
    setEditAccountForm({
      name: account.name || "",
      email: account.email || "",
      password: type === 'club_admin' ? account.password_hash || "" : "",
      role: account.role || "student",
    });
    setShowAccountPassword(false);
    setIsEditAccountDialogOpen(true);
  };

  // 保存账号修改
  const handleSaveAccountEdit = async () => {
    if (!selectedAccount) return;

    try {
      if (selectedAccount.type === 'club_admin') {
        // 更新社团管理员账号
        const { error } = await supabase
          .from('club_admin_accounts')
          .update({
            name: editAccountForm.name,
            email: editAccountForm.email,
            password_hash: editAccountForm.password,
          })
          .eq('id', selectedAccount.id);

        if (error) throw error;
        toast.success("社团管理员账号已更新");
        await loadClubAdmins();
      } else {
        // 更新学生账号资料
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: editAccountForm.name,
            email: editAccountForm.email,
          })
          .eq('id', selectedAccount.id);

        if (profileError) throw profileError;
        
        toast.success("学生账号资料已更新");
        await loadStudentAccounts();
      }

      setIsEditAccountDialogOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      toast.error("保存失败: " + err.message);
    }
  };

  // 切换社团状态
  const handleToggleClubStatus = async (clubId, currentStatus) => {
    const result = await toggleRecruiting(clubId, currentStatus);
    if (result.success) {
      toast.success(result.data.is_recruiting ? "社团已开启招新" : "社团已关闭招新");
    }
  };

  // 打开创建社团对话框
  const openCreateClubDialog = () => {
    setClubForm({
      name: "",
      category: "",
      description: "",
      location: "",
      founded: "",
      president: "",
      contact: "",
      selectedTags: [],
      image: "",
      is_recruiting: true,
    });
    setIsCreateClubDialogOpen(true);
  };

  // 打开编辑社团对话框
  const openEditClubDialog = (club) => {
    setSelectedClub(club);
    setClubForm({
      name: club.name || "",
      category: club.category || "",
      description: club.description || "",
      location: club.location || "",
      founded: club.founded || "",
      president: club.president || "",
      contact: club.contact || "",
      selectedTags: club.tags || [],
      image: club.image || "",
      is_recruiting: club.is_recruiting !== false,
    });
    setIsEditClubDialogOpen(true);
  };

  // 打开删除社团对话框
  const openDeleteClubDialog = (club) => {
    setSelectedClub(club);
    setIsDeleteClubDialogOpen(true);
  };

  // 处理创建社团
  const handleCreateClub = async () => {
    if (!clubForm.name.trim() || !clubForm.category) {
      toast.error("请填写社团名称和分类");
      return;
    }

    const result = await createClub({
      name: clubForm.name,
      category: clubForm.category,
      description: clubForm.description,
      location: clubForm.location,
      founded: clubForm.founded,
      president: clubForm.president,
      contact: clubForm.contact,
      tags: clubForm.selectedTags,
      image: clubForm.image || `https://nocode.meituan.com/photo/search?keyword=club,activity&width=400&height=300`,
      is_recruiting: clubForm.is_recruiting,
    });

    if (result.success) {
      setIsCreateClubDialogOpen(false);
    }
  };

  // 处理编辑社团
  const handleEditClub = async () => {
    if (!selectedClub) return;
    
    const result = await updateClub(selectedClub.id, {
      name: clubForm.name,
      category: clubForm.category,
      description: clubForm.description,
      location: clubForm.location,
      founded: clubForm.founded,
      president: clubForm.president,
      contact: clubForm.contact,
      tags: clubForm.selectedTags,
      image: clubForm.image,
      is_recruiting: clubForm.is_recruiting,
    });

    if (result.success) {
      setIsEditClubDialogOpen(false);
      setSelectedClub(null);
    }
  };

  // 处理删除社团
  const handleDeleteClub = async () => {
    if (!selectedClub) return;
    
    const result = await deleteClub(selectedClub.id);
    if (result.success) {
      setIsDeleteClubDialogOpen(false);
      setSelectedClub(null);
    }
  };

  // 处理添加新标签
  const handleAddTag = async () => {
    if (!selectedCategoryForTag || !newTagName.trim()) {
      toast.error("请选择分类并输入标签名称");
      return;
    }

    setIsAddingTag(true);
    const result = await addCustomTag(selectedCategoryForTag, newTagName.trim());
    setIsAddingTag(false);
    
    if (result.success) {
      setNewTagName("");
    }
  };

  // 处理删除标签
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    setIsDeletingTag(true);
    const result = await deleteTag(tagToDelete.category, tagToDelete.tag);
    setIsDeletingTag(false);
    
    if (result.success) {
      setTagToDelete(null);
    }
  };

  // 打开删除标签确认对话框
  const openDeleteTagDialog = (category, tag) => {
    setTagToDelete({ category, tag });
  };

  // 过滤社团列表
  const filteredClubs = clubs.filter(club => {
    const query = searchClubQuery.toLowerCase();
    return (
      club.name?.toLowerCase().includes(query) ||
      club.category?.toLowerCase().includes(query) ||
      club.description?.toLowerCase().includes(query)
    );
  });

  // 过滤账号列表
  const getFilteredAccounts = () => {
    let accounts = [];
    
    if (accountTypeFilter === 'all' || accountTypeFilter === 'club_admin') {
      accounts = [...accounts, ...clubAdmins.map(a => ({ ...a, accountType: 'club_admin' }))];
    }
    
    if (accountTypeFilter === 'all' || accountTypeFilter === 'student') {
      accounts = [...accounts, ...studentAccounts.map(a => ({ ...a, accountType: 'student' }))];
    }
    
    if (searchAccountQuery) {
      const query = searchAccountQuery.toLowerCase();
      accounts = accounts.filter(a => 
        a.name?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query) ||
        (a.student_id && a.student_id.toLowerCase().includes(query))
      );
    }
    
    return accounts;
  };

  const sidebarItems = [
    { id: "overview", label: "平台概览", icon: LayoutDashboard },
    { id: "accounts", label: "账号管理", icon: Users },
    { id: "clubs", label: "社团管理", icon: Building2 },
    { id: "tags", label: "标签管理", icon: Tags },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-x-hidden">
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
      <div className="relative pt-20 flex w-full">
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
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0 w-full min-w-0">
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        loadApplicationStats();
                        loadStudentAccounts();
                        loadClubAdmins();
                      }}
                      disabled={loadingStats || loadingStudents}
                    >
                      {loadingStats || loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : "刷新数据"}
                    </Button>
                    <Badge className="bg-purple-100 text-purple-700">
                      <Shield className="w-3 h-3 mr-1" />
                      学校管理员
                    </Badge>
                  </div>
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
                          <p className="text-3xl font-bold text-orange-600">
                            {loadingStats ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalApplications}
                          </p>
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
                          <p className="text-3xl font-bold text-yellow-600">
                            {loadingStats ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.pendingApplications}
                          </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">学生用户</p>
                          <p className="text-3xl font-bold text-indigo-600">
                            {loadingStudents ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalStudents}
                          </p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-indigo-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">标签总数</p>
                          <p className="text-3xl font-bold text-purple-600">{stats.totalTags}</p>
                        </div>
                        <Tags className="w-8 h-8 text-purple-200" />
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
                        管理用户账号
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab("clubs")}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        管理社团
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab("tags")}
                      >
                        <Tags className="w-4 h-4 mr-2" />
                        管理标签
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
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">账号管理</h1>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-purple-700"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建社团管理员
                  </Button>
                </div>

                {/* 筛选和搜索栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="账号类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部账号</SelectItem>
                      <SelectItem value="student">学生账号</SelectItem>
                      <SelectItem value="club_admin">社团管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索姓名、邮箱或学号..."
                      value={searchAccountQuery}
                      onChange={(e) => setSearchAccountQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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

                {/* 查看账号详情对话框 */}
                <Dialog open={isViewAccountDialogOpen} onOpenChange={setIsViewAccountDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        账号详情
                      </DialogTitle>
                    </DialogHeader>
                    {selectedAccount && (
                      <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold ${
                            selectedAccount.type === 'club_admin' 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
                              : 'bg-gradient-to-br from-green-500 to-green-700'
                          }`}>
                            {selectedAccount.name?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{selectedAccount.name}</h3>
                            <Badge className={selectedAccount.type === 'club_admin' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                              {selectedAccount.type === 'club_admin' ? "社团管理员" : "学生"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <Label className="text-xs text-gray-500">邮箱</Label>
                            <p className="font-medium">{selectedAccount.email}</p>
                          </div>
                          
                          {selectedAccount.student_id && (
                            <div>
                              <Label className="text-xs text-gray-500">学号</Label>
                              <p className="font-medium">{selectedAccount.student_id}</p>
                            </div>
                          )}
                          
                          {selectedAccount.club_name && (
                            <div>
                              <Label className="text-xs text-gray-500">所属社团</Label>
                              <p className="font-medium">{selectedAccount.club_name}</p>
                            </div>
                          )}
                          
                          <div>
                            <Label className="text-xs text-gray-500">密码</Label>
                            <div className="flex items-center gap-2">
                              <p className="font-medium font-mono">
                                {showAccountPassword 
                                  ? (selectedAccount.password_hash || "******") 
                                  : "******"
                                }
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAccountPassword(!showAccountPassword)}
                              >
                                {showAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-500">创建时间</Label>
                            <p className="font-medium">
                              {new Date(selectedAccount.created_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsViewAccountDialogOpen(false)}>
                        关闭
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsViewAccountDialogOpen(false);
                          openEditAccountDialog(selectedAccount, selectedAccount.type);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-purple-700"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        编辑账号
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 编辑账号对话框 */}
                <Dialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>编辑账号</DialogTitle>
                      <DialogDescription>修改账号信息</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>姓名</Label>
                        <Input
                          value={editAccountForm.name}
                          onChange={(e) => setEditAccountForm({ ...editAccountForm, name: e.target.value })}
                          placeholder="请输入姓名"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>邮箱</Label>
                        <Input
                          type="email"
                          value={editAccountForm.email}
                          onChange={(e) => setEditAccountForm({ ...editAccountForm, email: e.target.value })}
                          placeholder="请输入邮箱"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>密码</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showAccountPassword ? "text" : "password"}
                            value={editAccountForm.password}
                            onChange={(e) => setEditAccountForm({ ...editAccountForm, password: e.target.value })}
                            placeholder="请输入新密码"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccountPassword(!showAccountPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedAccount?.type === 'student' ? "学生密码修改功能暂不可用" : "留空表示不修改密码"}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditAccountDialogOpen(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleSaveAccountEdit}
                        className="bg-gradient-to-r from-purple-500 to-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存修改
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 账号列表 */}
                <div className="space-y-4">
                  {(loadingAdmins || loadingStudents) ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : getFilteredAccounts().length === 0 ? (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无账号</h3>
                        <p className="text-gray-500 mb-4">
                          {searchAccountQuery ? "没有找到匹配的账号" : "点击上方按钮创建第一个账号"}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={loadStudentAccounts}
                        >
                          刷新学生数据
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    getFilteredAccounts().map((account) => (
                      <Card key={`${account.type}-${account.id}`} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center gap-4 cursor-pointer flex-1"
                              onClick={() => openViewAccountDialog(account, account.accountType)}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                account.accountType === 'club_admin' 
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
                                  : 'bg-gradient-to-br from-green-500 to-green-700'
                              }`}>
                                {account.name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                                  <Badge className={account.accountType === 'club_admin' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                                    {account.accountType === 'club_admin' ? "社团管理员" : "学生"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">{account.email}</p>
                                {account.club_name && (
                                  <Badge className="mt-1 bg-gray-100 text-gray-700">
                                    {account.club_name}
                                  </Badge>
                                )}
                                {account.student_id && (
                                  <p className="text-xs text-gray-400 mt-1">学号: {account.student_id}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewAccountDialog(account, account.accountType)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                查看
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditAccountDialog(account, account.accountType)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  if (account.accountType === 'club_admin') {
                                    handleDeleteClubAdmin(account.id);
                                  } else {
                                    handleDeleteStudent(account.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                删除
                              </Button>
                            </div>
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
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">社团管理</h1>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={fetchClubs}
                      disabled={clubsLoading}
                    >
                      {clubsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "刷新数据"}
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-purple-700"
                      onClick={openCreateClubDialog}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新建社团
                    </Button>
                  </div>
                </div>

                {/* 搜索栏 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索社团名称、分类或描述..."
                    value={searchClubQuery}
                    onChange={(e) => setSearchClubQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* 社团列表 */}
                {clubsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : filteredClubs.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12 text-center">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchClubQuery ? "未找到匹配的社团" : "暂无社团数据"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchClubQuery ? "尝试调整搜索关键词" : "点击上方按钮创建第一个社团"}
                      </p>
                      {!searchClubQuery && (
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-purple-700"
                          onClick={openCreateClubDialog}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          新建社团
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredClubs.map((club) => (
                      <Card key={club.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                {club.name?.[0] || "社"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900 text-lg">{club.name}</h3>
                                  <Badge className={club.is_recruiting ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                                    {club.is_recruiting ? "招新中" : "已关闭"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">{club.category}</p>
                                <p className="text-sm text-gray-600 truncate">{club.description || "暂无描述"}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {club.location || "未设置"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    成立于 {club.founded || "未设置"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {club.members || 0} 人
                                  </span>
                                </div>
                                {club.tags && club.tags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                                    <Tag className="w-3 h-3 text-gray-400" />
                                    {club.tags.map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">招新</span>
                                <Switch 
                                  checked={club.is_recruiting}
                                  onCheckedChange={() => handleToggleClubStatus(club.id, club.is_recruiting)}
                                />
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditClubDialog(club)}
                                >
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  编辑
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openDeleteClubDialog(club)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  删除
                                </Button>
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

            {/* 标签管理页面 */}
            {activeTab === "tags" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
                  <Button 
                    variant="outline" 
                    onClick={fetchCategoryTags}
                    disabled={tagsLoading}
                  >
                    {tagsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "刷新数据"}
                  </Button>
                </div>

                {/* 添加新标签 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      添加新标签
                    </CardTitle>
                    <CardDescription>
                      选择分类并输入标签名称，标签将显示在学生端的兴趣选择页面
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select
                        value={selectedCategoryForTag}
                        onValueChange={setSelectedCategoryForTag}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 flex-1">
                        <Input
                          placeholder="输入标签名称"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAddTag}
                          disabled={isAddingTag || !selectedCategoryForTag || !newTagName.trim()}
                          className="bg-gradient-to-r from-purple-500 to-purple-700 whitespace-nowrap"
                        >
                          {isAddingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 标签列表 */}
                <div className="space-y-6">
                  {tagsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : categories.map((category) => {
                    const categoryTags = tagsByCategory[category] || [];
                    return (
                      <Card key={category} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{category}</CardTitle>
                              <CardDescription>
                                共 {categoryTags.length} 个标签
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {categoryTags.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">暂无标签</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {categoryTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-700 px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                  {tag}
                                  <button
                                    onClick={() => openDeleteTagDialog(category, tag)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="删除标签"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>
        </main>
      </div>

      {/* 创建社团对话框 */}
      <Dialog open={isCreateClubDialogOpen} onOpenChange={setIsCreateClubDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新社团</DialogTitle>
            <DialogDescription>填写社团基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>社团名称 *</Label>
                <Input
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  placeholder="请输入社团名称"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>分类 *</Label>
                <Select
                  value={clubForm.category}
                  onValueChange={(value) => setClubForm({ ...clubForm, category: value, selectedTags: [] })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>社团介绍</Label>
              <Textarea
                value={clubForm.description}
                onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                placeholder="请输入社团介绍..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>活动地点</Label>
                <Input
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  placeholder="例如：科技楼 301"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>成立时间</Label>
                <Input
                  value={clubForm.founded}
                  onChange={(e) => setClubForm({ ...clubForm, founded: e.target.value })}
                  placeholder="例如：2020年"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>社长姓名</Label>
                <Input
                  value={clubForm.president}
                  onChange={(e) => setClubForm({ ...clubForm, president: e.target.value })}
                  placeholder="请输入社长姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>联系邮箱</Label>
                <Input
                  type="email"
                  value={clubForm.contact}
                  onChange={(e) => setClubForm({ ...clubForm, contact: e.target.value })}
                  placeholder="请输入联系邮箱"
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 新的标签选择器 */}
            <div>
              <Label>标签</Label>
              <div className="mt-1">
                {clubForm.category ? (
                  <TagSelector
                    category={clubForm.category}
                    availableTags={getTagsForCategory(clubForm.category)}
                    selectedTags={clubForm.selectedTags}
                    onTagsChange={(newTags) => setClubForm({ ...clubForm, selectedTags: newTags })}
                    onAddCustomTag={addCustomTag}
                    maxTags={10}
                  />
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                    请先选择分类，然后选择标签
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label>封面图片 URL</Label>
              <Input
                value={clubForm.image}
                onChange={(e) => setClubForm({ ...clubForm, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">留空将使用默认图片</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={clubForm.is_recruiting}
                onCheckedChange={(checked) => setClubForm({ ...clubForm, is_recruiting: checked })}
              />
              <Label>开启招新</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateClubDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleCreateClub}
              className="bg-gradient-to-r from-purple-500 to-purple-700"
              disabled={!clubForm.category}
            >
              创建社团
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑社团对话框 */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑社团信息</DialogTitle>
            <DialogDescription>修改 {selectedClub?.name} 的信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>社团名称 *</Label>
                <Input
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  placeholder="请输入社团名称"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>分类 *</Label>
                <Select
                  value={clubForm.category}
                  onValueChange={(value) => setClubForm({ ...clubForm, category: value, selectedTags: [] })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>社团介绍</Label>
              <Textarea
                value={clubForm.description}
                onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                placeholder="请输入社团介绍..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>活动地点</Label>
                <Input
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  placeholder="例如：科技楼 301"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>成立时间</Label>
                <Input
                  value={clubForm.founded}
                  onChange={(e) => setClubForm({ ...clubForm, founded: e.target.value })}
                  placeholder="例如：2020年"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>社长姓名</Label>
                <Input
                  value={clubForm.president}
                  onChange={(e) => setClubForm({ ...clubForm, president: e.target.value })}
                  placeholder="请输入社长姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>联系邮箱</Label>
                <Input
                  type="email"
                  value={clubForm.contact}
                  onChange={(e) => setClubForm({ ...clubForm, contact: e.target.value })}
                  placeholder="请输入联系邮箱"
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 编辑时的标签选择器 */}
            <div>
              <Label>标签</Label>
              <div className="mt-1">
                {clubForm.category ? (
                  <TagSelector
                    category={clubForm.category}
                    availableTags={getTagsForCategory(clubForm.category)}
                    selectedTags={clubForm.selectedTags}
                    onTagsChange={(newTags) => setClubForm({ ...clubForm, selectedTags: newTags })}
                    onAddCustomTag={addCustomTag}
                    maxTags={10}
                  />
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                    请先选择分类，然后选择标签
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label>封面图片 URL</Label>
              <Input
                value={clubForm.image}
                onChange={(e) => setClubForm({ ...clubForm, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={clubForm.is_recruiting}
                onCheckedChange={(checked) => setClubForm({ ...clubForm, is_recruiting: checked })}
              />
              <Label>开启招新</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClubDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleEditClub}
              className="bg-gradient-to-r from-purple-500 to-purple-700"
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除社团确认对话框 */}
      <Dialog open={isDeleteClubDialogOpen} onOpenChange={setIsDeleteClubDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除社团
            </DialogTitle>
            <DialogDescription>
              您确定要删除 <span className="font-semibold text-gray-900">{selectedClub?.name}</span> 吗？
              <br /><br />
              <span className="text-red-600">注意：</span>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>如果社团还有成员，将无法删除</li>
                <li>如果社团有关联的管理员账号，将无法删除</li>
                <li>删除后数据无法恢复</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteClubDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteClub}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除标签确认对话框 */}
      <Dialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除标签
            </DialogTitle>
            <DialogDescription>
              您确定要删除标签 <span className="font-semibold text-gray-900">「{tagToDelete?.tag}」</span> 吗？
              <br /><br />
              <span className="text-amber-600">⚠️ 注意：</span>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>该标签将从「{tagToDelete?.category}」分类中删除</li>
                <li>所有使用该标签的社团将自动取消显示该标签</li>
                <li>删除后无法恢复</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagToDelete(null)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={isDeletingTag}
            >
              {isDeletingTag ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolAdmin;
