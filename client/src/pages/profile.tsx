import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarSelector } from "@/components/avatar-selector";
import type { UserWithStats, PostWithAuthor } from "@shared/schema";
import { Loader2, MapPin, Calendar, UserPlus, UserMinus, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const { data: profileUser, isLoading: userLoading } = useQuery<UserWithStats>({
    queryKey: ["/api/users", id],
    enabled: !!id,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", id, "posts"],
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profileUser?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${id}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b border-border">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20"></div>
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profileUser.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-3xl">
                  {profileUser.firstName?.[0] || profileUser.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="icon"
                  variant="default"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                  onClick={() => setShowAvatarSelector(true)}
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              )}
            </div>
            {!isOwnProfile && (
              <Button
                variant={profileUser.isFollowing ? "outline" : "default"}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                data-testid="button-follow"
              >
                {profileUser.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" data-testid="profile-name">
              {profileUser.firstName || profileUser.email?.split("@")[0] || "User"}
            </h2>
            {profileUser.email && (
              <p className="text-muted-foreground font-mono text-sm" data-testid="profile-email">
                {profileUser.email}
              </p>
            )}
            {profileUser.bio && (
              <p className="text-base" data-testid="profile-bio">{profileUser.bio}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {profileUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profileUser.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDistanceToNow(new Date(profileUser.createdAt!), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm pt-2">
              <div data-testid="profile-posts-count">
                <span className="font-bold">{profileUser._count.posts}</span>
                <span className="text-muted-foreground ml-1">Posts</span>
              </div>
              <div data-testid="profile-following-count">
                <span className="font-bold">{profileUser._count.following}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
              <div data-testid="profile-followers-count">
                <span className="font-bold">{profileUser._count.followers}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            data-testid="tab-posts"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            data-testid="tab-replies"
          >
            Replies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-0">
          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="replies" className="mt-0">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No replies yet</p>
          </div>
        </TabsContent>
      </Tabs>

      <AvatarSelector
        open={showAvatarSelector}
        onOpenChange={setShowAvatarSelector}
        currentAvatar={profileUser.profileImageUrl || undefined}
      />
    </div>
  );
}
