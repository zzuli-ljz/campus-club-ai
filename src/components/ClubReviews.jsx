import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  Send,
  User,
  Loader2,
  CornerDownRight,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { useClubReviews } from '@/hooks/useClubReviews';

// 评价标签选项
const reviewTags = [
  "活动丰富", "氛围友好", "学长学姐很nice", "能学到东西", 
  "时间灵活", "推荐加入", "组织有序", "活动有意义"
];

const ClubReviews = ({ clubId, showRatingForm = true }) => {
  const { user, profile } = useUser();
  const { 
    getClubReviews, 
    getReviewStats, 
    addReview, 
    likeReview,
    isLoading 
  } = useClubReviews();
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // 评价表单
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 加载评价数据和统计
  useEffect(() => {
    if (clubId) {
      loadReviews();
    }
  }, [clubId]);

  const loadReviews = async () => {
    const [reviewsResult, statsResult] = await Promise.all([
      getClubReviews(clubId),
      getReviewStats(clubId)
    ]);
    
    if (reviewsResult.success) {
      setReviews(reviewsResult.data);
      // 检查当前用户是否已评价
      if (user) {
        const userReview = reviewsResult.data.find(r => r.user_id === user.id);
        setHasReviewed(!!userReview);
      }
    }
    
    if (statsResult.success) {
      setStats({
        average: statsResult.data.average || 0,
        total: statsResult.data.total || 0,
        distribution: statsResult.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }
  };

  // 提交评价
  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error("请选择评分");
      return;
    }
    
    setSubmitting(true);
    const result = await addReview({
      club_id: clubId,
      rating,
      content,
      tags: selectedTags,
    });
    setSubmitting(false);
    
    if (result.success) {
      setShowReviewForm(false);
      setRating(5);
      setContent("");
      setSelectedTags([]);
      await loadReviews();
    }
  };

  // 处理点赞
  const handleLike = async (reviewId) => {
    const result = await likeReview(reviewId);
    if (result.success) {
      await loadReviews();
    }
  };

  // 切换标签选择
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      toast.error("最多选择3个标签");
    }
  };

  // 渲染星级评分
  const renderStars = (count, max = 5) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // 渲染评分分布条形图
  const renderDistributionBar = (star, count) => {
    const total = stats.total || 1;
    const percentage = (count / total) * 100;
    
    return (
      <div key={star} className="flex items-center gap-2 text-sm">
        <span className="w-8 text-gray-600">{star}星</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
            className="h-full bg-yellow-400 rounded-full"
          />
        </div>
        <span className="w-8 text-gray-500 text-right">{count}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 评分统计卡片 */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* 左侧：平均分 */}
            <div className="text-center md:text-left">
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <span className="text-5xl font-bold text-gray-900">{stats.average}</span>
                <span className="text-lg text-gray-500">/ 5</span>
              </div>
              <div className="flex justify-center md:justify-start mt-2">
                {renderStars(Math.round(stats.average))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{stats.total} 条评价</p>
            </div>
            
            {/* 右侧：分布条形图 */}
            <div className="flex-1 w-full space-y-1">
              {[5, 4, 3, 2, 1].map(star => 
                renderDistributionBar(star, stats.distribution[star] || 0)
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 写评价按钮 */}
      {showRatingForm && user && !hasReviewed && !showReviewForm && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            写评价
          </Button>
        </div>
      )}

      {/* 评价表单 */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">发表评价</h3>
              
              {/* 星级选择 */}
              <div className="flex items-center gap-4">
                <span className="text-gray-600">评分：</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {rating === 5 ? "非常满意" : 
                   rating === 4 ? "满意" : 
                   rating === 3 ? "一般" : 
                   rating === 2 ? "不满意" : "非常不满意"}
                </span>
              </div>

              {/* 标签选择 */}
              <div>
                <p className="text-sm text-gray-600 mb-2">选择标签（最多3个）：</p>
                <div className="flex flex-wrap gap-2">
                  {reviewTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 评价内容 */}
              <Textarea
                placeholder="分享你的社团体验..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  提交评价
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 评价列表 */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无评价</p>
            <p className="text-sm text-gray-400 mt-1">成为第一个评价的人吧！</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  {/* 评价头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {review.user_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.user_name || "匿名用户"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* 评价内容 */}
                  {review.content && (
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {review.content}
                    </p>
                  )}

                  {/* 评价标签 */}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 管理员回复 - 这是修复的关键部分 */}
                  {review.reply && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          社团管理员回复
                        </span>
                        <span className="text-xs text-blue-500">
                          {review.replied_at && new Date(review.replied_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <CornerDownRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.reply}
                        </p>
                      </div>
                      {review.replied_by && (
                        <p className="text-xs text-blue-500 mt-2 text-right">
                          —— {review.replied_by}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 点赞按钮 */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(review.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {review.likes || 0}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubReviews;
