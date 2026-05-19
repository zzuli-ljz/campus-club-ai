-- ============================================
-- 彻底修复 leave_requests 表 RLS 策略
-- ============================================

-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "允许所有人查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户创建自己的退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户更新自己的待处理申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "创建退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员更新退出申请" ON leave_requests;

-- 2. 删除旧约束和索引
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_club_id_key;
DROP INDEX IF EXISTS leave_requests_pending_unique;

-- 3. 添加部分唯一索引（只对 pending 状态生效）
CREATE UNIQUE INDEX leave_requests_pending_unique 
ON leave_requests (user_id, club_id) 
WHERE status = 'pending';

-- 4. 确保 RLS 已启用
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略（更简单的版本）

-- 允许社团管理员查看本社团的退出申请
CREATE POLICY "社团管理员查看本社团退出申请" ON leave_requests
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );

-- 允许用户查看自己的退出申请
CREATE POLICY "用户查看自己的退出申请" ON leave_requests
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 允许用户创建退出申请
CREATE POLICY "用户创建退出申请" ON leave_requests
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己待处理的申请
CREATE POLICY "用户更新自己的待处理申请" ON leave_requests
    FOR UPDATE 
    USING (auth.uid() = user_id AND status = 'pending');

-- 允许社团管理员更新本社团的退出申请
CREATE POLICY "社团管理员更新退出申请" ON leave_requests
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );

-- 允许社团管理员删除本社团的退出申请
CREATE POLICY "社团管理员删除退出申请" ON leave_requests
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );

-- 6. 验证 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'leave_requests';
