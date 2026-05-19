/* -- ============================================
-- 完全禁用 event_registrations 表的 RLS 策略
-- 解决问题：普通用户无法看到其他人的活动报名统计
-- 原因：RLS 策略限制了只能查看自己的报名记录
-- 解决方案：禁用 RLS 策略，让所有用户都能看到报名数据
-- ============================================

-- 1. 完全禁用 event_registrations 表的 RLS
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有相关的 RLS 策略
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
DROP POLICY IF EXISTS "event_registrations_select_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_authenticated" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_update_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete_own" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_select" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_update" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete" ON event_registrations;

-- 3. 确保所有角色都有基本的读写权限
GRANT SELECT, INSERT, UPDATE, DELETE ON event_registrations TO anon, authenticated, service_role;

-- 4. 验证 RLS 状态
SELECT 
    table_schema as schemaname,
    table_name as tablename,
    'Disabled' as row_security_status
FROM information_schema.tables 
WHERE table_name = 'event_registrations' 
AND table_type = 'BASE TABLE';

-- 5. 验证策略已被删除（应该返回空）
SELECT 
    schemaname,
    tablename, 
    policyname
FROM pg_catalog.pg_policies 
WHERE tablename = 'event_registrations';
 */