-- ============================================
-- 修复：允许匿名用户和认证用户访问 club_activities 表
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "club_activities" ENABLE ROW LEVEL SECURITY;

-- 2. 清理旧策略
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "club_activities";
DROP POLICY IF EXISTS "允许匿名用户查询活动" ON "club_activities";
DROP POLICY IF EXISTS "允许匿名用户创建活动" ON "club_activities";
DROP POLICY IF EXISTS "允许匿名用户更新活动" ON "club_activities";
DROP POLICY IF EXISTS "允许匿名用户删除活动" ON "club_activities";

-- 3. 创建新策略：允许任何人查询活动数据
CREATE POLICY "允许匿名用户查询活动"
ON "club_activities" FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 创建新策略：允许任何人创建活动
CREATE POLICY "允许匿名用户创建活动"
ON "club_activities" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. 创建新策略：允许任何人更新活动
CREATE POLICY "允许匿名用户更新活动"
ON "club_activities" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. 创建新策略：允许任何人删除活动
CREATE POLICY "允许匿名用户删除活动"
ON "club_activities" FOR DELETE
TO anon, authenticated
USING (true);
