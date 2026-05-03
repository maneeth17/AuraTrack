import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    xp?: number;
    level?: number;
  }
  
  interface Session {
    user: {
      id?: string;
      xp?: number;
      level?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    xp?: number;
    level?: number;
  }
}
