-- ============================================
-- 为社团评价表添加管理员回复字段
-- ============================================

-- 添加 reply 字段（如果不存在）
ALTER TABLE IF EXISTS club_reviews 
ADD COLUMN IF NOT EXISTS reply TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replied_by VARCHAR(100);

-- 更新 RLS 策略，允许社团管理员回复评价
CREATE POLICY "允许社团管理员回复评价"
ON "club_reviews" FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM club_admin_accounts caa
        WHERE caa.club_id = club_reviews.club_id
        AND caa.email = auth.email()
        AND caa.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM club_admin_accounts caa
        WHERE caa.club_id = club_reviews.club_id
        AND caa.email = auth.email()
        AND caa.is_active = true
    )
);
