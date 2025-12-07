import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import type { UploadResult } from "@uppy/core";

const CARTOON_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
];

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar?: string;
}

export function AvatarSelector({ open, onOpenChange, currentAvatar }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const { toast } = useToast();

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      await apiRequest("PUT", "/api/avatar", { avatarURL: avatarUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/avatar/upload-url", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]?.uploadURL) {
      updateAvatarMutation.mutate(result.successful[0].uploadURL);
    }
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleSave = () => {
    if (selectedAvatar) {
      updateAvatarMutation.mutate(selectedAvatar);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select a cartoon avatar or upload your own image to personalize your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Cartoon Avatars</h3>
            <div className="grid grid-cols-6 gap-3">
              {CARTOON_AVATARS.map((avatarUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAvatar(avatarUrl)}
                  className={`relative rounded-lg p-1 transition-all hover-elevate ${
                    selectedAvatar === avatarUrl ? "ring-2 ring-primary" : ""
                  }`}
                  data-testid={`avatar-option-${index}`}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Or Upload Your Own</h3>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5242880}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </ObjectUploader>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedAvatar || updateAvatarMutation.isPending}
              data-testid="button-save-avatar"
            >
              {updateAvatarMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
