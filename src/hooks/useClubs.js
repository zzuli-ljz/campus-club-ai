import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取所有社团（包含真实成员数量）
  const fetchClubs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 获取社团列表
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;

      // 获取每个社团的真实成员数量
      const clubsWithMemberCount = await Promise.all(
        (clubsData || []).map(async (club) => {
          const { count, error: countError } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .eq('status', 'active');

          if (countError) {
            console.error(`获取社团 ${club.id} 成员数失败:`, countError);
            return { ...club, members: club.members || 0 };
          }

          return { ...club, members: count || 0 };
        })
      );

      setClubs(clubsWithMemberCount);
    } catch (err) {
      setError(err.message);
      toast.error('获取社团列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取单个社团详情（包含真实成员数量）
  const getClubById = useCallback(async (id) => {
    try {
      // 获取社团基本信息
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (clubError) throw clubError;

      // 获取真实成员数量
      const { count, error: countError } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', id)
        .eq('status', 'active');

      if (countError) {
        console.error('获取成员数失败:', countError);
        return { ...clubData, members: clubData.members || 0 };
      }

      return { ...clubData, members: count || 0 };
    } catch (err) {
      toast.error('获取社团详情失败');
      return null;
    }
  }, []);

  // 更新社团信息
  const updateClub = useCallback(async (id, updates) => {
    try {
      // 先查询确认记录存在
      const { data: existingData, error: checkError } = await supabase
        .from('clubs')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('查询社团失败:', checkError);
        throw new Error('未找到要更新的社团');
      }

      if (!existingData) {
        throw new Error('社团不存在');
      }

      // 执行更新，不使用 .single() 避免多行返回错误
      const { data, error } = await supabase
        .from('clubs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      // 返回更新后的第一条数据
      if (data && data.length > 0) {
        toast.success('社团信息已更新');
        return { success: true, data: data[0] };
      } else {
        throw new Error('更新后未返回数据');
      }
    } catch (err) {
      console.error('更新社团失败:', err);
      toast.error('更新失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 切换招新状态
  const toggleRecruiting = useCallback(async (id, currentStatus) => {
    try {
      // 先查询确认记录存在
      const { data: existingData, error: checkError } = await supabase
        .from('clubs')
        .select('id, is_recruiting')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('查询社团失败:', checkError);
        throw new Error('未找到要更新的社团');
      }

      if (!existingData) {
        throw new Error('社团不存在');
      }

      // 执行更新，不使用 .single() 避免多行返回错误
      const { data, error } = await supabase
        .from('clubs')
        .update({ 
          is_recruiting: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      // 返回更新后的第一条数据
      if (data && data.length > 0) {
        toast.success(data[0].is_recruiting ? '已开启招新' : '已关闭招新');
        return { success: true, data: data[0] };
      } else {
        throw new Error('更新后未返回数据');
      }
    } catch (err) {
      console.error('切换招新状态失败:', err);
      toast.error('操作失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return {
    clubs,
    isLoading,
    error,
    fetchClubs,
    getClubById,
    updateClub,
    toggleRecruiting,
  };
};
