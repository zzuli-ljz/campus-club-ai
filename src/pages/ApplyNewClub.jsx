import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Send,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Loader2,
  User,
  BookOpen,
  MapPin,
  Phone,
  Tag as TagIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClubApplications } from '@/hooks/useClubApplications';
import TagSelector from '@/components/TagSelector';
import { useCategoryTags } from '@/hooks/useCategoryTags';

const ApplyNewClub = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const {
    submitApplication,
    verifyEmail,
    resendVerificationCode,
    getApplicationByEmail,
    isLoading,
  } = useClubApplications();
  const { tagsByCategory, getTagsForCategory, isLoading: tagsLoading } = useCategoryTags();

  // 步骤状态：1-填写信息，2-验证邮箱
  const [step, setStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);

  // 申请人信息
  const [applicantInfo, setApplicantInfo] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantIdentity: '',
    applicantStudentId: '',
  });

  // 社团信息
  const [clubInfo, setClubInfo] = useState({
    clubName: '',
    clubCategory: '',
    clubDescription: '',
    clubLocation: '',
    clubContact: '',
    clubTags: [],
  });

  // 邮箱验证码
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 身份选项
  const identityOptions = [
    { value: 'student', label: language === 'zh' ? '学生' : 'Student' },
    { value: 'teacher', label: language === 'zh' ? '老师' : 'Teacher' },
    { value: 'staff', label: language === 'zh' ? '学校职工' : 'Staff' },
    { value: 'other', label: language === 'zh' ? '其他' : 'Other' },
  ];

  // 分类选项
  const categoryOptions = [
    { value: '学术科技', label: language === 'zh' ? '学术科技' : 'Academic & Tech' },
    { value: '文艺创作', label: language === 'zh' ? '文艺创作' : 'Arts & Creativity' },
    { value: '体育运动', label: language === 'zh' ? '体育运动' : 'Sports' },
    { value: '公益实践', label: language === 'zh' ? '公益实践' : 'Volunteer & Practice' },
    { value: '技术工程', label: language === 'zh' ? '技术工程' : 'Tech & Engineering' },
  ];

  // 验证表单
  const validateForm = () => {
    // 验证申请人信息
    if (!applicantInfo.applicantName.trim()) {
      toast.error(language === 'zh' ? '请输入您的姓名' : 'Please enter your name');
      return false;
    }
    if (!applicantInfo.applicantEmail.trim()) {
      toast.error(language === 'zh' ? '请输入邮箱地址' : 'Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantInfo.applicantEmail)) {
      toast.error(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email');
      return false;
    }
    if (!applicantInfo.applicantIdentity) {
      toast.error(language === 'zh' ? '请选择您的身份' : 'Please select your identity');
      return false;
    }
    if (applicantInfo.applicantIdentity === 'student' && !applicantInfo.applicantStudentId.trim()) {
      toast.error(language === 'zh' ? '请输入您的学号' : 'Please enter your student ID');
      return false;
    }

    // 验证社团信息
    if (!clubInfo.clubName.trim()) {
      toast.error(language === 'zh' ? '请输入社团名称' : 'Please enter club name');
      return false;
    }
    if (!clubInfo.clubCategory) {
      toast.error(language === 'zh' ? '请选择社团分类' : 'Please select club category');
      return false;
    }
    if (!clubInfo.clubDescription.trim()) {
      toast.error(language === 'zh' ? '请输入社团简介' : 'Please enter club description');
      return false;
    }

    return true;
  };

  // 提交申请
  const handleSubmitApplication = async () => {
    if (!validateForm()) return;

    setIsSendingCode(true);
    const result = await submitApplication({
      ...applicantInfo,
      ...clubInfo,
    });

    if (result.success) {
      setApplicationId(result.data.id);
      setStep(2);
      toast.success(language === 'zh' ? '申请已提交，请查收验证码' : 'Application submitted, please check verification code');
      startCountdown();
    }
    setIsSendingCode(false);
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error(language === 'zh' ? '请输入验证码' : 'Please enter verification code');
      return;
    }

    const result = await verifyEmail(applicationId, verificationCode);
    if (result.success) {
      toast.success(language === 'zh' ? '邮箱验证成功！' : 'Email verified successfully!');
      setStep(3);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsSendingCode(true);
    const result = await resendVerificationCode(applicationId);
    if (result.success) {
      toast.success(language === 'zh' ? '验证码已重新发送' : 'Verification code resent');
      startCountdown();
    }
    setIsSendingCode(false);
  };

  // 倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            {language === 'zh' ? '申请新社团' : 'Apply for New Club'}
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: language === 'zh' ? '填写信息' : 'Fill Info' },
              { num: 2, label: language === 'zh' ? '验证邮箱' : 'Verify Email' },
              { num: 3, label: language === 'zh' ? '完成' : 'Complete' },
            ].map((item, index) => (
              <div key={item.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  step >= item.num ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= item.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > item.num ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      item.num
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{item.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    step > item.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 步骤1：填写信息 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 申请人信息 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  {language === 'zh' ? '申请人信息' : 'Applicant Information'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh' ? '请填写您的个人信息' : 'Please fill in your personal information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicantName">
                      {language === 'zh' ? '姓名 *' : 'Name *'}
                    </Label>
                    <Input
                      id="applicantName"
                      value={applicantInfo.applicantName}
                      onChange={(e) => setApplicantInfo({ ...applicantInfo, applicantName: e.target.value })}
                      placeholder={language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicantIdentity">
                      {language === 'zh' ? '身份 *' : 'Identity *'}
                    </Label>
                    <Select
                      value={applicantInfo.applicantIdentity}
                      onValueChange={(value) => setApplicantInfo({ ...applicantInfo, applicantIdentity: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={language === 'zh' ? '请选择身份' : 'Select identity'} />
                      </SelectTrigger>
                      <SelectContent>
                        {identityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicantEmail">
                      {language === 'zh' ? '邮箱地址 *' : 'Email *'}
                    </Label>
                    <Input
                      id="applicantEmail"
                      type="email"
                      value={applicantInfo.applicantEmail}
                      onChange={(e) => setApplicantInfo({ ...applicantInfo, applicantEmail: e.target.value })}
                      placeholder={language === 'zh' ? '用于接收审核结果通知' : 'For receiving review results'}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '请输入真实邮箱，用于验证和接收审核结果' : 'Enter a valid email for verification and notifications'}
                    </p>
                  </div>
                  {applicantInfo.applicantIdentity === 'student' && (
                    <div>
                      <Label htmlFor="applicantStudentId">
                        {language === 'zh' ? '学号 *' : 'Student ID *'}
                      </Label>
                      <Input
                        id="applicantStudentId"
                        value={applicantInfo.applicantStudentId}
                        onChange={(e) => setApplicantInfo({ ...applicantInfo, applicantStudentId: e.target.value })}
                        placeholder={language === 'zh' ? '请输入您的学号' : 'Enter your student ID'}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 社团信息 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {language === 'zh' ? '社团信息' : 'Club Information'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh' ? '请填写您要创建的社团信息' : 'Please fill in the club information you want to create'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clubName">
                      {language === 'zh' ? '社团名称 *' : 'Club Name *'}
                    </Label>
                    <Input
                      id="clubName"
                      value={clubInfo.clubName}
                      onChange={(e) => setClubInfo({ ...clubInfo, clubName: e.target.value })}
                      placeholder={language === 'zh' ? '请输入社团名称' : 'Enter club name'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubCategory">
                      {language === 'zh' ? '社团分类 *' : 'Club Category *'}
                    </Label>
                    <Select
                      value={clubInfo.clubCategory}
                      onValueChange={(value) => setClubInfo({ ...clubInfo, clubCategory: value, clubTags: [] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={language === 'zh' ? '请选择分类' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="clubDescription">
                    {language === 'zh' ? '社团简介 *' : 'Club Description *'}
                  </Label>
                  <Textarea
                    id="clubDescription"
                    value={clubInfo.clubDescription}
                    onChange={(e) => setClubInfo({ ...clubInfo, clubDescription: e.target.value })}
                    placeholder={language === 'zh' ? '请简要介绍社团的宗旨、活动内容和特色...' : 'Please briefly introduce the club\'s purpose, activities and features...'}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clubLocation">
                      {language === 'zh' ? '活动地点' : 'Activity Location'}
                    </Label>
                    <Input
                      id="clubLocation"
                      value={clubInfo.clubLocation}
                      onChange={(e) => setClubInfo({ ...clubInfo, clubLocation: e.target.value })}
                      placeholder={language === 'zh' ? '如：科技楼301室' : 'e.g., Science Building 301'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubContact">
                      {language === 'zh' ? '联系方式' : 'Contact'}
                    </Label>
                    <Input
                      id="clubContact"
                      value={clubInfo.clubContact}
                      onChange={(e) => setClubInfo({ ...clubInfo, clubContact: e.target.value })}
                      placeholder={language === 'zh' ? '社团负责人联系方式' : 'Contact information'}
                      className="mt-1"
                    />
                  </div>
                </div>

                {clubInfo.clubCategory && (
                  <div>
                    <Label>
                      {language === 'zh' ? '社团标签（可选）' : 'Club Tags (Optional)'}
                    </Label>
                    <div className="mt-1">
                      <TagSelector
                        category={clubInfo.clubCategory}
                        availableTags={getTagsForCategory(clubInfo.clubCategory)}
                        selectedTags={clubInfo.clubTags}
                        onTagsChange={(newTags) => setClubInfo({ ...clubInfo, clubTags: newTags })}
                        maxTags={5}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '选择或添加新标签描述社团特色，新标签将在审核通过后加入标签库' : 'Select or add new tags to describe club features. New tags will be added to the library after review.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleSubmitApplication}
                disabled={isSendingCode}
                className="px-8"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'zh' ? '提交中...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '提交申请并验证邮箱' : 'Submit & Verify Email'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* 步骤2：验证邮箱 */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">
                  {language === 'zh' ? '验证邮箱' : 'Verify Email'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh'
                    ? `验证码已发送至 ${applicantInfo.applicantEmail}`
                    : `Verification code sent to ${applicantInfo.applicantEmail}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800">
                    {language === 'zh'
                      ? '验证码已发送至您的邮箱，请查收邮件获取验证码。'
                      : 'Verification code has been sent to your email. Please check your inbox.'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {language === 'zh'
                      ? `发送地址：${applicantInfo.applicantEmail}`
                      : `Sent to: ${applicantInfo.applicantEmail}`}
                  </p>
                </div>

                <div>
                  <Label htmlFor="verificationCode">
                    {language === 'zh' ? '验证码' : 'Verification Code'}
                  </Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={language === 'zh' ? '请输入6位验证码' : 'Enter 6-digit code'}
                    maxLength={6}
                    className="mt-1 text-center text-lg tracking-widest"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {language === 'zh' ? '验证' : 'Verify'}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={isSendingCode || countdown > 0}
                  >
                    {countdown > 0
                      ? `${language === 'zh' ? '重新发送' : 'Resend'} (${countdown}s)`
                      : language === 'zh' ? '重新发送验证码' : 'Resend verification code'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 步骤3：完成 */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {language === 'zh' ? '申请已提交！' : 'Application Submitted!'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {language === 'zh'
                    ? '您的社团申请已成功提交，等待学校管理员审核。审核结果将通过邮件发送给您。'
                    : 'Your club application has been submitted successfully. Please wait for the school administrator to review. The result will be sent to your email.'}
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-blue-900 mb-2">
                    {language === 'zh' ? '申请信息' : 'Application Info'}
                  </h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>{language === 'zh' ? '社团名称：' : 'Club Name: '}</strong>{clubInfo.clubName}</p>
                    <p><strong>{language === 'zh' ? '社团分类：' : 'Category: '}</strong>{clubInfo.clubCategory}</p>
                    <p><strong>{language === 'zh' ? '申请人：' : 'Applicant: '}</strong>{applicantInfo.applicantName}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    {language === 'zh' ? '返回首页' : 'Back to Home'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/clubs')}
                    className="w-full"
                  >
                    {language === 'zh' ? '浏览现有社团' : 'Browse Existing Clubs'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ApplyNewClub;
