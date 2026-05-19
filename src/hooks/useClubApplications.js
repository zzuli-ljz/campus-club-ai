import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail } from '@/services/emailService';

// 生成6位随机验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const useClubApplications = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 提交社团申请
  const submitApplication = useCallback(async (applicationData) => {
    setIsLoading(true);
    try {
      // 生成验证码
      const verificationCode = generateVerificationCode();

      // 先插入申请记录
      const { data, error } = await supabase
        .from('club_applications')
        .insert([{
          applicant_name: applicationData.applicantName,
          applicant_email: applicationData.applicantEmail,
          applicant_identity: applicationData.applicantIdentity,
          applicant_student_id: applicationData.applicantStudentId || null,
          club_name: applicationData.clubName,
          club_category: applicationData.clubCategory,
          club_description: applicationData.clubDescription || '',
          club_location: applicationData.clubLocation || '',
          club_contact: applicationData.clubContact || '',
          club_tags: applicationData.clubTags || [],
          email_verified: false,
          verification_code: verificationCode,
          verification_sent_at: new Date().toISOString(),
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      // 发送验证邮件
      try {
        await sendVerificationEmail({
          email: applicationData.applicantEmail,
          name: applicationData.applicantName,
          code: verificationCode,
        });
      } catch (emailError) {
        console.error('发送验证邮件失败（但申请已提交）:', emailError);
        // 邮件发送失败不影响申请提交，仅记录日志
      }

      return { success: true, data, verificationCode };
    } catch (error) {
      console.error('提交申请失败:', error);
      toast.error('提交申请失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 验证邮箱验证码
  const verifyEmail = useCallback(async (applicationId, code) => {
    setIsLoading(true);
    try {
      // 查询申请记录
      const { data: application, error: fetchError } = await supabase
        .from('club_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!application) throw new Error('申请记录不存在');

      // 检查验证码是否正确
      if (application.verification_code !== code) {
        throw new Error('验证码错误');
      }

      // 检查验证码是否过期（15分钟）
      const sentTime = new Date(application.verification_sent_at);
      const now = new Date();
      const diffMinutes = (now - sentTime) / (1000 * 60);
      if (diffMinutes > 15) {
        throw new Error('验证码已过期，请重新获取');
      }

      // 更新验证状态
      const { error: updateError } = await supabase
        .from('club_applications')
        .update({
          email_verified: true,
          verification_code: null,
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('验证失败:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 重新发送验证码
  const resendVerificationCode = useCallback(async (applicationId) => {
    setIsLoading(true);
    try {
      const newCode = generateVerificationCode();

      const { error } = await supabase
        .from('club_applications')
        .update({
          verification_code: newCode,
          verification_sent_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('status', 'pending');

      if (error) throw error;

      console.log(`新验证码已生成: ${newCode}`);

      return { success: true, verificationCode: newCode };
    } catch (error) {
      console.error('重新发送验证码失败:', error);
      toast.error('重新发送验证码失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户的申请记录（用于查看验证状态）
  const getApplicationByEmail = useCallback(async (email) => {
    try {
      const { data, error } = await supabase
        .from('club_applications')
        .select('*')
        .eq('applicant_email', email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('获取申请记录失败:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ==================== 学校管理员部分 ====================

  // 获取所有社团申请（带筛选）
  const getAllApplications = useCallback(async (filters = {}) => {
    setIsLoading(true);
    try {
      console.log('getAllApplications 开始执行，filters:', filters);
      
      let query = supabase
        .from('club_applications')
        .select('*')
        .order('created_at', { ascending: false });

      // 按状态筛选
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // 按关键词搜索
      if (filters.search) {
        query = query.or(
          `club_name.ilike.%${filters.search}%,applicant_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`
        );
      }

      // 按分类筛选
      if (filters.category && filters.category !== 'all') {
        query = query.eq('club_category', filters.category);
      }

      console.log('执行 Supabase 查询...');
      const { data, error } = await query;
      console.log('Supabase 查询结果:', { dataLength: data?.length, error });

      if (error) {
        console.error('Supabase 查询错误:', error);
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('获取申请列表失败:', error);
      toast.error('获取申请列表失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 批准申请
  const approveApplication = useCallback(async (applicationId, reviewerId) => {
    setIsLoading(true);
    try {
      // 获取申请信息
      const { data: application, error: fetchError } = await supabase
        .from('club_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // 生成随机密码
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      // 处理 reviewerId：如果是本地模式（非 UUID 格式），设为 null
      const validReviewerId = reviewerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId) 
        ? reviewerId 
        : null;

      // 第1步：先创建社团
      const { data: newClub, error: clubError } = await supabase
        .from('clubs')
        .insert([{
          name: application.club_name,
          category: application.club_category,
          description: application.club_description || '',
          location: application.club_location || '',
          contact: application.club_contact || '',
          tags: application.club_tags || [],
          is_recruiting: false,
          founded: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (clubError) throw clubError;

      // 第2步：创建社团管理员账号（关联到新社团）
      const { data: adminAccount, error: accountError } = await supabase
        .from('club_admin_accounts')
        .insert([{
          name: application.applicant_name,
          email: application.applicant_email,
          password_hash: tempPassword,
          club_id: newClub.id,
          club_name: application.club_name,
          created_by: validReviewerId,
          is_active: true,
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // 第3步：更新申请状态
      const { error: updateError } = await supabase
        .from('club_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: validReviewerId,
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // 将申请中的新标签添加到标签库
      try {
        if (application.club_tags && application.club_tags.length > 0) {
          // 获取该分类下已有的标签
          const { data: existingTags } = await supabase
            .from('category_tags')
            .select('tag')
            .eq('category', application.club_category);

          const existingTagNames = existingTags?.map(t => t.tag) || [];

          // 找出新标签（不在已有标签库中的）
          const newTags = application.club_tags.filter(
            tag => !existingTagNames.includes(tag)
          );

          // 将新标签添加到标签库
          if (newTags.length > 0) {
            const tagsToInsert = newTags.map(tag => ({
              category: application.club_category,
              tag: tag,
              is_custom: true,
            }));

            const { error: tagError } = await supabase
              .from('category_tags')
              .insert(tagsToInsert);

            if (tagError) {
              console.error('添加新标签到标签库失败:', tagError);
            } else {
              console.log(`已添加 ${newTags.length} 个新标签到标签库:`, newTags);
            }
          }
        }
      } catch (tagError) {
        console.error('处理标签失败:', tagError);
        // 标签处理失败不影响申请批准
      }

      // 发送审核通过邮件
      try {
        await sendApprovalEmail({
          email: application.applicant_email,
          name: application.applicant_name,
          clubName: application.club_name,
          tempPassword,
        });
      } catch (emailError) {
        console.error('发送通过邮件失败（但申请已批准）:', emailError);
      }

      return {
        success: true,
        tempPassword,
        accountId: adminAccount.id,
        clubId: newClub.id,
        applicantEmail: application.applicant_email,
        applicantName: application.applicant_name,
        clubName: application.club_name,
      };
    } catch (error) {
      console.error('批准申请失败:', error);
      toast.error('批准申请失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 拒绝申请
  const rejectApplication = useCallback(async (applicationId, rejectionReason, reviewerId) => {
    setIsLoading(true);
    try {
      // 获取申请信息用于发送邮件
      const { data: application, error: fetchError } = await supabase
        .from('club_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // 处理 reviewerId：如果是本地模式（非 UUID 格式），设为 null
      const validReviewerId = reviewerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId) 
        ? reviewerId 
        : null;

      const { error } = await supabase
        .from('club_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: validReviewerId,
        })
        .eq('id', applicationId);

      if (error) throw error;

      // 发送审核拒绝邮件
      try {
        await sendRejectionEmail({
          email: application.applicant_email,
          name: application.applicant_name,
          clubName: application.club_name,
          reason: rejectionReason,
        });
      } catch (emailError) {
        console.error('发送拒绝邮件失败（但申请已拒绝）:', emailError);
      }

      return { success: true };
    } catch (error) {
      console.error('拒绝申请失败:', error);
      toast.error('拒绝申请失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 删除申请记录
  const deleteApplication = useCallback(async (applicationId) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('club_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('删除申请失败:', error);
      toast.error('删除申请失败: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    submitApplication,
    verifyEmail,
    resendVerificationCode,
    getApplicationByEmail,
    getAllApplications,
    approveApplication,
    rejectApplication,
    deleteApplication,
  };
};
