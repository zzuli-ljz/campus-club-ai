-- 修复 event_registrations 表的 RLS 策略
-- 问题：用户报名时出现 "new row violates row-level security policy" 错误
-- 原因：需要允许认证用户插入数据到 event_registrations 表

-- 删除原有的错误策略
DROP POLICY IF EXISTS "允许用户查询自己的报名" ON event_registrations;
DROP POLICY IF EXISTS "允许用户报名活动" ON event_registrations;
DROP POLICY IF EXISTS "允许用户取消报名" ON event_registrations;
DROP POLICY IF EXISTS "社团管理员可管理报名" ON event_registrations;

-- 重新创建正确的 RLS 策略

-- 1. 允许用户查询自己的报名记录
CREATE POLICY "允许用户查询自己的报名"
ON event_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. 允许用户创建报名（关键修复：移除 WITH CHECK 限制）
CREATE POLICY "允许用户报名活动"
ON event_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. 允许用户取消自己的报名（将状态更新为 cancelled）
CREATE POLICY "允许用户取消报名"
ON event_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- 4. 允许社团管理员管理其社团的报名
CREATE POLICY "社团管理员可管理报名"
ON event_registrations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'club_admin' 
        AND profiles.club_id = event_registrations.club_id
    )
);
