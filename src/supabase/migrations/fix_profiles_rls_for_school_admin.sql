-- ============================================
-- 修复 profiles 表的 RLS 策略，允许学校管理员读取学生数据
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow anon read profiles" ON profiles;

-- 创建新策略：允许匿名用户读取所有 profiles（用于学校管理员本地账号）
CREATE POLICY "Allow anon read profiles" 
ON profiles FOR SELECT 
TO anon 
USING (true);

-- 创建策略：允许已认证用户读取所有 profiles
DROP POLICY IF EXISTS "Allow authenticated read all profiles" ON profiles;
CREATE POLICY "Allow authenticated read all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 创建策略：允许已认证用户更新自己的资料
DROP POLICY IF EXISTS "Allow authenticated update own profile" ON profiles;
CREATE POLICY "Allow authenticated update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 创建策略：允许已认证用户插入自己的资料
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON profiles;
CREATE POLICY "Allow authenticated insert own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
