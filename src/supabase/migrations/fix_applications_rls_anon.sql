-- ============================================
-- 修复：允许匿名用户（社团管理员）查询申请数据
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;

-- 2. 清理旧策略，防止同名冲突
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "applications";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "applications";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "applications";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "applications";
DROP POLICY IF EXISTS "允许匿名用户查询申请数据" ON "applications";
DROP POLICY IF EXISTS "允许匿名用户新增申请数据" ON "applications";
DROP POLICY IF EXISTS "允许匿名用户修改申请数据" ON "applications";
DROP POLICY IF EXISTS "允许匿名用户删除申请数据" ON "applications";

-- 3. 创建新的查询策略：允许任何人（包括匿名用户）查询申请数据
CREATE POLICY "允许匿名用户查询申请数据"
ON "applications" FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 创建新的插入策略：允许任何人提交申请
CREATE POLICY "允许匿名用户新增申请数据"
ON "applications" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. 创建新的更新策略：允许任何人更新申请状态（社团管理员审核用）
CREATE POLICY "允许匿名用户修改申请数据"
ON "applications" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. 创建新的删除策略：允许任何人删除申请
CREATE POLICY "允许匿名用户删除申请数据"
ON "applications" FOR DELETE
TO anon, authenticated
USING (true);
