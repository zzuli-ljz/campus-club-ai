import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useClubMembership = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 检查用户是否是某个社团的成员
  const checkIsMember = useCallback(async (userId, clubId) => {
    if (!userId || !clubId) return { isMember: false };
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('id, role')
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .eq('status', 'active')
        .single();

      if (error) {
        // 如果没找到记录，说明不是成员
        if (error.code === 'PGRST116') {
          return { isMember: false };
        }
        throw error;
      }

      return { 
        isMember: true, 
        memberInfo: data 
      };
    } catch (err) {
      console.error('检查成员状态失败:', err);
      return { isMember: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    checkIsMember,
  };
};
