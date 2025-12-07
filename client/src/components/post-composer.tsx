import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Pencil, Sparkles, Lightbulb, CheckCircle, Mic, MicOff, Image, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const POST_TEMPLATES = [
  { label: "Hot take", content: "🔥 Hot take:\n\n" },
  { label: "Unpopular opinion", content: "Unpopular opinion:\n\n" },
  { label: "Here's what I learned", content: "Here's what I learned today:\n\n" },
  { label: "Pro tip", content: "💡 Pro tip:\n\n" },
  { label: "Controversial but true", content: "Controversial but true:\n\n" },
  { label: "I used to think", content: "I used to think...\n\nBut now I realize...\n\n" },
  { label: "3 lessons", content: "3 lessons I learned this week:\n\n1. \n2. \n3. " },
  { label: "What nobody tells you", content: "What nobody tells you about [topic]:\n\n" },
  { label: "Daily reflection", content: "Today's reflection:\n\n" },
  { label: "Question for you", content: "Question for you:\n\n" },
];

export function PostComposer() {
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const recognitionRef = useRef<any>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > 1000;
  const showWordCount = wordCount > 800;

  useEffect(() => {
    if (!open && isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      recognitionRef.current = null;
    }
  }, [open, isRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const postMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/posts", { 
        content: content.trim(),
        imageUrl: imageUrl || undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setImageUrl("");
      setOpen(false);
      toast({
        title: "Success",
        description: "Your post has been published!",
      });
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
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || isOverLimit) return;
    postMutation.mutate();
  };

  const handleTemplateClick = (template: typeof POST_TEMPLATES[0]) => {
    setContent(template.content);
    setShowTemplates(false);
  };

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-ideas", {});
      const data = await response.json();
      return data as { ideas: string[] };
    },
    onSuccess: (data) => {
      if (data.ideas && data.ideas.length > 0) {
        toast({
          title: "Ideas Generated!",
          description: "Click on an idea below to use it",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate ideas",
        variant: "destructive",
      });
    },
  });

  const proofreadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/proofread", { content });
      const data = await response.json();
      return data as { correctedText: string; suggestions: Array<{ original: string; suggestion: string; reason: string }> };
    },
    onSuccess: (data) => {
      if (data.correctedText && data.correctedText !== content) {
        setContent(data.correctedText);
        toast({
          title: "Proofread Complete!",
          description: `Applied ${data.suggestions.length} improvement${data.suggestions.length !== 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "Looks Good!",
          description: "No changes needed",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to proofread",
        variant: "destructive",
      });
    },
  });

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      recognitionRef.current = null;
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Start speaking to add text to your post",
      });
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setContent(prev => (prev + ' ' + finalTranscript).trim());
        setShowTemplates(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      recognitionRef.current = null;
      toast({
        title: "Error",
        description: "Failed to capture voice. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleImageUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/posts/image/upload-url", {});
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImageComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL.split("?")[0];
      
      try {
        const response = await apiRequest("POST", "/api/posts/image/finalize", { imageURL });
        const data = await response.json();
        setImageUrl(data.objectPath);
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } catch (error) {
        console.error("Error finalizing image:", error);
        toast({
          title: "Error",
          description: "Failed to finalize image upload",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full" data-testid="button-new-post">
          <Pencil className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community. Supports text, images, and voice input.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback>
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            {showTemplates && content.length === 0 && (
              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Start with a template:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POST_TEMPLATES.map((template) => (
                    <Badge
                      key={template.label}
                      variant="outline"
                      className="cursor-pointer hover-elevate active-elevate-2"
                      onClick={() => handleTemplateClick(template)}
                      data-testid={`template-${template.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {template.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (e.target.value.length > 0) setShowTemplates(false);
              }}
              onFocus={() => setShowTemplates(false)}
              className="min-h-[200px] resize-none text-base border-0 focus-visible:ring-0 p-0"
              data-testid="input-post-content"
            />
            {imageUrl && (
              <div className="relative inline-block">
                <img 
                  src={imageUrl} 
                  alt="Post attachment" 
                  className="max-h-64 rounded-md border"
                  data-testid="post-image-preview"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setImageUrl("")}
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {generateIdeasMutation.data?.ideas && generateIdeasMutation.data.ideas.length > 0 && (
              <div className="space-y-2 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span>AI Generated Ideas:</span>
                </div>
                <div className="space-y-2">
                  {generateIdeasMutation.data.ideas.map((idea, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 rounded-md bg-muted hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => {
                        setContent(idea);
                        generateIdeasMutation.reset();
                      }}
                      data-testid={`ai-idea-${index}`}
                    >
                      {idea}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handleImageUpload}
                  onComplete={handleImageComplete}
                  buttonClassName="h-9 px-3"
                >
                  <Image className="h-4 w-4 mr-1" />
                  Image
                </ObjectUploader>
                <Button
                  variant={isRecording ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleVoiceRecording}
                  data-testid="button-voice-input"
                >
                  {isRecording ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                  {isRecording ? "Stop" : "Voice"}
                </Button>
                {content.length === 0 && !showTemplates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    data-testid="button-show-templates"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Templates
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateIdeasMutation.mutate()}
                  disabled={generateIdeasMutation.isPending}
                  data-testid="button-ai-ideas"
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  {generateIdeasMutation.isPending ? "Generating..." : "AI Ideas"}
                </Button>
                {content.trim().length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => proofreadMutation.mutate()}
                    disabled={proofreadMutation.isPending}
                    data-testid="button-proofread"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {proofreadMutation.isPending ? "Proofreading..." : "Proofread"}
                  </Button>
                )}
                <div className="text-sm ml-auto">
                  {showWordCount && (
                    <span className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {wordCount} / 1000 words
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit || postMutation.isPending}
                data-testid="button-submit-post"
              >
                {postMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
