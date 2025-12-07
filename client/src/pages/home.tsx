import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post-card";
import { PostComposer } from "@/components/post-composer";
import { MatterOfTheDay } from "@/components/matter-of-the-day";
import type { PostWithAuthor } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
        <h2 className="text-xl font-bold mb-4">Home</h2>
        <PostComposer />
      </div>

      <div className="p-4">
        <MatterOfTheDay />
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
