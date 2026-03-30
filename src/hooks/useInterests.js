import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInterests = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 保存用户兴趣标签
  const saveInterests = useCallback(async (tags) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      // 先删除旧标签
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      // 插入新标签
      if (tags.length > 0) {
        const interests = tags.map(tag => ({
          user_id: user.id,
          tag,
        }));

        const { error } = await supabase
          .from('user_interests')
          .insert(interests);

        if (error) throw error;
      }

      return { success: true };
    } catch (err) {
      toast.error('保存失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户兴趣标签
  const getUserInterests = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('tag')
        .eq('user_id', userId);

      if (error) throw error;
      
      return { 
        success: true, 
        data: data?.map(item => item.tag) || [] 
      };
    } catch (err) {
      toast.error('获取兴趣标签失败');
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    saveInterests,
    getUserInterests,
  };
};
