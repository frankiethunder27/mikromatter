import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  reposts: many(reposts),
  following: many(follows, { relationName: "following" }),
  followers: many(follows, { relationName: "followers" }),
  createdBookclubs: many(bookclubs),
  bookclubMemberships: many(bookclubMembers),
}));

// Posts table
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  wordCount: integer("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  reposts: many(reposts),
  postHashtags: many(postHashtags),
}));

// Hashtags table
export const hashtags = pgTable("hashtags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hashtagsRelations = relations(hashtags, ({ many }) => ({
  postHashtags: many(postHashtags),
}));

// Post Hashtags junction table
export const postHashtags = pgTable("post_hashtags", {
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  hashtagId: varchar("hashtag_id").notNull().references(() => hashtags.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.hashtagId] }),
}));

export const postHashtagsRelations = relations(postHashtags, ({ one }) => ({
  post: one(posts, {
    fields: [postHashtags.postId],
    references: [posts.id],
  }),
  hashtag: one(hashtags, {
    fields: [postHashtags.hashtagId],
    references: [hashtags.id],
  }),
}));

// Follows table
export const follows = pgTable("follows", {
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers",
  }),
}));

// Likes table
export const likes = pgTable("likes", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

// Reposts table
export const reposts = pgTable("reposts", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }),
}));

export const repostsRelations = relations(reposts, ({ one }) => ({
  user: one(users, {
    fields: [reposts.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [reposts.postId],
    references: [posts.id],
  }),
}));

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

// Bookclubs table - focused on indie authors
export const bookclubs = pgTable("bookclubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentBook: varchar("current_book").notNull(),
  currentAuthor: varchar("current_author").notNull(),
  authorWebsite: varchar("author_website"),
  bookCoverUrl: varchar("book_cover_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookclubsRelations = relations(bookclubs, ({ one, many }) => ({
  creator: one(users, {
    fields: [bookclubs.creatorId],
    references: [users.id],
  }),
  members: many(bookclubMembers),
}));

// Bookclub Members junction table
export const bookclubMembers = pgTable("bookclub_members", {
  bookclubId: varchar("bookclub_id").notNull().references(() => bookclubs.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.bookclubId, table.userId] }),
}));

export const bookclubMembersRelations = relations(bookclubMembers, ({ one }) => ({
  bookclub: one(bookclubs, {
    fields: [bookclubMembers.bookclubId],
    references: [bookclubs.id],
  }),
  user: one(users, {
    fields: [bookclubMembers.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  userId: true,
  wordCount: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Post cannot be empty").max(6000, "Post exceeds 1000 word limit"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type Follow = typeof follows.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Repost = typeof reposts.$inferSelect;

// Extended types with relations for frontend use
export type PostWithAuthor = Post & {
  author: User;
  _count: {
    likes: number;
    reposts: number;
    comments: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type UserWithStats = User & {
  _count: {
    posts: number;
    following: number;
    followers: number;
  };
  isFollowing?: boolean;
};

// Bookclub schemas and types
export const insertBookclubSchema = createInsertSchema(bookclubs).omit({
  id: true,
  creatorId: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Bookclub name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  currentBook: z.string().min(1, "Current book title is required").max(200),
  currentAuthor: z.string().min(1, "Author name is required").max(100),
  authorWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bookCoverUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type InsertBookclub = z.infer<typeof insertBookclubSchema>;
export type Bookclub = typeof bookclubs.$inferSelect;
export type BookclubMember = typeof bookclubMembers.$inferSelect;

export type BookclubWithDetails = Bookclub & {
  creator: User;
  _count: {
    members: number;
  };
  isMember?: boolean;
  isCreator?: boolean;
};
