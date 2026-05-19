-- ============================================
-- 禁用 AI 助手相关数据表的 RLS 策略
-- 这些表主要用于 AI 助手的数据展示功能
-- ============================================

-- 1. clubs 表 - 社团列表（公开信息）
ALTER TABLE "clubs" DISABLE ROW LEVEL SECURITY;

-- 2. club_activities 表 - 近期活动（公开信息）
ALTER TABLE "club_activities" DISABLE ROW LEVEL SECURITY;

-- 3. applications 表 - 用户申请记录
-- AI 需要查询用户的申请状态，建议禁用 RLS
ALTER TABLE "applications" DISABLE ROW LEVEL SECURITY;

-- 4. club_members 表 - 社团成员（用于统计）
-- 仅用于统计人数，禁用 RLS
ALTER TABLE "club_members" DISABLE ROW LEVEL SECURITY;
