import { 
  Home, 
  LogIn, 
  UserPlus, 
  ClipboardList, 
  Users, 
  FileText, 
  User, 
  LayoutDashboard, 
  Shield,
  GraduationCap,
  Bot,
  Bell,
  Building2
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
import Notifications from "./pages/Notifications.jsx";
import AdminNotifications from "./pages/AdminNotifications.jsx";
import ApplyNewClub from "./pages/ApplyNewClub.jsx";
import Layout from "./components/Layout.jsx";
import logo from "./assets/logo.png";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "首页",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Layout><Index /></Layout>,
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
    icon: <img src={logo} alt="Logo" className="h-4 w-4 object-contain" />,
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
    page: <Layout><Login /></Layout>,
  },
  {
    title: "注册",
    to: "/register",
    icon: <UserPlus className="h-4 w-4" />,
    page: <Layout><Register /></Layout>,
  },
  {
    title: "我的通知",
    to: "/notifications",
    icon: <Bell className="h-4 w-4" />,
    page: <Notifications />,
  },
  {
    title: "社团通知",
    to: "/admin-notifications",
    icon: <Bell className="h-4 w-4" />,
    page: <AdminNotifications />,
  },
  {
    title: "申请新社团",
    to: "/apply-new-club",
    icon: <Building2 className="h-4 w-4" />,
    page: <ApplyNewClub />,
  },
];
