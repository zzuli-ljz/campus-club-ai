import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

export const useApplications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { notifyApplicationResult, notifyNewApplication } = useNotifications();

  // 提交报名申请
  const submitApplication = useCallback(async (applicationData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('请先登录');

      // 获取用户信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // 获取社团名称
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', applicationData.club_id)
        .single();

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

      // 发送通知给社团管理员
      await notifyNewApplication(
        applicationData.club_id,
        profile?.name || '新成员',
        clubData?.name || '社团'
      );
      
      toast.success('申请已提交！');
      return { success: true, data };
    } catch (err) {
      console.error('提交申请失败:', err);
      toast.error(err.message || '提交失败');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [notifyNewApplication]);

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
  const updateApplicationStatus = useCallback(async (applicationId, status, reason = '') => {
    try {
      // 先获取申请信息
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (fetchError) throw fetchError;

      // 获取社团名称
      const { data: clubData } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', appData.club_id)
        .single();

      const clubName = clubData?.name || '社团';

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
          // 检查是否已经是 active 状态的成员
          const { data: existingActiveMember } = await supabase
            .from('club_members')
            .select('id')
            .eq('club_id', appData.club_id)
            .eq('user_id', appData.user_id)
            .eq('status', 'active')
            .maybeSingle();

          // 如果不是 active 成员，则添加或恢复
          if (!existingActiveMember) {
            // 检查是否有 inactive 的旧记录
            const { data: existingInactiveMember } = await supabase
              .from('club_members')
              .select('id')
              .eq('club_id', appData.club_id)
              .eq('user_id', appData.user_id)
              .eq('status', 'inactive')
              .maybeSingle();

            if (existingInactiveMember) {
              // 恢复 inactive 记录为 active
              const { error: memberError } = await supabase
                .from('club_members')
                .update({ 
                  status: 'active',
                  join_date: new Date().toISOString(),
                  role: '成员'
                })
                .eq('club_id', appData.club_id)
                .eq('user_id', appData.user_id);

              if (memberError) {
                console.error('恢复成员状态失败:', memberError);
              } else {
                console.log('已恢复社团成员身份');
              }
            } else {
              // 插入新记录
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
          }

          // 更新社团成员数量（只统计 active 状态的成员）
          const { count: activeMembersCount } = await supabase
            .from('club_members')
            .select('id', { count: 'exact', head: true })
            .eq('club_id', appData.club_id)
            .eq('status', 'active');

          await supabase
            .from('clubs')
            .update({ members: activeMembersCount || 0 })
            .eq('id', appData.club_id);

        } catch (memberErr) {
          console.error('处理成员添加时出错:', memberErr);
        }
      }

      // 发送通知给学生
      await notifyApplicationResult(appData.user_id, clubName, status === 'approved', reason);

      toast.success(status === 'approved' ? '已通过申请' : '已拒绝申请');
      return { success: true, data };
    } catch (err) {
      console.error('更新申请状态失败:', err);
      toast.error('操作失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, [notifyApplicationResult]);

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
