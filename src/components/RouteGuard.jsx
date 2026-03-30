import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

// 需要登录才能访问的路由
const protectedRoutes = [
  "/survey",
  "/recommendations",
  "/application",
  "/profile",
];

// 检查路径是否需要登录
const isProtectedPath = (pathname) => {
  // 检查是否在受保护路由列表中
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    return true;
  }
  // 检查是否是 admin 路径
  if (pathname.includes("/admin")) {
    return true;
  }
  return false;
};

const RouteGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isLoading } = useUser();

  useEffect(() => {
    // 等待加载完成
    if (isLoading) return;

    const currentPath = location.pathname;

    // 如果需要登录但未登录，跳转到登录页
    if (isProtectedPath(currentPath) && !isLoggedIn) {
      toast.error("请先登录后再进行操作");
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, isLoading, location.pathname, navigate]);

  // 加载中显示空白或可以添加加载动画
  if (isLoading) {
    return null;
  }

  // 如果需要登录但未登录，不渲染子组件
  if (isProtectedPath(location.pathname) && !isLoggedIn) {
    return null;
  }

  return children;
};

export default RouteGuard;
