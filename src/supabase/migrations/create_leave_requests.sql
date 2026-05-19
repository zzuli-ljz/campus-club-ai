-- ============================================
-- 社团退出申请表
-- ============================================

-- 创建退出申请表
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    apply_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 确保同一用户同一社团只有一个待处理的退出申请
    UNIQUE(user_id, club_id)
);

-- 添加注释
COMMENT ON TABLE leave_requests IS '社团退出申请表';
COMMENT ON COLUMN leave_requests.user_id IS '申请人用户ID';
COMMENT ON COLUMN leave_requests.club_id IS '社团ID';
COMMENT ON COLUMN leave_requests.user_name IS '申请人姓名';
COMMENT ON COLUMN leave_requests.student_id IS '申请人学号';
COMMENT ON COLUMN leave_requests.reason IS '退出原因';
COMMENT ON COLUMN leave_requests.status IS '申请状态：pending-待审核，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN leave_requests.apply_time IS '申请时间';

-- RLS 策略
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看（社团管理员需要查看）
CREATE POLICY "允许所有人查看退出申请" ON leave_requests
    FOR SELECT USING (true);

-- 允许已认证用户创建自己的退出申请
CREATE POLICY "允许用户创建自己的退出申请" ON leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己待处理的申请
CREATE POLICY "允许用户更新自己的待处理申请" ON leave_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
