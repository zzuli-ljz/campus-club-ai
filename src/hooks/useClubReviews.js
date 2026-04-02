import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClubReviews = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 获取社团评价列表（包含管理员回复字段）
  const getClubReviews = useCallback(async (clubId) => {
    setIsLoading(true);
    try {
      // 简化查询，确保与表结构兼容
      const { data, error } = await supabase
        .from('club_reviews')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 确保数据字段完整性，为缺失字段提供默认值
      const normalizedData = (data || []).map(review => ({
        ...review,
        likes: review.likes || 0,
        reply: review.reply || null,
        replied_at: review.replied_at || null,
        replied_by: review.replied_by || null,
      }));

      return { success: true, data: normalizedData };
    } catch (err) {
      console.error('获取评价列表失败:', err);
      toast.error('获取评价列表失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取评价统计数据
  const getReviewStats = useCallback(async (clubId) => {
    try {
      // 获取所有评价用于统计
      const { data, error } = await supabase
        .from('club_reviews')
        .select('rating')
        .eq('club_id', clubId);

      if (error) throw error;

      const reviews = data || [];
      const total = reviews.length;
      
      if (total === 0) {
        return {
          success: true,
          data: {
            average: 0,
            total: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          }
        };
      }

      // 计算平均分
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const average = (sum / total).toFixed(1);

      // 计算分布
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        if (distribution[r.rating] !== undefined) {
          distribution[r.rating]++;
        }
      });

      return {
        success: true,
        data: {
          average: parseFloat(average),
          total,
          distribution
        }
      };
    } catch (err) {
      console.error('获取评价统计失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 添加评价
  const addReview = useCallback(async (reviewData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      // 检查用户是否已评价
      const { data: existingReview } = await supabase
        .from('club_reviews')
        .select('id')
        .eq('club_id', reviewData.club_id)
        .eq('user_id', user.id)
        .single();

      if (existingReview) {
        throw new Error('您已经评价过该社团了');
      }

      // 获取用户资料以填充名称
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('club_reviews')
        .insert([{
          club_id: reviewData.club_id,
          user_id: user.id,
          user_name: profileData?.name || '匿名用户',
          rating: reviewData.rating,
          content: reviewData.content,
          tags: reviewData.tags || [],
          likes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('评价发表成功！');
      return { success: true, data };
    } catch (err) {
      console.error('发表评价失败:', err);
      toast.error(err.message || '发表失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 点赞评价
  const likeReview = useCallback(async (reviewId) => {
    try {
      // 先获取当前点赞数
      const { data: reviewData, error: fetchError } = await supabase
        .from('club_reviews')
        .select('likes')
        .eq('id', reviewId)
        .single();

      if (fetchError) throw fetchError;

      // 更新点赞数
      const { error } = await supabase
        .from('club_reviews')
        .update({ 
          likes: (reviewData?.likes || 0) + 1 
        })
        .eq('id', reviewId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('点赞失败:', err);
      toast.error('点赞失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 回复评价（社团管理员使用）
  const replyToReview = useCallback(async (reviewId, replyContent, repliedByName) => {
    setIsLoading(true);
    try {
      // 使用 RPC 函数绕过 RLS 限制
      const { data, error } = await supabase.rpc('reply_to_club_review', {
        p_review_id: reviewId,
        p_reply: replyContent,
        p_replied_by: repliedByName || '管理员'
      });

      if (error) {
        console.error('RPC 调用失败:', error);
        throw error;
      }

      if (data === true) {
        toast.success('回复成功！');
        return { success: true };
      } else {
        throw new Error('回复失败，请重试');
      }
    } catch (err) {
      console.error('回复评价失败:', err);
      toast.error(err.message || '回复失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 检查用户是否已评价
  const checkUserReviewed = useCallback(async (clubId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { hasReviewed: false };

      const { data, error } = await supabase
        .from('club_reviews')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { hasReviewed: !!data };
    } catch (err) {
      console.error('检查评价状态失败:', err);
      return { hasReviewed: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    getClubReviews,
    getReviewStats,
    addReview,
    likeReview,
    replyToReview,
    checkUserReviewed,
  };
};
