-- 创建用于回复评价的 RPC 函数，使用 SECURITY DEFINER 绕过 RLS
CREATE OR REPLACE FUNCTION reply_to_club_review(
  p_review_id bigint,
  p_reply text,
  p_replied_by text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新评价回复
  UPDATE club_reviews
  SET 
    reply = p_reply,
    replied_at = now(),
    replied_by = p_replied_by
  WHERE id = p_review_id;
  
  -- 检查是否更新成功
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 授予执行权限给匿名用户（因为社团管理员是自定义认证）
GRANT EXECUTE ON FUNCTION reply_to_club_review(bigint, text, text) TO anon;
GRANT EXECUTE ON FUNCTION reply_to_club_review(bigint, text, text) TO authenticated;
