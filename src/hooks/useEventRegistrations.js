import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEventRegistrations = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // 跟踪 RPC 调用失败次数，避免无限重试
  const rpcFailureCountRef = useRef(0);
  const MAX_RPC_FAILURES = 3;

  // 获取活动的报名列表（管理员用）
  // 使用 RPC 函数来绕过 RLS 策略，支持本地登录的社团管理员
  const getPostRegistrations = useCallback(async (postId) => {
    try {
      // 检查失败次数，如果连续失败超过限制，跳过 RPC 调用
      if (rpcFailureCountRef.current >= MAX_RPC_FAILURES) {
        console.warn('RPC 函数连续失败次数过多，直接使用回退查询');
        const fallbackResult = await getPostRegistrationsFallback(postId);
        return fallbackResult;
      }
      
      // 首先尝试使用 RPC 函数
      const { data, error } = await supabase.rpc('get_post_registrations_admin', {
        p_post_id: postId
      });

      if (error) {
        rpcFailureCountRef.current++;
        console.warn('RPC 函数调用失败，回退到直接查询:', error);
        // 如果 RPC 函数不存在或失败，回退到直接查询（RLS 会正常工作）
        const fallbackResult = await getPostRegistrationsFallback(postId);
        return fallbackResult;
      }
      
      // RPC 调用成功，重置失败计数
      rpcFailureCountRef.current = 0;
      
      // 格式化返回数据
      const formattedData = (data || []).map(reg => ({
        id: reg.id,
        post_id: reg.post_id,
        club_id: reg.club_id,
        user_id: reg.user_id,
        name: reg.name,
        student_id: reg.student_id,
        email: reg.email,
        phone: reg.phone,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        profiles: {
          name: reg.profile_name,
          student_id: reg.profile_student_id,
          email: reg.profile_email,
          major: reg.profile_major
        }
      }));

      return { success: true, data: formattedData };
    } catch (err) {
      console.error('获取报名列表失败:', err);
      // 最后回退到直接查询
      const fallbackResult = await getPostRegistrationsFallback(postId);
      return fallbackResult;
    }
  }, [supabase]);

  // 直接查询的回退函数（用于 Supabase Auth 用户）
  const getPostRegistrationsFallback = useCallback(async (postId) => {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profiles:user_id (
            name,
            student_id,
            email,
            major
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(reg => ({
        id: reg.id,
        post_id: reg.post_id,
        club_id: reg.club_id,
        user_id: reg.user_id,
        name: reg.name,
        student_id: reg.student_id,
        email: reg.email,
        phone: reg.phone,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        profiles: reg.profiles
      }));

      return { success: true, data: formattedData };
    } catch (err) {
      console.error('回退查询失败:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // 获取用户的报名状态
  const getUserRegistration = useCallback(async (postId, userId) => {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data: data || null };
    } catch (err) {
      console.error('获取用户报名状态失败:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // 获取报名统计的回退函数
  const getRegistrationStatsFallback = useCallback(async (postId) => {
    try {
      // 直接查询已报名人数
      const { count: registeredCount, error: queryError } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('status', 'registered');

      if (queryError) {
        console.warn('查询报名统计失败:', queryError);
        throw queryError;
      }
      
      // 同时获取活动的人数上限
      const { data: postData } = await supabase
        .from('club_posts')
        .select('max_participants')
        .eq('id', postId)
        .single();
      
      return { 
        success: true, 
        data: { 
          registeredCount: registeredCount || 0,
          maxParticipants: postData?.max_participants || null,
          isFull: postData?.max_participants ? (registeredCount || 0) >= postData.max_participants : false
        } 
      };
    } catch (err) {
      console.error('获取报名统计失败:', err);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // 获取活动的报名统计
  // 使用 RPC 函数绕过 RLS 策略限制，确保所有用户都能看到报名人数
  const getRegistrationStats = useCallback(async (postId) => {
    try {
      // 检查失败次数，如果连续失败超过限制，直接使用回退查询
      if (rpcFailureCountRef.current >= MAX_RPC_FAILURES) {
        console.warn('RPC 函数连续失败次数过多，直接使用回退查询');
        const fallbackResult = await getRegistrationStatsFallback(postId);
        return fallbackResult;
      }
      
      // 首先尝试使用 RPC 函数获取报名统计
      const { data, error } = await supabase.rpc('get_registration_stats_public', {
        p_post_id: postId
      });

      if (error) {
        rpcFailureCountRef.current++;
        console.warn('RPC 函数调用失败，回退到直接查询:', error);
        // 如果 RPC 函数不存在或失败，回退到直接查询
        const fallbackResult = await getRegistrationStatsFallback(postId);
        return fallbackResult;
      }
      
      // RPC 调用成功，重置失败计数
      rpcFailureCountRef.current = 0;
      
      if (data && data.length > 0) {
        return { 
          success: true, 
          data: { 
            registeredCount: data[0].registered_count || 0,
            maxParticipants: data[0].max_participants || null,
            isFull: data[0].is_full || false
          } 
        };
      }
      
      return { success: true, data: { registeredCount: 0 } };
    } catch (err) {
      console.error('获取报名统计失败:', err);
      // 最后回退到直接查询
      const fallbackResult = await getRegistrationStatsFallback(postId);
      return fallbackResult;
    }
  }, [supabase, getRegistrationStatsFallback]);

  // 活动报名
  const registerForEvent = useCallback(async (postId, clubId, userId, registrationData) => {
    setIsLoading(true);
    try {
      console.log('=== 开始报名流程 ===');
      console.log('postId:', postId, 'clubId:', clubId, 'userId:', userId);
      console.log('registrationData:', registrationData);
      
      // 验证 userId 格式
      if (!userId || typeof userId !== 'string') {
        console.error('无效的 userId:', userId);
        return { success: false, error: '用户未登录或登录已过期，请重新登录' };
      }
      
      // 先检查是否已报名
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        if (existing.status === 'registered') {
          return { success: false, error: '您已经报过名了' };
        }
        // 如果之前取消过，重新激活
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({ 
            status: 'registered', 
            name: registrationData.name,
            student_id: registrationData.student_id,
            email: registrationData.email || null,
            phone: registrationData.phone || null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('重新激活报名记录失败:', updateError);
          throw updateError;
        }
        toast.success('报名成功！');
        return { success: true };
      }

      // 检查是否达到人数上限
      const { data: post } = await supabase
        .from('club_posts')
        .select('max_participants, requires_registration')
        .eq('id', postId)
        .single();

      if (post?.max_participants) {
        // 使用 RPC 函数获取报名统计（绕过 RLS 限制）
        const statsResult = await getRegistrationStats(postId);
        const registeredCount = statsResult.success ? statsResult.data.registeredCount : 0;

        if (registeredCount >= post.max_participants) {
          return { success: false, error: '报名人数已满' };
        }
      }

      console.log('准备插入报名记录...');
      const insertData = {
        post_id: postId,
        club_id: clubId,
        user_id: userId,
        name: registrationData.name,
        student_id: registrationData.student_id,
        email: registrationData.email || null,
        phone: registrationData.phone || null,
        status: 'registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('插入数据:', insertData);
      
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([insertData])
        .select();

      if (error) {
        console.error('插入报名记录失败 (Supabase error):', error);
        // 提供更友好的错误消息
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error('权限不足，请确保您已登录并且邮箱已验证。如果问题持续存在，请联系管理员。');
        }
        throw error;
      }
      
      console.log('报名成功，返回数据:', data);
      toast.success('报名成功！');
      return { success: true };
    } catch (err) {
      console.error('报名失败 (caught error):', err);
      toast.error('报名失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 取消报名
  const cancelRegistration = useCallback(async (postId, userId) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('已取消报名');
      return { success: true };
    } catch (err) {
      console.error('取消报名失败:', err);
      toast.error('取消报名失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 删除报名记录（管理员用）
  // 使用 RPC 函数来绕过 RLS 策略，支持本地登录的社团管理员
  const deleteRegistration = useCallback(async (registrationId) => {
    setIsLoading(true);
    try {
      // 首先尝试使用 RPC 函数
      const { data, error } = await supabase.rpc('delete_registration_admin', {
        p_registration_id: registrationId
      });

      if (error) {
        console.warn('RPC 删除函数调用失败，回退到直接删除:', error);
        // 回退到直接删除（RLS 会正常工作）
        const { error: deleteError } = await supabase
          .from('event_registrations')
          .delete()
          .eq('id', registrationId);

        if (deleteError) throw deleteError;
      } else if (!data) {
        throw new Error('没有权限删除此报名记录');
      }
      
      toast.success('已删除报名记录');
      return { success: true };
    } catch (err) {
      console.error('删除报名记录失败:', err);
      toast.error('删除失败: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 导出报名数据为 Excel 格式
  // 使用 RPC 函数来绕过 RLS 策略，支持本地登录的社团管理员
  const exportRegistrations = useCallback(async (postId, postTitle) => {
    try {
      // 首先尝试使用 RPC 函数
      let data;
      const { data: rpcData, error } = await supabase.rpc('get_post_registrations_admin', {
        p_post_id: postId
      });

      if (error) {
        console.warn('RPC 导出函数调用失败，回退到直接查询:', error);
        // 回退到直接查询
        const { data: fallbackData, error: queryError } = await supabase
          .from('event_registrations')
          .select(`
            name, 
            student_id, 
            email, 
            phone, 
            status, 
            created_at,
            profiles:major(major)
          `)
          .eq('post_id', postId)
          .eq('status', 'registered')
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        data = fallbackData;
      } else {
        // 过滤只保留已报名的
        data = rpcData ? rpcData.filter(item => item.status === 'registered') : [];
      }

      if (!data || data.length === 0) {
        toast.error('暂无报名数据');
        return { success: false, error: '暂无报名数据' };
      }

      // 生成真正的 Excel 文件（使用 XLSX 格式）
      // Excel XML 结构
      const generateExcelXML = (headers, rows) => {
        const escapeXml = (str) => {
          if (!str) return '';
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        const headerRow = headers.map(h => `<Cell ss:StyleID="s62"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('');
        
        const dataRows = rows.map(row => 
          `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`
        ).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="s62">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="报名表">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
      };

      const headers = ['序号', '姓名', '学号', '专业', '邮箱', '联系电话', '报名时间'];
      const rows = data.map((item, index) => [
        (index + 1).toString(),
        item.name || item.profile_name || '',
        item.student_id || item.profile_student_id || '',
        item.profile_major || '',  // RPC 返回平铺字段
        item.email || item.profile_email || '',
        item.phone || '',
        new Date(item.created_at).toLocaleString('zh-CN')
      ]);

      const excelXML = generateExcelXML(headers, rows);
      
      // 创建 Blob 并下载
      const blob = new Blob([excelXML], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // 使用 xls 扩展名（Excel 97-2003 格式，更好的兼容性）
      link.download = `${postTitle || '活动报名'}_报名表_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`已导出 ${data.length} 条报名数据为 Excel 格式`);
      return { success: true, count: data.length };
    } catch (err) {
      console.error('导出失败:', err);
      toast.error('导出失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, [supabase]);

  // 检查是否可以报名（根据时间和人数限制）
  const canRegister = useCallback(async (postId) => {
    try {
      const { data: post, error } = await supabase
        .from('club_posts')
        .select('requires_registration, registration_start, registration_end, max_participants, registration_open')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (!post?.requires_registration || !post?.registration_open) {
        return { canRegister: false, reason: '该活动不需要报名' };
      }

      const now = new Date();

      // 检查报名时间
      if (post.registration_start && now < new Date(post.registration_start)) {
        return { 
          canRegister: false, 
          reason: `报名还未开始，开始时间：${new Date(post.registration_start).toLocaleString('zh-CN')}` 
        };
      }

      if (post.registration_end && now > new Date(post.registration_end)) {
        return { canRegister: false, reason: '报名已结束' };
      }

      // 检查人数限制
      if (post.max_participants) {
        // 首先尝试使用 RPC 函数获取报名统计
        const statsResult = await getRegistrationStats(postId);
        const registeredCount = statsResult.success ? statsResult.data.registeredCount : 0;

        if (registeredCount >= post.max_participants) {
          return { canRegister: false, reason: '报名人数已满' };
        }

        return { 
          canRegister: true, 
          remainingSlots: post.max_participants - registeredCount,
          totalSlots: post.max_participants
        };
      }

      return { canRegister: true };
    } catch (err) {
      console.error('检查报名状态失败:', err);
      return { canRegister: false, reason: '检查失败' };
    }
  }, [supabase, getRegistrationStats]);

  return {
    isLoading,
    getPostRegistrations,
    getUserRegistration,
    getRegistrationStats,
    registerForEvent,
    cancelRegistration,
    deleteRegistration,
    exportRegistrations,
    canRegister,
  };
};
