import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useApplications = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 提交报名申请
  const submitApplication = useCallback(async (applicationData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id,
          ...applicationData,
          status: 'pending',
          apply_time: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('申请已提交！');
      return { success: true, data };
    } catch (err) {
      console.error('提交申请失败:', err);
      toast.error(err.message || '提交失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户的报名记录
  const getUserApplications = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          clubs:club_id (name, category)
        `)
        .eq('user_id', userId)
        .order('apply_time', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取用户报名记录失败:', err);
      toast.error('获取报名记录失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 获取社团的报名申请（社团管理员用）
  const getClubApplications = useCallback(async (clubId) => {
    try {
      console.log('正在获取社团申请，clubId:', clubId);
      
      // 首先尝试简单查询（不带关联）
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('club_id', clubId)
        .order('apply_time', { ascending: false });

      if (error) {
        console.error('获取申请列表失败:', error);
        throw error;
      }

      console.log('获取到的申请数据:', data);

      // 如果成功获取数据，再尝试获取申请人信息
      const enrichedData = await Promise.all(
        (data || []).map(async (app) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, student_id, email')
              .eq('id', app.user_id)
              .single();
            
            return {
              ...app,
              profiles: profileData || { name: '未知用户', student_id: '', email: '' }
            };
          } catch (e) {
            return {
              ...app,
              profiles: { name: '未知用户', student_id: '', email: '' }
            };
          }
        })
      );

      return { success: true, data: enrichedData || [] };
    } catch (err) {
      console.error('获取申请列表失败:', err);
      toast.error('获取申请列表失败');
      return { success: false, error: err.message };
    }
  }, []);

  // 更新申请状态
  const updateApplicationStatus = useCallback(async (applicationId, status) => {
    try {
      // 先获取申请信息
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (fetchError) throw fetchError;

      // 更新申请状态
      const { data, error } = await supabase
        .from('applications')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      // 如果申请被批准，自动添加到 club_members 表
      if (status === 'approved') {
        try {
          // 检查是否已经是成员
          const { data: existingMember } = await supabase
            .from('club_members')
            .select('id')
            .eq('club_id', appData.club_id)
            .eq('user_id', appData.user_id)
            .single();

          // 如果不是成员，则添加
          if (!existingMember) {
            const { error: memberError } = await supabase
              .from('club_members')
              .insert({
                club_id: appData.club_id,
                user_id: appData.user_id,
                name: appData.name,
                role: '成员',
                join_date: new Date().toISOString(),
                status: 'active'
              });

            if (memberError) {
              console.error('添加到成员表失败:', memberError);
            } else {
              console.log('已自动添加到社团成员');
            }
          }

          // 更新社团成员数量
          const { data: membersCount } = await supabase
            .from('club_members')
            .select('id', { count: 'exact' })
            .eq('club_id', appData.club_id);

          await supabase
            .from('clubs')
            .update({ members: membersCount?.length || 0 })
            .eq('id', appData.club_id);

        } catch (memberErr) {
          console.error('处理成员添加时出错:', memberErr);
        }
      }

      toast.success(status === 'approved' ? '已通过申请' : '已拒绝申请');
      return { success: true, data };
    } catch (err) {
      console.error('更新申请状态失败:', err);
      toast.error('操作失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 获取用户已加入的社团（从 club_members 表）
  const getUserJoinedClubs = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          *,
          clubs:club_id (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('join_date', { ascending: false });

      if (error) throw error;

      return { 
        success: true, 
        data: data?.map(item => ({
          id: item.clubs?.id,
          name: item.clubs?.name,
          category: item.clubs?.category,
          joinDate: new Date(item.join_date).toLocaleDateString('zh-CN'),
          role: item.role
        })) || [] 
      };
    } catch (err) {
      console.error('获取已加入社团失败:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    submitApplication,
    getUserApplications,
    getClubApplications,
    updateApplicationStatus,
    getUserJoinedClubs,
  };
};
