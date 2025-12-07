import { useQuery } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrendingHashtag {
  name: string;
  count: number;
}

export function TrendingHashtags() {
  const { data: trending = [] } = useQuery<TrendingHashtag[]>({
    queryKey: ["/api/hashtags/trending"],
  });

  if (trending.length === 0) {
    return null;
  }

  return (
    <Card data-testid="trending-hashtags">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {trending.map((tag) => (
          <a
            key={tag.name}
            href={`/hashtag/${tag.name}`}
            className="flex items-center justify-between p-2 rounded-md hover-elevate active-elevate-2 transition-colors"
            data-testid={`trending-hashtag-${tag.name}`}
          >
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">#{tag.name}</span>
            </div>
            <Badge variant="secondary" className="text-xs" data-testid={`hashtag-count-${tag.name}`}>
              {tag.count}
            </Badge>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
