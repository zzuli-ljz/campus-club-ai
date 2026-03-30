-- ============================================
-- 修复：允许匿名用户（包括学校管理员）读取社团数据
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "clubs" ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的查询策略（如果存在）
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "clubs";
DROP POLICY IF EXISTS "允许匿名用户查询社团数据" ON "clubs";

-- 3. 创建新的查询策略：允许任何人（包括匿名用户）读取社团数据
-- 因为社团列表应该是公开信息，任何人都可以浏览
CREATE POLICY "允许匿名用户查询社团数据"
ON "clubs" FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 保留其他操作的权限限制为仅登录用户
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "clubs";
CREATE POLICY "仅登录用户可新增数据"
ON "clubs" FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "clubs";
CREATE POLICY "仅登录用户可修改数据"
ON "clubs" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "clubs";
CREATE POLICY "仅登录用户可删除数据"
ON "clubs" FOR DELETE
TO authenticated
USING (true);
