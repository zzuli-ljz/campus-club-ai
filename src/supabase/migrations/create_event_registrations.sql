-- ============================================
-- 创建活动报名表
-- ============================================

CREATE TABLE IF NOT EXISTS event_registrations (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 报名信息
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    -- 报名状态
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 确保同一用户对同一活动只能报名一次
    UNIQUE(post_id, user_id)
);

-- 启用 RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 允许任何人查询报名信息（仅限已注册用户查询自己的）
CREATE POLICY "允许用户查询自己的报名"
ON event_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 允许用户创建报名（使用 user_id = auth.uid() 确保用户只能以自己身份报名）
CREATE POLICY "允许用户报名活动"
ON event_registrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 允许用户取消自己的报名
CREATE POLICY "允许用户取消报名"
ON event_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (status = 'cancelled');

-- 允许社团管理员管理报名
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_registrations_post_id ON event_registrations(post_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_club_id ON event_registrations(club_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
