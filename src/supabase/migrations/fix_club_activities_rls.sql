-- 1. 强制开启 RLS
ALTER TABLE "club_activities" ENABLE ROW LEVEL SECURITY;

-- 2. 清理旧策略，防止同名冲突
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "club_activities";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "club_activities";

-- 3. 创建仅登录用户可访问策略
CREATE POLICY "仅登录用户可查询数据"
ON "club_activities" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "仅登录用户可新增数据"
ON "club_activities" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "仅登录用户可修改数据"
ON "club_activities" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "仅登录用户可删除数据"
ON "club_activities" FOR DELETE
TO authenticated
USING (true);
