-- ============================================
-- 修复 leave_requests 唯一约束问题
-- 允许用户退出后再重新申请加入同一社团
-- ============================================

-- 1. 删除旧的全局唯一约束
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_club_id_key;

-- 2. 添加部分唯一索引：只对 pending 状态生效
-- 这样用户可以有多个已处理记录，但只能有一个 pending
CREATE UNIQUE INDEX IF NOT EXISTS leave_requests_pending_unique 
ON leave_requests (user_id, club_id) 
WHERE status = 'pending';

-- 3. 重新创建 RLS 策略（删除旧策略并重建）
DROP POLICY IF EXISTS "允许所有人查看退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户创建自己的退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许用户更新自己的待处理申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员更新退出申请" ON leave_requests;
DROP POLICY IF EXISTS "允许社团管理员查看退出申请" ON leave_requests;

-- 社团管理员和用户自己可以查看
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

-- 允许用户创建退出申请
CREATE POLICY "创建退出申请" ON leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的待处理申请
CREATE POLICY "用户更新退出申请" ON leave_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 允许社团管理员更新退出申请
CREATE POLICY "社团管理员更新退出申请" ON leave_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'club_admin'
            AND profiles.club_id = leave_requests.club_id
        )
    );
