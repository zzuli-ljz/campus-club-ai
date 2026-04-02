-- ============================================
-- 分类标签映射表
-- 用于存储每个分类对应的标签，支持动态添加
-- ============================================

CREATE TABLE IF NOT EXISTS category_tags (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, tag)
);

-- 插入默认标签数据
INSERT INTO category_tags (category, tag, is_custom) VALUES
-- 学术科技
('学术科技', '数学建模', false),
('学术科技', '编程开发', false),
('学术科技', '人工智能', false),
('学术科技', '物理研究', false),
('学术科技', '化学实验', false),
('学术科技', '生物探索', false),
('学术科技', '文学创作', false),
('学术科技', '历史研究', false),
('学术科技', '辩论演讲', false),
('学术科技', '创新创业', false),
-- 文艺创作
('文艺创作', '合唱团', false),
('文艺创作', '舞蹈队', false),
('文艺创作', '话剧社', false),
('文艺创作', '吉他社', false),
('文艺创作', '摄影协会', false),
('文艺创作', '绘画艺术', false),
('文艺创作', '书法篆刻', false),
('文艺创作', '器乐演奏', false),
('文艺创作', '诗词创作', false),
('文艺创作', '微电影', false),
-- 体育运动
('体育运动', '篮球', false),
('体育运动', '足球', false),
('体育运动', '羽毛球', false),
('体育运动', '乒乓球', false),
('体育运动', '网球', false),
('体育运动', '游泳', false),
('体育运动', '跑步', false),
('体育运动', '健身', false),
('体育运动', '瑜伽', false),
('体育运动', '武术', false),
('体育运动', '轮滑', false),
('体育运动', '电竞', false),
-- 公益实践
('公益实践', '志愿服务', false),
('公益实践', '环保公益', false),
('公益实践', '支教助学', false),
('公益实践', '社区服务', false),
('公益实践', '动物保护', false),
('公益实践', '红十字会', false),
('公益实践', '心理援助', false),
('公益实践', '法律咨询', false),
('公益实践', '医疗健康', false),
('公益实践', '公益摄影', false),
-- 技术工程
('技术工程', '机器人', false),
('技术工程', '无人机', false),
('技术工程', '3D打印', false),
('技术工程', '电子设计', false),
('技术工程', '网络安全', false),
('技术工程', '数据分析', false),
('技术工程', '产品经理', false),
('技术工程', 'UI设计', false),
('技术工程', '游戏开发', false),
('技术工程', '区块链技术', false)
ON CONFLICT DO NOTHING;

-- 添加RLS策略（如果表已存在则跳过）
DO $$
BEGIN
    -- 允许任何人读取标签
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'category_tags' AND policyname = '允许任何人读取标签'
    ) THEN
        CREATE POLICY "允许任何人读取标签" ON category_tags
            FOR SELECT USING (true);
    END IF;
    
    -- 允许学校管理员管理标签
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'category_tags' AND policyname = '允许管理员管理标签'
    ) THEN
        CREATE POLICY "允许管理员管理标签" ON category_tags
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'school_admin'
                )
            );
    END IF;
END
$$;
