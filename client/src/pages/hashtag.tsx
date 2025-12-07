import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post-card";
import { Hash, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostWithAuthor } from "@shared/schema";
import { Link } from "wouter";

export default function HashtagPage() {
  const [, params] = useRoute("/hashtag/:name");
  const hashtagName = params?.name || "";

  const { data: posts = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/hashtags", hashtagName, "posts"],
    enabled: !!hashtagName,
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Hash className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold" data-testid="hashtag-title">
                {hashtagName}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No posts with this hashtag yet.
          </div>
        ) : (
          <div data-testid="hashtag-posts">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
