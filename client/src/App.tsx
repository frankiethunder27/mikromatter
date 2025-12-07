import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const Profile = lazy(() => import("@/pages/profile"));
const HashtagPage = lazy(() => import("@/pages/hashtag"));
const Bookclubs = lazy(() => import("@/pages/bookclubs"));
const BookclubDetail = lazy(() => import("@/pages/bookclub-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b border-border">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/profile/:id" component={Profile} />
                  <Route path="/hashtag/:name" component={HashtagPage} />
                  <Route path="/bookclubs" component={Bookclubs} />
                  <Route path="/bookclubs/:id" component={BookclubDetail} />
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
