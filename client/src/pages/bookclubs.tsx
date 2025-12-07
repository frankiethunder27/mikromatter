import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { CreateBookclubDialog } from "@/components/create-bookclub-dialog";
import type { BookclubWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Bookclubs() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: bookclubs, isLoading } = useQuery<BookclubWithDetails[]>({
    queryKey: ["/api/bookclubs"],
  });

  const joinMutation = useMutation({
    mutationFn: async (bookclubId: string) => {
      return await apiRequest("POST", `/api/bookclubs/${bookclubId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Joined bookclub!",
        description: "You're now a member of this bookclub.",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (bookclubId: string) => {
      return await apiRequest("DELETE", `/api/bookclubs/${bookclubId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Left bookclub",
        description: "You're no longer a member of this bookclub.",
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Indie Author Bookclubs</h1>
          <p className="text-muted-foreground mt-1">
            Discover and discuss books from independent authors
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          data-testid="button-create-bookclub"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Bookclub
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading bookclubs...</p>
        </div>
      ) : bookclubs && bookclubs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bookclubs.map((bookclub) => (
            <Card key={bookclub.id} className="hover-elevate" data-testid={`bookclub-card-${bookclub.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/bookclubs/${bookclub.id}`}>
                      <CardTitle className="cursor-pointer hover:text-primary transition-colors" data-testid={`bookclub-title-${bookclub.id}`}>
                        {bookclub.name}
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-1">{bookclub.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" data-testid={`bookclub-book-${bookclub.id}`}>
                      {bookclub.currentBook}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`bookclub-author-${bookclub.id}`}>
                      by {bookclub.currentAuthor}
                    </p>
                    {bookclub.authorWebsite && (
                      <a
                        href={bookclub.authorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        data-testid={`bookclub-author-website-${bookclub.id}`}
                      >
                        Support the author <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span data-testid={`bookclub-members-${bookclub.id}`}>
                    {bookclub._count.members} {bookclub._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {bookclub.isMember ? (
                  bookclub.isCreator ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                      data-testid={`button-creator-${bookclub.id}`}
                    >
                      You created this bookclub
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => leaveMutation.mutate(bookclub.id)}
                      disabled={leaveMutation.isPending}
                      data-testid={`button-leave-${bookclub.id}`}
                    >
                      {leaveMutation.isPending ? "Leaving..." : "Leave Bookclub"}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => joinMutation.mutate(bookclub.id)}
                    disabled={joinMutation.isPending}
                    data-testid={`button-join-${bookclub.id}`}
                  >
                    {joinMutation.isPending ? "Joining..." : "Join Bookclub"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No bookclubs yet. Be the first to create one!</p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-bookclub">
              <Plus className="h-4 w-4 mr-2" />
              Create Bookclub
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateBookclubDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
