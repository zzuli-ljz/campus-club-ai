-- ============================================
-- 创建公开的报名统计 RPC 函数（绕过 RLS 限制）
-- 问题：普通用户无法看到其他人的报名统计
-- 解决方案：创建 service_role 级别的 RPC 函数获取报名人数
-- ============================================

-- 1. 创建获取报名统计的 RPC 函数（使用 SECURITY DEFINER 以 service_role 运行）
CREATE OR REPLACE FUNCTION get_registration_stats_public(p_post_id BIGINT)
RETURNS TABLE (
    registered_count BIGINT,
    max_participants BIGINT,
    is_full BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM event_registrations 
            WHERE post_id = p_post_id 
            AND status = 'registered'
        ), 0) as registered_count,
        COALESCE((
            SELECT max_participants::BIGINT 
            FROM club_posts 
            WHERE id = p_post_id
        ), NULL) as max_participants,
        COALESCE((
            SELECT COUNT(*) >= max_participants 
            FROM event_registrations er
            JOIN club_posts cp ON cp.id = er.post_id
            WHERE er.post_id = p_post_id 
            AND er.status = 'registered'
        ), false) as is_full;
END;
$$;

-- 2. 授予 public 角色执行权限
GRANT EXECUTE ON FUNCTION get_registration_stats_public(BIGINT) TO anon, authenticated, service_role;

-- 3. 验证函数创建成功
SELECT 
    routine_name,
    data_type
FROM information_schema.routines
WHERE routine_name = 'get_registration_stats_public';

-- 4. 测试函数（需要在数据库中执行）
-- SELECT * FROM get_registration_stats_public(活动ID);
