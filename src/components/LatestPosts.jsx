import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, 
  Eye, 
  MessageCircle, 
  Pin, 
  Trophy, 
  Calendar, 
  Megaphone,
  ArrowRight,
  Newspaper
} from 'lucide-react';
import { useClubPosts } from '@/hooks/useClubPosts';

const typeConfig = {
  post: { label: '动态', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
  notice: { label: '公告', icon: Megaphone, color: 'bg-red-100 text-red-700' },
  event: { label: '活动', icon: Calendar, color: 'bg-green-100 text-green-700' },
  achievement: { label: '荣誉', icon: Trophy, color: 'bg-yellow-100 text-yellow-700' },
};

const LatestPosts = () => {
  const navigate = useNavigate();
  const { getAllPosts } = useClubPosts();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const result = await getAllPosts(6);
    if (result.success) {
      setPosts(result.data);
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
      return { text: '已结束', color: 'bg-gray-100 text-gray-500' };
    } else if (diffDays === 0) {
      return { text: '正在进行', color: 'bg-red-500 text-white', animate: true };
    } else if (diffDays === 1) {
      return { text: '明天开始', color: 'bg-orange-100 text-orange-600' };
    } else if (diffDays <= 3) {
      return { text: `还有 ${diffDays} 天`, color: 'bg-orange-100 text-orange-600' };
    } else {
      return { text: `还有 ${diffDays} 天`, color: 'bg-green-100 text-green-600' };
    }
  };

  if (posts.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-4">
              <Newspaper className="w-4 h-4" />
              社团动态
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">最新社团资讯</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              了解各社团最新活动、公告和荣誉
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => {
            const TypeIcon = typeConfig[post.type]?.icon || MessageCircle;
            const typeColor = typeConfig[post.type]?.color || 'bg-gray-100 text-gray-700';
            
            // 如果是活动类型，计算活动状态
            const eventStatus = post.type === 'event' && post.event_date ? getEventStatus(post.event_date) : null;
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-xl hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/clubs/${post.club_id}`)}
                >
                  {/* 社团信息头部 */}
                  <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {post.clubs?.image ? (
                        <img 
                          src={post.clubs.image} 
                          alt={post.clubs.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {post.clubs?.name?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{post.clubs?.name}</h4>
                        <p className="text-xs text-gray-500">{post.clubs?.category}</p>
                      </div>
                      <Badge className={typeColor}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig[post.type]?.label}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* 活动状态标签（如果是活动类型） */}
                    {eventStatus && (
                      <div className="mb-3">
                        <Badge className={`${eventStatus.color} ${eventStatus.animate ? 'animate-pulse' : ''}`}>
                          {eventStatus.text}
                        </Badge>
                      </div>
                    )}
                    
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">{post.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{post.content}</p>

                    {/* 活动日期显示 */}
                    {post.type === 'event' && post.event_date && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          {new Date(post.event_date).toLocaleDateString('zh-CN', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    {/* 图片预览 */}
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                          {post.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              +{post.images.length - 1}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Button 
            variant="outline" 
            size="lg"
            className="px-8"
            onClick={() => navigate('/clubs')}
          >
            浏览全部社团
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default LatestPosts;
