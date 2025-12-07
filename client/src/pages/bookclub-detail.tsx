import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ExternalLink, ArrowLeft, Trash2 } from "lucide-react";
import type { BookclubWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BookclubDetail() {
  const params = useParams();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: bookclub, isLoading } = useQuery<BookclubWithDetails>({
    queryKey: ["/api/bookclubs", id],
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/bookclubs/${id}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Joined bookclub!",
        description: "You're now a member of this bookclub.",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/bookclubs/${id}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Left bookclub",
        description: "You're no longer a member of this bookclub.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/bookclubs/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Bookclub deleted",
        description: "The bookclub has been successfully deleted.",
      });
      setLocation("/bookclubs");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading bookclub...</p>
        </div>
      </div>
    );
  }

  if (!bookclub) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Bookclub not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Button
        variant="ghost"
        onClick={() => setLocation("/bookclubs")}
        className="mb-4"
        data-testid="button-back-to-bookclubs"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Bookclubs
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2" data-testid="bookclub-detail-title">
                {bookclub.name}
              </CardTitle>
              <CardDescription className="text-base" data-testid="bookclub-detail-description">
                {bookclub.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {bookclub.isMember && !bookclub.isCreator && (
                <Button
                  variant="outline"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                  data-testid="button-leave-bookclub"
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave Bookclub"}
                </Button>
              )}
              {!bookclub.isMember && (
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  data-testid="button-join-bookclub"
                >
                  {joinMutation.isPending ? "Joining..." : "Join Bookclub"}
                </Button>
              )}
              {bookclub.isCreator && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" data-testid="button-delete-bookclub">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bookclub?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the bookclub
                        and remove all members.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <BookOpen className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Currently Reading</p>
                <h3 className="text-2xl font-bold mb-1" data-testid="current-book-title">
                  {bookclub.currentBook}
                </h3>
                <p className="text-lg text-muted-foreground mb-3" data-testid="current-author">
                  by {bookclub.currentAuthor}
                </p>
                {bookclub.authorWebsite && (
                  <a
                    href={bookclub.authorWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                    data-testid="author-website-link"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Support the indie author
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="member-count">
                  {bookclub._count.members}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={bookclub.creator.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {bookclub.creator.firstName?.[0] || bookclub.creator.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium" data-testid="creator-name">
                    {bookclub.creator.firstName && bookclub.creator.lastName
                      ? `${bookclub.creator.firstName} ${bookclub.creator.lastName}`
                      : bookclub.creator.email}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-3">About Indie Author Bookclubs</h3>
            <p className="text-muted-foreground">
              Indie Author Bookclubs on Mikromatter are dedicated to discovering, reading, and discussing
              books from independent authors. Join discussions, share your thoughts, and support indie
              authors by spreading the word about their work.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
