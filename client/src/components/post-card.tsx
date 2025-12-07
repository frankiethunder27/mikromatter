import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Repeat2, MessageCircle, Share } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor, CommentWithAuthor } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import { HashtagContent } from "./hashtag-content";
import { useLocation } from "wouter";

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id] });
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
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      if (post.isReposted) {
        await apiRequest("DELETE", `/api/posts/${post.id}/repost`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/repost`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id] });
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
        description: "Failed to repost",
        variant: "destructive",
      });
    },
  });

  const { data: comments = [] } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: commentContent,
      });
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  return (
    <article className="border-b border-border p-4 hover-elevate transition-colors" data-testid={`post-${post.id}`}>
      <div className="flex gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={post.author.profileImageUrl || undefined} className="object-cover" />
          <AvatarFallback>
            {post.author.firstName?.[0] || post.author.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={`/profile/${post.author.id}`}
              className="font-semibold hover:underline truncate"
              data-testid={`post-author-${post.id}`}
            >
              {post.author.firstName || post.author.email?.split("@")[0] || "User"}
            </a>
            <span className="text-sm text-muted-foreground font-mono">
              {formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true })}
            </span>
          </div>
          <div className="text-base mb-3" data-testid={`post-content-${post.id}`}>
            <HashtagContent 
              content={post.content} 
              onHashtagClick={(hashtag) => setLocation(`/hashtag/${hashtag}`)}
            />
          </div>
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt="Post image" 
              className="max-h-96 w-full object-cover rounded-md border mb-3"
              data-testid={`post-image-${post.id}`}
            />
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${post.isLiked ? "text-chart-4" : ""}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span className="text-sm" data-testid={`post-likes-${post.id}`}>{post._count.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${post.isReposted ? "text-secondary" : ""}`}
              onClick={() => repostMutation.mutate()}
              disabled={repostMutation.isPending}
              data-testid={`button-repost-${post.id}`}
            >
              <Repeat2 className="h-4 w-4" />
              <span className="text-sm" data-testid={`post-reposts-${post.id}`}>{post._count.reposts}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComments(!showComments)}
              data-testid={`button-comments-${post.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm" data-testid={`post-comments-${post.id}`}>{post._count.comments}</span>
            </Button>
            <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
              <Share className="h-4 w-4" />
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-4" data-testid={`comments-section-${post.id}`}>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="min-h-[80px]"
                  data-testid={`input-comment-${post.id}`}
                />
                <Button
                  onClick={() => commentMutation.mutate()}
                  disabled={!commentContent.trim() || commentMutation.isPending}
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  Post
                </Button>
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 pl-4 border-l-2 border-border" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">User</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm" data-testid={`comment-content-${comment.id}`}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
