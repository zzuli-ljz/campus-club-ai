
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, GraduationCap, Users, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, sendMagicLink, verifyOtp, isLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("otp"); // 默认改为验证码登录
  const [selectedRole, setSelectedRole] = useState("student");
  const [showEmailConfirmAlert, setShowEmailConfirmAlert] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const navigateByRole = (role) => {
    switch (role) {
      case "school_admin":
        navigate("/school-admin");
        break;
      case "club_admin":
        navigate("/club-admin");
        break;
      default:
        navigate("/");
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setShowEmailConfirmAlert(false);
    
    if (!validateEmail(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    if (password.length < 1) {
      toast.error("请输入密码");
      return;
    }

    setLocalLoading(true);
    const result = await login(email, password, selectedRole);
    setLocalLoading(false);
    
    if (result.success) {
      navigateByRole(result.role || selectedRole);
    } else if (result.error === "email_not_confirmed") {
      setShowEmailConfirmAlert(true);
      // 自动切换到验证码登录
      setLoginMethod("otp");
      setOtpEmail(email);
    }
  };

  const handleSendOtp = async () => {
    if (!validateEmail(otpEmail)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    if (selectedRole !== "student") {
      toast.error("社团管理员和学校管理员请使用密码登录");
      return;
    }

    setLocalLoading(true);
    try {
      const result = await sendMagicLink(otpEmail);
      if (result.success) {
        setOtpSent(true);
        toast.success("验证码已发送，5分钟内有效");
      } else {
        toast.error(result.error || "发送失败，请重试");
      }
    } catch (error) {
      toast.error("发送验证码时出错，请稍后重试");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      toast.error("请输入6位验证码");
      return;
    }

    setLocalLoading(true);
    const result = await verifyOtp(otpEmail, otpCode);
    setLocalLoading(false);
    
    if (result.success) {
      navigate("/");
    }
    // 错误处理已在 verifyOtp 中完成，无需额外处理
  };

  const roleOptions = [
    { value: "student", label: "学生", icon: GraduationCap, desc: "浏览社团、提交申请（建议验证码登录）" },
    { value: "club_admin", label: "社团管理员", icon: Users, desc: "管理社团信息和成员" },
    { value: "school_admin", label: "学校管理员", icon: Shield, desc: "管理平台和账号" },
  ];

  const isProcessing = isLoading || localLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-12 h-12 mb-2 rounded-xl object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">社团招新智能匹配平台</h1>
          <p className="text-gray-500 text-sm">发现属于你的精彩社团</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-center">欢迎回来</CardTitle>
            <CardDescription className="text-center text-gray-500">选择角色并登录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 邮箱未验证提示 */}
            {showEmailConfirmAlert && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  检测到邮箱未验证，已为您切换到验证码登录方式，无需验证即可直接登录。
                </AlertDescription>
              </Alert>
            )}

            {/* 角色选择 */}
            <div className="space-y-3">
              <Label className="text-gray-700">选择登录角色</Label>
              <RadioGroup 
                value={selectedRole} 
                onValueChange={(value) => {
                  setSelectedRole(value);
                  setShowEmailConfirmAlert(false);
                  // 学生默认用验证码，管理员用密码
                  setLoginMethod(value === "student" ? "otp" : "password");
                }}
                className="grid grid-cols-1 gap-3"
              >
                {roleOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedRole === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedRole === option.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${selectedRole === option.value ? "text-blue-700" : "text-gray-900"}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 登录方式切换 - 只有学生显示两种方式 */}
            {selectedRole === "student" ? (
              <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="otp">验证码登录（推荐）</TabsTrigger>
                  <TabsTrigger value="password">密码登录</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="space-y-4 mt-4">
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="请输入邮箱"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-white/50 border-gray-200"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-700">密码</Label>
                        <Link to="/reset-password" className="text-xs text-blue-600 hover:text-blue-700">
                          忘记密码？
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-white/50 border-gray-200"
                          disabled={isProcessing}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-amber-600">密码登录可能需要邮箱验证，如遇问题请使用验证码登录</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      立即登录
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="otp" className="space-y-4 mt-4">
                  <form onSubmit={handleOtpLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otpEmail" className="text-gray-700">学校邮箱</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="otpEmail"
                            type="email"
                            placeholder="请输入学校邮箱"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            disabled={otpSent || isProcessing}
                            className="pl-10 h-11 bg-white/50 border-gray-200"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isProcessing || otpSent}
                          variant="outline"
                          className="h-11 px-4 whitespace-nowrap"
                        >
                          {otpSent ? "已发送" : "获取验证码"}
                        </Button>
                      </div>
                      <p className="text-xs text-green-600">✓ 无需注册，首次登录自动创建账号</p>
                      <p className="text-xs text-green-600">✓ 无需邮箱验证，输入验证码即可登录</p>
                      {otpSent && (
                        <p className="text-xs text-amber-600">⚠ 验证码5分钟内有效，请及时输入</p>
                      )}
                    </div>

                    {otpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <Label htmlFor="otpCode" className="text-gray-700">验证码</Label>
                        <Input
                          id="otpCode"
                          type="text"
                          placeholder="请输入6位验证码"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-11 text-center text-lg tracking-widest bg-white/50 border-gray-200"
                          maxLength={6}
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">验证码将在5分钟后过期</p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="text-xs h-auto p-0"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode("");
                              toast.info("请重新获取验证码");
                            }}
                            disabled={isProcessing}
                          >
                            重新获取
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      disabled={isProcessing || !otpSent}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      验证登录
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              // 管理员直接显示密码登录
              <form onSubmit={handlePasswordLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-white/50 border-gray-200"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-white/50 border-gray-200"
                      disabled={isProcessing}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {selectedRole === "school_admin" && (
                    <p className="text-xs text-gray-500">固定账号：school@admin.com / admin123456</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  立即登录
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 px-2 text-gray-500">还没有账号？</span>
              </div>
            </div>
            <Link to="/register" className="w-full">
              <Button variant="outline" className="w-full h-11 border-gray-300 hover:bg-gray-50">
                学生注册
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;

