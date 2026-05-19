-- ============================================
-- 修复 leave_requests 表
-- ============================================

-- 1. 删除所有旧策略（包括可能重复创建的）
DROP POLICY IF EXISTS "允许所有人查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户创建自己的退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户更新自己的待处理申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "创建退出申请" ON leave_requests;
DROP POLICY IF EXISTS "用户更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "社团管理员更新退出申请" ON leave_requests;

-- 2. 删除旧的全局唯一约束
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_club_id_key;

-- 3. 删除旧的部分索引（如果存在）
DROP INDEX IF EXISTS leave_requests_pending_unique;

-- 4. 添加部分唯一索引：只对 pending 状态生效
CREATE UNIQUE INDEX leave_requests_pending_unique 
ON leave_requests (user_id, club_id) 
WHERE status = 'pending';

-- 5. 重新创建 RLS 策略

-- 查看权限：社团管理员或申请者自己
CREATE POLICY "查看退出申请" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
        OR auth.uid() = user_id
    );

-- 创建权限：用户自己
CREATE POLICY "创建退出申请" ON leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新权限：用户自己更新待处理申请
CREATE POLICY "用户更新退出申请" ON leave_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 更新权限：社团管理员可以更新本社团的申请
CREATE POLICY "社团管理员更新退出申请" ON leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );
