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
  Key,
  BarChart3,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Send,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useClubs } from "@/hooks/useClubs";
import { useCategoryTags } from "@/hooks/useCategoryTags";
import TagSelector from "@/components/TagSelector";
import { supabase } from "@/integrations/supabase/client";
import { useClubApplications } from "@/hooks/useClubApplications";
import Navbar from "@/components/Navbar";
import {
  ClubCategoryPieChart,
  ClubMembersBarChart,
  UserInterestRadarChart,
  HotTagsChart,
  ApplicationTrendChart,
  ApplicationFunnelChart,
  ClubStatsDashboard,
  ClubApprovalRatePieChart,
  ClubApplicationDistribution,
} from "@/components/Charts";

const SchoolAdmin = () => {
  const navigate = useNavigate();
  const { user, role, createClubAdminAccount, getClubAdminAccounts, deleteClubAdminAccount } = useUser();
  const { language, t } = useLanguage();
  const { clubs, isLoading: clubsLoading, toggleRecruiting, fetchClubs, createClub, updateClub, deleteClub } = useClubs();
  const { tagsByCategory, addCustomTag, deleteTag, getTagsForCategory, isLoading: tagsLoading, fetchCategoryTags } = useCategoryTags();
  const {
    getAllApplications,
    approveApplication,
    rejectApplication,
    deleteApplication,
    isLoading: applicationLoading
  } = useClubApplications();
  
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
  
  // 数据分析相关状态
  const [applications, setApplications] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // 账号管理相关状态
  const [accountTypeFilter, setAccountTypeFilter] = useState("all"); // all, club_admin, student
  const [searchAccountQuery, setSearchAccountQuery] = useState("");
  const [isViewAccountDialogOpen, setIsViewAccountDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  // 社团申请管理相关状态
  const [clubApplications, setClubApplications] = useState([]);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [applicationSearchQuery, setApplicationSearchQuery] = useState("");
  const [applicationCategoryFilter, setApplicationCategoryFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewApplicationDialogOpen, setIsViewApplicationDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingApplications, setLoadingApplications] = useState(false);
  
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
      toast.error(language === "zh" ? "无权访问学校管理后台" : "Access denied to school admin panel");
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

  // 加载数据分析数据
  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalyticsData();
    }
  }, [activeTab]);

  // 加载社团申请数据
  useEffect(() => {
    if (activeTab === "applications") {
      loadClubApplications();
    }
  }, [activeTab, applicationStatusFilter, applicationCategoryFilter, applicationSearchQuery]);

  // 获取申请统计数据（学生加入社团的申请）
  const loadApplicationStats = async () => {
    setLoadingStats(true);
    try {
      // 获取总申请数（学生加入社团的申请）
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
      console.error(language === "zh" ? '加载申请统计数据失败:' : 'Failed to load application statistics:', err);
      toast.error(language === "zh" ? '加载统计数据失败' : 'Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  // 加载数据分析数据（学生加入社团的申请）
  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const { data: appsData } = await supabase.from("applications").select("*");

      if (appsData) setApplications(appsData);
    } catch (err) {
      console.error(language === "zh" ? "加载分析数据失败:" : "Failed to load analytics data:", err);
      toast.error(language === "zh" ? "加载分析数据失败" : "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
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
      console.log(language === "zh" ? '开始加载学生账号...' : 'Start loading student accounts...');
      
      // 先尝试获取所有 profiles 数据，不设置角色过滤
      const { data: allData, error: allError } = await supabase
        .from('profiles')
        .select('id, name, email, student_id, role, created_at')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error(language === "zh" ? '查询 profiles 表失败:' : 'Failed to query profiles table:', allError);
        toast.error((language === "zh" ? '数据库查询失败: ' : 'Database query failed: ') + allError.message);
        setLoadingStudents(false);
        return;
      }

      console.log(language === "zh" ? `获取到所有 profiles 数据: ${allData?.length || 0} 条记录` : `Fetched all profiles data: ${allData?.length || 0} records`);
      console.log(language === "zh" ? '数据详情:' : 'Data details:', allData);

      // 过滤出学生账号（role 为 student 或 role 为空）
      const studentData = (allData || []).filter(profile => 
        profile.role === 'student' || !profile.role
      );

      console.log(language === "zh" ? `过滤后的学生账号: ${studentData.length} 条记录` : `Filtered student accounts: ${studentData.length} records`);
      
      setStudentAccounts(studentData);
      setStats(prev => ({ ...prev, totalStudents: studentData.length }));
      
      if (studentData.length === 0 && allData?.length > 0) {
        toast.info(language === "zh" 
          ? `查询成功，但未找到学生账号。共有 ${allData.length} 个用户，角色分布: ${JSON.stringify(
            allData.reduce((acc, p) => {
              acc[p.role || 'null'] = (acc[p.role || 'null'] || 0) + 1;
              return acc;
            }, {})
          )}`
          : `Query successful, but no student accounts found. Total ${allData.length} users, role distribution: ${JSON.stringify(
            allData.reduce((acc, p) => {
              acc[p.role || 'null'] = (acc[p.role || 'null'] || 0) + 1;
              return acc;
            }, {})
          )}`);
      }
    } catch (err) {
      console.error(language === "zh" ? '加载学生账号失败:' : 'Failed to load student accounts:', err);
      toast.error((language === "zh" ? '加载学生账号失败: ' : 'Failed to load student accounts: ') + (err.message || (language === "zh" ? '未知错误' : 'Unknown error')));
    } finally {
      setLoadingStudents(false);
    }
  };

  // 加载社团申请
  const loadClubApplications = async () => {
    setLoadingApplications(true);
    try {
      console.log('正在加载社团申请...', {
        status: applicationStatusFilter,
        search: applicationSearchQuery,
        category: applicationCategoryFilter,
      });
      
      const result = await getAllApplications({
        status: applicationStatusFilter,
        search: applicationSearchQuery,
        category: applicationCategoryFilter,
      });

      console.log('加载社团申请结果:', result);

      if (result.success) {
        setClubApplications(result.data || []);
        console.log(`成功加载 ${result.data?.length || 0} 条申请记录`);
      } else {
        console.error('加载社团申请失败:', result.error);
        toast.error(language === "zh" ? `加载失败: ${result.error}` : `Failed to load: ${result.error}`);
      }
    } catch (err) {
      console.error(language === "zh" ? '加载社团申请失败:' : 'Failed to load club applications:', err);
      toast.error(language === "zh" ? '加载社团申请失败' : 'Failed to load club applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  // 处理批准社团申请
  const handleApproveApplication = async (applicationId) => {
    const result = await approveApplication(applicationId, user?.id);

    if (result.success) {
      toast.success(language === "zh" ? "社团申请已批准！" : "Club application approved!");

      // 显示账号信息（临时密码）
      toast.success(
        `${language === "zh" ? "管理员账号已创建！" : "Admin account created!"}\n` +
        `${language === "zh" ? "邮箱：" : "Email: "}${result.applicantEmail}\n` +
        `${language === "zh" ? "临时密码：" : "Temp Password: "}${result.tempPassword}`,
        { duration: 10000 }
      );

      // 发送邮件通知（模拟）
      console.log(`${language === "zh" ? "审核结果邮件已发送至" : "Review result email sent to"}: ${result.applicantEmail}`);
      console.log(`${language === "zh" ? "邮件内容" : "Email content"}:`);
      console.log(`
        ${language === "zh" ? "尊敬的用户，您的社团申请已通过审核！" : "Dear user, your club application has been approved!"}
        ${language === "zh" ? "社团名称：" : "Club Name: "}${result.clubName}
        ${language === "zh" ? "管理员账号：" : "Admin Account: "}${result.applicantEmail}
        ${language === "zh" ? "临时密码：" : "Temp Password: "}${result.tempPassword}
        ${language === "zh" ? "请及时登录并修改密码。" : "Please login and change your password promptly."}
      `);

      setIsViewApplicationDialogOpen(false);
      setSelectedApplication(null);
      await loadClubApplications();
    }
  };

  // 处理拒绝社团申请
  const handleRejectApplication = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast.error(language === "zh" ? "请填写拒绝理由" : "Please provide rejection reason");
      return;
    }

    const result = await rejectApplication(selectedApplication.id, rejectionReason, user?.id);

    if (result.success) {
      toast.success(language === "zh" ? "社团申请已拒绝" : "Club application rejected");

      // 发送邮件通知（模拟）
      console.log(`${language === "zh" ? "拒绝原因邮件已发送至" : "Rejection email sent to"}: ${selectedApplication.applicant_email}`);
      console.log(`${language === "zh" ? "拒绝原因" : "Rejection reason"}: ${rejectionReason}`);

      setIsRejectDialogOpen(false);
      setIsViewApplicationDialogOpen(false);
      setSelectedApplication(null);
      setRejectionReason("");
      await loadClubApplications();
    }
  };

  // 处理删除社团申请
  const handleDeleteApplication = async (applicationId) => {
    if (!confirm(language === "zh" ? "确定要删除这条申请记录吗？" : "Are you sure you want to delete this application?")) {
      return;
    }

    const result = await deleteApplication(applicationId);
    if (result.success) {
      toast.success(language === "zh" ? "申请记录已删除" : "Application deleted");
      await loadClubApplications();
    }
  };

  // 过滤社团申请列表
  const getFilteredClubApplications = () => {
    let filtered = [...clubApplications];

    if (applicationStatusFilter !== "all") {
      filtered = filtered.filter(app => app.status === applicationStatusFilter);
    }

    if (applicationCategoryFilter !== "all") {
      filtered = filtered.filter(app => app.club_category === applicationCategoryFilter);
    }

    if (applicationSearchQuery) {
      const query = applicationSearchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.club_name?.toLowerCase().includes(query) ||
        app.applicant_name?.toLowerCase().includes(query) ||
        app.applicant_email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // 处理创建社团管理员
  const handleCreateClubAdmin = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim() || !createForm.clubId) {
      toast.error(language === "zh" ? "请填写完整信息" : "Please fill in all required information");
      return;
    }

    const selectedClub = clubs.find(c => c.id.toString() === createForm.clubId);
    if (!selectedClub) {
      toast.error(language === "zh" ? "请选择所属社团" : "Please select a club");
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

      toast.success(language === "zh" ? "学生账号已删除" : "Student account deleted");
      await loadStudentAccounts();
    } catch (err) {
      toast.error((language === "zh" ? "删除失败: " : "Delete failed: ") + err.message);
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
        toast.success(language === "zh" ? "社团管理员账号已更新" : "Club admin account updated");
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
        
        toast.success(language === "zh" ? "学生账号资料已更新" : "Student account info updated");
        await loadStudentAccounts();
      }

      setIsEditAccountDialogOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      toast.error((language === "zh" ? "保存失败: " : "Save failed: ") + err.message);
    }
  };

  // 切换社团状态
  const handleToggleClubStatus = async (clubId, currentStatus) => {
    const result = await toggleRecruiting(clubId, currentStatus);
    if (result.success) {
      toast.success(result.data.is_recruiting 
        ? (language === "zh" ? "社团已开启招新" : "Club recruitment enabled")
        : (language === "zh" ? "社团已关闭招新" : "Club recruitment disabled"));
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
      toast.error(language === "zh" ? "请填写社团名称和分类" : "Please fill in club name and category");
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
      image: clubForm.image || null,
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
      toast.error(language === "zh" ? "请选择分类并输入标签名称" : "Please select category and enter tag name");
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
    { id: "overview", label: language === "zh" ? "平台概览" : "Overview", icon: LayoutDashboard },
    { id: "accounts", label: language === "zh" ? "账号管理" : "Accounts", icon: Users },
    { id: "clubs", label: language === "zh" ? "社团管理" : "Clubs", icon: Building2 },
    { id: "applications", label: language === "zh" ? "社团申请" : "Applications", icon: FileCheck },
    { id: "tags", label: language === "zh" ? "标签管理" : "Tags", icon: Tags },
    { id: "analytics", label: language === "zh" ? "数据分析" : "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50 overflow-x-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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
      <Navbar title={language === "zh" ? "学校管理后台" : "School Admin"} />

      {/* 主内容区域 */}
      <div className="relative pt-20 flex w-full">
        {/* 侧边栏 */}
        <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{language === "zh" ? "学校管理后台" : "School Admin"}</h2>
                <p className="text-xs text-gray-500">{language === "zh" ? "超级管理员" : "Super Admin"}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg"
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
                    ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white"
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
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "平台概览" : "Overview"}</h1>
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
                      {loadingStats || loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "zh" ? "刷新数据" : "Refresh")}
                    </Button>
                    <Badge className="bg-blue-100 text-blue-700">
                      <Shield className="w-3 h-3 mr-1" />
                      {language === "zh" ? "学校管理员" : "School Admin"}
                    </Badge>
                  </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "入驻社团" : "Registered Clubs"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "招新中社团" : "Recruiting Clubs"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "报名申请" : "Applications"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "待审核" : "Pending"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "学生用户" : "Students"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "标签总数" : "Total Tags"}</p>
                          <p className="text-3xl font-bold text-blue-700">{stats.totalTags}</p>
                        </div>
                        <Tags className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 快捷操作 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">{language === "zh" ? "快捷操作" : "Quick Actions"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start bg-gradient-to-r from-blue-700 to-blue-500"
                        onClick={() => setActiveTab("accounts")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "zh" ? "管理用户账号" : "Manage Accounts"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab("clubs")}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {language === "zh" ? "管理社团" : "Manage Clubs"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab("tags")}
                      >
                        <Tags className="w-4 h-4 mr-2" />
                        {language === "zh" ? "管理标签" : "Manage Tags"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">{language === "zh" ? "系统信息" : "System Info"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <p>{language === "zh" ? "系统角色说明：" : "Role Description:"}</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>{language === "zh" ? "学校管理员：拥有平台最高管理权限" : "School Admin: Full platform access"}</li>
                        <li>{language === "zh" ? "社团管理员：管理特定社团信息与成员" : "Club Admin: Manage specific club info & members"}</li>
                        <li>{language === "zh" ? "学生用户：浏览社团、参与匹配与申请" : "Student: Browse clubs, get recommendations, apply"}</li>
                      </ul>
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
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "账号管理" : "Account Management"}</h1>
                  <Button 
                    className="bg-gradient-to-r from-blue-700 to-blue-500"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === "zh" ? "创建社团管理员" : "Create Club Admin"}
                  </Button>
                </div>

                {/* 筛选和搜索栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder={language === "zh" ? "账号类型" : "Account Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "zh" ? "全部账号" : "All Accounts"}</SelectItem>
                      <SelectItem value="student">{language === "zh" ? "学生账号" : "Students"}</SelectItem>
                      <SelectItem value="club_admin">{language === "zh" ? "社团管理员" : "Club Admins"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={language === "zh" ? "搜索姓名、邮箱或学号..." : "Search name, email or student ID..."}
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
                      <DialogTitle>{language === "zh" ? "创建社团管理员账号" : "Create Club Admin Account"}</DialogTitle>
                      <DialogDescription>{language === "zh" ? "为指定社团创建管理员账号" : "Create admin account for a specific club"}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>{language === "zh" ? "管理员姓名" : "Admin Name"}</Label>
                        <Input
                          value={createForm.name}
                          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                          placeholder={language === "zh" ? "请输入姓名" : "Enter name"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "登录邮箱" : "Email"}</Label>
                        <Input
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                          placeholder={language === "zh" ? "请输入邮箱" : "Enter email"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "登录密码" : "Password"}</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            placeholder={language === "zh" ? "请输入密码" : "Enter password"}
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
                        <Label>{language === "zh" ? "所属社团" : "Club"}</Label>
                        <Select
                          value={createForm.clubId}
                          onValueChange={(value) => setCreateForm({ ...createForm, clubId: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={language === "zh" ? "选择社团" : "Select club"} />
                          </SelectTrigger>
                          <SelectContent>
                            {clubsLoading ? (
                              <div className="p-2 text-center text-sm text-gray-500">{language === "zh" ? "加载中..." : "Loading..."}</div>
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
                        {language === "zh" ? "取消" : "Cancel"}
                      </Button>
                      <Button 
                        onClick={handleCreateClubAdmin}
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                      >
                        {language === "zh" ? "创建账号" : "Create Account"}
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
                        {language === "zh" ? "账号详情" : "Account Details"}
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
                              {selectedAccount.type === 'club_admin' 
                                ? (language === "zh" ? "社团管理员" : "Club Admin")
                                : (language === "zh" ? "学生" : "Student")}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <Label className="text-xs text-gray-500">{language === "zh" ? "邮箱" : "Email"}</Label>
                            <p className="font-medium">{selectedAccount.email}</p>
                          </div>
                          
                          {selectedAccount.student_id && (
                            <div>
                              <Label className="text-xs text-gray-500">{language === "zh" ? "学号" : "Student ID"}</Label>
                              <p className="font-medium">{selectedAccount.student_id}</p>
                            </div>
                          )}
                          
                          {selectedAccount.club_name && (
                            <div>
                              <Label className="text-xs text-gray-500">{language === "zh" ? "所属社团" : "Club"}</Label>
                              <p className="font-medium">{selectedAccount.club_name}</p>
                            </div>
                          )}
                          
                          <div>
                            <Label className="text-xs text-gray-500">{language === "zh" ? "密码" : "Password"}</Label>
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
                            <Label className="text-xs text-gray-500">{language === "zh" ? "创建时间" : "Created At"}</Label>
                            <p className="font-medium">
                              {new Date(selectedAccount.created_at).toLocaleString(language === "zh" ? 'zh-CN' : 'en-US')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsViewAccountDialogOpen(false)}>
                        {language === "zh" ? "关闭" : "Close"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsViewAccountDialogOpen(false);
                          openEditAccountDialog(selectedAccount, selectedAccount.type);
                        }}
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {language === "zh" ? "编辑账号" : "Edit Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 编辑账号对话框 */}
                <Dialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{language === "zh" ? "编辑账号" : "Edit Account"}</DialogTitle>
                      <DialogDescription>{language === "zh" ? "修改账号信息" : "Modify account information"}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>{language === "zh" ? "姓名" : "Name"}</Label>
                        <Input
                          value={editAccountForm.name}
                          onChange={(e) => setEditAccountForm({ ...editAccountForm, name: e.target.value })}
                          placeholder={language === "zh" ? "请输入姓名" : "Enter name"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "邮箱" : "Email"}</Label>
                        <Input
                          type="email"
                          value={editAccountForm.email}
                          onChange={(e) => setEditAccountForm({ ...editAccountForm, email: e.target.value })}
                          placeholder={language === "zh" ? "请输入邮箱" : "Enter email"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "密码" : "Password"}</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showAccountPassword ? "text" : "password"}
                            value={editAccountForm.password}
                            onChange={(e) => setEditAccountForm({ ...editAccountForm, password: e.target.value })}
                            placeholder={language === "zh" ? "请输入新密码" : "Enter new password"}
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
                          {selectedAccount?.type === 'student' 
                            ? (language === "zh" ? "学生密码修改功能暂不可用" : "Student password modification unavailable")
                            : (language === "zh" ? "留空表示不修改密码" : "Leave empty to keep current password")}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditAccountDialogOpen(false)}>
                        {language === "zh" ? "取消" : "Cancel"}
                      </Button>
                      <Button 
                        onClick={handleSaveAccountEdit}
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {language === "zh" ? "保存修改" : "Save Changes"}
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {language === "zh" ? "暂无账号" : "No Accounts"}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchAccountQuery 
                            ? (language === "zh" ? "没有找到匹配的账号" : "No matching accounts found")
                            : (language === "zh" ? "点击上方按钮创建第一个账号" : "Click the button above to create the first account")}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={loadStudentAccounts}
                        >
                          {language === "zh" ? "刷新学生数据" : "Refresh Student Data"}
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
                                    {account.accountType === 'club_admin' 
                                      ? (language === "zh" ? "社团管理员" : "Club Admin")
                                      : (language === "zh" ? "学生" : "Student")}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">{account.email}</p>
                                {account.club_name && (
                                  <Badge className="mt-1 bg-gray-100 text-gray-700">
                                    {account.club_name}
                                  </Badge>
                                )}
                                {account.student_id && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {language === "zh" ? "学号" : "Student ID"}: {account.student_id}
                                  </p>
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
                                {language === "zh" ? "查看" : "View"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditAccountDialog(account, account.accountType)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                {language === "zh" ? "编辑" : "Edit"}
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
                                {language === "zh" ? "删除" : "Delete"}
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === "zh" ? "社团管理" : "Club Management"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={fetchClubs}
                      disabled={clubsLoading}
                    >
                      {clubsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "zh" ? "刷新数据" : "Refresh")}
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-blue-700 to-blue-500"
                      onClick={openCreateClubDialog}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "zh" ? "新建社团" : "Create Club"}
                    </Button>
                  </div>
                </div>

                {/* 搜索栏 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={language === "zh" ? "搜索社团名称、分类或描述..." : "Search club name, category or description..."}
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
                        {searchClubQuery 
                          ? (language === "zh" ? "未找到匹配的社团" : "No Matching Clubs")
                          : (language === "zh" ? "暂无社团数据" : "No Club Data")}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchClubQuery 
                          ? (language === "zh" ? "尝试调整搜索关键词" : "Try adjusting search keywords")
                          : (language === "zh" ? "点击上方按钮创建第一个社团" : "Click button above to create first club")}
                      </p>
                      {!searchClubQuery && (
                        <Button 
                          className="bg-gradient-to-r from-blue-700 to-blue-500"
                          onClick={openCreateClubDialog}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {language === "zh" ? "新建社团" : "Create Club"}
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
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                {club.name?.[0] || (language === "zh" ? "社" : "C")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900 text-lg">{club.name}</h3>
                                  <Badge className={club.is_recruiting ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                                    {club.is_recruiting 
                                      ? (language === "zh" ? "招新中" : "Recruiting")
                                      : (language === "zh" ? "已关闭" : "Closed")}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">{club.category}</p>
                                <p className="text-sm text-gray-600 truncate">
                                  {club.description || (language === "zh" ? "暂无描述" : "No description")}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {club.location || (language === "zh" ? "未设置" : "Not set")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {language === "zh" ? "成立于" : "Founded"} {club.founded || (language === "zh" ? "未设置" : "Not set")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {club.members || 0} {language === "zh" ? "人" : "members"}
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
                                <span className="text-sm text-gray-500">{language === "zh" ? "招新" : "Recruit"}</span>
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
                                  {language === "zh" ? "编辑" : "Edit"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openDeleteClubDialog(club)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {language === "zh" ? "删除" : "Delete"}
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

            {/* 社团申请管理页面 */}
            {activeTab === "applications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === "zh" ? "社团申请管理" : "Club Application Management"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadClubApplications}
                      disabled={loadingApplications}
                    >
                      {loadingApplications ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span className="ml-2">{language === "zh" ? "刷新" : "Refresh"}</span>
                    </Button>
                  </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "待处理" : "Pending"}</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {clubApplications.filter(a => a.status === 'pending').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "已通过" : "Approved"}</p>
                          <p className="text-2xl font-bold text-green-700">
                            {clubApplications.filter(a => a.status === 'approved').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center">
                          <XCircle className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "已拒绝" : "Rejected"}</p>
                          <p className="text-2xl font-bold text-red-700">
                            {clubApplications.filter(a => a.status === 'rejected').length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 筛选工具栏 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      {/* 状态筛选 */}
                      <Select value={applicationStatusFilter} onValueChange={setApplicationStatusFilter}>
                        <SelectTrigger className="w-32">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{language === "zh" ? "全部状态" : "All Status"}</SelectItem>
                          <SelectItem value="pending">{language === "zh" ? "待处理" : "Pending"}</SelectItem>
                          <SelectItem value="approved">{language === "zh" ? "已通过" : "Approved"}</SelectItem>
                          <SelectItem value="rejected">{language === "zh" ? "已拒绝" : "Rejected"}</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* 分类筛选 */}
                      <Select value={applicationCategoryFilter} onValueChange={setApplicationCategoryFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={language === "zh" ? "全部分类" : "All Categories"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{language === "zh" ? "全部分类" : "All Categories"}</SelectItem>
                          <SelectItem value="学术科技">{language === "zh" ? "学术科技" : "Academic & Tech"}</SelectItem>
                          <SelectItem value="文艺创作">{language === "zh" ? "文艺创作" : "Arts & Creativity"}</SelectItem>
                          <SelectItem value="体育运动">{language === "zh" ? "体育运动" : "Sports"}</SelectItem>
                          <SelectItem value="公益实践">{language === "zh" ? "公益实践" : "Volunteer & Practice"}</SelectItem>
                          <SelectItem value="技术工程">{language === "zh" ? "技术工程" : "Tech & Engineering"}</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* 搜索框 */}
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          placeholder={language === "zh" ? "搜索社团名/申请人/邮箱..." : "Search club name/applicant/email..."}
                          value={applicationSearchQuery}
                          onChange={(e) => setApplicationSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 申请列表 */}
                {loadingApplications ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : getFilteredClubApplications().length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12 text-center">
                      <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">
                        {language === "zh" ? "暂无社团申请" : "No club applications"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getFilteredClubApplications().map((app) => (
                      <Card key={app.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* 左侧：申请信息 */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">{app.club_name}</h3>
                                  <Badge className={`mt-1 ${
                                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {app.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                    {app.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {app.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                    {app.status === 'pending' ? (language === "zh" ? "待处理" : "Pending") :
                                     app.status === 'approved' ? (language === "zh" ? "已通过" : "Approved") :
                                     (language === "zh" ? "已拒绝" : "Rejected")}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(app.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-gray-500">
                                  <span className="font-medium text-gray-700">{language === "zh" ? "申请人：" : "Applicant: "}</span>
                                  {app.applicant_name}
                                </p>
                                <p className="text-gray-500">
                                  <span className="font-medium text-gray-700">{language === "zh" ? "身份：" : "Identity: "}</span>
                                  {app.applicant_identity === 'student' ? (language === "zh" ? "学生" : "Student") :
                                   app.applicant_identity === 'teacher' ? (language === "zh" ? "老师" : "Teacher") :
                                   app.applicant_identity === 'staff' ? (language === "zh" ? "职工" : "Staff") :
                                   (language === "zh" ? "其他" : "Other")}
                                </p>
                                <p className="text-gray-500 col-span-2">
                                  <span className="font-medium text-gray-700">{language === "zh" ? "邮箱：" : "Email: "}</span>
                                  {app.applicant_email}
                                  {app.email_verified && <CheckCircle className="w-3 h-3 inline ml-1 text-green-600" />}
                                </p>
                                <p className="text-gray-500">
                                  <span className="font-medium text-gray-700">{language === "zh" ? "分类：" : "Category: "}</span>
                                  {app.club_category}
                                </p>
                                {app.club_location && (
                                  <p className="text-gray-500">
                                    <span className="font-medium text-gray-700">{language === "zh" ? "地点：" : "Location: "}</span>
                                    {app.club_location}
                                  </p>
                                )}
                              </div>

                              <p className="text-sm text-gray-600 line-clamp-2">
                                {app.club_description}
                              </p>

                              {app.status === 'rejected' && app.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-sm text-red-700">
                                    <span className="font-medium">{language === "zh" ? "拒绝理由：" : "Rejection Reason: "}</span>
                                    {app.rejection_reason}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* 右侧：操作按钮 */}
                            <div className="flex lg:flex-col gap-2 lg:w-32">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setIsViewApplicationDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {language === "zh" ? "详情" : "View"}
                              </Button>
                              {app.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApproveApplication(app.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {language === "zh" ? "通过" : "Approve"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setIsRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    {language === "zh" ? "拒绝" : "Reject"}
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteApplication(app.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {language === "zh" ? "删除" : "Delete"}
                              </Button>
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === "zh" ? "标签管理" : "Tag Management"}
                  </h1>
                  <Button 
                    variant="outline" 
                    onClick={fetchCategoryTags}
                    disabled={tagsLoading}
                  >
                    {tagsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "zh" ? "刷新数据" : "Refresh")}
                  </Button>
                </div>

                {/* 添加新标签 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      {language === "zh" ? "添加新标签" : "Add New Tag"}
                    </CardTitle>
                    <CardDescription>
                      {language === "zh" 
                        ? "选择分类并输入标签名称，标签将显示在学生端的兴趣选择页面"
                        : "Select category and enter tag name, tags will appear on student interest selection page"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select
                        value={selectedCategoryForTag}
                        onValueChange={setSelectedCategoryForTag}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder={language === "zh" ? "选择分类" : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 flex-1">
                        <Input
                          placeholder={language === "zh" ? "输入标签名称" : "Enter tag name"}
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
                          className="bg-gradient-to-r from-blue-700 to-blue-500 whitespace-nowrap"
                        >
                          {isAddingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "zh" ? "添加" : "Add")}
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
                                {language === "zh" 
                                  ? `共 ${categoryTags.length} 个标签`
                                  : `${categoryTags.length} tags`}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {categoryTags.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                              {language === "zh" ? "暂无标签" : "No tags"}
                            </p>
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
                                    title={language === "zh" ? "删除标签" : "Delete tag"}
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

            {/* 数据分析页面 */}
            {activeTab === "analytics" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 pb-8"
              >
                {/* 页面标题 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {language === "zh" ? "数据分析" : "Data Analytics"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {language === "zh" ? "平台数据统计与可视化分析" : "Platform statistics and visual analysis"}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={loadAnalyticsData}
                    disabled={loadingAnalytics}
                    className="gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                  >
                    {loadingAnalytics ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        🔄
                      </motion.div>
                    )}
                    {language === "zh" ? "刷新数据" : "Refresh"}
                  </Button>
                </motion.div>

                {loadingAnalytics ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Skeleton className="h-72 w-full rounded-2xl" />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <>
                    {/* 统计概览卡片 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ClubStatsDashboard clubs={clubs} applications={applications} language={language} />
                    </motion.div>

                    {/* 第一行图表 */}
                    <motion.div 
                      className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {/* 社团分类饼图 */}
                      <div className="lg:col-span-1">
                        <ClubCategoryPieChart clubs={clubs} language={language} />
                      </div>

                      {/* 社团申请通过率分布 */}
                      <div className="lg:col-span-1">
                        <ClubApprovalRatePieChart clubs={clubs} applications={applications} language={language} />
                      </div>

                      {/* 热门社团申请分布 */}
                      <div className="lg:col-span-1">
                        <ClubApplicationDistribution clubs={clubs} applications={applications} language={language} />
                      </div>
                    </motion.div>

                    {/* 第二行图表 */}
                    <motion.div 
                      className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {/* 热门标签 */}
                      <div>
                        <HotTagsChart clubs={clubs} language={language} />
                      </div>
                      
                      {/* 申请趋势 */}
                      <div>
                        <ApplicationTrendChart applications={applications} language={language} />
                      </div>
                    </motion.div>

                    {/* 第三行图表 */}
                    <motion.div 
                      className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      {/* 成员数量 */}
                      <div className="lg:col-span-2">
                        <ClubMembersBarChart clubs={clubs} language={language} />
                      </div>
                      
                      {/* 申请漏斗 */}
                      <div className="lg:col-span-1">
                        <ApplicationFunnelChart applications={applications} language={language} />
                      </div>
                    </motion.div>

                    {/* 数据说明卡片 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-md border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-800">{language === "zh" ? "图表说明" : "Chart Legend"}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { title: language === "zh" ? "社团分类分布" : "Club Category Distribution", desc: language === "zh" ? "展示5大社团类别的占比情况" : "Shows proportion of 5 major club categories", icon: "🥧", color: "from-blue-100 to-blue-50" },
                          { title: language === "zh" ? "热门社团标签" : "Popular Club Tags", desc: language === "zh" ? "标签大小表示在社团中的出现频率" : "Tag size indicates usage frequency", icon: "🏷️", color: "from-amber-100 to-amber-50" },
                          { title: language === "zh" ? "各分类社团数量" : "Clubs by Category", desc: language === "zh" ? "展示不同分类的社团数量特征" : "Shows club count distribution by category", icon: "🎯", color: "from-purple-100 to-purple-50" },
                          { title: language === "zh" ? "申请趋势" : "Application Trend", desc: language === "zh" ? "按月份统计的申请数量变化" : "Monthly application volume changes", icon: "📈", color: "from-cyan-100 to-cyan-50" },
                          { title: language === "zh" ? "成员数量 TOP 8" : "Members TOP 8", desc: language === "zh" ? "按成员数量排序的社团排名" : "Clubs ranked by member count", icon: "📊", color: "from-emerald-100 to-emerald-50" },
                          { title: language === "zh" ? "申请转化漏斗" : "Application Funnel", desc: language === "zh" ? "从提交到审核的转化率分析" : "Conversion rate from submission to review", icon: "🔻", color: "from-rose-100 to-rose-50" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className={`p-3 rounded-xl bg-gradient-to-br ${item.color} hover:shadow-md transition-shadow duration-200`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="text-lg">{item.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{item.title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}

          </div>
        </main>
      </div>

      {/* 创建社团对话框 */}
      <Dialog open={isCreateClubDialogOpen} onOpenChange={setIsCreateClubDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "zh" ? "创建新社团" : "Create New Club"}</DialogTitle>
            <DialogDescription>{language === "zh" ? "填写社团基本信息" : "Fill in basic club information"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "社团名称 *" : "Club Name *"}</Label>
                <Input
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  placeholder={language === "zh" ? "请输入社团名称" : "Enter club name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "分类 *" : "Category *"}</Label>
                <Select
                  value={clubForm.category}
                  onValueChange={(value) => setClubForm({ ...clubForm, category: value, selectedTags: [] })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={language === "zh" ? "选择分类" : "Select category"} />
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
              <Label>{language === "zh" ? "社团介绍" : "Description"}</Label>
              <Textarea
                value={clubForm.description}
                onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                placeholder={language === "zh" ? "请输入社团介绍..." : "Enter club description..."}
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "活动地点" : "Location"}</Label>
                <Input
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  placeholder={language === "zh" ? "例如：科技楼 301" : "e.g., Building 301"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "成立时间" : "Founded Year"}</Label>
                <Input
                  value={clubForm.founded}
                  onChange={(e) => setClubForm({ ...clubForm, founded: e.target.value })}
                  placeholder={language === "zh" ? "例如：2020年" : "e.g., 2020"}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "社长姓名" : "President Name"}</Label>
                <Input
                  value={clubForm.president}
                  onChange={(e) => setClubForm({ ...clubForm, president: e.target.value })}
                  placeholder={language === "zh" ? "请输入社长姓名" : "Enter president name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "联系邮箱" : "Contact Email"}</Label>
                <Input
                  type="email"
                  value={clubForm.contact}
                  onChange={(e) => setClubForm({ ...clubForm, contact: e.target.value })}
                  placeholder={language === "zh" ? "请输入联系邮箱" : "Enter contact email"}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 新的标签选择器 */}
            <div>
              <Label>{language === "zh" ? "标签" : "Tags"}</Label>
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
                    {language === "zh" ? "请先选择分类，然后选择标签" : "Please select a category first, then choose tags"}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label>{language === "zh" ? "封面图片 URL" : "Cover Image URL"}</Label>
              <Input
                value={clubForm.image}
                onChange={(e) => setClubForm({ ...clubForm, image: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === "zh" ? "留空将使用默认图片" : "Leave empty to use default image"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={clubForm.is_recruiting}
                onCheckedChange={(checked) => setClubForm({ ...clubForm, is_recruiting: checked })}
              />
              <Label>{language === "zh" ? "开启招新" : "Enable Recruitment"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateClubDialogOpen(false)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              onClick={handleCreateClub}
              className="bg-gradient-to-r from-blue-700 to-blue-500"
              disabled={!clubForm.category}
            >
              {language === "zh" ? "创建社团" : "Create Club"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑社团对话框 */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "zh" ? "编辑社团信息" : "Edit Club Information"}</DialogTitle>
            <DialogDescription>
              {language === "zh" 
                ? `修改 ${selectedClub?.name} 的信息`
                : `Modify information for ${selectedClub?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "社团名称 *" : "Club Name *"}</Label>
                <Input
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  placeholder={language === "zh" ? "请输入社团名称" : "Enter club name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "分类 *" : "Category *"}</Label>
                <Select
                  value={clubForm.category}
                  onValueChange={(value) => setClubForm({ ...clubForm, category: value, selectedTags: [] })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={language === "zh" ? "选择分类" : "Select category"} />
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
              <Label>{language === "zh" ? "社团介绍" : "Description"}</Label>
              <Textarea
                value={clubForm.description}
                onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                placeholder={language === "zh" ? "请输入社团介绍..." : "Enter club description..."}
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "活动地点" : "Location"}</Label>
                <Input
                  value={clubForm.location}
                  onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                  placeholder={language === "zh" ? "例如：科技楼 301" : "e.g., Building 301"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "成立时间" : "Founded Year"}</Label>
                <Input
                  value={clubForm.founded}
                  onChange={(e) => setClubForm({ ...clubForm, founded: e.target.value })}
                  placeholder={language === "zh" ? "例如：2020年" : "e.g., 2020"}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "zh" ? "社长姓名" : "President Name"}</Label>
                <Input
                  value={clubForm.president}
                  onChange={(e) => setClubForm({ ...clubForm, president: e.target.value })}
                  placeholder={language === "zh" ? "请输入社长姓名" : "Enter president name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{language === "zh" ? "联系邮箱" : "Contact Email"}</Label>
                <Input
                  type="email"
                  value={clubForm.contact}
                  onChange={(e) => setClubForm({ ...clubForm, contact: e.target.value })}
                  placeholder={language === "zh" ? "请输入联系邮箱" : "Enter contact email"}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 编辑时的标签选择器 */}
            <div>
              <Label>{language === "zh" ? "标签" : "Tags"}</Label>
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
                    {language === "zh" ? "请先选择分类，然后选择标签" : "Please select a category first, then choose tags"}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label>{language === "zh" ? "封面图片 URL" : "Cover Image URL"}</Label>
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
              <Label>{language === "zh" ? "开启招新" : "Enable Recruitment"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClubDialogOpen(false)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              onClick={handleEditClub}
              className="bg-gradient-to-r from-blue-700 to-blue-500"
            >
              {language === "zh" ? "保存修改" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看社团申请详情对话框 */}
      <Dialog open={isViewApplicationDialogOpen} onOpenChange={setIsViewApplicationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              {language === "zh" ? "社团申请详情" : "Club Application Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              {/* 社团信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-blue-900 mb-3">{selectedApplication.club_name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-blue-700">
                    <span className="font-medium">{language === "zh" ? "分类：" : "Category: "}</span>
                    {selectedApplication.club_category}
                  </p>
                  {selectedApplication.club_location && (
                    <p className="text-blue-700">
                      <span className="font-medium">{language === "zh" ? "地点：" : "Location: "}</span>
                      {selectedApplication.club_location}
                    </p>
                  )}
                </div>
                <p className="text-sm text-blue-800 mt-2">
                  <span className="font-medium">{language === "zh" ? "简介：" : "Description: "}</span>
                  {selectedApplication.club_description}
                </p>
                {selectedApplication.club_tags && selectedApplication.club_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedApplication.club_tags.map((tag, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-700 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 申请人信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {language === "zh" ? "申请人信息" : "Applicant Information"}
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{language === "zh" ? "姓名：" : "Name: "}</span>
                    {selectedApplication.applicant_name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{language === "zh" ? "身份：" : "Identity: "}</span>
                    {selectedApplication.applicant_identity === 'student' ? (language === "zh" ? "学生" : "Student") :
                     selectedApplication.applicant_identity === 'teacher' ? (language === "zh" ? "老师" : "Teacher") :
                     selectedApplication.applicant_identity === 'staff' ? (language === "zh" ? "职工" : "Staff") :
                     (language === "zh" ? "其他" : "Other")}
                    {selectedApplication.applicant_student_id && ` (${selectedApplication.applicant_student_id})`}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{language === "zh" ? "邮箱：" : "Email: "}</span>
                    {selectedApplication.applicant_email}
                    {selectedApplication.email_verified ? (
                      <Badge className="ml-2 bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {language === "zh" ? "已验证" : "Verified"}
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {language === "zh" ? "未验证" : "Unverified"}
                      </Badge>
                    )}
                  </p>
                  {selectedApplication.club_contact && (
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">{language === "zh" ? "联系方式：" : "Contact: "}</span>
                      {selectedApplication.club_contact}
                    </p>
                  )}
                </div>
              </div>

              {/* 申请状态 */}
              <div className="flex items-center gap-2">
                <Badge className={`${
                  selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedApplication.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedApplication.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {selectedApplication.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {selectedApplication.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {selectedApplication.status === 'pending' ? (language === "zh" ? "待处理" : "Pending") :
                   selectedApplication.status === 'approved' ? (language === "zh" ? "已通过" : "Approved") :
                   (language === "zh" ? "已拒绝" : "Rejected")}
                </Badge>
                <span className="text-sm text-gray-500">
                  {language === "zh" ? "申请时间：" : "Applied: "}
                  {new Date(selectedApplication.created_at).toLocaleString()}
                </span>
              </div>

              {/* 拒绝理由 */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">{language === "zh" ? "拒绝理由：" : "Rejection Reason: "}</span>
                    {selectedApplication.rejection_reason}
                  </p>
                  {selectedApplication.reviewed_at && (
                    <p className="text-xs text-red-500 mt-1">
                      {language === "zh" ? "审核时间：" : "Reviewed: "}
                      {new Date(selectedApplication.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveApplication(selectedApplication.id)}
                    disabled={!selectedApplication.email_verified}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {language === "zh" ? "批准申请" : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setIsRejectDialogOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {language === "zh" ? "拒绝申请" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 拒绝申请对话框 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              {language === "zh" ? "拒绝社团申请" : "Reject Club Application"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh"
                ? `请填写拒绝 "${selectedApplication?.club_name}" 的理由`
                : `Please provide a reason for rejecting "${selectedApplication?.club_name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason" className="text-red-600">
              {language === "zh" ? "拒绝理由 *" : "Rejection Reason *"}
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={language === "zh" ? "请输入拒绝理由..." : "Please enter rejection reason..."}
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectionReason("");
            }}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectApplication}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              {language === "zh" ? "确认拒绝" : "Confirm Reject"}
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
              {language === "zh" ? "确认删除社团" : "Confirm Delete Club"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh" 
                ? <>您确定要删除 <span className="font-semibold text-gray-900">{selectedClub?.name}</span> 吗？</>
                : <>Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedClub?.name}</span>?</>}
              <br /><br />
              <span className="text-red-600">{language === "zh" ? "注意：" : "Note:"}</span>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>{language === "zh" ? "如果社团还有成员，将无法删除" : "Cannot delete if club still has members"}</li>
                <li>{language === "zh" ? "如果社团有关联的管理员账号，将无法删除" : "Cannot delete if club has associated admin accounts"}</li>
                <li>{language === "zh" ? "删除后数据无法恢复" : "Data cannot be recovered after deletion"}</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteClubDialogOpen(false)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteClub}
            >
              {language === "zh" ? "确认删除" : "Confirm Delete"}
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
              {language === "zh" ? "确认删除标签" : "Confirm Delete Tag"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh" 
                ? <>您确定要删除标签 <span className="font-semibold text-gray-900">「{tagToDelete?.tag}」</span> 吗？</>
                : <>Are you sure you want to delete tag <span className="font-semibold text-gray-900">"{tagToDelete?.tag}"</span>?</>}
              <br /><br />
              <span className="text-amber-600">{language === "zh" ? "⚠️ 注意：" : "⚠️ Note:"}</span>
              <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                <li>{language === "zh" 
                  ? `该标签将从「${tagToDelete?.category}」分类中删除`
                  : `This tag will be removed from "${tagToDelete?.category}" category`}</li>
                <li>{language === "zh" 
                  ? "所有使用该标签的社团将自动取消显示该标签"
                  : "All clubs using this tag will automatically remove it"}</li>
                <li>{language === "zh" ? "删除后无法恢复" : "Cannot be recovered after deletion"}</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagToDelete(null)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={isDeletingTag}
            >
              {isDeletingTag ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {language === "zh" ? "确认删除" : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolAdmin;
