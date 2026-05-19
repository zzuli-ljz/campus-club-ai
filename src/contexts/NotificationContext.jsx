import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationContext = createContext(null);

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationsContext must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, profile, isLoggedIn } = useUser();
  const { getUnreadCount } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 获取未读通知数
  const refreshUnreadCount = useCallback(async () => {
    if (!user || !profile) return;
    
    // 根据用户角色构建userId
    let userId = user.id;
    if (profile.role === 'club_admin') {
      // 社团管理员使用特殊ID
      userId = `club-admin-${profile.club_id}`;
    }

    const result = await getUnreadCount(userId);
    if (result.success) {
      setUnreadCount(result.count);
    }
  }, [user, profile, getUnreadCount]);

  // 初始加载和用户变化时刷新
  useEffect(() => {
    if (isLoggedIn && profile) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isLoggedIn, profile, refreshUnreadCount]);

  // 监听实时通知变化（可选，如果Supabase配置了实时功能）
  useEffect(() => {
    if (!user || !profile) return;

    // 使用具体值而非对象引用，避免每次引用变化导致订阅重复创建
    const userId = profile.role === 'club_admin' ? `club-admin-${profile.club_id}` : user.id;

    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  // 使用具体值作为依赖项，避免对象引用变化导致订阅泄漏
  }, [user?.id, profile?.role, profile?.club_id, refreshUnreadCount]);

  const value = {
    unreadCount,
    refreshUnreadCount,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
