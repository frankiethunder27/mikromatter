import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate required environment variables
function validateAuthConfig() {
  const requiredVars = ["SESSION_SECRET", "DATABASE_URL", "APP_URL"];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Check for at least one OAuth provider
  const hasGitHub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

  if (!hasGitHub && !hasGoogle) {
    throw new Error(
      "At least one OAuth provider must be configured. Set GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET or GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET"
    );
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export async function setupAuth(app: Express) {
  validateAuthConfig();

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const appUrl = process.env.APP_URL!.replace(/\/$/, ""); // Remove trailing slash

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${appUrl}/api/auth/github/callback`,
          scope: ["user:email"],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const email = profile.emails?.[0]?.value || `${profile.id}@github.local`;
            const nameParts = (profile.displayName || profile.username || "").split(" ");

            const user = await storage.upsertUser({
              id: `github_${profile.id}`,
              email,
              firstName: nameParts[0] || profile.username || "User",
              lastName: nameParts.slice(1).join(" ") || "",
              profileImageUrl: profile.photos?.[0]?.value || null,
            });

            done(null, { id: user.id, provider: "github" });
          } catch (error) {
            done(error);
          }
        }
      )
    );
    console.log("✓ GitHub OAuth configured");
  }

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${appUrl}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const email = profile.emails?.[0]?.value || `${profile.id}@google.local`;

            const user = await storage.upsertUser({
              id: `google_${profile.id}`,
              email,
              firstName: profile.name?.givenName || "User",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value || null,
            });

            done(null, { id: user.id, provider: "google" });
          } catch (error) {
            done(error);
          }
        }
      )
    );
    console.log("✓ Google OAuth configured");
  }

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? { id: user.id, claims: { sub: user.id } } : null);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes - GitHub
  if (process.env.GITHUB_CLIENT_ID) {
    app.get("/api/auth/github", passport.authenticate("github"));

    app.get(
      "/api/auth/github/callback",
      passport.authenticate("github", { failureRedirect: "/?error=auth_failed" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  }

  // Auth routes - Google
  if (process.env.GOOGLE_CLIENT_ID) {
    app.get("/api/auth/google", passport.authenticate("google"));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
      (req, res) => {
        res.redirect("/");
      }
    );
  }

  // Generic login route - redirects to available provider
  app.get("/api/login", (req, res) => {
    if (process.env.GITHUB_CLIENT_ID) {
      res.redirect("/api/auth/github");
    } else if (process.env.GOOGLE_CLIENT_ID) {
      res.redirect("/api/auth/google");
    } else {
      res.status(500).json({ message: "No OAuth provider configured" });
    }
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  // Get available auth providers
  app.get("/api/auth/providers", (req, res) => {
    const providers = [];
    if (process.env.GITHUB_CLIENT_ID) providers.push("github");
    if (process.env.GOOGLE_CLIENT_ID) providers.push("google");
    res.json({ providers });
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    // Ensure user object has the expected structure
    const user = req.user as any;
    if (!user.claims) {
      user.claims = { sub: user.id };
    }
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

