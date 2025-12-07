import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertPostSchema, insertCommentSchema, insertBookclubSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId, currentUserId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.user.claims.sub;
      const posts = await storage.getUserPosts(userId, currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followingId = req.params.id;
      const followerId = req.user.claims.sub;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      await storage.followUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followingId = req.params.id;
      const followerId = req.user.claims.sub;
      
      await storage.unfollowUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const posts = await storage.getAllPosts(currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const currentUserId = req.user.claims.sub;
      const post = await storage.getPostWithAuthor(postId, currentUserId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost(userId, validatedData);
      
      // Extract and save hashtags
      await storage.extractAndSaveHashtags(post.id, validatedData.content);
      
      const postWithAuthor = await storage.getPostWithAuthor(post.id, userId);
      
      // Broadcast new post to all connected WebSocket clients
      broadcastToAll({ type: 'new_post', post: postWithAuthor });
      
      res.json(postWithAuthor);
    } catch (error: any) {
      console.error("Error creating post:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.claims.sub;
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like routes
  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.claims.sub;
      
      await storage.likePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.claims.sub;
      
      await storage.unlikePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Repost routes
  app.post('/api/posts/:id/repost', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.claims.sub;
      
      await storage.repostPost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reposting:", error);
      res.status(500).json({ message: "Failed to repost" });
    }
  });

  app.delete('/api/posts/:id/repost', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.claims.sub;
      
      await storage.unrepostPost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unreposting:", error);
      res.status(500).json({ message: "Failed to unrepost" });
    }
  });

  // Comment routes
  app.get('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id,
      });
      
      const comment = await storage.createComment(userId, validatedData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Search routes
  app.get('/api/search/users', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }
      const users = await storage.searchUsers(query.trim());
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get('/api/search/posts', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      const currentUserId = req.user.claims.sub;
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }
      const posts = await storage.searchPosts(query.trim(), currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ message: "Failed to search posts" });
    }
  });

  // Avatar upload routes
  app.post('/api/avatar/upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put('/api/avatar', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.avatarURL) {
        return res.status(400).json({ message: "avatarURL is required" });
      }

      const userId = req.user.claims.sub;
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.avatarURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      await storage.updateUserAvatar(userId, objectPath);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ message: "Failed to set avatar" });
    }
  });

  // Post image upload routes
  app.post('/api/posts/image/upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post('/api/posts/image/finalize', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ message: "imageURL is required" });
      }

      const userId = req.user.claims.sub;
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.json({ objectPath });
    } catch (error) {
      console.error("Error finalizing image:", error);
      res.status(500).json({ message: "Failed to finalize image" });
    }
  });

  // Hashtag routes
  app.get('/api/hashtags/trending', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingHashtags(limit);
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
      res.status(500).json({ message: "Failed to fetch trending hashtags" });
    }
  });

  app.get('/api/hashtags/:name/posts', isAuthenticated, async (req: any, res) => {
    try {
      const hashtagName = req.params.name;
      const currentUserId = req.user.claims.sub;
      const posts = await storage.getPostsByHashtag(hashtagName, currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts by hashtag:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // AI routes
  app.post('/api/ai/generate-ideas', isAuthenticated, async (req: any, res) => {
    try {
      const { generatePostIdeas } = await import("./ai");
      const { topic } = req.body;
      const ideas = await generatePostIdeas(topic);
      res.json({ ideas });
    } catch (error: any) {
      console.error("Error generating ideas:", error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to generate ideas" });
    }
  });

  app.post('/api/ai/proofread', isAuthenticated, async (req: any, res) => {
    try {
      const { proofreadPost } = await import("./ai");
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const result = await proofreadPost(content);
      res.json(result);
    } catch (error) {
      console.error("Error proofreading:", error);
      res.status(500).json({ message: "Failed to proofread content" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const userId = req.user?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error accessing object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Bookclub routes
  app.get('/api/bookclubs', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const bookclubs = await storage.getAllBookclubs(currentUserId);
      res.json(bookclubs);
    } catch (error) {
      console.error("Error fetching bookclubs:", error);
      res.status(500).json({ message: "Failed to fetch bookclubs" });
    }
  });

  app.get('/api/bookclubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const bookclubId = req.params.id;
      const currentUserId = req.user.claims.sub;
      const bookclub = await storage.getBookclub(bookclubId, currentUserId);
      
      if (!bookclub) {
        return res.status(404).json({ message: "Bookclub not found" });
      }
      
      res.json(bookclub);
    } catch (error) {
      console.error("Error fetching bookclub:", error);
      res.status(500).json({ message: "Failed to fetch bookclub" });
    }
  });

  app.post('/api/bookclubs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookclubData = insertBookclubSchema.parse(req.body);
      const bookclub = await storage.createBookclub(userId, bookclubData);
      res.json(bookclub);
    } catch (error: any) {
      console.error("Error creating bookclub:", error);
      res.status(400).json({ message: error.message || "Failed to create bookclub" });
    }
  });

  app.post('/api/bookclubs/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const bookclubId = req.params.id;
      const userId = req.user.claims.sub;
      await storage.joinBookclub(userId, bookclubId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error joining bookclub:", error);
      res.status(500).json({ message: "Failed to join bookclub" });
    }
  });

  app.delete('/api/bookclubs/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const bookclubId = req.params.id;
      const userId = req.user.claims.sub;
      
      const bookclub = await storage.getBookclub(bookclubId, userId);
      if (!bookclub) {
        return res.status(404).json({ message: "Bookclub not found" });
      }
      
      if (bookclub.creatorId === userId) {
        return res.status(403).json({ message: "Creators cannot leave their own bookclub. Delete it instead." });
      }
      
      await storage.leaveBookclub(userId, bookclubId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving bookclub:", error);
      res.status(500).json({ message: "Failed to leave bookclub" });
    }
  });

  app.delete('/api/bookclubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const bookclubId = req.params.id;
      const userId = req.user.claims.sub;
      const bookclub = await storage.getBookclub(bookclubId, userId);
      
      if (!bookclub) {
        return res.status(404).json({ message: "Bookclub not found" });
      }
      
      if (bookclub.creatorId !== userId) {
        return res.status(403).json({ message: "Only the creator can delete this bookclub" });
      }
      
      await storage.deleteBookclub(bookclubId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookclub:", error);
      res.status(500).json({ message: "Failed to delete bookclub" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      // Handle WebSocket messages
    });
    
    ws.on('close', () => {
      // Handle WebSocket disconnection
    });
  });

  function broadcastToAll(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  return httpServer;
}
