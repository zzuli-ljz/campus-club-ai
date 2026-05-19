
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
  User as UserIcon,
  MessageCircle,
  Trophy,
  Pin,
  Heart,
  Eye,
  Image as ImageIcon,
  Newspaper,
  Star,
  Send,
  X,
  LogOut,
  ClipboardList,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useApplications } from "@/hooks/useApplications";
import { useMembers } from "@/hooks/useMembers";
import { useClubPosts } from "@/hooks/useClubPosts";
import { useClubReviews } from "@/hooks/useClubReviews";
import { useCategoryTags } from "@/hooks/useCategoryTags";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useEventRegistrations } from "@/hooks/useEventRegistrations";
import TagSelector from "@/components/TagSelector";
import Navbar from "@/components/Navbar";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useLanguage } from "@/contexts/LanguageContext";

// 动态类型配置
const getPostTypeConfig = (lang) => ({
  post: { label: lang === "zh" ? '动态' : 'Posts', icon: MessageCircle, color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-50' },
  notice: { label: lang === "zh" ? '公告' : 'Announcements', icon: Megaphone, color: 'bg-red-100 text-red-700', bgColor: 'bg-red-50' },
  event: { label: lang === "zh" ? '活动预告' : 'Events', icon: Calendar, color: 'bg-green-100 text-green-700', bgColor: 'bg-green-50' },
  achievement: { label: lang === "zh" ? '荣誉' : 'Achievements', icon: Trophy, color: 'bg-yellow-100 text-yellow-700', bgColor: 'bg-yellow-50' },
});

const ClubAdmin = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useUser();
  const { language } = useLanguage();
  const { getClubById, updateClub, toggleRecruiting } = useClubs();
  const { getClubApplications, updateApplicationStatus } = useApplications();
  const { getClubMembers, updateMemberRole, removeMember, isLoading: memberLoading } = useMembers();
  const { getClubPosts, createPost, updatePost, deletePost, isLoading: postsLoading } = useClubPosts();
  const { getClubReviews, getReviewStats, replyToReview, isLoading: reviewsLoading } = useClubReviews();
  const { tagsByCategory, getTagsForCategory, addCustomTag, isLoading: tagsLoading } = useCategoryTags();
  const { getClubLeaveRequests, updateLeaveRequestStatus, isLoading: leaveLoading } = useLeaveRequests();
  const { getPostRegistrations, deleteRegistration, exportRegistrations, isLoading: regLoading } = useEventRegistrations();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [clubData, setClubData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // 动态/公告表单
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    type: "post",
    images: [],
    is_pinned: false,
    event_date: "",
    // 活动报名相关字段
    requires_registration: false,
    registration_start: null,
    registration_end: null,
    max_participants: ""
  });
  const [postImageInput, setPostImageInput] = useState("");
  
  // 成员管理
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberRoleDialogOpen, setIsMemberRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  
  // 内容管理筛选和搜索
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  
  // 评价回复
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isViewAllReviewsDialogOpen, setIsViewAllReviewsDialogOpen] = useState(false);
  const [replyForm, setReplyForm] = useState({ reviewId: null, content: "" });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingClub, setLoadingClub] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // 退出申请相关
  const [leaveRequests, setLeaveRequests] = useState([]);

  // 活动报名管理相关
  const [eventRegistrations, setEventRegistrations] = useState({});
  const [selectedEventPost, setSelectedEventPost] = useState(null);
  const [isRegistrationsDialogOpen, setIsRegistrationsDialogOpen] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // 权限检查 - 确保只有社团管理员能访问
  useEffect(() => {
    if (role !== "club_admin") {
      toast.error(language === "zh" ? "无权访问社团管理后台" : "Access denied. Club admin only.");
      navigate("/");
    }
  }, [role, navigate]);

  // 加载社团数据
  useEffect(() => {
    if (profile?.club_id) {
      loadClubData(profile.club_id);
      loadMembers(profile.club_id);
      loadPosts(profile.club_id);
      loadReviews(profile.club_id);
      loadLeaveRequests(profile.club_id);
    }
  }, [profile]);

  // 加载退出申请
  const loadLeaveRequests = async (clubId) => {
    setLoadingLeaves(true);
    try {
      const result = await getClubLeaveRequests(clubId);
      if (result.success) {
        setLeaveRequests(result.data);
      }
    } catch (err) {
      console.error('加载退出申请失败:', err);
    }
    setLoadingLeaves(false);
  };

  // 加载活动报名列表
  const loadEventRegistrations = async (postId) => {
    setLoadingRegistrations(true);
    try {
      const result = await getPostRegistrations(postId);
      if (result.success) {
        setEventRegistrations(prev => ({ ...prev, [postId]: result.data }));
      }
    } catch (err) {
      console.error('加载活动报名失败:', err);
    }
    setLoadingRegistrations(false);
  };

  // 打开活动报名管理对话框
  const openRegistrationsDialog = async (post) => {
    setSelectedEventPost(post);
    setIsRegistrationsDialogOpen(true);
    // 每次打开对话框时都刷新最新数据
    await loadEventRegistrations(post.id);
  };

  // 刷新当前活动的报名列表
  const refreshCurrentRegistrations = async () => {
    if (selectedEventPost?.id) {
      await loadEventRegistrations(selectedEventPost.id);
    }
  };

  // 处理删除报名记录
  const handleDeleteRegistration = async (registrationId) => {
    if (!confirm(language === "zh" ? "确定要删除这条报名记录吗？" : "Are you sure you want to delete this registration?")) return;
    
    const result = await deleteRegistration(registrationId);
    if (result.success) {
      await loadEventRegistrations(selectedEventPost.id);
    }
  };

  // 导出报名数据
  const handleExportRegistrations = async () => {
    if (!selectedEventPost) return;
    await exportRegistrations(selectedEventPost.id, selectedEventPost.title);
  };

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
        major: app.profiles?.student_id || (language === "zh" ? "未知专业" : "Unknown Major")
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

  // 加载动态列表
  const loadPosts = async (clubId) => {
    setLoadingPosts(true);
    const result = await getClubPosts(clubId);
    if (result.success) {
      setPosts(result.data);
    }
    setLoadingPosts(false);
  };

  // 加载评价列表和统计
  const loadReviews = async (clubId) => {
    setLoadingReviews(true);
    const [reviewsResult, statsResult] = await Promise.all([
      getClubReviews(clubId),
      getReviewStats(clubId)
    ]);
    if (reviewsResult.success) {
      setReviews(reviewsResult.data);
    }
    if (statsResult.success) {
      setReviewStats(statsResult.data);
    }
    setLoadingReviews(false);
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

  // 处理退出申请审核
  const handleLeaveRequest = async (id, action) => {
    // 先在本地更新状态，提供即时反馈
    setLeaveRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: action } : req
    ));
    
    const result = await updateLeaveRequestStatus(id, action);
    if (result.success) {
      // 如果批准了，刷新成员列表
      if (action === 'approved') {
        await loadMembers(profile.club_id);
      }
    } else {
      // 如果失败，恢复原状态
      toast.error(language === "zh" ? '操作失败，请重试' : 'Operation failed, please retry');
      await loadLeaveRequests(profile.club_id);
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

  // ========== 内容管理功能 ==========
  
  // 打开创建动态对话框
  const openCreatePostDialog = () => {
    setEditingPost(null);
    setPostForm({
      title: "",
      content: "",
      type: "post",
      images: [],
      is_pinned: false,
      event_date: "",
      requires_registration: false,
      registration_start: null,
      registration_end: null,
      max_participants: ""
    });
    setPostImageInput("");
    setIsPostDialogOpen(true);
  };

  // 打开编辑动态对话框
  const openEditPostDialog = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      type: post.type || "post",
      images: post.images || [],
      is_pinned: post.is_pinned || false,
      event_date: post.event_date || "",
      requires_registration: post.requires_registration || false,
      registration_start: post.registration_start ? new Date(post.registration_start) : null,
      registration_end: post.registration_end ? new Date(post.registration_end) : null,
      max_participants: post.max_participants || ""
    });
    setPostImageInput("");
    setIsPostDialogOpen(true);
  };

  // 添加图片
  const handleAddImage = () => {
    if (!postImageInput.trim()) return;
    setPostForm(prev => ({
      ...prev,
      images: [...prev.images, postImageInput.trim()]
    }));
    setPostImageInput("");
  };

  // 移除图片
  const handleRemoveImage = (index) => {
    setPostForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 保存动态（创建或更新）
  const handleSavePost = async () => {
    if (!postForm.title.trim()) {
      toast.error(language === "zh" ? "请输入标题" : "Please enter a title");
      return;
    }
    if (!postForm.content.trim()) {
      toast.error(language === "zh" ? "请输入内容" : "Please enter content");
      return;
    }

    // 如果是活动预告类型，验证活动日期
    if (postForm.type === 'event' && !postForm.event_date) {
      toast.error(language === "zh" ? "请选择活动日期" : "Please select event date");
      return;
    }

    // 如果启用报名，验证报名设置
    if (postForm.type === 'event' && postForm.requires_registration) {
      if (!postForm.registration_start) {
        toast.error(language === "zh" ? "请选择报名开始时间" : "Please select registration start time");
        return;
      }
      if (!postForm.registration_end) {
        toast.error(language === "zh" ? "请选择报名结束时间" : "Please select registration end time");
        return;
      }
      if (new Date(postForm.registration_start) >= new Date(postForm.registration_end)) {
        toast.error(language === "zh" ? "报名开始时间必须早于结束时间" : "Registration start must be before end time");
        return;
      }
      if (!postForm.max_participants || parseInt(postForm.max_participants) <= 0) {
        toast.error(language === "zh" ? "请输入有效的报名人数限制" : "Please enter valid participant limit");
        return;
      }
    }

    if (!profile?.club_id) {
      toast.error(language === "zh" ? "社团信息缺失" : "Club info missing");
      return;
    }

    // 构建 postData，包含 author_id（确保转为字符串）
    const postData = {
      club_id: profile.club_id,
      author_id: user?.id ? String(user.id) : '00000000-0000-0000-0000-000000000000',
      author_name: profile?.name || (language === "zh" ? "管理员" : "Admin"),
      title: postForm.title,
      content: postForm.content,
      type: postForm.type,
      images: postForm.images,
      is_pinned: postForm.is_pinned,
      event_date: postForm.type === 'event' ? postForm.event_date : null,
      // 活动报名相关字段
      requires_registration: postForm.type === 'event' && postForm.requires_registration ? true : false,
      registration_start: postForm.type === 'event' && postForm.requires_registration && postForm.registration_start ? postForm.registration_start.toISOString() : null,
      registration_end: postForm.type === 'event' && postForm.requires_registration && postForm.registration_end ? postForm.registration_end.toISOString() : null,
      max_participants: postForm.type === 'event' && postForm.requires_registration && postForm.max_participants ? parseInt(postForm.max_participants) : null,
      registration_open: postForm.type === 'event' && postForm.requires_registration ? true : false,
    };

    // 判断是更新现有动态还是创建新动态
    let result;
    if (editingPost) {
      result = await updatePost(editingPost.id, postData);
    } else {
      result = await createPost(postData);
    }

    if (result.success) {
      setIsPostDialogOpen(false);
      setEditingPost(null); // 重置编辑状态
      await loadPosts(profile.club_id);
    }
  };

  // 打开删除确认对话框
  const openDeletePostDialog = (post) => {
    setPostToDelete(post);
    setIsDeletePostDialogOpen(true);
  };

  // 确认删除动态
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    
    const result = await deletePost(postToDelete.id);
    if (result.success) {
      setIsDeletePostDialogOpen(false);
      setPostToDelete(null);
      await loadPosts(profile.club_id);
    }
  };

  // 打开评价回复对话框
  const openReplyDialog = (review) => {
    setReplyForm({
      reviewId: review.id,
      content: review.reply || ""
    });
    setIsReplyDialogOpen(true);
  };

  // 提交评价回复
  const handleSubmitReply = async () => {
    if (!replyForm.content.trim()) {
      toast.error(language === "zh" ? "请输入回复内容" : "Please enter reply content");
      return;
    }

    if (!replyForm.reviewId) {
      toast.error(language === "zh" ? "评价ID缺失，请重新打开对话框" : "Review ID missing, please reopen dialog");
      return;
    }

    // 确保有社团ID和管理员名称
    if (!profile?.club_id) {
      toast.error(language === "zh" ? "社团信息缺失，无法提交回复" : "Club info missing, cannot submit reply");
      return;
    }

    const result = await replyToReview(
      replyForm.reviewId, 
      replyForm.content.trim(),
      profile?.name || (language === "zh" ? "管理员" : "Admin")
    );

    if (result.success) {
      setIsReplyDialogOpen(false);
      setReplyForm({ reviewId: null, content: "" });
      // 重新加载评价列表
      await loadReviews(profile.club_id);
    }
  };

  // 打开编辑角色对话框
  const openEditRoleDialog = (member) => {
    setSelectedMember(member);
    setNewRole(member.role || (language === "zh" ? "成员" : "Member"));
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
    if (!confirm(language === "zh" ? "确定要移除该成员吗？" : "Are you sure you want to remove this member?")) return;
    
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

  // 过滤内容（搜索 + 类型筛选）
  const filteredPosts = posts.filter(post => {
    const matchesSearch = postSearchQuery === "" || 
      post.title?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(postSearchQuery.toLowerCase());
    const matchesType = postTypeFilter === "all" || post.type === postTypeFilter;
    return matchesSearch && matchesType;
  });

  // 更新侧边栏，移除活动管理
  const sidebarItems = [
    { id: "overview", label: language === "zh" ? "概览" : "Overview", icon: LayoutDashboard },
    { id: "info", label: language === "zh" ? "信息管理" : "Info", icon: Settings },
    { id: "applications", label: language === "zh" ? "报名审核" : "Applications", icon: FileText },
    { id: "leaveRequests", label: language === "zh" ? "退出申请" : "Leave Requests", icon: LogOut },
    { id: "members", label: language === "zh" ? "成员管理" : "Members", icon: Users },
    { id: "posts", label: language === "zh" ? "内容管理" : "Posts", icon: Newspaper },
    { id: "eventRegistrations", label: language === "zh" ? "活动报名" : "Event Registration", icon: ClipboardList },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Hourglass className="w-3 h-3 mr-1" />{language === "zh" ? "待审核" : "Pending"}</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{language === "zh" ? "已通过" : "Approved"}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{language === "zh" ? "已拒绝" : "Rejected"}</Badge>;
      default:
        return <Badge>{language === "zh" ? "未知" : "Unknown"}</Badge>;
    }
  };

  // 退出申请状态徽章
  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700"><Hourglass className="w-3 h-3 mr-1" />{language === "zh" ? "待审核" : "Pending"}</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{language === "zh" ? "已同意" : "Approved"}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />{language === "zh" ? "已拒绝" : "Rejected"}</Badge>;
      default:
        return <Badge>{language === "zh" ? "未知" : "Unknown"}</Badge>;
    }
  };

  // 获取动态类型标签
  const getPostTypeBadge = (type) => {
    const config = getPostTypeConfig(language)[type] || getPostTypeConfig(language).post;
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 获取活动状态显示
  const getEventStatusBadge = (eventDate) => {
    if (!eventDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge className="bg-gray-100 text-gray-500">{language === "zh" ? "已结束" : "Ended"}</Badge>;
    } else if (diffDays === 0) {
      return <Badge className="bg-red-100 text-red-600 animate-pulse">{language === "zh" ? "正在进行" : "In Progress"}</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-orange-100 text-orange-600">{language === "zh" ? `还有 ${diffDays} 天` : `${diffDays} days left`}</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-600">{language === "zh" ? `还有 ${diffDays} 天` : `${diffDays} days left`}</Badge>;
    }
  };

  if (loadingClub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50 pt-24 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // 在概览页面显示最新评价
  const renderLatestReviews = () => {
    if (loadingReviews) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (reviews.length === 0) {
      return <p className="text-center text-gray-500 py-4">{language === "zh" ? "暂无评价" : "No reviews yet"}</p>;
    }

    return (
      <div className="space-y-4">
        {reviews.slice(0, 3).map((review) => (
          <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
                    {review.user_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{review.user_name}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            {review.content && (
              <p className="mt-2 text-gray-600 text-sm">{review.content}</p>
            )}
            {review.reply ? (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  {language === "zh" ? "管理员回复" : "Admin Reply"} · {new Date(review.replied_at).toLocaleDateString('zh-CN')}
                </p>
                <p className="text-sm text-gray-700">{review.reply}</p>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-blue-600"
                onClick={() => openReplyDialog(review)}
              >
                <Send className="w-4 h-4 mr-1" />
                {language === "zh" ? "回复评价" : "Reply"}
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar title={language === "zh" ? "社团管理后台" : "Club Admin"} />

      {/* 主内容区域 */}
      <div className="relative pt-20 flex">
        {/* 侧边栏 */}
        <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white font-bold">
                {clubData?.name?.[0] || (language === "zh" ? "社" : "C")}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{clubData?.name || (language === "zh" ? "加载中..." : "Loading...")}</h2>
                <p className="text-xs text-gray-500">{language === "zh" ? "社团管理员" : "Club Admin"}</p>
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
                  {item.id === "applications" && applications.filter(a => a.status === "pending").length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {applications.filter(a => a.status === "pending").length}
                    </span>
                  )}
                  {item.id === "leaveRequests" && leaveRequests.filter(r => r.status === "pending").length > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {leaveRequests.filter(r => r.status === "pending").length}
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
                    <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "社团概览" : "Club Overview"}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {language === "zh" ? `管理您所属的社团：${clubData.name}` : `Managing: ${clubData.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{language === "zh" ? "招新状态" : "Recruiting"}</span>
                    <Switch checked={clubData.is_recruiting} onCheckedChange={handleToggleRecruiting} />
                  </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "社团成员" : "Members"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "待审核申请" : "Pending"}</p>
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
                          <p className="text-sm text-gray-500">{language === "zh" ? "退出申请" : "Leave Requests"}</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {leaveRequests.filter(r => r.status === "pending").length}
                          </p>
                        </div>
                        <LogOut className="w-8 h-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "内容动态" : "Posts"}</p>
                          <p className="text-3xl font-bold text-blue-700">{posts.length}</p>
                        </div>
                        <Newspaper className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{language === "zh" ? "社团评分" : "Rating"}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold text-orange-600">
                              {reviewStats?.average || "0.0"}
                            </p>
                            <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                          </div>
                          <p className="text-xs text-gray-400">{reviewStats?.total || 0} {language === "zh" ? "条评价" : "reviews"}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 评价列表卡片 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        {language === "zh" ? "最新评价" : "Latest Reviews"}
                      </CardTitle>
                      {reviews.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setIsViewAllReviewsDialogOpen(true)}>
                          {language === "zh" ? "查看全部" : "View All"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderLatestReviews()}
                  </CardContent>
                </Card>

                {/* 最近申请 */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{language === "zh" ? "最近申请" : "Recent Applications"}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("applications")}>
                        {language === "zh" ? "查看全部" : "View All"}
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
                        <p className="text-center text-gray-500 py-4">{language === "zh" ? "暂无待审核申请" : "No pending applications"}</p>
                      ) : (
                        applications.filter(a => a.status === "pending").slice(0, 3).map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
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
                                {language === "zh" ? "拒绝" : "Reject"}
                              </Button>
                              <Button size="sm" onClick={() => handleApplication(app.id, "approved")}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {language === "zh" ? "通过" : "Approve"}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 快捷入口 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("posts")}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{language === "zh" ? "发布内容" : "Publish Content"}</h3>
                          <p className="text-sm text-gray-500">{language === "zh" ? "发布公告、动态、活动预告、荣誉等" : "Post notices, updates, events, achievements"}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "社团信息管理" : "Club Info Management"}</h1>
                  <Button onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? (language === "zh" ? "取消编辑" : "Cancel Edit") : (language === "zh" ? "编辑信息" : "Edit Info")}
                  </Button>
                </div>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>{language === "zh" ? "社团名称" : "Club Name"}</Label>
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>{language === "zh" ? "社团介绍" : "Description"}</Label>
                          <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="mt-1 min-h-[120px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === "zh" ? "活动地点" : "Location"}</Label>
                            <Input
                              value={editForm.location || ""}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>{language === "zh" ? "联系邮箱" : "Contact Email"}</Label>
                            <Input
                              value={editForm.contact || ""}
                              onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {/* 标签选择器 - 使用 TagSelector 组件 */}
                        <div>
                          <Label>{language === "zh" ? "社团标签" : "Tags"}</Label>
                          <div className="mt-1">
                            <TagSelector
                              category={clubData.category}
                              availableTags={getTagsForCategory(clubData.category)}
                              selectedTags={editForm.tags || []}
                              onTagsChange={(newTags) => setEditForm({ ...editForm, tags: newTags })}
                              onAddCustomTag={addCustomTag}
                              maxTags={10}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button onClick={handleSaveClubInfo} className="bg-gradient-to-r from-blue-700 to-blue-500">
                            {language === "zh" ? "保存更改" : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            {language === "zh" ? "取消" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-start gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                            {clubData.name?.[0] || (language === "zh" ? "社" : "C")}
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
                              <p className="text-sm text-gray-500">{language === "zh" ? "活动地点" : "Location"}</p>
                              <p className="font-medium text-gray-900">{clubData.location || (language === "zh" ? "未设置" : "Not set")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">{language === "zh" ? "成立时间" : "Founded"}</p>
                              <p className="font-medium text-gray-900">{clubData.founded || (language === "zh" ? "未设置" : "Not set")}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t">
                          <p className="text-sm text-gray-500 mb-3">{language === "zh" ? "标签" : "Tags"}</p>
                          <div className="flex flex-wrap gap-2">
                            {clubData.tags?.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700">
                                {tag}
                              </Badge>
                            )) || <span className="text-gray-400">{language === "zh" ? "暂无标签" : "No tags"}</span>}
                          </div>
                        </div>

                        <div className="pt-6 border-t flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">{language === "zh" ? "招新状态" : "Recruiting"}</p>
                            <p className="font-medium text-gray-900">
                              {clubData.is_recruiting ? (language === "zh" ? "正在招新" : "Recruiting") : (language === "zh" ? "已关闭招新" : "Closed")}
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
                <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "报名申请审核" : "Application Review"}</h1>

                {/* 筛选工具栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={language === "zh" ? "搜索姓名或学号..." : "Search name or student ID..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={language === "zh" ? "筛选状态" : "Filter Status"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "zh" ? "全部状态" : "All Status"}</SelectItem>
                      <SelectItem value="pending">{language === "zh" ? "待审核" : "Pending"}</SelectItem>
                      <SelectItem value="approved">{language === "zh" ? "已通过" : "Approved"}</SelectItem>
                      <SelectItem value="rejected">{language === "zh" ? "已拒绝" : "Rejected"}</SelectItem>
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
                                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
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
                              <p className="text-xs text-gray-400 mt-3">{language === "zh" ? "申请时间" : "Applied"}: {app.applyTime}</p>
                            </div>
                            
                            {app.status === "pending" && (
                              <div className="flex lg:flex-col gap-2">
                                <Button onClick={() => handleApplication(app.id, "approved")} className="bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {language === "zh" ? "通过" : "Approve"}
                                </Button>
                                <Button variant="outline" onClick={() => handleApplication(app.id, "rejected")} className="border-red-200 text-red-600 hover:bg-red-50">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {language === "zh" ? "拒绝" : "Reject"}
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
                        <p className="text-gray-500">{language === "zh" ? "没有找到匹配的申请记录" : "No matching applications found"}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 退出申请审核页面 */}
            {activeTab === "leaveRequests" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "退出申请审核" : "Leave Request Review"}</h1>
                  <p className="text-gray-500">
                    {language === "zh" ? "待审核" : "Pending"} {leaveRequests.filter(r => r.status === "pending").length} {language === "zh" ? "条" : ""}
                  </p>
                </div>

                {/* 申请列表 */}
                {loadingLeaves ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <LogOut className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{language === "zh" ? "暂无退出申请" : "No Leave Requests"}</h3>
                      <p className="text-gray-500">{language === "zh" ? "当有成员申请退出社团时，会显示在这里" : "Leave requests will appear here when members apply to leave"}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.map((request) => (
                      <Card key={request.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
                                    {request.user_name?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{request.user_name}</h3>
                                  <p className="text-sm text-gray-500">
                                    {request.student_id || request.profiles?.student_id || (language === "zh" ? "未知学号" : "Unknown ID")}
                                    {request.profiles?.major && ` · ${request.profiles.major}`}
                                  </p>
                                </div>
                                {getLeaveStatusBadge(request.status)}
                              </div>
                              {request.reason && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                  <p className="text-sm text-gray-500 mb-1">{language === "zh" ? "退出原因" : "Reason"}:</p>
                                  <p className="text-sm text-gray-700">{request.reason}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-400">{language === "zh" ? "申请时间" : "Applied"}: {request.apply_time}</p>
                            </div>
                            
                            {request.status === "pending" && (
                              <div className="flex lg:flex-col gap-2">
                                <Button 
                                  onClick={() => handleLeaveRequest(request.id, "approved")}
                                  className="bg-green-500 hover:bg-green-600"
                                  disabled={leaveLoading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {language === "zh" ? "同意退出" : "Approve Leave"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleLeaveRequest(request.id, "rejected")}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  disabled={leaveLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {language === "zh" ? "拒绝申请" : "Reject"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "成员管理" : "Member Management"}</h1>
                  <p className="text-gray-500">{language === "zh" ? "共" : "Total"} {members.length} {language === "zh" ? "位成员" : "members"}</p>
                </div>

                {/* 搜索栏 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={language === "zh" ? "搜索成员姓名、专业或角色..." : "Search name, major, or role..."}
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
                                <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
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
                                  {member.major || (language === "zh" ? "未知专业" : "Unknown")} · {member.role || (language === "zh" ? "成员" : "Member")}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {language === "zh" ? "加入时间" : "Joined"}: {new Date(member.join_date).toLocaleDateString('zh-CN')}
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
                                {language === "zh" ? "编辑角色" : "Edit Role"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                {language === "zh" ? "移除" : "Remove"}
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
                          {memberSearchQuery ? (language === "zh" ? "没有找到匹配的成员" : "No matching members") : (language === "zh" ? "暂无成员数据" : "No members yet")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 编辑角色对话框 */}
                <Dialog open={isMemberRoleDialogOpen} onOpenChange={setIsMemberRoleDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{language === "zh" ? "编辑成员角色" : "Edit Member Role"}</DialogTitle>
                      <DialogDescription>
                        {language === "zh" ? `修改 ${selectedMember?.name} 的角色` : `Editing role for ${selectedMember?.name}`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label>{language === "zh" ? "选择角色" : "Select Role"}</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="社长">{language === "zh" ? "社长" : "President"}</SelectItem>
                          <SelectItem value="副社长">{language === "zh" ? "副社长" : "Vice President"}</SelectItem>
                          <SelectItem value="部长">{language === "zh" ? "部长" : "Director"}</SelectItem>
                          <SelectItem value="副部长">{language === "zh" ? "副部长" : "Deputy Director"}</SelectItem>
                          <SelectItem value="成员">{language === "zh" ? "成员" : "Member"}</SelectItem>
                          <SelectItem value="干事">{language === "zh" ? "干事" : "Staff"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMemberRoleDialogOpen(false)}>
                        {language === "zh" ? "取消" : "Cancel"}
                      </Button>
                      <Button onClick={handleSaveMemberRole} className="bg-gradient-to-r from-blue-700 to-blue-500">
                        {language === "zh" ? "保存" : "Save"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

            {/* 内容管理页面（动态/公告/荣誉/活动预告） */}
            {activeTab === "posts" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "内容管理" : "Content Management"}</h1>
                  <Button 
                    className="bg-gradient-to-r from-blue-700 to-blue-500"
                    onClick={openCreatePostDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === "zh" ? "发布内容" : "Create Post"}
                  </Button>
                </div>

                {/* 搜索和筛选工具栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={language === "zh" ? "搜索标题或内容..." : "Search title or content..."}
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={language === "zh" ? "内容类型" : "Type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "zh" ? "全部类型" : "All Types"}</SelectItem>
                      <SelectItem value="post">{language === "zh" ? "日常动态" : "Post"}</SelectItem>
                      <SelectItem value="notice">{language === "zh" ? "重要公告" : "Notice"}</SelectItem>
                      <SelectItem value="event">{language === "zh" ? "活动预告" : "Event"}</SelectItem>
                      <SelectItem value="achievement">{language === "zh" ? "荣誉展示" : "Achievement"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 内容列表 */}
                {loadingPosts ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className={`border-0 shadow-lg bg-white/80 backdrop-blur-xl ${post.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {getPostTypeBadge(post.type)}
                                {post.is_pinned && (
                                  <Badge className="bg-yellow-100 text-yellow-700">
                                    <Pin className="w-3 h-3 mr-1" />
                                    {language === "zh" ? "置顶" : "Pinned"}
                                  </Badge>
                                )}
                                {/* 活动状态显示 */}
                                {post.type === 'event' && post.event_date && (
                                  getEventStatusBadge(post.event_date)
                                )}
                                <span className="text-xs text-gray-400 ml-2">
                                  {new Date(post.created_at).toLocaleString('zh-CN')}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                              
                              {/* 活动日期显示 */}
                              {post.type === 'event' && post.event_date && (
                                <div className="flex items-center gap-2 mb-3 text-sm">
                                  <Calendar className="w-4 h-4 text-green-500" />
                                  <span className="text-gray-600">{language === "zh" ? "活动日期" : "Event Date"}: {new Date(post.event_date).toLocaleDateString('zh-CN')}</span>
                                </div>
                              )}

                              {/* 活动报名信息显示 */}
                              {post.type === 'event' && post.requires_registration && (
                                <div className="flex items-center gap-3 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                  <ClipboardList className="w-4 h-4 text-green-600" />
                                  <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <Badge className={post.registration_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                      {post.registration_open ? (language === "zh" ? "报名开启" : "Open") : (language === "zh" ? "报名关闭" : "Closed")}
                                    </Badge>
                                    {post.max_participants && (
                                      <span className="text-gray-600">{language === "zh" ? "限" : "Max"} {post.max_participants} {language === "zh" ? "人" : "people"}</span>
                                    )}
                                    {post.registration_start && post.registration_end && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(post.registration_start).toLocaleDateString('zh-CN')} ~ {new Date(post.registration_end).toLocaleDateString('zh-CN')}
                                      </span>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="ml-auto border-green-300 text-green-700 hover:bg-green-100"
                                    onClick={() => openRegistrationsDialog(post)}
                                  >
                                    <Users className="w-4 h-4 mr-1" />
                                    {language === "zh" ? "查看报名" : "View"}
                                  </Button>
                                </div>
                              )}
                              
                              {/* 图片预览 */}
                              {post.images && post.images.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                  {post.images.slice(0, 3).map((img, i) => (
                                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                  {post.images.length > 3 && (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                                      +{post.images.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {post.likes || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {post.views || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditPostDialog(post)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                {language === "zh" ? "编辑" : "Edit"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openDeletePostDialog(post)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {language === "zh" ? "删除" : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredPosts.length === 0 && (
                      <div className="text-center py-12">
                        <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                          {postSearchQuery || postTypeFilter !== "all" 
                            ? (language === "zh" ? "没有找到匹配的内容" : "No matching content found")
                            : (language === "zh" ? "暂无内容" : "No content yet")}
                        </p>
                        {(postSearchQuery || postTypeFilter !== "all") && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setPostSearchQuery("");
                              setPostTypeFilter("all");
                            }}
                          >
                            {language === "zh" ? "清除筛选" : "Clear Filters"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 发布/编辑动态对话框 */}
                <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPost ? (language === "zh" ? "编辑内容" : "Edit Content") : (language === "zh" ? "发布新内容" : "Create Post")}</DialogTitle>
                      <DialogDescription>
                        {editingPost 
                          ? (language === "zh" ? "修改内容信息" : "Edit content info")
                          : (language === "zh" ? "发布公告、动态、荣誉或活动预告" : "Post notices, updates, achievements or events")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>{language === "zh" ? "内容类型" : "Content Type"}</Label>
                        <Select
                          value={postForm.type}
                          onValueChange={(value) => setPostForm({ ...postForm, type: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="post">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-blue-500" />
                                {language === "zh" ? "日常动态" : "Post"}
                              </div>
                            </SelectItem>
                            <SelectItem value="notice">
                              <div className="flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-red-500" />
                                {language === "zh" ? "重要公告" : "Notice"}
                              </div>
                            </SelectItem>
                            <SelectItem value="event">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-500" />
                                {language === "zh" ? "活动预告" : "Event"}
                              </div>
                            </SelectItem>
                            <SelectItem value="achievement">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                {language === "zh" ? "荣誉展示" : "Achievement"}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 活动日期选择（仅活动预告类型显示） */}
                      {postForm.type === 'event' && (
                        <div>
                          <Label>{language === "zh" ? "活动日期 *" : "Event Date *"}</Label>
                          <Input
                            type="date"
                            value={postForm.event_date}
                            onChange={(e) => setPostForm({ ...postForm, event_date: e.target.value })}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">{language === "zh" ? "选择活动开始日期，学生端将显示活动状态" : "Select event start date, status will be shown to students"}</p>
                        </div>
                      )}

                      {/* 启用报名开关（仅活动预告类型显示） */}
                      {postForm.type === 'event' && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                              <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={postForm.requires_registration}
                                  onCheckedChange={(checked) => setPostForm({ 
                                    ...postForm, 
                                    requires_registration: checked,
                                    // 如果关闭报名，清空相关设置
                                    ...(checked ? {} : { registration_start: null, registration_end: null, max_participants: '' })
                                  })}
                                />
                                <Label className="font-medium text-gray-900">{language === "zh" ? "启用活动报名" : "Enable Registration"}</Label>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{language === "zh" ? "开启后学生可以报名参加此活动" : "Students can register for this event when enabled"}</p>
                            </div>
                          </div>

                          {/* 报名设置（仅启用报名后显示） */}
                          {postForm.requires_registration && (
                            <div className="space-y-4 pt-4 border-t border-green-200">
                              {/* 报名人数限制 */}
                              <div>
                                <Label className="text-sm font-medium">{language === "zh" ? "报名人数上限 *" : "Max Participants *"}</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={postForm.max_participants}
                                  onChange={(e) => setPostForm({ ...postForm, max_participants: e.target.value })}
                                  placeholder={language === "zh" ? "请输入最大报名人数" : "Enter max participants"}
                                  className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">{language === "zh" ? "设置允许报名的最大人数" : "Set maximum number of participants"}</p>
                              </div>

                              {/* 报名开始时间 */}
                              <div>
                                <Label className="text-sm font-medium">{language === "zh" ? "报名开始时间 *" : "Registration Start *"}</Label>
                                <div className="mt-1">
                                  <DateTimePicker
                                    date={postForm.registration_start}
                                    onDateChange={(date) => setPostForm({ ...postForm, registration_start: date })}
                                    placeholder={language === "zh" ? "选择报名开始时间" : "Select start time"}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{language === "zh" ? "精确到分秒，学生在此时间之后才能报名" : "Exact to seconds, students can register after this time"}</p>
                              </div>

                              {/* 报名结束时间 */}
                              <div>
                                <Label className="text-sm font-medium">{language === "zh" ? "报名结束时间 *" : "Registration End *"}</Label>
                                <div className="mt-1">
                                  <DateTimePicker
                                    date={postForm.registration_end}
                                    onDateChange={(date) => setPostForm({ ...postForm, registration_end: date })}
                                    placeholder={language === "zh" ? "选择报名结束时间" : "Select end time"}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{language === "zh" ? "精确到分秒，学生在此时间之后无法报名" : "Exact to seconds, students cannot register after this time"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <Label>{language === "zh" ? "标题" : "Title"}</Label>
                        <Input
                          value={postForm.title}
                          onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                          placeholder={language === "zh" ? "请输入标题" : "Enter title"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "内容" : "Content"}</Label>
                        <Textarea
                          value={postForm.content}
                          onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                          placeholder={language === "zh" ? "请输入内容..." : "Enter content..."}
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                      <div>
                        <Label>{language === "zh" ? "图片链接（可选）" : "Image URL (Optional)"}</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={postImageInput}
                            onChange={(e) => setPostImageInput(e.target.value)}
                            placeholder={language === "zh" ? "输入图片URL后点击添加" : "Enter image URL and click Add"}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImage();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddImage} variant="outline">
                            {language === "zh" ? "添加" : "Add"}
                          </Button>
                        </div>
                        {postForm.images.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {postForm.images.map((img, i) => (
                              <div key={i} className="relative">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                                <button
                                  onClick={() => handleRemoveImage(i)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={postForm.is_pinned}
                          onCheckedChange={(checked) => setPostForm({ ...postForm, is_pinned: checked })}
                        />
                        <Label>{language === "zh" ? "置顶显示" : "Pin to Top"}</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
                        {language === "zh" ? "取消" : "Cancel"}
                      </Button>
                      <Button 
                        onClick={handleSavePost} 
                        className="bg-gradient-to-r from-blue-700 to-blue-500"
                        disabled={postsLoading}
                      >
                        {postsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {editingPost ? (language === "zh" ? "保存修改" : "Save Changes") : (language === "zh" ? "发布内容" : "Publish")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 删除内容确认对话框 */}
                <Dialog open={isDeletePostDialogOpen} onOpenChange={setIsDeletePostDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        {language === "zh" ? "确认删除内容" : "Confirm Delete"}
                      </DialogTitle>
                      <DialogDescription>
                        {language === "zh" 
                          ? <>您确定要删除 <span className="font-semibold text-gray-900">「{postToDelete?.title}」</span> 吗？<br /><br /><span className="text-red-600">注意：</span> 删除后无法恢复</>
                          : <>Are you sure you want to delete <span className="font-semibold text-gray-900">"{postToDelete?.title}"</span>?<br /><br /><span className="text-red-600">Note:</span> This action cannot be undone</>
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeletePostDialogOpen(false)}>
                        {language === "zh" ? "取消" : "Cancel"}
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleConfirmDeletePost}
                        disabled={postsLoading}
                      >
                        {postsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {language === "zh" ? "确认删除" : "Confirm Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

            {/* 活动报名管理页面 */}
            {activeTab === "eventRegistrations" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "活动报名管理" : "Event Registration Management"}</h1>
                </div>

                {/* 说明卡片 */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{language === "zh" ? "查看和管理活动的报名情况" : "View and manage event registrations"}</p>
                        <p className="text-sm text-gray-500">{language === "zh" ? '点击下方活动列表中的"查看报名"按钮，管理该活动的所有报名信息' : "Click 'View Registration' button to manage all registrations for an event"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 需要报名的活动列表 */}
                {loadingPosts ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.filter(post => post.type === 'event').length === 0 ? (
                      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{language === "zh" ? "暂无活动" : "No Events"}</h3>
                          <p className="text-gray-500">{language === "zh" ? "您还没有发布活动预告，发布活动后才能管理报名" : "You haven't posted any events yet. Create an event to manage registrations."}</p>
                          <Button 
                            className="mt-4 bg-gradient-to-r from-blue-700 to-blue-500"
                            onClick={() => {
                              setActiveTab("posts");
                              openCreatePostDialog();
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {language === "zh" ? "发布活动" : "Create Event"}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      posts.filter(post => post.type === 'event').map((post) => {
                        const registrations = eventRegistrations[post.id] || [];
                        const registeredCount = registrations.filter(r => r.status === 'registered').length;
                        
                        return (
                          <Card key={post.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-green-100 text-green-700">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {language === "zh" ? "活动" : "Event"}
                                    </Badge>
                                    {post.event_date && (
                                      <Badge className={new Date(post.event_date) < new Date() ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}>
                                        {new Date(post.event_date) < new Date() ? (language === "zh" ? "已结束" : "Ended") : `${language === "zh" ? "活动日" : "Event Date"}: ${new Date(post.event_date).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}`}
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {language === "zh" ? "已报名" : "Registered"}: <span className="font-medium text-gray-900">{registeredCount}</span> 
                                      {post.max_participants && ` / ${post.max_participants}`} {language === "zh" ? "人" : "people"}
                                    </span>
                                    {post.requires_registration ? (
                                      <Badge className={post.registration_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                        {post.registration_open ? (language === "zh" ? "报名开启" : "Open") : (language === "zh" ? "报名关闭" : "Closed")}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gray-100 text-gray-500">{language === "zh" ? "无需报名" : "No Registration"}</Badge>
                                    )}
                                    {post.registration_start && post.registration_end && (
                                      <span className="text-xs">
                                        {language === "zh" ? "报名时间" : "Registration"}: {new Date(post.registration_start).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")} ~ {new Date(post.registration_end).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 报名进度条 */}
                                  {post.max_participants && post.requires_registration && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all ${registeredCount >= post.max_participants ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
                                          style={{ 
                                            width: `${Math.min((registeredCount / post.max_participants) * 100, 100)}%` 
                                          }}
                                        />
                                      </div>
                                      {registeredCount >= post.max_participants && (
                                        <Badge className="bg-red-100 text-red-700 text-xs">{language === "zh" ? "已满" : "Full"}</Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {post.requires_registration && (
                                  <Button 
                                    onClick={() => openRegistrationsDialog(post)}
                                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                                  >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    {language === "zh" ? "查看报名" : "View Registration"} ({registeredCount})
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </main>
      </div>

      {/* 评价回复对话框 */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "zh" ? "回复评价" : "Reply to Review"}</DialogTitle>
            <DialogDescription>
              {language === "zh" ? "回复后将显示在评价下方" : "Your reply will be shown below the review"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === "zh" ? "回复内容" : "Reply Content"}</Label>
              <Textarea
                value={replyForm.content}
                onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                placeholder={language === "zh" ? "请输入回复内容..." : "Enter your reply..."}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmitReply} 
              className="bg-gradient-to-r from-blue-700 to-blue-500"
              disabled={reviewsLoading || !replyForm.content.trim()}
            >
              {reviewsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {language === "zh" ? "提交回复" : "Submit Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看全部评价对话框 */}
      <Dialog open={isViewAllReviewsDialogOpen} onOpenChange={setIsViewAllReviewsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "zh" ? "全部评价" : "All Reviews"}</DialogTitle>
            <DialogDescription>
              {language === "zh" ? `共 ${reviews.length} 条评价 · 平均评分 ${reviewStats?.average || "0.0"}` : `${reviews.length} reviews · Average Rating ${reviewStats?.average || "0.0"}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
                        {review.user_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{review.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                  </span>
                </div>
                {review.content && (
                  <p className="mt-2 text-gray-600 text-sm">{review.content}</p>
                )}
                {review.reply ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-xs text-blue-600 font-medium mb-1">
                      {language === "zh" ? "管理员回复" : "Admin Reply"} · {new Date(review.replied_at).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                    </p>
                    <p className="text-sm text-gray-700">{review.reply}</p>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-blue-600"
                    onClick={() => {
                      setIsViewAllReviewsDialogOpen(false);
                      openReplyDialog(review);
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {language === "zh" ? "回复评价" : "Reply"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 活动报名详情对话框 */}
      <Dialog open={isRegistrationsDialogOpen} onOpenChange={setIsRegistrationsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" />
                {selectedEventPost?.title} - {language === "zh" ? "报名管理" : "Registration Management"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshCurrentRegistrations}
                disabled={loadingRegistrations}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingRegistrations ? 'animate-spin' : ''}`} />
                {language === "zh" ? "刷新" : "Refresh"}
              </Button>
            </div>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {language === "zh" ? "已报名" : "Registered"} {(eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length} {language === "zh" ? "人" : "people"}
                {selectedEventPost?.max_participants && ` / ${selectedEventPost.max_participants} ${language === "zh" ? "名额" : "spots"}`}
              </span>
              {selectedEventPost?.registration_start && selectedEventPost?.registration_end && (
                <span className="text-xs">
                  {language === "zh" ? "报名时间" : "Registration"}: {new Date(selectedEventPost.registration_start).toLocaleString(language === "zh" ? "zh-CN" : "en-US")} ~ {new Date(selectedEventPost.registration_end).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 报名进度条 */}
            {selectedEventPost?.requires_registration && selectedEventPost?.max_participants && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{language === "zh" ? "报名进度" : "Registration Progress"}</span>
                  <span className="text-sm font-bold text-green-600">
                    {(eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length} / {selectedEventPost.max_participants}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length >= selectedEventPost.max_participants 
                        ? 'bg-red-500' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    }`}
                    style={{ 
                      width: `${Math.min(
                        ((eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length / selectedEventPost.max_participants) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>
                    {language === "zh" ? "剩余名额" : "Spots Left"}: {Math.max(0, selectedEventPost.max_participants - (eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length)} {language === "zh" ? "个" : ""}
                  </span>
                  <span>
                    {((eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length / selectedEventPost.max_participants * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* 报名数据表格 */}
            {loadingRegistrations ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">{language === "zh" ? "暂无报名记录" : "No Registration Records"}</p>
                <p className="text-gray-400 text-sm">{language === "zh" ? "还没有学生报名此活动" : "No students have registered for this event yet"}</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* 表头 */}
                <div className="bg-gray-100 grid grid-cols-6 gap-2 p-3 font-medium text-sm text-gray-700">
                  <div>#</div>
                  <div>{language === "zh" ? "姓名" : "Name"}</div>
                  <div>{language === "zh" ? "学号" : "Student ID"}</div>
                  <div>{language === "zh" ? "联系方式" : "Contact"}</div>
                  <div>{language === "zh" ? "报名时间" : "Time"}</div>
                  <div>{language === "zh" ? "操作" : "Action"}</div>
                </div>
                {/* 表格内容 */}
                <div className="divide-y">
                  {(eventRegistrations[selectedEventPost?.id] || [])
                    .filter(r => r.status === 'registered')
                    .map((reg, index) => (
                      <div key={reg.id} className="grid grid-cols-6 gap-2 p-3 items-center hover:bg-gray-50">
                        <div className="text-sm text-gray-500">{index + 1}</div>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-green-700 to-green-500 text-white text-xs">
                              {reg.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{reg.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {reg.student_id || reg.profiles?.student_id || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          <div className="flex flex-col gap-1">
                            {reg.phone && <span>📱 {reg.phone}</span>}
                            {reg.email && <span>✉️ {reg.email}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(reg.created_at).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                        </div>
                        <div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteRegistration(reg.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRegistrationsDialogOpen(false)}
            >
              {language === "zh" ? "关闭" : "Close"}
            </Button>
            {(eventRegistrations[selectedEventPost?.id] || []).filter(r => r.status === 'registered').length > 0 && (
              <Button 
                onClick={handleExportRegistrations}
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                {language === "zh" ? "下载报名表 (Excel)" : "Export (Excel)"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAdmin;

