import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMembers = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 获取社团成员列表
  const getClubMembers = useCallback(async (clubId) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('join_date', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取成员列表失败:', err);
      toast.error('获取成员列表失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 更新成员角色
  const updateMemberRole = useCallback(async (memberId, newRole) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('成员角色已更新');
      return { success: true, data };
    } catch (err) {
      toast.error('更新失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 移除成员（软删除）
  const removeMember = useCallback(async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .update({ status: 'inactive' })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('成员已移除');
      return { success: true, data };
    } catch (err) {
      toast.error('移除失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 添加成员（手动添加）
  const addMember = useCallback(async (memberData) => {
    setIsLoading(true);
    try {
      // 检查是否已经是成员
      const { data: existing } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', memberData.club_id)
        .eq('user_id', memberData.user_id)
        .single();

      if (existing) {
        throw new Error('该用户已经是社团成员');
      }

      const { data, error } = await supabase
        .from('club_members')
        .insert([{
          ...memberData,
          join_date: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('成员添加成功');
      return { success: true, data };
    } catch (err) {
      toast.error('添加失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    getClubMembers,
    updateMemberRole,
    removeMember,
    addMember,
  };
};
