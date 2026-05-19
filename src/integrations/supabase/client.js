import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// 创建配置了认证选项的 Supabase 客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // 自动刷新令牌
    autoRefreshToken: true,
    // 持久化会话到 localStorage
    persistSession: true,
    // 检测会话超时
    detectSessionInUrl: true,
    // 重定向时保留 URL 参数
    preserveRedirect: true,
  },
});

