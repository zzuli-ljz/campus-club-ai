import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RouteGuard from "@/components/RouteGuard";
import { navItems } from "./nav-items";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <UserProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <HashRouter>
              <Routes>
                {navItems.map(({ to, page }) => (
                  <Route
                    key={to}
                    path={to}
                    element={
                      <RouteGuard>{page}</RouteGuard>
                    }
                  />
                ))}
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </NotificationProvider>
      </UserProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
