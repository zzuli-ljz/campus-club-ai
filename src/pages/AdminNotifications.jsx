import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  Users,
  LogOut,
  ChevronRight,
  Loader2,
  Inbox,
  UserPlus,
  UserMinus
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useNotificationsContext } from "@/contexts/NotificationContext";
import { useNotifications, NOTIFICATION_TYPES, NOTIFICATION_CONFIG } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";

// 通知类型到图标的映射
const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.NEW_APPLICATION:
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
      );
    case NOTIFICATION_TYPES.NEW_LEAVE_REQUEST:
      return (
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
          <UserMinus className="w-5 h-5 text-orange-600" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          🔔
        </div>
      );
  }
};

// 通知类型到颜色的映射
const getNotificationColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.NEW_APPLICATION:
      return "bg-blue-50 border-blue-200";
    case NOTIFICATION_TYPES.NEW_LEAVE_REQUEST:
      return "bg-orange-50 border-orange-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

const AdminNotifications = () => {
  const { user, profile, isLoggedIn, role } = useUser();
  const { refreshUnreadCount } = useNotificationsContext();
  const { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { language } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [processingIds, setProcessingIds] = useState(new Set());

  // 获取用户通知
  useEffect(() => {
    if (user && profile && isLoggedIn && role === 'club_admin') {
      loadNotifications();
    }
  }, [user, profile, isLoggedIn, role]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // 社团管理员使用特殊ID
      const userId = `club-admin-${profile.club_id}`;
      const result = await getUserNotifications(userId);
      
      if (result.success) {
        // 只显示管理员可见的通知
        const adminNotifications = result.data.filter(n => {
          const config = NOTIFICATION_CONFIG[n.type];
          return config?.adminVisible;
        });
        setNotifications(adminNotifications);
      }
    } catch (err) {
      console.error('加载通知失败:', err);
      toast.error(language === "zh" ? '加载通知失败' : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理单条标记已读
  const handleMarkAsRead = async (id) => {
    if (processingIds.has(id)) return;
    
    setProcessingIds(prev => new Set([...prev, id]));
    try {
      const result = await markAsRead(id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        refreshUnreadCount();
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 处理全部标记已读
  const handleMarkAllAsRead = async () => {
    try {
      const userId = `club-admin-${profile.club_id}`;
      const result = await markAllAsRead(userId);
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        refreshUnreadCount();
        toast.success(language === "zh" ? '已全部标记为已读' : 'All marked as read');
      }
    } catch (err) {
      toast.error(language === "zh" ? '操作失败' : 'Operation failed');
    }
  };

  // 处理删除通知
  const handleDelete = async (id) => {
    if (processingIds.has(id)) return;
    
    setProcessingIds(prev => new Set([...prev, id]));
    try {
      const notification = notifications.find(n => n.id === id);
      const result = await deleteNotification(id);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (!notification?.is_read) {
          refreshUnreadCount();
        }
        toast.success(language === "zh" ? '已删除通知' : 'Notification deleted');
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 根据标签页筛选
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "read") return n.is_read;
    return true;
  });

  // 计算未读数
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // 空状态组件
  const EmptyState = ({ message }) => (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Inbox className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <p className="text-gray-500">{language === "zh" ? "暂无通知消息" : "No notifications"}</p>
      </CardContent>
    </Card>
  );

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

      <Navbar title={language === "zh" ? "社团通知" : "Club Notifications"} />

      <main className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{language === "zh" ? "社团通知" : "Club Notifications"}</h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0 
                      ? (language === "zh" ? `有 ${unreadCount} 条未读通知` : `${unreadCount} unread notifications`)
                      : (language === "zh" ? '暂无未读通知' : 'No unread notifications')}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  {language === "zh" ? "全部已读" : "Mark All Read"}
                </Button>
              )}
            </div>
          </motion.div>

          {/* 提示卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-md bg-blue-50/80 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">{language === "zh" ? "通知说明" : "Notification Info"}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {language === "zh" 
                        ? "这里会显示新成员申请和成员退出申请等信息，请及时处理"
                        : "This shows new member applications and leave requests. Please handle them promptly."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 标签页 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/80 mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  {language === "zh" ? "全部" : "All"}
                  <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  {language === "zh" ? "未读" : "Unread"}
                  {unreadCount > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  {language === "zh" ? "已读" : "Read"}
                </TabsTrigger>
              </TabsList>

              {/* 通知列表 */}
              <TabsContent value={activeTab} className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <EmptyState 
                    message={activeTab === "all" 
                      ? (language === "zh" ? "暂无通知" : "No notifications")
                      : activeTab === "unread" 
                        ? (language === "zh" ? "没有未读通知" : "No unread notifications")
                        : (language === "zh" ? "暂无已读通知" : "No read notifications")} 
                  />
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`border transition-all duration-200 ${
                          notification.is_read 
                            ? 'bg-white/60 backdrop-blur-xl opacity-75' 
                            : `${getNotificationColor(notification.type)} shadow-md`
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* 图标 */}
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* 内容 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className={`font-semibold ${
                                    notification.is_read ? 'text-gray-600' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  {notification.content && (
                                    <p className={`text-sm mt-1 ${
                                      notification.is_read ? 'text-gray-500' : 'text-gray-600'
                                    }`}>
                                      {notification.content}
                                    </p>
                                  )}
                                  
                                  {/* 通知类型标签 */}
                                  {notification.type === NOTIFICATION_TYPES.NEW_APPLICATION && (
                                    <Badge className="mt-2 bg-blue-100 text-blue-700 border-0">
                                      <Users className="w-3 h-3 mr-1" />
                                      {language === "zh" ? "新成员申请" : "New Application"}
                                    </Badge>
                                  )}
                                  {notification.type === NOTIFICATION_TYPES.NEW_LEAVE_REQUEST && (
                                    <Badge className="mt-2 bg-orange-100 text-orange-700 border-0">
                                      <LogOut className="w-3 h-3 mr-1" />
                                      {language === "zh" ? "退出申请" : "Leave Request"}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* 操作按钮 */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={processingIds.has(notification.id)}
                                    >
                                      {processingIds.has(notification.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(notification.id)}
                                    disabled={processingIds.has(notification.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* 时间 */}
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {new Date(notification.created_at).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>

                            {/* 未读指示器 */}
                            {!notification.is_read && (
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* 提示信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-400">
              {language === "zh" 
                ? "通知将显示新成员申请和成员退出申请等信息"
                : "Notifications show new member applications and leave requests"}
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
