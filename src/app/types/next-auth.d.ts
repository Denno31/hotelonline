import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: 'ADMIN' | 'STAFF'
  }
  
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: 'ADMIN' | 'STAFF'
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: 'ADMIN' | 'STAFF'
  }
}
