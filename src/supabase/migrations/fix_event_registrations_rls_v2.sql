-- ============================================
-- 修复 event_registrations 表的 RLS 策略（简化版）
-- ============================================
-- 问题：用户报名时出现 "new row violates row-level security policy" 错误
-- 原因：需要允许认证用户插入数据到 event_registrations 表

-- 1. 先禁用再启用 RLS（清除任何缓存的策略）
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有可能存在的旧策略
DROP POLICY IF EXISTS "允许用户查询自己的报名" ON event_registrations;
DROP POLICY IF EXISTS "允许用户报名活动" ON event_registrations;
DROP POLICY IF EXISTS "允许用户取消报名" ON event_registrations;
DROP POLICY IF EXISTS "社团管理员可管理报名" ON event_registrations;
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON event_registrations;
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON event_registrations;
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON event_registrations;
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON event_registrations;
DROP POLICY IF EXISTS "Allow anon select" ON event_registrations;
DROP POLICY IF EXISTS "Allow anon insert" ON event_registrations;
DROP POLICY IF EXISTS "Allow anon update" ON event_registrations;
DROP POLICY IF EXISTS "Allow anon delete" ON event_registrations;

-- 3. 重新创建简化后的 RLS 策略

-- 3.1 允许认证用户查询报名记录（用户只能查看自己的报名）
CREATE POLICY "event_registrations_select_own"
ON event_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3.2 允许认证用户创建报名记录
CREATE POLICY "event_registrations_insert_authenticated"
ON event_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3.3 允许认证用户更新自己的报名记录（取消报名）
CREATE POLICY "event_registrations_update_own"
ON event_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3.4 允许认证用户删除自己的报名记录（管理员也可以删除）
CREATE POLICY "event_registrations_delete_own"
ON event_registrations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 4. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_event_registrations_post_id ON event_registrations(post_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_club_id ON event_registrations(club_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- 5. 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    'Enabled' as row_security_status
FROM information_schema.tables 
WHERE tablename = 'event_registrations' 
AND table_type = 'BASE TABLE';

-- 6. 验证策略已创建
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'event_registrations';
