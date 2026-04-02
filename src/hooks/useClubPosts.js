import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClubPosts = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 获取社团动态列表
  const getClubPosts = useCallback(async (clubId) => {
    try {
      const { data, error } = await supabase
        .from('club_posts')
        .select('*')
        .eq('club_id', clubId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取动态失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 创建新动态
  const createPost = useCallback(async (postData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_posts')
        .insert([{
          ...postData,
          likes: 0,
          views: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('发布成功！');
      return { success: true, data };
    } catch (err) {
      console.error('发布失败:', err);
      toast.error('发布失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新动态
  const updatePost = useCallback(async (postId, updates) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('更新成功！');
      return { success: true, data };
    } catch (err) {
      console.error('更新失败:', err);
      toast.error('更新失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 删除动态
  const deletePost = useCallback(async (postId) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('club_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      toast.success('内容已删除');
      return { success: true };
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 点赞
  const likePost = useCallback(async (postId) => {
    try {
      // 先获取当前点赞数
      const { data: currentData, error: fetchError } = await supabase
        .from('club_posts')
        .select('likes')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('club_posts')
        .update({ 
          likes: (currentData?.likes || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('点赞失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 增加浏览量
  const incrementViews = useCallback(async (postId) => {
    try {
      // 先获取当前浏览量
      const { data: currentData, error: fetchError } = await supabase
        .from('club_posts')
        .select('views')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('club_posts')
        .update({ 
          views: (currentData?.views || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('增加浏览量失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    getClubPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    incrementViews,
  };
};
