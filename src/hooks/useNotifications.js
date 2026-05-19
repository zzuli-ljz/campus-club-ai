import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// 通知类型常量
export const NOTIFICATION_TYPES = {
  // 学生端通知
  APPLICATION_APPROVED: 'application_approved',      // 申请成功
  APPLICATION_REJECTED: 'application_rejected',    // 申请失败
  LEAVE_APPROVED: 'leave_approved',               // 退出成功
  LEAVE_REJECTED: 'leave_rejected',               // 退出失败
  NEW_POST: 'new_post',                           // 新动态通知
  
  // 社团管理员端通知
  NEW_APPLICATION: 'new_application',             // 新成员申请
  NEW_LEAVE_REQUEST: 'new_leave_request',        // 成员退出申请
};

// 通知类型配置
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.APPLICATION_APPROVED]: {
    title: '申请通过',
    icon: '✅',
    color: 'green',
    studentVisible: true,
    adminVisible: false,
  },
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: {
    title: '申请未通过',
    icon: '❌',
    color: 'red',
    studentVisible: true,
    adminVisible: false,
  },
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: {
    title: '退出申请已同意',
    icon: '👋',
    color: 'green',
    studentVisible: true,
    adminVisible: false,
  },
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: {
    title: '退出申请被拒绝',
    icon: '🚫',
    color: 'orange',
    studentVisible: true,
    adminVisible: false,
  },
  [NOTIFICATION_TYPES.NEW_POST]: {
    title: '社团动态',
    icon: '📢',
    color: 'blue',
    studentVisible: true,
    adminVisible: false,
  },
  [NOTIFICATION_TYPES.NEW_APPLICATION]: {
    title: '新成员申请',
    icon: '📝',
    color: 'blue',
    studentVisible: false,
    adminVisible: true,
  },
  [NOTIFICATION_TYPES.NEW_LEAVE_REQUEST]: {
    title: '成员退出申请',
    icon: '🚶',
    color: 'orange',
    studentVisible: false,
    adminVisible: true,
  },
};

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 创建通知
  const createNotification = useCallback(async ({
    userId,
    type,
    title,
    content,
    relatedId = null,
    relatedType = null,
  }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type,
          title,
          content,
          related_id: relatedId,
          related_type: relatedType,
          is_read: false,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('创建通知失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 获取用户的通知列表
  const getUserNotifications = useCallback(async (userId, options = {}) => {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取通知列表失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 获取未读通知数量
  const getUnreadCount = useCallback(async (userId) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (err) {
      console.error('获取未读通知数量失败:', err);
      return { success: false, count: 0 };
    }
  }, []);

  // 标记单条通知为已读
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('标记通知已读失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('标记全部通知已读失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('删除通知失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 发送申请结果通知给学生
  const notifyApplicationResult = useCallback(async (userId, clubName, approved, reason = '') => {
    const type = approved ? NOTIFICATION_TYPES.APPLICATION_APPROVED : NOTIFICATION_TYPES.APPLICATION_REJECTED;
    const config = NOTIFICATION_CONFIG[type];
    
    const title = `${config.title} - ${clubName}`;
    const content = approved 
      ? `恭喜！您已成功加入「${clubName}」，快去看看社团动态吧！`
      : `很遗憾，您的「${clubName}」申请未通过${reason ? `：${reason}` : ''}`;

    return createNotification({
      userId,
      type,
      title,
      content,
      relatedType: 'club',
    });
  }, [createNotification]);

  // 发送退出申请结果通知给学生
  const notifyLeaveResult = useCallback(async (userId, clubName, approved, reason = '') => {
    const type = approved ? NOTIFICATION_TYPES.LEAVE_APPROVED : NOTIFICATION_TYPES.LEAVE_REJECTED;
    const config = NOTIFICATION_CONFIG[type];
    
    const title = `${config.title} - ${clubName}`;
    const content = approved 
      ? `您已成功退出「${clubName}」，期待下次再见！`
      : `您的退出「${clubName}」申请被拒绝${reason ? `：${reason}` : ''}`;

    return createNotification({
      userId,
      type,
      title,
      content,
      relatedType: 'club',
    });
  }, [createNotification]);

  // 发送新动态通知给社团成员
  const notifyNewPost = useCallback(async (clubId, clubName, postTitle, postType) => {
    try {
      // 获取社团所有成员
      const { data: members, error: memberError } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('status', 'active');

      if (memberError) throw memberError;

      // 为每个成员创建通知
      const notifications = (members || []).map(member => ({
        user_id: member.user_id,
        type: NOTIFICATION_TYPES.NEW_POST,
        title: `${clubName}发布新${postType === 'notice' ? '公告' : postType === 'event' ? '活动' : postType === 'achievement' ? '荣誉' : '动态'}`,
        content: postTitle,
        related_id: clubId,
        related_type: 'post',
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) throw insertError;
      }

      return { success: true };
    } catch (err) {
      console.error('发送新动态通知失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 发送新申请通知给社团管理员
  const notifyNewApplication = useCallback(async (clubId, applicantName, clubName) => {
    try {
      // 获取社团管理员信息
      const { data: admin, error: adminError } = await supabase
        .from('club_admin_accounts')
        .select('email')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .single();

      if (adminError) throw adminError;

      return createNotification({
        userId: `club-admin-${clubId}`,
        type: NOTIFICATION_TYPES.NEW_APPLICATION,
        title: `新成员申请 - ${applicantName}`,
        content: `${applicantName}申请加入「${clubName}」，请及时审核`,
        relatedId: clubId,
        relatedType: 'club',
      });
    } catch (err) {
      console.error('发送新申请通知失败:', err);
      return { success: false, error: err.message };
    }
  }, [createNotification]);

  // 发送新退出申请通知给社团管理员
  const notifyNewLeaveRequest = useCallback(async (clubId, memberName, clubName) => {
    try {
      // 获取社团管理员信息
      const { data: admin, error: adminError } = await supabase
        .from('club_admin_accounts')
        .select('email')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .single();

      if (adminError) throw adminError;

      return createNotification({
        userId: `club-admin-${clubId}`,
        type: NOTIFICATION_TYPES.NEW_LEAVE_REQUEST,
        title: `成员退出申请 - ${memberName}`,
        content: `${memberName}申请退出「${clubName}」，请及时处理`,
        relatedId: clubId,
        relatedType: 'club',
      });
    } catch (err) {
      console.error('发送退出申请通知失败:', err);
      return { success: false, error: err.message };
    }
  }, [createNotification]);

  return {
    isLoading,
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notifyApplicationResult,
    notifyLeaveResult,
    notifyNewPost,
    notifyNewApplication,
    notifyNewLeaveRequest,
  };
};
