-- ============================================
-- 为 club_activities 表添加 author_id 列
-- ============================================

-- 添加 author_id 列（如果尚不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'club_activities' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE club_activities ADD COLUMN author_id UUID;
    END IF;
END $$;

-- 更新 RLS 策略，允许社团管理员插入数据
DROP POLICY IF EXISTS "登录用户可发布活动" ON "club_activities";
CREATE POLICY "登录用户可发布活动"
ON "club_activities" FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 确保查询策略允许匿名用户查看
DROP POLICY IF EXISTS "允许匿名用户查询活动" ON "club_activities";
CREATE POLICY "允许匿名用户查询活动"
ON "club_activities" FOR SELECT
TO anon, authenticated
USING (true);
