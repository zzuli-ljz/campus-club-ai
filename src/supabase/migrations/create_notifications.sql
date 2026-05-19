-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- 接收通知的用户ID
  type VARCHAR(50) NOT NULL,       -- 通知类型
  title VARCHAR(255) NOT NULL,     -- 通知标题
  content TEXT,                     -- 通知内容
  related_id INTEGER,              -- 关联ID（如社团ID、申请ID等）
  related_type VARCHAR(50),        -- 关联类型（如 club, application, post等）
  is_read BOOLEAN DEFAULT FALSE,   -- 是否已读
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 通知类型说明：
-- student: 申请成功 (application_approved)
-- student: 申请失败 (application_rejected)
-- student: 退出成功 (leave_approved)
-- student: 退出失败 (leave_rejected)
-- student: 新动态通知 (new_post)
-- club_admin: 新成员申请 (new_application)
-- club_admin: 成员退出申请 (new_leave_request)
