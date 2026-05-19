-- ============================================
-- 重新启用 RLS 并创建简化策略
-- ============================================

-- 启用 RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "创建退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员删除退出申请" ON leave_requests;

-- 创建简化策略：允许所有已认证用户查看和操作
-- 注意：这个策略允许所有认证用户访问，建议后续根据需要收紧

-- 允许已认证用户查看所有退出申请（测试用）
CREATE POLICY "查看退出申请" ON leave_requests
    FOR SELECT 
    TO authenticated
    USING (true);

-- 允许已认证用户创建退出申请
CREATE POLICY "创建退出申请" ON leave_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 允许已认证用户更新退出申请
CREATE POLICY "更新退出申请" ON leave_requests
    FOR UPDATE 
    TO authenticated
    USING (true);

-- 允许已认证用户删除退出申请
CREATE POLICY "删除退出申请" ON leave_requests
    FOR DELETE 
    TO authenticated
    USING (true);
