-- ============================================-- 修复：允许学校管理员（通过 school_admin_accounts 表）访问 club_applications-- ============================================

-- 1. 删除旧的学校管理员策略DROP POLICY IF EXISTS "学校管理员可管理社团申请" ON club_applications;

-- 2. 创建新的学校管理员策略（支持 profiles 和 school_admin_accounts 两个表）CREATE POLICY "学校管理员可管理社团申请"
ON club_applications FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'school_admin'
    )
    OR
    EXISTS (
        SELECT 1 FROM school_admin_accounts
        WHERE id = auth.uid()
    )
);

-- 3. 确保匿名用户也可以查询（用于调试）DROP POLICY IF EXISTS "允许匿名查询社团申请" ON club_applications;
CREATE POLICY "允许匿名查询社团申请"
ON club_applications FOR SELECT
TO anon
USING (true);
