-- ============================================
-- 修改社团动态表：添加活动报名相关字段
-- ============================================

-- 添加报名功能字段
ALTER TABLE club_posts ADD COLUMN IF NOT EXISTS requires_registration BOOLEAN DEFAULT false;
ALTER TABLE club_posts ADD COLUMN IF NOT EXISTS registration_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE club_posts ADD COLUMN IF NOT EXISTS registration_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE club_posts ADD COLUMN IF NOT EXISTS max_participants INTEGER; -- NULL 表示不限制人数
ALTER TABLE club_posts ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT false; -- 报名入口是否开放

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_club_posts_requires_registration ON club_posts(requires_registration);
