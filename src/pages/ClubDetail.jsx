import { useState, useEffect, useRef } from "react";
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
  Activity,
  LogOut,
  Loader2,
  HourglassIcon,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Copy, Download, Image as ImageIcon } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useClubs } from "@/hooks/useClubs";
import { useFavorites } from "@/hooks/useFavorites";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ClubReviews from "@/components/ClubReviews";
import ClubPosts from "@/components/ClubPosts";
import Navbar from "@/components/Navbar";

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const { getClubById } = useClubs();
  const { addFavorite, removeFavorite, checkIsFavorite } = useFavorites();
  const { submitLeaveRequest, getUserLeaveRequests, isLoading: leaveLoading } = useLeaveRequests();
  const { language } = useLanguage();
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingLeave, setHasPendingLeave] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  
  // 退出申请对话框
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  // 分享弹窗
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [customPosterImageUrl, setCustomPosterImageUrl] = useState("");
  const posterRef = useRef(null);

  useEffect(() => {
    loadClubData();
  }, [id]);

  useEffect(() => {
    if (isLoggedIn && club && user) {
      checkFavoriteStatus();
      checkMembershipStatus();
      checkLeaveRequestStatus();
    }
  }, [isLoggedIn, club, user]);

  // 检查用户是否是该社团成员
  const checkMembershipStatus = async () => {
    if (!user || !club) return;
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('club_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('club_id', club.id)
        .eq('status', 'active')
        .single();
      
      setIsMember(!!data);
    } catch (err) {
      console.error('检查成员状态失败:', err);
      setIsMember(false);
    }
  };

  // 检查是否有待处理的退出申请
  const checkLeaveRequestStatus = async () => {
    if (!user) return;
    try {
      const result = await getUserLeaveRequests(user.id);
      if (result.success) {
        const pending = result.data.some(
          req => req.club_id === parseInt(id) && req.status === 'pending'
        );
        setHasPendingLeave(pending);
      }
    } catch (err) {
      console.error('检查退出申请状态失败:', err);
    }
  };

  const loadClubData = async () => {
    setLoading(true);
    const data = await getClubById(id);
    if (data) {
      setClub(data);
    } else {
      toast.error(language === "zh" ? "社团不存在" : "Club not found");
      navigate("/clubs");
    }
    setLoading(false);
  };

  // 获取分享链接（使用 HashRouter，需要加 #/）
  const getShareUrl = () => {
    return `${window.location.origin}/#/clubs/${id}`;
  };

  // 获取海报图片 URL（优先使用自定义图片）
  const getPosterImageUrl = () => {
    if (customPosterImageUrl && customPosterImageUrl.trim()) {
      return customPosterImageUrl.trim();
    }
    return club?.image || `https://picsum.photos/seed/${encodeURIComponent(club?.name || club?.id)}/320/160`;
  };

  // 生成海报
  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    
    setIsGeneratingPoster(true);
    try {
      // 确保图片加载完成后再生成
      const img = posterRef.current.querySelector('img');
      if (img && !img.complete) {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = resolve; // 即使失败也继续
          setTimeout(resolve, 2000); // 超时2秒后继续
        });
      }

      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        // 忽略跨域图片错误
        imagePlaceholder: undefined
      });
      
      const link = document.createElement("a");
      link.download = `${club?.name || "club"}-poster.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success(language === "zh" ? "海报已保存" : "Poster saved");
      setIsShareDialogOpen(false);
    } catch (err) {
      console.error("生成海报失败:", err);
      toast.error(language === "zh" ? "生成海报失败，请重试" : "Failed to generate poster, please try again");
    } finally {
      setIsGeneratingPoster(false);
    }
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
      toast.error(language === "zh" ? "请先登录后再进行操作" : "Please login to continue");
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
      toast.error(language === "zh" ? "请先登录后再进行操作" : "Please login to continue");
      navigate("/login");
      return;
    }
    navigate("/application", { state: { club } });
  };

  // 打开退出申请对话框
  const handleOpenLeaveDialog = () => {
    if (!isLoggedIn) {
      toast.error(language === "zh" ? "请先登录后再进行操作" : "Please login to continue");
      navigate("/login");
      return;
    }
    setLeaveReason("");
    setIsLeaveDialogOpen(true);
  };

  // 提交退出申请
  const handleSubmitLeave = async () => {
    const result = await submitLeaveRequest(club.id, leaveReason);
    if (result.success) {
      setIsLeaveDialogOpen(false);
      setHasPendingLeave(true);
    }
  };

  const categoryColors = {
    "学术科技": "bg-blue-100 text-blue-700",
    "文艺创作": "bg-blue-100 text-blue-700",
    "体育运动": "bg-orange-100 text-orange-700",
    "公益实践": "bg-green-100 text-green-700",
    "技术工程": "bg-blue-100 text-blue-700"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50 pt-24 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!club) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-slate-50">
      <Navbar showBack={true} backText={language === "zh" ? "返回社团列表" : "Back to Club List"} />

      {/* Hero 区域 */}
      <div className="relative pt-20">
        <div className="relative h-64 md:h-80 overflow-hidden">
          {club.image ? (
            <img 
              src={club.image}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-6xl font-bold text-white/30">{club.name?.[0] || '社'}</span>
            </div>
          )}
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
                  {club.members || 0}{language === "zh" ? " 位成员" : " members"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {club.location || (language === "zh" ? "待定" : "TBD")}
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
          {isMember ? (
            hasPendingLeave ? (
              <Button 
                className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white h-12"
                disabled
              >
                <HourglassIcon className="w-5 h-5 mr-2" />
                {language === "zh" ? "退出申请审核中" : "Leave Request Pending"}
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white h-12"
                onClick={handleOpenLeaveDialog}
              >
                <LogOut className="w-5 h-5 mr-2" />
                {language === "zh" ? "申请退出社团" : "Apply to Leave"}
              </Button>
            )
          ) : (
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white h-12"
              onClick={handleApply}
            >
              {language === "zh" ? "申请加入" : "Apply to Join"}
            </Button>
          )}
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
            onClick={() => setIsShareDialogOpen(true)}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* 标签页内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {language === "zh" ? "社团介绍" : "Club Info"}
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {language === "zh" ? "社团动态" : "Posts"}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {language === "zh" ? "成员评价" : "Reviews"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* 基本信息卡片 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{language === "zh" ? "关于我们" : "About Us"}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {club.description || (language === "zh" ? "暂无社团介绍" : "No club description")}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">{language === "zh" ? "成立时间" : "Founded"}</p>
                      <p className="font-medium text-gray-900">{club.founded || (language === "zh" ? "未设置" : "Not set")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">{language === "zh" ? "社长" : "President"}</p>
                      <p className="font-medium text-gray-900">{club.president || (language === "zh" ? "未设置" : "Not set")}</p>
                    </div>
                  </div>
                </div>

                {club.tags && club.tags.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-3">{language === "zh" ? "社团标签" : "Club Tags"}</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{language === "zh" ? "联系方式" : "Contact Info"}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{club.location || (language === "zh" ? "待定" : "TBD")}</span>
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
            <ClubReviews key={`reviews-${club.id}`} clubId={club.id} />
          </TabsContent>
        </Tabs>
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
                ? `您确定要申请退出「${club?.name}」吗？申请提交后将由社团管理员审核。`
                : `Are you sure you want to leave ${club?.name}? Your request will be reviewed by the club admin.`}
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

      {/* 分享弹窗 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-500" />
              {language === "zh" ? "分享社团" : "Share Club"}
            </DialogTitle>
            <DialogDescription>
              {language === "zh" ? "选择分享方式" : "Choose how to share"}
            </DialogDescription>
          </DialogHeader>
          
          {/* 海报预览（隐藏，用于生成图片） */}
          <div className="absolute left-[-9999px] top-0">
            <div 
              ref={posterRef}
              className="w-80 bg-white rounded-2xl overflow-hidden shadow-2xl"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* 顶部图片区域 */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={getPosterImageUrl()}
                  alt={club?.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => { e.target.src = `https://picsum.photos/320/160?random=${club?.id}`; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full mb-2">
                    {club?.category}
                  </span>
                  <h3 className="text-xl font-bold text-white drop-shadow-lg">{club?.name}</h3>
                </div>
              </div>
              
              {/* 描述区域 */}
              <div className="px-4 py-3">
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {club?.description || (language === "zh" ? "欢迎加入我们！" : "Welcome to join us!")}
                </p>
              </div>
              
              {/* 二维码区域 */}
              <div className="px-4 pb-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <QRCodeSVG value={getShareUrl()} size={80} level="H" includeMargin={true} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === "zh" ? "扫码查看社团详情" : "Scan for club details"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {language === "zh" ? "长按识别二维码" : "Press and hold to scan"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 py-4">
            {/* 链接文本框 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {language === "zh" ? "分享链接" : "Share Link"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 自定义海报图片 URL */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {language === "zh" ? "海报图片 URL（可选）" : "Poster Image URL (Optional)"}
              </p>
              <input
                type="text"
                value={customPosterImageUrl}
                onChange={(e) => setCustomPosterImageUrl(e.target.value)}
                placeholder={language === "zh" ? "输入自定义图片 URL" : "Enter custom image URL"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === "zh" ? "留空则使用社团默认封面图片" : "Leave empty to use club's default cover image"}
              </p>
              {/* 图片预览 */}
              {customPosterImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={customPosterImageUrl}
                    alt={language === "zh" ? "海报预览" : "Poster Preview"}
                    className="w-full h-20 object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 text-left"
              onClick={handleGeneratePoster}
              disabled={isGeneratingPoster}
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                {isGeneratingPoster ? (
                  <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isGeneratingPoster 
                    ? (language === "zh" ? "生成中..." : "Generating...")
                    : (language === "zh" ? "生成海报" : "Generate Poster")}
                </p>
                <p className="text-xs text-gray-500">
                  {language === "zh" ? "带二维码的宣传海报" : "Poster with QR code"}
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubDetail;
