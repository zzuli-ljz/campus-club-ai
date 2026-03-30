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

  // 创建新活动
  const createActivity = useCallback(async (activityData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_activities')
        .insert([{
          ...activityData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('活动发布成功！');
      return { success: true, data };
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
