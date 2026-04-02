-- ============================================
-- 为社团评价表添加点赞数字段
-- ============================================

-- 添加 likes 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'club_reviews' 
        AND column_name = 'likes'
    ) THEN
        ALTER TABLE club_reviews 
        ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 确保回复相关字段也存在（如果不存在则添加）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'club_reviews' 
        AND column_name = 'reply'
    ) THEN
        ALTER TABLE club_reviews 
        ADD COLUMN reply TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'club_reviews' 
        AND column_name = 'replied_at'
    ) THEN
        ALTER TABLE club_reviews 
        ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'club_reviews' 
        AND column_name = 'replied_by'
    ) THEN
        ALTER TABLE club_reviews 
        ADD COLUMN replied_by VARCHAR(100);
    END IF;
END $$;

-- 添加 RLS 策略，允许任何人查询评价（与原有策略一致）
-- 先检查策略是否存在，避免重复创建
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'club_reviews' 
        AND policyname = '允许匿名用户查询评价'
    ) THEN
        CREATE POLICY "允许匿名用户查询评价"
        ON "club_reviews" FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;
