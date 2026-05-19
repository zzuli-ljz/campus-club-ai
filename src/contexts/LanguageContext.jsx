import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/i18n/translations";

// 创建上下文
const LanguageContext = createContext(null);

// 导出自定义 hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

// 导出 Provider 组件
export const LanguageProvider = ({ children }) => {
  // 从 localStorage 读取保存的语言设置，默认中文
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "zh";
  });

  // 语言改变时保存到 localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // 切换语言
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "zh" ? "en" : "zh"));
  };

  // 翻译函数
  const t = (key, fallback) => {
    const langData = translations[language];
    return langData[key] || fallback || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isChinese: language === "zh",
    isEnglish: language === "en",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
