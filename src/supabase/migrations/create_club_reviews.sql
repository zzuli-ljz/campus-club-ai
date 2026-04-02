-- ============================================
-- 创建社团评价表
-- ============================================

-- 创建社团评价表
CREATE TABLE IF NOT EXISTS club_reviews (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 RLS 策略
ALTER TABLE "club_reviews" ENABLE ROW LEVEL SECURITY;

-- 允许任何人查询评价
CREATE POLICY "允许匿名用户查询评价"
ON "club_reviews" FOR SELECT
TO anon, authenticated
USING (true);

-- 仅登录用户可添加评价
CREATE POLICY "登录用户可添加评价"
ON "club_reviews" FOR INSERT
TO authenticated
WITH CHECK (true);

-- 仅评价作者可修改
CREATE POLICY "评价作者可修改"
ON "club_reviews" FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (true);

-- 仅评价作者可删除
CREATE POLICY "评价作者可删除"
ON "club_reviews" FOR DELETE
TO authenticated
USING (user_id = auth.uid());
