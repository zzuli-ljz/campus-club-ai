import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// 创建 Context
const UserContext = createContext(null);

// 自定义 Hook 方便使用
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

// Provider 组件
export const UserProvider = ({ children }) => {
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // 页面加载时检查用户登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 获取当前会话
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          // 加载用户资料
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("初始化认证失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 加载用户资料
  const loadUserProfile = async (userId) => {
    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // 如果资料不存在，创建默认资料
        if (error.code === 'PGRST116') {
          await createDefaultProfile(userId);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("加载用户资料失败:", error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // 创建默认用户资料
  const createDefaultProfile = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newProfile = {
        id: userId,
        email: user.email,
        name: user.email.split('@')[0],
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("创建默认资料失败:", error);
    }
  };

  // 学生注册 - 关闭邮箱验证后，直接可以登录
  const register = async ({ name, email, password, studentId }) => {
    try {
      setIsLoading(true);
      
      // 1. 创建 Supabase 用户（关闭邮箱验证后，用户直接可用）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            student_id: studentId,
          },
          // 禁用邮箱确认（如果后端支持）
          email_confirm: true,
        },
      });

      if (authError) throw authError;

      // 如果注册成功但没有返回用户（某些配置下），尝试直接登录
      if (!authData.user) {
        // 直接尝试登录
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (loginError) {
          // 如果登录提示邮箱未验证，说明后端验证仍然开启
          if (loginError.message.includes('Email not confirmed') || loginError.message.includes('not confirmed')) {
            toast.error(language === "zh" ? "邮箱验证已启用，请使用验证码登录方式，或联系管理员关闭验证" : "Email verification is enabled. Please use OTP login or contact admin to disable verification");
            return { success: false, error: "email_not_verified" };
          }
          throw loginError;
        }
        
        if (loginData.user) {
          setUser(loginData.user);
          // 创建/更新用户资料
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name,
              student_id: studentId,
              role: 'student',
            })
            .eq('id', loginData.user.id);
            
          if (profileError) console.error("Failed to update profile:", profileError);
          
          toast.success(language === "zh" ? "注册成功！已自动登录" : "Registration successful! Logged in automatically");
          return { success: true, role: 'student' };
        }
      }

      // 2. 创建用户资料
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name,
            student_id: studentId,
            role: 'student',
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
        
        setUser(authData.user);
      }

      toast.success(language === "zh" ? "注册成功！" : "Registration successful!");
      return { success: true, role: 'student' };
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.message || (language === "zh" ? "注册失败" : "Registration failed"));
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 登录 - 添加对邮箱未验证错误的特殊处理
  const login = async (email, password, role = 'student') => {
    try {
      setIsLoading(true);
      
      // 检查是否是学校管理员固定账号
      if (role === 'school_admin') {
        if (email === 'school@admin.com' && password === 'admin123456') {
          // 使用 Supabase Auth 登录学校管理员账号
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'school@admin.com',
            password: 'admin123456',
          });

          if (authError) {
            console.error('School admin Supabase login failed:', authError);
            // 如果 Supabase 登录失败，回退到本地模式
            const adminProfile = {
              id: 'school-admin',
              email: 'school@admin.com',
              name: language === "zh" ? "学校管理员" : "School Admin",
              role: 'school_admin',
            };
            setUser({ id: 'school-admin', email: 'school@admin.com' });
            setProfile(adminProfile);
            toast.success(language === "zh" ? "欢迎回来，学校管理员（本地模式）" : "Welcome back, School Admin (local mode)");
            return { success: true, role: 'school_admin' };
          }

          if (authData.user) {
            setUser(authData.user);
            await loadUserProfile(authData.user.id);
            toast.success(language === "zh" ? "欢迎回来，学校管理员" : "Welcome back, School Admin");
            return { success: true, role: 'school_admin' };
          }
        } else {
          throw new Error(language === "zh" ? "学校管理员账号或密码错误" : "Invalid school admin credentials");
        }
      }

      // 检查是否是社团管理员
      if (role === 'club_admin') {
        const { data: adminData, error: adminError } = await supabase
          .from('club_admin_accounts')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (adminError || !adminData) {
          throw new Error(language === "zh" ? "社团管理员账号不存在" : "Club admin account not found");
        }

        if (adminData.password_hash !== password) {
          throw new Error(language === "zh" ? "密码错误" : "Incorrect password");
        }

        const adminProfile = {
          id: `club-admin-${adminData.id}`,
          email: adminData.email,
          name: adminData.name,
          role: 'club_admin',
          club_id: adminData.club_id,
          club_name: adminData.club_name,
        };
        
        setUser({ id: `club-admin-${adminData.id}`, email: adminData.email });
        setProfile(adminProfile);
        toast.success(language === "zh" ? `欢迎回来，${adminData.club_name}管理员` : `Welcome back, ${adminData.club_name} Admin`);
        return { success: true, role: 'club_admin' };
      }

      // 学生登录 - 使用 Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Login failed:', authError);
        // 特殊处理邮箱未验证错误
        if (authError.message.includes('Email not confirmed') || 
            authError.message.includes('not confirmed') ||
            authError.message.includes('验证') ||
            authError.code === 'email_not_confirmed') {
          toast.error(language === "zh" ? "邮箱未验证，请切换到「验证码登录」方式" : "Email not verified. Please switch to OTP login");
          return { 
            success: false, 
            error: "email_not_confirmed",
            message: language === "zh" ? "邮箱未验证，请使用验证码登录" : "Email not verified. Please use OTP login"
          };
        }
        throw authError;
      }

      // 登录成功后，验证会话是否正确设置
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to get session:', sessionError);
      } else {
        console.log('Session set after login:', sessionData?.session ? 'valid' : 'invalid');
      }

      toast.success(language === "zh" ? "登录成功！欢迎回来" : "Login successful! Welcome back");
      return { success: true, role: 'student' };
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || (language === "zh" ? "登录失败" : "Login failed"));
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录（Magic Link）- 推荐的无验证登录方式
  const sendMagicLink = async (email) => {
    try {
      // 先尝试直接创建/登录用户（不需要验证）
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      toast.success(language === "zh" ? "验证码已发送至邮箱，请查收" : "Verification code sent to your email");
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // 验证 OTP
  const verifyOtp = async (email, token) => {
    try {
      // 使用 'email' 类型而不是 'magiclink'，这是 Supabase OTP 的正确类型
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        console.error("OTP verification failed:", error);
        // 提供更友好的错误提示
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          toast.error(language === "zh" ? "验证码已过期或无效，请重新获取" : "Code expired or invalid. Please request a new one");
        } else {
          toast.error(error.message);
        }
        return { success: false, error: error.message };
      }

      toast.success(language === "zh" ? "登录成功！" : "Login successful!");
      return { success: true, data };
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error(error.message || (language === "zh" ? "验证失败，请重试" : "Verification failed. Please try again"));
      return { success: false, error: error.message };
    }
  };

  // 登出
  const logout = async () => {
    try {
      // 只有非本地账号才调用 Supabase 登出
      if (user?.id !== 'school-admin' && !user?.id?.startsWith('club-admin')) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setProfile(null);
      toast.success(language === "zh" ? "已退出登录" : "Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 更新用户信息
  const updateUser = async (updates) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      toast.success(language === "zh" ? "资料已更新" : "Profile updated");
      return { success: true };
    } catch (error) {
      toast.error((language === "zh" ? "更新失败: " : "Update failed: ") + error.message);
      return { success: false, error: error.message };
    }
  };

  // 创建社团管理员账号（仅学校管理员可用）
  const createClubAdminAccount = async (accountData) => {
    try {
      const { name, email, password, clubId, clubName } = accountData;

      const { data: existing, error: checkError } = await supabase
        .from('club_admin_accounts')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        throw new Error(language === "zh" ? "该邮箱已被注册" : "This email is already registered");
      }

      const { data, error } = await supabase
        .from('club_admin_accounts')
        .insert([{
          name,
          email,
          password_hash: password,
          club_id: clubId,
          club_name: clubName,
          created_by: user?.id?.startsWith('school-admin') ? null : user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(language === "zh" ? "社团管理员账号创建成功" : "Club admin account created successfully");
      return { success: true, data };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // 获取所有社团管理员账号
  const getClubAdminAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('club_admin_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get admin accounts:", error);
      return [];
    }
  };

  // 删除社团管理员账号
  const deleteClubAdminAccount = async (accountId) => {
    try {
      const { error } = await supabase
        .from('club_admin_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success(language === "zh" ? "账号已删除" : "Account deleted");
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isProfileLoading,
    isLoggedIn: !!user && !!profile,
    role: profile?.role || null,
    login,
    register,
    logout,
    updateUser,
    sendMagicLink,
    verifyOtp,
    createClubAdminAccount,
    getClubAdminAccounts,
    deleteClubAdminAccount,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
