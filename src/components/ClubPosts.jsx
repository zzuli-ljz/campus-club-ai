import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Eye, 
  MessageCircle, 
  Pin, 
  Trophy, 
  Calendar, 
  Megaphone,
  Image as ImageIcon,
  Loader2,
  X,
  ZoomIn,
  ClipboardList,
  UserCheck,
  Clock,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useClubPosts } from '@/hooks/useClubPosts';
import { useEventRegistrations } from '@/hooks/useEventRegistrations';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';

const ClubPosts = ({ clubId, showCreate = false }) => {
  const { user, profile, isLoggedIn } = useUser();
  const { language } = useLanguage();
  const { getClubPosts, likePost, incrementViews, isLoading } = useClubPosts();
  const { canRegister, getUserRegistration, registerForEvent, cancelRegistration, getRegistrationStats } = useEventRegistrations();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const typeConfig = {
    post: { label: language === "zh" ? '动态' : 'Posts', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
    notice: { label: language === "zh" ? '公告' : 'Announcements', icon: Megaphone, color: 'bg-red-100 text-red-700' },
    event: { label: language === "zh" ? '活动' : 'Events', icon: Calendar, color: 'bg-green-100 text-green-700' },
    achievement: { label: language === "zh" ? '荣誉' : 'Achievements', icon: Trophy, color: 'bg-yellow-100 text-yellow-700' },
  };
  
  // 报名相关状态
  const [registrationPost, setRegistrationPost] = useState(null);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [canRegisterStatus, setCanRegisterStatus] = useState(null);
  const [registrationStats, setRegistrationStats] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: ''
  });
  const [isMember, setIsMember] = useState(false);
  
  // 页面级别的报名统计 Map（用于显示所有活动的进度条）
  const [registrationStatsMap, setRegistrationStatsMap] = useState({});
  
  // 用户报名状态 Map（用于在卡片上显示用户是否已报名）
  const [userRegistrationMap, setUserRegistrationMap] = useState({});

  useEffect(() => {
    if (clubId) {
      loadPosts();
    }
  }, [clubId, filter]);

  // 实时订阅 event_registrations 表的变化
  useEffect(() => {
    if (!clubId) return;

    let subscription;
    let supabaseClient = null;

    const setupSubscription = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      supabaseClient = supabase; // 保存引用以便 cleanup 使用
      
      subscription = supabase
        .channel('event_registrations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_registrations'
          },
          (payload) => {
            console.log(language === "zh" ? '检测到报名数据变化:' : 'Detected registration data change:', payload);
            
            // 获取变化涉及的 post_id
            let affectedPostId;
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              affectedPostId = payload.new?.post_id;
            } else if (payload.eventType === 'DELETE') {
              affectedPostId = payload.old?.post_id;
            }

            if (affectedPostId) {
              // 刷新报名统计
              refreshRegistrationStats(affectedPostId);
              
              // 如果是当前用户相关的变化，刷新用户报名状态
              if (user && (payload.new?.user_id === user.id || payload.old?.user_id === user.id)) {
                refreshUserRegistrationStatus(affectedPostId);
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription && supabaseClient) {
        supabaseClient.removeChannel(subscription);
      }
    };
  // 使用具体值而非对象引用，避免订阅泄漏
  }, [clubId, user?.id]);

  // 刷新单个活动的报名统计
  const refreshRegistrationStats = async (postId) => {
    try {
      const statsResult = await getRegistrationStats(postId);
      if (statsResult.success) {
        setRegistrationStatsMap(prev => ({
          ...prev,
          [postId]: statsResult.data
        }));
      }
    } catch (err) {
      console.error(language === "zh" ? '刷新报名统计失败:' : 'Failed to refresh registration stats:', err);
    }
  };

  // 刷新用户的报名状态
  const refreshUserRegistrationStatus = async (postId) => {
    if (!user) return;
    try {
      const statusResult = await getUserRegistration(postId, user.id);
      if (statusResult.success) {
        setUserRegistrationMap(prev => ({
          ...prev,
          [postId]: statusResult.data
        }));
      }
    } catch (err) {
      console.error(language === "zh" ? '刷新用户报名状态失败:' : 'Failed to refresh user registration status:', err);
    }
  };

  // 检查用户是否是社团成员
  const checkMembershipStatus = async () => {
    if (!user || !clubId) return false;
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('club_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .eq('status', 'active')
        .single();
      return !!data;
    } catch (err) {
      console.error(language === "zh" ? '检查成员状态失败:' : 'Failed to check member status:', err);
      return false;
    }
  };

  useEffect(() => {
    if (isLoggedIn && clubId) {
      checkMembershipStatus().then(setIsMember);
    } else {
      setIsMember(false);
    }
  }, [isLoggedIn, user, clubId]);

  // 当用户登录状态变化时，重新加载用户报名状态
  useEffect(() => {
    if (isLoggedIn && user && posts.length > 0) {
      const eventPosts = posts.filter(p => p.type === 'event' && p.requires_registration && p.max_participants);
      if (eventPosts.length > 0) {
        loadAllRegistrationStats(posts);
      }
    } else if (!isLoggedIn) {
      setUserRegistrationMap({});
    }
  }, [isLoggedIn, user]);

  // 加载报名状态
  const loadRegistrationStatus = async (post) => {
    if (!user || !post.requires_registration) return;
    
    try {
      // 获取用户报名状态
      const statusResult = await getUserRegistration(post.id, user.id);
      if (statusResult.success) {
        setRegistrationStatus(statusResult.data);
      }
      
      // 获取报名统计
      const statsResult = await getRegistrationStats(post.id);
      if (statsResult.success) {
        setRegistrationStats(statsResult.data);
      }
      
      // 检查是否可以报名
      const canResult = await canRegister(post.id);
      setCanRegisterStatus(canResult);
    } catch (err) {
      console.error(language === "zh" ? '加载报名状态失败:' : 'Failed to load registration status:', err);
    }
  };

  // 打开报名对话框
  const openRegistrationDialog = async (post) => {
    if (!isLoggedIn) {
      toast.error(language === "zh" ? "请先登录后再进行操作" : "Please login to continue");
      return;
    }
    
    if (!isMember) {
      toast.error(language === "zh" ? "只有社团成员才能报名参加活动" : "Only club members can register for events");
      return;
    }
    
    setRegistrationPost(post);
    setRegistrationForm({
      name: profile?.name || '',
      student_id: profile?.student_id || '',
      email: profile?.email || '',
      phone: ''
    });
    await loadRegistrationStatus(post);
    setIsRegistrationDialogOpen(true);
  };

  // 提交报名
  const handleRegister = async () => {
    if (!registrationForm.name.trim()) {
      toast.error(language === "zh" ? "请输入姓名" : "Please enter your name");
      return;
    }
    if (!registrationForm.student_id.trim()) {
      toast.error(language === "zh" ? "请输入学号" : "Please enter your student ID");
      return;
    }
    
    setIsRegistering(true);
    try {
      const result = await registerForEvent(
        registrationPost.id,
        registrationPost.club_id,
        user.id,
        registrationForm
      );
      
      if (result.success) {
        // 先刷新报名统计，更新页面级别的 statsMap
        const statsResult = await getRegistrationStats(registrationPost.id);
        if (statsResult.success) {
          setRegistrationStatsMap(prev => ({
            ...prev,
            [registrationPost.id]: statsResult.data
          }));
        }
        
        // 刷新用户报名状态
        const statusResult = await getUserRegistration(registrationPost.id, user.id);
        if (statusResult.success) {
          setUserRegistrationMap(prev => ({
            ...prev,
            [registrationPost.id]: statusResult.data
          }));
        }
        
        // 刷新帖子列表
        loadPosts();
        setIsRegistrationDialogOpen(false);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // 取消报名
  const handleCancelRegistration = async () => {
    if (!confirm(language === "zh" ? "确定要取消报名吗？" : "Are you sure you want to cancel registration?")) return;
    
    setIsRegistering(true);
    try {
      const result = await cancelRegistration(registrationPost.id, user.id);
      if (result.success) {
        // 刷新报名统计，更新页面级别的 statsMap
        const statsResult = await getRegistrationStats(registrationPost.id);
        if (statsResult.success) {
          setRegistrationStatsMap(prev => ({
            ...prev,
            [registrationPost.id]: statsResult.data
          }));
        }
        
        // 刷新用户报名状态（设置为 null 表示未报名）
        const statusResult = await getUserRegistration(registrationPost.id, user.id);
        setUserRegistrationMap(prev => ({
          ...prev,
          [registrationPost.id]: statusResult.success ? statusResult.data : null
        }));
        
        setIsRegistrationDialogOpen(false);
        loadPosts();
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const loadPosts = async () => {
    setError(null);
    try {
      const options = filter !== 'all' ? { type: filter } : {};
      // 确保 clubId 是数字类型
      const clubIdNum = typeof clubId === 'string' ? parseInt(clubId, 10) : clubId;
      const result = await getClubPosts(clubIdNum, options);
      if (result.success) {
        setPosts(result.data);
        // 加载完成后，为所有需要报名的活动获取报名统计和用户报名状态
        loadAllRegistrationStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(language === "zh" ? '加载动态失败:' : 'Failed to load posts:', err);
      setError(err.message);
    }
  };

  // 加载所有需要报名的活动的报名统计和用户报名状态
  const loadAllRegistrationStats = async (postsData) => {
    try {
      const eventPosts = postsData.filter(p => p.type === 'event' && p.requires_registration && p.max_participants);
      
      // 批量获取报名统计
      const statsPromises = eventPosts.map(async (post) => {
        const statsResult = await getRegistrationStats(post.id);
        return {
          postId: post.id,
          stats: statsResult.success ? statsResult.data : null
        };
      });
      
      // 批量获取用户报名状态（如果已登录）
      const userStatusPromises = user ? eventPosts.map(async (post) => {
        const statusResult = await getUserRegistration(post.id, user.id);
        return {
          postId: post.id,
          status: statusResult.success ? statusResult.data : null
        };
      }) : Promise.resolve([]);

      const [statsResults, userStatusResults] = await Promise.all([
        Promise.all(statsPromises),
        Promise.all(userStatusPromises)
      ]);
      
      const newStatsMap = {};
      statsResults.forEach(({ postId, stats }) => {
        if (stats) {
          newStatsMap[postId] = stats;
        }
      });
      
      const newUserStatusMap = {};
      userStatusResults.forEach(({ postId, status }) => {
        newUserStatusMap[postId] = status;
      });
      
      setRegistrationStatsMap(prev => ({ ...prev, ...newStatsMap }));
      setUserRegistrationMap(prev => ({ ...prev, ...newUserStatusMap }));
    } catch (err) {
      console.error(language === "zh" ? '加载报名统计失败:' : 'Failed to load registration stats:', err);
    }
  };

  const handleLike = async (postId) => {
    const result = await likePost(postId);
    if (result.success) {
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    }
  };

  // 计算活动状态
  const getEventStatus = (eventDate) => {
    if (!eventDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: language === "zh" ? '已结束' : 'Ended', color: 'bg-gray-100 text-gray-500', icon: null };
    } else if (diffDays === 0) {
      return { text: language === "zh" ? '正在进行' : 'In Progress', color: 'bg-red-500 text-white', icon: 'pulse', animate: true };
    } else if (diffDays === 1) {
      return { text: language === "zh" ? '明天开始' : 'Starts Tomorrow', color: 'bg-orange-100 text-orange-600', icon: null };
    } else if (diffDays <= 3) {
      return { text: language === "zh" ? `还有 ${diffDays} 天` : `${diffDays} days left`, color: 'bg-orange-100 text-orange-600', icon: null };
    } else {
      return { text: language === "zh" ? `还有 ${diffDays} 天` : `${diffDays} days left`, color: 'bg-green-100 text-green-600', icon: null };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <p className="text-red-500 mb-2">{language === "zh" ? "加载失败" : "Failed to load"}</p>
        <p className="text-sm text-gray-400">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadPosts}>
          {language === "zh" ? "重试" : "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选标签 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {language === "zh" ? "全部" : "All"}
        </button>
        {Object.entries(typeConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              filter === key 
                ? config.color.replace('bg-', 'bg-opacity-100 bg-') + ' ring-2 ring-offset-1 ring-gray-300'
                : config.color.replace('text-', 'bg-gray-100 text-')
            }`}
          >
            <config.icon className="w-3 h-3" />
            {config.label}
          </button>
        ))}
      </div>

      {/* 动态列表 */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post, index) => {
            const TypeIcon = typeConfig[post.type]?.icon || MessageCircle;
            const typeColor = typeConfig[post.type]?.color || 'bg-gray-100 text-gray-700';
            
            // 如果是活动类型，计算活动状态
            const eventStatus = post.type === 'event' && post.event_date ? getEventStatus(post.event_date) : null;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => incrementViews(post.id)}
              >
                <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${post.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}>
                  <CardContent className="p-5">
                    {/* 头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={typeColor}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[post.type]?.label || (language === "zh" ? '动态' : 'Post')}
                        </Badge>
                        
                        {/* 活动状态标签 */}
                        {eventStatus && (
                          <Badge className={`${eventStatus.color} ${eventStatus.animate ? 'animate-pulse' : ''}`}>
                            {eventStatus.text}
                          </Badge>
                        )}
                        
                        {post.is_pinned && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Pin className="w-3 h-3 mr-1" />
                            {language === "zh" ? "置顶" : "Pinned"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>

                    {/* 内容 */}
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{post.title}</h4>
                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3 whitespace-pre-line">{post.content}</p>

                    {/* 活动日期显示 */}
                    {post.type === 'event' && post.event_date && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          {language === "zh" ? "活动时间：" : "Event Time:"}{new Date(post.event_date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    {/* 报名入口显示（仅活动类型且需要报名时显示） */}
                    {post.type === 'event' && post.requires_registration && post.registration_open && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                              <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              {userRegistrationMap[post.id]?.status === 'registered' ? (
                                <p className="font-medium text-green-700">{language === "zh" ? "您已报名此活动" : "You are registered for this event"}</p>
                              ) : (
                                <p className="font-medium text-gray-900">{language === "zh" ? "活动报名已开启" : "Registration is open"}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                {post.registration_start && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {language === "zh" ? "报名时间：" : "Registration Time:"}{new Date(post.registration_start).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {post.registration_end && (
                                  <span>~ {new Date(post.registration_end).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {userRegistrationMap[post.id]?.status === 'registered' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRegistrationDialog(post);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {language === "zh" ? "查看报名" : "View Registration"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRegistrationDialog(post);
                              }}
                            >
                              <ClipboardList className="w-4 h-4 mr-1" />
                              {language === "zh" ? "立即报名" : "Register Now"}
                            </Button>
                          )}
                        </div>
                        {post.max_participants && registrationStatsMap[post.id] && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  registrationStatsMap[post.id].registeredCount >= post.max_participants 
                                    ? 'bg-red-500' 
                                    : 'bg-gradient-to-r from-green-500 to-green-400'
                                }`}
                                style={{ 
                                  width: `${Math.min((registrationStatsMap[post.id].registeredCount / post.max_participants) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {registrationStatsMap[post.id].registeredCount} / {post.max_participants} {language === "zh" ? "名额" : "spots"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 报名已关闭提示 */}
                    {post.type === 'event' && post.requires_registration && !post.registration_open && (
                      <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{language === "zh" ? "报名入口已关闭" : "Registration Closed"}</span>
                        </div>
                      </div>
                    )}

                    {/* 图片预览 */}
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {post.images.slice(0, 3).map((img, i) => (
                          <div 
                            key={i} 
                            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(img);
                              setSelectedImageIndex(i);
                            }}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        ))}
                        {post.images.length > 3 && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                            <span className="text-sm">+{post.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 底部统计 */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        {post.likes || 0}
                      </button>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">{language === "zh" ? "暂无动态" : "No Posts Yet"}</p>
            <p className="text-sm text-gray-400">{language === "zh" ? "社团管理员发布的内容将显示在这里" : "Content posted by club admins will appear here"}</p>
          </div>
        )}
      </div>

      {/* 图片放大查看弹窗 */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="absolute inset-0 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={selectedImage}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {language === "zh" ? "点击外部区域或右上角关闭" : "Click outside or top right to close"}
          </div>
        </motion.div>
      )}

      {/* 活动报名对话框 */}
      <Dialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              {language === "zh" ? "活动报名" : "Event Registration"}
            </DialogTitle>
            <DialogDescription>
              {registrationPost?.title}
            </DialogDescription>
          </DialogHeader>
          
          {/* 报名状态提示 */}
          {registrationStatus?.status === 'registered' ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{language === "zh" ? "您已成功报名此活动" : "You have successfully registered"}</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  {language === "zh" ? "报名时间：" : "Registration Time:"}{new Date(registrationStatus.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{language === "zh" ? "您的报名信息" : "Your Registration Info"}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === "zh" ? "姓名" : "Name"}</span>
                    <span className="text-gray-900">{registrationStatus.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === "zh" ? "学号" : "Student ID"}</span>
                    <span className="text-gray-900">{registrationStatus.student_id}</span>
                  </div>
                  {registrationStatus.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{language === "zh" ? "邮箱" : "Email"}</span>
                      <span className="text-gray-900">{registrationStatus.email}</span>
                    </div>
                  )}
                  {registrationStatus.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{language === "zh" ? "联系电话" : "Phone"}</span>
                      <span className="text-gray-900">{registrationStatus.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsRegistrationDialogOpen(false)}
                >
                  {language === "zh" ? "关闭" : "Close"}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelRegistration}
                  disabled={isRegistering}
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {language === "zh" ? "取消报名" : "Cancel Registration"}
                </Button>
              </div>
            </div>
          ) : canRegisterStatus && !canRegisterStatus.canRegister ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{language === "zh" ? "暂不可报名" : "Registration Not Available"}</span>
                </div>
                <p className="text-sm text-amber-600 mt-2">
                  {canRegisterStatus.reason}
                </p>
              </div>
              {registrationPost?.registration_start && registrationPost?.registration_end && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{language === "zh" ? "报名时间" : "Registration Time"}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(registrationPost.registration_start).toLocaleString('zh-CN')}
                    {' ~ '}
                    {new Date(registrationPost.registration_end).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsRegistrationDialogOpen(false)}
              >
                {language === "zh" ? "关闭" : "Close"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 报名信息提示 */}
              {registrationPost?.registration_start && registrationPost?.registration_end && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      报名时间：{new Date(registrationPost.registration_start).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' ~ '}
                      {new Date(registrationPost.registration_end).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
              
              {registrationPost?.max_participants && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{language === "zh" ? "限制报名人数：" : "Max Participants: "}{registrationPost.max_participants} {language === "zh" ? "人" : "people"}</span>
                  </div>
                </div>
              )}

              {/* 报名表单 */}
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="reg-name">{language === "zh" ? "姓名 *" : "Name *"}</Label>
                  <Input
                    id="reg-name"
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                    placeholder={language === "zh" ? "请输入您的姓名" : "Please enter your name"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-student-id">{language === "zh" ? "学号 *" : "Student ID *"}</Label>
                  <Input
                    id="reg-student-id"
                    value={registrationForm.student_id}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, student_id: e.target.value })}
                    placeholder={language === "zh" ? "请输入您的学号" : "Please enter your student ID"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">{language === "zh" ? "邮箱" : "Email"}</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                    placeholder={language === "zh" ? "请输入您的邮箱（选填）" : "Please enter your email (optional)"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-phone">{language === "zh" ? "联系电话" : "Phone"}</Label>
                  <Input
                    id="reg-phone"
                    value={registrationForm.phone}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                    placeholder={language === "zh" ? "请输入您的联系电话（选填）" : "Please enter your phone (optional)"}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsRegistrationDialogOpen(false)}
                  disabled={isRegistering}
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {language === "zh" ? "确认报名" : "Confirm Registration"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubPosts;
