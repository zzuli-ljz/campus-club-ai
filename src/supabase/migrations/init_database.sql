-- ============================================
-- 高校社团招新平台数据库初始化脚本
-- ============================================

-- 创建社团表
CREATE TABLE IF NOT EXISTS clubs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    members INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    image VARCHAR(500),
    location VARCHAR(255),
    founded VARCHAR(50),
    president VARCHAR(100),
    contact VARCHAR(255),
    is_recruiting BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户资料表（与 Supabase Auth 关联）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT '',
    student_id VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'club_admin', 'school_admin')),
    club_id BIGINT REFERENCES clubs(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户兴趣标签表
CREATE TABLE IF NOT EXISTS user_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag)
);

-- 创建报名申请表
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    self_intro TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    apply_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建社团管理员账号表（由学校管理员创建）
CREATE TABLE IF NOT EXISTS club_admin_accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    club_name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 创建收藏社团表
CREATE TABLE IF NOT EXISTS favorite_clubs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, club_id)
);

-- 创建社团成员表
CREATE TABLE IF NOT EXISTS club_members (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) DEFAULT '成员',
    major VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建社团活动表
CREATE TABLE IF NOT EXISTS club_activities (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    activity_date DATE,
    participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    type VARCHAR(50) DEFAULT 'activity' CHECK (type IN ('notice', 'activity', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入示例社团数据
INSERT INTO clubs (name, category, description, members, tags, image, location, founded, president, contact, is_recruiting)
VALUES 
('程序设计协会', '学术科技', '专注于算法竞赛、编程技术交流和项目实战，定期举办编程马拉松和技术分享会。', 156, ARRAY['编程开发', '人工智能', '数学建模'], 'https://nocode.meituan.com/photo/search?keyword=programming,coding&width=400&height=300', '科技楼 301', '2015年', '张明', 'programming@school.edu.cn', true),
('摄影协会', '文艺创作', '用镜头记录美好瞬间，定期组织外拍活动、摄影培训和作品展览。', 89, ARRAY['摄影协会', '绘画艺术', '微电影'], 'https://nocode.meituan.com/photo/search?keyword=photography,camera&width=400&height=300', '艺术中心 205', '2012年', '刘芳', 'photo@school.edu.cn', true),
('篮球社', '体育运动', '热爱篮球，享受团队合作的乐趣。每周定期训练，组织校内联赛。', 120, ARRAY['篮球', '健身'], 'https://nocode.meituan.com/photo/search?keyword=basketball,sport&width=400&height=300', '体育馆', '2010年', '王强', 'basketball@school.edu.cn', true),
('志愿者协会', '公益实践', '致力于社区服务、支教助学和环保公益，用行动传递温暖。', 200, ARRAY['志愿服务', '支教助学', '环保公益'], 'https://nocode.meituan.com/photo/search?keyword=volunteer,community&width=400&height=300', '学生活动中心 102', '2008年', '陈静', 'volunteer@school.edu.cn', true),
('机器人创新实验室', '技术工程', '探索机器人技术，参与各类机器人竞赛，培养工程实践能力。', 45, ARRAY['机器人', '电子设计', '3D打印', '编程开发'], 'https://nocode.meituan.com/photo/search?keyword=robot,technology&width=400&height=300', '工程楼 实验室 B', '2018年', '吴昊', 'robot@school.edu.cn', true),
('合唱团', '文艺创作', '用歌声传递情感，定期举办音乐会和参加校内外演出。', 80, ARRAY['合唱团', '器乐演奏'], 'https://nocode.meituan.com/photo/search?keyword=choir,singing&width=400&height=300', '音乐厅', '2011年', '李丽', 'choir@school.edu.cn', true),
('羽毛球协会', '体育运动', '挥洒汗水，享受运动的快乐。新手友好，提供基础训练。', 95, ARRAY['羽毛球', '健身'], 'https://nocode.meituan.com/photo/search?keyword=badminton,sport&width=400&height=300', '羽毛球馆', '2014年', '赵敏', 'badminton@school.edu.cn', true),
('AI 创新社', '学术科技', '探索人工智能前沿技术，开展机器学习项目实战和论文研讨。', 78, ARRAY['人工智能', '编程开发', '数据分析'], 'https://nocode.meituan.com/photo/search?keyword=artificial,intelligence&width=400&height=300', '科技楼 405', '2019年', '孙伟', 'ai@school.edu.cn', true)
ON CONFLICT DO NOTHING;
