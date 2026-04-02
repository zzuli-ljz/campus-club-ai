-- ============================================
-- 为 club_posts 表添加 event_date 字段
-- 用于存储活动预告的日期
-- ============================================

-- 添加 event_date 列（如果尚不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'club_posts' AND column_name = 'event_date'
    ) THEN
        ALTER TABLE club_posts ADD COLUMN event_date DATE;
    END IF;
END $$;

-- 更新 RLS 策略确保匿名用户和认证用户都能查询和插入
DROP POLICY IF EXISTS "允许匿名用户查询动态" ON "club_posts";
DROP POLICY IF EXISTS "登录用户可发布动态" ON "club_posts";
DROP POLICY IF EXISTS "作者可修改动态" ON "club_posts";
DROP POLICY IF EXISTS "作者可删除动态" ON "club_posts";

-- 重新创建策略
CREATE POLICY "允许匿名用户查询动态"
ON "club_posts" FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "登录用户可发布动态"
ON "club_posts" FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "作者可修改动态"
ON "club_posts" FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "作者可删除动态"
ON "club_posts" FOR DELETE
TO anon, authenticated
USING (true);
