-- ============================================
-- 修复：允许匿名用户和认证用户访问 club_members 表
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "club_members" ENABLE ROW LEVEL SECURITY;

-- 2. 清理旧策略
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "club_members";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "club_members";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "club_members";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "club_members";
DROP POLICY IF EXISTS "允许匿名用户查询成员" ON "club_members";
DROP POLICY IF EXISTS "允许匿名用户新增成员" ON "club_members";
DROP POLICY IF EXISTS "允许匿名用户修改成员" ON "club_members";
DROP POLICY IF EXISTS "允许匿名用户删除成员" ON "club_members";

-- 3. 创建新策略：允许任何人查询成员数据（因为成员列表是公开信息）
CREATE POLICY "允许匿名用户查询成员"
ON "club_members" FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 创建新策略：允许任何人插入成员数据
CREATE POLICY "允许匿名用户新增成员"
ON "club_members" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. 创建新策略：允许任何人更新成员数据
CREATE POLICY "允许匿名用户修改成员"
ON "club_members" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. 创建新策略：允许任何人删除成员数据
CREATE POLICY "允许匿名用户删除成员"
ON "club_members" FOR DELETE
TO anon, authenticated
USING (true);
