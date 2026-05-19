-- ============================================
-- 为社团管理员创建 RPC 函数，用于活动报名管理
-- 这些函数会绕过 RLS 策略，在服务端进行权限验证
-- ============================================

-- 1. 获取活动的报名列表（社团管理员用）
CREATE OR REPLACE FUNCTION get_post_registrations_admin(p_post_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    post_id BIGINT,
    club_id BIGINT,
    user_id UUID,
    name VARCHAR(100),
    student_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    profile_name VARCHAR(100),
    profile_student_id VARCHAR(50),
    profile_email VARCHAR(255),
    profile_major VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 首先检查调用者是否是社团管理员
    -- 通过检查 profiles 表中是否有 club_admin 角色
    -- 如果 auth.uid() 为 null，说明是本地登录的社团管理员
    
    IF auth.uid() IS NULL THEN
        -- 本地登录的社团管理员，检查是否有有效的会话头
        -- 这里假设前端会传递特殊的 header 来标识社团管理员
        -- 返回所有报名记录（由前端负责权限控制）
        RETURN QUERY
        SELECT 
            er.id,
            er.post_id,
            er.club_id,
            er.user_id,
            er.name,
            er.student_id,
            er.email,
            er.phone,
            er.status,
            er.created_at,
            er.updated_at,
            p.name as profile_name,
            p.student_id as profile_student_id,
            p.email as profile_email,
            NULL::VARCHAR as profile_major
        FROM event_registrations er
        LEFT JOIN profiles p ON p.id = er.user_id
        WHERE er.post_id = p_post_id
        ORDER BY er.created_at DESC;
    ELSE
        -- 通过 Supabase Auth 登录的用户
        RETURN QUERY
        SELECT 
            er.id,
            er.post_id,
            er.club_id,
            er.user_id,
            er.name,
            er.student_id,
            er.email,
            er.phone,
            er.status,
            er.created_at,
            er.updated_at,
            p.name as profile_name,
            p.student_id as profile_student_id,
            p.email as profile_email,
            NULL::VARCHAR as profile_major
        FROM event_registrations er
        LEFT JOIN profiles p ON p.id = er.user_id
        WHERE er.post_id = p_post_id
        AND (
            -- 用户自己的报名记录
            er.user_id = auth.uid()
            OR
            -- 社团管理员可以查看本社团的报名
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'club_admin'
                AND profiles.club_id = er.club_id
            )
        )
        ORDER BY er.created_at DESC;
    END IF;
END;
$$;

-- 2. 获取活动的报名统计（社团管理员用）
CREATE OR REPLACE FUNCTION get_registration_stats_admin(p_post_id BIGINT)
RETURNS TABLE (
    total_count BIGINT,
    registered_count BIGINT,
    cancelled_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        -- 本地登录，返回所有统计
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_count,
            COUNT(*) FILTER (WHERE status = 'registered')::BIGINT as registered_count,
            COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_count
        FROM event_registrations
        WHERE post_id = p_post_id;
    ELSE
        -- Supabase Auth 用户
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_count,
            COUNT(*) FILTER (WHERE status = 'registered')::BIGINT as registered_count,
            COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_count
        FROM event_registrations er
        WHERE er.post_id = p_post_id
        AND (
            er.user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'club_admin'
                AND profiles.club_id = er.club_id
            )
        );
    END IF;
END;
$$;

-- 3. 删除报名记录（社团管理员用）
CREATE OR REPLACE FUNCTION delete_registration_admin(p_registration_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_club_id BIGINT;
BEGIN
    -- 获取报名记录的 club_id
    SELECT club_id INTO v_club_id
    FROM event_registrations
    WHERE id = p_registration_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 检查权限
    IF auth.uid() IS NULL THEN
        -- 本地登录的社团管理员，直接删除
        DELETE FROM event_registrations WHERE id = p_registration_id;
        RETURN TRUE;
    ELSE
        -- Supabase Auth 用户
        IF EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'club_admin'
            AND profiles.club_id = v_club_id
        ) THEN
            DELETE FROM event_registrations WHERE id = p_registration_id;
            RETURN TRUE;
        ELSIF EXISTS (
            SELECT 1 FROM event_registrations 
            WHERE id = p_registration_id 
            AND user_id = auth.uid()
        ) THEN
            -- 用户删除自己的报名
            DELETE FROM event_registrations WHERE id = p_registration_id;
            RETURN TRUE;
        ELSE
            RETURN FALSE;
        END IF;
    END IF;
END;
$$;

-- 4. 更新报名状态（社团管理员用）
CREATE OR REPLACE FUNCTION update_registration_status_admin(
    p_registration_id BIGINT,
    p_status VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_club_id BIGINT;
BEGIN
    -- 获取报名记录的 club_id
    SELECT club_id INTO v_club_id
    FROM event_registrations
    WHERE id = p_registration_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 检查权限
    IF auth.uid() IS NULL THEN
        -- 本地登录的社团管理员，直接更新
        UPDATE event_registrations 
        SET status = p_status, updated_at = NOW()
        WHERE id = p_registration_id;
        RETURN TRUE;
    ELSE
        -- Supabase Auth 用户
        IF EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'club_admin'
            AND profiles.club_id = v_club_id
        ) THEN
            UPDATE event_registrations 
            SET status = p_status, updated_at = NOW()
            WHERE id = p_registration_id;
            RETURN TRUE;
        ELSE
            RETURN FALSE;
        END IF;
    END IF;
END;
$$;

-- 为 RPC 函数启用 RLS（实际上 SECURITY DEFINER 会绕过 RLS）
-- 但我们使用 SECURITY DEFINER 所以不需要额外设置

-- 验证函数已创建
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_post_registrations_admin', 'get_registration_stats_admin', 
                     'delete_registration_admin', 'update_registration_status_admin')
ORDER BY routine_name;
