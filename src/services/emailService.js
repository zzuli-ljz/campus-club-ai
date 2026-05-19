/**
 * 邮件服务 - 通过 Supabase Edge Function 发送邮件
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * 发送邮件
 * @param {Object} params - 邮件参数
 * @param {string} params.to - 收件人邮箱
 * @param {string} params.type - 邮件类型: 'verification' | 'approval' | 'rejection'
 * @param {Object} params.data - 邮件模板数据
 */
export const sendEmail = async ({ to, type, data }) => {
  try {
    // 直接调用 Edge Function (匿名访问，不携带用户鉴权)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, type, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (!result?.success) {
      throw new Error(result?.error || '发送邮件失败');
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 发送验证码邮件
 * @param {Object} params
 * @param {string} params.email - 收件人邮箱
 * @param {string} params.name - 申请人姓名
 * @param {string} params.code - 验证码
 */
export const sendVerificationEmail = async ({ email, name, code }) => {
  return sendEmail({
    to: email,
    type: 'verification',
    data: { name, code },
  });
};

/**
 * 发送申请通过邮件
 * @param {Object} params
 * @param {string} params.email - 收件人邮箱
 * @param {string} params.name - 申请人姓名
 * @param {string} params.clubName - 社团名称
 * @param {string} params.tempPassword - 临时密码
 */
export const sendApprovalEmail = async ({ email, name, clubName, tempPassword }) => {
  const loginUrl = `${window.location.origin}/login`;
  return sendEmail({
    to: email,
    type: 'approval',
    data: { name, clubName, tempPassword, loginUrl },
  });
};

/**
 * 发送申请拒绝邮件
 * @param {Object} params
 * @param {string} params.email - 收件人邮箱
 * @param {string} params.name - 申请人姓名
 * @param {string} params.clubName - 社团名称
 * @param {string} params.reason - 拒绝原因
 */
export const sendRejectionEmail = async ({ email, name, clubName, reason }) => {
  return sendEmail({
    to: email,
    type: 'rejection',
    data: { name, clubName, reason },
  });
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};
