import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

export const useLeaveRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { notifyNewLeaveRequest, notifyLeaveResult } = useNotifications();

  // 提交退出申请
  const submitLeaveRequest = useCallback(async (clubId, reason = '') => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      // 获取用户信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, student_id')
        .eq('id', user.id)
        .single();

      // 检查是否已经有待处理的退出申请
      const { data: existingRequest } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('club_id', clubId)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        throw new Error('您已有待处理的退出申请，请等待审核');
      }

      // 检查是否是社团管理员（社团管理员不能申请退出，只能由学校管理员处理）
      if (profile?.role === 'club_admin') {
        throw new Error('社团管理员如需退出，请联系学校管理员');
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{
          user_id: user.id,
          club_id: clubId,
          user_name: profile?.name || '未知用户',
          student_id: profile?.student_id || '',
          reason: reason,
          status: 'pending',
          apply_time: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        // 处理唯一约束冲突
        if (error.code === '23505') {
          throw new Error('您已有待处理的退出申请，请等待审核');
        }
        throw error;
      }
      
      // 获取社团名称
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single();
      
      // 发送通知给社团管理员
      await notifyNewLeaveRequest(
        clubId,
        profile?.name || '未知用户',
        clubData?.name || '社团'
      );
      
      toast.success('退出申请已提交，请等待社团管理员审核');
      return { success: true, data };
    } catch (err) {
      console.error('提交退出申请失败:', err);
      toast.error(err.message || '提交失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [notifyNewLeaveRequest]);

  // 获取用户的退出申请记录
  const getUserLeaveRequests = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          clubs:club_id (name, category)
        `)
        .eq('user_id', userId)
        .order('apply_time', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取退出申请记录失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 获取社团的退出申请（社团管理员用）
  const getClubLeaveRequests = useCallback(async (clubId) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('club_id', clubId)
        .order('apply_time', { ascending: false });

      if (error) throw error;

      // 补充用户信息
      const enrichedData = await Promise.all(
        (data || []).map(async (req) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, student_id, email, major')
              .eq('id', req.user_id)
              .single();
            
            return {
              ...req,
              profiles: profileData || { name: '未知用户', student_id: '', email: '', major: '' }
            };
          } catch (e) {
            return {
              ...req,
              profiles: { name: '未知用户', student_id: '', email: '', major: '' }
            };
          }
        })
      );

      return { success: true, data: enrichedData || [] };
    } catch (err) {
      console.error('获取退出申请列表失败:', err);
      toast.error('获取退出申请列表失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 更新退出申请状态（同意/拒绝）
  const updateLeaveRequestStatus = useCallback(async (requestId, status) => {
    setIsLoading(true);
    try {
      // 先获取申请信息
      const { data: requestData, error: fetchError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      if (!requestData) throw new Error('退出申请不存在');

      // 更新退出申请状态
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 获取社团名称用于通知
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', requestData.club_id)
        .single();
      
      const clubName = clubData?.name || '社团';
      
      // 如果退出申请被批准，从社团成员表中移除
      if (status === 'approved') {
        try {
          // 找到该成员记录并设置为 inactive
          const { error: memberError } = await supabase
            .from('club_members')
            .update({ status: 'inactive' })
            .eq('user_id', requestData.user_id)
            .eq('club_id', requestData.club_id)
            .eq('status', 'active');

          if (memberError) {
            console.error('移除成员失败:', memberError);
          } else {
            console.log('成员已成功退出社团');
            
            // 更新社团成员数量（只计算 active 状态的成员）
            const { count: activeMembersCount } = await supabase
              .from('club_members')
              .select('id', { count: 'exact', head: true })
              .eq('club_id', requestData.club_id)
              .eq('status', 'active');

            await supabase
              .from('clubs')
              .update({ members: activeMembersCount || 0 })
              .eq('id', requestData.club_id);
          }
        } catch (memberErr) {
          console.error('处理成员移除时出错:', memberErr);
        }
      }

      // 发送通知给学生
      await notifyLeaveResult(
        requestData.user_id,
        clubName,
        status === 'approved'
      );

      toast.success(status === 'approved' ? '已同意退出申请' : '已拒绝退出申请');
      return { success: true, data: { ...requestData, status } };
    } catch (err) {
      console.error('更新退出申请状态失败:', err);
      toast.error('操作失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [notifyLeaveResult]);

  // 取消退出申请（仅限待处理状态）
  const cancelLeaveRequest = useCallback(async (requestId) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;
      
      toast.success('已取消退出申请');
      return { success: true };
    } catch (err) {
      console.error('取消退出申请失败:', err);
      toast.error('取消失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    submitLeaveRequest,
    getUserLeaveRequests,
    getClubLeaveRequests,
    updateLeaveRequestStatus,
    cancelLeaveRequest,
  };
};
