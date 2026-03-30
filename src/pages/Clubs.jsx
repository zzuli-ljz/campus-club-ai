import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Users, 
  MapPin,
  ArrowRight,
  Filter,
  X
} from "lucide-react";
import { useClubs } from "@/hooks/useClubs";
import Navbar from "@/components/Navbar";

// 所有可筛选的标签
const allTags = [
  "编程开发", "人工智能", "数学建模", "文学创作", "辩论演讲",
  "合唱团", "舞蹈队", "话剧社", "吉他社", "摄影协会", "绘画艺术",
  "篮球", "足球", "羽毛球", "乒乓球", "网球", "游泳", "健身",
  "志愿服务", "环保公益", "支教助学",
  "机器人", "3D打印", "电子设计", "游戏开发", "UI设计"
];

const categoryColors = {
  "学术科技": "bg-blue-100 text-blue-700",
  "文艺创作": "bg-purple-100 text-purple-700",
  "体育运动": "bg-orange-100 text-orange-700",
  "公益实践": "bg-green-100 text-green-700",
  "技术工程": "bg-indigo-100 text-indigo-700"
};

const Clubs = () => {
  const navigate = useNavigate();
  const { clubs, isLoading } = useClubs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // 筛选逻辑
  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      const matchesSearch = 
        club.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => club.tags?.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, clubs]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 导航栏 */}
      <Navbar 
        rightContent={
          <div className="text-sm text-gray-500">
            浏览全部社团
          </div>
        }
      />

      {/* 主内容 */}
      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 标题区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              发现精彩<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">社团</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              浏览所有社团，找到属于你的兴趣圈子
            </p>
          </motion.div>

          {/* 搜索和筛选区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="搜索社团名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white/80 border-gray-200 focus:border-blue-500"
                />
              </div>
              <Button
                variant="outline"
                className="h-12 px-6 bg-white/80"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                筛选标签
                {selectedTags.length > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white">{selectedTags.length}</Badge>
                )}
              </Button>
            </div>

            {/* 标签筛选面板 */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">选择标签筛选</span>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      清空筛选
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-all
                        ${selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 已选标签展示 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer px-3 py-1"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>

          {/* 结果统计 */}
          <div className="mb-6 text-sm text-gray-500">
            {isLoading ? "加载中..." : `共找到 ${filteredClubs.length} 个社团`}
          </div>

          {/* 社团卡片网格 */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    {/* 图片区域 */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={club.image || `https://nocode.meituan.com/photo/search?keyword=club,activity&width=400&height=300`} 
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className={`${categoryColors[club.category] || "bg-gray-100 text-gray-700"} border-0`}>
                          {club.category}
                        </Badge>
                      </div>
                      {/* 招新状态标签 */}
                      <div className="absolute top-3 right-3">
                        {club.is_recruiting ? (
                          <Badge className="bg-green-500 text-white border-0 shadow-md">
                            正在招新
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500 text-white border-0 shadow-md">
                            已停止招新
                          </Badge>
                        )}
                      </div>
                      {/* 非招新状态时的遮罩 */}
                      {!club.is_recruiting && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-medium text-lg">已停止招新</span>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {club.name}
                      </h3>
                      
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {club.description}
                      </p>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {club.tags?.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {club.tags?.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                            +{club.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* 底部信息 */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {club.members || 0}人
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {club.location || "待定"}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && filteredClubs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的社团</h3>
              <p className="text-gray-500 mb-4">尝试调整搜索关键词或筛选标签</p>
              <Button variant="outline" onClick={clearFilters}>
                清空筛选条件
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Clubs;
