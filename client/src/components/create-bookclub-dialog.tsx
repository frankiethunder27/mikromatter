import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookclubSchema, type InsertBookclub } from "@shared/schema";

interface CreateBookclubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBookclubDialog({ open, onOpenChange }: CreateBookclubDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertBookclub>({
    resolver: zodResolver(insertBookclubSchema),
    defaultValues: {
      name: "",
      description: "",
      currentBook: "",
      currentAuthor: "",
      authorWebsite: "",
      bookCoverUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBookclub) => {
      const cleanedData = {
        ...data,
        authorWebsite: data.authorWebsite || undefined,
        bookCoverUrl: data.bookCoverUrl || undefined,
      };
      return await apiRequest("POST", "/api/bookclubs", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookclubs"] });
      toast({
        title: "Bookclub created!",
        description: "Your bookclub has been successfully created.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bookclub",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertBookclub) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Create Indie Author Bookclub
          </DialogTitle>
          <DialogDescription>
            Start a bookclub to discover and discuss books from independent authors with others.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bookclub Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sci-Fi Indie Readers" {...field} data-testid="input-bookclub-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's your bookclub about?" rows={3} {...field} data-testid="input-bookclub-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentBook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Book Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Stars Beyond" {...field} data-testid="input-current-book" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentAuthor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indie Author Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Smith" {...field} data-testid="input-current-author" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Website (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://author-website.com" {...field} data-testid="input-author-website" />
                  </FormControl>
                  <FormDescription>
                    Help support indie authors by linking to their website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookCoverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Cover URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/cover.jpg" {...field} data-testid="input-book-cover-url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-bookclub"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit-bookclub"
              >
                {createMutation.isPending ? "Creating..." : "Create Bookclub"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
