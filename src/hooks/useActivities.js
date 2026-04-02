import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useActivities = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 获取社团的活动列表
  const getClubActivities = useCallback(async (clubId) => {
    try {
      const { data, error } = await supabase
        .from('club_activities')
        .select('*')
        .eq('club_id', clubId)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取活动列表失败:', err);
      toast.error('获取活动列表失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 创建新活动（同时创建动态）
  const createActivity = useCallback(async (activityData) => {
    setIsLoading(true);
    try {
      // 处理 author_id - 支持传入的 author_id 或从 auth 获取
      let authorId = activityData.author_id;
      if (!authorId) {
        const { data: { user } } = await supabase.auth.getUser();
        authorId = user?.id;
      }

      // 1. 先创建活动
      const { data: activity, error: activityError } = await supabase
        .from('club_activities')
        .insert([{
          club_id: activityData.club_id,
          title: activityData.title,
          content: activityData.content,
          activity_date: activityData.activity_date,
          status: activityData.status || 'upcoming',
          type: activityData.type || 'activity',
          author_id: authorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (activityError) throw activityError;
      
      // 2. 同时创建一条动态（type=event），让学生端能看到
      const { error: postError } = await supabase
        .from('club_posts')
        .insert([{
          club_id: activityData.club_id,
          author_id: authorId || '00000000-0000-0000-0000-000000000000',
          author_name: '社团管理员',
          title: activityData.title,
          content: activityData.content || `活动时间：${activityData.activity_date || '待定'}`,
          type: 'event', // 活动预告类型
          images: [],
          likes: 0,
          views: 0,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (postError) {
        console.error('创建动态失败:', postError);
        // 不影响活动创建的成功提示
      }
      
      toast.success('活动发布成功！');
      return { success: true, data: activity };
    } catch (err) {
      console.error('创建活动失败:', err);
      toast.error('发布失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新活动
  const updateActivity = useCallback(async (activityId, updates) => {
    try {
      const { data, error } = await supabase
        .from('club_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('活动更新成功');
      return { success: true, data };
    } catch (err) {
      toast.error('更新失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 删除活动
  const deleteActivity = useCallback(async (activityId) => {
    try {
      const { error } = await supabase
        .from('club_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      
      toast.success('活动已删除');
      return { success: true };
    } catch (err) {
      toast.error('删除失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    getClubActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  };
};
