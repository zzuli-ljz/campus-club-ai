-- ============================================
-- 创建社团动态/公告表
-- ============================================

-- 创建社团动态表
CREATE TABLE IF NOT EXISTS club_posts (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    type VARCHAR(50) DEFAULT 'post' CHECK (type IN ('post', 'notice', 'event', 'achievement')),
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 RLS 策略
ALTER TABLE "club_posts" ENABLE ROW LEVEL SECURITY;

-- 允许任何人查询动态
CREATE POLICY "允许匿名用户查询动态"
ON "club_posts" FOR SELECT
TO anon, authenticated
USING (true);

-- 仅登录用户可发布
CREATE POLICY "登录用户可发布动态"
ON "club_posts" FOR INSERT
TO authenticated
WITH CHECK (true);

-- 仅作者可修改
CREATE POLICY "作者可修改动态"
ON "club_posts" FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (true);

-- 仅作者可删除
CREATE POLICY "作者可删除动态"
ON "club_posts" FOR DELETE
TO authenticated
USING (author_id = auth.uid());
