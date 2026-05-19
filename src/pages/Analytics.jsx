import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ClubCategoryPieChart,
  ClubMembersBarChart,
  UserInterestRadarChart,
  HotTagsChart,
  ApplicationTrendChart,
  ApplicationFunnelChart,
  ClubStatsDashboard,
} from "@/components/Charts";

export default function Analytics() {
  const [clubs, setClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clubsRes, appsRes, interestsRes] = await Promise.all([
        supabase.from("clubs").select("*"),
        supabase.from("applications").select("*"),
        supabase.from("user_interests").select("*"),
      ]);

      if (clubsRes.data) setClubs(clubsRes.data);
      if (appsRes.data) setApplications(appsRes.data);
      if (interestsRes.data) setUserInterests(interestsRes.data);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载数据中...</p>
        </div>
      </div>
    );
  }

  // 收集所有标签
  const allTags = clubs.flatMap(club => club.tags || []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 数据分析中心</h1>
          <p className="text-gray-600 mt-2">可视化展示社团数据统计</p>
        </div>

        {/* 统计概览 */}
        <div className="mb-8">
          <ClubStatsDashboard clubs={clubs} applications={applications} />
        </div>

        {/* 图表网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. 社团分类饼图 */}
          <div className="lg:col-span-1">
            <ClubCategoryPieChart clubs={clubs} />
          </div>

          {/* 2. 成员数量柱状图 */}
          <div className="lg:col-span-2">
            <ClubMembersBarChart clubs={clubs} />
          </div>

          {/* 3. 热门标签 */}
          <div className="lg:col-span-2">
            <HotTagsChart clubs={clubs} />
          </div>

          {/* 4. 兴趣雷达图 */}
          <div className="lg:col-span-1">
            <UserInterestRadarChart 
              userInterests={userInterests} 
              allTags={allTags} 
            />
          </div>

          {/* 5. 申请趋势 */}
          <div className="lg:col-span-1">
            <ApplicationTrendChart applications={applications} />
          </div>

          {/* 6. 申请漏斗 */}
          <div className="lg:col-span-2">
            <ApplicationFunnelChart applications={applications} />
          </div>
        </div>

        {/* 数据说明 */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">📖 图表说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">社团分类分布</span>
              <p className="mt-1">展示5大社团类别的占比情况</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">成员数量 TOP 8</span>
              <p className="mt-1">按成员数量排序的社团排名</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">兴趣特征雷达</span>
              <p className="mt-1">用户兴趣与热门标签的匹配情况</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">热门社团标签</span>
              <p className="mt-1">标签大小表示在社团中的出现频率</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">申请趋势</span>
              <p className="mt-1">按月份统计的申请数量变化</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">申请转化漏斗</span>
              <p className="mt-1">从提交到审核的转化率分析</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
