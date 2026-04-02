import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCategoryTags = () => {
  const [tagsByCategory, setTagsByCategory] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取所有分类标签
  const fetchCategoryTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_tags')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 按分类分组
      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item.tag);
      });

      setTagsByCategory(grouped);
      setAllTags(data.map(item => item.tag));
    } catch (err) {
      console.error('获取分类标签失败:', err);
      toast.error('加载标签失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 添加新标签
  const addCustomTag = useCallback(async (category, tag) => {
    try {
      const { data, error } = await supabase
        .from('category_tags')
        .insert([{
          category,
          tag: tag.trim(),
          is_custom: true,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('该标签已存在');
          return { success: false, error: '标签已存在' };
        }
        throw error;
      }

      // 更新本地状态
      setTagsByCategory(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), tag.trim()]
      }));
      setAllTags(prev => [...prev, tag.trim()]);

      toast.success(`已添加新标签：${tag}`);
      return { success: true, data };
    } catch (err) {
      console.error('添加标签失败:', err);
      toast.error('添加标签失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 删除标签
  const deleteTag = useCallback(async (category, tag) => {
    try {
      // 1. 从 category_tags 表中删除标签
      const { error: deleteError } = await supabase
        .from('category_tags')
        .delete()
        .eq('category', category)
        .eq('tag', tag);

      if (deleteError) throw deleteError;

      // 2. 从所有社团的 tags 数组中移除该标签
      // 先获取所有包含该标签的社团
      const { data: clubsWithTag, error: fetchError } = await supabase
        .from('clubs')
        .select('id, tags')
        .contains('tags', [tag]);

      if (fetchError) throw fetchError;

      // 更新每个社团的标签数组
      if (clubsWithTag && clubsWithTag.length > 0) {
        for (const club of clubsWithTag) {
          const newTags = club.tags.filter(t => t !== tag);
          const { error: updateError } = await supabase
            .from('clubs')
            .update({ tags: newTags })
            .eq('id', club.id);

          if (updateError) {
            console.error(`更新社团 ${club.id} 标签失败:`, updateError);
          }
        }
        toast.info(`已从 ${clubsWithTag.length} 个社团中移除该标签`);
      }

      // 更新本地状态
      setTagsByCategory(prev => ({
        ...prev,
        [category]: (prev[category] || []).filter(t => t !== tag)
      }));
      setAllTags(prev => prev.filter(t => t !== tag));

      toast.success(`已删除标签：${tag}`);
      return { success: true };
    } catch (err) {
      console.error('删除标签失败:', err);
      toast.error('删除标签失败: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // 获取指定分类的标签（包含自定义添加选项）
  const getTagsForCategory = useCallback((category) => {
    return tagsByCategory[category] || [];
  }, [tagsByCategory]);

  // 分类映射（用于 Survey 页面）
  const categoryMapping = {
    '学术科技': 'academic',
    '文艺创作': 'arts',
    '体育运动': 'sports',
    '公益实践': 'public',
    '技术工程': 'tech',
  };

  // 反向映射
  const reverseCategoryMapping = {
    'academic': '学术科技',
    'arts': '文艺创作',
    'sports': '体育运动',
    'public': '公益实践',
    'tech': '技术工程',
  };

  useEffect(() => {
    fetchCategoryTags();
  }, [fetchCategoryTags]);

  return {
    tagsByCategory,
    allTags,
    isLoading,
    fetchCategoryTags,
    addCustomTag,
    deleteTag,
    getTagsForCategory,
    categoryMapping,
    reverseCategoryMapping,
  };
};
