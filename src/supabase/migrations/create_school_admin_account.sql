-- ============================================
-- 创建学校管理员的 Supabase Auth 账号
-- ============================================

-- 创建学校管理员用户（使用固定 UUID）
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'school@admin.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"学校管理员"}'
)
ON CONFLICT (id) DO UPDATE 
SET 
  encrypted_password = crypt('admin123456', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- 创建对应的 profile 记录
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  created_at, 
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'school@admin.com',
  '学校管理员',
  'school_admin',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = '学校管理员',
  role = 'school_admin',
  updated_at = now();

-- 确保 RLS 策略允许学校管理员访问所有数据
-- 这里假设 profiles 表有适当的 RLS 策略
