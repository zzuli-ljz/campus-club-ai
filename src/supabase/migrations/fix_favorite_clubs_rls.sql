-- 1. 强制开启 RLS
ALTER TABLE "favorite_clubs" ENABLE ROW LEVEL SECURITY;

-- 2. 清理旧策略，防止同名冲突
DROP POLICY IF EXISTS "仅登录用户可查询数据" ON "favorite_clubs";
DROP POLICY IF EXISTS "仅登录用户可新增数据" ON "favorite_clubs";
DROP POLICY IF EXISTS "仅登录用户可修改数据" ON "favorite_clubs";
DROP POLICY IF EXISTS "仅登录用户可删除数据" ON "favorite_clubs";

-- 3. 创建仅登录用户可访问策略
CREATE POLICY "仅登录用户可查询数据"
ON "favorite_clubs" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "仅登录用户可新增数据"
ON "favorite_clubs" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "仅登录用户可修改数据"
ON "favorite_clubs" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "仅登录用户可删除数据"
ON "favorite_clubs" FOR DELETE
TO authenticated
USING (true);
