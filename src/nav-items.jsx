import { 
  HomeIcon, 
  LogIn, 
  UserPlus, 
  ClipboardList, 
  Sparkles, 
  Users, 
  FileText, 
  User, 
  LayoutDashboard, 
  Shield,
  GraduationCap,
  Bot
} from "lucide-react";
import Index from "./pages/Index.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Survey from "./pages/Survey.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Clubs from "./pages/Clubs.jsx";
import ClubDetail from "./pages/ClubDetail.jsx";
import Application from "./pages/Application.jsx";
import Profile from "./pages/Profile.jsx";
import ClubAdmin from "./pages/ClubAdmin.jsx";
import SchoolAdmin from "./pages/SchoolAdmin.jsx";
import AIAssistant from "./pages/AIAssistant.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "社团列表",
    to: "/clubs",
    icon: <Users className="h-4 w-4" />,
    page: <Clubs />,
  },
  {
    title: "社团详情",
    to: "/clubs/:id",
    icon: <Users className="h-4 w-4" />,
    page: <ClubDetail />,
  },
  {
    title: "AI顾问",
    to: "/ai-assistant",
    icon: <Bot className="h-4 w-4" />,
    page: <AIAssistant />,
  },
  {
    title: "兴趣问卷",
    to: "/survey",
    icon: <ClipboardList className="h-4 w-4" />,
    page: <Survey />,
  },
  {
    title: "智能推荐",
    to: "/recommendations",
    icon: <Sparkles className="h-4 w-4" />,
    page: <Recommendations />,
  },
  {
    title: "报名申请",
    to: "/application",
    icon: <FileText className="h-4 w-4" />,
    page: <Application />,
  },
  {
    title: "个人中心",
    to: "/profile",
    icon: <User className="h-4 w-4" />,
    page: <Profile />,
  },
  {
    title: "社团管理",
    to: "/club-admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
    page: <ClubAdmin />,
  },
  {
    title: "学校管理",
    to: "/school-admin",
    icon: <Shield className="h-4 w-4" />,
    page: <SchoolAdmin />,
  },
  {
    title: "登录",
    to: "/login",
    icon: <LogIn className="h-4 w-4" />,
    page: <Login />,
  },
  {
    title: "注册",
    to: "/register",
    icon: <UserPlus className="h-4 w-4" />,
    page: <Register />,
  },
];
