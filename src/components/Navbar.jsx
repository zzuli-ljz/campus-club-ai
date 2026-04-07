import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  ChevronDown, 
  ArrowLeft, 
  LayoutDashboard, 
  Shield, 
  Users,
  GraduationCap
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

const Navbar = ({ 
  showBack = false, 
  backText = "返回", 
  onBack,
  title = null,
  rightContent = null 
}) => {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn, logout, role } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // 根据角色获取导航入口
  const getRoleBasedNav = () => {
    if (!isLoggedIn) return null;
    
    switch (role) {
      case "school_admin":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
            onClick={() => navigate("/school-admin")}
          >
            <Shield className="w-4 h-4 mr-2" />
            学校后台
          </Button>
        );
      case "club_admin":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            onClick={() => navigate("/club-admin")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            社团后台
          </Button>
        );
      case "student":
      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:text-gray-900"
            onClick={() => navigate("/profile")}
          >
            <User className="w-4 h-4 mr-2" />
            个人中心
          </Button>
        );
    }
  };

  // 根据角色获取下拉菜单项
  const getRoleBasedMenuItems = () => {
    if (!isLoggedIn) return null;
    
    switch (role) {
      case "school_admin":
        return (
          <>
            <DropdownMenuItem 
              onClick={() => navigate("/school-admin")}
              className="cursor-pointer"
            >
              <Shield className="w-4 h-4 mr-2" />
              学校管理后台
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/")}
              className="cursor-pointer"
            >
              <img src={logo} alt="Logo" className="w-4 h-4 mr-2 object-contain" />
              返回首页
            </DropdownMenuItem>
          </>
        );
      case "club_admin":
        return (
          <>
            <DropdownMenuItem 
              onClick={() => navigate("/club-admin")}
              className="cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              社团管理后台
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/")}
              className="cursor-pointer"
            >
              <img src={logo} alt="Logo" className="w-4 h-4 mr-2 object-contain" />
              返回首页
            </DropdownMenuItem>
          </>
        );
      case "student":
      default:
        return (
          <>
            <DropdownMenuItem 
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/clubs")}
              className="cursor-pointer"
            >
              <Users className="w-4 h-4 mr-2" />
              浏览社团
            </DropdownMenuItem>
          </>
        );
    }
  };

  // 根据角色获取头像和标签
  const getRoleIndicator = () => {
    if (!isLoggedIn) return null;
    
    switch (role) {
      case "school_admin":
        return {
          icon: <Shield className="w-3 h-3" />,
          color: "bg-purple-500",
          label: "学校"
        };
      case "club_admin":
        return {
          icon: <LayoutDashboard className="w-3 h-3" />,
          color: "bg-blue-500",
          label: "社团"
        };
      default:
        return {
          icon: <GraduationCap className="w-3 h-3" />,
          color: "bg-green-500",
          label: "学生"
        };
    }
  };

  const roleIndicator = getRoleIndicator();

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧区域 */}
          <div className="flex items-center gap-4">
            {showBack ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{backText}</span>
              </Button>
            ) : null}
            
            <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                {title ? (
                <span className="font-bold text-gray-900">{title}</span>
              ) : (
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 hidden sm:inline">
                  社团招新平台
                </span>
              )}
            </Link>
          </div>

          {/* 中间区域 - 可以自定义 */}
          <div className="hidden md:flex items-center gap-2">
            {getRoleBasedNav()}
            {rightContent}
          </div>

          {/* 右侧区域 - 用户状态 */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              // 已登录状态
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-white/50">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={`bg-gradient-to-br ${
                          role === 'school_admin' ? 'from-purple-500 to-purple-700' :
                          role === 'club_admin' ? 'from-blue-500 to-blue-700' :
                          'from-green-500 to-emerald-600'
                        } text-white text-sm`}>
                          {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {roleIndicator && (
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${roleIndicator.color} flex items-center justify-center border-2 border-white`}>
                          {roleIndicator.icon}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-gray-700 font-medium max-w-[100px] truncate text-sm">
                        {profile?.name || user?.email?.split('@')[0] || "用户"}
                      </span>
                      <span className="text-xs text-gray-400">{roleIndicator?.label}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{profile?.name || "用户"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    {role === "club_admin" && profile?.club_name && (
                      <p className="text-xs text-blue-600 mt-1">{profile.club_name}</p>
                    )}
                  </div>
                  {getRoleBasedMenuItems()}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // 未登录状态
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                    登录
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    立即加入
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
