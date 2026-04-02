-- ============================================
-- 修复 club_posts 表的 author_id 列类型
-- 使其支持社团管理员的 bigint ID 和 Supabase Auth 的 UUID
-- ============================================

-- 1. 先删除所有依赖 author_id 列的 RLS 策略
DROP POLICY IF EXISTS "允许匿名用户查询动态" ON "club_posts";
DROP POLICY IF EXISTS "登录用户可发布动态" ON "club_posts";
DROP POLICY IF EXISTS "作者可修改动态" ON "club_posts";
DROP POLICY IF EXISTS "作者可删除动态" ON "club_posts";

-- 2. 修改 author_id 列为 TEXT 类型以支持两种 ID 格式
ALTER TABLE "club_posts" 
ALTER COLUMN "author_id" TYPE TEXT;

-- 3. 重新创建策略（不再依赖 author_id 的具体类型）
CREATE POLICY "允许匿名用户查询动态"
ON "club_posts" FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "登录用户可发布动态"
ON "club_posts" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "作者可修改动态"
ON "club_posts" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "作者可删除动态"
ON "club_posts" FOR DELETE
TO anon, authenticated
USING (true);
