import {
  users,
  posts,
  follows,
  likes,
  reposts,
  comments,
  hashtags,
  postHashtags,
  bookclubs,
  bookclubMembers,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type PostWithAuthor,
  type CommentWithAuthor,
  type UserWithStats,
  type Bookclub,
  type InsertBookclub,
  type BookclubWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, ilike, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithStats(id: string, currentUserId?: string): Promise<UserWithStats | undefined>;
  updateUserAvatar(userId: string, avatarUrl: string): Promise<void>;
  
  // Post operations
  createPost(userId: string, post: InsertPost): Promise<Post>;
  getPost(id: string): Promise<Post | undefined>;
  getPostWithAuthor(id: string, currentUserId?: string): Promise<PostWithAuthor | undefined>;
  getAllPosts(currentUserId?: string): Promise<PostWithAuthor[]>;
  getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]>;
  deletePost(id: string): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Like operations
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  
  // Repost operations
  repostPost(userId: string, postId: string): Promise<void>;
  unrepostPost(userId: string, postId: string): Promise<void>;
  
  // Comment operations
  createComment(userId: string, comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<CommentWithAuthor[]>;
  deleteComment(id: string): Promise<void>;
  
  // Search operations
  searchUsers(query: string, limit?: number): Promise<User[]>;
  searchPosts(query: string, currentUserId?: string, limit?: number): Promise<PostWithAuthor[]>;
  
  // Hashtag operations
  extractAndSaveHashtags(postId: string, content: string): Promise<void>;
  getTrendingHashtags(limit?: number): Promise<{ name: string; count: number }[]>;
  getPostsByHashtag(hashtagName: string, currentUserId?: string): Promise<PostWithAuthor[]>;
  
  // Bookclub operations
  createBookclub(userId: string, bookclub: InsertBookclub): Promise<Bookclub>;
  getBookclub(id: string, currentUserId?: string): Promise<BookclubWithDetails | undefined>;
  getAllBookclubs(currentUserId?: string): Promise<BookclubWithDetails[]>;
  joinBookclub(userId: string, bookclubId: string): Promise<void>;
  leaveBookclub(userId: string, bookclubId: string): Promise<void>;
  getUserBookclubs(userId: string, currentUserId?: string): Promise<BookclubWithDetails[]>;
  deleteBookclub(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    await db.update(users).set({ profileImageUrl: avatarUrl }).where(eq(users.id, userId));
  }

  async getUserWithStats(id: string, currentUserId?: string): Promise<UserWithStats | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    const [postsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.userId, id));

    const [followingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, id));

    const [followersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, id));

    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      isFollowing = await this.isFollowing(currentUserId, id);
    }

    return {
      ...user,
      _count: {
        posts: postsCount.count || 0,
        following: followingCount.count || 0,
        followers: followersCount.count || 0,
      },
      isFollowing,
    };
  }

  // Post operations
  async createPost(userId: string, postData: InsertPost): Promise<Post> {
    const wordCount = postData.content.trim().split(/\s+/).filter(Boolean).length;
    
    const [post] = await db
      .insert(posts)
      .values({
        userId,
        content: postData.content,
        wordCount,
      })
      .returning();
    return post;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPostWithAuthor(id: string, currentUserId?: string): Promise<PostWithAuthor | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));

    if (!post) return undefined;

    const [author] = await db.select().from(users).where(eq(users.id, post.userId));
    
    const [likesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(eq(likes.postId, id));

    const [repostsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reposts)
      .where(eq(reposts.postId, id));

    const [commentsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(eq(comments.postId, id));

    let isLiked = false;
    let isReposted = false;
    if (currentUserId) {
      const [like] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.userId, currentUserId), eq(likes.postId, id)));
      isLiked = !!like;

      const [repost] = await db
        .select()
        .from(reposts)
        .where(and(eq(reposts.userId, currentUserId), eq(reposts.postId, id)));
      isReposted = !!repost;
    }

    return {
      ...post,
      author,
      _count: {
        likes: likesCount.count || 0,
        reposts: repostsCount.count || 0,
        comments: commentsCount.count || 0,
      },
      isLiked,
      isReposted,
    };
  }

  async getAllPosts(currentUserId?: string): Promise<PostWithAuthor[]> {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
    
    const postsWithAuthor = await Promise.all(
      allPosts.map(async (post) => {
        const result = await this.getPostWithAuthor(post.id, currentUserId);
        return result!;
      })
    );
    
    return postsWithAuthor.filter(Boolean);
  }

  async getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    const postsWithAuthor = await Promise.all(
      userPosts.map(async (post) => {
        const result = await this.getPostWithAuthor(post.id, currentUserId);
        return result!;
      })
    );
    
    return postsWithAuthor.filter(Boolean);
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  // Like operations
  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(likes).values({ userId, postId }).onConflictDoNothing();
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  }

  // Repost operations
  async repostPost(userId: string, postId: string): Promise<void> {
    await db.insert(reposts).values({ userId, postId }).onConflictDoNothing();
  }

  async unrepostPost(userId: string, postId: string): Promise<void> {
    await db
      .delete(reposts)
      .where(and(eq(reposts.userId, userId), eq(reposts.postId, postId)));
  }

  // Comment operations
  async createComment(userId: string, commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        userId,
        postId: commentData.postId,
        content: commentData.content,
      })
      .returning();
    return comment;
  }

  async getPostComments(postId: string): Promise<CommentWithAuthor[]> {
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    
    const commentsWithAuthor = await Promise.all(
      postComments.map(async (comment) => {
        const [author] = await db.select().from(users).where(eq(users.id, comment.userId));
        return {
          ...comment,
          author,
        };
      })
    );
    
    return commentsWithAuthor;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Search operations
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const searchPattern = `%${query}%`;
    const results = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.firstName, searchPattern),
          ilike(users.lastName, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .limit(limit);
    return results;
  }

  async searchPosts(query: string, currentUserId?: string, limit: number = 50): Promise<PostWithAuthor[]> {
    const searchPattern = `%${query}%`;
    const searchResults = await db
      .select()
      .from(posts)
      .where(ilike(posts.content, searchPattern))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    const postsWithAuthor = await Promise.all(
      searchResults.map(async (post) => {
        const [author] = await db.select().from(users).where(eq(users.id, post.userId));
        
        const [[likesCount], [repostsCount], [commentsCount], likedResults, repostedResults] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id)),
          db.select({ count: sql<number>`count(*)` }).from(reposts).where(eq(reposts.postId, post.id)),
          db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id)),
          currentUserId
            ? db.select().from(likes).where(and(eq(likes.postId, post.id), eq(likes.userId, currentUserId)))
            : Promise.resolve([]),
          currentUserId
            ? db.select().from(reposts).where(and(eq(reposts.postId, post.id), eq(reposts.userId, currentUserId)))
            : Promise.resolve([]),
        ]);

        return {
          ...post,
          author,
          _count: {
            likes: Number(likesCount?.count || 0),
            reposts: Number(repostsCount?.count || 0),
            comments: Number(commentsCount?.count || 0),
          },
          isLiked: likedResults.length > 0,
          isReposted: repostedResults.length > 0,
        };
      })
    );

    return postsWithAuthor;
  }

  // Hashtag operations
  async extractAndSaveHashtags(postId: string, content: string): Promise<void> {
    const hashtagRegex = /#(\w+)/g;
    const hashtagMatches = content.match(hashtagRegex);
    
    if (!hashtagMatches || hashtagMatches.length === 0) {
      return;
    }

    const uniqueHashtags = Array.from(new Set(hashtagMatches.map(tag => tag.slice(1).toLowerCase())));
    
    for (const tagName of uniqueHashtags) {
      const [hashtag] = await db
        .insert(hashtags)
        .values({ name: tagName })
        .onConflictDoNothing()
        .returning();
      
      const existingHashtag = hashtag || (await db.select().from(hashtags).where(eq(hashtags.name, tagName)))[0];
      
      if (existingHashtag) {
        await db
          .insert(postHashtags)
          .values({ postId, hashtagId: existingHashtag.id })
          .onConflictDoNothing();
      }
    }
  }

  async getTrendingHashtags(limit: number = 10): Promise<{ name: string; count: number }[]> {
    const trendingTags = await db
      .select({
        name: hashtags.name,
        count: sql<number>`count(${postHashtags.postId})::int`,
      })
      .from(hashtags)
      .leftJoin(postHashtags, eq(hashtags.id, postHashtags.hashtagId))
      .groupBy(hashtags.id, hashtags.name)
      .orderBy(desc(sql`count(${postHashtags.postId})`))
      .limit(limit);
    
    return trendingTags.filter(tag => tag.count > 0);
  }

  async getPostsByHashtag(hashtagName: string, currentUserId?: string): Promise<PostWithAuthor[]> {
    const [hashtag] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.name, hashtagName.toLowerCase()));
    
    if (!hashtag) {
      return [];
    }

    const postIds = await db
      .select({ postId: postHashtags.postId })
      .from(postHashtags)
      .where(eq(postHashtags.hashtagId, hashtag.id));

    if (postIds.length === 0) {
      return [];
    }

    const hashtagPosts = await db
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds.map(p => p.postId)))
      .orderBy(desc(posts.createdAt));

    const postsWithAuthor = await Promise.all(
      hashtagPosts.map(async (post) => {
        const [author] = await db.select().from(users).where(eq(users.id, post.userId));
        
        const [[likesCount], [repostsCount], [commentsCount], likedResults, repostedResults] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id)),
          db.select({ count: sql<number>`count(*)` }).from(reposts).where(eq(reposts.postId, post.id)),
          db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id)),
          currentUserId
            ? db.select().from(likes).where(and(eq(likes.postId, post.id), eq(likes.userId, currentUserId)))
            : Promise.resolve([]),
          currentUserId
            ? db.select().from(reposts).where(and(eq(reposts.postId, post.id), eq(reposts.userId, currentUserId)))
            : Promise.resolve([]),
        ]);

        return {
          ...post,
          author,
          _count: {
            likes: Number(likesCount?.count || 0),
            reposts: Number(repostsCount?.count || 0),
            comments: Number(commentsCount?.count || 0),
          },
          isLiked: likedResults.length > 0,
          isReposted: repostedResults.length > 0,
        };
      })
    );

    return postsWithAuthor;
  }

  // Bookclub operations
  async createBookclub(userId: string, bookclubData: InsertBookclub): Promise<Bookclub> {
    const [bookclub] = await db
      .insert(bookclubs)
      .values({
        ...bookclubData,
        creatorId: userId,
      })
      .returning();

    await db.insert(bookclubMembers).values({
      bookclubId: bookclub.id,
      userId: userId,
      role: "creator",
    });

    return bookclub;
  }

  async getBookclub(id: string, currentUserId?: string): Promise<BookclubWithDetails | undefined> {
    const [bookclub] = await db.select().from(bookclubs).where(eq(bookclubs.id, id));
    if (!bookclub) return undefined;

    const [creator] = await db.select().from(users).where(eq(users.id, bookclub.creatorId));
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookclubMembers)
      .where(eq(bookclubMembers.bookclubId, id));

    let isMember = false;
    if (currentUserId) {
      const [membership] = await db
        .select()
        .from(bookclubMembers)
        .where(and(eq(bookclubMembers.bookclubId, id), eq(bookclubMembers.userId, currentUserId)));
      isMember = !!membership;
    }

    return {
      ...bookclub,
      creator,
      _count: {
        members: memberCount.count || 0,
      },
      isMember,
      isCreator: currentUserId === bookclub.creatorId,
    };
  }

  async getAllBookclubs(currentUserId?: string): Promise<BookclubWithDetails[]> {
    const allBookclubs = await db.select().from(bookclubs).orderBy(desc(bookclubs.createdAt));

    const bookclubsWithDetails = await Promise.all(
      allBookclubs.map(async (bookclub) => {
        const [creator] = await db.select().from(users).where(eq(users.id, bookclub.creatorId));
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(bookclubMembers)
          .where(eq(bookclubMembers.bookclubId, bookclub.id));

        let isMember = false;
        if (currentUserId) {
          const [membership] = await db
            .select()
            .from(bookclubMembers)
            .where(and(eq(bookclubMembers.bookclubId, bookclub.id), eq(bookclubMembers.userId, currentUserId)));
          isMember = !!membership;
        }

        return {
          ...bookclub,
          creator,
          _count: {
            members: memberCount.count || 0,
          },
          isMember,
          isCreator: currentUserId === bookclub.creatorId,
        };
      })
    );

    return bookclubsWithDetails;
  }

  async joinBookclub(userId: string, bookclubId: string): Promise<void> {
    await db.insert(bookclubMembers).values({
      bookclubId,
      userId,
      role: "member",
    }).onConflictDoNothing();
  }

  async leaveBookclub(userId: string, bookclubId: string): Promise<void> {
    await db
      .delete(bookclubMembers)
      .where(and(eq(bookclubMembers.bookclubId, bookclubId), eq(bookclubMembers.userId, userId)));
  }

  async getUserBookclubs(userId: string, currentUserId?: string): Promise<BookclubWithDetails[]> {
    const memberships = await db
      .select({ bookclubId: bookclubMembers.bookclubId })
      .from(bookclubMembers)
      .where(eq(bookclubMembers.userId, userId));

    if (memberships.length === 0) {
      return [];
    }

    const userBookclubs = await db
      .select()
      .from(bookclubs)
      .where(inArray(bookclubs.id, memberships.map(m => m.bookclubId)))
      .orderBy(desc(bookclubs.createdAt));

    const bookclubsWithDetails = await Promise.all(
      userBookclubs.map(async (bookclub) => {
        const [creator] = await db.select().from(users).where(eq(users.id, bookclub.creatorId));
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(bookclubMembers)
          .where(eq(bookclubMembers.bookclubId, bookclub.id));

        let isMember = false;
        if (currentUserId) {
          const [membership] = await db
            .select()
            .from(bookclubMembers)
            .where(and(eq(bookclubMembers.bookclubId, bookclub.id), eq(bookclubMembers.userId, currentUserId)));
          isMember = !!membership;
        }

        return {
          ...bookclub,
          creator,
          _count: {
            members: memberCount.count || 0,
          },
          isMember,
          isCreator: currentUserId === bookclub.creatorId,
        };
      })
    );

    return bookclubsWithDetails;
  }

  async deleteBookclub(id: string): Promise<void> {
    await db.delete(bookclubs).where(eq(bookclubs.id, id));
  }
}

export const storage = new DatabaseStorage();
