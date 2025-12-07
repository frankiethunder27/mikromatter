import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Users, Heart } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { MikromatterLogo } from "@/components/mikromatter-logo";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const { data: providers } = useQuery<{ providers: string[] }>({
    queryKey: ["/api/auth/providers"],
    retry: false,
  });

  const hasGitHub = providers?.providers?.includes("github");
  const hasGoogle = providers?.providers?.includes("google");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <MikromatterLogo />
          <div className="flex gap-2">
            {hasGitHub && (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/api/auth/github"}
                data-testid="button-header-github"
              >
                <FaGithub className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            )}
            {hasGoogle && (
              <Button
                onClick={() => window.location.href = "/api/auth/google"}
                data-testid="button-header-google"
              >
                <FaGoogle className="h-4 w-4 mr-2" />
                Google
              </Button>
            )}
            {!hasGitHub && !hasGoogle && (
              <Button onClick={() => window.location.href = "/api/login"}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Share Your Thoughts
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              A modern micro blog platform where ideas flow freely. Express yourself in up to 1000 words.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {hasGitHub && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto"
                  onClick={() => window.location.href = "/api/auth/github"}
                  data-testid="button-get-started-github"
                >
                  <FaGithub className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </Button>
              )}
              {hasGoogle && (
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                  onClick={() => window.location.href = "/api/auth/google"}
                  data-testid="button-get-started-google"
                >
                  <FaGoogle className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
              )}
              {!hasGitHub && !hasGoogle && (
                <Button
                  size="lg"
                  className="text-lg px-12 py-6 h-auto"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-get-started"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              ⚡ Quick sign-in - no password required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-3 p-6 rounded-lg border border-border hover-elevate transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Express Yourself</h3>
              <p className="text-muted-foreground">
                Share your thoughts and stories with the community in beautifully formatted posts.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg border border-border hover-elevate transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold">Build Your Network</h3>
              <p className="text-muted-foreground">
                Follow interesting people, discover new perspectives, and grow your community.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg border border-border hover-elevate transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Engage & Connect</h3>
              <p className="text-muted-foreground">
                Like, repost, and comment on posts that resonate with you. Start conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
