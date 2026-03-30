-- ============================================
-- 修复：允许匿名用户（学校管理员）管理社团管理员账号
-- ============================================

-- 1. 强制开启 RLS
ALTER TABLE "club_admin_accounts" ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "club_admin_accounts";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "club_admin_accounts";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "club_admin_accounts";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "club_admin_accounts";
DROP POLICY IF EXISTS "允许匿名用户查询社团管理员账号" ON "club_admin_accounts";
DROP POLICY IF EXISTS "允许匿名用户创建社团管理员账号" ON "club_admin_accounts";
DROP POLICY IF EXISTS "允许匿名用户更新社团管理员账号" ON "club_admin_accounts";
DROP POLICY IF EXISTS "允许匿名用户删除社团管理员账号" ON "club_admin_accounts";

-- 3. 创建新的策略：允许任何人（包括匿名用户）查询社团管理员账号
CREATE POLICY "允许匿名用户查询社团管理员账号"
ON "club_admin_accounts" FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 创建新的策略：允许任何人（包括匿名用户）创建社团管理员账号
CREATE POLICY "允许匿名用户创建社团管理员账号"
ON "club_admin_accounts" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. 创建新的策略：允许任何人（包括匿名用户）更新社团管理员账号
CREATE POLICY "允许匿名用户更新社团管理员账号"
ON "club_admin_accounts" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. 创建新的策略：允许任何人（包括匿名用户）删除社团管理员账号（软删除）
CREATE POLICY "允许匿名用户删除社团管理员账号"
ON "club_admin_accounts" FOR DELETE
TO anon, authenticated
USING (true);
