import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const RlsWarning = ({ show }) => {
  if (!show) return null;
  
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">数据加载问题</AlertTitle>
      <AlertDescription className="text-amber-700 text-sm">
        如果看到此提示，说明可能存在 Supabase RLS（行级安全）策略配置问题。
        <br />
        请确保：
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>已运行 SQL 迁移文件创建学校管理员账号</li>
          <li>Supabase 项目中 profiles 表的 RLS 策略允许认证用户读取数据</li>
          <li>预览环境和部署环境使用的是同一个 Supabase 项目</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};
