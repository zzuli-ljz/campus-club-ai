-- ============================================
-- 创建社团申请表（新社团申请功能）
-- ============================================

-- 创建社团申请表
CREATE TABLE IF NOT EXISTS club_applications (
    id BIGSERIAL PRIMARY KEY,
    -- 申请人信息
    applicant_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_identity VARCHAR(50) NOT NULL CHECK (applicant_identity IN ('student', 'teacher', 'staff', 'other')),
    applicant_student_id VARCHAR(50),
    -- 社团信息
    club_name VARCHAR(255) NOT NULL,
    club_category VARCHAR(100) NOT NULL,
    club_description TEXT,
    club_location VARCHAR(255),
    club_contact VARCHAR(255),
    club_tags TEXT[] DEFAULT '{}',
    -- 邮箱验证
    email_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(10),
    verification_sent_at TIMESTAMP WITH TIME ZONE,
    -- 申请状态
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(100),
    -- 创建时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE club_applications IS '新社团申请表';
COMMENT ON COLUMN club_applications.applicant_identity IS '申请人身份：student-学生，teacher-老师，staff-职工，other-其他';
COMMENT ON COLUMN club_applications.status IS '申请状态：pending-待处理，approved-已通过，rejected-已拒绝';

-- 启用 RLS
ALTER TABLE club_applications ENABLE ROW LEVEL SECURITY;

-- 允许任何人提交申请（INSERT）
CREATE POLICY "允许任何人提交社团申请"
ON club_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 允许申请人查看自己的申请（用于验证邮箱）
CREATE POLICY "申请人可查看自己的申请"
ON club_applications FOR SELECT
TO anon, authenticated
USING (
    auth.uid() IS NOT NULL 
    OR applicant_email = current_setting('app.current_email', true)
);

-- 允许更新自己的申请（仅在 pending 状态时，用于邮箱验证）
CREATE POLICY "申请人可更新自己的申请"
ON club_applications FOR UPDATE
TO anon, authenticated
USING (status = 'pending');

-- 允许学校管理员管理所有申请
CREATE POLICY "学校管理员可管理社团申请"
ON club_applications FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'school_admin'
    )
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_club_applications_status ON club_applications(status);
CREATE INDEX IF NOT EXISTS idx_club_applications_email ON club_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_club_applications_created_at ON club_applications(created_at DESC);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_club_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_club_applications_updated_at ON club_applications;
CREATE TRIGGER trigger_update_club_applications_updated_at
    BEFORE UPDATE ON club_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_club_applications_updated_at();
