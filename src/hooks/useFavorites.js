import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFavorites = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 添加收藏
  const addFavorite = useCallback(async (clubId) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      const { data, error } = await supabase
        .from('favorite_clubs')
        .insert([{
          user_id: user.id,
          club_id: clubId,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('已添加到收藏');
      return { success: true, data };
    } catch (err) {
      if (err.code === '23505') {
        toast.info('该社团已在收藏中');
        return { success: false, error: '已收藏' };
      }
      toast.error('收藏失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 取消收藏
  const removeFavorite = useCallback(async (clubId) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      const { error } = await supabase
        .from('favorite_clubs')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId);

      if (error) throw error;
      
      toast.success('已取消收藏');
      return { success: true };
    } catch (err) {
      toast.error('操作失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户收藏的社团
  const getUserFavorites = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('favorite_clubs')
        .select(`
          club_id,
          clubs:club_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      return { 
        success: true, 
        data: data?.map(item => item.clubs) || [] 
      };
    } catch (err) {
      toast.error('获取收藏失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 检查是否已收藏
  const checkIsFavorite = useCallback(async (userId, clubId) => {
    try {
      const { data, error } = await supabase
        .from('favorite_clubs')
        .select('id')
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { success: true, isFavorite: !!data };
    } catch (err) {
      return { success: false, isFavorite: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkIsFavorite,
  };
};
