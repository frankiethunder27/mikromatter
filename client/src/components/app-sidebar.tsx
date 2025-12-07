import { Home, User, Bell, BookmarkIcon, LogOut, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingHashtags } from "./trending-hashtags";
import { MikromatterLogo } from "./mikromatter-logo";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
      testId: "nav-home",
    },
    {
      title: "Bookclubs",
      url: "/bookclubs",
      icon: BookOpen,
      testId: "nav-bookclubs",
    },
    {
      title: "Profile",
      url: `/profile/${user?.id}`,
      icon: User,
      testId: "nav-profile",
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      testId: "nav-notifications",
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: BookmarkIcon,
      testId: "nav-bookmarks",
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <MikromatterLogo />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <a href={item.url} className="flex items-center gap-3 px-4 py-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <div className="px-4">
            <TrendingHashtags />
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
              <AvatarFallback>
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="sidebar-user-name">
                {user?.firstName || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="sidebar-user-email">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
