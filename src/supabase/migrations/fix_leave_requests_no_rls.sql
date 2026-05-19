-- ============================================
-- 测试用：禁用 leave_requests 表的 RLS
-- ============================================

-- 禁用 RLS（允许所有操作，用于测试）
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
