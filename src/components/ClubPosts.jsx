import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Eye, 
  MessageCircle, 
  Pin, 
  Trophy, 
  Calendar, 
  Megaphone,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useClubPosts } from '@/hooks/useClubPosts';

const typeConfig = {
  post: { label: '动态', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
  notice: { label: '公告', icon: Megaphone, color: 'bg-red-100 text-red-700' },
  event: { label: '活动', icon: Calendar, color: 'bg-green-100 text-green-700' },
  achievement: { label: '荣誉', icon: Trophy, color: 'bg-yellow-100 text-yellow-700' },
};

const ClubPosts = ({ clubId, showCreate = false }) => {
  const { getClubPosts, likePost, incrementViews, isLoading } = useClubPosts();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clubId) {
      loadPosts();
    }
  }, [clubId, filter]);

  const loadPosts = async () => {
    setError(null);
    try {
      const options = filter !== 'all' ? { type: filter } : {};
      // 确保 clubId 是数字类型
      const clubIdNum = typeof clubId === 'string' ? parseInt(clubId, 10) : clubId;
      const result = await getClubPosts(clubIdNum, options);
      if (result.success) {
        setPosts(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('加载动态失败:', err);
      setError(err.message);
    }
  };

  const handleLike = async (postId) => {
    const result = await likePost(postId);
    if (result.success) {
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    }
  };

  // 计算活动状态
  const getEventStatus = (eventDate) => {
    if (!eventDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: '已结束', color: 'bg-gray-100 text-gray-500', icon: null };
    } else if (diffDays === 0) {
      return { text: '正在进行', color: 'bg-red-500 text-white', icon: 'pulse', animate: true };
    } else if (diffDays === 1) {
      return { text: '明天开始', color: 'bg-orange-100 text-orange-600', icon: null };
    } else if (diffDays <= 3) {
      return { text: `还有 ${diffDays} 天`, color: 'bg-orange-100 text-orange-600', icon: null };
    } else {
      return { text: `还有 ${diffDays} 天`, color: 'bg-green-100 text-green-600', icon: null };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <p className="text-red-500 mb-2">加载失败</p>
        <p className="text-sm text-gray-400">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadPosts}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选标签 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {Object.entries(typeConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              filter === key 
                ? config.color.replace('bg-', 'bg-opacity-100 bg-') + ' ring-2 ring-offset-1 ring-gray-300'
                : config.color.replace('text-', 'bg-gray-100 text-')
            }`}
          >
            <config.icon className="w-3 h-3" />
            {config.label}
          </button>
        ))}
      </div>

      {/* 动态列表 */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post, index) => {
            const TypeIcon = typeConfig[post.type]?.icon || MessageCircle;
            const typeColor = typeConfig[post.type]?.color || 'bg-gray-100 text-gray-700';
            
            // 如果是活动类型，计算活动状态
            const eventStatus = post.type === 'event' && post.event_date ? getEventStatus(post.event_date) : null;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => incrementViews(post.id)}
              >
                <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${post.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}>
                  <CardContent className="p-5">
                    {/* 头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={typeColor}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[post.type]?.label || '动态'}
                        </Badge>
                        
                        {/* 活动状态标签 */}
                        {eventStatus && (
                          <Badge className={`${eventStatus.color} ${eventStatus.animate ? 'animate-pulse' : ''}`}>
                            {eventStatus.text}
                          </Badge>
                        )}
                        
                        {post.is_pinned && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Pin className="w-3 h-3 mr-1" />
                            置顶
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>

                    {/* 内容 */}
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{post.title}</h4>
                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3 whitespace-pre-line">{post.content}</p>

                    {/* 活动日期显示 */}
                    {post.type === 'event' && post.event_date && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          活动时间：{new Date(post.event_date).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    {/* 图片预览 */}
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {post.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {post.images.length > 3 && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                            <span className="text-sm">+{post.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 底部统计 */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        {post.likes || 0}
                      </button>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">暂无动态</p>
            <p className="text-sm text-gray-400">社团管理员发布的内容将显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubPosts;
