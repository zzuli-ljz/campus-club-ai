-- ============================================
-- 修复 profiles 表的删除策略
-- ============================================

-- 允许已认证用户（包括学校管理员）删除数据
DROP POLICY IF EXISTS "Allow authenticated delete profiles" ON profiles;
CREATE POLICY "Allow authenticated delete profiles" 
ON profiles FOR DELETE 
TO authenticated 
USING (true);

-- 允许匿名用户（用于学校管理员本地模式）删除数据
DROP POLICY IF EXISTS "Allow anon delete profiles" ON profiles;
CREATE POLICY "Allow anon delete profiles" 
ON profiles FOR DELETE 
TO anon 
USING (true);

-- 同时也为社团管理员账号表添加删除策略（硬删除支持）
DROP POLICY IF EXISTS "Allow authenticated delete club_admin_accounts" ON club_admin_accounts;
CREATE POLICY "Allow authenticated delete club_admin_accounts" 
ON club_admin_accounts FOR DELETE 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow anon delete club_admin_accounts" ON club_admin_accounts;
CREATE POLICY "Allow anon delete club_admin_accounts" 
ON club_admin_accounts FOR DELETE 
TO anon 
USING (true);
