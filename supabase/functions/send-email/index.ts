// Supabase Edge Function: 发送邮件
// 支持验证码邮件、审核通过邮件、审核拒绝邮件

import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// 邮件模板
const emailTemplates = {
  verification: (data: { name: string; code: string }) => ({
    subject: '【社团招新平台】邮箱验证',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">社团招新平台</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">您好，${data.name}</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            您正在申请创建新社团，请使用以下验证码完成邮箱验证：
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">
              ${data.code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            验证码有效期为 <strong>15 分钟</strong>，请尽快完成验证。
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            如果您没有进行任何操作，请忽略此邮件。
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © 2026 社团招新平台
        </p>
      </div>
    `,
  }),

  approval: (data: { name: string; clubName: string; tempPassword: string; loginUrl: string }) => ({
    subject: '【社团招新平台】恭喜！您的社团申请已通过审核',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 申请通过</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">您好，${data.name}</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            恭喜！您的社团 "<strong>${data.clubName}</strong>" 申请已通过审核！
          </p>
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #065f46; margin-top: 0;">管理员账号信息</h3>
            <p style="color: #047857; margin: 8px 0;">
              <strong>临时密码：</strong> <code style="background: #d1fae5; padding: 4px 8px; border-radius: 4px;">${data.tempPassword}</code>
            </p>
            <p style="color: #047857; font-size: 14px; margin-bottom: 0;">
              请登录后立即修改密码！
            </p>
          </div>
          <a href="${data.loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            立即登录管理后台
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            如果按钮无法点击，请复制以下链接到浏览器打开：<br/>
            <a href="${data.loginUrl}" style="color: #2563eb;">${data.loginUrl}</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © 2026 社团招新平台
        </p>
      </div>
    `,
  }),

  rejection: (data: { name: string; clubName: string; reason: string }) => ({
    subject: '【社团招新平台】您的社团申请未通过审核',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">申请结果通知</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">您好，${data.name}</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            抱歉，您的社团 "<strong>${data.clubName}</strong>" 申请未通过审核。
          </p>
          <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">审核反馈</h3>
            <p style="color: #b91c1c; line-height: 1.6;">
              ${data.reason}
            </p>
          </div>
          <p style="color: #6b7280; line-height: 1.6;">
            如有疑问，请联系平台管理员或重新提交申请。
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          © 2026 社团招新平台
        </p>
      </div>
    `,
  }),
};

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // 解析请求体
    const { to, type, data } = await req.json();

    if (!to || !type || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, type, data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取邮件模板
    const template = emailTemplates[type as keyof typeof emailTemplates];
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Invalid email type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, html } = template(data);

    // 发送邮件
    const { data: emailData, error } = await resend.emails.send({
      from: '社团招新平台 <noreply@campus-club-ai.xyz>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('发送邮件失败:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('处理请求失败:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
