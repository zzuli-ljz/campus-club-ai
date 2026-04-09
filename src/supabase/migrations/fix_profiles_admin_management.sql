-- ============================================
-- 修复学校管理员管理权限：允许编辑和彻底删除账号
-- ============================================

-- 1. 彻底修复 profiles 表的 RLS 策略，允许管理员操作所有行
-- 删除旧的更新策略
DROP POLICY IF EXISTS "Allow authenticated update own profile" ON profiles;
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON profiles;

-- 创建新策略：用户可以更新自己的资料，或者学校管理员可以更新所有资料
CREATE POLICY "Allow update profiles" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'school_admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'school_admin'
  )
);

-- 删除旧的删除策略
DROP POLICY IF EXISTS "Allow authenticated delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow anon delete profiles" ON profiles;
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON profiles;

-- 创建新策略：学校管理员可以删除所有资料
CREATE POLICY "Allow school admin delete profiles" 
ON profiles FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'school_admin'
  )
);

-- 2. 【核心功能】创建触发器：当 profiles 记录被删除时，自动删除对应的 auth.users 账号
-- 这需要一个 SECURITY DEFINER 函数，因为它需要绕过权限操作 auth 模式
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 注意：这需要给 public 角色授予调用权限，或者使用 service_role 权限执行
  -- 在 Supabase 中，SECURITY DEFINER 函数以创建者权限运行（通常是 postgres 账号）
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS tr_delete_auth_user ON profiles;
CREATE TRIGGER tr_delete_auth_user
AFTER DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- 3. 修复 club_admin_accounts 的权限（可选，确保管理员能硬删除）
DROP POLICY IF EXISTS "Allow authenticated delete club_admin_accounts" ON club_admin_accounts;
CREATE POLICY "Allow authenticated delete club_admin_accounts" 
ON club_admin_accounts FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'school_admin'
  )
);
