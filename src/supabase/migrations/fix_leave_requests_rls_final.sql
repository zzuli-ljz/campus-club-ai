-- ============================================
-- 彻底修复 leave_requests 表 RLS 策略（最终版）
-- ============================================

-- 1. 禁用并重新启用 RLS（清除缓存）
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略
DROP POLICY IF EXISTS "允许所有人查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户创建自己的退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户更新自己的待处理申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "创建退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员查看本社团退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户查看自己的退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户创建退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户更新自己的待处理申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员删除退出申请" ON leave_requests;

-- 3. 创建新的 RLS 策略（使用 OR 合并条件）

-- 允许社团管理员查看本社团的退出申请，或用户查看自己的申请
CREATE POLICY "查看退出申请" ON leave_requests
    FOR SELECT 
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );

-- 允许用户创建退出申请
CREATE POLICY "创建退出申请" ON leave_requests
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己待处理的申请
CREATE POLICY "用户更新退出申请" ON leave_requests
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
