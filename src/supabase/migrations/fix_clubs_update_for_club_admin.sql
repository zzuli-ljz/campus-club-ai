-- ============================================
-- 修复：允许社团管理员（匿名用户）更新社团信息
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "clubs" ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的更新策略（如果存在）
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "clubs";
DROP POLICY IF EXISTS "允许匿名用户更新社团数据" ON "clubs";

-- 3. 创建新的更新策略：允许任何人（包括匿名用户/社团管理员）更新社团数据
-- 因为社团管理员通过 club_admin_accounts 表验证，不是标准 Supabase Auth 用户
CREATE POLICY "允许匿名用户更新社团数据"
ON "clubs" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. 确保其他操作的权限也正确设置
DROP POLICY IF EXISTS "允许匿名用户查询社团数据" ON "clubs";
CREATE POLICY "允许匿名用户查询社团数据"
ON "clubs" FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "允许匿名用户新增社团数据" ON "clubs";
CREATE POLICY "允许匿名用户新增社团数据"
ON "clubs" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "允许匿名用户删除社团数据" ON "clubs";
CREATE POLICY "允许匿名用户删除社团数据"
ON "clubs" FOR DELETE
TO anon, authenticated
USING (true);
