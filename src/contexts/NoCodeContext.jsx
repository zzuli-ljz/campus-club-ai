import React, { createContext, useContext, useEffect, useState } from 'react';

const NoCodeSDKContext = createContext();

const useNoCodeSDKAvailability = () => {
  const [isAvailable, setIsAvailable] = useState(() => typeof window.NoCode !== 'undefined');

  useEffect(() => {
    if (isAvailable) return;

    const checkAvailability = () => {
      if (typeof window.NoCode !== 'undefined') {
        setIsAvailable(true);
        return true;
      }
      return false;
    };
    if (checkAvailability()) return;

    const interval = setInterval(() => {
      if (checkAvailability()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isAvailable]);

  return isAvailable;
};

export const useNoCodeSDK = () => {
  const context = useContext(NoCodeSDKContext);
  if (!context) {
    throw new Error('useNoCodeSDK must be used within a NoCodeProvider');
  }
  return context;
};

export const NoCodeProvider = ({ children }) => {
  const isAvailable = useNoCodeSDKAvailability();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!isAvailable || isReady || isLoading || initError) return;

    const initSDK = async () => {
      setIsLoading(true);
      setInitError(null);

      try {
        const modules = import.meta.glob('@/integrations/supabase/client.js');
        let supabaseConfig = Object.values(modules).length ? await Object.values(modules)[0]() : null;
        const result = await window.NoCode.init({
          chatId: import.meta.env.VITE_CHAT_ID,
          chatEnv: import.meta.env.VITE_CHAT_ENV,
          authEnabled: import.meta.env.VITE_AUTH_ENABLED,
          supabase: supabaseConfig?.supabase,
        });

        if (result.success) {
          setIsReady(true);
        } else {
          setInitError(new Error(result.error || 'NoCode SDK 初始化失败'));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        setInitError(new Error(errorMsg));
      } finally {
        setIsLoading(false);
      }
    };

    initSDK();
  }, [isAvailable, isReady, isLoading, initError]);

  const value = {
    isReady,
  };

  return (
    <NoCodeSDKContext.Provider value={value}>
      {isReady ? children : ""}
    </NoCodeSDKContext.Provider>
  );
};


