import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  CheckCircle,
  User,
  Hash,
  FileText,
  Building2,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useApplications } from "@/hooks/useApplications";
import { useClubMembership } from "@/hooks/useClubMembership";
import Navbar from "@/components/Navbar";

const Application = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, updateUser } = useUser();
  const { submitApplication, isLoading } = useApplications();
  const { checkIsMember, isLoading: checkingMembership } = useClubMembership();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [clubInfo, setClubInfo] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState(null);
  const [checking, setChecking] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    selfIntro: ""
  });

  // 从用户资料预填充表单，并检查社团信息和成员状态
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        studentId: profile.student_id || ""
      }));
    }

    const club = location.state?.club;
    if (club) {
      setClubInfo(club);
      
      // 检查社团是否正在招新
      if (!club.is_recruiting) {
        toast.error("该社团已停止招新，无法提交申请");
        // 延迟返回，让用户看到提示
        setTimeout(() => {
          navigate(`/clubs/${club.id}`);
        }, 2000);
        return;
      }
      
      // 检查用户是否已经是该社团成员
      const checkMembership = async () => {
        if (!user) {
          setChecking(false);
          return;
        }
        
        const result = await checkIsMember(user.id, club.id);
        if (result.isMember) {
          setIsMember(true);
          setMemberRole(result.memberInfo?.role || '成员');
          toast.error(`您已经是该社团的${result.memberInfo?.role || '成员'}，无需重复申请`);
        }
        setChecking(false);
      };
      
      checkMembership();
    } else {
      setChecking(false);
    }
  }, [profile, location.state, user, checkIsMember, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 再次检查社团是否正在招新
    if (!clubInfo?.is_recruiting) {
      toast.error("该社团已停止招新，无法提交申请");
      return;
    }
    
    // 再次检查是否已经是成员
    if (isMember) {
      toast.error(`您已经是该社团的${memberRole}，无需重复申请`);
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error("请输入姓名");
      return;
    }
    if (!formData.studentId.trim()) {
      toast.error("请输入学号");
      return;
    }
    if (formData.selfIntro.trim().length < 10) {
      toast.error("自我介绍至少需要10个字");
      return;
    }

    if (!clubInfo) {
      toast.error("社团信息缺失，请重新选择");
      return;
    }

    // 更新用户资料
    if (profile && (!profile.name || !profile.student_id)) {
      await updateUser({
        name: formData.name,
        student_id: formData.studentId,
      });
    }

    // 提交申请
    const result = await submitApplication({
      club_id: clubInfo.id,
      name: formData.name,
      student_id: formData.studentId,
      self_intro: formData.selfIntro,
    });

    if (result.success) {
      setIsSubmitted(true);
    }
  };

  // 如果用户已经是成员，显示提示页面
  if (!checking && isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">您已是该社团成员</h2>
              <p className="text-gray-500 mb-6">
                您的身份是 <span className="font-medium text-green-600">{memberRole}</span>，无需重复申请
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">社团：{clubInfo?.name}</p>
                <p className="text-sm text-gray-500">您可以直接参与社团活动</p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={() => navigate(`/clubs/${clubInfo?.id}`)}
                >
                  返回社团详情
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => navigate("/clubs")}
                >
                  浏览其他社团
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 如果社团已停止招新，显示提示页面
  if (!checking && clubInfo && !clubInfo.is_recruiting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <AlertCircle className="w-10 h-10 text-gray-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">该社团已停止招新</h2>
              <p className="text-gray-500 mb-6">
                <span className="font-medium text-blue-600">{clubInfo?.name}</span> 目前不接受新的申请
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">请关注社团后续动态，或浏览其他正在招新的社团</p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={() => navigate("/clubs")}
                >
                  浏览其他社团
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => navigate(`/clubs/${clubInfo?.id}`)}
                >
                  返回社团详情
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">申请已提交！</h2>
              <p className="text-gray-500 mb-6">
                你的报名申请已提交至 <span className="font-medium text-blue-600">{clubInfo?.name || "社团"}</span>，请耐心等待审核
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-1">申请人：{formData.name}</p>
                <p className="text-sm text-gray-600 mb-1">学号：{formData.studentId}</p>
                <p className="text-sm text-gray-500">申请时间：{new Date().toLocaleString("zh-CN")}</p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={() => navigate("/profile")}
                >
                  查看报名记录
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => navigate("/clubs")}
                >
                  继续浏览社团
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Navbar title="申请报名" showBack={true} backText="返回" onBack={() => navigate(-1)} />

      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">填写报名信息</h1>
            <p className="text-gray-600">完善你的个人信息，让社团更好地了解你</p>
          </motion.div>

          {clubInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{clubInfo.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-xs" variant="secondary">
                          {clubInfo.category}
                        </Badge>
                        {clubInfo.is_recruiting ? (
                          <Badge className="text-xs bg-green-100 text-green-700">正在招新</Badge>
                        ) : (
                          <Badge className="text-xs bg-gray-100 text-gray-700">已停止招新</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                {checking || checkingMembership ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500">正在检查申请资格...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        真实姓名
                      </Label>
                      <Input
                        id="name"
                        placeholder="请输入你的真实姓名"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 bg-white/50 border-gray-200 focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-gray-700 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        学号
                      </Label>
                      <Input
                        id="studentId"
                        placeholder="请输入你的学号"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="h-12 bg-white/50 border-gray-200 focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selfIntro" className="text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        自我介绍
                      </Label>
                      <Textarea
                        id="selfIntro"
                        placeholder="介绍一下自己吧！包括你的兴趣、特长、为什么想加入这个社团等..."
                        value={formData.selfIntro}
                        onChange={(e) => setFormData({ ...formData, selfIntro: e.target.value })}
                        className="min-h-[150px] bg-white/50 border-gray-200 focus:border-blue-500 resize-none"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 text-right">
                        {formData.selfIntro.length} / 200字建议
                      </p>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          提交申请
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            提交申请即表示你同意社团的招新条款和隐私政策
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default Application;
