import Navbar from "./Navbar";

/**
 * 通用布局组件，为所有页面提供统一的导航栏
 */
const Layout = ({ children, showBack, backText, onBack, title, rightContent }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        showBack={showBack}
        backText={backText}
        onBack={onBack}
        title={title}
        rightContent={rightContent}
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout;
