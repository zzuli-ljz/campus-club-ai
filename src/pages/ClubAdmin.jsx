
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
  X
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useApplications } from "@/hooks/useApplications";
import { useMembers } from "@/hooks/useMembers";
import { useClubPosts } from "@/hooks/useClubPosts";
import { useClubReviews } from "@/hooks/useClubReviews";
import { useCategoryTags } from "@/hooks/useCategoryTags";
import TagSelector from "@/components/TagSelector";
import Navbar from "@/components/Navbar";

// 动态类型配置
const postTypeConfig = {
  post: { label: '动态', icon: MessageCircle, color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-50' },
  notice: { label: '公告', icon: Megaphone, color: 'bg-red-100 text-red-700', bgColor: 'bg-red-50' },
  event: { label: '活动预告', icon: Calendar, color: 'bg-green-100 text-green-700', bgColor: 'bg-green-50' },
  achievement: { label: '荣誉', icon: Trophy, color: 'bg-yellow-100 text-yellow-700', bgColor: 'bg-yellow-50' },
};

const ClubAdmin = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useUser();
  const { getClubById, updateClub, toggleRecruiting } = useClubs();
  const { getClubApplications, updateApplicationStatus } = useApplications();
  const { getClubMembers, updateMemberRole, removeMember, isLoading: memberLoading } = useMembers();
  const { getClubPosts, createPost, deletePost, isLoading: postsLoading } = useClubPosts();
  const { getClubReviews, getReviewStats, replyToReview, isLoading: reviewsLoading } = useClubReviews();
  const { tagsByCategory, getTagsForCategory, addCustomTag, isLoading: tagsLoading } = useCategoryTags();
  
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
    event_date: ""
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
      loadPosts(profile.club_id);
      loadReviews(profile.club_id);
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
      event_date: ""
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
      event_date: post.event_date || ""
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
      toast.error("请输入标题");
      return;
    }
    if (!postForm.content.trim()) {
      toast.error("请输入内容");
      return;
    }

    // 如果是活动预告类型，验证活动日期
    if (postForm.type === 'event' && !postForm.event_date) {
      toast.error("请选择活动日期");
      return;
    }

    if (!profile?.club_id) {
      toast.error("社团信息缺失");
      return;
    }

    // 构建 postData，包含 author_id（确保转为字符串）
    const postData = {
      club_id: profile.club_id,
      author_id: user?.id ? String(user.id) : '00000000-0000-0000-0000-000000000000',
      author_name: profile?.name || "管理员",
      title: postForm.title,
      content: postForm.content,
      type: postForm.type,
      images: postForm.images,
      is_pinned: postForm.is_pinned,
      event_date: postForm.type === 'event' ? postForm.event_date : null,
    };

    const result = await createPost(postData);

    if (result.success) {
      setIsPostDialogOpen(false);
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
      toast.error("请输入回复内容");
      return;
    }

    if (!replyForm.reviewId) {
      toast.error("评价ID缺失，请重新打开对话框");
      return;
    }

    // 确保有社团ID和管理员名称
    if (!profile?.club_id) {
      toast.error("社团信息缺失，无法提交回复");
      return;
    }

    const result = await replyToReview(
      replyForm.reviewId, 
      replyForm.content.trim(),
      profile?.name || "管理员"
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
    { id: "overview", label: "概览", icon: LayoutDashboard },
    { id: "info", label: "信息管理", icon: Settings },
    { id: "applications", label: "报名审核", icon: FileText },
    { id: "members", label: "成员管理", icon: Users },
    { id: "posts", label: "内容管理", icon: Newspaper },
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

  // 获取动态类型标签
  const getPostTypeBadge = (type) => {
    const config = postTypeConfig[type] || postTypeConfig.post;
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
      return <Badge className="bg-gray-100 text-gray-500">已结束</Badge>;
    } else if (diffDays === 0) {
      return <Badge className="bg-red-100 text-red-600 animate-pulse">正在进行</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-orange-100 text-orange-600">还有 {diffDays} 天</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-600">还有 {diffDays} 天</Badge>;
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
      return <p className="text-center text-gray-500 py-4">暂无评价</p>;
    }

    return (
      <div className="space-y-4">
        {reviews.slice(0, 3).map((review) => (
          <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
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
                  管理员回复 · {new Date(review.replied_at).toLocaleDateString('zh-CN')}
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
                回复评价
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

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
                          <p className="text-sm text-gray-500">内容动态</p>
                          <p className="text-3xl font-bold text-purple-600">{posts.length}</p>
                        </div>
                        <Newspaper className="w-8 h-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">社团评分</p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold text-orange-600">
                              {reviewStats?.average || "0.0"}
                            </p>
                            <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                          </div>
                          <p className="text-xs text-gray-400">{reviewStats?.total || 0} 条评价</p>
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
                        最新评价
                      </CardTitle>
                      {reviews.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setIsViewAllReviewsDialogOpen(true)}>
                          查看全部
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

                {/* 快捷入口 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("posts")}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">发布内容</h3>
                          <p className="text-sm text-gray-500">发布公告、动态、活动预告、荣誉等</p>
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
                        
                        {/* 标签选择器 - 使用 TagSelector 组件 */}
                        <div>
                          <Label>社团标签</Label>
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

            {/* 内容管理页面（动态/公告/荣誉/活动预告） */}
            {activeTab === "posts" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                    onClick={openCreatePostDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    发布内容
                  </Button>
                </div>

                {/* 搜索和筛选工具栏 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索标题或内容..."
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="内容类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="post">日常动态</SelectItem>
                      <SelectItem value="notice">重要公告</SelectItem>
                      <SelectItem value="event">活动预告</SelectItem>
                      <SelectItem value="achievement">荣誉展示</SelectItem>
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
                                    置顶
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
                                  <span className="text-gray-600">活动日期：{new Date(post.event_date).toLocaleDateString('zh-CN')}</span>
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
                                编辑
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openDeletePostDialog(post)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                删除
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
                          {postSearchQuery || postTypeFilter !== "all" ? "没有找到匹配的内容" : "暂无内容"}
                        </p>
                        {(postSearchQuery || postTypeFilter !== "all") && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setPostSearchQuery("");
                              setPostTypeFilter("all");
                            }}
                          >
                            清除筛选
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
                      <DialogTitle>{editingPost ? "编辑内容" : "发布新内容"}</DialogTitle>
                      <DialogDescription>
                        {editingPost ? "修改内容信息" : "发布公告、动态、荣誉或活动预告"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>内容类型</Label>
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
                                日常动态
                              </div>
                            </SelectItem>
                            <SelectItem value="notice">
                              <div className="flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-red-500" />
                                重要公告
                              </div>
                            </SelectItem>
                            <SelectItem value="event">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-500" />
                                活动预告
                              </div>
                            </SelectItem>
                            <SelectItem value="achievement">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                荣誉展示
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 活动日期选择（仅活动预告类型显示） */}
                      {postForm.type === 'event' && (
                        <div>
                          <Label>活动日期 *</Label>
                          <Input
                            type="date"
                            value={postForm.event_date}
                            onChange={(e) => setPostForm({ ...postForm, event_date: e.target.value })}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">选择活动开始日期，学生端将显示活动状态</p>
                        </div>
                      )}
                      
                      <div>
                        <Label>标题</Label>
                        <Input
                          value={postForm.title}
                          onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                          placeholder="请输入标题"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>内容</Label>
                        <Textarea
                          value={postForm.content}
                          onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                          placeholder="请输入内容..."
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                      <div>
                        <Label>图片链接（可选）</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={postImageInput}
                            onChange={(e) => setPostImageInput(e.target.value)}
                            placeholder="输入图片URL后点击添加"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImage();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddImage} variant="outline">
                            添加
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
                        <Label>置顶显示</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
                        取消
                      </Button>
                      <Button 
                        onClick={handleSavePost} 
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                        disabled={postsLoading}
                      >
                        {postsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {editingPost ? "保存修改" : "发布内容"}
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
                        确认删除内容
                      </DialogTitle>
                      <DialogDescription>
                        您确定要删除 <span className="font-semibold text-gray-900">「{postToDelete?.title}」</span> 吗？
                        <br /><br />
                        <span className="text-red-600">注意：</span> 删除后无法恢复
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeletePostDialogOpen(false)}>
                        取消
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleConfirmDeletePost}
                        disabled={postsLoading}
                      >
                        {postsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        确认删除
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

          </div>
        </main>
      </div>

      {/* 评价回复对话框 */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>回复评价</DialogTitle>
            <DialogDescription>
              回复后将显示在评价下方
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>回复内容</Label>
              <Textarea
                value={replyForm.content}
                onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                placeholder="请输入回复内容..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSubmitReply} 
              className="bg-gradient-to-r from-blue-500 to-purple-600"
              disabled={reviewsLoading || !replyForm.content.trim()}
            >
              {reviewsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              提交回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看全部评价对话框 */}
      <Dialog open={isViewAllReviewsDialogOpen} onOpenChange={setIsViewAllReviewsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>全部评价</DialogTitle>
            <DialogDescription>
              共 {reviews.length} 条评价 · 平均评分 {reviewStats?.average || "0.0"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
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
                      管理员回复 · {new Date(review.replied_at).toLocaleDateString('zh-CN')}
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
                    回复评价
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAdmin;

